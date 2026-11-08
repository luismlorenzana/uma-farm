// Copied from uma-rpg packages/domain/src/save/notify.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// What finished in a time window, for push notifications (QoL, D63, SC3; the farm's F6): every entry that ended in it,
// read from the work rows settled to the window's end, so a queue that stopped on short inputs never announces jobs that
// didn't start. uma-rpg's tier worlds stay behind: the farm has one.
import { endsAt, settle } from '@luismlorenzana/uma-work'
import type { JobKind } from '../economy/jobs'
import { stockName } from '../economy/stock'
import { placeById } from '../hub/places'
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

/** The next moment a slot goes idle after `from`, or null when nothing is running: what the app sends the push schedule. */
export function nextIdleAt(world: FarmWorld, from: number): number | null {
  // Every entry has ended by its last end: settle far enough ahead to see each queue through.
  const horizon = Object.values(world.work).reduce((most, row) => Math.max(most, ...row.entries.map((e) => endsAt(e))), from)
  const idle = finishesBetween(world, from, horizon + 4 * 24 * 3_600_000).filter((f) => f.idle)
  return idle[0]?.at ?? null
}

/** Slots with something to collect at `now`: the app badge. */
export function readySlots(world: FarmWorld, now: string): number {
  return [...readyWork(world, now).values()].reduce((a, b) => a + b, 0)
}

export interface Notice { title: string; body: string; tag: string; url: string }

/** One notification for the slots that went idle (a queue moving on to its next job needs nothing from you, D65): one
 * names itself; several are listed. Its link opens the place's page. */
export function finishNotice(all: readonly Finish[]): Notice | null {
  const finishes = all.filter((f) => f.idle)
  if (finishes.length === 0) return null
  const line = (f: Finish) => `${placeById(f.placeId)?.name ?? f.placeId}: ${stockName(f.output)} ×${f.count}`
  if (finishes.length === 1) {
    const f = finishes[0]!
    const place = placeById(f.placeId)
    return { title: 'Work done', body: line(f), tag: `slot-${f.placeId}-${f.slot}`, url: place ? `/${place.page}/${place.id}` : '/' }
  }
  const shown = finishes.slice(-4).map(line)
  return { title: `${finishes.length} jobs done`, body: [...shown, ...(finishes.length > 4 ? [`and ${finishes.length - 4} more`] : [])].join('\n'),
    tag: 'work', url: '/' }
}

/** The notice for what finished in (from, to], or null. */
export function workNotice(world: FarmWorld, from: number, to: number): Notice | null {
  return finishNotice(finishesBetween(world, from, to))
}
