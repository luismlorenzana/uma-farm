// The year's dates: four 12-day seasons, a festival on each season's 10th day and the Harvest
// Cup on Winter 12, and the next festival from any day.
import { describe, expect, it } from 'vitest'
import { dateOf, farmDay, FESTIVALS, festivalOn, isSeasonEnd, isSeasonStart, nextFestival, workNow } from './calendar'
import { eventGrants, GAME_DAYS } from './actions'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, newRosterUma, newLove } from '../save/v4'

describe('the festivals', () => {
  it('falls on each season\'s 10th day, and the Harvest Cup on Winter 12', () => {
    expect(FESTIVALS.map((f) => [f.name, farmDay({ year: 1, season: f.season, day: f.day })])).toEqual([
      ['Flower Show', 10], ['Fishing Derby', 22], ['Cooking Contest', 34], ['Animal Show', 46], ['Harvest Cup', 48],
    ])
    expect([10, 22, 34, 46, 48, 58].map((d) => festivalOn(d)?.id)).toEqual(['flower-show', 'fishing-derby', 'cooking-contest', 'animal-show', 'harvest-cup', 'flower-show'])
    expect(festivalOn(11)).toBeNull()
  })

  it('finds the next festival on or after a day, into the next year', () => {
    expect(nextFestival(3)).toMatchObject({ festival: { id: 'flower-show' }, day: 10, inDays: 7 })
    expect(nextFestival(10)).toMatchObject({ festival: { id: 'flower-show' }, day: 10, inDays: 0 })
    expect(nextFestival(11)).toMatchObject({ festival: { id: 'fishing-derby' }, day: 22, inDays: 11 })
    expect(dateOf(nextFestival(11).day)).toEqual({ year: 1, season: 'summer', day: 10 })
    expect(nextFestival(47)).toMatchObject({ festival: { id: 'harvest-cup' }, day: 48, inDays: 1 })
    expect(nextFestival(49)).toMatchObject({ festival: { id: 'flower-show' }, day: 58, inDays: 9 })
  })

  it('knows a season\'s first and last days', () => {
    expect([1, 12, 13, 24, 48, 49].map(day => isSeasonStart(day))).toEqual([true, false, true, false, false, true])
    expect([1, 12, 13, 24, 48, 49].map(day => isSeasonEnd(day))).toEqual([false, true, false, true, true, false])
    for (let d = 1; d <= 100; d++) expect(farmDay(dateOf(d))).toBe(d)
  })

  it('begins the calendar again while the farm retains past meetings and advances its work clock', () => {
    const onTen = newSave('calendar-test', '2026-11-20T16:00:00.000Z')
    const id = '9000001'
    const prior = { ...onTen, calendar: { day: 10 }, gold: 640,
      roster: { [id]: newRosterUma(4) }, love: { [id]: newLove() },
      town: { [id]: { talks: 4, last: 10, gift: 7 } },
      today: { ...onTen.today, actions: 6, eventActions: 3, town: true } }
    const reset = { ...prior, calendar: { day: 10, start: 10 } }
    expect(parseSaveV5(reset)).toEqual(reset)
    expect(dateOf(4, reset.calendar)).toEqual({ year: 1, season: 'spring', day: 4 })
    expect(dateOf(10, reset.calendar)).toEqual({ year: 1, season: 'spring', day: 1 })
    expect(workNow(reset)).toBe(workNow(prior))
    expect(eventGrants(reset, GAME_DAYS)).toEqual([])
    expect(nextFestival(10, FESTIVALS, reset.calendar)).toMatchObject({ day: 19, inDays: 9 })
    expect(eventGrants(reset, GAME_DAYS, 19)).toMatchObject([{ id: 'flower-show' }])
    expect(farmDay({ year: 1, season: 'summer', day: 1 }, reset.calendar)).toBe(22)
    const next = runNight(reset, {})
    expect(next.calendar).toEqual({ day: 11, start: 10 })
    expect(next.town[id]).toEqual(prior.town[id])
    expect(dateOf(next.calendar.day, next.calendar).day).toBe(2)
  })
})
