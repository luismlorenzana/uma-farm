import { describe, expect, it } from 'vitest'
import { forgeState } from '../forge/state'
import { finishLoads } from '../gathering/stations'
import { newRosterUma, newSave, newTodayV4, type FarmSave } from '../save/v4'
import { goodCount } from '../save/warehouse'
import { heldFor, payBuild, raiseBuilds } from './builds'
import { handsTonight } from './farmhands'
import { surplusStock } from './production'
import { automaticLumberGoal, crewStationTargets, crewSupplyJobs, lumberGoal } from './supply-goals'
import { talentsD } from './talents'

function farm() {
  const save = newSave('lumber-test', '2026-11-01T00:00:00.000Z')
  const hand = { ...newRosterUma(1), farmhand: 1, autoWork: true as const }
  return {
    ...save, calendar: { day: 2 }, gold: 4380,
    farm: { ...save.farm, points: 531 },
    roster: Object.fromEntries(Array.from({ length: 20 }, (_, index) => [String(81000 + index), hand])),
    items: { ...save.items, 'pine-log': [20, 0, 0, 0, 0], 'birch-log': [6, 0, 0, 0, 0] },
  } satisfies FarmSave
}

const logs = (save: FarmSave) => heldFor(save.items, { family: 'woods', refined: false })

describe('automatic project lumber', () => {
  it('gathers and protects mixed logs before the owner orders the Sawmill', () => {
    let save: FarmSave = farm()
    expect(lumberGoal(save)).toMatchObject({ key: 'build:sawmill', gold: 1500, lines: [{ held: 26, count: 40 }] })
    expect(surplusStock(save, 'pine-log').protectedStock).toBe(20)
    expect(surplusStock(save, 'birch-log').protectedStock).toBe(6)

    const first = handsTonight(save, save, talentsD, null)
    expect(first.jobs).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'chop:woods' })]))
    expect(logs(first.save)).toBeGreaterThan(26)
    expect(first.save.farm.builds).toEqual([])
    save = first.save
    for (let day = 3; day <= 10 && logs(save) < 40; day++) {
      const next = { ...save, calendar: { day }, today: newTodayV4() }
      save = handsTonight(next, next, talentsD, null).save
    }
    expect(logs(save)).toBeGreaterThanOrEqual(40)
    expect(save.buildings.sawmill).toBeUndefined()
    expect(crewSupplyJobs(save)).toEqual([])
    const paid = payBuild(save, 'sawmill')
    expect(lumberGoal(paid)).toBeUndefined()
    expect(lumberGoal(raiseBuilds(paid).save)?.key).toBe('build:mine')
  })

  it('loads the Sawmill and counts, protects and stops at the aggregate plank target', () => {
    const base = farm()
    const save: FarmSave = {
      ...base, buildings: { ...base.buildings, sawmill: 1 },
      items: { ...base.items, 'pine-plank': [47, 0, 0, 0, 0], 'birch-plank': [10, 0, 0, 0, 0] },
    }
    expect(crewStationTargets(save, 'sawmill')).toEqual([{ output: 'pine-plank', target: 50 }])
    const shift = handsTonight(save, save, talentsD, null)
    expect(shift.jobs).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'load:sawmill' })]))
    expect(shift.save.loads.sawmill).toEqual([{ item: 'pine-plank@1', count: 3 }])
    expect(lumberGoal(shift.save)?.lines[0]).toMatchObject({ count: 60, held: 57, queued: 3 })
    const ready = finishLoads(shift.save).save
    expect(goodCount(ready.items, 'pine-plank')).toBe(50)
    expect(surplusStock(ready, 'pine-plank').available).toBe(0)
    expect(surplusStock(ready, 'birch-plank').available).toBe(0)
    expect(crewSupplyJobs(ready)).toEqual([])
    expect(crewStationTargets(ready, 'sawmill')).toBeUndefined()
    expect(ready.farm.builds).toEqual([])
  })

  it('respects a crew goal the owner assigned and resumes after it disappears', () => {
    const save = farm()
    const pinned: FarmSave = {
      ...save, farm: { ...save.farm, projectPin: 'mine' },
      forge: { ...forgeState(save), crewGoal: 'build:mine' },
    }
    expect(automaticLumberGoal(pinned)).toBeUndefined()
    const cleared: FarmSave = { ...pinned, farm: save.farm }
    expect(automaticLumberGoal(cleared)?.key).toBe('build:sawmill')
    expect(crewSupplyJobs(cleared)).toContainEqual({ kind: 'chop', area: 'woods' })
  })
})
