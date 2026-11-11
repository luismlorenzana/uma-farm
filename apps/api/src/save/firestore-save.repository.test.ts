// The production store against an in-memory Firestore: the `farm` database by name, revisions checked in a transaction,
// the save stored as text, the backup before a newer version first replaces a stored one, and rescues; and the owner's
// first v3 upload through the controller (F24). Invented data only.
import { ConflictException } from '@nestjs/common'
import { freshV4, migrateToV3, nameFarmer, newSave, newSaveV2, touched, type SaveV2, type SaveV3 } from '@farm/domain'
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

  it('stores revision 1 as text, then refuses a stale write and an older client', async () => {
    const repo = new FirestoreSaveRepository('farm')
    const save = newSaveV2('u', NOW)
    expect(await repo.put('u', 0, save, 2)).toEqual({ revision: 1, save })
    expect(store.get('saves/u')).toEqual({ revision: 1, save: JSON.stringify(save), updatedAt: SERVER_TIME })
    expect(await repo.load('u')).toEqual({ revision: 1, save })
    await expect(repo.put('u', 0, save, 2)).rejects.toBeInstanceOf(RevisionConflict)
    await expect(repo.put('u', 1, save, 1)).rejects.toBeInstanceOf(RevisionConflict)
    expect(store.has('saveBackups/u-v1')).toBe(false)
  })

  it('backs up a stored v1 document whole before the first v2 write, and only then', async () => {
    const repo = new FirestoreSaveRepository('farm')
    const v1 = { version: 1, account: { uid: 'u', createdAt: NOW, updatedAt: NOW } }
    const original = { revision: 3, save: JSON.stringify(v1), updatedAt: 'kept' }
    store.set('saves/u', structuredClone(original))
    const loaded = await repo.load('u')
    expect(loaded.save).toMatchObject({ version: 2, account: { updatedAt: NOW }, umas: {}, items: {}, work: {} })
    expect(store.get('saves/u')).toEqual(original)
    await repo.put('u', 3, loaded.save!, 2)
    expect(store.get('saveBackups/u-v1')).toEqual({ ...original, backedUpAt: SERVER_TIME })
    store.delete('saveBackups/u-v1')
    await repo.put('u', 4, loaded.save!, 2)
    expect(store.has('saveBackups/u-v1')).toBe(false)
  })

  it('backs up a stored v2 document whole before the first v3 write (F17), then refuses a v2 over it', async () => {
    const repo = new FirestoreSaveRepository('farm')
    const v2 = newSaveV2('u', NOW)
    await repo.put('u', 0, v2, 2)
    const stored = structuredClone(store.get('saves/u'))
    const v3 = newSave('u', NOW)
    expect(await repo.put('u', 1, v3, 3)).toEqual({ revision: 2, save: v3 })
    expect(store.get('saveBackups/u-v2')).toEqual({ ...stored, backedUpAt: SERVER_TIME })
    expect(await repo.load('u')).toEqual({ revision: 2, save: v3 })
    store.delete('saveBackups/u-v2')
    await repo.put('u', 2, v3, 3)
    expect(store.has('saveBackups/u-v2')).toBe(false)
    await expect(repo.put('u', 3, v2, 2)).rejects.toBeInstanceOf(RevisionConflict)
    expect((await repo.load('u')).save).toEqual(v3)
  })

  it('keeps a refused upload in saveRescues, newest only', async () => {
    const repo = new FirestoreSaveRepository('farm')
    await repo.rescue('u', { a: 1 }, 'first')
    await repo.rescue('u', { a: 2 }, 'second')
    expect(store.get('saveRescues/u')).toEqual({ upload: '{"a":2}', reason: 'second', rescuedAt: SERVER_TIME })
  })
})

describe("the romance build's first v4 over a stored v3 (F46 decision 2; RM10)", () => {
  beforeEach(() => { store.clear(); databases.length = 0 })

  /** A played v3 as the live M4 build stores it, at revision 21. */
  const OWNER: SaveV3 = { ...newSave('owner', '2026-11-08T09:12:44.000Z'), account: { uid: 'owner', createdAt: '2026-11-08T09:12:44.000Z', updatedAt: '2026-11-10T21:40:03.512Z' }, calendar: { day: 2 }, gold: 812 }
  const STORED = { revision: 21, save: JSON.stringify(OWNER), updatedAt: 'the server’s time' }

  it('backs the v3 up to saveBackups/{uid}-v3 on the first v4 write, stores the unstamped wipe, then refuses a v3 over it into saveRescues', async () => {
    store.set('saves/owner', structuredClone(STORED))
    const controller = new SaveController(new FirestoreSaveRepository('farm'))
    // The API hands the stored v3 back as it is: it never wipes or makes a save.
    const loaded = await controller.load('owner')
    expect(loaded).toEqual({ revision: 21, save: OWNER })
    // The romance build's first upload: the wipe itself, its account (updatedAt included) the v3's.
    const wiped = freshV4(loaded.save as SaveV3)
    expect(wiped.account).toEqual(OWNER.account)
    await expect(controller.put('owner', { baseRevision: 21, save: JSON.parse(JSON.stringify(wiped)) })).resolves.toEqual({ revision: 22, save: wiped })
    expect(store.get('saveBackups/owner-v3')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
    const saved = store.get('saves/owner')!
    expect(JSON.parse(saved.save as string)).toEqual(JSON.parse(JSON.stringify(wiped)))
    // The live M4 build, if it ever sent its v3 now, is refused and kept.
    const old = { baseRevision: 22, save: JSON.parse(JSON.stringify(touched(OWNER, '2026-11-11T08:00:00.000Z'))) }
    await expect(controller.put('owner', old)).rejects.toBeInstanceOf(ConflictException)
    expect(store.get('saveRescues/owner')).toEqual({ upload: JSON.stringify(old), reason: 'save version 3 is older than the stored 4', rescuedAt: SERVER_TIME })
    expect(store.get('saves/owner')).toEqual(saved)
    // The farmer's name is the first stamp; later v4 writes leave the backup as it was.
    const named = touched(nameFarmer(wiped, 'Robin'), '2026-11-11T09:00:00.000Z')
    await expect(controller.put('owner', { baseRevision: 22, save: JSON.parse(JSON.stringify(named)) })).resolves.toMatchObject({ revision: 23 })
    expect(store.get('saveBackups/owner-v3')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
  })
})

describe("the owner's first upload of the live loop (F24 decision 9)", () => {
  beforeEach(() => { store.clear(); databases.length = 0 })

  /** Production's one save as D17 has it: v2 from F4, no Umas, no items, no jobs, at revision 12. */
  const OWNER = { version: 2, account: { uid: 'owner', createdAt: '2026-11-08T09:12:44.000Z', updatedAt: '2026-11-08T21:40:03.512Z' }, umas: {}, items: {}, buildings: {}, work: {} }
  const STORED = { revision: 12, save: JSON.stringify(OWNER), updatedAt: 'the server’s time' }

  it('backs up the v2 document before storing the migrated v3, whose updatedAt is the v2\'s; an old build\'s v2 is refused and kept', async () => {
    store.set('saves/owner', structuredClone(STORED))
    const controller = new SaveController(new FirestoreSaveRepository('farm'))
    // What the phone uploads first: the migration itself, unstamped.
    const loaded = await controller.load('owner')
    expect(loaded).toMatchObject({ revision: 12, save: { version: 2 } })
    const v3 = migrateToV3(loaded.save as SaveV2, { lineOf: () => null })
    expect(v3.account).toEqual(OWNER.account)
    await expect(controller.put('owner', { baseRevision: 12, save: JSON.parse(JSON.stringify(v3)) })).resolves.toEqual({ revision: 13, save: v3 })
    expect(store.get('saveBackups/owner-v2')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
    const saved = store.get('saves/owner')!
    expect(saved.revision).toBe(13)
    const stored = JSON.parse(saved.save as string) as { version: number; account: unknown }
    expect(stored.version).toBe(3)
    expect(stored.account).toEqual(JSON.parse(STORED.save).account)
    // An old cached Wilds build on the phone sends its v2: refused with what's stored, and kept in saveRescues.
    const old = { baseRevision: 13, save: { ...OWNER, account: { ...OWNER.account, updatedAt: '2026-11-10T08:00:00.000Z' } } }
    await expect(controller.put('owner', old)).rejects.toBeInstanceOf(ConflictException)
    expect(store.get('saveRescues/owner')).toEqual({ upload: JSON.stringify(old), reason: 'save version 2 is older than the stored 3', rescuedAt: SERVER_TIME })
    expect(store.get('saves/owner')).toEqual(saved)
    // The next v3 writes leave the backup as it was.
    await controller.put('owner', { baseRevision: 13, save: JSON.parse(JSON.stringify(touched(v3, '2026-11-10T09:00:00.000Z'))) })
    expect(store.get('saveBackups/owner-v2')).toEqual({ ...STORED, backedUpAt: SERVER_TIME })
  })
})
