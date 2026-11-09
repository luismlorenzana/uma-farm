// The Diary's counts and the Farm Rank's points (F24 decisions 1–3; core spec CS38, CS39). Each good shipped once is an
// entry; a family's ten raw or ten refined goods shipped once is a row, paying 500g once; milestones pay their gold once.
// All of it is checked at night step 8 (`checkGoals`) and paid that night, and the Farm Rank's points are recomputed
// from the save there: ⌊gold shipped ÷ 100⌋ + 5 × entries + 25 × milestones + 250 × chapters done. Loaded with the night
// and the screens.
import { BLOCK_RULES, cropLevelOf } from '../fields/fields'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { STATION_RULES } from '../gathering/tables'
import { STATIONS } from '../gathering/ids'
import { isGoodId } from '../goods/ids'
import { GOLD_SHIPPED } from '../save/bin'
import { earnGold } from '../save/gold'
import { BLOCK_IDS, type SaveV3 } from '../save/v3'
import { DORM_LEVELS } from './dorm'
import { FARM_RANK_POINTS, farmRankOf } from './farm'
import {
  CHAPTER_POINTS, DIARY_ROWS, ENTRY_POINTS, GOLD_PER_POINT, MILESTONE_POINTS, MILESTONES, milestoneOf, ROW_GOLD, type DiaryRow, type Milestone,
} from './milestones'

/** The goods shipped at least once: the Diary's entries (CS38). */
export const diaryEntries = (save: Pick<SaveV3, 'diary'>): number => Object.entries(save.diary.shipped).filter(([id, n]) => n > 0 && isGoodId(id)).length

/** The milestones paid so far (rows aren't milestones). */
export const milestonesPaid = (save: Pick<SaveV3, 'diary'>): number => save.diary.milestones.filter((id) => milestoneOf(id) !== undefined).length

/** The chapters done: every chapter before the current one. */
export const chaptersDone = (save: Pick<SaveV3, 'farm'>): number => save.farm.chapter - 1

/** Each source of the Farm Rank's points on this save (decision 1). */
export interface FarmPoints {
  shipped: number
  entries: number
  milestones: number
  chapters: number
  total: number
}
export function farmPointsOf(save: Pick<SaveV3, 'farm' | 'diary'>): FarmPoints {
  const shipped = Math.floor((save.farm.counts[GOLD_SHIPPED] ?? 0) / GOLD_PER_POINT)
  const entries = ENTRY_POINTS * diaryEntries(save)
  const milestones = MILESTONE_POINTS * milestonesPaid(save)
  const chapters = CHAPTER_POINTS * chaptersDone(save)
  return { shipped, entries, milestones, chapters, total: shipped + entries + milestones + chapters }
}

/** The save with its Farm Rank's points recomputed (decision 1). */
export const withFarmPoints = <S extends SaveV3>(save: S): S => {
  const points = farmPointsOf(save).total
  return points === save.farm.points ? save : { ...save, farm: { ...save.farm, points } }
}

/** The next rank's threshold, or null at Farm Rank 10. */
export function nextFarmRank(points: number): { rank: number; points: number } | null {
  const rank = farmRankOf(points)
  const at = FARM_RANK_POINTS[rank]
  return at === undefined ? null : { rank: rank + 1, points: at }
}

/** What a Farm Rank opens in the game as built (decision 8, D24 #4: more of what's open), read from the rules that gate
 * on it: the Fields' blocks, the Dorm's levels, the shop's seeds (tier 1 is the start's) and the stations. Rank 10 is
 * the farm's gold crest. */
export function farmRankOpens(rank: number): string[] {
  const blocks = BLOCK_IDS.filter((id) => { const o = BLOCK_RULES[id].opens; return o.by === 'farm-rank' && o.rank === rank })
    .map((id) => `Block ${id} (${BLOCK_RULES[id].cost.toLocaleString('en-US')}g)`)
  const dorm = DORM_LEVELS.filter((l) => l.level > 1 && l.farmRank === rank).map((l) => `Dorm level ${l.level} (${l.beds} beds)`)
  const seeds = rank > 1 && Object.values(SHOP_SEEDS).some((crops) => crops.some((crop) => CROPS[crop].tier === rank)) ? ['New seeds at the shop'] : []
  const stations = STATIONS.filter((s) => { const o = STATION_RULES[s].opens; return o.by === 'farm-rank' && o.rank === rank })
    .map((s) => `The ${s === 'sawmill' ? 'Sawmill' : s === 'smokehouse' ? 'Smokehouse' : 'Mill'} (${STATION_RULES[s].cost.toLocaleString('en-US')}g)`)
  return [...blocks, ...dorm, ...seeds, ...stations, ...(rank === FARM_RANK_POINTS.length ? ['The farm’s gold crest'] : [])]
}

/** The forest areas and fishing spots a haul came home from tonight (night step 4's `notes.made`): depth milestones. */
export type DepthsTonight = ReadonlySet<string>

/** Whether a milestone is reached on this save (decision 2). */
export function milestoneReached(save: Pick<SaveV3, 'farm' | 'roster' | 'crops'>, milestone: Milestone, depths: DepthsTonight): boolean {
  switch (milestone.kind) {
    case 'shipped': return (save.farm.counts[GOLD_SHIPPED] ?? 0) >= milestone.at
    case 'recruited': return Object.keys(save.roster).length >= milestone.at
    case 'rank': return Object.values(save.roster).some((uma) => Object.values(uma.ranks).some((r) => r.rank >= milestone.rank))
    case 'depth': return depths.has(milestone.area)
    case 'crop-level': return Object.values(save.crops).some((points) => cropLevelOf(points ?? 0) >= milestone.level)
  }
}

/** Whether a row's goods have all been shipped once. */
export const rowComplete = (save: Pick<SaveV3, 'diary'>, row: DiaryRow): boolean => row.goods.every((id) => (save.diary.shipped[id] ?? 0) > 0)

/** Pays every milestone and row reached and not yet paid (decisions 2 and 3): its gold now, its id in
 * `diary.milestones`. Milestones in CS38's order, then rows. Never stamps. */
export function payDiary<S extends SaveV3>(save: S, depths: DepthsTonight = new Set()): { save: S; paid: string[] } {
  const held = new Set(save.diary.milestones)
  const milestones = MILESTONES.filter((m) => !held.has(m.id) && milestoneReached(save, m, depths))
  const rows = DIARY_ROWS.filter((r) => !held.has(r.id) && rowComplete(save, r))
  const paid = [...milestones.map((m) => m.id), ...rows.map((r) => r.id)]
  if (paid.length === 0) return { save, paid }
  const gold = milestones.reduce((n, m) => n + m.gold, 0) + ROW_GOLD * rows.length
  const next = earnGold({ ...save, diary: { ...save.diary, milestones: [...save.diary.milestones, ...paid] } }, gold)
  return { save: next, paid }
}

/** The gold a paid id brought: a milestone's, or a row's 500g. */
export const paidGold = (id: string): number => milestoneOf(id)?.gold ?? ROW_GOLD
