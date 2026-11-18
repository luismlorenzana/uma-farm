import { spend } from '../farm/actions'
import { carrotGood, carrotSeed, type CarrotGrade } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import { FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, type FarmSave, type Tile } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'

export const SEED_BATCH = 4
export const MAX_SEED_TARGET = 99
export const SEED_KNOWLEDGE = { 1: 3, 2: 12 } as const
export const HARVEST_GRADE_LEVEL = { 1: 4, 2: 7 } as const

export type CarrotPlan = NonNullable<FarmSave['farm']['carrotRows']>[string]

export const nextCarrotGrade = (grade: CarrotGrade): 2 | 3 | undefined => grade === 1 ? 2 : grade === 2 ? 3 : undefined

export const carrotRowKey = (plot: number, row: number): string => `${plot}:${row}`

export function carrotPlanAt(save: Pick<FarmSave, 'farm'>, index: number): CarrotPlan | undefined {
  return save.farm.carrotRows?.[carrotRowKey(Math.floor(index / FIELD_TILES), Math.floor(index % FIELD_TILES / FIELD_COLUMNS))]
}

export function setCarrotPlan<S extends FarmSave>(save: S, plot: number, row: number, plan: CarrotPlan | null): S {
  if (!Number.isInteger(plot) || !save.fields.plots[plot] || !Number.isInteger(row) || row < 0 || row >= FIELD_ROWS) {
    throw new SaveRuleError('bad-slot', 'Choose a row on a cleared plot.')
  }
  if (plan?.grade === 3 && plan.harvestNext) throw new SaveRuleError('bad-slot', 'G3 is the highest carrot grade.')
  const key = carrotRowKey(plot, row)
  const carrotRows = { ...save.farm.carrotRows }
  if (plan) carrotRows[key] = plan
  else delete carrotRows[key]
  return { ...save, farm: { ...save.farm, carrotRows } }
}

export function upgradedCarrot(save: Pick<FarmSave, 'farm'>, tile: Tile, index: number, level: number): 2 | 3 | undefined {
  if (tile.crop !== 'carrot' || !carrotPlanAt(save, index)?.harvestNext || tile.grade === 3) return undefined
  const grade = tile.grade ?? 1
  return level >= HARVEST_GRADE_LEVEL[grade] ? nextCarrotGrade(grade) : undefined
}

export function setCarrotReserve<S extends FarmSave>(save: S, grade: CarrotGrade, count: number): S {
  if (!Number.isInteger(count) || count < 0 || count > MAX_SEED_TARGET) throw new SaveRuleError('bad-count', 'Keep 0 to 99 carrots.')
  const reserves = { ...save.farm.reserves }
  const id = carrotGood(grade)
  if (count > 0) reserves[id] = count
  else delete reserves[id]
  return { ...save, farm: { ...save.farm, reserves } }
}

export function seedOutput(save: Pick<FarmSave, 'crops'>, grade: CarrotGrade, improve: boolean): CarrotGrade | undefined {
  if (!improve) return grade
  if (grade === 3 || (save.crops.carrot ?? 0) < SEED_KNOWLEDGE[grade]) return undefined
  return nextCarrotGrade(grade)
}

/** Manual and roster seed saving both take the lowest stars first. The grade identifies the input. */
export function saveCarrotSeedsAt<S extends FarmSave>(save: S, grade: CarrotGrade, improve: boolean, count: number, useReserved = false): S {
  if (!Number.isInteger(count) || count < 1 || count > SEED_BATCH) throw new SaveRuleError('bad-count', 'Save 1 to 4 seeds.')
  const output = seedOutput(save, grade, improve)
  if (!output) throw new SaveRuleError('locked', grade === 3 ? 'G3 is the highest carrot grade.' : `Grow ${SEED_KNOWLEDGE[grade]} carrot crop points first.`)
  const input = carrotGood(grade)
  const held = goodCount(save.items, input)
  if (held < count) throw new SaveRuleError('no-items', 'Not enough carrots of this grade.')
  if (!useReserved && held - (save.farm.reserves?.[input] ?? 0) < count) throw new SaveRuleError('locked', 'Those carrots are reserved.')
  let items = save.items
  let remaining = count
  for (const [i, n] of (save.items[input] ?? []).entries()) {
    const used = Math.min(n, remaining)
    if (used > 0) items = takeGoods(items, input, i + 1, used)
    remaining -= used
  }
  return { ...save, items: addGoods(items, carrotSeed(output), 1, count) }
}

export function saveCarrotSeeds<S extends FarmSave>(save: S, grade: CarrotGrade, improve: boolean, count: number, useReserved = false): S {
  return spend(saveCarrotSeedsAt(save, grade, improve, count, useReserved), 'save-seed')
}
