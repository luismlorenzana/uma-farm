// End the day (F18 decisions 2–4 and 13; core spec CS7, CS8, CS22, FC6, FC33): the night is one pure function, nine
// steps in a fixed order, one save write. A step whose packet hasn't landed is a no-op, and each packet fills its own:
//
//   1 the bin pays (F19) · 2 crops grow (F20) · 3 animals (M5) · 4 jobs move a day on (F18) and hauls count (F22) ·
//   5 workshops reset (M5) · 6 ranks (F21), bonds (M6) and well fed (F18) · 7 crops wither (F20) and the calendar turns
//   (F18) · 8 the Dorm and the Gate (F23), goals, the Diary and the Farm Rank (F24) · 9 the morning summary (F18)
//
// Every draw a step makes is `draw(uid, day, what, n)`, so the same save always gives the same morning (CS8). The player's
// change is stamped once, with real time, after the ninth step.
import { endsAt, finishedCount, isRefusal, settle, speedUp } from '@luismlorenzana/uma-work'
import { DAY_MS, festivalOn, isSeasonStart, dateOf, workNow } from '../farm/calendar'
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
import { BLOCK_IDS, type BlockId, type OutfitId, type SaveV3 } from '../save/v3'
import { farmEnvV3, loopWorld, nightEnvV3, WELL_FED_TICKETS, withLoopWorld } from '../work/loop-env'
import { checkGoalsNight, type GoalsTonight } from '../story/chapters'
import { daySetState } from './nudge'
import type { BinSale, MorningSummary, NewsLine, Nudge, RankLine, WorkLine } from './summary'

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
}

/** A night's notes before its first step. */
export const emptyNotes = (): NightNotes => ({
  sold: [], worked: [], finished: [], made: [], best: null, tended: [], ripened: [], withered: [], ranks: [], dorm: null, home: [], gate: null, left: [],
  goals: { chapter: null, paid: [], ranks: [] },
})

export interface Night {
  /** The save as the player left the day. */
  readonly before: SaveV3
  /** The save as the night has it so far. */
  readonly save: SaveV3
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
  const favourites = new Map(night.context.roster.map((o) => [o.outfitId, favouriteActivity(o)]))
  const worked: WorkedDay[] = [
    ...night.notes.worked.map((w) => ({ outfitId: w.outfitId, activity: PLACE_ACTIVITY[w.place] })),
    ...night.notes.tended.map((t) => ({ outfitId: t.outfitId, activity: 'farming' as const })),
  ]
  const { save, lines } = tickRankRules(night.save, worked, (outfitId, activity) => ({ talent: talentOf(outfitId, activity), favourite: favourites.get(outfitId) === activity }))
  return { ...night, save, notes: { ...night.notes, ranks: lines } }
}
/** Step 6, M6 (F33): bond points for pairs who shared a place. */
export const tickBonds: NightStep = same

/** Step 6: the well-fed days count down (CS22). Nothing sets them in M4 but tests; the staff meal is M5's (F8). */
export const countWellFed: NightStep = (night) => {
  const roster = { ...night.save.roster }
  for (const [id, uma] of Object.entries(roster)) if (uma.wellFed > 0) roster[id] = { ...uma, wellFed: uma.wellFed - 1 }
  return { ...night, save: { ...night.save, roster } }
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
 * day's once-a-day chats and gifts clear. On a season's last night `witherCrops` has already withered crops out of season.
 */
export const turnCalendar: NightStep = (night) => {
  const turned: SaveV3 = { ...night.save, calendar: { day: night.save.calendar.day + 1 }, today: { chats: [], gifts: [] } }
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
  const { save, arrived, left } = gateNight(night.save, night.context.roster.map((o) => o.outfitId))
  return { ...night, save, notes: { ...night.notes, gate: arrived, left } }
}

/** Step 8 (F24 decisions 1, 2, 4 and 5; CS38, CS39, CS42): the Diary pays the milestones and rows reached (a depth
 * milestone by tonight's hauls), the Farm Rank's points are recomputed, and the chapter completes the night its last goal
 * is met, paying 500g, the Mill's plans and a recruit from master data's release (`recruitFor`, `joinRoster`); the next
 * chapter opens. The closing scene waits for the morning. */
export const checkGoals: NightStep = (night) => {
  const { save, tonight } = checkGoalsNight(night.save, night.context.roster.map((o) => o.outfitId), talentsOf(night), night.notes.made)
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
  const joined = Object.keys(save.roster).filter((id) => !before.roster[id])
  return [
    ...(notes.dorm !== null ? [{ kind: 'dorm' as const, level: notes.dorm }] : []),
    ...(notes.home.length > 0 ? [{ kind: 'home' as const, umas: [...notes.home] }] : []),
    ...joined.map((outfitId): NewsLine => ({ kind: 'joined', outfitId, home: save.dorm.home.includes(outfitId) })),
    ...(notes.gate ? [{ kind: 'gate' as const, outfitId: notes.gate }] : []),
    ...notes.left.map((outfitId): NewsLine => ({ kind: 'left', outfitId })),
  ]
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
  const summary: MorningSummary = {
    day: save.calendar.day, bin: [...notes.sold], work: [...jobs, ...best, ...crops, ...withered], ranks: [...notes.ranks], bonds: [],
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

/** The night's steps over a save, unstamped: `endDay` without its stamp. Tests swap a step to stand in for a later one. */
export function runNight(save: SaveV3, context: NightContext, steps: readonly { run: NightStep }[] = NIGHT_STEPS): SaveV3 {
  const start: Night = { before: save, save, context, notes: emptyNotes() }
  return steps.reduce((night, step) => step.run(night), start).save
}

/** Ends the day: the night's nine steps, then the player's one stamp, `now` in real time (decision 13). */
export function endDay(save: SaveV3, context: NightContext, now: string): SaveV3 {
  return touched(runNight(save, context), now)
}
