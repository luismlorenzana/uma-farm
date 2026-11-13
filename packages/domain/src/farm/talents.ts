// Talents: each Uma has a talent, G to S, in each of the nine activities, read
// from her master-data stats by one rule, the same for everyone. Her talent score in an activity is her 5★ base stat ×
// (100 + her growth rate for that stat) ÷ 100; expeditions read the mean of her three best scores. Talents aren't saved
//: a fixed release always gives the same talents, so the app computes them once a release. Her
// temperament is her top score's stat, for her hello lines and conversations.
import { ACTIVITIES, type Activity } from './ranks'

/** The five stats, in the tie order: Speed, Stamina, Power, Guts, Wit. */
export const TALENT_STATS = ['speed', 'stamina', 'power', 'guts', 'wit'] as const
export type TalentStat = typeof TALENT_STATS[number]
export type TalentScores = Record<TalentStat, number>

/** What the rule reads of an outfit (uma-data's `Outfit`): her 5★ base stats and her growth rates in whole percent. */
export interface TalentOutfit {
  readonly stats: { readonly star5: Readonly<Record<TalentStat, number>> }
  readonly growthRatePercents: Readonly<Record<TalentStat, number>>
}

/** The grades, by step: G 0, F 1, E 2, D 3, C 4, B 5, A 6, S 7. */
export const TALENT_GRADES = ['G', 'F', 'E', 'D', 'C', 'B', 'A', 'S'] as const
/** A talent's step: G 0 … S 7. */
export type TalentStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
/** D: the middle, the talent everyone has until master data is read (tests and a dropped outfit). */
export const TALENT_D: TalentStep = 3

/** The stat each activity reads: Stamina farming; Guts the ranch; Power mining and forging; Wit
 * cooking and fishing; Speed foraging and serving. Expeditions read all five. */
export const ACTIVITY_STAT: Readonly<Record<Exclude<Activity, 'expeditions'>, TalentStat>> = {
  farming: 'stamina', ranch: 'guts', mining: 'power', fishing: 'wit', foraging: 'speed', cooking: 'wit', serving: 'speed', forging: 'power',
}

/** The cut-offs, F upward: a score at or above the first is F, … at or above the last is S; below the first is G. */
export const STAT_CUTOFFS: readonly number[] = [88, 96, 104, 114, 126, 138, 150]
/** Expeditions' cut-offs on the mean of her three best scores, F upward. */
export const EXPEDITION_CUTOFFS: readonly number[] = [120, 122, 124, 126, 129, 132, 136]

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

/** Her talent score in each stat: 5★ base × (100 + growth %) ÷ 100, to a millionth. */
export function talentScores(outfit: TalentOutfit): TalentScores {
  const scores = {} as TalentScores
  for (const stat of TALENT_STATS) {
    const base = outfit.stats.star5[stat]
    const growth = outfit.growthRatePercents[stat]
    if (!Number.isFinite(base) || !Number.isFinite(growth)) throw new RangeError(`Bad ${stat}: ${base}, ${growth}%`)
    scores[stat] = round6((base * (100 + growth)) / 100)
  }
  return scores
}

/** A score's step by a list of cut-offs (F upward). */
export const gradeStep = (score: number, cutoffs: readonly number[] = STAT_CUTOFFS): TalentStep =>
  cutoffs.filter((cut) => score >= cut).length as TalentStep

/** The mean of her three best scores: expeditions' score. */
export function expeditionScore(scores: TalentScores): number {
  const best = TALENT_STATS.map((s) => scores[s]).sort((a, b) => b - a).slice(0, 3)
  return round6(best.reduce((a, b) => a + b, 0) / 3)
}
/** Her expeditions talent: the mean of her three best scores, on expeditions' cut-offs. */
export const expeditionTalent = (scores: TalentScores): TalentStep => gradeStep(expeditionScore(scores), EXPEDITION_CUTOFFS)

/** Her score in an activity: its stat's, or expeditions' mean. The album sorts by it. */
export const activityScore = (scores: TalentScores, activity: Activity): number =>
  activity === 'expeditions' ? expeditionScore(scores) : scores[ACTIVITY_STAT[activity]]

/** Her talent in an activity. */
export const talentOf = (scores: TalentScores, activity: Activity): TalentStep =>
  activity === 'expeditions' ? expeditionTalent(scores) : gradeStep(scores[ACTIVITY_STAT[activity]])

// --- Temperament ------------------------------------------------------------------------------------

export const TEMPERAMENTS = ['breezy', 'steady', 'bold', 'gritty', 'clever'] as const
export type Temperament = typeof TEMPERAMENTS[number]
/** Each stat's temperament: Speed breezy, Stamina steady, Power bold, Guts gritty, Wit clever. */
export const STAT_TEMPERAMENT: Readonly<Record<TalentStat, Temperament>> = { speed: 'breezy', stamina: 'steady', power: 'bold', guts: 'gritty', wit: 'clever' }

/** Her temperament: her top score's stat, ties going Speed, Stamina, Power, Guts, Wit. */
export function temperament(scores: TalentScores): Temperament {
  const top = TALENT_STATS.reduce((best, stat) => (scores[stat] > scores[best] ? stat : best))
  return STAT_TEMPERAMENT[top]
}

// --- One outfit's talents, once a release ----------------------------------------------------------------

/** Everything the rule reads from one outfit. */
export interface Talents {
  readonly scores: TalentScores
  /** Her step in each activity. */
  readonly steps: Readonly<Record<Activity, TalentStep>>
  /** Her best talent among the five stats' activities: the highest step, then the higher score,
   * then the activities' order. Expeditions, on their own scale, aren't in it. */
  readonly best: Exclude<Activity, 'expeditions'>
  readonly temperament: Temperament
}

/** Her talents in every activity, her best and her temperament. */
export function talentsOf(outfit: TalentOutfit): Talents {
  const scores = talentScores(outfit)
  const steps = Object.fromEntries(ACTIVITIES.map((a) => [a, talentOf(scores, a)])) as Record<Activity, TalentStep>
  const stats = ACTIVITIES.filter((a): a is Exclude<Activity, 'expeditions'> => a !== 'expeditions')
  const best = stats.reduce((top, a) => (steps[a] > steps[top] || (steps[a] === steps[top] && activityScore(scores, a) > activityScore(scores, top)) ? a : top))
  return { scores, steps, best, temperament: temperament(scores) }
}

/** Her talent's step in an activity, by outfit id: what the night, the harvests and the screens read. */
export type TalentOf = (outfitId: string, activity: Activity) => TalentStep
/** Everyone D: tests, and the rules' default before master data. */
export const talentsD: TalentOf = () => TALENT_D
/** A `TalentOf` over a table of talents; an outfit it doesn't hold (one a later release dropped) is D. */
export const talentResolver = (table: ReadonlyMap<string, Talents>): TalentOf => (outfitId, activity) => table.get(outfitId)?.steps[activity] ?? TALENT_D

// --- What a talent gives ------------------------------------------------------------------------------------

/** Yield (gathering, stations): ×0.85 at G … ×1.20 at S. */
export const TALENT_YIELD: readonly number[] = [0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2]
/** Rank points: ×0.8 at G … ×1.5 at S. */
export const TALENT_RANK_POINTS: readonly number[] = [0.8, 0.85, 0.9, 1, 1.1, 1.2, 1.3, 1.5]
export const talentYield = (step: TalentStep): number => TALENT_YIELD[step]!
export const talentRankPoints = (step: TalentStep): number => TALENT_RANK_POINTS[step]!
/** Quality points (the talent term): G −0.75, F −0.5, E −0.25, D 0, C +0.25, B +0.5, A +0.75, S +1. */
export const talentQuality = (step: TalentStep): number => 0.25 * (step - TALENT_D)
/** Tended growth: +0.05 at B, +0.10 at A, +0.15 at S; nothing below B. */
export const talentGrowth = (step: TalentStep): number => round6(Math.max(0, step - 4) * 0.05)
/** Affection a day (the ranch): +0 at G … +7 at S. */
export const talentAffection = (step: TalentStep): number => step
/** Expedition power: +0 at G … +14 at S. */
export const talentPower = (step: TalentStep): number => 2 * step
