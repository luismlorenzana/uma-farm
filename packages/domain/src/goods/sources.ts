import { SEASONS, SEASON_NAMES, type Season } from '../farm/calendar'
import { farmPlace, isBuildPlace } from '../farm/places'
import { CROPS } from '../fields/crops'
import { reachOf } from '../gathering/hauls'
import { AREA_NAMES, FISHING_SPOTS, FOREST_AREAS, SPOT_NAMES, STATION_JOBS, stationJobLevel, stationJobOf, stationJobUnits } from '../gathering/ids'
import { FISHERY, FOREST } from '../gathering/tables'
import { ANIMALS, HOME_NAMES } from '../ranch/ranch'
import { baseGoodId, cropGradeOf, goodOf, isBaseFish } from './ids'
import { goodName } from './names'
import { FISH_PROMOTION } from './production-catalogue'

export interface IngredientSource {
  label: string
  seasons: readonly Season[]
  rank: number
  input?: string
}

const seasonsLabel = (seasons: readonly Season[]): string =>
  seasons.length === SEASONS.length ? 'Any season' : seasons.map((season) => SEASON_NAMES[season]).join(' / ')

/** Normal production routes for one exact ID, ordered by when the farm can reach them. */
export function ingredientSources(id: string): IngredientSource[] {
  const good = goodOf(id)
  if (!good) return []
  const base = baseGoodId(id)
  const step = good.grade - goodOf(base)!.grade
  const job = stationJobOf(id)
  if (good.input && job) {
    const station = STATION_JOBS[job].station
    const place = farmPlace(station)
    const unlockRank = [0, 0, 3, 4, 5, 6][stationJobLevel(id)]!
    return [{
      label: `${place?.name} Lv ${stationJobLevel(id)} · ${stationJobUnits(id)} × ${goodName(good.input)}`,
      seasons: SEASONS, rank: Math.max(isBuildPlace(place) ? place.opens.rank : 1, unlockRank), input: good.input,
    }]
  }
  const animal = Object.values(ANIMALS).find((rule) => rule.good === base)
  if (animal) {
    const quality = step === 0 ? 'Standard' : step === 1 ? '3 hearts' : '9 hearts, or 7 with Animal care 6'
    return [{ label: `${HOME_NAMES[animal.home]} · ${animal.name} · ${quality}`, seasons: SEASONS, rank: animal.rank }]
  }
  if (isBaseFish(base)) {
    const promotion = step === 0 ? null : FISH_PROMOTION[step === 1 ? 'improved' : 'select']
    return FISHING_SPOTS.flatMap((spot): IngredientSource[] => {
      const seasons = SEASONS.filter((season) => FISHERY[spot].seasons[season].some(([fish, share]) => fish === base && share > 0))
      if (!seasons.length) return []
      const need = FISHERY[spot].needs
      const build = need ? farmPlace(need) : undefined
      const rank = Math.max(reachOf('fishery', spot), isBuildPlace(build) ? build.opens.rank : 1)
      const mode = promotion ? ` · Fishing ${promotion.aptitude} or ${promotion.manual} manual catches` : ''
      return [{ label: `${SPOT_NAMES[spot]} · ${seasonsLabel(seasons)}${need ? ` · ${build?.name}` : ''}${mode}`, seasons, rank }]
    }).sort((a, b) => a.rank - b.rank)
  }
  const crop = cropGradeOf(id)
  const growth = crop ? CROPS[crop.crop] : null
  const farm = growth ? [{
    label: `${growth.woody ? 'Orchard' : 'Field'} · ${seasonsLabel(growth.seasons)} · ${step > 0
      ? `G${good.grade} seed or Harvesting ${step === 1 ? 4 : 7} on G${good.grade - 1}`
      : growth.tier === 'rare' ? 'Seasonal seed prize' : 'Shop seed'}`,
    rank: growth.tier === 'rare' ? 6 : growth.tier, seasons: growth.seasons,
  }] : []
  const wild = step > 0 ? [] : FOREST_AREAS.flatMap((area): IngredientSource[] => {
    const seasons = SEASONS.filter((season) => FOREST[area].seasons[season].some(([found, share]) => found === id && share > 0))
    return seasons.length ? [{ label: `${AREA_NAMES[area]} · ${seasonsLabel(seasons)}`, seasons, rank: reachOf('forest', area) }] : []
  })
  return [...farm, ...wild].sort((a, b) => a.rank - b.rank)
}
