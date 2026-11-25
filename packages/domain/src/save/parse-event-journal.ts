import { FESTIVAL_IDS } from '../farm/calendar'
import type { EventJournal, EventStock, FestivalReceipt } from '../festivals/journal'
import { int, list, object, oneOf, record, text } from './parse'
import { fail, member, unique } from './parse-loop'
import { isStockId, parseStockKey } from './warehouse'
import type { TodayV4 } from './v4'

export function parseEventFunding(value: unknown, path: string, roster: ReadonlySet<string>): NonNullable<TodayV4['eventFunding']> {
  const raw = object(value, path, ['contest', 'newYear', 'festival', 'social', 'birthdays'])
  return {
    ...(raw.contest === undefined ? {} : { contest: int(raw.contest, path + '.contest', 1, 3) }),
    ...(raw.newYear === undefined ? {} : { newYear: int(raw.newYear, path + '.newYear', 1, 3) }),
    ...(raw.festival === undefined ? {} : { festival: int(raw.festival, path + '.festival', 1, 3) }),
    ...(raw.social === undefined ? {} : { social: int(raw.social, path + '.social', 1, 1) }),
    ...(raw.birthdays === undefined ? {} : { birthdays: unique(list(raw.birthdays, path + '.birthdays', 0, roster.size)
      .map((id, i) => member(id, `${path}.birthdays.${i}`, roster)), path + '.birthdays') }),
  }
}

function stock(value: unknown, path: string): EventStock[] {
  const rows = list(value, path, 0, 3).map((row, i) => {
    const at = `${path}.${i}`
    const o = object(row, at, ['key', 'count'])
    const key = text(o.key, at + '.key')
    const parsed = parseStockKey(key)
    if (!parsed || !isStockId(parsed.id)) fail(at + '.key', 'expected an exact stock key')
    return { key, count: int(o.count, at + '.count', 1, 3) }
  })
  unique(rows.map(row => row.key), path)
  return rows
}

export function parseEventJournal(value: unknown, path: string, roster: ReadonlySet<string>, today: number): EventJournal {
  const raw = object(value, path, ['plan', 'visits', 'results', 'birthdays'])
  const out: EventJournal = {}
  if (raw.plan !== undefined) {
    const at = path + '.plan'
    const o = object(raw.plan, at, ['id', 'day', 'stock'])
    out.plan = { id: oneOf(o.id, at + '.id', FESTIVAL_IDS), day: int(o.day, at + '.day', today, today + 120), stock: stock(o.stock, at + '.stock') }
  }
  if (raw.visits !== undefined) {
    out.visits = list(raw.visits, path + '.visits', 0, 600).map((row, i) => {
      const at = `${path}.visits.${i}`
      const o = object(row, at, ['id', 'day'])
      const id = text(o.id, at + '.id')
      if (!/^[a-z][a-z0-9-]{0,47}$/.test(id)) fail(at + '.id', 'expected an event id')
      return { id, day: int(o.day, at + '.day', 1, today) }
    })
    unique(out.visits.map(row => row.id + ':' + row.day), path + '.visits')
  }
  if (raw.results !== undefined) {
    out.results = list(raw.results, path + '.results', 0, 600).map((row, i): FestivalReceipt => {
      const at = `${path}.results.${i}`
      const o = object(row, at, ['id', 'day', 'score', 'place', 'rivals', 'gold', 'points', 'cost', 'stock', 'staff', 'credit'])
      const names = (key: 'staff' | 'credit') => unique(list(o[key], at + '.' + key, 0, 5).map(id => member(id, at + '.' + key, roster)), at + '.' + key)
      return { id: oneOf(o.id, at + '.id', FESTIVAL_IDS), day: int(o.day, at + '.day', 1, today),
        score: o.score === null ? null : int(o.score, at + '.score', 0, 200),
        place: o.place === null ? null : int(o.place, at + '.place', 1, 3) as 1 | 2 | 3,
        rivals: list(o.rivals, at + '.rivals', 2, 2).map(n => int(n, at + '.rivals', 0, 200)),
        gold: int(o.gold, at + '.gold', 0, Number.MAX_SAFE_INTEGER), points: int(o.points, at + '.points', 0, 150),
        cost: int(o.cost, at + '.cost', 0, Number.MAX_SAFE_INTEGER), stock: stock(o.stock, at + '.stock'), staff: names('staff'), credit: names('credit') }
    })
    unique(out.results.map(row => row.id + ':' + row.day), path + '.results')
  }
  if (raw.birthdays !== undefined) {
    out.birthdays = Object.fromEntries(Object.entries(record(raw.birthdays, path + '.birthdays')).map(([id, year]) =>
      [member(id, path + '.birthdays', roster), int(year, path + '.birthdays.' + id, 1, today)]))
  }
  return out
}
