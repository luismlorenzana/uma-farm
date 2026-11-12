// Home on the shared HD-2D stage (F11; hd2d-farm FR3–FR8, FR13, FR14; kit-farm KF2–KF14): the farm as uma-stage's band
// stage draws it, portrait and 9 tiles across, between uma-kit's bars (FR7). The save is the design (`farmDesign`, decision
// 2); the kit is the stand-in until F9's `kit-farm` ships (KF14). Names, locks, Ready badges and pips are uma-kit's, the
// same models the Hub's place links carry, as overlays projected from each plot (decision 4); a tap opens what the Hub's
// place opens, a long-press its quick look (decision 5); the season is the light (decision 6); a place's open sheet fades
// the roofs in front of its slots (decision 7); Home opens on the first Ready place's band and keeps its scroll this
// session (decision 8). One canvas engine: the Hub's Phaser scene never loads here (FR4). Battery (FR13, decision 9): saver
// on, the loop stops once the camera rests and nothing eases, and while the app or Home is hidden. Loaded on demand, with
// three.js, only when the preview switch is on (decision 1).
import { dateOf, farmDesign, farmPlots, type FarmPlot, type FarmSave } from '@farm/domain'
import { ArchPips, type HubMapPlace } from '@luismlorenzana/uma-kit/hub'
import { LockedIcon } from '@luismlorenzana/uma-kit/ui'
import { BandStage, capture, type FarmDesign } from '@luismlorenzana/uma-stage'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { romanceOn } from '../app/romance'
import {
  bandCentre, FARM_KIT_NAME, fadeMarkers, farmKit, groundTile, LONG_PRESS_MS, overlayBox, peekLink, rememberCentre, rememberedCentre, SEASON_EASE_MS, SEASON_GRADES, startPlot,
  tapTarget,
} from './farm-stage'

export interface FarmStageProps {
  save: FarmSave
  /** The Hub's place models (FarmMap's): names, links, locks, Ready badges and pips, the homestead's on v4. */
  places: readonly HubMapPlace[]
  /** The place whose sheet or quick look is open: the fade shows its slots. */
  open: string | null
  /** A full-screen sheet or scene covers Home: the stage stops. */
  paused: boolean
  reducedMotion: boolean
}

/** A plot's overlay box in CSS px: its size, and how far below its foot the name pill hangs. */
interface Box { w: number; h: number; apron: number }
/** How long the loop keeps drawing after anything moves, in ms, before it rests if the camera has settled. */
const AWAKE_MS = 700
const TAP_SLOP = 8

let kit: ReturnType<typeof farmKit> | null = null
/** The kit, drawn once a session. */
const stageKit = () => (kit ??= farmKit())

export default function FarmStage({ save, places, open, paused, reducedMotion }: FarmStageProps) {
  const navigate = useNavigate()
  const homestead = romanceOn()
  const design = useMemo(() => farmDesign(save, { homestead }), [save, homestead])
  const plots = useMemo(() => farmPlots(save, { homestead }), [save, homestead])
  const world = useMemo(() => JSON.stringify(design), [design])
  const season = dateOf(save.calendar.day).season
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<BandStage | null>(null)
  const chips = useRef(new Map<string, HTMLDivElement>())
  const anchors = useRef(new Map<string, ReturnType<typeof overlayBox>>())
  const loop = useRef({ until: 0, running: false, raf: 0, lastCentre: Number.NaN, lastSize: '', pointer: false, hidden: false, paused: false })
  const press = useRef<{ x: number; y: number; timer: number; long: boolean } | null>(null)
  const latest = useRef({ plots, places, design })
  latest.current = { plots, places, design }
  /** This stage has its world (so a new design keeps the camera) and its season (so a new one eases); reset with each stage. */
  const built = useRef(false)
  const graded = useRef(false)
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const boxesNow = useRef(boxes)
  boxesNow.current = boxes
  const [error, setError] = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)

  /** Places every chip on its plot for the camera now, hiding those off screen. */
  const placeChips = () => {
    const s = stage.current
    if (!s) return
    const height = s.view.height
    for (const [id, el] of chips.current) {
      const a = anchors.current.get(id)
      if (!a) continue
      const left = s.project(a.left), top = s.project(a.top)
      const bottom = left.y + (boxesNow.current[id]?.apron ?? 0) + 24
      el.style.transform = `translate(${Math.round(left.x)}px, ${Math.round(top.y)}px)`
      el.style.visibility = bottom < 0 || top.y > height ? 'hidden' : 'visible'
    }
  }

  /** Measures every plot's overlay box (after a resize or a new world): its size never changes as the camera pans. */
  const measure = () => {
    const s = stage.current
    if (!s) return
    const { plots: all, design: d } = latest.current
    const next: Record<string, Box> = {}
    anchors.current.clear()
    for (const plot of all) {
      if (plot.kind === 'open') continue
      const a = overlayBox(plot, d.buildings.find((b) => b.id === plot.id))
      anchors.current.set(plot.id, a)
      const l = s.project(a.left), r = s.project(a.right), t = s.project(a.top), front = s.project({ ...a.left, z: a.left.z + 1 })
      next[plot.id] = { w: Math.round(r.x - l.x), h: Math.round(l.y - t.y), apron: Math.round(front.y - l.y) }
    }
    setBoxes(next)
    loop.current.lastCentre = Number.NaN
  }

  /** Keeps the loop drawing for a while: a touch, a resize, a new world, a fade or a season easing. */
  const wake = (ms = AWAKE_MS) => {
    const s = stage.current, l = loop.current
    if (!s) return
    l.until = Math.max(l.until, performance.now() + ms)
    if (l.running || l.hidden || l.paused) return
    l.running = true
    s.start()
    const tick = (now: number) => {
      const c = s.bandCamera.centre, size = `${s.view.width}x${s.view.height}`
      if (c !== l.lastCentre || size !== l.lastSize) { l.lastCentre = c; l.lastSize = size; placeChips() }
      if (now > l.until && !l.pointer && s.bandCamera.settled) { sleep(); return }
      l.raf = requestAnimationFrame(tick)
    }
    l.raf = requestAnimationFrame(tick)
  }
  const sleep = () => {
    const l = loop.current
    cancelAnimationFrame(l.raf)
    l.running = false
    stage.current?.stop()
    // The frame the camera came to rest on, which saver's pacing may have skipped.
    stage.current?.step(0)
  }

  // The stage: made once, sized to Home's page between the bars, disposed when Home goes (its scroll kept).
  useEffect(() => {
    const el = canvas.current!, frame = box.current!
    const s = new BandStage(el, { saver: true, fit: 'width', fade: { markers: [] }, onFirstFrame: () => setDrawn(true) })
    stage.current = s
    built.current = false
    graded.current = false
    const size = () => {
      const r = frame.getBoundingClientRect()
      s.resize(r.width, r.height, window.devicePixelRatio || 1)
    }
    size()
    // A new size: the view's depth changes, so the camera settles on a band again.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { size(); s.scrollTo(s.bandCamera.centre, true); measure(); wake() })
    observer?.observe(frame)
    const visibility = () => {
      loop.current.hidden = document.visibilityState === 'hidden'
      if (loop.current.hidden) sleep()
      else wake()
    }
    document.addEventListener('visibilitychange', visibility)
    if (import.meta.env.DEV) (window as unknown as { __farmStage?: unknown }).__farmStage = { stage: s, kit: FARM_KIT_NAME, get design() { return latest.current.design }, get plots() { return latest.current.plots } }
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      observer?.disconnect()
      sleep()
      rememberCentre(s.bandCamera.centre)
      s.dispose()
      stage.current = null
    }
  }, [])

  // The world: rebuilt when the design changes (a place opens, a crop grows), the camera kept where it was.
  useEffect(() => {
    const s = stage.current
    if (!s) return
    const centre = s.bandCamera.centre
    try {
      s.setWorld(JSON.parse(world) as FarmDesign, stageKit())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The farm can’t be drawn.')
      return
    }
    s.setFadeMarkers(fadeMarkers(open))
    const half = s.bandCamera.centre - s.bandCamera.top
    if (built.current) s.scrollTo(centre, true)
    else {
      const start = rememberedCentre() ?? (() => { const plot = startPlot(plots, places); return plot ? bandCentre(plot, half) : null })()
      if (start !== null) s.scrollTo(start, true)
      built.current = true
    }
    measure()
    wake()
  }, [world])

  // The season's light: at once on load, eased over a second when a morning brings the next (decision 6).
  useEffect(() => {
    const s = stage.current
    if (!s) return
    s.setGrade(SEASON_GRADES[season], graded.current && !reducedMotion ? SEASON_EASE_MS : 0)
    graded.current = true
    wake(SEASON_EASE_MS + AWAKE_MS)
  }, [season])

  // The fade (decision 7): nothing at rest; the open place's slots while its sheet is up.
  useEffect(() => {
    stage.current?.setFadeMarkers(fadeMarkers(open))
    wake(AWAKE_MS)
  }, [open])

  // A full-screen sheet or scene over Home: the stage rests until it closes.
  useEffect(() => {
    loop.current.paused = paused
    if (paused) sleep()
    else wake()
  }, [paused])

  // The chips follow the camera; React only re-renders them when a model or a box changes.
  useEffect(() => { loop.current.lastCentre = Number.NaN; placeChips() })

  const point = (e: ReactPointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = stage.current
    if (!s) return
    capture(e.currentTarget, e.pointerId)
    const p = point(e)
    s.pointerDown(p.x, p.y)
    loop.current.pointer = true
    wake()
    const held = { x: p.x, y: p.y, long: false, timer: 0 }
    held.timer = window.setTimeout(() => {
      const target = tapTarget(s.pick(held.x, held.y), groundTile(s.view, held.x, held.y), latest.current.plots, latest.current.places)
      if (!target) return
      held.long = true
      s.pointerCancel()
      void navigate(peekLink(target.id, target.to), { state: { back: true } })
    }, LONG_PRESS_MS)
    press.current = held
  }
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = stage.current, held = press.current
    if (!s || !held || held.long) return
    const p = point(e)
    if (Math.hypot(p.x - held.x, p.y - held.y) > TAP_SLOP) window.clearTimeout(held.timer)
    s.pointerMove(p.x, p.y)
    wake()
  }
  const onUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = stage.current, held = press.current
    press.current = null
    loop.current.pointer = false
    if (!s || !held) return
    window.clearTimeout(held.timer)
    wake()
    if (held.long) return
    const p = point(e)
    const hits = s.pointerUp(p.x, p.y)
    if (hits === null) return
    const target = tapTarget(hits, groundTile(s.view, p.x, p.y), latest.current.plots, latest.current.places)
    if (target) void navigate(target.to, { state: { back: true } })
  }
  const onCancel = () => {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
    loop.current.pointer = false
    stage.current?.pointerCancel()
    wake()
  }

  const byId = new Map(places.map((p) => [p.id, p]))
  return (
    <div ref={box} className="absolute inset-0 overflow-hidden" data-farm-stage={drawn ? 'drawn' : 'loading'} data-kit-name={FARM_KIT_NAME}>
      <canvas ref={canvas} className="absolute inset-0 block size-full" style={{ touchAction: 'none' }} aria-hidden
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(e) => e.preventDefault()} />
      <div className="pointer-events-none absolute inset-0" aria-hidden data-stage-overlays>
        {plots.map((plot) => {
          const place = byId.get(plot.id), size = boxes[plot.id]
          if (!place || !size) return null
          return <PlaceChip key={plot.id} plot={plot} place={place} box={size} onRef={(el) => { if (el) chips.current.set(plot.id, el); else chips.current.delete(plot.id) }} />
        })}
      </div>
      {/* The Hub's place links, for VoiceOver and the quick look's focus return: the canvas answers taps. */}
      <nav aria-label="Farm map" className="sr-only">
        {plots.map((plot) => {
          const place = byId.get(plot.id)
          return place ? <Link key={plot.id} to={place.to} state={{ back: true }} data-place={place.id} aria-label={place.label}>{place.name}</Link> : null
        })}
      </nav>
      {error && <p role="alert" className="absolute inset-x-4 top-4 rounded-md bg-panel p-3 text-[13px] text-danger shadow-2">{error}</p>}
    </div>
  )
}

/** A place's chip over the stage (decision 4), as the Hub draws its place link: its pips in a half arch over its plot, the
 * Ready badge at its foot, and its name pill under the apron, a locked one's lock in the pill (the stage's roofs rise over
 * the band above, so a lock at the box's corner would read as that band's). */
function PlaceChip({ plot, place, box, onRef }: { plot: FarmPlot; place: HubMapPlace; box: Box; onRef: (el: HTMLDivElement | null) => void }) {
  const pips = place.pips !== undefined && place.pips.length > 0 ? place.pips : null
  return (
    <div ref={onRef} className="absolute top-0 left-0" style={{ width: box.w, visibility: 'hidden' }} data-stage-place={plot.id} data-locked={place.locked || undefined}>
      <div className="relative" style={{ width: box.w, height: box.h }}>
        {pips && <ArchPips pips={pips} more={place.more} w={box.w} h={box.h} />}
        {place.ready !== undefined && (
          <span data-ready-badge className="font-display absolute bottom-0.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-success px-1.5 text-[10px] leading-4 font-bold text-ink-on-dark shadow-2">
            {place.ready}
          </span>
        )}
      </div>
      <div className="flex justify-center" style={{ marginTop: box.apron - 2 }}>
        <span className="flex max-w-full items-center gap-0.5 rounded-full border border-hairline bg-panel/95 px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-ink shadow-2" data-stage-name>
          {place.locked && <span className="-ml-0.5 shrink-0 text-locked" data-stage-lock><LockedIcon size={14} /></span>}
          <span className={`block truncate ${place.locked ? 'text-ink-faint' : ''}`}>{place.name}</span>
        </span>
      </div>
    </div>
  )
}
