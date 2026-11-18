import type { FarmSave } from '../save/v4'

/** The old crop counter starts at zero on planting and only harvests can increment it. */
export function discovered(save: Pick<FarmSave, 'farm' | 'crops'>, id: string): boolean {
  if (save.farm.discoveries) return Object.hasOwn(save.farm.discoveries, id)
  return id === 'carrot' && (save.crops.carrot ?? 0) > 0
}

/** Call with the completed output and the crop counter as it stood before production. */
export function discoverOutput<S extends FarmSave>(save: S, id: string): S {
  if (discovered(save, id)) return save
  const prior = save.farm.discoveries ?? (discovered(save, 'carrot') ? { carrot: 0 } : {})
  return { ...save, farm: { ...save.farm, discoveries: { ...prior, [id]: save.calendar.day } } }
}
