// Save v3: the farm's own loop, with its own additions (`start`,
// `today`, `dorm.swaps`, `farm.counts`). It is live: any change to
// its shape is v4, with its migration.
import type { ItemRequest, WorkRow } from '@luismlorenzana/uma-work'
import { START_GOLD, START_SEEDS } from '../farm/farm'
import { ACTIVITIES, type Activity, type Rank } from '../farm/ranks'
import { seedId, type CropId } from '../goods/ids'
import type { MorningSummary } from '../night/summary'
import type { Account } from './save'

/** A master outfit id. */
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

/** An Uma on the roster. Talents aren't saved: they're read from master data each boot. */
export interface RosterUma {
  /** The day she joined. */
  joined: number
  ranks: Record<Activity, RankState>
  affinity: number
  /** Well-fed days left. */
  wellFed: number
}

export const VISITOR_FROM = ['gate', 'festival', 'expedition'] as const
export interface Visitor {
  outfitId: OutfitId
  from: typeof VISITOR_FROM[number]
  /** The day she leaves. */
  leaves: number
  affinity: number
}

/** A swap at the Dorm, arriving the next morning. */
export interface DormSwap {
  out: OutfitId
  in: OutfitId
}

/** A v3 work request: the common item request where the loop's kinds have no request of their own. */
export type LoopWorkRequest = ItemRequest

export const BLOCK_IDS = ['A', 'B', 'C', 'D'] as const
export type BlockId = typeof BLOCK_IDS[number]
export const PLOTS_PER_BLOCK = 9

export interface Plot {
  crop: CropId | null
  growth: number
  ready: boolean
  regrowing: boolean
  /** Planted from her own seeds. */
  own: boolean
}

export interface Block {
  id: BlockId
  tender: OutfitId | null
  plots: Plot[]
}

export const ANIMAL_KINDS = ['chicken', 'duck', 'cow', 'goat', 'sheep', 'alpaca', 'cashmere-goat'] as const
export type AnimalKind = typeof ANIMAL_KINDS[number]
/** Where each kind lives. */
export const ANIMAL_HOME: Readonly<Record<AnimalKind, 'coop' | 'barn'>> = {
  chicken: 'coop', duck: 'coop', cow: 'barn', goat: 'barn', sheep: 'barn', alpaca: 'barn', 'cashmere-goat': 'barn',
}
export interface Animal {
  id: string
  kind: AnimalKind
  building: 'coop' | 'barn'
  affection: number
  /** Days in a row with the same carer. */
  streak: number
  carer: OutfitId | null
  /** Days to her next product. */
  next: number
}

/** A dig's progress: the deepest floor reached and the stairs-days found toward the next. */
export interface Dig {
  deepest: number
  stairs: number
}
export const DEEPEST_FLOOR = 30

/** The buildings with levels: absent is locked, 0 is "plans held, not built", 1 or more is built. */
export const BUILDING_IDS = ['dorm', 'coop', 'barn', 'kitchen', 'restaurant', 'forge', 'mill', 'sawmill', 'smokehouse', 'smelter', 'cutter', 'boat'] as const
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

export interface SaveV3 {
  version: 3
  /** Unchanged from v2: only a player's change moves `updatedAt`. */
  account: Account
  /** 1 = Spring 1, year 1. */
  calendar: { day: number }
  gold: number
  /** The start's one free redraw. */
  start: { redraws: number }
  /** Once-a-day chats and gifts, cleared each night. */
  today: { chats: OutfitId[]; gifts: OutfitId[] }
  /** Every recruited Uma. */
  roster: Record<OutfitId, RosterUma>
  /** The level in effect, who's on the farm (≤ its beds; the rest are off-season) and swaps arriving tomorrow. */
  dorm: { level: number; home: OutfitId[]; swaps: DormSwap[] }
  visitors: Visitor[]
  /** The Warehouse: counts by ★1 … ★5. */
  items: Warehouse
  /** Shipped today, paid tonight. */
  bin: Warehouse
  /** uma-work's rows; the clock is (day − 1) × 86,400,000 ms. */
  work: Record<OutfitId, WorkRow<LoopWorkRequest>>
  fields: { blocks: Block[] }
  /** Crop points, by crop. */
  crops: Partial<Record<CropId, number>>
  ranch: { animals: Animal[] }
  places: { mine: Dig; quarry: Dig }
  /** Levels bought; `buildings.dorm` is the level bought, `dorm.level` the level in effect. */
  buildings: Partial<Record<BuildingId, number>>
  tools: Record<ToolId, ToolTier>
  /** `played` is the day each workshop was last played (0: never). */
  workshops: { played: Record<WorkshopId, number>; current: PlayInProgress | null; recipes: string[]; best: Record<string, number> }
  expeditions: Expedition[]
  /** Bond points by pair, `'idA:idB'` with the ids in numeric order (`pairKey`). */
  bonds: Record<string, number>
  board: BoardRequest[]
  diary: { shipped: Record<string, number>; milestones: string[]; records: Record<string, number>; read: string[] }
  /** Farm Rank points, the chapter, its goals' counts, festivals, and lifetime counters. */
  farm: { points: number; chapter: number; goals: Record<string, number>; festivals: FestivalResult[]; counts: Record<string, number> }
  /** The last night's morning summary, until the player dismisses it. */
  summary: MorningSummary | null
}

/** A plot with nothing planted. */
export const emptyPlot = (): Plot => ({ crop: null, growth: 0, ready: false, regrowing: false, own: false })
/** A block of nine empty plots. */
export const newBlock = (id: BlockId): Block => ({ id, tender: null, plots: Array.from({ length: PLOTS_PER_BLOCK }, emptyPlot) })
/** Ready plots on the farm, every block: the map's badge, Collect all and the nudge's "to collect". */
export const readyPlots = (save: Pick<SaveV3, 'fields'>): number => save.fields.blocks.reduce((n, b) => n + b.plots.filter((p) => p.ready).length, 0)
/** The block an Uma tends, or null: a tender is busy, so she can't take an uma-work job. */
export const tendedBlock = (save: Pick<SaveV3, 'fields'>, outfitId: OutfitId): BlockId | null =>
  save.fields.blocks.find((b) => b.tender === outfitId)?.id ?? null

/** The start's three. */
export const START_PICKS = 3
/** Picks still to make: the start's sheet shows while the roster holds fewer than three. */
export const picksLeft = (save: { roster: Readonly<Record<string, unknown>> }): number => Math.max(0, START_PICKS - Object.keys(save.roster).length)
/** She leaves the farm tomorrow: a swap at the Dorm takes her out. */
export const leaving = (save: { dorm: { swaps: readonly DormSwap[] } }, outfitId: OutfitId): boolean => save.dorm.swaps.some((s) => s.out === outfitId)
/** A spouse in her house: on the farm with no Dorm bed. Only a v4 save has `love`. */
export const housed = (save: object, outfitId: OutfitId): boolean =>
  'love' in save && (save.love as Readonly<Record<string, { house?: number } | undefined>>)[outfitId]?.house !== undefined
type HomeOf = { dorm: { home: readonly OutfitId[]; swaps: readonly DormSwap[] } }
/** She's home and staying: who may take a job or tend a block. An Uma leaving tomorrow may do neither. On v4 a spouse
 * in her house is on the farm too. */
export const onFarm = (save: HomeOf, outfitId: OutfitId): boolean => (save.dorm.home.includes(outfitId) && !leaving(save, outfitId)) || housed(save, outfitId)
/** Who's on the farm: the Dorm's home in its order, then the spouses in their houses by id. v3's is the
 * Dorm's. */
export function farmHome(save: { dorm: { home: readonly OutfitId[] } }): OutfitId[] {
  const love = 'love' in save ? Object.keys(save.love as object) : []
  return [...save.dorm.home, ...love.filter((id) => housed(save, id) && !save.dorm.home.includes(id)).sort((a, b) => Number(a) - Number(b))]
}
/** Whether she's on the farm today: home in the Dorm (leaving tomorrow or not), or in her house. */
export const atHome = (save: { dorm: { home: readonly OutfitId[] } }, outfitId: OutfitId): boolean => save.dorm.home.includes(outfitId) || housed(save, outfitId)

/** A new Uma on the roster: joined today, Novice at 0 points in all nine activities. */
export function newRosterUma(day: number): RosterUma {
  return { joined: day, ranks: Object.fromEntries(ACTIVITIES.map((a) => [a, { points: 0, rank: 0, challenge: 0 }])) as Record<Activity, RankState>, affinity: 0, wellFed: 0 }
}

/** A bond's key: the two outfit ids in numeric order, joined by a colon. */
export function pairKey(a: OutfitId, b: OutfitId): string {
  return Number(a) <= Number(b) ? `${a}:${b}` : `${b}:${a}`
}

/** Day 1: 500g, 9 Carrot seeds, Block A of 9 tilled plots, the Dorm at level 1 (3 beds), chapter 1, everything else
 * empty. Nobody is on the roster yet: the start's sheet is the first tap. */
export function newSave(uid: string, now: string): SaveV3 {
  return {
    version: 3,
    account: { uid, createdAt: now, updatedAt: now },
    calendar: { day: 1 },
    gold: START_GOLD,
    start: { redraws: 0 },
    today: { chats: [], gifts: [] },
    roster: {},
    dorm: { level: 1, home: [], swaps: [] },
    visitors: [],
    items: { [seedId('carrot')]: [START_SEEDS, 0, 0, 0, 0] },
    bin: {},
    work: {},
    fields: { blocks: [newBlock('A')] },
    crops: {},
    ranch: { animals: [] },
    places: { mine: { deepest: 0, stairs: 0 }, quarry: { deepest: 0, stairs: 0 } },
    buildings: { dorm: 1 },
    tools: Object.fromEntries(TOOL_IDS.map((t) => [t, 1])) as Record<ToolId, ToolTier>,
    workshops: { played: { kitchen: 0, restaurant: 0, forge: 0 }, current: null, recipes: [], best: {} },
    expeditions: [],
    bonds: {},
    board: [],
    diary: { shipped: {}, milestones: [], records: {}, read: [] },
    farm: { points: 0, chapter: 1, goals: {}, festivals: [], counts: {} },
    summary: null,
  }
}
