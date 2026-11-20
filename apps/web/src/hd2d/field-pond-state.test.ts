import {
  clearPlot, DAYS_PER_SEASON, FARM_RANK_POINTS, FIELD_TILES, fieldCounts, handsTonight, handsWorking, newLove, newRosterUma,
  newSave, plantTile, runNight, setTasks, talentsD, tillTile, waterTile, type FarmSave, type FarmTask,
} from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { castPack } from '../../../../packages/domain/src/story/authored.fixture'
import { fieldPondState, visibleHands } from './field-pond-state'

const AT = '2026-11-20T12:00:00.000Z'
const fresh = () => ({ ...newSave('f103-review', AT), farmer: { name: 'Robin' } })
const view = (save: FarmSave) => fieldPondState(save, null, talentsD)

describe('the Field and Pond save projection', () => {
  it('reads the opening land, wet seeds and the first ripe carrot from real farm turns', () => {
    let save = fresh()
    const dayOne = view(save)
    expect(dayOne.tiles.map(({ ground }) => ground)).toEqual(save.fields.plots[0]!.tiles.map(({ ground }) => ground))
    expect(dayOne.tiles).toHaveLength(FIELD_TILES)
    expect(dayOne.tiles.every(({ crop }) => crop === null)).toBe(true)
    expect(visibleHands(dayOne)).toEqual([])

    save = plantTile(tillTile(save, 0), 0, 'seed-carrot')
    expect(view(save).tiles[0]).toMatchObject({ crop: 'carrot', look: 'seed', watered: false })
    for (let day = 0; day < 4; day++) {
      save = waterTile(save, 0)
      expect(view(save).tiles[0]?.watered).toBe(true)
      save = runNight(save, {})
    }
    expect(view(save)).toMatchObject({ season: 'spring', counts: { ripe: 1 }, lastNight: true })
    expect(view(save).tiles[0]).toMatchObject({ crop: 'carrot', look: 'ripe' })
  })

  it('keeps the plot miniature and total counts in sync as the farm grows and crosses a season', () => {
    const base = fresh()
    let save: FarmSave = {
      ...base, gold: 20_000, farm: { ...base.farm, points: FARM_RANK_POINTS[3]! },
      calendar: { day: DAYS_PER_SEASON },
    }
    save = clearPlot(save, 1)
    expect(view(save)).toMatchObject({ plots: 2, counts: fieldCounts(save) })
    expect(view(save).tiles).toHaveLength(FIELD_TILES)
    const tomorrow = runNight(save, {})
    expect(view(tomorrow)).toMatchObject({ season: 'summer', dusk: false, lastNight: true })
  })

  it.each([10, 20, 50])('uses the work rota and the morning report with %i farmhands', (size) => {
    const ids = Array.from({ length: size }, (_, i) => String(9_750_001 + i))
    const story = castPack(ids)
    const base = fresh()
    let save: FarmSave = {
      ...base, gold: 100_000, calendar: { day: 3 },
      roster: Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1 }])),
      love: Object.fromEntries(ids.map((id) => [id, newLove()])),
    }
    const jobs: readonly FarmTask[] = [{ kind: 'forage', area: 'woods' }, { kind: 'fish', spot: 'pond' }]
    for (const [i, id] of ids.entries()) save = setTasks(save, id, [jobs[i % jobs.length]!])
    const projection = fieldPondState(save, story, talentsD)
    const hands = [...projection.crew.forest, ...projection.crew.fishery]
    const forecast = handsTonight(save, save, talentsD, story)
    const madeAHaul = forecast.lines.filter(({ done }) => done.forage || done.fish).map(({ id }) => id)
    const working = handsWorking(save, story)
    expect(hands.length).toBeGreaterThan(2)
    expect(hands.every(({ id }) => working.includes(id))).toBe(true)
    expect(hands.map(({ id }) => id).sort()).toEqual(madeAHaul.sort())
    expect(visibleHands(projection).length).toBeLessThanOrEqual(2)

    const worked = runNight(save, { story, talentOf: talentsD })
    const report = fieldPondState(worked, story, talentsD)
    expect(report.lastNight).toBe(true)
    expect([...report.crew.forest, ...report.crew.fishery]).toEqual(hands)
    expect(save.summary).toBeNull()

    const changed = setTasks(save, hands[0]!.id, [])
    expect(Object.values(fieldPondState(changed, story, talentsD).crew).flat().map(({ id }) => id)).not.toContain(hands[0]!.id)
  })
})
