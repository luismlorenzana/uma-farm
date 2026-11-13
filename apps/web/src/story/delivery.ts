// The story pack's delivery on the device: `story.json` from farm-api's
// `/api/content/…` at boot, always fresh; then each file by its hash through uma-kit's content client, which verifies the
// bytes against the index and keeps them in its Cache Storage, so a release's file downloads once ("cached
// immutably", in the kit's content-addressed cache rather than IndexedDB). The cast, the ties, the bibles and the
// household load at boot (the night reads the household's lines); routes and pairs on demand. The last good index stays
// on the device, so an offline boot plays the last version. A pack that can't load (no index, a hash mismatch, a file
// the validator refuses) throws, and the boot gate offers Try again. Loaded with `load.ts`, on demand.
import { parseStoryIndex, releasedStoryPack, STORY_INDEX, type StoryIndex, type StoryPack } from '@farm/domain'
import type { ContentClient } from '@luismlorenzana/uma-kit/content'

/** Where the device keeps the last good index. */
export interface IndexStore {
  read(): unknown
  write(index: StoryIndex): void
}

/** The device's key for the last good index: a few KB of ids and hashes, never a line of the story. */
export const LAST_INDEX_KEY = 'farm.story-index'

/** The last good index in `localStorage` ("kept on the device"); a private window or a full store keeps it
 * in memory only, and the next boot reads the server again. */
export function deviceIndexStore(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = globalThis.localStorage): IndexStore {
  return {
    read: () => {
      try {
        const text = storage?.getItem(LAST_INDEX_KEY)
        return text ? (JSON.parse(text) as unknown) : null
      } catch {
        return null
      }
    },
    write: (index) => {
      try {
        storage?.setItem(LAST_INDEX_KEY, JSON.stringify(index))
      } catch { /* Memory only: the server is read again next boot. */ }
    },
  }
}

const json = (bytes: Uint8Array): unknown => JSON.parse(new TextDecoder().decode(bytes))
const statusOf = (error: unknown): number | null => {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' ? status : null
}

export interface LoadOptions {
  /** What to play when the server holds no pack at all (a 404 for `story.json`): the dev server's stand-in. */
  missing?: () => Promise<StoryPack>
}

/**
 * The released pack: the index fresh from the server, else (offline, or the server failing) the last good one kept on
 * the device; then its files, verified. The index is kept once the pack it names has loaded and checked whole.
 */
export async function loadReleasedPack(client: Pick<ContentClient, 'pack'>, store: IndexStore, { missing }: LoadOptions = {}): Promise<StoryPack> {
  let index: StoryIndex
  let fresh = true
  try {
    index = parseStoryIndex(json(await client.pack(STORY_INDEX)))
  } catch (error) {
    if (missing && statusOf(error) === 404) return missing()
    const last = store.read()
    if (last === null) throw error
    index = parseStoryIndex(last)
    fresh = false
  }
  const pack = await releasedStoryPack(index, async (_name, file) => json(await client.pack(file.path, file)))
  if (fresh) store.write(index)
  return pack
}
