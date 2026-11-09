// The morning summary (F18 decision 11; core spec CS5): data, never sentences. The night's last step builds it from what
// changed and the app words it, each line a tap to its place. It's replaced each night and set to null when the player
// dismisses it. CS5's six sections, in order; an empty one is hidden. Each packet fills its own lines and extends this
// shape in place while v3 is unreleased (until F24): F19 the bin, F20 crops and seeds, F21 ranks, F23 visitors, F24
// scenes and milestones; bonds come in M6.
import type { FestivalId, Season } from '../farm/calendar'
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

/** §2's lines: jobs by place, then crops ready by block, then what withered (CS5's order). */
export type WorkLine = JobsDone | CropsReady | CropsWithered

/** §5 New today: the season's first day, or a festival today or tomorrow (F18). */
export type NewsLine =
  | { kind: 'season'; season: Season }
  | { kind: 'festival'; festival: FestivalId; when: 'today' | 'tomorrow' }

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
  /** §2 Work done: jobs by place (F18), crops ready by block and what withered (F20). */
  work: WorkLine[]
  /** §3 Ranks: rank-ups, and Umas whose points are full (F21). */
  ranks: []
  /** §4 Bonds and affinity: new hearts (M6). */
  bonds: []
  /** §5 New today. */
  news: NewsLine[]
  /** §6 Today's nudges: idle Umas (F18), plots to plant (F20). */
  nudges: Nudge[]
}

/** CS5's order. */
export const SUMMARY_SECTIONS = ['bin', 'work', 'ranks', 'bonds', 'news', 'nudges'] as const
export type SummarySection = typeof SUMMARY_SECTIONS[number]

/** The sections with lines, in CS5's order: the card shows these and hides the rest. */
export const summarySections = (summary: MorningSummary): SummarySection[] => SUMMARY_SECTIONS.filter((section) => summary[section].length > 0)
