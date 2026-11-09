// The loop's actions on the day (F18): End the day, dismiss the morning, Collect all. Each reads the save right before its
// rule runs (as `edit`), commits it to the store and the device, and syncs. Loaded on demand with the loop's screens, so
// the night's code stays out of the initial JS.
import { collectLoopAll, endDay, touched, type SaveV3 } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'

const loopSave = (): SaveV3 | null => {
  const save = useGame.getState().save
  return save?.version === 3 ? save : null
}
const nowIso = () => new Date().toISOString()

/**
 * Ends `day` (decisions 2 and 13): the night's nine steps over the save as it is now, stamped once. It waits for master
 * data, which the night reads; a second tap, or a save that already moved past `day`, changes nothing.
 */
export async function endTheDay(day: number): Promise<boolean> {
  const view = await masterReady()
  const save = loopSave()
  if (!save || save.calendar.day !== day) return false
  await commit(endDay(save, { roster: view.roster }, nowIso()))
  return true
}

/** Puts the morning summary away: a player's change (decision 11). */
export async function dismissSummary(): Promise<void> {
  const save = loopSave()
  if (!save?.summary) return
  await commit(touched({ ...save, summary: null }, nowIso()))
}

/** Collects every finished job on the farm into the Warehouse. Nothing ready changes nothing. */
export async function collectFarm(): Promise<number> {
  const save = loopSave()
  if (!save) return 0
  const { save: next, items } = collectLoopAll(save, nowIso())
  if (items > 0) await commit(next)
  return items
}
