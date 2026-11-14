// The farm's own ladders: the Dorm's beds, the Farm Rank's thresholds and day 1's
// numbers. The Dorm buys beds and the night makes Farm Rank points.

/** Day 1: 500g and 9 Carrot seeds. */
export const START_GOLD = 500
export const START_SEEDS = 9

/** The Dorm for 20: its beds by level, 1–8: 3 → 20. */
export const BEDS: readonly number[] = [3, 5, 7, 9, 11, 14, 17, 20]
export const DORM_MAX_LEVEL = BEDS.length
/** The beds at a Dorm level: what the parse, the Dorm and joining read. */
export const bedsAt = (level: number): number => BEDS[Math.min(DORM_MAX_LEVEL, Math.max(1, level)) - 1]!

/** The points each Farm Rank asks, 1–10. */
export const FARM_RANK_POINTS: readonly number[] = [0, 150, 250, 950, 2150, 3750, 6250, 9750, 14750, 21750]
/** The Farm Rank a farm's points reach. */
export const farmRankOf = (points: number): number => FARM_RANK_POINTS.filter((p) => points >= p).length || 1
