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
/** The game's five festivals, by id: each carries a game rule (its contest, its night), kept whatever the story calls it. */
export const FESTIVAL_IDS = ['flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup'] as const
export type FestivalId = typeof FESTIVAL_IDS[number]
/** Whether an id is one of the game's five festivals. */
export const isFestivalId = (id: string): id is FestivalId => (FESTIVAL_IDS as readonly string[]).includes(id)

/** A festival of the year: the game's five, under the story's names and on its days when `world.json` moves them, and
 * the story's own (`story/placeholders.ts`' `festivalsOf`). */
export interface Festival {
  /** One of the game's five (`FestivalId`), or one of the story's own. */
  id: string
  name: string
  season: Season
  /** Its day of the season, 1–12. */
  day: number
  /** The game rule it keeps: its own id for one of the game's five, wherever the story puts it and whatever it calls
   * it; null for one of the story's own, which is a festival day and nothing more. */
  rule: FestivalId | null
  /** What happens, in a line: the story's; null for the game's own words. */
  happens: string | null
}

const game = (id: FestivalId, name: string, season: Season, day: number): Festival => ({ id, name, season, day, rule: id, happens: null })

/** The game's five festivals, in the year's order: the year when the story names none. They are dates and festival
 * nights here; their contests come later. */
export const FESTIVALS: readonly Festival[] = [
  game('flower-show', 'Flower Show', 'spring', FESTIVAL_DAY),
  game('fishing-derby', 'Fishing Derby', 'summer', FESTIVAL_DAY),
  game('cooking-contest', 'Cooking Contest', 'autumn', FESTIVAL_DAY),
  game('animal-show', 'Animal Show', 'winter', FESTIVAL_DAY),
  game('harvest-cup', 'Harvest Cup', 'winter', DAYS_PER_SEASON),
]

/** The farm day of a date: year 1's Spring 1 is day 1. */
export function farmDay(date: FarmDate): number {
  return (date.year - 1) * DAYS_PER_YEAR + SEASONS.indexOf(date.season) * DAYS_PER_SEASON + date.day
}

/** A festival's place in the year: its day of the year, 1–48. */
export const festivalDayOfYear = (f: Pick<Festival, 'season' | 'day'>): number => farmDay({ year: 1, season: f.season, day: f.day })

/** The festival on a farm day, or null. `year` is the year's festivals: the game's five, or the story's (`festivalsOf`). */
export function festivalOn(day: number, year: readonly Festival[] = FESTIVALS): Festival | null {
  const date = dateOf(day)
  return year.find((f) => f.season === date.season && f.day === date.day) ?? null
}

/** The next festival on or after a farm day: the festival, its farm day and the days until it (0 when it's today). */
export function nextFestival(day: number, year: readonly Festival[] = FESTIVALS): { festival: Festival; day: number; inDays: number } {
  const { year: y } = dateOf(day)
  let best: { festival: Festival; day: number } | null = null
  for (const n of [y, y + 1]) {
    for (const festival of year) {
      const on = farmDay({ year: n, season: festival.season, day: festival.day })
      if (on >= day && (best === null || on < best.day)) best = { festival, day: on }
    }
    if (best) return { ...best, inDays: best.day - day }
  }
  throw new RangeError(`No festival after day ${day}`)
}

/** New Year's: each year's Spring 1. Its event actions come every year; its occasion scenes from the second (year 1's is
 * the farm's first morning). */
export const NEW_YEAR_NAME = 'New Year’s'
export const isNewYear = (day: number): boolean => {
  const date = dateOf(day)
  return date.season === 'spring' && date.day === 1
}

/** A season's first day: new seeds, fish and demand. */
export const isSeasonStart = (day: number): boolean => dateOf(day).day === 1
/** A season's last day: tonight, crops out of season wither. */
export const isSeasonEnd = (day: number): boolean => dateOf(day).day === DAYS_PER_SEASON
