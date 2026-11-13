// A queue that stops: it stops when its turn comes and the Warehouse can't cover it, which the screens see by
// settling. Dismiss and Restart work on that settled stop even before any change has stored it.
import { describe, expect, it } from 'vitest'
import { newSaveV2, type Save } from './save'
import { dismissStopped, queueJob, restartStopped, settleWork, startJob } from './work'

const T0 = Date.parse('2026-11-08T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const UMA = '101'

/** One Copper Ore left after a ×1 job, then ×2 queued behind it: the queue stops when its turn comes. */
function stopping(): Save {
  let save: Save = { ...newSaveV2('u1', iso(T0)), items: { 'copper-ore': 2 } }
  save = startJob(save, 'mine-workbench', 0, { outfitId: UMA }, 'copper-ingot', 1, iso(T0))
  return queueJob(save, 'mine-workbench', 0, { outfitId: UMA }, 'copper-ingot', 2, iso(T0))
}

describe('a stopped queue', () => {
  it('stops when its turn comes, seen by settling, without being stored', () => {
    const save = stopping()
    const later = iso(T0 + 3_600_000)
    expect(save.work[UMA]?.dropped).toBeNull()
    expect(settleWork(save, later).work[UMA]?.dropped?.requests).toEqual([{ kind: 'refine', item: 'copper-ingot', count: 2 }])
  })

  it('is dismissed from the stored save, the change stamped', () => {
    const later = iso(T0 + 3_600_000)
    const dismissed = dismissStopped(stopping(), UMA, later)
    expect(dismissed.work[UMA]?.dropped ?? null).toBeNull()
    expect(settleWork(dismissed, later).work[UMA]?.dropped ?? null).toBeNull()
    expect(dismissed.account.updatedAt).toBe(later)
    // Nothing stopped: nothing changes.
    const fresh = newSaveV2('u1', iso(T0))
    expect(dismissStopped(fresh, UMA, later)).toBe(fresh)
  })

  it('restarts once the Warehouse covers it', () => {
    const later = iso(T0 + 3_600_000)
    // Once the stop is stored (any later change settles first), more ore lets it restart.
    const stopped = settleWork(stopping(), later)
    const stocked = { ...stopped, items: { ...stopped.items, 'copper-ore': 2 } }
    const restarted = restartStopped(stocked, UMA, later)
    expect(restarted.work[UMA]?.entries.at(-1)?.request).toEqual({ kind: 'refine', item: 'copper-ingot', count: 2 })
    expect(restarted.items['copper-ore'] ?? 0).toBe(0)
    expect(restarted.work[UMA]?.dropped ?? null).toBeNull()
  })
})
