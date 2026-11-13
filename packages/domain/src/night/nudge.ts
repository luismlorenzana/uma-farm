// The nudge: End the day reads "All set" when every Uma on the farm has work, nothing waits
// to be collected, and each open workshop has been played or lacks inputs. Otherwise its badge counts idle Umas plus
// things to collect, and tapping it asks first. Read at the day's start (`workNow`), so it's the same on every device.
import { statusOf } from '@luismlorenzana/uma-work'
import { workNow } from '../farm/calendar'
import { loopReadyItems } from '../save/work-readings'
import { farmHome, leaving, readyPlots, type OutfitId, type SaveV3 } from '../save/v3'
import type { FarmSave } from '../save/v4'

export interface DaySet {
  /** Nothing waits: End the day reads "All set" and ends at once. */
  allSet: boolean
  /** The Umas on the farm with no work, in the Dorm's order. */
  idle: OutfitId[]
  /** What waits to be collected: each Uma with finished items, and each Ready plot. */
  collect: number
  /** Idle Umas plus things to collect: End the day's badge. */
  badge: number
}

/**
 * Where the day stands. An Uma has work when she holds a running job or tends a block with a growing plot
 * (later a carer or an assistant). "To collect" is every Uma with finished items plus every Ready plot. With no
 * workshop open in M4, the workshops' clause always holds; F8 adds it. It reads the stored work rows at the day's
 * start without settling: every stored save is settled there (the night stores its settle, and every operation
 * runs at `workNow`), so the bars never need the kinds' rules, which load with the screens.
 */
export function daySetState(save: FarmSave): DaySet {
  const now = workNow(save)
  const tending = new Set(save.fields.blocks.filter((b) => b.tender !== null && b.plots.some((p) => p.crop !== null && !p.ready)).map((b) => b.tender!))
  // F54 decision 4: on v4 a spouse in her house is on the farm, so she can be idle too.
  const idle = farmHome(save).filter((id) => !leaving(save, id) && statusOf(save.work[id], now) !== 'working' && !tending.has(id))
  const umas = Object.values(save.work).filter((row) => loopReadyItems(row, now) > 0).length
  const collect = umas + readyPlots(save)
  return { allSet: idle.length === 0 && collect === 0, idle, collect, badge: idle.length + collect }
}
