// The story pack's delivery through uma-kit's real content client, against a fake farm-api and an
// in-memory Cache Storage: the index fresh, each file verified and cached by hash, the last index kept for an offline
// boot, a mismatch refused, and the dev server's stand-in when farm-api serves no pack. On the invented stand-in pack
// (9000001–9000003) as a release holds it; no network.
import { createHash, webcrypto } from 'node:crypto'
import { STAND_IN_FILES, storyFileName, storyFilePath, storyPackFrom, type StoryIndex } from '@farm/domain'
import { createContentClient, type ContentCache } from '@luismlorenzana/uma-kit/content'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deviceIndexStore, LAST_INDEX_KEY, loadReleasedPack, type IndexStore } from './delivery'

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

/** The stand-in as `pnpm story:release --stand-in` writes it: each file's bytes by path, and `story.json`. */
function standInRelease() {
  const named: [string, unknown][] = [[storyFileName.cast, STAND_IN_FILES.cast], [storyFileName.ties, STAND_IN_FILES.ties], [storyFileName.household, STAND_IN_FILES.household],
    ...Object.entries(STAND_IN_FILES.umas).map(([id, v]): [string, unknown] => [storyFileName.uma(id), v]),
    ...Object.entries(STAND_IN_FILES.routes).map(([id, v]): [string, unknown] => [storyFileName.route(id), v]),
    ...Object.entries(STAND_IN_FILES.pairs ?? {}).map(([name, v]): [string, unknown] => [storyFileName.pair(name), v])]
  const bytes = new Map<string, Uint8Array>()
  const files: StoryIndex['files'] = {}
  for (const [name, value] of named) {
    const data = new TextEncoder().encode(JSON.stringify(value))
    const hash = sha256(data)
    files[name] = { path: storyFilePath(name, hash), bytes: data.length, sha256: hash }
    bytes.set(files[name].path, data)
  }
  const index: StoryIndex = {
    version: 1, release: 'abcdef12', builtAt: '2026-11-12T00:00:00.000Z', files,
    scripted: Object.fromEntries(Object.entries(STAND_IN_FILES.routes).map(([id, r]) => [id, (r as { events: { id: string }[] }).events.map((e) => e.id)])),
    pairs: { '9000001-9000002': [1, 2, 3, 4, 5] },
  }
  bytes.set('story.json', new TextEncoder().encode(JSON.stringify(index)))
  return { index, bytes }
}

/** farm-api's `/api/content/…` as the fake sees it: the release's files, or offline, or none at all. */
function server(release = standInRelease()) {
  const state = { offline: false, none: false, tamper: null as string | null, asked: [] as string[] }
  const fetch = vi.fn(async (url: string) => {
    if (state.offline) throw new TypeError('Failed to fetch')
    const path = decodeURI(new URL(url).pathname.replace(/^\/api\/content\//, ''))
    state.asked.push(path)
    const found = state.none ? undefined : release.bytes.get(path)
    if (!found) return new Response('not found', { status: 404 })
    return new Response(path === state.tamper ? '{"tampered":true}' : (found as Uint8Array<ArrayBuffer>))
  })
  return { state, fetch, release }
}

function memoryCache(): ContentCache & { keys: () => string[] } {
  const entries = new Map<string, Uint8Array>()
  return {
    match: async (key) => (entries.has(key) ? new Response(entries.get(key) as Uint8Array<ArrayBuffer>) : undefined),
    put: async (key, response) => { entries.set(key, new Uint8Array(await response.arrayBuffer())) },
    keys: () => [...entries.keys()],
  }
}

function memoryStore(): IndexStore & { kept: unknown } {
  const store = { kept: null as unknown, read: () => store.kept, write: (index: StoryIndex) => { store.kept = JSON.parse(JSON.stringify(index)) as unknown } }
  return store
}

const client = (api: ReturnType<typeof server>, cache: ContentCache) => createContentClient({ base: 'http://farm.test/api', token: async () => 'token', fetch: api.fetch, cache })

beforeEach(() => {
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto)
})

describe('the story pack from farm-api', () => {
  it('reads the index fresh, then the boot files by hash, verified; routes wait until asked', async () => {
    const api = server()
    const store = memoryStore()
    const pack = await loadReleasedPack(client(api, memoryCache()), store)
    const { files } = api.release.index
    expect(api.state.asked.sort()).toEqual(['story.json', files.cast!.path, files.household!.path, files.ties!.path, files['uma-9000001']!.path].sort())
    const whole = storyPackFrom(STAND_IN_FILES)
    expect(pack.cast).toEqual(whole.cast)
    expect(pack.scripted).toEqual(whole.scripted)
    expect(pack.household).toEqual(whole.household)
    expect(store.kept).toEqual(api.release.index)
    api.state.asked.length = 0
    expect(await pack.route('9000001')).toEqual(await whole.route('9000001'))
    expect(api.state.asked).toEqual([files['route-9000001']!.path])
  })

  it('reuses the cache: a second boot downloads only the index', async () => {
    const api = server()
    const cache = memoryCache()
    await loadReleasedPack(client(api, cache), memoryStore())
    api.state.asked.length = 0
    await loadReleasedPack(client(api, cache), memoryStore())
    expect(api.state.asked).toEqual(['story.json'])
  })

  it('boots offline on the last index kept on the device, its files from the cache', async () => {
    const api = server()
    const cache = memoryCache()
    const store = memoryStore()
    const first = await loadReleasedPack(client(api, cache), store)
    const route = await first.route('9000002')
    api.state.offline = true
    const offline = await loadReleasedPack(client(api, cache), store)
    expect(offline.cast).toEqual(first.cast)
    expect(await offline.route('9000002')).toEqual(route)
    await expect(offline.route('9000003')).rejects.toThrow('Failed to fetch')
  })

  it('refuses to boot offline with no index kept: the gate offers Try again', async () => {
    const api = server()
    api.state.offline = true
    await expect(loadReleasedPack(client(api, memoryCache()), memoryStore())).rejects.toThrow('Failed to fetch')
  })

  it('refuses a file whose bytes are not the hash the index lists, and keeps no index', async () => {
    const api = server()
    api.state.tamper = api.release.index.files.ties!.path
    const store = memoryStore()
    const cache = memoryCache()
    await expect(loadReleasedPack(client(api, cache), store)).rejects.toThrow('Content hash mismatch')
    expect(store.kept).toBeNull()
    expect(cache.keys()).not.toContain(`https://uma-kit.invalid/release/${api.release.index.files.ties!.sha256}`)
  })

  it('refuses an index that is not a release', async () => {
    const release = standInRelease()
    release.bytes.set('story.json', new TextEncoder().encode('{"version":2}'))
    await expect(loadReleasedPack(client(server(release), memoryCache()), memoryStore())).rejects.toThrow('story.json: version is 1')
  })

  it('plays no pack where asked when farm-api serves none (nothing published), else the last index or Try again', async () => {
    const api = server()
    const cache = memoryCache()
    const store = memoryStore()
    await loadReleasedPack(client(api, cache), store)
    api.state.none = true
    const none = vi.fn(async () => null)
    expect(await loadReleasedPack(client(api, cache), store, { missing: none })).toBeNull()
    expect(none).toHaveBeenCalledOnce()
    expect((await loadReleasedPack(client(api, cache), store)).cast).toEqual(storyPackFrom(STAND_IN_FILES).cast)
    await expect(loadReleasedPack(client(api, cache), memoryStore())).rejects.toMatchObject({ status: 404 })
  })
})

describe("the device's last index", () => {
  it('keeps one index under its key, and reads nothing from an empty, broken or failing store', () => {
    const items = new Map<string, string>()
    const storage = { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v) }
    const store = deviceIndexStore(storage)
    expect(store.read()).toBeNull()
    const { index } = standInRelease()
    store.write(index)
    expect(JSON.parse(items.get(LAST_INDEX_KEY)!)).toEqual(index)
    expect(store.read()).toEqual(index)
    items.set(LAST_INDEX_KEY, '{ broken')
    expect(store.read()).toBeNull()
    const failing = deviceIndexStore({ getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') } })
    expect(failing.read()).toBeNull()
    expect(() => failing.write(index)).not.toThrow()
    expect(deviceIndexStore(undefined).read()).toBeNull()
  })
})
