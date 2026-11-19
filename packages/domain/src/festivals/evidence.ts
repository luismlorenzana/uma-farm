import { dateOf } from '../farm/calendar'
import { goodOf, type CropId } from '../goods/ids'
import type { FarmSave } from '../save/v4'
import { stockKey, takeGoods } from '../save/warehouse'
import { withFestival, type CupCategory, type FlowerMark } from './state'

export const FLOWER_WINDOW = 10
export const CARE_WINDOW = 7
export const CUP_WINDOW = 3

function flowerDate(mark: FlowerMark, day: number, by: string | null) {
  const dates = mark.dates.filter((date) => date.day > day - FLOWER_WINDOW)
  const last = dates.find((date) => date.day === day)
  return last
    ? dates.map((date) => date === last && by && !date.hands.includes(by) ? { ...date, hands: [...date.hands, by] } : date)
    : [...dates, { day, hands: by ? [by] : [] }]
}

export function flowerPlanted<S extends FarmSave>(save: S, tile: number, crop: CropId, by: string | null): S {
  const state = save.workshops.festival
  const mark = state?.mark
  if (!mark || mark.tile !== tile) return save
  if (mark.crop !== crop) return clearFlowerMark(save, tile)
  return withFestival(save, { ...state, mark: { ...mark, dates: flowerDate(mark, save.calendar.day, by) } })
}

export function flowerWatered<S extends FarmSave>(save: S, tile: number, by: string | null): S {
  const state = save.workshops.festival
  const mark = state?.mark
  return mark?.tile === tile ? withFestival(save, { ...state, mark: { ...mark, water: by } }) : save
}

export function flowerGrew<S extends FarmSave>(save: S, grew: boolean): S {
  const state = save.workshops.festival
  const mark = state?.mark
  if (!mark || mark.water === undefined) return save
  const { water, ...rest } = mark
  return withFestival(save, { ...state, mark: { ...rest, dates: grew ? flowerDate(mark, save.calendar.day, water) : mark.dates } })
}

export function clearFlowerMark<S extends FarmSave>(save: S, tile: number): S {
  const state = save.workshops.festival
  if (!state?.mark || state.mark.tile !== tile) return save
  const { mark: _, ...rest } = state
  return withFestival(save, rest)
}

export function flowerHarvested<S extends FarmSave>(save: S, tile: number, crop: CropId, lots: readonly { id: string; stars: number }[], by: string | null): S {
  const state = save.workshops.festival
  const mark = state?.mark
  if (!mark || mark.tile !== tile) return save
  const day = save.calendar.day
  if (mark.crop !== crop || state.box || dateOf(day).year !== mark.year) return clearFlowerMark(save, tile)
  const best = [...lots].sort((a, b) => b.stars - a.stars || goodOf(b.id)!.grade - goodOf(a.id)!.grade)[0]
  if (!best) return clearFlowerMark(save, tile)
  const next = clearFlowerMark(save, tile)
  return withFestival({ ...next, items: takeGoods(next.items, best.id, best.stars, 1) }, {
    ...next.workshops.festival, box: { year: mark.year, key: stockKey(best.id, best.stars), dates: flowerDate(mark, day, by) },
  })
}

export function noteAnimalCare<S extends FarmSave>(save: S, animal: string, by: string | null): S {
  const state = save.workshops.festival
  const day = save.calendar.day
  const trail = state?.care?.[animal] ?? []
  if (trail.some((receipt) => receipt.day === day)) return save
  return withFestival(save, { ...state, care: { ...state?.care, [animal]: [...trail.filter((receipt) => receipt.day > day - CARE_WINDOW), { day, by }] } })
}

export function noteCupWork<S extends FarmSave>(save: S, by: string, category: CupCategory): S {
  const state = save.workshops.festival
  const day = save.calendar.day
  const work = state?.worked?.[by]
  if (work?.[category] === day) return save
  return withFestival(save, { ...state, worked: { ...state?.worked, [by]: { ...work, [category]: day } } })
}
