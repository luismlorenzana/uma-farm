// The store with the romance switch on and off: every v1–v3 the romance build meets, on the device
// or from the server, becomes a fresh v4 once, its `updatedAt` where it was and its first upload unstamped; a dirty v3 on
// the device is kept as a safety copy first, which offers no Restore. The deployed build (switch off) stops at a v4
// and never writes over it. An in-memory server with the API's revision and version rules, and a fake IndexedDB.
// Invented ids only.
import 'fake-indexeddb/auto'
import { newRosterUma, newSave, newSaveV4, versionOf, type SaveEnvelope, type SaveV3, type SaveV4, type StoredSave } from '@farm/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ roster: [] })), masterRoster: () => null, setMasterLens: vi.fn() }))

const server: { envelope: SaveEnvelope; puts: number; refused: number } = { envelope: { revision: 0, save: null }, puts: 0, refused: 0 }
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    saveApi: {
      load: vi.fn(async () => structuredClone(server.envelope)),
      put: vi.fn(async (baseRevision: number, save: StoredSave) => {
        if (baseRevision !== server.envelope.revision || save.version < versionOf(server.envelope.save)) {
          server.refused++
          throw new actual.ApiError('/api/save', 409, { current: structuredClone(server.envelope) })
        }
        server.puts++
        server.envelope = { revision: baseRevision + 1, save: structuredClone(save) }
        return structuredClone(server.envelope)
      }),
    },
  }
})

const { boot, NEWER_SAVE_WORDS, resetGame, restoreSafetyCopy, syncNow, useGame } = await import('../save/game')
const { db, readSaveRow, safetyCopies } = await import('../save/db')

const T0 = '2026-11-08T09:12:44.000Z'
const T1 = '2026-11-10T21:40:03.512Z'
/** A played v3 as the deployed build leaves it: day 2, three Umas, its last change at T1. */
const played = (): SaveV3 => ({
  ...newSave('u1', T0), account: { uid: 'u1', createdAt: T0, updatedAt: T1 }, calendar: { day: 2 }, gold: 812,
  roster: { 1001: newRosterUma(1), 1002: newRosterUma(1), 1003: newRosterUma(1) }, dorm: { level: 1, home: ['1001', '1002', '1003'], swaps: [] },
})
const v4 = (): SaveV4 => useGame.getState().save as SaveV4

beforeEach(async () => {
  resetGame()
  server.envelope = { revision: 0, save: null }
  server.puts = 0
  server.refused = 0
  await db.save.clear()
  await db.safety.clear()
})
afterEach(() => vi.unstubAllEnvs())

describe('the romance build wipes once (switch on)', () => {
  beforeEach(() => vi.stubEnv('VITE_FARM_ROMANCE', '1'))

  it('wipes a dirty v3 on the device, keeping it as a safety copy first, and uploads the wipe unstamped', async () => {
    server.envelope = { revision: 4, save: played() }
    await db.save.put({ id: 'main', uid: 'u1', revision: 4, dirty: true, save: { ...played(), gold: 999 } })
    await boot('u1')
    expect(v4()).toMatchObject({ version: 4, calendar: { day: 1 }, gold: 500, roster: {}, farmer: { name: '' }, account: { uid: 'u1', createdAt: T0, updatedAt: T1 } })
    const [copy] = await safetyCopies('u1')
    expect(copy).toMatchObject({ reason: 'wiped', revision: 4, save: { version: 3, gold: 999 } })
    expect((await readSaveRow('u1'))?.save).toEqual(v4())
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 5, save: { version: 4, account: { updatedAt: T1 } } })
    // Once: the next boot reads the v4.
    resetGame()
    await boot('u1')
    expect(v4().account.updatedAt).toBe(T1)
    expect(await safetyCopies('u1')).toHaveLength(1)
    // A pre-v4 copy isn't restored: it would only wipe again.
    expect(await restoreSafetyCopy(copy!.id!)).toBe(false)
    expect(v4().version).toBe(4)
  })

  it('wipes a clean v3 without a copy', async () => {
    await db.save.put({ id: 'main', uid: 'u1', revision: 4, dirty: false, save: played() })
    server.envelope = { revision: 4, save: played() }
    await boot('u1')
    expect(v4().version).toBe(4)
    expect(await safetyCopies('u1')).toEqual([])
  })

  it('wipes the server\'s v3 on a fresh device once, then uploads it with updatedAt where it was', async () => {
    server.envelope = { revision: 9, save: played() }
    await boot('u1')
    expect(v4()).toMatchObject({ version: 4, account: { updatedAt: T1 } })
    expect(useGame.getState()).toMatchObject({ revision: 9, dirty: true })
    await syncNow()
    expect(server.puts).toBe(1)
    expect(server.envelope).toMatchObject({ revision: 10, save: { version: 4, account: { createdAt: T0, updatedAt: T1 } } })
    await syncNow()
    expect(server.puts).toBe(1)
  })

  it('starts a new account on v4\'s day 1, the farmer unnamed', async () => {
    await boot('u1')
    expect(v4()).toMatchObject({ version: 4, calendar: { day: 1 }, farmer: { name: '' }, roster: {}, items: { 'seed-carrot': [9, 0, 0, 0, 0] } })
    await syncNow()
    expect(server.envelope.save?.version).toBe(4)
  })
})

describe('the deployed build stops at a v4 (switch off)', () => {
  it('refuses a v4 on the device or the server and never writes over it', async () => {
    const stored = newSaveV4('u1', T0)
    server.envelope = { revision: 3, save: stored }
    await expect(boot('u1')).rejects.toThrow(NEWER_SAVE_WORDS)
    expect(useGame.getState().save).toBeNull()
    await db.save.put({ id: 'main', uid: 'u1', revision: 3, dirty: false, save: stored })
    await expect(boot('u1')).rejects.toThrow(NEWER_SAVE_WORDS)
    expect(server.puts).toBe(0)
    expect(server.envelope.save).toEqual(stored)
  })

  it('plays a v3 as live', async () => {
    server.envelope = { revision: 2, save: played() }
    await boot('u1')
    expect(useGame.getState().save).toEqual(played())
  })
})
