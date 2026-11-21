import { awayOn } from '../expeditions/presence'
import { actionsLeft, MORNING_ACTIONS } from '../farm/actions'
import { handJob } from '../farm/farmhands'
import type { FarmSave } from '../save/v4'
import { castOrder } from '../story/pack'
import { professionOf, professionShift, weekdayOf, WEEKDAYS } from './professions'
import { townLocation, whereOn, worksOn, type SchedulePack } from './town'

export const DATE_PERIODS = ['morning', 'afternoon'] as const
export type DatePeriod = typeof DATE_PERIODS[number]
type Slot = { activity: 'town' | 'farm' | 'free' | 'away'; label: string }

export function currentDatePeriod(save: Pick<FarmSave, 'calendar' | 'today'>): DatePeriod | null {
  if (actionsLeft(save) === 0) return null
  return save.today.actions < MORNING_ACTIONS ? 'morning' : 'afternoon'
}

export function outingActionsLeft(save: Pick<FarmSave, 'calendar' | 'today'>): number {
  if (save.today.dayParts && currentDatePeriod(save) === 'morning') return MORNING_ACTIONS - save.today.actions
  return actionsLeft(save)
}

export function dateSchedule(save: FarmSave, pack: SchedulePack, id: string, day = save.calendar.day): Record<DatePeriod, Slot> {
  const both = (slot: Slot) => ({ morning: slot, afternoon: slot })
  const free: Slot = { activity: 'free', label: 'Free for outings' }
  if (awayOn(save, id, day)) return both({ activity: 'away', label: 'On expedition' })
  if (worksOn(save, pack, id, day)) return both({ activity: 'farm', label: 'Farm work' })
  const profession = professionOf(pack, id)?.profession
  if (profession && professionShift(pack, id, day) !== 'town') return both(free)
  const job = handJob(pack, id)
  const at = job.at ?? whereOn(pack, id, day, save.calendar).at
  const order = Math.max(0, castOrder(pack).indexOf(id))
  if (!profession && (!at || (WEEKDAYS.indexOf(weekdayOf(day)) + order) % 7 >= 3)) return both(free)
  const morning = profession ? profession.partners[0] === id : order % 2 === 0
  const town: Slot = { activity: 'town', label: profession?.name ?? job.what ?? townLocation(pack, at ?? '')?.name ?? 'Town job' }
  return morning ? { morning: town, afternoon: free } : { morning: free, afternoon: town }
}
