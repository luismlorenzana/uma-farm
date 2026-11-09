// The nudge (F18 decision 9; CS6): idle Umas plus things to collect, read at the day's start.
import { describe, expect, it } from 'vitest'
import { startLoopJob } from '../save/loop-work'
import { newBlock, newRosterUma, newSave, type SaveV3 } from '../save/v3'
import { endDay } from './end-day'
import { TEST_KINDS } from './kinds.fixture'
import { daySetState } from './nudge'

const AT = '2026-11-09T10:00:00.000Z'
function farm(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202', '303'], swaps: [] } }
}
const gather = (save: SaveV3, outfitId: string, slot: number) =>
  startLoopJob(save, { outfitId, place: 'forest', slot, request: { kind: 'gather', item: 'pine-log', count: 1 } }, AT, TEST_KINDS)

describe('the nudge (CS6)', () => {
  it('counts idle Umas, and reads "All set" when everyone works and nothing waits', () => {
    expect(daySetState(farm())).toEqual({ allSet: false, idle: ['101', '202', '303'], collect: 0, badge: 3 })
    const two = gather(gather(farm(), '101', 0), '202', 1)
    expect(daySetState(two)).toEqual({ allSet: false, idle: ['303'], collect: 0, badge: 1 })
    const all = gather(two, '303', 2)
    expect(daySetState(all)).toEqual({ allSet: true, idle: [], collect: 0, badge: 0 })
  })

  it('counts each Uma with finished work as one to collect, and idle until she has work again', () => {
    const morning = endDay(gather(farm(), '101', 0), { roster: [], kinds: TEST_KINDS }, AT)
    expect(daySetState(morning)).toEqual({ allSet: false, idle: ['101', '202', '303'], collect: 1, badge: 4 })
  })

  it('counts a tender with a growing plot as working, and each Ready plot as one to collect', () => {
    const save = farm()
    const a = newBlock('A')
    a.tender = '101'
    a.plots[0] = { crop: 'carrot', growth: 2, ready: false, regrowing: false, own: false }
    a.plots[1] = { crop: 'carrot', growth: 4, ready: true, regrowing: false, own: false }
    const b = newBlock('B')
    b.tender = '202'
    b.plots[0] = { crop: 'potato', growth: 5, ready: true, regrowing: false, own: false }
    expect(daySetState({ ...save, fields: { blocks: [a, b] } })).toEqual({ allSet: false, idle: ['202', '303'], collect: 2, badge: 4 })
  })
})
