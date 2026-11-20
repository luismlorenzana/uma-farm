// The farm starting over: a save from before v5, on the device or (on a fresh device) the server's, stops boot at the
// start-over card; its button makes a fresh v5 once, its `updatedAt` where it was and its first upload unstamped, and a
// dirty device save is kept as a safety copy first, which offers no Restore. An older save met in a sync or a 409 is
// made new and pushed over. A save from a newer app stops boot and is never written over. An in-memory server with the
// API's revision and version rules (it hands an older save back as its version and account), and a fake IndexedDB.
// Invented ids only.
import 'fake-indexeddb/auto'
import { fieldTiles, newSave, touched, versionOf, type SaveEnvelope, type SaveV4, type StoredSave } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({})), setMasterLens: vi.fn() }))

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

const { boot, commit, NEWER_SAVE_WORDS, resetGame, restoreSafetyCopy, startOver, startingOver, syncNow, useGame } = await import('./game')
const { db, readSaveRow, safetyCopies } = await import('./db')

const T0 = '2026-11-08T09:12:44.000Z'
const T1 = '2026-11-10T21:40:03.512Z'
const ACCOUNT = { uid: 'u1', createdAt: T0, updatedAt: T1 }
/** A played v3 as the device stored it: more than the farm reads now, its last change at T1. */
const playedV3 = (gold = 812) => ({ version: 3, account: ACCOUNT, calendar: { day: 2 }, gold, start: { redraws: 1 }, roster: { 1001: { joined: 1 } }, visitors: [] })
/** The server's answer for a stored v3: its version and account, as `parseStored` reads it. */
const serverV3 = (revision: number): SaveEnvelope => ({ revision, save: { version: 3, account: ACCOUNT } })
const farm = (): SaveV4 => useGame.getState().save!

beforeEach(async () => {
  resetGame()
  server.envelope = { revision: 0, save: null }
  server.puts = 0
  server.refused = 0
  server.race = null
  await db.save.clear()
  await db.safety.clear()
})

describe('a save from before v5', () => {
  it('on the device stops boot at the card, writing nothing; the button makes the new farm, keeps a dirty one first, and uploads it unstamped', async () => {
    server.envelope = serverV3(4)
    await db.save.put({ id: 'main', uid: 'u1', revision: 4, dirty: true, save: playedV3(999) as never })
    await expect(boot('u1')).resolves.toEqual({ startOver: true })
    expect(startingOver()).toBe(true)
    expect(useGame.getState()).toMatchObject({ status: 'booting', save: null })
    expect(await safetyCopies('u1')).toEqual([])
    expect((await readSaveRow('u1'))?.save).toEqual({ version: 3, account: ACCOUNT })
    // A second boot call for the same account answers the same, and changes nothing.
    await expect(boot('u1')).resolves.toEqual({ startOver: true })
    await startOver()
    expect(startingOver()).toBe(false)
    expect(useGame.getState()).toMatchObject({ status: 'ready', revision: 4, dirty: true })
    expect(farm()).toMatchObject({ version: 6, calendar: { day: 1 }, gold: 500, roster: {}, farmer: { name: '' }, account: ACCOUNT })
    const [copy] = await safetyCopies('u1')
    expect(copy).toMatchObject({ reason: 'wiped', revision: 4, save: playedV3(999) })
    expect((await readSaveRow('u1'))?.save).toEqual(farm())
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 5, save: { version: 6, account: ACCOUNT } })
    // Once: the next boot plays the v5.
    resetGame()
    await expect(boot('u1')).resolves.toEqual({ startOver: false })
    expect(farm().account.updatedAt).toBe(T1)
    expect(await safetyCopies('u1')).toHaveLength(1)
    // A copy from before v5 isn't restored: it would only start over again.
    expect(await restoreSafetyCopy(copy!.id!)).toBe(false)
    expect(farm().version).toBe(6)
  })

  it('on the device, clean, starts over without a copy', async () => {
    server.envelope = serverV3(4)
    await db.save.put({ id: 'main', uid: 'u1', revision: 4, dirty: false, save: playedV3() as never })
    await expect(boot('u1')).resolves.toEqual({ startOver: true })
    await startOver()
    expect(farm().version).toBe(6)
    expect(await safetyCopies('u1')).toEqual([])
  })

  it("on the server, on a fresh device, stops at the card, then uploads the new farm with updatedAt where it was", async () => {
    server.envelope = serverV3(9)
    await expect(boot('u1')).resolves.toEqual({ startOver: true })
    expect(await db.save.get('main')).toBeUndefined()
    await startOver()
    expect(farm()).toMatchObject({ version: 6, account: ACCOUNT })
    expect(useGame.getState()).toMatchObject({ revision: 9, dirty: true })
    await syncNow()
    expect(server.puts).toBe(1)
    expect(server.envelope).toMatchObject({ revision: 10, save: { version: 6, account: ACCOUNT } })
    await syncNow()
    expect(server.puts).toBe(1)
  })

  it('stops at the card for a v4 farm of blocks too, and makes the new farm of tiles over it', async () => {
    server.envelope = { revision: 12, save: { version: 4, account: ACCOUNT } }
    await expect(boot('u1')).resolves.toEqual({ startOver: true })
    await startOver()
    expect(farm()).toMatchObject({ version: 6, calendar: { day: 1 }, account: ACCOUNT, today: { actions: 0 } })
    expect(fieldTiles(farm())).toHaveLength(40)
    await syncNow()
    expect(server.envelope).toMatchObject({ revision: 13, save: { version: 6, account: ACCOUNT } })
  })

  it('met in a sync is made new and pushed over', async () => {
    await boot('u1')
    await syncNow()
    // Put back by hand, say: the farm never plays it.
    server.envelope = serverV3(9)
    await syncNow()
    expect(farm()).toMatchObject({ version: 6, calendar: { day: 1 }, account: ACCOUNT })
    expect(server.envelope).toMatchObject({ revision: 10, save: { version: 6 } })
  })

  it("in a 409 is made new before reconciling: the device's later change wins", async () => {
    await boot('u1')
    await syncNow()
    await commit(touched({ ...farm(), gold: 1 }, '2026-11-11T15:00:00.000Z'))
    server.race = serverV3(7)
    await syncNow()
    expect(server.refused).toBe(1)
    expect(farm()).toMatchObject({ version: 6, gold: 1 })
    expect(server.envelope).toMatchObject({ revision: 8, save: { version: 6, gold: 1 } })
  })
})

describe('a new farm', () => {
  it("starts a fresh device with an empty server straight on v5's day 1, the farmer unnamed", async () => {
    await expect(boot('u1')).resolves.toEqual({ startOver: false })
    expect(farm()).toMatchObject({ version: 6, calendar: { day: 1 }, farmer: { name: '' }, roster: {}, items: { 'seed-carrot': [9, 0, 0, 0, 0] } })
    await syncNow()
    expect(server.envelope.save?.version).toBe(6)
  })
})

describe('a save from a newer app', () => {
  it('stops boot from the server and never writes over it', async () => {
    const newer = { ...newSave('u1', T0), version: 7 } as unknown as SaveV4
    server.envelope = { revision: 3, save: newer }
    await expect(boot('u1')).rejects.toThrow(NEWER_SAVE_WORDS)
    expect(useGame.getState().save).toBeNull()
    expect(server.puts).toBe(0)
    expect(server.envelope.save).toEqual(newer)
  })

  it('on the device is kept as an unreadable copy, and the server decides', async () => {
    const newer = { ...newSave('u1', T0), version: 7 }
    await db.save.put({ id: 'main', uid: 'u1', revision: 3, dirty: false, save: newer as never })
    server.envelope = { revision: 3, save: newer as unknown as SaveV4 }
    await expect(boot('u1')).rejects.toThrow(NEWER_SAVE_WORDS)
    expect((await safetyCopies('u1'))[0]).toMatchObject({ reason: 'unreadable', save: { version: 7 } })
    expect(server.puts).toBe(0)
  })

  it('stops a sync before any upload', async () => {
    await boot('u1')
    await syncNow()
    const puts = server.puts
    await commit(touched({ ...farm(), gold: 7 }, '2026-11-11T15:00:00.000Z'))
    server.envelope = { revision: 9, save: { ...newSave('u1', T0), version: 7 } as unknown as SaveV4 }
    await syncNow()
    expect(server.puts).toBe(puts)
    expect(useGame.getState().sync).toBe('error')
  })
})
