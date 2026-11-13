// The farm's own ladders: the Dorm's beds, the Farm Rank's thresholds and day 1's
// numbers. Read-only until the packets that move them (F23 buys beds, F24 makes Farm Rank points).

/** Day 1: 500g and 9 Carrot seeds. */
export const START_GOLD = 500
export const START_SEEDS = 9

/** The Dorm's beds by level, 1–10: 3 → 60. */
export const BEDS: readonly number[] = [3, 5, 8, 12, 16, 22, 30, 40, 50, 60]
export const DORM_MAX_LEVEL = BEDS.length
/** The beds at a Dorm level. */
export const bedsAt = (level: number): number => BEDS[Math.min(DORM_MAX_LEVEL, Math.max(1, level)) - 1]!
/** The lowest Dorm level with a bed for each of `count` Umas, at most level 10 (CS54 step 4). */
export const dormLevelFor = (count: number): number => {
  const i = BEDS.findIndex((beds) => beds >= count)
  return i === -1 ? DORM_MAX_LEVEL : i + 1
}

/** The Dorm for 20: save v4's eight levels, 3 → 20 beds. v3 keeps CS34's ten. */
export const BEDS_V4: readonly number[] = [3, 5, 7, 9, 11, 14, 17, 20]
export const DORM_MAX_LEVEL_V4 = BEDS_V4.length
/** The beds at a Dorm level on save v4. */
export const bedsAtV4 = (level: number): number => BEDS_V4[Math.min(DORM_MAX_LEVEL_V4, Math.max(1, level)) - 1]!
/** The Dorm's top level on a save's version: v3's ten, v4's eight. */
export const dormMaxLevel = (version: number): number => (version >= 4 ? DORM_MAX_LEVEL_V4 : DORM_MAX_LEVEL)
/** The beds at a level on a save's version: what the parse, the Dorm and joining read. */
export const bedsFor = (version: number, level: number): number => (version >= 4 ? bedsAtV4(level) : bedsAt(level))

/** The points each Farm Rank asks, 1–10. */
export const FARM_RANK_POINTS: readonly number[] = [0, 150, 500, 1200, 2400, 4000, 6500, 10000, 15000, 22000]
/** The Farm Rank a farm's points reach. */
export const farmRankOf = (points: number): number => FARM_RANK_POINTS.filter((p) => points >= p).length || 1
