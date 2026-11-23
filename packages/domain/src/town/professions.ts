import { awayOn } from '../expeditions/presence'
import type { SaveV4 } from '../save/v4'
import type { CastId } from '../story/cast'
import type { StoryPack } from '../story/pack'

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Weekday = typeof WEEKDAYS[number]
export const weekdayOf = (day: number): Weekday => WEEKDAYS[(day - 1) % WEEKDAYS.length]!
export const weekdayShort = (day: Weekday): string => day[0]!.toUpperCase() + day.slice(1, 3)

export interface TownProfession {
  id: string
  name: string
  at: string
  off: Weekday
  partners: readonly [early: string, late: string]
  role?: CastId
}

export interface ProfessionSchedule {
  profession: TownProfession
  town: readonly Weekday[]
  farm: readonly Weekday[]
}

type ProfessionPack = Partial<Pick<StoryPack, 'town'>>
const schedules = new WeakMap<object, ReadonlyMap<string, ProfessionSchedule>>()

/** Both partners rest on the profession's day off. They split the other days in weekday order. */
export function professionOf(pack: ProfessionPack, id: string): ProfessionSchedule | null {
  const jobs = pack.town?.professions
  if (!jobs?.length) return null
  let known = schedules.get(jobs)
  if (!known) {
    const all = new Map<string, ProfessionSchedule>()
    for (const profession of jobs) {
      const days = WEEKDAYS.filter(day => day !== profession.off)
      const early = days.slice(0, 3)
      const late = days.slice(3)
      all.set(profession.partners[0], { profession, town: early, farm: late })
      all.set(profession.partners[1], { profession, town: late, farm: early })
    }
    known = all
    schedules.set(jobs, known)
  }
  return known.get(id) ?? null
}

export function professionShift(pack: ProfessionPack, id: string, day: number): 'town' | 'farm' | 'off' | null {
  const schedule = professionOf(pack, id)
  if (!schedule) return null
  const weekday = weekdayOf(day)
  return weekday === schedule.profession.off ? 'off' : schedule.town.includes(weekday) ? 'town' : 'farm'
}

/** The provider for a specific job id, including jobs without a legacy scene role. */
export function professionWorker(pack: ProfessionPack | null, save: Partial<Pick<SaveV4, 'expeditions'>>, day: number, id: string): string | null {
  const job = pack?.town?.professions?.find(profession => profession.id === id)
  if (!job || !pack) return null
  return job.partners.find(partner => professionShift(pack, partner, day) === 'town' && !awayOn(save, partner, day)) ?? null
}

/** An actual on-duty speaker. Off days and expeditions leave the role vacant. */
export function onDuty(pack: ProfessionPack, save: Partial<Pick<SaveV4, 'expeditions'>>, day: number, role: CastId): string | null {
  const job = pack.town?.professions?.find(profession => profession.role === role)
  return job?.partners.find(id => professionShift(pack, id, day) === 'town' && !awayOn(save, id, day)) ?? null
}
