import { describe, expect, it } from 'vitest'
import { actionsLeft } from '../farm/actions'
import { handsTonight, setTasks } from '../farm/farmhands'
import { plainBatch } from '../farm/food'
import { TALENT_D, type TalentOf } from '../farm/talents'
import { discovered } from '../goods/discovery'
import { carrotGood, carrotSeed } from '../goods/ids'
import { easeOf } from '../goods/market'
import { runNight } from '../night/end-day'
import { shipCrate, binSales } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type FarmSave } from '../save/v4'
import { addGoods, goodCount } from '../save/warehouse'
import { joinCast } from '../romance/meeting.fixture'
import { withOccasions } from '../story/occasions.fixture'
import { storyPackFrom } from '../story/pack'
import { farmDayOn } from '../town/town'
import { saveCropSeeds, setFieldPlan, setCropReserve } from './production'
import { harvestTile, plantTile, tileAt, tillTile, waterTile } from './fields'

const NOW = '2026-11-18T12:00:00.000Z'
const G1 = carrotGood(1)
const G2 = carrotGood(2)
const G3 = carrotGood(3)
const PACK = storyPackFrom(withOccasions())
const LEAD = '9000002'
const BACKUP = '9000001'
const talentOf: TalentOf = (id, activity) => id === LEAD && activity === 'farming' ? 7 : TALENT_D
const rows = [0, 1, 2]
const fresh = () => ({ ...newSave('carrot-pilot', NOW), farmer: { name: 'Robin' } })
const saveCarrotSeeds = (save: FarmSave, grade: number, improve: boolean, count: number, useReserved = false) =>
  saveCropSeeds(save, 'carrot', grade, improve, count, useReserved)

function advance(save: FarmSave, roster = false): FarmSave {
  const next = runNight(save, roster ? { talentOf, story: PACK } : {})
  return parseSaveV5(JSON.parse(JSON.stringify(next)))
}

function rosterFarm(): FarmSave {
  const save = joinCast({ ...fresh(), gold: 5000 }, PACK)
  const roster = { ...save.roster }
  for (const id of [LEAD, BACKUP]) roster[id] = { ...roster[id]!, farmhand: 1 }
  return { ...save, roster }
}

describe('F99 carrot pilot', () => {
  it('plays from starter seeds to a G2 carrot on Spring 9 by hand', () => {
    let save = fresh()
    expect(discovered(save, G1)).toBe(false)
    for (const tile of rows) save = waterTile(plantTile(tillTile(save, tile), tile, 'seed-carrot'), tile)
    expect(actionsLeft(save)).toBe(1)
    save = advance(save)
    for (let day = 2; day <= 4; day++) save = advance(rows.reduce((state, tile) => waterTile(state, tile), save))
    expect(save.calendar.day).toBe(5)
    save = rows.reduce((state, tile) => harvestTile(state, tile).save, save)
    expect(save.crops.carrot).toBe(3)
    expect(discovered(save, G1)).toBe(true)
    save = saveCarrotSeeds(save, 1, true, 1)
    expect(goodCount(save.items, G1)).toBe(2)
    expect(goodCount(save.items, carrotSeed(2))).toBe(1)
    expect(discovered(save, G2)).toBe(false)
    save = advance(waterTile(plantTile(save, 0, carrotSeed(2)), 0))
    for (let day = 6; day <= 8; day++) save = advance(waterTile(save, 0))
    expect(save.calendar.day).toBe(9)
    expect(tileAt(save, 0)).toMatchObject({ grade: 2, ready: true })
    save = harvestTile(save, 0).save
    expect(goodCount(save.items, G2)).toBe(1)
    const stars = save.items[G2]!.findIndex((n) => n > 0) + 1
    save = advance(shipCrate(save, [{ id: G2, stars, count: 1 }]))
    expect(goodCount(save.items, G2)).toBe(0)
    expect(discovered(save, G2)).toBe(true)
    expect(save.summary?.work).toContainEqual({ kind: 'discovery', id: G2 })
    expect(save.diary.shipped[G2]).toBe(1)
    expect(goodCount(save.items, 'seed-carrot')).toBe(6)
  })

  it('carries saved G3 seed through winter and harvests it the following Spring', () => {
    const staggered = [[0, 1, 2], [8, 9], [10]]
    const all = staggered.flat()
    let save = fresh()
    while (save.calendar.day <= 10) {
      const day = save.calendar.day
      for (const tile of staggered[day - 1] ?? []) save = plantTile(tillTile(save, tile), tile, 'seed-carrot')
      for (const tile of all) if (tileAt(save, tile).ready) save = harvestTile(save, tile).save
      if (day === 5) save = plantTile(saveCarrotSeeds(save, 1, true, 1), 0, carrotSeed(2))
      if (day === 6) {
        save = saveCarrotSeeds(save, 1, true, 2)
        for (const tile of [1, 2]) save = plantTile(save, tile, carrotSeed(2))
      }
      if (day === 10) {
        expect(save.crops.carrot).toBe(12)
        save = saveCarrotSeeds(save, 2, true, 1)
      }
      for (const tile of all) if (tileAt(save, tile).crop) save = waterTile(save, tile)
      save = advance(save)
    }
    expect(discovered(save, G3)).toBe(false)
    while (save.calendar.day < 49) save = advance(save)
    expect(goodCount(save.items, carrotSeed(3))).toBe(1)
    save = plantTile(save, 0, carrotSeed(3))
    for (let night = 0; night < 4; night++) save = advance(waterTile(save, 0))
    expect(tileAt(save, 0)).toMatchObject({ grade: 3, ready: true })
    save = harvestTile(save, 0).save
    expect(discovered(save, G3)).toBe(true)
    expect(goodCount(save.items, G3)).toBe(1)
  })

  it('lets a roster plant, water, and produce G2 across town days without player field actions', () => {
    const base = rosterFarm()
    let save: FarmSave = { ...base, farm: { ...base.farm, carrotRows: { '0:0': { grade: 1, harvestNext: true } } } }
    for (const id of [LEAD, BACKUP]) {
      save = setTasks(save, id, [{ kind: 'harvest', tiles: [0] }, { kind: 'till', tiles: [0] }, { kind: 'plant', tiles: [0] }, { kind: 'water', tiles: [0] }])
    }
    // The lead has enough aptitude on the first day, and only she can take the upgrade harvest.
    const before = structuredClone(save)
    const first = handsTonight(save, save, talentOf, PACK)
    expect(save).toEqual(before)
    expect(first.lines.map((line) => line.id)).toEqual([LEAD])
    expect(first.lines[0]?.done).toMatchObject({ till: 1, plant: 1, water: 1 })
    while (save.calendar.day < 5) {
      if (!farmDayOn(PACK, LEAD, save.calendar.day)) {
        const coverage = handsTonight(save, save, talentOf, PACK)
        expect(coverage.lines.map((line) => line.id)).toEqual([BACKUP])
        expect(coverage.lines[0]?.done.water).toBe(1)
      }
      expect(actionsLeft(save)).toBe(10)
      save = advance(save, true)
    }
    expect(tileAt(save, 0).ready).toBe(true)
    expect(handsTonight(save, save, talentOf, PACK).lines[0]?.done.harvest).toBeUndefined()
    save = advance(save, true)
    expect(tileAt(save, 0).ready).toBe(true)
    const preview = handsTonight(save, save, talentOf, PACK)
    expect(preview.made.find((made) => made.outfitId === LEAD)?.items[0]).toMatch(/^carrot-grade-2@/)
    save = advance(save, true)
    expect(goodCount(save.items, G2)).toBeGreaterThanOrEqual(1)
    expect(save.summary?.work).toContainEqual({ kind: 'discovery', id: G2 })
    expect(save.summary?.work.filter((line) => line.kind === 'farmhand')).toEqual(preview.lines)
    expect(discovered(save, G2)).toBe(true)
    expect(discovered(save, G3)).toBe(false)
  })

  it('shares one seed target across two Umas and protects the stock floor', () => {
    let save = rosterFarm()
    for (const tile of rows) save = waterTile(plantTile(tillTile(save, tile), tile, 'seed-carrot'), tile)
    save = advance(save, true)
    for (let day = 2; day <= 4; day++) save = advance(rows.reduce((state, tile) => waterTile(state, tile), save), true)
    save = rows.reduce((state, tile) => harvestTile(state, tile).save, save)
    save = setCropReserve(save, 'carrot', 1, 2)
    for (const id of [LEAD, BACKUP]) save = setTasks(save, id, [{ kind: 'save-seed', grade: 1, improve: true, target: 2 }, { kind: 'cook' }])
    save = advance(save, true)
    expect(goodCount(save.items, carrotSeed(2))).toBe(1)
    expect(goodCount(save.items, G1)).toBe(2)
    expect(plainBatch(save)).toBeNull()
    expect(() => saveCarrotSeeds(save, 1, true, 1)).toThrow('reserved')
    expect(discovered(save, G2)).toBe(false)
    expect(goodCount(saveCarrotSeeds(save, 1, true, 1, true).items, carrotSeed(2))).toBe(2)
  })

  it('recognizes legacy G1 harvests and keeps all grades in the same market crate', () => {
    let save = advance(fresh())
    save = { ...save, items: addGoods(addGoods(save.items, G1, 1, 30), G2, 1, 30), crops: { carrot: 4 } }
    expect(discovered(save, G1)).toBe(true)
    expect(discovered(save, G2)).toBe(false)
    save = shipCrate(save, [{ id: G1, stars: 1, count: 30 }, { id: G2, stars: 1, count: 30 }])
    expect(binSales(save.bin, save.calendar.day)).toMatchObject([{ id: G1, eased: 10 }, { id: G2 }])
    save = advance(save)
    expect(easeOf(save.farm.market, G2)).toBe(1)
    expect(easeOf(save.farm.market, G3)).toBe(1)
    expect(discovered(save, G2)).toBe(false)
  })
})
