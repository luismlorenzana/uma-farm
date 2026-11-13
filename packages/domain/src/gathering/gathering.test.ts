// The forest, the Fishery and the stations: the tables, a day's haul, the
// stations' rate, building them, the catch's sizes, the night's hauls and the save's parse. Invented outfit ids, the
// loop's own kinds.
import { endsAt } from '@luismlorenzana/uma-work'
import { describe, expect, it } from 'vitest'
import { DAY_MS } from '../farm/calendar'
import { PLACE_ACTIVITY } from '../farm/rank-rules'
import type { Rank } from '../farm/ranks'
import { talentsD, type TalentOf, type TalentStep } from '../farm/talents'
import { goodOf, isGoodId } from '../goods/ids'
import { endDay, NIGHT_STEPS, runNight, tickRanks, type NightStep } from '../night/end-day'
import { collectLoopAll, collectLoopWorker, editLoopQueue, startLoopJob, type LoopJobInput } from '../save/loop-work'
import { loopReadyWork } from '../save/work-readings'
import { parseSaveV3 } from '../save/parse-v3'
import { SaveRuleError } from '../save/rules'
import { newRosterUma, newSave, type LoopWorkRequest, type SaveV3 } from '../save/v3'
import { loopWorld } from '../work/loop-env'
import { FISHING_SPOTS, FOREST_AREAS, LOOP_REQUESTS, STATION_JOB_IDS, stationJobOf } from './ids'
import {
  daySeconds, fishSize, haulCount, haulsTonight, loopKinds, LOOP_KINDS, pickShare, planHaul, planStation, sizeRecord, sizeSkill, stationDays, termsOf,
  type WorkTerms,
} from './kinds'
import { buildStation, stationLock, stationOptions } from './stations'
import { FISH_SIZES, FISHERY, FOREST } from './tables'

const AT = '2026-11-09T10:00:00.000Z'
const LATER = '2026-11-09T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** Everyone at one talent step. */
const at = (step: TalentStep): TalentOf => () => step
const C = at(4)

/** Two Umas home on `day`, Novice everywhere. */
function farm(day = 1): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, calendar: { day }, roster: { 101: newRosterUma(1), 202: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202'], swaps: [] } }
}
const ranked = (save: SaveV3, id: string, activity: 'foraging' | 'fishing' | 'farming', rank: Rank): SaveV3 =>
  ({ ...save, roster: { ...save.roster, [id]: { ...save.roster[id]!, ranks: { ...save.roster[id]!.ranks, [activity]: { points: 0, rank, challenge: 0 } } } } })
const job = (place: LoopJobInput['place'], request: LoopWorkRequest, outfitId = '101', slot = 0): LoopJobInput => ({ outfitId, place, slot, request })
const forage = (item: string, count = 1): LoopWorkRequest => ({ kind: 'forage', item, count })
const fish = (item: string, count = 1): LoopWorkRequest => ({ kind: 'fish', item, count })
const start = (save: SaveV3, input: LoopJobInput, talentOf: TalentOf = C) => startLoopJob(save, input, AT, loopKinds(talentOf))
const night = (save: SaveV3, talentOf: TalentOf = C) => endDay(save, { roster: [], talentOf }, LATER)
const terms = (t: Partial<WorkTerms> = {}): WorkTerms => ({ rank: 0, talent: 4, tool: 1, wellFed: 0, ...t })

describe('the tables (CS15, CS16)', () => {
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

  it('draws the Woods in Spring at its shares over a seeded sample: woods 40%, mushrooms 30%, herbs 15%, sweets 15%, G1/G2 about 65/35', () => {
    let save = farm(1)
    const by: Record<string, number> = {}
    const grades = [0, 0]
    // 400 days of a Novice forager in the Woods, all in Spring's first day draws (the seeds differ by account).
    for (let i = 0; i < 400; i++) {
      save = { ...save, account: { ...save.account, uid: `u${i}` } }
      const plan = planHaul(save, '101', 'forest', forage('woods'), 0, 0, talentsD)
      if (!Array.isArray(plan)) throw new Error('refused')
      for (const item of plan) {
        const good = goodOf(('item' in item.output ? item.output.item : '').split('@')[0]!)!
        by[good.family] = (by[good.family] ?? 0) + 1
        grades[good.grade - 1]! += 1
      }
    }
    const total = grades[0]! + grades[1]!
    expect(total).toBe(2000)
    expect(by.woods! / total).toBeCloseTo(0.4, 1)
    expect(by.mushrooms! / total).toBeCloseTo(0.3, 1)
    expect(by['herbs-spices']! / total).toBeCloseTo(0.15, 1)
    expect(by.sweets! / total).toBeCloseTo(0.15, 1)
    expect(Math.abs(grades[0]! / total - 0.66)).toBeLessThan(0.03)
  })

  it('picks a good by its shares', () => {
    const shares = FOREST.woods.seasons.spring
    expect(pickShare(shares, 0)).toBe('pine-log')
    expect(pickShare(shares, 0.2599)).toBe('pine-log')
    expect(pickShare(shares, 0.26)).toBe('button-mushroom')
    expect(pickShare(shares, 0.9999)).toBe('sugarcane')
  })
})

describe('a day\'s haul (CS17; decision 1)', () => {
  it('brings a Novice C forager in the Woods 5 items a day, and a Hand C angler at the River 4', () => {
    expect(haulCount('forest', terms())).toBe(5)
    expect(haulCount('fishery', terms({ rank: 1 }))).toBe(4)
    const woods = start(farm(), job('forest', forage('woods')))
    expect(woods.work['101']!.entries[0]!.outputs).toHaveLength(5)
    const river = start(ranked(farm(), '202', 'fishing', 1), job('fishery', fish('river'), '202'))
    expect(river.work['202']!.entries[0]!.outputs).toHaveLength(4)
  })

  it('lifts the haul by rank, talent, tool and well fed', () => {
    expect([0, 1, 2, 3, 4, 5].map((rank) => haulCount('forest', terms({ rank: rank as Rank, talent: 3 })))).toEqual([5, 6, 7, 8, 9, 10])
    expect(haulCount('forest', terms({ talent: 7, rank: 5, tool: 5, wellFed: 1 }))).toBe(24)
    expect(haulCount('forest', terms({ wellFed: 1 }), 0)).toBe(7)
    expect(haulCount('forest', terms({ wellFed: 1 }), 1)).toBe(5)
    expect(haulCount('fishery', terms({ talent: 0 }))).toBe(3)
  })

  it('refuses the Hills at Novice and opens them at Hand; refuses the Sea Pier in M4', () => {
    expect(() => start(farm(), job('forest', forage('hills')))).toThrow('Opens at Hand.')
    expect(start(ranked(farm(), '101', 'foraging', 1), job('forest', forage('hills'))).work['101']!.entries).toHaveLength(1)
    expect(() => start(ranked(farm(), '101', 'fishing', 5), job('fishery', fish('sea-pier')))).toThrow('Opens with Chapter 7.')
    expect(() => start(ranked(farm(), '101', 'fishing', 4), job('fishery', fish('moon-pool')))).toThrow('Opens at Legend.')
    expect(() => start(farm(), job('forest', fish('pond')))).toThrow()
  })

  it('plans each day\'s items to end at its morning, a job up to four days, starred goods drawn from the day', () => {
    const save = start(farm(), job('forest', forage('woods', 3)))
    const entry = save.work['101']!.entries[0]!
    expect(entry.outputs).toHaveLength(15)
    expect(entry.seconds.slice(0, 5).reduce((a, b) => a + b, 0)).toBe(86_400)
    expect(endsAt(entry)).toBe(3 * DAY_MS)
    expect(entry.outputs.every((o) => 'item' in o && /^[a-z-]+@[12]$/.test(o.item))).toBe(true)
    expect(() => start(farm(), job('forest', forage('woods', 5)))).toThrow('A job is 1 to 4 days.')
    expect(daySeconds(7).reduce((a, b) => a + b, 0)).toBe(86_400)
  })

  it('plans the same haul from the same save twice', () => {
    const save = farm(5)
    expect(start(save, job('forest', forage('woods', 2)))).toEqual(start(json(save), job('forest', forage('woods', 2))))
    const other = { ...save, account: { ...save.account, uid: 'u2' } }
    expect(start(other, job('forest', forage('woods', 2))).work['101']!.entries[0]!.outputs).not.toEqual(start(save, job('forest', forage('woods', 2))).work['101']!.entries[0]!.outputs)
  })

  it('plans with her talent from master data: an S forager brings more than a G one', () => {
    expect(start(farm(), job('forest', forage('woods')), at(7)).work['101']!.entries[0]!.outputs).toHaveLength(6)
    expect(start(farm(), job('forest', forage('woods')), at(0)).work['101']!.entries[0]!.outputs).toHaveLength(4)
  })

  it('plans a queued day at the boundary with the rank and talent the night gives', () => {
    const save = editLoopQueue(start(farm(), job('forest', forage('woods'))), { outfitId: '101', add: { request: forage('woods'), building: 'forest' } }, AT, loopKinds(C))
    // Step 6 stands in: everyone who worked today reaches Expert foraging.
    const ranks: NightStep = (n) => ({ ...n, save: n.notes.worked.reduce((s, w) => ranked(s, w.outfitId, 'foraging', 3), n.save as SaveV3) })
    const morning = runNight(save, { roster: [], talentOf: at(7) }, NIGHT_STEPS.map((s) => (s.run === tickRanks ? { ...s, run: ranks } : s)))
    const [first, second] = morning.work['101']!.entries
    expect(first!.outputs).toHaveLength(5)
    // Expert ×1.5 and S ×1.2: round(5 × 1.5 × 1.2) = 9.
    expect(second).toMatchObject({ startedAt: DAY_MS, fromQueue: true })
    expect(second!.outputs).toHaveLength(9)
  })

  it('gives a well-fed forager ×1.25 items a day and +0.25 quality, and no time', () => {
    const fed: SaveV3 = { ...farm(), roster: { ...farm().roster, 101: { ...newRosterUma(1), wellFed: 1 } } }
    const save = start(fed, job('forest', forage('woods', 2)))
    const entry = save.work['101']!.entries[0]!
    expect(entry.outputs).toHaveLength(7 + 5)
    expect(night(save).work['101']!.entries[0]!.acceleratedMs).toBe(0)
  })
})

describe('collecting a haul (decisions 3 and 7)', () => {
  it('fills the Warehouse by stars and counts what came home', () => {
    const morning = night(start(farm(), job('forest', forage('woods'))))
    const got = collectLoopWorker(morning, '101', LATER, loopKinds(C))
    expect(got.items).toBe(5)
    expect(Object.values(got.save.items).flat().reduce((a, b) => a + b, 0)).toBe(5 + 9)
    expect(got.save.farm.counts['home:forest']).toBe(5)
    expect(got.goods).toHaveLength(5)
    expect(got.save.account.updatedAt).toBe(LATER)
  })

  it('measures each fish in its range, the same every time, and keeps the biggest of each kind', () => {
    const save = ranked(farm(), '101', 'fishing', 1)
    const morning = night(start(save, job('fishery', fish('river', 2))))
    const got = collectLoopWorker(morning, '101', LATER, loopKinds(C))
    expect(got.sizes).toHaveLength(4)
    for (const s of got.sizes) {
      const [min, max] = FISH_SIZES[s.fish]!
      expect(s.cm).toBeGreaterThanOrEqual(min)
      expect(s.cm).toBeLessThanOrEqual(max)
    }
    expect(collectLoopWorker(json(morning), '101', LATER, loopKinds(C)).sizes).toEqual(got.sizes)
    for (const fishId of new Set(got.sizes.map((s) => s.fish))) {
      expect(got.save.diary.records[sizeRecord(fishId)]).toBe(Math.max(...got.sizes.filter((s) => s.fish === fishId).map((s) => s.cm)))
    }
    expect(got.save.farm.counts['home:fishery']).toBe(4)
    // The next day's catch is measured on from the farm's count, and a record only rises.
    const next = collectLoopWorker(night(got.save), '101', LATER, loopKinds(C))
    expect(next.save.farm.counts['home:fishery']).toBe(8)
    for (const [key, cm] of Object.entries(got.save.diary.records)) expect(next.save.diary.records[key]).toBeGreaterThanOrEqual(cm)
  })

  it('grows sizes with her skill: k = 1 + 0.25 × rank + 0.1 × talent + 0.05 × Rod', () => {
    expect(sizeSkill({ rank: 0, talent: 3, tool: 1 })).toBeCloseTo(1.35)
    expect(sizeSkill({ rank: 5, talent: 7, tool: 5 })).toBeCloseTo(3.2)
    for (const u of [0.1, 0.5, 0.9]) expect(fishSize('carp', 3.2, u)).toBeGreaterThan(fishSize('carp', 1.35, u))
    expect(fishSize('carp', 1.35, 0)).toBe(20)
    expect(fishSize('tuna', 2, 0.999999)).toBeCloseTo(250, 0)
  })

  it('collects everything at a place in one tap', () => {
    const two = start(start(farm(), job('forest', forage('woods'))), job('forest', forage('woods'), '202', 1))
    const morning = night(two)
    expect(loopReadyWork(morning).get('forest')).toBe(2)
    const all = collectLoopAll(morning, LATER, ['forest'], loopKinds(C))
    expect(all.items).toBe(10)
    expect(all.save.farm.counts['home:forest']).toBe(10)
  })
})

describe('the night\'s hauls (decision 7; CS30)', () => {
  it('counts catches and items toward her next rank\'s challenge, at the right places', () => {
    const save = start(start(ranked(farm(), '202', 'fishing', 1), job('forest', forage('woods'))), job('fishery', fish('river'), '202'))
    const morning = night(save)
    expect(morning.roster['101']!.ranks.foraging.challenge).toBe(5)
    expect(morning.roster['202']!.ranks.fishing.challenge).toBe(4)
    // The Woods don't count toward Skilled's "20 in the Hills"; the Hills do.
    const hand = ranked(ranked(farm(), '101', 'foraging', 1), '202', 'fishing', 2)
    const woods = night(start(hand, job('forest', forage('woods'))))
    expect(woods.roster['101']!.ranks.foraging.challenge).toBe(0)
    const hills = night(start(hand, job('forest', forage('hills'))))
    expect(hills.roster['101']!.ranks.foraging.challenge).toBe(6)
    const lake = night(start(hand, job('fishery', fish('lake'), '202')))
    // Skilled C at the Lake: round(3 × 1.3 × 1.05) = 4, toward Expert's "10 at the Lake".
    expect(lake.roster['202']!.ranks.fishing.challenge).toBe(4)
  })

  it('counts a multi-day job each night it makes items, and names the night\'s best catch', () => {
    const save = ranked(farm(), '101', 'fishing', 1)
    const one = night(start(save, job('fishery', fish('river', 2))))
    expect(one.roster['101']!.ranks.fishing.challenge).toBe(4)
    expect(one.summary!.work).toEqual([expect.objectContaining({ kind: 'catch' })])
    expect(night(one).roster['101']!.ranks.fishing.challenge).toBe(8)
    expect(parseSaveV3(json(one))).toEqual(one)
    const { best } = haulsTonight(save, [{ outfitId: '101', place: 'fishery', request: fish('pond'), items: ['carp@3', 'rainbow-koi@1', 'trout@5'] }])
    expect(best).toEqual({ id: 'rainbow-koi', stars: 1 })
  })

  it('pays rank points for a day of gathering in its activity (step 6)', () => {
    const morning = night(start(farm(), job('forest', forage('woods'))))
    expect(morning.roster['101']!.ranks.foraging.points).toBeCloseTo(11)
    expect(PLACE_ACTIVITY.sawmill).toBe('foraging')
  })
})

describe('the stations (CS18; decisions 2 and 6)', () => {
  const sawmill = (save: SaveV3): SaveV3 => ({ ...save, buildings: { ...save.buildings, sawmill: 1, mill: 1, smokehouse: 1 } })

  it('saws a Hand C forager\'s 10 logs a day, ★3 logs into ★3 planks', () => {
    const save = sawmill(ranked({ ...farm(), items: { 'pine-log': [0, 0, 12, 0, 0] } }, '101', 'foraging', 1))
    expect(stationDays('planks', terms({ rank: 1 }), 12)).toEqual([10, 2])
    const started = start(save, job('sawmill', { kind: 'planks', item: 'pine-plank@3', count: 10 }))
    expect(started.items['pine-log']).toEqual([0, 0, 2, 0, 0])
    expect(endsAt(started.work['101']!.entries[0]!)).toBe(DAY_MS)
    const got = collectLoopWorker(night(started), '101', LATER, loopKinds(C))
    expect(got.save.items['pine-plank']).toEqual([0, 0, 10, 0, 0])
  })

  it('takes two nights for a 2-day preserves job, and gains a quarter day a night well fed', () => {
    const save = sawmill({ ...farm(), items: { apple: [8, 0, 0, 0, 0] } })
    const started = start(save, job('mill', { kind: 'preserves', item: 'apple-preserve@1', count: 8 }))
    expect(endsAt(started.work['101']!.entries[0]!)).toBe(2 * DAY_MS)
    expect(loopReadyWork(night(started)).get('mill')).toBe(1)
    expect(night(started).work['101']!.entries[0]!.outputs).toHaveLength(8)
    const two = night(night(started))
    expect(collectLoopWorker(two, '101', LATER, loopKinds(C)).save.items['apple-preserve']).toEqual([8, 0, 0, 0, 0])
    const fed: SaveV3 = { ...started, roster: { ...started.roster, 101: { ...started.roster['101']!, wellFed: 1 } } }
    expect(night(fed).work['101']!.entries[0]!.acceleratedMs).toBe(DAY_MS / 4)
  })

  it('refuses a job longer than the Warehouse holds as short, and one at an unbuilt station', () => {
    const save = sawmill({ ...farm(), items: { 'pine-log': [5, 0, 0, 0, 0] } })
    expect(() => start(save, job('sawmill', { kind: 'planks', item: 'pine-plank@1', count: 8 }))).toThrow('Short 3 Pine Log.')
    expect(() => start({ ...save, buildings: { dorm: 1 } }, job('sawmill', { kind: 'planks', item: 'pine-plank@1', count: 5 }))).toThrow('Build it first.')
    expect(() => start(save, job('sawmill', { kind: 'smoking', item: 'carp-fillet@1', count: 1 }))).toThrow()
  })

  it('builds the Mill only with its plans, the Sawmill from Farm Rank 3 with 1,500g', () => {
    const save = { ...farm(), gold: 5000 }
    expect(() => buildStation(save, 'mill')).toThrow('Needs the Mill’s plans')
    expect(buildStation({ ...save, buildings: { ...save.buildings, mill: 0 } }, 'mill')).toMatchObject({ gold: 3800, buildings: { mill: 1 } })
    expect(() => buildStation(save, 'sawmill')).toThrow('Opens at Farm Rank 3.')
    const fr3 = { ...save, farm: { ...save.farm, points: 500 } }
    expect(stationLock({ ...fr3, gold: 1000 }, 'sawmill')).toEqual({ by: 'gold', short: 500 })
    expect(() => buildStation({ ...fr3, gold: 1000 }, 'sawmill')).toThrow(SaveRuleError)
    const built = buildStation(fr3, 'sawmill')
    expect(built).toMatchObject({ gold: 3500, buildings: { sawmill: 1 } })
    expect(built.account).toEqual(fr3.account)
    expect(() => buildStation(built, 'sawmill')).toThrow('Built already.')
    expect(buildStation(fr3, 'smokehouse').gold).toBe(3000)
  })

  it('offers what the Warehouse holds, job by job, at each star', () => {
    const save: SaveV3 = { ...farm(), items: { 'pine-log': [2, 0, 3, 0, 0], shiitake: [1, 0, 0, 0, 0], carp: [4, 0, 0, 0, 0], 'pine-plank': [1, 0, 0, 0, 0] } }
    expect(stationOptions(save, 'sawmill').map((o) => `${o.job} ${o.item} ${o.held}`)).toEqual([
      'planks pine-plank@1 2', 'planks pine-plank@3 3', 'drying dried-shiitake@1 1',
    ])
    expect(stationOptions(save, 'smokehouse').map((o) => o.item)).toEqual(['carp-fillet@1'])
    expect(stationOptions(save, 'mill')).toEqual([])
  })

  it('maps every refined good with a station to one job, and the vegetables to none', () => {
    expect(stationJobOf('wheat-flour')).toBe('flour')
    expect(stationJobOf('honey')).toBe('sugars-oils')
    expect(stationJobOf('peanut-butter')).toBe('sugars-oils')
    expect(stationJobOf('apple-preserve')).toBe('preserves')
    expect(stationJobOf('dried-shiitake')).toBe('drying')
    expect(stationJobOf('ground-ginger')).toBe('drying')
    expect(stationJobOf('carp-fillet')).toBe('smoking')
    expect(stationJobOf('copper-ingot')).toBeNull()
    expect(stationJobOf('carrot')).toBeNull()
    expect(STATION_JOB_IDS).toHaveLength(6)
  })

  it('plans with the station\'s activity: the Mill reads farming', () => {
    const save = sawmill(ranked({ ...farm(), items: { wheat: [20, 0, 0, 0, 0] } }, '101', 'farming', 2))
    const plan = planStation(save, '101', 'flour', { kind: 'flour', item: 'wheat-flour@1', count: 20 }, 'mill', C)
    // Skilled ×1.3, C ×1.05: round(8 × 1.365) = 11 a day.
    expect(Array.isArray(plan) && plan.length).toBe(20)
    expect(termsOf(save, '101', 'farming', C, null)).toEqual({ rank: 2, talent: 4, tool: 1, wellFed: 0 })
    expect(stationDays('flour', terms({ rank: 2 }), 20)).toEqual([11, 9])
  })
})

describe('the save (decision 1; F17 decision 11)', () => {
  it('parses every kind\'s request at its place, an entry with more items than days, and refuses the rest', () => {
    const save = sawmill2(start(farm(), job('forest', forage('woods', 2))))
    expect(parseSaveV3(json(save))).toEqual(save)
    const bad = (request: unknown, building = 'forest') => () => parseSaveV3(json({ ...save, work: { 101: { ...save.work['101']!, slot: { building, slot: 0 }, entries: [{ ...save.work['101']!.entries[0]!, request }] } } }))
    expect(bad({ kind: 'forage', item: 'woods', count: 5 })).toThrow('save.work.101.entries.0.request.count')
    expect(bad({ kind: 'forage', item: 'beach', count: 1 })).toThrow('save.work.101.entries.0.request.item')
    expect(bad({ kind: 'fish', item: 'pond', count: 1 })).toThrow('not worked at this place')
    expect(bad({ kind: 'planks', item: 'pine-plank@2', count: 5 }, 'sawmill')).not.toThrow()
    expect(bad({ kind: 'planks', item: 'dried-shiitake@2', count: 5 }, 'sawmill')).toThrow('save.work.101.entries.0.request.item')
    expect(bad({ kind: 'planks', item: 'pine-plank@2', count: 101 }, 'sawmill')).toThrow('request.count')
    expect(Object.keys(LOOP_REQUESTS)).toEqual(Object.keys(LOOP_KINDS))
    expect(LOOP_KINDS.preserves!.multiDay).toBe(true)
    expect(Object.entries(LOOP_KINDS).filter(([, k]) => k.multiDay).map(([id]) => id)).toEqual(['preserves'])
  })

  it('reads the world without changing the save', () => {
    const save = farm()
    expect(loopWorld(save).save).toBe(save)
  })
})

function sawmill2(save: SaveV3): SaveV3 {
  return { ...save, buildings: { ...save.buildings, sawmill: 1 } }
}
