// Copied from uma-rpg packages/domain/src/hub/places-v3.test.ts at 30a322a, with its Wilds-only parts cut.
// The Wilds' trios on the Hub: fifteen places in five rows.
import { describe, expect, it } from 'vitest'
import { PLACES, placeById, type Place } from './places'

const spots = (list: readonly Place[]) => list.map((p) => [p.id, p.kind, p.at.x, p.at.y, p.frame ?? null, p.slots])

describe('the Wilds by generation', () => {
  it('draws fifteen places in five rows of three, workbenches on the trunk, four slots each', () => {
    expect(spots(PLACES)).toEqual([
      ['mine', 'gather-site', 0.2, 0.155, null, 4], ['mine-workbench', 'station', 0.5, 0.155, null, 4], ['weapon-forge', 'station', 0.8, 0.155, null, 4],
      ['fields', 'gather-site', 0.2, 0.315, 'vegetable-garden', 4], ['fields-workbench', 'station', 0.5, 0.315, null, 4], ['tome-forge', 'station', 0.8, 0.315, null, 4],
      ['forest', 'gather-site', 0.2, 0.475, null, 4], ['forest-workbench', 'station', 0.5, 0.475, null, 4], ['armorer', 'station', 0.8, 0.475, 'lancers-barracks', 4],
      ['fishery', 'gather-site', 0.2, 0.635, null, 4], ['fishery-workbench', 'station', 0.5, 0.635, null, 4], ['charm-forge', 'station', 0.8, 0.635, null, 4],
      ['monster-den', 'gather-site', 0.2, 0.795, null, 4], ['den-workbench', 'station', 0.5, 0.795, null, 4], ['lapidary', 'station', 0.8, 0.795, null, 4],
    ])
    expect(PLACES.every((p) => p.page === 'wilds' && p.blurb.length > 0 && p.details.length > 0)).toBe(true)
    expect(placeById('mine')?.blurb).toBe('Mining: metal, G1–G10.')
    expect(placeById('mine-workbench')?.blurb).toBe('Smelting: ores into ingots.')
    expect(placeById('tome-forge')?.blurb).toBe('Tome Crafting: Tome Ink.')
    expect(placeById('charm-forge')?.blurb).toBe('Accessory Crafting: Accessory Settings.')
  })

  it('has no place for the five removed ids', () => {
    for (const id of ['ley-spring', 'crystal-cavern', 'quarry', 'meadow', 'fossil-dig']) expect(placeById(id), id).toBeUndefined()
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length)
  })

  it('keeps the fifteen 44 pt apart on the smallest phone', () => {
    const list = PLACES
    for (const a of list) for (const b of list) {
      if (a !== b) expect(Math.hypot((a.at.x - b.at.x) * 375, (a.at.y - b.at.y) * 500), `${a.id} ↔ ${b.id}`).toBeGreaterThanOrEqual(66)
    }
  })
})
