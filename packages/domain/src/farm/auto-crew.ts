import { buildLock } from './builds'
import { mealsNeeded, pantryMeals, plainBatch } from './food'
import { crewSupplyJobs } from './supply-goals'
import { BUILD_PLACES } from './places'
import { workNeeds, type WorkNeed } from './work-coverage'
import { dugCount } from '../gathering/digs'
import { haulsToday, reachList } from '../gathering/hauls'
import { animalsIn, readyIn } from '../ranch/ranch'
import { loadsToday } from '../gathering/stations'
import { FIELD_COLUMNS, type FarmSave, type FarmTask } from '../save/v4'
import type { SchedulePack } from '../town/town'

const GATHERING_ORDER = ['chop', 'forage', 'fish', 'mine'] as const
export type GatheringJob = (typeof GATHERING_ORDER)[number]
export type GatheringCounts = Record<GatheringJob, number>
export const gatheringJob = (kind: string): kind is GatheringJob =>
  kind === 'chop' || kind === 'forage' || kind === 'fish' || kind === 'mine'

type AutoJob = { task: FarmTask; priority: number; areaUse?: number; areaOrder?: number }
type ShiftBudget = { spare: boolean; reserved: boolean; canBatchWater: boolean; done: GatheringCounts }

const rowOf = (tile: number) => Math.floor(tile / FIELD_COLUMNS)

/** Finish sowing a partial seed row before watering it, so one watering action can serve both passes. */
function seedRow(save: FarmSave, needs: readonly WorkNeed[]): { plot: number; row: number } | undefined {
  for (const { task } of needs) {
    if (task.kind !== 'water') continue
    const plot = task.plot ?? 0
    const field = save.fields.plots[plot]
    const sow = needs.find(need => !need.blocked && need.task.kind === 'plant' && (need.task.plot ?? 0) === plot)?.task
    if (!field || sow?.kind !== 'plant') continue
    const planned = new Set(sow.tiles.map(rowOf))
    const established = new Set(task.tiles.filter(i => field.tiles[i]?.growth !== 0).map(rowOf))
    const tile = task.tiles.find(i => planned.has(rowOf(i)) && !established.has(rowOf(i)))
    if (tile !== undefined) return { plot, row: rowOf(tile) }
  }
}

/** Start with the deepest open reach, and rotate through the other reaches on alternating days. */
function gatheringAreaOrder(save: FarmSave, place: 'forest' | 'fishery') {
  const open = reachList(save, place).filter(row => !row.lock).sort((a, b) => b.rank - a.rank)
  const day = save.calendar.day
  const start = day % 2 === 0 ? Math.floor(day / 2 - 1) % Math.max(1, open.length) : 0
  return new Map(open.map(({ id }, i) => [id, (i - start + open.length) % open.length]))
}

export function autoJobs(save: FarmSave, pack: SchedulePack | null, budget: ShiftBudget): AutoJob[] {
  const gatheringFood = pantryMeals(save) < mealsNeeded(save, pack) && plainBatch(save) === null
  const canGather = budget.spare || gatheringFood
  const woodsOrder = canGather ? gatheringAreaOrder(save, 'forest') : null
  const fishOrder = canGather ? gatheringAreaOrder(save, 'fishery') : null
  const project = BUILD_PLACES.find(place => place.id === save.farm.projectPin)
  const projectLock = project ? buildLock(save, project.id) : null
  const needLogs = projectLock?.by === 'short' && projectLock.goods.some(line => line.goods.family === 'woods' && !line.goods.refined)
  const firstJob = (save.calendar.day + 2) % GATHERING_ORDER.length
  const eventPlan = save.eventJournal?.plan
  const festivalSoon = eventPlan && eventPlan.day >= save.calendar.day && eventPlan.day - save.calendar.day <= 7 ? eventPlan.id : null
  const needs = workNeeds(save, pack, canGather)
  const batching = budget.canBatchWater ? seedRow(save, needs) : undefined
  const jobs = needs.flatMap(({ task, priority, blocked, optional, count }): AutoJob[] => {
    if (blocked) return []
    if (task.kind === 'care') {
      return [...(animalsIn(save, task.home).some(animal => !animal.fed)
        ? [{ task: { ...task, feedOnly: true as const }, priority: 0 }] : []),
        { task, priority: readyIn(save, task.home) > 0 ? .75 : festivalSoon === 'animal-show' ? 4.5 : 5 }]
    }
    if (task.kind === 'water') {
      if (batching?.plot === (task.plot ?? 0)) {
        const waiting = task.tiles.filter(i => rowOf(i) === batching.row && save.fields.plots[batching.plot]?.tiles[i]?.growth === 0)
        const now = task.tiles.filter(i => !waiting.includes(i))
        return [
          ...(now.length ? [{ task: { ...task, tiles: now }, priority: now.length <= 3 ? .25 : 1 }] : []),
          { task: { ...task, tiles: waiting }, priority: 1.6 },
        ]
      }
      return [{ task, priority: count <= 3 ? .25 : 1 }]
    }
    if (task.kind === 'cook') return [{ task, priority: 2 }]
    if (task.kind === 'harvest') return [{ task, priority: 3 }]
    if (task.kind === 'load' && !optional && save.farm.stationPlans?.[task.station] && loadsToday(save, task.station).length === 0) return [{ task, priority: 3.5 }]
    if (task.kind === 'ship-surplus') return save.farm.surplusSettings?.paused ? [] : [{ task, priority: 4 }]
    if (task.kind === 'plant') {
      if (!budget.spare) return []
      if (batching?.plot === (task.plot ?? 0)) return [
        { task: { ...task, tiles: task.tiles.filter(i => rowOf(i) === batching.row) }, priority: 1.5 },
        { task, priority },
      ]
    }
    if (!optional) return [{ task, priority }]
    if (task.kind !== 'chop' && task.kind !== 'forage' && task.kind !== 'fish' && task.kind !== 'mine') return []
    if (task.kind === 'mine' && task.floor !== undefined) return []
    const food = gatheringFood && (task.kind === 'forage' || task.kind === 'fish')
    if (!budget.spare && !food) return []
    const base = budget.reserved ? .5 : food ? 9 : 12
    const completed = budget.done[task.kind]
    const turn = (GATHERING_ORDER.indexOf(task.kind) - firstJob + GATHERING_ORDER.length) % GATHERING_ORDER.length
    const pinnedLogs = needLogs && task.kind === 'chop'
    const eventFish = festivalSoon === 'fishing-derby' && task.kind === 'fish' && completed === 0
    const cupHaul = festivalSoon === 'harvest-cup' && (eventPlan?.stock.length ?? 0) < 3
      && (task.kind === 'fish' || task.kind === 'forage') && completed === 0
    const score = base + completed / 100 + turn / 1000 - (pinnedLogs ? .004 : 0) - (eventFish || cupHaul ? .006 : 0)
    if (task.kind === 'mine') return [{ task, priority: score, areaUse: haulsToday(save, task.dig), areaOrder: save.farm.counts[dugCount(task.dig)] ?? 0 }]
    if (task.kind === 'fish') return [{ task, priority: score, areaUse: haulsToday(save, task.spot), areaOrder: fishOrder?.get(task.spot) ?? 0 }]
    return [{ task, priority: score, areaUse: haulsToday(save, task.area), areaOrder: woodsOrder?.get(task.area) ?? 0 }]
  })
  if (budget.spare && !budget.reserved) jobs.push(...crewSupplyJobs(save).map(task => ({ task, priority: 7.5 })))
  return jobs.sort((a, b) => a.priority - b.priority || (a.areaUse ?? 0) - (b.areaUse ?? 0) || (a.areaOrder ?? 0) - (b.areaOrder ?? 0))
}
