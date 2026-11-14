#!/usr/bin/env node
// `pnpm story:ship`: the story's routine, one command on the machine where it's written (macOS or Windows; Node, never
// bash). In order:
//   1. check: reads the pack with the game's own reader and prints what it skips and its notes (nothing blocks);
//   2. release: builds it as `story:release` does, into the ignored content/story-release/;
//   3. publish: numbers the index (one more than the bucket's `story.json`, or 1), dates it and gives it its note, then
//      uploads the hash-named files first and `story.json` last (`story:publish`'s rule), so a phone never reads an index
//      naming a file that isn't there. A pack the bucket already plays is not published again;
//   4. back up: `pnpm story:push farm` in the sibling ../uma-platform checkout when it's there, skipped with a note when
//      it isn't;
//   5. says the release's number and what's new.
//
//   pnpm story:ship [--note "…"] [--dry-run]    the note, else the pack's ship.md's first line, else none
//   pnpm story:ship --release <n> [--dry-run]   publishes release n's index again, numbered anew: "Rolled back to n"
//   pnpm story:ship --from <dir> --out <dir>    the pack and its release elsewhere
//
// gcloud is called with the environment only, never changing the active account or its configuration:
// CLOUDSDK_ACTIVE_CONFIG_NAME from STORY_GCLOUD_CONFIG (default `default`), CLOUDSDK_CORE_PROJECT from
// STORY_GCLOUD_PROJECT (default `uma-rpg`); the bucket is STORY_BUCKET (default `uma-farm-content`); the uma-platform
// checkout is STORY_PLATFORM_DIR (default ../uma-platform). `--dry-run` reads the bucket (its number, what's there) and
// uploads nothing. The bucket keeps every hash-named file and the last 10 indexes, so a rollback's files are still there.
//
// Needs Node with type stripping (22.18 or later), as the release does.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildRelease, groupNotes, OUT, parseStoryIndex, readPack, releaseCheck, ReleaseRefused, shippedIndex, SOURCE, stampRelease, STORY_INDEX, STORY_NOTE_MAX,
} from './release.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
/** The sibling uma-platform checkout, where `story:push farm` backs the drafts up. */
export const PLATFORM = resolve(ROOT, '..', 'uma-platform')
/** The pack's file whose first line is the ship's note when `--note` gives none. */
export const NOTE_FILE = 'ship.md'
/** `story:publish`'s headers: the hash-named files cached for good, the index revalidated on every read. */
const FILE_HEADERS = ['--cache-control=private, max-age=31536000, immutable', '--content-type=application/json']
const INDEX_HEADERS = ['--cache-control=private, no-cache', '--content-type=application/json']
/** gcloud's words for an object or a folder that isn't there yet; a bucket that isn't there ("not found: 404") stops. */
const NOT_THERE = /matched no objects|No URLs matched/i
const USAGE = 'pnpm story:ship [--note "…"] [--release <n>] [--dry-run] [--from <dir>] [--out <dir>]'

/** A ship that stops before anything is uploaded, or one whose upload stopped, with every reason. */
export class ShipRefused extends Error {
  constructor(issues) {
    super(`The story can't ship:\n${issues.map((i) => `  - ${i}`).join('\n')}`)
    this.name = 'ShipRefused'
    this.issues = issues
  }
}

/** The environment gcloud runs in: the configuration and project named, never the active ones changed. */
export function gcloudEnv(env = process.env) {
  return { ...env, CLOUDSDK_ACTIVE_CONFIG_NAME: env.STORY_GCLOUD_CONFIG || 'default', CLOUDSDK_CORE_PROJECT: env.STORY_GCLOUD_PROJECT || 'uma-rpg' }
}

/** How to start a command on this platform: on Windows gcloud and pnpm are `.cmd` files, run through the shell with
 * every argument quoted (as uma-platform's story scripts do). */
export function commandFor(file, args, platform = process.platform) {
  if (platform !== 'win32') return { file, args, shell: false }
  if (args.some((a) => a.includes('"'))) throw new ShipRefused([`An argument with a quote can't pass through cmd.exe: ${args.find((a) => a.includes('"'))}`])
  return { file: `${file}.cmd`, args: args.map((a) => `"${a}"`), shell: true }
}

function run(file, args, { env, cwd, show = false } = {}) {
  const c = commandFor(file, args)
  const r = spawnSync(c.file, c.args, { env, cwd, shell: c.shell, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: show ? 'inherit' : 'pipe' })
  if (r.error) return { ok: false, stdout: '', stderr: r.error.message }
  return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

/** gcloud with these arguments, scoped by the environment: `{ ok, stdout, stderr }`. */
export const realGcloud = (args) => run('gcloud', args, { env: gcloudEnv() })
/** pnpm in a folder, its output shown as it runs. */
export const realPnpm = (args, { cwd, env }) => run('pnpm', args, { cwd, env, show: true })

const firstLine = (text) => text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? 'no reason given'
const shown = (path) => (path.startsWith(ROOT) ? relative(ROOT, path) || '.' : path)
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/** A note as the morning shows it: one line, at most `STORY_NOTE_MAX` characters; none when empty. */
function cleanNote(text, where) {
  const note = text.replace(/\s+/g, ' ').trim()
  if (note.length > STORY_NOTE_MAX) throw new ShipRefused([`${where}: the note is ${note.length} characters; the morning shows ${STORY_NOTE_MAX}`])
  return note || null
}

/** The ship's note: `--note`, else the first line of the pack's `ship.md` (a heading's or a bullet's mark dropped), else none. */
export function noteFor(given, from) {
  if (given !== undefined) return cleanNote(given, '--note')
  const file = join(from, NOTE_FILE)
  if (!existsSync(file)) return null
  const first = readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.replace(/^\s*(?:#+|[-*>])\s*/, '').trim()).find((l) => l.length > 0)
  return first ? cleanNote(first, NOTE_FILE) : null
}

/** The bucket as the ship reads and writes it, through `gcloud storage`. */
function bucketOf(gcloud, bucket) {
  const base = `gs://${bucket}`
  const fail = (what, r) => new ShipRefused([`${what}: ${firstLine(r.stderr)}`])
  const index = (url) => {
    const r = gcloud(['storage', 'cat', url])
    if (!r.ok) {
      if (NOT_THERE.test(r.stderr)) return null
      throw fail(`Can't read ${url}`, r)
    }
    try {
      return parseStoryIndex(JSON.parse(r.stdout))
    } catch (e) {
      throw new ShipRefused([`${url} isn't an index the game reads: ${e.issues?.join('; ') ?? e.message}`])
    }
  }
  const lines = (args, what) => {
    const r = gcloud(['storage', 'ls', ...args])
    if (!r.ok) {
      if (NOT_THERE.test(r.stderr)) return []
      throw fail(`Can't list ${what}`, r)
    }
    return r.stdout.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith(`${base}/`))
  }
  return {
    url: base,
    /** The index the phone reads now, or null when none is published. */
    current: () => index(`${base}/${STORY_INDEX}`),
    /** Every kept index, newest first: the one playing and the older versions the bucket keeps. */
    *versions() {
      const urls = lines(['--all-versions', `${base}/${STORY_INDEX}`], `${base}/${STORY_INDEX}'s versions`)
        .filter((url) => /#\d+$/.test(url))
        .sort((a, b) => Number(b.split('#')[1]) - Number(a.split('#')[1]))
      for (const url of urls) {
        const found = index(url)
        if (found) yield found
      }
    },
    /** The hash-named files there, by their path in the release (`story/<name>.<hash8>.json`). */
    files: () => new Set(lines([`${base}/story/`], `${base}/story/`).map((url) => url.slice(base.length + 1))),
    /** The release's hash-named files, sent with `rsync`: only those not there yet go up, and nothing is ever deleted. */
    sendFiles(dir) {
      const r = gcloud(['storage', 'rsync', join(dir, 'story'), `${base}/story`, '--checksums-only', ...FILE_HEADERS])
      if (!r.ok) throw fail('The files didn\'t upload, so story.json wasn\'t sent and the phone plays what it did', r)
    },
    /** The index, last. */
    sendIndex(file) {
      const r = gcloud(['storage', 'cp', file, `${base}/${STORY_INDEX}`, ...INDEX_HEADERS])
      if (!r.ok) throw fail('story.json didn\'t upload, so the phone plays what it did (the new files wait in the bucket)', r)
    },
  }
}

/** The next number: one more than the index playing, or 1. An index published without one (`story:publish`) takes
 * the highest the bucket's kept indexes hold, plus one, so the numbers never go back. */
function nextNumber(store, current) {
  if (!current) return 1
  if (current.number !== undefined) return current.number + 1
  let highest = 0
  for (const index of store.versions()) highest = Math.max(highest, index.number ?? 0)
  return highest + 1
}

/** Step 4: the drafts backed up to uma-platform (`story:push farm`), when its checkout is here. */
function backUp({ from, platform, dryRun, pnpm, log }) {
  if (!existsSync(join(platform, 'package.json'))) {
    log(`  Skipped: no uma-platform checkout at ${platform}. Back the drafts up where there is one: pnpm story:push farm`)
    return 'skipped'
  }
  if (dryRun) {
    log(`  Would run pnpm story:push farm in ${platform}, for the drafts in ${shown(from)}`)
    return 'dry-run'
  }
  log(`  pnpm story:push farm in ${platform}`)
  const r = pnpm(['story:push', 'farm'], { cwd: platform, env: { ...gcloudEnv(), STORY_FARM_DIR: from } })
  if (r.ok) return 'done'
  log(`  The backup didn't finish${r.stderr ? ` (${firstLine(r.stderr)})` : ''}. The release is published; ship again (nothing new is published twice) or run pnpm story:push farm in ${platform}.`)
  return 'failed'
}

/** Steps 1 to 5 for the pack in `from`. Returns what shipped: its number, its note and what went up. */
async function shipPack({ from, out, given, dryRun, store, platform, now, gcloud, pnpm, log }) {
  const note = noteFor(given, from)
  log(`Shipping the story${dryRun ? ' (a dry run: nothing is uploaded)' : ''}: ${shown(from)} → ${store.url}`)

  log('\n1. Check')
  const read = await readPack(from)
  const check = releaseCheck(read.files)
  const skipped = [...read.errors, ...check.errors]
  log(skipped.length === 0 ? '  Nothing skipped: the game reads every part' : `  Skipped, since the game can't read them (${skipped.length}); the rest is in:\n${skipped.map((e) => `    - ${e}`).join('\n')}`)
  log(check.notes.length === 0 ? '  No notes' : `  Notes (${check.notes.length}), which block nothing:\n${groupNotes(check.notes).map((n) => `    - ${n}`).join('\n')}`)

  log('\n2. Release')
  const built = await buildRelease({ from, out, builtAt: now().toISOString() })
  const s = built.summary
  log(`  Release ${s.release}: ${plural(s.files, 'file')}, ${kb(s.bytes)} → ${shown(out)}`)
  log(`  ${plural(s.cast, 'character')}, ${plural(s.bibles, 'bible')}, ${plural(s.routes, 'route')} scripting ${plural(s.events, 'event')}, ${plural(s.pairs, 'pair')}`)

  log('\n3. Publish')
  const current = store.current()
  let number = current?.number ?? null
  let shippedAt = current?.shippedAt ?? null
  let uploaded = []
  const same = current !== null && current.release === built.index.release
  if (same) {
    log(`  The bucket already plays this pack${number ? ` as release ${number}` : ''}: nothing to publish`)
  } else {
    number = nextNumber(store, current)
    shippedAt = now().toISOString()
    const there = store.files()
    const paths = Object.values(built.index.files).map((f) => f.path).sort()
    uploaded = paths.filter((path) => !there.has(path))
    const bytes = Object.fromEntries(Object.values(built.index.files).map((f) => [f.path, f.bytes]))
    log(`  Release ${number}${note ? `: ${note}` : ', no note'}`)
    log(`  ${plural(uploaded.length, 'new file')}, ${plural(paths.length - uploaded.length, 'file')} already there; then story.json, last`)
    if (dryRun) {
      for (const path of uploaded) log(`    Would upload ${path} (${kb(bytes[path])})`)
      log(`    Would upload story.json (release ${number}) to ${store.url}/${STORY_INDEX}`)
    } else {
      const index = await stampRelease(out, { number, shippedAt, note })
      store.sendFiles(out)
      store.sendIndex(join(out, STORY_INDEX))
      log(`  Published release ${index.number} to ${store.url}`)
    }
  }

  log('\n4. Back up')
  const backup = backUp({ from, platform, dryRun, pnpm, log })

  const date = (shippedAt ?? now().toISOString()).slice(0, 10)
  log(same
    ? `\n${number ? `Release ${number}` : 'The release'} still plays (${date}); nothing new shipped`
    : `\nRelease ${number}${dryRun ? ' would ship' : ' shipped'}, ${date}: ${note ?? 'no note'}`)
  return { number, note: same ? (current.note ?? null) : note, release: built.index.release, published: !same && !dryRun, uploaded, backup, dryRun }
}

/** `--release <n>`: release n's index published again, numbered anew with "Rolled back to n". Its files are still in the
 * bucket (it keeps every one), so only `story.json` goes up. */
async function rollBack({ to, given, dryRun, store, now, log }) {
  log(`Rolling the story back to release ${to}${dryRun ? ' (a dry run: nothing is uploaded)' : ''}: ${store.url}`)
  const current = store.current()
  if (!current) throw new ShipRefused([`Nothing is published in ${store.url} yet`])
  if (current.number === to) throw new ShipRefused([`Release ${to} is the one playing`])
  let found = null
  for (const index of store.versions()) if (index.number === to) { found = index; break }
  if (!found) throw new ShipRefused([`Release ${to} isn't among the indexes the bucket keeps (the one playing and the 10 before it)`])
  const there = store.files()
  const missing = Object.values(found.files).map((f) => f.path).filter((path) => !there.has(path))
  if (missing.length > 0) throw new ShipRefused([`Release ${to}'s files aren't all in the bucket (${missing.length} missing: ${missing.slice(0, 3).join(', ')})`])
  const number = nextNumber(store, current)
  const note = cleanNote(`Rolled back to ${to}${given ? ` · ${given}` : ''}`, '--note')
  const shippedAt = now().toISOString()
  const index = shippedIndex(found, { number, shippedAt, note })
  log(`  Release ${to}'s ${plural(Object.keys(found.files).length, 'file')} are in the bucket; only story.json goes up`)
  if (dryRun) {
    log(`    Would upload story.json (release ${number}) to ${store.url}/${STORY_INDEX}`)
  } else {
    const dir = await mkdtemp(join(tmpdir(), 'story-ship-'))
    try {
      await writeFile(join(dir, STORY_INDEX), `${JSON.stringify(index)}\n`)
      store.sendIndex(join(dir, STORY_INDEX))
    } finally {
      await rm(dir, { recursive: true, force: true }) // Only this freshly made folder.
    }
  }
  log(`\nRelease ${number}${dryRun ? ' would ship' : ' shipped'}, ${shippedAt.slice(0, 10)}: ${note}`)
  return { number, note, release: index.release, published: !dryRun, uploaded: [], backup: 'not needed', dryRun }
}

/**
 * Ships the story: the pack in `from` (steps 1 to 5), or with `rollback` release n's index again. Throws `ShipRefused`
 * (or the release's `ReleaseRefused`) when it stops; nothing is uploaded before the bucket's number is read, and
 * `story.json` only after every file. `gcloud`, `pnpm`, `now` and `log` stand in for the real ones in the tests.
 */
export async function ship({
  from = SOURCE, out = OUT, note: given, dryRun = false, rollback, bucket = process.env.STORY_BUCKET || 'uma-farm-content',
  platform = process.env.STORY_PLATFORM_DIR ? resolve(process.env.STORY_PLATFORM_DIR) : PLATFORM,
  now = () => new Date(), gcloud = realGcloud, pnpm = realPnpm, log = console.log,
} = {}) {
  const store = bucketOf(gcloud, bucket)
  if (rollback !== undefined) return rollBack({ to: rollback, given: given === undefined ? null : cleanNote(given, '--note'), dryRun, store, now, log })
  return shipPack({ from, out, given, dryRun, store, platform, now, gcloud, pnpm, log })
}

/** The command line, read: every flag known, each value there. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== '--')
  const options = { dryRun: false }
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--dry-run') { options.dryRun = true; continue }
    if (!['--note', '--release', '--from', '--out'].includes(flag)) throw new ShipRefused([`Unknown: ${flag}. Usage: ${USAGE}`])
    const value = args[++i]
    if (value === undefined) throw new ShipRefused([`${flag} needs a value. Usage: ${USAGE}`])
    if (flag === '--note') options.note = value
    else if (flag === '--release') {
      if (!/^[1-9]\d*$/.test(value)) throw new ShipRefused([`--release is a release's number, not "${value}"`])
      options.rollback = Number(value)
    } else options[flag.slice(2)] = resolve(value)
  }
  return options
}

async function main() {
  const result = await ship(parseArgs(process.argv.slice(2)))
  if (result.backup === 'failed') process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof ShipRefused || e instanceof ReleaseRefused ? e.message : e)
    process.exit(1)
  })
}
