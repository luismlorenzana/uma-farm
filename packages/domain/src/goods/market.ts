// The market feels a flood. The bin takes anything and pays at night, but the valley can only eat so much of one good:
//
//   a crate      50 of one good in a night's bin, any stars
//   a flood      past a crate, each crate more sells a step lower than the one before: −10% a step, down to the floor,
//                half the price (five steps). The best stars sell first, at the best step
//   the days     the good stays eased by the steps it reached (its last crate's), and recovers a step each night it isn't
//   after        shipped past a crate (`farm.market`: good → steps); its first crate sells at that ease
//
// So a farm that ships a field of one crop, or a mine's day of one ore, feels it; one that ships a crate of many goods,
// or spreads a stockpile over days, doesn't. The bin's estimate, the Warehouse's prices and the night all read it. Pure;
// never stamps. Loaded with the bin and the night.
import { round5 } from '../farm/round'
import { MARKET_FLOOR, type StarCounts, type Warehouse } from '../save/v4'
import { baseGoodId, goodOf } from './ids'
import { DEMAND_LIFT } from './rule'
import { inDemand, starFactor } from './prices'

/** A crate: this many of one good in a night, any stars, sell at the good's price today. */
export const CRATE = 50
/** Each crate past the first eases the price a step: −10%. */
export const EASE_STEP = 0.1
/** The floor: five steps, half the price. Here as the save's (`MARKET_FLOOR`). */
export const EASE_FLOOR = MARKET_FLOOR

/** The farm's market: each good eased, by the steps it's eased (1–5); a good not eased isn't there. */
export type Market = Readonly<Record<string, number>>

/** A good's steps eased today. */
export const easeOf = (market: Market | undefined, id: string): number => Math.min(EASE_FLOOR, market?.[baseGoodId(id)] ?? 0)
/** A price's factor at so many steps: ×0.9 a step, ×0.5 at the floor. */
export const easeFactor = (steps: number): number => 1 - EASE_STEP * Math.min(EASE_FLOOR, Math.max(0, steps))
/** The percent off at so many steps: 10, 20 … 50. */
export const easedPercent = (steps: number): number => Math.round(EASE_STEP * 100 * Math.min(EASE_FLOOR, Math.max(0, steps)))

/** What one of a good at `stars` sells for on `day`, eased by `steps`: price ★1 × the star's factor × demand × the ease,
 * rounded to 5g once. */
export function easedPrice(id: string, stars: number, day: number, steps: number): number {
  const good = goodOf(id)
  if (!good) throw new RangeError(`${id} has no price`)
  return round5(good.price * starFactor(stars) * (inDemand(id, day) ? 1 + DEMAND_LIFT : 1) * easeFactor(steps))
}

/** One star's line of a good in the night's bin: how many, their gold, and the deepest step its units sold at (0: none). */
export interface EasedLine {
  stars: number
  count: number
  gold: number
  steps: number
}

/** A good's star counts in the night's bin, priced crate by crate: the best stars first, the first crate at the good's
 * ease today and each crate after a step lower, down to the floor. Its lines, ★1 first. */
export function easedLines(id: string, row: StarCounts, day: number, steps: number): EasedLine[] {
  return easedGroup([[id, row]], day, steps).reverse().map(({ stars, count, gold, steps }) => ({ stars, count, gold, steps }))
}

/** All grade variants share a crate. Within each star, sell the higher grade first. */
export function easedGroup(rows: readonly [string, StarCounts][], day: number, steps: number): (EasedLine & { id: string })[] {
  const out: (EasedLine & { id: string })[] = []
  const byGrade = [...rows].sort(([a], [b]) => (goodOf(b)?.grade ?? 0) - (goodOf(a)?.grade ?? 0))
  let sold = 0
  for (let s = 5; s >= 1; s--) {
    for (const [id, row] of byGrade) {
      let left = row[s - 1] ?? 0
      if (left <= 0) continue
      const line = { id, stars: s, count: left, gold: 0, steps: 0 }
      while (left > 0) {
        const crate = Math.floor(sold / CRATE)
        const at = Math.min(EASE_FLOOR, steps + crate)
        const n = at === EASE_FLOOR ? left : Math.min(left, CRATE * (crate + 1) - sold)
        line.gold += easedPrice(id, s, day, at) * n
        line.steps = Math.max(line.steps, at)
        sold += n
        left -= n
      }
      out.push(line)
    }
  }
  return out
}

/** The crates past the first a count fills: 50 → 0, 51 → 1, 120 → 2. */
export const cratesPast = (count: number): number => (count <= 0 ? 0 : Math.floor((count - 1) / CRATE))

/** The market after a night's bin: a good shipped past a crate is eased by the steps its last crate reached (its ease
 * today and a step a crate past, held to the floor); every other eased good recovers a step. Unchanged (the same object)
 * when nothing moves. */
export function marketNight(market: Market, bin: Warehouse): Market {
  const next: Record<string, number> = {}
  let moved = false
  const totals = new Map<string, number>()
  for (const [id, row] of Object.entries(bin)) {
    const key = baseGoodId(id)
    totals.set(key, (totals.get(key) ?? 0) + row.reduce((a, b) => a + b, 0))
  }
  const ids = new Set([...Object.keys(market), ...totals.keys()])
  for (const id of ids) {
    const shipped = totals.get(id) ?? 0
    const was = easeOf(market, id)
    const past = cratesPast(shipped)
    const now = past > 0 ? Math.min(EASE_FLOOR, was + past) : Math.max(0, was - 1)
    if (now !== (market[id] ?? 0)) moved = true
    if (now > 0) next[id] = now
  }
  return moved ? next : market
}
