// The Warehouse by line and grade (copied from uma-rpg's warehouse-shelves-v4.test.ts at 30a322a, F5): materials carry
// their grades, each line raw then refined by grade, Tome Ink after the Arms Gems on Made items, and the header's totals.
import { describe, expect, it } from 'vitest'
import { warehouseView } from './warehouse-shelves'

describe('the Warehouse', () => {
  it('grades every material, orders each line raw then refined by grade, and puts Tome Ink after the Arms Gems', () => {
    const view = warehouseView({ items: {
      'iron-ingot': 3, 'tin-ore': 2, 'copper-ore': 5, trout: 4, 'tome-ink-g2': 1, 'weapon-gem-g1': 2, 'armor-fittings-g1': 1, 'jewel-moon-1': 1, carrot: 0,
    } })
    const metal = view.items.filter((i) => i.shelf === 'metal')
    expect(metal.map((i) => [i.id, i.grade, i.group])).toEqual([['copper-ore', 1, 'metal-raw'], ['tin-ore', 2, 'metal-raw'], ['iron-ingot', 3, 'metal-refined']])
    expect(view.items.find((i) => i.id === 'trout' && i.shelf === 'fish')).toMatchObject({ name: 'Trout', grade: 2, line: 'Fish · G2 · raw' })
    expect(view.items.filter((i) => i.shelf === 'made').map((i) => [i.id, i.name, i.line])).toEqual([
      ['weapon-gem-g1', 'Arms Gem G1', 'Metal · G1 · made'], ['tome-ink-g2', 'Tome Ink G2', 'Vegetables · G2 · made'],
      ['armor-fittings-g1', 'Armor Fittings G1', 'Wood · G1 · made'], ['jewel-moon-1', 'Moon Jewel I', 'Stone · G2 · made'],
    ])
    expect(view.items.filter((i) => i.shelf === 'all')).toHaveLength(8)
    expect(view.items.some((i) => i.id === 'carrot')).toBe(false)
    expect(view.header).toBe('14 materials · 5 made items')
  })

  it('has seven shelves: All, the five lines and Made items', () => {
    expect(warehouseView({ items: {} }).shelves.map((s) => s.label)).toEqual(['All', 'Metal', 'Wood', 'Vegetables', 'Fish', 'Stone', 'Made items'])
    expect(warehouseView({ items: {} }).header).toBe('0 materials · 0 made items')
  })
})
