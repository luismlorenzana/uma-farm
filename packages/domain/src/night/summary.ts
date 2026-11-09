// The morning summary (F18 decision 11; core spec CS5): data, never sentences. The night's last step builds it from what
// changed and the app words it, each line a tap to its place. It's replaced each night and set to null when the player
// dismisses it. CS5's six sections, in order; an empty one is hidden. Each packet fills its own lines and extends this
// shape in place while v3 is unreleased (until F24): F19 the bin, F20 crops and seeds, F21 ranks, F23 visitors, F24
// scenes and milestones; bonds come in M6.
import type { FestivalId, Season } from '../farm/calendar'
import type { LoopPlaceId } from '../save/parse-v3'
import type { OutfitId } from '../save/v3'

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

/** §5 New today: the season's first day, or a festival today or tomorrow (F18). */
export type NewsLine =
  | { kind: 'season'; season: Season }
  | { kind: 'festival'; festival: FestivalId; when: 'today' | 'tomorrow' }

/** §6 Today's nudges: the Umas on the farm with no work this morning (F18). */
export interface IdleNudge {
  kind: 'idle'
  umas: OutfitId[]
}

export interface MorningSummary {
  /** The morning it opens on: the save's day. */
  day: number
  /** §1 The bin: yesterday's sales by good and star, in the catalogue's order, with the season's demand marked (F19).
   * The total is their gold added up. */
  bin: BinSale[]
  /** §2 Work done: jobs by place (F18), crops ready by block (F20). */
  work: JobsDone[]
  /** §3 Ranks: rank-ups, and Umas whose points are full (F21). */
  ranks: []
  /** §4 Bonds and affinity: new hearts (M6). */
  bonds: []
  /** §5 New today. */
  news: NewsLine[]
  /** §6 Today's nudges. */
  nudges: IdleNudge[]
}

/** CS5's order. */
export const SUMMARY_SECTIONS = ['bin', 'work', 'ranks', 'bonds', 'news', 'nudges'] as const
export type SummarySection = typeof SUMMARY_SECTIONS[number]

/** The sections with lines, in CS5's order: the card shows these and hides the rest. */
export const summarySections = (summary: MorningSummary): SummarySection[] => SUMMARY_SECTIONS.filter((section) => summary[section].length > 0)
