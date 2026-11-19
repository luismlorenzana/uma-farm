// The farm map as data: a landscape tile map you look across, seven cells tall and wider than the screen, so it scrolls
// sideways. From the left: the woods' edge, the field's sign over the pond's edge, a path, then the farm's places on lots
// of two by two, three to a column (the yard first, the homestead beside it, the stations, the rest), and the road to
// town at the far end. The field itself is its own screen, a plot a page (`/field`); the map shows its sign, a lot's
// size, with its counts. Where a tap goes, and why a place is locked. Pure, so the map and the tests read the same.
import {
  farmRankOf, placeBuilt, placeOpen, type FarmPlace, type FarmPlaceId, type HomesteadPlace, type PlaceOpens, type FarmSave,
} from '@farm/domain'

/** The map's height in cells: three lots of two, and a path's row. */
export const MAP_ROWS = 7
/** A cell, in points: a 44 pt target, a little smaller on a short screen. */
export const CELL = 44
export const MIN_CELL = 40

/** A rectangle on the map, in cells. */
export interface Area {
  col: number
  row: number
  cols: number
  rows: number
}

/** The woods' edge: two columns down the map's left side. */
export const WOODS: Area = { col: 0, row: 0, cols: 2, rows: MAP_ROWS }
/** The field's sign beside the woods, a lot's size: a tap opens the field's screen. */
export const FIELD: Area = { col: 2, row: 0, cols: 2, rows: 2 }
/** The pond's edge: under the field's sign, down to the map's foot. */
export const POND: Area = { col: 2, row: FIELD.rows, cols: 2, rows: MAP_ROWS - FIELD.rows }
/** The first lot column, past a path from the field. */
const LOTS_FROM = FIELD.col + FIELD.cols + 1
/** A lot: two by two. */
const LOT = 2

/** The farm's places by lot column, three to a column, top to bottom: the yard (the bin and the Warehouse: the retired
 * Dorm's lot under them stays open ground), then the stations, the Gate's row, the
 * ranch, the mine's and the quarry's. The homestead's houses take their own columns after the yard. The town's places
 * (the shop, the festival ground, the expedition post, the town itself) are in town, down the road. */
export const LOT_COLUMNS: readonly (readonly FarmPlaceId[])[] = [
  ['bin', 'warehouse'],
  ['mill', 'sawmill', 'smokehouse'],
  ['gate', 'board', 'dock'],
  ['coop', 'barn', 'kitchen'],
  ['mine', 'smelter', 'restaurant'],
  ['quarry', 'cutter', 'forge'],
]

/** A place drawn on a lot: a farm place or a house. */
export type Lot = { kind: 'place'; id: FarmPlaceId; area: Area } | { kind: 'house'; place: HomesteadPlace; area: Area }

/** The lots in order, the homestead's houses (`shown`, three to a column) after the yard, and the road to town after
 * the last. */
export function mapLots(shown: readonly HomesteadPlace[]): { lots: Lot[]; road: Area; cols: number } {
  const houses = Array.from({ length: Math.ceil(shown.length / 3) }, (_, c) => shown.slice(c * 3, c * 3 + 3))
  const columns: ({ kind: 'place'; ids: readonly FarmPlaceId[] } | { kind: 'house'; places: readonly HomesteadPlace[] })[] = [
    { kind: 'place', ids: LOT_COLUMNS[0]! }, ...houses.map((places) => ({ kind: 'house' as const, places })), ...LOT_COLUMNS.slice(1).map((ids) => ({ kind: 'place' as const, ids })),
  ]
  const lots: Lot[] = columns.flatMap((column, c): Lot[] => {
    const col = LOTS_FROM + c * LOT
    return column.kind === 'place'
      ? column.ids.map((id, r) => ({ kind: 'place', id, area: { col, row: r * LOT, cols: LOT, rows: LOT } }))
      : column.places.map((place, r) => ({ kind: 'house', place, area: { col, row: r * LOT, cols: LOT, rows: LOT } }))
  })
  const roadCol = LOTS_FROM + columns.length * LOT
  return { lots, road: { col: roadCol, row: 0, cols: 1, rows: MAP_ROWS }, cols: roadCol + 1 }
}

/** The places whose screens have landed, each with where a tap on it goes: the field (its own screen) and the bin and
 * shop (their sheets over the farm) and the Warehouse; the Kitchen (its sheet); the woods' edge, the pond's edge, the five stations, the Coop and
 * the Barn, the Mine and the Quarry (their menus, in the side panel); the Gate (its quick look, the
 * visitor waiting), the Dock (its quick look, with the Boat to build) and the Town (its screen). Until then a place shows
 * "Soon". */
export const PLACE_SCREENS: ReadonlyMap<FarmPlaceId, string> = new Map<FarmPlaceId, string>([
  ['fields', '/field'],
  ['forest', '/?peek=forest'],
  ['fishery', '/?peek=fishery'],
  ['mill', '/?peek=mill'],
  ['sawmill', '/?peek=sawmill'],
  ['smokehouse', '/?peek=smokehouse'],
  ['smelter', '/?peek=smelter'],
  ['cutter', '/?peek=cutter'],
  ['coop', '/?peek=coop'],
  ['barn', '/?peek=barn'],
  ['mine', '/?peek=mine'],
  ['quarry', '/?peek=quarry'],
  ['kitchen', '/?sheet=kitchen'],
  ['restaurant', '/?sheet=restaurant'],
  ['bin', '/?sheet=bin'],
  ['shop', '/?sheet=shop'],
  ['festival', '/?sheet=festival'],
  ['warehouse', '/warehouse'],
  ['gate', '/?peek=gate'],
  ['dock', '/?peek=dock'],
  ['town', '/town'],
  ['expeditions', '/town?at=expeditions&sheet=expeditions'],
])

/** Where a tap on a place goes: its screen once it's open and landed, else its quick look. The Forge's ring bench
 * opens in its quick look. */
export function placeLink(save: Pick<FarmSave, 'farm' | 'buildings' | 'roster'>, place: FarmPlace, screens: ReadonlyMap<FarmPlaceId, string> = PLACE_SCREENS): string {
  if (place.id === 'expeditions' && (farmRankOf(save.farm.points) >= 7 || placeBuilt(save, 'expeditions'))) return '/town?at=expeditions&sheet=expeditions'
  return lockOf(save, place, screens) === null ? screens.get(place.id) ?? `/?peek=${place.id}` : `/?peek=${place.id}`
}

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
