// Home on the shared HD-2D stage: the farm as uma-stage's band stage draws
// it, portrait and 9 tiles across, between uma-kit's bars. The save is the design (`farmDesign`); the
// kit is uma-art's `kit-farm` with the stand-in's frames for what it lacks (`farm-kit.ts`), the stand-in alone
// while its page is slow or if it fails. Names, locks, Ready badges and pips are uma-kit's, the same models the Hub's place
// links carry, as overlays projected from each plot; a tap opens what the Hub's place opens, a long-press
// its quick look; the season is the light; a place's open sheet fades the roofs in front
// of its slots; Home opens on the first Ready place's band and keeps its scroll this session. One canvas engine: the
// Hub's Phaser scene never loads here. Battery: saver on, and the loop stops when the stage says it's at rest
// (uma-stage 0.4.0's `onSettled`), and while the app or Home is hidden.
//
// The Umas are on it (`farm-figures.ts`): each where the save says she is, a sprite when her outfit's set is live
// (at most 8, `figure-looks.ts`) and a standee otherwise; she walks to her slot when put to work here, runs home when
// recalled, and everyone is placed at once at boot, in the morning and after a sync. A Ready Uma has
// a bubble at her head: a tap collects, and only she counts for the fade, so nothing is faded at rest
// (uma-stage's `setFadeFigures`). A tap on her opens her sheet. Loaded on demand, with three.js, only when the
// preview switch is on.
import { dateOf, farmDesign, farmPlots, parseStockKey, receiptItems, type FarmPlot, type FarmSave } from '@farm/domain'
import { ArchPips, type HubMapPlace } from '@luismlorenzana/uma-kit/hub'
import { LockedIcon } from '@luismlorenzana/uma-kit/ui'
import type { WorkView } from '@luismlorenzana/uma-kit/work'
import { BandStage, capture, standInFarmAtlas, type FarmDesign, type Facing, type Tile } from '@luismlorenzana/uma-stage'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { romanceOn } from '../app/romance'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { madeHere } from '../save/game'
import { outfitFor } from '../story/story'
import { collectJob, harvestBlock } from './actions'
import { farmFigures, figureMoves, idleTiles, keepFigures, keptFigures, moveMode, type FarmFigure, type FigureMove } from './farm-figures'
import { KIT_WAIT_MS, loadFarmKit, readyFarmKit, standInKit, type FarmKit } from './farm-kit'
import {
  bandCentre, fadeMarkers, groundTile, LONG_PRESS_MS, overlayBox, peekLink, rememberCentre, rememberedCentre, SEASON_EASE_MS, SEASON_GRADES, startPlot,
  tapTarget,
} from './farm-stage'
import { faceNow, faceOf, setKey, setLoader } from './figure-looks'
import { umaSheet } from './summary-words'
import { itemWords, requestWords } from './work-view'

export interface FarmStageProps {
  save: FarmSave
  /** The Hub's place models (FarmMap's): names, links, locks, Ready badges and pips, the homestead's on v4. */
  places: readonly HubMapPlace[]
  /** The Hub's work view (FarmMap's): who holds which slot, as the pips read it. */
  work: Pick<WorkView, 'cards'>
  /** Whose heart event is Ready today (v4), as the pips' ♥ reads it. */
  hearts: ReadonlySet<string>
  /** The place whose sheet or quick look is open: the fade shows its slots. */
  open: string | null
  /** A full-screen sheet or scene covers Home: the stage stops. */
  paused: boolean
  reducedMotion: boolean
}

/** A plot's overlay box in CSS px: its size, and how far below its foot the name pill hangs. */
interface Box { w: number; h: number; apron: number }
/** How long after a wake that moved nothing the loop looks again for rest, in ms. */
const REST_CHECK_MS = 250
const TAP_SLOP = 8
/** A bubble's tap target, in CSS px (44 pt). */
const BUBBLE = 44
/** How long the collected items take to rise to the Warehouse, in ms. */
const FLIGHT_MS = 750

/** An Uma on the stage as the farm last placed her: where she's headed and how she faces there, how she looks, whether
 * she's leaving through the Gate, her latest walk's token, and while she walks, the reading she walked from (null when she
 * came in at the Gate), which Home keeps if it goes before she arrives, so she walks again when it's back. */
interface Standing {
  target: Tile; facing: Facing; leaving: boolean; token: number; set: string | null; face: CanvasImageSource | null; before: FarmFigure | null
}
/** Items rising from a bubble to the Warehouse. */
interface Flight { key: number; items: string[]; count: number; from: { x: number; y: number }; to: { x: number; y: number } }

export default function FarmStage({ save, places, work, hearts, open, paused, reducedMotion }: FarmStageProps) {
  const navigate = useNavigate()
  const homestead = romanceOn()
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const design = useMemo(() => farmDesign(save, { homestead }), [save, homestead])
  const plots = useMemo(() => farmPlots(save, { homestead }), [save, homestead])
  const world = useMemo(() => JSON.stringify(design), [design])
  const season = dateOf(save.calendar.day).season
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<BandStage | null>(null)
  const chips = useRef(new Map<string, HTMLDivElement>())
  const anchors = useRef(new Map<string, ReturnType<typeof overlayBox>>())
  const bubbles = useRef(new Map<string, HTMLButtonElement>())
  const loop = useRef({ running: false, raf: 0, idle: 0, lastCentre: Number.NaN, lastSize: '', pointer: false, hidden: false, paused: false })
  const press = useRef<{ x: number; y: number; timer: number; long: boolean } | null>(null)
  /** The kit the farm is drawn with: null until kit-farm's page loads or `KIT_WAIT_MS` passes, then the stand-in until the
   * page arrives. */
  const [kit, setKit] = useState<FarmKit | null>(readyFarmKit)
  /** This stage has its world (so a new design keeps the camera) and its season (so a new one eases); reset with each stage. */
  const built = useRef(false)
  const graded = useRef(false)
  // The figures: the reading the farm shows and its day (kept between Home's visits this session), whether this stage
  // has drawn it yet, who's on the stage, the walks under way, the rebuilds (a walk a rebuild dropped is walked again), and
  // the Ready Umas the fade counts.
  const applied = useRef<FarmFigure[] | null>(keptFigures()?.figures ?? null)
  const shown = useRef<number | null>(keptFigures()?.day ?? null)
  const fresh = useRef(true)
  const onStage = useRef(new Map<string, Standing>())
  const walks = useRef(new Set<string>())
  const seq = useRef(0)
  const rebuilds = useRef(0)
  const bubbled = useRef(new Set<string>())
  /** The faces this stage has asked for, by outfit; each one that arrives re-draws her standee. */
  const asked = useRef(new Set<string>())
  const [faceTick, setFaceTick] = useState(0)
  const blocks = useMemo(() => {
    const frames = kit?.loaded.kit.frames ?? standInFarmAtlas().frames
    return (name: string) => frames[name]?.blocks ?? false
  }, [kit])
  // The idle keep their spots from the last reading applied (read, not tracked: a new reading follows the save).
  const figures = useMemo(() => farmFigures({ save, design, plots, work, hearts, blocks }, idleTiles(applied.current ?? [])), [save, design, plots, work, hearts, blocks])
  const gate = useMemo(() => {
    const m = design.markers.find((marker) => marker.kind === 'gate')
    return m ? { x: m.x, z: m.z } : { x: Math.floor(design.cells[0]!.length / 2), z: design.cells.length - 1 }
  }, [design])
  const latest = useRef({ plots, places, design, kit, figures, save, gate, view })
  latest.current = { plots, places, design, kit, figures, save, gate, view }
  const [boxes, setBoxes] = useState<Record<string, Box>>({})
  const boxesNow = useRef(boxes)
  boxesNow.current = boxes
  const [error, setError] = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const flightSeq = useRef(0)

  const nameOf = (id: string): string => view?.album.get(id)?.name ?? 'An Uma'

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

  /** Places every bubble at its Uma's head, kept inside the stage's edges, hiding those off screen. */
  const placeBubbles = () => {
    const s = stage.current
    if (!s) return
    const { width, height } = s.view
    for (const [id, el] of bubbles.current) {
      const head = s.headOf(id)
      if (!head) { el.style.visibility = 'hidden'; continue }
      const x = Math.min(width - BUBBLE, Math.max(0, head.x - BUBBLE / 2)), y = Math.max(0, head.y - BUBBLE)
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
      el.style.visibility = head.y < 0 || head.y - BUBBLE > height ? 'hidden' : 'visible'
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

  // --- The loop: it runs while anything moves, a finger is down or a walk is under way, and stops at rest. -------

  /** Starts the loop if it's stopped: a touch, a resize, a new world, a figure moved, a set loaded, a fade or a season. */
  const wake = () => {
    const s = stage.current, l = loop.current
    if (!s || l.hidden || l.paused) return
    // A wake that moves nothing never settles: look for rest again shortly.
    window.clearTimeout(l.idle)
    l.idle = window.setTimeout(rest, REST_CHECK_MS)
    if (l.running) return
    l.running = true
    s.start()
    // The overlays follow the frame the stage just drew: the chips when the camera moves, the bubbles while anyone walks.
    const tick = () => {
      const c = s.bandCamera.centre, size = `${s.view.width}x${s.view.height}`
      const moved = c !== l.lastCentre || size !== l.lastSize
      if (moved) { l.lastCentre = c; l.lastSize = size; placeChips() }
      if (moved || walks.current.size > 0) placeBubbles()
      l.raf = requestAnimationFrame(tick)
    }
    l.raf = requestAnimationFrame(tick)
  }
  /** The stage came to rest (`onSettled`), or a wake moved nothing: the loop stops once no finger is down and no one walks. */
  const rest = () => {
    const s = stage.current, l = loop.current
    if (!s || !l.running || l.pointer || walks.current.size > 0 || !s.atRest) return
    sleep()
  }
  const sleep = () => {
    const l = loop.current
    window.clearTimeout(l.idle)
    cancelAnimationFrame(l.raf)
    if (!l.running) return
    l.running = false
    // The stage as it is now, drawn (saver's pacing may have skipped it), then stopped.
    stage.current?.stop({ draw: true })
    placeChips()
    placeBubbles()
  }

  // --- The figures ------------------------------------------------------------------------------

  /** How an Uma looks now: her set's key and loader, and her face as decoded so far (one starts loading if it hasn't). */
  const lookOf = (id: string) => {
    const v = latest.current.view
    const outfit = outfitFor(id)
    const set = v ? setKey(v.art, outfit) : null
    const loadSet = set && v?.art ? setLoader(v.manifest, v.art, outfit, () => wake()) : undefined
    const face = faceNow(v?.art ?? null, outfit)
    if (v?.art && !face && !asked.current.has(outfit)) {
      asked.current.add(outfit)
      void faceOf(v.art, outfit).then((img) => { if (img) setFaceTick((t) => t + 1) })
    }
    return { set, loadSet, face }
  }

  /** Adds her to the stage at a tile if she isn't there yet. */
  const ensure = (s: BandStage, id: string, tile: Tile, facing: Facing): Standing => {
    const had = onStage.current.get(id)
    if (had) return had
    const look = lookOf(id)
    s.addFigure({ id, tile, facing, set: look.set, loadSet: look.loadSet, face: look.face })
    const standing: Standing = { target: tile, facing, leaving: false, token: 0, set: look.set, face: look.face, before: null }
    onStage.current.set(id, standing)
    return standing
  }

  /** Walks (or runs) her to a tile. A walk a rebuild dropped (uma-stage's `keepWalks` couldn't keep it) is
   * walked again from where she stands; one with no way places her there at once, since the counts never wait on a
   * walk. */
  const go = (s: BandStage, id: string, to: Tile, facing: Facing, run: boolean, then?: () => void) => {
    const standing = onStage.current.get(id)
    if (!standing) return
    const token = ++seq.current, issued = rebuilds.current
    Object.assign(standing, { target: to, facing, token })
    walks.current.add(id)
    void s.walkTo(id, to, { run }).then((arrived) => {
      if (stage.current !== s || onStage.current.get(id)?.token !== token) return
      if (!arrived && rebuilds.current !== issued) { go(s, id, to, facing, run, then); return }
      walks.current.delete(id)
      // Arrived (or no way): she stands on her tile facing her work.
      s.placeFigure(id, to, facing)
      refreshLook(s, id)
      then?.()
      wake()
    })
  }

  const remove = (s: BandStage, id: string) => {
    s.removeFigure(id)
    onStage.current.delete(id)
    walks.current.delete(id)
  }

  /** One move of a new reading on the stage; `was` is her figure in the reading before. */
  const applyMove = (s: BandStage, move: FigureMove, was: FarmFigure | null = null) => {
    const { gate: g } = latest.current
    switch (move.kind) {
      case 'place': {
        const standing = ensure(s, move.id, move.to, move.facing)
        Object.assign(standing, { target: move.to, facing: move.facing, leaving: false, token: ++seq.current })
        walks.current.delete(move.id)
        s.placeFigure(move.id, move.to, move.facing)
        return
      }
      case 'arrive': case 'walk': case 'run':
        Object.assign(ensure(s, move.id, g, 'back'), { leaving: false, before: move.kind === 'arrive' ? null : was })
        go(s, move.id, move.to, move.facing, move.kind === 'run')
        return
      case 'turn': {
        const standing = onStage.current.get(move.id)
        if (!standing) return
        standing.facing = move.facing
        if (!walks.current.has(move.id)) s.placeFigure(move.id, standing.target, move.facing)
        return
      }
      case 'leave': {
        const standing = onStage.current.get(move.id)
        if (!standing) return
        standing.leaving = true
        go(s, move.id, g, 'front', true, () => remove(s, move.id))
        return
      }
      case 'remove':
        remove(s, move.id)
    }
  }

  /** Her set and face as they are now: a new set swaps in (the cap weighs it), and a face that arrived re-draws her standee
   * once she stands still. */
  const refreshLook = (s: BandStage, id: string) => {
    const standing = onStage.current.get(id)
    if (!standing) return
    const look = lookOf(id)
    if (look.set !== standing.set) { s.setFigureSet(id, look.set, look.loadSet); standing.set = look.set }
    if (look.face !== standing.face && !walks.current.has(id)) {
      s.removeFigure(id)
      s.addFigure({ id, tile: standing.target, facing: standing.facing, set: look.set, loadSet: look.loadSet, face: look.face })
      standing.face = look.face
    }
  }

  /** The save's figures onto the stage: everyone at once at boot, in the morning and after a sync, else only who moved.
   *A new stage first stands everyone where the farm last showed them (Home's last visit). The fade counts
   * the Ready Umas only. */
  const syncFigures = () => {
    const s = stage.current
    if (!s || !built.current) return
    const { figures: next, save: now } = latest.current
    if (fresh.current) {
      for (const f of applied.current ?? []) applyMove(s, { id: f.id, kind: 'place', to: f.tile, facing: f.facing })
      fresh.current = false
    }
    const mode = moveMode(shown.current, now.calendar.day, madeHere(now))
    const before = applied.current ?? []
    const was = new Map(before.map((f) => [f.id, f]))
    for (const move of figureMoves(before, next, mode)) applyMove(s, move, was.get(move.id) ?? null)
    applied.current = next
    shown.current = now.calendar.day
    const ready = new Set(next.filter((f) => f.bubble !== null).map((f) => f.id))
    if (ready.size !== bubbled.current.size || [...ready].some((id) => !bubbled.current.has(id))) {
      bubbled.current = ready
      s.setFadeFigures((f) => bubbled.current.has(f.id))
    }
    wake()
  }

  // The stage: made once, sized to Home's page between the bars, disposed when Home goes (its scroll kept).
  useEffect(() => {
    const el = canvas.current!, frame = box.current!
    // The settled frame is drawn when `onSettled` runs: the loop stops just after, outside the stage's own frame.
    const s = new BandStage(el, { saver: true, fit: 'width', fade: { markers: [] }, onFirstFrame: () => setDrawn(true), onSettled: () => void window.setTimeout(rest, 0) })
    stage.current = s
    built.current = false
    graded.current = false
    applied.current = keptFigures()?.figures ?? null
    shown.current = keptFigures()?.day ?? null
    fresh.current = true
    onStage.current.clear()
    walks.current.clear()
    bubbled.current = new Set()
    // Only a Ready Uma counts for the fade: nobody, until the figures arrive.
    s.setFadeFigures(() => false)
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
    if (import.meta.env.DEV) {
      (window as unknown as { __farmStage?: unknown }).__farmStage = {
        stage: s, get kit() { return latest.current.kit?.name ?? null }, get design() { return latest.current.design }, get plots() { return latest.current.plots },
        get figures() { return latest.current.figures }, get onStage() { return [...onStage.current.keys()] }, get walking() { return [...walks.current] },
        get running() { return loop.current.running },
      }
    }
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      observer?.disconnect()
      sleep()
      rememberCentre(s.bandCamera.centre)
      // What the farm shows, kept for Home's next visit: anyone still walking where she walked from.
      const showing = (applied.current ?? []).flatMap((f) => (walks.current.has(f.id) ? [onStage.current.get(f.id)?.before ?? null].filter((b) => b !== null) : [f]))
      keepFigures(applied.current && shown.current !== null ? { figures: showing, day: shown.current } : null)
      s.dispose()
      stage.current = null
    }
  }, [])

  // The kit: kit-farm once its page loads; the stand-in if it's slow, swapped when it arrives, or if it fails.
  useEffect(() => {
    if (kit) return
    let live = true
    const slow = window.setTimeout(() => { if (live) setKit((k) => k ?? standInKit()) }, KIT_WAIT_MS)
    void loadFarmKit().then((loaded) => { if (live) setKit(loaded) })
    return () => { live = false; window.clearTimeout(slow) }
  }, [])

  // The world: rebuilt when the design changes (a place opens, a crop grows) or the kit arrives. A rebuild keeps the camera
  // and every walk whose path still stands; the figures follow.
  useEffect(() => {
    const s = stage.current
    if (!s || !kit) return
    rebuilds.current++
    try {
      s.setWorld(JSON.parse(world) as FarmDesign, kit.loaded, { keepCamera: built.current, keepWalks: true })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The farm can’t be drawn.')
      return
    }
    s.setFadeMarkers(fadeMarkers(open))
    if (!built.current) {
      const half = s.bandCamera.centre - s.bandCamera.top
      const start = rememberedCentre() ?? (() => { const plot = startPlot(plots, places); return plot ? bandCentre(plot, half) : null })()
      if (start !== null) s.scrollTo(start, true)
      built.current = true
    }
    // The stand-in's page leaves the GPU once kit-farm stands in its place (its canvas stays for a later fallback).
    if (kit.name === 'kit-farm') standInKit().loaded.page.dispose()
    measure()
    syncFigures()
    wake()
  }, [world, kit])

  // The figures follow the save.
  useEffect(() => { syncFigures() }, [figures])

  // Looks: master data's sets and faces once they load.
  useEffect(() => {
    const s = stage.current
    if (!s) return
    for (const id of onStage.current.keys()) refreshLook(s, id)
    wake()
  }, [view, faceTick])

  // The season's light: at once on load, eased over a second when a morning brings the next.
  useEffect(() => {
    const s = stage.current
    if (!s) return
    s.setGrade(SEASON_GRADES[season], graded.current && !reducedMotion ? SEASON_EASE_MS : 0)
    graded.current = true
    wake()
  }, [season])

  // The fade: nothing at rest; the open place's slots while its sheet is up.
  useEffect(() => {
    stage.current?.setFadeMarkers(fadeMarkers(open))
    wake()
  }, [open])

  // A full-screen sheet or scene over Home: the stage rests until it closes.
  useEffect(() => {
    loop.current.paused = paused
    if (paused) sleep()
    else wake()
  }, [paused])

  // The chips and bubbles follow the camera; React only re-renders them when a model or a box changes.
  useEffect(() => { loop.current.lastCentre = Number.NaN; placeChips(); placeBubbles() })

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
    // Figures first: her sheet; anything else as the taps.
    const first = hits[0]?.ref
    if (first?.kind === 'figure') { void navigate(umaSheet(first.id, latest.current.save.version), { state: { back: true } }); return }
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

  /** Where collected items fly (the "left to the worker"): the Warehouse's chip, or the edge of the view toward it. */
  const warehousePoint = (): { x: number; y: number } => {
    const s = stage.current, a = anchors.current.get('warehouse')
    const width = s?.view.width ?? 0, height = s?.view.height ?? 0
    if (!s || !a) return { x: width / 2, y: 12 }
    const p = s.project(a.top)
    return { x: Math.min(width - 16, Math.max(16, p.x)), y: Math.min(height - 16, Math.max(16, p.y)) }
  }
  const fly = (items: readonly string[], count: number, from: { x: number; y: number } | null) => {
    if (reducedMotion || !from || count === 0) return
    const icons = [...new Set(items)].slice(0, 3)
    setFlights((all) => [...all, { key: ++flightSeq.current, items: icons, count, from: { x: from.x, y: from.y - BUBBLE / 2 }, to: warehousePoint() }])
  }

  /** A bubble's tap: her work collected (the items rise to the Warehouse, and she starts her queued job or runs
   * home), her block harvested, or her Ready heart event played. A refused collect leaves the bubble. */
  const tapBubble = async (figure: FarmFigure) => {
    const bubble = figure.bubble
    if (!bubble) return
    if (bubble.kind === 'heart') { void navigate(`/?event=${figure.id}`, { state: { back: true } }); return }
    const from = stage.current?.headOf(figure.id) ?? null
    try {
      if (bubble.kind === 'work') {
        const got = await collectJob(figure.id)
        fly(got.goods.map((key) => parseStockKey(key)?.id ?? key), got.goods.length, from)
      } else {
        const receipt = await harvestBlock(bubble.block)
        fly([bubble.crop], receiptItems(receipt), from)
      }
    } catch {
      // Nothing collected: the save didn't change, so her bubble stays for another tap.
    }
  }

  const byId = new Map(places.map((p) => [p.id, p]))
  const day = save.calendar.day
  return (
    <div ref={box} className="absolute inset-0 overflow-hidden" data-farm-stage={drawn ? 'drawn' : 'loading'} data-kit-name={kit?.name ?? 'loading'}>
      <canvas ref={canvas} className="absolute inset-0 block size-full" style={{ touchAction: 'none' }} aria-hidden
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(e) => e.preventDefault()} />
      <div className="pointer-events-none absolute inset-0" aria-hidden data-stage-overlays>
        {plots.map((plot) => {
          const place = byId.get(plot.id), size = boxes[plot.id]
          if (!place || !size) return null
          return <PlaceChip key={plot.id} plot={plot} place={place} box={size} onRef={(el) => { if (el) chips.current.set(plot.id, el); else chips.current.delete(plot.id) }} />
        })}
      </div>
      <div className="pointer-events-none absolute inset-0" data-stage-bubbles>
        {figures.map((figure) => (figure.bubble === null ? null : (
          <FigureBubble key={figure.id} figure={figure} day={day} name={nameOf(figure.id)} reducedMotion={reducedMotion} onTap={() => void tapBubble(figure)}
            onRef={(el) => { if (el) bubbles.current.set(figure.id, el); else bubbles.current.delete(figure.id) }} />
        )))}
        {flights.map((flight) => (
          <ItemFlight key={flight.key} flight={flight} onDone={() => setFlights((all) => all.filter((f) => f.key !== flight.key))} />
        ))}
      </div>
      {/* The Hub's place links, for VoiceOver and the quick look's focus return: the canvas answers taps. */}
      <nav aria-label="Farm map" className="sr-only">
        {plots.map((plot) => {
          const place = byId.get(plot.id)
          return place ? <Link key={plot.id} to={place.to} state={{ back: true }} data-place={place.id} aria-label={place.label}>{place.name}</Link> : null
        })}
      </nav>
      {/* The Umas on the farm, each to her sheet: the canvas answers a tap on her. */}
      <nav aria-label="Umas on the farm" className="sr-only">
        {figures.map((figure) => <Link key={figure.id} to={umaSheet(figure.id, save.version)} state={{ back: true }} data-figure={figure.id}>{nameOf(figure.id)}</Link>)}
      </nav>
      {error && <p role="alert" className="absolute inset-x-4 top-4 rounded-md bg-panel p-3 text-[13px] text-danger shadow-2">{error}</p>}
    </div>
  )
}

/** A place's chip over the stage, as the Hub draws its place link: its pips in a half arch over its plot,
 * the Ready badge at its foot, and its name pill under the apron, a locked one's lock in the pill (the stage's roofs rise
 * over the band above, so a lock at the box's corner would read as that band's). */
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

/** The rise every new bubble makes (none with reduced motion). */
const RISE: Keyframe[] = [{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }]

/** A Ready Uma's bubble at her head: her work's item (or the Fields' crop) on a round card with a tail, ♥ in
 * its corner when her heart event is Ready too, or ♥ alone. A 44 pt target; a tap collects. */
function FigureBubble({ figure, day, name, reducedMotion, onTap, onRef }: {
  figure: FarmFigure; day: number; name: string; reducedMotion: boolean; onTap: () => void; onRef: (el: HTMLButtonElement | null) => void
}) {
  const inner = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!reducedMotion) inner.current?.animate?.(RISE, { duration: 240, easing: 'ease-out' })
  }, [])
  const bubble = figure.bubble!
  const item = bubble.kind === 'work' ? requestWords(bubble.request, day).item ?? null : bubble.kind === 'crop' ? bubble.crop : null
  const heart = bubble.kind === 'heart' || bubble.heart
  const label = bubble.kind === 'work' ? `Collect ${item ? itemWords(item) : 'her work'} from ${name}`
    : bubble.kind === 'crop' ? `Harvest Block ${bubble.block}, tended by ${name}` : `${name}: her event is Ready`
  return (
    <button ref={onRef} type="button" onClick={onTap} aria-label={label} data-bubble={figure.id} data-bubble-kind={bubble.kind}
      className="pointer-events-auto absolute top-0 left-0 flex items-end justify-center" style={{ width: BUBBLE, height: BUBBLE, visibility: 'hidden' }}>
      <span ref={inner} className="relative mb-1.5 flex size-8 items-center justify-center rounded-full border border-hairline-strong bg-panel shadow-3">
        {item ? <ItemIcon id={parseStockKey(item)?.id ?? item} size={24} /> : <span aria-hidden className="text-[18px] leading-none text-[#d6456e]">♥</span>}
        {item && heart && (
          <span aria-hidden data-bubble-heart className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#d6456e] text-[10px] leading-none text-white shadow-2">♥</span>
        )}
        <span aria-hidden className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-r border-b border-hairline-strong bg-panel" />
      </span>
    </button>
  )
}

/** Collected items rising from her bubble to the Warehouse (the "left to the worker"): up to three icons and the count,
 * up and over in an arc, fading as they land. */
function ItemFlight({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = el.current
    const { from, to } = flight
    const mid = { x: from.x + (to.x - from.x) * 0.25, y: Math.min(from.y, to.y) - 36 }
    const at = (p: { x: number; y: number }) => `translate(${Math.round(p.x - 20)}px, ${Math.round(p.y - 12)}px)`
    const animation = node?.animate?.([
      { transform: at(from), opacity: 1 }, { transform: at(mid), opacity: 1, offset: 0.35 }, { transform: `${at(to)} scale(0.6)`, opacity: 0 },
    ], { duration: FLIGHT_MS, easing: 'ease-in', fill: 'forwards' })
    if (!animation) { const t = window.setTimeout(onDone, FLIGHT_MS); return () => window.clearTimeout(t) }
    animation.onfinish = onDone
    return () => animation.cancel()
  }, [])
  return (
    <div ref={el} aria-hidden data-item-flight className="pointer-events-none absolute top-0 left-0 flex items-center gap-0.5 rounded-full bg-panel/95 px-1 py-0.5 shadow-3"
      style={{ transform: `translate(${Math.round(flight.from.x - 20)}px, ${Math.round(flight.from.y - 12)}px)` }}>
      {flight.items.map((id) => <ItemIcon key={id} id={id} size={18} />)}
      <span className="font-display text-[11px] leading-4 font-bold text-ink">+{flight.count}</span>
    </div>
  )
}
