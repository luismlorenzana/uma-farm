// The morning summary's lines (F18 decision 11, F19 decision 6, F20, F21, F23, F24): the save holds ids and counts, and
// these say them, each line a tap to its place. With the farm map, on demand. Pure, so the card and the tests read the same.
// On save v4 (F46 decision 15) §4 is Hearts: "★ Tomorrow: Stand-in 1's birthday" and her anniversary (F47), "Stand-in 1
// arrived · away", her arrival scene waiting; the Dorm's beds are the Dorm for 20's.
import {
  ACTIVITY_NAMES, bedsFor, farmPlace, FESTIVALS, goodName, itemNameOf, RANKS, SEASON_NAMES, type FarmPlaceId, type FestivalId, type MorningSummary,
  type MorningSummaryV4, type SummarySection, type SummarySectionV4, summarySections,
} from '@farm/domain'
import { chapterDoneWords, farmRankWords, milestoneWords } from './goal-words'
import { challengeWords } from './roster-view'
import { plural } from './words'

const festivalName = (id: FestivalId): string => FESTIVALS.find((f) => f.id === id)!.name

export interface SummaryLine {
  key: string
  text: string
  /** Where its tap goes: the place's quick look or screen, the calendar or the roster. */
  to: string
  /** A mark after the words: "In demand" on a sale the season lifted (F19); "Rank up" and "Points full" (F21); "New"
   * (F23); "Chapter", "Farm Rank" and "Milestone" (F24). */
  tag?: string
}
export interface SummaryPart {
  section: SummarySection | SummarySectionV4
  title: string
  lines: SummaryLine[]
}

const SECTION_TITLE: Readonly<Record<SummarySection | SummarySectionV4, string>> = {
  bin: 'The bin', work: 'Work done', ranks: 'Ranks', bonds: 'Bonds', hearts: 'Hearts', news: 'New today', nudges: 'Today',
}
const peek = (place: FarmPlaceId): string => `/?peek=${place}`
/** The Fields' page (F20). */
export const FIELDS = '/fields'

/** The Dorm's page (F23). */
export const DORM = '/dorm'

/** An Uma's name from master data, for the ranks and news sections; "An Uma" until it loads. */
export type NameOf = (outfitId: string) => string
const someone: NameOf = () => 'An Uma'

/** The morning summary as the card shows it: CS5's sections in order, empty ones hidden, each line a tap. */
export function summaryParts(summary: MorningSummary | MorningSummaryV4, nameOf: NameOf = someone): SummaryPart[] {
  return summarySections(summary).map((section) => ({ section, title: SECTION_TITLE[section], lines: sectionLines(summary, section, nameOf) }))
}
/** Her sheet on the roster. */
export const umaSheet = (outfitId: string): string => `/roster?uma=${outfitId}`

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

function sectionLines(summary: MorningSummary | MorningSummaryV4, section: SummarySection | SummarySectionV4, nameOf: NameOf): SummaryLine[] {
  const version = 'hearts' in summary ? 4 : 3
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
          case 'catch': return { key: 'catch', to: peek('fishery'), text: `Best catch · ${goodName(line.id)} ★${line.stars}` }
          case 'crops': return { key: `crops:${line.block}`, to: FIELDS, text: `Block ${line.block} · ${plural(line.plots, 'crop')} ready` }
          case 'withered': return { key: `withered:${line.block}:${line.crop}`, to: FIELDS, text: `Block ${line.block} · ${line.plots} ${itemNameOf(line.crop)} withered` }
        }
      })
    case 'news':
      // F18: the season and festivals; F24: the chapter done, a Farm Rank and what it opens, the Diary's milestones; F23:
      // the Dorm's beds, swaps home, recruits, a visitor at the Gate and one who left.
      return summary.news.map((line): SummaryLine => {
        switch (line.kind) {
          case 'season': return { key: 'season', text: `${SEASON_NAMES[line.season]} begins`, to: '/?sheet=calendar' }
          case 'festival': return { key: `festival:${line.when}`, text: `${festivalName(line.festival)} ${line.when}`, to: peek('festival') }
          case 'chapter': return { key: 'chapter', text: chapterDoneWords(line.chapter), to: '/diary', tag: 'Chapter' }
          case 'farm-rank': return { key: `farm-rank:${line.rank}`, text: farmRankWords(line.rank, version), to: '/?sheet=rank', tag: 'Farm Rank' }
          case 'milestone': return { key: `milestone:${line.id}`, text: milestoneWords(line.id), to: '/diary', tag: 'Milestone' }
          case 'dorm': return { key: 'dorm', text: `Dorm level ${line.level} · ${bedsFor(version, line.level)} beds`, to: DORM }
          case 'home': return {
            key: 'home', to: DORM, text: line.umas.length === 1 ? `${nameOf(line.umas[0]!)} is home` : `${line.umas.length} Umas are home`,
          }
          case 'joined': return { key: `joined:${line.outfitId}`, to: umaSheet(line.outfitId), text: `${nameOf(line.outfitId)} joined${line.home ? '' : ' · away'}`, tag: 'New' }
          case 'gate': return { key: `gate:${line.outfitId}`, to: peek('gate'), text: `${nameOf(line.outfitId)} is at the Gate` }
          case 'left': return { key: `left:${line.outfitId}`, to: peek('gate'), text: `${nameOf(line.outfitId)} left the Gate` }
        }
      })
    case 'nudges':
      return summary.nudges.map((line) => line.kind === 'idle'
        ? { key: 'idle', text: `${plural(line.umas.length, 'Uma')} idle`, to: '/roster' }
        : { key: 'seeds', text: `${plural(line.plots, 'plot')} to plant`, to: FIELDS })
    case 'ranks':
      // F21: "Name · Farming Hand" for a rank-up; "Name · Farming · Harvest 30 crops she tended · 12/30" when her points
      // filled and the challenge waits, naming the challenge in its own words with her count. Each opens her sheet.
      return summary.ranks.map((line): SummaryLine => line.kind === 'rank-up'
        ? { key: `rank-up:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId), text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} ${RANKS[line.rank]}`, tag: 'Rank up' }
        : {
          key: `full:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId), tag: 'Points full',
          text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} · ${challengeWords(line.activity, line.rank - 1, line.challenge) ?? RANKS[line.rank]}`,
        })
    case 'bonds':
      return []
    case 'hearts':
      // F47: her birthday and her anniversary, today or tomorrow, with the anniversary's ★5 item on the day; F46: an Uma who
      // arrived overnight, home or away (her arrival scene plays once the summary is put away). Each opens her sheet.
      return 'hearts' in summary ? summary.hearts.map((line): SummaryLine => {
        const name = nameOf(line.id)
        switch (line.kind) {
          case 'birthday': return {
            key: `birthday:${line.id}`, to: umaSheet(line.id), text: line.when === 'today' ? `★ ${name}’s birthday today` : `★ Tomorrow: ${name}’s birthday`,
          }
          case 'anniversary': return {
            key: `anniversary:${line.id}`, to: umaSheet(line.id),
            text: line.when === 'today' ? `♥ ${name}’s anniversary${line.item ? ` · ★5 ${goodName(line.item)} left for you` : ''}` : `♥ Tomorrow: ${name}’s anniversary`,
          }
          case 'arrived': return { key: `arrived:${line.id}`, to: umaSheet(line.id), text: `${name} arrived${line.home ? '' : ' · away'}`, tag: 'New' }
        }
      }) : []
  }
}
