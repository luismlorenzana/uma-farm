// What the loop's plain home shows (F17), as data: the date, the gold, the Umas on the farm with their best rank, and the
// Warehouse's count. F18's map replaces the page.
import { ACTIVITIES, ACTIVITY_NAMES, dateOf, RANKS, SEASON_NAMES, stockTotal, type SaveV3 } from '@farm/domain'

export interface LoopUma {
  outfitId: string
  /** "Hand · Mining", or "Novice" when she has no rank yet. */
  rank: string
}

export interface LoopHomeView {
  /** "Spring 1". */
  date: string
  /** "Year 1". */
  year: string
  gold: string
  home: LoopUma[]
  /** Umas on the roster on their off-season. */
  away: number
  /** Everything in the Warehouse, every star. */
  stock: number
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

export function loopHomeView(save: SaveV3): LoopHomeView {
  const { year, season, day } = dateOf(save.calendar.day)
  return {
    date: `${SEASON_NAMES[season]} ${day}`,
    year: `Year ${year}`,
    gold: `${save.gold.toLocaleString('en-US')}g`,
    home: save.dorm.home.flatMap((id) => (save.roster[id] ? [{ outfitId: id, rank: bestRank(save.roster[id]) }] : [])),
    away: Object.keys(save.roster).length - save.dorm.home.length,
    stock: stockTotal(save.items),
  }
}
