// The morning summary's lines (F18 decision 11, F19 decision 6, F20): the save holds ids and counts, and these say them,
// each line a tap to its place. With the farm map, on demand. Pure, so the card and the tests read the same.
import {
  farmPlace, FESTIVALS, goodName, itemNameOf, SEASON_NAMES, type FarmPlaceId, type FestivalId, type MorningSummary, type SummarySection, summarySections,
} from '@farm/domain'
import { plural } from './words'

const festivalName = (id: FestivalId): string => FESTIVALS.find((f) => f.id === id)!.name

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
/** The Fields' page (F20). */
export const FIELDS = '/fields'

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
      // Jobs by place (F18); crops ready by block and what withered (F20), which open the Fields.
      return summary.work.map((line): SummaryLine => {
        switch (line.kind) {
          case 'jobs': return {
            key: `jobs:${line.place}`, to: peek(line.place),
            text: `${farmPlace(line.place)?.name ?? line.place} · ${plural(line.jobs, 'job')} done · ${plural(line.items, 'item')}`,
          }
          case 'crops': return { key: `crops:${line.block}`, to: FIELDS, text: `Block ${line.block} · ${plural(line.plots, 'crop')} ready` }
          case 'withered': return { key: `withered:${line.block}:${line.crop}`, to: FIELDS, text: `Block ${line.block} · ${line.plots} ${itemNameOf(line.crop)} withered` }
        }
      })
    case 'news':
      return summary.news.map((line) => line.kind === 'season'
        ? { key: 'season', text: `${SEASON_NAMES[line.season]} begins`, to: '/?sheet=calendar' }
        : { key: `festival:${line.when}`, text: `${festivalName(line.festival)} ${line.when}`, to: peek('festival') })
    case 'nudges':
      return summary.nudges.map((line) => line.kind === 'idle'
        ? { key: 'idle', text: `${plural(line.umas.length, 'Uma')} idle`, to: '/roster' }
        : { key: 'seeds', text: `${plural(line.plots, 'plot')} to plant`, to: FIELDS })
    case 'ranks':
    case 'bonds':
      return []
  }
}
