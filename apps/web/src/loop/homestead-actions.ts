// The homestead's actions: a house built and named, a house extended, a spouse moved or two
// swapped, tonight's house picked, tonight's companion chosen, a meal cooked, a batch cooked in the farmhouse kitchen, a
// piece of furniture placed, the morning's
// "misses you" put away, and a household scene read, each one player's change over the save as it is now, committed once
// and stamped; a refused rule throws its words.
// Apart from `actions.ts` so the homestead's rules load with its sheet. Loaded on demand.
import {
  anotherNight, birthdaysOf, buildHouse, chooseCompanion, cookBatch, cookMeal, extendHouse, mealSpeaker, moveSpouse, placeFurniture, readHousehold, sleepAt, swapRooms, touched, type HouseholdId,
  type Meal, type SaveV4,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

const current = (): SaveV4 => {
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  return save
}
const now = () => new Date().toISOString()
const change = async (rule: (save: SaveV4) => SaveV4): Promise<void> => {
  const save = current()
  const next = rule(save)
  if (next !== save) await commit(touched(next, now()))
}

/** The next house built and named: it stands at once. */
export const buildHouseNamed = (name: string): Promise<void> => change((s) => buildHouse(s, name))
/** A house extended: two more rooms at once. */
export const extendHouseOnce = (n: number): Promise<void> => change((s) => extendHouse(s, n))
/** A spouse moved to a free room in another house, at once and free. */
export const moveSpouseTo = (id: string, house: number): Promise<void> => change((s) => moveSpouse(s, id, house))
/** Two spouses' rooms swapped. */
export const swapSpouseRooms = (a: string, b: string): Promise<void> => change((s) => swapRooms(s, a, b))
/** Tonight's house, or her room on her birthday. Her birthday is master data's, through the cast. */
export async function sleepTonight(house: number, alone: string | null = null): Promise<void> {
  const birthdays = alone === null ? null : await Promise.all([masterReady(), storyReady()]).then(([view, pack]) => birthdaysOf(pack, view.birthdays))
  await change((s) => sleepAt(s, house, alone, birthdays))
}
/** Tonight's companion: a spouse with a room, her house tonight's; `alone` her room on her birthday (master data's,
 * through the cast). */
export async function chooseTonight(id: string, alone = false): Promise<void> {
  const birthdays = alone ? await Promise.all([masterReady(), storyReady()]).then(([view, pack]) => birthdaysOf(pack, view.birthdays)) : null
  await change((s) => chooseCompanion(s, id, alone, birthdays))
}
/** A meal cooked for the household: one action. Whose line plays as you sit down, and the points it paid in all. */
export async function cookTheMeal(meal: Meal): Promise<{ speaker: string | null; paid: number }> {
  let paid = 0
  await change((s) => {
    const done = cookMeal(s, meal)
    paid = done.paid
    return done.save
  })
  return { speaker: mealSpeaker(current(), meal), paid }
}
/** A batch cooked in the farmhouse kitchen: one action, two goods of food (stock keys), six meals into the pantry. */
export const cookABatch = (picks: readonly string[]): Promise<void> => change((s) => cookBatch(s, picks))
/** A piece of the furniture set placed in a house, or taken out. */
export const placePiece = (piece: number, house: number | null): Promise<void> => change((s) => placeFurniture(s, piece, house))
/** "Another night": the morning's "misses you" line put away for the day. */
export const putAwayMisses = (): Promise<void> => change(anotherNight)
/** A household scene or the finale played or skipped: read once, paying nothing. */
export const readHouseholdOnce = (id: HouseholdId): Promise<void> => change((s) => readHousehold(s, id))
