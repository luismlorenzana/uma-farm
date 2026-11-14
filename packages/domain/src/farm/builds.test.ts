// The farm grows by building: a place offered at its Farm Rank, paid in gold and the farm's goods (the cheapest first),
// standing the next morning with its news; "Not built yet" for a place whose game isn't built; the milestones with the
// Umas; the farm's projects; and an older v4 from the global chapters, still loading. Invented ids; the night runs with
// test kinds and no story pack.
import { describe, expect, it } from 'vitest'
import { endDay } from '../night/end-day'
import { TEST_KINDS } from '../night/kinds.fixture'
import { parseSaveV4 } from '../save/parse-v4'
import { FARMHOUSE, newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'
import { buildCostWords, buildLock, buildLockWords, farmProjects, payBuild, pickFor, raiseBuilds, umaMilestones } from './builds'
import { farmPlace, placeBuilt, type BuildPlace } from './places'

const AT = '2026-11-13T10:00:00.000Z'
const LATER = '2026-11-13T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const place = (id: string) => farmPlace(id) as BuildPlace

/** A farm with gold, goods and Farm Rank points. */
function farm(gold = 500, items: SaveV4['items'] = {}, points = 0): SaveV4 {
  const save = newSave('u1', AT)
  return { ...save, farmer: { name: 'Robin' }, gold, items: { ...save.items, ...items }, farm: { ...save.farm, points } }
}

describe('building a place', () => {
  it('offers the Mill at Farm Rank 1, and pays for it in gold and logs, the cheapest first', () => {
    const save = farm(1200, { 'pine-log': [12, 0, 4, 0, 0], 'birch-log': [10, 0, 0, 0, 0] })
    expect(buildCostWords(place('mill'))).toBe('1,000g · 20 logs')
    expect(buildLock(save, 'mill')).toBeNull()
    expect(pickFor(save.items, { family: 'woods', refined: false, count: 20 })).toEqual([{ id: 'pine-log', stars: 1, count: 12 }, { id: 'birch-log', stars: 1, count: 8 }])
    const paid = payBuild(save, 'mill')
    expect(paid.gold).toBe(200)
    expect(paid.items['pine-log']).toEqual([0, 0, 4, 0, 0])
    expect(paid.items['birch-log']).toEqual([2, 0, 0, 0, 0])
    expect(paid.farm.builds).toEqual(['mill'])
    expect(paid.account).toEqual(save.account)
    expect(placeBuilt(paid, 'mill')).toBe(false)
    expect(buildLock(paid, 'mill')).toEqual({ by: 'tonight' })
    expect(() => payBuild(paid, 'mill')).toThrow('Builds tonight.')
  })

  it('stands the next morning, with its news', () => {
    const paid = payBuild(farm(1000, { 'pine-log': [20, 0, 0, 0, 0] }), 'mill')
    const morning = endDay(paid, { kinds: TEST_KINDS }, LATER)
    expect(morning.buildings.mill).toBe(1)
    expect(morning.farm.builds).toEqual([])
    expect(placeBuilt(morning, 'mill')).toBe(true)
    expect(morning.summary!.news).toContainEqual({ kind: 'built', place: 'mill' })
    expect(buildLock(morning, 'mill')).toEqual({ by: 'built' })
    expect(parseSaveV4(json(morning), 'save', TEST_KINDS)).toEqual(morning)
    expect(raiseBuilds(morning).built).toEqual([])
  })

  it('says what stands in the way: its Farm Rank, what it lacks, the place before it, a game not built yet', () => {
    expect(buildLock(farm(), 'sawmill')).toEqual({ by: 'farm-rank', rank: 3 })
    expect(buildLockWords(buildLock(farm(), 'sawmill'))).toBe('Opens at Farm Rank 3')
    const short = buildLock(farm(600, { 'pine-log': [8, 0, 0, 0, 0] }), 'mill')
    expect(buildLockWords(short)).toBe('Need 400g and 12 logs more')
    expect(() => payBuild(farm(600, { 'pine-log': [20, 0, 0, 0, 0] }), 'mill')).toThrow('Need 400g more.')
    expect(() => payBuild(farm(1000), 'mill')).toThrow('Need 20 logs more.')
    expect(buildLockWords(buildLock(farm(), 'coop'))).toBe('Not built yet')
    expect(() => payBuild(farm(99_999, {}, 30_000), 'coop')).toThrow('Not built yet.')
    const rich = farm(99_999, { 'pine-plank': [99, 0, 0, 0, 0], carp: [99, 0, 0, 0, 0], 'carp-fillet': [99, 0, 0, 0, 0] }, 30_000)
    expect(buildLock(rich, 'boat')).toEqual({ by: 'after', place: 'dock' })
    expect(buildLockWords(buildLock(rich, 'boat'))).toBe('After the Dock')
    expect(buildLock({ ...rich, buildings: { ...rich.buildings, dock: 1 } }, 'boat')).toBeNull()
    // The pacing's simulation pays for places whose games aren't built yet, as when they will be.
    expect(buildLock(rich, 'coop', { games: false })).toEqual({ by: 'short', gold: 0, goods: [{ goods: { family: 'woods', refined: false, count: 30 }, have: 0 }, { goods: { family: 'vegetables', refined: false, count: 20 }, have: 0 }] })
  })
})

describe('the milestones with the Umas', () => {
  const married = (n: number): SaveV4 => {
    const save = farm()
    const ids = Array.from({ length: n }, (_, i) => String(9001 + i))
    return { ...save, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])), love: Object.fromEntries(ids.map((id) => [id, { ...newLove(), stage: 'spouse' as const, level: 0 }])) }
  }
  it('opens house n with the n-th wedding, the second row with three married, the board with five met', () => {
    expect(umaMilestones(farm())).toEqual([
      { kind: 'bench', have: 0, need: 1, done: false }, { kind: 'house', n: 1, have: 0, need: 1, done: false }, { kind: 'row', row: 2, have: 0, need: 3, done: false },
      { kind: 'row', row: 3, have: 0, need: 6, done: false }, { kind: 'board', have: 0, need: 5, done: false },
    ])
    expect(umaMilestones(married(3))).toEqual([
      { kind: 'bench', have: 0, need: 1, done: false }, { kind: 'house', n: 4, have: 3, need: 4, done: false }, { kind: 'row', row: 2, have: 3, need: 3, done: true },
      { kind: 'row', row: 3, have: 3, need: 6, done: false }, { kind: 'board', have: 3, need: 5, done: false },
    ])
    expect(umaMilestones({ ...married(6), buildings: { dorm: 1, forge: 0 } }).filter((m) => m.done).map((m) => m.kind)).toEqual(['bench', 'house', 'row', 'row', 'board'])
  })
})

describe('the farm\'s projects', () => {
  it('lists what can be built now with what it lacks, what\'s offered but not built yet, and the next rank\'s offers', () => {
    const day1 = farmProjects(farm())
    expect(day1.now.map((p) => [p.place.id, p.lock?.by ?? null])).toEqual([['mill', 'short']])
    expect(day1.waiting).toEqual([])
    expect(day1.next).toMatchObject({ rank: 2, points: 150 })
    expect(day1.next!.places.map((p) => p.id)).toEqual(['coop'])
    const rank3 = farmProjects({ ...farm(), farm: { ...farm().farm, points: 300 }, buildings: { dorm: 1, mill: 1 } })
    expect(rank3.now.map((p) => p.place.id)).toEqual(['sawmill', 'smokehouse'])
    expect(rank3.waiting.map((p) => p.id)).toEqual(['coop', 'barn'])
    expect(rank3.next!.places.map((p) => p.id)).toEqual(['mine', 'smelter'])
    expect(farmProjects({ ...farm(), farm: { ...farm().farm, points: 30_000 } }).next).toBeNull()
  })
})

describe('an older v4, from the global chapters', () => {
  it('loads: its chapter and goals ignored, no builds yet, and what its chapter opened still open', () => {
    const save = farm()
    const older = json({ ...save, farm: { points: 400, chapter: 2, goals: { 'gold-shipped': 1200 }, festivals: [], counts: {} }, buildings: { dorm: 1, mill: 0 } }) as Record<string, unknown>
    const read = parseSaveV4(older)
    expect(read.farm).toEqual({ points: 400, festivals: [], counts: {}, builds: [] })
    // Chapter 2 had opened the Coop and the Barn: they stay open, built. The Mill's plans are an unbuilt Mill.
    expect(read.buildings).toEqual({ dorm: 1, mill: 0, coop: 1, barn: 1 })
    expect(placeBuilt(read, 'mill')).toBe(false)
    expect(parseSaveV4(json({ ...save, farm: { points: 0, chapter: 1, goals: {}, festivals: [], counts: {} } })).buildings).toEqual({ dorm: 1 })
    expect(parseSaveV4(json(read))).toEqual(read)
    expect(() => parseSaveV4(json({ ...save, farm: { ...save.farm, builds: ['fields'] } }))).toThrow('expected a place you build')
    expect(() => parseSaveV4(json({ ...save, farm: { ...save.farm, builds: ['mill', 'mill'] } }))).toThrow('repeated')
  })

  it('keeps houses built under the old rule, and shows the homestead\'s first row from day 1', () => {
    const save = farm()
    const houses = { ...save, homestead: { ...save.homestead, houses: [FARMHOUSE, { name: 'Rose Cottage', extended: false }, { name: 'Wren Hollow', extended: false }], slept: [0, 0, 0] } }
    expect(parseSaveV4(json(houses)).homestead.houses).toHaveLength(3)
  })
})
