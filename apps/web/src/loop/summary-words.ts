// The morning summary's lines (F18 decision 11, F19 decision 6, F20, F21, F23, F24): the save holds ids and counts, and
// these say them, each line a tap to its place. With the farm map, on demand. Pure, so the card and the tests read the same.
// On save v4 (F46 decision 15) §4 is Hearts, in RM57's order (F48 decisions 1 and 9): the Ready lines read live, up to
// three and "+N more"; the invitation (F50); the house's morning (F54); birthdays and anniversaries, today and tomorrow
// (F47); levels reached overnight (F54) and arrivals' scenes waiting (F46); side by side's extras and bond hearts with
// Read (F52). Each opens her profile on the Hearts tab (`/hearts?uma=`), a pair's Read its conversations (`?read=`), side
// by side the Warehouse; the Dorm's beds are the Dorm for 20's.
import {
  ACTIVITY_NAMES, bedsFor, farmPlace, FESTIVALS, goodName, itemNameOf, RANKS, rungName, SEASON_NAMES, SUMMARY_SECTIONS_V4, summarySections, type FarmPlaceId,
  type FestivalId, type HeartLine, type MorningSummary, type MorningSummaryV4, type SummarySection, type SummarySectionV4,
} from '@farm/domain'
import { chapterDoneWords, farmRankWords, milestoneWords } from './goal-words'
import { readParam, type PairWords } from './hearts-view'
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

/** A Ready line for the morning (F48 decision 9): read live from `readiness` as the card shows, never stored. */
export interface ReadyNow {
  id: string
  rung: string
  /** Where it plays, in words ("the Fields"); null without her bible's beat. */
  place: string | null
}

/** The morning summary as the card shows it: CS5's sections in order, empty ones hidden, each line a tap. On v4, §4 Hearts
 * also shows while someone is `ready` (decision 9). */
export function summaryParts(summary: MorningSummary | MorningSummaryV4, nameOf: NameOf = someone, ready: readonly ReadyNow[] = [], pairs: PairWords | null = null): SummaryPart[] {
  const sections = 'hearts' in summary
    ? SUMMARY_SECTIONS_V4.filter((section) => (section === 'hearts' ? summary.hearts.length + ready.length > 0 : summary[section].length > 0))
    : summarySections(summary)
  return sections.map((section) => ({ section, title: SECTION_TITLE[section], lines: sectionLines(summary, section, nameOf, ready, pairs) }))
}
/** Her sheet: on the roster (v3), or her profile on the Hearts tab (v4, F48 decision 2), on its Work side for a rank's
 * line. */
export const umaSheet = (outfitId: string, version: number = 3, view?: 'work'): string =>
  version >= 4 ? `/hearts?${view ? `view=${view}&` : ''}uma=${outfitId}` : `/roster?uma=${outfitId}`

/** The morning's Ready lines: up to three, then "+N more" (RM57). */
export const READY_LINES = 3
/** RM57's order of §4 Hearts, by line kind: (1) Ready, (2) the invitation (F50), (3) the house's morning (F54), (4)
 * birthdays and anniversaries, (5) levels reached overnight (F54) and arrivals, (6) side by side and bond hearts (F52). A
 * new stored kind takes its place here and its words in `heartLine`; within a place the night's order holds. */
export const HEARTS_ORDER: Readonly<Record<HeartLine['kind'], number>> = { birthday: 4, anniversary: 4, arrived: 5, side: 6, bond: 6 }

/** §4 Hearts on v4 (decisions 1 and 9): the Ready lines, then the stored lines in RM57's order. `pairs` says which bond
 * lines have a conversation to Read (F52); without it (the pack loading) they say the heart alone. */
export function heartsLines(hearts: readonly HeartLine[], ready: readonly ReadyNow[], nameOf: NameOf, pairs: PairWords | null = null): SummaryLine[] {
  const now = ready.slice(0, READY_LINES).map((r): SummaryLine => ({
    key: `ready:${r.id}`, to: umaSheet(r.id, 4), text: `● Ready · ${nameOf(r.id)} · ${rungName(r.rung)}${r.place ? ` · ${r.place}` : ''}`,
  }))
  const more = ready.length > READY_LINES ? [{ key: 'ready:more', to: '/hearts?filter=ready', text: `+${ready.length - READY_LINES} more` }] : []
  const stored = hearts.map((line, i) => ({ line, i })).sort((a, b) => HEARTS_ORDER[a.line.kind] - HEARTS_ORDER[b.line.kind] || a.i - b.i)
  return [...now, ...more, ...stored.map(({ line }) => heartLine(line, nameOf, pairs))]
}

/** The ♥♥ of a pair's line (F52): two hearts for two Umas, whatever the level. */
export const PAIR_MARK = '♥♥'

/** A bond heart in words (F52 decision 9): "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read** while an authored
 * conversation waits (its tap plays them); without one, the tie's line, or "<a> and <b> are closer now" for a pair the
 * ties don't hold. */
function bondLine(line: Extract<HeartLine, { kind: 'bond' }>, nameOf: NameOf, pairs: PairWords | null): SummaryLine {
  const [a, b] = [nameOf(line.a), nameOf(line.b)]
  const key = `bond:${line.a}:${line.b}`
  const to = umaSheet(line.a, 4)
  const unread = pairs?.unread(line.a, line.b, line.hearts) ?? []
  if (unread.length > 0) return { key, to: `/?read=${readParam(line.a, line.b, unread)}`, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts}`, tag: 'Read' }
  if (pairs?.authored(line.a, line.b)) return { key, to, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts}` }
  const tie = pairs?.tieLine(line.a, line.b) ?? null
  return tie
    ? { key, to, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts} · ${tie}` }
    : { key, to, text: `${PAIR_MARK} ${a} and ${b} are closer now · bond ${line.hearts}` }
}

/** A stored §4 line in words, opening her profile. */
function heartLine(line: HeartLine, nameOf: NameOf, pairs: PairWords | null): SummaryLine {
  if (line.kind === 'side') return { key: 'side', to: '/warehouse', text: `Side by side · +${plural(line.items, 'item')}` }
  if (line.kind === 'bond') return bondLine(line, nameOf, pairs)
  const name = nameOf(line.id)
  const to = umaSheet(line.id, 4)
  switch (line.kind) {
    case 'birthday': return { key: `birthday:${line.id}`, to, text: line.when === 'today' ? `★ ${name}’s birthday today` : `★ Tomorrow: ${name}’s birthday` }
    case 'anniversary': return {
      key: `anniversary:${line.id}`, to,
      text: line.when === 'today' ? `♥ ${name}’s anniversary${line.item ? ` · ★5 ${goodName(line.item)} left for you` : ''}` : `♥ Tomorrow: ${name}’s anniversary`,
    }
    case 'arrived': return { key: `arrived:${line.id}`, to, text: `${name} arrived${line.home ? '' : ' · away'}`, tag: 'New' }
  }
}

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

function sectionLines(summary: MorningSummary | MorningSummaryV4, section: SummarySection | SummarySectionV4, nameOf: NameOf, ready: readonly ReadyNow[], pairs: PairWords | null): SummaryLine[] {
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
        ? { key: 'idle', text: `${plural(line.umas.length, 'Uma')} idle`, to: version === 4 ? '/hearts?view=work' : '/roster' }
        : { key: 'seeds', text: `${plural(line.plots, 'plot')} to plant`, to: FIELDS })
    case 'ranks':
      // F21: "Name · Farming Hand" for a rank-up; "Name · Farming · Harvest 30 crops she tended · 12/30" when her points
      // filled and the challenge waits, naming the challenge in its own words with her count. Each opens her sheet.
      return summary.ranks.map((line): SummaryLine => line.kind === 'rank-up'
        ? { key: `rank-up:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId, version, 'work'), text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} ${RANKS[line.rank]}`, tag: 'Rank up' }
        : {
          key: `full:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId, version, 'work'), tag: 'Points full',
          text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} · ${challengeWords(line.activity, line.rank - 1, line.challenge) ?? RANKS[line.rank]}`,
        })
    case 'bonds':
      return []
    case 'hearts':
      return 'hearts' in summary ? heartsLines(summary.hearts, ready, nameOf, pairs) : []
  }
}
