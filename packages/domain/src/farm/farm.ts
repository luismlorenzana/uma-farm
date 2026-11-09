// The farm's own ladders (F17; core spec CS3, CS34, CS39): the Dorm's beds, the Farm Rank's thresholds and day 1's
// numbers. Read-only until the packets that move them (F23 buys beds, F24 makes Farm Rank points).

/** Day 1 (CS3): 500g and 9 Carrot seeds. */
export const START_GOLD = 500
export const START_SEEDS = 9

/** The Dorm's beds by level, 1–10 (CS34): 3 → 60. */
export const BEDS: readonly number[] = [3, 5, 8, 12, 16, 22, 30, 40, 50, 60]
export const DORM_MAX_LEVEL = BEDS.length
/** The beds at a Dorm level. */
export const bedsAt = (level: number): number => BEDS[Math.min(DORM_MAX_LEVEL, Math.max(1, level)) - 1]!
/** The lowest Dorm level with a bed for each of `count` Umas, at most level 10 (CS54 step 4). */
export const dormLevelFor = (count: number): number => {
  const i = BEDS.findIndex((beds) => beds >= count)
  return i === -1 ? DORM_MAX_LEVEL : i + 1
}

/** The points each Farm Rank asks, 1–10 (CS39). */
export const FARM_RANK_POINTS: readonly number[] = [0, 150, 500, 1200, 2400, 4000, 6500, 10000, 15000, 22000]
/** The Farm Rank a farm's points reach. */
export const farmRankOf = (points: number): number => FARM_RANK_POINTS.filter((p) => points >= p).length || 1
