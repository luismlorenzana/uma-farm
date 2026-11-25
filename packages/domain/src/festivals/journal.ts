import { dateDayOf, dateOf, DAYS_PER_YEAR, festivalOn, isNewYear, type FestivalId } from '../farm/calendar'
import type { SpecialDays } from '../farm/actions'
import { isDishId, type FarmSave } from '../save/v4'
import { addGoods, parseStockKey, takeGoods } from '../save/warehouse'
import { SaveRuleError } from '../save/rules'
import { hasPrice, priceOf } from '../goods/prices'
import { availableDishes } from '../expeditions/stock'

export interface EventStock { key: string; count: number }
export interface FestivalPlan { id: FestivalId; day: number; stock: EventStock[] }
export interface FestivalReceipt {
  id: FestivalId
  day: number
  score: number | null
  place: 1 | 2 | 3 | null
  rivals: number[]
  gold: number
  points: number
  cost: number
  stock: EventStock[]
  staff: string[]
  credit: string[]
}

export interface EventJournal {
  plan?: FestivalPlan
  visits?: { id: string; day: number }[]
  results?: FestivalReceipt[]
  birthdays?: Record<string, number>
}

export const eventKey = (id: string, day: number, uma?: string): string => `${id}:${day}${uma ? ':' + uma : ''}`
export const eventVisited = (save: FarmSave, id: string, day = save.calendar.day) =>
  save.eventJournal?.visits?.some(row => row.id === id && row.day === day) ?? false

export function visitFestival<S extends FarmSave>(save: S, id: string, day: number, days: SpecialDays): S {
  if (save.calendar.day !== day || !(festivalOn(day, days.festivals, save.calendar)?.id === id || (id === 'new-year' && isNewYear(day, save.calendar) && dateOf(day, save.calendar).year > 1))) {
    throw new SaveRuleError('not-ready', 'Visit on the event date.')
  }
  if (eventVisited(save, id, day)) return save
  return { ...save, eventJournal: { ...save.eventJournal, visits: [...save.eventJournal?.visits ?? [], { id, day }].slice(-600) } }
}

export const ownsEventStock = (save: FarmSave, { key, count }: EventStock): boolean => {
  const at = parseStockKey(key)
  return !!at && (isDishId(at.id) ? availableDishes(save, key) : save.items[at.id]?.[at.stars - 1] ?? 0) >= count
}

/** Exact units leave the ordinary Warehouse while reserved. Every stock consumer sees the same available quantities. */
export function releaseFestivalPlan<S extends FarmSave>(save: S): S {
  const plan = save.eventJournal?.plan
  if (!plan) return save
  const { plan: _plan, ...journal } = save.eventJournal!
  let items = save.items
  for (const { key, count } of plan.stock) {
    const at = parseStockKey(key)!
    items = addGoods(items, at.id, at.stars, count)
  }
  return { ...save, items, eventJournal: journal }
}

export function setFestivalPlan<S extends FarmSave>(save: S, plan: FestivalPlan | null, days: SpecialDays): S {
  const free = releaseFestivalPlan(save)
  if (!plan) return free
  if (plan.day < save.calendar.day || plan.day - save.calendar.day > DAYS_PER_YEAR
    || festivalOn(plan.day, days.festivals, save.calendar)?.rule !== plan.id
    || plan.stock.length > 3 || new Set(plan.stock.map(row => row.key)).size !== plan.stock.length
    || plan.stock.some(row => !Number.isSafeInteger(row.count) || row.count < 1 || row.count > 3)) {
    throw new SaveRuleError('bad-job', 'Choose a contest in the next farm year and its exact exhibit lots.')
  }
  let next = free
  for (const row of plan.stock) {
    if (!ownsEventStock(next, row)) throw new SaveRuleError('no-items', 'An exact exhibit lot is short.')
    const at = parseStockKey(row.key)!
    next = { ...next, items: takeGoods(next.items, at.id, at.stars, row.count) }
  }
  return { ...next, eventJournal: { ...next.eventJournal, plan: { ...plan, stock: plan.stock.map(row => ({ ...row })) } } }
}

/** Preview and entry share this release. A failed validation leaves the original held lots intact. */
export function festivalEntryStock<S extends FarmSave>(save: S, id: FestivalId): S {
  const plan = save.eventJournal?.plan
  return plan?.id === id && plan.day === save.calendar.day ? releaseFestivalPlan(save) : save
}

export function expireFestivalPlan<S extends FarmSave>(save: S, days: SpecialDays): S {
  const plan = save.eventJournal?.plan
  return plan && (plan.day < save.calendar.day || festivalOn(plan.day, days.festivals, save.calendar)?.rule !== plan.id)
    ? releaseFestivalPlan(save) : save
}

export function recordFestivalReceipt<S extends FarmSave>(save: S, receipt: Omit<FestivalReceipt, 'cost'>): S {
  const { id, day, stock } = receipt
  const rows = save.eventJournal?.results ?? []
  if (rows.some(row => row.id === id && row.day === day)) return save
  const cost = stock.reduce((sum, lot) => {
    const at = parseStockKey(lot.key)
    return sum + (at && hasPrice(at.id) ? priceOf(at.id, at.stars, dateDayOf(day, save.calendar)) * lot.count : 0)
  }, 0)
  return { ...save, eventJournal: { ...save.eventJournal, results: [...rows, { ...receipt, cost }].slice(-600) } }
}
