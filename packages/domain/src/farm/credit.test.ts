import { describe, expect, it } from 'vitest'
import { newLove, newRosterUma, newSave, type FarmSave, type StarCounts } from '../save/v4'
import { parseSaveV6 } from '../save/parse-v4'
import { buildHouse } from '../romance/homestead'
import { commissionRing, deliverRing, RING_COMMISSIONS } from '../romance/ring-orders'
import { goToTown } from './actions'
import { borrowGold, creditLeft } from './credit'
import { borrowMaterials } from './credit-supplies'
import { borrowFor, repayLoan, settleAccounts } from './economy'
import { configureSurplus, pinSupplyProject, setSurplusReserve, surplusCrate } from './production'

const AT = '2026-11-22T12:00:00.000Z'
const fresh = () => newSave('finance-playthrough', AT)
const reload = (save: FarmSave) => parseSaveV6(JSON.parse(JSON.stringify(save)))

describe('F111 project and supply credit', () => {
  it('commissions a 100,000g Mythril Ring with 10,000g now and allows paying back 5,000g that day', () => {
    const recipe = RING_COMMISSIONS[8]!
    const base = fresh()
    const save = goToTown({ ...base, gold: 10_000, farm: { ...base.farm, points: 14_750 },
      buildings: { ...base.buildings, forge: 0, smelter: 1, cutter: 1 },
      items: Object.fromEntries(recipe.materials.map(line => [line.id, [0, 0, line.count, 0, 0] satisfies StarCounts])) })
    const ordered = commissionRing(save, recipe.grade, true)
    expect(ordered.gold).toBe(0)
    expect(ordered.farm.loans[0]).toMatchObject({ lent: 90_000, fee: 9_000, owed: 99_000 })
    expect(ordered.items).toEqual({})
    expect(reload(ordered)).toEqual(ordered)
    expect(() => commissionRing(ordered, recipe.grade, true)).toThrow(/on order/)
    const paid = repayLoan({ ...ordered, gold: 5_000 }, ordered.farm.loans[0]!.for, 5_000)
    expect(paid.farm.loans[0]?.owed).toBe(94_000)
    expect(creditLeft(paid)).toBe(10_000)
    const delivered = deliverRing({ ...paid, calendar: { day: 3 } })
    expect(delivered.items['ring-g9']).toEqual([1, 0, 0, 0, 0])
    expect(deliverRing(delivered)).toBe(delivered)
    expect(surplusCrate(delivered)).toEqual([])
  })

  it('builds the fifth cottage on 100,000g of credit', () => {
    const base = fresh()
    const ids = ['91001', '91002', '91003', '91004', '91005']
    let save: FarmSave = goToTown({ ...base, gold: 200_000,
      roster: Object.fromEntries(ids.map(id => [id, newRosterUma(1)])),
      love: Object.fromEntries(ids.map(id => [id, { ...newLove(), stage: 'spouse' as const, wed: 1 }])) })
    for (const name of ['Rose Cottage', 'Iris Cottage', 'Lily Cottage', 'Poppy Cottage']) save = buildHouse(save, name)
    save = borrowFor({ ...save, gold: 10_000 }, 'house:5', 'Daisy Cottage', 100_000)
    expect(save.homestead.houses[5]?.name).toBe('Daisy Cottage')
    expect(save.gold).toBe(0)
    expect(save.farm.loans[0]).toMatchObject({ lent: 100_000, owed: 110_000 })
    expect(creditLeft(save)).toBe(0)
  })

  it('combines gold and exact goods across three slots and allocates the 20% sweep once', () => {
    const town = goToTown(fresh())
    const gold = borrowGold(town, 100)
    const materials = borrowMaterials(gold, 'pine-log', 2)
    expect(materials.items['pine-log']).toEqual([2, 0, 0, 0, 0])
    expect(materials.farm.discoveries).toBeUndefined()
    const built = borrowFor(materials, 'mill')
    expect(built.farm.loans.map(row => row.credit?.kind)).toEqual(['gold', 'goods', 'project'])
    expect(built.items['pine-log']).toBeUndefined()
    expect(() => borrowGold(built, 1)).toThrow(/three loan slots/)
    const noSales = settleAccounts({ ...built, gold: 500 }, 0)
    expect(noSales.save.farm.loans).toEqual(built.farm.loans)
    const sale = settleAccounts({ ...built, gold: 1000 }, 1000, { takeout: 20, pantry: 0, fed: 0, spoiled: 0 }, 1000)
    expect(sale.save.gold).toBe(560)
    expect(sale.lines.filter(line => line.kind === 'loan').map(row => row.paid)).toEqual([110, 30, 0])
    expect(sale.save.farm.accounts?.at(-1)).toMatchObject({ shipping: 0, restaurant: 1000, repaymentBudget: 140 })
    expect(sale.save.farm.financeLog?.some(row => row.kind === 'cleared')).toBe(true)
    expect(reload(sale.save)).toEqual(sale.save)
    expect(borrowGold(sale.save, 100).farm.loans).toHaveLength(3)
  })

  it('settles an older note under its original terms before the shared budget', () => {
    const advance = borrowGold(goToTown(fresh()), 1000)
    const legacy = { for: 'mill', day: 1, lent: 500, fee: 50, owed: 550, nightly: 55 }
    const mixed = { ...advance, farm: { ...advance.farm, loans: [legacy, ...advance.farm.loans] } }
    const { save, lines } = settleAccounts(reload(mixed), 1000, { takeout: 20, pantry: 0, fed: 0, spoiled: 0 })
    expect(lines.filter(line => line.kind === 'loan').map(line => line.paid)).toEqual([55, 129])
    expect(save.farm.loans.map(loan => loan.owed)).toEqual([495, 971])
  })

  it('protects pinned materials, higher stars and wedding rings by default and preserves explicit zero', () => {
    const base: FarmSave = { ...fresh(), items: { 'pine-log': [18, 0, 0, 0, 0], carrot: [35, 0, 0, 0, 2], 'ring-g1': [3, 0, 0, 0, 0] } }
    const pinned = pinSupplyProject(base, 'mill')
    const configured = setSurplusReserve(setSurplusReserve(pinned, 'pine-log', 0), 'carrot', 0, 5)
    expect(reload(configured).farm.surplusSettings?.floors?.['pine-log']).toBe(0)
    expect(surplusCrate(configured)).toEqual([{ id: 'carrot', stars: 1, count: 35 }])
    expect(surplusCrate(configureSurplus(configured, { paused: true }))).toEqual([])
    expect(surplusCrate(configureSurplus(configured, { paused: true }), true)).toEqual(surplusCrate(configured))
    expect(surplusCrate(configureSurplus(configured, { reset: true }))).toEqual([{ id: 'carrot', stars: 1, count: 25 }])
  })
})
