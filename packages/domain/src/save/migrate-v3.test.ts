// v2 → v3: each step, then the whole migration of a v2 save mid-play, with invented outfit ids.
import { describe, expect, it } from 'vitest'
import { ACTIVITIES, type Activity } from '../farm/ranks'
import type { MaterialLine } from '../items/lines'
import { carryMaterials, finishJobs, migrateToV3, ranksFromCraft, refundOf, rosterFromUmas } from './migrate-v3'
import { parseSaveV3 } from './parse-v3'
import { newSaveV2, parseSave, toV2, type SaveV2 } from './save'
import { newSave } from './v3'
import { queueJob, settleWork, startJob } from './work'

const T0 = Date.parse('2026-11-08T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const LATER = iso(T0 + 3_600_000)
const LINES: Readonly<Record<string, MaterialLine>> = { 101: 'metal', 202: 'vegetables', 303: 'fish' }
const context = { lineOf: (id: string) => LINES[id] ?? null }

/**
 * A v2 save mid-play, as the owner might leave it:
 * - 101 (Metal, Craft Lv 5, 50 EXP short of Lv 6) gathers ×3 Copper Ore at the Mine, a ×1 queued behind her;
 * - 202 (Vegetables) chopped one Carrot at the Fields Workbench, and her ×2 queue behind it stopped for want of Carrots;
 * - 303 (Fish) is Craft Lv 20, idle; 404 is Lv 30, an outfit the release no longer has;
 * - the Warehouse holds goods that carry over and made items that leave.
 */
function midPlay(): SaveV2 {
  let save: SaveV2 = {
    ...newSaveV2('u1', iso(T0)),
    umas: { 101: { craft: { level: 5, exp: 1450 } }, 303: { craft: { level: 20, exp: 7 } }, 404: { craft: { level: 30, exp: 0 } } },
    items: { carrot: 2, 'weapon-gem-g3': 1, 'jewel-moon-2': 1, 'chopped-carrot': 1, 'pine-log': 4, carp: 2, 'cut-quartz': 1, 'silver-ingot': 3 },
  }
  save = startJob(save, 'mine', 0, { outfitId: '101' }, 'copper-ore', 3, iso(T0))
  save = queueJob(save, 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, iso(T0))
  save = startJob(save, 'fields-workbench', 0, { outfitId: '202' }, 'chopped-carrot', 1, iso(T0))
  save = queueJob(save, 'fields-workbench', 0, { outfitId: '202' }, 'chopped-carrot', 2, iso(T0))
  // The stop is stored, as any later change would store it; 101's job is still running.
  save = { ...settleWork(save, iso(T0 + 1_800_000)), account: { uid: 'u1', createdAt: iso(T0), updatedAt: LATER } }
  return save
}

const novice = (activity?: Activity) => ACTIVITIES.filter((a) => a !== activity).map((a) => [a, { points: 0, rank: 0, challenge: 0 }])

describe('step 1: running jobs finish', () => {
  it('pays every started entry and its Craft EXP, and drops queues and stopped queues', () => {
    const before = midPlay()
    expect(before.work['101']?.queue).toHaveLength(1)
    expect(before.work['202']?.dropped?.requests).toEqual([{ kind: 'refine', item: 'chopped-carrot', count: 2 }])
    const done = finishJobs(before)
    expect(done.work).toEqual({})
    expect(done.items['copper-ore']).toBe(3) // the job's three, not the queued fourth
    expect(done.items['chopped-carrot']).toBe(2)
    expect(done.items.carrot).toBe(1) // the stopped queue reserved nothing
    expect(done.umas['101']?.craft.level).toBe(6)
    expect(done.umas['202']?.craft.level).toBe(1)
    expect(done.account).toEqual(before.account)
  })

  it('leaves a save with no work as it was', () => {
    const save = { ...newSaveV2('u1', iso(T0)), items: { carp: 1 } }
    expect(finishJobs(save)).toEqual(save)
  })
})

describe('step 2: materials (D28)', () => {
  it('refunds what leaves the game per grade', () => {
    expect(refundOf('weapon-gem-g3')).toBe(450) // 15 × 3 × 10
    expect(refundOf('chopped-carrot')).toBe(15)
    expect(refundOf('jewel-moon-2')).toBe(300) // Moon Jewel II is grade 4: 15 × 4 × 5
    expect(refundOf('jewel-planet-1')).toBe(75)
    expect(refundOf('armor-fittings-g2')).toBe(90) // 15 × 2 × 3
    expect(refundOf('tome-ink-g10')).toBe(1500)
    expect(refundOf('pumpkin-puree')).toBe(150)
    expect(refundOf('carrot')).toBe(10) // a raw item would be 10g × its grade, though none leaves
    expect(() => refundOf('apple')).toThrow(RangeError)
  })

  it('carries goods over at ★1 and refunds the rest', () => {
    expect(carryMaterials({ 'silver-ingot': 3, carrot: 2, 'cut-quartz': 1, 'weapon-gem-g3': 2, 'chopped-carrot': 4, carp: 0 })).toEqual({
      items: { 'silver-ingot': [3, 0, 0, 0, 0], carrot: [2, 0, 0, 0, 0], 'cut-quartz': [1, 0, 0, 0, 0] },
      refund: 2 * 450 + 4 * 15,
    })
  })
})

describe('step 3: Craft Level becomes her rank (CS32)', () => {
  it.each<[number, number, number]>([
    [1, 0, 0], [5, 0, 32], [6, 1, 40], [15, 1, 148], [16, 2, 160], [25, 2, 376],
    [26, 3, 400], [35, 3, 850], [36, 4, 900], [45, 4, 1890], [46, 5, 2000], [50, 5, 2000],
  ])('Craft Lv %i is rank %i at %i points, in her line\'s activity', (level, rank, points) => {
    for (const [line, activity] of [['metal', 'mining'], ['stone', 'mining'], ['wood', 'foraging'], ['fish', 'fishing'], ['vegetables', 'farming']] as const) {
      expect(ranksFromCraft(level, line)).toEqual(Object.fromEntries([...novice(activity), [activity, { points, rank, challenge: 0 }]]))
    }
  })

  it('starts an outfit the release no longer has at Novice everywhere', () => {
    expect(ranksFromCraft(50, null)).toEqual(Object.fromEntries(novice()))
  })
})

describe('step 4: the roster', () => {
  const umas = (n: number, level = (_: number) => 10) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [String(1001 + i), { craft: { level: level(i), exp: 0 } }]))
  const metal = { lineOf: () => 'metal' as const }

  it('brings every Uma on day 1, and 10 Umas give Dorm level 4 (12 beds)', () => {
    const { roster, dorm } = rosterFromUmas(umas(10), metal.lineOf)
    expect(Object.keys(roster)).toHaveLength(10)
    expect(Object.values(roster).every((u) => u.joined === 1 && u.affinity === 0 && u.wellFed === 0)).toBe(true)
    expect(dorm).toEqual({ level: 4, home: Object.keys(roster), swaps: [] })
  })

  it('puts 61 Umas in Dorm level 10, the one with the fewest mapped points away', () => {
    const { roster, dorm } = rosterFromUmas(umas(61, (i) => (i === 7 ? 1 : 10)), metal.lineOf)
    expect(Object.keys(roster)).toHaveLength(61)
    expect(dorm.level).toBe(10)
    expect(dorm.home).toHaveLength(60)
    expect(dorm.home).not.toContain('1008')
  })

  it('breaks ties by outfit id', () => {
    const { dorm } = rosterFromUmas(umas(61), metal.lineOf)
    expect(dorm.home).not.toContain('1061')
    expect(dorm.home[0]).toBe('1001')
  })

  it('keeps an empty roster in Dorm level 1', () => {
    expect(rosterFromUmas({}, metal.lineOf)).toEqual({ roster: {}, dorm: { level: 1, home: [], swaps: [] } })
  })
})

describe('the whole migration (CS54)', () => {
  it('carries a v2 save mid-play into day 1', () => {
    const before = midPlay()
    const after = migrateToV3(before, context)
    expect(parseSaveV3(JSON.parse(JSON.stringify(after)))).toEqual(after)
    // Steps 1 and 2: the job's items land, then 2 Chopped Carrots, an Arms Gem G3 and a Moon Jewel II are refunded.
    expect(after.gold).toBe(500 + 2 * 15 + 450 + 300)
    expect(after.items).toEqual({
      'seed-carrot': [9, 0, 0, 0, 0], carrot: [1, 0, 0, 0, 0], 'copper-ore': [3, 0, 0, 0, 0], 'pine-log': [4, 0, 0, 0, 0],
      carp: [2, 0, 0, 0, 0], 'cut-quartz': [1, 0, 0, 0, 0], 'silver-ingot': [3, 0, 0, 0, 0],
    })
    // Step 3: 101's job took her to Craft Lv 6 first, so she is a Hand miner.
    expect(after.roster['101']?.ranks.mining).toEqual({ points: 40, rank: 1, challenge: 0 })
    expect(after.roster['202']?.ranks.farming).toEqual({ points: 0, rank: 0, challenge: 0 })
    expect(after.roster['303']?.ranks.fishing).toEqual({ points: 256, rank: 2, challenge: 0 })
    expect(Object.values(after.roster['404']!.ranks).every((r) => r.rank === 0 && r.points === 0)).toBe(true)
    // Step 4: four Umas, Dorm level 2 (5 beds), free.
    expect(after.dorm).toEqual({ level: 2, home: ['101', '202', '303', '404'], swaps: [] })
    expect(after.buildings).toEqual({ dorm: 2 })
    // Steps 5 and 6: day 1, Block A, chapter 1, everything else empty.
    const fresh = newSave('u1', before.account.createdAt)
    expect(after.calendar).toEqual({ day: 1 })
    expect(after.fields).toEqual(fresh.fields)
    expect(after.farm).toEqual(fresh.farm)
    expect(after.work).toEqual({})
    expect({ ...after, account: fresh.account, gold: fresh.gold, items: fresh.items, roster: {}, dorm: fresh.dorm, buildings: fresh.buildings }).toEqual(fresh)
  })

  it('never moves the account, v1 → v2 → v3 included', () => {
    const account = { uid: 'u1', createdAt: iso(T0), updatedAt: LATER }
    expect(migrateToV3(midPlay(), context).account).toEqual(account)
    const v2 = parseSave({ version: 1, account }) as SaveV2
    expect(v2.account).toEqual(account)
    expect(migrateToV3(v2, context).account).toEqual(account)
    expect(migrateToV3(toV2({ version: 1, account }), context)).toEqual({ ...newSave('u1', iso(T0)), account })
  })

  it('is deterministic: two devices migrate the same save the same way', () => {
    expect(migrateToV3(midPlay(), context)).toEqual(migrateToV3(midPlay(), context))
  })
})
