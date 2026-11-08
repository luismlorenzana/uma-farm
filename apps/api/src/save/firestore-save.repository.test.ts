// The production store against an in-memory Firestore: the `farm` database by name, revisions checked in a transaction,
// the save stored as text, the backup before a newer version first replaces a stored one, and rescues. Invented data only.
import { newSave, SAVE_VERSION as V } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FirestoreSaveRepository } from './firestore-save.repository'
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
    const save = newSave('u', NOW)
    expect(await repo.put('u', 0, save, V)).toEqual({ revision: 1, save })
    expect(store.get('saves/u')).toEqual({ revision: 1, save: JSON.stringify(save), updatedAt: SERVER_TIME })
    expect(await repo.load('u')).toEqual({ revision: 1, save })
    await expect(repo.put('u', 0, save, V)).rejects.toBeInstanceOf(RevisionConflict)
    await expect(repo.put('u', 1, save, V - 1)).rejects.toBeInstanceOf(RevisionConflict)
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
    await repo.put('u', 3, loaded.save!, V)
    expect(store.get('saveBackups/u-v1')).toEqual({ ...original, backedUpAt: SERVER_TIME })
    store.delete('saveBackups/u-v1')
    await repo.put('u', 4, loaded.save!, V)
    expect(store.has('saveBackups/u-v1')).toBe(false)
  })

  it('keeps a refused upload in saveRescues, newest only', async () => {
    const repo = new FirestoreSaveRepository('farm')
    await repo.rescue('u', { a: 1 }, 'first')
    await repo.rescue('u', { a: 2 }, 'second')
    expect(store.get('saveRescues/u')).toEqual({ upload: '{"a":2}', reason: 'second', rescuedAt: SERVER_TIME })
  })
})
