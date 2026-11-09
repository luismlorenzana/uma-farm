// The crops (F20; CS11, CS12): CS11's table row for row, and its Novice and Expert columns derived by CS12's rule.
import { describe, expect, it } from 'vitest'
import { SEASONS } from '../farm/calendar'
import { CROP_PRICES } from '../goods/rule'
import { CROP_IDS, refinedOf } from '../goods/ids'
import { CROPS, growsIn, nightsToReady, readyAt, SHOP_SEEDS } from './crops'
import { TALENT_D } from '../farm/talents'
import { tendedGrowth, UNTENDED_GROWTH } from './fields'

/** CS11's "Days: untended · Novice · Expert" column, as the spec prints it. */
const CS11_DAYS: Readonly<Record<string, [number, number, number]>> = {
  carrot: [4, 3, 3], potato: [6, 5, 4], mint: [4, 3, 3], onion: [5, 4, 3], cabbage: [8, 6, 5], asparagus: [10, 8, 7],
  tomato: [7, 6, 5], basil: [4, 3, 3], 'bell-pepper': [6, 5, 4], eggplant: [6, 5, 4], 'sunflower-seed': [8, 6, 5], corn: [9, 7, 6],
  wheat: [5, 4, 3], peanut: [4, 3, 3], rice: [6, 5, 4], 'sugar-beet': [6, 5, 4], 'emperor-pumpkin': [10, 8, 7],
  buckwheat: [4, 3, 3], oats: [5, 4, 3], barley: [5, 4, 3], rye: [6, 5, 4], ginger: [9, 7, 6],
  'golden-carrot': [6, 5, 4], sunwheat: [7, 6, 5], moonrice: [7, 6, 5], 'wild-rice': [6, 5, 4], mandrake: [8, 6, 5],
}

describe('the crops (CS11)', () => {
  it('has the 27 crops, 22 from the shop and 5 rare', () => {
    expect(Object.keys(CROPS)).toEqual([...CROP_IDS])
    expect(Object.values(CROPS).filter((c) => c.tier !== 'rare')).toHaveLength(22)
    expect(Object.values(CROPS).filter((c) => c.tier === 'rare').map((c) => c.id)).toEqual(['golden-carrot', 'sunwheat', 'moonrice', 'wild-rice', 'mandrake'])
    for (const crop of Object.values(CROPS)) {
      expect(crop.seed === null, crop.id).toBe(crop.tier === 'rare')
      expect(crop.station !== null, crop.id).toBe(refinedOf(crop.id) !== null)
      expect(CROP_PRICES[crop.id], crop.id).toBeGreaterThan(0)
    }
  })

  it.each(CROP_IDS.map((id) => [id]))('%s: its Novice and Expert days follow from its untended days (CS12)', (id) => {
    const [untended, novice, expert] = CS11_DAYS[id]!
    expect(CROPS[id].days).toBe(untended)
    expect(nightsToReady(id, UNTENDED_GROWTH)).toBe(untended)
    expect(nightsToReady(id, tendedGrowth(0, TALENT_D))).toBe(novice)
    expect(nightsToReady(id, tendedGrowth(3, TALENT_D))).toBe(expert)
  })

  it('names the worked rows: Carrot 4 · 3 · 3, Potato 6 · 5 · 4, Asparagus 10 · 8 · 7', () => {
    const days = (id: 'carrot' | 'potato' | 'asparagus') => [1, 1.25, 1.55].map((g) => nightsToReady(id, g))
    expect(days('carrot')).toEqual([4, 3, 3])
    expect(days('potato')).toEqual([6, 5, 4])
    expect(days('asparagus')).toEqual([10, 8, 7])
    expect(readyAt('carrot', false)).toBe(3.5)
  })

  it('regrows on its own count: Tomato every 3 days, Eggplant and Corn every 4', () => {
    expect(readyAt('tomato', true)).toBe(2.5)
    expect(nightsToReady('tomato', 1, true)).toBe(3)
    expect(nightsToReady('tomato', 1.25, true)).toBe(2)
    expect(readyAt('eggplant', true)).toBe(3.5)
    expect(readyAt('corn', true)).toBe(3.5)
    expect(readyAt('carrot', true)).toBe(3.5)
    expect(Object.values(CROPS).filter((c) => c.regrows !== null).map((c) => c.id)).toEqual(['mint', 'tomato', 'basil', 'bell-pepper', 'eggplant', 'corn'])
  })

  it('sells six seeds a season by CS4\'s tiers: three at Farm Rank 1, two at FR2, one at FR4', () => {
    for (const season of SEASONS) {
      const tiers = SHOP_SEEDS[season].map((id) => CROPS[id].tier)
      expect(tiers, season).toEqual([1, 1, 1, 2, 2, 4])
      for (const id of SHOP_SEEDS[season]) expect(growsIn(id, season), `${id} in ${season}`).toBe(true)
    }
    expect(SHOP_SEEDS.spring).toEqual(['carrot', 'potato', 'mint', 'onion', 'cabbage', 'asparagus'])
    expect(SHOP_SEEDS.autumn.slice(3)).toEqual(['sugar-beet', 'onion', 'emperor-pumpkin'])
    expect(SHOP_SEEDS.winter.slice(3)).toEqual(['rye', 'cabbage', 'ginger'])
  })

  it('carries over only where seasons join: Corn Summer → Autumn, Cabbage Winter → Spring (decision 6)', () => {
    const next = (s: number) => SEASONS[(s + 1) % 4]!
    const carried = Object.values(CROPS).flatMap((c) => SEASONS.flatMap((season, i) => (growsIn(c.id, season) && growsIn(c.id, next(i)) ? [`${c.id} ${season}`] : [])))
    expect(carried).toEqual(['cabbage winter', 'corn summer'])
  })
})
