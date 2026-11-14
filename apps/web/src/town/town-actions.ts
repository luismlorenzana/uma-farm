// The town's one action: a talk with her, counted once a day (`talkInTown`). It reads the save right before the rule
// runs, commits it to the store and the device, and syncs; a second talk the same day changes nothing and saves nothing.
// The day's draw reads master data and the pack, so it waits for both. Loaded on demand with the town's screen.
import { talkInTown, touched } from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'

/** Talks with her in town: one more day talked, once a day. Throws the rule's words when she isn't out today. */
export async function talkInTownOnce(id: string): Promise<void> {
  const [pack] = await Promise.all([storyReady(), masterReady()])
  const save = useGame.getState().save
  if (!save) throw new Error('The farm is still loading.')
  const next = talkInTown(save, pack, id)
  if (next === save) return
  await commit(touched(next, new Date().toISOString()))
}
