import { financeOrder, creditQuote } from '../farm/credit'
import { farmRankOf } from '../farm/farm'
import { benchOpen, forgeState } from '../forge/state'
import { ringId, ringName } from '../goods/ids'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import { forgeRecipe, miningOpen } from './bench'

export const STANDARD_RING_COST = 20_000
export const RING_DEPOSIT = 2_000
const GOLD = [STANDARD_RING_COST, 25_000, 30_000, 38_000, 48_000, 60_000, 75_000, 90_000, 100_000, 120_000] as const
const RANK = [1, 4, 4, 5, 6, 7, 8, 8, 9, 10] as const

export const RING_COMMISSIONS = GOLD.map((gold, index) => {
  const grade = index + 1
  const { ingot, gem } = forgeRecipe(grade)
  return {
    grade, gold, rank: RANK[index]!, days: grade >= 9 ? 2 : 1, name: ringName(grade),
    materials: [{ id: ingot, count: grade >= 9 ? 12 : 2 }, { id: gem, count: grade >= 9 ? 8 : 1 }],
  }
})

export function ringCommissionLock(save: FarmSave, grade: number): string | null {
  const recipe = RING_COMMISSIONS[grade - 1]
  if (!recipe || !benchOpen(save)) return 'The Ring Bench opens after Romance 8.'
  if (save.forge?.ringOrder || save.today.ring) return 'A ring is already on order.'
  if (farmRankOf(save.farm.points) < recipe.rank) return `Opens at Farm Rank ${recipe.rank}.`
  if (grade > 1 && !miningOpen(save)) return 'Build the Smelter and Cutter for premium rings.'
  if (grade > 1 && recipe.materials.some(line => goodCount(save.items, line.id) < line.count)) return 'Bring the exact metal and gem listed above.'
  return null
}

export function commissionRing<S extends FarmSave>(save: S, grade: number, financed = false): S {
  const locked = ringCommissionLock(save, grade)
  if (locked) throw new SaveRuleError('locked', locked)
  const recipe = RING_COMMISSIONS[grade - 1]!
  const order = (funded: S): S => {
    const paid = spendGold(funded, recipe.gold)
    let items = paid.items
    if (grade > 1) for (const line of recipe.materials) {
      let remaining = line.count
      for (let stars = 1; stars <= 5 && remaining > 0; stars++) {
        const take = Math.min(items[line.id]?.[stars - 1] ?? 0, remaining)
        if (take) items = takeGoods(items, line.id, stars, take)
        remaining -= take
      }
    }
    return { ...paid, items, today: { ...paid.today, ring: grade },
      forge: { ...forgeState(paid), ringOrder: { grade, due: paid.calendar.day + recipe.days } } }
  }
  const cash = grade === 1 ? RING_DEPOSIT : save.gold
  return financed ? financeOrder(save, recipe.name, recipe.gold, cash, order) : order(save)
}

export function ringCreditQuote(save: FarmSave, grade: number) {
  const recipe = RING_COMMISSIONS[grade - 1]!
  return creditQuote(save, recipe.gold, grade === 1 ? RING_DEPOSIT : save.gold)
}

export function deliverRing<S extends FarmSave>(save: S): S {
  if (!save.forge?.ringOrder || save.forge.ringOrder.due > save.calendar.day) return save
  const { ringOrder, ...forge } = save.forge
  return { ...save, forge, items: addGoods(save.items, ringId(ringOrder.grade), 1, 1) }
}
