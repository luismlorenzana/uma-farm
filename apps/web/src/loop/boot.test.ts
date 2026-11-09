// The loop's boot (F17 decisions 2 and 9): the temporary picks, and a stored save carried into v3 once master data has
// loaded. Invented outfit ids only.
import { newSave, newSaveV2, parseSaveV3, type SaveV2 } from '@farm/domain'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const RELEASE = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008']
const LINE: Readonly<Record<string, string>> = { 1001: 'metal', 1002: 'wood', 1003: 'fish', 1004: 'vegetables', 1005: 'stone', 1006: 'metal', 1007: 'wood', 1008: 'fish' }
const masterReady = vi.fn(async () => ({ roster: RELEASE.map((outfitId) => ({ outfitId, trade: 'physical', line: LINE[outfitId] })) }))
vi.mock('../master/master', () => ({ masterReady }))

const { fillStart, newLoopSave, toLoopSave } = await import('./boot')

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T11:00:00.000Z'

beforeEach(() => masterReady.mockClear())

describe('the temporary picks (decision 9)', () => {
  it('fills a new farm with three of the release, seeded by the account', () => {
    const save = fillStart(newSave('u1', AT), RELEASE)
    const picks = Object.keys(save.roster)
    expect(picks).toHaveLength(3)
    expect(picks.every((id) => RELEASE.includes(id))).toBe(true)
    expect([...save.dorm.home].sort()).toEqual([...picks].sort())
    expect(Object.values(save.roster).every((u) => u.joined === 1)).toBe(true)
    expect(fillStart(newSave('u1', AT), RELEASE)).toEqual(save)
    expect(Object.keys(fillStart(newSave('u2', AT), RELEASE).roster)).not.toEqual(picks)
    expect(save.account).toEqual(newSave('u1', AT).account)
    expect(parseSaveV3(JSON.parse(JSON.stringify(save)))).toEqual(save)
  })

  it('fills only the gap, keeping the Umas a save has', () => {
    const one = fillStart(newSave('u1', AT), ['1004'])
    const save = fillStart(one, RELEASE)
    expect(Object.keys(save.roster)).toHaveLength(3)
    expect(save.roster['1004']).toEqual(one.roster['1004'])
    expect(fillStart(save, RELEASE)).toBe(save)
  })

  it('takes what the release has when it holds fewer', () => {
    expect(Object.keys(fillStart(newSave('u1', AT), ['1001']).roster)).toEqual(['1001'])
    const none = newSave('u1', AT)
    expect(fillStart(none, [])).toBe(none)
  })
})

describe('a stored save in the loop', () => {
  it('migrates a v2 with master data, keeping the account, and fills the gap', async () => {
    const v2: SaveV2 = { ...newSaveV2('u1', AT), account: { uid: 'u1', createdAt: AT, updatedAt: LATER },
      umas: { 1001: { craft: { level: 16, exp: 0 } }, 1003: { craft: { level: 6, exp: 0 } } }, items: { 'weapon-gem-g1': 1, carp: 2 } }
    const v3 = await toLoopSave(v2)
    expect(masterReady).toHaveBeenCalledOnce()
    expect(v3.account).toEqual(v2.account)
    expect(v3.gold).toBe(500 + 150)
    expect(v3.items.carp).toEqual([2, 0, 0, 0, 0])
    expect(v3.roster['1001']?.ranks.mining).toEqual({ points: 160, rank: 2, challenge: 0 })
    expect(v3.roster['1003']?.ranks.fishing).toEqual({ points: 40, rank: 1, challenge: 0 })
    expect(Object.keys(v3.roster)).toHaveLength(3)
  })

  it('migrates a v2 nobody has worked in, and fills its three', async () => {
    const v3 = await toLoopSave({ ...newSaveV2('u1', AT), account: { uid: 'u1', createdAt: AT, updatedAt: LATER } })
    expect(v3.account.updatedAt).toBe(LATER)
    expect(Object.keys(v3.roster)).toHaveLength(3)
  })

  it('leaves a v3 with its three as it is, without waiting for master data', async () => {
    const save = await newLoopSave('u1', AT)
    masterReady.mockClear()
    expect(await toLoopSave(save)).toBe(save)
    expect(masterReady).not.toHaveBeenCalled()
  })

  it('starts a new account on day 1 with its three', async () => {
    const save = await newLoopSave('u1', AT)
    expect(save).toMatchObject({ version: 3, calendar: { day: 1 }, gold: 500, items: { 'seed-carrot': [9, 0, 0, 0, 0] } })
    expect(save.dorm.home).toHaveLength(3)
  })
})
