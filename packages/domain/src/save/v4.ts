// Save v4: the romance core's save, written whole now, the later packets' slots
// included, so each fills its own while v4 grows in place behind the dark switch (as v3 did in M4). F56 ships
// it; any change after F56 is v5.
//
// v4 is a wipe: any v1, v2 or v3 becomes a fresh v4 (`freshV4`), its `account` copied whole, so `updatedAt` moves
// only with the player's first change (the farmer's name). The wipe runs in the app, never in `parseSave`:
// the API reads v2, v3 and v4 as stored and never makes a save.
//
// The roster, the Dorm, work, bonds, `love`, `today`, `memories` and `arrivals` are keyed by character id. Her
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
/** The roster's key in the shared rules: an outfit id on v3, a character id on v4, both by `isOutfitId`'s
 * form. Where it meets master data, `outfitOf` turns it into her outfit. */
export type UmaId = string

/** Her route's stages: the ladder she's on, or the rung that waits. */
export const LOVE_STAGES = ['friendship', 'confession', 'romance', 'proposal', 'wedding', 'spouse'] as const
export type LoveStage = typeof LOVE_STAGES[number]

/** Her route with the farmer. F46 makes it at Friendship 0 the day she joins and pays her arrival scene into
 * `points`; F47 writes the ladders (`romance/love.ts`), F49 the events, F53 the ring and the wedding, F54 the houses. */
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
   * make until M6's merge game, so it's also her bonus in % once she's married (+1% a grade, `ringBonus`). */
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
  /** The festivals she's been at with you (F47 decision 9: +50 once a festival a year), as `<festival>:<year>`. */
  festivals: string[]
  /** The day her morning items' count started: the day she reached Romance 2 (every 4th morning from
   * it), then the day she reached Spouse 2 (every 2nd). `advance` sets it; absent before Romance 2. */
  morning?: number
  /** Her signature dish: the recipe her Friendship 4 gave, a dish id, so her profile can name it. */
  dish?: string
}

/** An Uma on the v4 roster: v3's without `affinity`, which became `love`. Talents aren't saved. */
export interface RosterUmaV4 {
  /** The day she joined. */
  joined: number
  ranks: Record<Activity, RankState>
  /** Well-fed days left. */
  wellFed: number
}

/** The evening's kinds: D42's ten date games, then festival night, its own slot on a
 * festival day. The rules, names and plays are `romance/evening.ts`'s; the ids live here so the save's parse stays light. */
export const EVENING_KINDS = ['walk', 'fishing', 'picnic', 'market', 'cooking', 'crafting', 'stargazing', 'dance', 'boat', 'footrace', 'festival'] as const
export type EveningKind = typeof EVENING_KINDS[number]
/** Festival night: a walk at the festival ground, the festival day's second evening. */
export const FESTIVAL_NIGHT = 'festival' satisfies EveningKind
/** A kind an invitation asks for: her favourite date game, never festival night. */
export type InviteKind = Exclude<EveningKind, typeof FESTIVAL_NIGHT>
/** Two evenings and two invitations from this many married… */
export const TWO_EVENINGS_MARRIED = 10
/** …the second evening on days divisible by this (D48: the Gate's old every-fourth-day rule). */
export const SECOND_EVENING_EVERY = 4
/** Spouses on the farm: what RM45's household milestones count. F54 reads it too. */
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

/** Today's once-a-day acts, cleared each night (F47–F50 fill them), and the bond hearts the morning compares. */
export interface TodayV4 {
  chats: CharacterId[]
  gifts: CharacterId[]
  /** Who earned praise today, overnight or by day. */
  praise: CharacterId[]
  /** Who you've praised today. */
  praised: CharacterId[]
  /** Whose event played today (one a day each). */
  events: CharacterId[]
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
}

/** A day's `today` before anything's done (newSaveV4; night step 7 clears to it). */
export const newTodayV4 = (): TodayV4 => ({ chats: [], gifts: [], praise: [], praised: [], events: [], asked: [], evenings: [], invites: [], bonds: {}, ring: 0, reception: 0 })

/** A house on the homestead: house 0 is the Farmhouse (two rooms, never extended), houses 1–6 are
 * appended as they're built, each named by you. */
export interface House {
  name: string
  extended: boolean
}
/** The homestead. **Who lives where is one source, `love.house`** (D48 call 8): a spouse's
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
  /** The morning the finale came (RM46: the morning after the 20th wedding), the Festival of Vows' day of the year; 0
   * before. */
  finale: number
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

/** Save v4. */
export interface SaveV4 {
  version: 4
  /** As stored: the wipe never changes it, and only a player's change moves `updatedAt`. */
  account: Account
  /** '' until the name sheet. */
  farmer: { name: string }
  calendar: { day: number }
  gold: number
  today: TodayV4
  roster: Record<CharacterId, RosterUmaV4>
  /** One per roster Uma, from the day she joins. */
  love: Record<CharacterId, Love>
  /** Levels 1–8: the level in effect, who's on the farm (≤ its beds) and swaps arriving tomorrow. */
  dorm: { level: number; home: CharacterId[]; swaps: DormSwap[] }
  items: Warehouse
  bin: Warehouse
  /** uma-work's rows; `outfitId` holds her character id, the roster's key. */
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

/** A save the farm's loop plays: v3 (live) or v4 (the romance core, dark). */
export type FarmSave = SaveV3 | SaveV4

export const isSaveV4 = (save: { version: number }): save is SaveV4 => save.version === 4

/** Her route the day she joins: Friendship 0, no points. */
export const newLove = (): Love => ({ stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] })

/** A new Uma on the v4 roster: joined today, Novice at 0 points in all nine activities. */
export function newRosterUmaV4(day: number): RosterUmaV4 {
  return { joined: day, ranks: Object.fromEntries(ACTIVITIES.map((a) => [a, { points: 0, rank: 0, challenge: 0 }])) as Record<Activity, RankState>, wellFed: 0 }
}

/** The Farmhouse: house 0, there from day 1 (CS3 as RM65 amends it). */
export const FARMHOUSE: House = { name: 'Farmhouse', extended: false }

/** Day 1 on v4: 500g, 9 Carrot seeds, Block A of 9 tilled plots, the Dorm at level 1 (3 beds), chapter 1,
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

/** The wipe: any older save becomes day 1 on v4, its `account` copied whole (uid, `createdAt`,
 * `updatedAt`), so the conflict rule still sees the player's last change and the first upload isn't stamped. Pure. */
export function freshV4(stored: SaveV1 | SaveV2 | SaveV3): SaveV4 {
  return { ...newSaveV4(stored.account.uid, stored.account.createdAt), account: { ...stored.account } }
}
