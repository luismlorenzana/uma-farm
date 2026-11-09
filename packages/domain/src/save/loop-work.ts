// The loop's work on the day clock (F18 decision 1; core spec CS7, FC6): F5's operations over a v3 save. Every one runs at
// `workNow(save)`, the start of the save's day, and never reads the device's clock, so reopening the app moves nothing;
// a player's change is stamped with real time (`stamp`). Readings settle and store nothing. `kinds` is the work registry
// (`LOOP_KINDS`; the app passes `loopKinds(talentOf)` so plans read master data's talents, and tests their own). The
// screens that call these are F22's, on uma-kit/work.
import {
  collect, isRefusal, queue, recall, settle, slotHolder, slotsOf, start, statusOf, withRow, type OpResult, type QueueInput, type Refusal,
  type SlotRef, type WorkEnv, type WorkOutput, type WorkRow,
} from '@luismlorenzana/uma-work'
import { DAY_MS, workNow } from '../farm/calendar'
import { goodName } from '../goods/ids'
import { farmEnvV3, loopWorld, withLoopWorld, type LoopWorld } from '../work/loop-env'
import { LOOP_KINDS, type HaulDetail, type Measured } from '../gathering/kinds'
import { LOOP_WORK_PLACES, type LoopKinds, type LoopPlaceId } from './parse-v3'
import { SaveRuleError, type SaveRuleReason } from './rules'
import { touched } from './save'
import { tendedBlock, type LoopWorkRequest, type OutfitId, type SaveV3 } from './v3'
import { loopReadyItems } from './work-readings'
import { parseStockKey } from './warehouse'

const REASON: Readonly<Record<string, SaveRuleReason>> = {
  'slot-taken': 'bad-slot', busy: 'busy', count: 'bad-count', short: 'no-items', 'queue-full': 'bad-count', 'unknown-worker': 'not-owned', locked: 'locked',
}

/** Whole days from now to a moment on the work clock, at least 1. */
const daysUntil = (at: number, now: number): number => Math.max(1, Math.ceil((at - now) / DAY_MS))

/** A refusal's sentence on the loop's screens: days for times, a good's name without its stars (F19's `goodName`), and
 * "isn't on the farm" for an Uma who isn't home. */
export function loopRefusalText(refusal: Refusal, now: number): string {
  if (refusal.code === 'unknown-worker') return 'She isn’t on the farm.'
  const data = refusal.data ?? {}
  return refusal.message.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key === 'uma') return 'She'
    if (key === 'item') {
      const at = parseStockKey(String(data.item))
      return at ? goodName(at.id) : String(data.item)
    }
    if (key === 'time') {
      const days = daysUntil(Number(data.time), now)
      return days === 1 ? '1 day' : `${days} days`
    }
    return String(data[key] ?? '')
  })
}

function done<R>(result: OpResult<R, LoopWorld>, now: number): { state: LoopWorld; receipt: R } {
  if (isRefusal(result)) throw new SaveRuleError(REASON[result.code] ?? 'bad-job', loopRefusalText(result, now))
  return result
}

/** The save's world settled at its day, with the env and the clock. */
function opened(save: SaveV3, kinds: LoopKinds): { world: LoopWorld; env: WorkEnv<LoopWorld>; now: number } {
  const env = farmEnvV3(kinds)
  const now = workNow(save)
  return { world: settle(loopWorld(save), now, env).state, env, now }
}

/** The world back in its save, stamped: a player's change. */
const changed = (save: SaveV3, world: LoopWorld, stamp: string): SaveV3 => touched(withLoopWorld(save, world), stamp)

/** Her slot again if it's free or hers, else another free one at the same place. */
function slotFor(world: LoopWorld, outfitId: OutfitId, slot: SlotRef, env: WorkEnv<LoopWorld>): SlotRef | null {
  const holder = slotHolder(world, slot)
  if (holder === undefined || holder === outfitId) return slot
  return slotsOf(world, slot.building, env.buildings).find((s) => slotHolder(world, s) === undefined) ?? null
}

// --- Readings: no stamp, nothing stored --------------------------------------------------------------------------

/** The save's work settled at its day: a queued job whose turn came starts. A reading every device makes alike, so
 * `account.updatedAt` stays. The night stores it as the date turns (F18 decision 3). */
export function settleLoopWork(save: SaveV3, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  return withLoopWorld(save, opened(save, kinds).world)
}

/** Who holds a running job this day. */
export function loopWorking(save: SaveV3, kinds: LoopKinds = LOOP_KINDS): Set<OutfitId> {
  const { world, now } = opened(save, kinds)
  return new Set(Object.values(world.work).filter((row) => statusOf(row, now) === 'working').map((row) => row.outfitId))
}

// --- The player's operations: each runs at the day's start and is stamped with real time ----------------------------

/** A tender is busy (F20 decision 1): she can't start a job until she's moved off her block. */
function notTending(save: SaveV3, outfitId: OutfitId): void {
  const block = tendedBlock(save, outfitId)
  if (block !== null) throw new SaveRuleError('busy', `She tends Block ${block}.`)
}

export interface LoopJobInput {
  outfitId: OutfitId
  place: LoopPlaceId
  slot: number
  request: LoopWorkRequest
}

/** Starts a job in a free slot this morning; its inputs leave the Warehouse now. A Ready Uma's finished work is collected
 * first. */
export function startLoopJob(save: SaveV3, input: LoopJobInput, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  notTending(save, input.outfitId)
  const { world, env, now } = opened(save, kinds)
  const slot: SlotRef = { building: input.place, slot: input.slot }
  if (!slotsOf(world, input.place, env.buildings).some((s) => s.slot === input.slot)) throw new SaveRuleError('bad-slot', `slot ${input.slot} doesn't exist`)
  return changed(save, done(start(world, { outfitId: input.outfitId, slot, request: input.request }, now, env), now).state, stamp)
}

/** Adds, removes or moves a job in her queue (uma-kit's queue input): a queued job takes its inputs when it starts. */
export function editLoopQueue(save: SaveV3, input: QueueInput<LoopWorkRequest>, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  if ('add' in input) notTending(save, input.outfitId)
  const { world, env, now } = opened(save, kinds)
  return changed(save, done(queue(world, input, now, env), now).state, stamp)
}

/** What a collect brought home: the goods (`<id>@<stars>`) and each fish's size (F22). */
export interface LoopCollected {
  goods: string[]
  sizes: Measured[]
}
const goodsOf = (outputs: readonly WorkOutput[]): string[] => outputs.flatMap((o) => ('item' in o ? [o.item] : []))
const sizesOf = (paid: readonly unknown[]): Measured[] => paid.flatMap((d) => (d && typeof d === 'object' && 'sizes' in d ? (d as HaulDetail).sizes : []))

/** Collects what she has finished into the Warehouse; when she's done, her slot frees. */
export function collectLoopWorker(save: SaveV3, outfitId: OutfitId, stamp: string, kinds: LoopKinds = LOOP_KINDS): { save: SaveV3; items: number; done: boolean } & LoopCollected {
  const { world, env, now } = opened(save, kinds)
  const { state, receipt } = collect(world, { outfitId }, now, env)
  return {
    save: receipt.outputs.length > 0 || receipt.freed ? changed(save, state, stamp) : save, items: receipt.outputs.length, done: receipt.freed,
    goods: goodsOf(receipt.outputs), sizes: sizesOf(receipt.paid),
  }
}

/** Collects every Uma with something finished, on the given places (all by default). Nothing ready changes nothing. */
export function collectLoopAll(save: SaveV3, stamp: string, places?: readonly LoopPlaceId[], kinds: LoopKinds = LOOP_KINDS): { save: SaveV3; items: number } & LoopCollected {
  const { world: settled, env, now } = opened(save, kinds)
  let world = settled
  const got: LoopCollected = { goods: [], sizes: [] }
  for (const row of Object.values(settled.work)) {
    if (!row.slot || (places && !places.includes(row.slot.building as LoopPlaceId)) || loopReadyItems(row, now) === 0) continue
    const { state, receipt } = collect(world, { outfitId: row.outfitId }, now, env)
    world = state
    got.goods.push(...goodsOf(receipt.outputs))
    got.sizes.push(...sizesOf(receipt.paid))
  }
  return { save: got.goods.length > 0 ? changed(save, world, stamp) : save, items: got.goods.length, ...got }
}

/** Ends her work: what's made is collected, the inputs of what isn't come back, her queue drops. */
export function recallLoopWorker(save: SaveV3, outfitId: OutfitId, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  const { world, env, now } = opened(save, kinds)
  return changed(save, recall(world, { outfitId }, now, env).state, stamp)
}

/** Starts her last job again where she did it (another free slot there if hers is taken): a Ready Uma's finished entry
 * counts, so Collect and Repeat are one step, and the job starts this morning. */
export function repeatLoopJob(save: SaveV3, outfitId: OutfitId, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  notTending(save, outfitId)
  const { world, env, now } = opened(save, kinds)
  const row = world.work[outfitId]
  const finished = row?.slot && statusOf(row, now) === 'ready' ? row.entries.at(-1) : undefined
  const job = finished && row?.slot ? { slot: row.slot, request: finished.request } : row?.last
  if (!job) throw new SaveRuleError('bad-job', 'nothing to repeat')
  const slot = slotFor(world, outfitId, job.slot, env)
  if (!slot) throw new SaveRuleError('bad-slot', 'no free slot there')
  return changed(save, done(start(world, { outfitId, slot, request: job.request }, now, env), now).state, stamp)
}

/** Restarts a queue that stopped: its first job starts this morning where it would have (another free slot there if
 * that one is taken), and the rest queue behind it. */
export function restartLoopStopped(save: SaveV3, outfitId: OutfitId, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  notTending(save, outfitId)
  const { world, env, now } = opened(save, kinds)
  const dropped = world.work[outfitId]?.dropped
  if (!dropped) throw new SaveRuleError('bad-job', 'nothing stopped')
  const slot = slotFor(world, outfitId, dropped.slot, env)
  if (!slot) throw new SaveRuleError('bad-slot', 'no free slot there')
  const [first, ...rest] = dropped.requests
  let next = done(start(world, { outfitId, slot, request: first! }, now, env), now).state
  for (const request of rest) next = done(queue(next, { outfitId, add: { request, building: slot.building } }, now, env), now).state
  return changed(save, next, stamp)
}

/** Forgets a queue that stopped. */
export function dismissLoopStopped(save: SaveV3, outfitId: OutfitId, stamp: string, kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  const { world } = opened(save, kinds)
  const row = world.work[outfitId]
  if (!row?.dropped) return save
  return changed(save, withRow(world, { ...row, dropped: null }), stamp)
}
