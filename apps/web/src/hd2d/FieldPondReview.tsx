import { farmPlace, homesteadShown, placeWordsOf, type FarmSave, type StoryPack } from '@farm/domain'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router'
import { placeLink } from '../loop/farm-map'
import { countsWords } from '../loop/farm-view'
import { houseLot } from '../loop/homestead-map'
import { useTalents } from '../loop/talents'
import { FieldPondRenderer, type Graphics, type PhoneRun, type Projections } from './field-pond-renderer'
import { fieldPondState, visibleHands, type BandPlace } from './field-pond-state'

export interface FieldPondReviewProps {
  save: FarmSave
  story: StoryPack | null
  covered: boolean
  onReady(): void
  onUnavailable(): void
  onClose(): void
  hop: { replace?: boolean; state: unknown }
}

const LINKS = ['fields', 'forest', 'fishery', 'bin'] as const
const CHIP = 'inline-flex min-h-11 items-center gap-1 rounded-full border border-white/20 bg-[#152323]/95 text-[12px] font-semibold text-white shadow-2'

export default function FieldPondReview({ save, story, covered, onReady, onUnavailable, onClose, hop }: FieldPondReviewProps) {
  const { of } = useTalents()
  const view = useMemo(() => fieldPondState(save, story, of), [save, story, of])
  const live = useRef(view)
  live.current = view
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<FieldPondRenderer | null>(null)
  const drag = useRef<{ id: number; x: number } | null>(null)
  const [projections, setProjections] = useState<Projections | null>(null)
  const [compact, setCompact] = useState(false)
  const [graphics, setGraphics] = useState<Graphics>('saver')
  const [run, setRun] = useState<PhoneRun | null>(null)

  useEffect(() => {
    const node = canvas.current
    if (!node) return
    let stage: FieldPondRenderer
    const layout = () => {
      setProjections(stage.layout())
      setCompact(node.clientWidth < 480 || node.clientHeight < 240)
    }
    try {
      stage = new FieldPondRenderer(node, live.current, setRun)
      renderer.current = stage
      layout()
    } catch {
      renderer.current?.dispose()
      renderer.current = null
      onUnavailable()
      return
    }
    const lost = (event: Event) => {
      event.preventDefault()
      stage.active(false)
      onUnavailable()
    }
    const resize = new ResizeObserver(() => {
      if (!node.clientWidth || !node.clientHeight) return
      try { layout() } catch { onUnavailable() }
    })
    resize.observe(node)
    node.addEventListener('webglcontextlost', lost)
    onReady()
    return () => {
      node.removeEventListener('webglcontextlost', lost)
      resize.disconnect()
      renderer.current = null
      stage.dispose()
    }
  }, [onReady, onUnavailable])

  useEffect(() => {
    try { renderer.current?.update(view) } catch { onUnavailable() }
  }, [view, onUnavailable])

  useEffect(() => {
    try { renderer.current?.graphics(graphics) } catch { onUnavailable() }
  }, [graphics, onUnavailable])

  useEffect(() => {
    const reflect = () => renderer.current?.active(!covered && !document.hidden)
    document.addEventListener('visibilitychange', reflect)
    reflect()
    return () => document.removeEventListener('visibilitychange', reflect)
  }, [covered])

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drag.current?.id !== event.pointerId) return
    const delta = (drag.current.x - event.clientX) * 0.055
    drag.current.x = event.clientX
    try {
      const next = renderer.current?.move(delta)
      if (next) setProjections(next)
    } catch { onUnavailable() }
  }

  const home = houseLot(save, homesteadShown(save).find((house) => house.n === 0)!)
  const labels = countsWords(view.counts)
  const links = [
    ...LINKS.map((id) => {
      const humans = view.crew[id].length
      const { name } = placeWordsOf(story, id)
      const detail = id === 'fields' ? [view.plots > 1 ? `${view.plots} plots` : '', ...labels].filter(Boolean).join(' · ') : ''
      return {
        id, name, to: placeLink(save, farmPlace(id)!),
        label: [name, detail, humans ? `${humans} ${view.lastNight ? 'worked last night' : 'working'}` : null].filter(Boolean).join(', '),
        detail, humans,
      }
    }),
    { id: 'farmhouse' as const, name: home.name, to: home.to, label: home.label, detail: '', humans: 0 },
  ]

  const position = (id: BandPlace) => {
    const spot = projections?.[id]
    return spot ? { left: `${spot.x}%`, top: `${spot.y}%` } : undefined
  }
  const workers = Object.values(view.crew).reduce((total, crew) => total + crew.length, 0)

  return (
    <section className="absolute inset-0 overflow-hidden bg-[#394b45]" aria-label="Field and Pond" data-field-pond
      data-season={view.season} data-light={view.dusk ? 'dusk' : 'morning'} data-hands={workers}
      data-visible-hands={visibleHands(view).length} data-work={view.lastNight ? 'report' : 'forecast'}>
      <canvas
        ref={canvas} className="absolute inset-0 h-full w-full touch-none"
        aria-label="Three-dimensional view of the woods, field, pond, shipping yard and farmhouse"
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return
          drag.current = { id: event.pointerId, x: event.clientX }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={move} onLostPointerCapture={() => { drag.current = null }}
      />
      <div className="absolute inset-x-2 top-1 flex flex-wrap items-start gap-1" aria-label="Field and Pond options">
        <button type="button" onClick={onClose} className={`${CHIP} px-3`}>All farm places</button>
        <button type="button" onClick={() => setGraphics((mode) => mode === 'saver' ? 'standard' : 'saver')}
          className={`${CHIP} px-3`} aria-label={`Graphics: ${graphics}`} data-quality={graphics}>{graphics === 'saver' ? 'Saver' : 'Standard'}</button>
        <button type="button" onClick={() => renderer.current?.toggleRun()} className={`${CHIP} px-3`} data-phone-run>
          {run?.running ? 'Stop test' : 'Phone test'}
        </button>
        {run && (
          <output className="rounded-xl bg-[#152323]/95 px-2 py-1 text-[11px] text-white" data-frame-report>
            {run.seconds}s · {run.fps} FPS · {run.msP95} ms p95 · {run.calls} draws · {run.memory} MiB estimated
          </output>
        )}
      </div>
      {projections && (
        <div className={compact ? 'absolute inset-x-1 bottom-1 grid grid-cols-3 gap-1' : 'pointer-events-none absolute inset-0'} data-band-targets={compact ? 'compact' : 'map'}>
          {links.map(({ id, name, to, label, detail, humans }) => (
            <Link key={id} to={to} {...hop} aria-label={label} style={compact ? undefined : position(id)}
              data-place={id} data-workers={humans || undefined}
              className={`${compact ? 'min-w-0 px-2' : 'pointer-events-auto absolute max-w-[30%] -translate-x-1/2 -translate-y-1/2 px-3'} ${CHIP}`}>
              <span className="min-w-0">
                <span className="block truncate">{name}{humans ? ` · ${humans}` : ''}</span>
                {detail && <span className="block truncate text-[10px] text-white/85" data-field-counts>{detail}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
