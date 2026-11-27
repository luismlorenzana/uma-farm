import type { ContentCache } from '@luismlorenzana/uma-kit/content'

const CACHE_NAME = 'farm-master'
const ART_BUDGET = 128 * 1024 ** 2
const ART_INDEX = 'https://uma-kit.invalid/farm/art-cache-index'

async function isPicture(blob: Blob): Promise<boolean> {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  const signature = String.fromCharCode(...bytes)
  return (signature.startsWith('RIFF') && signature.endsWith('WEBP')) ||
    signature.startsWith('\x89PNG') || (bytes[0] === 0xff && bytes[1] === 0xd8) ||
    signature.slice(4) === 'ftypavif'
}

async function artEntries(cache: Cache): Promise<Map<string, number>> {
  const index = await cache.match(ART_INDEX)
  if (index) {
    try {
      const entries: [string, number][] = await index.json()
      return new Map(entries)
    } catch { /* Rebuild a missing or damaged index. */ }
  }
  const entries = new Map<string, number>()
  // Adopt the verified images used by earlier builds without fetching them again.
  for (const request of await cache.keys()) {
    const response = await cache.match(request)
    if (!response) continue
    const blob = await response.blob()
    if (await isPicture(blob)) entries.set(request.url, blob.size)
  }
  return entries
}

/** One verified copy per hash. Budget pictures by bytes and leave release and story JSON available offline. */
export function boundedContentCache(cache: Cache, budget = ART_BUDGET): ContentCache {
  let queue: Promise<void> = Promise.resolve()
  return {
    match: key => cache.match(key),
    async put(key, response) {
      const blob = await response.blob()
      if (!await isPicture(blob)) {
        await cache.put(key, new Response(blob))
        return
      }
      if (blob.size > budget) return
      const store = async () => {
        const entries = await artEntries(cache)
        entries.delete(key)
        let bytes = [...entries.values()].reduce((sum, size) => sum + size, blob.size)
        for (const [oldest, size] of entries) {
          if (bytes <= budget) break
          await cache.delete(oldest)
          entries.delete(oldest)
          bytes -= size
        }
        entries.set(key, blob.size)
        // Keep the ledger conservative if this write stops after indexing but before storing the picture.
        await cache.put(ART_INDEX, Response.json([...entries]))
        await cache.put(key, new Response(blob))
      }
      const locks = globalThis.navigator?.locks
      const write = queue.then(async () => {
        if (locks) await locks.request(CACHE_NAME, store)
        else await store()
      })
      queue = write.catch(() => undefined)
      await write
    },
  }
}

export async function openContentCache(): Promise<ContentCache | null> {
  return typeof caches === 'undefined' ? null : boundedContentCache(await caches.open(CACHE_NAME))
}
