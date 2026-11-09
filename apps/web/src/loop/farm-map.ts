// The farm map as data (F18 decision 5; FC28, FR5–FR7): where each of the 23 places stands, and why one is locked. The
// map is uma-kit's Hub, eight rows of three laid on its tile grid, taller than a phone's screen, so it scrolls.
import { FARM_MAP_ROWS, isStation, placeOpen, type FarmPlace, type FarmPlaceId, type PlaceOpens, type SaveV3 } from '@farm/domain'
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

/** Where a tap on a place goes: its screen once it's open and landed, else its quick look. */
export function placeLink(save: Pick<SaveV3, 'farm' | 'buildings'>, place: FarmPlace, screens: ReadonlyMap<FarmPlaceId, string> = PLACE_SCREENS): string {
  return lockOf(save, place, screens) === null ? screens.get(place.id)! : `/?peek=${place.id}`
}

/** Tiles above the first row's ground line, and between rows: a building, its pips' arch and its name pill each fit. */
const TOP_TILES = 3
const ROW_TILES = 4
/** The map's height in tiles: the eight rows, and room under the last for its name and the help button beside it
 * (36 × 24 px on a phone). */
export const FARM_MAP_TILES = TOP_TILES + (FARM_MAP_ROWS - 1) * ROW_TILES + 5
const COLUMNS = [0.2, 0.5, 0.8] as const

/** Where a place stands, as fractions of the map: its column, and its row's ground line in the middle of a tile. */
export const placeAt = (place: Pick<FarmPlace, 'row' | 'col'>): PlaceAt => ({
  x: COLUMNS[place.col]!, y: (TOP_TILES + (place.row - 1) * ROW_TILES + 0.5) / FARM_MAP_TILES,
})

/** What opens a place, in its quick look's words. */
export function opensWords(opens: PlaceOpens): string {
  switch (opens.by) {
    case 'start': return 'Day 1'
    case 'chapter': return `Chapter ${opens.chapter}`
    case 'reward': return `Chapter ${opens.chapter}’s reward`
    case 'farm-rank': return `Farm Rank ${opens.rank}`
    case 'later': return 'Soon'
  }
}

/** Why a place is locked on this save, or null when it's open: CS3's rule first, then a station not built yet (F22
 * decision 5: its quick look offers Build), then whether its screen has landed. */
export function lockOf(save: Pick<SaveV3, 'farm' | 'buildings'>, place: FarmPlace, screens: ReadonlyMap<FarmPlaceId, unknown> | ReadonlySet<FarmPlaceId> = PLACE_SCREENS): string | null {
  if (!placeOpen(save, place)) return opensWords(place.opens)
  if (isStation(place.id) && (save.buildings[place.id] ?? -1) < 1) return 'Not built'
  return screens.has(place.id) ? null : 'Soon'
}
