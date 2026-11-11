// The farm map's places (F18 decision 5; core-loop FC28, hd2d-farm FR5–FR7, core spec CS3, CS19): uma-kit's Hub map in
// eight rows of three, gathering and its station and the ranch or a workshop on the first five, then the yard and the
// town edge. One source for the map, its quick looks and the menu. Where each stands on the screen is the app's; what
// opens each is CS3's, read from the save. Until a place's packet lands, the app shows it locked (F19–F23 wire them up).
import type { SaveV3 } from '../save/v3'
import { farmRankOf } from './farm'
import type { FarmSave } from '../save/v4'

export const FARM_PLACE_IDS = [
  'fields', 'mill', 'coop',
  'forest', 'sawmill', 'barn',
  'fishery', 'smokehouse', 'kitchen',
  'mine', 'smelter', 'restaurant',
  'quarry', 'cutter', 'forge',
  'bin', 'warehouse', 'dorm',
  'board', 'gate',
  'shop', 'festival', 'expeditions',
] as const
export type FarmPlaceId = typeof FARM_PLACE_IDS[number]
export const isFarmPlaceId = (id: string): id is FarmPlaceId => (FARM_PLACE_IDS as readonly string[]).includes(id)

/** FC28's rows, by what a place is. */
export type FarmPlaceGroup = 'gathering' | 'station' | 'ranch' | 'workshop' | 'yard' | 'town'

/** What opens a place (CS3): open from day 1, a chapter's opening, a chapter's reward (the Mill's plans), a Farm Rank, or a
 * later milestone (the board and the festivals, M6). */
export type PlaceOpens =
  | { by: 'start' }
  | { by: 'chapter'; chapter: number }
  | { by: 'reward'; chapter: number }
  | { by: 'farm-rank'; rank: number }
  | { by: 'later' }

export interface FarmPlace {
  id: FarmPlaceId
  name: string
  group: FarmPlaceGroup
  /** Its row on the map, 1–8, and its column, 0–2. */
  row: number
  col: number
  /** uma-art's building (CS19), or one it borrows until its own ships (F29, F38); F25's Dorm and shipping bin are uma-art
   * 2.25.0's, pinned from F49. */
  frame: string
  borrowed: boolean
  /** One short line for its quick look. */
  blurb: string
  opens: PlaceOpens
}

const START: PlaceOpens = { by: 'start' }
const chapter = (n: number): PlaceOpens => ({ by: 'chapter', chapter: n })

const place = (id: FarmPlaceId, name: string, group: FarmPlaceGroup, row: number, col: number, frame: string, blurb: string, opens: PlaceOpens,
  borrowed = false): FarmPlace => ({ id, name, group, row, col, frame, borrowed, blurb, opens })

/** The 23 places in map order: rows top to bottom, columns left to right. */
export const FARM_PLACES: readonly FarmPlace[] = [
  place('fields', 'Fields', 'gathering', 1, 0, 'vegetable-garden', 'Plant, tend and harvest crops.', START),
  place('mill', 'Mill', 'station', 1, 1, 'fields-workbench', 'Grain into flour, fruit into preserves.', { by: 'reward', chapter: 1 }),
  place('coop', 'Coop', 'ranch', 1, 2, 'meadow', 'Chickens and ducks, for eggs.', chapter(2), true),
  place('forest', 'Forest', 'gathering', 2, 0, 'forest', 'Wood, mushrooms, herbs and the season’s finds.', START),
  place('sawmill', 'Sawmill', 'station', 2, 1, 'forest-workbench', 'Logs into planks; herbs and mushrooms dried.', { by: 'farm-rank', rank: 3 }),
  place('barn', 'Barn', 'ranch', 2, 2, 'stable', 'Cows, goats and sheep, for milk and wool.', chapter(2)),
  place('fishery', 'Fishery', 'gathering', 3, 0, 'fishery', 'Fish by the season.', START),
  place('smokehouse', 'Smokehouse', 'station', 3, 1, 'fishery-workbench', 'Fish into fillets.', { by: 'farm-rank', rank: 3 }),
  place('kitchen', 'Kitchen', 'workshop', 3, 2, 'kitchen', 'Dishes, and the staff meal.', chapter(4)),
  place('mine', 'Mine', 'gathering', 4, 0, 'mine', 'Ore, floor by floor.', chapter(3)),
  place('smelter', 'Smelter', 'station', 4, 1, 'mine-workbench', 'Ore into ingots.', chapter(3)),
  place('restaurant', 'Restaurant', 'workshop', 4, 2, 'party-hall', 'Dishes served for gold and tips.', chapter(6)),
  place('quarry', 'Quarry', 'gathering', 5, 0, 'quarry', 'Stone and gems, floor by floor.', chapter(3)),
  place('cutter', 'Cutter', 'station', 5, 1, 'den-workbench', 'Gems cut and polished.', chapter(3)),
  place('forge', 'Forge', 'workshop', 5, 2, 'forge', 'Tools, rings and fittings.', chapter(7)),
  place('bin', 'Shipping bin', 'yard', 6, 0, 'shipping-bin', 'What goes in pays tonight.', START),
  place('warehouse', 'Warehouse', 'yard', 6, 1, 'warehouse', 'Everything the farm holds, by stars.', START),
  place('dorm', 'Dorm', 'yard', 6, 2, 'dorm', 'Beds for the Umas on the farm.', START),
  place('board', 'Requests board', 'yard', 7, 0, 'card-library', 'The town’s requests.', { by: 'later' }, true),
  place('gate', 'Gate', 'yard', 7, 1, 'scenario-gate', 'Visitors come in here.', START),
  place('shop', 'Shop', 'town', 8, 0, 'exchange', 'Seeds for the season.', START),
  place('festival', 'Festival ground', 'town', 8, 1, 'racecourse', 'A festival on each season’s 10th day.', { by: 'later' }),
  place('expeditions', 'Expedition post', 'town', 8, 2, 'rangers-lodge', 'Parties out for days.', chapter(5), true),
]

/** The map's rows (FC28). */
export const FARM_MAP_ROWS = 8

const BY_ID = new Map(FARM_PLACES.map((p) => [p.id, p]))
export const farmPlace = (id: string | null | undefined): FarmPlace | undefined => (id ? BY_ID.get(id as FarmPlaceId) : undefined)

/** A place's blurb on a save's version: on v4 the Gate is where the cast walks in (F46 decision 14), not where visitors
 * wait. */
export const placeBlurb = (place: Pick<FarmPlace, 'id' | 'blurb'>, version: number): string => (version >= 4 && place.id === 'gate' ? 'Umas arrive here.' : place.blurb)

/** Whether a place's rule has opened it on this save (CS3): a chapter once it starts, the Mill once chapter 1 is done, a
 * Farm Rank once reached. The board and the festival ground wait for M6. */
export const placeOpen = (save: Pick<FarmSave, 'farm'>, place: FarmPlace): boolean => opened(save, place.opens)

/** Whether what opens something has happened on this save: a place, or a line in the shop (F19). */
export function opened(save: Pick<FarmSave, 'farm'>, opens: PlaceOpens): boolean {
  switch (opens.by) {
    case 'start': return true
    case 'chapter': return save.farm.chapter >= opens.chapter
    case 'reward': return save.farm.chapter > opens.chapter
    case 'farm-rank': return farmRankOf(save.farm.points) >= opens.rank
    case 'later': return false
  }
}
