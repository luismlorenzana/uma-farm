// The store in the loop's build (F17 decisions 1 and 2): every v2 it meets (on the device, on the server, in a 409, in a
// safety copy) becomes v3 once, committed without moving `updatedAt`; the Wilds' build stops at a v3. An in-memory server
// with the API's revision and version rules, and a fake IndexedDB. Invented outfit ids only.
import 'fake-indexeddb/auto'
import { newSave, newSaveV2, versionOf, type SaveEnvelope, type SaveV2, type SaveV3, type StoredSave } from '@farm/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const RELEASE = ['1001', '1002', '1003', '1004']
vi.mock('../master/master', () => ({
  masterReady: vi.fn(async () => ({ roster: RELEASE.map((outfitId) => ({ outfitId, trade: 'physical', line: 'metal' })) })),
  masterRoster: () => null,
}))

/** `race`: another device writes this just before the next upload lands. */
const server: { envelope: SaveEnvelope; puts: number; refused: number; race: SaveEnvelope | null } = { envelope: { revision: 0, save: null }, puts: 0, refused: 0, race: null }

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    saveApi: {
      load: vi.fn(async () => structuredClone(server.envelope)),
      put: vi.fn(async (baseRevision: number, save: StoredSave) => {
        if (server.race) [server.envelope, server.race] = [server.race, null]
        // The repositories' rule: a stale revision, or a version older than what's stored, is a 409 with what's stored.
        if (baseRevision !== server.envelope.revision || save.version < versionOf(server.envelope.save)) {
          server.refused++
          throw new actual.ApiError('/api/save', 409, { current: structuredClone(server.envelope) })
        }
        server.puts++
        server.envelope = { revision: baseRevision + 1, save: structuredClone(save) }
        return structuredClone(server.envelope)
      }),
    },
    pushApi: { schedule: vi.fn(async () => null) },
  }
})

const { boot, commit, LOOP_SAVE_WORDS, resetGame, restoreSafetyCopy, syncNow, useGame } = await import('../save/game')
const { addSafetyCopy, db, readSaveRow, safetyCopies } = await import('../save/db')

const T0 = '2026-11-08T12:00:00.000Z'
const T1 = '2026-11-08T13:00:00.000Z'
/** A v2 save as the Wilds left it: two Umas with Craft Levels, goods that carry and an Arms Gem that's refunded. */
const wilds = (updatedAt = T1): SaveV2 => ({
  ...newSaveV2('u1', T0), account: { uid: 'u1', createdAt: T0, updatedAt },
  umas: { 1001: { craft: { level: 16, exp: 0 } }, 1002: { craft: { level: 1, exp: 0 } } }, items: { 'copper-ore': 5, 'weapon-gem-g3': 1 },
})
const v3 = (): SaveV3 => useGame.getState().save as SaveV3

beforeEach(async () => {
  resetGame()
  server.envelope = { revision: 0, save: null }
  server.puts = 0
  server.refused = 0
  server.race = null
  await db.save.clear()
  await db.safety.clear()
})
afterEach(() => vi.unstubAllEnvs())

describe('the loop boots a v2 into v3 once', () => {
  it('from the device: Spring 1, 500g plus its refunds, its Umas ranked, updatedAt where it was', async () => {
    server.envelope = { revision: 3, save: wilds() }
    await db.save.put({ id: 'main', uid: 'u1', revision: 3, dirty: false, save: wilds() })
    await boot('u1')
    expect(v3()).toMatchObject({ version: 3, calendar: { day: 1 }, gold: 500 + 450, account: { updatedAt: T1, createdAt: T0 } })
    expect(v3().roster['1001']?.ranks.mining).toEqual({ points: 160, rank: 2, challenge: 0 })
    expect(Object.keys(v3().roster)).toEqual(['1001', '1002']) // one to pick on the start's sheet (F23)
    expect(useGame.getState().dirty).toBe(true)
    // The device holds the v3, so a reload doesn't migrate again.
    const row = await readSaveRow('u1')
    expect(row?.save).toEqual(v3())
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 4, save: { version: 3, account: { updatedAt: T1 } } })
    resetGame()
    await boot('u1')
    expect(v3()).toEqual(server.envelope.save)
    expect(useGame.getState().dirty).toBe(false)
  })

  it("from the server on a fresh device, then uploads it", async () => {
    server.envelope = { revision: 5, save: wilds() }
    await boot('u1')
    expect(v3()).toMatchObject({ version: 3, account: { updatedAt: T1 } })
    expect(useGame.getState()).toMatchObject({ revision: 5, dirty: true })
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 6, save: { version: 3, account: { updatedAt: T1 } } })
    expect(useGame.getState()).toMatchObject({ revision: 6, dirty: false })
  })

  it('starts a new account on day 1 with 9 Carrot seeds and nobody yet, the start\'s sheet to pick from (F23)', async () => {
    await boot('u1')
    expect(v3()).toMatchObject({ version: 3, calendar: { day: 1 }, gold: 500, roster: {}, items: { 'seed-carrot': [9, 0, 0, 0, 0] } })
    expect(v3().dorm.home).toEqual([])
    await syncNow()
    expect(server.envelope.save?.version).toBe(3)
  })

  it('migrates a v2 the server moved on to, and sends it back up', async () => {
    await boot('u1')
    await syncNow()
    // The repositories refuse a v2 over a v3, but a v2 put back by hand would come this way: the loop never plays a v2.
    server.envelope = { revision: 9, save: wilds() }
    await syncNow()
    expect(v3()).toMatchObject({ version: 3, account: { updatedAt: T1 } })
    expect(server.envelope).toMatchObject({ revision: 10, save: { version: 3 } })
  })

  it("migrates a 409's stored v2 before reconciling", async () => {
    server.envelope = { revision: 1, save: wilds(T0) }
    await boot('u1')
    await syncNow()
    expect(server.envelope.revision).toBe(2)
    await commit({ ...v3(), gold: 1, account: { ...v3().account, updatedAt: '2026-11-08T15:00:00.000Z' } })
    server.race = { revision: 7, save: wilds(T1) }
    await syncNow()
    expect(server.refused).toBe(1)
    expect(v3()).toMatchObject({ version: 3, gold: 1 })
    expect(server.envelope).toMatchObject({ revision: 8, save: { version: 3, gold: 1 } })
  })

  it('migrates a v2 safety copy it restores', async () => {
    await boot('u1')
    expect(await addSafetyCopy({ uid: 'u1', reason: 'replaced', at: T1, revision: 1, save: wilds() })).toBe(true)
    const [copy] = await safetyCopies('u1')
    expect(await restoreSafetyCopy(copy!.id!)).toBe(true)
    expect(v3()).toMatchObject({ version: 3, gold: 950 })
    expect(Object.keys(v3().roster).slice(0, 2)).toEqual(['1001', '1002'])
  })
})

describe("the Wilds' build", () => {
  it('stops at a loop save instead of playing or overwriting it', async () => {
    vi.stubEnv('VITE_FARM_LOOP', '0')
    server.envelope = { revision: 2, save: newSave('u1', T0) }
    await expect(boot('u1')).rejects.toThrow(LOOP_SAVE_WORDS)
    expect(useGame.getState().status).toBe('idle')
    expect(server.puts).toBe(0)
  })

  it('still plays a v2 as v2', async () => {
    vi.stubEnv('VITE_FARM_LOOP', '0')
    server.envelope = { revision: 2, save: wilds() }
    await boot('u1')
    expect(useGame.getState().save).toEqual(wilds())
  })
})
