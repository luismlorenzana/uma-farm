import { describe, expect, it } from 'vitest'
import { newSave, parseSave, parseSavePut, resolveConflict, SAVE_VERSION, SaveParseError, touched, versionOf } from './save'

const AT = '2026-11-08T10:00:00.000Z'
const LATER = '2026-11-08T11:00:00.000Z'

describe('save v1', () => {
  it('starts an account', () => {
    expect(newSave('u1', AT)).toEqual({ version: 1, account: { uid: 'u1', createdAt: AT, updatedAt: AT } })
    expect(SAVE_VERSION).toBe(1)
  })

  it('round-trips through JSON', () => {
    const save = newSave('u1', AT)
    expect(parseSave(JSON.parse(JSON.stringify(save)))).toEqual(save)
  })

  it('never moves updatedAt while parsing', () => {
    const save = { version: 1, account: { uid: 'u1', createdAt: AT, updatedAt: LATER } }
    expect(parseSave(save).account.updatedAt).toBe(LATER)
  })

  it('moves updatedAt only on a change', () => {
    expect(touched(newSave('u1', AT), LATER).account).toEqual({ uid: 'u1', createdAt: AT, updatedAt: LATER })
  })

  it('refuses a newer version, unknown keys and bad dates, saying where', () => {
    expect(() => parseSave({ version: 2, account: {} })).toThrow(/newer than this app/)
    expect(() => parseSave({ version: 1, account: { uid: 'u1', createdAt: AT, updatedAt: AT }, extra: 1 })).toThrow(/unknown keys extra/)
    expect(() => parseSave({ version: 1, account: { uid: 'u1', createdAt: 'soon', updatedAt: AT } })).toThrow(SaveParseError)
    expect(() => parseSave(null)).toThrow(/save.version/)
  })

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

  it('parses an upload', () => {
    const save = newSave('u1', AT)
    expect(parseSavePut({ baseRevision: 3, save })).toEqual({ baseRevision: 3, save, sentVersion: 1 })
    expect(() => parseSavePut({ baseRevision: -1, save })).toThrow(/body.baseRevision/)
    expect(() => parseSavePut({ baseRevision: 0, save, more: true })).toThrow(/unknown keys more/)
  })
})
