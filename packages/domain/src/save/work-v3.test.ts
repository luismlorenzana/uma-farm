// Copied from uma-rpg packages/domain/src/save/work-v3.test.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The Wilds' work (H77; profession-progression.md §4–§5, PP4, PP16; the farm by line since H112, D224): the farm's env,
// four slots a place, no levels, collects, and the trade gate through the operations' context and none for settles.
import { describe, expect, it } from 'vitest'
import { jobExp, stepMinutes } from '../economy/pacing'
import { tradeOfCalling } from '../economy/professions'
import type { UmaCallingClass } from '../roster/template'
import { ECONOMY_V3_NOW, gradedUma, gradedWorld } from '../work/world.fixture'
import type { Save } from './save'
import { availableWorkers, checkRestartStopped, collectJob, planJob, queueJob, readyWork, repeatJob, slotJobOf, startJob } from './work'

const T0 = Date.parse(ECONOMY_V3_NOW)
const at = (ms: number) => new Date(T0 + ms).toISOString()
/** One Craft Lv 1 step in a slot: 24 minutes ÷ 1.25. */
const GATHER_MS = Math.round((stepMinutes(1) * 60) / 1.25) * 1000

function worldOf(umas: Record<string, number>, items: Record<string, number> = {}): Save {
  const world = gradedWorld({ items, umas: Object.fromEntries(Object.entries(umas).map(([id, level]) => [id, gradedUma({ craft: { level, exp: 0 } })])) })
  return { version: 2, account: { uid: 'u1', createdAt: ECONOMY_V3_NOW, updatedAt: ECONOMY_V3_NOW }, ...world }
}
const tradesOf = (callings: Record<string, UmaCallingClass>) => ({ tradeOf: (id: string) => (callings[id] ? tradeOfCalling(callings[id]!) : null) })

describe('the Wilds\' places over the save', () => {
  it('starts jobs in slots 0–3 of a place and refuses slot 4', () => {
    let world = worldOf({ 101: 1, 102: 1, 103: 1, 104: 1, 105: 1 })
    for (const [slot, id] of ['101', '102', '103', '104'].entries()) world = startJob(world, 'mine', slot, { outfitId: id }, 'copper-ore', 1, at(0))
    expect(Object.values(world.work).map((row) => row.slot?.slot)).toEqual([0, 1, 2, 3])
    expect(() => startJob(world, 'mine', 4, { outfitId: '105' }, 'copper-ore', 1, at(0))).toThrow("slot 4 doesn't exist")
    expect(() => startJob(world, 'quarry', 0, { outfitId: '105' }, 'limestone', 1, at(0))).toThrow()
  })

  it('collects the items and the Craft EXP', () => {
    const world = startJob(worldOf({ 101: 1 }), 'mine', 0, { outfitId: '101' }, 'copper-ore', 2, at(0))
    expect(slotJobOf(world, '101', at(GATHER_MS))?.finished).toBe(1)
    expect([...readyWork(world, at(2 * GATHER_MS))]).toEqual([['mine', 1]])
    const { save: after, got } = collectJob(world, 'mine', 0, at(2 * GATHER_MS))
    expect(got).toEqual({ items: 2, exp: 2 * jobExp(stepMinutes(1)), levelsUp: 0, done: true })
    expect(after.items).toEqual({ 'copper-ore': 2 })
    expect(after.umas['101']!.craft).toEqual({ level: 1, exp: 96 })
    expect(availableWorkers(after, at(2 * GATHER_MS)).has('101')).toBe(true)
  })

  it('makes a made item from the Warehouse and pays it back into it: 10 Ingots, one step each', () => {
    let world = worldOf({ 101: 1 }, { 'copper-ingot': 11, 'pine-plank': 3 })
    world = startJob(world, 'weapon-forge', 0, { outfitId: '101' }, 'weapon-gem-g1', 1, at(0))
    expect(world.items).toEqual({ 'copper-ingot': 1, 'pine-plank': 3 })
    const done = collectJob(world, 'weapon-forge', 0, at(10 * GATHER_MS)).save
    expect(done.items).toEqual({ 'copper-ingot': 1, 'pine-plank': 3, 'weapon-gem-g1': 1 })
  })

  it('plans each grade opening at Craft Lv 5g − 4 (FL6)', () => {
    expect(() => startJob(worldOf({ 101: 1 }), 'mine', 0, { outfitId: '101' }, 'gold-ore', 1, at(0))).toThrow('Needs Craft Lv26')
    const plan = planJob(worldOf({ 101: 46 }), 'lapidary', { outfitId: '101' }, 'jewel-moon-5', 1)!
    expect(plan.inputs).toEqual({ 'cut-philosophers-stone': 5 })
    expect(plan.output).toEqual({ id: 'jewel-moon-5', name: 'Moon Jewel V', grade: 10 })
    expect(plan.block).toBe("Needs 5 Cut Philosopher's Stone")
    expect(planJob(worldOf({ 101: 1 }), 'mine', { outfitId: '101' }, 'iron-ore')).toMatchObject({
      output: { id: 'iron-ore', name: 'Iron Ore', grade: 3 }, itemMs: GATHER_MS, block: 'Needs Craft Lv11' })
  })

  it('gates a job by her trade when the caller says it, and never a settle or a queue start', () => {
    // 101 a Mage, 102 a Warrior: the Mine is the Warrior's.
    const context = tradesOf({ 101: 'apprentice', 102: 'recruit' })
    const world = worldOf({ 101: 1, 102: 1 }, { 'copper-ore': 4 })
    expect(() => startJob(world, 'mine', 0, { outfitId: '101' }, 'copper-ore', 1, at(0), context)).toThrow('Another trade')
    expect(planJob(world, 'mine', { outfitId: '101' }, 'copper-ore', 1, context)?.block).toBe('Another trade')
    // The Fields Workbench is the healers' and the world has none: an open shop.
    let running = startJob({ ...world, items: { ...world.items, carrot: 2 } }, 'fields-workbench', 0, { outfitId: '101' }, 'chopped-carrot', 1, at(0), context)
    running = startJob(running, 'mine', 0, { outfitId: '102' }, 'copper-ore', 1, at(0), context)
    expect(() => queueJob(running, 'mine', 0, { outfitId: '102' }, 'iron-ore', 1, at(0), context)).toThrow('Needs Craft Lv11')
    running = queueJob(running, 'mine', 0, { outfitId: '102' }, 'copper-ore', 1, at(0), context)
    // Settled with no context, the queued job starts when the first ends.
    expect(slotJobOf(running, '102', at(GATHER_MS + 1000))?.output).toBe('copper-ore')
    // Repeat keeps the gate: the Mage can't repeat at a place her trade lost.
    const done = collectJob(running, 'fields-workbench', 0, at(GATHER_MS)).save
    const withHealer = { ...done, umas: { ...done.umas, '103': gradedUma() } }
    const healer = tradesOf({ 101: 'apprentice', 102: 'recruit', 103: 'acolyte' })
    expect(() => repeatJob(withHealer, '101', at(GATHER_MS), healer)).toThrow('Another trade')
    expect(repeatJob(withHealer, '101', at(GATHER_MS)).work['101']?.entries).toHaveLength(1)
    expect(checkRestartStopped(withHealer, '101', T0 + GATHER_MS, healer)).toBeNull()
  })
})
