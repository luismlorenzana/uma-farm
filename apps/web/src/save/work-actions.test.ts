// The store's work actions (F5): each reads the save right before its rule runs, so quick taps never lose one another; a
// refusal changes nothing; jobs settle from the clock after the app reopens. A fake IndexedDB, a server that's down (the
// changes stay on the device) and a fake clock. Invented outfit ids only.
import 'fake-indexeddb/auto'
import { newSave, SaveRuleError, slotJobOf, type Save } from '@farm/domain'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { albumFixture } from '../album/testing'

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async () => { throw new TypeError('Failed to fetch') }) } }
})

const { boot, collectEverything, collectWork, commit, editWorkQueue, recallWork, repeatWork, resetGame, startWork, useGame, workContext } = await import('./game')
const { db } = await import('./db')

const T0 = Date.parse('2026-11-08T12:00:00.000Z')
const save = (): Save => useGame.getState().save!
const at = (minutes: number) => vi.setSystemTime(T0 + minutes * 60_000)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  at(0)
  resetGame()
  await db.save.clear()
  await boot('u1')
  await commit({ ...save(), items: { 'copper-ore': 3 } })
})
afterEach(() => vi.useRealTimers())

describe('the work actions', () => {
  it('keeps two quick taps: each applies to the other\'s result', async () => {
    await Promise.all([startWork('mine', 0, '81001', 'copper-ore', 2), startWork('mine', 1, '81002', 'copper-ore', 1)])
    expect(Object.values(save().work).map((r) => [r.outfitId, r.slot])).toEqual([
      ['81001', { building: 'mine', slot: 0 }], ['81002', { building: 'mine', slot: 1 }],
    ])
    expect(save().umas).toEqual({ 81001: { craft: { level: 1, exp: 0 } }, 81002: { craft: { level: 1, exp: 0 } } })
  })

  it('takes inputs at the start, gives them back on Recall, and refuses without changing anything', async () => {
    await startWork('mine-workbench', 0, '81001', 'copper-ingot', 2)
    expect(save().items).toEqual({ 'copper-ore': 1 })
    const before = save()
    await expect(startWork('mine-workbench', 1, '81002', 'copper-ingot', 2)).rejects.toThrow(SaveRuleError)
    expect(save()).toBe(before)
    await recallWork('81001')
    expect(save().items).toEqual({ 'copper-ore': 3 })
    expect(save().work['81001']?.slot ?? null).toBeNull()
  })

  it('settles after the app reopens: a queue keeps going, Collect and Repeat take what\'s made', async () => {
    await startWork('mine', 0, '81001', 'copper-ore', 1)
    await editWorkQueue({ outfitId: '81001', add: { request: { kind: 'gather', item: 'copper-ore', count: 2 }, building: 'mine' } })
    // Closed for an hour: three steps of 19.2 min are done when it opens again.
    resetGame()
    at(60)
    await boot('u1')
    // The screens settle at the clock: the stored row still holds the queue, the reading has run it.
    expect(save().work['81001']?.queue).toHaveLength(1)
    expect(slotJobOf(save(), '81001', new Date().toISOString())).toMatchObject({ ready: 3, done: true, queue: [] })
    const got = await collectWork('81001')
    expect(got).toMatchObject({ items: 3, done: true })
    expect(save().items['copper-ore']).toBe(6)
    await repeatWork('81001')
    expect(save().work['81001']?.entries.at(-1)?.request).toEqual({ kind: 'gather', item: 'copper-ore', count: 2 })
  })

  it('collects every ready job at once, and changes nothing when none is ready', async () => {
    const idle = save()
    expect(await collectEverything()).toEqual({ items: 0, levelsUp: 0 })
    expect(save()).toBe(idle)
    await startWork('mine', 0, '81001', 'copper-ore', 1)
    await startWork('mine-workbench', 0, '81002', 'copper-ingot', 1)
    at(30)
    expect(await collectEverything()).toEqual({ items: 2, levelsUp: 0 })
    expect(save().items).toMatchObject({ 'copper-ore': 3, 'copper-ingot': 1 })
  })

  it('gates by the roster\'s trades once master data has loaded', async () => {
    expect(workContext(null)).toEqual({})
    const { view } = await albumFixture()
    const context = workContext(view.roster)
    expect(workContext(view.roster)).toBe(context)
    expect(context.tradeOf?.('81001')).toBe('physical')
    expect(context.roster?.has('81006')).toBe(true)
    expect(newSave('u1', new Date(T0).toISOString()).work).toEqual({})
  })
})
