// Pick: goods pop up on a 3 × 3 field for about a second each; tap her favourites (her loved and
// liked goods, starred) and leave the rest. A round shows ten, four of them starred; the starred ones tapped score their
// share of 100, a tap on one that isn't costs 10, never below 0, and the rounds score their mean. An event plays one
// round (about 15 s); an evening three (45 s). An Uma without a bible stars her line's first goods. Pure.
import { goodOf, GOODS, isGoodId } from '../../goods/ids'
import { favouriteOf, type StoryPack } from '../../story/pack'
import { clampScore, meanScore, pickIndex, shuffled, type PlayLength, type Seed } from './grade'

export const PICK_ROUNDS: Readonly<Record<PlayLength, number>> = { event: 1, evening: 3 }
export const PICK_CELLS = 9
export const PICK_POPS = 10
export const PICK_STARS = 4
/** A pop every 1.1 s from 0.6 s, each showing 1.0–1.4 s (seeded), so two can share the field. */
export const PICK_TIMES = { first: 600, every: 1100, show: 1000, spread: 400 } as const
/** What a tap on an unstarred good costs. */
export const PICK_WRONG = 10

/** One good on the field: its cell (0–8), whether it's starred, and when it shows, in ms after the round starts. */
export interface PickPop {
  cell: number
  good: string
  star: boolean
  at: number
  until: number
}
export interface PickPlan {
  rounds: PickPop[][]
}

/** The first goods of a line, starred for an Uma without a bible (her favourites unknown). */
const LINE_GOODS: Readonly<Record<string, readonly string[]>> = {
  farming: ['carrot', 'potato', 'cabbage'], foraging: ['button-mushroom', 'basil', 'apple'], fishing: ['carp', 'trout', 'sardine'],
}

/** Her favourites and the rest: her loved and liked goods, else her line's first goods; the rest are the
 * other raw goods of the same families, grades 1–5. */
export function pickGoods(pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): { favourites: string[]; others: string[] } {
  const gifts = pack.bibles.get(id)?.gifts
  const own = gifts ? [gifts.loved, ...(gifts.liked ?? [])].filter((g): g is string => g !== undefined && isGoodId(g)) : []
  const favourites = own.length > 0 ? own : [...(LINE_GOODS[favouriteOf(pack, id) ?? 'farming'] ?? LINE_GOODS.farming!)].filter(isGoodId)
  const avoid = new Set([...favourites, ...(gifts?.disliked ?? [])])
  const families = new Set(favourites.map((g) => goodOf(g)?.family))
  const others = GOODS.filter((g) => families.has(g.family) && !g.refined && g.grade <= 5 && !avoid.has(g.id)).map((g) => g.id)
  return { favourites, others: others.length > 0 ? others : GOODS.filter((g) => !g.refined && g.grade <= 3 && !avoid.has(g.id)).map((g) => g.id).slice(0, 12) }
}

export function pickPlan(seed: Seed, length: PlayLength, goods: { favourites: readonly string[]; others: readonly string[] }): PickPlan {
  return {
    rounds: Array.from({ length: PICK_ROUNDS[length] }, (_, r) => {
      const base = r * 100
      const stars = new Set(shuffled(Array.from({ length: PICK_POPS }, (_, i) => i), seed, base).slice(0, PICK_STARS))
      const pops: PickPop[] = []
      for (let i = 0; i < PICK_POPS; i++) {
        const at = PICK_TIMES.first + i * PICK_TIMES.every
        const until = at + PICK_TIMES.show + Math.floor(seed(base + 20 + i) * PICK_TIMES.spread)
        const busy = new Set(pops.filter((p) => p.until > at).map((p) => p.cell))
        const free = Array.from({ length: PICK_CELLS }, (_, c) => c).filter((c) => !busy.has(c))
        const cell = free[pickIndex(seed, base + 40 + i, free.length)]!
        const star = stars.has(i)
        const pool = star ? goods.favourites : goods.others
        pops.push({ cell, good: pool[pickIndex(seed, base + 60 + i, pool.length)]!, star, at, until })
      }
      return pops
    }),
  }
}

/** A tap on the field: when (ms after the round started) and which cell. */
export interface PickTap { at: number; cell: number }

/** One round: the starred goods tapped while showing, their share of 100, less 10 a tap on an unstarred one; a good counts
 * once, and a tap on an empty cell is nothing. */
export function pickRound(pops: readonly PickPop[], taps: readonly PickTap[]): number {
  const hit = new Set<number>()
  let wrong = 0
  for (const tap of taps) {
    const i = pops.findIndex((p) => p.cell === tap.cell && tap.at >= p.at && tap.at < p.until)
    if (i === -1 || hit.has(i)) continue
    hit.add(i)
    if (!pops[i]!.star) wrong++
  }
  const stars = pops.filter((p) => p.star).length
  const right = [...hit].filter((i) => pops[i]!.star).length
  return clampScore((stars === 0 ? 0 : (100 * right) / stars) - PICK_WRONG * wrong)
}

export function pickScore(plan: PickPlan, taps: readonly (readonly PickTap[])[]): number {
  return meanScore(plan.rounds.map((pops, i) => pickRound(pops, taps[i] ?? [])))
}
