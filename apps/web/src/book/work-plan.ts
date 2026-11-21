import {
  animalsIn, aptitudeOf, fieldTiles, grassLock, harvestGrade, isTileTask, MAX_TASKS, mealsNeeded, needsWater, nextStationLoad,
  pantryMeals, plainBatch, RANCH_HOMES, STATIONS, taskAptitude, taskLock, taskPlot,
  type FarmSave, type FarmTask, type HandsTonight, type RanchHome, type StoryPack, type TalentOf, type TileTaskKind,
} from '@farm/domain'
import { taskWords } from './board-words'

export type JobPreset = { key: string; task: FarmTask; label: string }
type Gap = { job: JobPreset; priority: number; count: number; need: string }
export type WorkSuggestion = Gap & { worker: string | null }

function plotJob(kind: TileTaskKind, plot: number, size: number): FarmTask {
  return { kind, tiles: Array.from({ length: size }, (_, i) => i), ...(plot ? { plot } : {}) }
}

function job(task: FarmTask, plots: number): JobPreset {
  return { key: JSON.stringify(task), task, label: taskWords(task, plots) }
}

export function workPresets(save: FarmSave): JobPreset[] {
  const fields = save.fields.plots.flatMap(({ tiles }, plot) =>
    (['harvest', 'water', 'plant', 'till'] as const).map(kind => plotJob(kind, plot, tiles.length)))
  const other: FarmTask[] = [
    ...RANCH_HOMES.map((home): FarmTask => ({ kind: 'care', home })),
    { kind: 'cook' },
    ...STATIONS.map((station): FarmTask => ({ kind: 'load', station })),
    { kind: 'forage', area: 'woods' }, { kind: 'chop', area: 'woods' }, { kind: 'fish', spot: 'pond' },
    { kind: 'mine', dig: 'mine' }, { kind: 'mine', dig: 'quarry' }, { kind: 'ship-surplus' },
  ]
  return [...fields, ...other].filter(task => !taskLock(save, task)).map(task => job(task, save.fields.plots.length))
}

export function hasPreset(tasks: readonly FarmTask[], task: FarmTask): boolean {
  return tasks.some(existing => {
    if (isTileTask(existing) && isTileTask(task)) {
      return existing.kind === task.kind && taskPlot(existing) === taskPlot(task)
        && (existing.kind !== 'plant' || (task.kind === 'plant' && existing.crop === task.crop))
        && existing.tiles.length === task.tiles.length && existing.tiles.every((tile, i) => tile === task.tiles[i])
    }
    return JSON.stringify(existing) === JSON.stringify(task)
  })
}

function ranchGaps(save: FarmSave, home: RanchHome): { hungry: number; care: number } {
  const animals = animalsIn(save, home)
  const hungry = animals.filter(animal => !animal.fed).length
  const canFeed = save.ranch.silo > 0 || grassLock(save) === null && fieldTiles(save).some(tile => tile.ground === 'weeds')
  return { hungry: canFeed ? hungry : 0, care: animals.filter(animal => animal.ready || !animal.cared).length }
}

export function workSuggestions(before: FarmSave, forecast: HandsTonight, pack: StoryPack | null, talentOf: TalentOf): WorkSuggestion[] {
  const save = forecast.save
  const gaps: Gap[] = []
  const add = (task: FarmTask, priority: number, count: number, need: string) => {
    if (count > 0) gaps.push({ job: job(task, save.fields.plots.length), priority, count, need })
  }
  for (const home of RANCH_HOMES) {
    const task = { kind: 'care', home } as const
    if (taskLock(save, task)) continue
    const { hungry, care } = ranchGaps(save, home)
    if (hungry) add(task, 0, hungry, `${hungry} to feed`)
    else add(task, 4, care, `${care} to tend or collect from`)
  }
  const meals = mealsNeeded(save, pack) - pantryMeals(save)
  if (plainBatch(save)) add({ kind: 'cook' }, 1, meals, `${meals} meals short`)
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
  const workers = forecast.lines.filter(line => line.spent < line.actions && (before.roster[line.id]?.tasks?.length ?? 0) < MAX_TASKS)
  return gaps.sort((a, b) => a.priority - b.priority || b.count - a.count).map(gap => {
    const aptitude = taskAptitude(gap.job.task)
    const strength = (id: string) => aptitude ? aptitudeOf(before.roster[id]!, aptitude, activity => talentOf(id, activity)).level : 0
    const candidate = workers.filter(line => !hasPreset(before.roster[line.id]?.tasks ?? [], gap.job.task))
      .sort((a, b) => (b.actions - b.spent) - (a.actions - a.spent) || strength(b.id) - strength(a.id))[0]
    return { ...gap, worker: candidate?.id ?? null }
  })
}
