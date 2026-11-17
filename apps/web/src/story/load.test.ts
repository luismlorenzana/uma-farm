// The loader seam: the pack farm-api serves, else no pack when it serves none, each with master data's placeholders; and
// the stand-in alone with `VITE_FARM_STORY=stand-in` (Vitest's). A production build holds no stand-in at all
// (`scripts/check-size.mjs`'s DEV_ONLY_MODULES). farm-api is a stub, master data the invented album fixture; no network.
import { eventOf, favouriteOf, LAUNCH_CAST, outfitOf, placeholderEvent, STAND_IN_FILES, storyFileName, storyFilePath, type StoryIndex } from '@farm/domain'
import { createHash, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ files: new Map<string, string>(), asked: [] as string[] }))
const master = vi.hoisted(() => ({ view: null as import('../master/master').MasterView | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(), masterReady: vi.fn(async () => master.view), setMasterLens: () => undefined,
}))
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
const { albumFixture } = await import('../album/testing')
master.view = (await albumFixture()).view

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

  it('plays the release farm-api serves, with master data\'s placeholders, its cast kept to the launch cast', async () => {
    vi.stubEnv('VITE_FARM_STORY', '')
    serveRelease()
    // The stand-in's cast is 9000001–9000003; a launch cast of two keeps those two, in the pack's order.
    const pack = await loadStoryPack(['9000003', '9000001'])
    expect(pack.cast.umas.map((u) => u.characterId)).toEqual(['9000001', '9000003'])
    expect(pack.cast.umas[0]!.paragraph).toBe('Served by farm-api.')
    expect([...pack.master!.outfits.keys()]).toEqual(['90001', '90002', '90003', '90004', '90005', '90006'])
    expect(api.asked[0]).toBe('story.json')
  })

  it('plays no pack when farm-api serves none (nothing published yet): the launch cast, bare, on placeholders', async () => {
    vi.stubEnv('VITE_FARM_STORY', '')
    // The album fixture's six invented characters, 90001–90006, one outfit each (81001–81006); a launch cast of five.
    const pack = await loadStoryPack(['90001', '90002', '90003', '90004', '90005'])
    expect(api.asked).toEqual(['story.json'])
    expect(pack.cast.umas.map((u) => u.characterId)).toEqual(['90001', '90002', '90003', '90004', '90005'])
    expect(outfitOf(pack, '90001')).toBe('81001')
    expect(favouriteOf(pack, '90001')).not.toBeNull()
    expect(pack.bibles.size + pack.scripted.size + pack.ties.ties.length).toBe(0)
    expect((await eventOf(pack, '90001', 'f1')).steps).toEqual(placeholderEvent('90001', 'f1'))
  })

  it('the game\'s own launch cast is the Ranker\'s 50, so a pack without them plays them bare', async () => {
    vi.stubEnv('VITE_FARM_STORY', '')
    serveRelease()
    const pack = await loadStoryPack()
    expect(pack.cast.umas.map((u) => u.characterId)).toEqual([...LAUNCH_CAST])
    expect(pack.cast.umas.every((u) => Object.keys(u).length === 1)).toBe(true)
  })
})
