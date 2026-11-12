// The farm map as data (F18 decision 5; FC28, FR5–FR7): where each of the 23 places stands, and why one is locked. The
// map is uma-kit's Hub, eight rows of three laid on its tile grid, taller than a phone's screen, so it scrolls.
import { FARM_MAP_ROWS, isStation, placeOpen, type FarmPlace, type FarmPlaceId, type PlaceOpens, type FarmSave } from '@farm/domain'
// The bench's state is read straight from the save here (`buildings.forge` on v4, F53 decision 3), so the map's light
// module never pulls the bench's rules.
import type { PlaceAt } from '@luismlorenzana/uma-kit/hub'

/** The places whose screens have landed (decision 5), each with where a tap on it goes: F19's bin and shop (their sheets
 * over the farm) and Warehouse; F20's Fields (their quick look, which opens `/fields`); F22's forest, Fishery and three
 * stations (their quick looks, which open their pages); F23's Dorm (its page) and Gate (its quick look, the visitor
 * waiting). Until then a place shows "Soon". */
export const PLACE_SCREENS: ReadonlyMap<FarmPlaceId, string> = new Map<FarmPlaceId, string>([
  ['fields', '/?peek=fields'],
  ['forest', '/?peek=forest'],
  ['fishery', '/?peek=fishery'],
  ['mill', '/?peek=mill'],
  ['sawmill', '/?peek=sawmill'],
  ['smokehouse', '/?peek=smokehouse'],
  ['bin', '/?sheet=bin'],
  ['shop', '/?sheet=shop'],
  ['warehouse', '/warehouse'],
  ['dorm', '/dorm'],
  ['gate', '/?peek=gate'],
])

/** Where a tap on a place goes: its screen once it's open and landed, else its quick look. On v4 the Forge's ring bench
 * opens in its quick look (F53 decision 3). */
export function placeLink(save: Pick<FarmSave, 'farm' | 'buildings' | 'version'>, place: FarmPlace, screens: ReadonlyMap<FarmPlaceId, string> = PLACE_SCREENS): string {
  return lockOf(save, place, screens) === null ? screens.get(place.id) ?? `/?peek=${place.id}` : `/?peek=${place.id}`
}

/** Tiles above the first row's ground line, and between rows: a building, its pips' arch and its name pill each fit. */
const TOP_TILES = 3
const ROW_TILES = 4
/** A map's height in tiles for its rows, with room under the last for its name and the help button beside it. */
export const mapTilesFor = (rows: number): number => TOP_TILES + (rows - 1) * ROW_TILES + 5
/** The map's height in tiles: the eight rows (36 × 24 px on a phone). On v4 the homestead's rows add to it (F54). */
export const FARM_MAP_TILES = mapTilesFor(FARM_MAP_ROWS)
const COLUMNS = [0.2, 0.5, 0.8] as const

/** Where a place stands, as fractions of the map: its column, and its row's ground line in the middle of a tile. */
export const placeAt = (place: Pick<FarmPlace, 'row' | 'col'>, tiles: number = FARM_MAP_TILES): PlaceAt => ({
  x: COLUMNS[place.col]!, y: (TOP_TILES + (place.row - 1) * ROW_TILES + 0.5) / tiles,
})

/** What opens a place, in its quick look's words. */
export function opensWords(opens: PlaceOpens): string {
  switch (opens.by) {
    case 'start': return 'Day 1'
    case 'chapter': return `Chapter ${opens.chapter}`
    case 'reward': return `Chapter ${opens.chapter}’s reward`
    case 'farm-rank': return `Farm Rank ${opens.rank}`
    case 'later': return 'Soon'
    case 'house': return opens.n === 1 ? 'your first wedding' : `House ${opens.n - 1}`
  }
}

/** The Forge's lock on v4 before its bench (F53 decision 3; RM40): it opens with the first Romance 8, not chapter 7. */
export const BENCH_LOCK = 'your first Romance 8'

/** Why a place is locked on this save, or null when it's open: CS3's rule first, then a station not built yet (F22
 * decision 5: its quick look offers Build), then whether its screen has landed. On v4 (F53 decision 3) the Forge opens
 * as the ring bench once `buildings.forge` is set, and before that waits for the first Romance 8; v3's Forge is M4's. */
export function lockOf(save: Pick<FarmSave, 'farm' | 'buildings'> & Partial<Pick<FarmSave, 'version'>>, place: FarmPlace,
  screens: ReadonlyMap<FarmPlaceId, unknown> | ReadonlySet<FarmPlaceId> = PLACE_SCREENS): string | null {
  if (place.id === 'forge' && save.version === 4) return save.buildings.forge !== undefined ? null : BENCH_LOCK
  if (!placeOpen(save, place)) return opensWords(place.opens)
  if (isStation(place.id) && (save.buildings[place.id] ?? -1) < 1) return 'Not built'
  return screens.has(place.id) ? null : 'Soon'
}
