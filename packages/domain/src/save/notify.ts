// Copied from uma-rpg packages/domain/src/save/notify.ts at 30a322a, with its Wilds-only parts cut.
// What finished in a time window, for push notifications: every entry that ended in it,
// read from the work rows settled to the window's end, so a queue that stopped on short inputs never announces jobs that
// didn't start. uma-rpg's tier worlds stay behind: the farm has one.
import { endsAt, settle } from '@luismlorenzana/uma-work'
import type { JobKind } from '../economy/jobs'
import { placeById, PLACES } from '../hub/places'
import { farmWorkEnv } from '../work/env-v4'
import type { FarmWorld } from '../work/world'
import { readyWork } from './work'

export interface Finish {
  at: number
  placeId: string
  slot: number
  kind: JobKind
  output: string
  count: number
  /** Nothing runs in the slot after it: she needs new work. */
  idle: boolean
}

/** Every job that ends in (from, to], oldest first. */
export function finishesBetween(world: FarmWorld, from: number, to: number): Finish[] {
  const out: Finish[] = []
  // Settled to `to`, each row holds every entry started by then: a queued one started the moment the one before ended.
  const settled = settle(world, to, farmWorkEnv()).state
  for (const row of Object.values(settled.work)) {
    if (!row.slot) continue
    row.entries.forEach((entry, i) => {
      const at = endsAt(entry)
      if (at <= from || at > to) return
      const idle = i === row.entries.length - 1 && row.queue.length === 0
      out.push({ at, placeId: row.slot!.building, slot: row.slot!.slot, kind: entry.request.kind, output: entry.request.item, count: entry.request.count, idle })
    })
  }
  return out.sort((a, b) => a.at - b.at)
}

/** Every slot going idle after `from`, oldest first. */
function idleAfter(world: FarmWorld, from: number): Finish[] {
  // Every entry has ended by its last end: settle far enough ahead to see each queue through.
  const horizon = Object.values(world.work).reduce((most, row) => Math.max(most, ...row.entries.map((e) => endsAt(e))), from)
  return finishesBetween(world, from, horizon + 4 * 24 * 3_600_000).filter((f) => f.idle)
}

/** Slots with something to collect at `now`: the app badge. */
export function readySlots(world: FarmWorld, now: string): number {
  return [...readyWork(world, now).values()].reduce((a, b) => a + b, 0)
}

export interface Notice { title: string; body: string; tag: string; url: string }

// --- The farm's push schedule ------------------------------------------------------------------------------------
// The server never reads a save: on every sync the app sends when each slot goes idle, and Cloud Scheduler's tick
// sends what came due. The words name places, never an Uma.

/** One moment a slot goes idle, as the app sends it: when, which place, and the app badge then (slots ready to collect,
 * if nothing is collected before). */
export interface PushEntry { at: number; place: string; badge: number }

/** The most entries a schedule holds: one per slot in the Wilds (fifteen places of four). */
export const PUSH_SCHEDULE_MAX = PLACES.reduce((n, p) => n + p.slots, 0)

/** Every slot going idle after `from`, oldest first, with the badge at that moment: what the app sends on every sync. */
export function pushSchedule(world: FarmWorld, from: number): PushEntry[] {
  return idleAfter(world, from).slice(0, PUSH_SCHEDULE_MAX)
    .map((f) => ({ at: f.at, place: f.placeId, badge: readySlots(world, new Date(f.at).toISOString()) }))
}

/** A push: the notice and the app badge. */
export interface PushNotice extends Notice { badge: number }

/** The one notification for everything due in a tick: "Work done", a line per place in the order they finished ("Mine: 2
 * jobs done"), four at most, and the badge of the latest. One place links its page; several, the Wilds. */
export function scheduleNotice(due: readonly PushEntry[]): PushNotice | null {
  if (due.length === 0) return null
  const sorted = [...due].sort((a, b) => a.at - b.at)
  const jobs = new Map<string, number>()
  for (const e of sorted) jobs.set(e.place, (jobs.get(e.place) ?? 0) + 1)
  const line = ([id, n]: [string, number]) => `${placeById(id)?.name ?? id}: ${n} ${n === 1 ? 'job' : 'jobs'} done`
  const lines = [...jobs].map(line)
  const body = lines.length > 4 ? [...lines.slice(0, 4), `and ${lines.length - 4} more places`].join('\n') : lines.join('\n')
  const only = jobs.size === 1 ? placeById(sorted[0]!.place) : undefined
  return { title: 'Work done', body, tag: only ? `work-${only.id}` : 'work', url: only ? `/${only.page}/${only.id}` : '/', badge: sorted.at(-1)!.badge }
}
