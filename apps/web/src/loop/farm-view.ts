// The farm's words: a tile as its panel shows it (what's on it, how far it's grown, and the one action it takes next), the
// field's counts at a glance (the farm map's sign, a plot's page), the woods' and the pond's areas and spots with their
// season's finds, and a station's loads. Pure, so the panels and the tests read the same.
import {
  CLEAR_FINDS, cropLook, dateOf, DAYS_PER_SEASON, FIELD_COLUMNS, GROUND_NAMES, growsIn, isOvergrown, isSeasonEnd, itemNameOf, LOAD_SIZE, nightsLeft, plotName,
  plotOf, reachList, SEASON_NAMES, seedsInSeason, sharesOn, stagesOf, stationOptions, tileAt, tileInPlot, type CropLook, type FarmSave, type FieldCounts,
  type GatherPlace, type StationId, type StationOption, type Tile,
} from '@farm/domain'
import { plural } from './words'

/** One action a tile offers now. */
export type TileAction =
  | { kind: 'clear'; leaves: string | null }
  | { kind: 'till' }
  | { kind: 'plant'; seed: string; name: string; count: number; own: boolean; stages: number; late: boolean }
  | { kind: 'water' }
  | { kind: 'harvest' }

/** A tile as its panel shows it. */
export interface TileView {
  /** Its field index: every plot's tiles in order. */
  index: number
  /** Its plot's index, 0 for plot 1. */
  plot: number
  /** "Weeds", "Tilled soil", "Carrot". */
  title: string
  /** "Row 2, tile 3", in its plot. */
  where: string
  /** What it needs or how far it's grown: "2 of 4 nights · watered". */
  line: string
  /** On a season's last day, a crop that won't ripen by morning and doesn't grow next season. */
  withers: boolean
  look: CropLook | null
  actions: TileAction[]
}

/** Whether a growing tile withers tonight: a season's last day, not ripe by morning, out of season next. */
export function withersTonight(save: Pick<FarmSave, 'calendar'>, tile: Tile): boolean {
  if (tile.crop === null || tile.ready || !isSeasonEnd(save.calendar.day)) return false
  const next = dateOf(save.calendar.day + 1).season
  if (growsIn(tile.crop, next)) return false
  return !(tile.watered && nightsLeft(tile) === 1)
}

/** A tile's panel: what's on it, and what it takes next. `index` is its field index. */
export function tileView(save: Pick<FarmSave, 'fields' | 'items' | 'calendar'>, index: number): TileView {
  const tile = tileAt(save, index)
  const at = tileInPlot(index)
  const where = `Row ${Math.floor(at / FIELD_COLUMNS) + 1}, tile ${(at % FIELD_COLUMNS) + 1}`
  const base = { index, plot: plotOf(index), where, withers: false, look: cropLook(tile) }
  if (isOvergrown(tile.ground)) {
    const leaves = CLEAR_FINDS[tile.ground]
    return { ...base, title: GROUND_NAMES[tile.ground], line: leaves ? `Clear it to till it. It leaves a ${itemNameOf(leaves)}.` : 'Clear it to till it.', actions: [{ kind: 'clear', leaves }] }
  }
  if (tile.ground === 'clear') return { ...base, title: GROUND_NAMES.clear, line: 'Till it to plant it.', actions: [{ kind: 'till' }] }
  if (tile.crop === null) {
    // Too late this season: it can't ripen before the season's last night withers it.
    const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
    const next = dateOf(save.calendar.day + daysLeft).season
    const seeds = seedsInSeason(save).map((s): TileAction => ({
      kind: 'plant', seed: s.id, name: itemNameOf(s.crop), count: s.count, own: s.own, stages: stagesOf(s.crop, false),
      late: stagesOf(s.crop, false) > daysLeft && !growsIn(s.crop, next),
    }))
    return { ...base, title: GROUND_NAMES.tilled, line: seeds.length > 0 ? 'Plant a seed, then water it.' : `No seeds for ${SEASON_NAMES[dateOf(save.calendar.day).season]}.`, actions: seeds }
  }
  const name = itemNameOf(tile.crop)
  if (tile.ready) return { ...base, title: name, line: 'Ripe: harvest it.', actions: [{ kind: 'harvest' }] }
  const stages = stagesOf(tile.crop, tile.regrowing)
  const grown = `${tile.growth} of ${plural(stages, 'night')}${tile.regrowing ? ', regrowing' : ''}`
  const withers = withersTonight(save, tile)
  return {
    ...base, title: name, withers,
    line: tile.watered ? `${grown} · watered: it grows tonight` : `${grown} · dry: water it to grow tonight`,
    actions: tile.watered ? [] : [{ kind: 'water' }],
  }
}

/** The words for a tile on its plot's page, for VoiceOver: "Row 1, tile 2: Carrot, ripe". */
export function tileLabel(save: Pick<FarmSave, 'fields' | 'items' | 'calendar'>, index: number): string {
  const view = tileView(save, index)
  const tile = tileAt(save, index)
  const state = tile.crop === null ? '' : tile.ready ? ', ripe' : tile.watered ? ', watered' : ', dry'
  return `${view.where}: ${view.title}${state}`
}
/** A tile's place in words with its plot, once the farm has more than one: "Plot 2 · Row 1, tile 2". */
export const tileWhere = (save: Pick<FarmSave, 'fields'>, view: Pick<TileView, 'plot' | 'where'>): string =>
  save.fields.plots.length > 1 ? `${plotName(view.plot)} · ${view.where}` : view.where

/** The field's counts at a glance, the ones that aren't 0: "6 to water", "2 ripe", "3 to plant". */
export function countsWords(counts: FieldCounts): string[] {
  return [
    ...(counts.water > 0 ? [`${counts.water} to water`] : []), ...(counts.ripe > 0 ? [`${counts.ripe} ripe`] : []),
    ...(counts.plant > 0 ? [`${counts.plant} to plant`] : []),
  ]
}

/** An area or a spot as the woods' and the pond's panels show it: its name, the season's finds, and what holds it
 * back. */
export interface ReachRow {
  id: string
  name: string
  /** The season's finds, most likely first: "Pine Log, Button Mushroom, Birch Log …". */
  finds: string[]
  lock: string | null
}

/** The woods' areas or the pond's spots, each with its season's finds and its lock. */
export function reachRows(save: Pick<FarmSave, 'farm' | 'buildings' | 'calendar'>, place: GatherPlace): ReachRow[] {
  return reachList(save, place).map((r) => ({
    id: r.id, name: r.name.charAt(0).toUpperCase() + r.name.slice(1), lock: r.lock,
    finds: sharesOn(place, r.id, save.calendar.day).map(([id]) => id),
  }))
}

/** A station's panel: its load today, or what it can take now, each at most a load. */
export interface StationView {
  load: { item: string; count: number } | null
  options: (StationOption & { most: number })[]
}

export function stationView(save: Pick<FarmSave, 'items' | 'loads'>, station: StationId): StationView {
  const load = save.loads[station] ?? null
  return { load, options: load ? [] : stationOptions(save, station).map((o) => ({ ...o, most: Math.min(o.held, LOAD_SIZE) })) }
}
