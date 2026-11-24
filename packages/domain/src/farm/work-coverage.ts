import { type FarmSave, DIGS, RANCH_HOMES, type FarmTask, type RanchHome, type TaskKind, type TileTaskKind, fieldIndex, fieldTiles, isOvergrown } from '../save/v4'
import type { FarmhandLine } from '../night/summary'
import { dateOf, DAYS_PER_SEASON, DAYS_PER_YEAR } from './calendar'
import { animalsIn, grassLock } from '../ranch/ranch'
import { harvestGrade, plantingPlan, seedOutput, SEED_BATCH } from '../fields/production'
import { nightsLeft, seedsInSeason } from '../fields/fields'
import { CROPS, growsIn } from '../fields/crops'
import { needsWater } from '../fields/plantables'
import { mealsNeeded, pantryMeals, plainBatch } from './food'
import { LOAD_SIZE, loadsLeft, loadsToday, nextStationLoad } from '../gathering/stations'
import { FISHING_SPOTS, FOREST_AREAS, STATIONS } from '../gathering/ids'
import { FULL_HAULS, haulsToday } from '../gathering/hauls'
import { digFloor } from '../gathering/digs'
import { cropBaseGrade, cropGoodId, cropSeedId } from '../goods/ids'
import { goodCount, parseStockKey } from '../save/warehouse'
import { seedForTile, taskLock, workKey } from './farmhands'
import { surplusCrate } from './production'
import type { SchedulePack } from '../town/town'

export type WorkNeed = { task: FarmTask; priority: number; count: number; need: string; blocked?: true; optional?: true }
export type WorkTotals = Partial<Record<TaskKind, number>>
export type WorkDayRecord = { day: number; allocated: number; covered: WorkTotals; missing: WorkTotals }

export function plotWork(kind: TileTaskKind, plot: number, tiles: number[]): FarmTask {
  return { kind, tiles, ...(plot ? { plot } : {}) }
}

/** All kinds and locations. Specific orders already on a board also stay visible. */
export function workCatalog(save: FarmSave): FarmTask[] {
  const fields = save.fields.plots.flatMap(({ tiles }, plot) => {
    const all = tiles.map((_, i) => i)
    return (['harvest', 'till', 'plant', 'water'] as const).map(kind => plotWork(kind, plot, all))
  })
  const tasks: FarmTask[] = [
    ...fields,
    ...RANCH_HOMES.map(home => ({ kind: 'care', home } as const)),
    { kind: 'cook' },
    ...STATIONS.map(station => ({ kind: 'load', station } as const)),
    ...FOREST_AREAS.flatMap(area => [{ kind: 'forage', area }, { kind: 'chop', area }] as const),
    ...FISHING_SPOTS.map(spot => ({ kind: 'fish', spot } as const)),
    ...DIGS.map(dig => ({ kind: 'mine', dig } as const)),
    { kind: 'save-seed', crop: 'carrot', grade: cropBaseGrade('carrot'), improve: false, target: 9 },
    { kind: 'ship-surplus' },
  ]
  const unique = new Map(tasks.map(task => [workKey(task), task]))
  for (const uma of Object.values(save.roster)) {
    for (const task of uma.tasks ?? []) {
      const key = workKey(task)
      if (!unique.has(key) || task.kind === 'save-seed') unique.set(key, task)
    }
  }
  return [...unique.values()]
}

function ranchGaps(save: FarmSave, home: RanchHome): { hungry: number; canFeed: boolean; care: number } {
  const animals = animalsIn(save, home)
  const hungry = animals.filter(animal => !animal.fed).length
  const canFeed = save.ranch.silo > 0 || grassLock(save) === null && fieldTiles(save).some(tile => tile.ground === 'weeds')
  return { hungry, canFeed, care: animals.filter(animal => animal.ready || !animal.cared).length }
}

export function workNeeds(save: FarmSave, pack: SchedulePack | null, includeOptional = false): WorkNeed[] {
  const gaps: WorkNeed[] = []
  const add = (task: FarmTask, priority: number, count: number, need: string, blocked = false, optional = false) => {
    if (count > 0 && (!optional || includeOptional)) gaps.push({ task, priority, count, need, ...(blocked ? { blocked: true } : {}), ...(optional ? { optional: true } : {}) })
  }
  for (const home of RANCH_HOMES) {
    const task = { kind: 'care', home } as const
    if (taskLock(save, task)) continue
    const { hungry, canFeed, care } = ranchGaps(save, home)
    if (hungry) add(task, 0, hungry, hungry + ' to feed' + (canFeed ? '' : ' · needs fodder'), !canFeed && care === 0)
    else add(task, 4, care, care + ' to tend or collect from')
  }
  const meals = mealsNeeded(save, pack) - pantryMeals(save)
  const canCook = plainBatch(save) !== null
  add({ kind: 'cook' }, 1, meals, meals + ' meals short' + (canCook ? '' : ' · needs ingredients'), !canCook)

  const seeds = seedsInSeason(save)
  const { day } = save.calendar
  const nights = DAYS_PER_SEASON - dateOf(day, save.calendar).day + 1
  const nextSeason = dateOf(day + nights, save.calendar).season
  const marked = save.workshops.festival?.mark?.tile
  for (const [plot, { tiles }] of save.fields.plots.entries()) {
    const ripe: number[] = [], dry: number[] = [], empty: number[] = [], managed: number[] = [], spare: number[] = []
    let supplied = 0
    tiles.forEach((tile, i) => {
      const index = fieldIndex(plot, i)
      if (tile.ready && harvestGrade(save, tile, index, 10) !== null) ripe.push(i)
      if (tile.crop && needsWater(tile) && (index === marked || CROPS[tile.crop].woody
        || growsIn(tile.crop, nextSeason) || nightsLeft(tile) <= nights)) dry.push(i)
      if (tile.crop) return
      const plan = plantingPlan(save, index)
      if (plan === null || plan?.crop === null) return
      if (isOvergrown(tile.ground) || tile.ground === 'clear') (plan?.crop ? managed : spare).push(i)
      if (tile.ground !== 'tilled') return
      empty.push(i)
      const seed = seedForTile(save, index, undefined, seeds.filter(seed => seed.count > 0))
      if (seed) { seed.count--; supplied++ }
    })
    add(plotWork('harvest', plot, ripe), 2, ripe.length, ripe.length + ' ripe tiles')
    add(plotWork('water', plot, dry), 3, dry.length, dry.length + ' to water')
    add(plotWork('till', plot, managed), 5, managed.length, managed.length + ' planned tiles to prepare')
    add(plotWork('plant', plot, empty), 6, empty.length, supplied + '/' + empty.length + ' tiles have suitable seeds', supplied === 0)
    if (!managed.length) add(plotWork('till', plot, spare), 10, spare.length, spare.length + ' tiles can be prepared', false, true)
  }

  for (const station of STATIONS) {
    const task = { kind: 'load', station } as const
    if (taskLock(save, task) || !loadsLeft(save, station)) continue
    const load = nextStationLoad(save, station, LOAD_SIZE)
    const targets = save.farm.stationPlans?.[station]
    const missing = targets?.filter(({ output, target }) =>
      target > goodCount(save.items, output) + loadsToday(save, station)
        .filter(row => parseStockKey(row.item)?.id === output).reduce((sum, row) => sum + row.count, 0)).length ?? 0
    if (missing) add(task, 7, missing, load ? 'Production targets need another load' : 'Production targets need ingredients', !load)
    else if (load?.batches) add(task, 11, 1, 'Inputs ready for a load', false, true)
  }

  const seedOrders = new Map(Object.values(save.roster).flatMap(uma => uma.tasks ?? [])
    .filter(task => task.kind === 'save-seed').map(task => [workKey(task), task]))
  const seedPresets = [...seedOrders.values()]
  const basicSeed = { kind: 'save-seed', crop: 'carrot', grade: cropBaseGrade('carrot'), improve: false, target: 9 } as const
  if (includeOptional && !seedOrders.has(workKey(basicSeed))) seedPresets.push(basicSeed)
  for (const task of seedPresets) {
    const crop = task.crop ?? 'carrot'
    const output = seedOutput(save, crop, task.grade, task.improve)
    const input = cropGoodId(crop, task.grade)
    if (!output || !input) continue
    const needed = task.target - goodCount(save.items, cropSeedId(crop, true, output))
    const held = goodCount(save.items, input) - (save.farm.reserves?.[input] ?? 0)
    const ordered = seedOrders.has(workKey(task))
    if (ordered || held > 0) add(task, 8, needed, held > 0 ? Math.min(needed, held, SEED_BATCH) + ' seeds in the next batch' : 'Needs produce of that grade', held <= 0, !ordered)
  }

  const surplus = surplusCrate(save).reduce((sum, line) => sum + line.count, 0)
  add({ kind: 'ship-surplus' }, 9, surplus, surplus + ' surplus goods ready to ship')
  if (includeOptional) {
    for (const area of FOREST_AREAS) {
      const task = { kind: 'forage', area } as const
      if (taskLock(save, task)) continue
      const left = FULL_HAULS - haulsToday(save, area)
      const note = left + ' full hauls left · shared with '
      add(task, 12, left, note + 'chopping', false, true)
      add({ kind: 'chop', area }, 12, left, note + 'foraging', false, true)
    }
    for (const spot of FISHING_SPOTS) {
      const task = { kind: 'fish', spot } as const
      if (taskLock(save, task)) continue
      const left = FULL_HAULS - haulsToday(save, spot)
      add(task, 12, left, left + ' full hauls left', false, true)
    }
    for (const task of workCatalog(save)) {
      if (task.kind !== 'mine' || taskLock(save, task)) continue
      const left = FULL_HAULS - haulsToday(save, task.dig)
      const floor = task.floor ?? digFloor(save.places[task.dig])
      add(task, 12, left, left + ' full faces left · floor ' + floor + ' · shared across floors', false, true)
    }
  }
  return gaps.sort((a, b) => a.priority - b.priority || b.count - a.count)
}

export function workDayRecord(save: FarmSave, lines: readonly FarmhandLine[], needs: readonly WorkNeed[]): WorkDayRecord {
  const covered: WorkTotals = {}
  const missing: WorkTotals = {}
  for (const row of lines) {
    for (const kind of Object.keys(row.done) as TaskKind[]) {
      covered[kind] = (covered[kind] ?? 0) + 1
    }
  }
  for (const { task, optional, blocked } of needs) {
    if (!optional && !blocked) missing[task.kind] = (missing[task.kind] ?? 0) + 1
  }
  return { day: save.calendar.day, allocated: lines.reduce((sum, row) => sum + row.tasks + (row.automatic ?? 0) + (row.forge ?? 0), 0), covered, missing }
}

export function recordWorkDay(save: FarmSave, lines: readonly FarmhandLine[], pack: SchedulePack | null): FarmSave {
  const row = workDayRecord(save, lines, workNeeds(save, pack))
  const recent = (save.farm.workHistory ?? []).filter(entry => entry.day < row.day && entry.day > row.day - DAYS_PER_YEAR)
  return { ...save, farm: { ...save.farm, workHistory: [...recent, row] } }
}
