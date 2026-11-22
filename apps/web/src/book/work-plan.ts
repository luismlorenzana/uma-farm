import {
  deliverForge, handsTonight, MEAL_KEEPS, newTodayV4, aptitudeOf, isTileTask, MAX_TASKS, RANCH_HOMES, STATIONS, taskAptitude, taskLock, taskPlot, workNeeds,
  type FarmSave, type FarmTask, type HandsTonight, type StoryPack, type TalentOf, type TileTaskKind,
} from '@farm/domain'
import { taskWords } from './board-words'

export function forecastCrewOn(save: FarmSave, day: number, pack: StoryPack | null, talents: TalentOf) {
  const snapshot = day === save.calendar.day ? save : deliverForge({
    ...save, calendar: { ...save.calendar, day }, today: newTodayV4(),
    fields: { plots: save.fields.plots.map(plot => ({ ...plot, tiles: plot.tiles.map(tile => ({ ...tile, watered: false })) })) },
    ranch: { ...save.ranch, animals: save.ranch.animals.map(animal => ({ ...animal, fed: false, cared: false })) },
    farm: { ...save.farm, pantry: save.farm.pantry.filter(lot => day - lot.day < MEAL_KEEPS) },
  })
  const forecast = handsTonight(snapshot, snapshot, talents, pack)
  const needs = workNeeds(forecast.save, pack)
  return { ...forecast, snapshot, needs }
}

export type JobPreset = { key: string; task: FarmTask; label: string }
type Gap = { job: JobPreset; priority: number; count: number; need: string; blocked?: true }
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

export function workSuggestions(before: FarmSave, forecast: HandsTonight, pack: StoryPack | null, talentOf: TalentOf): WorkSuggestion[] {
  const gaps: Gap[] = workNeeds(forecast.save, pack).map(({ task, ...need }) => ({ ...need, job: job(task, before.fields.plots.length) }))
  const workers = (before.today.crew ? [] : forecast.lines).filter(line => line.spent < line.actions && (before.roster[line.id]?.tasks?.length ?? 0) < MAX_TASKS)
  return gaps.sort((a, b) => a.priority - b.priority || b.count - a.count).map(gap => {
    const aptitude = taskAptitude(gap.job.task)
    const strength = (id: string) => aptitude ? aptitudeOf(before.roster[id]!, aptitude, activity => talentOf(id, activity)).level : 0
    const candidate = gap.blocked ? null : workers.filter(line => !hasPreset(before.roster[line.id]?.tasks ?? [], gap.job.task))
      .sort((a, b) => (b.actions - b.spent) - (a.actions - a.spent) || strength(b.id) - strength(a.id))[0]
    return { ...gap, worker: candidate?.id ?? null }
  })
}
