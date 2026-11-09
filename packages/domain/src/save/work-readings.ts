// The loop's work readings the bars and the Menu need at start (F18 decision 9, F22): finished items waiting, and the
// places that have them. They read the stored work rows at the day's start without settling, since every stored save is
// settled there (the night stores its settle, and every operation runs at `workNow`). Kept apart from `loop-work.ts`,
// whose operations reach the kinds' rules and tables, so the initial JS never pulls those in (F22).
import { finishedCount, type WorkRow } from '@luismlorenzana/uma-work'
import { workNow } from '../farm/calendar'
import { LOOP_WORK_PLACES, type LoopPlaceId } from './parse-v3'
import type { LoopWorkRequest, SaveV3 } from './v3'

/** Finished items she hasn't collected, across her entries. */
export function loopReadyItems(row: WorkRow<LoopWorkRequest> | undefined, now: number): number {
  return (row?.entries ?? []).reduce((n, e) => n + finishedCount(e, now) - e.collected, 0)
}

/** Places with something to collect this day, and how many of their slots have it. It reads the stored rows without
 * settling (F22), as the nudge does: every stored save is settled at its day's start, and the map's badges and the Menu
 * never need the kinds' rules. */
export function loopReadyWork(save: SaveV3): Map<LoopPlaceId, number> {
  const now = workNow(save)
  const out = new Map<LoopPlaceId, number>()
  for (const row of Object.values(save.work)) {
    if (!row.slot || loopReadyItems(row, now) === 0) continue
    const place = row.slot.building as LoopPlaceId
    out.set(place, (out.get(place) ?? 0) + 1)
  }
  return new Map(LOOP_WORK_PLACES.filter((p) => out.has(p)).map((p) => [p, out.get(p)!]))
}
