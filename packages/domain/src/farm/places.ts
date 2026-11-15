// The farm map's places: uma-kit's Hub map in rows of three, gathering and its station and the ranch or a workshop on
// the first five, then the yard, the town edge and, below it in the middle, the Town. One source for the map, its quick
// looks and the menu.
// Where each stands on the screen is the app's; what opens each is its rule's, read from the save. Until a place's
// screen lands, the app shows it locked.
//
// **The farm grows by building.** Day 1's places stand from the start; every other working place is offered at a Farm
// Rank and built with gold and the farm's own goods, standing the next morning (`farm/builds.ts`). The Requests board
// opens with the Umas you've met. A place whose game isn't built yet shows what it'll be, "Not built yet", and can't be
// bought.
import { farmRankOf } from './farm'
import type { GoodsFamily } from '../goods/ids'
import type { BuildingId, FarmSave } from '../save/v4'

export const FARM_PLACE_IDS = [
  'fields', 'mill', 'coop',
  'forest', 'sawmill', 'barn',
  'fishery', 'smokehouse', 'kitchen',
  'mine', 'smelter', 'restaurant',
  'quarry', 'cutter', 'forge',
  'bin', 'warehouse', 'dorm',
  'board', 'gate', 'dock',
  'shop', 'festival', 'expeditions',
  'town',
  'boat',
] as const
export type FarmPlaceId = typeof FARM_PLACE_IDS[number]

/** The rows, by what a place is. */
export type FarmPlaceGroup = 'gathering' | 'station' | 'ranch' | 'workshop' | 'yard' | 'town'

/** Goods a build takes: so many of a family's raw or refined goods, any grade, any stars ("40 planks"). */
export interface BuildGoods {
  readonly family: GoodsFamily
  readonly refined: boolean
  readonly count: number
}
/** What a build costs: gold, and the farm's own goods. */
export interface BuildCost {
  readonly gold: number
  readonly goods: readonly BuildGoods[]
}

/** What opens a place (or a block, a seed or a lot): open from day 1, a Farm Rank, a build the Farm Rank offers, the
 * Umas met, a later milestone (the festivals), or a house's wedding. */
export type PlaceOpens =
  | { by: 'start' }
  | { by: 'farm-rank'; rank: number }
  /** Offered at Farm Rank `rank`, paid in gold and goods, standing the next morning. `game`: its game is built, so it can
   * be bought; else it shows "Not built yet". `after`: another place stands first (the boat after the dock). */
  | { by: 'build'; rank: number; cost: BuildCost; game: boolean; after?: FarmPlaceId }
  /** So many Umas met: on the roster today, on the farm or in town. */
  | { by: 'met'; umas: number }
  | { by: 'later' }
  /** A house on the homestead: house *n* with the *n*-th wedding. The homestead's own rule reads it (`nextLot`);
   * `opened` never does. */
  | { by: 'house'; n: number }

export interface FarmPlace {
  id: FarmPlaceId
  name: string
  group: FarmPlaceGroup
  /** Its row on the map, 1–8, and its column, 0–2. */
  row: number
  col: number
  /** uma-art's building, or one it borrows until its own ships; the Dorm and shipping bin are uma-art
   * 2.25.0's. */
  frame: string
  borrowed: boolean
  /** One short line for its quick look. */
  blurb: string
  opens: PlaceOpens
  /** Built at another place's lot and drawn there, never on its own: the boat, moored at the dock. */
  on?: FarmPlaceId
}

const START: PlaceOpens = { by: 'start' }
const goods = (family: GoodsFamily, refined: boolean, count: number): BuildGoods => ({ family, refined, count })
const logs = (n: number) => goods('woods', false, n)
const planks = (n: number) => goods('woods', true, n)
const fish = (n: number) => goods('fish', false, n)
const fillets = (n: number) => goods('fish', true, n)
const vegetables = (n: number) => goods('vegetables', false, n)
/** A build: its Farm Rank, its gold and goods, and whether its game is built. */
const build = (rank: number, gold: number, list: readonly BuildGoods[], game: boolean, after?: FarmPlaceId): PlaceOpens =>
  ({ by: 'build', rank, cost: { gold, goods: list }, game, ...(after ? { after } : {}) })

const place = (id: FarmPlaceId, name: string, group: FarmPlaceGroup, row: number, col: number, frame: string, blurb: string, opens: PlaceOpens,
  borrowed = false, on?: FarmPlaceId): FarmPlace => ({ id, name, group, row, col, frame, borrowed, blurb, opens, ...(on ? { on } : {}) })

/** The 26 places in map order: rows top to bottom, columns left to right, then the boat, drawn at the dock. The builds'
 * costs are tuned by the pacing's simulation (`pacing.test.ts`): the farm's own goods (logs, planks, fish, fillets,
 * vegetables) and gold, each affordable within about a season of its offer. */
export const FARM_PLACES: readonly FarmPlace[] = [
  place('fields', 'Fields', 'gathering', 1, 0, 'vegetable-garden', 'Plant, tend and harvest crops.', START),
  place('mill', 'Mill', 'station', 1, 1, 'fields-workbench', 'Grain into flour, fruit into preserves.', build(1, 1000, [logs(20)], true)),
  place('coop', 'Coop', 'ranch', 1, 2, 'meadow', 'Chickens and ducks, for eggs; the silo beside it.', build(2, 2000, [logs(30), vegetables(20)], true), true),
  place('forest', 'Forest', 'gathering', 2, 0, 'forest', 'Wood, mushrooms, herbs and the season’s finds.', START),
  place('sawmill', 'Sawmill', 'station', 2, 1, 'forest-workbench', 'Logs into planks; herbs and mushrooms dried.', build(3, 1500, [logs(40)], true)),
  place('barn', 'Barn', 'ranch', 2, 2, 'stable', 'Cows, goats, sheep and alpacas, for milk, wool and fleece.', build(3, 3500, [logs(30), vegetables(20)], true)),
  place('fishery', 'Fishery', 'gathering', 3, 0, 'fishery', 'Fish by the season.', START),
  place('smokehouse', 'Smokehouse', 'station', 3, 1, 'fishery-workbench', 'Fish into fillets.', build(3, 2000, [logs(30), fish(20)], true)),
  place('kitchen', 'Kitchen', 'workshop', 3, 2, 'kitchen', 'Dishes, and the staff meal.', build(3, 3000, [logs(40), vegetables(20)], true)),
  place('mine', 'Mine', 'gathering', 4, 0, 'mine', 'Ore, floor by floor.', build(4, 10000, [planks(60)], true)),
  place('smelter', 'Smelter', 'station', 4, 1, 'mine-workbench', 'Ore into ingots.', build(4, 8000, [planks(40), logs(40)], true)),
  place('restaurant', 'Restaurant', 'workshop', 4, 2, 'party-hall', 'Dishes served for gold and tips.', build(7, 40000, [planks(80), fillets(40), vegetables(30)], false)),
  place('quarry', 'Quarry', 'gathering', 5, 0, 'quarry', 'Stone and gems, floor by floor.', build(5, 12000, [planks(50)], true)),
  place('cutter', 'Cutter', 'station', 5, 1, 'den-workbench', 'Gems cut and polished; stone into blocks.', build(5, 10000, [planks(40), logs(40)], true)),
  place('forge', 'Forge', 'workshop', 5, 2, 'forge', 'The ring bench: a ring from three refined goods of one grade, one a day.', build(8, 60000, [planks(120), logs(60)], false)),
  place('bin', 'Shipping bin', 'yard', 6, 0, 'shipping-bin', 'What goes in pays tonight.', START),
  place('warehouse', 'Warehouse', 'yard', 6, 1, 'warehouse', 'Everything the farm holds, by stars.', START),
  place('dorm', 'Dorm', 'yard', 6, 2, 'dorm', 'Beds for the Umas on the farm.', START),
  place('board', 'Requests board', 'yard', 7, 0, 'card-library', 'The town’s requests.', { by: 'met', umas: 5 }, true),
  place('gate', 'Gate', 'yard', 7, 1, 'scenario-gate', 'The farm’s gate. Everyone you meet lives in town.', START),
  place('dock', 'Dock', 'yard', 7, 2, 'ley-spring', 'A pier on the sea: the Sea Pier’s fish.', build(6, 20000, [planks(80)], true), true),
  place('shop', 'Shop', 'town', 8, 0, 'exchange', 'Seeds for the season.', START),
  place('festival', 'Festival ground', 'town', 8, 1, 'racecourse', 'A festival on each season’s 10th day.', { by: 'later' }),
  place('expeditions', 'Expedition post', 'town', 8, 2, 'rangers-lodge', 'Parties out for days.', build(7, 25000, [planks(60), fillets(40)], false), true),
  place('town', 'Town', 'town', 9, 1, 'trophy-hall', 'Who’s out at the town’s spots today, and everyone who lives there.', START, true),
  place('boat', 'Boat', 'yard', 7, 2, 'ley-spring', 'Out past the pier: the Deep Sea’s fish.', build(6, 30000, [planks(60), fillets(30)], true, 'dock'), true, 'dock'),
]

/** The map's rows: the farm's seven, the town edge, and the Town below it, alone in the middle. */
export const FARM_MAP_ROWS = 9
/** The town's first row, the town edge; the homestead's rows come before it, and the town's rows move down with them. */
export const TOWN_FIRST_ROW = 8
/** The places drawn on the map and the stage, each on its own lot: all but the boat, drawn at the dock. */
export const MAP_PLACES: readonly FarmPlace[] = FARM_PLACES.filter((p) => !p.on)

const BY_ID = new Map(FARM_PLACES.map((p) => [p.id, p]))
export const farmPlace = (id: string | null | undefined): FarmPlace | undefined => (id ? BY_ID.get(id as FarmPlaceId) : undefined)

/** A place you build: its id is a building's in the save (`buildings`). */
export type BuildPlace = FarmPlace & { opens: Extract<PlaceOpens, { by: 'build' }> }
export const isBuildPlace = (place: FarmPlace | undefined): place is BuildPlace => place?.opens.by === 'build'
/** The places you build, in map order, the boat last. */
export const BUILD_PLACES: readonly BuildPlace[] = FARM_PLACES.filter(isBuildPlace)

/** Whether a place stands on this save: day 1's always; a build once built (`buildings[id]` 1 or more, set the morning
 * after it's paid). The Forge's building also stands earlier as the ring bench (`buildings.forge` 0), but its merge game
 * is built only at 1. */
export function placeBuilt(save: Pick<FarmSave, 'buildings'>, id: FarmPlaceId): boolean {
  const opens = farmPlace(id)?.opens
  if (!opens) return false
  if (opens.by === 'start') return true
  return opens.by === 'build' && (save.buildings[id as BuildingId] ?? 0) >= 1
}

/** Whether a place's rule has opened it on this save: day 1's, a build once built, the board once enough Umas are met.
 * The festival ground waits for the festivals. */
export const placeOpen = (save: Pick<FarmSave, 'farm' | 'buildings' | 'roster'>, place: FarmPlace): boolean =>
  place.opens.by === 'build' ? placeBuilt(save, place.id) : opened(save, place.opens)

/** Umas met: everyone on the roster today, on the farm or in town. */
export const umasMet = (save: Pick<FarmSave, 'roster'>): number => Object.keys(save.roster).length

/** Whether what opens something has happened on this save: a block, a line in the shop, the board. A build needs its
 * place (`placeOpen`), so it's never opened here. */
export function opened(save: Pick<FarmSave, 'farm'> & Partial<Pick<FarmSave, 'roster'>>, opens: PlaceOpens): boolean {
  switch (opens.by) {
    case 'start': return true
    case 'farm-rank': return farmRankOf(save.farm.points) >= opens.rank
    case 'met': return umasMet({ roster: save.roster ?? {} }) >= opens.umas
    case 'build': case 'later': case 'house': return false
  }
}
