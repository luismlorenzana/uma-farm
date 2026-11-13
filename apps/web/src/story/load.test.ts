// The loader seam on the dev server: the pack farm-api serves, else the invented
// stand-in when it serves none, and the stand-in alone with `VITE_FARM_STORY=stand-in` (Vitest's). A production build
// holds no stand-in at all (`scripts/check-size.mjs`'s DEV_ONLY_MODULES). farm-api is a stub; no network.
import { STAND_IN_FILES, storyFileName, storyFilePath, type StoryIndex } from '@farm/domain'
import { createHash, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ files: new Map<string, string>(), asked: [] as string[] }))
vi.mock('../content/client', async () => {
  const { createContentClient } = await import('@luismlorenzana/uma-kit/content')
  const fetch = async (url: string) => {
    const path = new URL(url).pathname.replace(/^\/api\/content\//, '')
    api.asked.push(path)
    const found = api.files.get(path)
    return found === undefined ? new Response('', { status: 404 }) : new Response(found)
  }
  return { CONTENT: createContentClient({ base: 'http://farm.test/api', token: async () => null, fetch, cache: null }) }
})

const { loadStoryPack } = await import('./load')

/** The stand-in with her paragraph changed, released, so the test knows which pack came back. */
function serveRelease(): void {
  const cast = JSON.parse(JSON.stringify(STAND_IN_FILES.cast)) as { umas: { paragraph: string }[] }
  cast.umas[0]!.paragraph = 'Served by farm-api.'
  const named: [string, unknown][] = [[storyFileName.cast, cast], [storyFileName.ties, STAND_IN_FILES.ties], [storyFileName.uma('9000001'), STAND_IN_FILES.umas['9000001']]]
  const files: StoryIndex['files'] = {}
  for (const [name, value] of named) {
    const text = JSON.stringify(value)
    const sha = createHash('sha256').update(text).digest('hex')
    files[name] = { path: storyFilePath(name, sha), bytes: Buffer.byteLength(text), sha256: sha }
    api.files.set(files[name].path, text)
  }
  const index: StoryIndex = { version: 1, release: '12345678', builtAt: '2026-11-12T00:00:00.000Z', files, scripted: {}, pairs: {} }
  api.files.set('story.json', JSON.stringify(index))
}

beforeEach(() => {
  api.files.clear()
  api.asked.length = 0
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('the loader seam', () => {
  it("plays the stand-in without asking farm-api when VITE_FARM_STORY is 'stand-in'", async () => {
    serveRelease()
    const pack = await loadStoryPack()
    expect(pack.cast.umas[0]!.paragraph).toBe('Stand-in one came to grow things.')
    expect(api.asked).toEqual([])
  })

  it('plays the release farm-api serves', async () => {
    vi.stubEnv('VITE_FARM_STORY', '')
    serveRelease()
    const pack = await loadStoryPack()
    expect(pack.cast.umas[0]!.paragraph).toBe('Served by farm-api.')
    expect(api.asked[0]).toBe('story.json')
  })

  it('plays the stand-in when farm-api serves no pack (nothing published yet), in production as on the dev server', async () => {
    vi.stubEnv('VITE_FARM_STORY', '')
    const pack = await loadStoryPack()
    expect(pack.cast.umas[0]!.paragraph).toBe('Stand-in one came to grow things.')
    expect(api.asked).toEqual(['story.json'])
  })
})
