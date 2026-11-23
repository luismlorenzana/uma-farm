import { buildLock } from './builds'
import { mealsNeeded, pantryMeals, plainBatch } from './food'
import { BUILD_PLACES } from './places'
import { workNeeds } from './work-coverage'
import { haulsToday } from '../gathering/hauls'
import { animalsIn } from '../ranch/ranch'
import type { FarmSave, FarmTask } from '../save/v4'
import type { SchedulePack } from '../town/town'

export type AutoJob = { task: FarmTask; priority: number }

/** Each shift reads the same priorities against the farm after its last action. */
export function autoJobs(save: FarmSave, pack: SchedulePack | null, spare: boolean): AutoJob[] {
  const gatheringFood = pantryMeals(save) < mealsNeeded(save, pack) && plainBatch(save) === null
  const project = save.farm.projectPin ? BUILD_PLACES.filter(place => place.id === save.farm.projectPin) : BUILD_PLACES
  const needLogs = spare && !gatheringFood && project.some(place => {
    const lock = buildLock(save, place.id)
    return lock?.by === 'short' && lock.goods.some(line => line.goods.family === 'woods' && !line.goods.refined)
  })
  const jobs = workNeeds(save, pack, spare || gatheringFood).flatMap(({ task, priority, blocked, optional }): AutoJob[] => {
    if (blocked) return []
    if (task.kind === 'care') {
      return [...(animalsIn(save, task.home).some(animal => !animal.fed)
        ? [{ task: { ...task, feedOnly: true as const }, priority: 0 }] : []), { task, priority: 5 }]
    }
    if (task.kind === 'water') return [{ task, priority: 1 }]
    if (task.kind === 'cook') return [{ task, priority: 2 }]
    if (task.kind === 'harvest') return [{ task, priority: 3 }]
    if (task.kind === 'ship-surplus' && save.farm.surplusSettings?.paused) return []
    if (!optional) return [{ task, priority }]
    // Clearing new ground, saving seeds and loading spare materials require a player order or plan.
    if (gatheringFood && (task.kind === 'forage' || task.kind === 'fish')) return [{ task, priority: 10 }]
    if (!spare) return []
    if (task.kind === 'chop' || task.kind === 'forage') {
      const preferred = needLogs ? 'chop' : haulsToday(save, task.area) % 2 === 0 ? 'forage' : 'chop'
      if (task.kind !== preferred) return []
      return [{ task, priority: needLogs ? 11 : 12 }]
    }
    return task.kind === 'fish' || task.kind === 'mine' ? [{ task, priority: 12 }] : []
  })
  return jobs.sort((a, b) => a.priority - b.priority)
}
