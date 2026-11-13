// The loop's words for the day: dates, festivals, days and the nudge, which the bars read at start. The morning
// summary's lines are `summary-words.ts`, with the farm map, so they stay out of the initial JS. Pure, so the
// screens and the tests read the same.
import { dateOf, nextFestival, SEASON_NAMES, type DaySet, type Season } from '@farm/domain'

/** Each season's colour: the account bar's dot until uma-art's season marks ship, and the calendar's. */
export const SEASON_COLOR: Readonly<Record<Season, string>> = { spring: '#7cc46a', summer: '#e8b931', autumn: '#d9762b', winter: '#6aa6d6' }

/** "Spring 3". */
export function shortDate(day: number): string {
  const date = dateOf(day)
  return `${SEASON_NAMES[date.season]} ${date.day}`
}

/** "Spring 3, year 1". */
export const dateWords = (day: number): string => `${shortDate(day)}, year ${dateOf(day).year}`

/** "today", "tomorrow", "in 7 days". */
export const whenWords = (days: number): string => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`)

/** "1 day", "3 days": a job's length on the farm's screens. */
export const dayCount = (days: number): string => (days === 1 ? '1 day' : `${days} days`)

/** "Flower Show in 7 days": the next festival from a day. */
export function festivalWords(day: number): string {
  const next = nextFestival(day)
  return `${next.festival.name} ${whenWords(next.inDays)}`
}

/** The date chip's accessible name: "Spring 3, year 1 · Flower Show in 7 days". */
export const dateLabel = (day: number): string => `${dateWords(day)} · ${festivalWords(day)}`

/** "1 Uma", "3 Umas". */
export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

/** The nudge's one line: "2 Umas idle · 3 to collect", or "All set". */
export function nudgeWords(set: Pick<DaySet, 'idle' | 'collect'>): string {
  const parts = [...(set.idle.length > 0 ? [`${plural(set.idle.length, 'Uma')} idle`] : []), ...(set.collect > 0 ? [`${set.collect} to collect`] : [])]
  return parts.length > 0 ? parts.join(' · ') : 'All set'
}
