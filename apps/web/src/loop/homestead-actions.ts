// The homestead's actions: a house built and named, a house extended, a spouse moved or two
// swapped, tonight's house picked, a piece of furniture placed, the morning's "misses you" put away, and a household scene
// read, each one player's change over the save as it is now, committed once and stamped; a refused rule throws its words.
// Apart from `actions.ts` so the M4 build never fetches the homestead's rules. Loaded on demand, the romance build only.
import {
  anotherNight, birthdaysOf, buildHouse, extendHouse, moveSpouse, placeFurniture, readHousehold, sleepAt, swapRooms, touched, type HouseholdId, type SaveV4,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

const v4 = (): SaveV4 => {
  const save = useGame.getState().save
  if (!save || save.version !== 4) throw new Error('Not on this farm.')
  return save
}
const now = () => new Date().toISOString()
const change = async (rule: (save: SaveV4) => SaveV4): Promise<void> => {
  const save = v4()
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
/** A piece of the furniture set placed in a house, or taken out. */
export const placePiece = (piece: number, house: number | null): Promise<void> => change((s) => placeFurniture(s, piece, house))
/** "Another night": the morning's "misses you" line put away for the day. */
export const putAwayMisses = (): Promise<void> => change(anotherNight)
/** A household scene or the finale played or skipped: read once, paying nothing. */
export const readHouseholdOnce = (id: HouseholdId): Promise<void> => change((s) => readHousehold(s, id))
