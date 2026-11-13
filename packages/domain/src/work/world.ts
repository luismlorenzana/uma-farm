// The seam: the state the copied Wilds rules read, in place of uma-rpg's `TierWorld` (save/save.ts at 30a322a), whose
// fights, tiers, parties, wallet and gear stay behind. It is uma-work's three parts plus each Uma's Craft Level: the
// farm's save holds it whole (save v2).
import type { WorkRow, WorkState } from '@luismlorenzana/uma-work'
import type { FarmWorkRequest } from './request'

/** Her Craft Level, 1–50: gathering, processing and making. */
export interface ProfessionLevel { level: number; exp: number }

/** An Uma the farm has seen work: her Craft Level. Every outfit on the release may work; she has a row from her first job. */
export interface FarmUma { craft: ProfessionLevel }

export interface FarmWorld extends WorkState<FarmWorkRequest> {
  /** Every Uma who has worked, by outfit id. */
  umas: Record<string, FarmUma>
  /** The Warehouse: line items and made items by id, free to use (a job's inputs leave it when the job starts). */
  items: Record<string, number>
  /** uma-work's building levels: always empty, since the Wilds' places have no levels. */
  buildings: Record<string, { level: number }>
  /** Each Uma's work, by outfit id: her started entries, up to three queued, her last job for Repeat and a queue that
   * couldn't start. Absent when she has none of these. */
  work: Record<string, WorkRow<FarmWorkRequest>>
}
