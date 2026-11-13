// The evening's actions: an evening played to its card is one player's change, `spendEvening` over
// the save as it is now with her birthday from master data, committed once and stamped; an invitation's answer the same
// through `answerInvite`. Nothing is written while the play runs, so one left halfway spends nothing. Apart from
// `actions.ts` so the evening's rules load with its player. Loaded on demand.
import { answerInvite, birthdaysOf, isBirthday, spendEvening, touched, type EveningCard, type EveningKind } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

const current = () => {
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  return save
}

/** Her evening played: paid with her factors (her birthday is master data's, through the cast), the +20 for a
 * yes, the slot spent, in one stamped change; the card's facts. Refused (its words thrown) when the slot went meanwhile. */
export async function spendHerEvening(id: string, kind: EveningKind, score: number): Promise<EveningCard> {
  const [view, pack] = await Promise.all([masterReady(), storyReady()])
  const save = current()
  const done = spendEvening(save, pack, id, kind, score, isBirthday(birthdaysOf(pack, view.birthdays), id, save.calendar.day))
  await commit(touched(done.save, new Date().toISOString()))
  return done.card
}

/** Her invitation answered: Yes, tonight or Another day, once, a player's change. */
export async function answerInvitation(id: string, answer: 'yes' | 'no'): Promise<void> {
  await commit(touched(answerInvite(current(), id, answer), new Date().toISOString()))
}
