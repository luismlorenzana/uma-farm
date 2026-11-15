// The stove's and the Kitchen's actions, each one player's change over the save as it is now, committed once and stamped;
// a refused rule throws its words: a batch at the stove started, the Kitchen's play started (its menu and assistant), the
// Cooking Contest entered (its dish and cook; three actions, the festival's first), a play finished from its taps
// (replayed against its seed by the rules; a Contest's dish judged) or stopped (✕: Rough), the staff meal served, the
// Kitchen's next level, and a recipe bought at the shop. A play left unfinished (the app closed, or its screen left
// mid-play) settles as Rough the next time the app opens, unstamped: it's the night's rule run early, so a device that
// fell behind never outranks a newer save with it. Loaded on demand with the kitchens and the stove.
import {
  buyRecipe, enterContest, finishPlay, GAME_DAYS, serveStaffMeal, settleUnfinished, startKitchenPlay, startStoveBatch, touched, upgradeKitchen, type ContestEntry, type MenuLine,
  type PlayResult, type SaveV4, type StoveTap,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { specialDays, storyReady } from '../story/story'
import { holdPlay } from './stove-session'
import { talentsFor } from './talents'

const current = (): SaveV4 => {
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  return save
}
const now = () => new Date().toISOString()
const change = async (rule: (save: SaveV4) => SaveV4): Promise<SaveV4> => {
  const next = touched(rule(current()), now())
  await commit(next)
  return next
}
/** What a play's end reads: the talents (the assistant's Cooking) and the story pack (her line's +10%, a cook's chores). */
async function context() {
  const [view, story] = await Promise.all([masterReady(), storyReady()])
  return { talentOf: talentsFor(view), story }
}

/** A play's Start: held for its screen before it's committed, so the shell never takes it for one left behind. */
async function begin(rule: (save: SaveV4) => SaveV4): Promise<void> {
  const next = touched(rule(current()), now())
  holdPlay(next.workshops.current!.seed)
  await commit(next)
}
/** **At the stove · 1**: a batch played at the farmhouse stove, its two goods taken now; the stove's screen plays it. */
export const startBatchAtStove = (picks: readonly string[]): Promise<void> => begin((s) => startStoveBatch(s, picks))
/** **Play · 1** at the Kitchen: its menu's inputs taken now and its assistant's action tonight; the stove's screen plays it. */
export const startKitchen = (menu: readonly MenuLine[], assistant: string | null): Promise<void> => begin((s) => startKitchenPlay(s, menu, assistant))
/** **Enter the Cooking Contest · 3**: its two of the main and one side taken now, its cook's action tonight, three
 * actions (the festival day's event actions first: the story's year, once the pack is in); the stove's screen plays it. */
export async function enterTheContest(entry: ContestEntry): Promise<void> {
  await storyReady()
  const days = specialDays() ?? GAME_DAYS
  await begin((s) => enterContest(s, entry, days))
}
/** The play's end: its taps replayed against its seed by the rules, or null when you stopped it (Rough). What it made,
 * and a Contest's judging. */
export async function finishTheStove(taps: readonly StoveTap[] | null): Promise<PlayResult> {
  const ctx = await context()
  let result: PlayResult | null = null
  await change((s) => {
    const done = finishPlay(s, taps, ctx)
    result = done.result
    return done.save
  })
  return result!
}
/** A play left unfinished, settled as Rough when the app finds it again: unstamped, the night's own rule run early. */
export async function settleLeftPlay(): Promise<void> {
  const save = useGame.getState().save
  if (!save?.workshops.current) return
  const ctx = await context()
  const fresh = useGame.getState().save
  if (!fresh?.workshops.current) return
  await commit(settleUnfinished(fresh, ctx))
}
/** The staff meal, served: its dishes (the plain rule's when none are chosen) out of the Warehouse. */
export const serveTheStaffMeal = (picks: readonly string[] | null): Promise<SaveV4> => change((s) => serveStaffMeal(s, picks))
/** The Kitchen's next level: its gold now, the level the next morning. */
export const upgradeTheKitchen = (): Promise<SaveV4> => change(upgradeKitchen)
/** A recipe from the shop's Recipes shelf, in town. */
export const buyTheRecipe = (dish: string): Promise<SaveV4> => change((s) => buyRecipe(s, dish))
