// The story's ship (`pnpm story:ship`) on invented packs only: the stand-in in git (9000001–9000003), copied to a temp
// folder. gcloud is a fake: a bucket kept in memory, or on the command line a stand-in program that only records its
// calls. No cloud is touched, and uma-platform's push never runs (a fake pnpm, or no checkout).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { STAND_IN } from './release.mjs'
import { commandFor, gcloudEnv, noteFor, parseArgs, ship, ShipRefused } from './ship.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const BUCKET = 'uma-farm-content'
const NOW = new Date('2026-11-14T09:30:00.000Z')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

async function temp(t) {
  const dir = await mkdtemp(join(tmpdir(), 'story-ship-'))
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

/** A bucket in memory, through a fake `gcloud storage`: `story.json`'s versions (the last one plays) and the files. */
function fakeBucket({ indexes = [], files = [] } = {}) {
  const base = `gs://${BUCKET}`
  const state = { calls: [], versions: indexes.map((index, i) => ({ generation: 1_700_000_000_000_000 + i, text: JSON.stringify(index) })), files: new Set(files) }
  const missing = (url) => ({ ok: false, stdout: '', stderr: `ERROR: (gcloud.storage.${url.verb}) The following URLs matched no objects or files:\n-${url.url}` })
  const gcloud = (args) => {
    state.calls.push(args.join(' '))
    const [storage, verb, ...rest] = args
    assert.equal(storage, 'storage')
    if (verb === 'cat') {
      const [path, generation] = rest[0].slice(base.length + 1).split('#')
      assert.equal(path, 'story.json')
      const version = generation ? state.versions.find((v) => String(v.generation) === generation) : state.versions.at(-1)
      return version ? { ok: true, stdout: version.text, stderr: '' } : missing({ verb, url: rest[0] })
    }
    if (verb === 'ls' && rest[0] === '--all-versions') {
      if (state.versions.length === 0) return missing({ verb, url: rest[1] })
      return { ok: true, stdout: state.versions.map((v) => `${base}/story.json#${v.generation}\n`).join(''), stderr: '' }
    }
    if (verb === 'ls') {
      assert.equal(rest[0], `${base}/story/`)
      if (state.files.size === 0) return missing({ verb, url: rest[0] })
      return { ok: true, stdout: [...state.files].map((f) => `${base}/${f}\n`).join(''), stderr: '' }
    }
    if (verb === 'rsync') {
      for (const name of readdirSync(rest[0])) state.files.add(`story/${name}`)
      return { ok: true, stdout: '', stderr: '' }
    }
    if (verb === 'cp') {
      assert.equal(rest[1], `${base}/story.json`)
      const index = JSON.parse(readFileSync(rest[0], 'utf8'))
      for (const file of Object.values(index.files)) assert.ok(state.files.has(file.path), `${file.path} is there before story.json names it`)
      state.versions.push({ generation: (state.versions.at(-1)?.generation ?? 1_700_000_000_000_000) + 1, text: JSON.stringify(index) })
      return { ok: true, stdout: '', stderr: '' }
    }
    throw new Error(`The fake doesn't know gcloud ${args.join(' ')}`)
  }
  return { state, gcloud, current: () => (state.versions.length ? JSON.parse(state.versions.at(-1).text) : null) }
}

/** A run of the ship with the fakes: what it said, what it called, what it returned. */
async function shipWith(t, bucket, options = {}) {
  const lines = []
  const pushes = []
  const platform = options.platform ?? join(await temp(t), 'uma-platform')
  const result = await ship({
    from: options.from ?? (await pack(t)), out: options.out ?? join(await temp(t), 'release'), bucket: BUCKET, platform, now: () => NOW,
    gcloud: bucket.gcloud, pnpm: (args, opts) => { pushes.push({ args, ...opts }); return options.pushFails ? { ok: false, stdout: '', stderr: 'invented failure' } : { ok: true, stdout: '', stderr: '' } },
    log: (line) => lines.push(line), ...options,
  })
  return { result, said: lines.join('\n'), pushes }
}

test('ships in order: check, release, publish (the files, then story.json), back up, then the number and the note', async (t) => {
  const bucket = fakeBucket()
  const platform = join(await temp(t), 'uma-platform')
  await mkdir(platform)
  await writeFile(join(platform, 'package.json'), '{}')
  const from = await pack(t)
  const out = join(await temp(t), 'release')
  const { result, said, pushes } = await shipWith(t, bucket, { from, out, platform, note: 'An invented chapter.' })

  const steps = ['1. Check', '2. Release', '3. Publish', '4. Back up', 'Release 1 shipped, 2026-11-14: An invented chapter.']
  const at = steps.map((step) => said.indexOf(step))
  assert.ok(at.every((i, n) => i >= 0 && (n === 0 || i > at[n - 1])), said)
  assert.match(said, /Notes \(\d+\), which block nothing/)
  assert.deepEqual(bucket.state.calls.map((c) => c.split(' ').slice(0, 2).join(' ')), ['storage cat', 'storage ls', 'storage rsync', 'storage cp'])
  assert.equal(bucket.state.calls[2], `storage rsync ${join(out, 'story')} gs://${BUCKET}/story --checksums-only --cache-control=private, max-age=31536000, immutable --content-type=application/json`)
  assert.equal(bucket.state.calls[3], `storage cp ${join(out, 'story.json')} gs://${BUCKET}/story.json --cache-control=private, no-cache --content-type=application/json`)
  assert.deepEqual(pushes.map((p) => ({ args: p.args, cwd: p.cwd, from: p.env.STORY_FARM_DIR })), [{ args: ['story:push', 'farm'], cwd: platform, from }])

  const published = bucket.current()
  assert.deepEqual(published, await readJson(join(out, 'story.json')), 'the local index is the one published')
  assert.equal(published.number, 1)
  assert.equal(published.shippedAt, NOW.toISOString())
  assert.equal(published.note, 'An invented chapter.')
  assert.equal(result.uploaded.length, 9)
  assert.deepEqual({ number: result.number, note: result.note, published: result.published, backup: result.backup }, { number: 1, note: 'An invented chapter.', published: true, backup: 'done' })
})

test('numbers from the bucket\'s index: one more, or one more than the highest kept when it has none', async (t) => {
  const first = fakeBucket()
  await shipWith(t, first)
  const sixth = { ...first.current(), release: '00000006', number: 6 }
  const bucket = fakeBucket({ indexes: [sixth], files: [...first.state.files] })
  const { result, said } = await shipWith(t, bucket, { from: await pack(t, async (dir) => writeFile(join(dir, 'ties.json'), '{ "ties": [] }')) })
  assert.equal(result.number, 7)
  assert.equal(bucket.current().number, 7)
  assert.match(said, /0 new files|1 new file/)

  // An index story:publish put there has no number: the kept ones say how far the numbers went.
  const { number: _n, shippedAt: _s, note: _note, ...unnumbered } = { ...sixth, release: '0000000a' }
  const after = fakeBucket({ indexes: [{ ...sixth, number: 4 }, sixth, unnumbered], files: [...first.state.files] })
  assert.equal((await shipWith(t, after)).result.number, 7)
  assert.ok(after.state.calls.includes(`storage ls --all-versions gs://${BUCKET}/story.json`))
})

test('the note: --note, else the pack\'s ship.md\'s first line, else none; one line, never past the morning\'s 160', async (t) => {
  const from = await pack(t)
  assert.equal(noteFor(undefined, from), null)
  await writeFile(join(from, 'ship.md'), '\n# Two invented chapters\n\nMore below.\n')
  assert.equal(noteFor(undefined, from), 'Two invented chapters')
  assert.equal(noteFor('  An invented\nline. ', from), 'An invented line.')
  assert.equal(noteFor('   ', from), null)
  assert.throws(() => noteFor('x'.repeat(161), from), (e) => e instanceof ShipRefused && /161 characters; the morning shows 160/.test(e.message))

  const bucket = fakeBucket()
  const { result } = await shipWith(t, bucket, { from })
  assert.equal(result.note, 'Two invented chapters')
  assert.equal(bucket.current().note, 'Two invented chapters')
  const quiet = fakeBucket()
  const { said } = await shipWith(t, quiet)
  assert.equal(quiet.current().note, undefined, 'no note, none in the index')
  assert.match(said, /Release 1 shipped, 2026-11-14: no note/)
  // A note too long stops the ship before anything.
  const long = fakeBucket()
  await assert.rejects(shipWith(t, long, { note: 'x'.repeat(200) }), ShipRefused)
  assert.deepEqual(long.state.calls, [])
})

test('a dry run reads the bucket and uploads nothing, listing what it would', async (t) => {
  const bucket = fakeBucket()
  const platform = join(await temp(t), 'uma-platform')
  await mkdir(platform)
  await writeFile(join(platform, 'package.json'), '{}')
  const out = join(await temp(t), 'release')
  const { result, said, pushes } = await shipWith(t, bucket, { out, platform, dryRun: true, note: 'An invented chapter.' })
  assert.deepEqual(bucket.state.calls, [`storage cat gs://${BUCKET}/story.json`, `storage ls gs://${BUCKET}/story/`])
  assert.deepEqual(pushes, [], 'no backup')
  assert.equal(bucket.current(), null)
  assert.match(said, /Would upload story\/cast\.[a-f0-9]{8}\.json \(\d+\.\d KB\)/)
  assert.match(said, /Would upload story\.json \(release 1\) to gs:\/\/uma-farm-content\/story\.json/)
  assert.match(said, /Would run pnpm story:push farm in /)
  assert.match(said, /Release 1 would ship, 2026-11-14: An invented chapter\./)
  assert.equal((await readJson(join(out, 'story.json'))).number, undefined, 'the local index stays unnumbered')
  assert.deepEqual({ number: result.number, published: result.published, uploaded: result.uploaded.length }, { number: 1, published: false, uploaded: 9 })
})

test('a pack the bucket already plays is not published again; the drafts are still backed up', async (t) => {
  const from = await pack(t)
  const bucket = fakeBucket()
  await shipWith(t, bucket, { from, note: 'First.' })
  const platform = join(await temp(t), 'uma-platform')
  await mkdir(platform)
  await writeFile(join(platform, 'package.json'), '{}')
  bucket.state.calls.length = 0
  const { result, said, pushes } = await shipWith(t, bucket, { from, platform, note: 'Again.' })
  assert.deepEqual(bucket.state.calls, [`storage cat gs://${BUCKET}/story.json`])
  assert.equal(bucket.state.versions.length, 1)
  assert.match(said, /already plays this pack as release 1: nothing to publish/)
  assert.match(said, /Release 1 still plays \(2026-11-14\); nothing new shipped/)
  assert.equal(pushes.length, 1)
  assert.deepEqual({ number: result.number, note: result.note, published: result.published }, { number: 1, note: 'First.', published: false })
})

test('no uma-platform checkout: the backup is skipped with a note; a failed one says so and fails the command', async (t) => {
  const { result, said, pushes } = await shipWith(t, fakeBucket())
  assert.equal(result.backup, 'skipped')
  assert.equal(pushes.length, 0)
  assert.match(said, /Skipped: no uma-platform checkout at .*pnpm story:push farm/)
  const platform = join(await temp(t), 'uma-platform')
  await mkdir(platform)
  await writeFile(join(platform, 'package.json'), '{}')
  const failed = await shipWith(t, fakeBucket(), { platform, pushFails: true })
  assert.equal(failed.result.backup, 'failed')
  assert.equal(failed.result.published, true)
  assert.match(failed.said, /The backup didn't finish \(invented failure\)\. The release is published/)
})

test('a rollback publishes an earlier index again, numbered anew, saying "Rolled back to n"', async (t) => {
  const bucket = fakeBucket()
  const two = await pack(t, async (dir) => writeFile(join(dir, 'ties.json'), '{ "ties": [] }'))
  await shipWith(t, bucket, { note: 'One.' })
  await shipWith(t, bucket, { from: two, note: 'Two.' })
  const first = JSON.parse(bucket.state.versions[0].text)
  assert.equal(bucket.current().number, 2)
  bucket.state.calls.length = 0

  const dry = await shipWith(t, bucket, { rollback: 1, dryRun: true })
  assert.equal(bucket.state.versions.length, 2, 'a dry run sends nothing')
  assert.match(dry.said, /Would upload story\.json \(release 3\)/)
  const { result, said } = await shipWith(t, bucket, { rollback: 1 })
  const now = bucket.current()
  assert.deepEqual({ ...now, shippedAt: undefined }, { ...first, number: 3, note: 'Rolled back to 1', shippedAt: undefined })
  assert.equal(now.release, first.release)
  assert.match(said, /Release 3 shipped, 2026-11-14: Rolled back to 1/)
  assert.deepEqual({ number: result.number, note: result.note }, { number: 3, note: 'Rolled back to 1' })
  assert.ok(bucket.state.calls.every((c) => !c.startsWith('storage rsync')), 'only story.json goes up')

  await assert.rejects(shipWith(t, bucket, { rollback: 3 }), /Release 3 is the one playing/)
  await assert.rejects(shipWith(t, bucket, { rollback: 9 }), /Release 9 isn't among the indexes the bucket keeps/)
  bucket.state.files.delete(Object.values(first.files)[0].path)
  await assert.rejects(shipWith(t, bucket, { rollback: 1 }), /Release 1's files aren't all in the bucket \(1 missing/)
  await assert.rejects(shipWith(t, fakeBucket(), { rollback: 1 }), /Nothing is published in gs:\/\/uma-farm-content yet/)
})

test('a missing pack, or a bucket it can\'t read, stops the ship before any upload', async (t) => {
  const bucket = fakeBucket()
  await assert.rejects(shipWith(t, bucket, { from: join(await temp(t), 'nowhere') }), /No story pack/)
  assert.deepEqual(bucket.state.calls, [])
  const denied = { calls: [], gcloud: (args) => { denied.calls.push(args.join(' ')); return { ok: false, stdout: '', stderr: 'ERROR: (gcloud.storage.cat) [someone] does not have storage.objects.get access' } } }
  await assert.rejects(shipWith(t, denied), (e) => e instanceof ShipRefused && /Can't read gs:\/\/uma-farm-content\/story\.json: ERROR/.test(e.message))
  assert.deepEqual(denied.calls, [`storage cat gs://${BUCKET}/story.json`])
  // A bucket that isn't there is not "nothing published yet": no release 1 against the wrong name.
  const nowhere = { gcloud: () => ({ ok: false, stdout: '', stderr: `ERROR: (gcloud.storage.cat) gs://${BUCKET} not found: 404.` }) }
  await assert.rejects(shipWith(t, nowhere, { dryRun: true }), /not found: 404/)
})

test('the command line: its flags, and gcloud and pnpm started the Windows way there', () => {
  assert.deepEqual(parseArgs(['--', '--note', 'An invented line.', '--dry-run']), { dryRun: true, note: 'An invented line.' })
  assert.deepEqual(parseArgs(['--release', '3']), { dryRun: false, rollback: 3 })
  assert.equal(parseArgs(['--from', 'x']).from, resolve('x'))
  assert.throws(() => parseArgs(['--release', 'two']), /--release is a release's number/)
  assert.throws(() => parseArgs(['--note']), /--note needs a value/)
  assert.throws(() => parseArgs(['--publish']), /Unknown: --publish/)
  assert.deepEqual(commandFor('gcloud', ['storage', 'cp', 'a b'], 'darwin'), { file: 'gcloud', args: ['storage', 'cp', 'a b'], shell: false })
  assert.deepEqual(commandFor('gcloud', ['storage', 'cp', 'a b'], 'win32'), { file: 'gcloud.cmd', args: ['"storage"', '"cp"', '"a b"'], shell: true })
  assert.deepEqual(commandFor('pnpm', ['story:push', 'farm'], 'win32').file, 'pnpm.cmd')
  assert.throws(() => commandFor('gcloud', ['say "hi"'], 'win32'), ShipRefused)
  const env = gcloudEnv({ PATH: '/bin', CLOUDSDK_ACTIVE_CONFIG_NAME: 'someone-else', CLOUDSDK_CORE_PROJECT: 'elsewhere' })
  assert.deepEqual([env.CLOUDSDK_ACTIVE_CONFIG_NAME, env.CLOUDSDK_CORE_PROJECT, env.PATH], ['default', 'uma-rpg', '/bin'])
  const named = gcloudEnv({ STORY_GCLOUD_CONFIG: 'story-machine', STORY_GCLOUD_PROJECT: 'another' })
  assert.deepEqual([named.CLOUDSDK_ACTIVE_CONFIG_NAME, named.CLOUDSDK_CORE_PROJECT], ['story-machine', 'another'])
})

test('pnpm story:ship: every gcloud call scoped by the environment, never the active configuration', async (t) => {
  const from = await pack(t)
  const work = await temp(t)
  const bin = join(work, 'bin')
  await mkdir(bin)
  const log = join(work, 'gcloud.log')
  // A stand-in gcloud: records its configuration, project and arguments; nothing is published yet.
  await writeFile(join(bin, 'gcloud'), `#!/usr/bin/env node
const { appendFileSync } = require('node:fs')
const args = process.argv.slice(2)
appendFileSync(${JSON.stringify(log)}, [process.env.CLOUDSDK_ACTIVE_CONFIG_NAME, process.env.CLOUDSDK_CORE_PROJECT, args.join(' ')].join('|') + '\\n')
if (args[1] === 'cat' || args[1] === 'ls') { process.stderr.write('ERROR: The following URLs matched no objects or files'); process.exit(1) }
`)
  await chmod(join(bin, 'gcloud'), 0o755)
  const out = join(work, 'release')
  const run = (args, env = {}) => execFileSync(process.execPath, ['--no-warnings', join(ROOT, 'scripts/story/ship.mjs'), '--from', from, '--out', out, ...args], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, STORY_PLATFORM_DIR: join(work, 'no-platform'), CLOUDSDK_ACTIVE_CONFIG_NAME: 'someone-else', CLOUDSDK_CORE_PROJECT: 'elsewhere', STORY_BUCKET: '', STORY_GCLOUD_CONFIG: '', STORY_GCLOUD_PROJECT: '', ...env },
    encoding: 'utf8', stdio: 'pipe',
  })
  const said = run(['--note', 'An invented chapter.'])
  assert.match(said, /Release 1 shipped, \d{4}-\d\d-\d\d: An invented chapter\./)
  assert.deepEqual((await readFile(log, 'utf8')).trim().split('\n'), [
    'default|uma-rpg|storage cat gs://uma-farm-content/story.json',
    'default|uma-rpg|storage ls gs://uma-farm-content/story/',
    `default|uma-rpg|storage rsync ${out}/story gs://uma-farm-content/story --checksums-only --cache-control=private, max-age=31536000, immutable --content-type=application/json`,
    `default|uma-rpg|storage cp ${out}/story.json gs://uma-farm-content/story.json --cache-control=private, no-cache --content-type=application/json`,
  ])

  await rm(log)
  const dry = run(['--dry-run'], { STORY_GCLOUD_CONFIG: 'story-machine', STORY_GCLOUD_PROJECT: 'another-project', STORY_BUCKET: 'another-bucket' })
  assert.match(dry, /Would upload story\.json \(release 1\) to gs:\/\/another-bucket\/story\.json/)
  assert.deepEqual((await readFile(log, 'utf8')).trim().split('\n'), [
    'story-machine|another-project|storage cat gs://another-bucket/story.json',
    'story-machine|another-project|storage ls gs://another-bucket/story/',
  ])
  assert.throws(() => run(['--release', 'x']), /--release is a release's number/)
})
