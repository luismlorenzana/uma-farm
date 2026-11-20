// The farm's units of time: a farm day is one turn, ended by the player. Day 1 is Spring 1 of
// year 1; four seasons of 30 days make a 120-day year. The work clock counts completed turns.

/** One farm day on uma-work's clock: 86,400,000 ms. */
export const DAY_MS = 86_400_000
export const DAYS_PER_SEASON = 30
export const LEGACY_SEASON_DAYS = 12
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
export type Season = typeof SEASONS[number]
export interface FarmClock {
  /** The completed-turn clock used by recorded progress, timers, and the work week. */
  day: number
  /** Turn that starts the playable calendar at Spring 1. Earlier records keep their original dates. */
  start?: number
  /** First turn on the expanded calendar. Earlier turns keep their 12-day calendar dates. */
  expandedAt?: number
  /** A contest already started on the turn this farm expanded. */
  finishingContest?: FestivalId
}
export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length
export const SEASON_NAMES: Readonly<Record<Season, string>> = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }

/** A farm day's date: its year from 1, its season, and its day of the season (1–30). */
export interface FarmDate {
  year: number
  season: Season
  day: number
}

/** The displayed date of a farming turn. */
export function dateOf(day: number, clock?: FarmClock): FarmDate {
  if (!Number.isSafeInteger(day) || day < 1) throw new RangeError(`No farm day ${day}`)
  const index = dateDayOf(day, clock) - 1
  return { year: Math.floor(index / DAYS_PER_YEAR) + 1, season: SEASONS[Math.floor((index % DAYS_PER_YEAR) / DAYS_PER_SEASON)]!, day: (index % DAYS_PER_SEASON) + 1 }
}

const startOrdinal = (day: number, start: number): number => day >= start ? day - start + 1 : day

const dateOrdinal = ({ year, season, day }: FarmDate, length: number): number =>
  ((year - 1) * SEASONS.length + SEASONS.indexOf(season)) * length + day

const expandedOrdinal = (legacy: number): number => {
  const index = legacy - 1
  return Math.floor(index / LEGACY_SEASON_DAYS) * DAYS_PER_SEASON + index % LEGACY_SEASON_DAYS + 1
}

/** The date's ordinal in the 120-day calendar, including the printed dates of earlier records. */
export function dateDayOf(day: number, clock?: FarmClock): number {
  const start = clock?.start ?? 1
  const expanded = clock?.expandedAt
  if (expanded === undefined || expanded <= start) return startOrdinal(day, start)
  if (day < expanded) return expandedOrdinal(startOrdinal(day, start))
  return expandedOrdinal(startOrdinal(expanded, start)) + day - expanded
}

/** The turn that played on a date. Added dates in seasons already past have no turn or records. */
export function turnOnDateDay(ordinal: number, clock?: FarmClock): number | null {
  const start = clock?.start ?? 1
  const expanded = clock?.expandedAt
  if (expanded === undefined || expanded <= start) return ordinal + start - 1
  const first = expandedOrdinal(startOrdinal(expanded, start))
  if (ordinal >= first) return expanded + ordinal - first
  const index = ordinal - 1
  const day = index % DAYS_PER_SEASON + 1
  return day > LEGACY_SEASON_DAYS ? null : Math.floor(index / DAYS_PER_SEASON) * LEGACY_SEASON_DAYS + day + start - 1
}

export function turnOfDateDay(ordinal: number, clock?: FarmClock): number {
  const turn = turnOnDateDay(ordinal, clock)
  if (turn === null) throw new RangeError('That date was added after its season had ended.')
  return turn
}

/** A recorded turn on the calendar a v5 save used. */
export const legacyDateDay = (day: number, clock: FarmClock): number => expandedOrdinal(startOrdinal(day, clock.start ?? 1))

export const turnOnDate = (date: FarmDate, clock?: FarmClock): number | null => turnOnDateDay(dateOrdinal(date, DAYS_PER_SEASON), clock)

/** A yearly anniversary uses the same printed date. Duration-based rules still subtract turns. */
export const yearlyDate = (since: number, years: number, clock?: FarmClock): number =>
  turnOfDateDay(dateDayOf(since, clock) + years * DAYS_PER_YEAR, clock)

export const yearsSince = (since: number, day: number, clock?: FarmClock): number =>
  Math.floor((dateDayOf(day, clock) - dateDayOf(since, clock)) / DAYS_PER_YEAR)

/** uma-work's clock on a save's day: its start, (day − 1) × DAY_MS. Every loop work operation runs at this time. */
export const workNow = (save: { calendar: { day: number } }): number => (save.calendar.day - 1) * DAY_MS

// --- The year's dates (core-loop's note #1) ----------------------------------------------

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
  /** Its day of the season, 1–30. */
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
  game('flower-show', 'Flower Show', 'spring', 19),
  game('fishing-derby', 'Fishing Derby', 'summer', 21),
  game('cooking-contest', 'Cooking Contest', 'autumn', 22),
  game('animal-show', 'Animal Show', 'winter', 12),
  game('harvest-cup', 'Harvest Cup', 'winter', 28),
]

/** The farm day of a date: year 1's Spring 1 is day 1. */
export function farmDay(date: FarmDate, clock?: FarmClock): number {
  return turnOfDateDay(dateOrdinal(date, DAYS_PER_SEASON), clock)
}

/** A festival's place in the year: its day of the year, 1–120. */
export const festivalDayOfYear = (f: Pick<Festival, 'season' | 'day'>): number => farmDay({ year: 1, season: f.season, day: f.day })

/** The festival on a farm day, or null. `year` is the year's festivals: the game's five, or the story's (`festivalsOf`). */
export function festivalOn(day: number, year: readonly Festival[] = FESTIVALS, clock?: FarmClock): Festival | null {
  const date = dateOf(day, clock)
  const finishing = day === clock?.expandedAt && clock.finishingContest ? year.find(event => event.id === clock.finishingContest) : undefined
  if (finishing) return { ...finishing, season: date.season, day: date.day }
  return year.find((f) => f.season === date.season && f.day === date.day) ?? null
}

/** The next festival on or after a farm day: the festival, its farm day and the days until it (0 when it's today). */
export function nextFestival(day: number, year: readonly Festival[] = FESTIVALS, clock?: FarmClock): { festival: Festival; day: number; inDays: number } {
  const today = festivalOn(day, year, clock)
  if (today) return { festival: today, day, inDays: 0 }
  const { year: y } = dateOf(day, clock)
  let best: { festival: Festival; day: number } | null = null
  for (const n of [y, y + 1]) {
    for (const festival of year) {
      const on = turnOnDate({ year: n, season: festival.season, day: festival.day }, clock)
      if (on !== null && on >= day && (best === null || on < best.day)) best = { festival, day: on }
    }
    if (best) return { ...best, inDays: best.day - day }
  }
  throw new RangeError(`No festival after day ${day}`)
}

/** New Year's: each year's Spring 1. Its event actions come every year; its occasion scenes from the second (year 1's is
 * the farm's first morning). */
export const NEW_YEAR_NAME = 'New Year’s'
export const isNewYear = (day: number, clock?: FarmClock): boolean => {
  const date = dateOf(day, clock)
  return date.season === 'spring' && date.day === 1
}

/** A season's first day: new seeds, fish and demand. */
export const isSeasonStart = (day: number, clock?: FarmClock): boolean => dateOf(day, clock).day === 1
/** A season's last day: tonight, crops out of season wither. */
export const isSeasonEnd = (day: number, clock?: FarmClock): boolean => dateOf(day, clock).day === DAYS_PER_SEASON
