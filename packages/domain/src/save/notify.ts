// The push schedule's notices: the app would send, on a sync, when each work slot goes idle, and the scheduler's tick
// sends what came due as one "Work done" notification. Days are turns, so nothing finishes while the app is closed: the
// app sends no schedule and the tick is paused, but the routes keep working. The words name places, never an Uma.
import { farmPlace } from '../farm/places'
import { LOOP_SLOTS, LOOP_WORK_PLACES, type LoopPlaceId } from './parse-loop'

export interface Notice { title: string; body: string; tag: string; url: string }

/** One moment a slot goes idle, as the app sends it: when, which work place, and the app badge then (slots ready to
 * collect, if nothing is collected before). */
export interface PushEntry { at: number; place: string; badge: number }

/** The most entries a schedule holds: one per work slot (each work place's four). */
export const PUSH_SCHEDULE_MAX = LOOP_WORK_PLACES.length * LOOP_SLOTS

/** Whether a schedule's place is one of the farm's work places. */
export const isPushPlace = (id: string): id is LoopPlaceId => (LOOP_WORK_PLACES as readonly string[]).includes(id)

/** A push: the notice and the app badge. */
export interface PushNotice extends Notice { badge: number }

/** The one notification for everything due in a tick: "Work done", a line per place in the order they finished ("Forest:
 * 2 jobs done"), four at most, and the badge of the latest. One place opens its quick look; several, the farm. */
export function scheduleNotice(due: readonly PushEntry[]): PushNotice | null {
  if (due.length === 0) return null
  const sorted = [...due].sort((a, b) => a.at - b.at)
  const jobs = new Map<string, number>()
  for (const e of sorted) jobs.set(e.place, (jobs.get(e.place) ?? 0) + 1)
  const line = ([id, n]: [string, number]) => `${farmPlace(id)?.name ?? id}: ${n} ${n === 1 ? 'job' : 'jobs'} done`
  const lines = [...jobs].map(line)
  const body = lines.length > 4 ? [...lines.slice(0, 4), `and ${lines.length - 4} more places`].join('\n') : lines.join('\n')
  const only = jobs.size === 1 ? sorted[0]!.place : null
  return { title: 'Work done', body, tag: only ? `work-${only}` : 'work', url: only ? `/?peek=${only}` : '/', badge: sorted.at(-1)!.badge }
}
