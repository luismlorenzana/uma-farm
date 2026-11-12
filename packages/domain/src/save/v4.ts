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
import { DAYS_PER_YEAR } from '../farm/calendar'
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
 * `points`; F47 writes the ladders (`romance/love.ts`), F49 the events, F53 the ring and the wedding, F54 the houses. */
export interface Love {
  stage: LoveStage
  /** Events played on this ladder (F47 decision 2): friendship and romance 0–9 (the tenth moves her on), 10 while the
   * confession, the proposal or the wedding waits, spouse 0–5 (S5 completes the route). */
  level: number
  /** Toward the next rung; past it, banked (RM14). Whole: every pay rounds once (F47 decision 2). */
  points: number
  /** The day of her last event (one a day, RM21); 0 before any. */
  last: number
  /** "Not yet" at her confession (RM30): only while the confession waits. */
  friend?: true
  /** Her ring's grade, 1–10 (F53 decision 6; RM39): set at the proposal, raised by a better ring. Every ring is a Rough
   * make until M6's merge game, so it's also her bonus in % once she's married (+1% a grade, `ringBonus`). */
  ring?: number
  /** The wedding's day: a spouse's. */
  wed?: number
  /** Her room's house (RM42): a spouse's. */
  house?: number
  /** Goods ids whose taste you've learnt (RM15). */
  known: string[]
  /** Set by choices; they change wording only (RM27). */
  flags: string[]
  /** The day of her last evening (F50): what the invitations' weight reads; 0 before any. */
  evening: number
  /** The festivals she's been at with you (F47 decision 9: +50 once a festival a year), as `<festival>:<year>`. */
  festivals: string[]
  /** The day her morning items' count started (F51 decision 6): the day she reached Romance 2 (every 4th morning from
   * it), then the day she reached Spouse 2 (every 2nd). `advance` sets it; absent before Romance 2. */
  morning?: number
  /** Her signature dish (F51 decision 9): the recipe her Friendship 4 gave, a dish id, so her profile can name it. */
  dish?: string
}

/** An Uma on the v4 roster: v3's without `affinity`, which became `love` (RM10). Talents aren't saved. */
export interface RosterUmaV4 {
  /** The day she joined. */
  joined: number
  ranks: Record<Activity, RankState>
  /** Well-fed days left (CS22). */
  wellFed: number
}

/** The evening's kinds (F50 decision 1; romance spec RM37): D42's ten date games, then festival night, its own slot on a
 * festival day. The rules, names and plays are `romance/evening.ts`'s; the ids live here so the save's parse stays light. */
export const EVENING_KINDS = ['walk', 'fishing', 'picnic', 'market', 'cooking', 'crafting', 'stargazing', 'dance', 'boat', 'footrace', 'festival'] as const
export type EveningKind = typeof EVENING_KINDS[number]
/** Festival night (RM19): a walk at the festival ground, the festival day's second evening. */
export const FESTIVAL_NIGHT = 'festival' satisfies EveningKind
/** A kind an invitation asks for: her favourite date game, never festival night. */
export type InviteKind = Exclude<EveningKind, typeof FESTIVAL_NIGHT>
/** Two evenings and two invitations (RM45) from this many married… */
export const TWO_EVENINGS_MARRIED = 10
/** …the second evening on days divisible by this (F50 decision 5; D48: the Gate's old every-fourth-day rule). */
export const SECOND_EVENING_EVERY = 4
/** Spouses on the farm (F50 decision 5): what RM45's household milestones count. F54 reads it too. */
export const marriedCount = (save: Pick<SaveV4, 'love'>): number => Object.values(save.love).filter((love) => love.stage === 'spouse').length
/** Today's evening slots besides festival night (F50 decision 5): one, and a second on days divisible by 4 from 10 married. */
export const eveningsOn = (day: number, married: number): number => (married >= TWO_EVENINGS_MARRIED && day % SECOND_EVENING_EVERY === 0 ? 2 : 1)
/** Morning invitations (RM20): one, two from 10 married. */
export const invitesFor = (married: number): number => (married >= TWO_EVENINGS_MARRIED ? 2 : 1)

/** An evening spent with her (F50 decision 5): one a slot, `festival` filling festival night's. */
export interface Evening {
  with: CharacterId
  kind: EveningKind
}
/** A morning invitation (F50 decision 7): drawn at night step 9, answered Yes or Another day, cleared at step 7. */
export interface Invite {
  id: CharacterId
  kind: InviteKind
  answer: 'yes' | 'no' | null
}

/** Today's once-a-day acts, cleared each night (F47–F50 fill them), and the bond hearts the morning compares (F52). */
export interface TodayV4 {
  chats: CharacterId[]
  gifts: CharacterId[]
  /** Who earned praise today, overnight or by day (F47). */
  praise: CharacterId[]
  /** Who you've praised today. */
  praised: CharacterId[]
  /** Whose event played today (one a day each, RM21). */
  events: CharacterId[]
  /** Whom you asked again after her confession's "Not yet" today (F49 decision 10): Ask her once a day, never her event. */
  asked: CharacterId[]
  /** Evenings spent today (F50): one a slot, in the order played. */
  evenings: Evening[]
  /** This morning's invitations (F50): at most one, two from 10 married, each a different Uma. */
  invites: Invite[]
  /** Bond hearts before each pair's first move since the last morning (F52 decision 9), by `pairKey`: the morning lists what
   * rose since, whether a day (the opening's seeds) or the night moved it. Night step 9 empties it. */
  bonds: Record<string, number>
  /** The ring made at the bench today (F53 decision 3): its grade, 0 before one. One a day. */
  ring: number
  /** Today's wedding reception (F53 decision 9): the well-fed days it gives everyone on the farm tomorrow (1–3), applied at
   * night step 9; 0 with no wedding today. */
  reception: number
}

/** A day's `today` before anything's done (newSaveV4; night step 7 clears to it). */
export const newTodayV4 = (): TodayV4 => ({ chats: [], gifts: [], praise: [], praised: [], events: [], asked: [], evenings: [], invites: [], bonds: {}, ring: 0, reception: 0 })

/** A house on the homestead (RM41; F54 decision 1): house 0 is the Farmhouse (two rooms, never extended), houses 1–6 are
 * appended as they're built, each named by you. */
export interface House {
  name: string
  extended: boolean
}
/** The homestead (RM41–RM46; F54 decision 1). **Who lives where is one source, `love.house`** (D48 call 8): a spouse's
 * room is in the house of that number, and she has no Dorm bed. */
export interface Homestead {
  houses: House[]
  /** Tonight's house (Sleep at, RM22), or null before a pick: the night takes the default then. */
  tonight: number | null
  /** "Her room" tonight (RM44): a birthday-alone wisher on her birthday, whose house is `tonight`; her morning is hers
   * alone. Null on any other night. */
  alone: CharacterId | null
  /** The last night slept in each house (the evening's day); 0 never. */
  slept: number[]
  /** The furniture set (RM45, F54 decision 9): empty until 5 married, then five pieces, each the house it stands in or null. */
  furniture: (number | null)[]
  /** The married count the night last saw (F54 decision 9): household milestones are news once, as it passes 1, 5, 10, 15
   * and 20, and household scenes are Ready from the morning after. */
  married: number
  /** The morning the finale came (RM46: the morning after the 20th wedding), the Festival of Vows' day of the year; 0
   * before. */
  finale: number
}

/** A house's rooms (RM41): two, four once extended. */
export const HOUSE_ROOMS = 2
export const EXTENDED_ROOMS = 4
export const roomsOf = (house: Pick<House, 'extended'>): number => (house.extended ? EXTENDED_ROOMS : HOUSE_ROOMS)
/** The homestead's places: the Farmhouse and six houses (RM41). */
export const MAX_HOUSES = 7
/** The furniture set's pieces (RM45). */
export const FURNITURE_PIECES = 5
/** The household milestones (RM45): the homestead at 1, household scenes at 5, 10 and 15, the finale at 20. */
export const HOUSEHOLD_MILESTONES: readonly number[] = [1, 5, 10, 15, 20]
/** The finale's count (RM46): 20 married. */
export const FINALE_MARRIED = 20

/** A house's residents (RM42): the spouses whose room is there, in wedding order (her wedding's day, then her id). */
export function residentsOf(save: Pick<SaveV4, 'love'>, house: number): CharacterId[] {
  return Object.entries(save.love).filter(([, love]) => love.house === house)
    .sort(([a, x], [b, y]) => (x.wed ?? 0) - (y.wed ?? 0) || Number(a) - Number(b)).map(([id]) => id)
}

/** Whether a day is the Festival of Vows (RM46; F54 decision 13): the finale's day of the year, each later year. */
export const vowsOn = (homestead: Pick<Homestead, 'finale'>, day: number): boolean =>
  homestead.finale > 0 && day > homestead.finale && (day - homestead.finale) % DAYS_PER_YEAR === 0

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
export const newLove = (): Love => ({ stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] })

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
    today: newTodayV4(),
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
    homestead: { houses: [FARMHOUSE], tonight: null, alone: null, slept: [0], furniture: [], married: 0, finale: 0 },
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
