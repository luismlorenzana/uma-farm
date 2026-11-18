// The farm's words: a tile as its panel shows it (what's on it, how far it's grown, and the one action it takes next), the
// field's counts at a glance (the farm map's sign, a plot's page), the woods' and the pond's areas and spots with their
// season's finds and how thin each is today, and a station's level and loads. Pure, so the panels and the tests read the
// same.
import {
  CLEAR_FINDS, cropLook, dateOf, DAYS_PER_SEASON, FIELD_COLUMNS, FULL_HAULS, GROUND_NAMES, growsIn, haulsToday, isOvergrown, isSeasonEnd, itemNameOf, levelLock, levelLockWords,
  LOAD_SIZE, loadsADay, loadsLeft, loadsToday, nextStationLevel, nightsLeft, plotName, stationLevel, thinToday, type StationLoad,
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
      kind: 'plant', seed: s.id, name: s.grade ? `Carrot G${s.grade}` : itemNameOf(s.crop), count: s.count, own: s.own, stages: stagesOf(s.crop, false),
      late: stagesOf(s.crop, false) > daysLeft && !growsIn(s.crop, next),
    }))
    return { ...base, title: GROUND_NAMES.tilled, line: seeds.length > 0 ? 'Plant a seed, then water it.' : `No seeds for ${SEASON_NAMES[dateOf(save.calendar.day).season]}.`, actions: seeds }
  }
  const name = tile.grade ? `Carrot G${tile.grade}` : itemNameOf(tile.crop)
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

/** An area or a spot as the woods' and the pond's panels show it: its name, the season's finds, what holds it back, and
 * how it stands today (its full hauls left, or thin). */
export interface ReachRow {
  id: string
  name: string
  /** The season's finds, most likely first: "Pine Log, Button Mushroom, Birch Log …". */
  finds: string[]
  lock: string | null
  /** Its hauls today, the farmer's and the farmhands' (the night's come after the day). */
  hauls: number
  /** Its four full hauls taken today: half hauls from here. */
  thin: boolean
}

/** The woods' areas or the pond's spots, each with its season's finds, its lock and today's hauls. */
export function reachRows(save: Pick<FarmSave, 'farm' | 'buildings' | 'calendar' | 'today'>, place: GatherPlace): ReachRow[] {
  return reachList(save, place).map((r) => ({
    id: r.id, name: r.name.charAt(0).toUpperCase() + r.name.slice(1), lock: r.lock,
    finds: sharesOn(place, r.id, save.calendar.day).map(([id]) => id), hauls: haulsToday(save, r.id), thin: thinToday(save, r.id),
  }))
}

/** A place's day in words: "Thin · half hauls" (a dig's "half finds") once its four full hauls are taken; "3 full hauls
 * left" once one is; null before any. */
export function thinWords(hauls: number, noun = 'haul'): string | null {
  if (hauls >= FULL_HAULS) return `Thin · half ${noun === 'face' ? 'finds' : 'hauls'}`
  const left = FULL_HAULS - hauls
  return hauls > 0 ? `${plural(left, `full ${noun}`)} left` : null
}

/** A station's panel: its level and the loads it takes a day, today's loads, what it can take now (while it takes
 * more), each at most a load, and its next level. */
export interface StationView {
  level: number
  /** The loads it takes a day, at its level. */
  perDay: number
  loads: StationLoad[]
  options: (StationOption & { most: number })[]
  /** Its next level, with what stands in the way in words ("Opens at Farm Rank 4", "Need 400g more", "Level 3 tomorrow"),
   * or null at its top. */
  next: { level: number; loads: number; cost: number; lock: string | null } | null
}

export function stationView(save: Pick<FarmSave, 'items' | 'loads' | 'buildings' | 'farm' | 'gold'>, station: StationId): StationView {
  const loads = loadsToday(save, station)
  const left = loadsLeft(save, station)
  const next = nextStationLevel(save, station)
  const lock = levelLock(save, station)
  return {
    level: stationLevel(save, station), perDay: loadsADay(save, station), loads,
    options: left > 0 ? stationOptions(save, station).map((o) => ({ ...o, most: Math.min(o.held, LOAD_SIZE) })) : [],
    // A level bought today is the one shown, coming tomorrow; else the next to buy.
    next: lock?.by === 'tonight' ? { level: lock.level, loads: lock.level, cost: 0, lock: 'Ready tomorrow' }
      : next ? { level: next.level, loads: next.loads, cost: next.cost, lock: levelLockWords(lock) } : null,
  }
}
