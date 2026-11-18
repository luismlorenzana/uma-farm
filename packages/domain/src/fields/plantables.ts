import type { Season } from '../farm/calendar'
import type { Tile } from '../save/v4'

export type WoodyKind = 'tree' | 'shrub'

interface Plantable {
  readonly season: Season
  readonly grade: number
  readonly rank: 1 | 2 | 3 | 4 | 6
  readonly seed: number
  readonly days: number
  readonly yield: number
  readonly regrows?: number
  readonly woody?: WoodyKind
  /** Vegetable price. Fruit uses the catalogue's fruit ladder. */
  readonly price?: number
}

/** The 24 additions in shop order. Existing fruit keep the same ids as their wild counterparts. */
export const NEW_PLANTABLES = {
  radish: { season: 'spring', grade: 1, rank: 1, seed: 20, days: 3, yield: 1, price: 55 },
  lettuce: { season: 'spring', grade: 2, rank: 1, seed: 30, days: 5, yield: 1, price: 85 },
  'green-peas': { season: 'spring', grade: 3, rank: 2, seed: 50, days: 5, yield: 2, regrows: 3, price: 65 },
  strawberry: { season: 'spring', grade: 2, rank: 2, seed: 65, days: 5, yield: 2, regrows: 3 },
  raspberry: { season: 'spring', grade: 3, rank: 3, seed: 130, days: 6, yield: 3, woody: 'shrub' },
  plum: { season: 'spring', grade: 4, rank: 4, seed: 220, days: 8, yield: 3, woody: 'tree' },
  cucumber: { season: 'summer', grade: 2, rank: 1, seed: 40, days: 5, yield: 1, regrows: 3, price: 85 },
  okra: { season: 'summer', grade: 4, rank: 2, seed: 55, days: 5, yield: 1, regrows: 3, price: 95 },
  zucchini: { season: 'summer', grade: 3, rank: 2, seed: 50, days: 6, yield: 2, price: 80 },
  peach: { season: 'summer', grade: 3, rank: 3, seed: 180, days: 7, yield: 3, woody: 'tree' },
  blueberry: { season: 'summer', grade: 4, rank: 3, seed: 150, days: 6, yield: 3, woody: 'shrub' },
  mango: { season: 'summer', grade: 7, rank: 6, seed: 360, days: 8, yield: 3, woody: 'tree' },
  turnip: { season: 'autumn', grade: 1, rank: 1, seed: 25, days: 4, yield: 1, price: 65 },
  'sweet-potato': { season: 'autumn', grade: 3, rank: 2, seed: 50, days: 5, yield: 2, price: 80 },
  'winter-squash': { season: 'autumn', grade: 6, rank: 4, seed: 105, days: 8, yield: 2, price: 160 },
  apple: { season: 'autumn', grade: 1, rank: 2, seed: 100, days: 6, yield: 3, woody: 'tree' },
  pear: { season: 'autumn', grade: 2, rank: 3, seed: 160, days: 7, yield: 3, woody: 'tree' },
  grape: { season: 'autumn', grade: 6, rank: 4, seed: 260, days: 7, yield: 3, woody: 'shrub' },
  leek: { season: 'winter', grade: 2, rank: 1, seed: 30, days: 4, yield: 1, price: 75 },
  cauliflower: { season: 'winter', grade: 5, rank: 2, seed: 65, days: 6, yield: 2, price: 115 },
  'red-beet': { season: 'winter', grade: 3, rank: 2, seed: 45, days: 5, yield: 2, price: 85 },
  orange: { season: 'winter', grade: 5, rank: 4, seed: 220, days: 7, yield: 3, woody: 'tree' },
  persimmon: { season: 'winter', grade: 6, rank: 4, seed: 245, days: 7, yield: 3, woody: 'tree' },
  pomegranate: { season: 'winter', grade: 8, rank: 6, seed: 375, days: 8, yield: 3, woody: 'tree' },
} as const satisfies Record<string, Plantable>

export type NewCropId = keyof typeof NEW_PLANTABLES
export const PLANTABLE_ADDITIONS = Object.entries(NEW_PLANTABLES) as [NewCropId, Plantable][]
export const RARE_CROPS = ['golden-carrot', 'sunwheat', 'moonrice', 'wild-rice', 'mandrake'] as const

/** Save parsing and the farm sign need only the orchard metadata. The field rules stay lazy. */
export function orchardOf(crop: string | null): Plantable | undefined {
  if (!crop || !Object.hasOwn(NEW_PLANTABLES, crop)) return undefined
  const plant: Plantable = NEW_PLANTABLES[crop as NewCropId]
  return plant.woody ? plant : undefined
}

export function established(tile: Pick<Tile, 'crop' | 'growth'>): boolean {
  const orchard = orchardOf(tile.crop)
  return !!orchard && tile.growth >= orchard.days
}

export const needsWater = (tile: Pick<Tile, 'crop' | 'growth' | 'ready' | 'watered'>): boolean =>
  tile.crop !== null && !tile.ready && !tile.watered && !established(tile)
