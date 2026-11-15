// The goods as the loop shows them: the Warehouse by stars in its tabs, the bin's lines and
// estimate, the shop's rows with their gates, and the place links the map and the menu follow.
import { farmDay, farmPlace, FARM_RANK_POINTS, newSave, ship, type SaveV4 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { lockOf, placeLink } from './farm-map'
import { binView, easedWords, firstTab, goldWords, goodRow, saleWords, shelfOf, shopRows, warehouseTabs } from './goods-view'

const AT = '2026-11-09T10:00:00.000Z'
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })

/** Summer 3 with a few goods and the day-1 seeds. */
function stocked(): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day: SUMMER_3 },
    items: { ...save.items, salmon: [1, 2, 0, 0, 1], carrot: [3, 0, 0, 0, 0], 'pine-log': [4, 0, 0, 0, 0], basil: [1, 0, 0, 0, 0], 'dried-basil': [2, 0, 0, 0, 0], 'iron-ore': [5, 0, 0, 0, 0] },
  }
}

describe('the Warehouse by stars', () => {
  it('puts the crops and flours on Crops, the rest by family, mining together, and seeds last', () => {
    const tabs = warehouseTabs(stocked())
    expect(tabs.map((t) => t.shelf)).toEqual(['crops', 'woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets', 'fish', 'mining', 'seeds'])
    const on = (shelf: string) => tabs.find((t) => t.shelf === shelf)!.rows.map((r) => r.id)
    expect([on('crops'), on('herbs-spices'), on('woods'), on('fish'), on('mining'), on('seeds')]).toEqual([
      ['carrot', 'basil'], ['dried-basil'], ['pine-log'], ['salmon'], ['iron-ore'], ['seed-carrot'],
    ])
    expect(tabs.find((t) => t.shelf === 'fish')!.count).toBe(4)
    expect(shelfOf({ family: 'grains', crop: false })).toBe('crops')
  })

  it('shows each good\'s five star counts with today\'s price, and "In demand"', () => {
    const salmon = goodRow('salmon', [1, 2, 0, 0, 1], SUMMER_3)
    expect(salmon.cells).toEqual([
      { stars: 1, count: 1, price: 130 }, { stars: 2, count: 2, price: 165 }, { stars: 3, count: 0, price: 200 }, { stars: 4, count: 0, price: 230 },
      { stars: 5, count: 1, price: 265 },
    ])
    expect(salmon).toMatchObject({ name: 'Salmon', total: 4, demand: true, facts: 'Fish · G5 · raw', pair: 'Refines into Salmon Fillet', sells: true, worth: 725 })
    expect(goodRow('dried-basil', [1, 0, 0, 0, 0], SUMMER_3)).toMatchObject({ facts: 'Herbs and spices · G1 · refined', pair: 'Refined from Basil', demand: false })
    expect(goodRow('carrot', [1, 0, 0, 0, 0], SUMMER_3).pair).toBeNull()
  })

  it('shows seeds without a price, and they don\'t sell', () => {
    const seeds = goodRow('seed-carrot', [9, 0, 0, 0, 0], 1)
    expect(seeds).toMatchObject({ name: 'Carrot seeds', shelf: 'seeds', sells: false, worth: 0, demand: false })
    expect(seeds.cells.every((c) => c.price === null)).toBe(true)
  })

  it('adds the loot tab only when the Warehouse holds loot', () => {
    expect(warehouseTabs({ ...stocked(), items: { ...stocked().items, 'dragon-scale': [1, 0, 0, 0, 0] } }).at(-1)!.shelf).toBe('loot')
  })

  it('opens on the first tab holding something, or something that sells when picking', () => {
    const seedsOnly = warehouseTabs(newSave('u1', AT))
    expect([firstTab(seedsOnly, false), firstTab(seedsOnly, true)]).toEqual(['seeds', 'crops'])
    expect(firstTab(warehouseTabs({ ...newSave('u1', AT), items: { 'pine-log': [1, 0, 0, 0, 0] } }), true)).toBe('woods')
  })
})

describe('the bin\'s sheet', () => {
  it('lists today\'s lines and the night\'s estimate', () => {
    const save = ship(ship(stocked(), 'salmon', 2, 2), 'carrot', 1, 1)
    expect(binView(save)).toEqual({
      lines: [
        { kind: 'sold', id: 'carrot', stars: 1, count: 1, gold: 60, demand: false, name: 'Carrot' },
        { kind: 'sold', id: 'salmon', stars: 2, count: 2, gold: 330, demand: true, name: 'Salmon' },
      ],
      total: 390,
    })
    expect(saleWords({ id: 'salmon', stars: 2, count: 2 })).toBe('Salmon ★2 × 2')
    expect(goldWords(1240)).toBe('1,240g')
  })

  it('shows a flood\'s eased price: on the bin\'s lines past a crate, and in the Warehouse the days after', () => {
    const base = newSave('u1', AT)
    const flood = { ...base, calendar: { day: SUMMER_3 }, bin: { 'pine-log': [120, 0, 0, 0, 0] as [number, number, number, number, number] } }
    expect(binView(flood)).toEqual({
      lines: [{ kind: 'sold', id: 'pine-log', stars: 1, count: 120, gold: 2_900, demand: false, eased: 20, name: 'Pine Log' }],
      total: 2_900,
    })
    // The morning after: eased two steps, 20g a log, and the Warehouse says so.
    const after = { ...base, calendar: { day: SUMMER_3 + 1 }, items: { 'pine-log': [10, 0, 0, 0, 0] as [number, number, number, number, number] }, farm: { ...base.farm, market: { 'pine-log': 2 } } }
    const row = warehouseTabs(after).flatMap((t) => t.rows).find((r) => r.id === 'pine-log')!
    expect([row.eased, row.cells[0]!.price, row.worth]).toEqual([20, 20, 200])
    expect(easedWords(20)).toBe('Eased −20%')
  })
})

describe('the shop\'s rows', () => {
  it('names each line and says its gate while it\'s shut', () => {
    const lines = [{ id: 'seed-carrot', price: 20, opens: { by: 'start' as const } }, { id: 'seed-onion', price: 30, opens: { by: 'farm-rank' as const, rank: 2 } }]
    const save = newSave('u1', AT)
    expect(shopRows(save, lines).map((r) => [r.name, r.gate])).toEqual([['Carrot seeds', null], ['Onion seeds', 'From Farm Rank 2']])
    expect(shopRows({ ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[1]! } }, lines)[1]!.gate).toBeNull()
  })
})

describe('the places that open their screens (PLACE_SCREENS)', () => {
  it('opens the bin and the shop as sheets, the Warehouse as a page and the field as its own screen; the rest keep their quick look', () => {
    const save = newSave('u1', AT)
    const link = (id: string) => placeLink(save, farmPlace(id)!)
    expect([link('bin'), link('shop'), link('warehouse'), link('fields'), link('mine')]).toEqual([
      '/?sheet=bin', '/?sheet=shop', '/warehouse', '/field', '/?peek=mine',
    ])
    expect(['bin', 'shop', 'warehouse'].map((id) => lockOf(save, farmPlace(id)!))).toEqual([null, null, null])
  })
})
