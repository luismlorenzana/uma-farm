// The Diary's counts and the Farm Rank's points. Each good shipped once is an
// entry; a family's ten raw or ten refined goods shipped once is a row, paying 500g once; milestones pay their gold once.
// All of it is checked at night step 8 (`checkGoals`) and paid that night, and the Farm Rank's points are recomputed
// from the save there, from income and resources only: ⌊gold shipped ÷ 100⌋ + 5 × entries + 25 × milestones. Loaded
// with the night and the screens.
import { cropLevelOf } from '../fields/fields'
import { CROPS, SHOP_SEEDS } from '../fields/crops'
import { AREA_NAMES, FISHING_SPOTS, FOREST_AREAS, SPOT_NAMES } from '../gathering/ids'
import { FARMER_REACH } from '../gathering/hauls'
import { RANK_FLOORS } from '../gathering/digs'
import { ANIMALS } from '../ranch/ranch'
import { ANIMAL_KINDS, type AnimalKind } from '../save/v4'
import { FISHERY, FOREST } from '../gathering/tables'
import { isGoodOrRingId } from '../goods/ids'
import { GOLD_SHIPPED } from '../save/bin'
import { earnGold } from '../save/gold'
import type { FarmSave } from '../save/v4'
import { DORM_LEVELS } from './dorm'
import { FIELD_PLOTS, plotName } from '../fields/plots'
import { STATION_LEVELS } from '../gathering/stations'
import { KITCHEN_LEVELS } from '../kitchen/levels'
import { buildCostWords, offeredAt } from './builds'
import { FARM_RANK_POINTS, farmRankOf } from './farm'
import {
  DIARY_ROWS, ENTRY_POINTS, GOLD_PER_POINT, MILESTONE_POINTS, MILESTONES, milestoneOf, ROW_GOLD, type DiaryRow, type Milestone,
} from './milestones'

/** The goods shipped at least once: the Diary's entries, a ring among them. */
export const diaryEntries = (save: Pick<FarmSave, 'diary'>): number => Object.entries(save.diary.shipped).filter(([id, n]) => n > 0 && isGoodOrRingId(id)).length

/** The milestones paid so far (rows aren't milestones). */
export const milestonesPaid = (save: Pick<FarmSave, 'diary'>): number => save.diary.milestones.filter((id) => milestoneOf(id) !== undefined).length

/** Each source of the Farm Rank's points on this save. */
export interface FarmPoints {
  shipped: number
  entries: number
  milestones: number
  total: number
}
export function farmPointsOf(save: Pick<FarmSave, 'farm' | 'diary'>): FarmPoints {
  const shipped = Math.floor((save.farm.counts[GOLD_SHIPPED] ?? 0) / GOLD_PER_POINT)
  const entries = ENTRY_POINTS * diaryEntries(save)
  const milestones = MILESTONE_POINTS * milestonesPaid(save)
  return { shipped, entries, milestones, total: shipped + entries + milestones }
}

/** The save with its Farm Rank's points recomputed. */
export const withFarmPoints = <S extends FarmSave>(save: S): S => {
  const points = farmPointsOf(save).total
  return points === save.farm.points ? save : { ...save, farm: { ...save.farm, points } }
}

/** The next rank's threshold, or null at Farm Rank 10. */
export function nextFarmRank(points: number): { rank: number; points: number } | null {
  const rank = farmRankOf(points)
  const at = FARM_RANK_POINTS[rank]
  return at === undefined ? null : { rank: rank + 1, points: at }
}

/** What a Farm Rank opens in the game as built, read from the rules that gate on it: the places it offers to build, a
 * place whose game isn't built yet as "not built yet", the forest's areas and the Fishery's spots in the farmer's reach,
 * the field's plots to clear, the stations' levels, the Dorm's levels (the Dorm for 20) and the shop's seeds (tier 1 is the
 * start's). Rank 10 is the farm's gold crest. */
export function farmRankOpens(rank: number): string[] {
  const areas = FOREST_AREAS.filter((id) => rank > 1 && FARMER_REACH[FOREST[id].opens] === rank).map((id) => cap(AREA_NAMES[id]))
  const spots = FISHING_SPOTS.filter((id) => rank > 1 && FARMER_REACH[FISHERY[id].opens] === rank)
    .map((id) => `${cap(SPOT_NAMES[id])}${FISHERY[id].needs ? ` (with the ${FISHERY[id].needs === 'dock' ? 'Dock' : 'Boat'})` : ''}`)
  const dorm = DORM_LEVELS.filter((l) => l.level > 1 && l.farmRank === rank).map((l) => `Dorm level ${l.level} (${l.beds} beds)`)
  const plots = FIELD_PLOTS.flatMap((p, i) => (p.by === 'clear' && p.rank === rank ? [`${plotName(i)} to clear (${p.gold.toLocaleString('en-US')}g)`] : []))
  const levels = [
    ...STATION_LEVELS.filter((l) => l.level > 1 && l.farmRank === rank).map((l) => `Station level ${l.level} (${l.loads} loads a day)`),
    ...KITCHEN_LEVELS.filter((l) => l.level > 1 && l.farmRank === rank).map((l) => `Kitchen level ${l.level} (${l.dishes} dishes a play)`),
  ]
  const seeds = rank > 1 && Object.values(SHOP_SEEDS).some((crops) => crops.some((crop) => CROPS[crop].tier === rank)) ? ['New seeds at the shop'] : []
  const builds = offeredAt(rank).map((p) => `The ${p.name} to build (${p.opens.game ? buildCostWords(p) : 'not built yet'})`)
  const animals = ANIMAL_KINDS.filter((kind) => ANIMALS[kind].rank === rank).map((kind) => ANIMAL_PLURALS[kind])
  const ranch = animals.length > 0 ? [`${listWords(animals)} at the rancher’s`] : []
  const floor = RANK_FLOORS[FARMER_REACH.indexOf(rank)]
  const digs = floor !== undefined && rank >= MINE_RANK ? [`The Mine’s and the Quarry’s floors to ${floor}`] : []
  return [...builds, ...plots, ...levels, ...areas, ...spots, ...ranch, ...digs, ...dorm, ...seeds, ...(rank === FARM_RANK_POINTS.length ? ['The farm’s gold crest'] : [])]
}
/** The animals by name, more than one. */
const ANIMAL_PLURALS: Readonly<Record<AnimalKind, string>> = {
  chicken: 'Chickens', duck: 'Ducks', cow: 'Cows', goat: 'Goats', sheep: 'Sheep', alpaca: 'Alpacas', 'cashmere-goat': 'Cashmere Goats',
}
/** The Mine's Farm Rank: the digs' floors are news from it. */
const MINE_RANK = 4
const listWords = (items: readonly string[]): string => (items.length <= 1 ? items[0] ?? '' : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** The forest areas and fishing spots worked today (`today.gathered`): depth milestones. */
export type DepthsTonight = ReadonlySet<string>

/** Whether a milestone is reached on this save. */
export function milestoneReached(save: Pick<FarmSave, 'farm' | 'roster' | 'crops'>, milestone: Milestone, depths: DepthsTonight): boolean {
  switch (milestone.kind) {
    case 'shipped': return (save.farm.counts[GOLD_SHIPPED] ?? 0) >= milestone.at
    case 'recruited': return Object.keys(save.roster).length >= milestone.at
    case 'rank': return Object.values(save.roster).some((uma) => Object.values(uma.ranks).some((r) => r.rank >= milestone.rank))
    case 'depth': return depths.has(milestone.area)
    case 'crop-level': return Object.values(save.crops).some((points) => cropLevelOf(points ?? 0) >= milestone.level)
  }
}

/** Whether a row's goods have all been shipped once. */
export const rowComplete = (save: Pick<FarmSave, 'diary'>, row: DiaryRow): boolean => row.goods.every((id) => (save.diary.shipped[id] ?? 0) > 0)

/** Pays every milestone and row reached and not yet paid: its gold now, its id in
 * `diary.milestones`. Milestones in their order, then rows. Never stamps. */
export function payDiary<S extends FarmSave>(save: S, depths: DepthsTonight = new Set()): { save: S; paid: string[] } {
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

/** The forest areas and fishing spots worked today. */
export function depthsTonight(gathered: readonly string[]): DepthsTonight {
  const places: readonly string[] = [...FOREST_AREAS, ...FISHING_SPOTS]
  return new Set(gathered.filter((id) => places.includes(id)))
}

/** What step 8's goals did tonight, for the morning. */
export interface GoalsTonight {
  /** Milestones and rows paid tonight. */
  paid: string[]
  /** Farm Ranks reached tonight, lowest first. */
  ranks: number[]
}

/** Night step 8's `checkGoals`: the Diary pays what's reached (a depth by the areas and spots worked today), and the
 * Farm Rank is recomputed. */
export function checkGoalsNight<S extends FarmSave>(save: S, gathered: readonly string[]): { save: S; tonight: GoalsTonight } {
  const before = farmRankOf(save.farm.points)
  const { save: paid, paid: ids } = payDiary(save, depthsTonight(gathered))
  const next = withFarmPoints(paid)
  const after = farmRankOf(next.farm.points)
  const ranks = Array.from({ length: Math.max(0, after - before) }, (_, i) => before + 1 + i)
  return { save: next, tonight: { paid: ids, ranks } }
}
