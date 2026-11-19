// The story pack in the app: loaded once, on demand, through one
// seam (`load.ts`'s `loadStoryPack`: the private pack's release, or no pack, each with master data's placeholders; the
// tests' invented stand-in). Light on purpose, since the shell, the store and the album's art read it: the pack, its
// reader and the placeholders load lazily.
//
// `outfitFor` is the one resolver where a roster id meets master data: the roster's key is her character id and the
// pack's cast names her outfit, else master data's default for her (the domain's `outfitOf`); before the pack loads, an
// id is its own outfit. The album's art and master data's view (`setMasterLens`) read through it, so faces, busts, names,
// talents, temperaments and pickers all follow her cast entry. Everyone on the farm stays in the cast (`keepOnCast`).
// The year's festivals (`festivalsOf`, the story's when its world moves or adds them) are kept here too, worked out by
// the loaded seam, so the bars' date chip names the story's festival without the placeholders in the initial JS; and
// the special days (the year's festivals and the met Umas' birthdays, master data's through the cast), so the bar's
// actions chip shows a special day's event actions the same way.
import type { FarmSave, Festival, SpecialDays, StoryPack } from '@farm/domain'
import { useSyncExternalStore } from 'react'

let pack: StoryPack | null = null
let resolve: (id: string) => string = (id) => id
let loading: Promise<StoryPack> | null = null
let year: readonly Festival[] | undefined
let special: SpecialDays | undefined
let base: StoryPack | null = null
let expansionActive = false
/** The loaded seam's own pieces, kept for `keepOnCast`. */
let seam: {
  install: (pack: StoryPack) => (id: string) => string
  withCast: (pack: StoryPack, ids: readonly string[]) => StoryPack
  festivalsOf: (pack: StoryPack) => readonly Festival[]
  specialDaysOf: (pack: StoryPack) => SpecialDays
  activateLongGame: (save: FarmSave, pack: StoryPack | null) => FarmSave
} | null = null
const listeners = new Set<() => void>()

/** The pack once loaded, else null. */
export const storyPack = (): StoryPack | null => pack
/** The outfit a roster id plays as: her cast entry's, else master data's default for her, else the id itself. */
export const outfitFor = (id: string): string => resolve(id)
/** Whether an id is one of the cast's (a roster key). */
export const inCast = (id: string): boolean => pack?.cast.umas.some((u) => u.characterId === id) ?? false
/** The cast's character ids, in arrival order: the scenes' tie-break (`sceneDue`). */
export const castIds = (): string[] => pack?.cast.umas.map((u) => u.characterId) ?? []

function turnOn(next: StoryPack): void {
  resolve = seam!.install(next)
  year = seam!.festivalsOf(next)
  special = seam!.specialDaysOf(next)
  pack = next
  for (const listener of listeners) listener()
}

/** Loads the pack once (the boot and the night wait on it, as they do on master data) and turns the resolver on. A
 * failure lets the next call try again. Resolves the pack as it stands now (`keepOnCast` may have grown its cast). */
export function storyReady(): Promise<StoryPack> {
  loading ??= import('./load').then(async ({ loadStoryPack, installStory, withCast, festivalsOf, specialDaysOf, activateLongGame }) => {
    const loaded = await loadStoryPack()
    base = loaded
    seam = { install: installStory, withCast, festivalsOf, specialDaysOf, activateLongGame }
    turnOn(loaded)
    return loaded
  }).catch((error: unknown) => {
    loading = null
    throw error
  })
  return loading.then(() => pack!)
}

export const prepareStorySave = (save: FarmSave): FarmSave => seam?.activateLongGame(save, pack) ?? save

/** Keeps everyone on the farm in the cast: an Uma on the roster the pack doesn't hold (one a release dropped, or one
 * from an older story) joins it bare and plays on placeholders, her name and face her master data's (or a lettered
 * disc). The store calls it as a save comes in; nothing changes when the cast holds them all. */
export function keepOnCast(ids: readonly string[], ending = false): void {
  if (!pack || !base || !seam) return
  const added = ending ? base.expansion ?? [] : []
  const current = new Set([...base.cast.umas, ...added].map(uma => uma.characterId))
  for (const id of ids) current.add(id)
  if (ending === expansionActive && pack.cast.umas.length === current.size && pack.cast.umas.every(uma => current.has(uma.characterId))) return
  expansionActive = ending
  const town = added.length && base.expansionProfessions?.length
    ? { ...base.town, professions: [...(base.town?.professions ?? []), ...base.expansionProfessions] } : base.town
  const next = added.length ? { ...base, town, cast: { ...base.cast, umas: [...base.cast.umas, ...added] } } : base
  turnOn(seam.withCast(next, ids))
}

/** The pack in React: null until it loads. */
export function useStory(): StoryPack | null {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, () => pack, () => pack)
}

/** The year's festivals in React: the story's (`festivalsOf`) once the pack loads; undefined before, which the calendar
 * reads as the game's five. */
export function useStoryYear(): readonly Festival[] | undefined {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, () => year, () => year)
}

/** The special days once the pack loads: the year's festivals and the met Umas' birthdays, for the event actions. */
export const specialDays = (): SpecialDays | undefined => special
/** The special days in React: undefined until the pack loads. */
export function useSpecialDays(): SpecialDays | undefined {
  return useSyncExternalStore((listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, () => special, () => special)
}

/** A name for a character master data doesn't hold: the stand-ins' invented range (9000001 on) reads "Stand-in 1",
 * anyone else "An Uma". */
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
