// The story's chapters (F24 decisions 4 and 5; core spec CS42, CS43): chapter 1's six goals, each read from a counter or
// the save, its reward, and chapter 2's line ("Soon" until M5). Night step 8 (`checkGoals`) pays the Diary, recomputes
// the Farm Rank, and completes the chapter the night its last goal is met: 500g, the Mill's plans, a recruit and the
// chapter's 250 points, then the next chapter opens, counting from its own start (`farm.goals`). The closing scene plays
// the next morning (`scenes.ts`). Loaded with the night and the screens.
import { payDiary, withFarmPoints, type DepthsTonight } from '../farm/diary'
import { joinRoster } from '../farm/dorm'
import { farmRankOf } from '../farm/farm'
import { RANKS } from '../farm/ranks'
import type { TalentOf } from '../farm/talents'
import { recruitFor } from '../farm/visitors'
import { PLOTS_HARVESTED } from '../fields/fields'
import { FISHING_SPOTS, FOREST_AREAS } from '../gathering/ids'
import { HOME_COUNT, type MadeTonight } from '../gathering/kinds'
import { GOLD_SHIPPED } from '../save/bin'
import { earnGold } from '../save/gold'
import { arrive, chapterArrival } from '../romance/arrivals'
import type { BuildingId, OutfitId, SaveV3 } from '../save/v3'
import type { SaveV4 } from '../save/v4'
import type { StoryPack } from './pack'
import type { FarmSave } from '../save/v4'

/** One of a chapter's goals: its words, what it teaches, and how far the save has come. `need` is what completes it. */
export interface Goal {
  readonly id: string
  readonly text: string
  readonly teaches: string
  readonly need: number
  /** Where the save stands, from the chapter's start where the goal counts a lifetime counter. */
  readonly have: (save: FarmSave) => number
}

/** What a chapter pays when it completes (CS42, CS43). The Farm Rank's 250 points come from `chaptersDone`. */
export interface ChapterReward {
  readonly gold: number
  /** Buildings whose plans it gives: `buildings[id] = 0`. */
  readonly plans: readonly BuildingId[]
  readonly recruit: boolean
}

export interface Chapter {
  readonly chapter: number
  readonly title: string
  /** What it opens with, in a line. */
  readonly opens: string
  /** Null while its goals aren't built: the Diary says "Soon" (chapter 2 until M5). */
  readonly goals: readonly Goal[] | null
  readonly reward: ChapterReward | null
}

/** A lifetime counter since the current chapter opened (decision 4): `farm.goals` holds each counter as it stood then. */
export const sinceChapter = (save: Pick<FarmSave, 'farm'>, key: string): number => (save.farm.counts[key] ?? 0) - (save.farm.goals[key] ?? 0)

/** CS42's six goals, read as decision 4 has it. */
export const CHAPTER_1_GOALS: readonly Goal[] = [
  { id: 'harvest', text: 'Plant and harvest 9 crops', teaches: 'Planting, tending, Ready plots', need: 9, have: (s) => sinceChapter(s, PLOTS_HARVESTED) },
  { id: 'ship', text: 'Ship 1,000g at the bin', teaches: 'The bin, the overnight payout', need: 1000, have: (s) => sinceChapter(s, GOLD_SHIPPED) },
  {
    id: 'bring-home', text: 'Bring home 10 things from the Woods or the Pond', teaches: 'Assigning, the job sheet, collecting', need: 10,
    have: (s) => sinceChapter(s, HOME_COUNT.forest) + sinceChapter(s, HOME_COUNT.fishery),
  },
  { id: 'second-crop', text: 'Grow a second kind of crop', teaches: 'The shop', need: 2, have: (s) => Object.keys(s.crops).length },
  {
    id: 'rank-hand', text: `Rank an Uma up to ${RANKS[1]}`, teaches: 'Ranks and challenges', need: 1,
    have: (s) => (Object.values(s.roster).some((uma) => Object.values(uma.ranks).some((r) => r.rank >= 1)) ? 1 : 0),
  },
  { id: 'farm-rank', text: 'Reach Farm Rank 2', teaches: 'The Farm’s Rank, Block B', need: 2, have: (s) => farmRankOf(s.farm.points) },
]

/** The chapters as built: chapter 1 whole, chapter 2's line (its goals come with M5). */
export const CHAPTERS: readonly Chapter[] = [
  { chapter: 1, title: 'A Field Again', opens: 'The Fields, the Woods and the Pond', goals: CHAPTER_1_GOALS, reward: { gold: 500, plans: ['mill'], recruit: true } },
  { chapter: 2, title: 'Feathers and Fences', opens: 'The Coop and two chickens (Dale Hart)', goals: null, reward: null },
]
export const chapterOf = (chapter: number): Chapter | undefined => CHAPTERS.find((c) => c.chapter === chapter)

/** One goal as the save stands: its count (held at its need) and whether it's met. */
export interface GoalState {
  readonly goal: Goal
  readonly have: number
  readonly done: boolean
}
/** The current chapter's goals as the save stands, or null when they aren't built yet ("Soon"). */
export function goalStates(save: FarmSave): GoalState[] | null {
  const goals = chapterOf(save.farm.chapter)?.goals
  return goals ? goals.map((goal) => { const have = Math.max(0, goal.have(save)); return { goal, have: Math.min(have, goal.need), done: have >= goal.need } }) : null
}
/** Every goal of the current chapter is met. */
export const chapterMet = (save: FarmSave): boolean => goalStates(save)?.every((g) => g.done) ?? false

/** Completes the current chapter (decision 5): its gold, its plans (a building not yet held becomes 0), its recruit, then
 * the next chapter opens counting from now. On v3 the recruit is `recruitFor`'s, joined with `joinRoster` (home, or away
 * with no bed free); on v4 (F46 decision 8) it's the chapter's authored arrival from the pack, joined with `arrive`, and
 * nothing is drawn, her ties seeded (F52). The 250 points follow from `chaptersDone`. Never stamps. */
export function completeChapter<S extends FarmSave>(save: S, release: readonly OutfitId[], talentOf: TalentOf, story?: Pick<StoryPack, 'cast' | 'ties'>): { save: S; recruit: OutfitId | null } {
  const reward = chapterOf(save.farm.chapter)?.reward
  if (!reward) return { save, recruit: null }
  let next = earnGold(save, reward.gold)
  const plans = Object.fromEntries(reward.plans.filter((b) => next.buildings[b] === undefined).map((b) => [b, 0]))
  next = { ...next, buildings: { ...next.buildings, ...plans } }
  if (next.version === 4) {
    const v4: SaveV4 = next
    const entry = reward.recruit && story ? chapterArrival(story, v4.farm.chapter) : null
    const recruit = entry && !v4.roster[entry.characterId] ? entry.characterId : null
    const joined = recruit ? arrive(v4, recruit, story ?? null).save : v4
    return { save: { ...joined, farm: { ...joined.farm, chapter: joined.farm.chapter + 1, goals: { ...joined.farm.counts } } } as unknown as S, recruit }
  }
  const v3: SaveV3 = next
  const recruit = reward.recruit ? recruitFor(v3, release, talentOf).outfitId : null
  if (recruit) next = joinRoster(next, recruit).save
  next = { ...next, farm: { ...next.farm, chapter: next.farm.chapter + 1, goals: { ...next.farm.counts } } }
  return { save: next, recruit }
}

/** The forest areas and fishing spots a haul came home from tonight. */
export function depthsTonight(made: readonly MadeTonight[]): DepthsTonight {
  const places: readonly string[] = [...FOREST_AREAS, ...FISHING_SPOTS]
  return new Set(made.filter((m) => m.items.length > 0 && (m.request.kind === 'forage' || m.request.kind === 'fish') && places.includes(m.request.item)).map((m) => m.request.item))
}

/** What step 8's goals did tonight, for the morning. */
export interface GoalsTonight {
  /** The chapter completed tonight, or null. */
  chapter: number | null
  /** Milestones and rows paid tonight. */
  paid: string[]
  /** Farm Ranks reached tonight, lowest first. */
  ranks: number[]
}

/** Night step 8's `checkGoals` (decisions 1, 2, 4 and 5): the Diary pays what's reached, the Farm Rank is recomputed, and
 * the chapter completes when its last goal is met, after which the Diary and the rank are checked again (the recruit
 * counts toward "Umas recruited", the chapter's points toward the rank). */
export function checkGoalsNight<S extends FarmSave>(save: S, release: readonly OutfitId[], talentOf: TalentOf, made: readonly MadeTonight[], story?: Pick<StoryPack, 'cast' | 'ties'>): { save: S; tonight: GoalsTonight } {
  const depths = depthsTonight(made)
  const before = farmRankOf(save.farm.points)
  const first = payDiary(save, depths)
  let next = withFarmPoints(first.save)
  let paid = first.paid
  let chapter: number | null = null
  if (chapterMet(next)) {
    chapter = next.farm.chapter
    const again = payDiary(completeChapter(next, release, talentOf, story).save, depths)
    next = withFarmPoints(again.save)
    paid = [...paid, ...again.paid]
  }
  const after = farmRankOf(next.farm.points)
  const ranks = Array.from({ length: Math.max(0, after - before) }, (_, i) => before + 1 + i)
  return { save: next, tonight: { chapter, paid, ranks } }
}

