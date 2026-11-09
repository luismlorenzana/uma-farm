// The nudge (F18 decision 9; core spec CS6): End the day reads "All set" when every Uma on the farm has work, nothing waits
// to be collected, and each open workshop has been played or lacks inputs. Otherwise its badge counts idle Umas plus
// things to collect, and tapping it asks first. Read at the day's start (`workNow`), so it's the same on every device.
import { settle, statusOf } from '@luismlorenzana/uma-work'
import { workNow } from '../farm/calendar'
import { loopReadyItems } from '../save/loop-work'
import { LOOP_KINDS, type LoopKinds } from '../save/parse-v3'
import type { OutfitId, SaveV3 } from '../save/v3'
import { farmEnvV3, loopWorld } from '../work/loop-env'

export interface DaySet {
  /** Nothing waits: End the day reads "All set" and ends at once (CS6). */
  allSet: boolean
  /** The Umas on the farm with no work, in the Dorm's order. */
  idle: OutfitId[]
  /** What waits to be collected: each Uma with finished items, and each Ready plot. */
  collect: number
  /** Idle Umas plus things to collect: End the day's badge. */
  badge: number
}

/**
 * Where the day stands (decision 9). An Uma has work when she holds a running job or tends a block with a growing plot
 * (F20; later a carer or an assistant). "To collect" is every Uma with finished items plus every Ready plot. With no
 * workshop open in M4, the workshops' clause always holds; F8 (M5) adds it.
 */
export function daySetState(save: SaveV3, kinds: LoopKinds = LOOP_KINDS): DaySet {
  const now = workNow(save)
  const world = settle(loopWorld(save), now, farmEnvV3(kinds)).state
  const tending = new Set(save.fields.blocks.filter((b) => b.tender !== null && b.plots.some((p) => p.crop !== null && !p.ready)).map((b) => b.tender!))
  const idle = save.dorm.home.filter((id) => statusOf(world.work[id], now) !== 'working' && !tending.has(id))
  const umas = Object.values(world.work).filter((row) => loopReadyItems(row, now) > 0).length
  const plots = save.fields.blocks.reduce((n, b) => n + b.plots.filter((p) => p.ready).length, 0)
  const collect = umas + plots
  return { allSet: idle.length === 0 && collect === 0, idle, collect, badge: idle.length + collect }
}
