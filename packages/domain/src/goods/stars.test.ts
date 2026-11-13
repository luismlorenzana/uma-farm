// Stars: the formula, its own terms, CS26's worked rows, and their shares over a seeded sample. Her rank's and
// talent's terms are F21's; here they're the spec's numbers (Novice 0, Skilled 1, Expert 1.5; C +0.25, B +0.5, A +0.75).
import { describe, expect, it } from 'vitest'
import { draw } from '../farm/draw'
import {
  cropLevelQuality, drawStars, heartsQuality, inputsQuality, quality, starShares, TENDED_QUALITY, toolQuality, WELL_FED_QUALITY,
} from './stars'

/** The share of each star over `n` seeded draws at quality `q`. */
function sample(q: number, n = 20_000): number[] {
  const counts = [0, 0, 0, 0, 0]
  for (let i = 0; i < n; i++) counts[drawStars(q, draw('cs26', 1, 'stars', i)) - 1]! += 1
  return counts.map((c) => c / n)
}
const near = (shares: number[], expected: number[]) => shares.forEach((s, i) => expect(Math.abs(s - expected[i]!), `★${i + 1}`).toBeLessThan(0.015))

describe('the terms (CS26)', () => {
  it('prices each source in points', () => {
    expect([TENDED_QUALITY, WELL_FED_QUALITY]).toEqual([0.25, 0.25])
    expect([1, 2, 3, 5].map(toolQuality)).toEqual([0, 0.25, 0.5, 1])
    expect([1, 4, 10].map(cropLevelQuality).map((q) => Math.round(q * 10) / 10)).toEqual([0, 0.3, 0.9])
    expect([0, 5, 10].map(heartsQuality)).toEqual([0, 2, 4])
    expect(inputsQuality(2)).toBe(1)
  })

  it('adds them up, and refuses a source that isn\'t a number', () => {
    expect(quality({})).toBe(0)
    expect(quality({ talent: -0.75 })).toBe(-0.75)
    expect(() => quality({ rank: Number.NaN })).toThrow(RangeError)
  })
})

describe('the worked rows (CS26)', () => {
  it('a Novice C forager: Q 0.25, ★1 75%, ★2 25%', () => {
    const q = quality({ rank: 0, talent: 0.25 })
    expect(q).toBe(0.25)
    expect(starShares(q)).toEqual([0.75, 0.25, 0, 0, 0])
    near(sample(q), [0.75, 0.25, 0, 0, 0])
  })

  it('an untended block at crop level 1: Q 0, always ★1', () => {
    const q = quality({ cropLevel: cropLevelQuality(1) })
    expect(starShares(q)).toEqual([1, 0, 0, 0, 0])
    expect(sample(q)).toEqual([1, 0, 0, 0, 0])
  })

  it('a Skilled B miner with a Copper Pick: Q 1.75, ★2 25%, ★3 75%', () => {
    const q = quality({ rank: 1, talent: 0.5, tool: toolQuality(2) })
    expect(q).toBe(1.75)
    near(sample(q), [0, 0.25, 0.75, 0, 0])
  })

  it('an Expert A tender, Iron Hoe, level-4 crop, well fed: Q 3.55, ★4 45%, ★5 55%', () => {
    const q = quality({ rank: 1.5, talent: 0.75, care: TENDED_QUALITY, tool: toolQuality(3), cropLevel: cropLevelQuality(4), boost: WELL_FED_QUALITY })
    expect(q).toBe(3.55)
    expect(starShares(q).map((s) => Math.round(s * 100))).toEqual([0, 0, 0, 45, 55])
    near(sample(q), [0, 0, 0, 0.45, 0.55])
  })

  it('a 10-heart cow: Q 4, always ★5', () => {
    const q = quality({ care: heartsQuality(10) })
    expect(q).toBe(4)
    expect(sample(q)).toEqual([0, 0, 0, 0, 1])
  })

  it('a Fine Kitchen play with inputs averaging ★2 and a Hand C cook: Q 1.75', () => {
    expect(quality({ rank: 0.5, talent: 0.25, inputs: inputsQuality(2) })).toBe(1.75)
  })
})

describe('the draw (CS26)', () => {
  it('is 1 + ⌊Q + u⌋, clamped to 1–5', () => {
    expect([drawStars(0, 0), drawStars(0, 0.999), drawStars(0.25, 0.75), drawStars(0.25, 0.74)]).toEqual([1, 1, 2, 1])
    expect([drawStars(-0.75, 0.9), drawStars(-2, 0.5), drawStars(4, 0), drawStars(9, 0.5)]).toEqual([1, 1, 5, 5])
    expect(() => drawStars(1, 1)).toThrow(RangeError)
    expect(() => drawStars(1, -0.1)).toThrow(RangeError)
  })

  it('expects 1 + Q stars for Q from 0 to 4', () => {
    for (const q of [0, 0.25, 1, 1.75, 2.5, 3.55, 4]) {
      const mean = starShares(q).reduce((sum, share, i) => sum + share * (i + 1), 0)
      expect(mean, `Q ${q}`).toBeCloseTo(1 + q, 9)
    }
    expect(starShares(-0.75)).toEqual([1, 0, 0, 0, 0])
    expect(starShares(5)).toEqual([0, 0, 0, 0, 1])
  })

  it('replays the same: a seeded draw gives the same stars every time', () => {
    const once = sample(2.4, 500)
    expect(sample(2.4, 500)).toEqual(once)
  })
})
