// The farm's own ladders: the Farm Rank's thresholds and day 1's numbers. The night makes Farm Rank points.

/** Day 1: 500g and 9 Carrot seeds. */
export const START_GOLD = 500
export const START_SEEDS = 9

/** The retired Dorm's top level: the save keeps its level (1–8) and the level bought, and the parse reads them. */
export const DORM_MAX_LEVEL = 8

/** The points each Farm Rank asks, 1–10. */
export const FARM_RANK_POINTS: readonly number[] = [0, 150, 250, 950, 2150, 3750, 6250, 9750, 14750, 21750]
/** The Farm Rank a farm's points reach. */
export const farmRankOf = (points: number): number => FARM_RANK_POINTS.filter((p) => points >= p).length || 1
