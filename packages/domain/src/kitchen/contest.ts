// The Cooking Contest: the first festival you play. On its day (the festival whose rule is `cooking-contest`, wherever the
// story puts it), you cook one dish live at the Kitchen's stove, the town's cook judges it against the two rival farms,
// and the places pay gold and Farm Rank points.
//
//   the entry     **Enter the Cooking Contest · 3**, at the Kitchen on its day: three actions, the festival day's event
//                 actions first, then the day's own; the Kitchen built; one entry a Contest; no play under way. One known
//                 recipe, its main and its side at one good and one star each (two of its main, one side), and an optional
//                 cook: a farmhand with an action tonight, one of her actions tonight the Contest's (`today.cook`)
//   the play      60 s at the stove on the play's seed: one dish, its stars by the Kitchen's rule (its ingredients' average,
//                 rounded down, + the tier's lift, held to ★5), into the Warehouse after the judging
//   the score     10 × the dish's ★ + 0.5 × the play's score, rounded half up, 0–100
//   the rivals    the orchard (`wren-ashby`) 40 + 6 × the Farm Rank; the ranch (`cole-varga`) 26 + 7 × the Farm Rank; each
//                 held to 96. Ties go to you
//   the prizes    paid at once: 1st 600g × the season's number (Spring 1 … Winter 4) × the year; 2nd half of it; 3rd a
//                 fifth. Farm Rank points 150, 75, 25: each result in `farm.festivals` counts toward the Farm Rank, which
//                 is recomputed at night as ever
//   the record    `farm.festivals` gets `{ id: 'cooking-contest', day, score, place }`, and
//                 `diary.records['festival:cooking-contest']` keeps the best score
//   the cook      a point of Cooking practice; a 1st counts `won` toward her cooking challenge (the Legend's); +50 to her
//                 bar, a festival together (once a festival a year)
//
// A play left unfinished is judged as Rough (its play's score 0) at the next open or the night's start, through the
// stove's own settle. Pure; never stamps.
import { actionCost, canSpendForEvent, type SpecialDays } from '../farm/actions'
import { dateOf, festivalOn, SEASONS, type Festival, type FestivalId } from '../farm/calendar'
import { farmRankOf } from '../farm/farm'
import { handDay } from '../farm/farmhands'
import { FESTIVAL_PLACE_POINTS } from '../farm/milestones'
import { bookedForExpedition } from '../expeditions/presence'
import { countChallenge } from '../farm/rank-rules'
import { dishName } from '../goods/names'
import { itemNameOf } from '../items/lines'
import { festivalTogether } from '../romance/acts'
import { earnGold } from '../save/gold'
import type { FarmSave, FestivalResult } from '../save/v4'
import { parseStockKey, stockKey } from '../save/warehouse'
import type { CastId } from '../story/cast'
import { dishStars, isMainOf, isSideOf, kitchenBuilt, knownRecipes, knowsRecipe, MAINS_A_DISH, recipeOf, SIDES_A_DISH } from './recipes'

/** The Contest's festival rule. */
export const CONTEST_ID: FestivalId = 'cooking-contest'
/** Its best score, in `diary.records`. */
export const CONTEST_RECORD = `festival:${CONTEST_ID}`
/** The entry: a festival's three actions. */
export const CONTEST_ACTIONS = actionCost('festival')

// --- The day ------------------------------------------------------------------------------------------------------------

/** The Contest on a farm day: the year's festival there whose rule is the Cooking Contest (the game's on Autumn 10, or
 * wherever the story moves it); null on any other day. */
export function contestOn(day: number, year: readonly Festival[]): Festival | null {
  const festival = festivalOn(day, year)
  return festival?.rule === CONTEST_ID ? festival : null
}
/** Its result on a day (today's by default), or null. */
export const contestResult = (save: Pick<FarmSave, 'farm' | 'calendar'>, day = save.calendar.day): FestivalResult | null =>
  save.farm.festivals.find((r) => r.id === CONTEST_ID && r.day === day) ?? null
/** Whether you've entered today's: judged, or its dish under way at the stove. One entry a Contest. */
export const contestEntered = (save: Pick<FarmSave, 'farm' | 'calendar' | 'workshops'>): boolean =>
  contestResult(save) !== null || save.workshops.current?.play === 'contest'

// --- The score, the rivals and the places -------------------------------------------------------------------------------

/** The score's terms: 10 a star of the dish, half the play's score. */
export const CONTEST_STAR_POINTS = 10
export const CONTEST_PLAY_SHARE = 0.5
/** A dish's score: 10 × its ★ + 0.5 × the play's score, rounded half up, held to 0–100. */
export const contestScore = (stars: number, play: number): number =>
  Math.max(0, Math.min(100, Math.floor(CONTEST_STAR_POINTS * stars + CONTEST_PLAY_SHARE * play + 0.5 + 1e-9)))

/** A rival farm: its keeper (one of the town's people, by role), the farm in words, and its score's terms. */
export interface Rival {
  readonly id: CastId
  readonly farm: string
  readonly base: number
  readonly per: number
}
/** The two rivals: the orchard, cooking its specialty, and the ranch. */
export const RIVALS: readonly Rival[] = [
  { id: 'wren-ashby', farm: 'the orchard', base: 40, per: 6 },
  { id: 'cole-varga', farm: 'the ranch', base: 26, per: 7 },
]
/** No rival scores past this. */
export const RIVAL_CAP = 96
/** A rival's score at a Farm Rank: its base + its step a rank, held to 96. */
export const rivalScore = (rival: Pick<Rival, 'base' | 'per'>, farmRank: number): number => Math.min(RIVAL_CAP, rival.base + rival.per * farmRank)

export type ContestPlace = 1 | 2 | 3
/** Your place: one more than the rivals who scored more. Ties go to you. */
export const contestPlace = (score: number, rivals: readonly number[]): ContestPlace => (1 + rivals.filter((r) => r > score).length) as ContestPlace

/** 1st's gold a season's number and a year: 600g × the season's number × the year. */
export const FIRST_PRIZE = 600
/** Each place's share of 1st's gold: all of it, half, a fifth. */
export const PRIZE_SHARE: Readonly<Record<ContestPlace, number>> = { 1: 1, 2: 1 / 2, 3: 1 / 5 }
/** A place's gold on the Contest's day: 1st 600g × the season's number (Spring 1 … Winter 4) × the year; 2nd half; 3rd a
 * fifth. Autumn of year 1: 1,800g, 900g, 360g. */
export function contestPrize(day: number, place: ContestPlace): number {
  const date = dateOf(day)
  return Math.round(FIRST_PRIZE * (SEASONS.indexOf(date.season) + 1) * date.year * PRIZE_SHARE[place])
}

/** The board: your score and place, each rival's score, the gold and the Farm Rank points. */
export interface ContestBoard {
  score: number
  place: ContestPlace
  rivals: { id: CastId; farm: string; score: number }[]
  gold: number
  points: number
}
/** The board for a score on a day, the rivals at the farm's Farm Rank (as last night left it). */
export function contestBoard(save: Pick<FarmSave, 'farm'>, day: number, score: number): ContestBoard {
  const rank = farmRankOf(save.farm.points)
  const rivals = RIVALS.map((r) => ({ id: r.id, farm: r.farm, score: rivalScore(r, rank) }))
  const place = contestPlace(score, rivals.map((r) => r.score))
  return { score, place, rivals, gold: contestPrize(day, place), points: FESTIVAL_PLACE_POINTS[place] }
}
/** The board's rows, the best first: you, then the rivals; you ahead on a tie, the orchard before the ranch on theirs. */
export function boardRows(board: Pick<ContestBoard, 'score' | 'rivals'>): { who: 'you' | CastId; farm: string | null; score: number }[] {
  const rows = [{ who: 'you' as const, farm: null, score: board.score }, ...board.rivals.map((r) => ({ who: r.id, farm: r.farm, score: r.score }))]
  return rows.map((row, i) => ({ row, i })).sort((a, b) => b.row.score - a.row.score || a.i - b.i).map((x) => x.row)
}
/** A place in words: "1st", "2nd", "3rd". */
export const placeWords = (place: ContestPlace): string => ['1st', '2nd', '3rd'][place - 1]!

// --- The entry ------------------------------------------------------------------------------------------------------------

/** An entry: one known recipe, its main and its side (stock keys, one good and one star each), and an optional cook. */
export interface ContestEntry {
  dish: string
  main: string
  side: string
  cook: string | null
}

/** Why she can't cook for the Contest, or null: a farmhand with an action tonight (the Kitchen's assistant's counted). */
export function cookLock(save: FarmSave, id: string): string | null {
  const day = handDay(save, id)
  if (!day) return 'Only a farmhand cooks for you.'
  if (bookedForExpedition(save, id)) return 'She’s in an expedition party.'
  if (save.today.server === id) return 'She’s serving today.'
  return day.actions - day.kitchen < 1 ? 'She has no action left tonight.' : null
}

/** The held goods a recipe can take, a row a good and star, the most held first, then fewer stars, then the id: its mains
 * held two or more, its sides one or more. */
function heldFor(save: Pick<FarmSave, 'items'>, fits: (id: string) => boolean, need: number): { key: string; stars: number; count: number }[] {
  return Object.entries(save.items).filter(([id]) => fits(id))
    .flatMap(([id, row]) => row.flatMap((count, s) => (count >= need ? [{ key: stockKey(id, s + 1), stars: s + 1, count }] : [])))
    .sort((a, b) => b.stars - a.stars || b.count - a.count || a.key.localeCompare(b.key))
}
/** A recipe's mains the Warehouse holds two of, the most stars first. */
export const contestMains = (save: Pick<FarmSave, 'items'>, dish: string): string[] => {
  const recipe = recipeOf(dish)
  return recipe ? heldFor(save, (id) => isMainOf(recipe, id), MAINS_A_DISH).map((r) => r.key) : []
}
/** A recipe's sides the Warehouse holds, the most stars first. */
export const contestSides = (save: Pick<FarmSave, 'items'>, dish: string): string[] => {
  const recipe = recipeOf(dish)
  return recipe ? heldFor(save, (id) => isSideOf(recipe, id), SIDES_A_DISH).map((r) => r.key) : []
}

/** The entry to start from: the known recipe whose best main and side held make the most stars (the known order on a
 * tie), its best of each; with none it can make, the first known with nothing picked; no cook. Null before a recipe is
 * known. */
export function contestDefault(save: Pick<FarmSave, 'items' | 'buildings' | 'workshops'>): ContestEntry | null {
  const known = knownRecipes(save)
  if (known.length === 0) return null
  const making = known.flatMap((dish, i) => {
    const [main, side] = [contestMains(save, dish)[0], contestSides(save, dish)[0]]
    return main && side ? [{ dish, i, main, side, stars: dishStars(main, side, 0) }] : []
  }).sort((a, b) => b.stars - a.stars || a.i - b.i)[0]
  return making ? { dish: making.dish, main: making.main, side: making.side, cook: null } : { dish: known[0]!, main: '', side: '', cook: null }
}

/** The dish's stars before the stove: its ingredients' average, rounded down (the tier lifts it at the end). */
export const entryStars = (entry: Pick<ContestEntry, 'main' | 'side'>): number => dishStars(entry.main, entry.side, 0)

/** Why the Contest can't be entered now, or null: its day (`days.festivals`, the story's year), the Kitchen built, one
 * entry, no play under way, three actions (event actions first), a known recipe with its main and side held, the cook. */
export function contestBlock(save: FarmSave, days: SpecialDays, entry: ContestEntry | null): string | null {
  if (!contestOn(save.calendar.day, days.festivals)) return 'No contest today.'
  if (!kitchenBuilt(save)) return 'Build the Kitchen to enter.'
  if (contestEntered(save)) return 'One entry a Contest.'
  if (save.workshops.current || save.workshops.restaurant?.shift) return 'A play is under way.'
  if (!canSpendForEvent(save, CONTEST_ACTIONS, days)) return `Entering takes ${CONTEST_ACTIONS} actions.`
  if (!entry) return 'Choose a recipe.'
  const recipe = recipeOf(entry.dish)
  if (!recipe || !knowsRecipe(save, entry.dish)) return 'You don’t know that recipe.'
  const main = parseStockKey(entry.main)
  const side = parseStockKey(entry.side)
  if (!main || !isMainOf(recipe, main.id)) return `That isn’t a main for ${dishName(entry.dish)}.`
  if (!side || !isSideOf(recipe, side.id)) return `That isn’t a side for ${dishName(entry.dish)}.`
  for (const [at, need] of [[main, MAINS_A_DISH], [side, SIDES_A_DISH]] as const) {
    const held = save.items[at.id]?.[at.stars - 1] ?? 0
    if (held < need) return `Short ${need - held} ${itemNameOf(at.id)}.`
  }
  return entry.cook === null ? null : cookLock(save, entry.cook)
}

// --- The judging ----------------------------------------------------------------------------------------------------------

/**
 * The judging, at the play's end: the dish's score against the rivals at the Farm Rank, the place's gold now, the result
 * into `farm.festivals` and the best score into `diary.records`; the cook (on the roster) counts `won` on a 1st and gets a
 * festival together's +50. The Farm Rank's points come at night. Never stamps.
 */
export function judgeContest<S extends FarmSave>(save: S, day: number, stars: number, play: number, cook: string | null): { save: S; board: ContestBoard } {
  const board = contestBoard(save, day, contestScore(stars, play))
  const paid = earnGold(save, board.gold)
  const result: FestivalResult = { id: CONTEST_ID, day, score: board.score, place: board.place }
  const records = { ...paid.diary.records, [CONTEST_RECORD]: Math.max(paid.diary.records[CONTEST_RECORD] ?? 0, board.score) }
  let next: S = { ...paid, farm: { ...paid.farm, festivals: [...paid.farm.festivals, result] }, diary: { ...paid.diary, records } }
  if (cook !== null && next.roster[cook] && next.love[cook]) {
    if (board.place === 1) next = countChallenge(next, cook, 'cooking', { kind: 'won', festival: CONTEST_ID })
    next = festivalTogether(next, [cook], CONTEST_ID, dateOf(day).year).save as S
  }
  return { save: next, board }
}
