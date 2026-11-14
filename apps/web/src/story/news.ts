// A story release that reached this device and the morning hasn't told yet: its ship's number, kept in `localStorage`
// (a few bytes, never a line of the story) until the next night puts "New story arrived" in the morning's New today,
// once; the card reads its note from the release. The loader tells a new release from one this device has seen by the
// last index it keeps (`delivery.ts`); a new farm starts with none, since its opening plays the story. Light: the store,
// the loader and the night read it.
import type { StoryNews } from '@farm/domain'

/** The device's key for the release the morning hasn't told yet. */
export const STORY_NEWS_KEY = 'farm.story-news'

/** A release that reached the device: its ship's number. */
export type ArrivedRelease = Omit<StoryNews, 'kind'>

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const deviceStorage = (): Store | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** One the save can keep: a ship's number, from 1. */
function readable(value: unknown): ArrivedRelease | null {
  if (typeof value !== 'object' || value === null) return null
  const { number } = value as Record<string, unknown>
  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 1 ? { number } : null
}

/** The release waiting for the morning, or null (none, or a private window). */
export function arrivedRelease(storage: Store | undefined = deviceStorage()): ArrivedRelease | null {
  try {
    const text = storage?.getItem(STORY_NEWS_KEY)
    return text ? readable(JSON.parse(text)) : null
  } catch {
    return null
  }
}

/** Keeps a release for the next morning, in place of any the morning hasn't told yet. */
export function keepArrived(release: ArrivedRelease, storage: Store | undefined = deviceStorage()): void {
  try {
    storage?.setItem(STORY_NEWS_KEY, JSON.stringify({ number: release.number }))
  } catch { /* A full or private store: the morning doesn't say it. */ }
}

/** The morning has told it (or a new farm starts): forgets the release waiting, only that one when `number` is given, so
 * a newer one that arrived meanwhile still waits. */
export function forgetArrived(number?: number, storage: Store | undefined = deviceStorage()): void {
  try {
    if (number === undefined || arrivedRelease(storage)?.number === number) storage?.removeItem(STORY_NEWS_KEY)
  } catch { /* Nothing kept. */ }
}
