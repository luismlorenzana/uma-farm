import { describe, expect, it } from 'vitest'
import { newSaveV2, parseSave, parseSavePut, resolveConflict, SAVE_VERSION, SaveParseError, toV2, touched, versionOf, type Save } from './save'
import { collectWorker, queueJob, startJob } from './work'

const AT = '2026-11-08T10:00:00.000Z'
const LATER = '2026-11-08T11:00:00.000Z'
const V1 = { version: 1, account: { uid: 'u1', createdAt: AT, updatedAt: LATER } }

/** A save mid-play: a gather running with one queued behind it, an Arms Gem being made, items in the Warehouse. */
function playing(): Save {
  let save: Save = { ...newSaveV2('u1', AT), items: { 'copper-ingot': 20, 'copper-ore': 3 } }
  save = startJob(save, 'mine', 0, { outfitId: '101' }, 'copper-ore', 3, AT)
  save = queueJob(save, 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, AT)
  save = startJob(save, 'weapon-forge', 2, { outfitId: '202' }, 'weapon-gem-g1', 2, AT)
  return save
}

describe('save v2', () => {
  it('starts an account with the Wilds empty', () => {
    expect(newSaveV2('u1', AT)).toEqual({ version: 2, account: { uid: 'u1', createdAt: AT, updatedAt: AT }, umas: {}, items: {}, buildings: {}, work: {} })
    expect(SAVE_VERSION).toBe(2)
  })

  it('migrates v1 to v2, keeping updatedAt where it was', () => {
    const migrated = parseSave(V1)
    expect(migrated).toEqual({ version: 2, account: V1.account, umas: {}, items: {}, buildings: {}, work: {} })
    expect(migrated.account.updatedAt).toBe(LATER)
    expect(toV2({ version: 1, account: V1.account }).account).toBe(V1.account)
  })

  it('round-trips through JSON, mid-play', () => {
    const save = playing()
    expect(Object.keys(save.work).sort()).toEqual(['101', '202'])
    expect(save.umas).toEqual({ 101: { craft: { level: 1, exp: 0 } }, 202: { craft: { level: 1, exp: 0 } } })
    expect(save.items).toEqual({ 'copper-ore': 3 })
    const parsed = parseSave(JSON.parse(JSON.stringify(save)))
    expect(parsed).toEqual(save)
    expect(parseSave(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed)
  })

  it('never moves updatedAt while parsing', () => {
    expect(parseSave({ ...newSaveV2('u1', AT), account: V1.account }).account.updatedAt).toBe(LATER)
  })

  it('moves updatedAt only on a change', () => {
    expect(touched(newSaveV2('u1', AT), LATER).account).toEqual({ uid: 'u1', createdAt: AT, updatedAt: LATER })
    const started = startJob(newSaveV2('u1', AT), 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, LATER)
    expect(started.account.updatedAt).toBe(LATER)
    expect(collectWorker(started, '101', '2026-11-08T12:00:00.000Z').save.account.updatedAt).toBe('2026-11-08T12:00:00.000Z')
  })

  it('refuses a newer version, unknown keys, bad ids and bad rows, saying where', () => {
    const save = newSaveV2('u1', AT)
    expect(() => parseSave({ version: 4, account: {} })).toThrow(/newer than this app/)
    expect(() => parseSave({ ...save, extra: 1 })).toThrow(/unknown keys extra/)
    expect(() => parseSave({ version: 1, account: { uid: 'u1', createdAt: 'soon', updatedAt: AT } })).toThrow(SaveParseError)
    expect(() => parseSave(null)).toThrow(/save.version/)
    expect(() => parseSave({ ...save, items: { 'not-an-item': 1 } })).toThrow(/save.items.not-an-item: unknown item/)
    expect(() => parseSave({ ...save, umas: { abc: { craft: { level: 1, exp: 0 } } } })).toThrow(/save.umas.abc/)
    expect(() => parseSave({ ...save, umas: { 101: { craft: { level: 51, exp: 0 } } } })).toThrow(/expected 1–50/)
    expect(() => parseSave({ ...save, buildings: { mine: { level: 2 } } })).toThrow(/save.buildings: unknown keys mine/)
    const mid = JSON.parse(JSON.stringify(playing())) as Save
    expect(() => parseSave({ ...mid, umas: {} })).toThrow(/save.work.101: expected an Uma who has worked/)
    const wrongPlace = JSON.parse(JSON.stringify(mid)) as { work: Record<string, { slot: { building: string } }> }
    wrongPlace.work['101']!.slot.building = 'quarry'
    expect(() => parseSave(wrongPlace)).toThrow(/save.work.101.slot.building: not a place/)
  })

  it('reads the version a value claims', () => {
    expect(versionOf({ version: 1 })).toBe(1)
    expect(versionOf({})).toBe(0)
    expect(versionOf(null)).toBe(0)
  })

  it('keeps the save changed last, and this device on a tie', () => {
    const early = newSaveV2('u1', AT)
    const late = touched(early, LATER)
    expect(resolveConflict(early, late)).toBe(late)
    expect(resolveConflict(late, early)).toBe(late)
    const twin = touched(early, AT)
    expect(resolveConflict(early, twin)).toBe(early)
  })

  it('parses an upload, saying which version was sent', () => {
    const save = newSaveV2('u1', AT)
    expect(parseSavePut({ baseRevision: 3, save })).toEqual({ baseRevision: 3, save, sentVersion: 2 })
    expect(parseSavePut({ baseRevision: 0, save: V1 })).toEqual({ baseRevision: 0, save: parseSave(V1), sentVersion: 1 })
    expect(() => parseSavePut({ baseRevision: -1, save })).toThrow(/body.baseRevision/)
    expect(() => parseSavePut({ baseRevision: 0, save, more: true })).toThrow(/unknown keys more/)
  })
})
