// The market feels a flood: past a crate of one good in a night, each crate more sells a step lower, down to half, and
// the good stays eased the days after, recovering a step a night. Invented ids only.
import { describe, expect, it } from 'vitest'
import { farmDay } from '../farm/calendar'
import { endDay } from '../night/end-day'
import { binSales, crateWorth } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type SaveV4 } from '../save/v4'
import { CRATE, cratesPast, EASE_FLOOR, EASE_STEP, easedPrice, easeFactor, marketNight } from './market'

const AT = '2026-11-09T10:00:00.000Z'
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Pine Logs (25g ★1, never in demand) in the bin, and the market as given. */
function logs(count: number, market: Record<string, number> = {}, row?: [number, number, number, number, number]): SaveV4 {
  const save = newSave('u1', AT)
  return { ...save, calendar: { day: SUMMER_3 }, bin: { 'pine-log': row ?? [count, 0, 0, 0, 0] }, farm: { ...save.farm, market } }
}

describe('the market feels a flood', () => {
  it('sells a crate of 50 at its price; past it, each crate more a step lower, to half', () => {
    expect([CRATE, EASE_STEP, EASE_FLOOR]).toEqual([50, 0.1, 5])
    expect(binSales(logs(50).bin, SUMMER_3)).toEqual([{ kind: 'sold', id: 'pine-log', stars: 1, count: 50, gold: 1_250, demand: false }])
    // 120: 50 at 25g, 50 at 22.5 → 25g (rounded to 5g), 20 at 20g.
    expect(binSales(logs(120).bin, SUMMER_3)).toEqual([{ kind: 'sold', id: 'pine-log', stars: 1, count: 120, gold: 50 * 25 + 50 * 25 + 20 * 20, demand: false, eased: 20 }])
    // 400: the floor holds from the sixth crate: half price, 12.5 → 15g.
    const flood = binSales(logs(400).bin, SUMMER_3)[0]!
    expect(flood.eased).toBe(50)
    expect(flood.gold).toBe(50 * (25 + 25 + 20 + 20 + 15 + 15 + 15 + 15))
    expect([easeFactor(0), easeFactor(2), easeFactor(9)]).toEqual([1, 0.8, 0.5])
    expect(easedPrice('salmon', 2, SUMMER_3, 1)).toBe(150) // 110 × 1.25 × 1.2 × 0.9 = 148.5
  })

  it('sells the best stars first, at the best step', () => {
    const [one, three] = binSales(logs(0, {}, [40, 0, 20, 0, 0]).bin, SUMMER_3)
    expect(three).toEqual({ kind: 'sold', id: 'pine-log', stars: 3, count: 20, gold: 20 * 40, demand: false }) // 37.5 → 40g
    expect(one).toEqual({ kind: 'sold', id: 'pine-log', stars: 1, count: 40, gold: 30 * 25 + 10 * 25, demand: false, eased: 10 })
  })

  it('keeps a good eased the days after, its first crate at the ease, and recovers a step a night', () => {
    expect(marketNight({}, logs(120).bin)).toEqual({ 'pine-log': 2 })
    expect(marketNight({}, logs(50).bin)).toEqual({})
    expect(marketNight({ 'pine-log': 2 }, logs(51).bin)).toEqual({ 'pine-log': 3 })
    expect(marketNight({ 'pine-log': 4 }, logs(400).bin)).toEqual({ 'pine-log': 5 })
    expect(marketNight({ 'pine-log': 2, carrot: 1 }, logs(10).bin)).toEqual({ 'pine-log': 1 })
    const calm = {}
    expect(marketNight(calm, {})).toBe(calm)
    expect([cratesPast(0), cratesPast(50), cratesPast(51), cratesPast(100), cratesPast(101)]).toEqual([0, 0, 1, 1, 2])
    // Eased two steps, ten logs sell at 20g each.
    expect(binSales(logs(10).bin, SUMMER_3 + 1, { 'pine-log': 2 })).toEqual([{ kind: 'sold', id: 'pine-log', stars: 1, count: 10, gold: 200, demand: false, eased: 20 }])
  })

  it('pays the night at the ease, moves the market after, and keeps a save the parse takes', () => {
    const before = logs(120)
    const morning = endDay(before, {}, '2026-11-09T21:00:00.000Z')
    expect(morning.gold).toBe(before.gold + 2_900 - 30) // less the farmer's takeout
    expect(morning.farm.market).toEqual({ 'pine-log': 2 })
    expect(morning.summary!.bin).toEqual([{ kind: 'sold', id: 'pine-log', stars: 1, count: 120, gold: 2_900, demand: false, eased: 20 }])
    expect(parseSaveV5(json(morning))).toEqual(morning)
    // A crate's worth at the market as it stands: ten logs at two steps.
    expect(crateWorth(morning, [{ id: 'pine-log', stars: 1, count: 10 }])).toBe(200)
    const next = endDay(morning, {}, '2026-11-10T21:00:00.000Z')
    expect(next.farm.market).toEqual({ 'pine-log': 1 })
  })

  it('reads a save from before the market as nothing eased, and refuses a step past the floor', () => {
    const save = newSave('u1', AT)
    const older = json(save) as unknown as Record<string, Record<string, unknown>>
    delete older.farm!.market
    expect(parseSaveV5(older).farm.market).toEqual({})
    expect(parseSaveV5(older).account).toEqual(save.account)
    const past = json(save)
    past.farm.market = { 'pine-log': 6 }
    expect(() => parseSaveV5(past)).toThrow('save.farm.market.pine-log: expected 1–5')
  })
})
