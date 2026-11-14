// The town's actions: a talk with her, counted once a day, which meets her when it meets her trigger (`talkToHer`), and a
// gift for someone you haven't met (`giftInTown`). Each also unlocks the world's Town notes whose unlock holds now
// (`unlockNotes`: a talk at a spot, a season, a festival, what the farm holds). Each reads the save right before the
// rule runs, commits it to the store and the device, and syncs; a second talk the same day changes nothing and saves
// nothing. The day's draw reads master data and the pack, so they wait for both. Loaded on demand with the town's screen.
import { giftInTown, talkToHer, touched, townDay, unlockNotes, type Taste } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

/** Talks with her in town: one more day talked, once a day; whether it met her (her meeting scene plays next), and the
 * Town notes it unlocked (a talk at her spot is a visit there). Throws the rule's words when she isn't out today. */
export async function talkInTownOnce(id: string): Promise<{ met: boolean; notes: string[] }> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  const spot = townDay(save, pack).where.get(id)
  const talked = talkToHer(save, pack, id)
  const { save: next, unlocked } = spot ? unlockNotes(talked.save, pack, { at: 'town', spot }) : { save: talked.save, unlocked: [] }
  if (next === save) return { met: false, notes: [] }
  await commit(touched(next, new Date().toISOString()))
  return { met: talked.met, notes: unlocked }
}

/** A gift for her in town: one good at its stars; her taste, whether it met her, and the Town notes it unlocked. */
export async function giftInTownOnce(id: string, item: string, stars: number): Promise<{ taste: Taste; met: boolean; notes: string[] }> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  const r = giftInTown(save, pack, id, item, stars)
  const { save: next, unlocked } = unlockNotes(r.save, pack, { at: 'gift', good: item, taste: r.taste })
  await commit(touched(next, new Date().toISOString()))
  return { taste: r.taste, met: r.met, notes: unlocked }
}
