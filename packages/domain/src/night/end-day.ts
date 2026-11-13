// End the day: the night is one pure function, nine steps in a fixed order, one save write. A step whose part of the
// game isn't built yet (the ranch, the workshops) does nothing:
//
//   1 the bin pays · 2 crops grow · 3 animals · 4 jobs move a day on and hauls count ·
//   5 workshops reset · 6 ranks, bonds and well fed · 7 crops wither and the calendar turns
//   · 8 the Dorm and arrivals, goals, the Diary and the Farm Rank · 9 the morning summary
//
// Every draw a step makes is `draw(uid, day, what, n)`, so the same save always gives the same morning. The player's
// change is stamped once, with real time, after the ninth step.
//
// The romance's steps sit among them: step 2 grows a tended block ×1.1 side by side; step 4 pays side by side's extras
// after the hauls (`nightExtras`); step 6 reads favourites from the story pack and her friendship's factor, ticks bonds
// (`tickBonds`) and pays her line +10 (`payLine`); step 7 clears the whole `today`; step 8 is `settleDorm` →
// `arriveUmas` (authored arrivals, their ties seeded) → `checkGoals` (the chapter's authored arrival); step 9 notes
// praise earned overnight, birthdays and anniversaries today and tomorrow with the anniversary's item (`heartsMorning`),
// draws the morning's invitations (`drawInvitations`), and its §4 is Hearts, with the invitations, side by side and the
// bond hearts reached. The perks: step 2's farming chores and a farmer in her element, step 4's perks' extras
// (`nightExtras`) and gathering chores (`nightChores`), step 6's mentor, and step 9's morning items (`morningItems`),
// with their Hearts lines. The ring and the wedding: step 8 sets the ring bench the night after the first Romance 8
// (`openRingBench`), and step 9 serves a wedding's reception (`serveTheReception`) before anything else. Married life:
// before step 1 tonight's house is noted (`noteTheNight`); step 6 pays shared houses' bonds (`shareHouses`) and levels
// S2 and S4 (`levelAtNight`); step 8 notes the household milestones (`householdMilestones`); step 9 gives the house's
// morning (`houseMorningStep`), moves waiting spouses into rooms (`moveInRooms`) and holds the Festival of Vows
// (`vowsMorning`). A night without the story pack runs the farm's steps and skips the romance's.
import { endsAt, finishedCount, isRefusal, settle, speedUp } from '@luismlorenzana/uma-work'
import { DAY_MS, festivalOn, isSeasonStart, dateOf, workNow } from '../farm/calendar'
import { bondsTonight, extrasTonight, newBondHearts, type BondPay, type Extras } from '../farm/bonds'
import { settleDormNight } from '../farm/dorm'
import { PLACE_ACTIVITY, tickRankRules, type WorkedDay } from '../farm/rank-rules'
import { talentsD, type TalentOf } from '../farm/talents'
import { growFields, plotsToPlant, witherFields, type Ripened, type Withered } from '../fields/fields'
import { haulsTonight, loopKinds, type BestCatch, type MadeTonight } from '../gathering/kinds'
import { payBin } from '../save/bin'
import { settleLoopWork } from '../save/loop-work'
import { LOOP_WORK_PLACES, type LoopKinds, type LoopPlaceId } from '../save/parse-v4'
import { touched } from '../save/save'
import { payLines } from '../romance/acts'
import { arrivalsTonight } from '../romance/arrivals'
import { drawInvites } from '../romance/evening'
import { openBench } from '../romance/bench'
import { serveReception } from '../romance/wedding'
import { heartDays, NO_BIRTHDAYS, type Birthdays } from '../romance/days'
import { praiseOvernight } from '../romance/praise'
import { fieldChores, gatherChores, leaveMorningItems, mentorsTonight, type ChoresDone } from '../romance/perk-effects'
import { moveInWaiting } from '../romance/homestead'
import { festivalOfVows, householdNight, houseMorning, levelsTonight, missesLine, noteTheNight, shareHouses, type NightHouse } from '../romance/household'
import { BLOCK_IDS, newTodayV4, type BlockId, type FarmSave, type OutfitId } from '../save/v4'
import { castOrder, favouriteOf, type StoryPack } from '../story/pack'
import { farmEnv, loopWorld, nightEnv, WELL_FED_TICKETS, withLoopWorld } from '../work/loop-env'
import { checkGoalsNight, type GoalsTonight } from '../story/chapters'
import { daySetState } from './nudge'
import type {
  BinSale, HeartLine, HouseholdNews, HouseLine, HouseMissesLine, InviteLine, ItemLine, LevelLine, MorningSummary, MovedLine, NewsLine, Nudge, RankLine, VowsLine, WorkLine,
} from './summary'

/** What the night reads beyond the save: the talents the app reads from master data, the story pack and the
 * birthdays. */
export interface NightContext {
  /** The work kinds; tests pass their own. Left out, `loopKinds(talentOf)`: the game's kinds with these talents. */
  readonly kinds?: LoopKinds
  /** Each Uma's talent in an activity: tending's growth (step 2), a queued job's plan when it starts at the
   * boundary (step 7) and rank points (step 6). D for everyone when left out (tests). */
  readonly talentOf?: TalentOf
  /** The story pack: the night's favourites, her line's places, authored arrivals and anniversary items, and the
   * ties (their seeds, her closest friend). A night without it arrives no one, reads no favourites, ticks no bonds
   * and pays no line. */
  readonly story?: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>
  /** Each cast Uma's birthday as a day of the farm's year: master data's character set through the cast
   * (`birthdaysOf`). None when left out. */
  readonly birthdays?: Birthdays
}

/** What the steps saw that a later one needs and the save alone can't show. */
export interface NightNotes {
  /** Step 1: what the bin sold tonight, by good and star. The summary's bin section. */
  readonly sold: readonly BinSale[]
  /** Step 4: who worked today, and where (a running job at the day's start). Step 6 pays rank points from it. */
  readonly worked: readonly { outfitId: OutfitId; place: LoopPlaceId }[]
  /** Step 4: each job that finished by the morning, with the items it made. */
  readonly finished: readonly { outfitId: OutfitId; place: LoopPlaceId; items: number }[]
  /** Step 4: every entry's items that finished tonight, a day's haul or a station's batch, with its request. */
  readonly made: readonly MadeTonight[]
  /** Step 4: the night's best catch, for the summary. */
  readonly best: BestCatch | null
  /** Step 2: each tender whose block had a growing plot, so she worked the night. Step 6 pays her
   * farming's rank points from it. */
  readonly tended: readonly { outfitId: OutfitId; block: BlockId }[]
  /** Step 2: plots that turned Ready tonight, by block. */
  readonly ripened: readonly Ripened[]
  /** Step 7: crops that withered on a season's last night, by block and crop. */
  readonly withered: readonly Withered[]
  /** Step 6: rank-ups, and points that filled tonight. The summary's ranks section. */
  readonly ranks: readonly RankLine[]
  /** Step 8: the Dorm's level, when a level bought took effect tonight. */
  readonly dorm: number | null
  /** Step 8: Umas a swap brought home. */
  readonly home: readonly OutfitId[]
  /** Step 8: the chapter completed tonight, the Diary's milestones and rows paid, and Farm Ranks reached. */
  readonly goals: GoalsTonight
  /** Step 8: the cast Umas who arrived, before the chapter's own. */
  readonly arrived: readonly { id: string; home: boolean }[]
  /** Step 6: who was paid +10 for a day at her line. */
  readonly lines: readonly { id: string; points: number }[]
  /** Step 9: birthdays and anniversaries today and tomorrow, §4's first stored lines. */
  readonly days: readonly HeartLine[]
  /** Step 4: side by side's extras, copies of each Uma's night's items into the Warehouse. */
  readonly extras: readonly Extras[]
  /** Step 6: bond points each pair earned for a shared place today. */
  readonly bonds: readonly BondPay[]
  /** Step 9: this morning's invitations, §4's second place. */
  readonly invites: readonly InviteLine[]
  /** Steps 2 and 4: each Uma's night chores done: a farmer's growth, a forager's and a fisher's items. */
  readonly chores: readonly ChoresDone[]
  /** Step 4: the perks' extras, copies of each Uma's night's items by the romance term. */
  readonly perks: readonly Extras[]
  /** Step 9: this morning's items, R2's and S2's. */
  readonly items: readonly ItemLine[]
  /** Before step 1: the house slept in tonight, once anyone is married. */
  readonly house: NightHouse | null
  /** Step 6: spouse levels reached tonight, S2 and S4. */
  readonly levels: readonly LevelLine[]
  /** Step 8: household milestones passed tonight. */
  readonly household: readonly HouseholdNews[]
  /** Step 9: the house's morning, its extra items, waiting spouses moved in, a house that misses you, and the Festival
   * of Vows. */
  readonly houseLine: HouseLine | null
  readonly houseItems: readonly ItemLine[]
  readonly moved: readonly MovedLine[]
  readonly misses: HouseMissesLine | null
  readonly vows: VowsLine | null
}

/** A night's notes before its first step. */
export const emptyNotes = (): NightNotes => ({
  sold: [], worked: [], finished: [], made: [], best: null, tended: [], ripened: [], withered: [], ranks: [], dorm: null, home: [],
  goals: { chapter: null, paid: [], ranks: [] }, arrived: [], lines: [], days: [], extras: [], bonds: [], invites: [], chores: [], perks: [], items: [], house: null, levels: [],
  household: [], houseLine: null, houseItems: [], moved: [], misses: null, vows: null,
})

export interface Night {
  /** The save as the player left the day. */
  readonly before: FarmSave
  /** The save as the night has it so far. */
  readonly save: FarmSave
  readonly context: NightContext
  readonly notes: NightNotes
}

/** One step of the night: the night so far in, the night after it out. Pure. */
export type NightStep = (night: Night) => Night

const talentsOf = (night: Night): TalentOf => night.context.talentOf ?? talentsD
/** The kinds tonight plans with: the context's, or the game's with tonight's talents and the pack, so a queued job
 * planned at the boundary reads her keepsake. */
const kindsOf = (night: Night): LoopKinds => night.context.kinds ?? loopKinds(talentsOf(night), night.context.story ?? null)
const same: NightStep = (night) => night

/** Step 1: everything shipped today pays at price × stars × demand on the day it was shipped, before
 * the date turns. Gold, `farm.counts['gold-shipped']` and `diary.shipped` rise; the bin empties. */
export const payTheBin: NightStep = (night) => {
  const { save, sales } = payBin(night.save, night.save.calendar.day)
  return { ...night, save, notes: { ...night.notes, sold: sales } }
}
/** Step 2: each planted plot that isn't Ready grows by its block's rate (1 untended, the tender's rate when
 * tended); a plot whose growth reaches its days − 0.5 turns Ready. Tenders with a growing plot worked the night. With
 * the pack: a farmer in her element grows her block ×1.2 side by side, and the farmers' night chores add +0.25 growth
 * each to a block tonight. */
export const growCrops: NightStep = (night) => {
  const talentOf = talentsOf(night)
  const farming = (outfitId: string) => talentOf(outfitId, 'farming')
  const story = night.context.story ?? null
  if (!story) {
    const { save, tended, ripened } = growFields(night.save, farming)
    return { ...night, save, notes: { ...night.notes, tended, ripened } }
  }
  const { growth, chores } = fieldChores(night.save, story)
  const { save, tended, ripened } = growFields(night.save, farming, story, growth)
  return { ...night, save, notes: { ...night.notes, tended, ripened, chores: [...night.notes.chores, ...chores] } }
}
/** Step 3: animals fed, affection, products. The ranch isn't built, so it does nothing. */
export const tendAnimals: NightStep = same

/**
 * Step 4: jobs move a day on. First, each well-fed Uma's running job of a multi-day kind gains a
 * quarter day through uma-work's `speedUp`: 12 free Speed Tickets at tonight's start, clamped by uma-work to the time it
 * has left. Then the night reads what the day's work comes to by the morning, settling a copy at the morning's moment;
 * the settle itself is stored at step 7, from the save after step 6's ranks, so a queued job starting at tonight's
 * boundary is planned with them.
 */
export const moveJobs: NightStep = (night) => {
  const kinds = kindsOf(night)
  const evening = workNow(night.save)
  const morning = evening + DAY_MS
  let world = loopWorld(night.save)
  const env = nightEnv(kinds)
  for (const [outfitId, uma] of Object.entries(night.save.roster)) {
    const entry = world.work[outfitId]?.entries.at(-1)
    if (uma.wellFed <= 0 || !entry || endsAt(entry) <= evening || !kinds[entry.request.kind]?.multiDay) continue
    const sped = speedUp(world, { outfitId, startedAt: entry.startedAt, tickets: WELL_FED_TICKETS }, evening, env)
    if (!isRefusal(sped)) world = sped.state
  }
  const save = withLoopWorld(night.save, world)
  const worked = Object.values(world.work).flatMap((row) => {
    const entry = row.entries.at(-1)
    return row.slot && entry && entry.startedAt <= evening && endsAt(entry) > evening ? [{ outfitId: row.outfitId, place: row.slot.building as LoopPlaceId }] : []
  })
  const byMorning = settle(loopWorld(save), morning, farmEnv(kinds)).state
  const finished = Object.values(byMorning.work).flatMap((row) => (row.slot ? row.entries : [])
    .filter((entry) => endsAt(entry) > evening && endsAt(entry) <= morning)
    .map((entry) => ({ outfitId: row.outfitId, place: row.slot!.building as LoopPlaceId, items: entry.outputs.length })))
  const made = Object.values(byMorning.work).flatMap((row) => (row.slot ? row.entries : []).flatMap((entry): MadeTonight[] => {
    const items = entry.outputs.slice(finishedCount(entry, evening), finishedCount(entry, morning)).flatMap((o) => ('item' in o ? [o.item] : []))
    return items.length > 0 ? [{ outfitId: row.outfitId, place: row.slot!.building as LoopPlaceId, request: entry.request, items }] : []
  }))
  return { ...night, save, notes: { ...night.notes, worked, finished, made } }
}

/** Step 4, after the jobs move: tonight's hauls count toward each forager's and angler's next
 * rank's challenge, items in an area and catches at a spot, before step 6 ranks her up; the night's best catch is noted
 * for the morning. What came home is counted when it's collected. */
export const countHauls: NightStep = (night) => {
  const { save, best } = haulsTonight(night.save, night.notes.made)
  return { ...night, save, notes: { ...night.notes, best } }
}

/** Step 4, after the hauls: **the night's extras.** Side by side: each Uma whose work
 * finished items tonight at a place where an Uma she has 3+ bond hearts with also worked today gets 10% of them again (20%
 * in her element), seeded copies straight into the Warehouse; then **the perks' extras**: the
 * bond term × the romance term (her line's +10% and +20%, her ring, a dream, the household; held to 40%) of the same
 * items, their own seeded copies. The planned hauls (uma-work's) are untouched. */
export const nightExtras: NightStep = (night) => {
  const { save, extras, perks } = extrasTonight(night.save, night.notes.made, night.notes.worked, night.context.story ?? null)
  return { ...night, save, notes: { ...night.notes, extras, perks } }
}

/** Step 4, after the extras: **the gathering chores.** A forager's night chores bring one item
 * each from her rank's deepest forest area this season, a fisher's one fish each from her deepest spot, at a day's haul's
 * stars, straight into the Warehouse; on the farm only, 1 from F6, 2 from R7, 3 from S4. A night without the pack does
 * none. */
export const nightChores: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, chores } = gatherChores(night.save, night.context.story, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, chores: [...night.notes.chores, ...chores] } }
}

/** Step 5: each workshop may be played again tomorrow. `workshops.played` holds the day, so nothing moves. */
export const resetWorkshops: NightStep = same
/**
 * Step 6: rank points for every Uma who worked today, one activity each: a running
 * job's place (`notes.worked`, `PLACE_ACTIVITY`) or a tended block with a growing plot (`notes.tended`, farming). 10
 * points × her talent's factor, ×1.2 in her favourite line, ×1.25 well fed, ×1.05 or ×1.10 for her friendship. Then every
 * Uma ranks up where her points and challenge are both met, one rank a night. Before the stored settle (step 7), so a
 * queued job starting at tonight's boundary is planned with tonight's ranks.
 */
export const tickRanks: NightStep = (night) => {
  const talentOf = talentsOf(night)
  const { story } = night.context
  const favourites = new Map(Object.keys(night.save.roster).map((id) => [id, story ? favouriteOf(story, id) : null]))
  const worked: WorkedDay[] = [
    ...night.notes.worked.map((w) => ({ outfitId: w.outfitId, activity: PLACE_ACTIVITY[w.place] })),
    ...night.notes.tended.map((t) => ({ outfitId: t.outfitId, activity: 'farming' as const })),
  ]
  // With the pack, a mentor's ×1.10 for the others at her place today.
  const mentors = story ? mentorsTonight(night.save, story, night.notes.worked, night.notes.tended) : null
  const { save, lines } = tickRankRules(night.save, worked, (outfitId, activity) => ({
    talent: talentOf(outfitId, activity), favourite: favourites.get(outfitId) === activity, ...(mentors?.has(outfitId) ? { mentor: mentors.get(outfitId)! } : {}),
  }))
  return { ...night, save, notes: { ...night.notes, ranks: lines } }
}
/** Step 6: bond points for pairs who shared a place: every pair among the Umas who worked one place today (step 4's
 * jobs; the Fields' tenders with a growing block, step 2) earns +10 once a night, ×1.5 sharing a favourite line of that
 * place's, ×1.5 more when one is at Romance 4 and the other her closest friend. A night without the pack ticks none. */
export const tickBonds: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, paid } = bondsTonight(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, bonds: paid } }
}

/** Step 6: +10 to each Uma who worked today at one of her line's places (a running job
 * there, or a farmer's tended block with a growing plot), once a night. A night without the pack pays none. */
export const payLine: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, paid } = payLines(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, lines: paid } }
}

/** Step 6: the well-fed days count down (a wedding's reception and her breakfast feed the farm). */
export const countWellFed: NightStep = (night) => ({ ...night, save: wellFedDown(night.save) })

function wellFedDown(save: FarmSave): FarmSave {
  return { ...save, roster: Object.fromEntries(Object.entries(save.roster).map(([id, uma]) => [id, uma.wellFed > 0 ? { ...uma, wellFed: uma.wellFed - 1 } : uma])) }
}

/** Step 7, before the date turns: on a season's last night, crops still growing that don't grow in
 * the next season wither. Ready crops wait. */
export const witherCrops: NightStep = (night) => {
  const { save, withered } = witherFields(night.save)
  return { ...night, save, notes: { ...night.notes, withered } }
}

/**
 * Step 7: the calendar turns. The date moves and uma-work's clock with it: the work settles at the new morning and is
 * stored, so finished jobs turn Ready and queues start their next job, planned with tonight's ranks. The whole
 * `today` clears: chats and gifts, praise earned and paid, events played, evenings and invitations. On a season's last
 * night `witherCrops` has already withered crops out of season.
 */
export const turnCalendar: NightStep = (night) => {
  const turned: FarmSave = { ...night.save, calendar: { day: night.save.calendar.day + 1 }, today: newTodayV4() }
  return { ...night, save: settleLoopWork(turned, kindsOf(night)) }
}

/** Step 8: the Dorm's level bought takes effect, and swaps arrive: each Uma swapped out
 * goes away and the one swapped in comes home in her place. */
export const settleDorm: NightStep = (night) => {
  const { save, raised, home } = settleDormNight(night.save)
  return { ...night, save, notes: { ...night.notes, dorm: raised, home } }
}

/** Step 8, after the Dorm: every cast Uma not on the roster whose authored arrival holds joins, in the cast's order,
 * home while a bed is free, else away. A night without the pack arrives no one. */
export const arriveUmas: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, arrived } = arrivalsTonight(night.save, night.context.story)
  return { ...night, save, notes: { ...night.notes, arrived } }
}

/** Step 8: the Diary pays the milestones and rows reached (a depth
 * milestone by tonight's hauls), the Farm Rank's points are recomputed, and the chapter completes the night its last goal
 * is met, paying 500g, the Mill's plans and the chapter's authored arrival; the next chapter opens. The closing scene
 * waits for the morning. */
export const checkGoals: NightStep = (night) => {
  const { save, tonight } = checkGoalsNight(night.save, night.notes.made, night.context.story)
  return { ...night, save, notes: { ...night.notes, goals: tonight } }
}

/** Step 8, after the goals: the night after the first Romance 8 event anyone played,
 * the Forge's building stands as the ring bench (`buildings.forge = 0`), and Ida Stone's scene is due in the morning. */
export const openRingBench: NightStep = (night) => ({ ...night, save: openBench(night.save) })

/** Step 9, first: today's wedding reception (`today.reception`, cleared by step 7, so
 * read from the day as it was left) feeds everyone on the farm for its days from tomorrow, never shortening a meal
 * already running. */
export const serveTheReception: NightStep = (night) => {
  return { ...night, save: serveReception(night.save, night.before.today.reception).save }
}

/** Before step 1: once anyone is married, tonight's house is noted, your pick from
 * Tonight's Sleep at or else the house slept in least lately, and the pick clears for tomorrow. */
export const noteTonight: NightStep = (night) => {
  const { save, night: house } = noteTheNight(night.save)
  return { ...night, save, notes: { ...night.notes, house } }
}

/** Step 6: +10 bond a night to each pair of residents sharing a house. A night without
 * the pack pays none. */
export const shareTheHouses: NightStep = (night) => {
  if (!night.context.story) return night
  return { ...night, save: shareHouses(night.save, night.context.story).save }
}

/** Step 6: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, no event; the
 * morning shows her level-up card. */
export const levelAtNight: NightStep = (night) => {
  const { save, levels } = levelsTonight(night.save)
  return { ...night, save, notes: { ...night.notes, levels } }
}

/** Step 8, after the bench: the household milestones as the married count passes 1, 5, 10, 15
 * and 20: news, the furniture set at 5, the finale's morning at 20. */
export const householdMilestones: NightStep = (night) => {
  const { save, news } = householdNight(night.save)
  return { ...night, save, notes: { ...night.notes, household: news } }
}

/** Step 9, after the reception: the morning of the house slept in: each resident +30, her
 * breakfast (S1) if no meal runs, one more morning item each at S2+; and a house you haven't slept in for 8 nights misses
 * you. A night without the pack gives none. */
export const houseMorningStep: NightStep = (night) => {
  if (!night.context.story || !night.notes.house) return night
  const { save, line, items } = houseMorning(night.save, night.context.story, night.notes.house, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, houseLine: line, houseItems: items, misses: missesLine(save) } }
}

/** Step 9: spouses home in the Dorm who wait for a room take one, in wedding order, once a house
 * stands; the morning says who moved where. */
export const moveInRooms: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, moved } = moveInWaiting(night.save, night.context.story)
  return { ...night, save, notes: { ...night.notes, moved: moved.map((m): MovedLine => ({ kind: 'moved', id: m.id, house: m.house })) } }
}

/** Step 9: on the finale's day of the year, each later year, every spouse +50 and a festival
 * night tonight. */
export const vowsMorning: NightStep = (night) => {
  const { save, line } = festivalOfVows(night.save)
  return { ...night, save, notes: { ...night.notes, vows: line } }
}

/** The morning's news (the summary's §5): the season's first day, a festival today or tomorrow. */
function newsOf(day: number): NewsLine[] {
  const news: NewsLine[] = []
  if (isSeasonStart(day)) news.push({ kind: 'season', season: dateOf(day).season })
  const today = festivalOn(day)
  if (today) news.push({ kind: 'festival', festival: today.id, when: 'today' })
  const tomorrow = festivalOn(day + 1)
  if (tomorrow) news.push({ kind: 'festival', festival: tomorrow.id, when: 'tomorrow' })
  return news
}

/** The goals' news: the chapter completed, the Farm Ranks reached, then the Diary's milestones and rows paid. */
function goalNews(notes: NightNotes): NewsLine[] {
  const { chapter, ranks, paid } = notes.goals
  return [
    ...(chapter !== null ? [{ kind: 'chapter' as const, chapter }] : []),
    ...ranks.map((rank): NewsLine => ({ kind: 'farm-rank', rank })),
    ...paid.map((id): NewsLine => ({ kind: 'milestone', id })),
  ]
}

/** The Dorm's news: its new level, and Umas home from a swap (arrivals are §4's). */
function dormNews({ notes }: Night): Extract<NewsLine, { kind: 'dorm' | 'home' }>[] {
  return [...(notes.dorm !== null ? [{ kind: 'dorm' as const, level: notes.dorm }] : []), ...(notes.home.length > 0 ? [{ kind: 'home' as const, umas: [...notes.home] }] : [])]
}

/** §4 Hearts: this morning's invitations, birthdays and anniversaries today and tomorrow (`heartsMorning`), then everyone who joined tonight,
 *the arrivals at step 8 in the cast's order and then the chapter's, home or away (her arrival scene
 * waits for the farm to open); then this morning's items and the night's chores; then the perks' extras, side by
 * side's extras and the bond hearts reached since the last morning. */
function heartLines(night: Night): HeartLine[] {
  const { save, before, context } = night
  const order = context.story ? castOrder(context.story) : []
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const extras = night.notes.extras.reduce((n, e) => n + e.items.length, 0)
  const perks = night.notes.perks.reduce((n, e) => n + e.items.length, 0)
  const choreItems = night.notes.chores.reduce((n, c) => n + c.items.length, 0)
  const choreGrowth = Math.round(night.notes.chores.reduce((n, c) => n + c.growth, 0) * 4) / 4
  // Her house's extra morning item joins her own `item` line, after her count's.
  const items = new Map<string, string[]>()
  for (const line of [...night.notes.items, ...night.notes.houseItems]) items.set(line.id, [...(items.get(line.id) ?? []), ...line.items])
  return [
    ...night.notes.invites,
    ...night.notes.days,
    ...(night.notes.vows ? [night.notes.vows] : []),
    ...night.notes.levels,
    ...Object.keys(save.roster).filter((id) => !before.roster[id]).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
      .map((id): HeartLine => ({ kind: 'arrived', id, home: save.dorm.home.includes(id) })),
    ...(night.notes.houseLine ? [night.notes.houseLine] : []),
    ...night.notes.moved,
    ...(night.notes.misses ? [night.notes.misses] : []),
    ...[...items].map(([id, keys]): ItemLine => ({ kind: 'item', id, items: keys })),
    ...(choreItems > 0 || choreGrowth > 0 ? [{ kind: 'chores' as const, items: choreItems, growth: choreGrowth }] : []),
    ...(perks > 0 ? [{ kind: 'perks' as const, items: perks }] : []),
    ...(extras > 0 ? [{ kind: 'side' as const, items: extras }] : []),
    ...newBondHearts(before, save, order),
  ]
}

/** Step 9, before the summary, the date already turned: praise earned overnight
 * (her work made a ★3+ item, or she ranked up), and birthdays and anniversaries today and tomorrow, an anniversary today
 * leaving its ★5 item of her line in the Warehouse. */
export const heartsMorning: NightStep = (night) => {
  const rankedUp = night.notes.ranks.flatMap((line) => (line.kind === 'rank-up' ? [line.outfitId] : []))
  const praised = praiseOvernight(night.save, night.notes.made, rankedUp)
  if (!night.context.story) return { ...night, save: praised }
  const { save, lines } = heartDays(praised, night.context.story, night.context.birthdays ?? NO_BIRTHDAYS)
  return { ...night, save, notes: { ...night.notes, days: lines } }
}

/** Step 9, after `heartsMorning` (her R2 and S2 perks): **this morning's items.** Each Uma on the farm
 * whose morning it is by her count (every 4th from Romance 2, every 2nd from Spouse 2) leaves a good of her line at her
 * line's stars (★2+, ★3+ from S2) in the Warehouse. A night without the pack leaves none. */
export const morningItems: NightStep = (night) => {
  if (!night.context.story) return night
  const { save, lines } = leaveMorningItems(night.save, night.context.story, talentsOf(night))
  return { ...night, save, notes: { ...night.notes, items: lines } }
}

/** Step 9, after `heartsMorning`: this morning's invitations, one (two from 10 married),
 * drawn by weight among the Umas home at Friendship 2+ whose favourite kind is open to them, into `today.invites`
 * unanswered and §4's second place. A night without the pack draws none. */
export const drawInvitations: NightStep = (night) => {
  if (!night.context.story) return night
  const save = drawInvites(night.save, night.context.story)
  const invites = save.today.invites.map((i): InviteLine => ({ kind: 'invite', id: i.id, evening: i.kind }))
  return { ...night, save, notes: { ...night.notes, invites } }
}

/** Step 9: the morning summary, built from what changed. It replaces last night's. */
export const buildSummary: NightStep = (night) => {
  const { save, notes } = night
  const jobs = LOOP_WORK_PLACES.flatMap((place): WorkLine[] => {
    const done = notes.finished.filter((f) => f.place === place)
    return done.length > 0 ? [{ kind: 'jobs', place, jobs: done.length, items: done.reduce((n, f) => n + f.items, 0) }] : []
  })
  // The night's best catch, after the jobs.
  const best: WorkLine[] = notes.best ? [{ kind: 'catch', id: notes.best.id, stars: notes.best.stars }] : []
  // Crops ready by block, then what withered, in block order.
  const byBlock = <T extends { block: BlockId }>(lines: readonly T[]): T[] => [...lines].sort((a, b) => BLOCK_IDS.indexOf(a.block) - BLOCK_IDS.indexOf(b.block))
  const crops = byBlock(notes.ripened).map((r): WorkLine => ({ kind: 'crops', block: r.block, plots: r.plots }))
  const withered = byBlock(notes.withered).map((w): WorkLine => ({ kind: 'withered', block: w.block, crop: w.crop, plots: w.plots }))
  const { idle } = daySetState(save)
  const plant = plotsToPlant(save)
  const nudges: Nudge[] = [...(idle.length > 0 ? [{ kind: 'idle' as const, umas: idle }] : []), ...(plant > 0 ? [{ kind: 'seeds' as const, plots: plant }] : [])]
  const work = [...jobs, ...best, ...crops, ...withered]
  const summary: MorningSummary = {
    day: save.calendar.day, bin: [...notes.sold], work, ranks: [...notes.ranks], hearts: heartLines(night),
    news: [...newsOf(save.calendar.day), ...goalNews(notes), ...notes.household, ...dormNews(night)], nudges,
  }
  // The bond hearts are listed: the day ahead notes its own.
  return { ...night, save: { ...save, today: { ...save.today, bonds: {} }, summary } }
}

/** One of the night's steps: its number, its function and what it does (the manual's table). */
export interface NightStepDef {
  readonly step: number
  readonly name: string
  readonly run: NightStep
  readonly what: string
}

/** The night's steps, in order. */
export const NIGHT_STEPS: readonly NightStepDef[] = [
  { step: 1, name: 'noteTonight', run: noteTonight, what: 'Before the bin, once anyone is married: tonight’s house is noted (its last night slept is today), your pick from Sleep at or else the house slept in least lately; the pick clears for tomorrow' },
  { step: 1, name: 'payTheBin', run: payTheBin, what: 'The bin pays: everything shipped today, at price × stars × demand' },
  { step: 2, name: 'growCrops', run: growCrops, what: 'Crops grow: 1 a night untended, the tender’s rate tended, ×1.1 side by side (her tender has a 3-heart partner tending another growing block), ×1.2 for a farmer in her element (Friendship 8); a farmer’s night chores add +0.25 growth each to the untended block with the most growing plots, else hers; plots that reach their days − 0.5 turn Ready' },
  { step: 3, name: 'tendAnimals', run: tendAnimals, what: 'Animals: nothing happens until the ranch is built' },
  { step: 4, name: 'moveJobs', run: moveJobs, what: 'Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read' },
  { step: 4, name: 'countHauls', run: countHauls, what: 'Tonight’s hauls count toward each forager’s and angler’s challenge; the best catch is noted' },
  { step: 4, name: 'nightExtras', run: nightExtras, what: 'Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies' },
  { step: 4, name: 'nightChores', run: nightChores, what: 'Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only' },
  { step: 5, name: 'resetWorkshops', run: resetWorkshops, what: 'Each workshop may be played again tomorrow' },
  { step: 6, name: 'tickRanks', run: tickRanks, what: 'Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met' },
  { step: 6, name: 'tickBonds', run: tickBonds, what: 'Bonds: +10 to each pair who worked one place today (the Fields’ tenders together), once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend' },
  { step: 6, name: 'payLine', run: payLine, what: 'Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night' },
  { step: 6, name: 'shareTheHouses', run: shareTheHouses, what: 'Shared houses: +10 bond a night to each pair of spouses with rooms in the same house' },
  { step: 6, name: 'levelAtNight', run: levelAtNight, what: 'Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, no event (S2 starts her every-2nd-morning item); never S3 or S5' },
  { step: 6, name: 'countWellFed', run: countWellFed, what: 'The well-fed days count down' },
  { step: 7, name: 'witherCrops', run: witherCrops, what: 'On a season’s last night, crops still growing that don’t grow in the next season wither; Ready crops wait' },
  { step: 7, name: 'turnCalendar', run: turnCalendar, what: 'The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception' },
  { step: 8, name: 'settleDorm', run: settleDorm, what: 'The Dorm’s level bought takes effect; swaps arrive, each Uma away coming home in the place of one leaving' },
  { step: 8, name: 'arriveUmas', run: arriveUmas, what: 'Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away; each of her ties whose other Uma is on the farm starts at its seed (strength 3 → 150, 2 → 50)' },
  { step: 8, name: 'checkGoals', run: checkGoals, what: 'The Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are met completes: its gold, plans and authored arrival' },
  { step: 8, name: 'openRingBench', run: openRingBench, what: 'The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and Ida Stone’s scene is due in the morning' },
  { step: 8, name: 'householdMilestones', run: householdMilestones, what: 'Household milestones: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 brings the furniture set, 20 the finale’s morning; household scenes are Ready from this morning' },
  { step: 9, name: 'serveTheReception', run: serveTheReception, what: 'A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; Marta’s cake one), never shortening a meal already running' },
  { step: 9, name: 'houseMorningStep', run: houseMorningStep, what: 'The house’s morning: each resident of the house slept in +30 (only hers on a birthday-alone night); her breakfast (S1) feeds everyone on the farm with no meal left; each resident at S2+ leaves one more morning item; a house with residents not slept in for 8 nights misses you' },
  { step: 9, name: 'moveInRooms', run: moveInRooms, what: 'Rooms: spouses home in the Dorm who wait for a room take one, in wedding order, by the same default as a wedding’s' },
  { step: 9, name: 'vowsMorning', run: vowsMorning, what: 'The Festival of Vows: on the finale’s day of the year, each later year, every spouse +50 and a festival night tonight' },
  { step: 9, name: 'heartsMorning', run: heartsMorning, what: 'Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse' },
  { step: 9, name: 'morningItems', run: morningItems, what: 'Morning items: each Uma on the farm leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+)' },
  { step: 9, name: 'drawInvitations', run: drawInvitations, what: 'Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, \'invite\', n)` among those home at Friendship 2+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14)' },
  { step: 9, name: 'buildSummary', run: buildSummary, what: 'The morning summary, from what changed; §4 Hearts lists the invitations, the Festival of Vows, the night’s levels, the house’s morning, rooms taken and a house that misses you, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning; §5 the household milestones' },
]

/** The night's steps over a save, unstamped: `endDay` without its stamp. Tests swap a step to stand in for a later one. */
export function runNight<S extends FarmSave>(save: S, context: NightContext, steps: readonly { run: NightStep }[] = NIGHT_STEPS): S {
  const start: Night = { before: save, save, context, notes: emptyNotes() }
  return steps.reduce((night, step) => step.run(night), start).save as S
}

/** Ends the day: the night's nine steps, then the player's one stamp, `now` in real time. */
export function endDay<S extends FarmSave>(save: S, context: NightContext, now: string): S {
  return touched(runNight(save, context), now)
}

