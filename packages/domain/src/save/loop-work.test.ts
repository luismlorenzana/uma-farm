// The loop's work on the day clock (F18 decision 1): F5's operations over a v3 save at `workNow`, stamped with real time;
// readings stamp nothing. Invented outfit ids and the test kinds.
import { describe, expect, it } from 'vitest'
import { DAY_MS } from '../farm/calendar'
import { endDay } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import {
  collectLoopWorker, dismissLoopStopped, editLoopQueue, recallLoopWorker, repeatLoopJob, restartLoopStopped, settleLoopWork, startLoopJob,
} from './loop-work'
import { SaveRuleError } from './rules'
import { newRosterUma, newSave, type SaveV3 } from './v3'

const AT = '2026-11-09T10:00:00.000Z'
const T1 = '2026-11-09T11:00:00.000Z'
function farm(day = 1): SaveV3 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) },
    dorm: { level: 1, home: ['101', '202'], swaps: [] }, items: { ...save.items, wheat: [1, 0, 0, 0, 0] },
  }
}
const make = { kind: 'make', item: 'wheat-flour', count: 1 }
const gather = { kind: 'gather', item: 'pine-log', count: 1 }
const night = (save: SaveV3) => endDay(save, { roster: [], kinds: TEST_KINDS }, T1)
const startAt = (save: SaveV3, outfitId: string, place: 'mill' | 'forest', slot: number, request = place === 'mill' ? make : gather) =>
  startLoopJob(save, { outfitId, place, slot, request }, T1, TEST_KINDS)

describe('work on the day clock (decision 1)', () => {
  it('starts a job at the day\'s start, stamped with real time, its inputs taken', () => {
    const save = startAt(farm(3), '101', 'mill', 0)
    expect(save.work['101']!.entries[0]).toMatchObject({ startedAt: 2 * DAY_MS, seconds: [86_400], speed: 1 })
    expect(save.items.wheat).toBeUndefined()
    expect(save.account.updatedAt).toBe(T1)
  })

  it('refuses in the loop\'s words: a fifth slot, an Uma away, a busy one for days, short inputs', () => {
    const save = farm()
    expect(() => startAt(save, '101', 'mill', 4)).toThrow("slot 4 doesn't exist")
    expect(() => startAt(save, '303', 'forest', 0)).toThrow('She isn’t on the farm.')
    const busy = startAt(save, '101', 'forest', 0, { ...gather, count: 3 })
    expect(() => startAt(busy, '101', 'forest', 1)).toThrow('She is busy for another 3 days.')
    expect(() => startAt(busy, '202', 'mill', 0, { ...make })).not.toThrow()
    expect(() => startAt(startAt(busy, '202', 'mill', 0), '202', 'mill', 1)).toThrow(SaveRuleError)
    expect(() => startAt({ ...save, items: {} }, '202', 'mill', 0)).toThrow('Short 1 Wheat.')
  })

  it('collects, recalls and repeats at the day\'s start', () => {
    const morning = night(startAt(farm(), '101', 'forest', 0))
    const got = collectLoopWorker(morning, '101', T1, TEST_KINDS)
    expect(got).toMatchObject({ items: 1, done: true, save: { items: { 'pine-log': [1, 0, 0, 0, 0] } } })
    expect(got.save.work['101']!.slot).toBeNull()
    const again = repeatLoopJob(morning, '101', T1, TEST_KINDS)
    expect(again.items['pine-log']).toEqual([1, 0, 0, 0, 0])
    expect(again.work['101']!.entries).toMatchObject([{ startedAt: DAY_MS, fromQueue: false }])
    const recalled = recallLoopWorker(startAt(farm(), '202', 'mill', 1), '202', T1, TEST_KINDS)
    expect(recalled.items.wheat).toEqual([1, 0, 0, 0, 0])
    expect(recalled.work['202']).toBeUndefined()
  })

  it('stops a queue short of inputs at the boundary, then restarts or dismisses it', () => {
    const queued = editLoopQueue(startAt(farm(), '101', 'mill', 0), { outfitId: '101', add: { request: make, building: 'mill' } }, T1, TEST_KINDS)
    const morning = night(queued)
    expect(morning.work['101']!.dropped).toMatchObject({ at: DAY_MS, short: [{ item: 'wheat@1', qty: 1 }] })
    expect(() => restartLoopStopped(morning, '101', T1, TEST_KINDS)).toThrow('Short 1 Wheat.')
    const stocked: SaveV3 = { ...morning, items: { ...morning.items, wheat: [1, 0, 0, 0, 0] } }
    expect(restartLoopStopped(stocked, '101', T1, TEST_KINDS).work['101']!.entries).toMatchObject([{ startedAt: DAY_MS }])
    expect(dismissLoopStopped(morning, '101', T1, TEST_KINDS).work['101']!.dropped).toBeNull()
  })

  it('settles as a reading: nothing stamped, nothing new during the day', () => {
    const save = startAt(farm(), '101', 'forest', 0)
    expect(settleLoopWork(save, TEST_KINDS)).toEqual(save)
  })
})
