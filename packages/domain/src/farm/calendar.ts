// The farm's units of time (F17; core spec CS1, D25): a farm day is one turn, ended by the player. Day 1 is Spring 1 of
// year 1; four seasons of 12 days make a 48-day year. uma-work's clock is the calendar: day d starts at (d − 1) whole days.

/** One farm day on uma-work's clock (FC6): 86,400,000 ms. */
export const DAY_MS = 86_400_000
export const DAYS_PER_SEASON = 12
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
export type Season = typeof SEASONS[number]
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length
export const SEASON_NAMES: Readonly<Record<Season, string>> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }

/** A farm day's date: its year from 1, its season, and its day of the season (1–12). */
export interface FarmDate {
  year: number
  season: Season
  day: number
}

/** Day d's date (CS1): year ⌈d/48⌉, season ⌊((d−1) mod 48)/12⌋, day ((d−1) mod 12) + 1. */
export function dateOf(day: number): FarmDate {
  if (!Number.isSafeInteger(day) || day < 1) throw new RangeError(`No farm day ${day}`)
  const index = day - 1
  return { year: Math.floor(index / DAYS_PER_YEAR) + 1, season: SEASONS[Math.floor((index % DAYS_PER_YEAR) / DAYS_PER_SEASON)]!, day: (index % DAYS_PER_SEASON) + 1 }
}

/** uma-work's clock on a save's day: its start, (day − 1) × DAY_MS. Every loop work operation runs at this time (F18). */
export const workNow = (save: { calendar: { day: number } }): number => (save.calendar.day - 1) * DAY_MS
