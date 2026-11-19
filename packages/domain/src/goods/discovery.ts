import { isDishId, type FarmSave } from '../save/v4'
import { isBaseFish, LEGACY_CROP_IDS, type CropId } from './ids'
import { parseStockKey } from '../save/warehouse'

/** Older crop counters proved only base produce. The carrot pilot kept its own exact proof. */
function legacyCropProof(save: Pick<FarmSave, 'farm' | 'crops'>, crop: string): boolean {
  return !save.farm.cropProofs && (crop !== 'carrot' || !save.farm.discoveries)
    && (LEGACY_CROP_IDS as readonly string[]).includes(crop) && (save.crops[crop as CropId] ?? 0) > 0
}

export function discovered(save: Pick<FarmSave, 'farm' | 'crops'> & Partial<Pick<FarmSave, 'diary'>>, id: string): boolean {
  return Object.hasOwn(save.farm.discoveries ?? {}, id) || legacyCropProof(save, id)
    || (isBaseFish(id) && (save.diary?.records[`size:${id}`] ?? 0) > 0)
    || (isDishId(id) && (save.farm.counts[`cooked:${id}`] ?? 0) > 0)
}

/** Call with the completed output and the crop counter as it stood before production. */
export function discoverOutput<S extends FarmSave>(save: S, id: string): S {
  if (discovered(save, id)) return save
  const legacy = save.farm.cropProofs ? {} : Object.fromEntries(LEGACY_CROP_IDS.filter((crop) => legacyCropProof(save, crop)).map((crop) => [crop, 0]))
  return { ...save, farm: { ...save.farm, cropProofs: true, discoveries: { ...legacy, ...save.farm.discoveries, [id]: save.calendar.day } } }
}

export function discoverStock<S extends FarmSave>(save: S, items: readonly string[]): S {
  return items.reduce((next, key) => {
    const at = parseStockKey(key)
    return at ? discoverOutput(next, at.id) : next
  }, save)
}
