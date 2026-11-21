import { describe, expect, it } from 'vitest'
import { chatV4 } from './acts'
import { kindsNow, outingBlock, spendEvening } from './evening'
import { MORNING_KINDS } from './morning-outings'
import { dateSchedule } from '../town/date-schedule'
import { passDayPart, spendActions } from '../farm/actions'
import { parseSaveV6 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type FarmSave } from '../save/v4'
import { storyPackFrom } from '../story/pack'

const a = '9900011'
const b = '9900012'
const pack = storyPackFrom({
  umas: {}, routes: {},
  cast: { umas: [{ characterId: a }, { characterId: b }] },
  town: { professions: [{ id: 'supply', name: 'Grocer', at: 'store', off: 'wednesday', partners: [a, b] }] },
})

function farm(day: number, hired = false): FarmSave {
  const base = newSave('outing-schedule', '2026-11-21T12:00:00.000Z')
  const friend = { ...newLove(), level: 3 }
  return {
    ...base, calendar: { day }, today: { ...base.today, dayParts: true },
    love: { [a]: friend, [b]: friend },
    roster: { [a]: newRosterUma(1), [b]: { ...newRosterUma(1), ...(hired ? { farmhand: 1 } : {}) } },
  }
}

describe('scheduled daytime outings', () => {
  it('gives partners distinct town halves and keeps both halves on their day off', () => {
    const monday = farm(1)
    expect(dateSchedule(monday, pack, a)).toMatchObject({ morning: { activity: 'town', label: 'Grocer' }, afternoon: { activity: 'free' } })
    expect(dateSchedule(monday, pack, b)).toMatchObject({ morning: { activity: 'free' }, afternoon: { activity: 'free' } })
    expect(dateSchedule(farm(6), pack, b)).toMatchObject({ morning: { activity: 'free' }, afternoon: { activity: 'town' } })
    expect(dateSchedule(farm(3, true), pack, b)).toMatchObject({ morning: { activity: 'free' }, afternoon: { activity: 'free' } })
    expect(kindsNow(monday, pack, a)).toEqual([])
    expect(kindsNow(passDayPart(monday, 'afternoon'), pack, a)).toContain('walk')
  })

  it('blocks both halves of farm work before and after marriage while keeping talks available', () => {
    const helper = farm(1, true)
    const spouse = { ...helper, love: { ...helper.love, [b]: { ...newLove(), stage: 'spouse' as const, wed: 1, house: 0 } } }
    for (const save of [helper, spouse]) {
      expect(outingBlock(save, pack, b)).toMatch(/farm/)
      expect(kindsNow(save, pack, b)).toEqual([])
      expect(kindsNow(passDayPart(save, 'afternoon'), pack, b)).toEqual([])
      expect(chatV4(save, b).save.today.chats).toContain(b)
    }
  })

  it('spends one Morning and one Afternoon slot and carries both through save parsing', () => {
    const off = farm(3)
    expect(kindsNow(off, pack, a)).toEqual(MORNING_KINDS)
    expect(() => spendEvening(spendActions(off, 4), pack, a, 'morning-walk', 75)).toThrow(/2 morning actions/)
    const morning = spendEvening(off, pack, a, 'breakfast', 75).save
    expect(morning.today.actions).toBe(2)
    expect(kindsNow(morning, pack, b)).toEqual([])
    const afternoon = passDayPart(morning, 'afternoon')
    expect(kindsNow(afternoon, pack, b)).toContain('walk')
    expect(kindsNow(afternoon, pack, b)).not.toContain('breakfast')
    const both = spendEvening(afternoon, pack, b, 'walk', 75).save
    const loaded = parseSaveV6(JSON.parse(JSON.stringify(both)))
    expect(loaded.today.evenings.map(entry => entry.kind)).toEqual(['breakfast', 'walk'])
    expect(kindsNow(passDayPart(both, 'night'), pack, a)).toEqual([])
  })
})
