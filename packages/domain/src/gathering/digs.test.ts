// The Mine and the Quarry: a face's finds by the floor's grade, the stairs found and taken, the deepest floor kept, the
// Farm Rank's reach, the Smelter and the Cutter, and the save.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS } from '../farm/actions'
import { goodOf } from '../goods/ids'
import { runNight } from '../night/end-day'
import { parseSaveV6 } from '../save/parse-v4'
import { DEEPEST_FLOOR, newSave, type SaveV4 } from '../save/v4'
import { digFloor, floorFinds, floorRank, gradeAt, reachFloor, stairsAfter, stairsFound, stairsLock, takeStairs, workFace } from './digs'
import { startLoad } from './stations'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** A farm at Farm Rank 5 with the Mine, the Quarry, the Smelter and the Cutter built. */
function farm(points = 2200): SaveV4 {
  const save = newSave('digs', AT)
  return { ...save, farmer: { name: 'Sim' }, farm: { ...save.farm, points }, buildings: { ...save.buildings, mine: 1, quarry: 1, smelter: 1, cutter: 1 } }
}
const fresh = (save: SaveV4): SaveV4 => ({ ...save, today: { ...save.today, actions: 0 } })

describe('the floors', () => {
  it('grade every three floors, G1 to G10, and find each floor\'s stairs after 1 + ⌈floor ÷ 5⌉ faces', () => {
    expect([1, 3, 4, 15, 28, 30].map(gradeAt)).toEqual([1, 1, 2, 5, 10, 10])
    expect([1, 5, 6, 29].map(stairsAfter)).toEqual([2, 2, 3, 7])
    expect(floorFinds('mine', 1)).toEqual(['copper-ore', 'tin-ore'])
    expect(floorFinds('quarry', 30)).toEqual(['meteorite', 'runestone', 'philosophers-stone', 'starstone'])
  })

  it('reach as deep as the Farm Rank: floor 5 at 1, 10 at 2, 15 at 4, 20 at 6, 25 at 8, 30 at 10', () => {
    expect([0, 150, 950, 3750, 9750, 21750].map((points) => reachFloor({ farm: { ...farm().farm, points } }))).toEqual([5, 10, 15, 20, 25, 30])
    expect([5, 6, 11, 16, 30].map(floorRank)).toEqual([1, 2, 4, 6, 10])
  })
})

describe('working a face', () => {
  it('takes an action on the deepest floor: two finds of its grade or the next, into the Warehouse, and a face toward the stairs', () => {
    const { save, face } = workFace(farm(), 'mine')
    expect(face.floor).toBe(1)
    expect(face.items).toHaveLength(2)
    for (const key of face.items) expect(['copper-ore@1', 'tin-ore@1']).toContain(key)
    expect(save.places.mine).toEqual({ deepest: 1, stairs: 1 })
    expect(actionsLeft(save)).toBe(DAY_ACTIONS - 1)
    expect(['copper-ore', 'tin-ore'].reduce((n, id) => n + (save.items[id]?.[0] ?? 0), 0)).toBe(2)
    expect(() => workFace({ ...farm(), buildings: { dorm: 1 } }, 'mine')).toThrow('Build it first.')
  })

  it('finds stone or gems at the Quarry', () => {
    let save = farm()
    const families = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const done = workFace(fresh(save), 'quarry')
      save = done.save
      for (const key of done.face.items) families.add(goodOf(key.split('@')[0]!)!.family)
    }
    expect([...families].sort()).toEqual(['crystals', 'stones'])
  })

  it('finds the stairs and takes them free: three floors worked in six faces, the deepest floor kept', () => {
    let save = farm()
    expect(stairsLock(save, 'mine')).toBe('Find the stairs first: 2 more faces.')
    for (let floor = 1; floor <= 3; floor++) {
      save = workFace(save, 'mine').save
      const second = workFace(save, 'mine')
      expect(second.face.stairs).toBe(true)
      save = second.save
      expect(stairsFound(save.places.mine)).toBe(true)
      if (floor < 3) {
        const before = save.today.actions
        save = takeStairs(save, 'mine')
        expect(save.today.actions).toBe(before)
        expect(digFloor(save.places.mine)).toBe(floor + 1)
      }
    }
    expect(save.today.actions).toBe(6)
    expect(save.places.mine).toEqual({ deepest: 3, stairs: 2 })
    // The deepest floor is kept: the next day starts there.
    const next = runNight(save, {})
    expect(next.places.mine.deepest).toBe(3)
    expect(workFace(next, 'mine').face.floor).toBe(3)
  })

  it('stops at the Farm Rank\'s reach, and at the last floor', () => {
    const edge = { ...farm(950), places: { ...farm().places, mine: { deepest: 15, stairs: stairsAfter(15) } } }
    expect(stairsLock(edge, 'mine')).toBe('Floor 16 opens at Farm Rank 6.')
    expect(() => takeStairs(edge, 'mine')).toThrow('Floor 16 opens at Farm Rank 6.')
    const last = { ...farm(30_000), places: { ...farm().places, mine: { deepest: DEEPEST_FLOOR, stairs: 0 } } }
    expect(stairsLock(last, 'mine')).toBe('This is the deepest floor.')
    expect(workFace(last, 'mine').save.places.mine).toEqual({ deepest: DEEPEST_FLOOR, stairs: 0 })
  })
})

describe('the Smelter and the Cutter', () => {
  it('take a load for an action: ore into ingots, gems cut, stone into blocks, ready the next morning', () => {
    const save: SaveV4 = { ...farm(), items: { 'iron-ore': [4, 0, 0, 0, 0], quartz: [2, 0, 0, 0, 0] } }
    const loaded = startLoad(startLoad(save, 'smelter', 'iron-ingot@1', 4), 'cutter', 'cut-quartz@1', 2)
    expect(loaded.today.actions).toBe(2)
    const morning = runNight(loaded, {})
    expect(morning.items['iron-ingot']).toEqual([4, 0, 0, 0, 0])
    expect(morning.items['cut-quartz']).toEqual([2, 0, 0, 0, 0])
    expect(() => startLoad({ ...save, buildings: { dorm: 1 } }, 'smelter', 'iron-ingot@1', 1)).toThrow('Build it first.')
  })
})

describe('the save', () => {
  it('keeps the digs the parse takes', () => {
    const { save } = workFace(farm(), 'quarry')
    expect(parseSaveV6(json(save))).toEqual(save)
  })
})
