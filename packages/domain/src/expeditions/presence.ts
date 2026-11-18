import type { Expedition, FarmSave } from '../save/v4'

type Trips = Partial<Pick<FarmSave, 'expeditions'>>

/** A party still works on the day it is booked. It is back at the start of its return day. */
export const awayOn = (save: Trips, id: string, day: number): Expedition | undefined =>
  save.expeditions?.find((trip) => trip.left < day && day < trip.back && trip.party.includes(id))

/** Whether she has left by the time the household settles in tonight. */
export const awayForNight = (save: Trips, id: string, day: number): boolean =>
  !!save.expeditions?.some((trip) => trip.left <= day && day < trip.back && trip.party.includes(id))

export const leavingOn = (save: Trips, day: number): Expedition[] => save.expeditions?.filter((trip) => trip.left === day) ?? []

export const bookedForExpedition = (save: FarmSave, id: string): boolean =>
  save.expeditions.some((trip) => trip.back > save.calendar.day && trip.party.includes(id))
