// The farm's Umas on the HD-2D stage: who stands where, read from
// the save as the Hub's pips read it, what her bubble shows, and what moved between two readings. Figures only show the
// save: nothing here changes it. Pure, and part of the stage's lazy chunk (`FarmStage.tsx`).
//
// Who stands: every Uma whose job holds a slot (uma-kit's `workView` cards, the pips' own source) at that
// slot's marker, every tender at her block's marker on the Fields, and the rest of the farm's home (`farmHome`) idle: a
// housed spouse (v4) on her house's apron, everyone else in the yard. Nobody who's away. The idle spots ("left to
// the worker"): the Dorm's apron, middle first, then the path in front of it, then the path row on to the bin, then the
// free tiles of the open ground beside the Gate; more Umas than spots share them from the first. An Uma idle before keeps
// her spot while it's still a spot, so putting one to work never shuffles the others (only who moved walks).
import { farmHome, housed, loopReadyItems, LOOP_WORK_PLACES, slotId, workNow, type BlockId, type CropId, type FarmPlot, type FarmSave, type LoopWorkRequest } from '@farm/domain'
import type { SlotCardModel } from '@luismlorenzana/uma-kit/work'
import type { Facing } from '@luismlorenzana/uma-stage'
import type { FarmDesign, Tile } from '@luismlorenzana/uma-stage/formats'

/** What her bubble shows: her work's item when she has some to collect (the place's Ready), the Fields' crop
 * when her block has Ready plots, each with ♥ when her heart event is Ready (v4); ♥ alone with nothing to collect. */
export type FigureBubble =
  | { kind: 'work'; request: LoopWorkRequest; heart: boolean }
  | { kind: 'crop'; block: BlockId; crop: CropId; heart: boolean }
  | { kind: 'heart' }

export type FigureWhere = 'slot' | 'yard' | 'house'
/** An Uma on the farm as the stage draws her. `id` is her roster key (an outfit id on v3, a character id on v4). */
export interface FarmFigure {
  id: string
  tile: Tile
  facing: Facing
  where: FigureWhere
  /** The place she works at (a work place, or `fields` for a tender), or null when she's idle. */
  place: string | null
  bubble: FigureBubble | null
}

export interface FiguresInput {
  save: FarmSave
  design: FarmDesign
  plots: readonly FarmPlot[]
  /** The Hub's work view (FarmMap's): who holds which slot. */
  work: { cards: (building: string) => readonly SlotCardModel[] }
  /** Whose heart event is Ready today (v4; empty on v3). */
  hearts: ReadonlySet<string>
  /** Whether a prop frame blocks its tile (the kit's `blocks`). */
  blocks: (frame: string) => boolean
}

const key = (t: Tile): string => `${t.x},${t.z}`
export const sameTile = (a: Tile, b: Tile): boolean => a.x === b.x && a.z === b.z

/** Where a design lets an Uma stand: walkable ground (not water, rock or the quarry's pit), under no building and no
 * blocking prop. */
export function standable(design: FarmDesign, blocks: (frame: string) => boolean): (t: Tile) => boolean {
  const taken = new Set<string>()
  for (const b of design.buildings) for (let z = b.z; z < b.z + b.d; z++) for (let x = b.x; x < b.x + b.w; x++) taken.add(key({ x, z }))
  for (const p of design.props ?? []) if (blocks(p.name)) taken.add(key(p))
  return (t) => {
    const cell = design.cells[t.z]?.[t.x]
    return cell !== undefined && !'wq#'.includes(cell) && !taken.has(key(t))
  }
}

/** The way an Uma at a slot faces ("facing the place's work"): into a building behind her, toward one beside her (or
 * beside the tile behind her), else into the place: away from the camera. */
export function slotFacing(design: FarmDesign, t: Tile): Facing {
  const covers = (x: number, z: number) => design.buildings.some((b) => x >= b.x && x < b.x + b.w && z >= b.z && z < b.z + b.d)
  if (covers(t.x, t.z - 1)) return 'back'
  if (covers(t.x + 1, t.z) || covers(t.x + 1, t.z - 1)) return 'right'
  if (covers(t.x - 1, t.z) || covers(t.x - 1, t.z - 1)) return 'left'
  return 'back'
}

/** A plot's apron (its front row), middle first, then the path row in front of it, middle first, where an Uma may stand. */
function frontOf(plot: Pick<FarmPlot, 'x' | 'z'>, ok: (t: Tile) => boolean): Tile[] {
  return [2, 3].flatMap((lz) => [1, 0, 2].map((lx) => ({ x: plot.x + lx, z: plot.z + lz }))).filter(ok)
}

/** The yard's idle spots: the Dorm's apron and the path in front of it, the path row on toward the bin, then the open
 * ground beside the Gate. */
export function yardSpots(design: FarmDesign, plots: readonly FarmPlot[], ok: (t: Tile) => boolean): Tile[] {
  const dorm = plots.find((p) => p.id === 'dorm')
  if (!dorm) return []
  const path = Array.from({ length: dorm.x }, (_, i) => ({ x: dorm.x - 1 - i, z: dorm.z + 3 })).filter(ok)
  const open = plots.find((p) => p.kind === 'open')
  const ground = open ? [0, 1, 2].flatMap((lz) => [0, 1, 2].map((lx) => ({ x: open.x + lx, z: open.z + lz }))).filter(ok) : []
  const seen = new Set<string>()
  return [...frontOf(dorm, ok), ...path, ...ground].filter((t) => !seen.has(key(t)) && seen.add(key(t)))
}

/** A house's idle spots (v4): its apron, then the path in front of it. */
export const houseSpots = (plot: FarmPlot, ok: (t: Tile) => boolean): Tile[] => frontOf(plot, ok)

/** Gives each idle Uma a spot: her spot from before while it's still one and free, the first free spot otherwise; with
 * more Umas than spots, the spots are shared from the first. */
export function assignSpots(ids: readonly string[], spots: readonly Tile[], previous?: ReadonlyMap<string, Tile>): Map<string, Tile> {
  const out = new Map<string, Tile>()
  if (spots.length === 0) return out
  const used = new Set<string>()
  for (const id of ids) {
    const had = previous?.get(id)
    if (had && spots.some((s) => sameTile(s, had)) && !used.has(key(had))) { out.set(id, had); used.add(key(had)) }
  }
  let next = 0
  for (const id of ids) {
    if (out.has(id)) continue
    while (next < spots.length && used.has(key(spots[next]!))) next++
    const spot = next < spots.length ? spots[next]! : spots[(out.size) % spots.length]!
    out.set(id, spot)
    used.add(key(spot))
  }
  return out
}

/**
 * Everyone on the farm as the stage draws her, in the save's order: the workers place by place and slot by
 * slot, the tenders block by block, then the idle in `farmHome`'s order. `previous` is where the idle stood last time (the
 * stage's last reading), so their spots hold.
 */
export function farmFigures(input: FiguresInput, previous?: ReadonlyMap<string, Tile>): FarmFigure[] {
  const { save, design, plots, work, hearts, blocks } = input
  const now = workNow(save)
  const markers = new Map(design.markers.map((m) => [`${m.kind}:${m.id}`, m]))
  const out: FarmFigure[] = []
  const placed = new Set<string>()
  const heart = (id: string) => hearts.has(id)

  for (const place of LOOP_WORK_PLACES) {
    for (const card of work.cards(place)) {
      if (card.kind !== 'held' || placed.has(card.outfitId)) continue
      const at = markers.get(`slot:${slotId(place, card.slot.slot)}`) ?? markers.get(`place:${place}`)
      if (!at) continue
      const id = card.outfitId
      const ready = loopReadyItems(save.work[id], now) > 0
      out.push({
        id, tile: { x: at.x, z: at.z }, facing: slotFacing(design, at), where: 'slot', place,
        bubble: ready ? { kind: 'work', request: card.request as LoopWorkRequest, heart: heart(id) } : heart(id) ? { kind: 'heart' } : null,
      })
      placed.add(id)
    }
  }
  for (const block of save.fields.blocks) {
    const id = block.tender
    if (id === null || placed.has(id)) continue
    const at = markers.get(`slot:${slotId('fields', block.id)}`) ?? markers.get('place:fields')
    if (!at) continue
    const ripe = block.plots.find((p) => p.ready && p.crop !== null)?.crop ?? null
    out.push({
      id, tile: { x: at.x, z: at.z }, facing: slotFacing(design, at), where: 'slot', place: 'fields',
      bubble: ripe !== null ? { kind: 'crop', block: block.id, crop: ripe, heart: heart(id) } : heart(id) ? { kind: 'heart' } : null,
    })
    placed.add(id)
  }

  const ok = standable(design, blocks)
  const idle = farmHome(save).filter((id) => !placed.has(id))
  const houses = new Map<number, string[]>()
  const yard: string[] = []
  for (const id of idle) {
    const n = housed(save, id) && save.version === 4 ? save.love[id]?.house : undefined
    const plot = n === undefined ? undefined : plots.find((p) => p.kind === 'house' && p.house === n)
    if (n !== undefined && plot) houses.set(n, [...houses.get(n) ?? [], id])
    else yard.push(id)
  }
  const spots = new Map<string, { tile: Tile; where: FigureWhere }>()
  for (const [id, tile] of assignSpots(yard, yardSpots(design, plots, ok), previous)) spots.set(id, { tile, where: 'yard' })
  for (const [n, ids] of houses) {
    const plot = plots.find((p) => p.kind === 'house' && p.house === n)!
    for (const [id, tile] of assignSpots(ids, houseSpots(plot, ok), previous)) spots.set(id, { tile, where: 'house' })
  }
  for (const id of idle) {
    const spot = spots.get(id)
    if (!spot) continue
    out.push({ id, tile: spot.tile, facing: 'front', where: spot.where, place: null, bubble: heart(id) ? { kind: 'heart' } : null })
  }
  return out
}

/** Where the idle stood in a reading, for the next one's spots. */
export const idleTiles = (figures: readonly FarmFigure[]): Map<string, Tile> =>
  new Map(figures.filter((f) => f.where !== 'slot').map((f) => [f.id, f.tile]))

// --- What moved ----------------------------------------------------------------------------------------

/** How a new reading reaches the stage: everyone placed at once (boot, the morning, a sync from another device), or only
 * who moved, walking (a change made here today). */
export type MoveMode = 'place' | 'walk'

/** Place the first time, when the day turns (the morning), and for a save this device didn't make (the server's, another
 * device's change); walk for a change made here on the same day. `before` is the day of the reading the stage shows. */
export function moveMode(before: number | null, day: number, madeHere: boolean): MoveMode {
  return before === null || before !== day || !madeHere ? 'place' : 'walk'
}

/** What the farm last showed, kept for the session as Home's camera is: a put-to-work from a place's page
 * walks her when Home comes back. */
let kept: { figures: FarmFigure[]; day: number } | null = null
export const keptFigures = (): { figures: FarmFigure[]; day: number } | null => kept
export function keepFigures(next: { figures: FarmFigure[]; day: number } | null): void { kept = next }

export type FigureMove =
  /** Stand there at once (new on the stage or not), facing so. */
  | { id: string; kind: 'place'; to: Tile; facing: Facing }
  /** Walk in from the Gate: she wasn't on the farm (a visitor joining). */
  | { id: string; kind: 'arrive'; to: Tile; facing: Facing }
  /** Walk to her slot (put to work), or run home (recalled, or collected with nothing next). */
  | { id: string; kind: 'walk' | 'run'; to: Tile; facing: Facing }
  /** Turn where she stands. */
  | { id: string; kind: 'turn'; facing: Facing }
  /** Run out of the Gate and go (she left the farm). */
  | { id: string; kind: 'leave' }
  /** Gone at once. */
  | { id: string; kind: 'remove' }

/**
 * What the stage does between two readings. In `place` mode everyone stands at her tile at once and
 * whoever's gone goes. In `walk` mode only who moved moves: a new Uma walks in from the Gate, one whose tile changed walks
 * to a slot or runs home, one who's gone runs out of the Gate; the rest stay (or turn).
 */
export function figureMoves(before: readonly FarmFigure[], after: readonly FarmFigure[], mode: MoveMode): FigureMove[] {
  const was = new Map(before.map((f) => [f.id, f]))
  const now = new Set(after.map((f) => f.id))
  const moves: FigureMove[] = []
  for (const f of after) {
    const prev = was.get(f.id)
    if (mode === 'place') {
      if (!prev || !sameTile(prev.tile, f.tile) || prev.facing !== f.facing) moves.push({ id: f.id, kind: 'place', to: f.tile, facing: f.facing })
      continue
    }
    if (!prev) moves.push({ id: f.id, kind: 'arrive', to: f.tile, facing: f.facing })
    else if (!sameTile(prev.tile, f.tile)) moves.push({ id: f.id, kind: f.where === 'slot' ? 'walk' : 'run', to: f.tile, facing: f.facing })
    else if (prev.facing !== f.facing) moves.push({ id: f.id, kind: 'turn', facing: f.facing })
  }
  for (const f of before) if (!now.has(f.id)) moves.push({ id: f.id, kind: mode === 'place' ? 'remove' : 'leave' })
  return moves
}
