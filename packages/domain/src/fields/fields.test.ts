// The Fields: blocks, planting and harvesting, tending and growth,
// regrowing and withering at night, seeds back, crop levels, stars, challenges, the counters and the shop's seeds.
// Invented ids and test kinds (`kinds.fixture.ts`).
import { describe, expect, it } from 'vitest'
import { farmDay } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { CHALLENGES } from '../farm/rank-rules'
import { TALENT_D, talentGrowth, talentQuality, type TalentStep } from '../farm/talents'
import { starShares } from '../goods/stars'
import { emptyNotes, endDay, growCrops, type NightContext } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { startLoopJob } from '../save/loop-work'
import { parseSaveV4 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { buy, lineOpen, shopLines } from '../save/shop'
import { newLove, newRosterUma, newSave, readyPlots, type BlockId, type Plot, type SaveV4 } from '../save/v4'
import {
  blockGrowth, buyBlock, cropLevelOf, cropLevelStart, harvest, harvestAll, harvestQuality, isBusy, nightsLeft, plant, plantAll,
  PLOTS_HARVESTED, PLOTS_PLANTED, plotsToPlant, receiptItems, seedsBackChance, seedsInSeason, setTender, tendedGrowth,
} from './fields'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const CONTEXT: NightContext = { kinds: TEST_KINDS }
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const SUMMER = (d: number) => farmDay({ year: 1, season: 'summer', day: d })

/** Two Umas home on `day`, with seeds. */
function farm(day = 1, seeds: Record<string, number> = { 'seed-carrot': 9 }, uid = 'u1'): SaveV4 {
  const save = newSave(uid, AT)
  return {
    ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1) }, love: { 101: newLove(), 202: newLove() },
    dorm: { level: 1, home: ['101', '202'], swaps: [] }, items: Object.fromEntries(Object.entries(seeds).map(([id, n]) => [id, [n, 0, 0, 0, 0]])),
  }
}
const night = (save: SaveV4, context: NightContext = CONTEXT) => endDay(save, context, LATER)
const nights = (save: SaveV4, n: number) => Array.from({ length: n }).reduce<SaveV4>((s) => night(s), save)
const plots = (save: SaveV4, id: BlockId = 'A'): Plot[] => save.fields.blocks.find((b) => b.id === id)!.plots
const reason = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}
/** Block A with every plot Ready with `crop`. */
function ripe(save: SaveV4, crop: Plot['crop'] = 'carrot', own = false): SaveV4 {
  const plot: Plot = { crop, growth: 3.5, ready: true, regrowing: false, own }
  return { ...save, fields: { blocks: save.fields.blocks.map((b) => (b.id === 'A' ? { ...b, plots: b.plots.map(() => ({ ...plot })) } : b)) } }
}

describe('planting', () => {
  it('plants a seed from the Warehouse in an empty plot, counting the plot and making the crop\'s entry', () => {
    const save = plant(farm(), 'A', 4, 'seed-carrot')
    expect(plots(save)[4]).toEqual({ crop: 'carrot', growth: 0, ready: false, regrowing: false, own: false })
    expect(save.items['seed-carrot']).toEqual([8, 0, 0, 0, 0])
    expect(save.crops).toEqual({ carrot: 0 })
    expect(save.farm.counts[PLOTS_PLANTED]).toBe(1)
    expect(save.account).toEqual(farm().account)
  })

  it('refuses a planted plot, a missing seed, a seed out of season and a block not bought', () => {
    const save = plant(farm(), 'A', 0, 'seed-carrot')
    expect(reason(() => plant(save, 'A', 0, 'seed-carrot'))).toBe('bad-slot')
    expect(reason(() => plant(save, 'A', 1, 'seed-potato'))).toBe('no-items')
    expect(reason(() => plant(save, 'A', 1, 'carrot'))).toBe('no-items')
    expect(reason(() => plant(save, 'A', 9, 'seed-carrot'))).toBe('bad-slot')
    expect(reason(() => plant(save, 'B', 0, 'seed-carrot'))).toBe('bad-slot')
    expect(reason(() => plant(farm(1, { 'seed-tomato': 1 }), 'A', 0, 'seed-tomato'))).toBe('out-of-season')
    expect(() => plant(farm(1, { 'seed-tomato': 1 }), 'A', 0, 'seed-tomato')).toThrow('Tomato grows in Summer.')
    expect(plant(farm(SUMMER(1), { 'seed-tomato': 1 }), 'A', 0, 'seed-tomato').crops).toEqual({ tomato: 0 })
  })

  it('plants all with own seeds first, until the plots or the seeds run out', () => {
    const save = plantAll(farm(1, { 'seed-carrot': 9, 'seed-carrot-own': 3 }), 'A', 'carrot')
    expect(plots(save).map((p) => p.own)).toEqual([true, true, true, false, false, false, false, false, false])
    expect(save.items).toEqual({ 'seed-carrot': [3, 0, 0, 0, 0] })
    expect(save.farm.counts[PLOTS_PLANTED]).toBe(9)
    const few = plantAll(farm(1, { 'seed-carrot': 4 }), 'A', 'carrot')
    expect(plots(few).filter((p) => p.crop !== null)).toHaveLength(4)
    expect(reason(() => plantAll(save, 'A', 'carrot'))).toBe('bad-slot')
    expect(reason(() => plantAll(farm(), 'A', 'potato'))).toBe('no-items')
    expect(reason(() => plantAll(farm(), 'A', 'tomato'))).toBe('out-of-season')
  })

  it('reads the seeds that plant today and the plots they could fill', () => {
    const save = farm(1, { 'seed-carrot': 2, 'seed-carrot-own': 1, 'seed-tomato': 5, 'seed-mint': 4 })
    expect(seedsInSeason(save)).toEqual([
      { id: 'seed-carrot-own', crop: 'carrot', own: true, count: 1 }, { id: 'seed-carrot', crop: 'carrot', own: false, count: 2 },
      { id: 'seed-mint', crop: 'mint', own: false, count: 4 },
    ])
    expect(plotsToPlant(save)).toBe(7)
    expect(plotsToPlant(farm(1, { 'seed-carrot': 20 }))).toBe(9)
    expect(plotsToPlant(farm(SUMMER(1)))).toBe(0)
  })
})

describe('growth and Ready', () => {
  it('grows 1.25 a night at Novice, +0.1 a rank, the talent, the Watering Can and well fed; 1 untended', () => {
    expect([0, 1, 2, 3, 4, 5].map((r) => tendedGrowth(r as 0, TALENT_D))).toEqual([1.25, 1.35, 1.45, 1.55, 1.65, 1.75])
    expect(([4, 5, 6, 7] as TalentStep[]).map(talentGrowth)).toEqual([0, 0.05, 0.1, 0.15])
    expect(tendedGrowth(0, 7)).toBe(1.4)
    expect(tendedGrowth(0, TALENT_D, 2)).toBe(1.375)
    expect(tendedGrowth(0, TALENT_D, 1, true)).toBe(1.5625)
    const save = setTender(farm(), 'A', '101')
    expect(blockGrowth(save, 'A')).toBe(1.25)
    expect(blockGrowth(farm(), 'A')).toBe(1)
    expect(blockGrowth(save, 'A', () => 6)).toBe(1.35)
  })

  it('has a Carrot planted on day 1 Ready on day 4\'s morning when a Novice tends it, and on day 5\'s untended', () => {
    const tended = setTender(plantAll(farm(), 'A', 'carrot'), 'A', '101')
    expect(plots(nights(tended, 2)).every((p) => !p.ready)).toBe(true)
    const day4 = nights(tended, 3)
    expect(day4.calendar.day).toBe(4)
    expect(plots(day4).every((p) => p.ready && p.growth === 3.75)).toBe(true)
    expect(day4.summary!.work).toEqual([{ kind: 'crops', block: 'A', plots: 9 }])
    const untended = plantAll(farm(), 'A', 'carrot')
    expect(plots(nights(untended, 3)).every((p) => !p.ready)).toBe(true)
    const day5 = nights(untended, 4)
    expect(day5.calendar.day).toBe(5)
    expect(plots(day5).every((p) => p.ready)).toBe(true)
    expect(nightsLeft(plots(nights(untended, 1))[0]!, 1)).toBe(3)
    expect(nightsLeft(plots(nights(untended, 1))[0]!, 1.25)).toBe(2)
  })

  it('stops growing once Ready, and a tender works only a night her block has a growing plot', () => {
    const save = setTender(plantAll(farm(), 'A', 'carrot'), 'A', '101')
    const run = (s: SaveV4) => growCrops({ before: s, save: s, context: CONTEXT, notes: emptyNotes() }).notes
    expect(run(save).tended).toEqual([{ outfitId: '101', block: 'A' }])
    const ready = nights(save, 3)
    expect(run(ready).tended).toEqual([])
    expect(plots(night(ready))).toEqual(plots(ready))
    expect(run(setTender(farm(), 'A', '101')).tended).toEqual([])
  })

  it('regrows a Tomato every 3 days, and withers it on Summer\'s last night unless it\'s Ready', () => {
    // Plot 0 on Summer 1, plot 1 on Summer 5, both untended (7 days; regrowing every 3).
    const s1 = plant(farm(SUMMER(1), { 'seed-tomato': 2 }), 'A', 0, 'seed-tomato')
    const s5 = plant(nights(s1, 4), 'A', 1, 'seed-tomato')
    const s8 = nights(s5, 3)
    expect(s8.calendar.day).toBe(SUMMER(8))
    expect(plots(s8)[0]!.ready).toBe(true)
    const picked = harvest(s8, 'A', 0).save
    expect(plots(picked)[0]).toEqual({ crop: 'tomato', growth: 0, ready: false, regrowing: true, own: false })
    expect(plots(nights(picked, 2))[0]!.ready).toBe(false)
    const s11 = nights(picked, 3)
    expect(plots(s11)[0]!.ready).toBe(true)
    expect(s11.summary!.work).toEqual([{ kind: 'crops', block: 'A', plots: 1 }])
    // Picked again on Summer 11, plot 0 is still growing on Summer's last night and withers; plot 1 turns Ready on
    // Summer 12 and waits into Autumn.
    const s12 = night(harvest(s11, 'A', 0).save)
    expect(s12.calendar.day).toBe(SUMMER(12))
    expect(plots(s12)[1]!.ready).toBe(true)
    const autumn = night(s12)
    expect(autumn.calendar.day).toBe(farmDay({ year: 1, season: 'autumn', day: 1 }))
    expect(plots(autumn)[0]).toEqual({ crop: null, growth: 0, ready: false, regrowing: false, own: false })
    expect(plots(autumn)[1]).toMatchObject({ crop: 'tomato', ready: true })
    expect(autumn.summary!.work).toEqual([{ kind: 'withered', block: 'A', crop: 'tomato', plots: 1 }])
    // Out of its season a regrowing crop doesn't start again: the plot empties.
    expect(plots(harvest(autumn, 'A', 1).save)[1]!.crop).toBeNull()
  })

  it('carries a growing Corn into Autumn and a Cabbage into Spring; a growing Onion withers at Spring\'s end', () => {
    const corn = night(plant(farm(SUMMER(12), { 'seed-corn': 1 }), 'A', 0, 'seed-corn'))
    expect(plots(corn)[0]).toMatchObject({ crop: 'corn', growth: 1, ready: false })
    expect(corn.summary!.work).toEqual([])
    const cabbage = night(plant(farm(48, { 'seed-cabbage': 1 }), 'A', 0, 'seed-cabbage'))
    expect(cabbage.calendar.day).toBe(49)
    expect(plots(cabbage)[0]).toMatchObject({ crop: 'cabbage', growth: 1 })
    const onion = plantAll(farm(12, { 'seed-onion': 3, 'seed-carrot': 1 }), 'A', 'onion')
    const summer = night(plant(onion, 'A', 3, 'seed-carrot'))
    expect(plots(summer).every((p) => p.crop === null)).toBe(true)
    expect(summer.summary!.work).toEqual([{ kind: 'withered', block: 'A', crop: 'onion', plots: 3 }, { kind: 'withered', block: 'A', crop: 'carrot', plots: 1 }])
  })
})

describe('harvesting', () => {
  it('draws each crop\'s stars into the Warehouse, counts the plot, adds the crop\'s points and empties the plot', () => {
    const { save, receipt } = harvestAll(ripe(farm(1, { 'seed-carrot': 1 })))
    expect(receipt).toMatchObject({ stars: [9, 0, 0, 0, 0], plots: 9 })
    expect(receiptItems(receipt)).toBe(9)
    expect(save.items.carrot).toEqual([9, 0, 0, 0, 0])
    expect(save.items['seed-carrot-own']?.[0] ?? 0).toBe(receipt.seeds)
    expect(save.crops.carrot).toBe(9)
    expect(save.farm.counts[PLOTS_HARVESTED]).toBe(9)
    expect(plots(save).every((p) => p.crop === null)).toBe(true)
    expect(readyPlots(save)).toBe(0)
    expect(harvestAll(save).save).toBe(save)
    expect(reason(() => harvest(save, 'A', 0))).toBe('not-ready')
    expect(reason(() => harvest(plant(save, 'A', 0, 'seed-carrot'), 'A', 0))).toBe('not-ready')
  })

  it('gives each plot its crop\'s yield: two Potatoes, three Sunflower Seeds', () => {
    expect(harvestAll(ripe(farm(1, {}), 'potato')).save.items.potato!.reduce((a, b) => a + b, 0)).toBe(18)
    expect(harvestAll(ripe(farm(SUMMER(1), {}), 'sunflower-seed')).save.items['sunflower-seed']!.reduce((a, b) => a + b, 0)).toBe(27)
  })

  it('draws the same stars from the same save, whoever replays it', () => {
    const save = setTender(ripe(farm(1, {})), 'A', '101')
    expect(harvestAll(json(save)).save).toEqual(harvestAll(save).save)
  })

  it('matches the star shares: untended at level 1 always ★1, a Novice D tender ★1 75% and ★2 25%', () => {
    expect(harvestQuality(null, 1)).toBe(0)
    expect(starShares(harvestQuality(null, 1))).toEqual([1, 0, 0, 0, 0])
    const novice = harvestQuality({ rank: 0, talent: TALENT_D, wellFed: false }, 1)
    expect(novice).toBe(0.25)
    expect(starShares(novice)).toEqual([0.75, 0.25, 0, 0, 0])
    expect(harvestQuality({ rank: 3, talent: 6, wellFed: true }, 4, 3)).toBe(3.55)
    expect(([0, 7] as TalentStep[]).map(talentQuality)).toEqual([-0.75, 1])
    // Over a seeded sample: 200 farms of nine tended Carrots.
    const counts = [0, 0, 0, 0, 0]
    const untended = [0, 0, 0, 0, 0]
    for (let n = 0; n < 200; n++) {
      const save = ripe(farm(1, {}, `u${n}`))
      harvestAll(setTender(save, 'A', '101')).receipt.stars.forEach((c, i) => (counts[i]! += c))
      harvestAll(save).receipt.stars.forEach((c, i) => (untended[i]! += c))
    }
    expect(untended).toEqual([1800, 0, 0, 0, 0])
    expect(counts[0]! / 1800).toBeCloseTo(0.75, 1)
    expect(counts[1]! / 1800).toBeCloseTo(0.25, 1)
    expect(counts[2]).toBe(0)
  })

  it('brings seeds back at 5% untended and 10% for a Novice tender, over a seeded sample, as own seeds', () => {
    expect(seedsBackChance(null)).toBe(0.05)
    expect([0, 1, 2, 3, 4, 5].map((r) => seedsBackChance(r as 0))).toEqual([0.1, 0.15, 0.2, 0.25, 0.3, 0.35])
    expect(seedsBackChance(0, 2)).toBe(0.15)
    expect(seedsBackChance(null, 2)).toBe(0.1)
    let tended = 0
    let untended = 0
    for (let n = 0; n < 400; n++) {
      const save = ripe(farm(1, {}, `seeds-${n}`))
      const t = harvestAll(setTender(save, 'A', '101'))
      tended += t.receipt.seeds
      untended += harvestAll(save).receipt.seeds
      expect(t.save.items['seed-carrot-own']?.[0] ?? 0).toBe(t.receipt.seeds)
    }
    expect(untended / 3600).toBeGreaterThan(0.04)
    expect(untended / 3600).toBeLessThan(0.06)
    expect(tended / 3600).toBeGreaterThan(0.085)
    expect(tended / 3600).toBeLessThan(0.115)
  })

  it('gives 2 crop points for a plot from own seeds; level 2 comes at 20 points and level 5 at 200', () => {
    expect(harvestAll(ripe(farm(1, {}), 'carrot', true)).save.crops.carrot).toBe(18)
    expect([1, 2, 3, 4, 5, 10].map(cropLevelStart)).toEqual([0, 20, 60, 120, 200, 900])
    expect([0, 19, 20, 59, 60, 119, 120, 199, 200, 899, 900, 5000].map(cropLevelOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 9, 10, 10])
    // A level-5 crop lifts an untended harvest by 0.4: ★1 60%, ★2 40%.
    expect(starShares(harvestQuality(null, 5))).toEqual([0.6, 0.4, 0, 0, 0])
  })

  it('counts farming\'s challenges for the tender at harvest, by her rank now', () => {
    const save = setTender(ripe(farm(1, {})), 'A', '101')
    const after = harvestAll(save).save
    expect(after.roster['101']!.ranks.farming.challenge).toBe(9)
    expect(harvestAll(ripe(farm(1, {}))).save.roster['101']!.ranks.farming.challenge).toBe(0)
    // The challenge rows read the harvest by her rank now.
    const count = (rank: 0 | 1 | 2 | 3 | 4, stars: number[], level: number) => CHALLENGES.farming[rank]!.count({ kind: 'harvest', stars, level })
    expect(count(0, [1, 2], 1)).toBe(2)
    expect(count(1, [1, 3, 4, 2], 1)).toBe(2)
    expect(count(2, [1], 3)).toBe(0)
    expect(count(2, [1], 4)).toBe(1)
    expect(count(3, [5, 4, 5], 1)).toBe(2)
    expect(count(4, [5], 10)).toBe(0)
  })
})

describe('blocks', () => {
  it('refuses Block B before Farm Rank 2 and without 800g, then adds it in order', () => {
    const save = farm()
    expect(reason(() => buyBlock(save, 'B'))).toBe('locked')
    const rank2 = { ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[1]! } }
    expect(reason(() => buyBlock(rank2, 'B'))).toBe('no-gold')
    const bought = buyBlock({ ...rank2, gold: 900 }, 'B')
    expect(bought.gold).toBe(100)
    expect(bought.fields.blocks.map((b) => b.id)).toEqual(['A', 'B'])
    expect(plots(bought, 'B').every((p) => p.crop === null)).toBe(true)
    expect(reason(() => buyBlock({ ...bought, gold: 900 }, 'B'))).toBe('bad-slot')
    expect(reason(() => buyBlock({ ...bought, gold: 5000 }, 'C'))).toBe('locked')
    const rank6 = { ...bought, gold: 20000, farm: { ...bought.farm, points: FARM_RANK_POINTS[5]! } }
    expect(buyBlock(buyBlock(rank6, 'D'), 'C').fields.blocks.map((b) => b.id)).toEqual(['A', 'B', 'C', 'D'])
    expect(parseSaveV4(json(buyBlock(rank6, 'D'))).fields.blocks.map((b) => b.id)).toEqual(['A', 'B', 'D'])
  })
})

describe('tenders', () => {
  const gather = { kind: 'gather', item: 'pine-log', count: 1 }
  const job = (save: SaveV4, outfitId: string) => startLoopJob(save, { outfitId, place: 'forest', slot: 0, request: gather }, AT, TEST_KINDS)

  it('keeps a tender until she\'s moved, and moves one from another block', () => {
    const rank2 = { ...farm(), gold: 900, farm: { ...farm().farm, points: FARM_RANK_POINTS[1]! } }
    const save = setTender(buyBlock(rank2, 'B'), 'A', '101')
    expect(nights(save, 2).fields.blocks[0]!.tender).toBe('101')
    const moved = setTender(save, 'B', '101')
    expect(moved.fields.blocks.map((b) => b.tender)).toEqual([null, '101'])
    expect(setTender(moved, 'B', null).fields.blocks.map((b) => b.tender)).toEqual([null, null])
    expect(reason(() => setTender(save, 'A', '999'))).toBe('not-owned')
    expect(reason(() => setTender(farm(), 'B', '101'))).toBe('bad-slot')
  })

  it('stops a tender taking a job, and a working Uma tending', () => {
    const tending = setTender(farm(), 'A', '101')
    expect(isBusy(tending, '101', TEST_KINDS)).toBe(true)
    expect(isBusy(tending, '202', TEST_KINDS)).toBe(false)
    expect(reason(() => job(tending, '101'))).toBe('busy')
    expect(() => job(tending, '101')).toThrow('She tends Block A.')
    const working = job(farm(), '202')
    expect(isBusy(working, '202', TEST_KINDS)).toBe(true)
    expect(reason(() => setTender(working, 'A', '202', TEST_KINDS))).toBe('busy')
  })
})

describe('the shop\'s seeds', () => {
  it('sells Spring\'s tier-1 seeds at Farm Rank 1 and refuses Asparagus before Farm Rank 4', () => {
    const save = farm()
    const lines = shopLines(save)
    expect(lines.map((l) => [l.id, l.price])).toEqual([
      ['seed-carrot', 20], ['seed-potato', 35], ['seed-mint', 40], ['seed-onion', 30], ['seed-cabbage', 90], ['seed-asparagus', 150],
    ])
    expect(lines.map((l) => lineOpen(save, l))).toEqual([true, true, true, false, false, false])
    expect(buy(save, lines[1]!, 2).items['seed-potato']).toEqual([2, 0, 0, 0, 0])
    const asparagus = lines[5]!
    expect(reason(() => buy(save, asparagus, 1))).toBe('locked')
    const rank3 = { ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[2]! } }
    expect(lines.map((l) => lineOpen(rank3, l))).toEqual([true, true, true, true, true, false])
    expect(reason(() => buy(rank3, asparagus, 1))).toBe('locked')
    const rank4 = { ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[3]! } }
    expect(buy(rank4, asparagus, 1).gold).toBe(350)
  })

  it('changes its list on a season\'s first day', () => {
    expect(shopLines(farm(SUMMER(1))).map((l) => l.id)).toEqual(['seed-tomato', 'seed-basil', 'seed-bell-pepper', 'seed-eggplant', 'seed-sunflower-seed', 'seed-corn'])
    expect(shopLines(farm(SUMMER(12))).map((l) => l.id)[0]).toBe('seed-tomato')
    expect(shopLines(farm(farmDay({ year: 1, season: 'winter', day: 1 }))).map((l) => l.id)[4]).toBe('seed-cabbage')
  })
})

describe('the morning', () => {
  it('lists crops ready by block and nudges toward empty plots with seeds, and parses back', () => {
    const empty = night(farm())
    expect(empty.summary!.nudges).toContainEqual({ kind: 'seeds', plots: 9 })
    const planted = nights(plantAll(farm(1, { 'seed-carrot': 12 }), 'A', 'carrot'), 4)
    expect(planted.summary).toMatchObject({ work: [{ kind: 'crops', block: 'A', plots: 9 }] })
    expect(planted.summary!.nudges.find((n) => n.kind === 'seeds')).toBeUndefined()
    expect(parseSaveV4(json(planted), 'save', TEST_KINDS)).toEqual(planted)
    expect(parseSaveV4(json(empty), 'save', TEST_KINDS)).toEqual(empty)
  })

  it('refuses a bad line: no plots, a crop it doesn\'t know, a block twice', () => {
    const morning = nights(plantAll(farm(), 'A', 'carrot'), 4)
    const withWork = (work: unknown[]) => ({ ...json(morning), summary: { ...json(morning).summary, work } })
    expect(() => parseSaveV4(withWork([{ kind: 'crops', block: 'A', plots: 0 }]))).toThrow(/plots/)
    expect(() => parseSaveV4(withWork([{ kind: 'withered', block: 'A', crop: 'kale', plots: 1 }]))).toThrow(/crop/)
    expect(() => parseSaveV4(withWork([{ kind: 'crops', block: 'A', plots: 1 }, { kind: 'crops', block: 'A', plots: 2 }]))).toThrow(/repeated/)
    expect(() => parseSaveV4(withWork([{ kind: 'crops', block: 'E', plots: 1 }]))).toThrow(/block/)
    const withNudge = { ...json(morning), summary: { ...json(morning).summary, nudges: [{ kind: 'seeds', plots: 0 }] } }
    expect(() => parseSaveV4(withNudge)).toThrow(/plots/)
  })
})
