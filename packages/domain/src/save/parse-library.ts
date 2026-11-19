import { LIBRARY_KEY, RECENT_OUTINGS, type LibraryReceipts, type LibraryOuting, type OutingTotals } from '../library/receipts'
import { int, list, object, record } from './parse'
import { fail, member } from './parse-loop'

export function parseLibrary(value: unknown, path: string, roster: ReadonlySet<string>, today: number): Record<string, LibraryReceipts> {
  const key = (v: unknown) => typeof v === 'string' && LIBRARY_KEY.test(v) ? v : fail(path, 'unknown book entry')
  const day = (v: unknown, lo = 1) => int(v, path, lo, today)
  const score = (v: unknown) => v === null ? null : int(v, path, 0, 100)
  const map = <T>(value: unknown, max: number, parse: (v: unknown) => T): Record<string, T> =>
    Object.fromEntries(list(Object.entries(record(value, path)), path, 0, max).map((v) => {
      const [id, entry] = v as [string, unknown]
      return [key(id), parse(entry)]
    }))
  return Object.fromEntries(Object.entries(record(value, path)).map(([id, v]) => {
    member(id, path, roster)
    const row = object(v, path, ['first', 'recent', 'totals', 'complete'])
    const first = map(row.first, 512, dayValue => day(dayValue))
    let latest = 1
    const recent = list(row.recent, path, 0, RECENT_OUTINGS).map((row) => {
      const [at, entry, mark] = list(row, path, 3, 3)
      const id = key(entry)
      if (first[id] === undefined) fail(path, 'missing first receipt')
      latest = day(at, Math.max(latest, first[id]!))
      return [latest, id, score(mark)] satisfies LibraryOuting
    })
    const totals = map(row.totals, 192, (row) => {
      const [n, since, latest, best] = list(row, path, 4, 4)
      const from = day(since)
      return [int(n, path, 1, Number.MAX_SAFE_INTEGER), from, day(latest, from), score(best)] satisfies OutingTotals
    })
    return [id, { first, recent, totals, ...(row.complete === undefined ? {} : { complete: day(row.complete) }) } satisfies LibraryReceipts]
  }))
}
