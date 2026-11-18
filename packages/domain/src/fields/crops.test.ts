// The crops: the table row for row, and a crop's stages (its watered nights to ripe) from its growth days.
import { describe, expect, it } from 'vitest'
import { SEASONS } from '../farm/calendar'
import { CROP_IDS, goodOf, LEGACY_CROP_IDS, refinedOf } from '../goods/ids'
import { CROPS, growsIn, nightsToReady, readyAt, SHOP_SEEDS } from './crops'
import { stagesOf } from './fields'

/** The days column: a crop's growth days, its stages. */
const DAYS: Readonly<Record<string, number>> = {
  carrot: 4, potato: 6, mint: 4, onion: 5, cabbage: 8, asparagus: 10, tomato: 7, basil: 4, 'bell-pepper': 6, eggplant: 6, 'sunflower-seed': 8, corn: 9,
  wheat: 5, peanut: 4, rice: 6, 'sugar-beet': 6, 'emperor-pumpkin': 10, buckwheat: 4, oats: 5, barley: 5, rye: 6, ginger: 9,
  'golden-carrot': 6, sunwheat: 7, moonrice: 7, 'wild-rice': 6, mandrake: 8,
}

describe('the crops', () => {
  it('has 51 crops, 46 from the shop and 5 rare', () => {
    expect(Object.keys(CROPS)).toEqual([...CROP_IDS])
    expect(Object.values(CROPS).filter((c) => c.tier !== 'rare')).toHaveLength(46)
    expect(Object.values(CROPS).filter((c) => c.tier === 'rare').map((c) => c.id)).toEqual(['golden-carrot', 'sunwheat', 'moonrice', 'wild-rice', 'mandrake'])
    for (const crop of Object.values(CROPS)) {
      expect(crop.seed === null, crop.id).toBe(crop.tier === 'rare')
      expect(crop.station !== null, crop.id).toBe(refinedOf(crop.id) !== null)
      expect(goodOf(crop.id)?.price, crop.id).toBeGreaterThan(0)
    }
  })

  it.each(LEGACY_CROP_IDS.map((id) => [id]))('%s: its stages are its growth days, a stage a watered night', (id) => {
    expect(CROPS[id].days).toBe(DAYS[id])
    expect(stagesOf(id, false)).toBe(DAYS[id])
    expect(nightsToReady(id, 1)).toBe(DAYS[id])
  })

  it('names the worked rows: Carrot 4, Potato 6, Asparagus 10', () => {
    expect(['carrot', 'potato', 'asparagus'].map((id) => stagesOf(id as 'carrot', false))).toEqual([4, 6, 10])
    expect(readyAt('carrot', false)).toBe(3.5)
  })

  it('regrows on its own count: Tomato every 3 days, Eggplant and Corn every 4', () => {
    expect(readyAt('tomato', true)).toBe(2.5)
    expect(nightsToReady('tomato', 1, true)).toBe(3)
    expect(stagesOf('tomato', true)).toBe(3)
    expect(readyAt('eggplant', true)).toBe(3.5)
    expect(readyAt('corn', true)).toBe(3.5)
    expect(readyAt('carrot', true)).toBe(3.5)
    expect(Object.values(CROPS).filter((c) => c.regrows !== null).map((c) => c.id)).toEqual(['mint', 'tomato', 'basil', 'bell-pepper', 'eggplant', 'corn', 'green-peas', 'strawberry', 'cucumber', 'okra'])
  })

  it('sells the original six and six new seeds each season', () => {
    for (const season of SEASONS) {
      expect(SHOP_SEEDS[season]).toHaveLength(12)
      const tiers = SHOP_SEEDS[season].slice(0, 6).map((id) => CROPS[id].tier)
      expect(tiers, season).toEqual([1, 1, 1, 2, 2, 4])
      for (const id of SHOP_SEEDS[season]) expect(growsIn(id, season), `${id} in ${season}`).toBe(true)
    }
    expect(SHOP_SEEDS.spring.slice(0, 6)).toEqual(['carrot', 'potato', 'mint', 'onion', 'cabbage', 'asparagus'])
    expect(SHOP_SEEDS.autumn.slice(3, 6)).toEqual(['sugar-beet', 'onion', 'emperor-pumpkin'])
    expect(SHOP_SEEDS.winter.slice(3, 6)).toEqual(['rye', 'cabbage', 'ginger'])
  })

  it('carries over only where seasons join: Corn Summer → Autumn, Cabbage Winter → Spring', () => {
    const next = (s: number) => SEASONS[(s + 1) % 4]!
    const carried = Object.values(CROPS).flatMap((c) => SEASONS.flatMap((season, i) => (growsIn(c.id, season) && growsIn(c.id, next(i)) ? [`${c.id} ${season}`] : [])))
    expect(carried).toEqual(['cabbage winter', 'corn summer'])
  })
})
