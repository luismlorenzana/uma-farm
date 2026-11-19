import { gradeVariants } from '../goods/ids'
import { FISH_MODES, FISH_PROMOTION, type FishMode } from '../goods/production-catalogue'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'
import { FISHING_SPOTS, type FishingSpotId } from './ids'

export const FISH_MODE_NAMES: Readonly<Record<FishMode, string>> = {
  standard: 'Standard', improved: 'Improved catch', select: 'Select catch',
}

export function setFishingMode<S extends FarmSave>(save: S, spot: FishingSpotId, mode: FishMode): S {
  if (!FISHING_SPOTS.includes(spot) || !FISH_MODES.includes(mode)) throw new SaveRuleError('bad-job', 'Choose a spot and catch mode.')
  const fishingModes = { ...save.farm.fishingModes }
  if (mode === 'standard') delete fishingModes[spot]
  else fishingModes[spot] = mode
  return { ...save, farm: { ...save.farm, fishingModes } }
}

/** Manual qualifications count landed fish only. A worker brings her actual aptitude. */
export function catchGrade<S extends FarmSave>(save: S, species: string, mode: FishMode, aptitude?: number, manual = false): { save: S; id: string } {
  const previous = save.farm.manualCatches ?? 0
  let next = manual ? { ...save, farm: { ...save.farm, manualCatches: previous + 1 } } : save
  if (mode === 'standard') return { save: next, id: species }
  const rule = FISH_PROMOTION[mode]
  const upgrade = gradeVariants(species)[rule.step]
  if (!upgrade || (manual ? previous < rule.manual : (aptitude ?? 0) < rule.aptitude)) return { save: next, id: species }
  const key = `${species}:${rule.step}`
  const count = ((next.farm.fishRemainders?.[key] ?? 0) + 1) % rule.every
  next = { ...next, farm: { ...next.farm, fishRemainders: { ...next.farm.fishRemainders, [key]: count } } }
  return { save: next, id: count === 0 ? upgrade.id : species }
}
