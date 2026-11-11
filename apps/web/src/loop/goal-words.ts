// The goals' words (F24): a chapter's reward, a Farm Rank and what it opens, a Diary milestone or row, a goal's count.
// The save holds ids and counts; these say them, for the morning, the Diary and the rank's sheet. Loaded on demand with
// those screens. Pure, so the screens and the tests read the same.
import {
  AREA_NAMES, CHAPTER_POINTS, chapterOf, diaryRowOf, FAMILY_NAMES, farmRankOpens, milestoneOf, paidGold, RANKS, SPOT_NAMES, type ForestAreaId, type FishingSpotId,
  type GoalState,
} from '@farm/domain'

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`
const BUILDING_PLANS: Readonly<Record<string, string>> = { mill: 'the Mill’s plans' }

/** A chapter's reward in a line: "+500g, the Mill's plans, a new hand, 250 Farm Rank points". */
export function rewardWords(chapter: number): string {
  const reward = chapterOf(chapter)?.reward
  if (!reward) return ''
  return [`+${gold(reward.gold)}`, ...reward.plans.map((b) => BUILDING_PLANS[b] ?? `${b} plans`), ...(reward.recruit ? ['a new hand'] : []), `${CHAPTER_POINTS} Farm Rank points`].join(', ')
}

/** "Chapter 1 done · +500g, the Mill's plans, a new hand, 250 Farm Rank points". */
export const chapterDoneWords = (chapter: number): string => `Chapter ${chapter} done · ${rewardWords(chapter)}`

/** "Farm Rank 2 · Block B (800g), Dorm level 3 (8 beds), New seeds at the shop". */
export const farmRankWords = (rank: number, version = 3): string => {
  const opens = farmRankOpens(rank, version)
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

/** A goal's count in its own unit: "4 / 9", "620g / 1,000g", "Farm Rank 1 / 2", "Done". */
export function goalCount({ goal, have, done }: GoalState): string {
  if (goal.id === 'rank-hand') return done ? 'Done' : 'Not yet'
  if (goal.id === 'ship') return `${gold(have)} / ${gold(goal.need)}`
  if (goal.id === 'farm-rank') return `Farm Rank ${have} / ${goal.need}`
  if (goal.id === 'second-crop') return `${have} / ${goal.need} kinds`
  return `${have} / ${goal.need}`
}
