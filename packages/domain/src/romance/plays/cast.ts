// Cast (F49 decision 5; RM25): a ring closes on the mark, and you tap as they meet; the line lands every time. Each cast's
// meeting is seeded (1.6–2.8 s after it starts); the tap's distance from it scores it by the timing windows, and the
// casts score their mean. An event casts once (10–15 s with its seed shown first); an evening three times (40 s). Pure.
import { meanScore, timingScore, type PlayLength, type Seed } from './grade'

/** Casts a play holds (RM25). */
export const CAST_COUNT: Readonly<Record<PlayLength, number>> = { event: 1, evening: 3 }
/** The ring meets the mark this long after a cast starts: 1.6 s plus a seeded 0–1.2 s. */
export const CAST_MEET = { from: 1600, spread: 1200 } as const

export interface CastPlan {
  /** Each cast's meeting, in ms after it starts. */
  meets: number[]
}

export function castPlan(seed: Seed, length: PlayLength): CastPlan {
  return { meets: Array.from({ length: CAST_COUNT[length] }, (_, i) => CAST_MEET.from + Math.floor(seed(i) * CAST_MEET.spread)) }
}

/** Each cast's tap, in ms after it started (`pointerdown`), or null for none: their mean timing score. */
export function castScore(plan: CastPlan, taps: readonly (number | null)[]): number {
  return meanScore(plan.meets.map((meet, i) => {
    const tap = taps[i]
    return timingScore(tap === null || tap === undefined ? null : tap - meet)
  }))
}
