// The morning summary: data, never sentences. The night's last step builds it from what
// changed and the app words it, each line a tap to its place. It's replaced each night and set to null when the player
// dismisses it. Six sections, in order; an empty one is hidden. A new line kind is a new part of the save's parse.
import type { FestivalId, Season } from '../farm/calendar'
import type { FarmPlaceId } from '../farm/places'
import type { Activity, Rank } from '../farm/ranks'
import type { CropId } from '../goods/ids'
import type { LoopPlaceId } from '../save/parse-v4'
import type { BlockId, OutfitId } from '../save/v4'
import type { InviteKind } from '../save/v4'

/** §1 The bin: a good at one star that sold tonight, how many, the gold they made, and whether the
 * season's demand lifted their price. Its gold is the night's, never checked again: a price changing later can't break
 * an old morning. */
export interface BinSale {
  kind: 'sold'
  id: string
  stars: number
  count: number
  gold: number
  demand: boolean
}

/** §2 Work done: jobs that finished overnight at a place, and the items they made. */
export interface JobsDone {
  kind: 'jobs'
  place: LoopPlaceId
  jobs: number
  items: number
}

/** §2 Work done: plots on a block that turned Ready overnight. */
export interface CropsReady {
  kind: 'crops'
  block: BlockId
  plots: number
}

/** §2 Work done: plots on a block whose crop withered on a season's last night, by crop. */
export interface CropsWithered {
  kind: 'withered'
  block: BlockId
  crop: CropId
  plots: number
}

/** §2 Work done: the night's best catch, the most valuable fish caught tonight at its stars. Its size is measured
 * when it's collected. */
export interface BestCatchLine {
  kind: 'catch'
  id: string
  stars: number
}

/** §2's lines: jobs by place, the night's best catch, then crops ready by block, then what withered (in section
 * order). */
export type WorkLine = JobsDone | BestCatchLine | CropsReady | CropsWithered

/** §3 Ranks: she reached a rank in an activity tonight. */
export interface RankUp {
  kind: 'rank-up'
  outfitId: OutfitId
  activity: Activity
  /** The rank she reached, Hand … Legend. */
  rank: Rank
}

/** §3 Ranks: her points for her next rank filled tonight, and its challenge waits; `challenge` is her count
 * toward it as the night left it. */
export interface PointsFull {
  kind: 'full'
  outfitId: OutfitId
  activity: Activity
  /** The rank she waits for, Hand … Legend. */
  rank: Rank
  challenge: number
}

/** §3's lines: rank-ups, then points full. */
export type RankLine = RankUp | PointsFull

/** §5 New today: a household milestone reached, as the married count passed 1, 5, 10, 15 or 20. */
export interface HouseholdNews {
  kind: 'household'
  married: number
}

/** §5 New today: the season's first day, or a festival today or tomorrow; the goals' news: a place built
 * overnight, a Farm Rank reached, a Diary milestone or row paid; the household's milestones; and the Dorm's
 * news: its new level in effect and Umas a swap brought home. Arrivals are §4's. */
export type NewsLine =
  | { kind: 'season'; season: Season }
  | { kind: 'festival'; festival: FestivalId; when: 'today' | 'tomorrow' }
  | { kind: 'built'; place: FarmPlaceId }
  | { kind: 'farm-rank'; rank: number }
  | { kind: 'milestone'; id: string }
  | { kind: 'dorm'; level: number }
  | { kind: 'home'; umas: OutfitId[] }
  | HouseholdNews

/** §6 Today's nudges: the Umas on the farm with no work this morning. */
export interface IdleNudge {
  kind: 'idle'
  umas: OutfitId[]
}

/** §6 Today's nudges: empty plots that the seeds in the Warehouse could fill today. */
export interface SeedsNudge {
  kind: 'seeds'
  plots: number
}

export type Nudge = IdleNudge | SeedsNudge

// --- §4 Hearts ------------------------------------------------------------------------

/** §4 Hearts: an Uma who arrived overnight, home or away on her off-season; her arrival scene waits for the farm to
 * open. The app orders and draws the section. */
export interface ArrivedLine {
  kind: 'arrived'
  /** Her character id. */
  id: string
  home: boolean
}
/** §4 Hearts: her birthday today or tomorrow, a ★ line the day before and on the day. */
export interface BirthdayLine {
  kind: 'birthday'
  id: string
  when: 'today' | 'tomorrow'
}
/** §4 Hearts: her wedding's day of the year, from year 2 of her marriage, today or tomorrow. On
 * the day she leaves a ★5 item of her line in the Warehouse: `item` is its good, null the day before. */
export interface AnniversaryLine {
  kind: 'anniversary'
  id: string
  when: 'today' | 'tomorrow'
  item: string | null
}
/** §4 Hearts: side by side tonight, the extras in all: copies of a night's items for Umas who worked
 * beside a 3-heart partner, straight into the Warehouse. Once a night. */
export interface SideLine {
  kind: 'side'
  items: number
}
/** §4 Hearts: a pair's bond reached `hearts` since the last morning, by points or
 * a seed; one line a pair at its highest heart, `a` and `b` in `pairKey` order. Whether it has **Read** is the pack's (its
 * authored levels) and the save's (`diary.read`), read as the card shows. */
export interface BondLine {
  kind: 'bond'
  a: string
  b: string
  hearts: number
}
/** §4 Hearts: her invitation this morning, drawn at step 9 into
 * `today.invites`, asking for her favourite kind. Its answer (Yes, tonight or Another day) is `today.invites`', read as the
 * card shows. */
export interface InviteLine {
  kind: 'invite'
  id: string
  /** The kind she asks for: her favourite. */
  evening: InviteKind
}
/** §4 Hearts (R2 and S2): her morning item, a good of her line she left in the
 * Warehouse this morning; `items` its stock keys (`<good>@<stars>`), one by her count (the house's adds one). */
export interface ItemLine {
  kind: 'item'
  id: string
  items: string[]
}
/** §4 Hearts: the night's chores in all, once a night: the items they left in
 * the Warehouse (a forager's and a fisher's) and the growth they gave the Fields (a farmer's, +0.25 each). */
export interface ChoresLine {
  kind: 'chores'
  items: number
  growth: number
}
/** §4 Hearts (before side by side): the perks' extras tonight in all, copies of
 * a night's items by the romance term (her line's +10% and +20%, her ring, dreams and the household), into the Warehouse. */
export interface PerksLine {
  kind: 'perks'
  items: number
}
/** §4 Hearts: the house you slept in, its morning: `umas` the residents it
 * counted (only hers on a birthday-alone night), `paid` their +30s in all (an anniversary's ×2 inside), `breakfast` the
 * Umas her breakfast fed (0 none) and `items` the house's extra morning items (each in its Uma's `item` line). The house
 * line is drawn live from the pack and the templates (`houseLineOf`), never stored. */
export interface HouseLine {
  kind: 'house'
  house: number
  umas: string[]
  paid: number
  breakfast: number
  items: number
}
/** §4 Hearts: a house with residents you haven't slept in for 8 nights or more invites you warmly.
 * **Tonight ›** picks it; **Another night** hides the line for the day. Never a penalty. */
export interface HouseMissesLine {
  kind: 'misses'
  house: number
}
/** §4 Hearts: a spouse who waited for a room moved in this morning, a house having been built. */
export interface MovedLine {
  kind: 'moved'
  id: string
  house: number
}
/** §4 Hearts: a spouse level reached overnight, S2 or S4, her 600 full.
 * Opening it shows the level-up card. */
export interface LevelLine {
  kind: 'level'
  id: string
  rung: 's2' | 's4'
}
/** §4 Hearts: the Festival of Vows, each year on the finale's day: every spouse +50 (`paid` in all),
 * and a festival night tonight. */
export interface VowsLine {
  kind: 'vows'
  spouses: number
  paid: number
}
/** §4's stored lines: invitations, birthdays and anniversaries and the Festival of Vows, then arrivals
 * and the night's levels, then the house's morning, a move-in and a house that misses you, morning items
 * and night chores, then the perks' extras, side by side and bond hearts. Ready lines aren't stored: they
 * change by day, so the app reads them live (`readiness`). */
export type HeartLine = InviteLine | BirthdayLine | AnniversaryLine | ArrivedLine | ItemLine | ChoresLine | PerksLine | SideLine | BondLine | HouseLine | HouseMissesLine
  | MovedLine | LevelLine | VowsLine

/** The morning summary: its six sections. */
export interface MorningSummary {
  /** The morning it opens on: the save's day. */
  day: number
  /** §1 The bin: yesterday's sales by good and star, in the catalogue's order, with the season's demand marked.
   * The total is their gold added up. */
  bin: BinSale[]
  /** §2 Work done: jobs by place, the night's best catch, crops ready by block and what withered. */
  work: WorkLine[]
  /** §3 Ranks: rank-ups, then Umas whose points filled tonight with their challenge to meet. */
  ranks: RankLine[]
  /** §4 Hearts: invitations, birthdays and anniversaries, then arrivals, then side by side and bond hearts. */
  hearts: HeartLine[]
  /** §5 New today: the season and festivals, the goals' news, the household's, then the Dorm's. */
  news: NewsLine[]
  /** §6 Today's nudges: idle Umas, plots to plant. */
  nudges: Nudge[]
}

/** The sections' order. */
export const SUMMARY_SECTIONS = ['bin', 'work', 'ranks', 'hearts', 'news', 'nudges'] as const
export type SummarySection = typeof SUMMARY_SECTIONS[number]

/** The sections with lines, in order: the card shows these and hides the rest. */
export function summarySections(summary: MorningSummary): SummarySection[] {
  return SUMMARY_SECTIONS.filter((section) => summary[section].length > 0)
}
