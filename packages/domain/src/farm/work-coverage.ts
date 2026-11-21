import { fieldTiles, type FarmSave, RANCH_HOMES, type FarmTask, type RanchHome, type TaskKind, type TileTaskKind } from '../save/v4'
import type { FarmhandLine } from '../night/summary'
import { DAYS_PER_YEAR } from './calendar'
import { animalsIn, grassLock } from '../ranch/ranch'
import { harvestGrade } from '../fields/production'
import { needsWater } from '../fields/plantables'
import { mealsNeeded, pantryMeals, plainBatch } from './food'
import { nextStationLoad } from '../gathering/stations'
import { STATIONS } from '../gathering/ids'
import { taskLock } from './farmhands'
import type { SchedulePack } from '../town/town'

export type WorkNeed = { task: FarmTask; priority: number; count: number; need: string; blocked?: true }
export type WorkTotals = Partial<Record<TaskKind, number>>
export type WorkDayRecord = { day: number; allocated: number; covered: WorkTotals; missing: WorkTotals }

function plotJob(kind: TileTaskKind, plot: number, size: number): FarmTask {
  return { kind, tiles: Array.from({ length: size }, (_, i) => i), ...(plot ? { plot } : {}) }
}

function ranchGaps(save: FarmSave, home: RanchHome): { hungry: number; canFeed: boolean; care: number } {
  const animals = animalsIn(save, home)
  const hungry = animals.filter(animal => !animal.fed).length
  const canFeed = save.ranch.silo > 0 || grassLock(save) === null && fieldTiles(save).some(tile => tile.ground === 'weeds')
  return { hungry, canFeed, care: animals.filter(animal => animal.ready || !animal.cared).length }
}

export function workNeeds(save: FarmSave, pack: SchedulePack | null): WorkNeed[] {
  const gaps: WorkNeed[] = []
  const add = (task: FarmTask, priority: number, count: number, need: string, blocked = false) => {
    if (count > 0) gaps.push({ task, priority, count, need, ...(blocked ? { blocked: true } : {}) })
  }
  for (const home of RANCH_HOMES) {
    const task = { kind: 'care', home } as const
    if (taskLock(save, task)) continue
    const { hungry, canFeed, care } = ranchGaps(save, home)
    if (hungry) add(task, 0, hungry, `${hungry} to feed${canFeed ? '' : ' · needs fodder'}`, !canFeed)
    else add(task, 4, care, `${care} to tend or collect from`)
  }
  const meals = mealsNeeded(save, pack) - pantryMeals(save)
  const canCook = plainBatch(save) !== null
  add({ kind: 'cook' }, 1, meals, `${meals} meals short${canCook ? '' : ' · needs ingredients'}`, !canCook)
  let offset = 0
  for (const [plot, { tiles }] of save.fields.plots.entries()) {
    const ripe = tiles.filter((tile, i) => tile.ready && harvestGrade(save, tile, offset + i, 10) !== null).length
    const dry = tiles.filter(needsWater).length
    add(plotJob('harvest', plot, tiles.length), 2, ripe, `${ripe} ripe`)
    add(plotJob('water', plot, tiles.length), 3, dry, `${dry} to water`)
    offset += tiles.length
  }
  for (const station of STATIONS) {
    if (save.farm.stationPlans?.[station] && nextStationLoad(save, station, 1)) add({ kind: 'load', station }, 5, 1, 'Target needs another load')
  }
  return gaps.sort((a, b) => a.priority - b.priority || b.count - a.count)
}

export function workDayRecord(save: FarmSave, lines: readonly FarmhandLine[], needs: readonly WorkNeed[]): WorkDayRecord {
  const covered: WorkTotals = {}
  const missing: WorkTotals = {}
  for (const row of lines) {
    for (const kind of Object.keys(row.done) as TaskKind[]) {
      // A productive order can collect an item or cast a line without also reporting a unit of care or a catch.
      covered[kind] = (covered[kind] ?? 0) + 1
    }
  }
  for (const { task } of needs) missing[task.kind] = (missing[task.kind] ?? 0) + 1
  return { day: save.calendar.day, allocated: lines.reduce((sum, row) => sum + row.tasks, 0), covered, missing }
}

export function recordWorkDay(save: FarmSave, lines: readonly FarmhandLine[], pack: SchedulePack | null): FarmSave {
  const row = workDayRecord(save, lines, workNeeds(save, pack))
  const recent = (save.farm.workHistory ?? []).filter(entry => entry.day < row.day && entry.day > row.day - DAYS_PER_YEAR)
  return { ...save, farm: { ...save.farm, workHistory: [...recent, row] } }
}
