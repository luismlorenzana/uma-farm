import { spend } from '../farm/actions'
import { dateOf, SEASONS, type Season } from '../farm/calendar'
import { farmRankOf } from '../farm/farm'
import { setStockReserve } from '../farm/production'
import { canSaveCropSeed, cropBaseGrade, cropGoodId, cropSeedId, seedId, type CropId } from '../goods/ids'
import { itemNameOf } from '../items/lines'
import { SaveRuleError } from '../save/rules'
import { FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, type FarmSave, type FieldPlan, type Tile } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import { growsIn, plantableIn } from './crops'
import { RARE_CROPS } from './plantables'

export const SEED_BATCH = 4
export const MAX_SEED_TARGET = 99
export const RARE_SEED_RANK = 6
const SEED_KNOWLEDGE = [3, 12] as const
const HARVEST_GRADE_LEVEL = [4, 7] as const

export const fieldRowKey = (plot: number, row: number): string => `${plot}:${row}`
export const fieldPlanKey = (plot: number, row: number, season: Season): string => `${fieldRowKey(plot, row)}:${season}`
const localRow = (index: number): number => Math.floor(index % FIELD_TILES / FIELD_COLUMNS)

export function rowPlan(save: Pick<FarmSave, 'farm'>, plot: number, row: number, season: Season): FieldPlan | undefined {
  const key = fieldRowKey(plot, row)
  const plan = save.farm.fieldPlans?.[`${key}:${season}`]
  if (plan) return plan
  const carrot = season === 'spring' ? save.farm.carrotRows?.[key] : undefined
  if (carrot) return { crop: 'carrot', ...carrot }
}

/** Undefined leaves old assignments in charge. A managed row with an empty season is idle. */
export function plantingPlan(save: Pick<FarmSave, 'farm' | 'calendar'>, index: number): FieldPlan | null | undefined {
  const plot = Math.floor(index / FIELD_TILES)
  const row = localRow(index)
  return rowPlan(save, plot, row, dateOf(save.calendar.day, save.calendar).season)
    ?? (SEASONS.some((season) => rowPlan(save, plot, row, season)) ? null : undefined)
}

export function setFieldPlan<S extends FarmSave>(save: S, plot: number, row: number, season: Season, plan: FieldPlan | null): S {
  if (!Number.isInteger(plot) || !save.fields.plots[plot] || !Number.isInteger(row) || row < 0 || row >= FIELD_ROWS) {
    throw new SaveRuleError('bad-slot', 'Choose a row on a cleared plot.')
  }
  if (plan?.crop && (!plantableIn(plan.crop, season) || !cropGoodId(plan.crop, plan.grade))) {
    throw new SaveRuleError('bad-slot', 'Choose a crop and grade that can be planted that season.')
  }
  if (plan?.crop && plan.harvestNext && !cropGoodId(plan.crop, plan.grade + 1)) {
    throw new SaveRuleError('bad-slot', 'This is the highest grade.')
  }
  const key = fieldPlanKey(plot, row, season)
  const fieldPlans = { ...save.farm.fieldPlans }
  if (plan) fieldPlans[key] = plan
  else delete fieldPlans[key]
  const farm = { ...save.farm, fieldPlans }
  if (season === 'spring' && farm.carrotRows?.[fieldRowKey(plot, row)]) {
    farm.carrotRows = { ...farm.carrotRows }
    delete farm.carrotRows[fieldRowKey(plot, row)]
  }
  return { ...save, farm }
}

/** Null means a planned upgrade must wait. Undefined means harvest the planted grade. */
export function harvestGrade(save: Pick<FarmSave, 'farm' | 'calendar'>, tile: Tile, index: number, level: number): number | null | undefined {
  if (!tile.crop) return undefined
  const { crop } = tile
  const grade = tile.grade ?? cropBaseGrade(crop)
  if (!cropGoodId(crop, grade + 1)) return undefined
  const plot = Math.floor(index / FIELD_TILES)
  const row = localRow(index)
  const season = SEASONS.indexOf(dateOf(save.calendar.day, save.calendar).season)
  // An unpicked crop can carry into the next season. Use the latest applicable plan.
  let plan: FieldPlan | undefined
  for (let offset = 0; offset < SEASONS.length; offset++) {
    const candidate = rowPlan(save, plot, row, SEASONS[(season + SEASONS.length - offset) % SEASONS.length]!)
    if (candidate && (candidate.crop === null || candidate.crop === crop)) {
      plan = candidate
      break
    }
  }
  if (!plan?.harvestNext) return undefined
  const required = HARVEST_GRADE_LEVEL[grade - cropBaseGrade(crop)]!
  return level >= required ? grade + 1 : null
}

export function setCropReserve<S extends FarmSave>(save: S, crop: CropId, grade: number, count: number): S {
  const id = cropGoodId(crop, grade)
  if (!id) throw new SaveRuleError('no-items', 'Unknown crop grade.')
  return setStockReserve(save, id, count)
}

export const seedKnowledge = (crop: CropId, grade: number): number | undefined =>
  cropGoodId(crop, grade) && cropGoodId(crop, grade + 1) ? SEED_KNOWLEDGE[grade - cropBaseGrade(crop)] : undefined

export function seedOutput(save: Pick<FarmSave, 'crops'>, crop: CropId, grade: number, improve: boolean): number | undefined {
  if (!canSaveCropSeed(crop) || !cropGoodId(crop, grade)) return undefined
  if (!improve) return grade
  const required = seedKnowledge(crop, grade)
  return required !== undefined && (save.crops[crop] ?? 0) >= required ? grade + 1 : undefined
}

/** Manual and roster seed saving share the same grade, star order, and stock floor. */
export function saveCropSeedsAt<S extends FarmSave>(save: S, crop: CropId, grade: number, improve: boolean, count: number, useReserved = false): S {
  if (!Number.isInteger(count) || count < 1 || count > SEED_BATCH) throw new SaveRuleError('bad-count', 'Save 1 to 4 seeds.')
  const output = seedOutput(save, crop, grade, improve)
  const input = cropGoodId(crop, grade)
  if (!output || !input) {
    const required = seedKnowledge(crop, grade)
    throw new SaveRuleError('locked', required === undefined ? 'This seed cannot be saved or improved here.' : `Grow ${required} ${itemNameOf(crop)} crop points first.`)
  }
  const held = goodCount(save.items, input)
  if (held < count) throw new SaveRuleError('no-items', 'Not enough produce of this grade.')
  if (!useReserved && held - (save.farm.reserves?.[input] ?? 0) < count) throw new SaveRuleError('locked', 'That produce is reserved.')
  let items = save.items
  let remaining = count
  for (const [i, n] of (items[input] ?? []).entries()) {
    const used = Math.min(n, remaining)
    if (used > 0) items = takeGoods(items, input, i + 1, used)
    remaining -= used
  }
  return { ...save, items: addGoods(items, cropSeedId(crop, true, output), 1, count) }
}

export function saveCropSeeds<S extends FarmSave>(save: S, crop: CropId, grade: number, improve: boolean, count: number, useReserved = false): S {
  return spend(saveCropSeedsAt(save, crop, grade, improve, count, useReserved), 'save-seed')
}

/** One seed of each rare crop in its season, renewed each year after Farm Rank 6. */
export function awardRareSeeds<S extends FarmSave>(save: S): { save: S; crops: CropId[] } {
  if (farmRankOf(save.farm.points) < RARE_SEED_RANK) return { save, crops: [] }
  const { season, year } = dateOf(save.calendar.day, save.calendar)
  const key = (crop: CropId) => `rare-seed:${crop}`
  const crops = RARE_CROPS.filter((crop) => growsIn(crop, season) && (save.farm.counts[key(crop)] ?? 0) < year)
  if (!crops.length) return { save, crops }
  const items = crops.reduce((stock, crop) => addGoods(stock, seedId(crop), 1, 1), save.items)
  const counts = { ...save.farm.counts, ...Object.fromEntries(crops.map((crop) => [key(crop), year])) }
  return { save: { ...save, items, farm: { ...save.farm, counts } }, crops }
}
