// The loop's units and helpers.
import { describe, expect, it } from 'vitest'
import { dateOf, DAY_MS, workNow } from './calendar'
import { draw, fnv1a, mulberry32 } from './draw'
import { BEDS, bedsAt, dormLevelFor, farmRankOf, FARM_RANK_POINTS } from './farm'
import { ACTIVITIES, craftRank, LINE_ACTIVITY, RANK_POINTS, RANKS } from './ranks'
import { countRound, round10, round5 } from './round'

describe('the calendar (CS1)', () => {
  it('turns a day into its date: 12-day seasons, 48-day years', () => {
    expect(dateOf(1)).toEqual({ year: 1, season: 'spring', day: 1 })
    expect(dateOf(12)).toEqual({ year: 1, season: 'spring', day: 12 })
    expect(dateOf(13)).toEqual({ year: 1, season: 'summer', day: 1 })
    expect(dateOf(25)).toEqual({ year: 1, season: 'autumn', day: 1 })
    expect(dateOf(48)).toEqual({ year: 1, season: 'winter', day: 12 })
    expect(dateOf(49)).toEqual({ year: 2, season: 'spring', day: 1 })
    expect(dateOf(97)).toEqual({ year: 3, season: 'spring', day: 1 })
    expect(() => dateOf(0)).toThrow(RangeError)
    expect(() => dateOf(1.5)).toThrow(RangeError)
  })

  it("puts uma-work's clock at the start of the day", () => {
    expect(DAY_MS).toBe(86_400_000)
    expect(workNow({ calendar: { day: 1 } })).toBe(0)
    expect(workNow({ calendar: { day: 3 } })).toBe(2 * 86_400_000)
  })
})

describe('seeded draws (CS8)', () => {
  it('hashes with FNV-1a and steps mulberry32, both pinned', () => {
    expect([fnv1a(''), fnv1a('a'), fnv1a('foobar')]).toEqual([0x811c9dc5, 0xe40c292c, 0xbf9cf968])
    expect([mulberry32(0), mulberry32(1)]).toEqual([0.26642920868471265, 0.6270739405881613])
  })

  it('never changes: these vectors are every saved night', () => {
    expect(draw('u1', 1, 'harvest:A:0', 0)).toBe(0.7079745305236429)
    expect(draw('u1', 1, 'harvest:A:0', 1)).toBe(0.952711766352877)
    expect(draw('u1', 2, 'harvest:A:0', 0)).toBe(0.20385515689849854)
    expect(draw('u2', 1, 'harvest:A:0', 0)).toBe(0.7960757268592715)
    expect(draw('local-dev', 0, 'start', 0)).toBe(0.604233575053513)
    expect(draw('ü✓', 48, 'fish:pond', 7)).toBe(0.9282569675706327)
  })

  it('stays in [0, 1) and replays the same', () => {
    for (let n = 0; n < 500; n++) {
      const u = draw('u1', 7, 'star', n)
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
      expect(draw('u1', 7, 'star', n)).toBe(u)
    }
  })
})

describe('rounding (CS1)', () => {
  it('rounds prices to 5g and rewards to 10g, half up', () => {
    expect(round5(97.5)).toBe(100)
    expect(round5(110.5)).toBe(110)
    expect(round5(110 * 1.25 * 1.2)).toBe(165)
    expect(round5(162.5)).toBe(165)
    expect(round5(162.4)).toBe(160)
    expect(round10(45)).toBe(50)
    expect(round10(44.9)).toBe(40)
  })

  it('rounds counts half up, never below 1', () => {
    expect(countRound(2.5)).toBe(3)
    expect(countRound(2.49)).toBe(2)
    expect(countRound(8 * 1.15 * 1.05)).toBe(10)
    expect(countRound(0.2)).toBe(1)
    expect(countRound(0)).toBe(1)
  })
})

describe('ranks (CS29, CS32)', () => {
  it('has nine activities and six ranks at 0, 40, 160, 400, 900, 2,000', () => {
    expect(ACTIVITIES).toHaveLength(9)
    expect(RANKS).toEqual(['Novice', 'Hand', 'Skilled', 'Expert', 'Master', 'Legend'])
    expect(RANK_POINTS).toEqual([0, 40, 160, 400, 900, 2000])
  })

  it("maps today's lines to their activity (D24 #9)", () => {
    expect(LINE_ACTIVITY).toEqual({ metal: 'mining', stone: 'mining', wood: 'foraging', fish: 'fishing', vegetables: 'farming' })
  })

  it.each([
    [1, 0, 0], [5, 0, 32], [6, 1, 40], [15, 1, 148], [16, 2, 160], [25, 2, 376],
    [26, 3, 400], [35, 3, 850], [36, 4, 900], [45, 4, 1890], [46, 5, 2000], [50, 5, 2000],
  ])('Craft Lv %i becomes rank %i at %i points', (level, rank, points) => {
    expect(craftRank(level)).toEqual({ rank, points })
  })

  it('keeps every mapped rank inside its own points band', () => {
    for (let level = 1; level <= 50; level++) {
      const { rank, points } = craftRank(level)
      expect(points).toBeGreaterThanOrEqual(RANK_POINTS[rank]!)
      if (rank < 5) expect(points).toBeLessThan(RANK_POINTS[rank + 1]!)
    }
  })
})

describe('the farm (CS34, CS39)', () => {
  it("gives the Dorm's beds by level, and the lowest level with a bed for each", () => {
    expect(BEDS).toEqual([3, 5, 8, 12, 16, 22, 30, 40, 50, 60])
    expect(bedsAt(1)).toBe(3)
    expect(bedsAt(10)).toBe(60)
    expect([0, 3, 4, 8, 9, 10, 12, 60, 61, 272].map(dormLevelFor)).toEqual([1, 1, 2, 3, 4, 4, 4, 10, 10, 10])
  })

  it("reads the Farm Rank from its points", () => {
    expect(FARM_RANK_POINTS).toEqual([0, 150, 500, 1200, 2400, 4000, 6500, 10000, 15000, 22000])
    expect([0, 149, 150, 499, 500, 21999, 22000, 99999].map(farmRankOf)).toEqual([1, 1, 2, 2, 3, 9, 10, 10])
  })
})
