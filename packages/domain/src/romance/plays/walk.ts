// Walk: a walk with her along a flat path drawn from today's farm places' frames (not the Hub map
// itself). Before it she says what she loves; at each fork two turns lead toward two places, and the turn toward her
// place scores full, the other half, and none at all nothing. Her place is her line's when it's open today, else a seeded
// one from the farm places her beats use. Two forks (an event, about 20 s) give 50, 75 or 100; four (an evening, about
// 50 s) give 50–100 in eighths. Pure.
import { FARM_PLACES, placeOpen, type FarmPlaceId } from '../../farm/places'
import type { FarmSave } from '../../save/v4'
import { linePlaces, type StoryPack } from '../../story/pack'
import { clampScore, pickIndex, type PlayLength, type Seed } from './grade'

export const WALK_FORKS: Readonly<Record<PlayLength, number>> = { event: 2, evening: 4 }
/** Each fork waits this long for a turn (no turn: nothing). */
export const WALK_FORK_MS = 8000
/** Not on the walk: the Gate and the town edge are where it starts and ends. */
const OFF_PATH: ReadonlySet<FarmPlaceId> = new Set(['gate', 'shop', 'festival', 'expeditions', 'board'])

export type Turn = 'left' | 'right'
export interface WalkFork { left: FarmPlaceId; right: FarmPlaceId }
export interface WalkPlan {
  /** The place she loves, said before the walk. */
  favourite: FarmPlaceId
  forks: WalkFork[]
}

/** Today's open farm places a walk passes. */
export const walkPlacesOpen = (save: Pick<FarmSave, 'farm'>): FarmPlaceId[] => FARM_PLACES.filter((p) => placeOpen(save, p) && !OFF_PATH.has(p.id)).map((p) => p.id)

/** The place she loves on a walk: her line's first place when it's open today, else a seeded one of the open
 * farm places her beats use, else the Fields. */
export function walkFavourite(save: Pick<FarmSave, 'farm'>, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string, seed: Seed): FarmPlaceId {
  const open = new Set(walkPlacesOpen(save))
  const line = linePlaces(pack, id).find((p) => open.has(p))
  if (line) return line
  const beats = [...new Set((pack.bibles.get(id)?.route ?? []).map((b) => b.place).filter((p): p is FarmPlaceId => open.has(p as FarmPlaceId)))]
  return beats.length > 0 ? beats[pickIndex(seed, 90, beats.length)]! : 'fields'
}

export function walkPlan(seed: Seed, length: PlayLength, favourite: FarmPlaceId, places: readonly FarmPlaceId[]): WalkPlan {
  const others = places.filter((p) => p !== favourite)
  const pool = others.length > 0 ? others : (['warehouse'] as FarmPlaceId[])
  return {
    favourite,
    forks: Array.from({ length: WALK_FORKS[length] }, (_, i) => {
      const other = pool[pickIndex(seed, i, pool.length)]!
      return seed(50 + i) < 0.5 ? { left: favourite, right: other } : { left: other, right: favourite }
    }),
  }
}

/** Each fork's turn, or null for none: her place full, the other half, none nothing; their share of 100. */
export function walkScore(plan: WalkPlan, turns: readonly (Turn | null)[]): number {
  const total = plan.forks.reduce((sum, fork, i) => {
    const turn = turns[i]
    return sum + (turn === undefined || turn === null ? 0 : fork[turn] === plan.favourite ? 1 : 0.5)
  }, 0)
  return clampScore((100 * total) / plan.forks.length)
}
