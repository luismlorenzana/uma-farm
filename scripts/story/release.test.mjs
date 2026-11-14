// The story pack's release and publish, on invented packs only: the stand-in in git (9000001–9000003) and casts built here
// in its numbering. No real character, name or line. Any pack releases, partial or not; only a missing pack is refused.
// The publish script runs against a fake gcloud that only records its calls: no cloud is touched.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildRelease, ReleaseRefused, STAND_IN } from './release.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const BUILT_AT = '2026-11-12T00:00:00.000Z'
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const id = (n) => String(9_000_000 + n)

async function temp(t) {
  const dir = await mkdtemp(join(tmpdir(), 'story-release-'))
  t.after(() => rm(dir, { recursive: true, force: true })) // Only this freshly created folder.
  return dir
}

/** The stand-in copied to a folder, changed by `edit(dir)`. */
async function pack(t, edit = async () => {}) {
  const dir = join(await temp(t), 'story')
  await cp(STAND_IN, dir, { recursive: true })
  await edit(dir)
  return dir
}

/** A pack folder holding only `files` (name → JSON). */
async function packOf(t, files) {
  const dir = join(await temp(t), 'story')
  for (const [name, value] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true })
    await writeFile(join(dir, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2))
  }
  return dir
}

test('releases the stand-in: every file minified, hash-named and listed in story.json', async (t) => {
  const out = await temp(t)
  const { index, summary, errors } = await buildRelease({ from: STAND_IN, out, builtAt: BUILT_AT })
  assert.deepEqual(errors, [])
  assert.deepEqual(Object.keys(index.files), ['cast', 'household', 'opening', 'pair-9000001-9000002', 'route-9000001', 'route-9000002', 'route-9000003', 'ties', 'uma-9000001'])
  assert.deepEqual(await readJson(join(out, 'story.json')), index)
  assert.equal(index.version, 1)
  assert.equal(index.builtAt, BUILT_AT)
  assert.match(index.release, /^[a-f0-9]{8}$/)
  const onDisk = (await readdir(join(out, 'story'))).sort()
  assert.deepEqual(onDisk, Object.values(index.files).map((f) => f.path.slice('story/'.length)).sort())
  for (const [name, file] of Object.entries(index.files)) {
    const bytes = await readFile(join(out, file.path))
    assert.equal(file.sha256, sha256(bytes))
    assert.equal(file.bytes, bytes.length)
    assert.equal(file.path, `story/${name}.${file.sha256.slice(0, 8)}.json`)
    assert.match(file.path, /^story\/[a-z0-9]+(-[a-z0-9]+)*\.[a-f0-9]{8}\.json$/, 'the route allows it')
    assert.ok(!bytes.toString().includes('\n'), `${name} is minified`)
  }
  assert.deepEqual(JSON.parse(await readFile(join(out, index.files['uma-9000001'].path), 'utf8')), await readJson(join(STAND_IN, 'umas/9000001.json')))
  assert.deepEqual(JSON.parse(await readFile(join(out, index.files.opening.path), 'utf8')), await readJson(join(STAND_IN, 'opening.json')))
  assert.equal(summary.files, 9)
  assert.equal(summary.opening, 4)
})

test('writes scripted and pairs, so the game knows what each route and pair holds before loading it', async (t) => {
  const { index } = await buildRelease({ from: STAND_IN, out: await temp(t), builtAt: BUILT_AT })
  const route = await readJson(join(STAND_IN, 'routes/9000001.json'))
  assert.deepEqual(index.scripted, { 9000001: route.events.map((e) => e.id), 9000002: ['arrival'], 9000003: ['arrival'] })
  assert.equal(index.scripted['9000001'].length, 27, 'her arrival and 26 events')
  assert.deepEqual(index.pairs, { '9000001-9000002': [1, 2, 3, 4, 5] })
  assert.ok(index.files.household, 'the household file is in it')
})

test('the same inputs give the same files, and a rebuild swaps the folder whole', async (t) => {
  const [a, b] = [await temp(t), await temp(t)]
  const first = await buildRelease({ from: STAND_IN, out: a, builtAt: BUILT_AT })
  const second = await buildRelease({ from: STAND_IN, out: b, builtAt: BUILT_AT })
  assert.deepEqual(second.index, first.index)
  assert.equal(await readFile(join(b, 'story.json'), 'utf8'), await readFile(join(a, 'story.json'), 'utf8'))
  for (const file of Object.values(first.index.files)) assert.deepEqual(await readFile(join(b, file.path)), await readFile(join(a, file.path)))
  const later = await buildRelease({ from: STAND_IN, out: a, builtAt: '2026-11-13T00:00:00.000Z' })
  assert.equal(later.index.release, first.index.release, 'the release id follows the files, not the time')

  const changed = await pack(t, async (dir) => {
    const ties = await readJson(join(dir, 'ties.json'))
    ties.ties[0].line = `${ties.ties[0].line} Again.`
    await writeFile(join(dir, 'ties.json'), JSON.stringify(ties, null, 2))
  })
  const third = await buildRelease({ from: changed, out: a, builtAt: BUILT_AT })
  assert.notEqual(third.index.files.ties.path, first.index.files.ties.path)
  assert.notEqual(third.index.release, first.index.release)
  assert.equal(third.index.files.cast.path, first.index.files.cast.path)
  assert.deepEqual((await readdir(join(a, 'story'))).sort(), Object.values(third.index.files).map((f) => f.path.slice(6)).sort(), 'no stale file left locally')
})

test('releases a partial pack with notes: bibles and arrival scenes missing, routes partial', async (t) => {
  const from = await pack(t, async (dir) => {
    await rm(join(dir, 'routes/9000003.json'))
    const route = await readJson(join(dir, 'routes/9000001.json'))
    await writeFile(join(dir, 'routes/9000001.json'), JSON.stringify({ ...route, events: route.events.filter((e) => e.id !== 'arrival') }))
  })
  const { index, errors, notes, summary } = await buildRelease({ from, out: await temp(t), builtAt: BUILT_AT })
  assert.deepEqual(errors, [])
  assert.deepEqual(Object.keys(index.scripted), ['9000001', '9000002'])
  assert.ok(notes.includes('umas/9000002.json: no bible yet, so her calling or her stats give her line, every gift is neutral, and her chats are the game’s for each stage'), notes.join('\n'))
  assert.ok(notes.includes('routes/9000001.json: no arrival scene, so the game’s own short one plays'), notes.join('\n'))
  assert.ok(notes.includes('routes/9000003.json: no route yet, so her meeting scene and her events play the game’s own short cards, which pay as written ones do'), notes.join('\n'))
  assert.equal(summary.notes, notes.length)
})

test('releases five characters in any order, an old opening list and retired arrivals dropped, with notes only', async (t) => {
  const umas = [4, 2, 5, 1, 3].map((n) => ({ characterId: id(n), outfitId: `${id(n)}01`, calling: ['quarry', 'fishing', 'farming', 'mining', 'foraging'][n - 1], arrives: { kind: 'opening' } }))
  const from = await packOf(t, { 'cast.json': { opening: umas.map((u) => u.characterId), umas } })
  const out = await temp(t)
  const { index, errors, notes } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.deepEqual(errors, [])
  assert.ok(notes.some((n) => n.startsWith('cast.json: opening: the opening brings nobody')), notes.join('\n'))
  const cast = JSON.parse(await readFile(join(out, index.files.cast.path), 'utf8'))
  assert.equal(cast.opening, undefined)
  assert.deepEqual(cast.umas.map((u) => u.characterId), [id(4), id(2), id(5), id(1), id(3)])
  assert.ok(cast.umas.every((u) => u.arrives === undefined))
  assert.deepEqual(index.files.ties ? Object.keys(index.files).sort() : [], ['cast', 'ties'], 'an empty ties file stands in for a missing one')
})

test('releases forty characters, with notes only', async (t) => {
  const umas = Array.from({ length: 40 }, (_, i) => ({ characterId: id(i + 1), outfitId: `${id(i + 1)}01` }))
  const from = await packOf(t, {
    'cast.json': { umas, welcome: [id(12), id(3)] },
    'ties.json': { ties: [{ a: id(1), b: id(2), kind: 'friends', strength: 2 }, { a: id(39), b: id(40) }] },
    [`umas/${id(12)}.json`]: { characterId: id(12), favouriteLine: 'cooking', gifts: { loved: 'carrot' } },
    [`routes/${id(12)}.json`]: { characterId: id(12), events: [{ id: 'arrival', steps: [{ narrate: 'Someone new at the Gate.' }, { choice: [{ text: 'Welcome.', friendship: 10 }, { text: 'Hello.' }] }] }] },
  })
  const out = await temp(t)
  const { index, errors, notes, summary } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.deepEqual(errors, [])
  assert.equal(summary.cast, 40)
  assert.deepEqual(index.scripted, { [id(12)]: ['arrival'] })
  assert.ok(notes.some((n) => n.startsWith(`umas/${id(40)}.json: no bible yet`)))
  assert.equal(JSON.parse(await readFile(join(out, index.files.cast.path), 'utf8')).welcome.join(), [id(12), id(3)].join())
})

test('releases a single character with no routes, ties or bible', async (t) => {
  const from = await packOf(t, { 'cast.json': { umas: [{ characterId: id(1) }] } })
  const { index, errors, notes } = await buildRelease({ from, out: await temp(t), builtAt: BUILT_AT })
  assert.deepEqual(errors, [])
  assert.deepEqual(index.scripted, {})
  assert.deepEqual(index.pairs, {})
  assert.equal(notes.length, 6)
  assert.ok(notes.includes('opening.json: no opening yet, so the game’s own three lines play'))
  assert.equal(index.files.opening, undefined)
})

test('releases the opening as the game reads it: any length, a step it can\'t play skipped and listed', async (t) => {
  const steps = [
    { narrate: 'Morning over the fence.' }, { say: id(1), line: '“You made it, {farmer}.”' }, { choice: [{ text: 'Hello.' }] },
    { thought: 'Someone is already at the Gate.' }, { narrate: 'x'.repeat(401) },
  ]
  const from = await packOf(t, { 'cast.json': { umas: [{ characterId: id(1) }] }, 'opening.json': { about: 'Invented.', steps } })
  const out = await temp(t)
  const { index, errors, summary } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.deepEqual(errors, [
    'opening.json: Step 3: the opening plays lines only (say, narrate, thought, wait, place), never a pick; skipped',
    'opening.json: Step 5: its narration is 401 characters; the screen shows 400; skipped',
  ])
  const opening = JSON.parse(await readFile(join(out, index.files.opening.path), 'utf8'))
  assert.deepEqual(opening, { about: 'Invented.', steps: [steps[0], steps[1], steps[3]] })
  assert.equal(summary.opening, 3)
  // A file the game can't read at all isn't released: the game's own opening plays.
  const broken = await packOf(t, { 'cast.json': { umas: [{ characterId: id(1) }] }, 'opening.json': '{ not json' })
  const again = await buildRelease({ from: broken, out: await temp(t), builtAt: BUILT_AT })
  assert.deepEqual(again.errors.map((e) => e.split(' (')[0]), ['opening.json: not JSON'])
  assert.equal(again.index.files.opening, undefined)
})

test('releases the town and a sister: town.json as the game reads it, her bible by her id, a tie with one of the town\'s people', async (t) => {
  const sister = `s${id(1)}02`
  const town = {
    people: [{ characterId: id(101), game: 'ida-stone', does: 'Invented smith.' }, { characterId: id(102), game: 'ida-stone' }],
    spots: [{ id: 'cafe', name: 'Invented Café', keeper: id(101) }, { id: 'moon' }],
  }
  const from = await packOf(t, {
    'cast.json': { umas: [{ characterId: id(1), spot: 'cafe' }, { characterId: sister, name: 'Invented Sister' }] },
    'ties.json': { ties: [{ a: id(1), b: id(101), line: 'Invented.' }, { a: id(1), b: sister, kind: 'sisters' }] },
    [`umas/${sister}.json`]: { townLines: ['An invented hello.'] },
    'town.json': town,
  })
  const out = await temp(t)
  const { index, errors, notes, summary } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.deepEqual(errors, [
    `town.json: Person 2 (${id(102)}): game ida-stone is someone else’s role already; skipped`,
    'town.json: Spot 2: id is one of the town’s spots (plaza, market, cafe, harbour, library, track); skipped',
  ])
  assert.ok(notes.includes(`ties.json: Tie 1: ${id(101)} is one of the town’s people, so the tie builds no bond; its line shows on both profiles`), notes.join('\n'))
  assert.deepEqual(Object.keys(index.files).filter((n) => n === 'town' || n.startsWith('uma-')), ['town', `uma-${sister}`])
  const released = JSON.parse(await readFile(join(out, index.files.town.path), 'utf8'))
  assert.deepEqual(released, { people: [town.people[0], { characterId: id(102) }], spots: [town.spots[0]] })
  assert.deepEqual(summary.town, { people: 2, spots: 1 })
})

test('a pack with one broken event loses only that event', async (t) => {
  const from = await pack(t, async (dir) => {
    const route = await readJson(join(dir, 'routes/9000001.json'))
    route.events.find((e) => e.id === 'r3').steps.push({ choice: [] })
    await writeFile(join(dir, 'routes/9000001.json'), JSON.stringify(route))
  })
  const out = await temp(t)
  const { index, errors } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.equal(errors.length, 1)
  assert.match(errors[0], /^routes\/9000001\.json: Event r3, step \d+: a choice lists its options \(the event is skipped\)$/)
  assert.equal(index.scripted['9000001'].length, 26)
  assert.ok(!index.scripted['9000001'].includes('r3'))
  const released = JSON.parse(await readFile(join(out, index.files['route-9000001'].path), 'utf8'))
  assert.deepEqual(released.events.map((e) => e.id), index.scripted['9000001'])
})

test('skips what the game can\'t read, file by file, and releases the rest', async (t) => {
  const from = await pack(t, async (dir) => {
    const cast = await readJson(join(dir, 'cast.json'))
    cast.umas[2].calling = 'juggling'
    await writeFile(join(dir, 'cast.json'), JSON.stringify(cast))
    await writeFile(join(dir, 'pairs/9000002-9000003.json'), '{ not json')
    await writeFile(join(dir, 'ties.json'), '{ "ties": "none" }')
  })
  const out = await temp(t)
  const { index, errors } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.deepEqual(errors.map((e) => e.split(' (')[0]), [
    'pairs/9000002-9000003.json: not JSON',
    'cast.json: Uma 3',
    'ties.json: Not a ties file',
  ])
  const cast = JSON.parse(await readFile(join(out, index.files.cast.path), 'utf8'))
  assert.equal(cast.umas[2].calling, undefined)
  assert.equal(cast.umas.length, 3)
  assert.deepEqual(JSON.parse(await readFile(join(out, index.files.ties.path), 'utf8')), { ties: [] })
  await assert.rejects(buildRelease({ from: join(from, 'nowhere'), out: await temp(t) }), (e) => {
    assert.ok(e instanceof ReleaseRefused)
    assert.match(e.message, /No story pack/)
    return true
  })
})

test('reads only the pack: the sandbox notes, reviews and the cast pack beside it never leave the folder', async (t) => {
  const from = await pack(t, async (dir) => {
    await writeFile(join(dir, 'world.md'), 'Invented notes.')
    await writeFile(join(dir, 'reviews.json'), '{"schemaVersion":1,"items":{}}')
    await mkdir(join(dir, 'pack/sample'), { recursive: true })
    await writeFile(join(dir, 'pack/sample/pack.json'), '{}')
  })
  const out = await temp(t)
  const { index } = await buildRelease({ from, out, builtAt: BUILT_AT })
  assert.ok(Object.keys(index.files).every((n) => /^(cast|ties|household|opening|uma-\d+|route-\d+|pair-\d+-\d+)$/.test(n)))
  assert.deepEqual((await readdir(out)).sort(), ['story', 'story.json'])
})

test('publish: the release first, then the hash-named files, then story.json, with the scoped gcloud only', async (t) => {
  const from = await pack(t)
  const work = await temp(t)
  const bin = join(work, 'bin')
  await mkdir(bin)
  const log = join(work, 'gcloud.log')
  await writeFile(join(bin, 'gcloud'), `#!/usr/bin/env bash\necho "$CLOUDSDK_ACTIVE_CONFIG_NAME|$CLOUDSDK_CORE_PROJECT|$*" >> "${log}"\n`)
  await chmod(join(bin, 'gcloud'), 0o755)
  const out = join(work, 'release')
  const run = (args = [], env = {}) => execFileSync('bash', [join(ROOT, 'scripts/story/publish.sh'), ...args], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, STORY_FROM: from, STORY_OUT: out, CLOUDSDK_ACTIVE_CONFIG_NAME: 'someone-else', CLOUDSDK_CORE_PROJECT: 'elsewhere', ...env },
    encoding: 'utf8', stdio: 'pipe',
  })
  const said = run()
  const index = await readJson(join(out, 'story.json'))
  assert.match(said, new RegExp(`Published release ${index.release}: 9 files and story.json to gs://uma-farm-content`))
  const calls = (await readFile(log, 'utf8')).trim().split('\n')
  assert.deepEqual(calls, [
    `default|uma-rpg|storage rsync ${out}/story gs://uma-farm-content/story --checksums-only --cache-control=private, max-age=31536000, immutable --content-type=application/json`,
    `default|uma-rpg|storage cp ${out}/story.json gs://uma-farm-content/story.json --cache-control=private, no-cache --content-type=application/json`,
  ])

  await rm(log)
  const dry = run(['--dry-run'], { STORY_BUCKET: 'another-bucket' })
  assert.match(dry, /Would upload .*story\.json to gs:\/\/another-bucket\/story\.json/)
  assert.deepEqual((await readFile(log, 'utf8')).trim().split('\n'), [
    `default|uma-rpg|storage rsync ${out}/story gs://another-bucket/story --checksums-only --dry-run --cache-control=private, max-age=31536000, immutable --content-type=application/json`,
  ])

  await rm(log)
  assert.throws(() => run([], { STORY_FROM: join(work, 'no-pack') }), 'a missing pack is never published')
  await assert.rejects(readFile(log, 'utf8'), { code: 'ENOENT' }, 'and gcloud never runs')
})
