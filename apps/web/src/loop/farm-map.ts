// The farm map as data: where each of the 24 places on the map stands, and why one is locked. The
// map is uma-kit's Hub, eight rows of three laid on its tile grid, taller than a phone's screen, so it scrolls.
import { FARM_MAP_ROWS, farmRankOf, placeBuilt, placeOpen, type FarmPlace, type FarmPlaceId, type PlaceOpens, type FarmSave } from '@farm/domain'
// The bench's state is read straight from the save here (`buildings.forge`), so the map's light
// module never pulls the bench's rules.
import type { PlaceAt } from '@luismlorenzana/uma-kit/hub'

/** The places whose screens have landed, each with where a tap on it goes: the bin and shop (their sheets
 * over the farm) and Warehouse; the Fields (their quick look, which opens `/fields`); the forest, Fishery and three
 * stations (their quick looks, which open their pages); the Dorm (its page), the Gate (its quick look, the visitor
 * waiting) and the Dock (its quick look, with the Boat to build). Until then a place shows "Soon". */
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
  ['dock', '/?peek=dock'],
])

/** Where a tap on a place goes: its screen once it's open and landed, else its quick look. The Forge's ring bench
 * opens in its quick look. */
export function placeLink(save: Pick<FarmSave, 'farm' | 'buildings' | 'roster'>, place: FarmPlace, screens: ReadonlyMap<FarmPlaceId, string> = PLACE_SCREENS): string {
  return lockOf(save, place, screens) === null ? screens.get(place.id) ?? `/?peek=${place.id}` : `/?peek=${place.id}`
}

/** Tiles above the first row's ground line, and between rows: a building, its pips' arch and its name pill each fit. */
const TOP_TILES = 3
const ROW_TILES = 4
/** A map's height in tiles for its rows, with room under the last for its name and the help button beside it. */
export const mapTilesFor = (rows: number): number => TOP_TILES + (rows - 1) * ROW_TILES + 5
/** The map's height in tiles: the eight rows (36 × 24 px on a phone). The homestead's rows add to it. */
export const FARM_MAP_TILES = mapTilesFor(FARM_MAP_ROWS)
const COLUMNS = [0.2, 0.5, 0.8] as const

/** Where a place stands, as fractions of the map: its column, and its row's ground line in the middle of a tile. */
export const placeAt = (place: Pick<FarmPlace, 'row' | 'col'>, tiles: number = FARM_MAP_TILES): PlaceAt => ({
  x: COLUMNS[place.col]!, y: (TOP_TILES + (place.row - 1) * ROW_TILES + 0.5) / tiles,
})

const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
/** What opens a place, in its quick look's words. */
export function opensWords(opens: PlaceOpens): string {
  switch (opens.by) {
    case 'start': return 'Day 1'
    case 'farm-rank': case 'build': return `Farm Rank ${opens.rank}`
    case 'met': return `${opens.umas} Umas met`
    case 'later': return 'Soon'
    case 'house': return `your ${ORDINALS[opens.n] ?? `${opens.n}th`} wedding`
  }
}

/** The Forge's lock before its bench: it opens with the first Romance 8. */
export const BENCH_LOCK = 'your first Romance 8'
/** A place whose game isn't built yet: it shows what it'll be, and can't be bought. */
export const NOT_BUILT_YET = 'Not built yet'
/** A place offered at the farm's rank, not built: its quick look offers Build. */
export const NOT_BUILT = 'Not built'

/** Why a place is locked on this save, or null when it's open. A place you build: built tonight, its game not built yet,
 * its Farm Rank, or not built (its quick look offers Build); once it stands, whether its screen has landed. Any other:
 * its rule, then its screen. The Forge opens as the ring bench once `buildings.forge` is set, and before that waits for
 * the first Romance 8. */
export function lockOf(save: Pick<FarmSave, 'farm' | 'buildings' | 'roster'>, place: FarmPlace,
  screens: ReadonlyMap<FarmPlaceId, unknown> | ReadonlySet<FarmPlaceId> = PLACE_SCREENS): string | null {
  if (place.id === 'forge') return save.buildings.forge !== undefined ? null : BENCH_LOCK
  const opens = place.opens
  if (opens.by === 'build' && !placeBuilt(save, place.id)) {
    if (save.farm.builds.includes(place.id)) return 'Builds tonight'
    if (!opens.game) return NOT_BUILT_YET
    return farmRankOf(save.farm.points) < opens.rank ? opensWords(opens) : NOT_BUILT
  }
  if (!placeOpen(save, place)) return opensWords(opens)
  return screens.has(place.id) ? null : 'Soon'
}
