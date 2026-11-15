// The Kitchen's levels: the dishes a play makes (its base) and what each level costs. Apart from the Kitchen's rules so
// the Farm Rank's opens can read them. Pure.

/** One level of the Kitchen: the dishes a play makes (its base), its gold and the Farm Rank it opens at (level 1 is the
 * Kitchen built, by its own build). */
export interface KitchenLevel {
  level: number
  dishes: number
  cost: number
  farmRank: number
}
/** The Kitchen's levels: 6, 8, 10, 12 and 15 dishes a play; levels 2–5 at Farm Rank 4, 5, 6 and 7, for 5,000g, 10,000g,
 * 20,000g and 40,000g, gold only, as a station's are. */
export const KITCHEN_LEVELS: readonly KitchenLevel[] = [
  { level: 1, dishes: 6, cost: 0, farmRank: 3 },
  { level: 2, dishes: 8, cost: 5_000, farmRank: 4 },
  { level: 3, dishes: 10, cost: 10_000, farmRank: 5 },
  { level: 4, dishes: 12, cost: 20_000, farmRank: 6 },
  { level: 5, dishes: 15, cost: 40_000, farmRank: 7 },
]
/** The Kitchen's top level. */
export const KITCHEN_MAX_LEVEL = KITCHEN_LEVELS.length

