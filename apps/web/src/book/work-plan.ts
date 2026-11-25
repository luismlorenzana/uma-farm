import {
  deliverForge, FULL_HAULS, haulsToday, handsTonight, MEAL_KEEPS, newTodayV4, aptitudeOf, isTileTask, MAX_TASKS, taskAptitude, taskLock, taskPlot, workCatalog, workKey, workNeeds,
  type FarmSave, type FarmTask, type HandsTonight, type StoryPack, type TalentOf, type WorkNeed,
} from '@farm/domain'
import { taskWords } from './board-words'

export function forecastCrewOn(save: FarmSave, day: number, pack: StoryPack | null, talents: TalentOf, previewBookings?: ReadonlySet<string>) {
  const snapshot = day === save.calendar.day ? save : deliverForge({
    ...save, calendar: { ...save.calendar, day }, today: newTodayV4(),
    fields: { plots: save.fields.plots.map(plot => ({ ...plot, tiles: plot.tiles.map(tile => ({ ...tile, watered: false })) })) },
    ranch: { ...save.ranch, animals: save.ranch.animals.map(animal => ({ ...animal, fed: false, cared: false })) },
    farm: { ...save.farm, pantry: save.farm.pantry.filter(lot => day - lot.day < MEAL_KEEPS) },
  })
  const forecast = handsTonight(snapshot, snapshot, talents, pack, previewBookings)
  const needs = workNeeds(forecast.save, pack, true)
  return { ...forecast, snapshot, needs }
}

export function droppedOrders(before: HandsTonight, after: HandsTonight): { key: string; actions: number }[] {
  const tally = (shift: HandsTonight) => {
    const counts = new Map<string, number>()
    for (const row of shift.jobs ?? []) counts.set(row.key, (counts.get(row.key) ?? 0) + row.actions)
    return counts
  }
  const actual = tally(after)
  return [...tally(before)].flatMap(([key, count]) => {
    const actions = count - (actual.get(key) ?? 0)
    return actions > 0 ? [{ key, actions }] : []
  })
}

export type JobPreset = { key: string; task: FarmTask; label: string }
export type WorkSuggestion = WorkNeed & { job: JobPreset; worker: string | null }
export type WorkRow = JobPreset & {
  scheduled: string[]
  worked: { id: string; actions: number }[]
  need?: WorkNeed
  lock: string | null
  idle?: string
}

export const orderLink = (key: string, day?: number): string =>
  '/book?view=work&order=' + encodeURIComponent(key) + (day === undefined ? '' : '&workDay=' + day)

export function plannedWorkDay(search: string, today: number): number | undefined {
  const day = Number(new URLSearchParams(search).get('workDay'))
  return Number.isSafeInteger(day) && day >= 1 && day <= today + 365 * 5 ? day : undefined
}

function job(task: FarmTask, plots: number): JobPreset {
  return { key: workKey(task), task, label: taskWords(task, plots) }
}

export function workPresets(save: FarmSave): JobPreset[] {
  return workCatalog(save).filter(task => !taskLock(save, task)).map(task => job(task, save.fields.plots.length))
}

/** An existing broader plot order already covers these tiles. */
export function hasPreset(tasks: readonly FarmTask[], task: FarmTask): boolean {
  return tasks.some(existing => {
    if (isTileTask(existing) && isTileTask(task)) {
      return existing.kind === task.kind && taskPlot(existing) === taskPlot(task)
        && (existing.kind !== 'plant' || (task.kind === 'plant' && existing.crop === task.crop))
        && task.tiles.every(tile => existing.tiles.includes(tile))
    }
    return JSON.stringify(existing) === JSON.stringify(task)
  })
}

export function workRows(before: FarmSave, forecast: HandsTonight, needs: readonly WorkNeed[]): WorkRow[] {
  const jobs = workCatalog(before)
  const keys = new Set(jobs.map(workKey))
  for (const { key } of forecast.jobs ?? []) {
    if (keys.has(key)) continue
    const floor = /^mine:(mine|quarry):(\d+)$/.exec(key)
    if (!floor) continue
    keys.add(key)
    jobs.push({ kind: 'mine', dig: floor[1] as 'mine' | 'quarry', floor: Number(floor[2]) })
  }
  const gaps = new Map(needs.map(need => [workKey(need.task), need]))
  const scheduled = new Map<string, Set<string>>()
  const worked = new Map<string, WorkRow['worked']>()
  for (const line of forecast.lines) {
    for (const task of before.today.crew ? [] : before.roster[line.id]?.tasks ?? []) {
      const key = workKey(task)
      if (!scheduled.has(key)) scheduled.set(key, new Set())
      scheduled.get(key)!.add(line.id)
    }
  }
  for (const order of forecast.jobs ?? []) {
    if (!worked.has(order.key)) worked.set(order.key, [])
    worked.get(order.key)!.push(order)
  }
  return jobs.map(task => {
    const preset = job(task, before.fields.plots.length)
    const spot = task.kind === 'forage' || task.kind === 'chop' ? task.area
      : task.kind === 'fish' ? task.spot : task.kind === 'mine' ? task.dig : null
    const idle = spot && haulsToday(forecast.save, spot) >= FULL_HAULS
      ? task.kind === 'mine' ? 'Full faces used · further digging gives fewer finds' : 'Full hauls used · further work gives thin hauls'
      : undefined
    return { ...preset, idle, scheduled: [...scheduled.get(preset.key) ?? []], worked: worked.get(preset.key) ?? [],
      need: gaps.get(preset.key), lock: taskLock(before, task) }
  })
}

export function workSuggestions(before: FarmSave, forecast: HandsTonight, gaps: readonly WorkNeed[], talentOf: TalentOf): WorkSuggestion[] {
  const workers = (before.today.crew ? [] : forecast.lines).filter(line => line.spent < line.actions && (before.roster[line.id]?.tasks?.length ?? 0) < MAX_TASKS)
  return gaps.map(gap => {
    const preset = job(gap.task, before.fields.plots.length)
    const aptitude = taskAptitude(gap.task)
    const strength = (id: string) => aptitude ? aptitudeOf(before.roster[id]!, aptitude, activity => talentOf(id, activity)).level : 0
    const candidate = gap.blocked ? null : workers.filter(line => !hasPreset(before.roster[line.id]?.tasks ?? [], gap.task))
      .sort((a, b) => (b.actions - b.spent) - (a.actions - a.spent) || strength(b.id) - strength(a.id))[0]
    return { ...gap, job: preset, worker: candidate?.id ?? null }
  })
}
