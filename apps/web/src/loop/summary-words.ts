// The morning summary's lines: the save holds ids and counts, and
// these say them, each line a tap to its place. With the farm map, on demand. Pure, so the card and the tests read the same.
// §4 is Hearts, in its own order: the Ready lines read live, up to
// three and "+N more"; the invitation with Yes, tonight and Another day; the house's morning; birthdays and
// anniversaries, today and tomorrow
//; levels reached overnight, those the night met ("Met ‹name› · in town") and her chapter opened ("A new chapter with
// ‹name› · Together", its title the pack's, read live); side by side's extras and bond hearts with
// Read. A Ready line plays her event over the morning (`?event=`); the rest open her profile on the
// Hearts tab (`/hearts?uma=`), a pair's Read its conversations (`?read=`), side
// by side the Warehouse; the Dorm's beds are the Dorm for 20's. It also has the house's morning (with its house line,
// read live), a move-in, a house that misses you (Tonight › and Another night under it), a night level (her level-up
// card at `?level=`), the Festival of Vows, the household's Ready offers (live, after the Ready lines) and §5's
// household milestones. §5 opens with "New story arrived" once a release, its note the release's (read live by its
// number), a tap to the Hearts tab. The world's words are the pack's, read live (`WorldWords`): a festival's name, the
// season's line under "Spring begins", the Town notes the night unlocked (a tap opens them in the Diary), and the town's
// name where she's met in town.
import {
  ACTIVITY_NAMES, bedsAt, EVENINGS, farmPlace, FESTIVALS, festivalNameOf, festivalsOf, goodName, itemNameOf, RANKS, rungName, SEASON_NAMES, seasonLineOf, SUMMARY_SECTIONS, townNoteOf,
  worldNamesOf, type FarmPlaceId, type HeartLine, type MorningSummary, type Season, type StoryPack, type SummarySection,
} from '@farm/domain'
import { builtWords, farmRankWords, milestoneWords } from './goal-words'
import { readParam, type PairWords } from './hearts-view'
import { challengeWords } from './roster-view'
import { plural } from './words'

/** What the world's lines read from the pack as the card shows: a festival's name, a season's line, a Town note's title
 * and the town's name. The game's own words before the pack loads, and without `world.json`. */
export interface WorldWords {
  festival: (id: string) => string
  seasonLine: (season: Season) => string | null
  noteTitle: (id: string) => string | null
  town: string | null
}
export const NO_WORLD: WorldWords = { festival: (id) => festivalNameOf(FESTIVALS, id), seasonLine: () => null, noteTitle: () => null, town: null }
/** The world's words from the pack. */
export function worldWords(pack: Partial<Pick<StoryPack, 'world'>> | null): WorldWords {
  const year = festivalsOf(pack)
  return { festival: (id) => festivalNameOf(year, id), seasonLine: (s) => seasonLineOf(pack, s), noteTitle: (id) => townNoteOf(pack, id)?.title ?? null, town: worldNamesOf(pack).town }
}

/** §5's Town notes in words: the first's title, "+2 more" after it, each a tap to the Diary's Town notes. */
export function notesNews(ids: readonly string[], world: WorldWords): SummaryLine {
  const title = world.noteTitle(ids[0]!) ?? 'A Town note'
  return { key: 'notes', to: `/diary?note=${ids[0]!}`, text: ids.length > 1 ? `${title} +${ids.length - 1} more` : title, tag: ids.length > 1 ? 'Town notes' : 'Town note' }
}

export interface SummaryLine {
  key: string
  text: string
  /** Where its tap goes: the place's quick look or screen, the calendar or the roster. */
  to: string
  /** A mark after the words: "In demand" on a sale the season lifted; "Rank up" and "Points full"; "New";
   * "Built", "Farm Rank" and "Milestone". */
  tag?: string
  /** Her invitation's id: the card draws Yes, tonight and Another day under the line. */
  invite?: string
  /** A line said under it (the house line), in quotes. */
  quote?: string
  /** A house that misses you: the card draws Tonight › and Another night under the line. */
  misses?: number
}
export interface SummaryPart {
  section: SummarySection
  title: string
  lines: SummaryLine[]
}

const SECTION_TITLE: Readonly<Record<SummarySection, string>> = {
  bin: 'The bin', work: 'Work done', ranks: 'Ranks', hearts: 'Hearts', news: 'New today', nudges: 'Today',
}
const peek = (place: FarmPlaceId): string => `/?peek=${place}`
/** The Fields' page. */
export const FIELDS = '/fields'

/** The Dorm's page. */
export const DORM = '/dorm'

/** An Uma's name from master data, for the ranks and news sections; "An Uma" until it loads. */
export type NameOf = (outfitId: string) => string
const someone: NameOf = () => 'An Uma'

/** A Ready line for the morning: read live from `readiness` as the card shows, never stored. */
export interface ReadyNow {
  id: string
  rung: string
  /** Where it plays, in words ("the Fields"); null without her bible's beat. */
  place: string | null
}

/** The morning summary as the card shows it: its sections in order, empty ones hidden, each line a tap.
 * §4 Hearts also shows while someone is `ready`. */
export function summaryParts(summary: MorningSummary, nameOf: NameOf = someone, ready: readonly ReadyNow[] = [], pairs: PairWords | null = null,
  home: HomeWords = NO_HOME, chapterOf: ChapterOf = noChapter, noteOf: NoteOf = noNote, world: WorldWords = NO_WORLD): SummaryPart[] {
  const sections = SUMMARY_SECTIONS.filter((section) => (section === 'hearts' ? summary.hearts.length + ready.length + home.household.length > 0 : summary[section].length > 0))
  return sections.map((section) => ({ section, title: SECTION_TITLE[section], lines: sectionLines(summary, section, nameOf, ready, pairs, home, chapterOf, noteOf, world) }))
}

/** A story release's note by its ship's number, from the release the game plays as the card shows; null for another
 * release, one with no note, or before the pack loads. */
export type NoteOf = (number: number) => string | null
const noNote: NoteOf = () => null

/** Her chapter's title by its number, from the pack as the card shows; null before the pack loads. */
export type ChapterOf = (id: string, n: number) => string | null
const noChapter: ChapterOf = () => null

/** What the homestead's lines read beyond the summary, from the save and the pack as the card shows: a house's name,
 * the house line (drawn live), and the household's Ready offers. None before the pack loads. */
export interface HomeWords {
  houseName: (n: number) => string
  houseLine: (line: Extract<HeartLine, { kind: 'house' }>) => string | null
  household: readonly { id: string; text: string; to: string }[]
}
export const NO_HOME: HomeWords = { houseName: (n) => (n === 0 ? 'Farmhouse' : `House ${n}`), houseLine: () => null, household: [] }

/** §5's new story release in words: "New story arrived · ‹its note›", or the words alone with no note. */
export const storyNewsWords = (note: string | null): string => (note ? `New story arrived · ${note}` : 'New story arrived')

/** §5's household milestones in words. */
export function householdNews(married: number): { text: string; to: string } {
  switch (married) {
    case 1: return { text: 'Married 1 · The homestead opens, and the night’s house', to: '/?sheet=homestead' }
    case 5: return { text: 'Married 5 · Household scene 1, the furniture set, +5% items', to: '/?household=household:5' }
    case 10: return { text: 'Married 10 · Household scene 2, two evenings every 4th day', to: '/?household=household:10' }
    case 15: return { text: 'Married 15 · Household scene 3, +5% more items', to: '/?household=household:15' }
    default: return { text: `Married ${married} · The Great Harvest is Ready`, to: '/?household=finale' }
  }
}
/** Her sheet: her profile on the Hearts tab, on its Work side for a rank's line. */
export const umaSheet = (id: string, view?: 'work'): string => `/hearts?${view ? `view=${view}&` : ''}uma=${id}`

/** The morning's Ready lines: up to three, then "+N more". */
export const READY_LINES = 3
/** The order of §4 Hearts, by line kind: (1) Ready, (2) the invitation, (3) the house's morning with the
 * morning items and night chores, (4) birthdays and anniversaries, (5) levels reached overnight, those met and her
 * chapters opened, (6) the perks' extras, side by side and bond hearts. A new stored kind takes its place here and its
 * words in `heartLine`; within a place the night's order holds. */
export const HEARTS_ORDER: Readonly<Record<HeartLine['kind'], number>> = {
  invite: 2, house: 3, moved: 3, misses: 3, item: 3, chores: 3, birthday: 4, anniversary: 4, vows: 4, level: 5, arrived: 5, chapter: 5, perks: 6, side: 6, bond: 6,
}

/** §4 Hearts: the Ready lines, then the stored lines in that order. `pairs` says which bond
 * lines have a conversation to Read; without it (the pack loading) they say the heart alone. */
export function heartsLines(hearts: readonly HeartLine[], ready: readonly ReadyNow[], nameOf: NameOf, pairs: PairWords | null = null, home: HomeWords = NO_HOME,
  chapterOf: ChapterOf = noChapter, town: string | null = null): SummaryLine[] {
  const now = ready.slice(0, READY_LINES).map((r): SummaryLine => ({
    key: `ready:${r.id}`, to: `/?event=${r.id}`, tag: 'Play', text: `● Ready · ${nameOf(r.id)} · ${rungName(r.rung)}${r.place ? ` · ${r.place}` : ''}`,
  }))
  const more = ready.length > READY_LINES ? [{ key: 'ready:more', to: '/hearts?filter=ready', text: `+${ready.length - READY_LINES} more` }] : []
  // The household's Ready offers, read live, after her Ready lines.
  const household = home.household.map((h): SummaryLine => ({ key: `household:${h.id}`, to: h.to, tag: 'Play', text: h.text }))
  const stored = hearts.map((line, i) => ({ line, i })).sort((a, b) => HEARTS_ORDER[a.line.kind] - HEARTS_ORDER[b.line.kind] || a.i - b.i)
  return [...now, ...more, ...household, ...stored.map(({ line }) => heartLine(line, nameOf, pairs, home, chapterOf, town))]
}

/** The ♥♥ of a pair's line: two hearts for two Umas, whatever the level. */
export const PAIR_MARK = '♥♥'

/** A bond heart in words: "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read** while a tie's conversation waits (its
 * tap plays them, the pack's or the game's card), the heart alone once read, or "<a> and <b> are closer now" for a pair
 * the ties don't hold. */
function bondLine(line: Extract<HeartLine, { kind: 'bond' }>, nameOf: NameOf, pairs: PairWords | null): SummaryLine {
  const [a, b] = [nameOf(line.a), nameOf(line.b)]
  const key = `bond:${line.a}:${line.b}`
  const to = umaSheet(line.a)
  const unread = pairs?.unread(line.a, line.b, line.hearts) ?? []
  if (unread.length > 0) return { key, to: `/?read=${readParam(line.a, line.b, unread)}`, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts}`, tag: 'Read' }
  if (pairs?.talks(line.a, line.b)) return { key, to, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts}` }
  const tie = pairs?.tieLine(line.a, line.b) ?? null
  return tie
    ? { key, to, text: `${PAIR_MARK} ${a} & ${b} · bond ${line.hearts} · ${tie}` }
    : { key, to, text: `${PAIR_MARK} ${a} and ${b} are closer now · bond ${line.hearts}` }
}

/** The night's chores in words: "Night chores · 3 items", "Night chores · 2 items · +0.5 growth". */
export function choresWords(items: number, growth: number): string {
  return ['Night chores', ...(items > 0 ? [plural(items, 'item')] : []), ...(growth > 0 ? [`+${growth} growth`] : [])].join(' · ')
}
/** Goods at their stars in words: "★2 Shiitake", "★2 Shiitake and ★3 Carp". */
const starredGoods = (keys: readonly string[]): string => keys.map((key) => {
  const [id, stars] = key.split('@')
  return `★${stars} ${goodName(id!)}`
}).join(' and ')

/** The house's morning in words: "⌂ Farmhouse · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item". */
export function houseWords(line: Extract<HeartLine, { kind: 'house' }>, nameOf: NameOf, houseName: (n: number) => string): string {
  const who = line.umas.length === 1 ? nameOf(line.umas[0]!) : `${line.umas.length} home`
  return [`⌂ ${houseName(line.house)}`, who, `♥ +${line.paid}`, ...(line.breakfast > 0 ? [`☕ ${line.breakfast} fed`] : []), ...(line.items > 0 ? [`+${plural(line.items, 'item')}`] : [])].join(' · ')
}

/** A stored §4 line in words, opening her profile. One met who lives in town is "in town", or in the town the world
 * names. */
function heartLine(line: HeartLine, nameOf: NameOf, pairs: PairWords | null, home: HomeWords = NO_HOME, chapterOf: ChapterOf = noChapter, town: string | null = null): SummaryLine {
  if (line.kind === 'side') return { key: 'side', to: '/warehouse', text: `Side by side · +${plural(line.items, 'item')}` }
  // The house's morning (its house line under it), a house that misses you, the Festival of Vows.
  if (line.kind === 'house') {
    const quote = home.houseLine(line)
    return { key: 'house', to: `/?sheet=homestead&house=${line.house}`, text: houseWords(line, nameOf, home.houseName), ...(quote ? { quote } : {}) }
  }
  if (line.kind === 'misses') return { key: 'misses', to: `/?sheet=homestead&house=${line.house}`, text: `⌂ ${home.houseName(line.house)} misses you`, misses: line.house }
  if (line.kind === 'vows') return { key: 'vows', to: '/hearts?filter=married', text: `♥ The Festival of Vows · ${plural(line.spouses, 'spouse')} · ♥ +${line.paid} · festival night tonight` }
  if (line.kind === 'perks') return { key: 'perks', to: '/warehouse', text: `Perks · +${plural(line.items, 'item')}` }
  if (line.kind === 'chores') return { key: 'chores', to: line.items > 0 ? '/warehouse' : FIELDS, text: choresWords(line.items, line.growth) }
  if (line.kind === 'bond') return bondLine(line, nameOf, pairs)
  const name = nameOf(line.id)
  const to = umaSheet(line.id)
  switch (line.kind) {
    case 'invite': return { key: `invite:${line.id}`, to, text: `✉ ${name}: “${EVENINGS[line.evening].question ?? EVENINGS[line.evening].name}”`, invite: line.id }
    case 'birthday': return { key: `birthday:${line.id}`, to, text: line.when === 'today' ? `★ ${name}’s birthday today` : `★ Tomorrow: ${name}’s birthday` }
    case 'anniversary': return {
      key: `anniversary:${line.id}`, to,
      text: line.when === 'today' ? `♥ ${name}’s anniversary${line.item ? ` · ★5 ${goodName(line.item)} left for you` : ''}` : `♥ Tomorrow: ${name}’s anniversary`,
    }
    case 'arrived': return { key: `arrived:${line.id}`, to, text: `Met ${name}${line.home ? ' · moved in' : ` · in ${town ?? 'town'}`}`, tag: 'New' }
    case 'item': return { key: `item:${line.id}`, to, text: `♥ ${name} left you ${starredGoods(line.items)}` }
    case 'moved': return { key: `moved:${line.id}`, to, text: `⌂ ${name} moved into ${home.houseName(line.house)}` }
    case 'level': return { key: `level:${line.id}`, to: `/?level=${line.id}:${line.rung}`, text: `♥ ${name} · ${rungName(line.rung)}, reached overnight`, tag: 'New' }
    case 'chapter': {
      const title = chapterOf(line.id, line.chapter)
      return { key: `chapter:${line.id}`, to, text: `A new chapter with ${name}${title ? ` · ${title}` : ''}`, tag: 'New' }
    }
  }
}

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

function sectionLines(summary: MorningSummary, section: SummarySection, nameOf: NameOf, ready: readonly ReadyNow[], pairs: PairWords | null,
  home: HomeWords, chapterOf: ChapterOf, noteOf: NoteOf, world: WorldWords): SummaryLine[] {
  switch (section) {
    case 'bin': {
      // Each good and star with its count and gold, the demand marked, then the total.
      const sold = summary.bin.map((sale): SummaryLine => ({
        key: `sold:${sale.id}@${sale.stars}`, to: '/?sheet=bin', text: `${goodName(sale.id)} ★${sale.stars} × ${sale.count} · ${gold(sale.gold)}`,
        ...(sale.demand ? { tag: 'In demand' } : {}),
      }))
      return [...sold, { key: 'sold:total', to: '/?sheet=bin', text: `Total · ${gold(summary.bin.reduce((sum, sale) => sum + sale.gold, 0))}` }]
    }
    case 'work':
      // Jobs by place; crops ready by block and what withered, which open the Fields.
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
      // A story release new to the device, with its note; the season (its line under it) and festivals; the Town notes
      // the night unlocked; a place built overnight, a Farm Rank and what it opens, the Diary's milestones; the
      // household's milestones; the Dorm's beds and swaps home.
      return summary.news.map((line): SummaryLine => {
        switch (line.kind) {
          case 'story': return { key: 'story', text: storyNewsWords(noteOf(line.number)), to: '/hearts', tag: 'New' }
          case 'season': {
            const quote = world.seasonLine(line.season)
            return { key: 'season', text: `${SEASON_NAMES[line.season]} begins`, to: '/?sheet=calendar', ...(quote ? { quote } : {}) }
          }
          case 'festival': return { key: `festival:${line.when}`, text: `${world.festival(line.festival)} ${line.when}`, to: peek('festival') }
          case 'notes': return notesNews(line.ids, world)
          case 'built': return { key: `built:${line.place}`, text: builtWords(line.place), to: peek(farmPlace(line.place)?.on ?? line.place), tag: 'Built' }
          case 'farm-rank': return { key: `farm-rank:${line.rank}`, text: farmRankWords(line.rank), to: '/?sheet=rank', tag: 'Farm Rank' }
          case 'milestone': return { key: `milestone:${line.id}`, text: milestoneWords(line.id), to: '/diary', tag: 'Milestone' }
          case 'dorm': return { key: 'dorm', text: `Dorm level ${line.level} · ${bedsAt(line.level)} beds`, to: DORM }
          case 'home': return {
            key: 'home', to: DORM, text: line.umas.length === 1 ? `${nameOf(line.umas[0]!)} is home` : `${line.umas.length} Umas are home`,
          }
          case 'household': return { key: `household:${line.married}`, ...householdNews(line.married), tag: 'Household' }
        }
      })
    case 'nudges':
      return summary.nudges.map((line) => line.kind === 'idle'
        ? { key: 'idle', text: `${plural(line.umas.length, 'Uma')} idle`, to: '/hearts?view=work' }
        : { key: 'seeds', text: `${plural(line.plots, 'plot')} to plant`, to: FIELDS })
    case 'ranks':
      // "Name · Farming Hand" for a rank-up; "Name · Farming · Harvest 30 crops she tended · 12/30" when her points
      // filled and the challenge waits, naming the challenge in its own words with her count. Each opens her sheet.
      return summary.ranks.map((line): SummaryLine => line.kind === 'rank-up'
        ? { key: `rank-up:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId, 'work'), text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} ${RANKS[line.rank]}`, tag: 'Rank up' }
        : {
          key: `full:${line.outfitId}:${line.activity}`, to: umaSheet(line.outfitId, 'work'), tag: 'Points full',
          text: `${nameOf(line.outfitId)} · ${ACTIVITY_NAMES[line.activity]} · ${challengeWords(line.activity, line.rank - 1, line.challenge) ?? RANKS[line.rank]}`,
        })
    case 'hearts':
      return heartsLines(summary.hearts, ready, nameOf, pairs, home, chapterOf, world.town)
  }
}
