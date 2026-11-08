// Copied from uma-rpg packages/domain/src/save/work.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The Wilds' work (S4, D55, D144, SC3): put an Uma in a slot to gather, process or make, queue up to three more behind her,
// collect what she has made (with her Craft EXP), recall her, repeat her last job, and restart or dismiss a queue that
// stopped. Every rule runs in the shared engine, `@luismlorenzana/uma-work`, through the farm's kinds and hooks; these are
// thin wrappers plus the small derived readings the screens use. The player's operations take an optional `context` (each
// Uma's trade, for R2's trade gate); collects, recalls and settles need none. Speed Tickets and place upgrades stay behind.
import {
  chainTimes, collect, endsAt, finishedCount, isRefusal, kindRules, MAX_QUEUE, progress, queue, recall, settle, slotHolder, slotsOf,
  start, statusOf, withRow, workRefusal, type Entry, type OpResult, type QueueInput, type Refusal, type SlotRef, type WorkEnv,
  type WorkRow,
} from '@luismlorenzana/uma-work'
import type { JobKind } from '../economy/jobs'
import { grantProfessionExp } from '../economy/pacing'
import { stockName } from '../economy/stock'
import { madeName } from '../items/made'
import { madeIdentity } from '../items/made-id'
import { lineItem } from '../items/lines'
import { jobKindV4, placeSpecV4 } from '../economy/places-v4'
import type { CraftGain } from '../work/env'
import { ANOTHER_TRADE, TRADE_REFUSAL, type WorkContext } from '../work/env-v3'
import { farmWorkEnv } from '../work/env-v4'
import type { FarmWorkRequest } from '../work/request'
import type { FarmWorld } from '../work/world'
import { SaveRuleError, type SaveRuleReason } from './rules'
import { withWorld, type Save } from './save'

export { grantProfessionExp, MAX_QUEUE }
export type { FarmWorkRequest, WorkContext }
export type FarmQueueInput = QueueInput<FarmWorkRequest>

/** What work needs from an outfit's master data (a roster outfit fits). Aptitudes no longer set job speed (D139). */
export interface WorkOutfit {
  outfitId: string
}

/** The env, with the caller's context. */
const envOf = (context?: WorkContext): WorkEnv<FarmWorld> => farmWorkEnv(context)
const msOf = (now: string): number => Date.parse(now)

// --- Refusals, in the words the screens have always shown -------------------------------------------------------------

const REASON: Readonly<Record<string, SaveRuleReason>> = {
  'slot-taken': 'bad-slot', busy: 'busy', count: 'bad-count', short: 'no-items', 'queue-full': 'bad-count', 'unknown-worker': 'not-owned',
}

/** A refusal's item: a line item's or a made item's name. */
const outputName = stockName

/** A refusal's sentence for a screen: names for ids, a duration for a time, the farm's own words for the level gate. */
export function refusalText(refusal: Refusal, now: number): string {
  const data = refusal.data ?? {}
  if (refusal.code === 'grade') return `Needs Craft Lv${data.level}`
  if (refusal.code === TRADE_REFUSAL) return ANOTHER_TRADE
  return refusal.message.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key === 'uma') return 'She'
    if (key === 'item') return outputName(String(data.item))
    if (key === 'time') return `${Math.max(1, Math.ceil((Number(data.time) - now) / 60_000))} min`
    return String(data[key] ?? '')
  })
}

function done<R>(result: OpResult<R, FarmWorld>, now: number): { state: FarmWorld; receipt: R } {
  if (isRefusal(result)) throw new SaveRuleError(REASON[result.code] ?? 'bad-job', refusalText(result, now))
  return result
}

const slotRef = (placeId: string, slot: number): SlotRef => ({ building: placeId, slot })
/** A job's kind: its item's at the place (a place has one kind, FL2). */
const kindAt = (placeId: string, output: string): JobKind | null => {
  const place = placeSpecV4(placeId)
  // An item the place doesn't work goes to its first kind, whose rules refuse it ("That isn't made here.").
  return place ? jobKindV4(placeId, output) ?? place.kinds[0]! : null
}
const requestFor = (placeId: string, output: string, count: number): FarmWorkRequest => {
  const kind = kindAt(placeId, output)
  if (!kind) throw new SaveRuleError('bad-job', 'nothing to make here')
  return { kind, item: output, count }
}

/** Who holds a slot, or a refusal to act there. */
function holderOf(world: FarmWorld, placeId: string, slot: number): string {
  const holder = slotHolder(world, slotRef(placeId, slot))
  if (!holder) throw new SaveRuleError('bad-slot', 'nothing working there')
  return holder
}

// --- Planning, for the pickers -----------------------------------------------------------------------------------

export interface JobPlan {
  /** What it makes: its name and grade. */
  output: { id: string; name: string; grade: number }
  /** Real milliseconds per item for this Uma here. */
  itemMs: number
  expEach: number
  /** Inputs per item. */
  inputs: Record<string, number>
  /** Why it can't start, or null. */
  block: string | null
}

/** A place's level: always 1, since places have no levels (PP4). */
export const facilityLevel = (world: FarmWorld, placeId: string): number => world.buildings[placeId]?.level ?? 1

/** What a job makes: a line item (its grade is its line's) or a made item. */
function outputOf(id: string): { id: string; name: string; grade: number } | undefined {
  const m = lineItem(id)
  if (m) return { id, name: m.name, grade: m.grade }
  const made = madeIdentity(id)
  return made ? { id, name: madeName(id)!, grade: made.grade } : undefined
}

/** What a gather, process or make job would be: its time for this Uma, its EXP, inputs and anything stopping it. `count` 0
 * plans a queued job, whose inputs are taken only when it starts. `context` is her trade for R2's gate. */
export function planJob(world: FarmWorld, placeId: string, outfit: WorkOutfit, output: string, count = 1, context?: WorkContext): JobPlan | null {
  const jobKind = kindAt(placeId, output)
  const made = outputOf(output)
  if (!jobKind || !made) return null
  const env = envOf(context)
  const request = requestFor(placeId, output, 1)
  const plan = { slot: slotRef(placeId, 0), speed: env.buildings.speed(placeId, facilityLevel(world, placeId)), earlier: [] }
  const kind = kindRules(env, jobKind)!
  // Its time and EXP even behind the grade gate (a picker shows a locked grade's time); the gate becomes the block.
  const items = kind.plan(world, outfit.outfitId, request, 0, { ...plan, env: { ...env, exp: { ...env.exp, gradeOpen: () => true } } })
  const gate = kind.plan(world, outfit.outfitId, request, 0, { ...plan, env })
  const base = { output: made }
  if (isRefusal(items)) return { ...base, itemMs: 0, expEach: 0, inputs: {}, block: refusalText(items, 0) }
  const first = items[0]!
  const inputs = Object.fromEntries(first.inputs.map((q) => [q.item, q.qty]))
  const block = isRefusal(gate) ? refusalText(gate, 0) : count > 0 ? inputsBlock(world, inputs, count) : null
  return { ...base, itemMs: first.seconds * 1000, expEach: first.exp, inputs, block }
}

/** Why the Warehouse can't cover `count` sets of these inputs, or null. */
export function inputsBlock(world: FarmWorld, inputs: Record<string, number>, count: number): string | null {
  for (const [id, n] of Object.entries(inputs)) {
    if ((world.items[id] ?? 0) < n * count) return `Needs ${n * count} ${stockName(id)}`
  }
  return null
}

/** Free workers at this time, among `outfitIds` (the roster's; by default every Uma who has worked). Settle once for the
 * whole album; finished work frees its Uma (D119). */
export function availableWorkers(world: FarmWorld, now: string, outfitIds: Iterable<string> = Object.keys(world.umas)): ReadonlySet<string> {
  const ms = msOf(now)
  const settled = settle(world, ms, envOf()).state
  return new Set([...outfitIds].filter(id => statusOf(settled.work[id], ms) !== 'working'))
}

/** Why this Uma can't take a job now, or null: she works one job at a time; a finished one is collected as she starts.
 * Every outfit may work (FM6). */
export function availabilityBlock(world: FarmWorld, outfitId: string, now: string): string | null {
  const settled = settle(world, msOf(now), envOf()).state
  return statusOf(settled.work[outfitId], msOf(now)) === 'working' ? 'Already working' : null
}

// --- Operations: each takes the save and gives it back with the change stamped (`withWorld`) ---------------------------

/** Her row, from her first job (FM6: every outfit may work; she is Craft Lv 1 until she collects). */
function withUma(world: FarmWorld, outfitId: string): FarmWorld {
  return world.umas[outfitId] ? world : { ...world, umas: { ...world.umas, [outfitId]: { craft: { level: 1, exp: 0 } } } }
}

/** Settles the save's work at `now`: queued jobs whose turn came start, a queue short of inputs stops. A reading, not a
 * change: every device settles the same, so `account.updatedAt` stays. */
export function settleWork(save: Save, now: string): Save {
  const { state } = settle(save, msOf(now), envOf())
  return { ...save, umas: state.umas, items: state.items, buildings: state.buildings, work: state.work }
}

/** Starts a job in a free slot: `count` items, made one after another; its inputs are reserved now. A Ready Uma's
 * finished work is collected first. */
export function startJob(save: Save, placeId: string, slot: number, outfit: WorkOutfit, output: string, count: number, now: string,
  context?: WorkContext): Save {
  return withWorld(save, startIn(save, placeId, slot, outfit, output, count, now, context), now)
}

function startIn(world: FarmWorld, placeId: string, slot: number, outfit: WorkOutfit, output: string, count: number, now: string,
  context?: WorkContext): FarmWorld {
  const env = envOf(context)
  if (!slotsOf(world, placeId, env.buildings).some((s) => s.slot === slot)) throw new SaveRuleError('bad-slot', `slot ${slot} doesn't exist`)
  const { state } = done(start(world, { outfitId: outfit.outfitId, slot: slotRef(placeId, slot), request: requestFor(placeId, output, count) }, msOf(now), env), msOf(now))
  return withUma(state, outfit.outfitId)
}

export interface Collected { items: number; exp: number; levelsUp: number; done: boolean }

function collectFrom(world: FarmWorld, outfitId: string, now: number, env: WorkEnv<FarmWorld>): { world: FarmWorld; got: Collected } {
  const { state, receipt } = collect(world, { outfitId }, now, env)
  const levelsUp = (receipt.expDetail as CraftGain | null)?.levelsUp ?? 0
  return { world: state, got: { items: receipt.outputs.length, exp: receipt.exp, levelsUp, done: receipt.freed } }
}

/** Collects everything the slot's Uma has finished, with her Craft EXP; when she's done, the slot frees. A queue keeps
 * going on its own: each entry started the moment the one before ended. */
export function collectJob(save: Save, placeId: string, slot: number, now: string): { save: Save; got: Collected } {
  const env = envOf()
  const world = settle(save, msOf(now), env).state
  const { world: next, got } = collectFrom(world, holderOf(world, placeId, slot), msOf(now), env)
  return { save: withWorld(save, next, now), got }
}

/** Collects one Uma's ready work. The shared work screen addresses rows by Uma, not by a duplicated slot view. */
export function collectWorker(save: Save, outfitId: string, now: string): { save: Save; got: Collected } {
  const env = envOf()
  const { world: next, got } = collectFrom(settle(save, msOf(now), env).state, outfitId, msOf(now), env)
  return { save: withWorld(save, next, now), got }
}

/** Collects every Uma with something finished, on the given places (all by default). */
export function collectAll(save: Save, now: string, placeIds?: readonly string[]): { save: Save; items: number; levelsUp: number } {
  const env = envOf()
  let world: FarmWorld = settle(save, msOf(now), env).state
  let items = 0
  let levelsUp = 0
  for (const row of Object.values(world.work)) {
    if (!row.slot || (placeIds && !placeIds.includes(row.slot.building)) || readyItems(row, msOf(now)) === 0) continue
    const r = collectFrom(world, row.outfitId, msOf(now), env)
    world = r.world
    items += r.got.items
    levelsUp += r.got.levelsUp
  }
  return { save: withWorld(save, world, now), items, levelsUp }
}

/** Queues another job behind the slot's running one, for the same Uma at the same place; it takes its inputs when it
 * starts, the moment the one before ends. */
export function queueJob(save: Save, placeId: string, slot: number, outfit: WorkOutfit, output: string, count: number, now: string,
  context?: WorkContext): Save {
  return withWorld(save, queueIn(save, placeId, slot, outfit, output, count, now, context), now)
}

function queueIn(world: FarmWorld, placeId: string, slot: number, outfit: WorkOutfit, output: string, count: number, now: string,
  context?: WorkContext): FarmWorld {
  const env = envOf(context)
  const settled = settle(world, msOf(now), env).state
  if (holderOf(settled, placeId, slot) !== outfit.outfitId) throw new SaveRuleError('bad-slot', 'queue behind her own job')
  const add = { request: requestFor(placeId, output, count), building: placeId }
  return done(queue(settled, { outfitId: outfit.outfitId, add }, msOf(now), env), msOf(now)).state
}

export function unqueueJob(save: Save, placeId: string, slot: number, index: number, now: string): Save {
  const env = envOf()
  const world = settle(save, msOf(now), env).state
  const outfitId = holderOf(world, placeId, slot)
  if (!world.work[outfitId]?.queue[index]) throw new SaveRuleError('bad-slot', 'nothing queued there')
  return withWorld(save, done(queue(world, { outfitId, remove: index }, msOf(now), env), msOf(now)).state, now)
}

/** Applies the kit's add, remove or move queue edit without translating it through a screen-specific card model. */
export function editWorkerQueue(save: Save, input: QueueInput<FarmWorkRequest>, now: string, context?: WorkContext): Save {
  const env = envOf(context)
  const world = settle(save, msOf(now), env).state
  return withWorld(save, done(queue(world, input, msOf(now), env), msOf(now)).state, now)
}

/** Ends her work early: collects what's made; inputs for items never made come back; the item in progress is lost; her
 * queue drops and Repeat forgets her last job. */
export function recallJob(save: Save, placeId: string, slot: number, now: string): Save {
  const env = envOf()
  const world = settle(save, msOf(now), env).state
  return withWorld(save, recall(world, { outfitId: holderOf(world, placeId, slot) }, msOf(now), env).state, now)
}

/** Recalls one Uma's work. */
export function recallWorker(save: Save, outfitId: string, now: string): Save {
  const env = envOf()
  return withWorld(save, recall(settle(save, msOf(now), env).state, { outfitId }, msOf(now), env).state, now)
}

/** The first free slot of a place, or null. */
function freeSlot(world: FarmWorld, placeId: string, env: WorkEnv<FarmWorld>): number | null {
  return slotsOf(world, placeId, env.buildings).find((s) => slotHolder(world, s) === undefined)?.slot ?? null
}

/** Her slot again if it's free or hers, else another free one at the same place. */
function slotFor(world: FarmWorld, outfitId: string, slot: SlotRef, env: WorkEnv<FarmWorld>): number | null {
  const holder = slotHolder(world, slot)
  const exists = slotsOf(world, slot.building, env.buildings).some((s) => s.slot === slot.slot)
  return exists && (holder === undefined || holder === outfitId) ? slot.slot : freeSlot(world, slot.building, env)
}

/** Pure preview of the game's complete stopped-queue restart, including its alternate-slot rule and all queued jobs.
 * `context` is her trade for R2's gate. */
export function checkRestartStopped(world: FarmWorld, outfitId: string, now: number, context?: WorkContext): Refusal | null {
  const env = envOf(context)
  let settled = settle(world, now, env).state
  const dropped = settled.work[outfitId]?.dropped
  if (!dropped?.requests[0]) return null
  const slot = slotFor(settled, outfitId, dropped.slot, env)
  if (slot === null) return workRefusal('slot-taken')
  const place = dropped.slot.building
  const first = start(settled, { outfitId, slot: slotRef(place, slot), request: dropped.requests[0] }, now, env)
  if (isRefusal(first)) return first
  settled = first.state
  for (const request of dropped.requests.slice(1)) {
    const next = queue(settled, { outfitId, add: { request, building: place } }, now, env)
    if (isRefusal(next)) return next
    settled = next.state
  }
  return null
}

/** Starts her last finished job again where she did it (another free slot there if hers is taken). A Ready Uma's own
 * finished entry counts as her last job: Collect and Repeat in one step. */
export function repeatJob(save: Save, outfitId: string, now: string, context?: WorkContext): Save {
  const env = envOf(context)
  const world = settle(save, msOf(now), env).state
  const row = world.work[outfitId]
  const finished = row && statusOf(row, msOf(now)) === 'ready' ? row.entries.at(-1) : undefined
  const job = finished && row?.slot ? { slot: row.slot, request: finished.request } : row?.last
  if (!job) throw new SaveRuleError('bad-job', 'nothing to repeat')
  const slot = slotFor(world, outfitId, job.slot, env)
  if (slot === null) throw new SaveRuleError('bad-slot', 'no free slot there')
  return withWorld(save, startIn(world, job.slot.building, slot, { outfitId }, job.request.item, job.request.count, now, context), now)
}

/** Restarts a queue that stopped: its first job starts now where it would have (another free slot there if that one is
 * taken), and the rest queue behind it. */
export function restartStopped(save: Save, outfitId: string, now: string, context?: WorkContext): Save {
  const env = envOf(context)
  const world = settle(save, msOf(now), env).state
  const dropped = world.work[outfitId]?.dropped
  if (!dropped) throw new SaveRuleError('bad-job', 'nothing stopped')
  const [first, ...rest] = dropped.requests
  const place = dropped.slot.building
  const slot = slotFor(world, outfitId, dropped.slot, env)
  if (slot === null) throw new SaveRuleError('bad-slot', 'no free slot there')
  let next = startIn(world, place, slot, { outfitId }, first!.item, first!.count, now, context)
  for (const request of rest) next = queueIn(next, place, slot, { outfitId }, request.item, request.count, now, context)
  return withWorld(save, next, now)
}

/** Forgets a queue that stopped. It settles first (F5): a queue stops when its turn comes, which a screen sees by settling,
 * so the stored save may not hold the stop yet. */
export function dismissStopped(save: Save, outfitId: string, now: string): Save {
  const world = settle(save, msOf(now), envOf()).state
  const row = world.work[outfitId]
  if (!row?.dropped) return save
  return withWorld(save, withRow(world, { ...row, dropped: null }), now)
}

// --- Small derived readings used outside the shared work screens ------------------------------------------------------

/** Finished items she hasn't collected, across her entries. */
export function readyItems(row: WorkRow<FarmWorkRequest> | undefined, now: number): number {
  return (row?.entries ?? []).reduce((n, e) => n + finishedCount(e, now) - e.collected, 0)
}

/** One slot's job as the cards read it: her running (or last) entry, what's ready across her entries, and her queue's
 * times. */
export interface SlotJob {
  outfitId: string
  kind: JobKind
  output: string
  count: number
  /** Items of that entry finished by now. */
  finished: number
  /** Finished items not yet collected, across her entries. */
  ready: number
  /** Everything finished: Collect frees her. */
  done: boolean
  startedAt: number
  endsAt: number
  progress: number
  queue: { output: string; count: number; startsAt: number; endsAt: number }[]
}

/** A slot's job at `now`. */
function slotJob(world: FarmWorld, row: WorkRow<FarmWorkRequest>, now: number, env: WorkEnv<FarmWorld>): SlotJob {
  const last: Entry<FarmWorkRequest> = row.entries.at(-1)!
  const status = statusOf(row, now)
  // A queued job's times, planned now: it will start when the one before it ends.
  const queuedSeconds = row.queue.map((request) => {
    const items = kindRules(env, request.kind)!.plan(world, row.outfitId, request, now, { slot: row.slot!, speed: last.speed, earlier: [], env })
    return isRefusal(items) ? [] : items.map((i) => i.seconds)
  })
  const times = chainTimes(row, queuedSeconds)
  return {
    outfitId: row.outfitId, kind: last.request.kind, output: last.request.item, count: last.request.count,
    finished: finishedCount(last, now), ready: readyItems(row, now), done: status === 'ready',
    startedAt: last.startedAt, endsAt: endsAt(last), progress: progress(last, now),
    queue: row.queue.map((q, i) => ({ output: q.item, count: q.count, startsAt: times.queued[i]?.startsAt ?? 0, endsAt: times.queued[i]?.endsAt ?? 0 })),
  }
}

/** Her job at `now`, wherever she works, or null. */
export function slotJobOf(world: FarmWorld, outfitId: string, now: string): (SlotJob & { placeId: string; slot: number }) | null {
  const env = envOf()
  const settled = settle(world, msOf(now), env).state
  const row = settled.work[outfitId]
  if (!row?.slot || row.entries.length === 0) return null
  return { ...slotJob(settled, row, msOf(now), env), placeId: row.slot.building, slot: row.slot.slot }
}

/** Places with something to collect at `now`, and how many of their slots have it. */
export function readyWork(world: FarmWorld, now: string): Map<string, number> {
  const settled = settle(world, msOf(now), envOf()).state
  const out = new Map<string, number>()
  for (const row of Object.values(settled.work)) {
    if (!row.slot || row.entries.length === 0) continue
    if (readyItems(row, msOf(now)) > 0 || statusOf(row, msOf(now)) === 'ready') out.set(row.slot.building, (out.get(row.slot.building) ?? 0) + 1)
  }
  return out
}
