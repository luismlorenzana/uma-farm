// The ring bench's actions: a ring made, a better ring given and the smith's scene read, each one
// player's change over the save as it is now, committed once and stamped; a refused rule throws its words. Apart from
// `actions.ts` so the bench's rules load with its sheet. Loaded on demand.
import { BENCH_SCENE, giveRing, makeRing, makeStarterRing, readScene, touched, type BenchInput, type SaveV4 } from '@farm/domain'
import { commit, useGame } from '../save/game'

const current = (): SaveV4 => {
  const save = useGame.getState().save
  if (!save) throw new Error('No farm yet.')
  return save
}
const now = () => new Date().toISOString()

/** A ring made at the bench: its three goods used, the ring in the Warehouse at ★1. The ring's id. */
export async function makeRingOnce(inputs: readonly BenchInput[]): Promise<string> {
  const done = makeRing(current(), inputs)
  await commit(touched(done.save, now()))
  return done.ring
}

export async function makeStarterRingOnce(): Promise<string> {
  const done = makeStarterRing(current())
  await commit(touched(done.save, now()))
  return done.ring
}

/** A better ring given: the new one hers, the old one back in the Warehouse. */
export async function giveBetterRing(id: string, ring: string): Promise<void> {
  await commit(touched(giveRing(current(), id, ring), now()))
}

/** the smith's scene, played through or skipped: read once. */
export async function readBenchScene(): Promise<void> {
  const save = current()
  if (save.diary.read.includes(BENCH_SCENE)) return
  await commit(touched(readScene(save, BENCH_SCENE), now()))
}
