// Heart events' actions: her event played to its end is one player's change, `playEvent` over the
// save as it is now, committed once and stamped; Ask her's answer the same through `askHer`. Nothing is written while an
// event plays, so one left halfway pays nothing and stays Ready. Her event, and an occasion scene with her
// (`playOccasion`), each cost an action, the special day's event actions first (the story's special days: its year's
// festivals and the met Umas' birthdays). Apart from `actions.ts` so the events' rules load with the player. Loaded on
// demand.
import { askHer, GAME_DAYS, recordOriginalRoute, playEvent, playOccasion, touched, type Answer, type EventCard, type EventOutcome, type SpecialDays } from '@farm/domain'
import { commit, useGame } from '../save/game'
import { libraryChange } from '../library/changes'
import { specialDays, storyReady } from '../story/story'

/** The special days once the pack is in: the story's year and the met Umas' birthdays. */
async function days(): Promise<SpecialDays> {
  await storyReady()
  return specialDays() ?? GAME_DAYS
}

/** Her Ready event played to its end: paid, moved on, its action spent and saved in one stamped change; the level-up
 * card's facts. Refused (its words thrown) when she isn't Ready any more, no action is left, or a choice's goods have
 * gone. */
export async function playHerEvent(id: string, outcome: EventOutcome): Promise<EventCard> {
  const pack = await storyReady()
  const special = await days()
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  const done = playEvent(save, pack, id, outcome, special)
  await commit(touched(libraryChange(save, done.save, pack, special), new Date().toISOString()))
  return done.card
}

/** Her occasion scene played to its end (`occasion`, the one its player showed): its action spent, once today, in one
 * stamped change. It pays nothing. */
export async function playOccasionOnce(id: string, occasion: string): Promise<void> {
  const pack = await storyReady()
  const special = await days()
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  await commit(touched(libraryChange(save, playOccasion(save, pack, id, special, occasion), pack, special), new Date().toISOString()))
}

/** Records the first viewing of an unlocked original. No action or relationship reward. */
export async function seeOriginalRoute(id: string, rung: string): Promise<void> {
  const pack = await storyReady()
  const save = useGame.getState().save
  if (!save) return
  const next = recordOriginalRoute(save, pack, id, rung)
  if (next !== save) await commit(touched(next, new Date().toISOString()))
}

/** Ask her: her answer, once a day, paying nothing; Yes moves her to romance. One stamped change. */
export async function askHerOnce(id: string, answer: Answer): Promise<void> {
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  await commit(touched(libraryChange(save, askHer(save, id, answer)), new Date().toISOString()))
}
