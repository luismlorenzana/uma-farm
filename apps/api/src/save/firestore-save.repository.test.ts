// The production store against an in-memory Firestore: the `farm` database by name, revisions checked in a transaction,
// the save stored as text, an older save read as its version and account, the backup before a newer version first
// replaces a stored one, and rescues; and the owner's farm starting over through the controller. Invented data only.
import { BadRequestException } from '@nestjs/common'
import { expandCalendar, freshV6, nameFarmer, newSave, touched, type SaveV5 } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FirestoreSaveRepository } from './firestore-save.repository'
import { SaveController } from './save.controller'
import { RevisionConflict } from './save.repository'

type Doc = Record<string, unknown>
const store = new Map<string, Doc>()
const databases: string[] = []
const SERVER_TIME = { serverTimestamp: true }

vi.mock('firebase-admin/app', () => ({ getApps: () => [{}], initializeApp: () => ({}) }))
vi.mock('firebase-admin/firestore', () => {
  const snapshot = (path: string) => ({ exists: store.has(path), data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined) })
  const ref = (path: string) => ({ path, get: async () => snapshot(path), set: async (data: Doc) => { store.set(path, structuredClone(data)) } })
  const db = {
    collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
    runTransaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      const writes: [string, Doc][] = []
      const result = await fn({ get: async (r: { path: string }) => snapshot(r.path), set: (r: { path: string }, data: Doc) => { writes.push([r.path, data]) } })
      for (const [path, data] of writes) store.set(path, structuredClone(data))
      return result
    },
  }
  return { getFirestore: (_app: unknown, id: string) => { databases.push(id); return db }, FieldValue: { serverTimestamp: () => SERVER_TIME } }
})

const NOW = '2026-11-08T12:00:00.000Z'

describe('the Firestore save store', () => {
  beforeEach(() => { store.clear(); databases.length = 0 })

  it("uses the farm's own database, never (default)", async () => {
    await new FirestoreSaveRepository('farm').load('u')
    expect(databases).toEqual(['farm'])
  })

  it('stores revision 1 as text, then refuses a stale write', async () => {
    const repo = new FirestoreSaveRepository('farm')
    const save = newSave('u', NOW)
    expect(await repo.put('u', 0, save)).toEqual({ revision: 1, save })
    expect(store.get('saves/u')).toEqual({ revision: 1, save: JSON.stringify(save), updatedAt: SERVER_TIME })
    expect(await repo.load('u')).toEqual({ revision: 1, save })
    await expect(repo.put('u', 0, save)).rejects.toBeInstanceOf(RevisionConflict)
    expect(store.has('saveBackups/u-v5')).toBe(false)
  })

  it('keeps a cloud calendar restart when an older client tries to overwrite it', async () => {
    const repo = new FirestoreSaveRepository('farm')
    const prior = { ...newSave('u', NOW), calendar: { day: 10 } }
    const restarted = { ...prior, calendar: { day: 10, start: 10 } }
    await repo.put('u', 0, prior)
    await expect(repo.put('u', 1, restarted)).rejects.toBeInstanceOf(RevisionConflict)
    store.set('saves/u', { revision: 2, save: JSON.stringify(restarted) })
    await expect(repo.put('u', 2, prior)).rejects.toBeInstanceOf(RevisionConflict)
    expect(await repo.load('u')).toEqual({ revision: 2, save: restarted })
    expect((await repo.put('u', 2, { ...restarted, gold: 501 })).save).toMatchObject({ calendar: restarted.calendar, gold: 501 })
  })

  it('reads a stored v1, v2 or v4 as its version and account, and backs it up whole before the first v5', async () => {
    for (const version of [1, 2, 4] as const) {
      store.clear()
      const repo = new FirestoreSaveRepository('farm')
      const older = { version, account: { uid: 'u', createdAt: NOW, updatedAt: NOW }, ...(version === 2 ? { umas: {}, items: {}, buildings: {}, work: {} } : {}) }
      const original = { revision: 3, save: JSON.stringify(older), updatedAt: 'kept' }
      store.set('saves/u', structuredClone(original))
      expect(await repo.load('u')).toEqual({ revision: 3, save: { version, account: older.account } })
      expect(store.get('saves/u')).toEqual(original)
      await repo.put('u', 3, freshV6(older))
      expect(store.get(`saveBackups/u-v${version}`)).toEqual({ ...original, backedUpAt: SERVER_TIME })
    }
  })

  it('backs up only the first time a newer version replaces the stored one', async () => {
    const repo = new FirestoreSaveRepository('farm')
    store.set('saves/u', { revision: 1, save: JSON.stringify({ version: 3, account: { uid: 'u', createdAt: NOW, updatedAt: NOW } }), updatedAt: 'kept' })
    const fresh = freshV6({ account: { uid: 'u', createdAt: NOW, updatedAt: NOW } })
    await repo.put('u', 1, fresh)
    store.delete('saveBackups/u-v3')
    await repo.put('u', 2, touched(fresh, '2026-11-08T13:00:00.000Z'))
    expect(store.has('saveBackups/u-v3')).toBe(false)
    expect(store.has('saveBackups/u-v5')).toBe(false)
  })

  it('backs up the full v5 on the first upload and protects the selected calendar', async () => {
    const legacy: SaveV5 = { ...newSave('u', NOW), version: 5, calendar: { day: 18 }, gold: 902 }
    const original = { revision: 7, save: JSON.stringify(legacy), updatedAt: 'kept' }
    store.set('saves/u', original)
    const repo = new FirestoreSaveRepository('farm')
    const controller = new SaveController(repo)
    expect(await controller.load('u')).toEqual({ revision: 7, save: legacy })
    const expanded = expandCalendar(legacy)
    expect(await controller.put('u', { baseRevision: 7, save: expanded })).toEqual({ revision: 8, save: expanded })
    expect(store.get('saveBackups/u-v5')).toEqual({ ...original, backedUpAt: SERVER_TIME })
    await expect(controller.put('u', { baseRevision: 8, save: legacy })).rejects.toBeInstanceOf(BadRequestException)
    await expect(repo.put('u', 8, { ...expanded, calendar: { day: 18 } })).rejects.toBeInstanceOf(RevisionConflict)
    expect(await controller.load('u')).toEqual({ revision: 8, save: expanded })
  })

  it('keeps a refused upload in saveRescues, newest only', async () => {
    const repo = new FirestoreSaveRepository('farm')
    await repo.rescue('u', { a: 1 }, 'first')
    await repo.rescue('u', { a: 2 }, 'second')
    expect(store.get('saveRescues/u')).toEqual({ upload: '{"a":2}', reason: 'second', rescuedAt: SERVER_TIME })
  })
})

describe("the owner's farm starting over", () => {
  beforeEach(() => { store.clear(); databases.length = 0 })

  /** A played v3 as the farm stored it before v4 and v5, at revision 21: invented, and more than the parse reads. */
  const ACCOUNT = { uid: 'owner', createdAt: '2026-11-08T09:12:44.000Z', updatedAt: '2026-11-10T21:40:03.512Z' }
  const OWNER = { version: 3, account: ACCOUNT, calendar: { day: 2 }, gold: 812, start: { redraws: 1 }, roster: { 1001: { joined: 1 } }, visitors: [] }
  const STORED = { revision: 21, save: JSON.stringify(OWNER), updatedAt: 'the server’s time' }

  it('hands the stored v3 back as its version and account, backs it up whole to saveBackups/{uid}-v3 on the first v5, stores the unstamped new farm, then refuses a v3 over it into saveRescues', async () => {
    store.set('saves/owner', structuredClone(STORED))
    const controller = new SaveController(new FirestoreSaveRepository('farm'))
    // The API never makes or changes a save: it reads the stored v3's version and account only.
    const loaded = await controller.load('owner')
    expect(loaded).toEqual({ revision: 21, save: { version: 3, account: ACCOUNT } })
    expect(store.get('saves/owner')).toEqual(STORED)
    // The phone's first upload: the new farm itself, its account (updatedAt included) the v3's.
    const fresh = freshV6(loaded.save!)
    expect(fresh.account).toEqual(ACCOUNT)
    await expect(controller.put('owner', { baseRevision: 21, save: JSON.parse(JSON.stringify(fresh)) })).resolves.toEqual({ revision: 22, save: fresh })
    expect(store.get('saveBackups/owner-v3')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
    expect(JSON.parse(store.get('saveBackups/owner-v3')!.save as string)).toEqual(OWNER)
    const saved = store.get('saves/owner')!
    expect(JSON.parse(saved.save as string)).toEqual(JSON.parse(JSON.stringify(fresh)))
    // An old cached build, if it ever sent its v3 now, is refused and kept whole; nothing stored moves.
    const old = { baseRevision: 22, save: { ...OWNER, account: { ...ACCOUNT, updatedAt: '2026-11-11T08:00:00.000Z' } } }
    await expect(controller.put('owner', old)).rejects.toBeInstanceOf(BadRequestException)
    expect(store.get('saveRescues/owner')).toEqual({ upload: JSON.stringify(old), reason: expect.stringContaining('expected 6'), rescuedAt: SERVER_TIME })
    expect(store.get('saves/owner')).toEqual(saved)
    // The farmer's name is the first stamp; later v5 writes leave the backup as it was.
    const named = touched(nameFarmer(fresh, 'Robin'), '2026-11-11T09:00:00.000Z')
    await expect(controller.put('owner', { baseRevision: 22, save: JSON.parse(JSON.stringify(named)) })).resolves.toMatchObject({ revision: 23 })
    expect(store.get('saveBackups/owner-v3')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
  })
})
