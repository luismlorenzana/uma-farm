// The save's envelope: v4 is the one save; an older save (v1–v3) reads as its version and account only, and a newer one
// is refused. Invented data only.
import { describe, expect, it } from 'vitest'
import { isOlderSave, parseSave, parseSavePut, parseStored, resolveConflict, SAVE_VERSION, SaveParseError, touched, versionOf } from './save'
import { freshV4, newSave } from './v4'

const AT = '2026-11-08T10:00:00.000Z'
const LATER = '2026-11-08T11:00:00.000Z'
const ACCOUNT = { uid: 'u1', createdAt: AT, updatedAt: LATER }
/** An older save as a device or the server holds it: its body is never read. */
const V3 = { version: 3, account: ACCOUNT, calendar: { day: 12 }, gold: 812, start: { redraws: 1 }, visitors: [] }
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('save v4, the one save', () => {
  it('is the version the farm reads and writes', () => {
    expect(SAVE_VERSION).toBe(4)
    expect(newSave('u1', AT)).toMatchObject({ version: 4, account: { uid: 'u1', createdAt: AT, updatedAt: AT } })
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
    expect(() => parseSave(V3)).toThrow('save.version: expected 4: an older save starts over on the device')
    expect(() => parseSave({ version: 1, account: ACCOUNT })).toThrow(SaveParseError)
    expect(() => parseSave({ version: 5, account: {} })).toThrow(/newer than this app/)
    expect(() => parseSave({ ...newSave('u1', AT), extra: 1 })).toThrow(/unknown keys extra/)
    expect(() => parseSave(null)).toThrow('save.version: expected 4')
  })
})

describe('a stored save', () => {
  it('reads a v4 strictly', () => {
    const save = newSave('u1', AT)
    expect(parseStored(json(save))).toEqual(save)
    expect(() => parseStored({ ...json(save), gold: -1 })).toThrow('save.gold')
  })

  it('reads an older save as its version and account only, whatever else it holds', () => {
    expect(parseStored(V3)).toEqual({ version: 3, account: ACCOUNT })
    expect(parseStored({ version: 2, account: ACCOUNT, umas: {}, items: {}, buildings: {}, work: {} })).toEqual({ version: 2, account: ACCOUNT })
    expect(parseStored({ version: 1, account: ACCOUNT })).toEqual({ version: 1, account: ACCOUNT })
    expect(isOlderSave(parseStored(V3))).toBe(true)
    expect(isOlderSave(newSave('u1', AT))).toBe(false)
    expect(() => parseStored({ ...V3, account: { ...ACCOUNT, createdAt: 'soon' } })).toThrow('save.account.createdAt')
  })

  it('refuses a newer save and a value with no version', () => {
    expect(() => parseStored({ version: 5, account: ACCOUNT })).toThrow(/newer than this app/)
    expect(() => parseStored({ account: ACCOUNT })).toThrow('save.version: expected 4')
  })

  it('starts a fresh v4 from an older save with its account whole', () => {
    const fresh = freshV4(parseStored(V3))
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

  it('parses an upload: a v4 only', () => {
    const save = newSave('u1', AT)
    expect(parseSavePut({ baseRevision: 3, save: json(save) })).toEqual({ baseRevision: 3, save })
    expect(() => parseSavePut({ baseRevision: 0, save: V3 })).toThrow('body.save.version: expected 4')
    expect(() => parseSavePut({ baseRevision: -1, save })).toThrow(/body.baseRevision/)
    expect(() => parseSavePut({ baseRevision: 0, save, more: true })).toThrow(/unknown keys more/)
  })
})
