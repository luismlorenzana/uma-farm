// Copied from uma-rpg packages/domain/src/save/notify.test.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
import { describe, expect, it } from 'vitest'
import { HOUR, MINUTE, stepMinutes } from '../economy/pacing'
import { newSave, type Save } from './save'
import { finishesBetween, finishNotice, nextIdleAt, pushSchedule, PUSH_SCHEDULE_MAX, readySlots, scheduleNotice, workNotice, type PushEntry } from './notify'
import { queueJob, startJob, type WorkOutfit } from './work'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const at = (ms: number) => new Date(T0 + ms).toISOString()
// An invented outfit at Craft Lv1: an item takes U at a place's ×1.25, whatever its grade (D139).
const turfA: WorkOutfit = { outfitId: '101' }
const U = Math.round((stepMinutes(1) * MINUTE) / 1000 / 1.25) * 1000
const give = (save: Save, items: Record<string, number>): Save => ({ ...save, items: { ...save.items, ...items } })

describe('finish notifications (QoL, D63)', () => {
  it('finds each job in a chain as it ends, and announces only the slot going idle', () => {
    let save = startJob(newSave('u1', at(0)), 'mine', 0, turfA, 'copper-ore', 2, at(0))
    save = queueJob(save, 'mine', 0, turfA, 'copper-ore', 1, at(0))
    expect(finishesBetween(save, T0, T0 + 1.5 * U)).toEqual([])
    expect(finishesBetween(save, T0, T0 + 5 * U).map((f) => [f.at - T0, f.idle])).toEqual([[2 * U, false], [3 * U, true]])
    expect(finishNotice(finishesBetween(save, T0, T0 + 2.5 * U))).toBeNull()
    const notice = { title: 'Work done', body: 'Mine: Copper Ore ×1', tag: 'slot-mine-0', url: '/wilds/mine' }
    expect(finishNotice(finishesBetween(save, T0, T0 + 5 * U))).toEqual(notice)
    expect(workNotice(save, T0, T0 + 5 * U)).toEqual(notice)
    expect(readySlots(save, at(5 * U))).toBe(1)
    expect(HOUR).toBe(60 * MINUTE)
  })

  it('stays quiet about queued jobs that never started', () => {
    let save = give(newSave('u1', at(0)), { 'copper-ore': 1 })
    save = startJob(save, 'mine-workbench', 0, turfA, 'copper-ingot', 1, at(0))
    save = queueJob(save, 'mine-workbench', 0, turfA, 'copper-ingot', 5, at(0))
    expect(finishesBetween(save, T0, T0 + HOUR).map((f) => [f.output, f.idle])).toEqual([['copper-ingot', true]])
  })

  it('lists several slots going idle in one notice', () => {
    let save = startJob(newSave('u1', at(0)), 'mine', 0, turfA, 'copper-ore', 1, at(0))
    save = startJob(save, 'fields', 0, { outfitId: '102' }, 'carrot', 1, at(0))
    expect(workNotice(save, T0, T0 + 2 * U)).toEqual({ title: '2 jobs done', body: 'Mine: Copper Ore ×1\nFields: Carrot ×1', tag: 'work', url: '/' })
  })

  it('says when the next slot goes idle, past a queue, for the push schedule (F6)', () => {
    let save = startJob(newSave('u1', at(0)), 'mine', 0, turfA, 'copper-ore', 2, at(0))
    save = queueJob(save, 'mine', 0, turfA, 'copper-ore', 1, at(0))
    expect(nextIdleAt(save, T0)).toBe(T0 + 3 * U)
    expect(nextIdleAt(save, T0 + 3 * U)).toBeNull()
    expect(nextIdleAt(newSave('u1', at(0)), T0)).toBeNull()
  })
})

// The farm's own (F6): what the app sends on every sync, and the one notification a tick makes of what came due.
describe('the push schedule (F6)', () => {
  it('lists each slot going idle after now, past its queue, with the badge then', () => {
    let save = startJob(newSave('u1', at(0)), 'mine', 0, turfA, 'copper-ore', 2, at(0))
    save = queueJob(save, 'mine', 0, turfA, 'copper-ore', 1, at(0))
    save = startJob(save, 'fields', 0, { outfitId: '102' }, 'carrot', 1, at(0))
    // When the Fields go idle, the Mine already holds its first ore: two slots to collect.
    expect(pushSchedule(save, T0)).toEqual([{ at: T0 + U, place: 'fields', badge: 2 }, { at: T0 + 3 * U, place: 'mine', badge: 2 }])
    expect(pushSchedule(save, T0 + U)).toEqual([{ at: T0 + 3 * U, place: 'mine', badge: 2 }])
    expect(pushSchedule(save, T0 + 3 * U)).toEqual([])
    expect(pushSchedule(newSave('u1', at(0)), T0)).toEqual([])
    expect(PUSH_SCHEDULE_MAX).toBe(60)
  })

  it('words what came due by place, never by Uma, with the latest badge', () => {
    const e = (place: string, at: number, badge: number): PushEntry => ({ at, place, badge })
    expect(scheduleNotice([])).toBeNull()
    expect(scheduleNotice([e('mine', 2, 2), e('mine', 1, 1)])).toEqual({ title: 'Work done', body: 'Mine: 2 jobs done', tag: 'work-mine', url: '/wilds/mine', badge: 2 })
    expect(scheduleNotice([e('fields', 1, 1), e('mine', 2, 2), e('fields', 3, 3)])).toEqual({ title: 'Work done', body: 'Fields: 2 jobs done\nMine: 1 job done', tag: 'work', url: '/', badge: 3 })
    const many = ['mine', 'fields', 'forest', 'fishery', 'monster-den', 'mine-workbench'].map((p, i) => e(p, i, i + 1))
    expect(scheduleNotice(many)!.body.split('\n')).toEqual(['Mine: 1 job done', 'Fields: 1 job done', 'Forest: 1 job done', 'Fishery: 1 job done', 'and 2 more places'])
  })
})
