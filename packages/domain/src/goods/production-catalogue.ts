/** Stable raw IDs for products whose grade is determined on collection. */
export const ANIMAL_PRODUCTS = {
  chicken: 'egg', duck: 'duck-egg', cow: 'milk', goat: 'goat-milk',
  sheep: 'wool', alpaca: 'alpaca-fleece', 'cashmere-goat': 'cashmere-fleece',
} as const

export const FISH_MODES = ['standard', 'improved', 'select'] as const
export type FishMode = typeof FISH_MODES[number]
export const FISH_PROMOTION = {
  improved: { step: 1, manual: 12, aptitude: 4, every: 3 },
  select: { step: 2, manual: 40, aptitude: 7, every: 5 },
} as const
export const COLLECTION_CAPS = [0, 1, 2] as const
export type CollectionCap = typeof COLLECTION_CAPS[number]
export const MAX_STATION_TARGETS = 6
export const MAX_PRODUCTION_TARGET = 99
export const MAX_SURPLUS = 50

/** Exact conversion recipes. Each variant follows the input's grade and stars. */
export const FOOD_CONVERSIONS = [
  { output: 'cultured-yogurt', input: 'milk', job: 'dairy', level: 1, units: 1 },
  { output: 'butter', input: 'milk', job: 'dairy', level: 2, units: 2 },
  { output: 'farm-cheese', input: 'milk', job: 'dairy', level: 3, units: 2 },
  { output: 'goat-cheese', input: 'goat-milk', job: 'dairy', level: 3, units: 2 },
  { output: 'carrot-pickles', input: 'carrot', job: 'preserving', level: 2, units: 2 },
  { output: 'preserved-egg', input: 'egg', job: 'preserving', level: 2, units: 1 },
  { output: 'preserved-duck-egg', input: 'duck-egg', job: 'preserving', level: 2, units: 1 },
  { output: 'tomato-sauce', input: 'tomato', job: 'preserving', level: 2, units: 2 },
  { output: 'strawberry-jam', input: 'strawberry', job: 'preserves', level: 1, units: 1 },
  { output: 'raspberry-jam', input: 'raspberry', job: 'preserves', level: 1, units: 1 },
  { output: 'blueberry-jam', input: 'blueberry', job: 'preserves', level: 1, units: 1 },
  { output: 'persimmon-preserve', input: 'persimmon', job: 'preserves', level: 1, units: 1 },
] as const
