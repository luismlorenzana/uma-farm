// `push/{uid}` against an in-memory Firestore: the `farm` database by name, each write merging only its own fields, and
// the tick reading only accounts with a device. Invented data only.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FirestorePushRepository } from './push.repository'

type Doc = Record<string, unknown>
const store = new Map<string, Doc>()
const databases: string[] = []
const SERVER_TIME = { serverTimestamp: true }

vi.mock('firebase-admin/app', () => ({ getApps: () => [{}], initializeApp: () => ({}) }))
vi.mock('firebase-admin/firestore', () => {
  const snapshot = (path: string) => ({ exists: store.has(path), data: () => (store.has(path) ? structuredClone(store.get(path)) : undefined) })
  const ref = (path: string) => ({
    path,
    get: async () => snapshot(path),
    set: async (data: Doc, options?: { merge?: boolean }) => { store.set(path, structuredClone(options?.merge ? { ...store.get(path), ...data } : data)) },
  })
  const collection = (name: string) => ({
    doc: (id: string) => ref(`${name}/${id}`),
    where: (field: string, _op: '==', value: unknown) => ({
      get: async () => ({
        docs: [...store].filter(([path, doc]) => path.startsWith(`${name}/`) && doc[field] === value)
          .map(([path, doc]) => ({ id: path.slice(name.length + 1), data: () => structuredClone(doc) })),
      }),
    }),
  })
  return { getFirestore: (_app: unknown, id: string) => { databases.push(id); return { collection } }, FieldValue: { serverTimestamp: () => SERVER_TIME } }
})

const SUB = { endpoint: 'https://push.example/phone', keys: { p256dh: 'p', auth: 'a' } }

describe('the Firestore push store', () => {
  beforeEach(() => { store.clear(); databases.length = 0 })

  it("uses the farm's own database, never (default)", async () => {
    await new FirestorePushRepository('farm').get('u')
    expect(databases).toEqual(['farm'])
  })

  it('merges each write into push/{uid}, so a schedule and a tick never undo each other', async () => {
    const repo = new FirestorePushRepository('farm')
    await repo.patch('u', { subscriptions: [SUB], checkedAt: 1 })
    await repo.patch('u', { schedule: [{ at: 5, place: 'mine', badge: 1 }] })
    await repo.patch('u', { checkedAt: 9 })
    expect(store.get('push/u')).toEqual({ subscriptions: [SUB], active: true, schedule: [{ at: 5, place: 'mine', badge: 1 }], checkedAt: 9, updatedAt: SERVER_TIME })
    expect(await repo.get('u')).toEqual({ uid: 'u', subscriptions: [SUB], schedule: [{ at: 5, place: 'mine', badge: 1 }], checkedAt: 9 })
  })

  it('reads only accounts with a device for the tick', async () => {
    const repo = new FirestorePushRepository('farm')
    await repo.patch('a', { subscriptions: [SUB] })
    await repo.patch('b', { schedule: [] })
    await repo.patch('c', { subscriptions: [SUB] })
    await repo.patch('c', { subscriptions: [] })
    expect((await repo.active()).map((r) => r.uid)).toEqual(['a'])
    expect(await repo.get('b')).toEqual({ uid: 'b', subscriptions: [], schedule: [], checkedAt: 0 })
    expect(await repo.get('none')).toBeNull()
  })
})
