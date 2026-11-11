// The story pack in the app (F46 decisions 5 and 6; romance spec RM3, RM58, RM59): loaded once, on demand, through one
// seam (`load.ts`'s `loadStoryPack`: the invented stand-in now, the private pack from F56). Light on purpose, since the
// shell, the store and the album's art read it: the pack, its validator and the stand-in load lazily.
//
// `outfitFor` is the one resolver where a roster id meets master data: on save v4 the roster's key is her character id
// and the pack's cast names her outfit (the domain's `outfitOf`); before the pack loads, and always in the M4 build, an
// id is its own outfit. The album's art and master data's view (`setMasterLens`) read through it, so faces, busts, names,
// talents, temperaments and pickers all follow her cast entry.
import type { StoryPack } from '@farm/domain'
import { useSyncExternalStore } from 'react'

let pack: StoryPack | null = null
let resolve: (id: string) => string = (id) => id
let loading: Promise<StoryPack> | null = null
const listeners = new Set<() => void>()

/** The pack once loaded, else null (the M4 build never loads it). */
export const storyPack = (): StoryPack | null => pack
/** The outfit a roster id plays as (decision 5): her cast entry's on v4, else the id itself. */
export const outfitFor = (id: string): string => resolve(id)
/** Whether an id is one of the cast's (a v4 roster key). */
export const inCast = (id: string): boolean => pack?.cast.umas.some((u) => u.characterId === id) ?? false
/** The cast's character ids, in arrival order: the scenes' tie-break (`sceneDue`). */
export const castIds = (): string[] => pack?.cast.umas.map((u) => u.characterId) ?? []

/** Loads the pack once (the boot and the night wait on it, as they do on master data) and turns the resolver on. A
 * failure lets the next call try again. */
export function storyReady(): Promise<StoryPack> {
  loading ??= import('./load').then(async ({ loadStoryPack, installStory }) => {
    const loaded = await loadStoryPack()
    resolve = installStory(loaded)
    pack = loaded
    for (const listener of listeners) listener()
    return loaded
  }).catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading
}

/** The pack in React: null until it loads. */
export function useStory(): StoryPack | null {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, () => pack, () => pack)
}

/** A name for a character master data doesn't hold (RM3): the stand-ins' invented range (9000001 on) reads "Stand-in 1",
 * anyone else (a character a release drops) "An Uma". */
export function unknownName(id: string): string {
  const n = Number(id) - 9_000_000
  return Number.isSafeInteger(n) && n > 0 && n < 1_000_000 ? `Stand-in ${n}` : 'An Uma'
}

/** The letters on her disc when master data has no face for her: the name's first letter and any number after it
 * ("Stand-in 1" → "S1"). */
export function discLetters(name: string): string {
  const first = name.trim().charAt(0).toUpperCase() || '?'
  const number = /(\d+)\s*$/.exec(name)?.[1] ?? ''
  return `${first}${number}`
}
