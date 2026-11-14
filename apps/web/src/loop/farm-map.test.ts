// The farm map: eight rows of three on the Hub's tile grid, every building on the pinned uma-art sheet,
// and each place's lock in its quick look's words.
import atlas from '@luismlorenzana/uma-art/buildings/atlas.json'
import { FARM_PLACES, farmPlace, newSave } from '@farm/domain'
import { placeCell } from '@luismlorenzana/uma-kit/hub'
import { describe, expect, it } from 'vitest'
import { FARM_MAP_TILES, lockOf, placeAt, placeLink } from './farm-map'

const frames: Readonly<Record<string, { w: number; h: number }>> = atlas.frames
const day1 = newSave('u1', '2026-11-09T10:00:00.000Z')

describe('the farm map', () => {
  it('finds every place\'s building on the pinned sheet', () => {
    for (const place of FARM_PLACES) expect(frames[place.frame], place.id).toMatchObject({ w: 48, h: 48 })
  })

  it('stands the rows four tiles apart on the tile grid, taller than a phone\'s screen', () => {
    expect(FARM_MAP_TILES).toBe(40)
    expect(FARM_MAP_TILES * 24).toBeGreaterThan(844 - 44 - 56 - 47 - 34)
    const cells = FARM_PLACES.map((p) => placeCell(placeAt(p), 17, FARM_MAP_TILES))
    expect([...new Set(cells.map((c) => c.row))]).toEqual([3, 7, 11, 15, 19, 23, 27, 31, 35])
    // The Town stands alone in the middle of the last row, its screen at /town.
    expect(placeAt(farmPlace('town')!).x).toBe(0.5)
    expect(placeLink(day1, farmPlace('town')!)).toBe('/town')
    expect(FARM_PLACES.filter((p) => p.row === 1).map((p) => placeAt(p).x)).toEqual([0.2, 0.5, 0.8])
  })

  it('says what opens a locked place, and "Soon" for one whose screens haven\'t landed', () => {
    const lock = (id: string, save = day1) => lockOf(save, farmPlace(id)!)
    expect([lock('mine'), lock('sawmill'), lock('mill'), lock('coop'), lock('board'), lock('kitchen'), lock('dock'), lock('fields')]).toEqual([
      'Not built yet', 'Farm Rank 3', 'Not built', 'Not built yet', '5 Umas met', 'Not built yet', 'Farm Rank 6', null,
    ])
    // Paid today, it builds tonight; built, the Dock opens its quick look (the Boat's Build).
    expect(lock('mill', { ...day1, farm: { ...day1.farm, builds: ['mill'] } })).toBe('Builds tonight')
    expect(lock('dock', { ...day1, buildings: { ...day1.buildings, dock: 1 } })).toBeNull()
    expect(lockOf(day1, farmPlace('festival')!, new Set(['festival']))).toBe('Soon')
    // The Dorm opens its page, the Gate its quick look.
    expect([lock('dorm'), lock('gate')]).toEqual([null, null])
    expect(placeLink(day1, farmPlace('dorm')!)).toBe('/dorm')
    expect(placeLink(day1, farmPlace('gate')!)).toBe('/?peek=gate')
    // The Fields open their quick look, which leads to their page; so do the forest's and the Fishery's.
    expect(placeLink(day1, farmPlace('fields')!)).toBe('/?peek=fields')
    expect([lock('forest'), lock('fishery')]).toEqual([null, null])
    expect(placeLink(day1, farmPlace('forest')!)).toBe('/?peek=forest')
    // A station is locked until built; once Farm Rank 3 opens it, its quick look offers Build.
    const fr3 = { ...day1, farm: { ...day1.farm, points: 250 } }
    expect(lock('sawmill', fr3)).toBe('Not built')
    expect(placeLink(fr3, farmPlace('sawmill')!)).toBe('/?peek=sawmill')
    expect(lock('sawmill', { ...fr3, buildings: { ...fr3.buildings, sawmill: 1 } })).toBeNull()
  })
})
