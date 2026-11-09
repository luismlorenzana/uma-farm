// The crops (F20; core spec CS11, CS4): CS11's table row for row, 27 crops (22 from the shop, 5 rare ones from
// expeditions, requests and prizes), and the shop's seeds by season and tier. Price ★1 is F19's (`CROP_PRICES`), and a
// refined form is `refinedOf` (goods/ids); this file holds what growing needs. The Novice and Expert days follow from
// the untended days by CS12's rule (`nightsToReady`), and a test checks every row against CS11's columns.
import type { Season } from '../farm/calendar'
import type { CropId } from '../goods/ids'

/** Where a crop's seeds come from (CS4): the shop from a Farm Rank (1, 2 or 4), or rare (expeditions, requests,
 * prizes). */
export type SeedTier = 1 | 2 | 4 | 'rare'

export interface Crop {
  id: CropId
  /** The seasons it grows in: it's planted in these, and a growing one carries over where two join (CS4). */
  seasons: readonly Season[]
  tier: SeedTier
  /** A shop seed's price; null for a rare crop. */
  seed: number | null
  /** Days to Ready untended (CS11's first column): Ready once its growth reaches days − 0.5 (CS12). */
  days: number
  /** Crops a plot gives each harvest. */
  yield: number
  /** A regrowing crop turns Ready again every this many days after a harvest; null when it doesn't regrow. */
  regrows: number | null
  /** The station that refines it (F22): the Mill or the Sawmill, or null. */
  station: 'mill' | 'sawmill' | null
}

const crop = (id: CropId, seasons: readonly Season[], tier: SeedTier, seed: number | null, days: number, yields: number, regrows: number | null,
  station: Crop['station'] = null): Crop => ({ id, seasons, tier, seed, days, yield: yields, regrows, station })

/** CS11, in its order. */
export const CROPS: Readonly<Record<CropId, Crop>> = {
  carrot: crop('carrot', ['spring'], 1, 20, 4, 1, null),
  potato: crop('potato', ['spring'], 1, 35, 6, 2, null),
  mint: crop('mint', ['spring'], 1, 40, 4, 1, 3, 'sawmill'),
  onion: crop('onion', ['spring', 'autumn'], 2, 30, 5, 1, null),
  cabbage: crop('cabbage', ['spring', 'winter'], 2, 90, 8, 1, null),
  asparagus: crop('asparagus', ['spring'], 4, 150, 10, 1, null),
  tomato: crop('tomato', ['summer'], 1, 50, 7, 1, 3),
  basil: crop('basil', ['summer'], 1, 40, 4, 1, 3, 'sawmill'),
  'bell-pepper': crop('bell-pepper', ['summer'], 1, 60, 6, 1, 3),
  eggplant: crop('eggplant', ['summer'], 2, 70, 6, 1, 4),
  'sunflower-seed': crop('sunflower-seed', ['summer'], 2, 70, 8, 3, null, 'mill'),
  corn: crop('corn', ['summer', 'autumn'], 4, 80, 9, 1, 4, 'mill'),
  wheat: crop('wheat', ['autumn'], 1, 25, 5, 2, null, 'mill'),
  peanut: crop('peanut', ['autumn'], 1, 30, 4, 2, null, 'mill'),
  rice: crop('rice', ['autumn'], 1, 35, 6, 2, null, 'mill'),
  'sugar-beet': crop('sugar-beet', ['autumn'], 2, 40, 6, 1, null, 'mill'),
  'emperor-pumpkin': crop('emperor-pumpkin', ['autumn'], 4, 250, 10, 1, null),
  buckwheat: crop('buckwheat', ['winter'], 1, 30, 4, 1, null, 'mill'),
  oats: crop('oats', ['winter'], 1, 25, 5, 2, null, 'mill'),
  barley: crop('barley', ['winter'], 1, 30, 5, 2, null, 'mill'),
  rye: crop('rye', ['winter'], 2, 40, 6, 2, null, 'mill'),
  ginger: crop('ginger', ['winter'], 4, 120, 9, 2, null, 'sawmill'),
  'golden-carrot': crop('golden-carrot', ['spring'], 'rare', null, 6, 1, null),
  sunwheat: crop('sunwheat', ['summer'], 'rare', null, 7, 2, null, 'mill'),
  moonrice: crop('moonrice', ['autumn'], 'rare', null, 7, 2, null, 'mill'),
  'wild-rice': crop('wild-rice', ['summer'], 'rare', null, 6, 2, null, 'mill'),
  mandrake: crop('mandrake', ['winter'], 'rare', null, 8, 1, null, 'sawmill'),
}

/** The shop's seeds by season, in CS4's order: the first three from Farm Rank 1, the next two from FR2, the last from
 * FR4. Onion sells in Spring and Autumn, Cabbage in Spring and Winter, and Corn in Summer only. */
export const SHOP_SEEDS: Readonly<Record<Season, readonly CropId[]>> = {
  spring: ['carrot', 'potato', 'mint', 'onion', 'cabbage', 'asparagus'],
  summer: ['tomato', 'basil', 'bell-pepper', 'eggplant', 'sunflower-seed', 'corn'],
  autumn: ['wheat', 'peanut', 'rice', 'sugar-beet', 'onion', 'emperor-pumpkin'],
  winter: ['buckwheat', 'oats', 'barley', 'rye', 'cabbage', 'ginger'],
}

/** Whether a crop grows in a season. */
export const growsIn = (crop: CropId, season: Season): boolean => CROPS[crop].seasons.includes(season)

/** A hair of slack, so growth summed in floats reaches its mark (3 × 1.35 is 4.050000000000001). */
export const GROWTH_SLACK = 1e-9
/** Ready at the untended days − 0.5 (CS12): tending rounds to the nearest night. */
export const READY_MARGIN = 0.5

/** The growth a crop needs to turn Ready: its days − 0.5, or its regrowth's − 0.5 after a harvest (decision 5). */
export function readyAt(crop: CropId, regrowing: boolean): number {
  const c = CROPS[crop]
  return (regrowing && c.regrows !== null ? c.regrows : c.days) - READY_MARGIN
}

/** Nights to Ready from planting at a block's growth a night: CS11's day columns (1 untended, 1.25 Novice, 1.55 Expert). */
export function nightsToReady(crop: CropId, growth: number, regrowing = false): number {
  return Math.max(1, Math.ceil(readyAt(crop, regrowing) / growth - GROWTH_SLACK))
}
