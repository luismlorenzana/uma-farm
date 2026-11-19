// What a good sells for: its price ★1 × its star's factor × the
// season's demand, rounded to 5g once, then × the count. The bin pays it overnight; requests, the Restaurant and prizes
// pay more later. Seeds have no price, so the bin refuses them.
import { dateOf } from '../farm/calendar'
import { round5 } from '../farm/round'
import { restaurantBasePrice } from '../restaurant/recipes'
import { isRestaurantDish } from '../restaurant/rules'
import { goodOf, type Good } from './ids'
import { DEMAND, DEMAND_LIFT, MADE_FACTOR, STAR_STEP, type DemandRule } from './rule'

/** Stars run ★1 to ★5. */
export const STARS = [1, 2, 3, 4, 5] as const

function checkStars(stars: number): void {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new RangeError(`Stars run 1–5: ${stars}`)
}

/** A star's factor on the base: ★1 ×1, ★2 ×1.25, ★3 ×1.5, ★4 ×1.75, ★5 ×2. */
export function starFactor(stars: number): number {
  checkStars(stars)
  return 1 + STAR_STEP * (stars - 1)
}

/** Whether a demand rule covers a good: its family, and its refined row when the rule names only that. */
const covers = (rule: DemandRule, good: Pick<Good, 'family' | 'refined'>): boolean => rule.family === good.family && (!rule.refined || good.refined)

/** The rule that puts a good in demand on `day`, or null. */
export function demandRule(id: string, day: number): DemandRule | null {
  const rules = DEMAND[dateOf(day).season]
  if (isRestaurantDish(id)) return rules.find((rule) => rule.family === 'dishes') ?? null
  const good = goodOf(id)
  return good ? rules.find((rule) => covers(rule, good)) ?? null : null
}

/** Whether a good is in the season's demand on `day`: +20% at the bin. */
export const inDemand = (id: string, day: number): boolean => demandRule(id, day) !== null

/** Whether the bin takes an id: every good has a price; seeds and anything else don't. */
export const hasPrice = (id: string): boolean => goodOf(id) !== undefined || isRestaurantDish(id)

export function basePrice(id: string): number {
  const price = restaurantBasePrice(id) ?? goodOf(id)?.price
  if (price === undefined) throw new RangeError(`${id} has no price`)
  return price
}

/** What one of a good at `stars` sells for on `day`: price ★1 × the star's factor × 1.2 in demand, rounded to 5g.
 *Silver Ore 65g; a ★2 Salmon in Summer 165g. */
export const priceOf = (id: string, stars: number, day: number): number => unitPrice(id, stars, inDemand(id, day))

/** What one of a good at `stars` sells for out of demand (the manual's tables). */
export const starPrice = (id: string, stars: number): number => unitPrice(id, stars, false)

function unitPrice(id: string, stars: number, demand: boolean): number {
  return round5(basePrice(id) * starFactor(stars) * (demand ? 1 + DEMAND_LIFT : 1))
}

/** A made good's or a dish's price ★1: ×1.25 the sum of its inputs at ★1, to 5g. */
export function madePrice(inputs: Readonly<Record<string, number>>): number {
  const sum = Object.entries(inputs).reduce((total, [id, n]) => {
    const good = goodOf(id)
    if (!good) throw new RangeError(`${id} has no price`)
    return total + good.price * n
  }, 0)
  return round5(sum * MADE_FACTOR)
}
