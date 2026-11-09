// The roster as `/roster` shows it until F21's ranks and F23's Dorm (F18): the Umas on the farm with their best rank, and
// how many are away. Pure, so the page and the tests read the same.
import { ACTIVITIES, ACTIVITY_NAMES, RANKS, type SaveV3 } from '@farm/domain'

export interface LoopUma {
  outfitId: string
  /** "Hand · Mining", or "Novice" when she has no rank yet. */
  rank: string
}

export interface RosterView {
  home: LoopUma[]
  /** Umas on the roster on their off-season. */
  away: number
}

/** Her best rank: the highest, then the most points, then the activities' order. */
export function bestRank(uma: SaveV3['roster'][string]): string {
  const best = ACTIVITIES.reduce((top, a) => {
    const r = uma.ranks[a]
    const t = uma.ranks[top]
    return r.rank > t.rank || (r.rank === t.rank && r.points > t.points) ? a : top
  })
  const { rank, points } = uma.ranks[best]
  return rank === 0 && points === 0 ? RANKS[0] : `${RANKS[rank]} · ${ACTIVITY_NAMES[best]}`
}

export function rosterView(save: SaveV3): RosterView {
  return {
    home: save.dorm.home.flatMap((id) => (save.roster[id] ? [{ outfitId: id, rank: bestRank(save.roster[id]) }] : [])),
    away: Object.keys(save.roster).length - save.dorm.home.length,
  }
}
