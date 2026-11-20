// The save's envelope: v5 is the one save; an older save (v1–v4) reads as its version and account only, and a newer one
// is refused. Invented data only.
import { describe, expect, it } from 'vitest'
import { expandCalendar, isOlderSave, parseSave, parseSavePut, parseStored, resolveConflict, SAVE_VERSION, SaveParseError, touched, versionOf } from './save'
import { dateOf, festivalOn, FESTIVALS, turnOnDate, workNow, yearlyDate } from '../farm/calendar'
import { GAME_DAYS } from '../farm/actions'
import { castDerby, enterDerby } from '../festivals/contests'
import { runNight } from '../night/end-day'
import { freshV6, newLove, newRosterUma, newSave, type SaveV5 } from './v4'

const AT = '2026-11-08T10:00:00.000Z'
const LATER = '2026-11-08T11:00:00.000Z'
const ACCOUNT = { uid: 'u1', createdAt: AT, updatedAt: LATER }
/** An older save as a device or the server holds it: its body is never read. */
const V3 = { version: 3, account: ACCOUNT, calendar: { day: 12 }, gold: 812, start: { redraws: 1 }, visitors: [] }
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('save v6', () => {
  it('is the version the farm reads and writes', () => {
    expect(SAVE_VERSION).toBe(6)
    expect(newSave('u1', AT)).toMatchObject({ version: 6, account: { uid: 'u1', createdAt: AT, updatedAt: AT } })
  })

  it('round-trips through JSON, and never moves updatedAt while parsing', () => {
    const save = { ...newSave('u1', AT), account: ACCOUNT }
    expect(parseSave(json(save))).toEqual(save)
    expect(parseSave(json(save)).account.updatedAt).toBe(LATER)
  })

  it('moves updatedAt only on a change', () => {
    expect(touched(newSave('u1', AT), LATER).account).toEqual(ACCOUNT)
  })

  it('refuses an older save, a newer one, unknown keys and a missing version, saying where', () => {
    expect(() => parseSave(V3)).toThrow('save.version: expected 6: an older save starts over on the device')
    expect(() => parseSave({ version: 1, account: ACCOUNT })).toThrow(SaveParseError)
    expect(() => parseSave({ version: 7, account: {} })).toThrow(/newer than this app/)
    expect(() => parseSave({ ...newSave('u1', AT), extra: 1 })).toThrow(/unknown keys extra/)
    expect(() => parseSave(null)).toThrow('save.version: expected 6')
  })
})

describe('a stored save', () => {
  it('reads a v6 strictly', () => {
    const save = newSave('u1', AT)
    expect(parseStored(json(save))).toEqual(save)
    expect(() => parseStored({ ...json(save), gold: -1 })).toThrow('save.gold')
  })

  it('reads an older save as its version and account only, whatever else it holds', () => {
    // v4's farm of blocks and the Umas' jobs starts over too.
    const v4 = { version: 4, account: ACCOUNT, calendar: { day: 30 }, fields: { blocks: [{ id: 'A', tender: null, plots: [] }] }, work: {} }
    expect(parseStored(v4)).toEqual({ version: 4, account: ACCOUNT })
    expect(isOlderSave(parseStored(v4))).toBe(true)
    expect(freshV6(parseStored(v4)).account).toEqual(ACCOUNT)
    expect(parseStored(V3)).toEqual({ version: 3, account: ACCOUNT })
    expect(parseStored({ version: 2, account: ACCOUNT, umas: {}, items: {}, buildings: {}, work: {} })).toEqual({ version: 2, account: ACCOUNT })
    expect(parseStored({ version: 1, account: ACCOUNT })).toEqual({ version: 1, account: ACCOUNT })
    expect(isOlderSave(parseStored(V3))).toBe(true)
    expect(isOlderSave(newSave('u1', AT))).toBe(false)
    expect(() => parseStored({ ...V3, account: { ...ACCOUNT, createdAt: 'soon' } })).toThrow('save.account.createdAt')
  })

  it('refuses a newer save and a value with no version', () => {
    expect(() => parseStored({ version: 7, account: ACCOUNT })).toThrow(/newer than this app/)
    expect(() => parseStored({ account: ACCOUNT })).toThrow('save.version: expected 6')
  })

  it('starts a fresh v6 from an older save with its account whole', () => {
    const fresh = freshV6(parseStored(V3))
    expect(fresh).toEqual({ ...newSave('u1', AT), account: ACCOUNT })
    expect(fresh.account.updatedAt).toBe(LATER)
  })
})

describe('the envelope', () => {
  it('reads the version a value claims', () => {
    expect(versionOf({ version: 1 })).toBe(1)
    expect(versionOf({})).toBe(0)
    expect(versionOf(null)).toBe(0)
  })

  it('keeps the save changed last, and this device on a tie', () => {
    const early = newSave('u1', AT)
    const late = touched(early, LATER)
    expect(resolveConflict(early, late)).toBe(late)
    expect(resolveConflict(late, early)).toBe(late)
    const twin = touched(early, AT)
    expect(resolveConflict(early, twin)).toBe(early)
  })

  it('parses an upload: a v6 only', () => {
    const save = newSave('u1', AT)
    expect(parseSavePut({ baseRevision: 3, save: json(save) })).toEqual({ baseRevision: 3, save })
    expect(() => parseSavePut({ baseRevision: 0, save: V3 })).toThrow('body.save.version: expected 6')
    expect(() => parseSavePut({ baseRevision: -1, save })).toThrow(/body.baseRevision/)
    expect(() => parseSavePut({ baseRevision: 0, save, more: true })).toThrow(/unknown keys more/)
  })
})

describe('the transition to 30 days', () => {
  it('keeps the date, work clock, receipts and live state while translating a future wedding appointment', () => {
    const base = newSave('u1', AT)
    const [spouse, fiancee] = ['9000001', '9000002']
    const legacy: SaveV5 = {
      ...base, version: 5, account: ACCOUNT, calendar: { day: 26 }, gold: 640,
      today: { ...base.today, actions: 7, town: true },
      roster: { [spouse]: newRosterUma(3), [fiancee]: newRosterUma(6) },
      love: {
        [spouse]: { ...newLove(), stage: 'spouse', level: 1, wed: 14, house: 0 },
        [fiancee]: { ...newLove(), stage: 'wedding', level: 10, weddingDay: 39 },
      },
      library: { [spouse]: { first: { 'life:wedding-night': 14 }, totals: {}, recent: [] } },
    }
    expect(parseStored(json(legacy))).toEqual(legacy)
    expect(() => parseSave(legacy)).toThrow('update the farm to convert this save')
    const expanded = expandCalendar(legacy)
    expect(expanded).toEqual({
      ...legacy, version: 6, calendar: { day: 26, expandedAt: 26 },
      love: { ...legacy.love, [fiancee]: { ...legacy.love[fiancee]!, weddingDay: 57 } },
    })
    expect(dateOf(26, expanded.calendar)).toEqual({ year: 1, season: 'autumn', day: 2 })
    expect(dateOf(14, expanded.calendar)).toEqual({ year: 1, season: 'summer', day: 2 })
    expect(dateOf(57, expanded.calendar)).toEqual({ year: 1, season: 'winter', day: 3 })
    expect(dateOf(yearlyDate(14, 1, expanded.calendar), expanded.calendar)).toEqual({ year: 2, season: 'summer', day: 2 })
    expect(turnOnDate({ year: 1, season: 'summer', day: 13 }, expanded.calendar)).toBeNull()
    expect(workNow(expanded)).toBe(workNow(legacy))
    expect(parseSave(json(expanded))).toEqual(expanded)
    expect(runNight(expanded, {}).calendar).toEqual({ day: 27, expandedAt: 26 })
  })

  it('keeps a Spring 1 restart and its original earlier receipts', () => {
    const legacy: SaveV5 = { ...newSave('u1', AT), version: 5, calendar: { day: 10, start: 10 } }
    const expanded = expandCalendar(legacy)
    expect(dateOf(10, expanded.calendar)).toEqual({ year: 1, season: 'spring', day: 1 })
    expect(dateOf(4, expanded.calendar)).toEqual({ year: 1, season: 'spring', day: 4 })
    expect(dateOf(40, expanded.calendar)).toEqual({ year: 1, season: 'summer', day: 1 })
  })

  it('lets a Derby already started on the old date finish once after the upgrade', () => {
    const base = { ...newSave('u1', AT), calendar: { day: 22, expandedAt: 22 } }
    const festivals = FESTIVALS.map(event => event.id === 'fishing-derby' ? { ...event, day: 10 } : event)
    const entered = enterDerby(base, 'pond', [null, null, null], { days: { ...GAME_DAYS, festivals }, story: null })
    const legacy: SaveV5 = { ...castDerby(entered, 0, 400), version: 5, calendar: { day: 22 } }
    expect(parseStored(json(legacy))).toEqual(legacy)
    const expanded = expandCalendar(legacy)
    expect(festivalOn(22, FESTIVALS, expanded.calendar)?.id).toBe('fishing-derby')
    expect(expanded.workshops).toEqual(legacy.workshops)
    const morning = runNight(expanded, {})
    expect(morning.workshops.festival?.active).toBeUndefined()
    expect(morning.workshops.festival?.last?.['fishing-derby']?.day).toBe(22)
  })
})
