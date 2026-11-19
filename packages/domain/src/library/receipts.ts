import type { FarmSave } from '../save/v4'

export const RECENT_OUTINGS = 32
export const LIBRARY_KEY = /^(?=.{1,120}$)(?:route|evening|occasion|life|shared|art|fact|milestone|festival|expedition)(?::[a-z0-9][a-z0-9-]*){1,4}$/

/** A dated result. Null means that this activity has no grade. */
export type LibraryOuting = [day: number, key: string, score: number | null]
export type OutingTotals = [count: number, first: number, latest: number, best: number | null]
export interface LibraryReceipts {
  first: Record<string, number>
  recent: LibraryOuting[]
  totals: Record<string, OutingTotals>
  complete?: number
}

export const libraryReceipts = (save: Pick<FarmSave, 'library'>, id: string) => save.library?.[id]

export function recordLibrary<S extends FarmSave>(save: S, id: string, key: string, options: {
  day?: number; activity?: string; score?: number
} = {}): S {
  if (!save.roster[id] || !LIBRARY_KEY.test(key)) return save
  const day = options.day ?? save.calendar.day
  const book: LibraryReceipts = libraryReceipts(save, id) ?? { first: {}, recent: [], totals: {} }
  if (!options.activity && book.first[key] !== undefined) return save
  const first = book.first[key] === undefined ? { ...book.first, [key]: day } : book.first
  let { recent, totals } = book
  if (options.activity) {
    const activity = options.activity
    const [count, since, , best] = totals[activity] ?? [0, day, day, null]
    const score = options.score ?? null
    recent = [...recent, [day, key, score] as LibraryOuting].slice(-RECENT_OUTINGS)
    totals = { ...totals, [activity]: [count + 1, since, day, score === null ? best : Math.max(best ?? 0, score)] }
  }
  return { ...save, library: { ...save.library, [id]: { ...book, first, recent, totals } } }
}
