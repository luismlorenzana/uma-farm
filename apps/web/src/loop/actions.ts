// The loop's actions on the day (F18): End the day, dismiss the morning, Collect all; and F19's goods: ship, Ship all,
// take back and buy. Each reads the save right before its rule runs (as `edit`), commits it to the store and the device,
// and syncs; a refused rule throws its words. Loaded on demand with the loop's screens, so the night's code stays out of
// the initial JS.
import { buy, collectLoopAll, endDay, ship, shipAll, takeBack, touched, type SaveV3, type ShopLine } from '@farm/domain'
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

/** A player's change to the save as it is now, stamped with real time. */
async function change(rule: (save: SaveV3) => SaveV3): Promise<SaveV3> {
  const save = loopSave()
  if (!save) throw new Error('The farm is still loading.')
  const next = touched(rule(save), nowIso())
  await commit(next)
  return next
}

/** Ships `count` of a good at `stars` into today's bin (decision 8: a tap ships one). */
export const shipGood = (id: string, stars: number, count = 1) => change((s) => ship(s, id, stars, count))
/** Ships every star of a good ("Ship all"). */
export const shipEvery = (id: string) => change((s) => shipAll(s, id))
/** Takes a line back out of the bin before the night (decision 4). */
export const takeBackLine = (id: string, stars: number, count: number) => change((s) => takeBack(s, id, stars, count))
/** Buys `count` of a shop line (decision 7). */
export const buyLine = (line: ShopLine, count: number) => change((s) => buy(s, line, count))

