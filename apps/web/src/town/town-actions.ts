// The town's actions: a talk with her, counted once a day, which meets her when it meets her trigger (`talkToHer`), and a
// gift for someone you haven't met (`giftInTown`). Each reads the save right before the rule runs, commits it to the
// store and the device, and syncs; a second talk the same day changes nothing and saves nothing. The day's draw reads
// master data and the pack, so they wait for both. Loaded on demand with the town's screen.
import { giftInTown, talkToHer, touched, type Taste } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

/** Talks with her in town: one more day talked, once a day; whether it met her (her meeting scene plays next). Throws the
 * rule's words when she isn't out today. */
export async function talkInTownOnce(id: string): Promise<boolean> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  const { save: next, met } = talkToHer(save, pack, id)
  if (next === save) return false
  await commit(touched(next, new Date().toISOString()))
  return met
}

/** A gift for her in town: one good at its stars; her taste, and whether it met her. */
export async function giftInTownOnce(id: string, item: string, stars: number): Promise<{ taste: Taste; met: boolean }> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  const r = giftInTown(save, pack, id, item, stars)
  await commit(touched(r.save, new Date().toISOString()))
  return { taste: r.taste, met: r.met }
}
