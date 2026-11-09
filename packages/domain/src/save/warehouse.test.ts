// The Warehouse by stars and uma-work's flat stock (F17 decision 3), and gold.
import { describe, expect, it } from 'vitest'
import { earnGold, spendGold } from './gold'
import { SaveRuleError } from './rules'
import type { Warehouse } from './v3'
import { addGoods, fromWorkStock, goodCount, parseStockKey, stockKey, stockTotal, takeGoods, workStock } from './warehouse'

const STOCK: Warehouse = { carp: [3, 2, 0, 0, 1], 'seed-carrot': [9, 0, 0, 0, 0], 'pine-log': [0, 0, 0, 0, 0] }

describe('the bridge', () => {
  it('shows the engine a flat stock keyed <id>@<stars>, with no zeros', () => {
    expect(workStock(STOCK)).toEqual({ 'carp@1': 3, 'carp@2': 2, 'carp@5': 1, 'seed-carrot@1': 9 })
  })

  it('folds the view back, dropping empty rows', () => {
    expect(fromWorkStock(workStock(STOCK))).toEqual({ carp: [3, 2, 0, 0, 1], 'seed-carrot': [9, 0, 0, 0, 0] })
    expect(fromWorkStock({ 'carp@2': 0 })).toEqual({})
  })

  it('round-trips any Warehouse', () => {
    const items: Warehouse = { 'silver-ingot': [1, 0, 4, 0, 2], apple: [0, 0, 0, 0, 7] }
    expect(fromWorkStock(workStock(items))).toEqual(items)
    expect(workStock(fromWorkStock(workStock(items)))).toEqual(workStock(items))
  })

  it('reads and refuses stock keys', () => {
    expect(stockKey('carp', 2)).toBe('carp@2')
    expect(parseStockKey('carp@2')).toEqual({ id: 'carp', stars: 2 })
    for (const bad of ['carp', 'carp@0', 'carp@6', 'carp@1.5', '@1', 'chopped-carrot@1', 'seed-carrot@2', 'carp@02']) expect(parseStockKey(bad)).toBeNull()
    expect(() => fromWorkStock({ 'carp@9': 1 })).toThrow(RangeError)
    expect(() => fromWorkStock({ 'carp@1': -1 })).toThrow(RangeError)
  })
})

describe('adding and taking', () => {
  it('adds and takes by stars, leaving the input untouched', () => {
    const more = addGoods(STOCK, 'carp', 3, 4)
    expect(more.carp).toEqual([3, 2, 4, 0, 1])
    expect(STOCK.carp).toEqual([3, 2, 0, 0, 1])
    expect(addGoods({}, 'apple', 1, 2)).toEqual({ apple: [2, 0, 0, 0, 0] })
    expect(takeGoods(more, 'carp', 3, 4).carp).toEqual([3, 2, 0, 0, 1])
    expect(addGoods(STOCK, 'carp', 1, 0)).toBe(STOCK)
  })

  it('drops a row that empties', () => {
    expect(takeGoods({ apple: [2, 0, 0, 0, 0] }, 'apple', 1, 2)).toEqual({})
  })

  it('refuses taking what isn\'t there, and impossible goods', () => {
    expect(() => takeGoods(STOCK, 'carp', 3, 1)).toThrow(SaveRuleError)
    expect(() => takeGoods(STOCK, 'apple', 1, 1)).toThrow(/Not enough/)
    expect(() => addGoods(STOCK, 'chopped-carrot', 1, 1)).toThrow(RangeError)
    expect(() => addGoods(STOCK, 'seed-carrot', 2, 1)).toThrow(RangeError)
    expect(() => addGoods(STOCK, 'carp', 6, 1)).toThrow(RangeError)
    expect(() => addGoods(STOCK, 'carp', 1, 1.5)).toThrow(RangeError)
  })

  it('counts a good, and everything', () => {
    expect(goodCount(STOCK, 'carp')).toBe(6)
    expect(goodCount(STOCK, 'apple')).toBe(0)
    expect(stockTotal(STOCK)).toBe(15)
  })
})

describe('gold (CS1)', () => {
  it('spends what the farm has, and refuses the rest', () => {
    expect(spendGold({ gold: 500 }, 180)).toEqual({ gold: 320 })
    expect(spendGold({ gold: 500 }, 500)).toEqual({ gold: 0 })
    expect(() => spendGold({ gold: 100 }, 101)).toThrow(expect.objectContaining({ reason: 'no-gold' }) as Error)
    expect(earnGold({ gold: 100 }, 450)).toEqual({ gold: 550 })
    expect(() => earnGold({ gold: 100 }, 1.5)).toThrow(RangeError)
    expect(() => spendGold({ gold: 100 }, -5)).toThrow(RangeError)
  })
})
