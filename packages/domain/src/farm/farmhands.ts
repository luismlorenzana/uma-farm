// Farmhands and aptitudes. A friend you invite to work (`roster[id].farmhand`) is a farmhand. She keeps her life in
// town, and comes to the farm on her **farm days**, the days her town schedule (her routine, her part-time job, or the
// default schedule's spot) doesn't put her out in town (`town/town.ts`'s `farmDaysIn`): in front of you there for talks,
// gifts and her evening, she gives the farm a few actions on the tasks you set on the work board. She works them
// before afternoon, so her goods are ready to use, and eats her two meals on the farm. On her town
// days she's in town, and doesn't work, eat on the farm or cost anything. A spouse in her room is on the farm every day.
//
//   her day      on her farm day: 3 actions; +1 once she's settled in (a season after you invited her); +2 once she's your spouse;
//                +1 when she's well fed this morning (a household meal the day before, a reception, a spouse's
//                breakfast); all at the farm's pace (`atPace`: half, from the second short night of upkeep, never below 1).
//                The Kitchen's assistant gives one of them to its play (`kitchen/kitchen.ts`)
//   the board    her tasks, in your order: the field's over a plot's tiles (harvest, water, plant, clear and till), a
//                station's load, a forest area's forage or chop, a fishing spot's catch, the Coop's or the Barn's care,
//                a face at the Mine or the Quarry, cooking in the farm's kitchen. Any Uma does any task, and each repeats
//                daily until you change it. A task on the board is hers: the farmer's own ten stay free
//   her night    the field's tasks, the loads, the animals' care and the cooking first, in your order, each until it's
//                done or her actions run out; then her gathering and her digging share what's left, a turn each
//   cook         a batch an action, from two goods of food by the plain rule (`farm/food.ts`): 6 meals at Cooking 1 up
//                to 12 at 10, into the pantry, until it holds tonight's meals for everyone
//   aptitude     a level 1–10 for each task: her talent's head start, a point for every 20 rank points in its activity,
//                and a point for each action she spends on it. A level above 1 lifts her stars (+0.1) and her yield
//                (+5%), and tricks open: two tiles an action, a row watered in one, a bigger haul, two casts, a bigger
//                load, two animals fed or cared for an action, three finds a face
//
// Her work counts as an Uma's work does: rank points in the day's activity (where she spent the most actions), the
// challenges, bonds at the same place, her line, side by side's and the perks' extras, praise. Her reach is the farm's
// (the Farm Rank's areas and spots). Pure; never stamps. Loaded with the night and the Book.
import { DAYS_PER_SEASON, dateOf, type FarmClock } from './calendar'
import { draw } from './draw'
import { atPace, halfPace } from './economy'
import { addBatch, cookBatchAt, eatTonight, isFoodId, mealsNeeded, pantryMeals, plainBatch, TAKEOUT_PRICE } from './food'
import { noteCupWork } from '../festivals/evidence'
import { festivalBooked } from '../festivals/state'
import { farmhands } from '../romance/loop'
import { countChallenge, rankBenefits, type ChallengeEvent } from './rank-rules'
import { shipSurplus } from './production'
import type { Activity } from './ranks'
import { talentYield, type TalentOf, type TalentStep } from './talents'
import { cropLevelOf, drawnCount, reapTile, seedsBackChance, seedsInSeason, sowTile, stagesOf, tileOf, tillGround, clearGround, wetTile, type Reaper } from '../fields/fields'
import { CROPS, growsIn, needsWater } from '../fields/crops'
import { harvestGrade, MAX_SEED_TARGET, plantingPlan, saveCropSeedsAt, SEED_BATCH, seedOutput } from '../fields/production'
import { chopAt, CHOP_LOGS, fishAt, FORAGE_HAUL, forageAt, reachLock } from '../gathering/hauls'
import { brushCapacity, tillCapacity, waterTargets } from '../forge/tools'
import { digFloorLock, dugCount, FACE_FINDS, faceAt } from '../gathering/digs'
import type { FishingSpotId, ForestAreaId } from '../gathering/ids'
import { gatherQuality, HOME_COUNT, keepsakeAt, sizeSkill, stationBuilt, type GatherPlace, type MadeTonight, type WorkPlace } from '../gathering/kinds'
import { animalsIn, careAt, collectAt, feedAt, grassAt, grassLock, heartsOf, homeBuilt, readyIn } from '../ranch/ranch'
import { LOAD_SIZE, loadAt, loadsToday, nextStationLoad } from '../gathering/stations'
import { canSaveCropSeed, cropBaseGrade, cropGoodId, cropSeedId, goodOf, isCropId, type CropId } from '../goods/ids'
import { goodCount, parseStockKey, stockKey } from '../save/warehouse'
import type { AptitudeUp, FarmhandLine } from '../night/summary'
import type { PerkPack } from '../romance/perk-terms'
import { SaveRuleError } from '../save/rules'
import {
  APTITUDE_IDS, FIELD_COLUMNS, FIELD_TILES, fieldIndex, fieldTiles, isOvergrown, MAX_TASKS, TILE_TASKS,
  type AptitudeId, type DigId, type FarmSave, type FarmTask, type RosterUma, type TaskKind, type TileTaskKind,
} from '../save/v4'
import type { StoryPack } from '../story/pack'
import { herJobOf } from '../story/placeholders'
import { defaultSpot, worksOn, type SchedulePack } from '../town/town'
import type { LoopPlaceId } from '../save/parse-v4'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

// --- Her day ---------------------------------------------------------------------------------------------------

/** A farmhand's actions a day, to start. */
export const HAND_ACTIONS = 3
/** Settled in: a season after you invited her, one more. */
export const SETTLED_AFTER = 12
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
  /** Of them, the Kitchen's: 1 when she's its play's assistant today (`today.assistant`), 1 more when she's the Cooking
   * Contest's cook (`today.cook`), never more than she has. */
  kitchen: number
  restaurant?: number
  festival?: number
  forge?: number
}

/** Her actions today, or null for one who isn't a farmhand. */
export function handDay(save: Pick<FarmSave, 'roster' | 'love' | 'calendar' | 'today' | 'farm'> & Partial<Pick<FarmSave, 'workshops'>>, id: string): HandDay | null {
  const hired = save.roster[id]?.farmhand
  if (hired === undefined) return null
  const settled = save.calendar.day - hired >= SETTLED_AFTER ? SETTLED_ACTIONS : 0
  const spouse = save.love[id]?.stage === 'spouse' ? SPOUSE_ACTIONS : 0
  const fed = save.today.fed?.includes(id) ? FED_ACTIONS : 0
  const all = HAND_ACTIONS + settled + spouse + fed
  const actions = atPace(all, save)
  const kitchen = Math.min(actions, (save.today.assistant === id ? 1 : 0) + (save.today.cook === id ? 1 : 0))
  return { base: HAND_ACTIONS, settled, spouse, fed, half: halfPace(save), actions, kitchen,
    ...(save.today.server === id && actions > kitchen ? { restaurant: 1 } : {}),
    ...(save.today.forgeHelper?.id === id ? { forge: 1 } : {}),
    ...(save.workshops && festivalBooked({ calendar: save.calendar, workshops: save.workshops }, id) ? { festival: 1 } : {}) }
}

/** The farmhands in the order they work: by the day you invited them, then by id. */
export function handsInOrder(save: Pick<FarmSave, 'roster'>): string[] {
  return farmhands(save).sort((a, b) => save.roster[a]!.farmhand! - save.roster[b]!.farmhand! || Number(a) - Number(b))
}

/** The farmhands who work the farm on a day, in the order they work (`worksOn`). */
export const handsWorking = (save: Pick<FarmSave, 'roster' | 'love' | 'calendar'>, pack: SchedulePack | null, day = save.calendar.day): string[] =>
  handsInOrder(save).filter((id) => worksOn(save, pack, id, day))

/** Her part-time job: the story's (`what` its words, `at` its location), else the game's default, a job in town at her
 * favourite spot (her default schedule's, `defaultSpot`). The words are the app's: "Works at the Bakery", "Helps out at
 * the Café". Her job is her town days: the days it holds, she's in town (`town/town.ts`'s `farmDaysIn`). */
export interface HandJob {
  own: boolean
  what: string | null
  at: string | null
}
export function handJob(pack: Pick<StoryPack, 'cast'>, id: string): HandJob {
  const job = herJobOf(pack, id)
  return job ? { own: true, what: job.what ?? null, at: job.at } : { own: false, what: null, at: defaultSpot(pack, id) }
}

// --- The board -----------------------------------------------------------------------------------------------

/** Each task's name on the board. */
export const TASK_NAMES: Readonly<Record<TaskKind, string>> = {
  harvest: 'Harvest', water: 'Water', plant: 'Plant', till: 'Clear and till', load: 'Load', forage: 'Forage', chop: 'Chop', fish: 'Fish',
  care: 'Care for animals', mine: 'Work a face', cook: 'Cook', 'save-seed': 'Save seed', 'ship-surplus': 'Ship surplus',
}
/** The tasks that run until her actions do: her gathering and her digging, a turn each once the field's, the loads and
 * the animals' care are done. */
export const OPEN_TASKS: readonly TaskKind[] = ['forage', 'chop', 'fish', 'mine']
export const isTileTask = (task: FarmTask): task is Extract<FarmTask, { tiles: number[] }> => (TILE_TASKS as readonly string[]).includes(task.kind)
/** A field task's plot: its index, 0 for plot 1 (a task with none). */
export const taskPlot = (task: Extract<FarmTask, { tiles: number[] }>): number => task.plot ?? 0
/** A field task's tiles as field indices: its plot's tiles, numbered on from plot 1's. */
export const taskTiles = (task: Extract<FarmTask, { tiles: number[] }>): number[] =>
  task.tiles.filter((i) => Number.isInteger(i) && i >= 0 && i < FIELD_TILES).map((i) => fieldIndex(taskPlot(task), i))

/** The aptitude a task practises: its own, a load its station's. */
export const taskAptitude = (task: FarmTask): AptitudeId | null =>
  task.kind === 'ship-surplus' ? null : task.kind === 'load' ? task.station : task.kind === 'save-seed' ? 'plant' : task.kind

/** Where a task is worked: the Fields, a station, the forest, the Fishery, the Coop or the Barn, the Mine or the
 * Quarry, the kitchen (the farmhouse's until the Kitchen stands). */
export function taskPlace(task: FarmTask): WorkPlace {
  switch (task.kind) {
    case 'load': return task.station
    case 'cook': return 'kitchen'
    case 'forage': case 'chop': return 'forest'
    case 'fish': return 'fishery'
    case 'care': return task.home
    case 'mine': return task.dig
    default: return 'fields'
  }
}

/** Why a task can't go on her board, or null: the field's tiles are on a plot the farm has cleared, a load's station, the
 * animals' building and the dig are built, an area or a spot is within the farm's reach. */
export function taskLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'fields' | 'places'>, task: FarmTask): string | null {
  if (isTileTask(task)) {
    if (task.tiles.length === 0) return 'Choose its tiles.'
    const plot = task.plot
    if (plot !== undefined && (!Number.isInteger(plot) || plot < 0 || plot >= save.fields.plots.length)) return 'Clear that plot first.'
    if (task.tiles.some((i) => !Number.isInteger(i) || i < 0 || i >= FIELD_TILES) || new Set(task.tiles).size !== task.tiles.length) return 'Those aren’t the plot’s tiles.'
    if (task.kind === 'plant' && task.crop !== undefined && !isCropId(task.crop)) return 'That isn’t a crop.'
    return null
  }
  switch (task.kind) {
    case 'save-seed': {
      const crop = task.crop ?? 'carrot'
      const grade = task.grade + (task.improve ? 1 : 0)
      if (!canSaveCropSeed(crop) || !cropGoodId(crop, task.grade) || !cropGoodId(crop, grade)) return 'Choose an available seed grade.'
      return !Number.isInteger(task.target) || task.target < 1 || task.target > MAX_SEED_TARGET ? 'Keep 1 to 99 seeds.' : null
    }
    case 'load': return stationBuilt(save, task.station) ? null : 'Build it first.'
    case 'care': return homeBuilt(save, task.home) ? null : 'Build it first.'
    case 'mine': return digFloorLock(save, task.dig, task.floor)
    case 'fish': return reachLock(save, 'fishery', task.spot)
    case 'forage': case 'chop': return reachLock(save, 'forest', task.area)
    case 'cook': return null
    case 'ship-surplus': return null
  }
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
  // Plot 1's tasks are written without a plot, as before plots.
  const clean = tasks.map((t): FarmTask => {
    if (!isTileTask(t)) return { ...t }
    const { plot, ...rest } = t
    return { ...rest, tiles: [...t.tiles].sort((a, b) => a - b), ...(plot ? { plot } : {}) }
  })
  return { ...save, roster: { ...save.roster, [id]: { ...uma, tasks: clean } } }
}

// --- Aptitude ------------------------------------------------------------------------------------------------

/** Each aptitude's name, the activity it reads her talent and rank points in, and where she works it. */
export const APTITUDE_NAMES: Readonly<Record<AptitudeId, string>> = {
  harvest: 'Harvesting', water: 'Watering', plant: 'Planting', till: 'Clearing', forage: 'Foraging', chop: 'Chopping', fish: 'Fishing',
  mill: 'Milling', sawmill: 'Sawing', smokehouse: 'Smoking', care: 'Animal care', mine: 'Mining', smelter: 'Smelting', cutter: 'Cutting', cook: 'Cooking',
}
export const APTITUDE_ACTIVITY: Readonly<Record<AptitudeId, Activity>> = {
  harvest: 'farming', water: 'farming', plant: 'farming', till: 'farming', forage: 'foraging', chop: 'foraging', fish: 'fishing',
  mill: 'farming', sawmill: 'foraging', smokehouse: 'fishing', care: 'ranch', mine: 'mining', smelter: 'mining', cutter: 'mining', cook: 'cooking',
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
/** Her fifteen aptitudes, in the board's order. */
export const aptitudesOf = (uma: Pick<RosterUma, 'ranks' | 'practice'>, talentIn: TalentIn): Aptitude[] => APTITUDE_IDS.map((id) => aptitudeOf(uma, id, talentIn))
const levelIn = (uma: Pick<RosterUma, 'ranks' | 'practice'>, id: AptitudeId, talentIn: TalentIn): number => aptitudeOf(uma, id, talentIn).level

// --- Tricks ------------------------------------------------------------------------------------------------------

/** The tricks and the level each opens at. */
export const TRICK_AT = {
  harvestTwo: 5, waterTwo: 3, waterRow: 6, plantTwo: 4, tillInOne: 4, forageThree: 5, chopThree: 5, castTwo: 6, bigLoad: 5, feedTwo: 3, careTwo: 5, digThree: 5,
} as const
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
  ...(['mill', 'sawmill', 'smokehouse', 'smelter', 'cutter'] as const).map((aptitude) => ({ aptitude, level: TRICK_AT.bigLoad, what: `A load of up to ${BIG_LOAD}` })),
  { aptitude: 'care', level: TRICK_AT.feedTwo, what: 'Two animals fed an action' },
  { aptitude: 'care', level: TRICK_AT.careTwo, what: 'Two animals cared for an action' },
  { aptitude: 'mine', level: TRICK_AT.digThree, what: `${FACE_FINDS + 1} finds a face` },
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
function ripensInTime(crop: CropId, clock: FarmClock): boolean {
  const { day } = clock
  const daysLeft = DAYS_PER_SEASON - dateOf(day, clock).day + 1
  return stagesOf(crop, false) <= daysLeft || growsIn(crop, dateOf(day + daysLeft, clock).season)
}

/** One action of a task: what it did (tiles or hauls), the goods it brought (stock keys) and its challenge events. */
interface Step { save: FarmSave; n: number; items: string[]; events: { activity: Activity; event: ChallengeEvent }[] }

/** What the night's farmhands did. */
export interface CrewReceipt {
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
  aptitudes?: AptitudeUp[]
}

export interface HandsTonight extends CrewReceipt {
  save: FarmSave
}

function reserved(day: { kitchen?: number; restaurant?: number; festival?: number; forge?: number }): number {
  return (day.kitchen ?? 0) + (day.restaurant ?? 0) + (day.festival ?? 0) + (day.forge ?? 0)
}

function spentOnCrew(line: FarmhandLine): number {
  return Math.max(0, line.spent - reserved(line))
}

/** Workshop and contest bookings use only the shift's unused actions. */
export function handActionsLeft(save: FarmSave, id: string): number {
  const day = handDay(save, id)
  if (!day) return 0
  const line = save.today.crew?.lines.find(row => row.id === id)
  if (save.today.crew && !line) return 0
  return Math.max(0, (line?.actions ?? day.actions) - reserved(day) - (line ? spentOnCrew(line) : 0))
}

function crewWithBookings(save: FarmSave, receipt: CrewReceipt): HandsTonight {
  const lines = receipt.lines.map(line => {
    const { kitchen: _kitchen, restaurant: _restaurant, festival: _festival, forge: _forge, ...actual } = line
    const day = handDay(save, line.id)
    if (!day) return line
    return {
      ...actual, spent: Math.min(line.actions, spentOnCrew(line) + reserved(day)),
      ...(day.kitchen ? { kitchen: day.kitchen } : {}),
      ...(day.restaurant ? { restaurant: day.restaurant } : {}),
      ...(day.festival ? { festival: day.festival } : {}),
      ...(day.forge ? { forge: day.forge } : {}),
    }
  })
  const present = new Set([...receipt.worked, ...receipt.tended].map(row => row.outfitId))
  const worked = [...receipt.worked]
  for (const line of lines) {
    if (line.kitchen && !present.has(line.id)) worked.push({ outfitId: line.id, place: 'kitchen' })
  }
  return { save, ...receipt, lines, worked }
}

/** Her terms at a gathering place tonight: her rank and talent in its activity, the farm's tool, well fed, her keepsake. */
export function gatherer(save: FarmSave, id: string, place: GatherPlace, kind: 'forage' | 'chop' | 'fish', level: number, fed: boolean, talentOf: TalentOf, story: PerkPack | null, count: number) {
  const activity: Activity = place === 'forest' ? 'foraging' : 'fishing'
  const rank = save.roster[id]!.ranks[activity].rank
  const talent = talentOf(id, activity)
  const tool = 1
  const keepsake = keepsakeAt(save, story, id, place)
  const terms = { rank, talent, tool, wellFed: fed ? 1 : 0, ...(keepsake ? { keepsake } : {}) }
  const many = count * rankBenefits(rank).yield * talentYield(talent) * aptitudeYield(level)
  const before = save.farm.counts[HOME_COUNT[place]] ?? 0
  return {
    q: round6(gatherQuality(terms, fed) + aptitudeQuality(level)),
    count: drawnCount(many, draw(save.account.uid, save.calendar.day, `hand-${kind}:${id}`, before)),
    skill: sizeSkill(terms),
  }
}

/** Her terms at a dig tonight: her rank and talent in mining, the farm's Pick or Hammer, well fed, her keepsake; her
 * finds (two, three from Mining 5) by her yield, a seeded draw for a fraction. */
function digger(save: FarmSave, id: string, dig: DigId, level: number, fed: boolean, talentOf: TalentOf, story: PerkPack | null) {
  const rank = save.roster[id]!.ranks.mining.rank
  const talent = talentOf(id, 'mining')
  const tool = 1
  const keepsake = keepsakeAt(save, story, id, dig)
  const terms = { rank, talent, tool, wellFed: fed ? 1 : 0, ...(keepsake ? { keepsake } : {}) }
  const finds = FACE_FINDS + (level >= TRICK_AT.digThree ? 1 : 0)
  const many = finds * rankBenefits(rank).yield * talentYield(talent) * aptitudeYield(level)
  return {
    q: round6(gatherQuality(terms, fed) + aptitudeQuality(level)),
    count: drawnCount(many, draw(save.account.uid, save.calendar.day, `hand-dig:${id}`, save.farm.counts[dugCount(dig)] ?? 0)),
  }
}

/** The animals' care, one action: a hungry animal fed (two from Animal care 3) while the silo holds feed, else grass cut
 * on a weeds tile for it; then the building's goods collected, at her aptitude's quality and her keepsake there; then an
 * animal cared for (two from Animal care 5), +1 fondness a level above 1. Null once all are fed, collected and cared for. */
function careStep(save: FarmSave, id: string, { home, feedOnly }: Extract<FarmTask, { kind: 'care' }>, level: number, story: PerkPack | null): Step | null {
  if (!homeBuilt(save, home)) return null
  const animals = animalsIn(save, home)
  const hungry = animals.filter((a) => !a.fed)
  if (hungry.length > 0 && save.ranch.silo > 0) {
    const some = hungry.slice(0, Math.min(save.ranch.silo, level >= TRICK_AT.feedTwo ? 2 : 1))
    return { save: noteCupWork(some.reduce((s, a) => feedAt(s, a.id), save), id, 'ranch'), n: some.length, items: [], events: [] }
  }
  if (hungry.length > 0 && grassLock(save) === null && fieldTiles(save).some((t) => t.ground === 'weeds')) return { save: grassAt(save).save, n: 0, items: [], events: [] }
  if (feedOnly) return null
  if (readyIn(save, home) > 0) {
    const done = collectAt(save, home, round6(aptitudeQuality(level) + keepsakeAt(save, story, id, home)), level)
    return { save: noteCupWork(done.save, id, 'ranch'), n: 0, items: done.collected.items, events: [] }
  }
  const lonely = animals.filter((a) => !a.cared).slice(0, Math.max(brushCapacity(save.tools.brush), level >= TRICK_AT.careTwo ? 2 : 1))
  if (lonely.length === 0) return null
  const next = noteCupWork(lonely.reduce((s, a) => careAt(s, a.id, level - 1, id), save), id, 'ranch')
  const events = lonely.map((a) => ({ activity: 'ranch' as const, event: { kind: 'hearts' as const, hearts: heartsOf(next.ranch.animals.find((x) => x.id === a.id)!.fondness) } }))
  return { save: next, n: lonely.length, items: [], events }
}

/** One action of a task, or null when it has nothing to do (or can't be worked tonight). */
function stepOf(save: FarmSave, id: string, task: FarmTask, level: number, fed: boolean, talentOf: TalentOf, story: PerkPack | null): Step | null {
  // Her tiles as field indices, on a plot the farm has (a plot not cleared has none).
  const tiles = isTileTask(task) ? taskTiles(task).filter((i) => tileOf(save, i) !== undefined) : []
  const at = (i: number) => tileOf(save, i)!
  const uma = save.roster[id]!
  switch (task.kind) {
    case 'harvest': {
      const ripe = tiles.flatMap((i) => {
        if (!at(i).ready) return []
        const grade = harvestGrade(save, at(i), i, level)
        return grade === null ? [] : [{ i, grade }]
      }).slice(0, tilesAnAction('harvest', level))
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
      for (const { i, grade } of ripe) {
        const level0 = cropLevelOf(next.crops[tileOf(next, i)!.crop!] ?? 0)
        const done = reapTile(next, i, reaper, grade, id)
        next = done.save
        const stars = done.receipt.stars.flatMap((n, s) => Array.from({ length: n }, () => s + 1))
        items.push(...(done.receipt.lots?.map((lot) => stockKey(lot.id, lot.stars)) ?? stars.map((s) => stockKey(done.receipt.crop, s))))
        events.push({ activity: 'farming', event: { kind: 'harvest', stars, level: level0 } })
      }
      return { save: noteCupWork(next, id, 'field'), n: ripe.length, items, events }
    }
    case 'water': {
      const dry = tiles.filter((i) => needsWater(at(i)))
      if (dry.length === 0) return null
      const some = waterTargets(dry, save.tools['watering-can'], level, FIELD_COLUMNS)
      return { save: some.reduce((s, i) => wetTile(s, i, id), save), n: some.length, items: [], events: [] }
    }
    case 'plant': {
      const empty = tiles.filter((i) => { const t = at(i); return t.ground === 'tilled' && t.crop === null })
      let next = save
      let n = 0
      for (const i of empty) {
        if (n >= tilesAnAction('plant', level)) break
        const plan = plantingPlan(next, i)
        if (plan === null) continue
        const named = plan ? plan.crop : task.crop
        const seed = seedsInSeason(next).find((s) => {
          if (named && s.crop !== named) return false
          if (CROPS[s.crop].woody ? !named : !ripensInTime(s.crop, next.calendar)) return false
          return plan?.crop ? (s.grade ?? cropBaseGrade(s.crop)) === plan.grade : s.grade === undefined
        })
        if (!seed) continue
        next = sowTile(next, i, seed.id, id)
        n++
      }
      return n === 0 ? null : { save: next, n, items: [], events: [] }
    }
    case 'save-seed': {
      const crop = task.crop ?? 'carrot'
      const output = seedOutput(save, crop, task.grade, task.improve)
      if (!output) return null
      const input = cropGoodId(crop, task.grade)!
      const held = goodCount(save.items, input) - (save.farm.reserves?.[input] ?? 0)
      const needed = task.target - goodCount(save.items, cropSeedId(crop, true, output))
      const n = Math.min(SEED_BATCH, held, needed)
      return n < 1 ? null : { save: saveCropSeedsAt(save, crop, task.grade, task.improve, n), n, items: [], events: [] }
    }
    case 'till': {
      const i = tiles.find((t) => { const g = at(t).ground; return isOvergrown(g) || g === 'clear' })
      if (i === undefined) return null
      let next = save
      const items: string[] = []
      if (isOvergrown(tileOf(next, i)!.ground)) {
        const cleared = clearGround(next, i)
        next = cleared.save
        if (cleared.found) items.push(`${cleared.found}@1`)
        if (level < TRICK_AT.tillInOne) return { save: next, n: 1, items, events: [] }
      }
      const rest = isOvergrown(at(i).ground) ? [] : tiles.filter(target => target !== i && at(target).ground === 'clear')
      const some = [i, ...rest].slice(0, tillCapacity(save.tools.hoe))
      return { save: some.reduce((state, target) => tillGround(state, target), next), n: some.length, items, events: [] }
    }
    case 'load': {
      const load = nextStationLoad(save, task.station, loadSizeAt(level))
      if (!load) return null
      const { option, batches, target } = load
      const out = goodOf(option.output)?.conversion ? batches : Math.min(target ?? Infinity,
        drawnCount(batches * aptitudeYield(level), draw(save.account.uid, save.calendar.day, `hand-load:${task.station}`, loadsToday(save, task.station).length)))
      const loaded = loadAt(save, task.station, option.item, batches * option.units, out)
      const good = goodOf(option.output)
      return { save: good?.refined && isFoodId(good.id) ? noteCupWork(loaded, id, 'workshop') : loaded,
        n: 1, items: Array.from({ length: out }, () => option.item), events: [] }
    }
    case 'forage': case 'chop': {
      if (reachLock(save, 'forest', task.area)) return null
      const by = gatherer(save, id, 'forest', task.kind, level, fed, talentOf, story, haulOf(task.kind, level))
      const done = task.kind === 'forage' ? forageAt(save, task.area, by) : chopAt(save, task.area, by)
      const edible = task.kind === 'forage' && done.haul.items.some((key) => isFoodId(parseStockKey(key)!.id))
      return { save: edible ? noteCupWork(done.save, id, 'wild') : done.save, n: 1, items: done.haul.items, events: [{ activity: 'foraging', event: { kind: 'gather', area: task.area as ForestAreaId, items: done.haul.items.length } }] }
    }
    case 'fish': {
      if (reachLock(save, 'fishery', task.spot)) return null
      const by = gatherer(save, id, 'fishery', 'fish', level, fed, talentOf, story, castsAt(level))
      const mode = task.mode ?? save.farm.fishingModes?.[task.spot] ?? 'standard'
      const done = fishAt(save, task.spot, by, mode, level)
      return { save: done.caught.length ? noteCupWork(done.save, id, 'fish') : done.save, n: done.caught.length, items: done.haul.items, events: [{ activity: 'fishing', event: { kind: 'catch', spot: task.spot as FishingSpotId, fish: done.caught.length } }] }
    }
    case 'care': return careStep(save, id, task, level, story)
    case 'ship-surplus': {
      const done = shipSurplus(save)
      return done ? { save: done.save, n: done.count, items: [], events: [] } : null
    }
    case 'cook': {
      // A batch from two goods of food, by her level, until the pantry holds tonight's meals for everyone.
      if (pantryMeals(save) >= mealsNeeded(save, story)) return null
      const goods = plainBatch(save)
      if (!goods) return null
      const meals = cookBatchAt(level)
      return { save: noteCupWork(addBatch(save, goods, meals), id, 'kitchen'), n: meals, items: [], events: [] }
    }
    case 'mine': {
      if (digFloorLock(save, task.dig, task.floor)) return null
      const done = faceAt(save, task.dig, digger(save, id, task.dig, level, fed, talentOf, story), task.floor)
      return { save: done.save, n: 1, items: done.face.items, events: [{ activity: 'mining', event: { kind: 'dig', floor: done.face.floor, items: done.face.items.length - (done.face.bonus ? 1 : 0) } }] }
    }
  }
}

/** Her practice in an aptitude, one action more. */
function practised(save: FarmSave, id: string, aptitude: AptitudeId): FarmSave {
  const uma = save.roster[id]!
  return { ...save, roster: { ...save.roster, [id]: { ...uma, practice: { ...uma.practice, [aptitude]: (uma.practice?.[aptitude] ?? 0) + 1 } } } }
}

/**
 * Forecast or report a crew shift: each farmhand who worked the farm today (`handsWorking`: on her
 * farm day, the day being settled; on a town day she's in town and doesn't work), in the order you invited them, spends
 * her actions today (`handDay`, read from the day as it was left: `day`) on her board's tasks: the field's
 * and the loads first, in your order, each until it's done; then her gathering shares what's left, a turn each. Each
 * action is a point of practice in its aptitude; her goods go into the Warehouse at once (a load's the next morning, at
 * step 4); her harvests, hauls and catches count toward her challenges.
 */
export function handsTonight(save: FarmSave, day: Pick<FarmSave, 'roster' | 'love' | 'calendar' | 'today' | 'farm'>, talentOf: TalentOf, story: PerkPack | null): HandsTonight {
  if (save.today.crew) return crewWithBookings(save, save.today.crew)
  let next = save
  const out: HandsTonight = { save, lines: [], worked: [], tended: [], made: [], gathered: [] }
  const finish: (() => void)[] = []
  for (const id of handsWorking(save, story)) {
    const hand = handDay(day, id) ?? handDay(save, id)!
    // The Kitchen's assistant: one of her actions tonight was the play's, at the Kitchen.
    const festival = festivalBooked(save, id) ? 1 : 0
    const helper = save.today.forgeHelper?.id === id ? save.today.forgeHelper : undefined
    let left = Math.max(0, hand.actions - hand.kitchen - (hand.restaurant ?? 0) - festival - (helper ? 1 : 0))
    if (helper) next = countChallenge(next, id, 'forging', { kind: 'forge-piece', tier: helper.tier })
    const done: Partial<Record<TaskKind, number>> = {}
    const spentAt = new Map<WorkPlace, number>(hand.kitchen > 0 ? [['kitchen', hand.kitchen]] : [])
    if (hand.restaurant) spentAt.set('restaurant', hand.restaurant)
    const madeAt = new Map<WorkPlace, string[]>()
    let items = 0
    const work = (task: FarmTask): boolean => {
      const aptitude = taskAptitude(task)
      // Her work's well fed (quality, a haul's count) is her well-fed days tonight, as her rank points read them.
      const level = aptitude ? levelIn(next.roster[id]!, aptitude, (a) => talentOf(id, a)) : 0
      const step = stepOf(next, id, task, level, next.roster[id]!.wellFed > 0, talentOf, story)
      if (!step) return false
      next = aptitude ? practised(step.save, id, aptitude) : step.save
      for (const { activity, event } of step.events) next = countChallenge(next, id, activity, event)
      left -= 1
      done[task.kind] = (done[task.kind] ?? 0) + step.n
      if (task.kind === 'ship-surplus') return true
      const place = taskPlace(task)
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
    finish.push(() => {
      // An idle cook or station hand can use exact inputs brought in later in the same shift.
      for (const task of tasks) {
        if (left === 0) break
        if (task.kind === 'cook' || (task.kind === 'load' && next.farm.stationPlans?.[task.station])) {
          while (left > 0 && work(task)) { /* use only the actions left from her scheduled work */ }
        }
      }
      if ((spentAt.get('coop') ?? 0) + (spentAt.get('barn') ?? 0) > 0) next = countChallenge(next, id, 'ranch', { kind: 'care' })
      out.lines.push({
        kind: 'farmhand', id, actions: hand.actions, spent: hand.actions - left, half: hand.half, fed: hand.fed > 0, tasks: tasks.length, done, items,
        ...(hand.kitchen > 0 ? { kitchen: hand.kitchen } : {}),
        ...(hand.restaurant ? { restaurant: hand.restaurant } : {}),
        ...(festival ? { festival } : {}),
        ...(helper ? { forge: 1 } : {}),
      })
      // Her place today: where she spent the most actions, the first she worked on a tie.
      const top = [...spentAt].reduce<[WorkPlace, number] | null>((best, at) => (best === null || at[1] > best[1] ? at : best), null)
      if (top) {
        if (top[0] === 'fields') out.tended.push({ outfitId: id })
        else out.worked.push({ outfitId: id, place: top[0] as LoopPlaceId })
      }
      for (const [place, keys] of madeAt) out.made.push({ outfitId: id, place, items: keys })
    })
  }
  for (const settle of finish) settle()
  return { ...out, save: next, gathered: [...new Set(out.gathered)] }
}

/** Run a shift once, leaving enough detail for the existing night credit and reporting rules. */
export function settleCrewShift<S extends FarmSave>(save: S, talentOf: TalentOf, story: PerkPack | null): S {
  if (save.today.crew) return save
  const { save: after, ...crew } = handsTonight(save, save, talentOf, story)
  const aptitudes = aptitudeUps(save, after, talentOf)
  return { ...after, today: { ...after.today, dayParts: true, crew: { ...crew, aptitudes } } } as S
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

/** Tonight's table as the farm stands now: the farmhands work (a cook cooks), then the farm eats. The mouths, the meals
 * from the pantry (`pantry`, those there now and those the cooks add, `cooked`), the takeout and its gold, and the Umas a
 * good meal leaves well fed. The Book and the kitchen show it. */
export interface TableTonight {
  mouths: number
  pantry: number
  cooked: number
  takeout: number
  gold: number
  fed: number
}
export function tableTonight(save: FarmSave, talentOf: TalentOf, story: PerkPack | null): TableTonight {
  const night = handsTonight(save, save, talentOf, story)
  const cooked = night.lines.reduce((n, l) => n + (l.done.cook ?? 0), 0)
  const eaten = eatTonight(night.save, night.lines.map((l) => l.id))
  return { mouths: eaten.mouths, pantry: eaten.pantry, cooked, takeout: eaten.takeout, gold: eaten.takeout * TAKEOUT_PRICE, fed: eaten.fed.length }
}

/** What a farmhand will do tonight, as the farm stands now: the night's own run over today, her line. The board shows it. */
export function handTonight(save: FarmSave, id: string, talentOf: TalentOf, story: PerkPack | null): FarmhandLine | null {
  return handsTonight(save, save, talentOf, story).lines.find((l) => l.id === id) ?? null
}

