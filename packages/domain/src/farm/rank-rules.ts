// Ranks: each Uma climbs six ranks in each of the nine activities.
// A day of work pays rank points in its activity; a rank comes when its points are reached and its challenge is met,
// at night (step 6). A rank pays: more yield, faster tending, better stars, deeper places, more seeds back. Her favourite
// line (the story pack's, `favouriteOf`) is where she earns ×1.2 points; she can work anywhere. `farm/ranks.ts` holds
// the ladder the save needs; this file holds the rest, loaded with the loop's screens and the night.
import type { FestivalId } from './calendar'
import type { FishingSpotId, ForestAreaId } from '../gathering/ids'
import type { RankLine } from '../night/summary'
import type { LoopPlaceId } from '../save/parse-v4'
import type { OutfitId, RankState, RegionId } from '../save/v4'
import { ACTIVITIES, LINE_ACTIVITY, RANK_POINTS, type Activity, type Rank } from './ranks'
import { talentRankPoints, type TalentStep } from './talents'
import type { FarmSave, Love } from '../save/v4'

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

// --- Rank points ----------------------------------------------------------------------------------------

/** A day of work pays 10 points in its activity. */
export const DAY_POINTS = 10
/** ×1.2 in her favourite line. */
export const FAVOURITE_POINTS = 1.2
/** ×1.25 well fed. */
export const WELL_FED_POINTS = 1.25
/** Her friendship's factor: ×1.05 from Friendship 5, ×1.10 from Friendship 10 on, through her confession, romance and
 * spouse (the F5 and F10 perks). No falls. */
export const loveRankFactor = (love: Pick<Love, 'stage' | 'level'>): number => {
  if (love.stage !== 'friendship') return 1.1
  return love.level >= 10 ? 1.1 : love.level >= 5 ? 1.05 : 1
}
/** The hearts' factor: her friendship's (`loveRankFactor`), ×1 before her route starts. */
export function heartsFactorOf(save: Pick<FarmSave, 'love'>, id: OutfitId): number {
  const love = save.love[id]
  return love ? loveRankFactor(love) : 1
}

/** What lifts her points: her talent in the activity, whether it's her favourite, well fed, and the hearts' factor (her
 * friendship level's: `heartsFactorOf`). */
export interface PointTerms {
  talent: TalentStep
  favourite: boolean
  wellFed: boolean
  /** ×1, ×1.05 or ×1.10. */
  heartsFactor: number
  /** A mentor's ×1.10 at her place today; absent is ×1. */
  mentor?: number
}

/** Points for a pay of `base` (every pay takes the same factors): base × her talent's factor × 1.2 in her
 * favourite line × 1.25 well fed × her hearts' factor × a mentor's, to a millionth. A day's work is `DAY_POINTS`; a
 * workshop play and an expedition pass their own base. */
export function rankPoints(base: number, terms: PointTerms): number {
  return round6(base * talentRankPoints(terms.talent) * (terms.favourite ? FAVOURITE_POINTS : 1) * (terms.wellFed ? WELL_FED_POINTS : 1) * terms.heartsFactor * (terms.mentor ?? 1))
}
/** A day of work's points: 10 × her factors. */
export const rankPointsForDay = (terms: PointTerms): number => rankPoints(DAY_POINTS, terms)

/** Days of work to reach `rank`'s points at a day's pay, challenges met. */
export const daysToRank = (rank: Rank, perDay: number): number => (rank === 0 ? 0 : Math.ceil(RANK_POINTS[rank]! / perDay - 1e-9))

// --- Her favourite line -------------------------------------------------------------------------------------

/** The activities that can be a favourite, her favourite line's (Metal and Stone mining, Wood foraging, Fish fishing,
 * Vegetables farming), in the activities' order. The ranch, the workshops and expeditions are nobody's favourite. */
export const FAVOURITE_ACTIVITIES: readonly Activity[] = ACTIVITIES.filter((a) => Object.values(LINE_ACTIVITY).includes(a))

// --- Who worked today ---------------------------------------------------------------------------------

/** The activity a day at each work place pays: the forest and the Sawmill foraging, the Fishery and the Smokehouse
 * fishing, the Mill farming; the Mine, the Quarry, the Smelter and the Cutter mining; the Coop and the Barn the ranch. The
 * Fields' tenders are farming. */
export const PLACE_ACTIVITY: Readonly<Record<LoopPlaceId, Activity>> = {
  forest: 'foraging', sawmill: 'foraging', fishery: 'fishing', smokehouse: 'fishing', mill: 'farming',
  mine: 'mining', quarry: 'mining', smelter: 'mining', cutter: 'mining', coop: 'ranch', barn: 'ranch',
}

// --- What a rank gives --------------------------------------------------------------------------------------

/** What one rank gives. */
export interface RankBenefits {
  /** Gathering yield. */
  readonly yield: number
  /** A tended block's growth a night, before her talent and tools. */
  readonly tendedGrowth: number
  /** Quality points (the rank term). */
  readonly quality: number
  /** The deepest place she may work: the Mine's and the Quarry's floor, the forest's area, the Fishery's spot. */
  readonly deepest: { readonly floor: number; readonly forest: ForestAreaId; readonly fishery: FishingSpotId }
  readonly expeditionPower: number
  /** A tended harvest's chance of a seed back, before the Hoe. */
  readonly seedsBack: number
  /** Affection a day an animal in her care gains. */
  readonly affection: number
  /** A workshop play's yield as its assistant. */
  readonly workshopYield: number
}

/** What each rank gives, Novice … Legend. */
export const RANK_BENEFITS: readonly RankBenefits[] = [
  { yield: 1, tendedGrowth: 1.25, quality: 0, deepest: { floor: 5, forest: 'woods', fishery: 'pond' }, expeditionPower: 10, seedsBack: 0.1, affection: 0, workshopYield: 1 },
  { yield: 1.15, tendedGrowth: 1.35, quality: 0.5, deepest: { floor: 10, forest: 'hills', fishery: 'river' }, expeditionPower: 20, seedsBack: 0.15, affection: 3, workshopYield: 1.1 },
  { yield: 1.3, tendedGrowth: 1.45, quality: 1, deepest: { floor: 15, forest: 'old-forest', fishery: 'lake' }, expeditionPower: 30, seedsBack: 0.2, affection: 6, workshopYield: 1.2 },
  { yield: 1.5, tendedGrowth: 1.55, quality: 1.5, deepest: { floor: 20, forest: 'mountain', fishery: 'falls' }, expeditionPower: 40, seedsBack: 0.25, affection: 9, workshopYield: 1.3 },
  { yield: 1.7, tendedGrowth: 1.65, quality: 2, deepest: { floor: 25, forest: 'misty-vale', fishery: 'deep-sea' }, expeditionPower: 50, seedsBack: 0.3, affection: 12, workshopYield: 1.4 },
  { yield: 2, tendedGrowth: 1.75, quality: 2.5, deepest: { floor: 30, forest: 'world-tree', fishery: 'moon-pool' }, expeditionPower: 60, seedsBack: 0.35, affection: 15, workshopYield: 1.5 },
]
export const rankBenefits = (rank: Rank): RankBenefits => RANK_BENEFITS[rank]!
/** Quality points from her rank (the rank term): 0.5 a rank, Novice 0 … Legend 2.5. */
export const rankQuality = (rank: Rank): number => rankBenefits(rank).quality

// --- The challenges --------------------------------------------------------------------------

/** A workshop play's tier. */
export type PlayGrade = 'rough' | 'good' | 'fine' | 'masterwork'
const PLAY_GRADES: readonly PlayGrade[] = ['rough', 'good', 'fine', 'masterwork']
/** An expedition's result. */
export type ExpeditionResult = 'failure' | 'partial' | 'success' | 'great'

/** What happened, for a challenge: each part of the game reports its own, for the Uma who did it. */
export type ChallengeEvent =
  /** Farming: the crops a harvest she tended brought, by star, and the crop's level. */
  | { kind: 'harvest'; stars: readonly number[]; level: number }
  /** The ranch: a day caring for animals; an animal in her care reaching `hearts`. */
  | { kind: 'care' }
  | { kind: 'hearts'; hearts: number }
  /** Mining: ores or stones dug at a floor of the Mine or the Quarry. */
  | { kind: 'dig'; floor: number; items: number }
  /** Fishing: fish caught at a spot. */
  | { kind: 'catch'; spot: FishingSpotId; fish: number }
  /** Foraging: items gathered in an area. */
  | { kind: 'gather'; area: ForestAreaId; items: number }
  /** Cooking, serving and forging: a workshop play she assisted, by its tier. */
  | { kind: 'play'; grade: PlayGrade }
  /** Cooking: dishes made, by star. */
  | { kind: 'dishes'; stars: readonly number[] }
  /** Serving: guests served. */
  | { kind: 'guests'; guests: number }
  /** Forging: a tool upgrade, or a Mythril tool. */
  | { kind: 'forged'; tool: 'upgrade' | 'mythril' }
  /** Expeditions: a return home, its result and its region's level. */
  | { kind: 'expedition'; result: ExpeditionResult; level: number; region: RegionId }
  /** 1st at a festival: the Flower Show, the Fishing Derby, the Cooking Contest, the Animal Show. */
  | { kind: 'won'; festival: FestivalId }

type Counter = (event: ChallengeEvent) => number
function on<K extends ChallengeEvent['kind']>(kind: K, count: (event: Extract<ChallengeEvent, { kind: K }>) => number): Counter {
  return (event) => (event.kind === kind ? Math.max(0, Math.floor(count(event as Extract<ChallengeEvent, { kind: K }>))) : 0)
}
const yes = (ok: boolean): number => (ok ? 1 : 0)
const atLeast = (grade: PlayGrade, least: PlayGrade): boolean => PLAY_GRADES.indexOf(grade) >= PLAY_GRADES.indexOf(least)
const won = (festival: FestivalId): Counter => on('won', (e) => yes(e.festival === festival))
const successful = (result: ExpeditionResult): boolean => result === 'success' || result === 'great'

/** One rank's challenge: the rank it opens, its target, its words, what counts it, and what an event adds. */
export interface Challenge {
  readonly rank: Rank
  readonly target: number
  readonly what: string
  /** What counts it, in words (lower case: the live tables capitalise it). */
  readonly by: string
  readonly count: Counter
}
const row = (rank: Rank, target: number, what: string, by: string, count: Counter): Challenge => ({ rank, target, what, by, count })

/** Each activity's five challenges, toward Hand … Legend. Each depth challenge is "reach the deepest place your
 * rank allows". A challenge counts from her last rank-up in its activity. */
export const CHALLENGES: Readonly<Record<Activity, readonly Challenge[]>> = {
  farming: [
    row(1, 30, 'Harvest 30 crops she tended', 'at harvest, for the tender', on('harvest', (e) => e.stars.length)),
    row(2, 40, '40 crops of ★3+ she tended', 'at harvest, for the tender', on('harvest', (e) => e.stars.filter((s) => s >= 3).length)),
    row(3, 1, 'Tend a crop of level 4+ to harvest', 'at harvest, for the tender', on('harvest', (e) => yes(e.level >= 4 && e.stars.length > 0))),
    row(4, 30, '30 crops of ★5', 'at harvest, for the tender', on('harvest', (e) => e.stars.filter((s) => s === 5).length)),
    row(5, 1, '1st at a Flower Show with a crop she tended', 'a festival win (festivals aren’t built yet)', won('flower-show')),
  ],
  ranch: [
    row(1, 10, 'Care for animals 10 days', 'a farmhand’s night at the Coop or the Barn', on('care', () => 1)),
    row(2, 1, 'An animal in her care reaches 4 hearts', 'a farmhand’s care for an animal', on('hearts', (e) => yes(e.hearts >= 4))),
    row(3, 1, 'An animal in her care reaches 7 hearts', 'a farmhand’s care for an animal', on('hearts', (e) => yes(e.hearts >= 7))),
    row(4, 1, 'An animal in her care reaches 10 hearts', 'a farmhand’s care for an animal', on('hearts', (e) => yes(e.hearts >= 10))),
    row(5, 1, '1st at an Animal Show with an animal in her care', 'a festival win (festivals aren’t built yet)', won('animal-show')),
  ],
  mining: [
    row(1, 40, 'Dig 40 ores or stones', 'a farmhand’s faces at the Mine or the Quarry', on('dig', (e) => e.items)),
    row(2, 1, 'Dig at floor 10', 'a farmhand’s faces at the Mine or the Quarry', on('dig', (e) => yes(e.floor >= 10))),
    row(3, 1, 'Dig at floor 15', 'a farmhand’s faces at the Mine or the Quarry', on('dig', (e) => yes(e.floor >= 15))),
    row(4, 1, 'Dig at floor 20', 'a farmhand’s faces at the Mine or the Quarry', on('dig', (e) => yes(e.floor >= 20))),
    row(5, 1, 'Dig at floor 25', 'a farmhand’s faces at the Mine or the Quarry', on('dig', (e) => yes(e.floor >= 25))),
  ],
  fishing: [
    row(1, 30, 'Catch 30 fish', 'the night’s catches (night step 4)', on('catch', (e) => e.fish)),
    row(2, 10, 'Catch 10 fish at the River', 'the night’s catches (night step 4)', on('catch', (e) => (e.spot === 'river' ? e.fish : 0))),
    row(3, 10, 'Catch 10 fish at the Lake', 'the night’s catches (night step 4)', on('catch', (e) => (e.spot === 'lake' ? e.fish : 0))),
    row(4, 10, 'Catch 10 fish at the Falls', 'the night’s catches (night step 4)', on('catch', (e) => (e.spot === 'falls' ? e.fish : 0))),
    row(5, 1, '1st at a Fishing Derby, on the team', 'a festival win (festivals aren’t built yet)', won('fishing-derby')),
  ],
  foraging: [
    row(1, 50, 'Gather 50 items', 'the night’s hauls (night step 4)', on('gather', (e) => e.items)),
    row(2, 20, 'Gather 20 items in the Hills', 'the night’s hauls (night step 4)', on('gather', (e) => (e.area === 'hills' ? e.items : 0))),
    row(3, 20, 'Gather 20 items in the Old Forest', 'the night’s hauls (night step 4)', on('gather', (e) => (e.area === 'old-forest' ? e.items : 0))),
    row(4, 20, 'Gather 20 items on the Mountain', 'the night’s hauls (night step 4)', on('gather', (e) => (e.area === 'mountain' ? e.items : 0))),
    row(5, 20, 'Gather 20 items in the Misty Vale', 'the night’s hauls (night step 4)', on('gather', (e) => (e.area === 'misty-vale' ? e.items : 0))),
  ],
  cooking: [
    row(1, 5, 'Assist 5 Kitchen plays', 'the Kitchen (not built yet)', on('play', () => 1)),
    row(2, 1, 'Assist a Fine play', 'the Kitchen (not built yet)', on('play', (e) => yes(atLeast(e.grade, 'fine')))),
    row(3, 10, 'Make 10 dishes of ★4+', 'the Kitchen (not built yet)', on('dishes', (e) => e.stars.filter((s) => s >= 4).length)),
    row(4, 1, 'Assist a Masterwork', 'the Kitchen (not built yet)', on('play', (e) => yes(e.grade === 'masterwork'))),
    row(5, 1, '1st at a Cooking Contest as the cook', 'a festival win (festivals aren’t built yet)', won('cooking-contest')),
  ],
  serving: [
    row(1, 5, 'Assist 5 shifts', 'the Restaurant (not built yet)', on('play', () => 1)),
    row(2, 1, 'Assist a Fine shift', 'the Restaurant (not built yet)', on('play', (e) => yes(atLeast(e.grade, 'fine')))),
    row(3, 100, 'Serve 100 guests', 'the Restaurant (not built yet)', on('guests', (e) => e.guests)),
    row(4, 1, 'Assist a Masterwork shift', 'the Restaurant (not built yet)', on('play', (e) => yes(e.grade === 'masterwork'))),
    row(5, 1000, 'Serve 1,000 guests', 'the Restaurant (not built yet)', on('guests', (e) => e.guests)),
  ],
  forging: [
    row(1, 5, 'Assist 5 Forge plays', 'the Forge’s workshop (not built yet)', on('play', () => 1)),
    row(2, 1, 'Assist a Fine merge', 'the Forge’s workshop (not built yet)', on('play', (e) => yes(atLeast(e.grade, 'fine')))),
    row(3, 1, 'Forge a tool upgrade', 'the Forge’s workshop (not built yet)', on('forged', () => 1)),
    row(4, 1, 'Assist a Masterwork', 'the Forge’s workshop (not built yet)', on('play', (e) => yes(e.grade === 'masterwork'))),
    row(5, 1, 'Forge a Mythril tool', 'the Forge’s workshop (not built yet)', on('forged', (e) => yes(e.tool === 'mythril'))),
  ],
  expeditions: [
    row(1, 2, 'Return from 2 expeditions', 'expeditions (not built yet)', on('expedition', () => 1)),
    row(2, 1, 'A Success at level 10+', 'expeditions (not built yet)', on('expedition', (e) => yes(successful(e.result) && e.level >= 10))),
    row(3, 1, 'A Success at level 20+', 'expeditions (not built yet)', on('expedition', (e) => yes(successful(e.result) && e.level >= 20))),
    row(4, 1, 'A Great at level 20+', 'expeditions (not built yet)', on('expedition', (e) => yes(e.result === 'great' && e.level >= 20))),
    row(5, 1, 'A Success at the Sky Ruins', 'expeditions (not built yet)', on('expedition', (e) => yes(successful(e.result) && e.region === 'sky-ruins'))),
  ],
}

/** The challenge toward her next rank in an activity, or null at Legend. */
export const challengeFor = (activity: Activity, rank: Rank): Challenge | null => CHALLENGES[activity][rank] ?? null

/** Counts an event toward her next rank's challenge in an activity: only that challenge, from her last
 * rank-up, stopping at its target. An Uma not on the roster, a Legend, or an event the challenge doesn't read changes
 * nothing. Never stamps `updatedAt`. A harvest and the night's catches and gathers call it. */
export function countChallenge<S extends Pick<FarmSave, 'roster'>>(save: S, outfitId: OutfitId, activity: Activity, event: ChallengeEvent): S {
  const uma = save.roster[outfitId]
  if (!uma) return save
  const state = uma.ranks[activity]
  const next = challengeFor(activity, state.rank)
  const add = next ? next.count(event) : 0
  if (!next || add === 0 || state.challenge >= next.target) return save
  const challenge = Math.min(next.target, state.challenge + add)
  return { ...save, roster: { ...save.roster, [outfitId]: { ...uma, ranks: { ...uma.ranks, [activity]: { ...state, challenge } } } } }
}

/** Whether her next rank's challenge is met. False at Legend. */
export function challengeMet(activity: Activity, state: RankState): boolean {
  const next = challengeFor(activity, state.rank)
  return next !== null && state.challenge >= next.target
}
/** Whether her points have reached her next rank's. False at Legend. */
export const pointsFull = (state: RankState): boolean => state.rank < 5 && state.points + 1e-9 >= RANK_POINTS[state.rank + 1]!

// --- The night's step 6 ------------------------------------------------------------------------

/** One Uma's day of work, in its activity. */
export interface WorkedDay {
  outfitId: OutfitId
  activity: Activity
}
/** Her talent in an activity and whether it's her favourite, read by the night, and a mentor's factor at her place
 * today. */
export type TermsOf = (outfitId: OutfitId, activity: Activity) => { talent: TalentStep; favourite: boolean; mentor?: number }

/**
 * Step 6's ranks: first each Uma who worked today earns a day's points in its activity, once (one day
 * pays one activity: her first entry in `worked`), her factors read as she worked (well fed before the night counts it
 * down). Then every Uma on the roster ranks up in each activity whose points and challenge are both met: one rank a
 * night, her challenge's count reset. The lines say who ranked up, then whose points filled tonight with the challenge
 * still to meet (once: the night they fill, or the night a rank-up leaves the next one already full).
 */
export function tickRankRules<S extends FarmSave>(save: S, worked: readonly WorkedDay[], termsOf: TermsOf): { save: S; lines: RankLine[]; paid: (WorkedDay & { points: number })[] } {
  const roster = { ...save.roster }
  const paid: (WorkedDay & { points: number })[] = []
  const seen = new Set<OutfitId>()
  for (const day of worked) {
    const uma = roster[day.outfitId]
    if (!uma || seen.has(day.outfitId)) continue
    seen.add(day.outfitId)
    const points = rankPointsForDay({ ...termsOf(day.outfitId, day.activity), wellFed: uma.wellFed > 0, heartsFactor: heartsFactorOf(save, day.outfitId) })
    const state = uma.ranks[day.activity]
    roster[day.outfitId] = { ...uma, ranks: { ...uma.ranks, [day.activity]: { ...state, points: round6(state.points + points) } } }
    paid.push({ ...day, points })
  }
  const ups: RankLine[] = []
  const full: RankLine[] = []
  for (const [outfitId, uma] of Object.entries(roster)) {
    const before = save.roster[outfitId]
    let ranks = uma.ranks
    for (const activity of ACTIVITIES) {
      let state = ranks[activity]
      if (pointsFull(state) && challengeMet(activity, state)) {
        state = { ...state, rank: (state.rank + 1) as Rank, challenge: 0 }
        ranks = { ...ranks, [activity]: state }
        ups.push({ kind: 'rank-up', outfitId, activity, rank: state.rank })
      }
      const was = before?.ranks[activity]
      const fullBefore = was !== undefined && was.rank === state.rank && pointsFull(was)
      if (pointsFull(state) && !challengeMet(activity, state) && !fullBefore) {
        full.push({ kind: 'full', outfitId, activity, rank: (state.rank + 1) as Rank, challenge: state.challenge })
      }
    }
    if (ranks !== uma.ranks) roster[outfitId] = { ...uma, ranks }
  }
  return { save: { ...save, roster }, lines: [...ups, ...full], paid }
}
