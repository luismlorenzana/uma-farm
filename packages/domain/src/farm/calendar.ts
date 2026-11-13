// The farm's units of time: a farm day is one turn, ended by the player. Day 1 is Spring 1 of
// year 1; four seasons of 12 days make a 48-day year. uma-work's clock is the calendar: day d starts at (d − 1) whole days.

/** One farm day on uma-work's clock: 86,400,000 ms. */
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

/** Day d's date: year ⌈d/48⌉, season ⌊((d−1) mod 48)/12⌋, day ((d−1) mod 12) + 1. */
export function dateOf(day: number): FarmDate {
  if (!Number.isSafeInteger(day) || day < 1) throw new RangeError(`No farm day ${day}`)
  const index = day - 1
  return { year: Math.floor(index / DAYS_PER_YEAR) + 1, season: SEASONS[Math.floor((index % DAYS_PER_YEAR) / DAYS_PER_SEASON)]!, day: (index % DAYS_PER_SEASON) + 1 }
}

/** uma-work's clock on a save's day: its start, (day − 1) × DAY_MS. Every loop work operation runs at this time. */
export const workNow = (save: { calendar: { day: number } }): number => (save.calendar.day - 1) * DAY_MS

// --- The year's dates (core-loop's note #1) ----------------------------------------------

/** The day of a season each festival falls on: the 10th, and the Harvest Cup on Winter's last. */
export const FESTIVAL_DAY = 10
export const FESTIVAL_IDS = ['flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup'] as const
export type FestivalId = typeof FESTIVAL_IDS[number]

export interface Festival {
  id: FestivalId
  name: string
  season: Season
  /** Its day of the season, 1–12. */
  day: number
}

/** The five festivals, in the year's order. They are dates only here; their events come with the romance. */
export const FESTIVALS: readonly Festival[] = [
  { id: 'flower-show', name: 'Flower Show', season: 'spring', day: FESTIVAL_DAY },
  { id: 'fishing-derby', name: 'Fishing Derby', season: 'summer', day: FESTIVAL_DAY },
  { id: 'cooking-contest', name: 'Cooking Contest', season: 'autumn', day: FESTIVAL_DAY },
  { id: 'animal-show', name: 'Animal Show', season: 'winter', day: FESTIVAL_DAY },
  { id: 'harvest-cup', name: 'Harvest Cup', season: 'winter', day: DAYS_PER_SEASON },
]

/** The farm day of a date: year 1's Spring 1 is day 1. */
export function farmDay(date: FarmDate): number {
  return (date.year - 1) * DAYS_PER_YEAR + SEASONS.indexOf(date.season) * DAYS_PER_SEASON + date.day
}

/** The festival on a farm day, or null. */
export function festivalOn(day: number): Festival | null {
  const date = dateOf(day)
  return FESTIVALS.find((f) => f.season === date.season && f.day === date.day) ?? null
}

/** The next festival on or after a farm day: the festival, its farm day and the days until it (0 when it's today). */
export function nextFestival(day: number): { festival: Festival; day: number; inDays: number } {
  const { year } = dateOf(day)
  for (const y of [year, year + 1]) {
    for (const festival of FESTIVALS) {
      const on = farmDay({ year: y, season: festival.season, day: festival.day })
      if (on >= day) return { festival, day: on, inDays: on - day }
    }
  }
  throw new RangeError(`No festival after day ${day}`)
}

/** A season's first day: new seeds, fish and demand. */
export const isSeasonStart = (day: number): boolean => dateOf(day).day === 1
/** A season's last day: tonight, crops out of season wither. */
export const isSeasonEnd = (day: number): boolean => dateOf(day).day === DAYS_PER_SEASON
