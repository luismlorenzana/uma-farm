// End the day (F18 decisions 2–4 and 13; core spec CS7, CS8, CS22, FC6, FC33): the night is one pure function, nine
// steps in a fixed order, one save write. A step whose packet hasn't landed is a no-op, and each packet fills its own:
//
//   1 the bin pays (F19) · 2 crops grow (F20) · 3 animals (M5) · 4 jobs move a day on (F18) and hauls count (F22) ·
//   5 workshops reset (M5) · 6 ranks (F21), bonds (M6) and well fed (F18) · 7 crops wither (F20) and the calendar turns
//   (F18) · 8 the Dorm and the Gate (F23), goals, the Diary and the Farm Rank (F24) · 9 the morning summary (F18)
//
// Every draw a step makes is `draw(uid, day, what, n)`, so the same save always gives the same morning (CS8). The player's
// change is stamped once, with real time, after the ninth step.
//
// Save v4 (F46, the romance core, dark) runs the same steps with its own rules where the romance changes them, keyed off
// `save.version`: step 2 grows a tended block ×1.1 side by side (F52); step 4 pays side by side's extras after the hauls
// (`nightExtras`, F52); step 6 reads favourites from the story pack (RM6) and her friendship's factor (F47), ticks bonds
// (`tickBonds`, F52) and pays her line +10 (`payLine`, F47); step 7 clears v4's whole `today`; step 8 is `settleDorm` →
// `arriveUmas` (authored arrivals, in place of the Gate, their ties seeded) → `checkGoals` (the chapter's authored arrival,
// in place of `recruitFor`); step 9 notes praise earned overnight, birthdays and anniversaries today and tomorrow with the
// anniversary's item (`heartsMorning`, F47), draws the morning's invitations (`drawInvitations`, F50), and its §4 is
// Hearts, with the invitations, side by side and the bond hearts reached (F52).
import { endsAt, finishedCount, isRefusal, settle, speedUp } from '@luismlorenzana/uma-work'
import { DAY_MS, festivalOn, isSeasonStart, dateOf, workNow } from '../farm/calendar'
import { bondsTonight, extrasTonight, newBondHearts, type BondPay, type Extras } from '../farm/bonds'
import { settleDormNight } from '../farm/dorm'
import { favouriteActivity, PLACE_ACTIVITY, tickRankRules, type WorkedDay } from '../farm/rank-rules'
import { gateNight } from '../farm/visitors'
import { talentsD, type TalentOf } from '../farm/talents'
import { growFields, plotsToPlant, witherFields, type Ripened, type Withered } from '../fields/fields'
import { haulsTonight, loopKinds, type BestCatch, type MadeTonight } from '../gathering/kinds'
import type { FarmOutfit } from '../roster/roster'
import { payBin } from '../save/bin'
import { settleLoopWork } from '../save/loop-work'
import { LOOP_WORK_PLACES, type LoopKinds, type LoopPlaceId } from '../save/parse-v3'
import { touched } from '../save/save'
import { payLines } from '../romance/acts'
import { arrivalsTonight } from '../romance/arrivals'
import { drawInvites } from '../romance/evening'
import { heartDays, NO_BIRTHDAYS, type Birthdays } from '../romance/days'
import { praiseOvernight } from '../romance/praise'
import { BLOCK_IDS, type BlockId, type OutfitId } from '../save/v3'
import type { FarmSave, SaveV4 } from '../save/v4'
import { castOrder, favouriteOf, type StoryPack } from '../story/pack'
import { farmEnvV3, loopWorld, nightEnvV3, WELL_FED_TICKETS, withLoopWorld } from '../work/loop-env'
import { checkGoalsNight, type GoalsTonight } from '../story/chapters'
import { daySetState } from './nudge'
import type { BinSale, HeartLine, InviteLine, MorningSummary, MorningSummaryV4, NewsLine, NewsLineV4, Nudge, RankLine, WorkLine } from './summary'

/** What the night reads beyond the save (decision 2): master data, loaded before End the day runs, and the talents the
 * app reads from it once a release (F21). */
export interface NightContext {
  /** Master data's roster: every outfit on the release, with her line (her favourite, CS33). */
  readonly roster: readonly FarmOutfit[]
  /** The work kinds; tests pass their own. Left out, `loopKinds(talentOf)`: F22's kinds with these talents. */
  readonly kinds?: LoopKinds
  /** Each Uma's talent in an activity (F21, CS27): tending's growth (step 2), a queued job's plan when it starts at the
   * boundary (step 7, F22) and rank points (step 6). D for everyone when left out (tests). */
  readonly talentOf?: TalentOf
  /** The story pack (F46): a v4 night's favourites (RM6), her line's places (F47), authored arrivals (RM4) and anniversary
   * items, and the ties (F52: seeds, her closest friend). A v4 night without it arrives no one, reads no favourites, ticks no
   * bonds and pays no line; v3 never reads it. */
  readonly story?: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>
  /** Each cast Uma's birthday as a day of the farm's year (F47 decision 10): master data's character set through the cast
   * (`birthdaysOf`). None when left out. */
  readonly birthdays?: Birthdays
}

/** What the steps saw that a later one needs and the save alone can't show. Each packet adds its own notes. */
export interface NightNotes {
  /** Step 1: what the bin sold tonight, by good and star (F19). The summary's bin section. */
  readonly sold: readonly BinSale[]
  /** Step 4: who worked today, and where (a running job at the day's start). F21 pays rank points from it. */
  readonly worked: readonly { outfitId: OutfitId; place: LoopPlaceId }[]
  /** Step 4: each job that finished by the morning, with the items it made. */
  readonly finished: readonly { outfitId: OutfitId; place: LoopPlaceId; items: number }[]
  /** Step 4: every entry's items that finished tonight, a day's haul or a station's batch, with its request (F22). */
  readonly made: readonly MadeTonight[]
  /** Step 4: the night's best catch (F22), for the summary. */
  readonly best: BestCatch | null
  /** Step 2: each tender whose block had a growing plot, so she worked the night (F20 decision 2). F21 pays her
   * farming's rank points from it. */
  readonly tended: readonly { outfitId: OutfitId; block: BlockId }[]
  /** Step 2: plots that turned Ready tonight, by block (F20). */
  readonly ripened: readonly Ripened[]
  /** Step 7: crops that withered on a season's last night, by block and crop (F20). */
  readonly withered: readonly Withered[]
  /** Step 6: rank-ups, and points that filled tonight (F21). The summary's ranks section. */
  readonly ranks: readonly RankLine[]
  /** Step 8: the Dorm's level, when a level bought took effect tonight (F23). */
  readonly dorm: number | null
  /** Step 8: Umas a swap brought home (F23). */
  readonly home: readonly OutfitId[]
  /** Step 8: a visitor who came to the Gate this morning, and those who left (F23). */
  readonly gate: OutfitId | null
  readonly left: readonly OutfitId[]
  /** Step 8: the chapter completed tonight, the Diary's milestones and rows paid, and Farm Ranks reached (F24). */
  readonly goals: GoalsTonight
  /** Step 8 on v4: the cast Umas who arrived (F46), before the chapter's own. */
  readonly arrived: readonly { id: string; home: boolean }[]
  /** Step 6 on v4: who was paid +10 for a day at her line (F47). */
  readonly lines: readonly { id: string; points: number }[]
  /** Step 9 on v4: birthdays and anniversaries today and tomorrow (F47), §4's first stored lines. */
  readonly days: readonly HeartLine[]
  /** Step 4 on v4: side by side's extras, copies of each Uma's night's items into the Warehouse (F52 decision 7). */
  readonly extras: readonly Extras[]
  /** Step 6 on v4: bond points each pair earned for a shared place today (F52 decision 2). */
  readonly bonds: readonly BondPay[]
  /** Step 9 on v4: this morning's invitations (F50 decision 7), §4's second place. */
  readonly invites: readonly InviteLine[]
}

/** A night's notes before its first step. */
export const emptyNotes = (): NightNotes => ({
  sold: [], worked: [], finished: [], made: [], best: null, tended: [], ripened: [], withered: [], ranks: [], dorm: null, home: [], gate: null, left: [],
  goals: { chapter: null, paid: [], ranks: [] }, arrived: [], lines: [], days: [], extras: [], bonds: [], invites: [],
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
/** The kinds tonight plans with: the context's, or F22's with tonight's talents. */
const kindsOf = (night: Night): LoopKinds => night.context.kinds ?? loopKinds(talentsOf(night))
const same: NightStep = (night) => night

/** Step 1 (F19 decision 6): everything shipped today pays at price × stars × demand on the day it was shipped, before
 * the date turns. Gold, `farm.counts['gold-shipped']` and `diary.shipped` rise; the bin empties. */
export const payTheBin: NightStep = (night) => {
  const { save, sales } = payBin(night.save, night.save.calendar.day)
  return { ...night, save, notes: { ...night.notes, sold: sales } }
}
/** Step 2 (F20; CS12): each planted plot that isn't Ready grows by its block's rate (1 untended, the tender's rate when
 * tended); a plot whose growth reaches its days − 0.5 turns Ready. Tenders with a growing plot worked the night. */
export const growCrops: NightStep = (night) => {
  const talentOf = talentsOf(night)
  const { save, tended, ripened } = growFields(night.save, (outfitId) => talentOf(outfitId, 'farming'))
  return { ...night, save, notes: { ...night.notes, tended, ripened } }
}
/** Step 3, M5 (F27): animals fed, affection, products. */
export const tendAnimals: NightStep = same

/**
 * Step 4: jobs move a day on (decisions 3 and 4). First, each well-fed Uma's running job of a multi-day kind gains a
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
  const env = nightEnvV3(kinds)
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
  const byMorning = settle(loopWorld(save), morning, farmEnvV3(kinds)).state
  const finished = Object.values(byMorning.work).flatMap((row) => (row.slot ? row.entries : [])
    .filter((entry) => endsAt(entry) > evening && endsAt(entry) <= morning)
    .map((entry) => ({ outfitId: row.outfitId, place: row.slot!.building as LoopPlaceId, items: entry.outputs.length })))
  const made = Object.values(byMorning.work).flatMap((row) => (row.slot ? row.entries : []).flatMap((entry): MadeTonight[] => {
    const items = entry.outputs.slice(finishedCount(entry, evening), finishedCount(entry, morning)).flatMap((o) => ('item' in o ? [o.item] : []))
    return items.length > 0 ? [{ outfitId: row.outfitId, place: row.slot!.building as LoopPlaceId, request: entry.request, items }] : []
  }))
  return { ...night, save, notes: { ...night.notes, worked, finished, made } }
}

/** Step 4, after the jobs move (F22 decision 7; CS30): tonight's hauls count toward each forager's and angler's next
 * rank's challenge, items in an area and catches at a spot, before step 6 ranks her up; the night's best catch is noted
 * for the morning. What came home is counted when it's collected. */
export const countHauls: NightStep = (night) => {
  const { save, best } = haulsTonight(night.save, night.notes.made)
  return { ...night, save, notes: { ...night.notes, best } }
}

/** Step 4 on v4, after the hauls (F52 decision 7; CS17, CS44): **the night's extras.** Side by side: each Uma whose work
 * finished items tonight at a place where an Uma she has 3+ bond hearts with also worked today gets 10% of them again,
 * seeded copies straight into the Warehouse; the planned hauls (uma-work's) are untouched. F51 adds in her element and
 * the romance bonus here. v3 makes none. */
export const nightExtras: NightStep = (night) => {
  if (night.save.version !== 4) return night
  const { save, extras } = extrasTonight(night.save, night.notes.made, night.notes.worked)
  return { ...night, save, notes: { ...night.notes, extras } }
}

/** Step 5, M5 (F8): each workshop may be played again tomorrow. `workshops.played` holds the day, so nothing moves. */
export const resetWorkshops: NightStep = same
/**
 * Step 6 (F21 decisions 2 and 3; CS29, CS30): rank points for every Uma who worked today, one activity each: a running
 * job's place (`notes.worked`, `PLACE_ACTIVITY`) or a tended block with a growing plot (`notes.tended`, farming). 10
 * points × her talent's factor, ×1.2 in her favourite line, ×1.25 well fed, ×1.05 or ×1.10 for your hearts. Then every
 * Uma ranks up where her points and challenge are both met, one rank a night. Before the stored settle (step 7), so a
 * queued job starting at tonight's boundary is planned with tonight's ranks.
 */
export const tickRanks: NightStep = (night) => {
  const talentOf = talentsOf(night)
  const { story } = night.context
  const favourites = night.save.version === 4
    ? new Map(Object.keys(night.save.roster).map((id) => [id, story ? favouriteOf(story, id) : null]))
    : new Map(night.context.roster.map((o) => [o.outfitId, favouriteActivity(o)]))
  const worked: WorkedDay[] = [
    ...night.notes.worked.map((w) => ({ outfitId: w.outfitId, activity: PLACE_ACTIVITY[w.place] })),
    ...night.notes.tended.map((t) => ({ outfitId: t.outfitId, activity: 'farming' as const })),
  ]
  const { save, lines } = tickRankRules(night.save, worked, (outfitId, activity) => ({ talent: talentOf(outfitId, activity), favourite: favourites.get(outfitId) === activity }))
  return { ...night, save, notes: { ...night.notes, ranks: lines } }
}
/** Step 6: bond points for pairs who shared a place (CS44). On v4 (F52 decision 2; RM48): every pair among the Umas who
 * worked one place today (step 4's jobs; the Fields' tenders with a growing block, step 2) earns +10 once a night, ×1.5
 * sharing a favourite line of that place's, ×1.5 more when one is at Romance 4 and the other her closest friend. v3 (M4
 * has no bonds), or a v4 night without the pack, ticks none. */
export const tickBonds: NightStep = (night) => {
  if (night.save.version !== 4 || !night.context.story) return night
  const { save, paid } = bondsTonight(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, bonds: paid } }
}

/** Step 6 on v4 (F47 decision 8; RM6, RM23): +10 to each Uma who worked today at one of her line's places (a running job
 * there, or a farmer's tended block with a growing plot), once a night. v3, or a v4 night without the pack, pays none. */
export const payLine: NightStep = (night) => {
  if (night.save.version !== 4 || !night.context.story) return night
  const { save, paid } = payLines(night.save, night.context.story, night.notes.worked, night.notes.tended)
  return { ...night, save, notes: { ...night.notes, lines: paid } }
}

/** Step 6: the well-fed days count down (CS22). Nothing sets them in M4 but tests; the staff meal is M5's (F8). */
export const countWellFed: NightStep = (night) => ({ ...night, save: wellFedDown(night.save) })

function wellFedDown(save: FarmSave): FarmSave {
  const down = <U extends { wellFed: number }>(roster: Record<string, U>): Record<string, U> =>
    Object.fromEntries(Object.entries(roster).map(([id, uma]) => [id, uma.wellFed > 0 ? { ...uma, wellFed: uma.wellFed - 1 } : uma]))
  return save.version === 4 ? { ...save, roster: down(save.roster) } : { ...save, roster: down(save.roster) }
}

/** Step 7, before the date turns (F20; CS4, decision 6): on a season's last night, crops still growing that don't grow in
 * the next season wither. Ready crops wait. */
export const witherCrops: NightStep = (night) => {
  const { save, withered } = witherFields(night.save)
  return { ...night, save, notes: { ...night.notes, withered } }
}

/**
 * Step 7: the calendar turns. The date moves and uma-work's clock with it: the work settles at the new morning and is
 * stored (decision 3), so finished jobs turn Ready and queues start their next job, planned with tonight's ranks. The
 * day's once-a-day chats and gifts clear (on v4 the whole `today`: praise earned and paid, events played, evenings and
 * invitations too). On a season's last night `witherCrops` has already withered crops out of season.
 */
export const turnCalendar: NightStep = (night) => {
  const calendar = { day: night.save.calendar.day + 1 }
  const turned: FarmSave = night.save.version === 4
    ? { ...night.save, calendar, today: { chats: [], gifts: [], praise: [], praised: [], events: [], asked: [], evenings: [], invites: [], bonds: {} } }
    : { ...night.save, calendar, today: { chats: [], gifts: [] } }
  return { ...night, save: settleLoopWork(turned, kindsOf(night)) }
}

/** Step 8 (F23 decision 3; CS34, CS36): the Dorm's level bought takes effect, and swaps arrive: each Uma swapped out
 * goes away and the one swapped in comes home in her place. */
export const settleDorm: NightStep = (night) => {
  const { save, raised, home } = settleDormNight(night.save)
  return { ...night, save, notes: { ...night.notes, dorm: raised, home } }
}

/** Step 8 (F23 decision 5; CS35): a visitor who has waited 6 days leaves; then, on a morning divisible by 4, one arrives
 * at the Gate while a bed is free and none waits, drawn from master data's outfits not on the roster and not waiting. */
export const gateVisitors: NightStep = (night) => {
  if (night.save.version === 4) return night
  const { save, arrived, left } = gateNight(night.save, night.context.roster.map((o) => o.outfitId))
  return { ...night, save, notes: { ...night.notes, gate: arrived, left } }
}

/** Step 8 on v4 (F46 decision 8; RM4), after the Dorm: every cast Uma not on the roster whose authored arrival holds
 * joins, in the cast's order, home while a bed is free, else away. A v3 night never runs it. */
export const arriveUmas: NightStep = (night) => {
  if (night.save.version !== 4 || !night.context.story) return night
  const { save, arrived } = arrivalsTonight(night.save, night.context.story)
  return { ...night, save, notes: { ...night.notes, arrived } }
}

/** Step 8 (F24 decisions 1, 2, 4 and 5; CS38, CS39, CS42): the Diary pays the milestones and rows reached (a depth
 * milestone by tonight's hauls), the Farm Rank's points are recomputed, and the chapter completes the night its last goal
 * is met, paying 500g, the Mill's plans and a recruit from master data's release (`recruitFor`, `joinRoster`); the next
 * chapter opens. The closing scene waits for the morning. */
export const checkGoals: NightStep = (night) => {
  const { save, tonight } = checkGoalsNight(night.save, night.context.roster.map((o) => o.outfitId), talentsOf(night), night.notes.made, night.context.story)
  return { ...night, save, notes: { ...night.notes, goals: tonight } }
}

/** The morning's news (CS5 §5): the season's first day, a festival today or tomorrow. */
function newsOf(day: number): NewsLine[] {
  const news: NewsLine[] = []
  if (isSeasonStart(day)) news.push({ kind: 'season', season: dateOf(day).season })
  const today = festivalOn(day)
  if (today) news.push({ kind: 'festival', festival: today.id, when: 'today' })
  const tomorrow = festivalOn(day + 1)
  if (tomorrow) news.push({ kind: 'festival', festival: tomorrow.id, when: 'tomorrow' })
  return news
}

/** The goals' news (F24): the chapter completed, the Farm Ranks reached, then the Diary's milestones and rows paid. */
function goalNews(notes: NightNotes): NewsLine[] {
  const { chapter, ranks, paid } = notes.goals
  return [
    ...(chapter !== null ? [{ kind: 'chapter' as const, chapter }] : []),
    ...ranks.map((rank): NewsLine => ({ kind: 'farm-rank', rank })),
    ...paid.map((id): NewsLine => ({ kind: 'milestone', id })),
  ]
}

/** The roster's news (F23): the Dorm's new level, Umas home from a swap, recruits who joined tonight (anyone on the
 * roster who wasn't last evening), a visitor at the Gate and those who left. */
function rosterNews(night: Night): NewsLine[] {
  const { save, notes, before } = night
  if (save.version === 4) return dormNews(night)
  const joined = Object.keys(save.roster).filter((id) => !before.roster[id])
  return [
    ...(notes.dorm !== null ? [{ kind: 'dorm' as const, level: notes.dorm }] : []),
    ...(notes.home.length > 0 ? [{ kind: 'home' as const, umas: [...notes.home] }] : []),
    ...joined.map((outfitId): NewsLine => ({ kind: 'joined', outfitId, home: save.dorm.home.includes(outfitId) })),
    ...(notes.gate ? [{ kind: 'gate' as const, outfitId: notes.gate }] : []),
    ...notes.left.map((outfitId): NewsLine => ({ kind: 'left', outfitId })),
  ]
}

/** The Dorm's news on v4: its new level, and Umas home from a swap (arrivals are §4's). */
function dormNews({ notes }: Night): NewsLineV4[] {
  return [...(notes.dorm !== null ? [{ kind: 'dorm' as const, level: notes.dorm }] : []), ...(notes.home.length > 0 ? [{ kind: 'home' as const, umas: [...notes.home] }] : [])]
}

/** §4 Hearts on v4: this morning's invitations (F50), birthdays and anniversaries today and tomorrow (F47, `heartsMorning`), then everyone who joined tonight
 * (F46 decision 15), the arrivals at step 8 in the cast's order and then the chapter's, home or away (her arrival scene
 * waits for the farm to open); then side by side's extras and the bond hearts reached since the last morning (F52). */
function heartLines(night: Night): HeartLine[] {
  const { save, before, context } = night
  const order = context.story ? castOrder(context.story) : []
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const extras = night.notes.extras.reduce((n, e) => n + e.items.length, 0)
  return [
    ...night.notes.invites,
    ...night.notes.days,
    ...Object.keys(save.roster).filter((id) => !before.roster[id]).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
      .map((id): HeartLine => ({ kind: 'arrived', id, home: save.dorm.home.includes(id) })),
    ...(extras > 0 ? [{ kind: 'side' as const, items: extras }] : []),
    ...(save.version === 4 && before.version === 4 ? newBondHearts(before, save, order) : []),
  ]
}

/** Step 9 on v4, before the summary (F47 decisions 6, 10, 11 and 14), the date already turned: praise earned overnight
 * (her work made a ★3+ item, or she ranked up), and birthdays and anniversaries today and tomorrow, an anniversary today
 * leaving its ★5 item of her line in the Warehouse. */
export const heartsMorning: NightStep = (night) => {
  if (night.save.version !== 4) return night
  const rankedUp = night.notes.ranks.flatMap((line) => (line.kind === 'rank-up' ? [line.outfitId] : []))
  const praised = praiseOvernight(night.save, night.notes.made, rankedUp)
  if (!night.context.story) return { ...night, save: praised }
  const { save, lines } = heartDays(praised, night.context.story, night.context.birthdays ?? NO_BIRTHDAYS)
  return { ...night, save, notes: { ...night.notes, days: lines } }
}

/** Step 9 on v4, after `heartsMorning` (F50 decision 7; RM20): this morning's invitations, one (two from 10 married),
 * drawn by weight among the Umas home at Friendship 2+ whose favourite kind is open to them, into `today.invites`
 * unanswered and §4's second place. A night without the pack draws none. */
export const drawInvitations: NightStep = (night) => {
  if (night.save.version !== 4 || !night.context.story) return night
  const save = drawInvites(night.save, night.context.story)
  const invites = save.today.invites.map((i): InviteLine => ({ kind: 'invite', id: i.id, evening: i.kind }))
  return { ...night, save, notes: { ...night.notes, invites } }
}

/** Step 9: the morning summary, built from what changed (CS5, decision 11). It replaces last night's. */
export const buildSummary: NightStep = (night) => {
  const { save, notes } = night
  const jobs = LOOP_WORK_PLACES.flatMap((place): WorkLine[] => {
    const done = notes.finished.filter((f) => f.place === place)
    return done.length > 0 ? [{ kind: 'jobs', place, jobs: done.length, items: done.reduce((n, f) => n + f.items, 0) }] : []
  })
  // F22: the night's best catch, after the jobs.
  const best: WorkLine[] = notes.best ? [{ kind: 'catch', id: notes.best.id, stars: notes.best.stars }] : []
  // F20: crops ready by block, then what withered, in block order.
  const byBlock = <T extends { block: BlockId }>(lines: readonly T[]): T[] => [...lines].sort((a, b) => BLOCK_IDS.indexOf(a.block) - BLOCK_IDS.indexOf(b.block))
  const crops = byBlock(notes.ripened).map((r): WorkLine => ({ kind: 'crops', block: r.block, plots: r.plots }))
  const withered = byBlock(notes.withered).map((w): WorkLine => ({ kind: 'withered', block: w.block, crop: w.crop, plots: w.plots }))
  const { idle } = daySetState(save)
  const plant = plotsToPlant(save)
  const nudges: Nudge[] = [...(idle.length > 0 ? [{ kind: 'idle' as const, umas: idle }] : []), ...(plant > 0 ? [{ kind: 'seeds' as const, plots: plant }] : [])]
  const work = [...jobs, ...best, ...crops, ...withered]
  if (save.version === 4) {
    const summary: MorningSummaryV4 = {
      day: save.calendar.day, bin: [...notes.sold], work, ranks: [...notes.ranks], hearts: heartLines(night),
      news: [...newsOf(save.calendar.day), ...goalNews(notes), ...dormNews(night)] as NewsLineV4[], nudges,
    }
    // The bond hearts are listed: the day ahead notes its own (F52 decision 9).
    return { ...night, save: { ...save, today: { ...save.today, bonds: {} }, summary } }
  }
  const summary: MorningSummary = {
    day: save.calendar.day, bin: [...notes.sold], work, ranks: [...notes.ranks], bonds: [],
    news: [...newsOf(save.calendar.day), ...goalNews(notes), ...rosterNews(night)], nudges,
  }
  return { ...night, save: { ...save, summary } }
}

/** One of the night's steps: CS7's number, its function, what it does and the packet that fills it (the manual's table). */
export interface NightStepDef {
  readonly step: number
  readonly name: string
  readonly run: NightStep
  readonly what: string
  readonly by: string
}

/** The night's steps in CS7's order. */
export const NIGHT_STEPS: readonly NightStepDef[] = [
  { step: 1, name: 'payTheBin', run: payTheBin, what: 'The bin pays: everything shipped today, at price × stars × demand', by: 'F19' },
  { step: 2, name: 'growCrops', run: growCrops, what: 'Crops grow: 1 a night untended, the tender’s rate tended; plots that reach their days − 0.5 turn Ready', by: 'F20' },
  { step: 3, name: 'tendAnimals', run: tendAnimals, what: 'Animals are fed, affection moves, products are laid', by: 'M5 (F27)' },
  { step: 4, name: 'moveJobs', run: moveJobs, what: 'Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read', by: 'F18' },
  { step: 4, name: 'countHauls', run: countHauls, what: 'Tonight’s hauls count toward each forager’s and angler’s challenge; the best catch is noted', by: 'F22' },
  { step: 5, name: 'resetWorkshops', run: resetWorkshops, what: 'Each workshop may be played again tomorrow', by: 'M5 (F8)' },
  { step: 6, name: 'tickRanks', run: tickRanks, what: 'Rank points for every Uma who worked, one activity each; rank-ups where points and the challenge are met', by: 'F21' },
  { step: 6, name: 'tickBonds', run: tickBonds, what: 'Bond points for pairs who shared a place', by: 'M6 (F33)' },
  { step: 6, name: 'countWellFed', run: countWellFed, what: 'The well-fed days count down', by: 'F18' },
  { step: 7, name: 'witherCrops', run: witherCrops, what: 'On a season’s last night, crops still growing that don’t grow in the next season wither; Ready crops wait', by: 'F20' },
  { step: 7, name: 'turnCalendar', run: turnCalendar, what: 'The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the day’s chats and gifts clear', by: 'F18' },
  { step: 8, name: 'settleDorm', run: settleDorm, what: 'The Dorm’s level bought takes effect; swaps arrive, each Uma away coming home in the place of one leaving', by: 'F23' },
  { step: 8, name: 'gateVisitors', run: gateVisitors, what: 'A visitor who has waited 6 days leaves; every 4th morning one comes to the Gate while a bed is free and none waits', by: 'F23' },
  { step: 8, name: 'checkGoals', run: checkGoals, what: 'The Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are met completes: its gold, plans and recruit', by: 'F24' },
  { step: 9, name: 'buildSummary', run: buildSummary, what: 'The morning summary, from what changed', by: 'F18' },
]

/** What v4 changes in v3's steps (F46, F47, F52): a step replaced or reworded, and the steps added after one. */
const V4_STEPS: Readonly<Record<string, { replace?: Partial<NightStepDef>; after?: readonly NightStepDef[]; before?: readonly NightStepDef[] }>> = {
  growCrops: {
    replace: { what: 'Crops grow: 1 a night untended, the tender’s rate tended, ×1.1 side by side (her tender has a 3-heart partner tending another growing block); plots that reach their days − 0.5 turn Ready', by: 'F20, F52' },
  },
  countHauls: {
    after: [{ step: 4, name: 'nightExtras', run: nightExtras, what: 'Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again, seeded copies straight into the Warehouse', by: 'F52' }],
  },
  tickRanks: {
    replace: { what: 'Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10; rank-ups where points and the challenge are met', by: 'F21, F47' },
  },
  tickBonds: {
    replace: { what: 'Bonds: +10 to each pair who worked one place today (the Fields’ tenders together), once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend', by: 'F52' },
    after: [{ step: 6, name: 'payLine', run: payLine, what: 'Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night', by: 'F47' }],
  },
  turnCalendar: {
    replace: { what: 'The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, Ask her, evenings and invitations', by: 'F18, F47, F49' },
  },
  gateVisitors: {
    replace: { name: 'arriveUmas', run: arriveUmas, what: 'Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away; each of her ties whose other Uma is on the farm starts at its seed (strength 3 → 150, 2 → 50)', by: 'F46, F52' },
  },
  buildSummary: {
    before: [
      { step: 9, name: 'heartsMorning', run: heartsMorning, what: 'Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse', by: 'F47' },
      { step: 9, name: 'drawInvitations', run: drawInvitations, what: 'Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, \'invite\', n)` among those home at Friendship 2+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14)', by: 'F50' },
    ],
    replace: { what: 'The morning summary, from what changed; §4 Hearts lists the invitations, side by side’s extras and each pair’s bond hearts reached since the last morning', by: 'F18, F50, F52' },
  },
}

/** Save v4's steps (F46 decision 8; F47; F52; F50): v3's, step 2 side by side, step 4's extras, the Gate's step replaced by
 * authored arrivals with their ties' seeds, step 6 with her ladder's factor, bonds and her line's +10, step 7 clearing the
 * whole of `today`, and step 9 with praise, birthdays, anniversaries, the invitations and the bond hearts. */
export const NIGHT_STEPS_V4: readonly NightStepDef[] = NIGHT_STEPS.flatMap((step) => {
  const change = V4_STEPS[step.name]
  return [...(change?.before ?? []), { ...step, ...change?.replace }, ...(change?.after ?? [])]
})

/** The steps a save's night runs, by its version. */
export const nightStepsOf = (save: { version: number }): readonly NightStepDef[] => (save.version === 4 ? NIGHT_STEPS_V4 : NIGHT_STEPS)

/** The night's steps over a save, unstamped: `endDay` without its stamp. Tests swap a step to stand in for a later one. */
export function runNight<S extends FarmSave>(save: S, context: NightContext, steps: readonly { run: NightStep }[] = nightStepsOf(save)): S {
  const start: Night = { before: save, save, context, notes: emptyNotes() }
  return steps.reduce((night, step) => step.run(night), start).save as S
}

/** Ends the day: the night's nine steps, then the player's one stamp, `now` in real time (decision 13). */
export function endDay<S extends FarmSave>(save: S, context: NightContext, now: string): S {
  return touched(runNight(save, context), now)
}

/** A v4 night's typed entry point, for the romance build and its tests. */
export const endDayV4 = (save: SaveV4, context: NightContext, now: string): SaveV4 => endDay(save, context, now)
