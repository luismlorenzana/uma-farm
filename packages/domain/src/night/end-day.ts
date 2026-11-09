// End the day (F18 decisions 2–4 and 13; core spec CS7, CS8, CS22, FC6, FC33): the night is one pure function, nine
// steps in a fixed order, one save write. A step whose packet hasn't landed is a no-op, and each packet fills its own:
//
//   1 the bin pays (F19) · 2 crops grow (F20) · 3 animals (M5) · 4 jobs move a day on (F18) · 5 workshops reset (M5) ·
//   6 ranks (F21), bonds (M6) and well fed (F18) · 7 the calendar turns (F18; withering F20) · 8 goals (F23, F24) ·
//   9 the morning summary (F18)
//
// Every draw a step makes is `draw(uid, day, what, n)`, so the same save always gives the same morning (CS8). The player's
// change is stamped once, with real time, after the ninth step.
import { endsAt, isRefusal, settle, speedUp } from '@luismlorenzana/uma-work'
import { DAY_MS, festivalOn, isSeasonStart, dateOf, workNow } from '../farm/calendar'
import type { FarmOutfit } from '../roster/roster'
import { payBin } from '../save/bin'
import { settleLoopWork } from '../save/loop-work'
import { LOOP_KINDS, LOOP_WORK_PLACES, type LoopKinds, type LoopPlaceId } from '../save/parse-v3'
import { touched } from '../save/save'
import type { OutfitId, SaveV3 } from '../save/v3'
import { farmEnvV3, loopWorld, nightEnvV3, WELL_FED_TICKETS, withLoopWorld } from '../work/loop-env'
import { daySetState } from './nudge'
import type { BinSale, JobsDone, MorningSummary, NewsLine } from './summary'

/** What the night reads beyond the save (decision 2): master data, loaded before End the day runs. F21 adds talents. */
export interface NightContext {
  /** Master data's roster: every outfit on the release, with her line. */
  readonly roster: readonly FarmOutfit[]
  /** The work kinds (`LOOP_KINDS`); tests pass their own. */
  readonly kinds?: LoopKinds
}

/** What the steps saw that a later one needs and the save alone can't show. Each packet adds its own notes. */
export interface NightNotes {
  /** Step 1: what the bin sold tonight, by good and star (F19). The summary's bin section. */
  readonly sold: readonly BinSale[]
  /** Step 4: who worked today, and where (a running job at the day's start). F21 pays rank points from it. */
  readonly worked: readonly { outfitId: OutfitId; place: LoopPlaceId }[]
  /** Step 4: each job that finished by the morning, with the items it made. */
  readonly finished: readonly { outfitId: OutfitId; place: LoopPlaceId; items: number }[]
}

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

const kindsOf = (night: Night): LoopKinds => night.context.kinds ?? LOOP_KINDS
const same: NightStep = (night) => night

/** Step 1 (F19 decision 6): everything shipped today pays at price × stars × demand on the day it was shipped, before
 * the date turns. Gold, `farm.counts['gold-shipped']` and `diary.shipped` rise; the bin empties. */
export const payTheBin: NightStep = (night) => {
  const { save, sales } = payBin(night.save, night.save.calendar.day)
  return { ...night, save, notes: { ...night.notes, sold: sales } }
}
/** Step 2, F20: each planted plot grows; plots that reach their days turn Ready. */
export const growCrops: NightStep = same
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
  return { ...night, save, notes: { ...night.notes, worked, finished } }
}

/** Step 5, M5 (F8): each workshop may be played again tomorrow. `workshops.played` holds the day, so nothing moves. */
export const resetWorkshops: NightStep = same
/** Step 6, F21: rank points for every Uma who worked (`notes.worked`), challenges, rank-ups. */
export const tickRanks: NightStep = same
/** Step 6, M6 (F33): bond points for pairs who shared a place. */
export const tickBonds: NightStep = same

/** Step 6: the well-fed days count down (CS22). Nothing sets them in M4 but tests; the staff meal is M5's (F8). */
export const countWellFed: NightStep = (night) => {
  const roster = { ...night.save.roster }
  for (const [id, uma] of Object.entries(roster)) if (uma.wellFed > 0) roster[id] = { ...uma, wellFed: uma.wellFed - 1 }
  return { ...night, save: { ...night.save, roster } }
}

/**
 * Step 7: the calendar turns. The date moves and uma-work's clock with it: the work settles at the new morning and is
 * stored (decision 3), so finished jobs turn Ready and queues start their next job, planned with tonight's ranks. The
 * day's once-a-day chats and gifts clear. On a season's last night F20 withers crops out of season here.
 */
export const turnCalendar: NightStep = (night) => {
  const turned: SaveV3 = { ...night.save, calendar: { day: night.save.calendar.day + 1 }, today: { chats: [], gifts: [] } }
  return { ...night, save: settleLoopWork(turned, kindsOf(night)) }
}

/** Step 8, F23 and F24: visitors come and go, chapter goals, Diary milestones, the Farm Rank. */
export const checkGoals: NightStep = same

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

/** Step 9: the morning summary, built from what changed (CS5, decision 11). It replaces last night's. */
export const buildSummary: NightStep = (night) => {
  const { save, notes } = night
  const work = LOOP_WORK_PLACES.flatMap((place): JobsDone[] => {
    const jobs = notes.finished.filter((f) => f.place === place)
    return jobs.length > 0 ? [{ kind: 'jobs', place, jobs: jobs.length, items: jobs.reduce((n, f) => n + f.items, 0) }] : []
  })
  const { idle } = daySetState(save, kindsOf(night))
  const summary: MorningSummary = {
    day: save.calendar.day, bin: [...notes.sold], work, ranks: [], bonds: [], news: newsOf(save.calendar.day), nudges: idle.length > 0 ? [{ kind: 'idle', umas: idle }] : [],
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
  { step: 2, name: 'growCrops', run: growCrops, what: 'Crops grow; plots that reach their days turn Ready', by: 'F20' },
  { step: 3, name: 'tendAnimals', run: tendAnimals, what: 'Animals are fed, affection moves, products are laid', by: 'M5 (F27)' },
  { step: 4, name: 'moveJobs', run: moveJobs, what: 'Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read', by: 'F18' },
  { step: 5, name: 'resetWorkshops', run: resetWorkshops, what: 'Each workshop may be played again tomorrow', by: 'M5 (F8)' },
  { step: 6, name: 'tickRanks', run: tickRanks, what: 'Rank points for every Uma who worked; rank-ups', by: 'F21' },
  { step: 6, name: 'tickBonds', run: tickBonds, what: 'Bond points for pairs who shared a place', by: 'M6 (F33)' },
  { step: 6, name: 'countWellFed', run: countWellFed, what: 'The well-fed days count down', by: 'F18' },
  { step: 7, name: 'turnCalendar', run: turnCalendar, what: 'The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the day’s chats and gifts clear; on a season’s last night, crops out of season wither (F20)', by: 'F18' },
  { step: 8, name: 'checkGoals', run: checkGoals, what: 'Visitors come and go; chapter goals, Diary milestones and the Farm Rank', by: 'F23, F24' },
  { step: 9, name: 'buildSummary', run: buildSummary, what: 'The morning summary, from what changed', by: 'F18' },
]

/** The night's steps over a save, unstamped: `endDay` without its stamp. Tests swap a step to stand in for a later one. */
export function runNight(save: SaveV3, context: NightContext, steps: readonly { run: NightStep }[] = NIGHT_STEPS): SaveV3 {
  const start: Night = { before: save, save, context, notes: { sold: [], worked: [], finished: [] } }
  return steps.reduce((night, step) => step.run(night), start).save
}

/** Ends the day: the night's nine steps, then the player's one stamp, `now` in real time (decision 13). */
export function endDay(save: SaveV3, context: NightContext, now: string): SaveV3 {
  return touched(runNight(save, context), now)
}
