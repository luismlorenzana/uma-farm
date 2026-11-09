// The loop's boot (F17 decision 2, F23 decision 2): a stored save carried into v3 once master data has loaded, and a
// new account on day 1 with nobody on the roster, the start's sheet to come. Invented outfit ids only.
import { newSave, newSaveV2, picksLeft, type SaveV2 } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const RELEASE = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008']
const LINE: Readonly<Record<string, string>> = { 1001: 'metal', 1002: 'wood', 1003: 'fish', 1004: 'vegetables', 1005: 'stone', 1006: 'metal', 1007: 'wood', 1008: 'fish' }
const masterReady = vi.fn(async () => ({ roster: RELEASE.map((outfitId) => ({ outfitId, trade: 'physical', line: LINE[outfitId] })) }))
vi.mock('../master/master', () => ({ masterReady }))

const { newLoopSave, toLoopSave } = await import('./boot')

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T11:00:00.000Z'

beforeEach(() => masterReady.mockClear())

describe('a stored save in the loop', () => {
  it('migrates a v2 with master data, keeping the account and its Umas, the rest to pick', async () => {
    const v2: SaveV2 = { ...newSaveV2('u1', AT), account: { uid: 'u1', createdAt: AT, updatedAt: LATER },
      umas: { 1001: { craft: { level: 16, exp: 0 } }, 1003: { craft: { level: 6, exp: 0 } } }, items: { 'weapon-gem-g1': 1, carp: 2 } }
    const v3 = await toLoopSave(v2)
    expect(masterReady).toHaveBeenCalledOnce()
    expect(v3.account).toEqual(v2.account)
    expect(v3.gold).toBe(500 + 150)
    expect(v3.items.carp).toEqual([2, 0, 0, 0, 0])
    expect(v3.roster['1001']?.ranks.mining).toEqual({ points: 160, rank: 2, challenge: 0 })
    expect(v3.roster['1003']?.ranks.fishing).toEqual({ points: 40, rank: 1, challenge: 0 })
    expect(Object.keys(v3.roster)).toEqual(['1001', '1003'])
    expect(picksLeft(v3)).toBe(1)
  })

  it('migrates a v2 nobody has worked in, its three to pick', async () => {
    const v3 = await toLoopSave({ ...newSaveV2('u1', AT), account: { uid: 'u1', createdAt: AT, updatedAt: LATER } })
    expect(v3.account.updatedAt).toBe(LATER)
    expect(picksLeft(v3)).toBe(3)
  })

  it('leaves any v3 as it is, without waiting for master data', async () => {
    const save = newSave('u1', AT)
    expect(await toLoopSave(save)).toBe(save)
    expect(masterReady).not.toHaveBeenCalled()
  })

  it('starts a new account on day 1 with nobody yet, without waiting for master data', async () => {
    const save = await newLoopSave('u1', AT)
    expect(save).toMatchObject({ version: 3, calendar: { day: 1 }, gold: 500, roster: {}, items: { 'seed-carrot': [9, 0, 0, 0, 0] } })
    expect(save.dorm.home).toEqual([])
    expect(picksLeft(save)).toBe(3)
    expect(masterReady).not.toHaveBeenCalled()
  })
})
