// The forest, the Fishery and the stations: the tables, the farmer's one-action hauls (forage, chop, fish) and his
// reach by the Farm Rank, a catch's size and records, the depth milestones, an Uma's haul rules kept for the farmhands,
// and the stations' loads, done overnight. Invented ids only.
import { describe, expect, it } from 'vitest'
import { actionsLeft } from '../farm/actions'
import { FARM_RANK_POINTS } from '../farm/farm'
import type { Rank } from '../farm/ranks'
import { goodOf, isGoodId } from '../goods/ids'
import { endDay } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { newSave, type SaveV4 } from '../save/v4'
import { parseStockKey } from '../save/warehouse'
import {
  CHOP_LOGS, chop, FARMER_REACH, fish, forage, FORAGE_HAUL, FULL_HAULS, haulAt, haulsToday, LOGS_CHOPPED, reachList, reachLock, THIN_SHARE, thinToday,
} from './hauls'
import { FISHING_SPOTS, FOREST_AREAS, STATION_JOB_IDS, stationJobOf } from './ids'
import { fishSize, haulCount, HOME_COUNT, pickShare, placeLock, sizeRecord, sizeSkill, type WorkTerms } from './kinds'
import {
  finishLoads, levelLock, levelLockWords, LOAD_SIZE, loadsADay, loadsLeft, nextStationLevel, startLoad, STATION_LEVELS, stationLevel, stationOptions, upgradeStation,
} from './stations'
import { FISH_SIZES, FISHERY, FOREST } from './tables'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const farm = (day = 1, uid = 'u1'): SaveV4 => ({ ...newSave(uid, AT), calendar: { day } })
const atRank = (save: SaveV4, rank: number): SaveV4 => ({ ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[rank - 1]! } })
const rested = (save: SaveV4): SaveV4 => ({ ...save, today: { ...save.today, actions: 0 } })
const terms = (t: Partial<WorkTerms> = {}): WorkTerms => ({ rank: 0, talent: 4, tool: 1, wellFed: 0, ...t })
const count = (items: readonly string[]) => items.length
const reason = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}

describe('the tables', () => {
  it('lists every area and spot by season, each season\'s shares adding up to 100, every good in the catalogue', () => {
    expect(Object.keys(FOREST)).toEqual([...FOREST_AREAS])
    expect(Object.keys(FISHERY)).toEqual([...FISHING_SPOTS])
    for (const table of [...Object.values(FOREST), ...Object.values(FISHERY)]) {
      for (const shares of Object.values(table.seasons)) {
        expect(shares.reduce((sum, [, p]) => sum + p, 0)).toBe(100)
        for (const [good] of shares) expect(isGoodId(good), good).toBe(true)
      }
    }
    for (const spot of Object.values(FISHERY)) for (const shares of Object.values(spot.seasons)) for (const [id] of shares) expect(FISH_SIZES[id], id).toBeDefined()
  })

  it('keeps each area at its two grades: woods 40%, mushrooms 30%, herbs 15% and the season\'s family 15%', () => {
    const family = { spring: 'sweets', summer: 'fruits', autumn: 'nuts-seeds', winter: 'mushrooms' } as const
    for (const area of Object.values(FOREST)) {
      for (const [season, shares] of Object.entries(area.seasons)) {
        const by: Record<string, number> = {}
        for (const [id, p] of shares) {
          const good = goodOf(id)!
          expect(area.grades).toContain(good.grade)
          by[good.family] = (by[good.family] ?? 0) + p
        }
        const seasonal = family[season as keyof typeof family]
        expect(by.woods).toBe(40)
        expect(by['herbs-spices']).toBe(15)
        expect(by.mushrooms).toBe(seasonal === 'mushrooms' ? 45 : 30)
        if (seasonal !== 'mushrooms') expect(by[seasonal]).toBe(15)
      }
    }
  })

  it('picks a good by its shares', () => {
    const shares = FOREST.woods.seasons.spring
    expect(pickShare(shares, 0)).toBe('pine-log')
    expect(pickShare(shares, 0.2599)).toBe('pine-log')
    expect(pickShare(shares, 0.26)).toBe('button-mushroom')
    expect(pickShare(shares, 0.9999)).toBe('sugarcane')
  })
})

describe('the farmer\'s hauls', () => {
  it('forages one haul of the area\'s season\'s finds for one action, straight into the Warehouse', () => {
    const { save, haul } = forage(farm(), 'woods')
    expect(count(haul.items)).toBe(FORAGE_HAUL)
    for (const item of haul.items) {
      const at = parseStockKey(item)!
      expect(FOREST.woods.seasons.spring.map(([id]) => id)).toContain(at.id)
      expect(at.stars).toBe(1)
    }
    expect(Object.values(save.items).reduce((n, row) => n + row.reduce((a, b) => a + b, 0), 0)).toBe(9 + FORAGE_HAUL)
    expect(save.farm.counts[HOME_COUNT.forest]).toBe(FORAGE_HAUL)
    expect(save.today.gathered).toEqual(['woods'])
    expect(actionsLeft(save)).toBe(9)
    expect(save.account).toEqual(farm().account)
  })

  it('draws each haul anew, the same from the same save, at the area\'s shares over a sample', () => {
    const one = forage(farm(), 'woods')
    expect(forage(json(farm()), 'woods')).toEqual(one)
    const two = forage(one.save, 'woods')
    expect(two.save.farm.counts[HOME_COUNT.forest]).toBe(2 * FORAGE_HAUL)
    expect(two.save.today.gathered).toEqual(['woods'])
    // Ten hauls a day over 100 farms: woods 40%, mushrooms 30%, herbs 15%, sweets 15%.
    const by: Record<string, number> = {}
    let total = 0
    for (let n = 0; n < 100; n++) {
      let save = farm(1, `u${n}`)
      for (let k = 0; k < 10; k++) {
        const got = forage(save, 'woods')
        save = got.save
        for (const item of got.haul.items) {
          by[goodOf(parseStockKey(item)!.id)!.family] = (by[goodOf(parseStockKey(item)!.id)!.family] ?? 0) + 1
          total++
        }
      }
    }
    expect(by.woods! / total).toBeCloseTo(0.4, 1)
    expect(by.mushrooms! / total).toBeCloseTo(0.3, 1)
  })

  it('chops two logs of the area\'s woods for one action', () => {
    const { save, haul } = chop(farm(), 'woods')
    expect(count(haul.items)).toBe(CHOP_LOGS)
    for (const item of haul.items) expect(['pine-log', 'birch-log']).toContain(parseStockKey(item)!.id)
    expect(save.farm.counts[LOGS_CHOPPED]).toBe(CHOP_LOGS)
    expect(actionsLeft(save)).toBe(9)
  })

  it('fishes one catch for one action, measured as it lands, and keeps the biggest of each kind', () => {
    const { save, haul, caught: landed } = fish(farm(), 'pond')
    const caught = landed!
    expect(count(haul.items)).toBe(1)
    expect(['carp', 'trout']).toContain(caught.fish)
    const [min, max] = FISH_SIZES[caught.fish]!
    expect(caught.cm).toBeGreaterThanOrEqual(min)
    expect(caught.cm).toBeLessThanOrEqual(max)
    expect(caught.record).toBe(true)
    expect(save.diary.records[sizeRecord(caught.fish)]).toBe(caught.cm)
    expect(save.items[caught.fish]).toEqual([1, 0, 0, 0, 0])
    expect(save.farm.counts[HOME_COUNT.fishery]).toBe(1)
    expect(save.today.gathered).toEqual(['pond'])
    expect(fish(json(farm()), 'pond')).toEqual(fish(farm(), 'pond'))
    // A record only rises. The pond thins after four casts: the next land a fish about half the time.
    let next = save
    for (let k = 0; k < 9; k++) next = fish(next, 'pond').save
    for (const [key, cm] of Object.entries(save.diary.records)) expect(next.diary.records[key]).toBeGreaterThanOrEqual(cm)
    expect(next.today.hauls).toEqual({ pond: 10 })
    expect(next.farm.counts[HOME_COUNT.fishery]).toBeGreaterThanOrEqual(5)
    expect(next.farm.counts[HOME_COUNT.fishery]).toBeLessThan(10)
    expect(reason(() => fish(next, 'pond'))).toBe('no-actions')
  })

  it('thins each area and spot after four hauls a day, the farmer\'s and the farmhands\' together: half hauls, the fraction drawn', () => {
    expect([FULL_HAULS, THIN_SHARE]).toEqual([4, 0.5])
    let save = farm()
    const forages: number[] = []
    for (let k = 0; k < 8; k++) {
      expect(thinToday(save, 'woods')).toBe(k >= FULL_HAULS)
      const done = k % 2 === 0 ? forage(save, 'woods') : chop(save, 'woods')
      forages.push(done.haul.items.length)
      save = done.save
    }
    // Forage and chop share the area's four: two each full, then one each.
    expect(forages).toEqual([2, 2, 2, 2, 1, 1, 1, 1])
    expect(haulsToday(save, 'woods')).toBe(8)
    expect(haulsToday(save, 'pond')).toBe(0)
    expect(save.today.gathered).toEqual(['woods'])
    expect(parseSaveV5(json(save))).toEqual(save)
    // A farmhand's three finds come home as one or two once it's thin, drawn by the place's hauls today.
    const thin = { ...save, today: { ...save.today, hauls: { woods: 4 } } }
    const draws = Array.from({ length: 40 }, (_, n) => haulAt({ ...thin, today: { ...thin.today, hauls: { woods: 4 + n } } }, 'woods', 3))
    expect(new Set(draws)).toEqual(new Set([1, 2]))
    expect(haulAt(farm(), 'woods', 3)).toBe(3)
    // The night clears it with the day.
    expect(endDay(save, {}, LATER).today.hauls).toBeUndefined()
  })

  it('lets a thin spot\'s cast land nothing, and says so', () => {
    let save = farm()
    const caught: (string | null)[] = []
    for (let k = 0; k < 10; k++) {
      const done = fish(save, 'pond')
      caught.push(done.caught?.fish ?? null)
      save = done.save
    }
    expect(caught.slice(0, FULL_HAULS).every((c) => c !== null)).toBe(true)
    expect(caught.slice(FULL_HAULS)).toContain(null)
  })

  it('reaches deeper with the Farm Rank, the sea once its place stands', () => {
    expect(FARMER_REACH).toEqual([1, 2, 4, 6, 8, 10])
    const save = farm()
    expect(reachLock(save, 'forest', 'woods')).toBeNull()
    expect(reachLock(save, 'forest', 'hills')).toBe('Opens at Farm Rank 2.')
    expect(reason(() => forage(save, 'hills'))).toBe('locked')
    expect(reachLock(atRank(save, 2), 'forest', 'hills')).toBeNull()
    expect(reachLock(atRank(save, 2), 'forest', 'old-forest')).toBe('Opens at Farm Rank 4.')
    expect(reachLock(atRank(save, 10), 'forest', 'world-tree')).toBeNull()
    expect(reachLock(save, 'fishery', 'river')).toBe('Opens at Farm Rank 2.')
    expect(reachLock(atRank(save, 6), 'fishery', 'sea-pier')).toBe('Needs the Dock.')
    expect(reachLock({ ...atRank(save, 6), buildings: { ...save.buildings, dock: 1 } }, 'fishery', 'sea-pier')).toBeNull()
    expect(reachLock(atRank(save, 8), 'fishery', 'deep-sea')).toBe('Needs the Boat.')
    expect(reachLock(save, 'forest', 'moon')).toBe('Not here.')
    expect(reachList(save, 'forest').map((a) => [a.id, a.rank, a.lock === null])).toEqual([
      ['woods', 1, true], ['hills', 2, false], ['old-forest', 4, false], ['mountain', 6, false], ['misty-vale', 8, false], ['world-tree', 10, false],
    ])
  })

  it('pays a depth milestone the night after the first haul past the Woods or the Pond', () => {
    const save = atRank(farm(), 2)
    const hills = endDay(forage(save, 'hills').save, {}, LATER)
    expect(hills.diary.milestones).toContain('depth:hills')
    expect(hills.today.gathered).toEqual([])
    const woods = endDay(forage(save, 'woods').save, {}, LATER)
    expect(woods.diary.milestones.filter((m) => m.startsWith('depth:'))).toEqual([])
    expect(parseSaveV5(json(hills))).toEqual(hills)
  })
})

describe('an Uma\'s haul, kept for the farmhands', () => {
  it('brings a Novice C forager in the Woods 5 items a day, lifted by rank, talent, tool and well fed', () => {
    expect(haulCount('forest', terms())).toBe(5)
    expect(haulCount('fishery', terms({ rank: 1 }))).toBe(4)
    expect([0, 1, 2, 3, 4, 5].map((rank) => haulCount('forest', terms({ rank: rank as Rank, talent: 3 })))).toEqual([5, 6, 7, 8, 9, 10])
    expect(haulCount('forest', terms({ wellFed: 1 }), 0)).toBe(7)
  })

  it('reaches by her rank, the sea by its place', () => {
    const save = farm()
    expect(placeLock(save, 'forest', 'hills', 0)).toBe('Opens at Hand.')
    expect(placeLock(save, 'forest', 'hills', 1)).toBeNull()
    expect(placeLock(save, 'fishery', 'sea-pier', 1)).toBe('Needs the Dock.')
  })

  it('grows sizes with skill: k = 1 + 0.25 × rank + 0.1 × talent + 0.05 × Rod', () => {
    expect(sizeSkill({ rank: 0, talent: 3, tool: 1 })).toBeCloseTo(1.35)
    expect(sizeSkill({ rank: 5, talent: 7, tool: 5 })).toBeCloseTo(3.2)
    for (const u of [0.1, 0.5, 0.9]) expect(fishSize('carp', 3.2, u)).toBeGreaterThan(fishSize('carp', 1.35, u))
    expect(fishSize('carp', 1.35, 0)).toBe(20)
    expect(fishSize('tuna', 2, 0.999999)).toBeCloseTo(250, 0)
  })
})

describe('the stations\' loads', () => {
  const built = (save: SaveV4): SaveV4 => ({ ...save, buildings: { ...save.buildings, mill: 1, sawmill: 1 } })

  it('starts a load for one action, its inputs taken now, ready the next morning in the Warehouse', () => {
    const save = built({ ...farm(), items: { 'pine-log': [10, 0, 3, 0, 0] } })
    const loaded = startLoad(save, 'sawmill', 'pine-plank@3', 3)
    expect(loaded.items['pine-log']).toEqual([10, 0, 0, 0, 0])
    expect(loaded.loads).toEqual({ sawmill: [{ item: 'pine-plank@3', count: 3 }] })
    expect(actionsLeft(loaded)).toBe(9)
    expect(parseSaveV5(json(loaded))).toEqual(loaded)
    const morning = endDay(loaded, {}, LATER)
    expect(morning.items['pine-plank']).toEqual([0, 0, 3, 0, 0])
    expect(morning.loads).toEqual({})
    expect(morning.summary!.work).toEqual([{ kind: 'load', station: 'sawmill', item: 'pine-plank@3', count: 3 }])
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })

  it('holds one load a station a day, up to 8, and refuses what it can\'t make or the Warehouse can\'t cover', () => {
    const save = built({ ...farm(), items: { 'pine-log': [12, 0, 0, 0, 0], wheat: [9, 0, 0, 0, 0] } })
    expect(LOAD_SIZE).toBe(8)
    expect(reason(() => startLoad(save, 'sawmill', 'pine-plank@1', 9))).toBe('bad-count')
    expect(reason(() => startLoad(save, 'sawmill', 'pine-plank@1', 0))).toBe('bad-count')
    expect(reason(() => startLoad(save, 'sawmill', 'pine-plank@2', 1))).toBe('no-items')
    expect(reason(() => startLoad(save, 'sawmill', 'wheat-flour@1', 1))).toBe('bad-job')
    expect(reason(() => startLoad(save, 'smokehouse', 'carp-fillet@1', 1))).toBe('locked')
    const loaded = startLoad(save, 'sawmill', 'pine-plank@1', 8)
    expect(reason(() => startLoad(loaded, 'sawmill', 'pine-plank@1', 1))).toBe('busy')
    // Another station works beside it, the same day.
    const both = startLoad(loaded, 'mill', 'wheat-flour@1', 8)
    expect(finishLoads(both).done.map((d) => d.station)).toEqual(['mill', 'sawmill'])
    expect(finishLoads(farm()).save).toEqual(farm())
  })

  it('takes a load a day a level: level 3 holds three, each its own good, all ready the next morning', () => {
    const save = { ...farm(), buildings: { ...farm().buildings, mill: 3 }, items: { wheat: [24, 0, 0, 0, 0], apple: [4, 0, 0, 0, 0] } } as SaveV4
    expect([stationLevel(save, 'mill'), loadsADay(save, 'mill'), loadsLeft(save, 'mill')]).toEqual([3, 3, 3])
    let loaded = startLoad(save, 'mill', 'wheat-flour@1', 8)
    loaded = startLoad(loaded, 'mill', 'apple-preserve@1', 4)
    loaded = startLoad(loaded, 'mill', 'wheat-flour@1', 8)
    expect(loadsLeft(loaded, 'mill')).toBe(0)
    expect(reason(() => startLoad(loaded, 'mill', 'wheat-flour@1', 1))).toBe('busy')
    expect(loaded.loads.mill).toHaveLength(3)
    expect(parseSaveV5(json(loaded))).toEqual(loaded)
    const morning = endDay(loaded, {}, LATER)
    expect(morning.items['wheat-flour']).toEqual([16, 0, 0, 0, 0])
    expect(morning.items['apple-preserve']).toEqual([4, 0, 0, 0, 0])
    expect(morning.summary!.work.filter((w) => w.kind === 'load')).toHaveLength(3)
  })

  it('reads an older v5\'s one load as a list of one, and refuses more loads than a station\'s top level', () => {
    const save = built(farm())
    const older = { ...json(save), loads: { mill: { item: 'wheat-flour@1', count: 8 } } }
    expect(parseSaveV5(older).loads).toEqual({ mill: [{ item: 'wheat-flour@1', count: 8 }] })
    expect(parseSaveV5(older).account).toEqual(save.account)
    const six = { ...json(save), loads: { mill: Array.from({ length: 6 }, () => ({ item: 'wheat-flour@1', count: 8 })) } }
    expect(() => parseSaveV5(six)).toThrow('save.loads.mill: expected 1–5 entries')
  })

  it('buys a station\'s levels as the Dorm\'s: gold now, from its Farm Rank, one a day, the level the next morning', () => {
    const save = atRank({ ...built(farm()), gold: 40_000 }, 3)
    expect(STATION_LEVELS.map((l) => [l.level, l.loads, l.cost, l.farmRank])).toEqual([[1, 1, 0, 1], [2, 2, 2_000, 3], [3, 3, 5_000, 4], [4, 4, 10_000, 5], [5, 5, 20_000, 6]])
    expect(levelLock(farm(), 'mill')).toEqual({ by: 'built' })
    expect(levelLockWords(levelLock(atRank(built(farm()), 2), 'mill'))).toBe('Opens at Farm Rank 3')
    expect(levelLockWords(levelLock({ ...save, gold: 1_500 }, 'mill'))).toBe('Need 500g more')
    const bought = upgradeStation(save, 'mill')
    expect(bought.gold).toBe(38_000)
    expect(actionsLeft(bought)).toBe(actionsLeft(save))
    expect(stationLevel(bought, 'mill')).toBe(1)
    expect(levelLockWords(levelLock(bought, 'mill'))).toBe('Level 2 tomorrow')
    expect(reason(() => upgradeStation(bought, 'mill'))).toBe('bad-job')
    expect(parseSaveV5(json(bought))).toEqual(bought)
    const morning = endDay(bought, {}, LATER)
    expect([stationLevel(morning, 'mill'), loadsADay(morning, 'mill')]).toEqual([2, 2])
    expect(morning.summary!.news).toContainEqual({ kind: 'built', place: 'mill', level: 2 })
    expect(parseSaveV5(json(morning))).toEqual(morning)
    // Level 3 waits for Farm Rank 4; at the top, nothing more.
    expect(levelLockWords(levelLock(morning, 'mill'))).toBe('Opens at Farm Rank 4')
    const top = atRank({ ...morning, buildings: { ...morning.buildings, mill: 5 } }, 10)
    expect(levelLockWords(levelLock(top, 'mill'))).toBe('At its top level')
    expect(nextStationLevel(top, 'mill')).toBeNull()
  })

  it('offers what the Warehouse holds, job by job, at each star', () => {
    const save: SaveV4 = { ...farm(), items: { 'pine-log': [2, 0, 3, 0, 0], shiitake: [1, 0, 0, 0, 0], carp: [4, 0, 0, 0, 0], 'pine-plank': [1, 0, 0, 0, 0] } }
    expect(stationOptions(save, 'sawmill').map((o) => `${o.job} ${o.item} ${o.held}`)).toEqual([
      'planks pine-plank@1 2', 'planks pine-plank@3 3', 'drying dried-shiitake@1 1',
    ])
    expect(stationOptions(save, 'smokehouse').map((o) => o.item)).toEqual(['carp-fillet@1'])
    expect(stationOptions(save, 'mill')).toEqual([])
  })

  it('maps every refined good with a station to one job, and the vegetables to none', () => {
    expect(stationJobOf('wheat-flour')).toBe('flour')
    expect(stationJobOf('honey')).toBe('sugars-oils')
    expect(stationJobOf('apple-preserve')).toBe('preserves')
    expect(stationJobOf('dried-shiitake')).toBe('drying')
    expect(stationJobOf('carp-fillet')).toBe('smoking')
    expect(stationJobOf('copper-ingot')).toBe('smelting')
    expect(stationJobOf('cut-quartz')).toBe('cutting')
    expect(stationJobOf('limestone-block')).toBe('blocks')
    expect(stationJobOf('wool-cloth')).toBe('weaving')
    expect(stationJobOf('carrot')).toBeNull()
    expect(stationJobOf('egg')).toBeNull()
    expect(STATION_JOB_IDS).toHaveLength(10)
  })

  it('makes preserves overnight too', () => {
    const save = built({ ...farm(), items: { apple: [4, 0, 0, 0, 0] } })
    const morning = endDay(rested(startLoad(save, 'mill', 'apple-preserve@1', 4)), {}, LATER)
    expect(morning.items['apple-preserve']).toEqual([4, 0, 0, 0, 0])
  })
})
