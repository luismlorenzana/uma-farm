// The loop's words for the day (F18): dates, festivals, days, the nudge and the morning summary's lines. The save holds
// ids and counts (decision 11); these say them. Pure, so the screens and the tests read the same.
import {
  dateOf, farmPlace, FESTIVALS, goodName, nextFestival, SEASON_NAMES, type DaySet, type FarmPlaceId, type FestivalId, type MorningSummary, type Season,
  type SummarySection, summarySections,
} from '@farm/domain'

/** Each season's colour: the account bar's dot until uma-art's season marks ship (F25), and the calendar's. */
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

const festivalName = (id: FestivalId): string => FESTIVALS.find((f) => f.id === id)!.name
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

/** The nudge's one line (CS6): "2 Umas idle · 3 to collect", or "All set". */
export function nudgeWords(set: Pick<DaySet, 'idle' | 'collect'>): string {
  const parts = [...(set.idle.length > 0 ? [`${plural(set.idle.length, 'Uma')} idle`] : []), ...(set.collect > 0 ? [`${set.collect} to collect`] : [])]
  return parts.length > 0 ? parts.join(' · ') : 'All set'
}

export interface SummaryLine {
  key: string
  text: string
  /** Where its tap goes: the place's quick look or screen, the calendar or the roster. */
  to: string
  /** A mark after the words: "In demand" on a sale the season lifted (F19). */
  tag?: string
}
export interface SummaryPart {
  section: SummarySection
  title: string
  lines: SummaryLine[]
}

const SECTION_TITLE: Readonly<Record<SummarySection, string>> = {
  bin: 'The bin', work: 'Work done', ranks: 'Ranks', bonds: 'Bonds', news: 'New today', nudges: 'Today',
}
const peek = (place: FarmPlaceId): string => `/?peek=${place}`

/** The morning summary as the card shows it: CS5's sections in order, empty ones hidden, each line a tap. */
export function summaryParts(summary: MorningSummary): SummaryPart[] {
  return summarySections(summary).map((section) => ({ section, title: SECTION_TITLE[section], lines: sectionLines(summary, section) }))
}

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

function sectionLines(summary: MorningSummary, section: SummarySection): SummaryLine[] {
  switch (section) {
    case 'bin': {
      // F19 decision 6: each good and star with its count and gold, the demand marked, then the total.
      const sold = summary.bin.map((sale): SummaryLine => ({
        key: `sold:${sale.id}@${sale.stars}`, to: '/?sheet=bin', text: `${goodName(sale.id)} ★${sale.stars} × ${sale.count} · ${gold(sale.gold)}`,
        ...(sale.demand ? { tag: 'In demand' } : {}),
      }))
      return [...sold, { key: 'sold:total', to: '/?sheet=bin', text: `Total · ${gold(summary.bin.reduce((sum, sale) => sum + sale.gold, 0))}` }]
    }
    case 'work':
      return summary.work.map((line) => ({
        key: `jobs:${line.place}`, to: peek(line.place),
        text: `${farmPlace(line.place)?.name ?? line.place} · ${plural(line.jobs, 'job')} done · ${plural(line.items, 'item')}`,
      }))
    case 'news':
      return summary.news.map((line) => line.kind === 'season'
        ? { key: 'season', text: `${SEASON_NAMES[line.season]} begins`, to: '/?sheet=calendar' }
        : { key: `festival:${line.when}`, text: `${festivalName(line.festival)} ${line.when}`, to: peek('festival') })
    case 'nudges':
      return summary.nudges.map((line) => ({ key: 'idle', text: `${plural(line.umas.length, 'Uma')} idle`, to: '/roster' }))
    case 'ranks':
    case 'bonds':
      return []
  }
}
