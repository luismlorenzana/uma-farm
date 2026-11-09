// The shipping bin (F19 decisions 4–6; CS10, CS7 step 1): shipping, taking back and paying move the Warehouse, the bin,
// gold, `farm.counts['gold-shipped']` and `diary.shipped` exactly; the bin refuses a seed.
import { describe, expect, it } from 'vitest'
import { farmDay } from '../farm/calendar'
import { binSales, binTotal, GOLD_SHIPPED, payBin, ship, shipAll, takeBack } from './bin'
import { SaveRuleError } from './rules'
import { newSave, type SaveV3 } from './v3'

const AT = '2026-11-09T10:00:00.000Z'
const SPRING_3 = farmDay({ year: 1, season: 'spring', day: 3 })
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })

/** Day 1 with a few goods: carrots at ★1 and ★2, salmon at ★1–★3, Pine Logs. */
function stocked(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, items: { ...save.items, carrot: [4, 2, 0, 0, 0], salmon: [1, 2, 1, 0, 0], 'pine-log': [10, 0, 0, 0, 0] } }
}
const refusal = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}

describe('shipping (CS10)', () => {
  it('moves a good at its stars from the Warehouse into the bin, exactly', () => {
    const save = ship(ship(stocked(), 'carrot', 1, 3), 'carrot', 2, 1)
    expect(save.items.carrot).toEqual([1, 1, 0, 0, 0])
    expect(save.bin).toEqual({ carrot: [3, 1, 0, 0, 0] })
    expect(save.gold).toBe(500)
    expect(save.account).toEqual(stocked().account)
  })

  it('takes the last of a row, and the row leaves the Warehouse', () => {
    const save = ship(stocked(), 'pine-log', 1, 10)
    expect(save.items['pine-log']).toBeUndefined()
    expect(save.bin['pine-log']).toEqual([10, 0, 0, 0, 0])
  })

  it('refuses a seed (decision 5), more than the Warehouse holds, and none', () => {
    expect(refusal(() => ship(stocked(), 'seed-carrot', 1, 1))).toBe('no-price')
    expect(refusal(() => ship(stocked(), 'carrot', 2, 3))).toBe('no-items')
    expect(refusal(() => ship(stocked(), 'carrot', 3, 1))).toBe('no-items')
    expect(refusal(() => ship(stocked(), 'carrot', 1, 0))).toBe('bad-count')
    expect(refusal(() => ship(stocked(), 'chopped-carrot', 1, 1))).toBe('no-price')
  })

  it('ships every star of a good with Ship all', () => {
    const save = shipAll(stocked(), 'salmon')
    expect(save.items.salmon).toBeUndefined()
    expect(save.bin.salmon).toEqual([1, 2, 1, 0, 0])
    expect(refusal(() => shipAll(save, 'salmon'))).toBe('no-items')
    expect(refusal(() => shipAll(stocked(), 'seed-carrot'))).toBe('no-price')
  })
})

describe('taking back (decision 4)', () => {
  it('moves a line back into the Warehouse until the night', () => {
    const shipped = ship(ship(stocked(), 'carrot', 1, 3), 'carrot', 2, 2)
    const back = takeBack(shipped, 'carrot', 2, 2)
    expect(back.bin).toEqual({ carrot: [3, 0, 0, 0, 0] })
    expect(back.items.carrot).toEqual([1, 2, 0, 0, 0])
    expect(takeBack(back, 'carrot', 1, 3)).toMatchObject({ bin: {}, items: { carrot: [4, 2, 0, 0, 0] } })
  })

  it('refuses more than the bin holds', () => {
    const shipped = ship(stocked(), 'carrot', 1, 1)
    expect(refusal(() => takeBack(shipped, 'carrot', 1, 2))).toBe('no-items')
    expect(refusal(() => takeBack(shipped, 'salmon', 1, 1))).toBe('no-items')
    expect(refusal(() => takeBack(shipped, 'carrot', 1, 0))).toBe('bad-count')
  })
})

describe('what the bin holds', () => {
  it('lists each good at each star in the catalogue\'s order, with its gold and demand', () => {
    const bin = shipAll(ship(ship(stocked(), 'pine-log', 1, 2), 'carrot', 2, 1), 'salmon').bin
    expect(binSales(bin, SUMMER_3)).toEqual([
      { kind: 'sold', id: 'carrot', stars: 2, count: 1, gold: 75, demand: false },
      { kind: 'sold', id: 'pine-log', stars: 1, count: 2, gold: 50, demand: false },
      { kind: 'sold', id: 'salmon', stars: 1, count: 1, gold: 130, demand: true }, // 110 × 1.2 = 132
      { kind: 'sold', id: 'salmon', stars: 2, count: 2, gold: 330, demand: true },
      { kind: 'sold', id: 'salmon', stars: 3, count: 1, gold: 200, demand: true }, // 110 × 1.5 × 1.2 = 198
    ])
    expect(binTotal(bin, SUMMER_3)).toBe(785)
    expect(binTotal({}, SUMMER_3)).toBe(0)
  })
})

describe('the night pays (CS7 step 1, decision 6)', () => {
  it('pays gold, counts the gold shipped and each good shipped, and empties the bin', () => {
    const shipped = ship(ship(stocked(), 'carrot', 1, 3), 'carrot', 2, 1)
    const before: SaveV3 = { ...shipped, farm: { ...shipped.farm, counts: { [GOLD_SHIPPED]: 1000 } }, diary: { ...shipped.diary, shipped: { carrot: 5 } } }
    const { save, sales, gold } = payBin(before, SPRING_3) // carrots in demand in Spring: 72 → 70, 90
    expect(sales).toEqual([
      { kind: 'sold', id: 'carrot', stars: 1, count: 3, gold: 210, demand: true },
      { kind: 'sold', id: 'carrot', stars: 2, count: 1, gold: 90, demand: true },
    ])
    expect(gold).toBe(300)
    expect(save.gold).toBe(800)
    expect(save.farm.counts).toEqual({ [GOLD_SHIPPED]: 1300 })
    expect(save.diary.shipped).toEqual({ carrot: 9 })
    expect(save.bin).toEqual({})
    expect(save.items).toEqual(shipped.items)
    expect(save.account).toEqual(before.account)
  })

  it('pays nothing for an empty bin, and changes nothing', () => {
    const save = stocked()
    expect(payBin(save, SPRING_3)).toEqual({ save, sales: [], gold: 0 })
  })
})
