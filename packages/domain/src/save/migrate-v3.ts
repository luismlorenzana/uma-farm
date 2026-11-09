// v2 → v3 (F17; core spec CS54, D25, D28, D29): the Wilds' save carried into the farm's own loop. It runs once, in the
// loop's boot, after master data's roster has loaded: her calling's line comes from master data, which the API's parse
// doesn't have (decision 2). Pure and deterministic, and it never moves `account.updatedAt` (nor `createdAt` or `uid`).
//
// | Step | What |
// |---|---|
// | 1 | Running jobs finish into the Warehouse, paying their Craft EXP first; queues and stopped queues drop |
// | 2 | Materials still goods in v3 carry over at ★1; what leaves the game is refunded per grade (D28) |
// | 3 | Craft Level becomes her rank in her calling's activity (CS32); the other eight start at Novice |
// | 4 | Every Uma in `umas` joins on day 1; the Dorm's level is the lowest with a bed for each, free |
// | 5 | The calendar starts: day 1, 500g plus the refunds, Block A, 9 Carrot seeds, chapter 1 |
// | 6 | Everything else starts empty: Farm Rank 1, the Diary, bonds, the board |
import { endsAt } from '@luismlorenzana/uma-work'
import { bedsAt, dormLevelFor } from '../farm/farm'
import { craftRank, LINE_ACTIVITY, type Activity } from '../farm/ranks'
import { isGoodId } from '../goods/ids'
import { lineItem, type MaterialLine } from '../items/lines'
import { madeIdentity } from '../items/made-id'
import { madeRefinedV4 } from '../items/made-v4'
import type { FarmUma } from '../work/world'
import type { SaveV2 } from './save'
import { newRosterUma, newSave, type OutfitId, type RankState, type RosterUma, type SaveV3, type Warehouse } from './v3'
import { addGoods } from './warehouse'
import { collectAll } from './work'

/** What the migration reads from master data. */
export interface MigrationContext {
  /** Her calling's line (`farmRoster`'s), or null for an outfit the release no longer has: she joins at Novice everywhere. */
  lineOf(outfitId: OutfitId): MaterialLine | null
}

/** The day migrated Umas join: the calendar's first. */
const FIRST_DAY = 1

// --- Step 1: running jobs finish ------------------------------------------------------------------------------------

/** Every started entry completes into the Warehouse as if its last night had come, paying its Craft EXP first (so a level
 * it earns counts in step 3). Queues and stopped queues drop: uma-work reserves nothing for a queued job, so nothing comes
 * back. The work rows go; the account stays as it was. */
export function finishJobs(save: SaveV2): SaveV2 {
  const rows = Object.values(save.work)
  const cleared: SaveV2 = { ...save, work: Object.fromEntries(rows.map((row) => [row.outfitId, { ...row, queue: [], dropped: null }])) }
  // A second past the last item's end, whole milliseconds: every entry is finished then.
  const last = rows.flatMap((row) => row.entries.map((entry) => endsAt(entry))).reduce((a, b) => Math.max(a, b), 0)
  const { save: collected } = collectAll(cleared, new Date(Math.ceil(last) + 1000).toISOString())
  return { ...collected, account: save.account, work: {} }
}

// --- Step 2: materials ----------------------------------------------------------------------------------------------

/** The gold a v2 item that leaves the game is worth (D28): a raw line item 10g × its grade, a refined one 15g × its grade,
 * a made item 15g × its grade × the refined items in its recipe (an Arms Gem G3 is 15 × 3 × 10 = 450g). */
export function refundOf(id: string): number {
  const item = lineItem(id)
  if (item) return (item.refined ? 15 : 10) * item.grade
  const made = madeIdentity(id)
  if (made) return 15 * made.grade * madeRefinedV4(id)
  throw new RangeError(`${id} isn't a v2 item`)
}

/** A v2 Warehouse in v3: what is still a good (ores and ingots, logs and planks, fish and fillets, crystals and cut
 * crystals, raw vegetables) carries over at ★1; the rest (the vegetables' refined forms, the made items) is refunded. */
export function carryMaterials(items: Readonly<Record<string, number>>): { items: Warehouse; refund: number } {
  let carried: Warehouse = {}
  let refund = 0
  for (const [id, n] of Object.entries(items)) {
    if (n <= 0) continue
    if (isGoodId(id)) carried = addGoods(carried, id, 1, n)
    else refund += n * refundOf(id)
  }
  return { items: carried, refund }
}

// --- Step 3: Craft Level becomes her rank ---------------------------------------------------------------------------

/** Her nine activities: Novice at 0 points, but her calling's, which takes her Craft Level's rank and points (CS32), every
 * challenge up to it done (her count toward the next starts at 0). */
export function ranksFromCraft(level: number, line: MaterialLine | null): Record<Activity, RankState> {
  const ranks = newRosterUma(FIRST_DAY).ranks
  if (line) ranks[LINE_ACTIVITY[line]] = { ...craftRank(level), challenge: 0 }
  return ranks
}

// --- Step 4: the roster ---------------------------------------------------------------------------------------------

/** Every Uma in v2's `umas` joins on day 1, and the Dorm's level is the lowest with a bed for each. With more than 60 (the
 * most beds), the 60 with the most mapped rank points live home, ties by outfit id; the rest are on their off-season. */
export function rosterFromUmas(umas: Readonly<Record<OutfitId, FarmUma>>, lineOf: MigrationContext['lineOf']): { roster: Record<OutfitId, RosterUma>; dorm: SaveV3['dorm'] } {
  const roster: Record<OutfitId, RosterUma> = {}
  const mapped: { id: OutfitId; points: number }[] = []
  for (const [id, uma] of Object.entries(umas)) {
    const line = lineOf(id)
    const ranks = ranksFromCraft(uma.craft.level, line)
    roster[id] = { ...newRosterUma(FIRST_DAY), ranks }
    mapped.push({ id, points: line ? ranks[LINE_ACTIVITY[line]].points : 0 })
  }
  const level = dormLevelFor(mapped.length)
  const byId = (a: OutfitId, b: OutfitId) => Number(a) - Number(b)
  const home = [...mapped].sort((a, b) => b.points - a.points || byId(a.id, b.id)).slice(0, bedsAt(level)).map((m) => m.id).sort(byId)
  return { roster, dorm: { level, home, swaps: [] } }
}

// --- The whole migration --------------------------------------------------------------------------------------------

/** A v2 save as the loop's v3 (CS54): steps 1–6 above. The account is v2's own, untouched. */
export function migrateToV3(save: SaveV2, context: MigrationContext): SaveV3 {
  const done = finishJobs(save)
  const { items, refund } = carryMaterials(done.items)
  const { roster, dorm } = rosterFromUmas(done.umas, context.lineOf)
  const start = newSave(save.account.uid, save.account.createdAt)
  let warehouse = start.items
  for (const [id, row] of Object.entries(items)) warehouse = addGoods(warehouse, id, 1, row[0])
  return { ...start, account: save.account, gold: start.gold + refund, items: warehouse, roster, dorm, buildings: { ...start.buildings, dorm: dorm.level } }
}
