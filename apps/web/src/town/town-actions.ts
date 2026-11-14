// The town's actions, each one of the day's actions: introducing yourself (`introduce`: she's met, and her meeting scene
// plays), a talk (`chatV4`), a gift (`giftV4`) and the invitation to work (`inviteToWork`). The first three also unlock the world's Town notes whose unlock holds now
// (`unlockNotes`: an introduction or a talk at a location visits it; a season, a festival, what the farm holds). Each
// reads the save right before the rule runs, commits it to the store and the device, and syncs; a refused rule throws
// its words. The day's town reads master data and the pack, so they wait for both. Loaded on demand with the town's
// screen.
import { birthdaysOf, chatV4, giftV4, introduce, inviteToWork, touched, unlockNotes, type SaveV4, type Taste } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

/** The save as it is now, or the refusal while the farm loads. */
function now(): SaveV4 {
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  return save
}

/** Introduce yourself to her where she is now (`place`): one action, and she's met; her meeting scene plays next. The
 * Town notes it unlocked come back. */
export async function introduceOnce(id: string, place: string): Promise<{ notes: string[] }> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const met = introduce(now(), pack, id)
  const { save, unlocked } = unlockNotes(met, pack, { at: 'town', place })
  await commit(touched(save, new Date().toISOString()))
  return { notes: unlocked }
}

/** Talk with her where she is (`place`, or null on the farm): one action and +15, once a day; what it paid and the Town
 * notes it unlocked. */
export async function talkOnce(id: string, place: string | null): Promise<{ paid: number; notes: string[] }> {
  const pack = await storyReady()
  const talked = chatV4(now(), id)
  const { save, unlocked } = place ? unlockNotes(talked.save, pack, { at: 'town', place }) : { save: talked.save, unlocked: [] }
  await commit(touched(save, new Date().toISOString()))
  return { paid: talked.paid, notes: unlocked }
}

/** A gift for her, one good at its stars: one action, once a day; her taste, what it paid and the Town notes it
 * unlocked. Her birthday (master data's, through the cast) triples it. */
export async function giftOnce(id: string, item: string, stars: number): Promise<{ taste: Taste; paid: number; notes: string[] }> {
  const [pack, view] = await Promise.all([storyReady(), masterReady()])
  const given = giftV4(now(), pack, id, item, stars, birthdaysOf(pack, view.birthdays))
  const { save, unlocked } = unlockNotes(given.save, pack, { at: 'gift', good: item, taste: given.taste })
  await commit(touched(save, new Date().toISOString()))
  return { taste: given.taste, paid: given.paid, notes: unlocked }
}

/** Invite her to work the farm: one action, once; she's a farmhand from today. */
export async function workOnce(id: string): Promise<void> {
  await commit(touched(inviteToWork(now(), id), new Date().toISOString()))
}
