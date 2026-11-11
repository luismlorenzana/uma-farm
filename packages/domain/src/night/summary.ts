// The morning summary (F18 decision 11; core spec CS5): data, never sentences. The night's last step builds it from what
// changed and the app words it, each line a tap to its place. It's replaced each night and set to null when the player
// dismisses it. CS5's six sections, in order; an empty one is hidden. Each M4 packet filled its own lines in place while
// v3 was unreleased: F19 the bin, F20 crops and seeds, F21 ranks, F23 the Dorm, swaps and visitors, F24 the chapter,
// the Farm Rank and the Diary's milestones. v3 is live from F24, so a new line is a new save version; bonds come in M6.
import type { FestivalId, Season } from '../farm/calendar'
import type { Activity, Rank } from '../farm/ranks'
import type { CropId } from '../goods/ids'
import type { LoopPlaceId } from '../save/parse-v3'
import type { BlockId, OutfitId } from '../save/v3'

/** §1 The bin (F19 decision 6): a good at one star that sold tonight, how many, the gold they made, and whether the
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

/** §2 Work done: jobs that finished overnight at a place, and the items they made (F18). */
export interface JobsDone {
  kind: 'jobs'
  place: LoopPlaceId
  jobs: number
  items: number
}

/** §2 Work done: plots on a block that turned Ready overnight (F20). */
export interface CropsReady {
  kind: 'crops'
  block: BlockId
  plots: number
}

/** §2 Work done: plots on a block whose crop withered on a season's last night, by crop (F20). */
export interface CropsWithered {
  kind: 'withered'
  block: BlockId
  crop: CropId
  plots: number
}

/** §2 Work done: the night's best catch, the most valuable fish caught tonight at its stars (F22). Its size is measured
 * when it's collected. */
export interface BestCatchLine {
  kind: 'catch'
  id: string
  stars: number
}

/** §2's lines: jobs by place, the night's best catch, then crops ready by block, then what withered (CS5's order). */
export type WorkLine = JobsDone | BestCatchLine | CropsReady | CropsWithered

/** §3 Ranks (F21): she reached a rank in an activity tonight. */
export interface RankUp {
  kind: 'rank-up'
  outfitId: OutfitId
  activity: Activity
  /** The rank she reached, Hand … Legend. */
  rank: Rank
}

/** §3 Ranks (F21): her points for her next rank filled tonight, and its challenge waits; `challenge` is her count
 * toward it as the night left it. */
export interface PointsFull {
  kind: 'full'
  outfitId: OutfitId
  activity: Activity
  /** The rank she waits for, Hand … Legend. */
  rank: Rank
  challenge: number
}

/** §3's lines: rank-ups, then points full (F21). */
export type RankLine = RankUp | PointsFull

/** §5 New today: the season's first day, or a festival today or tomorrow (F18); the goals' news (F24): the chapter
 * completed tonight, a Farm Rank reached, a Diary milestone or row paid; and the roster's news (F23): the Dorm's new
 * level in effect, Umas a swap brought home, a recruit who joined tonight (home or away; F24's chapter recruits), a
 * visitor at the Gate, and one who left. */
export type NewsLine =
  | { kind: 'season'; season: Season }
  | { kind: 'festival'; festival: FestivalId; when: 'today' | 'tomorrow' }
  | { kind: 'chapter'; chapter: number }
  | { kind: 'farm-rank'; rank: number }
  | { kind: 'milestone'; id: string }
  | { kind: 'dorm'; level: number }
  | { kind: 'home'; umas: OutfitId[] }
  | { kind: 'joined'; outfitId: OutfitId; home: boolean }
  | { kind: 'gate'; outfitId: OutfitId }
  | { kind: 'left'; outfitId: OutfitId }

/** §6 Today's nudges: the Umas on the farm with no work this morning (F18). */
export interface IdleNudge {
  kind: 'idle'
  umas: OutfitId[]
}

/** §6 Today's nudges: empty plots that the seeds in the Warehouse could fill today (F20). */
export interface SeedsNudge {
  kind: 'seeds'
  plots: number
}

export type Nudge = IdleNudge | SeedsNudge

export interface MorningSummary {
  /** The morning it opens on: the save's day. */
  day: number
  /** §1 The bin: yesterday's sales by good and star, in the catalogue's order, with the season's demand marked (F19).
   * The total is their gold added up. */
  bin: BinSale[]
  /** §2 Work done: jobs by place (F18), the night's best catch (F22), crops ready by block and what withered (F20). */
  work: WorkLine[]
  /** §3 Ranks: rank-ups, then Umas whose points filled tonight with their challenge to meet (F21). */
  ranks: RankLine[]
  /** §4 Bonds and affinity: new hearts (M6). */
  bonds: []
  /** §5 New today: the season and festivals (F18), the goals' news (F24), then the roster's news (F23). */
  news: NewsLine[]
  /** §6 Today's nudges: idle Umas (F18), plots to plant (F20). */
  nudges: Nudge[]
}

// --- Save v4's morning (F46 decision 15; romance spec RM57): §4 becomes Hearts ------------------------------------------

/** §4 Hearts (F46): an Uma who arrived overnight, home or away on her off-season; her arrival scene waits for the farm to
 * open. F47, F49–F52 and F54 add their lines in place while v4 is dark; F48 orders and draws the section (RM57). */
export interface ArrivedLine {
  kind: 'arrived'
  /** Her character id. */
  id: string
  home: boolean
}
/** §4 Hearts (F47 decision 14; RM16): her birthday today or tomorrow, a ★ line the day before and on the day. */
export interface BirthdayLine {
  kind: 'birthday'
  id: string
  when: 'today' | 'tomorrow'
}
/** §4 Hearts (F47 decision 14; RM17): her wedding's day of the year, from year 2 of her marriage, today or tomorrow. On
 * the day she leaves a ★5 item of her line in the Warehouse: `item` is its good, null the day before. */
export interface AnniversaryLine {
  kind: 'anniversary'
  id: string
  when: 'today' | 'tomorrow'
  item: string | null
}
/** §4 Hearts (F52 decision 7; CS17): side by side tonight, the extras in all: copies of a night's items for Umas who worked
 * beside a 3-heart partner, straight into the Warehouse. Once a night. */
export interface SideLine {
  kind: 'side'
  items: number
}
/** §4 Hearts (F52 decision 9; RM50, RM57's sixth line): a pair's bond reached `hearts` since the last morning, by points or
 * a seed; one line a pair at its highest heart, `a` and `b` in `pairKey` order. Whether it has **Read** is the pack's (its
 * authored levels) and the save's (`diary.read`), read as the card shows. */
export interface BondLine {
  kind: 'bond'
  a: string
  b: string
  hearts: number
}
/** §4's stored lines: birthdays and anniversaries (F47), then arrivals (F46), then side by side and bond hearts (F52). Ready
 * lines aren't stored: they change by day, so F48 reads them live (`readiness`). */
export type HeartLine = BirthdayLine | AnniversaryLine | ArrivedLine | SideLine | BondLine

/** §5 on v4: v3's news without its roster lines (`joined`, `gate`, `left`): arrivals are §4's, and the Gate has no
 * visitors. Rank lines' `outfitId` holds the roster's key, her character id (decision 5). */
export type NewsLineV4 = Exclude<NewsLine, { kind: 'joined' | 'gate' | 'left' }>

/** The morning on save v4: v3's sections with §4 `bonds: []` replaced by `hearts`. */
export interface MorningSummaryV4 {
  day: number
  bin: BinSale[]
  work: WorkLine[]
  ranks: RankLine[]
  /** §4 Hearts: birthdays and anniversaries (F47), then arrivals (F46), then side by side and bond hearts (F52); the
   * romance's lines join with their packets. */
  hearts: HeartLine[]
  news: NewsLineV4[]
  nudges: Nudge[]
}

/** CS5's order. */
export const SUMMARY_SECTIONS = ['bin', 'work', 'ranks', 'bonds', 'news', 'nudges'] as const
export type SummarySection = typeof SUMMARY_SECTIONS[number]
/** v4's order: Hearts in §4's place (RM57). */
export const SUMMARY_SECTIONS_V4 = ['bin', 'work', 'ranks', 'hearts', 'news', 'nudges'] as const
export type SummarySectionV4 = typeof SUMMARY_SECTIONS_V4[number]

/** The sections with lines, in CS5's order: the card shows these and hides the rest. A v4 morning's §4 is Hearts. */
export function summarySections(summary: MorningSummary): SummarySection[]
export function summarySections(summary: MorningSummary | MorningSummaryV4): (SummarySection | SummarySectionV4)[]
export function summarySections(summary: MorningSummary | MorningSummaryV4): (SummarySection | SummarySectionV4)[] {
  if ('hearts' in summary) return SUMMARY_SECTIONS_V4.filter((section) => summary[section].length > 0)
  return SUMMARY_SECTIONS.filter((section) => summary[section].length > 0)
}
