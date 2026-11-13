// The five plays' grades and timing: what the farmer and she do
// together inside an event (and, from F50, as an evening) is one short play, scored 0–100 and graded **Fine below 60,
// Great 60–89, Perfect 90+**. An event adds +0, +15 or +30; an evening pays 60, 100 or 150. **Never failed:** a missed
// tap still lands, as a Fine, and no tap at all scores 0. Every play is seeded (`draw(uid, day, 'play:<id>:<rung>', n)`),
// takes one thumb, times from `pointerdown`, shows what to aim for first, and takes nothing from the Warehouse. Pure.
import { draw } from '../../farm/draw'

export const PLAY_KINDS = ['cast', 'pick', 'rhythm', 'walk', 'choose'] as const
export type PlayKind = typeof PLAY_KINDS[number]
/** Each play's name on screen. */
export const PLAY_NAMES: Readonly<Record<PlayKind, string>> = { cast: 'Cast', pick: 'Pick', rhythm: 'Rhythm', walk: 'Walk', choose: 'Choose' }
/** An event's play or an evening's (RM25's two lengths, both built here so F50 only wires evenings). */
export type PlayLength = 'event' | 'evening'

export const GRADES = ['fine', 'great', 'perfect'] as const
export type Grade = typeof GRADES[number]
export const GRADE_NAMES: Readonly<Record<Grade, string>> = { fine: 'Fine', great: 'Great', perfect: 'Perfect' }
/** Great from 60, Perfect from 90. */
export const GREAT_AT = 60
export const PERFECT_AT = 90
export const gradeOf = (score: number): Grade => (score >= PERFECT_AT ? 'perfect' : score >= GREAT_AT ? 'great' : 'fine')
/** What a grade adds to an event. */
export const EVENT_GRADE_POINTS: Readonly<Record<Grade, number>> = { fine: 0, great: 15, perfect: 30 }
/** What an evening pays by its grade (F50 pays it, ×1.5 in her favourite kind). */
export const EVENING_GRADE_POINTS: Readonly<Record<Grade, number>> = { fine: 60, great: 100, perfect: 150 }

/** A play's seeded numbers: the `n`th draw in [0, 1). */
export type Seed = (n: number) => number
/** The draws a play reads: `draw(uid, day, 'play:<id>:<rung>', n)`; the `k`th play of one scene (the
 * confession holds up to three) reads its own hundred. */
export const playSeed = (uid: string, day: number, id: string, rung: string, k = 0): Seed => (n) => draw(uid, day, `play:${id}:${rung}`, k * 100 + n)
/** A whole number of `n` from a draw: 0 … n − 1. */
export const pickIndex = (seed: Seed, at: number, n: number): number => Math.min(n - 1, Math.floor(seed(at) * n))
/** A seeded shuffle (Fisher–Yates over draws `at`, `at + 1`, …). */
export function shuffled<T>(list: readonly T[], seed: Seed, at: number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(seed, at + i, i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** A score held to 0–100 and whole. */
export const clampScore = (n: number): number => Math.max(0, Math.min(100, Math.round(n)))
/** The mean of some scores, whole (0 for none). */
export const meanScore = (scores: readonly number[]): number => (scores.length === 0 ? 0 : clampScore(scores.reduce((a, b) => a + b, 0) / scores.length))

/** The timing windows (set by the worker): how far a tap is from the moment, in ms, and what it scores. A
 * careful tap lands inside 160 ms (Perfect); a casual one usually inside 360 ms (Great); 720 ms or more, or none, is 0. */
export const TIMING_WINDOWS = { exact: 80, perfect: 160, great: 360, miss: 720 } as const
/**
 * One tap's timing score from its error in ms (null: no tap). ≤ 80 ms 100; to 160 ms 99 → 90 (Perfect); to 360 ms 89 →
 * 60 (Great); to 720 ms 58 → 1 (Fine); past it 0. Whole, never rising with the error.
 */
export function timingScore(error: number | null): number {
  if (error === null || !Number.isFinite(error)) return 0
  const e = Math.abs(error)
  const { exact, perfect, great, miss } = TIMING_WINDOWS
  if (e <= exact) return 100
  if (e <= perfect) return 90 + Math.floor(((perfect - e) * 10) / (perfect - exact))
  if (e <= great) return 60 + Math.floor(((great - e) * 30) / (great - perfect))
  if (e < miss) return Math.floor(((miss - e) * 59) / (miss - great))
  return 0
}
