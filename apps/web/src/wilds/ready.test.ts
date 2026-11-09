// The Ready counts (F5): a place counts each slot with something to collect, finished or partly made; a queue keeps going.
import { newSaveV2, startJob, type Save } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { readySlots, readyTotal } from './ready'

const T0 = '2026-11-08T12:00:00.000Z'
const at = (minutes: number) => Date.parse(T0) + minutes * 60_000

describe('the Ready counts', () => {
  it('counts each slot with something to collect, place by place', () => {
    let save: Save = { ...newSaveV2('u1', T0), items: { 'copper-ore': 2 } }
    save = startJob(save, 'mine', 0, { outfitId: '81001' }, 'copper-ore', 2, T0)
    save = startJob(save, 'mine', 1, { outfitId: '81002' }, 'copper-ore', 1, T0)
    save = startJob(save, 'mine-workbench', 0, { outfitId: '81003' }, 'copper-ingot', 2, T0)
    expect(readyTotal(save, at(0))).toBe(0)
    expect(readySlots(null, at(0)).size).toBe(0)
    // One step is 24 min at Craft Lv 1, at ×1.25: 19.2 min. By 20 minutes each has made one.
    expect([...readySlots(save, at(20))]).toEqual([['mine', 2], ['mine-workbench', 1]])
    expect(readyTotal(save, at(20))).toBe(3)
    expect(readyTotal(save, at(60 * 24))).toBe(3)
  })
})
