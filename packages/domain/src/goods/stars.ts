// Stars (F19; core spec CS26): each good adds up quality points Q from its sources, then draws its stars,
// `1 + ⌊Q + u⌋` clamped to 1–5, with `u` a seeded draw in [0, 1) (CS8). So the expected stars are 1 + Q for Q from 0 to
// 4, and Q of 4 or more is always ★5. This file holds the formula and the terms of its own rows; F21 gives the rank and
// talent terms (`rankQuality` in `farm/rank-rules.ts`, CS31's 0.5 a rank; `talentQuality` in `farm/talents.ts`, G −0.75
// … S +1), and F20 and F22 add them up for their goods.

/** The quality points a good gets from each of its sources (CS26's rows), each already in points. Leave a source out
 * where it doesn't apply. */
export interface QualitySources {
  /** Her rank: `rankQuality(rank)`, 0.5 a rank (Novice 0 … Legend 2.5). The tender's in farming, the assistant's in a
   * workshop. */
  rank?: number
  /** Her talent: `talentQuality(step)`, G −0.75, F −0.5, E −0.25, D 0, C +0.25, B +0.5, A +0.75, S +1. */
  talent?: number
  /** Care: `TENDED_QUALITY` for a tended crop, `heartsQuality(hearts)` for an animal's product. */
  care?: number
  /** The crop's level on the farm: `cropLevelQuality(level)`. */
  cropLevel?: number
  /** A workshop's inputs: `inputsQuality(mean stars)`. A station's output carries its input's stars instead. */
  inputs?: number
  /** The tool: `toolQuality(tier)` (the Pick, the Axe, the Rod, the Hoe, the Brush). */
  tool?: number
  /** Well fed: `WELL_FED_QUALITY`. */
  boost?: number
}

/** Tended by an Uma: +0.25 (farming). */
export const TENDED_QUALITY = 0.25
/** Well fed: +0.25 (gathering, farming). */
export const WELL_FED_QUALITY = 0.25
/** A tool's tier, 1 (Basic) to 5 (Mythril): +0.25 a tier above Basic. */
export const toolQuality = (tier: number): number => 0.25 * (tier - 1)
/** A crop's level, 1–10: +0.1 a level above 1. */
export const cropLevelQuality = (level: number): number => 0.1 * (level - 1)
/** An animal's hearts, 0–10: hearts ÷ 2.5 (0 → 4). */
export const heartsQuality = (hearts: number): number => hearts / 2.5
/** A workshop's inputs: their mean stars − 1. */
export const inputsQuality = (meanStars: number): number => meanStars - 1

/** A good's quality points: its sources added up, to a millionth so a sum like 3.55 lands where it means. */
export function quality(sources: QualitySources): number {
  const sum = Object.values(sources).reduce<number>((total, points) => {
    if (typeof points !== 'number' || !Number.isFinite(points)) throw new RangeError(`Bad quality points: ${String(points)}`)
    return total + points
  }, 0)
  return Math.round(sum * 1e6) / 1e6
}

/** A good's stars from its quality points and a seeded draw `u` in [0, 1): `1 + ⌊Q + u⌋`, clamped to 1–5. */
export function drawStars(q: number, u: number): number {
  if (!Number.isFinite(q)) throw new RangeError(`Bad quality points: ${q}`)
  if (!(u >= 0 && u < 1)) throw new RangeError(`A draw is in [0, 1): ${u}`)
  return Math.min(5, Math.max(1, 1 + Math.floor(q + u)))
}

/** The odds of each star, ★1 … ★5, at quality points `q`: the two stars either side of 1 + Q (CS26's worked shares). */
export function starShares(q: number): [number, number, number, number, number] {
  const shares: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  const clamped = Math.min(4, Math.max(-1, q))
  const low = Math.floor(clamped)
  const up = Math.round((clamped - low) * 1e6) / 1e6
  const add = (stars: number, share: number) => {
    const i = Math.min(5, Math.max(1, stars)) - 1
    shares[i] = shares[i]! + share
  }
  add(1 + low, 1 - up)
  if (up > 0) add(2 + low, up)
  return shares
}
