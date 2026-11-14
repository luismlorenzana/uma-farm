// Farmhands and aptitudes. A friend you invite to work (`roster[id].farmhand`) is a farmhand: after her part-time job in
// town (the story's `job`, else the game's default), she gives the farm a few actions a day on the tasks you set on the
// work board. She works them overnight, before the crops grow, so the morning reports her work.
//
//   her day      3 actions; +1 once she's settled in (a season after you invited her); +2 once she's your spouse;
//                +1 when she's well fed this morning (a household meal the day before, a reception, a spouse's
//                breakfast); all at the farm's pace (`atPace`: half, from the second short night of upkeep, never below 1)
//   the board    her tasks, in your order: the field's over a list of tiles (harvest, water, plant, clear and till), a
//                station's load, a forest area's forage or chop, a fishing spot's catch. Any Uma does any task, and each
//                repeats daily until you change it. A task on the board is hers: the farmer's own ten stay free
//   her night    the field's tasks and the loads first, in your order, each until it's done or her actions run out; then
//                her gathering shares what's left, a turn each
//   aptitude     a level 1–10 for each task: her talent's head start, a point for every 20 rank points in its activity,
//                and a point for each action she spends on it. A level above 1 lifts her stars (+0.1) and her yield
//                (+5%), and tricks open: two tiles an action, a row watered in one, a bigger haul, two casts, a bigger
//                load
//
// Her work counts as an Uma's work does: rank points in the day's activity (where she spent the most actions), the
// challenges, bonds at the same place, her line, side by side's and the perks' extras, praise. Her reach is the farm's
// (the Farm Rank's areas and spots). Pure; never stamps. Loaded with the night and the Book.
import { DAYS_PER_SEASON, dateOf } from './calendar'
import { draw } from './draw'
import { atPace, halfPace } from './economy'
import { farmhands } from '../romance/loop'
import { countChallenge, rankBenefits, type ChallengeEvent } from './rank-rules'
import type { Activity } from './ranks'
import { talentYield, type TalentOf, type TalentStep } from './talents'
import { cropLevelOf, drawnCount, reapTile, seedsBackChance, seedsInSeason, sowTile, stagesOf, tillGround, clearGround, wetTile, type Reaper } from '../fields/fields'
import { growsIn } from '../fields/crops'
import { chopAt, CHOP_LOGS, fishAt, FORAGE_HAUL, forageAt, reachLock } from '../gathering/hauls'
import type { FishingSpotId, ForestAreaId } from '../gathering/ids'
import { gatherQuality, GATHER_TOOL, HOME_COUNT, keepsakeAt, sizeSkill, stationBuilt, type GatherPlace, type MadeTonight, type WorkPlace } from '../gathering/kinds'
import { LOAD_SIZE, loadAt, stationOptions } from '../gathering/stations'
import { TOOL_YIELD, WELL_FED_YIELD } from '../gathering/tables'
import { isCropId, type CropId } from '../goods/ids'
import type { AptitudeUp, FarmhandLine } from '../night/summary'
import type { PerkPack } from '../romance/perk-terms'
import { SaveRuleError } from '../save/rules'
import {
  APTITUDE_IDS, FIELD_COLUMNS, FIELD_TILES, isOvergrown, MAX_TASKS, TILE_TASKS,
  type AptitudeId, type FarmSave, type FarmTask, type RosterUma, type TaskKind, type TileTaskKind,
} from '../save/v4'
import type { StoryPack } from '../story/pack'
import { favouriteSpotOf, herJobOf } from '../story/placeholders'
import type { LoopPlaceId } from '../save/parse-v4'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

// --- Her day ---------------------------------------------------------------------------------------------------

/** A farmhand's actions a day, to start. */
export const HAND_ACTIONS = 3
/** Settled in: a season after you invited her, one more. */
export const SETTLED_AFTER = DAYS_PER_SEASON
export const SETTLED_ACTIONS = 1
/** Once she's your spouse, two more. */
export const SPOUSE_ACTIONS = 2
/** Well fed this morning, one more. */
export const FED_ACTIONS = 1

/** A farmhand's actions today, by why: her three, settled in, married, well fed this morning; then the farm's pace. */
export interface HandDay {
  base: number
  settled: number
  spouse: number
  fed: number
  /** The farm at half pace (from the second short night of upkeep, until it's paid). */
  half: boolean
  /** All of them, at the farm's pace. */
  actions: number
}

/** Her actions today, or null for one who isn't a farmhand. */
export function handDay(save: Pick<FarmSave, 'roster' | 'love' | 'calendar' | 'today' | 'farm'>, id: string): HandDay | null {
  const hired = save.roster[id]?.farmhand
  if (hired === undefined) return null
  const settled = save.calendar.day - hired >= SETTLED_AFTER ? SETTLED_ACTIONS : 0
  const spouse = save.love[id]?.stage === 'spouse' ? SPOUSE_ACTIONS : 0
  const fed = save.today.fed?.includes(id) ? FED_ACTIONS : 0
  const all = HAND_ACTIONS + settled + spouse + fed
  return { base: HAND_ACTIONS, settled, spouse, fed, half: halfPace(save), actions: atPace(all, save) }
}

/** The farmhands in the order they work: by the day you invited them, then by id. */
export function handsInOrder(save: Pick<FarmSave, 'roster'>): string[] {
  return farmhands(save).sort((a, b) => save.roster[a]!.farmhand! - save.roster[b]!.farmhand! || Number(a) - Number(b))
}

/** Her part-time job: the story's (`what` its words, `at` its location), else the game's default, a job in town near her
 * favourite spot (`at` that spot, or null). The words are the app's: "Works at the Bakery", "A job in town". */
export interface HandJob {
  own: boolean
  what: string | null
  at: string | null
}
export function handJob(pack: Pick<StoryPack, 'cast'>, id: string): HandJob {
  const job = herJobOf(pack, id)
  return job ? { own: true, what: job.what ?? null, at: job.at } : { own: false, what: null, at: favouriteSpotOf(pack, id) }
}

// --- The board -----------------------------------------------------------------------------------------------

/** Each task's name on the board. */
export const TASK_NAMES: Readonly<Record<TaskKind, string>> = {
  harvest: 'Harvest', water: 'Water', plant: 'Plant', till: 'Clear and till', load: 'Load', forage: 'Forage', chop: 'Chop', fish: 'Fish',
}
/** The tasks that run until her actions do: her gathering, a turn each once the field's and the loads are done. */
export const OPEN_TASKS: readonly TaskKind[] = ['forage', 'chop', 'fish']
export const isTileTask = (task: FarmTask): task is Extract<FarmTask, { tiles: number[] }> => (TILE_TASKS as readonly string[]).includes(task.kind)

/** The aptitude a task practises: its own, a load its station's. */
export const taskAptitude = (task: FarmTask): AptitudeId => (task.kind === 'load' ? task.station : task.kind)

/** Why a task can't go on her board, or null: the field's tiles are on the field, a load's station is built, an area or a
 * spot is within the farm's reach. */
export function taskLock(save: Pick<FarmSave, 'buildings' | 'farm'>, task: FarmTask): string | null {
  if (isTileTask(task)) {
    if (task.tiles.length === 0) return 'Choose its tiles.'
    if (task.tiles.some((i) => !Number.isInteger(i) || i < 0 || i >= FIELD_TILES) || new Set(task.tiles).size !== task.tiles.length) return 'Those aren’t the field’s tiles.'
    if (task.kind === 'plant' && task.crop !== undefined && !isCropId(task.crop)) return 'That isn’t a crop.'
    return null
  }
  if (task.kind === 'load') return stationBuilt(save, task.station) ? null : 'Build it first.'
  return task.kind === 'fish' ? reachLock(save, 'fishery', task.spot) : reachLock(save, 'forest', task.area)
}

/** Sets a farmhand's tasks on the work board, in your order: free, a player's change. Refused for one who isn't a
 * farmhand (`locked`), past six tasks (`bad-count`) and for a task that can't go on it (`locked`). */
export function setTasks<S extends FarmSave>(save: S, id: string, tasks: readonly FarmTask[]): S {
  const uma = save.roster[id]
  if (!uma || uma.farmhand === undefined) throw new SaveRuleError('locked', 'Invite her to work first.')
  if (tasks.length > MAX_TASKS) throw new SaveRuleError('bad-count', `${MAX_TASKS} tasks at most.`)
  for (const task of tasks) {
    const lock = taskLock(save, task)
    if (lock) throw new SaveRuleError('locked', lock)
  }
  const clean = tasks.map((t): FarmTask => (isTileTask(t) ? { ...t, tiles: [...t.tiles].sort((a, b) => a - b) } : { ...t }))
  return { ...save, roster: { ...save.roster, [id]: { ...uma, tasks: clean } } }
}

// --- Aptitude ------------------------------------------------------------------------------------------------

/** Each aptitude's name, the activity it reads her talent and rank points in, and where she works it. */
export const APTITUDE_NAMES: Readonly<Record<AptitudeId, string>> = {
  harvest: 'Harvesting', water: 'Watering', plant: 'Planting', till: 'Clearing', forage: 'Foraging', chop: 'Chopping', fish: 'Fishing',
  mill: 'Milling', sawmill: 'Sawing', smokehouse: 'Smoking',
}
export const APTITUDE_ACTIVITY: Readonly<Record<AptitudeId, Activity>> = {
  harvest: 'farming', water: 'farming', plant: 'farming', till: 'farming', forage: 'foraging', chop: 'foraging', fish: 'fishing',
  mill: 'farming', sawmill: 'foraging', smokehouse: 'fishing',
}
export const APTITUDE_PLACE: Readonly<Record<AptitudeId, WorkPlace>> = {
  harvest: 'fields', water: 'fields', plant: 'fields', till: 'fields', forage: 'forest', chop: 'forest', fish: 'fishery',
  mill: 'mill', sawmill: 'sawmill', smokehouse: 'smokehouse',
}

/** The top level. */
export const MAX_APTITUDE = 10
/** The points each level starts at: level L → L + 1 takes 10 × L, so 2 at 10, 3 at 30, 4 at 60, 6 at 150, 10 at 450. */
export const APTITUDE_POINTS: readonly number[] = Array.from({ length: MAX_APTITUDE }, (_, i) => 5 * (i + 1) * i)
/** Her head start by her talent in the aptitude's activity, G … S: level 1 at G to E, 2 at D and C, 3 at B and A, 4 at S. */
export const TALENT_START: readonly number[] = [0, 0, 5, 10, 20, 30, 45, 60]
/** Her rank points in the aptitude's activity add a point for every 20. */
export const RANK_POINTS_A_POINT = 20
/** A level above 1: +0.1 quality and +5% yield. */
export const APTITUDE_QUALITY = 0.1
export const APTITUDE_YIELD = 0.05

/** An aptitude's level, 1–10, from its points. */
export function aptitudeLevelOf(points: number): number {
  let level = 1
  while (level < MAX_APTITUDE && points >= APTITUDE_POINTS[level]!) level++
  return level
}
export const aptitudeQuality = (level: number): number => round6(APTITUDE_QUALITY * (level - 1))
export const aptitudeYield = (level: number): number => round6(1 + APTITUDE_YIELD * (level - 1))

/** Her talent in an activity, as the night and the screens read it. */
export type TalentIn = (activity: Activity) => TalentStep

/** One aptitude of hers: its points from her head start, her rank points and her practice, and its level. */
export interface Aptitude {
  id: AptitudeId
  start: number
  ranked: number
  practice: number
  points: number
  level: number
  /** The points the next level starts at; null at the top. */
  next: number | null
}
export function aptitudeOf(uma: Pick<RosterUma, 'ranks' | 'practice'>, id: AptitudeId, talentIn: TalentIn): Aptitude {
  const activity = APTITUDE_ACTIVITY[id]
  const start = TALENT_START[talentIn(activity)]!
  const ranked = Math.floor(uma.ranks[activity].points / RANK_POINTS_A_POINT + 1e-9)
  const practice = uma.practice?.[id] ?? 0
  const points = start + ranked + practice
  const level = aptitudeLevelOf(points)
  return { id, start, ranked, practice, points, level, next: level < MAX_APTITUDE ? APTITUDE_POINTS[level]! : null }
}
/** Her ten aptitudes, in the board's order. */
export const aptitudesOf = (uma: Pick<RosterUma, 'ranks' | 'practice'>, talentIn: TalentIn): Aptitude[] => APTITUDE_IDS.map((id) => aptitudeOf(uma, id, talentIn))
const levelIn = (uma: Pick<RosterUma, 'ranks' | 'practice'>, id: AptitudeId, talentIn: TalentIn): number => aptitudeOf(uma, id, talentIn).level

// --- Tricks ------------------------------------------------------------------------------------------------------

/** The tricks and the level each opens at. */
export const TRICK_AT = { harvestTwo: 5, waterTwo: 3, waterRow: 6, plantTwo: 4, tillInOne: 4, forageThree: 5, chopThree: 5, castTwo: 6, bigLoad: 5 } as const
/** A load's size with the bigger load. */
export const BIG_LOAD = 12

/** One trick: the aptitude, the level it opens at, and what it does. */
export interface Trick { aptitude: AptitudeId; level: number; what: string }
export const TRICKS: readonly Trick[] = [
  { aptitude: 'harvest', level: TRICK_AT.harvestTwo, what: 'Two tiles an action' },
  { aptitude: 'water', level: TRICK_AT.waterTwo, what: 'Two tiles an action' },
  { aptitude: 'water', level: TRICK_AT.waterRow, what: 'A row an action: every dry tile of hers in one row' },
  { aptitude: 'plant', level: TRICK_AT.plantTwo, what: 'Two tiles an action' },
  { aptitude: 'till', level: TRICK_AT.tillInOne, what: 'An overgrown tile cleared and tilled in one action' },
  { aptitude: 'forage', level: TRICK_AT.forageThree, what: `A haul of ${FORAGE_HAUL + 1} finds` },
  { aptitude: 'chop', level: TRICK_AT.chopThree, what: `${CHOP_LOGS + 1} logs a chop` },
  { aptitude: 'fish', level: TRICK_AT.castTwo, what: 'Two casts an action' },
  ...(['mill', 'sawmill', 'smokehouse'] as const).map((aptitude) => ({ aptitude, level: TRICK_AT.bigLoad, what: `A load of up to ${BIG_LOAD}` })),
]
/** Her tricks in an aptitude: those open at `level`, and the next. */
export function tricksAt(id: AptitudeId, level: number): { open: Trick[]; next: Trick | null } {
  const mine = TRICKS.filter((t) => t.aptitude === id)
  return { open: mine.filter((t) => t.level <= level), next: mine.find((t) => t.level > level) ?? null }
}

/** Tiles an action on the field's tasks, by her level (the row is watering's own). */
export function tilesAnAction(kind: TileTaskKind, level: number): number {
  switch (kind) {
    case 'harvest': return level >= TRICK_AT.harvestTwo ? 2 : 1
    case 'water': return level >= TRICK_AT.waterTwo ? 2 : 1
    case 'plant': return level >= TRICK_AT.plantTwo ? 2 : 1
    case 'till': return 1
  }
}
const haulOf = (kind: 'forage' | 'chop', level: number): number =>
  kind === 'forage' ? FORAGE_HAUL + (level >= TRICK_AT.forageThree ? 1 : 0) : CHOP_LOGS + (level >= TRICK_AT.chopThree ? 1 : 0)
const castsAt = (level: number): number => (level >= TRICK_AT.castTwo ? 2 : 1)
export const loadSizeAt = (level: number): number => (level >= TRICK_AT.bigLoad ? BIG_LOAD : LOAD_SIZE)

// --- Her night ---------------------------------------------------------------------------------------------------

/** Whether a seed planted today can ripen before its season's last night withers it. */
function ripensInTime(crop: CropId, day: number): boolean {
  const daysLeft = DAYS_PER_SEASON - dateOf(day).day + 1
  return stagesOf(crop, false) <= daysLeft || growsIn(crop, dateOf(day + daysLeft).season)
}

/** One action of a task: what it did (tiles or hauls), the goods it brought (stock keys) and its challenge events. */
interface Step { save: FarmSave; n: number; items: string[]; events: { activity: Activity; event: ChallengeEvent }[] }

/** What the night's farmhands did. */
export interface HandsTonight {
  save: FarmSave
  /** Each farmhand's day, in the order they worked. */
  lines: FarmhandLine[]
  /** Who worked where today, one place each (where she spent the most actions): the gathering places and the stations. */
  worked: { outfitId: string; place: LoopPlaceId }[]
  /** Who worked the field today. */
  tended: { outfitId: string }[]
  /** The goods her work brought in, by place. */
  made: MadeTonight[]
  /** The areas and spots worked tonight, for the Diary's depth milestones. */
  gathered: string[]
}

/** Her terms at a gathering place tonight: her rank and talent in its activity, the farm's tool, well fed, her keepsake. */
function gatherer(save: FarmSave, id: string, place: GatherPlace, kind: 'forage' | 'chop' | 'fish', level: number, fed: boolean, talentOf: TalentOf, story: PerkPack | null, count: number) {
  const activity: Activity = place === 'forest' ? 'foraging' : 'fishing'
  const rank = save.roster[id]!.ranks[activity].rank
  const talent = talentOf(id, activity)
  const tool = save.tools[GATHER_TOOL[place]]
  const keepsake = keepsakeAt(save, story, id, place)
  const terms = { rank, talent, tool, wellFed: fed ? 1 : 0, ...(keepsake ? { keepsake } : {}) }
  const many = count * rankBenefits(rank).yield * talentYield(talent) * TOOL_YIELD[tool - 1]! * (fed ? WELL_FED_YIELD : 1) * aptitudeYield(level)
  const before = save.farm.counts[HOME_COUNT[place]] ?? 0
  return {
    q: round6(gatherQuality(terms, fed) + aptitudeQuality(level)),
    count: drawnCount(many, draw(save.account.uid, save.calendar.day, `hand-${kind}:${id}`, before)),
    skill: sizeSkill(terms),
  }
}

/** One action of a task, or null when it has nothing to do (or can't be worked tonight). */
function stepOf(save: FarmSave, id: string, task: FarmTask, level: number, fed: boolean, talentOf: TalentOf, story: PerkPack | null): Step | null {
  const tiles = isTileTask(task) ? task.tiles.filter((i) => i >= 0 && i < FIELD_TILES) : []
  const uma = save.roster[id]!
  switch (task.kind) {
    case 'harvest': {
      const ripe = tiles.filter((i) => save.fields.tiles[i]!.ready).slice(0, tilesAnAction('harvest', level))
      if (ripe.length === 0) return null
      const rank = uma.ranks.farming.rank
      const keepsake = keepsakeAt(save, story, id, 'fields')
      const reaper: Reaper = {
        terms: { rank, talent: talentOf(id, 'farming'), wellFed: fed, ...(keepsake ? { keepsake } : {}) }, extra: aptitudeQuality(level), yield: aptitudeYield(level),
        seedsBack: seedsBackChance(rank, save.tools.hoe),
      }
      let next = save
      const items: string[] = []
      const events: Step['events'] = []
      for (const i of ripe) {
        const level0 = cropLevelOf(next.crops[next.fields.tiles[i]!.crop!] ?? 0)
        const done = reapTile(next, i, reaper)
        next = done.save
        const stars = done.receipt.stars.flatMap((n, s) => Array.from({ length: n }, () => s + 1))
        items.push(...stars.map((s) => `${done.receipt.crop}@${s}`))
        events.push({ activity: 'farming', event: { kind: 'harvest', stars, level: level0 } })
      }
      return { save: next, n: ripe.length, items, events }
    }
    case 'water': {
      const dry = tiles.filter((i) => { const t = save.fields.tiles[i]!; return t.crop !== null && !t.ready && !t.watered })
      if (dry.length === 0) return null
      // A row an action from Watering 6: every dry tile of hers in the first row that has one.
      const row = Math.floor(dry[0]! / FIELD_COLUMNS)
      const some = level >= TRICK_AT.waterRow ? dry.filter((i) => Math.floor(i / FIELD_COLUMNS) === row) : dry.slice(0, tilesAnAction('water', level))
      return { save: some.reduce((s, i) => wetTile(s, i), save), n: some.length, items: [], events: [] }
    }
    case 'plant': {
      const empty = tiles.filter((i) => { const t = save.fields.tiles[i]!; return t.ground === 'tilled' && t.crop === null })
      let next = save
      let n = 0
      for (const i of empty) {
        if (n >= tilesAnAction('plant', level)) break
        const seed = seedsInSeason(next).find((s) => (task.crop === undefined || s.crop === task.crop) && ripensInTime(s.crop, next.calendar.day))
        if (!seed) break
        next = sowTile(next, i, seed.id)
        n++
      }
      return n === 0 ? null : { save: next, n, items: [], events: [] }
    }
    case 'till': {
      const i = tiles.find((t) => { const g = save.fields.tiles[t]!.ground; return isOvergrown(g) || g === 'clear' })
      if (i === undefined) return null
      let next = save
      const items: string[] = []
      if (isOvergrown(next.fields.tiles[i]!.ground)) {
        const cleared = clearGround(next, i)
        next = cleared.save
        if (cleared.found) items.push(`${cleared.found}@1`)
        if (level < TRICK_AT.tillInOne) return { save: next, n: 1, items, events: [] }
      }
      return { save: tillGround(next, i), n: 1, items, events: [] }
    }
    case 'load': {
      if (!stationBuilt(save, task.station) || save.loads[task.station]) return null
      const option = [...stationOptions(save, task.station)].sort((a, b) => b.held - a.held)[0]
      if (!option) return null
      const inputs = Math.min(option.held, loadSizeAt(level))
      const out = drawnCount(inputs * aptitudeYield(level), draw(save.account.uid, save.calendar.day, `hand-load:${task.station}`, 0))
      return { save: loadAt(save, task.station, option.item, inputs, out), n: 1, items: Array.from({ length: out }, () => option.item), events: [] }
    }
    case 'forage': case 'chop': {
      if (reachLock(save, 'forest', task.area)) return null
      const by = gatherer(save, id, 'forest', task.kind, level, fed, talentOf, story, haulOf(task.kind, level))
      const done = task.kind === 'forage' ? forageAt(save, task.area, by) : chopAt(save, task.area, by)
      return { save: done.save, n: 1, items: done.haul.items, events: [{ activity: 'foraging', event: { kind: 'gather', area: task.area as ForestAreaId, items: done.haul.items.length } }] }
    }
    case 'fish': {
      if (reachLock(save, 'fishery', task.spot)) return null
      const by = gatherer(save, id, 'fishery', 'fish', level, fed, talentOf, story, castsAt(level))
      const done = fishAt(save, task.spot, by)
      return { save: done.save, n: done.caught.length, items: done.haul.items, events: [{ activity: 'fishing', event: { kind: 'catch', spot: task.spot as FishingSpotId, fish: done.caught.length } }] }
    }
  }
}

/** Her practice in an aptitude, one action more. */
function practised(save: FarmSave, id: string, aptitude: AptitudeId): FarmSave {
  const uma = save.roster[id]!
  return { ...save, roster: { ...save.roster, [id]: { ...uma, practice: { ...uma.practice, [aptitude]: (uma.practice?.[aptitude] ?? 0) + 1 } } } }
}

/**
 * The farmhands' night (step 2, before the crops grow): each farmhand, in the order you invited them, after her part-time
 * job, spends her actions today (`handDay`, read from the day as it was left: `day`) on her board's tasks: the field's
 * and the loads first, in your order, each until it's done; then her gathering shares what's left, a turn each. Each
 * action is a point of practice in its aptitude; her goods go into the Warehouse at once (a load's the next morning, at
 * step 4); her harvests, hauls and catches count toward her challenges.
 */
export function handsTonight(save: FarmSave, day: Pick<FarmSave, 'roster' | 'love' | 'calendar' | 'today' | 'farm'>, talentOf: TalentOf, story: PerkPack | null): HandsTonight {
  let next = save
  const out: HandsTonight = { save, lines: [], worked: [], tended: [], made: [], gathered: [] }
  for (const id of handsInOrder(save)) {
    const hand = handDay(day, id) ?? handDay(save, id)!
    let left = hand.actions
    const done: Partial<Record<TaskKind, number>> = {}
    const spentAt = new Map<WorkPlace, number>()
    const madeAt = new Map<WorkPlace, string[]>()
    let items = 0
    const work = (task: FarmTask): boolean => {
      const aptitude = taskAptitude(task)
      // Her work's well fed (quality, a haul's count) is her well-fed days tonight, as her rank points read them.
      const step = stepOf(next, id, task, levelIn(next.roster[id]!, aptitude, (a) => talentOf(id, a)), next.roster[id]!.wellFed > 0, talentOf, story)
      if (!step) return false
      next = practised(step.save, id, aptitude)
      for (const { activity, event } of step.events) next = countChallenge(next, id, activity, event)
      left -= 1
      done[task.kind] = (done[task.kind] ?? 0) + step.n
      const place = APTITUDE_PLACE[aptitude]
      spentAt.set(place, (spentAt.get(place) ?? 0) + 1)
      if (step.items.length > 0) madeAt.set(place, [...(madeAt.get(place) ?? []), ...step.items])
      items += step.items.length
      if (task.kind === 'forage' || task.kind === 'chop') out.gathered.push(task.area)
      if (task.kind === 'fish') out.gathered.push(task.spot)
      return true
    }
    const tasks = next.roster[id]!.tasks ?? []
    for (const task of tasks.filter((t) => !OPEN_TASKS.includes(t.kind))) {
      while (left > 0 && work(task)) { /* until it's done, or her actions are */ }
    }
    let open = tasks.filter((t) => OPEN_TASKS.includes(t.kind))
    while (left > 0 && open.length > 0) open = open.filter((task) => left > 0 && work(task))
    out.lines.push({ kind: 'farmhand', id, actions: hand.actions, spent: hand.actions - left, half: hand.half, fed: hand.fed > 0, tasks: tasks.length, done, items })
    // Her place today: where she spent the most actions, the first she worked on a tie.
    const top = [...spentAt].reduce<[WorkPlace, number] | null>((best, at) => (best === null || at[1] > best[1] ? at : best), null)
    if (top) {
      if (top[0] === 'fields') out.tended.push({ outfitId: id })
      else out.worked.push({ outfitId: id, place: top[0] as LoopPlaceId })
    }
    for (const [place, keys] of madeAt) out.made.push({ outfitId: id, place, items: keys })
  }
  return { ...out, save: next, gathered: [...new Set(out.gathered)] }
}

/** Aptitudes that reached a level between two saves: each farmhand's, the level reached. The morning's §3. */
export function aptitudeUps(before: Pick<FarmSave, 'roster'>, after: Pick<FarmSave, 'roster'>, talentOf: TalentOf): AptitudeUp[] {
  return handsInOrder(after).flatMap((id) => {
    const was = before.roster[id]
    const now = after.roster[id]!
    if (!was) return []
    const talentIn: TalentIn = (a) => talentOf(id, a)
    return APTITUDE_IDS.flatMap((aptitude): AptitudeUp[] => {
      const level = levelIn(now, aptitude, talentIn)
      return level > levelIn(was, aptitude, talentIn) ? [{ kind: 'aptitude', outfitId: id, aptitude, level }] : []
    })
  })
}

/** The farmhands well fed this morning: the night notes them, and each works one more action today. */
export const fedThisMorning = (save: Pick<FarmSave, 'roster'>): string[] => handsInOrder(save).filter((id) => save.roster[id]!.wellFed > 0)

/** What a farmhand will do tonight, as the farm stands now: the night's own run over today, her line. The board shows it. */
export function handTonight(save: FarmSave, id: string, talentOf: TalentOf, story: PerkPack | null): FarmhandLine | null {
  return handsTonight(save, save, talentOf, story).lines.find((l) => l.id === id) ?? null
}

