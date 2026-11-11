// Heart events' actions (F49 decisions 1 and 10): her event played to its end is one player's change, `playEvent` over the
// save as it is now, committed once and stamped; Ask her's answer the same through `askHer`. Nothing is written while an
// event plays, so one left halfway pays nothing and stays Ready. Apart from `actions.ts` so the M4 build never fetches the
// romance's rules. Loaded on demand with the player, the romance build only.
import { askHer, playEvent, touched, type Answer, type EventCard, type EventOutcome } from '@farm/domain'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

/** Her Ready event played to its end (decision 1): paid, moved on and saved in one stamped change; the level-up card's
 * facts. Refused (its words thrown) when she isn't Ready any more or a choice's goods have gone. */
export async function playHerEvent(id: string, outcome: EventOutcome): Promise<EventCard> {
  const pack = await storyReady()
  const save = useGame.getState().save
  if (!save || save.version !== 4) throw new Error('Not on this farm.')
  const done = playEvent(save, pack, id, outcome)
  await commit(touched(done.save, new Date().toISOString()))
  return done.card
}

/** Ask her (decision 10): her answer, once a day, paying nothing; Yes moves her to romance. One stamped change. */
export async function askHerOnce(id: string, answer: Answer): Promise<void> {
  const save = useGame.getState().save
  if (!save || save.version !== 4) throw new Error('Not on this farm.')
  await commit(touched(askHer(save, id, answer), new Date().toISOString()))
}
