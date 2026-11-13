// The nine activities and their six ranks. Talents, points a day, the
// challenges and what a rank gives live elsewhere; this file holds what the save needs.
import type { MaterialLine } from '../items/lines'

/** Seven kinds of work, nine ranks. */
export const ACTIVITIES = ['farming', 'ranch', 'mining', 'fishing', 'foraging', 'cooking', 'serving', 'forging', 'expeditions'] as const
export type Activity = typeof ACTIVITIES[number]
export const ACTIVITY_NAMES: Readonly<Record<Activity, string>> = {
  farming: 'Farming', ranch: 'Ranch', mining: 'Mining', fishing: 'Fishing', foraging: 'Foraging', cooking: 'Cooking',
  serving: 'Serving', forging: 'Forging', expeditions: 'Expeditions',
}

/** Six ranks, 0–5. */
export const RANKS = ['Novice', 'Hand', 'Skilled', 'Expert', 'Master', 'Legend'] as const
export type Rank = 0 | 1 | 2 | 3 | 4 | 5
/** The points each rank asks: Hand 40, Skilled 160, Expert 400, Master 900, Legend 2,000. */
export const RANK_POINTS: readonly number[] = [0, 40, 160, 400, 900, 2000]

/** A line's activity: Metal and Stone mining, Wood foraging, Fish fishing, Vegetables farming. */
export const LINE_ACTIVITY: Readonly<Record<MaterialLine, Activity>> = {
  metal: 'mining', stone: 'mining', wood: 'foraging', fish: 'fishing', vegetables: 'farming',
}
