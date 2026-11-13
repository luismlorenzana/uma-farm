// The year's dates: four 12-day seasons, a festival on each season's 10th day and the Harvest
// Cup on Winter 12, and the next festival from any day.
import { describe, expect, it } from 'vitest'
import { dateOf, farmDay, FESTIVALS, festivalOn, isSeasonEnd, isSeasonStart, nextFestival } from './calendar'

describe('the festivals (CS4)', () => {
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
    expect([1, 12, 13, 24, 48, 49].map(isSeasonStart)).toEqual([true, false, true, false, false, true])
    expect([1, 12, 13, 24, 48, 49].map(isSeasonEnd)).toEqual([false, true, false, true, true, false])
    for (let d = 1; d <= 100; d++) expect(farmDay(dateOf(d))).toBe(d)
  })
})
