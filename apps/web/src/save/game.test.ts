// The store against an in-memory server with the API's revision rules, and a fake IndexedDB: the sync engine on save v4
// (`start-over.test.ts` has a save from before v4). Invented data only.
import 'fake-indexeddb/auto'
import { SAVE_VERSION, newSave, touched, type SaveEnvelope, type SaveV4 } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const server: { envelope: SaveEnvelope; puts: number; down: boolean } = { envelope: { revision: 0, save: null }, puts: 0, down: false }

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    saveApi: {
      load: vi.fn(async () => {
        if (server.down) throw new TypeError('Failed to fetch')
        return structuredClone(server.envelope)
      }),
      put: vi.fn(async (baseRevision: number, save: SaveV4) => {
        if (server.down) throw new TypeError('Failed to fetch')
        if (baseRevision !== server.envelope.revision) throw new actual.ApiError('/api/save', 409, { current: structuredClone(server.envelope) })
        server.puts++
        server.envelope = { revision: baseRevision + 1, save: structuredClone(save) }
        return structuredClone(server.envelope)
      }),
    },
  }
})

const { boot, commit, resetGame, restoreSafetyCopy, syncNow, useGame } = await import('./game')
const { db, safetyCopies } = await import('./db')
const { arrivedRelease, keepArrived } = await import('../story/news')

/** A device's storage (this Node's own `localStorage` global has no methods). */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const items = new Map<string, string>()
  return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v), removeItem: (k) => void items.delete(k) }
}

const T0 = '2026-11-08T12:00:00.000Z'
const T1 = '2026-11-08T13:00:00.000Z'
const T2 = '2026-11-08T14:00:00.000Z'

beforeEach(async () => {
  resetGame()
  server.envelope = { revision: 0, save: null }
  server.puts = 0
  server.down = false
  await db.save.clear()
  await db.safety.clear()
})

describe('the store', () => {
  it('starts a new account on a fresh device when the server has none, and syncs it', async () => {
    await boot('u1')
    expect(useGame.getState()).toMatchObject({ status: 'ready', dirty: true, save: { version: SAVE_VERSION, account: { uid: 'u1' } } })
    await syncNow()
    expect(useGame.getState()).toMatchObject({ dirty: false, revision: 1, sync: 'synced' })
    expect(server.envelope.save?.account.uid).toBe('u1')
  })

  it('starts a new farm with no "New story arrived" waiting: its opening plays the story', async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    try {
      keepArrived({ number: 2 })
      await boot('u1')
      expect(arrivedRelease()).toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("adopts the server's save on a fresh device, keeps it on the device, and keeps a new release's news for its morning", async () => {
    vi.stubGlobal('localStorage', memoryStorage())
    keepArrived({ number: 2 })
    server.envelope = { revision: 4, save: newSave('u1', T0) }
    await boot('u1')
    expect(arrivedRelease()).toEqual({ number: 2 })
    vi.unstubAllGlobals()
    expect(useGame.getState()).toMatchObject({ status: 'ready', revision: 4, dirty: false })
    resetGame()
    server.down = true
    await boot('u1')
    expect(useGame.getState()).toMatchObject({ status: 'ready', revision: 4, save: { account: { createdAt: T0 } } })
  })

  it('refuses to start a new account offline, so a stray save never outranks the real one', async () => {
    server.down = true
    await expect(boot('u1')).rejects.toThrow()
    expect(useGame.getState().status).toBe('idle')
    expect(await db.save.get('main')).toBeUndefined()
  })

  it("never reads another account's device save", async () => {
    server.envelope = { revision: 2, save: newSave('u1', T0) }
    await boot('u1')
    resetGame()
    server.envelope = { revision: 0, save: null } // the API keys saves by uid: u2 has none
    await boot('u2')
    expect(useGame.getState().save?.account.uid).toBe('u2')
  })

  it('keeps a safety copy before a newer save replaces unsynced changes', async () => {
    server.envelope = { revision: 1, save: newSave('u1', T0) }
    await boot('u1')
    server.down = true
    await commit(touched(useGame.getState().save!, T1))
    server.down = false
    server.envelope = { revision: 2, save: touched(newSave('u1', T0), T2) }
    await syncNow()
    expect(useGame.getState()).toMatchObject({ revision: 2, dirty: false, save: { account: { updatedAt: T2 } } })
    expect(useGame.getState().replacedAt).not.toBeNull()
    const copies = await safetyCopies('u1')
    expect(copies[0]).toMatchObject({ reason: 'replaced', save: { account: { updatedAt: T1 } } })
    expect(await restoreSafetyCopy(copies[0]!.id!)).toBe(true)
    await syncNow()
    expect(server.envelope.save?.account.createdAt).toBe(T0)
    expect((await safetyCopies('u1'))[0]).toMatchObject({ reason: 'restore' })
  })

  it('pushes over a server that moved on when this device changed last', async () => {
    server.envelope = { revision: 1, save: newSave('u1', T0) }
    await boot('u1')
    server.envelope = { revision: 2, save: touched(newSave('u1', T0), T1) }
    await commit(touched(useGame.getState().save!, T2))
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 3, save: { account: { updatedAt: T2 } } })
    expect(useGame.getState()).toMatchObject({ revision: 3, dirty: false, sync: 'synced' })
  })

  it('says offline or paused when a sync fails, and keeps the changes', async () => {
    await boot('u1')
    server.down = true
    await syncNow()
    expect(useGame.getState()).toMatchObject({ sync: 'error', dirty: true })
  })
})
