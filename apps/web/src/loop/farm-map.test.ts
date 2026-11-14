// The farm map: a landscape tile map, the woods' edge, the field over the pond's edge, the lots and the road to town;
// every building on the pinned uma-art sheet, and each place's lock in its quick look's words.
import atlas from '@luismlorenzana/uma-art/buildings/atlas.json'
import { FARM_PLACES, farmPlace, FIELD_TILES, HOMESTEAD_PLACES, homesteadShown, newSave } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { FIELD, LOT_COLUMNS, lockOf, MAP_ROWS, mapLots, placeLink, POND, tileArea, WOODS } from './farm-map'

const frames: Readonly<Record<string, { w: number; h: number }>> = atlas.frames
const day1 = newSave('u1', '2026-11-09T10:00:00.000Z')

describe('the farm map', () => {
  it('finds every place\'s building, and every house\'s, on the pinned sheet', () => {
    for (const place of FARM_PLACES) expect(frames[place.frame], place.id).toMatchObject({ w: 48, h: 48 })
    for (const house of HOMESTEAD_PLACES) expect(frames[house.frame], house.id).toMatchObject({ w: 48, h: 48 })
    expect(frames.forest).toBeDefined()
    expect(frames.fishery).toBeDefined()
  })

  it('lays the woods\' edge, the field over the pond\'s edge, the lots and the road side by side, seven cells tall', () => {
    expect(MAP_ROWS).toBe(7)
    expect(WOODS).toEqual({ col: 0, row: 0, cols: 2, rows: 7 })
    expect(FIELD).toEqual({ col: 2, row: 0, cols: 8, rows: 5 })
    expect(POND).toEqual({ col: 2, row: 5, cols: 8, rows: 2 })
    expect(tileArea(0)).toEqual({ col: 2, row: 0, cols: 1, rows: 1 })
    expect(tileArea(FIELD_TILES - 1)).toEqual({ col: 9, row: 4, cols: 1, rows: 1 })
    // Day 1: the yard, the homestead's first column, the other five columns, then the road.
    const { lots, road, cols } = mapLots(homesteadShown(day1))
    expect(lots).toHaveLength(LOT_COLUMNS.flat().length + 3)
    expect(lots.slice(0, 6).map((l) => (l.kind === 'place' ? l.id : l.place.id))).toEqual(['bin', 'warehouse', 'dorm', 'farmhouse', 'house-1', 'house-2'])
    expect(lots[0]!.area).toEqual({ col: 11, row: 0, cols: 2, rows: 2 })
    expect(road).toEqual({ col: 11 + 7 * 2, row: 0, cols: 1, rows: 7 })
    expect(cols).toBe(road.col + 1)
    // Every place you work or build stands on a lot once; the town's are down the road.
    const onLots = new Set(lots.flatMap((l) => (l.kind === 'place' ? [l.id] : [])))
    expect(FARM_PLACES.filter((p) => !onLots.has(p.id)).map((p) => p.id)).toEqual(['fields', 'forest', 'fishery', 'shop', 'festival', 'expeditions', 'town', 'boat'])
  })

  it('says what opens a locked place, and "Soon" for one whose screens haven\'t landed', () => {
    const lock = (id: string, save = day1) => lockOf(save, farmPlace(id)!)
    expect([lock('mine'), lock('sawmill'), lock('mill'), lock('coop'), lock('board'), lock('kitchen'), lock('dock'), lock('fields')]).toEqual([
      'Farm Rank 4', 'Farm Rank 3', 'Not built', 'Farm Rank 2', '5 Umas met', 'Not built yet', 'Farm Rank 6', null,
    ])
    // Built, the Coop, the Barn, the Mine and the Quarry open their panels, as the Smelter and the Cutter do.
    const built = { ...day1, buildings: { ...day1.buildings, coop: 1, barn: 1, mine: 1, quarry: 1, smelter: 1, cutter: 1 } }
    expect(['coop', 'barn', 'mine', 'quarry', 'smelter', 'cutter'].map((id) => lock(id, built))).toEqual([null, null, null, null, null, null])
    // Paid today, it builds tonight; built, the Dock opens its quick look (the Boat's Build).
    expect(lock('mill', { ...day1, farm: { ...day1.farm, builds: ['mill'] } })).toBe('Builds tonight')
    expect(lock('dock', { ...day1, buildings: { ...day1.buildings, dock: 1 } })).toBeNull()
    expect(lockOf(day1, farmPlace('festival')!, new Set(['festival']))).toBe('Soon')
    // The Dorm opens its page, the Gate its quick look, the town its screen.
    expect([lock('dorm'), lock('gate')]).toEqual([null, null])
    expect(placeLink(day1, farmPlace('dorm')!)).toBe('/dorm')
    expect(placeLink(day1, farmPlace('gate')!)).toBe('/?peek=gate')
    expect(placeLink(day1, farmPlace('town')!)).toBe('/town')
    // The woods' edge and the pond's open their menus; the field is the map itself.
    expect([lock('forest'), lock('fishery')]).toEqual([null, null])
    expect(placeLink(day1, farmPlace('forest')!)).toBe('/?peek=forest')
    expect(placeLink(day1, farmPlace('fields')!)).toBe('/')
    // A station is locked until built; once Farm Rank 3 opens it, its quick look offers Build.
    const fr3 = { ...day1, farm: { ...day1.farm, points: 250 } }
    expect(lock('sawmill', fr3)).toBe('Not built')
    expect(placeLink(fr3, farmPlace('sawmill')!)).toBe('/?peek=sawmill')
    expect(lock('sawmill', { ...fr3, buildings: { ...fr3.buildings, sawmill: 1 } })).toBeNull()
  })
})
