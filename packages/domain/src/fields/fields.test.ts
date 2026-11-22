// The field: tiles cleared, tilled, planted, watered and harvested by hand, one action each; a watered tile grows a
// stage a night and a dry one doesn't; regrowing and withering at the season's end; seeds back, crop levels, stars, the
// counters and the shop's seeds. Invented ids only.
import { describe, expect, it } from 'vitest'
import { actionsLeft, goToTown } from '../farm/actions'
import { farmDay } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { starShares } from '../goods/stars'
import { endDay, type NightContext } from '../night/end-day'
import { parseSaveV6 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { buy, lineOpen, shopLines } from '../save/shop'
import { bareTile, dryTiles, fieldTiles, newSave, readyTiles, START_CLEAR, type SaveV4, type Tile } from '../save/v4'
import {
  clearTile, cropLevelOf, cropLevelStart, cropLook, harvestQuality, harvestTile, nightsLeft, plantTile, receiptItems, seedsBackChance, seedsInSeason,
  stagesOf, tileAt, TILES_CLEARED, TILES_HARVESTED, TILES_PLANTED, tilesToPlant, tillTile, waterTile,
} from './fields'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const CONTEXT: NightContext = {}
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const SUMMER = (d: number) => farmDay({ year: 1, season: 'summer', day: d })
const SPRING_LAST = farmDay({ year: 1, season: 'spring', day: 30 })

/** Day `day` of a new farm, with seeds. */
function farm(day = 1, seeds: Record<string, number> = { 'seed-carrot': 9 }, uid = 'u1'): SaveV4 {
  const save = newSave(uid, AT)
  return { ...save, calendar: { day }, items: Object.fromEntries(Object.entries(seeds).map(([id, n]) => [id, [n, 0, 0, 0, 0]])) }
}
/** The night, the actions spent cleared with it. */
const night = (save: SaveV4, context: NightContext = CONTEXT) => endDay(save, context, LATER)
const reason = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}
/** The save with its tiles set, the rest of the field as it was. */
function withTiles(save: SaveV4, tiles: Record<number, Tile>): SaveV4 {
  return { ...save, fields: { plots: [{ tiles: fieldTiles(save).map((t, i) => tiles[i] ?? t) }] } }
}
/** A ripe crop on tilled soil. */
const ripe = (crop: Tile['crop'] = 'carrot', own = false): Tile => ({ ...bareTile('tilled'), crop, growth: 4, ready: true, own })
/** A fresh day's actions. */
const rested = (save: SaveV4): SaveV4 => ({ ...save, today: { ...save.today, actions: 0 } })
/** Waters every growing tile, a day's actions reset first. */
function waterAll(save: SaveV4): SaveV4 {
  return fieldTiles(save).reduce((s, t, i) => (t.crop !== null && !t.ready && !t.watered ? waterTile(s, i) : s), rested(save))
}

describe('a tile, by hand', () => {
  it('clears an overgrown tile, tills cleared ground, plants it and waters it, one action each', () => {
    const save = farm()
    const weeds = fieldTiles(save).findIndex((t) => t.ground === 'weeds')
    const cleared = clearTile(save, weeds)
    expect(cleared.found).toBeNull()
    expect(tileAt(cleared.save, weeds).ground).toBe('clear')
    expect(cleared.save.farm.counts[TILES_CLEARED]).toBe(1)
    const tilled = tillTile(cleared.save, weeds)
    expect(tileAt(tilled, weeds)).toEqual(bareTile('tilled'))
    const planted = plantTile(tilled, weeds, 'seed-carrot')
    expect(tileAt(planted, weeds)).toMatchObject({ ground: 'tilled', crop: 'carrot', growth: 0, watered: false, own: false })
    expect(planted.items['seed-carrot']).toEqual([8, 0, 0, 0, 0])
    expect(planted.crops.carrot).toBe(0)
    expect(planted.farm.counts[TILES_PLANTED]).toBe(1)
    const watered = waterTile(planted, weeds)
    expect(tileAt(watered, weeds).watered).toBe(true)
    expect(actionsLeft(watered)).toBe(6)
    expect(watered.account).toEqual(save.account)
  })

  it('leaves a Pine Log from a stump and a Limestone from a stone', () => {
    const save = withTiles(farm(), { 10: bareTile('stump'), 11: bareTile('stone') })
    const stump = clearTile(save, 10)
    expect(stump.found).toBe('pine-log')
    expect(stump.save.items['pine-log']).toEqual([1, 0, 0, 0, 0])
    const stone = clearTile(stump.save, 11)
    expect(stone.found).toBe('limestone')
    expect(stone.save.items.limestone).toEqual([1, 0, 0, 0, 0])
  })

  it('refuses each step out of turn, and a tile that isn\'t there', () => {
    const save = withTiles(farm(), { 10: bareTile('weeds') })
    const clear = START_CLEAR[0]!
    expect(reason(() => clearTile(save, clear))).toBe('bad-slot')
    expect(reason(() => tillTile(save, 10))).toBe('bad-slot')
    expect(reason(() => plantTile(save, clear, 'seed-carrot'))).toBe('bad-slot')
    expect(reason(() => waterTile(save, clear))).toBe('bad-slot')
    expect(reason(() => harvestTile(save, clear))).toBe('not-ready')
    expect(reason(() => clearTile(save, 40))).toBe('bad-slot')
    expect(reason(() => clearTile(save, -1))).toBe('bad-slot')
    const tilled = tillTile(save, clear)
    expect(reason(() => tillTile(tilled, clear))).toBe('bad-slot')
    expect(reason(() => plantTile(tilled, clear, 'seed-potato'))).toBe('no-items')
    expect(reason(() => plantTile(tilled, clear, 'carrot'))).toBe('no-items')
    expect(reason(() => plantTile({ ...tilled, items: { 'seed-tomato': [1, 0, 0, 0, 0] } }, clear, 'seed-tomato'))).toBe('out-of-season')
    const planted = plantTile(tilled, clear, 'seed-carrot')
    expect(reason(() => plantTile(planted, clear, 'seed-carrot'))).toBe('bad-slot')
    expect(reason(() => harvestTile(planted, clear))).toBe('not-ready')
    const watered = waterTile(planted, clear)
    expect(reason(() => waterTile(watered, clear))).toBe('bad-slot')
  })

  it('spends the day\'s actions: the eleventh is refused, and nothing changes', () => {
    let save = farm()
    for (const i of START_CLEAR) save = tillTile(save, i)
    save = clearTile(save, fieldTiles(save).findIndex((t) => t.ground !== 'clear' && t.ground !== 'tilled')).save
    expect(actionsLeft(save)).toBe(0)
    expect(reason(() => plantTile(save, START_CLEAR[0]!, 'seed-carrot'))).toBe('no-actions')
    expect(() => plantTile(save, START_CLEAR[0]!, 'seed-carrot')).toThrow('No actions left today.')
  })
})

describe('growth: a watered tile grows a stage a night', () => {
  it('ripens a Carrot after four watered nights; a dry night doesn\'t count', () => {
    const tile = START_CLEAR[0]!
    let save = waterTile(plantTile(tillTile(farm(), tile), tile, 'seed-carrot'), tile)
    save = night(save)
    expect(tileAt(save, tile)).toMatchObject({ growth: 1, ready: false, watered: false })
    expect(nightsLeft(tileAt(save, tile))).toBe(3)
    // A dry night: it doesn't grow.
    save = night(save)
    expect(tileAt(save, tile).growth).toBe(1)
    expect(dryTiles(save)).toBe(1)
    for (let n = 0; n < 3; n++) save = night(waterAll(save))
    expect(tileAt(save, tile)).toMatchObject({ growth: 4, ready: true })
    expect(readyTiles(save)).toBe(1)
    expect(nightsLeft(tileAt(save, tile))).toBe(0)
    // A ripe crop waits, and can't be watered.
    expect(reason(() => waterTile(save, tile))).toBe('bad-slot')
    expect(tileAt(night(save), tile)).toMatchObject({ growth: 4, ready: true })
  })

  it('reports the night\'s growth in the morning: tiles that grew, and those that turned ripe', () => {
    const [a, b] = START_CLEAR
    let save = farm()
    save = plantTile(tillTile(save, a!), a!, 'seed-carrot')
    save = plantTile(tillTile(save, b!), b!, 'seed-carrot')
    save = withTiles(save, { [a!]: { ...tileAt(save, a!), growth: 3 } })
    save = night(waterAll(save))
    expect(save.summary!.work).toEqual([{ kind: 'grew', tiles: 2, ripe: 1 }])
    expect(save.summary!.nudges).toEqual([{ kind: 'water', tiles: 1 }])
    expect(parseSaveV6(json(save))).toEqual(save)
  })

  it('looks like a seed, a sprout, half grown, nearly ripe and ripe', () => {
    const carrot = (growth: number, ready = false) => ({ ...bareTile('tilled'), crop: 'carrot' as const, growth, ready })
    expect([0, 1, 2, 3].map((g) => cropLook(carrot(g)))).toEqual(['seed', 'sprout', 'growing', 'nearly'])
    expect(cropLook(carrot(4, true))).toBe('ripe')
    expect(cropLook(bareTile('tilled'))).toBeNull()
    expect(stagesOf('asparagus', false)).toBe(10)
  })

  it('regrows a Tomato every 3 watered nights, and withers it on Summer\'s last night unless it\'s ripe', () => {
    const [a, b] = START_CLEAR
    let save = withTiles(farm(SUMMER(1), {}), { [a!]: ripe('tomato'), [b!]: ripe('tomato') })
    save = harvestTile(save, a!).save
    expect(tileAt(save, a!)).toMatchObject({ crop: 'tomato', growth: 0, regrowing: true, ready: false })
    expect(stagesOf('tomato', true)).toBe(3)
    for (let n = 0; n < 3; n++) save = night(waterAll(save))
    expect(tileAt(save, a!)).toMatchObject({ growth: 3, ready: true })
    // On Summer's last night a growing Tomato withers; a ripe one waits.
    let last = withTiles(farm(SUMMER(30), {}), { [a!]: { ...ripe('tomato'), growth: 1, ready: false }, [b!]: ripe('tomato') })
    last = night(last)
    expect(tileAt(last, a!)).toEqual(bareTile('tilled'))
    expect(tileAt(last, b!)).toMatchObject({ crop: 'tomato', ready: true })
    expect(last.summary!.work).toContainEqual({ kind: 'withered', crop: 'tomato', tiles: 1 })
    expect(parseSaveV6(json(last))).toEqual(last)
  })

  it('carries a growing Corn into Autumn and a Cabbage into Spring; a growing Onion withers at Spring\'s end', () => {
    const growing = (crop: Tile['crop']): Tile => ({ ...bareTile('tilled'), crop, growth: 1 })
    const tile = START_CLEAR[0]!
    expect(tileAt(night(withTiles(farm(SUMMER(30), {}), { [tile]: growing('corn') })), tile).crop).toBe('corn')
    expect(tileAt(night(withTiles(farm(farmDay({ year: 1, season: 'winter', day: 30 }), {}), { [tile]: growing('cabbage') })), tile).crop).toBe('cabbage')
    expect(tileAt(night(withTiles(farm(SPRING_LAST, {}), { [tile]: growing('onion') })), tile).crop).toBeNull()
  })
})

describe('harvesting', () => {
  it('draws each crop\'s stars into the Warehouse, counts the tile, adds the crop\'s points and leaves the soil tilled', () => {
    const tile = START_CLEAR[0]!
    const { save, receipt } = harvestTile(withTiles(farm(1, {}), { [tile]: ripe() }), tile)
    expect(receipt).toMatchObject({ crop: 'carrot', stars: [1, 0, 0, 0, 0] })
    expect(receiptItems(receipt)).toBe(1)
    expect(save.items.carrot).toEqual([1, 0, 0, 0, 0])
    expect(save.items['seed-carrot-own']?.[0] ?? 0).toBe(receipt.seeds)
    expect(save.crops.carrot).toBe(1)
    expect(save.farm.counts[TILES_HARVESTED]).toBe(1)
    expect(tileAt(save, tile)).toEqual(bareTile('tilled'))
    expect(actionsLeft(save)).toBe(9)
  })

  it('gives each tile its crop\'s yield: two Potatoes, three Sunflower Seeds', () => {
    const tile = START_CLEAR[0]!
    expect(harvestTile(withTiles(farm(1, {}), { [tile]: ripe('potato') }), tile).save.items.potato!.reduce((a, b) => a + b, 0)).toBe(2)
    expect(harvestTile(withTiles(farm(SUMMER(1), {}), { [tile]: ripe('sunflower-seed') }), tile).save.items['sunflower-seed']!.reduce((a, b) => a + b, 0)).toBe(3)
  })

  it('draws the same stars from the same save, whoever replays it', () => {
    const tile = START_CLEAR[0]!
    const save = withTiles(farm(1, {}), { [tile]: ripe() })
    expect(harvestTile(json(save), tile).save).toEqual(harvestTile(save, tile).save)
  })

  it('is ★1 at crop level 1 with the Basic Hoe, and the crop\'s level lifts it', () => {
    expect(harvestQuality(null, 1)).toBe(0)
    expect(starShares(harvestQuality(null, 1))).toEqual([1, 0, 0, 0, 0])
    // A level-5 crop lifts a harvest by 0.4: ★1 60%, ★2 40%.
    expect(starShares(harvestQuality(null, 5))).toEqual([0.6, 0.4, 0, 0, 0])
    // A worker's terms (a farmhand's, or her line's quality) add hers.
    expect(harvestQuality({ rank: 0, talent: 3, wellFed: false }, 1)).toBe(0.25)
  })

  it('brings an own seed back 5% of the time, over a seeded sample', () => {
    expect(seedsBackChance(null)).toBe(0.05)
    expect(seedsBackChance(null, 2)).toBe(0.07)
    expect([0, 5].map((r) => seedsBackChance(r as 0))).toEqual([0.1, 0.35])
    let seeds = 0
    const tile = START_CLEAR[0]!
    for (let n = 0; n < 2000; n++) seeds += harvestTile(withTiles(farm(1, {}, `seeds-${n}`), { [tile]: ripe() }), tile).receipt.seeds
    expect(seeds / 2000).toBeGreaterThan(0.035)
    expect(seeds / 2000).toBeLessThan(0.065)
  })

  it('gives 2 crop points for a tile from own seeds; level 2 comes at 20 points and level 5 at 200', () => {
    const tile = START_CLEAR[0]!
    expect(harvestTile(withTiles(farm(1, {}), { [tile]: ripe('carrot', true) }), tile).save.crops.carrot).toBe(2)
    expect([1, 2, 3, 4, 5, 10].map(cropLevelStart)).toEqual([0, 20, 60, 120, 200, 900])
    expect([0, 19, 20, 59, 60, 119, 120, 199, 200, 899, 900, 5000].map(cropLevelOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 9, 10, 10])
  })

  it('plants an own seed with its dot, and reads the seeds that plant today and the tiles they could fill', () => {
    const tile = START_CLEAR[0]!
    const save = tillTile({ ...farm(1, { 'seed-carrot': 2 }), items: { 'seed-carrot': [2, 0, 0, 0, 0], 'seed-carrot-own': [1, 0, 0, 0, 0], 'seed-tomato': [3, 0, 0, 0, 0] } }, tile)
    expect(seedsInSeason(save).map((s) => [s.id, s.count])).toEqual([['seed-carrot-own', 1], ['seed-carrot', 2]])
    expect(tilesToPlant(save)).toBe(1)
    expect(tileAt(plantTile(save, tile, 'seed-carrot-own'), tile).own).toBe(true)
  })
})

describe('the shop\'s seeds', () => {
  it('sells Spring\'s tier-1 seeds at Farm Rank 1 and refuses Asparagus before Farm Rank 4', () => {
    const save = goToTown(farm())
    const lines = shopLines(save)
    expect(lines.map((l) => [l.id, l.price])).toEqual([
      ['seed-carrot', 20], ['seed-potato', 35], ['seed-mint', 40], ['seed-onion', 30], ['seed-cabbage', 90], ['seed-asparagus', 150],
      ['seed-radish', 20], ['seed-lettuce', 30], ['seed-green-peas', 50], ['seed-strawberry', 65], ['seed-raspberry', 130], ['seed-plum', 220],
    ])
    expect(lines.map((l) => lineOpen(save, l))).toEqual([true, true, true, false, false, false, true, true, false, false, false, false])
    expect(buy(save, lines[1]!, 2).items['seed-potato']).toEqual([2, 0, 0, 0, 0])
    const asparagus = lines[5]!
    expect(reason(() => buy(save, asparagus, 1))).toBe('locked')
    const rank4 = { ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[3]! } }
    expect(buy(rank4, asparagus, 1).gold).toBe(350)
  })

  it('changes its list on a season\'s first day', () => {
    expect(shopLines(farm(SUMMER(1))).map((l) => l.id)).toEqual([
      'seed-tomato', 'seed-basil', 'seed-bell-pepper', 'seed-eggplant', 'seed-sunflower-seed', 'seed-corn',
      'seed-cucumber', 'seed-okra', 'seed-zucchini', 'seed-peach', 'seed-blueberry', 'seed-mango',
    ])
    expect(shopLines(farm(farmDay({ year: 1, season: 'winter', day: 1 }))).map((l) => l.id)[4]).toBe('seed-cabbage')
  })
})

describe('the morning', () => {
  it('nudges toward tilled tiles that seeds could fill, and parses back', () => {
    let save = farm()
    for (const i of START_CLEAR.slice(0, 3)) save = tillTile(save, i)
    const morning = night(save)
    expect(morning.summary!.nudges).toEqual([{ kind: 'seeds', tiles: 3 }])
    expect(parseSaveV6(json(morning))).toEqual(morning)
  })

  it('refuses a bad line: no tiles, a crop it doesn\'t know, a line twice', () => {
    const morning = night(farm())
    const withWork = (work: unknown[]) => ({ ...json(morning), summary: { ...json(morning).summary, work } })
    expect(() => parseSaveV6(withWork([{ kind: 'grew', tiles: 0, ripe: 0 }]))).toThrow(/tiles/)
    expect(() => parseSaveV6(withWork([{ kind: 'grew', tiles: 1, ripe: 2 }]))).toThrow(/more than grew/)
    expect(() => parseSaveV6(withWork([{ kind: 'withered', crop: 'kale', tiles: 1 }]))).toThrow(/crop/)
    expect(() => parseSaveV6(withWork([{ kind: 'grew', tiles: 1, ripe: 0 }, { kind: 'grew', tiles: 2, ripe: 0 }]))).toThrow(/repeated/)
    const withNudge = { ...json(morning), summary: { ...json(morning).summary, nudges: [{ kind: 'seeds', tiles: 0 }] } }
    expect(() => parseSaveV6(withNudge)).toThrow(/tiles/)
  })
})
