import { plantingPlan } from '../fields/production'
import { seedsInSeason } from '../fields/fields'
import { cropBaseGrade, seedOf } from '../goods/ids'
import { FODDER_PRICE, siloRoom, siloStands } from '../ranch/ranch'
import { lineOpen, shopLines } from '../save/shop'
import { fieldTiles, type FarmSave } from '../save/v4'

export interface RestockItem { id: string; count: number; cost: number; store: 'shop' | 'ranch' }

export function restockList(save: FarmSave): RestockItem[] {
  const lines = shopLines(save).filter(line => lineOpen(save, line))
  const available = seedsInSeason(save)
  const wanted = new Map<string, number>()
  const ripeSlots = fieldTiles(save).entries()
  let unplanned = 0
  for (const [index, tile] of ripeSlots) {
    if (tile.ground !== 'tilled' || tile.crop) continue
    const plan = plantingPlan(save, index)
    if (plan === undefined) { unplanned++; continue }
    if (!plan?.crop) continue
    if (plan.grade !== cropBaseGrade(plan.crop)) continue
    const line = lines.find(line => seedOf(line.id)?.crop === plan.crop)
    if (line) wanted.set(line.id, (wanted.get(line.id) ?? 0) + 1)
  }
  const freeSeeds = available.reduce((sum, seed) => sum + seed.count, 0)
  const common = unplanned > freeSeeds ? lines.find(line => !wanted.has(line.id)) : undefined
  if (common) wanted.set(common.id, unplanned - freeSeeds)
  const result: RestockItem[] = lines.flatMap(line => {
    const crop = seedOf(line.id)?.crop
    const planned = wanted.get(line.id) ?? 0
    const held = line.id === common?.id || !crop ? 0 : available.filter(row => row.crop === crop && (row.grade ?? cropBaseGrade(crop)) === cropBaseGrade(crop))
      .reduce((sum, row) => sum + row.count, 0)
    const count = Math.min(99, planned - held)
    return count > 0 ? [{ id: line.id, count, cost: count * line.price, store: 'shop' as const }] : []
  })
  const use = save.ranch.animals.length
  const feed = Math.min(99, siloRoom(save), use * 7 - save.ranch.silo)
  if (siloStands(save) && use && save.ranch.silo < use * 3 && feed > 0) {
    result.push({ id: 'fodder', count: feed, cost: feed * FODDER_PRICE, store: 'ranch' })
  }
  return result
}
