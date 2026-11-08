// Every building the Wilds map draws is on the pinned uma-art sheet (from uma-rpg's buildings.test.ts at 30a322a, F5): the
// fifteen places' frames, and the Forge's and the Post's borrowed ones. Five rows of three, gather → process → make.
import atlas from '@luismlorenzana/uma-art/buildings/atlas.json'
import { PLACES_V4, wildsPlaces } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { SOON_PLACES } from './soon'

const frames: Readonly<Record<string, { page: string; w: number; h: number }>> = atlas.frames

describe('the Wilds\' buildings', () => {
  it('finds a frame for every place and placeholder on the pinned sheet', () => {
    for (const place of wildsPlaces()) expect(frames[place.frame ?? place.id], place.id).toMatchObject({ w: 48, h: 48 })
    for (const place of SOON_PLACES) expect(frames[place.frame], place.id).toMatchObject({ w: 48, h: 48 })
    expect(SOON_PLACES.map((p) => [p.id, p.frame, p.opens])).toEqual([['forge', 'forge', 'M4'], ['post', 'card-library', 'M5']])
  })

  it('lays the fifteen in five rows of three, each line gather → process → make, left to right', () => {
    const places = wildsPlaces()
    expect(places.map((p) => p.id)).toEqual(PLACES_V4.map((p) => p.id))
    const rows = [0, 1, 2, 3, 4].map((r) => places.slice(r * 3, r * 3 + 3))
    for (const row of rows) {
      expect(row.map((p) => p.at.x)).toEqual([0.2, 0.5, 0.8])
      expect(new Set(row.map((p) => p.at.y)).size).toBe(1)
      expect(row.map((p) => PLACES_V4.find((q) => q.id === p.id)!.kinds[0])).toEqual(['gather', 'refine', expect.stringMatching(/craft|cut/)])
    }
    // The placeholders stand in a sixth row below, between the columns.
    for (const soon of SOON_PLACES) expect(soon.at.y).toBeGreaterThan(Math.max(...places.map((p) => p.at.y)))
  })
})
