// Rounding: gold is whole, prices round to 5g and rewards to 10g, and counts round half up, never
// below 1 for a job that ran. A hair of slack keeps a float product like 110 × 1.25 × 1.2 on the half it means.
const SLACK = 1e-9

const roundTo = (value: number, step: number): number => Math.round(value / step + SLACK) * step

/** A price, to the nearest 5g, half up (Silver Ingot 97.5 → 100). */
export const round5 = (gold: number): number => roundTo(gold, 5)
/** A reward, to the nearest 10g, half up. */
export const round10 = (gold: number): number => roundTo(gold, 10)
/** A count a job brings, half up and never below 1. */
export const countRound = (count: number): number => Math.max(1, roundTo(count, 1))
