import { describe, expect, it } from 'vitest'
import { handsTonight, setTasks } from './farmhands'
import { availableStock, setStockReserve, setSurplusPlan, surplusCrate } from './production'
import { plainBatch } from './food'
import { TALENT_D } from './talents'
import { fish, fishAt, farmerGatherer } from '../gathering/hauls'
import { setFishingMode } from '../gathering/fishing-grades'
import { setStationPlan, startLoad } from '../gathering/stations'
import { discovered } from '../goods/discovery'
import { gradeStepId, goodOf, refinedOf } from '../goods/ids'
import { runNight } from '../night/end-day'
import { ANIMALS, collect, ranchProduct, setCollectionCap } from '../ranch/ranch'
import { takeBack } from '../save/bin'
import { parseSaveV6 } from '../save/parse-v4'
import { ANIMAL_KINDS, newLove, newRosterUma, newSave, newTodayV4, type Animal, type FarmSave } from '../save/v4'
import { goodCount } from '../save/warehouse'

const NOW = '2026-11-18T12:00:00.000Z'
const A = '101'
const B = '202'
const C = '303'
const D = '404'
const hands = [A, B, C, D]
const produce = (kind: Animal['kind'], fondness: number): Animal => ({ id: `${kind}-1`, kind, fondness, fed: false, cared: false, ready: true })
const reload = (s: FarmSave): FarmSave => parseSaveV6(JSON.parse(JSON.stringify(s)))
const night = (s: FarmSave) => reload(runNight(s, { talentOf: () => TALENT_D }))

function farm(): FarmSave {
  const base = newSave('f99-production', NOW)
  return { ...base, calendar: { day: 13 }, gold: 30_000, buildings: { ...base.buildings, barn: 1, coop: 1, mill: 2, sawmill: 2, smokehouse: 2 },
    roster: Object.fromEntries(hands.map((id) => [id, { ...newRosterUma(1), farmhand: 1, practice: { fish: 210, care: 150, mill: 150 } }])),
    love: Object.fromEntries(hands.map((id) => [id, newLove()])),
  }
}

describe('F99 ranch, reserves and stations', () => {
  it('leaves one load of inputs for the next planned refill after the output is stocked', () => {
    const base = farm()
    const save = setStationPlan({ ...base, items: { ...base.items,
      'copper-ore': [24, 0, 0, 0, 0], 'copper-ingot': [10, 0, 0, 0, 0],
    }, buildings: { ...base.buildings, smelter: 1 } }, 'smelter', [{ output: 'copper-ingot', target: 10 }])
    const plan = setSurplusPlan(save, { goods: ['copper-ore', 'copper-ingot'], limit: 25 })
    expect(surplusCrate(plan)).toEqual([{ id: 'copper-ore', stars: 1, count: 16 }])
    const fish = setStationPlan({ ...base, items: { carp: [8, 0, 0, 0, 0] } },
      'smokehouse', [{ output: 'carp-fillet', target: 8 }])
    expect(plainBatch(fish)).toBeNull()
    expect(startLoad(fish, 'smokehouse', 'carp-fillet@1', 8).loads.smokehouse).toHaveLength(1)
  })
  it('fills an ordered output from a later worker and protects it from routine meals and shipping', () => {
    const base = farm()
    let save = setStationPlan({ ...base, ranch: { silo: 5, animals: [produce('cow', 60)] } },
      'mill', [{ output: 'cultured-yogurt', target: 1 }])
    save = setTasks(setTasks(save, A, [{ kind: 'load', station: 'mill' }]), B, [{ kind: 'care', home: 'barn' }])
    const morning = night(save)
    expect(goodCount(morning.items, 'cultured-yogurt')).toBe(1)
    expect(morning.summary?.work.find(line => line.kind === 'farmhand' && line.id === A)).toMatchObject({ spent: 1, done: { load: 1 } })
    const surplus = setSurplusPlan({ ...morning, items: { ...morning.items, carrot: [1, 0, 0, 0, 0] } }, { goods: ['cultured-yogurt'], limit: 10 })
    expect(plainBatch(surplus)).toBeNull()
    expect(surplusCrate(surplus)).toEqual([])
  })
  it.each(ANIMAL_KINDS)('carries %s fondness and collector skill into grades independently of stars', (kind) => {
    const base = ANIMALS[kind].good
    const animal = produce(kind, 200)
    const start = { ...farm(), ranch: { silo: 10, animals: [animal] } }
    expect(collect(reload(start), ANIMALS[kind].home).collected.items).toEqual([`${base}@5`])
    const cap = setCollectionCap(start, kind, 2)
    expect(ranchProduct(cap, produce(kind, 59), 9)).toBe(base)
    expect(ranchProduct(cap, produce(kind, 60))).toBe(gradeStepId(base, 1))
    expect(ranchProduct(cap, produce(kind, 140))).toBe(gradeStepId(base, 1))
    expect(ranchProduct(cap, produce(kind, 140), 6)).toBe(gradeStepId(base, 2))
    expect(ranchProduct(cap, produce(kind, 180))).toBe(gradeStepId(base, 2))
    const { save, collected } = collect(reload(cap), ANIMALS[kind].home)
    expect(collected.items).toEqual([`${gradeStepId(base, 2)}@5`])
    expect(discovered(save, gradeStepId(base, 2))).toBe(true)
    expect(discovered(save, base)).toBe(false)
  })

  it('lets the roster collect G3 Milk, queue exactly the shared yogurt target and ship a protected surplus crate', () => {
    const milk = 'milk-grade-3'
    const yogurt = 'cultured-yogurt-grade-3'
    let save = farm()
    save = { ...save, ranch: { silo: 10, animals: [produce('cow', 100)] },
      items: { ...save.items, [milk]: [0, 0, 6, 0, 0], carrot: [3, 0, 0, 0, 0] } }
    expect(discovered(save, milk)).toBe(false)
    save = setCollectionCap(save, 'cow', 1)
    save = setStockReserve(save, milk, 3)
    save = setStationPlan(save, 'mill', [{ output: yogurt, target: 3 }])
    save = setSurplusPlan(save, { goods: [milk, 'carrot'], limit: 3 })
    save = setTasks(save, A, [{ kind: 'care', home: 'barn' }])
    save = setTasks(save, B, [{ kind: 'load', station: 'mill' }])
    save = setTasks(save, C, [{ kind: 'load', station: 'mill' }, { kind: 'ship-surplus' }])
    save = setTasks(save, D, [{ kind: 'ship-surplus' }])
    const untouched = structuredClone(save)
    const preview = handsTonight(save, save, () => TALENT_D, null)
    expect(save).toEqual(untouched)
    expect(preview.save.loads.mill).toEqual([{ item: `${yogurt}@3`, count: 3 }])
    expect(discovered(preview.save, milk)).toBe(true)
    expect(discovered(preview.save, yogurt)).toBe(false)
    expect(preview.lines.reduce((n, line) => n + (line.done['ship-surplus'] ?? 0), 0)).toBe(3)
    expect(goodCount(preview.save.items, milk)).toBe(4)
    const morning = night(save)
    expect(morning.summary?.work.filter((line) => line.kind === 'farmhand')).toEqual(preview.lines)
    expect(morning.summary?.bin).toEqual([])
    expect(goodCount(morning.items, yogurt)).toBe(3)
    expect(discovered(morning, yogurt)).toBe(true)
    expect(goodCount(morning.bin, 'carrot')).toBe(3)
    expect(goodCount(morning.bin, milk)).toBe(0)
    const held = takeBack(morning, 'carrot', 1, 1)
    expect(night(held).summary?.bin.reduce((n, line) => n + line.count, 0)).toBe(2)
    expect(night(held).farm.discoveries?.[milk]).toBe(save.calendar.day)
  })

  it('keeps a legacy pending load, and debits only whole exact-grade conversion batches', () => {
    const start: FarmSave = { ...farm(), items: { 'carrot-grade-2': [0, 5, 0, 0, 0] } }
    const old = reload({ ...start, loads: { mill: { item: 'wheat-flour@2', count: 3 } } } as unknown as FarmSave)
    const reserve = setStockReserve(old, 'carrot-grade-2', 2)
    expect(() => startLoad(reserve, 'sawmill', 'carrot-pickles-grade-2@2', 2)).toThrow(/reserved/)
    const queue = startLoad(reserve, 'sawmill', 'carrot-pickles-grade-2@2', 1)
    expect(availableStock(queue, 'carrot-grade-2')).toBe(1)
    expect(discovered(queue, 'carrot-pickles-grade-2')).toBe(false)
    const morning = night(queue)
    expect(morning.items['carrot-pickles-grade-2']).toEqual([0, 1, 0, 0, 0])
    expect(goodCount(morning.items, 'wheat-flour')).toBe(3)
    expect(goodOf('carrot-pickles-grade-2')?.price).toBeGreaterThan(goodOf('carrot-grade-2')!.price * 2)
    expect(() => startLoad({ ...start, buildings: { ...start.buildings, sawmill: 1 } }, 'sawmill', 'carrot-pickles-grade-2@2', 1)).toThrow(/level 2/)
  })
})

describe('F99 targeted catches', () => {
  it('uses the actual landed species and carries a roster Carp G2 through the Smokehouse', () => {
    let save = setTasks(farm(), A, [{ kind: 'fish', spot: 'pond', mode: 'improved' }])
    save = setStationPlan(save, 'smokehouse', [{ output: 'carp-fillet-grade-2', target: 4 }])
    save = setTasks(save, B, [{ kind: 'load', station: 'smokehouse' }])
    for (let turn = 0; turn < 6 && !discovered(save, 'carp-fillet-grade-2'); turn++) save = night(save)
    expect(discovered(save, 'carp')).toBe(true)
    expect(discovered(save, 'carp-grade-2')).toBe(true)
    expect(discovered(save, 'carp-fillet-grade-2')).toBe(true)
    expect(refinedOf('carp-grade-2')).toBe('carp-fillet-grade-2')
    expect(save.diary.records['size:carp']).toBeGreaterThan(0)
    expect(save.diary.records['size:carp-grade-2']).toBeUndefined()
    expect(save.farm.manualCatches).toBeUndefined()
  })

  it('opens the manual modes through landed catches and shares each species remainder across spots', () => {
    let save = setFishingMode(farm(), 'pond', 'improved')
    const cast = (s: FarmSave) => fish({ ...s, today: newTodayV4() }, 'pond').save
    for (let i = 0; i < 12; i++) save = cast(save)
    expect(save.farm.manualCatches).toBe(12)
    expect(save.farm.fishRemainders).toBeUndefined()
    for (let i = 0; i < 6; i++) save = cast(save)
    expect(discovered(save, 'carp-grade-2')).toBe(true)
    const held = { ...save, farm: { ...save.farm, fishRemainders: { 'carp:1': 2 } } }
    const by = farmerGatherer(held, 'fishery', 2)
    const grade = fishAt(held, 'river', by, 'improved', 7)
    const plain = fishAt(held, 'river', by, 'standard', 7)
    expect(grade.caught.map(({ gradeId: _, ...fish }) => fish)).toEqual(plain.caught)
    expect(grade.save.diary.records).toEqual(plain.save.diary.records)
    expect(grade.save.farm.manualCatches).toBe(18)
    expect(() => reload({ ...save, farm: { ...save.farm, fishRemainders: { 'silverfin:2': 1 } } })).toThrow(/fish grade/)
    expect(discovered({ ...farm(), diary: { ...save.diary, records: { 'size:carp': 25 } } }, 'carp')).toBe(true)
    const stars = save.items['carp-grade-2']!.findIndex((n) => n > 0) + 1
    expect(discovered(night(startLoad(save, 'smokehouse', `carp-fillet-grade-2@${stars}`, 1)), 'carp-fillet-grade-2')).toBe(true)
    save = setFishingMode(save, 'pond', 'select')
    for (let i = 18; i < 40; i++) save = cast(save)
    expect(save.farm.fishRemainders?.['carp:2']).toBeUndefined()
    for (let i = 0; i < 24 && !discovered(save, 'carp-grade-3'); i++) save = cast(save)
    expect(discovered(save, 'carp-grade-3')).toBe(true)
  })
})
