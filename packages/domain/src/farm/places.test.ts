// The farm map's places: eight rows of three, the frames, and what opens each.
import { describe, expect, it } from 'vitest'
import { LOOP_WORK_PLACES } from '../save/parse-v3'
import { newSave } from '../save/v3'
import { FARM_MAP_ROWS, FARM_PLACES, farmPlace, placeOpen } from './places'

describe('the farm map', () => {
  it('lays the rows: gathering, its station and the ranch or a workshop; the yard; the town edge', () => {
    const rows = Array.from({ length: FARM_MAP_ROWS }, (_, r) => FARM_PLACES.filter((p) => p.row === r + 1).map((p) => p.name))
    expect(rows).toEqual([
      ['Fields', 'Mill', 'Coop'], ['Forest', 'Sawmill', 'Barn'], ['Fishery', 'Smokehouse', 'Kitchen'], ['Mine', 'Smelter', 'Restaurant'],
      ['Quarry', 'Cutter', 'Forge'], ['Shipping bin', 'Warehouse', 'Dorm'], ['Requests board', 'Gate'], ['Shop', 'Festival ground', 'Expedition post'],
    ])
    for (const p of FARM_PLACES) expect(p.col).toBe(FARM_PLACES.filter((q) => q.row === p.row).indexOf(p))
    expect(new Set(FARM_PLACES.map((p) => p.frame)).size).toBe(FARM_PLACES.length)
    expect(FARM_PLACES.filter((p) => p.borrowed).map((p) => p.id)).toEqual(['coop', 'board', 'expeditions'])
    for (const id of LOOP_WORK_PLACES) expect(farmPlace(id), id).toBeDefined()
  })

  it('opens day 1\'s places and keeps the rest locked by chapter or Farm Rank', () => {
    const day1 = newSave('u1', '2026-11-09T10:00:00.000Z')
    const open = (save: typeof day1) => FARM_PLACES.filter((p) => placeOpen(save, p)).map((p) => p.id)
    expect(open(day1)).toEqual(['fields', 'forest', 'fishery', 'bin', 'warehouse', 'dorm', 'gate', 'shop'])
    expect(open({ ...day1, farm: { ...day1.farm, chapter: 2 } })).toEqual(['fields', 'mill', 'coop', 'forest', 'barn', 'fishery', 'bin', 'warehouse', 'dorm', 'gate', 'shop'])
    expect(open({ ...day1, farm: { ...day1.farm, chapter: 3, points: 500 } })).toContain('sawmill')
    expect(open({ ...day1, farm: { ...day1.farm, chapter: 9, points: 22_000 } })).not.toContain('board')
  })
})
