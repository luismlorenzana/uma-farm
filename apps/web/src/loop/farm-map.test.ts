// The farm map (F18 decision 5): eight rows of three on the Hub's tile grid, every building on the pinned uma-art sheet,
// and each place's lock in its quick look's words.
import atlas from '@luismlorenzana/uma-art/buildings/atlas.json'
import { FARM_PLACES, farmPlace, newSave } from '@farm/domain'
import { placeCell } from '@luismlorenzana/uma-kit/hub'
import { describe, expect, it } from 'vitest'
import { FARM_MAP_TILES, lockOf, placeAt } from './farm-map'

const frames: Readonly<Record<string, { w: number; h: number }>> = atlas.frames
const day1 = newSave('u1', '2026-11-09T10:00:00.000Z')

describe('the farm map', () => {
  it('finds every place\'s building on the pinned sheet', () => {
    for (const place of FARM_PLACES) expect(frames[place.frame], place.id).toMatchObject({ w: 48, h: 48 })
  })

  it('stands the rows four tiles apart on the tile grid, taller than a phone\'s screen', () => {
    expect(FARM_MAP_TILES).toBe(36)
    expect(FARM_MAP_TILES * 24).toBeGreaterThan(844 - 44 - 56 - 47 - 34)
    const cells = FARM_PLACES.map((p) => placeCell(placeAt(p), 17, FARM_MAP_TILES))
    expect([...new Set(cells.map((c) => c.row))]).toEqual([3, 7, 11, 15, 19, 23, 27, 31])
    expect(FARM_PLACES.filter((p) => p.row === 1).map((p) => placeAt(p).x)).toEqual([0.2, 0.5, 0.8])
  })

  it('says what opens a locked place, and "Soon" for one whose screens haven\'t landed', () => {
    const lock = (id: string, save = day1) => lockOf(save, farmPlace(id)!)
    expect([lock('mine'), lock('sawmill'), lock('mill'), lock('coop'), lock('board'), lock('fields')]).toEqual([
      'Chapter 3', 'Farm Rank 3', 'Chapter 1’s reward', 'Chapter 2', 'Soon', 'Soon',
    ])
    expect(lockOf(day1, farmPlace('fields')!, new Set(['fields']))).toBeNull()
  })
})
