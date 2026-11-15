// The goals' words: a Farm Rank and what it opens, a Diary milestone or row, a place built overnight, and the milestones
// with the Umas. The save holds ids and counts; these say them, for the morning, the Diary's projects and the rank's sheet.
// Loaded on demand with those screens. Pure, so the screens and the tests read the same.
import {
  AREA_NAMES, diaryRowOf, FAMILY_NAMES, farmPlace, farmRankOpens, KITCHEN_LEVELS, milestoneOf, paidGold, RANKS, SPOT_NAMES, type ForestAreaId, type FishingSpotId, type UmaMilestone,
} from '@farm/domain'

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`
const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']

/** "Farm Rank 2 · The Coop to build (not built yet), Block B (800g), Dorm level 3 (7 beds), New seeds at the shop". */
export const farmRankWords = (rank: number): string => {
  const opens = farmRankOpens(rank)
  return opens.length > 0 ? `Farm Rank ${rank} · ${opens.join(', ')}` : `Farm Rank ${rank}`
}

/** What a milestone or row is, without its gold: "10,000g shipped", "First haul from the Hills", "Woods, every grade". */
export function milestoneName(id: string): string {
  const m = milestoneOf(id)
  if (m) {
    switch (m.kind) {
      case 'shipped': return `${gold(m.at)} shipped`
      case 'recruited': return `${m.at} Umas on the roster`
      case 'rank': return `First Uma at ${RANKS[m.rank]}`
      case 'depth': return `First haul from ${m.place === 'forest' ? AREA_NAMES[m.area as ForestAreaId] : SPOT_NAMES[m.area as FishingSpotId]}`
      case 'crop-level': return `A crop at level ${m.level}`
    }
  }
  const row = diaryRowOf(id)
  return row ? `${FAMILY_NAMES[row.family]}${row.refined ? ', refined' : ''}: every grade shipped` : id
}

/** A milestone or row paid tonight: "10,000g shipped · +300g". */
export const milestoneWords = (id: string): string => `${milestoneName(id)} · +${gold(paidGold(id))}`

/** A place built overnight: "Built overnight · the Mill"; a station's new level: "The Mill · level 2 · 2 loads a day". */
export const builtWords = (place: string, level?: number): string =>
  (level ? `The ${farmPlace(place)?.name ?? place} · level ${level} · ${place === 'kitchen' ? `${KITCHEN_LEVELS[level - 1]?.dishes ?? 0} dishes a play` : `${level} loads a day`}`
    : `Built overnight · the ${farmPlace(place)?.name ?? place}`)

/** A milestone with the Umas in words: what it opens, what it waits for, and how far along: "House 1 · Your first
 * wedding · 0 / 1". */
export function umaMilestoneWords(m: UmaMilestone): { what: string; need: string; count: string } {
  const count = `${m.have} / ${m.need}`
  switch (m.kind) {
    case 'bench': return { what: 'The ring bench', need: 'The first Romance 8', count: m.done ? 'Done' : 'Not yet' }
    case 'house': return { what: `House ${m.n}`, need: `Your ${ORDINALS[m.n] ?? `${m.n}th`} wedding`, count: `${count} married` }
    case 'row': return { what: `The homestead’s ${ORDINALS[m.row]} row`, need: `${m.need} married`, count: `${count} married` }
    case 'board': return { what: 'The Requests board', need: `${m.need} Umas met`, count: `${count} met` }
  }
}
