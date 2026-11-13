// The nine activities and their six ranks (D24 #8, #9). F21 adds talents, points a day, the
// challenges and what a rank gives; this file holds what the save and the v2 → v3 migration need.
import type { MaterialLine } from '../items/lines'

/** Seven kinds of work, nine ranks (D24 #8). */
export const ACTIVITIES = ['farming', 'ranch', 'mining', 'fishing', 'foraging', 'cooking', 'serving', 'forging', 'expeditions'] as const
export type Activity = typeof ACTIVITIES[number]
export const isActivity = (id: string): id is Activity => (ACTIVITIES as readonly string[]).includes(id)
export const ACTIVITY_NAMES: Readonly<Record<Activity, string>> = {
  farming: 'Farming', ranch: 'Ranch', mining: 'Mining', fishing: 'Fishing', foraging: 'Foraging', cooking: 'Cooking',
  serving: 'Serving', forging: 'Forging', expeditions: 'Expeditions',
}

/** Six ranks, 0–5. */
export const RANKS = ['Novice', 'Hand', 'Skilled', 'Expert', 'Master', 'Legend'] as const
export type Rank = 0 | 1 | 2 | 3 | 4 | 5
export const LEGEND: Rank = 5
/** The points each rank asks: Hand 40, Skilled 160, Expert 400, Master 900, Legend 2,000. */
export const RANK_POINTS: readonly number[] = [0, 40, 160, 400, 900, 2000]

/** Her calling's line names the activity Craft Level becomes (D24 #9): Metal and Stone mining, Wood foraging, Fish
 * fishing, Vegetables farming. */
export const LINE_ACTIVITY: Readonly<Record<MaterialLine, Activity>> = {
  metal: 'mining', stone: 'mining', wood: 'foraging', fish: 'fishing', vegetables: 'farming',
}

/** CS32's bands: the first Craft Level of each rank, the points it starts at and the points each level above adds. */
export const CRAFT_BANDS: readonly { from: number; rank: Rank; points: number; perLevel: number }[] = [
  { from: 1, rank: 0, points: 0, perLevel: 8 },
  { from: 6, rank: 1, points: 40, perLevel: 12 },
  { from: 16, rank: 2, points: 160, perLevel: 24 },
  { from: 26, rank: 3, points: 400, perLevel: 50 },
  { from: 36, rank: 4, points: 900, perLevel: 110 },
  { from: 46, rank: 5, points: 2000, perLevel: 0 },
]

/** Today's Craft Level as her rank in her calling's activity: Lv 1–5 Novice at 8 a level above 1, … Lv 46–50
 * Legend at 2,000. */
export function craftRank(level: number): { rank: Rank; points: number } {
  const lv = Math.min(50, Math.max(1, Math.floor(level)))
  const band = [...CRAFT_BANDS].reverse().find((b) => lv >= b.from)!
  return { rank: band.rank, points: band.points + band.perLevel * (lv - band.from) }
}
