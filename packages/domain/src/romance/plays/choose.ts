// Choose: pick one good from three for her, the gift picker narrowed. The three are seeded, one of
// them a good she loves or likes; a loved one scores 100, a liked one 75, anything else 40, and no pick 0. The taste is
// learnt (`love.known`). An event's pick waits 10 s; Choose isn't an evening. Takes nothing from the Warehouse. Pure.
import type { Taste } from '../chats'
import { type StoryPack } from '../../story/pack'
import { tasteOf } from '../../story/placeholders'
import { pickIndex, shuffled, type Seed } from './grade'
import { pickGoods } from './pick'

/** What she thinks of the good you chose. */
export const CHOOSE_SCORES: Readonly<Record<Taste, number>> = { loved: 100, liked: 75, neutral: 40, disliked: 40 }
/** The pick waits this long. */
export const CHOOSE_MS = 10_000

export interface ChoosePlan {
  goods: [string, string, string]
}

/** Three goods in a seeded order: one of her loved or liked (her line's first goods without a bible), two others. */
export function choosePlan(seed: Seed, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): ChoosePlan {
  const { favourites, others } = pickGoods(pack, id)
  const one = favourites[pickIndex(seed, 0, favourites.length)]!
  const rest = shuffled(others.filter((g) => g !== one), seed, 10).slice(0, 2)
  while (rest.length < 2) rest.push(others[rest.length] ?? one)
  return { goods: shuffled([one, rest[0]!, rest[1]!], seed, 30) as [string, string, string] }
}

/** The pick's score by her taste (no pick: 0, a Fine). */
export function chooseScore(pack: Pick<StoryPack, 'bibles'>, id: string, good: string | null): number {
  return good === null ? 0 : CHOOSE_SCORES[tasteOf(pack, id, good)]
}
