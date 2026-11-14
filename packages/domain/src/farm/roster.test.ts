// The roster: the Dorm for 20's levels and beds, the off-season and swaps, joining home or away, and the morning's
// Dorm news. Invented ids; the night runs with no story pack.
import { describe, expect, it } from 'vitest'
import { buildSummary, emptyNotes, endDay, runNight, type Night, type NightContext } from '../night/end-day'
import { meet } from '../romance/meeting'
import { parseSaveV5 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { newLove, newRosterUma, newSave, onFarm, type SaveV4 } from '../save/v4'
import { buyDorm, cancelSwap, DORM_LEVELS, freeBeds, joinRoster, nextDorm, swapBlock, swapDorm } from './dorm'
import { bedsAt } from './farm'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const CONTEXT: NightContext = {}
const fail = (fn: () => unknown, message: string) => expect(fn).toThrow(new SaveRuleError('bad-job', message).message)

/** `ids` on the roster with their routes begun, the first `home` of them home, on `day`. */
function farm(ids: readonly string[], day = 1, home = ids.length): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, calendar: { day }, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])), love: Object.fromEntries(ids.map((id) => [id, newLove()])),
    dorm: { level: 1, home: ids.slice(0, home), swaps: [] },
  }
}
const night = (save: SaveV4) => endDay(save, CONTEXT, LATER)
const withGold = (save: SaveV4, gold: number): SaveV4 => ({ ...save, gold })

describe('the Dorm: levels and beds', () => {
  it('has the eight levels of the Dorm for 20', () => {
    expect(DORM_LEVELS.map((l) => [l.level, l.beds, l.cost, l.farmRank])).toEqual([
      [1, 3, 0, 0], [2, 5, 1000, 1], [3, 7, 3000, 2], [4, 9, 8000, 3], [5, 11, 15000, 4], [6, 14, 28000, 5], [7, 17, 50000, 6], [8, 20, 85000, 7],
    ])
  })

  it('refuses level 2 without 1,000g, buys it at once, and gives its beds the next morning', () => {
    const save = farm(['1001', '1002', '1003'])
    expect(() => buyDorm(withGold(save, 999))).toThrow('Not enough gold')
    const bought = buyDorm(withGold(save, 1200))
    expect(bought.gold).toBe(200)
    expect(bought.buildings.dorm).toBe(2)
    expect(bought.dorm.level).toBe(1)
    expect(freeBeds(bought)).toBe(0)
    expect(bought.account).toEqual(save.account)
    const morning = night(bought)
    expect(morning.dorm.level).toBe(2)
    expect(freeBeds(morning)).toBe(2)
    expect(morning.summary!.news).toContainEqual({ kind: 'dorm', level: 2 })
    expect(night(morning).summary!.news.some((n) => n.kind === 'dorm')).toBe(false)
  })

  it('opens each level at its Farm Rank, buys two levels in a day, and stops at 8', () => {
    const two = buyDorm(withGold(farm(['1001']), 10_000))
    expect(nextDorm(two)).toMatchObject({ level: 3, cost: 3000, farmRank: 2, open: false })
    expect(() => buyDorm(two)).toThrow('Opens at Farm Rank 2.')
    const three = buyDorm({ ...two, farm: { ...two.farm, points: 150 } })
    expect(three.buildings.dorm).toBe(3)
    expect(night(three).dorm.level).toBe(3)
    const top = { ...three, buildings: { ...three.buildings, dorm: 8 } }
    expect(nextDorm(top)).toBeNull()
    fail(() => buyDorm(top), 'The Dorm is at its top level.')
  })
})

describe('the off-season and swaps', () => {
  /** Three home, two away. */
  const full = () => farm(['1001', '1002', '1003', '1004', '1005'], 2, 3)

  it('brings one away home for one at home, the next morning, free', () => {
    const save = swapDorm(full(), '1002', '1004')
    expect(save.dorm.swaps).toEqual([{ out: '1002', in: '1004' }])
    expect(save.dorm.home).toEqual(['1001', '1002', '1003'])
    expect(save.gold).toBe(full().gold)
    expect(onFarm(save, '1002')).toBe(false)
    expect(parseSaveV5(json(save))).toEqual(save)
    const morning = night(save)
    expect(morning.dorm).toEqual({ level: 1, home: ['1001', '1004', '1003'], swaps: [] })
    expect(morning.summary!.news).toContainEqual({ kind: 'home', umas: ['1004'] })
    expect(morning.roster['1002']).toEqual(save.roster['1002'])
  })

  it('refuses one leaving, and anyone not on the right side', () => {
    expect(swapBlock(full(), '1001')).toBeNull()
    const once = swapDorm(full(), '1003', '1004')
    expect(swapBlock(once, '1003')).toBe('Leaves tomorrow')
    expect(() => swapDorm(once, '1003', '1005')).toThrow('She leaves tomorrow.')
    expect(() => swapDorm(once, '1001', '1004')).toThrow('She arrives tomorrow.')
    expect(() => swapDorm(full(), '1004', '1005')).toThrow('She isn’t on the farm.')
    expect(() => swapDorm(full(), '1001', '1002')).toThrow('She’s on the farm already.')
    expect(() => swapDorm(full(), '1001', '9999')).toThrow('She isn’t on the roster.')
    // Leaving tomorrow, she isn't on the farm.
    expect(onFarm(once, '1003')).toBe(false)
    // Called off, she stays.
    const off = cancelSwap(once, '1003')
    expect(off.dorm.swaps).toEqual([])
    expect(onFarm(off, '1003')).toBe(true)
    expect(night(off).dorm.home).toEqual(['1001', '1002', '1003'])
  })
})

describe('joining the roster', () => {
  it('joins home while a bed is free, else away, and refuses someone already on it', () => {
    const save = farm(['1001', '1002'], 2)
    const one = joinRoster(save, '1030')
    expect(one.home).toBe(true)
    expect(one.save.dorm.home).toEqual(['1001', '1002', '1030'])
    expect(one.save.roster['1030']).toEqual(newRosterUma(2))
    const two = joinRoster(one.save, '1031')
    expect(two.home).toBe(false)
    expect(two.save.dorm.home).toHaveLength(bedsAt(1))
    expect(() => joinRoster(two.save, '1030')).toThrow('She’s on the roster already.')
  })

  it('names anyone who joined in the night in the morning\'s Hearts (the night meets nobody now); met, she lives in town', () => {
    const save = farm(['1001', '1002'], 2)
    // A stand-in for a night's arrivals: two join, each living in town.
    const arrivals = { run: (n: Night) => ({ ...n, save: meet(meet(n.save, '1030').save, '1031').save }) }
    const morning = runNight(save, CONTEXT, [arrivals, { run: buildSummary }])
    expect(morning.summary!.hearts).toEqual([{ kind: 'arrived', id: '1030', home: false }, { kind: 'arrived', id: '1031', home: false }])
    expect(morning.dorm.home).toHaveLength(2)
    expect(bedsAt(1)).toBe(3)
    expect(parseSaveV5(json(morning))).toEqual(morning)
    expect(emptyNotes()).toMatchObject({ dorm: null, home: [] })
  })
})

describe('the morning\'s Dorm news parses strictly', () => {
  it('refuses a Dorm level below 2, Umas home off the roster, a line twice and the old roster kinds', () => {
    const morning = night(buyDorm(withGold(farm(['1001']), 1000)))
    const news = (...lines: unknown[]) => () => parseSaveV5(json({ ...morning, summary: { ...morning.summary!, news: lines } }))
    expect(news({ kind: 'dorm', level: 1 })).toThrow('save.summary.news.0.level')
    expect(news({ kind: 'dorm', level: 9 })).toThrow('save.summary.news.0.level')
    expect(news({ kind: 'home', umas: ['1002'] })).toThrow('save.summary.news.0.umas.0')
    expect(news({ kind: 'dorm', level: 2 }, { kind: 'dorm', level: 3 })).toThrow('repeated')
    for (const kind of ['joined', 'gate', 'left']) expect(news({ kind, outfitId: '1001' }), kind).toThrow('save.summary.news.0.kind')
    expect(news({ kind: 'dorm', level: 8 }, { kind: 'home', umas: ['1001'] })()).toBeTruthy()
  })
})
