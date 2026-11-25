import { describe, expect, it } from 'vitest'
import { canSpendForEvent, eventActionsLeft, GAME_DAYS } from '../farm/actions'
import { shipCrate } from '../save/bin'
import { runNight } from '../night/end-day'
import { playOccasion } from '../romance/occasions'
import { giftV4 } from '../romance/acts'
import { parseSaveV6 } from '../save/parse-v4'
import { newSave, newLove, newRosterUma, type FarmSave } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { communityEvent, eventPreparation } from './agenda'
import { enterFlower } from './contests'
import { setFestivalPlan, visitFestival, eventVisited } from './journal'

const owner = '101'
const guest = '102'
const story = castPack([owner, guest])
const roundTrip = (save: FarmSave) => parseSaveV6(JSON.parse(JSON.stringify(save)))
const saveAt = (day: number) => {
  const base = newSave('festival-fixture', '2026-11-25T12:00:00.000Z')
  return {
    ...base, calendar: { day }, farmer: { name: 'Robin' },
    items: addGoods(base.items, 'carrot', 2, 2),
    roster: { [owner]: newRosterUma(1), [guest]: newRosterUma(1) },
    love: { [owner]: newLove(), [guest]: newLove() },
  }
}

describe('the full festival flow', () => {
  const days = { ...GAME_DAYS, birthdays: new Map([[owner, 19], [guest, 19]]) }
  it('visits free, preserves each birthday and contest fund, and saves the actual judged result', () => {
    const base = saveAt(19)
    const full = { ...base, today: { ...base.today, actions: 10, eventFunding: {} } }
    expect(canSpendForEvent(full, 1, days)).toBe(false)
    const visited = visitFestival(full, 'flower-show', 19, days)
    expect(visitFestival(visited, 'flower-show', 19, days)).toBe(visited)
    expect(eventVisited(visited, 'flower-show')).toBe(true)
    const birthday = playOccasion(visited, story, owner, days, 'birthday')
    expect(birthday.love[owner]?.points).toBe(25)
    expect(eventActionsLeft(birthday, days, `birthday:${guest}`)).toBe(1)
    expect(eventActionsLeft(birthday, days, 'contest')).toBe(3)
    const social = playOccasion(birthday, story, owner, days, 'flower-show')
    expect(eventActionsLeft(social, days, 'social')).toBe(0)
    const judged = enterFlower(social, 'carrot@2', null, days)
    expect(judged.today.actions).toBe(10)
    const receipt = judged.eventJournal!.results![0]!
    expect(receipt).toMatchObject({ id: 'flower-show', day: 19, place: 3, gold: 100, points: 25, stock: [{ key: 'carrot@2', count: 1 }] })
    expect(receipt.cost).toBeGreaterThan(0)
    expect(communityEvent(roundTrip(judged), days)?.status).toBe('results')
    expect(() => enterFlower(judged, 'carrot@2', null, days)).toThrow(/Already entered/)
  })

  it('protects exact stock through other inventory paths, then consumes or returns it once', () => {
    const base = saveAt(18)
    const pinned = setFestivalPlan(base, { id: 'flower-show', day: 19, stock: [{ key: 'carrot@2', count: 1 }] }, days)
    expect(pinned.items.carrot?.[1]).toBe(1)
    expect(() => shipCrate(pinned, [{ id: 'carrot', stars: 2, count: 2 }])).toThrow()
    expect(roundTrip(pinned).eventJournal).toEqual(pinned.eventJournal)
    const tomorrow = runNight(pinned, {})
    expect(tomorrow.today.eventFunding).toEqual({})
    expect(eventPreparation(tomorrow, 'flower-show', 19, days, null).stock).toContainEqual([{ key: 'carrot@2', count: 1 }])
    const result = enterFlower(tomorrow, 'carrot@2', null, days)
    expect(result.items.carrot?.[1]).toBe(1)
    expect(result.eventJournal?.plan).toBeUndefined()
    const skipped = runNight(tomorrow, {})
    expect(skipped.items.carrot?.[1]).toBe(2)
    expect(skipped.eventJournal?.plan).toBeUndefined()
    expect(skipped.eventJournal?.results).toBeUndefined()
  })

  it('carries a legacy pooled day and awards the birthday bonus only once across gift and scene', () => {
    const base = saveAt(19)
    const legacy = { ...base, today: { ...base.today, actions: 10, eventActions: 3 } }
    expect(canSpendForEvent(legacy, 1, days)).toBe(true)
    const funded = { ...base, today: { ...base.today, eventFunding: {} } }
    const given = giftV4(funded, story, owner, 'carrot', 2, days.birthdays).save
    expect(given.today.eventFunding?.birthdays).toEqual([owner])
    const played = playOccasion(given, story, owner, days, 'birthday')
    expect(played.love[owner]?.points).toBe(given.love[owner]?.points)
    expect(played.today.actions).toBe(1)
    expect(eventActionsLeft(played, days, 'contest')).toBe(3)
  })
})
