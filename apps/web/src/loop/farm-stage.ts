// The stage Home's pure half (F11 decisions 4–8; KF10): the seasons as grades, what a tap opens, the band Home opens on,
// the fade's markers and the session's scroll. The kit is `farm-kit.ts` (KF14, D73). Part of the stage's lazy chunk with
// `FarmStage.tsx`: it imports uma-stage's root, and so three.js.
import { FARM_BAND, FARM_PLOT, plotAt, type FarmPlot, type Season } from '@farm/domain'
import type { HubMapPlace } from '@luismlorenzana/uma-kit/hub'
import { DAY_GRADE, rayAt, type FarmMarker, type PickHit, type StageGrade, type View } from '@luismlorenzana/uma-stage'

// --- The seasons (decision 6, KF10) -------------------------------------------------------------------------------------

/** The four seasons as light, from the stage's day grade, tuned on the stand-in kit: spring fresh and soft, summer bright
 * and warm, autumn an amber tint, winter cold and pale with the lamps stronger. The background is the sky above the
 * farm's back row and beside it on a wide phone. */
export const SEASON_GRADES: Readonly<Record<Season, StageGrade>> = {
  spring: { ...DAY_GRADE, sky: '#e8f3ff', ground: '#4a5a32', skyLight: 1.5, sun: '#fff5e2', sunLight: 1.25, tint: '#ffffff', background: '#a9d7ee', lamps: 0 },
  summer: { ...DAY_GRADE, sky: '#fff6dc', ground: '#5a5226', skyLight: 1.6, sun: '#ffe8a8', sunLight: 1.55, tint: '#fff7ea', background: '#86c4ee', lamps: 0 },
  autumn: { ...DAY_GRADE, sky: '#ffe2b8', ground: '#5a3a20', skyLight: 1.3, sun: '#ffb46a', sunLight: 1.5, tint: '#ffe4c8', background: '#e3ab78', lamps: 0.25 },
  winter: { ...DAY_GRADE, sky: '#dfe8f6', ground: '#39414e', skyLight: 1.35, sun: '#e6edff', sunLight: 0.95, tint: '#e6edf8', background: '#c3d1e2', lamps: 0.7 },
}
/** How long the morning eases to a new season's light, in ms (instant with reduced motion). */
export const SEASON_EASE_MS = 1000

// --- Taps (decision 5) ----------------------------------------------------------------------------------------------------

/** The plot a slot marker belongs to: `mill-2` is the Mill's, `fields-a` the Fields'. */
export const slotPlace = (id: string): string => id.slice(0, id.lastIndexOf('-'))

/** The plot a hit stands for: a place's or a lot's marker, a slot's place, the Gate, a building, or the plot a prop stands
 * in. Null for what opens nothing: a path point, a figure (F12's), the open ground. */
export function plotOfHit(hit: PickHit, plots: readonly FarmPlot[]): string | null {
  const ref = hit.ref
  let id: string | null
  switch (ref.kind) {
    case 'marker': id = markerPlot(ref.marker); break
    case 'building': id = ref.id; break
    case 'prop': id = plotAt(plots, ref.tile.x, ref.tile.z)?.id ?? null; break
    case 'figure': id = null; break
  }
  return id !== null && plots.some((p) => p.id === id && p.kind !== 'open') ? id : null
}
function markerPlot(m: FarmMarker): string | null {
  switch (m.kind) {
    case 'place': case 'lot': return m.id
    case 'slot': return slotPlace(m.id)
    case 'gate': return 'gate'
    case 'path': return null
  }
}

/** The ground tile under a stage point, at a ground level (the farm's is 1). */
export function groundTile(view: View, x: number, y: number, level = 1): { x: number; z: number } | null {
  const ray = rayAt(view, x, y)
  if (Math.abs(ray.dir.y) < 1e-9) return null
  const t = (level - ray.origin.y) / ray.dir.y
  return { x: Math.floor(ray.origin.x + ray.dir.x * t), z: Math.floor(ray.origin.z + ray.dir.z * t) }
}

/** What a tap opens, nearest first (decision 5): the first hit that stands for a plot, else the plot of the ground under
 * the finger; its model's link (`placeLink`, the homestead's sheet at a house or the lot), as the Hub's place opens it. */
export function tapTarget(hits: readonly PickHit[], ground: { x: number; z: number } | null, plots: readonly FarmPlot[], places: readonly Pick<HubMapPlace, 'id' | 'to'>[]):
  { id: string; to: string } | null {
  let id: string | null = null
  for (const hit of hits) if ((id = plotOfHit(hit, plots)) !== null) break
  if (id === null && ground) {
    const plot = plotAt(plots, ground.x, ground.z)
    id = plot && plot.kind !== 'open' ? plot.id : null
  }
  const place = id === null ? undefined : places.find((p) => p.id === id)
  return place ? { id: place.id, to: place.to } : null
}

/** The quick look a long-press opens (decision 5): a map place's `?peek=`; a house's sheet, as its tap. */
export const peekLink = (id: string, to: string): string => (to.startsWith('/?sheet=homestead') ? to : `/?peek=${id}`)
/** How long a press is held before it's a long-press, in ms. */
export const LONG_PRESS_MS = 500

// --- The camera (decision 8) ------------------------------------------------------------------------------------------------

/** The plot Home opens on: the first place, in map order, with a Ready badge (a finished job or a Ready plot), else the
 * Fields. */
export function startPlot(plots: readonly FarmPlot[], places: readonly Pick<HubMapPlace, 'id' | 'ready'>[]): FarmPlot | undefined {
  const ready = new Set(places.filter((p) => p.ready !== undefined).map((p) => p.id))
  return plots.find((p) => ready.has(p.id)) ?? plots.find((p) => p.id === 'fields')
}
/** The ground row at the view's middle that puts a plot's band at the view's top, for a view `half` tiles deep each way. */
export const bandCentre = (plot: Pick<FarmPlot, 'band'>, half: number): number => plot.band * FARM_BAND + half

/** Home's camera between visits this session (the Hub's behaviour): the ground row at the view's middle. */
let remembered: number | null = null
export const rememberedCentre = (): number | null => remembered
export function rememberCentre(z: number | null): void { remembered = z }

// --- The fade (decision 7) ----------------------------------------------------------------------------------------------------

/** The markers the fade keeps in view: at rest none; with a place's sheet open, only that place's slots. */
export function fadeMarkers(open: string | null): (m: FarmMarker) => boolean {
  return (m) => open !== null && m.kind === 'slot' && slotPlace(m.id) === open
}

// --- Overlays (decision 4) ------------------------------------------------------------------------------------------------

/** Where a plot's overlay sits in the world: its box from the ground at the apron's back edge (the building's foot) up to
 * its top (a building's ridge, else a tree's height), across its three tiles. The name pill hangs under the box. */
export function overlayBox(plot: Pick<FarmPlot, 'x' | 'z'>, building: { storeys: number } | undefined, level = 1) {
  const top = level + (building ? building.storeys * 2 + 1 : 2)
  return {
    left: { x: plot.x, y: level, z: plot.z + 2 },
    right: { x: plot.x + FARM_PLOT, y: level, z: plot.z + 2 },
    top: { x: plot.x + FARM_PLOT / 2, y: top, z: plot.z + 1 },
  }
}
