// The story pack's release as the game reads it: `story.json` checked whole, then the pack with its
// cast, ties, bibles and household read at once and its routes and pairs on demand, each checked as it loads. On the
// invented stand-in pack only (9000001–9000003).
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { storyPackFrom, StoryPackError } from './pack'
import { parseStoryIndex, releasedStoryPack, shippedIndex, storyFileName, storyFilePath, storyReleaseOf, type StoryIndex } from './release'
import { STAND_IN_FILES } from './stand-in'

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** The stand-in as a release holds it: each file's text by name, and its index (as `scripts/story/release.mjs` writes). */
function release(files = STAND_IN_FILES) {
  const named: [string, unknown][] = [[storyFileName.cast, files.cast], [storyFileName.ties, files.ties], [storyFileName.household, files.household],
    ...Object.entries(files.umas).map(([id, v]): [string, unknown] => [storyFileName.uma(id), v]),
    ...Object.entries(files.routes).map(([id, v]): [string, unknown] => [storyFileName.route(id), v]),
    ...Object.entries(files.pairs ?? {}).map(([name, v]): [string, unknown] => [storyFileName.pair(name), v])]
  const text = new Map(named.map(([name, value]) => [name, JSON.stringify(value)]))
  const index: StoryIndex = {
    version: 1, release: '0123abcd', builtAt: '2026-11-12T00:00:00.000Z',
    files: Object.fromEntries([...text].map(([name, t]) => [name, { path: storyFilePath(name, sha256(t)), bytes: t.length, sha256: sha256(t) }])),
    scripted: Object.fromEntries(Object.entries(files.routes).map(([id, r]) => [id, (r as { events: { id: string }[] }).events.map((e) => e.id)])),
    pairs: Object.fromEntries(Object.entries(files.pairs ?? {}).map(([name, p]) => [name, (p as { levels: { hearts: number }[] }).levels.map((l) => l.hearts)])),
  }
  const reads: string[] = []
  const read = async (name: string) => { reads.push(name); return JSON.parse(text.get(name)!) as unknown }
  return { index, text, reads, read }
}

const issuesOf = (fn: () => unknown): string[] => {
  try { fn() } catch (e) { if (e instanceof StoryPackError) return [...e.issues]; throw e }
  return []
}

describe('story.json', () => {
  it('reads an index the release writes', () => {
    const { index } = release()
    expect(parseStoryIndex(clone(index))).toEqual(index)
  })

  it('refuses one that lists a file away from its hash-named path, or misses the cast or the ties', () => {
    const { index } = release()
    const bad = clone(index)
    bad.files.cast!.path = 'story/cast.00000000.json'
    delete (bad.files as Record<string, unknown>).ties
    bad.files['Bad Name'] = { ...index.files.cast! }
    expect(issuesOf(() => parseStoryIndex(bad))).toEqual([
      'story.json: cast is { path: story/cast.<hash8>.json, bytes, sha256 }',
      "story.json: Bad Name isn't a file name",
      'story.json: Bad Name is { path: story/Bad Name.<hash8>.json, bytes, sha256 }',
      'story.json: no ties',
    ])
  })

  it('reads a ship\'s number, date and note, each optional, and checks them when there', () => {
    const { index } = release()
    expect(storyReleaseOf(parseStoryIndex(clone(index)))).toEqual({ id: '0123abcd', builtAt: '2026-11-12T00:00:00.000Z', number: null, shippedAt: null, note: null })
    const shipped = shippedIndex(index, { number: 4, shippedAt: '2026-11-14T09:00:00.000Z', note: 'An invented chapter.' })
    expect(parseStoryIndex(clone(shipped))).toEqual({ ...index, number: 4, shippedAt: '2026-11-14T09:00:00.000Z', note: 'An invented chapter.' })
    expect(storyReleaseOf(shipped)).toMatchObject({ number: 4, note: 'An invented chapter.' })
    // A rollback numbers an earlier index again: the new number and note replace the old.
    expect(shippedIndex(shipped, { number: 5, shippedAt: '2026-11-15T09:00:00.000Z', note: null })).toEqual({ ...index, number: 5, shippedAt: '2026-11-15T09:00:00.000Z' })
    expect(issuesOf(() => parseStoryIndex({ ...clone(index), number: 0, shippedAt: 'soon', note: 'x'.repeat(161) }))).toEqual([
      'story.json: number is a whole number from 1',
      'story.json: shippedAt is a date',
      'story.json: note is one line of at most 160 characters',
    ])
    expect(issuesOf(() => parseStoryIndex({ ...clone(index), number: 1.5, note: 'Two\nlines' }))).toHaveLength(2)
  })

  it('refuses a route or pair listed one way and not the other', () => {
    const bad = clone(release().index)
    delete (bad.files as Record<string, unknown>)['route-9000002']
    bad.pairs['9000001-9000003'] = [1]
    expect(issuesOf(() => parseStoryIndex(bad))).toEqual([
      'story.json: scripted.9000002 has no route-9000002',
      'story.json: pairs.9000001-9000003 has no pair-9000001-9000003',
    ])
    expect(issuesOf(() => parseStoryIndex({ ...bad, version: 2, scripted: [] }))).toContain('story.json: version is 1')
  })
})

describe('the released pack', () => {
  it('reads the cast, ties, bibles and household at once, and is the pack storyPackFrom makes', async () => {
    const { index, read, reads } = release()
    const pack = await releasedStoryPack(index, read)
    expect(reads.sort()).toEqual(['cast', 'household', 'ties', 'uma-9000001'])
    const whole = storyPackFrom(STAND_IN_FILES)
    expect(pack.cast).toEqual(whole.cast)
    expect(pack.ties).toEqual(whole.ties)
    expect([...pack.bibles.keys()]).toEqual([...whole.bibles.keys()])
    expect(pack.scripted).toEqual(whole.scripted)
    expect(pack.pairs).toEqual(whole.pairs)
    expect(pack.household).toEqual(whole.household)
  })

  it('reads a route and a pair on demand, once, and nothing the index does not list', async () => {
    const { index, read, reads } = release()
    const pack = await releasedStoryPack(index, read)
    reads.length = 0
    expect(await pack.route('9000001')).toEqual(await storyPackFrom(STAND_IN_FILES).route('9000001'))
    await pack.route('9000001')
    expect(await pack.pair('9000002', '9000001')).toEqual(STAND_IN_FILES.pairs!['9000001-9000002'])
    expect(await pack.route('9000009')).toBeNull()
    expect(await pack.pair('9000001', '9000003')).toBeNull()
    expect(reads).toEqual(['route-9000001', 'pair-9000001-9000002'])
  })

  it("refuses a route that doesn't hold what the index says, and reads it again next time", async () => {
    const { index, read } = release()
    index.scripted['9000002'] = ['arrival', 'f1']
    let fail = true
    const pack = await releasedStoryPack(index, async (name) => {
      if (name === 'route-9000003' && fail) { fail = false; throw new Error('offline') }
      return read(name)
    })
    await expect(pack.route('9000002')).rejects.toThrow("routes/9000002: its events aren't the index's")
    await expect(pack.route('9000003')).rejects.toThrow('offline')
    expect((await pack.route('9000003'))?.events.map((e) => e.id)).toEqual(['arrival'])
  })

  it('reads a route as the game does: a broken event it holds that the index lists is refused', async () => {
    const files = clone(STAND_IN_FILES)
    ;(files.routes['9000003'] as { characterId: string }).characterId = '9000002'
    const { index, read } = release(files)
    const pack = await releasedStoryPack(index, read)
    expect((await pack.route('9000003'))?.events.map((e) => e.id)).toEqual(['arrival'])
    const broken = clone(STAND_IN_FILES)
    ;(broken.routes['9000002'] as { events: { steps: unknown[] }[] }).events[0]!.steps = []
    const second = release(broken)
    await expect((await releasedStoryPack(second.index, second.read)).route('9000002')).rejects.toThrow("routes/9000002: its events aren't the index's")
  })

  it('reads boot files with broken parts, skipping them; refuses only an index naming a pair out of numeric order', async () => {
    const files = clone(STAND_IN_FILES)
    ;(files.cast as { umas: { calling: string }[] }).umas[0]!.calling = 'juggling'
    const pack = await releasedStoryPack(release(files).index, release(files).read)
    expect(pack.cast.umas[0]).not.toHaveProperty('calling')
    expect(pack.cast.umas.map((u) => u.characterId)).toEqual(['9000001', '9000002', '9000003'])
    const { index, read, text } = release()
    index.scripted['9000042'] = ['arrival']
    index.files['route-9000042'] = index.files['route-9000003']!
    text.set('route-9000042', text.get('route-9000003')!)
    expect((await (await releasedStoryPack(index, read)).route('9000042'))?.events.map((e) => e.id)).toEqual(['arrival'])
    index.pairs['9000003-9000002'] = [1]
    index.files['pair-9000003-9000002'] = index.files['pair-9000001-9000002']!
    await expect(releasedStoryPack(index, read)).rejects.toThrow("story.json: pairs.9000003-9000002 isn't <a>-<b> in numeric order")
  })
})
