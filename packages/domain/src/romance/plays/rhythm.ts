// Rhythm (F49 decision 5; RM25, RM26): tap on her beat with the activity's mark (a hoe, a brush, a step, an oar; the
// fallback's pot, tray, anvil or track). Each round shows her beat first (four beats), then eight to tap; each beat
// scores by the timing windows against its nearest tap, a tap that matches no beat costs 5, and the rounds score their
// mean. An event plays one round (about 12 s); an evening three (about 45 s). Pure.
import { clampScore, meanScore, timingScore, type PlayLength, type Seed } from './grade'

/** Rounds a play holds, and each round's beats (RM25). */
export const RHYTHM_ROUNDS: Readonly<Record<PlayLength, number>> = { event: 1, evening: 3 }
export const RHYTHM_BEATS = 8
/** Her beat shown first: four beats before the first to tap. */
export const RHYTHM_LEAD = 4
/** A beat every 700 ms plus a seeded 0–300 ms. */
export const RHYTHM_PERIOD = { from: 700, spread: 300 } as const
/** What a tap that matches no beat costs (so tapping fast never scores). */
export const RHYTHM_EXTRA = 5

/** The marks Rhythm plays with (RM26), in words until art draws them. */
export const RHYTHM_MARKS = ['hoe', 'swing', 'brush', 'pot', 'tray', 'anvil', 'oar', 'step', 'hands', 'track', 'pack'] as const
export type RhythmMark = typeof RHYTHM_MARKS[number]
export const RHYTHM_MARK_WORDS: Readonly<Record<RhythmMark, string>> = {
  hoe: 'the hoe', swing: 'the pick', brush: 'the brush', pot: 'the pot', tray: 'the tray', anvil: 'the anvil', oar: 'the oar', step: 'her step',
  hands: 'your hands', track: 'the track', pack: 'the pack',
}

export interface RhythmPlan {
  /** Each round's beat, in ms. */
  periods: number[]
}

export function rhythmPlan(seed: Seed, length: PlayLength): RhythmPlan {
  return { periods: Array.from({ length: RHYTHM_ROUNDS[length] }, (_, i) => RHYTHM_PERIOD.from + Math.floor(seed(i) * RHYTHM_PERIOD.spread)) }
}

/** The beats to tap in a round, in ms after it starts: after her four. */
export const rhythmBeats = (period: number): number[] => Array.from({ length: RHYTHM_BEATS }, (_, k) => (RHYTHM_LEAD + k) * period)

/** One round's score: each beat against its nearest unused tap within half a beat; taps before the first beat's half
 * (her lead-in) are ignored; any other tap left over costs 5. */
export function rhythmRound(period: number, taps: readonly number[]): number {
  const beats = rhythmBeats(period)
  const start = beats[0]! - period / 2
  const live = taps.filter((t) => t >= start).sort((a, b) => a - b)
  const used = new Set<number>()
  const scores = beats.map((beat) => {
    let best = -1
    for (let i = 0; i < live.length; i++) {
      if (used.has(i) || Math.abs(live[i]! - beat) > period / 2) continue
      if (best === -1 || Math.abs(live[i]! - beat) < Math.abs(live[best]! - beat)) best = i
    }
    if (best === -1) return 0
    used.add(best)
    return timingScore(live[best]! - beat)
  })
  const extra = live.length - used.size
  return clampScore(meanScore(scores) - RHYTHM_EXTRA * extra)
}

/** Each round's taps, in ms after it started: the rounds' mean. */
export function rhythmScore(plan: RhythmPlan, taps: readonly (readonly number[])[]): number {
  return meanScore(plan.periods.map((period, i) => rhythmRound(period, taps[i] ?? [])))
}
