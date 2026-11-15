// The push schedule's notices: one "Work done" for what came due, worded by the farm's work places, never by Uma.
import { describe, expect, it } from 'vitest'
import { isPushPlace, PUSH_SCHEDULE_MAX, scheduleNotice, type PushEntry } from './notify'

describe('the push schedule', () => {
  it('holds one entry a work slot: twelve places of four', () => {
    expect(PUSH_SCHEDULE_MAX).toBe(48)
    expect(isPushPlace('coop')).toBe(true)
    expect(isPushPlace('forest')).toBe(true)
    expect(isPushPlace('smelter')).toBe(true)
    expect(isPushPlace('fields')).toBe(false)
    expect(isPushPlace('mine-workbench')).toBe(false)
  })

  it('words what came due by place, never by Uma, with the latest badge', () => {
    const e = (place: string, at: number, badge: number): PushEntry => ({ at, place, badge })
    expect(scheduleNotice([])).toBeNull()
    expect(scheduleNotice([e('forest', 2, 2), e('forest', 1, 1)])).toEqual({ title: 'Work done', body: 'Forest: 2 jobs done', tag: 'work-forest', url: '/?peek=forest', badge: 2 })
    expect(scheduleNotice([e('mill', 1, 1), e('forest', 2, 2), e('mill', 3, 3)])).toEqual({ title: 'Work done', body: 'Mill: 2 jobs done\nForest: 1 job done', tag: 'work', url: '/', badge: 3 })
    const many = ['forest', 'fishery', 'mill', 'sawmill', 'smokehouse', 'mine'].map((p, i) => e(p, i, i + 1))
    expect(scheduleNotice(many)!.body.split('\n')).toEqual(['Forest: 1 job done', 'Fishery: 1 job done', 'Mill: 1 job done', 'Sawmill: 1 job done', 'and 2 more places'])
  })
})
