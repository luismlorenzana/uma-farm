import { currentDatePeriod, dateOf, type FarmSave } from '@farm/domain'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Avatar } from '../dialogue/Avatar'
import { acquireWalkingArt, type WalkingArt } from '../hd2d/character-art'
import { buildPlot, mountRegion, type ScenePoint } from './farm-region-stage'
import { pixelBillboard } from './pixel-billboard'
import { PLOT_CAMERA } from './travel-camera'

const workerX = (index: number) => (index - 1) * 1.73
const WORK_LANE = -2.78

export interface PlotWorker { id: string; name: string; detail: string; planned?: boolean | undefined }

export default function PlotDepth({ save, plot, className, fallback, children, crew, open }: {
  save: FarmSave; plot: number; className: string; fallback: ReactNode
  children(points: ReadonlyMap<string, ScenePoint>): ReactNode
  crew: readonly PlotWorker[]; open(id: string): void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const current = useRef(save)
  current.current = save
  const [points, setPoints] = useState<ReadonlyMap<string, ScenePoint> | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(new Set())
  const crewIds = JSON.stringify(crew.map(({ id }) => id))
  const tiles = save.fields.plots[plot]?.tiles
  const season = dateOf(save.calendar.day, save.calendar).season
  const night = currentDatePeriod(save) === null
  useEffect(() => {
    const node = canvas.current
    if (!node || !tiles) return
    setDrawn(new Set())
    const ids = JSON.parse(crewIds) as string[]
    const plotLayout = buildPlot(current.current, plot, night)
    const anchors = new Map(plotLayout.anchors)
    ids.forEach((id, i) => anchors.set('worker:' + id, [workerX(i), .04, WORK_LANE]))
    const layout = { ...plotLayout, anchors }
    let stage: ReturnType<typeof mountRegion>
    try { stage = mountRegion(node, layout) }
    catch { layout.scene.dispose(); setFailed(true); return }
    let lost = false
    let disposed = false
    const sprites = new Map<string, { figure: ReturnType<typeof pixelBillboard>; art: WalkingArt['sprite'] }>()
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = performance.now()
    const draw = () => {
      if (lost || document.hidden || !node.clientWidth || !node.clientHeight) return
      try { setPoints(stage.project(PLOT_CAMERA)) }
      catch { setFailed(true) }
    }
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      setFailed(true)
    }
    const onRestored = () => { setFailed(false); setPoints(null); setRetry(value => value + 1) }
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw)
    resize?.observe(node)
    node.addEventListener('webglcontextlost', onLost)
    node.addEventListener('webglcontextrestored', onRestored)
    document.addEventListener('visibilitychange', draw)
    window.addEventListener('resize', draw)
    const leases = ids.map((id, i) => {
      const lease = acquireWalkingArt(id, 'farm-work')
      void lease.ready.then(art => {
        if (!art || disposed) return
        const { cell, page, foot, standing } = art.sprite
        const figure = pixelBillboard(art.image, cell, page, foot, 1.15, night)
        figure.frame(standing.front)
        figure.sprite.position.set(workerX(i), .04, WORK_LANE)
        sprites.set(id, { figure, art: art.sprite })
        layout.scene.root.add(figure.sprite)
        setDrawn(previous => new Set(previous).add(id))
        draw()
      }).catch(() => undefined)
      return lease
    })
    const animate = () => {
      if (lost || document.hidden || !sprites.size) return
      const seconds = (performance.now() - start) * .001
      ids.forEach((id, index) => {
        const worker = sprites.get(id)
        if (!worker) return
        const { figure, art } = worker
        const phase = (seconds + index * 1.47) % 5
        const moving = !motion.matches && phase < 3
        const turn = phase / 3 * Math.PI * 2
        const facing = moving ? Math.cos(turn) > 0 ? 'right' : 'left' : 'front'
        const frames = art.walking[facing]
        const frame = moving ? frames[Math.floor(phase * 8) % frames.length] : undefined
        figure.frame(frame ?? art.standing[facing])
        figure.sprite.position.x = workerX(index) + (moving ? Math.sin(turn) * .17 : 0)
      })
      stage.redraw()
    }
    const timer = ids.length ? window.setInterval(() => { if (!motion.matches) animate() }, 125) : undefined
    motion.addEventListener('change', animate)
    draw()
    return () => {
      disposed = true
      window.clearInterval(timer)
      motion.removeEventListener('change', animate)
      for (const lease of leases) lease.release()
      for (const { figure } of sprites.values()) figure.dispose()
      resize?.disconnect()
      document.removeEventListener('visibilitychange', draw)
      window.removeEventListener('resize', draw)
      node.removeEventListener('webglcontextlost', onLost)
      node.removeEventListener('webglcontextrestored', onRestored)
      stage.dispose()
    }
  }, [plot, tiles, season, night, retry, crewIds])
  const ready = points && !failed
  return <>
    <div className={className} data-plot-depth={ready ? 'ready' : failed ? 'unavailable' : 'loading'} hidden={!ready && failed}>
      <canvas className="absolute inset-0 size-full" ref={canvas} aria-hidden />
      {ready && children(points)}
      {ready && crew.map(({ id, name, detail, planned }) => {
        const mark = points.get('worker:' + id)
        if (!mark) return null
        return <button key={id} type="button" title={detail + (planned ? ' (planned)' : '')} aria-label={'Talk to ' + name}
          data-plot-worker={id} data-modeled-sprite={drawn.has(id) || undefined}
          className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-full items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-white"
          style={{ left: mark.x * 100 + '%', top: mark.y * 100 + '%' }} onClick={() => open(id)}>
          {!drawn.has(id) && <Avatar id={id} size={30} label={name} />}
        </button>
      })}
    </div>
    {!ready && fallback}
  </>
}
