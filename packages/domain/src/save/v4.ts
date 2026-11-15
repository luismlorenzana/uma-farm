// Save v5: the farm's one save. Every farm starts on it, and any older save the app meets (v1 to v4) starts over as a
// fresh v5 (`freshV5`), its `account` copied whole, so `updatedAt` moves only with the player's first change (the
// farmer's name). The new farm is made in the app, never in `parseSave`: the API reads an older save's version and account
// only, and never makes a save. v5 is v4 with the fields as tiles the farmer works by hand, a day of actions, and the
// stations' loads; the Umas' work rows and the Fields' blocks are gone. It grows in place while the game is being built:
// the ranch's animals and silo and the digs' floors read an older shape leniently (`parseRanch`, `parseDig`).
//
// The module keeps its name, and the type its old name as an alias (`SaveV4`), so the code that reads the save didn't
// move with the version.
//
// The field is a list of plots, each 8 × 5 tiles (`fields.plots`): the farm starts with one and clears more as it grows
// (`fields/plots.ts`). A save from before plots holds one field's tiles (`fields.tiles`) and reads as plot 1, exactly as
// it was (`parseFields`), so nothing moves and `updatedAt` stays where it was.
//
// The roster, the Dorm, work, bonds, `love`, `today`, `memories` and `arrivals` are keyed by character id. Her outfit is
// a lookup in the story pack (`outfitOf`, `story/pack.ts`).
import { DAYS_PER_YEAR } from '../farm/calendar'
import { draw } from '../farm/draw'
import { START_GOLD, START_SEEDS } from '../farm/farm'
import type { FarmPlaceId } from '../farm/places'
import { ACTIVITIES, type Activity, type Rank } from '../farm/ranks'
import type { FishingSpotId, ForestAreaId, StationId } from '../gathering/ids'
import { seedId, type CropId } from '../goods/ids'
import type { MorningSummary } from '../night/summary'
import type { Account, OlderSave } from './save'

/** A master outfit id: the look a character id plays (`outfitOf`). Older rules still name roster ids with it. */
export type OutfitId = string

/** A Warehouse row: counts by ★1 … ★5. */
export type StarCounts = [number, number, number, number, number]
/** The Warehouse (or the bin): a row of star counts per good or seed id. */
export type Warehouse = Record<string, StarCounts>

/** Her standing in one activity: points, her rank (0 Novice … 5 Legend) and her count toward the next rank's challenge.
 **/
export interface RankState {
  points: number
  rank: Rank
  challenge: number
}

/** A swap at the Dorm, arriving the next morning. */
export interface DormSwap {
  out: OutfitId
  in: OutfitId
}

// --- The field: plots of tiles ------------------------------------------------------------------------------------

/** A plot's grid: 8 tiles across, 5 down, numbered row by row from the top left. Every plot is one. */
export const FIELD_COLUMNS = 8
export const FIELD_ROWS = 5
export const FIELD_TILES = FIELD_COLUMNS * FIELD_ROWS
/** The most plots the save holds: the plots the rules open (`fields/plots.ts`'s `FIELD_PLOTS`): eight. */
export const MAX_PLOTS = 8
/** The most tiles the field holds, every plot's. */
export const MAX_FIELD_TILES = MAX_PLOTS * FIELD_TILES
/** What covers a tile: weeds, a stone or a stump to clear, cleared ground, or tilled soil. */
export const GROUNDS = ['weeds', 'stone', 'stump', 'clear', 'tilled'] as const
export type Ground = typeof GROUNDS[number]
/** The three things a tile can be overgrown with. */
export const OVERGROWN = ['weeds', 'stone', 'stump'] as const
export type Overgrowth = typeof OVERGROWN[number]
export const isOvergrown = (ground: Ground): ground is Overgrowth => (OVERGROWN as readonly string[]).includes(ground)

/** One tile of the field. A crop grows only on tilled soil; `growth` is the watered nights it has grown (a stage a
 * night), and `watered` says it was watered today, so it grows tonight. */
export interface Tile {
  ground: Ground
  crop: CropId | null
  growth: number
  ready: boolean
  regrowing: boolean
  /** Planted from own seeds. */
  own: boolean
  watered: boolean
}

/** The patch cleared on day 1: three by three at the field's top left, by the farmhouse. */
export const START_CLEAR: readonly number[] = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => row * FIELD_COLUMNS + col))
/** What the rest of the field starts overgrown with, by share in percent: weeds the most, then stones, then stumps. */
export const OVERGROWTH_SHARES: readonly (readonly [Overgrowth, number])[] = [['weeds', 55], ['stone', 25], ['stump', 20]]

/** A tile with nothing on it but its ground. */
export const bareTile = (ground: Ground): Tile => ({ ground, crop: null, growth: 0, ready: false, regrowing: false, own: false, watered: false })

/** An overgrown tile by the account's seeded draw: weeds the most, then stones, then stumps. */
function overgrown(uid: string, n: number): Tile {
  let at = draw(uid, 0, 'ground', n) * 100
  for (const [ground, share] of OVERGROWTH_SHARES) {
    if (at < share) return bareTile(ground)
    at -= share
  }
  return bareTile('weeds')
}

/** Day 1's field, plot 1: the cleared patch, and every other tile overgrown by the account's seeded draw
 * (`draw(uid, 0, 'ground', i)`), so a farm always starts on the same field. */
export function startField(uid: string): Tile[] {
  return Array.from({ length: FIELD_TILES }, (_, i) => (START_CLEAR.includes(i) ? bareTile('clear') : overgrown(uid, i)))
}
/** A plot as it's cleared, past the first: wild, every tile overgrown by the account's own draw, numbered on from plot 1's
 * (`draw(uid, 0, 'ground', plot × 40 + i)`), so a farm always clears the same plot. `plot` is its index: 1 for plot 2. */
export const wildPlot = (uid: string, plot: number): Plot => ({ tiles: Array.from({ length: FIELD_TILES }, (_, i) => overgrown(uid, plot * FIELD_TILES + i)) })

/** One plot of the field: its 40 tiles, row by row (`FIELD_COLUMNS` across). */
export interface Plot {
  tiles: Tile[]
}

/** The field's tiles, every plot's in order. A rule names a tile by its place in this list, its **field index**: plot
 * `⌊i / 40⌋`'s tile `i mod 40`, so plot 1's tiles keep the numbers (and the seeded draws) they always had. */
export const fieldTiles = (save: Pick<SaveV5, 'fields'>): Tile[] => save.fields.plots.flatMap((p) => p.tiles)
/** A field index's plot (0 for plot 1) and its tile in that plot. */
export const plotOf = (index: number): number => Math.floor(index / FIELD_TILES)
export const tileInPlot = (index: number): number => index % FIELD_TILES
/** The field index of a plot's tile. */
export const fieldIndex = (plot: number, tile: number): number => plot * FIELD_TILES + tile

/** Ready tiles in the field, every plot's: the sign's count and the Menu's. */
export const readyTiles = (save: Pick<SaveV5, 'fields'>): number => fieldTiles(save).filter((t) => t.ready).length
/** Tiles growing a crop that aren't watered today, every plot's. */
export const dryTiles = (save: Pick<SaveV5, 'fields'>): number => fieldTiles(save).filter((t) => t.crop !== null && !t.ready && !t.watered).length

// --- The stations' loads -----------------------------------------------------------------------------------------

/** A load at a station: its output at its stars (`<output>@<stars>`) and how many, ready the next morning. */
export interface StationLoad {
  item: string
  count: number
}
/** A station's top level: level n takes n loads a day (`gathering/stations.ts`), so a station holds up to five loads at
 * once. Here so the save's parse reads it without the stations' rules. */
export const STATION_MAX_LEVEL = 5

// --- The ranch and the mine -----------------------------------------------------------------------------------------

/** The ranch's animals: the Coop's two, then the Barn's five. Their prices and goods are the ranch's (`ranch/ranch.ts`). */
export const ANIMAL_KINDS = ['chicken', 'duck', 'cow', 'goat', 'sheep', 'alpaca', 'cashmere-goat'] as const
export type AnimalKind = typeof ANIMAL_KINDS[number]
/** The ranch's two buildings. */
export const RANCH_HOMES = ['coop', 'barn'] as const
export type RanchHome = typeof RANCH_HOMES[number]
/** Where each kind lives. */
export const ANIMAL_HOME: Readonly<Record<AnimalKind, RanchHome>> = {
  chicken: 'coop', duck: 'coop', cow: 'barn', goat: 'barn', sheep: 'barn', alpaca: 'barn', 'cashmere-goat': 'barn',
}
/** Fondness runs 0–200: a heart every 20, ten hearts at the top. */
export const MAX_FONDNESS = 200
/** The most animals each building holds. */
export const HOME_ROOM = 8
/** The most feed the silo holds. */
export const SILO_ROOM = 200

/** An animal on the ranch: its kind (its home is its kind's), its fondness, and today: fed, cared for, and whether its
 * good waits to be collected (made at night when it was fed; one at a time). */
export interface Animal {
  id: string
  kind: AnimalKind
  fondness: number
  fed: boolean
  cared: boolean
  ready: boolean
}

/** A dig at the Mine or the Quarry: the deepest floor reached (0 before its first face; floor 1 is open once it stands)
 * and the faces worked on that floor toward its stairs. */
export interface Dig {
  deepest: number
  stairs: number
}
/** The digs' floors: 30 each. */
export const DEEPEST_FLOOR = 30
/** The two digs. */
export const DIGS = ['mine', 'quarry'] as const
export type DigId = typeof DIGS[number]

/** The buildings with levels: absent or 0 is not built (the Forge's 0 is its ring bench, its fire not lit), 1 or more
 * is built. Every place you build is one (`farm/builds.ts`); the Dorm's is the level bought. */
export const BUILDING_IDS = [
  'dorm', 'coop', 'barn', 'kitchen', 'restaurant', 'forge', 'mill', 'sawmill', 'smokehouse', 'smelter', 'cutter', 'boat', 'mine', 'quarry', 'dock', 'expeditions',
] as const
export type BuildingId = typeof BUILDING_IDS[number]
export const BUILDING_MAX_LEVEL = 10

/** The farm's tools, tiers 1–5 (Basic, Copper, Iron, Gold, Mythril). */
export const TOOL_IDS = ['watering-can', 'hoe', 'brush', 'pick', 'hammer', 'rod', 'axe'] as const
export type ToolId = typeof TOOL_IDS[number]
export type ToolTier = 1 | 2 | 3 | 4 | 5

export const WORKSHOP_IDS = ['kitchen', 'restaurant', 'forge'] as const
export type WorkshopId = typeof WORKSHOP_IDS[number]
/** A workshop play under way: its workshop, its assistant and the day it started. */
export interface PlayInProgress {
  workshop: WorkshopId
  assistant: OutfitId
  day: number
}

/** The 80 dishes are `dish-<family>-<grade>` (uma-art's dishes atlas). */
export const DISH_FAMILIES = ['grains', 'vegetables', 'fruits', 'herbs-spices', 'mushrooms', 'nuts-seeds', 'sweets', 'fish'] as const
export const isDishId = (id: string): boolean => {
  const m = /^dish-([a-z-]+)-(\d+)$/.exec(id)
  return !!m && (DISH_FAMILIES as readonly string[]).includes(m[1]!) && Number(m[2]) >= 1 && Number(m[2]) <= 10 && String(Number(m[2])) === m[2]
}

/** The expedition regions. */
export const REGION_IDS = ['old-fort-ruins', 'echo-cave', 'hilltop-track', 'misty-marsh', 'sunken-temple', 'ember-peak', 'sky-ruins'] as const
export type RegionId = typeof REGION_IDS[number]
export interface Expedition {
  region: RegionId
  party: OutfitId[]
  supplies: string[]
  /** The day it left. */
  left: number
  /** The day it comes back. */
  back: number
}

/** A request's extra: a recipe, rare seeds, an animal or a recruit. */
export const EXTRA_KINDS = ['recipe', 'seeds', 'animal', 'recruit'] as const
export interface Extra {
  kind: typeof EXTRA_KINDS[number]
  /** A dish id, a seed id, an animal kind or an outfit id. */
  id: string
}
export interface BoardRequest {
  id: string
  /** One of the town's cast. */
  from: string
  item: string
  count: number
  stars: number
  due: number
  reward: number
  extra: Extra | null
}

export interface FestivalResult {
  id: string
  day: number
  score: number
  place: 1 | 2 | 3
}

/** She leaves the farm tomorrow: a swap at the Dorm takes her out. */
export const leaving = (save: { dorm: { swaps: readonly DormSwap[] } }, outfitId: OutfitId): boolean => save.dorm.swaps.some((s) => s.out === outfitId)
/** A spouse in her house: on the farm with no Dorm bed. */
export const housed = (save: Pick<SaveV4, 'love'>, id: CharacterId): boolean => save.love[id]?.house !== undefined
type HomeOf = { dorm: { home: readonly CharacterId[]; swaps: readonly DormSwap[] }; love: SaveV4['love'] }
/** She's home and staying: who may take a job or tend a block. An Uma leaving tomorrow may do neither. A spouse in her
 * house is on the farm too. */
export const onFarm = (save: HomeOf, id: CharacterId): boolean => (save.dorm.home.includes(id) && !leaving(save, id)) || housed(save, id)
/** Who's on the farm: the Dorm's home in its order, then the spouses in their houses by id. */
export function farmHome(save: Pick<SaveV4, 'dorm' | 'love'>): CharacterId[] {
  return [...save.dorm.home, ...Object.keys(save.love).filter((id) => housed(save, id) && !save.dorm.home.includes(id)).sort((a, b) => Number(a) - Number(b))]
}
/** Whether she's on the farm today: home in the Dorm (leaving tomorrow or not), or in her house. */
export const atHome = (save: Pick<SaveV4, 'dorm' | 'love'>, id: CharacterId): boolean => save.dorm.home.includes(id) || housed(save, id)

/** A bond's key: the two ids in numeric order, joined by a colon. A sister's id (`s<outfitId>`) sorts by its number, and
 * after a plain id of the same number. */
export function pairKey(a: OutfitId, b: OutfitId): string {
  const n = (id: string) => Number(id.startsWith('s') ? id.slice(1) : id)
  return n(a) < n(b) || (n(a) === n(b) && a <= b) ? `${a}:${b}` : `${b}:${a}`
}

/** Master data's character id: the roster's key. */
export type CharacterId = string

/** Her route's stages: the ladder she's on, or the rung that waits. */
export const LOVE_STAGES = ['friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
export type LoveStage = typeof LOVE_STAGES[number]

/** Her route with the farmer. It starts at Friendship 0 the day she joins and her arrival scene pays into
 * `points`; the ladders are in `romance/love.ts`. */
export interface Love {
  stage: LoveStage
  /** Events played on this ladder: friendship and romance 0–9 (the tenth moves her on), 10 while the
   * confession, the proposal or the wedding waits, spouse 0–5 (S5 completes the route). */
  level: number
  /** Toward the next rung; past it, banked. Whole: every pay rounds once. */
  points: number
  /** The day of her last event (one a day); 0 before any. */
  last: number
  /** "Not yet" at her confession: only while the confession waits. */
  friend?: true
  /** Her ring's grade, 1–10: set at the proposal, raised by a better ring. Every ring is a Rough
   * make until the merge game, so it's also her bonus in % once she's married (+1% a grade, `ringBonus`). */
  ring?: number
  /** The wedding's day: a spouse's. */
  wed?: number
  /** Her room's house: a spouse's. */
  house?: number
  /** Goods ids whose taste you've learnt. */
  known: string[]
  /** Set by choices; they change wording only. */
  flags: string[]
  /** The day of her last evening: what the invitations' weight reads; 0 before any. */
  evening: number
  /** The festivals she's been at with you (+50 once a festival a year), as `<festival>:<year>`. */
  festivals: string[]
  /** The day her morning items' count started: the day she reached Romance 2 (every 4th morning from
   * it), then the day she reached Spouse 2 (every 2nd). `advance` sets it; absent before Romance 2. */
  morning?: number
  /** Her signature dish: the recipe her Friendship 4 gave, a dish id, so her profile can name it. */
  dish?: string
  /** The last night she was your night's companion (a spouse's); absent before any. The save grows it in place. */
  night?: number
}

// --- The work board: a farmhand's tasks, and her aptitudes ---------------------------------------------------------

/** The work board's tasks: the field's (a plot and a list of its tiles), a station's load, a forest area's forage or chop,
 * a fishing spot's catch, the Coop's or the Barn's care, a face at the Mine or the Quarry, and cooking in the farm's
 * kitchen. */
export const TASK_KINDS = ['harvest', 'water', 'plant', 'till', 'load', 'forage', 'chop', 'fish', 'care', 'mine', 'cook'] as const
export type TaskKind = typeof TASK_KINDS[number]
/** The field's tasks, each over a list of tiles. */
export const TILE_TASKS = ['harvest', 'water', 'plant', 'till'] as const
export type TileTaskKind = typeof TILE_TASKS[number]
/** One task on a farmhand's board: the field's over a plot's tiles (planting one crop, or any in season), a station's
 * load, an area's forage or chop, a spot's catch, a building's animals, a dig's deepest floor, the kitchen's batches. It
 * repeats each day until you change it. A field task's `plot` is its plot's index, absent for plot 1 (a task from before plots is plot 1's), and
 * its `tiles` are that plot's, 0–39. */
export type FarmTask =
  | { kind: Exclude<TileTaskKind, 'plant'>; tiles: number[]; plot?: number }
  | { kind: 'plant'; tiles: number[]; crop?: CropId; plot?: number }
  | { kind: 'load'; station: StationId }
  | { kind: 'forage' | 'chop'; area: ForestAreaId }
  | { kind: 'fish'; spot: FishingSpotId }
  | { kind: 'care'; home: RanchHome }
  | { kind: 'mine'; dig: DigId }
  | { kind: 'cook' }
/** The most tasks one farmhand's board holds. */
export const MAX_TASKS = 6
/** Her aptitudes: one for each task, a station's load one for each station; the Coop's and the Barn's care are one, and
 * so are the faces at either dig; cooking is the Cook task's. */
export const APTITUDE_IDS = ['harvest', 'water', 'plant', 'till', 'forage', 'chop', 'fish', 'mill', 'sawmill', 'smokehouse', 'care', 'mine', 'smelter', 'cutter', 'cook'] as const
export type AptitudeId = typeof APTITUDE_IDS[number]

/** An Uma on the roster. Talents aren't saved: they're read from master data each boot. */
export interface RosterUma {
  /** The day she joined. */
  joined: number
  ranks: Record<Activity, RankState>
  /** Well-fed days left. */
  wellFed: number
  /** The day you invited her to work the farm: she's a farmhand from then on. Absent before (the save grows it in
   * place); the farmhands' work reads it. */
  farmhand?: number
  /** Her tasks on the work board, in your order: a farmhand's. Absent before you set any (the save grows it in place). */
  tasks?: FarmTask[]
  /** The actions she has spent on each aptitude's task: her practice. Her level is read from it with her talent and
   * rank points (`farm/farmhands.ts`). Absent before her first (the save grows it in place). */
  practice?: Partial<Record<AptitudeId, number>>
}

/** The evening's kinds: the ten date games, Dinner in town and A night in, then festival night, its own slot on a
 * festival day. The rules, names and plays are `romance/evening.ts`'s; the ids live here so the save's parse stays light. */
export const EVENING_KINDS = ['walk', 'fishing', 'picnic', 'market', 'cooking', 'crafting', 'stargazing', 'dinner', 'dance', 'boat', 'night-in', 'footrace', 'festival'] as const
export type EveningKind = typeof EVENING_KINDS[number]
/** Festival night: a walk at the festival ground, the festival day's second evening. */
export const FESTIVAL_NIGHT = 'festival' satisfies EveningKind
/** A kind an invitation asks for: her favourite date game, never festival night (and never the two evenings of their
 * own, Dinner in town and A night in, which are no one's favourite). */
export type InviteKind = Exclude<EveningKind, typeof FESTIVAL_NIGHT>
/** Two evenings and two invitations from this many married… */
export const TWO_EVENINGS_MARRIED = 10
/** …the second evening on days divisible by this. */
export const SECOND_EVENING_EVERY = 4
/** Spouses on the farm: what the household milestones count. */
export const marriedCount = (save: Pick<SaveV4, 'love'>): number => Object.values(save.love).filter((love) => love.stage === 'spouse').length
/** Today's evening slots besides festival night: one, and a second on days divisible by 4 from 10 married. */
export const eveningsOn = (day: number, married: number): number => (married >= TWO_EVENINGS_MARRIED && day % SECOND_EVENING_EVERY === 0 ? 2 : 1)
/** Morning invitations: one, two from 10 married. */
export const invitesFor = (married: number): number => (married >= TWO_EVENINGS_MARRIED ? 2 : 1)

/** An evening spent with her: one a slot, `festival` filling festival night's. */
export interface Evening {
  with: CharacterId
  kind: EveningKind
}
/** A morning invitation: drawn at night step 9, answered Yes or Another day, cleared at step 7. */
export interface Invite {
  id: CharacterId
  kind: InviteKind
  answer: 'yes' | 'no' | null
}

/** Today's once-a-day acts, cleared each night, and the bond hearts the morning compares. */
export interface TodayV4 {
  /** The day's actions spent: the farm's tasks and outings (`farm/actions.ts`). */
  actions: number
  /** A special day's event actions spent: only events spend them. */
  eventActions: number
  /** Gone into town today: the town and its shop are open for the rest of the day. */
  town: boolean
  /** The forest areas and fishing spots worked today, each once, in order: the Diary's depth milestones read them at
   * night. */
  gathered: string[]
  chats: CharacterId[]
  gifts: CharacterId[]
  /** Who earned praise today, overnight or by day. */
  praise: CharacterId[]
  /** Who you've praised today. */
  praised: CharacterId[]
  /** Whose event played today (one a day each). */
  events: CharacterId[]
  /** Who played today's occasion scene with you (New Year's, the Flower Show, the Fishing Derby's night), once a day
   * each. Absent until one plays: the save grows it in place. */
  occasions?: CharacterId[]
  /** Whom you asked again after her confession's "Not yet" today: Ask her once a day, never her event. */
  asked: CharacterId[]
  /** Evenings spent today: one a slot, in the order played. */
  evenings: Evening[]
  /** This morning's invitations: at most one, two from 10 married, each a different Uma. */
  invites: Invite[]
  /** Bond hearts before each pair's first move since the last morning, by `pairKey`: the morning lists what
   * rose since, whether a day (the opening's seeds) or the night moved it. Night step 9 empties it. */
  bonds: Record<string, number>
  /** The ring made at the bench today: its grade, 0 before one. One a day. */
  ring: number
  /** Today's wedding reception: the well-fed days it gives everyone on the farm tomorrow (1–3), applied at
   * night step 9; 0 with no wedding today. */
  reception: number
  /** The household's meals cooked today, each once: breakfast, dinner. Absent until one is cooked: the save grows it in
   * place. */
  meals?: Meal[]
  /** The farmhands well fed this morning, by id: each works one more action today. The night notes them as the morning
   * comes (step 9); absent with none (the save grows it in place). */
  fed?: CharacterId[]
  /** The hauls today at each forest area and fishing spot, the farmer's by day and the farmhands' at night together: a
   * place gives full hauls the first four times a day, then thin ones (`gathering/hauls.ts`). Absent until the first
   * (the save grows it in place); step 7 clears it with the day. */
  hauls?: Record<string, number>
}

/** The household's meals: one of each a day, once anyone is married. */
export const MEALS = ['breakfast', 'dinner'] as const
export type Meal = typeof MEALS[number]

/** A day's `today` before anything's done (newSave; night step 7 clears to it). */
export const newTodayV4 = (): TodayV4 => ({ actions: 0, eventActions: 0, town: false, gathered: [], chats: [], gifts: [], praise: [], praised: [], events: [], asked: [], evenings: [], invites: [], bonds: {}, ring: 0, reception: 0 })

/** A house on the homestead: house 0 is the Farmhouse (two rooms, never extended), houses 1–6 are
 * appended as they're built, each named by you. */
export interface House {
  name: string
  extended: boolean
}
/** The homestead. **Who lives where is one source, `love.house`**: a spouse's
 * room is in the house of that number, and she has no Dorm bed. */
export interface Homestead {
  houses: House[]
  /** Tonight's house (Sleep at), or null before a pick: the night takes the default then. */
  tonight: number | null
  /** "Her room" tonight: a birthday-alone wisher on her birthday, whose house is `tonight`; her morning is hers
   * alone. Null on any other night. */
  alone: CharacterId | null
  /** The last night slept in each house (the evening's day); 0 never. */
  slept: number[]
  /** The furniture set: empty until 5 married, then five pieces, each the house it stands in or null. */
  furniture: (number | null)[]
  /** The married count the night last saw: household milestones are news once, as it passes 1, 5, 10, 15
   * and 20, and household scenes are Ready from the morning after. */
  married: number
  /** The morning the finale came (the morning after the 20th wedding), the Festival of Vows' day of the year; 0
   * before. */
  finale: number
  /** Tonight's companion, your pick at the day's end: a spouse with a room, whose house is `tonight`. Absent before a
   * pick (the night takes the default then, and clears it); the save grows it in place. */
  companion?: CharacterId
}

/** A house's rooms: two, four once extended. */
export const HOUSE_ROOMS = 2
export const EXTENDED_ROOMS = 4
export const roomsOf = (house: Pick<House, 'extended'>): number => (house.extended ? EXTENDED_ROOMS : HOUSE_ROOMS)
/** The homestead's places: the Farmhouse and six houses. */
export const MAX_HOUSES = 7
/** The furniture set's pieces. */
export const FURNITURE_PIECES = 5
/** The household milestones: the homestead at 1, household scenes at 5, 10 and 15, the finale at 20. */
export const HOUSEHOLD_MILESTONES: readonly number[] = [1, 5, 10, 15, 20]
/** The finale's count: 20 married. */
export const FINALE_MARRIED = 20

/** A house's residents: the spouses whose room is there, in wedding order (her wedding's day, then her id). */
export function residentsOf(save: Pick<SaveV4, 'love'>, house: number): CharacterId[] {
  return Object.entries(save.love).filter(([, love]) => love.house === house)
    .sort(([a, x], [b, y]) => (x.wed ?? 0) - (y.wed ?? 0) || Number(a) - Number(b)).map(([id]) => id)
}

/** Whether a day is the Festival of Vows: the finale's day of the year, each later year. */
export const vowsOn = (homestead: Pick<Homestead, 'finale'>, day: number): boolean =>
  homestead.finale > 0 && day > homestead.finale && (day - homestead.finale) % DAYS_PER_YEAR === 0

/** You and her, by day: how many days you've talked with her, the last, and the last day you gave her a gift. Met or not
 * is the roster's. */
export interface TownTalks {
  /** Days you've talked with her, in all. */
  talks: number
  /** The last day you talked with her: a talk on it counts no more; 0 before any. */
  last: number
  /** The last day you gave her a gift; 0 before any. An older v5 has none: 0. */
  gift: number
}
/** Whom the town holds talks for: a character id, or a sister's (`s<outfitId>`). */
export const TOWN_ID = /^s?[1-9]\d{0,11}$/

/** A loan from the mayor's office, toward one build: what it paid for, the day it was taken, the gold lent and its fee,
 * what's still owed, and the most one night's income repays. It goes once nothing is owed. */
export interface Loan {
  /** A place you build (its id), a Dorm level (`dorm:<level>`, 2–8), or a house on the homestead (`house:<n>`, 1–6). */
  for: string
  day: number
  lent: number
  fee: number
  owed: number
  nightly: number
}
/** The most loans the farm holds at once: two, from Farm Rank 4. */
export const MAX_LOANS = 2
/** The nights of income the farm's book keeps: the last seven. */
export const INCOME_NIGHTS = 7
/** Meals waiting in the pantry (`farm/food.ts`): those cooked one day at one star. A meal keeps three days: cooked today,
 * it's eaten tonight, tomorrow night or the night after, then it spoils. */
/** A meal keeps this many days: the day it's cooked and the next two (`farm/food.ts`). Here so the save's parse reads it
 * without the food rules. */
export const MEAL_KEEPS = 3
/** The market's floor (`goods/market.ts`): a good eases at most five steps, to half its price. Here so the save's parse
 * reads it without the market's rules. */
export const MARKET_FLOOR = 5
export interface PantryLot {
  /** The day it was cooked. */
  day: number
  stars: number
  meals: number
}
/** A loan's project as the save names it, besides a place's id: a house, `house:<n>`, or a Dorm level, `dorm:<level>`. */
export const HOUSE_LOAN = /^house:([1-6])$/
export const DORM_LOAN = /^dorm:([2-8])$/

/** Save v5: the farm's one save. */
export interface SaveV5 {
  version: 5
  /** As stored: the wipe never changes it, and only a player's change moves `updatedAt`. */
  account: Account
  /** '' until the name sheet. */
  farmer: { name: string }
  calendar: { day: number }
  gold: number
  today: TodayV4
  roster: Record<CharacterId, RosterUma>
  /** One per roster Uma, from the day she joins. */
  love: Record<CharacterId, Love>
  /** Levels 1–8: the level in effect, who's on the farm (≤ its beds) and swaps arriving tomorrow. */
  dorm: { level: number; home: CharacterId[]; swaps: DormSwap[] }
  items: Warehouse
  bin: Warehouse
  /** The field: its plots in the order cleared, plot 1 first, each 8 × 5 tiles. An older v5's one field of tiles is plot 1. */
  fields: { plots: Plot[] }
  /** Each station's loads started today, in the order started, ready the next morning: one a day a level. An older
   * v5's one load (an object) reads as a list of one. */
  loads: Partial<Record<StationId, StationLoad[]>>
  crops: Partial<Record<CropId, number>>
  /** The Coop's and the Barn's animals, in the order bought, and the feed in the silo. A save from before the ranch has no
   * silo: none. */
  ranch: { animals: Animal[]; silo: number }
  /** The Mine's and the Quarry's digs. */
  places: Record<DigId, Dig>
  buildings: Partial<Record<BuildingId, number>>
  tools: Record<ToolId, ToolTier>
  workshops: { played: Record<WorkshopId, number>; current: PlayInProgress | null; recipes: string[]; best: Record<string, number> }
  expeditions: Expedition[]
  /** Bond points by pair: `pairKey` of character ids. */
  bonds: Record<string, number>
  board: BoardRequest[]
  /** What's shipped, the milestones paid, the records, the scenes read, and the Town notes unlocked (their ids, in the
   * order they unlocked: the words are the pack's). An older v4 has no `notes`: none. */
  diary: { shipped: Record<string, number>; milestones: string[]; records: Record<string, number>; read: string[]; notes: string[] }
  /** The Farm Rank's points, festivals, lifetime counters, and the places paid for today, standing tomorrow morning
   * (`builds`, in the order paid). Then the farm's accounts (`farm/economy.ts`): the mayor's office's loans, the upkeep
   * still owed and the short nights in a row, and the bin's pay on each of the last seven nights, oldest first. A save
   * from before upkeep has none of them: no loans, nothing owed, no nights. Then the pantry's meals, by the day cooked
   * and their stars (`farm/food.ts`); a save from before food has none: an empty pantry. Then the market: each good a
   * flood eased, by its steps (`goods/market.ts`); a save from before the market has none: nothing eased. */
  farm: {
    points: number; festivals: FestivalResult[]; counts: Record<string, number>; builds: FarmPlaceId[]; loans: Loan[]; owed: number; short: number; income: number[]
    pantry: PantryLot[]; market: Record<string, number>
  }
  homestead: Homestead
  /** Her route's event ids played, in order. */
  memories: Record<CharacterId, string[]>
  /** Arrival scenes played or skipped, in the order they played. */
  arrivals: CharacterId[]
  /** Her gallery, by character: the ids of her illustrations seen, in the order first seen, each kept for good (the
   * pictures and titles are master data's). An older v5 has none. */
  gallery: Record<CharacterId, string[]>
  summary: MorningSummary | null
  /** You and each Uma, by character: her talks so far, the last day you talked and the last you gave her a gift. An
   * older v4 has none. */
  town: Record<string, TownTalks>
}

/** The save's old name, kept so the code that reads the save didn't move with the version: the same type. */
export type SaveV4 = SaveV5
/** The save the game plays: v5. */
export type FarmSave = SaveV5

/** Her route the day she joins: Friendship 0, no points. */
export const newLove = (): Love => ({ stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] })

/** A new Uma on the roster: joined today, Novice at 0 points in all nine activities. */
export function newRosterUma(day: number): RosterUma {
  return { joined: day, ranks: Object.fromEntries(ACTIVITIES.map((a) => [a, { points: 0, rank: 0, challenge: 0 }])) as Record<Activity, RankState>, wellFed: 0 }
}

/** The Farmhouse: house 0, there from day 1 (its rule amended). */
export const FARMHOUSE: House = { name: 'Farmhouse', extended: false }

/** Day 1 on v5: 500g, 9 Carrot seeds, the field overgrown but for a cleared patch of nine, a day of actions, the Dorm at level 1 (3 beds), the Farmhouse, the farmer's name empty, nobody on the roster: the name sheet, then the opening's lines; everyone is in town, to meet by introducing yourself. */
export function newSave(uid: string, now: string): SaveV5 {
  return {
    version: 5,
    account: { uid, createdAt: now, updatedAt: now },
    farmer: { name: '' },
    calendar: { day: 1 },
    gold: START_GOLD,
    today: newTodayV4(),
    roster: {},
    love: {},
    dorm: { level: 1, home: [], swaps: [] },
    items: { [seedId('carrot')]: [START_SEEDS, 0, 0, 0, 0] },
    bin: {},
    fields: { plots: [{ tiles: startField(uid) }] },
    loads: {},
    crops: {},
    ranch: { animals: [], silo: 0 },
    places: { mine: { deepest: 0, stairs: 0 }, quarry: { deepest: 0, stairs: 0 } },
    buildings: { dorm: 1 },
    tools: Object.fromEntries(TOOL_IDS.map((t) => [t, 1])) as Record<ToolId, ToolTier>,
    workshops: { played: { kitchen: 0, restaurant: 0, forge: 0 }, current: null, recipes: [], best: {} },
    expeditions: [],
    bonds: {},
    board: [],
    diary: { shipped: {}, milestones: [], records: {}, read: [], notes: [] },
    farm: { points: 0, festivals: [], counts: {}, builds: [], loans: [], owed: 0, short: 0, income: [], pantry: [], market: {} },
    homestead: { houses: [FARMHOUSE], tonight: null, alone: null, slept: [0], furniture: [], married: 0, finale: 0 },
    memories: {},
    arrivals: [],
    gallery: {},
    summary: null,
    town: {},
  }
}

/** The new farm over an older save: day 1 on v5, its `account` copied whole (uid, `createdAt`, `updatedAt`), so the
 * conflict rule still sees the player's last change and the first upload isn't stamped. Pure. */
export function freshV5(older: Pick<OlderSave, 'account'>): SaveV5 {
  return { ...newSave(older.account.uid, older.account.createdAt), account: { ...older.account } }
}
