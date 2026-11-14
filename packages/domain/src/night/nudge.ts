// The nudge: End the day reads "All set" once the day's actions are spent, and it then ends at once. Before that its
// question says what's left: the actions, the dry tiles growing a crop, the ripe ones. Read from the save at its day, so
// it's the same on every device.
import { actionsLeft } from '../farm/actions'
import { dryTiles, readyTiles } from '../save/v4'
import type { FarmSave } from '../save/v4'

export interface DaySet {
  /** The day's actions are spent: End the day reads "All set" and ends at once. */
  allSet: boolean
  /** The day's actions left. */
  left: number
  /** Growing tiles not watered today. */
  dry: number
  /** Ripe tiles to harvest. */
  ripe: number
}

/** Where the day stands: the actions left, and the field's dry and ripe tiles. */
export function daySetState(save: Pick<FarmSave, 'calendar' | 'today' | 'fields'>): DaySet {
  const left = actionsLeft(save)
  return { allSet: left === 0, left, dry: dryTiles(save), ripe: readyTiles(save) }
}
