// The farm map's places: eight rows of three (the yard's two since the Dorm retired) and the Town below them, the frames, and what opens each: day 1, a build
// the Farm Rank offers, or the Umas met.
import { describe, expect, it } from 'vitest'
import { LOOP_WORK_PLACES } from '../save/parse-v4'
import { newRosterUma, newSave } from '../save/v4'
import { BUILD_PLACES, FARM_MAP_ROWS, FARM_PLACE_IDS, FARM_PLACES, farmPlace, MAP_PLACES, placeBuilt, placeOpen, TOWN_FIRST_ROW } from './places'

describe('the farm map', () => {
  it('lays the rows: gathering, its station and the ranch or a workshop; the yard; the town edge, and the Town below it', () => {
    const rows = Array.from({ length: FARM_MAP_ROWS }, (_, r) => MAP_PLACES.filter((p) => p.row === r + 1).map((p) => p.name))
    expect(rows).toEqual([
      ['Fields', 'Mill', 'Coop'], ['Forest', 'Sawmill', 'Barn'], ['Fishery', 'Smokehouse', 'Kitchen'], ['Mine', 'Smelter', 'Restaurant'],
      ['Quarry', 'Cutter', 'Forge'], ['Shipping bin', 'Warehouse'], ['Requests board', 'Gate', 'Dock'], ['Shop', 'Festival ground', 'Expedition post'], ['Town'],
    ])
    // Each row fills from the left; the Town stands alone in the middle, under the Gate's spine.
    for (const p of MAP_PLACES) expect(p.col, p.id).toBe(p.id === 'town' ? 1 : MAP_PLACES.filter((q) => q.row === p.row).indexOf(p))
    expect(TOWN_FIRST_ROW).toBe(8)
    expect(new Set(MAP_PLACES.map((p) => p.frame)).size).toBe(MAP_PLACES.length)
    expect(FARM_PLACES.filter(p => p.borrowed)).toEqual([])
    const original = ['coop', 'board', 'dock', 'expeditions', 'town', 'boat']
    for (const id of original) expect(farmPlace(id)?.frame).toBe('building/' + id)
    for (const id of LOOP_WORK_PLACES) expect(farmPlace(id), id).toBeDefined()
  })

  it('has a place id for every place, the boat moored at the dock and drawn there', () => {
    expect(FARM_PLACES.map((p) => p.id)).toEqual([...FARM_PLACE_IDS])
    expect(FARM_PLACES.filter((p) => p.on).map((p) => [p.id, p.on])).toEqual([['boat', 'dock']])
    expect(farmPlace('boat')!.opens).toMatchObject({ by: 'build', rank: 6, after: 'dock', game: true })
  })

  it('offers every working place past the start at a Farm Rank, built with gold and the farm\'s goods', () => {
    expect(BUILD_PLACES.map((p) => [p.id, p.opens.rank, p.opens.game])).toEqual([
      ['mill', 1, true], ['coop', 2, true], ['sawmill', 3, true], ['barn', 3, true], ['smokehouse', 3, true], ['kitchen', 3, true], ['mine', 4, true],
      ['smelter', 4, true], ['restaurant', 7, true], ['quarry', 5, true], ['cutter', 5, true], ['forge', 3, true], ['dock', 6, true],
      ['expeditions', 7, true], ['boat', 6, true],
    ])
    for (const p of BUILD_PLACES) expect(p.opens.cost.gold, p.id).toBeGreaterThan(0)
    expect(farmPlace('mill')!.opens).toMatchObject({ cost: { gold: 1000, goods: [{ family: 'woods', refined: false, count: 20 }] } })
  })

  it('opens day 1\'s places, a build once it stands, and the board with five Umas met', () => {
    const day1 = newSave('u1', '2026-11-09T10:00:00.000Z')
    const open = (save: typeof day1) => FARM_PLACES.filter((p) => placeOpen(save, p)).map((p) => p.id)
    expect(open(day1)).toEqual(['fields', 'forest', 'fishery', 'bin', 'warehouse', 'gate', 'shop', 'festival', 'town'])
    // The Farm Rank alone builds nothing.
    expect(open({ ...day1, farm: { ...day1.farm, points: 22_000 } })).toEqual(open(day1))
    const built = { ...day1, buildings: { ...day1.buildings, mill: 1, dock: 1, boat: 1 } }
    expect(open(built)).toEqual(['fields', 'mill', 'forest', 'fishery', 'bin', 'warehouse', 'gate', 'dock', 'shop', 'festival', 'town', 'boat'])
    expect(placeBuilt(built, 'mill')).toBe(true)
    // A Mill paid for today, or an older save's plans (0), isn't built.
    expect(placeBuilt({ buildings: { dorm: 1, mill: 0 } }, 'mill')).toBe(false)
    const five = { ...day1, roster: Object.fromEntries(['1', '2', '3', '4', '5'].map((id) => [id, newRosterUma(1)])) }
    expect(open(five)).toContain('board')
    expect(open({ ...five, roster: { 1: newRosterUma(1) } })).not.toContain('board')
  })
})
