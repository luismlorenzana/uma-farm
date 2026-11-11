// Save v4 (F46; romance spec RM3, RM10; D48): the romance core's save, written whole now, the later packets' slots
// included, so each fills its own while v4 grows in place behind the dark switch (decision 1, as v3 did in M4). F56 ships
// it; any change after F56 is v5.
//
// v4 is a wipe (RM10): any v1, v2 or v3 becomes a fresh v4 (`freshV4`), its `account` copied whole, so `updatedAt` moves
// only with the player's first change (the farmer's name). The wipe runs in the app, never in `parseSave` (decision 2):
// the API reads v2, v3 and v4 as stored and never makes a save (FM10).
//
// The roster, the Dorm, work, bonds, `love`, `today`, `memories` and `arrivals` are keyed by character id (RM3). Her
// outfit is a lookup in the story pack (`outfitOf`, `story/pack.ts`). The shared rules (the Fields, gathering, stations,
// ranks, the bin, the night) take `FarmSave`, v3 or v4, and branch on `save.version`, never on the web's switch.
import type { WorkRow } from '@luismlorenzana/uma-work'
import { START_GOLD, START_SEEDS } from '../farm/farm'
import { ACTIVITIES, type Activity } from '../farm/ranks'
import { seedId, type CropId } from '../goods/ids'
import type { MorningSummaryV4 } from '../night/summary'
import type { Account, SaveV1, SaveV2 } from './save'
import {
  newBlock, TOOL_IDS, type Animal, type Block, type BoardRequest, type BuildingId, type Dig, type DormSwap, type Expedition, type FestivalResult,
  type LoopWorkRequest, type PlayInProgress, type RankState, type SaveV3, type ToolId, type ToolTier, type Warehouse, type WorkshopId,
} from './v3'

/** Master data's character id (P8): the roster's key on v4. */
export type CharacterId = string
/** The roster's key in the shared rules (decision 5): an outfit id on v3, a character id on v4, both by `isOutfitId`'s
 * form. Where it meets master data, `outfitOf` turns it into her outfit. */
export type UmaId = string

/** Her route's stages (RM11): the ladder she's on, or the rung that waits. */
export const LOVE_STAGES = ['friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
export type LoveStage = typeof LOVE_STAGES[number]

/** Her route with the farmer (RM10, RM11). F46 makes it at Friendship 0 the day she joins and pays her arrival scene into
 * `points`; F47 grows the ladders, F49 the events, F53 the ring and the wedding, F54 the houses. */
export interface Love {
  stage: LoveStage
  /** Events played on this ladder: 0–10 (spouse 0–5). */
  level: number
  /** Toward the next rung; past it, banked (RM14). */
  points: number
  /** The day of her last event (one a day, RM21); 0 before any. */
  last: number
  /** "Not yet" at her confession (RM30): only while the confession waits. */
  friend?: true
  /** Her ring's bonus in %, once given (RM39): from the proposal on. */
  ring?: number
  /** The wedding's day: a spouse's. */
  wed?: number
  /** Her room's house (RM42): a spouse's. */
  house?: number
  /** Goods ids whose taste you've learnt (RM15). */
  known: string[]
  /** Set by choices; they change wording only (RM27). */
  flags: string[]
  /** The day of her last evening; 0 before any. */
  evening: number
}

/** An Uma on the v4 roster: v3's without `affinity`, which became `love` (RM10). Talents aren't saved. */
export interface RosterUmaV4 {
  /** The day she joined. */
  joined: number
  ranks: Record<Activity, RankState>
  /** Well-fed days left (CS22). */
  wellFed: number
}

/** An evening spent with her (F50 refines the kinds in place). */
export interface Evening {
  with: CharacterId
  kind: string
}
/** A morning invitation (F50 refines it in place). */
export interface Invite {
  id: CharacterId
  kind: string
  answer: 'yes' | 'no' | null
}

/** Today's once-a-day acts, cleared each night (F47–F50 fill them). */
export interface TodayV4 {
  chats: CharacterId[]
  gifts: CharacterId[]
  /** Who earned praise today, overnight or by day (F47). */
  praise: CharacterId[]
  /** Who you've praised today. */
  praised: CharacterId[]
  /** Whose event played today (one a day each, RM21). */
  events: CharacterId[]
  evenings: Evening[]
  invites: Invite[]
}

/** A house on the homestead (RM41; F54's to fill): house 0 is the Farmhouse. */
export interface House {
  name: string
  extended: boolean
}
export interface Homestead {
  houses: House[]
  /** Tonight's house, or null before a choice. */
  tonight: number | null
  /** The last night slept in each house; 0 never. */
  slept: number[]
}

/** Save v4 (RM10; decision 7). */
export interface SaveV4 {
  version: 4
  /** As stored: the wipe never changes it, and only a player's change moves `updatedAt`. */
  account: Account
  /** '' until the name sheet (RM8). */
  farmer: { name: string }
  calendar: { day: number }
  gold: number
  today: TodayV4
  roster: Record<CharacterId, RosterUmaV4>
  /** One per roster Uma, from the day she joins. */
  love: Record<CharacterId, Love>
  /** Levels 1–8 (RM5): the level in effect, who's on the farm (≤ its beds) and swaps arriving tomorrow. */
  dorm: { level: number; home: CharacterId[]; swaps: DormSwap[] }
  items: Warehouse
  bin: Warehouse
  /** uma-work's rows; `outfitId` holds her character id, the roster's key (decision 5). */
  work: Record<CharacterId, WorkRow<LoopWorkRequest>>
  fields: { blocks: Block[] }
  crops: Partial<Record<CropId, number>>
  ranch: { animals: Animal[] }
  places: { mine: Dig; quarry: Dig }
  buildings: Partial<Record<BuildingId, number>>
  tools: Record<ToolId, ToolTier>
  workshops: { played: Record<WorkshopId, number>; current: PlayInProgress | null; recipes: string[]; best: Record<string, number> }
  expeditions: Expedition[]
  /** Bond points by pair: `pairKey` of character ids. */
  bonds: Record<string, number>
  board: BoardRequest[]
  diary: { shipped: Record<string, number>; milestones: string[]; records: Record<string, number>; read: string[] }
  farm: { points: number; chapter: number; goals: Record<string, number>; festivals: FestivalResult[]; counts: Record<string, number> }
  homestead: Homestead
  /** Her route's event ids played, in order. */
  memories: Record<CharacterId, string[]>
  /** Arrival scenes played or skipped, in the order they played. */
  arrivals: CharacterId[]
  summary: MorningSummaryV4 | null
}

/** A save the farm's loop plays: v3 (M4, live) or v4 (the romance core, dark). */
export type FarmSave = SaveV3 | SaveV4

export const isSaveV4 = (save: { version: number }): save is SaveV4 => save.version === 4

/** Her route the day she joins: Friendship 0, no points (decision 8). */
export const newLove = (): Love => ({ stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0 })

/** A new Uma on the v4 roster: joined today, Novice at 0 points in all nine activities. */
export function newRosterUmaV4(day: number): RosterUmaV4 {
  return { joined: day, ranks: Object.fromEntries(ACTIVITIES.map((a) => [a, { points: 0, rank: 0, challenge: 0 }])) as Record<Activity, RankState>, wellFed: 0 }
}

/** The Farmhouse (RM41): house 0, there from day 1 (CS3 as RM65 amends it). */
export const FARMHOUSE: House = { name: 'Farmhouse', extended: false }

/** Day 1 on v4 (CS3, RM9, RM10): 500g, 9 Carrot seeds, Block A of 9 tilled plots, the Dorm at level 1 (3 beds), chapter 1,
 * the Farmhouse, the farmer's name empty, nobody on the roster: the name sheet, then the opening, bring the first three. */
export function newSaveV4(uid: string, now: string): SaveV4 {
  return {
    version: 4,
    account: { uid, createdAt: now, updatedAt: now },
    farmer: { name: '' },
    calendar: { day: 1 },
    gold: START_GOLD,
    today: { chats: [], gifts: [], praise: [], praised: [], events: [], evenings: [], invites: [] },
    roster: {},
    love: {},
    dorm: { level: 1, home: [], swaps: [] },
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
    homestead: { houses: [FARMHOUSE], tonight: null, slept: [0] },
    memories: {},
    arrivals: [],
    summary: null,
  }
}

/** The wipe (RM10, decision 2): any older save becomes day 1 on v4, its `account` copied whole (uid, `createdAt`,
 * `updatedAt`), so the conflict rule still sees the player's last change and the first upload isn't stamped. Pure. */
export function freshV4(stored: SaveV1 | SaveV2 | SaveV3): SaveV4 {
  return { ...newSaveV4(stored.account.uid, stored.account.createdAt), account: { ...stored.account } }
}
