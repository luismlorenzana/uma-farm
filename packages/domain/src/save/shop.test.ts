// The shop's frame (F19 decision 7): lines with a price and a gate, bought with gold into the Warehouse at ★1. F20 fills
// it with the season's seeds; until then it sells nothing, so these lines are invented.
import { describe, expect, it } from 'vitest'
import { FARM_RANK_POINTS } from '../farm/farm'
import { SaveRuleError } from './rules'
import { buy, lineOpen, shopLines, type ShopLine } from './shop'
import { newSave } from './v3'

const AT = '2026-11-09T10:00:00.000Z'
const CARROT: ShopLine = { id: 'seed-carrot', price: 20, opens: { by: 'start' } }
const ONION: ShopLine = { id: 'seed-onion', price: 30, opens: { by: 'farm-rank', rank: 2 } }
const reason = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}

describe('the shop (decision 7)', () => {
  it('sells nothing until F20 adds the seeds', () => {
    expect(shopLines(newSave('u1', AT))).toEqual([])
  })

  it('buys through gold into the Warehouse at ★1, without a stamp', () => {
    const save = newSave('u1', AT)
    const bought = buy(save, CARROT, 9)
    expect(bought.gold).toBe(320)
    expect(bought.items['seed-carrot']).toEqual([18, 0, 0, 0, 0])
    expect(bought.account).toEqual(save.account)
    expect(buy(save, { id: 'carrot', price: 50, opens: { by: 'start' } }, 1).items.carrot).toEqual([1, 0, 0, 0, 0])
  })

  it('refuses short gold, a bad count and a line before its gate', () => {
    const save = newSave('u1', AT)
    expect(reason(() => buy(save, CARROT, 26))).toBe('no-gold')
    expect(buy(save, CARROT, 25).gold).toBe(0)
    expect(reason(() => buy(save, CARROT, 0))).toBe('bad-count')
    expect(reason(() => buy(save, CARROT, 100))).toBe('bad-count')
    expect(lineOpen(save, ONION)).toBe(false)
    expect(reason(() => buy(save, ONION, 1))).toBe('locked')
    const rank2 = { ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[1]! } }
    expect(buy(rank2, ONION, 2).items['seed-onion']).toEqual([2, 0, 0, 0, 0])
  })
})
