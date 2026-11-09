// The store against an in-memory server with the API's revision rules, and a fake IndexedDB. Invented data only.
import 'fake-indexeddb/auto'
import { newSaveV2, SAVE_VERSION, startJob, touched, type PushEntry, type Save, type SaveEnvelope } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The Wilds' build: the loop is off (F17, D29). loop-boot.test.ts plays the loop's.
vi.stubEnv('VITE_FARM_LOOP', '0')

const server: { envelope: SaveEnvelope; puts: number; down: boolean; schedules: PushEntry[][]; refuseSchedule: boolean } = {
  envelope: { revision: 0, save: null }, puts: 0, down: false, schedules: [], refuseSchedule: false,
}

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    saveApi: {
      load: vi.fn(async () => {
        if (server.down) throw new TypeError('Failed to fetch')
        return structuredClone(server.envelope)
      }),
      put: vi.fn(async (baseRevision: number, save: Save) => {
        if (server.down) throw new TypeError('Failed to fetch')
        if (baseRevision !== server.envelope.revision) throw new actual.ApiError('/api/save', 409, { current: structuredClone(server.envelope) })
        server.puts++
        server.envelope = { revision: baseRevision + 1, save: structuredClone(save) }
        return structuredClone(server.envelope)
      }),
    },
    pushApi: {
      schedule: vi.fn(async (entries: PushEntry[]) => {
        if (server.down || server.refuseSchedule) throw new TypeError('Failed to fetch')
        server.schedules.push(structuredClone(entries))
        return null
      }),
    },
  }
})

const { boot, commit, resetGame, restoreSafetyCopy, syncNow, useGame } = await import('./game')
const { db, safetyCopies } = await import('./db')

const T0 = '2026-11-08T12:00:00.000Z'
const T1 = '2026-11-08T13:00:00.000Z'
const T2 = '2026-11-08T14:00:00.000Z'

beforeEach(async () => {
  resetGame()
  server.envelope = { revision: 0, save: null }
  server.puts = 0
  server.down = false
  server.schedules = []
  server.refuseSchedule = false
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

  it("adopts the server's save on a fresh device, and keeps it on the device", async () => {
    server.envelope = { revision: 4, save: newSaveV2('u1', T0) }
    await boot('u1')
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
    server.envelope = { revision: 2, save: newSaveV2('u1', T0) }
    await boot('u1')
    resetGame()
    server.envelope = { revision: 0, save: null } // the API keys saves by uid: u2 has none
    await boot('u2')
    expect(useGame.getState().save?.account.uid).toBe('u2')
  })

  it('keeps a safety copy before a newer save replaces unsynced changes', async () => {
    server.envelope = { revision: 1, save: newSaveV2('u1', T0) }
    await boot('u1')
    server.down = true
    await commit(touched(useGame.getState().save!, T1))
    server.down = false
    server.envelope = { revision: 2, save: touched(newSaveV2('u1', T0), T2) }
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
    server.envelope = { revision: 1, save: newSaveV2('u1', T0) }
    await boot('u1')
    server.envelope = { revision: 2, save: touched(newSaveV2('u1', T0), T1) }
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

describe('the push schedule (F6)', () => {
  it('goes with every sync, once per save, and again after a failed send', async () => {
    await boot('u1')
    await syncNow()
    await vi.waitFor(() => expect(server.schedules).toEqual([[]]))
    await syncNow()
    await new Promise((r) => setTimeout(r, 0))
    expect(server.schedules).toHaveLength(1)
    const now = new Date().toISOString()
    await commit(startJob(useGame.getState().save as Save, 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, now))
    server.refuseSchedule = true
    await syncNow()
    expect(useGame.getState().sync).toBe('synced')
    await new Promise((r) => setTimeout(r, 0))
    server.refuseSchedule = false
    await syncNow()
    await vi.waitFor(() => expect(server.schedules).toHaveLength(2))
    await new Promise((r) => setTimeout(r, 0))
    expect(server.schedules).toHaveLength(2)
    expect(server.schedules[1]).toEqual([{ at: expect.any(Number) as number, place: 'mine', badge: 1 }])
  })
})
