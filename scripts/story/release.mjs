#!/usr/bin/env node
// Builds the story pack's release: the private pack in the ignored content/story/, read by the game's own reader
// (`readStoryPack`, read in place with Node's type stripping as the Story Sandbox reads it), written to the ignored
// content/story-release/ laid out as the bucket is: each file minified as `story/<name>.<hash8>.json` and the index
// `story.json`. The same inputs give the same files.
//
// Any pack releases: a partial one is the normal case. The release holds the pack as the game reads it: a part with an
// error (a file that isn't JSON, a value the game can't read, a line longer than its screen) is skipped and listed, the
// rest kept; the notes (what isn't written yet, and what plays instead) are listed and block nothing. It refuses only
// when there's no pack folder, or its index can't be written. Only the pack's files are read (cast, ties, umas/, routes/,
// pairs/, household, opening, town, world): the sandbox's notes, reviews and the cast pack's images beside them never leave
// the folder.
//
//   pnpm story:release                  content/story → content/story-release
//   pnpm story:release --stand-in       the invented stand-in in git, for the dev server
//   pnpm story:release --from <dir> --out <dir>
//   pnpm story:release --number <n> [--note "…"]   the local index numbered as a ship numbers it, for the dev server
//
// A built release has no number: `pnpm story:ship` (ship.mjs) numbers, dates and notes the index as it publishes it.
//
// Needs Node with type stripping (22.18 or later).
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { register } from 'node:module'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DOMAIN = join(ROOT, 'packages/domain/src')
/** The private pack, and where its release goes (both ignored by git). */
export const SOURCE = resolve(process.env.UMA_FARM_CONTENT ?? join(ROOT, '../uma-story-authoring/content/farm/story'))
export const OUT = join(ROOT, 'content/story-release')
/** The invented stand-in in git (9000001–9000003), in the pack's layout. */
export const STAND_IN = join(DOMAIN, 'story/stand-in')

if (!process.features?.typescript) throw new Error('This Node reads no TypeScript: the release needs Node 22.18 or later (type stripping).')
register(pathToFileURL(join(ROOT, 'scripts/story/resolve-ts.mjs')))
const { readStoryPack } = await import(pathToFileURL(join(DOMAIN, 'story/pack.ts')).href)
const { parseStoryIndex, releasedStoryPack, shippedIndex, STORY_INDEX, STORY_NAME, STORY_NOTE_MAX, storyFileName, storyFilePath } = await import(pathToFileURL(join(DOMAIN, 'story/release.ts')).href)
// The marker's check (a piece marked "draft": "default" whose words changed): notes, beside the reader's.
const { draftNotes } = await import(pathToFileURL(join(DOMAIN, 'story/complete.ts')).href)
/** The game's own index reader and a ship's stamp, for the ship (`ship.mjs`). */
export { parseStoryIndex, releasedStoryPack, shippedIndex, STORY_INDEX, STORY_NOTE_MAX }

/** A pack the release refuses (no pack folder, or an index it can't write), with every reason. */
export class ReleaseRefused extends Error {
  constructor(issues) {
    super(`The story pack can't be released (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n${issues.map((i) => `  - ${i}`).join('\n')}`)
    this.name = 'ReleaseRefused'
    this.issues = issues
  }
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

/** Reads a JSON file, or undefined when it isn't there. A file that doesn't parse is an error: it's skipped. */
async function json(path, errors, from) {
  let text
  try { text = await readFile(path, 'utf8') } catch (e) { if (e.code === 'ENOENT') return undefined; throw e }
  try { return JSON.parse(text) } catch (e) { errors.push(`${relative(from, path)}: not JSON (${e.message}); skipped`); return undefined }
}

/** A folder's `<name>.json` files, by name; none when the folder isn't there. */
async function folder(dir, errors, from) {
  const names = (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.json')).sort()
  const out = {}
  for (const file of names) {
    const name = basename(file, '.json')
    if (!STORY_NAME.test(name)) { errors.push(`${relative(from, join(dir, file))}: a file name is lowercase letters, digits and -; skipped`); continue }
    const value = await json(join(dir, file), errors, from)
    if (value !== undefined) out[name] = value
  }
  return out
}

/** The pack's files in `from`, as the reader takes them (`PackFiles`), and the files it couldn't read at all. */
export async function readPack(from) {
  if (!existsSync(from)) throw new ReleaseRefused([`No story pack in ${from}`])
  const errors = []
  const files = {
    cast: await json(join(from, 'cast.json'), errors, from),
    ties: await json(join(from, 'ties.json'), errors, from),
    umas: await folder(join(from, 'umas'), errors, from),
    routes: await folder(join(from, 'routes'), errors, from),
    pairs: await folder(join(from, 'pairs'), errors, from),
  }
  const household = await json(join(from, 'household.json'), errors, from)
  if (household !== undefined) files.household = household
  const opening = await json(join(from, 'opening.json'), errors, from)
  if (opening !== undefined) files.opening = opening
  const town = await json(join(from, 'town.json'), errors, from)
  if (town !== undefined) files.town = town
  const world = await json(join(from, 'world.json'), errors, from)
  if (world !== undefined) files.world = world
  return { files, errors }
}

/** The pack as the game reads it: its files with every broken part skipped, what was skipped (`errors`) and the notes,
 * the marker's among them (`story/complete.ts`: a piece marked "draft": "default" whose words aren't the default's). */
export function releaseCheck(files) {
  const read = readStoryPack(files)
  const ids = [...new Set([...read.files.cast.umas.map((u) => u.characterId), ...Object.keys(read.files.umas), ...Object.keys(read.files.routes)])]
  return { files: read.files, errors: read.errors, notes: [...read.notes, ...ids.flatMap((id) => draftNotes(read.files, id))] }
}

const byId = (a, b) => (Number(a) - Number(b)) || a.localeCompare(b)

/** The release's files, minified, in name order: [name, bytes]. The cast and the ties are always there. */
function releaseFiles(files) {
  const out = [[storyFileName.cast, files.cast], [storyFileName.ties, files.ties]]
  if (files.household !== undefined) out.push([storyFileName.household, files.household])
  if (files.opening !== undefined) out.push([storyFileName.opening, files.opening])
  if (files.town !== undefined) out.push([storyFileName.town, files.town])
  if (files.world !== undefined) out.push([storyFileName.world, files.world])
  for (const id of Object.keys(files.umas).sort(byId)) out.push([storyFileName.uma(id), files.umas[id]])
  for (const id of Object.keys(files.routes).sort(byId)) out.push([storyFileName.route(id), files.routes[id]])
  for (const name of Object.keys(files.pairs).sort()) out.push([storyFileName.pair(name), files.pairs[name]])
  return out.map(([name, value]) => [name, Buffer.from(JSON.stringify(value), 'utf8')]).sort(([a], [b]) => a.localeCompare(b))
}

/**
 * Builds the release of the pack in `from` into `out`: the hash-named files under `story/`, swapped in whole, then
 * `story.json`. The release holds the pack as the game reads it, every broken part skipped. Checks its own output as the
 * game reads it (the index, then every route and pair). Returns the index, a summary in ids and counts, what was skipped
 * (`errors`) and the `notes`. Throws `ReleaseRefused` and writes nothing when there's no pack folder or no index to write.
 */
export async function buildRelease({ from = SOURCE, out = OUT, builtAt = new Date().toISOString() } = {}) {
  const read = await readPack(from)
  const { files, errors: skipped, notes } = releaseCheck(read.files)
  const errors = [...read.errors, ...skipped]

  const written = releaseFiles(files)
  const listed = Object.fromEntries(written.map(([name, bytes]) => {
    const hash = sha256(bytes)
    return [name, { path: storyFilePath(name, hash), bytes: bytes.length, sha256: hash }]
  }))
  const index = {
    version: 1,
    release: sha256(written.map(([name]) => `${name} ${listed[name].sha256}\n`).join('')).slice(0, 8),
    builtAt,
    files: listed,
    scripted: Object.fromEntries(Object.keys(files.routes).sort(byId).map((id) => [id, files.routes[id].events.map((e) => e.id)])),
    pairs: Object.fromEntries(Object.keys(files.pairs).sort().map((name) => [name, files.pairs[name].levels.map((l) => l.hearts).sort((a, b) => a - b)])),
  }

  // The game's reader takes it: the index, the files at boot, every route and pair. A failure here is the release's own
  // fault, never the pack's: nothing is written.
  const bytesOf = new Map(written)
  let pack
  try {
    pack = await releasedStoryPack(parseStoryIndex(index), async (name, file) => {
      const bytes = bytesOf.get(name)
      if (!bytes || sha256(bytes) !== file.sha256) throw new Error(`${name}: not the bytes the index lists`)
      return JSON.parse(bytes.toString('utf8'))
    })
    for (const id of Object.keys(index.scripted)) await pack.route(id)
    for (const name of Object.keys(index.pairs)) await pack.pair(...name.split('-'))
  } catch (e) {
    throw new ReleaseRefused([`story.json can't be written: ${e.issues?.join('; ') ?? e.message}`])
  }

  // Swap the finished folder in, then the index that names its files.
  await mkdir(out, { recursive: true })
  const staging = join(out, 'story.part')
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging)
  for (const [name, bytes] of written) await writeFile(join(staging, listed[name].path.slice('story/'.length)), bytes)
  await rm(join(out, 'story'), { recursive: true, force: true })
  await rename(staging, join(out, 'story'))
  await writeFile(join(out, `${STORY_INDEX}.part`), `${JSON.stringify(index)}\n`)
  await rename(join(out, `${STORY_INDEX}.part`), join(out, STORY_INDEX))

  const beats = Object.values(files.umas).reduce((n, b) => n + (Array.isArray(b.route) ? b.route.length : 0), 0)
  const events = Object.values(index.scripted).reduce((n, list) => n + list.length, 0)
  const summary = {
    release: index.release,
    files: written.length,
    bytes: written.reduce((n, [, b]) => n + b.length, 0),
    cast: pack.cast.umas.length,
    bibles: Object.keys(files.umas).length,
    routes: Object.keys(index.scripted).length,
    events,
    beats,
    pairs: Object.keys(index.pairs).length,
    household: files.household !== undefined,
    opening: files.opening?.steps.length ?? 0,
    town: files.town ? { people: files.town.people?.length ?? 0, spots: files.town.spots?.length ?? 0, locations: files.town.locations?.length ?? 0 } : null,
    world: files.world ? { festivals: files.world.festivals?.length ?? 0, places: Object.keys(files.world.places ?? {}).length, notes: files.world.notes?.length ?? 0 } : null,
    skipped: errors.length,
    notes: notes.length,
  }
  return { index, summary, errors, notes }
}

/** Writes `story.json` in `out` numbered, dated and with its note, as a ship publishes it; its files stay. */
export async function stampRelease(out, ship) {
  const index = shippedIndex(parseStoryIndex(JSON.parse(await readFile(join(out, STORY_INDEX), 'utf8'))), ship)
  await writeFile(join(out, `${STORY_INDEX}.part`), `${JSON.stringify(index)}\n`)
  await rename(join(out, `${STORY_INDEX}.part`), join(out, STORY_INDEX))
  return index
}

async function main() {
  const args = process.argv.slice(2)
  const text = (flag) => { const i = args.indexOf(flag); return i >= 0 ? (args[i + 1] ?? '') : undefined }
  const option = (flag) => { const value = text(flag); return value === undefined ? undefined : resolve(value) }
  const standIn = args.includes('--stand-in')
  const from = option('--from') ?? process.env.STORY_FROM ?? (standIn ? STAND_IN : SOURCE)
  const out = option('--out') ?? process.env.STORY_OUT ?? OUT
  const number = text('--number')
  if (number !== undefined && !/^[1-9]\d*$/.test(number)) throw new ReleaseRefused([`--number is a whole number from 1, not "${number}"`])
  const builtAt = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : undefined
  const { summary: s, errors, notes } = await buildRelease({ from, out, ...(builtAt ? { builtAt } : {}) })
  console.log(`Story release ${s.release}${standIn ? ' (the stand-in)' : ''}: ${s.files} files, ${(s.bytes / 1024).toFixed(1)} KB → ${out.startsWith(ROOT) ? relative(ROOT, out) : out}`)
  console.log(`  ${s.cast} character${s.cast === 1 ? '' : 's'}, ${s.bibles} bible${s.bibles === 1 ? '' : 's'}; ${s.routes} routes scripting ${s.events} events (bibles hold ${s.beats} beats); ${s.pairs} pairs; household ${s.household ? 'yes' : 'not yet'}; opening ${s.opening > 0 ? `${s.opening} step${s.opening === 1 ? '' : 's'}` : 'the game’s own'}; town ${s.town ? `${s.town.people} people, ${s.town.spots} spots, ${s.town.locations} locations` : 'the game’s own'}; world ${s.world ? `${s.world.festivals} festivals, ${s.world.places} places, ${s.world.notes} Town notes` : 'the game’s own'}`)
  if (errors.length > 0) console.log(`\nSkipped, since the game can't read them (${errors.length}); the rest of the pack is in:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  if (notes.length > 0) console.log(`\nNotes (${notes.length}), which block nothing:\n${groupNotes(notes).map((n) => `  - ${n}`).join('\n')}`)
  if (number !== undefined) {
    const note = text('--note')?.trim() || null
    const index = await stampRelease(out, { number: Number(number), shippedAt: new Date().toISOString(), note }).catch((e) => { throw new ReleaseRefused(e.issues ?? [e.message]) })
    console.log(`\nNumbered locally as release ${index.number}${index.note ? `: ${index.note}` : ''} (the dev server's; only a ship numbers what the phone plays)`)
  }
}

/** Notes that differ only in a character's id, as one line with the ids: "… (37: 9000004, 9000005, …)". */
export function groupNotes(notes) {
  const groups = new Map()
  for (const note of notes) {
    const ids = note.match(/\bs?[1-9]\d{3,}\b/g) ?? []
    const key = note.replace(/\bs?[1-9]\d{3,}\b/g, '<id>').replace(/\bUma \d+ \(/g, 'Uma (')
    const group = groups.get(key) ?? { first: note, ids: [] }
    group.ids.push(...ids.filter((id) => !group.ids.includes(id)))
    group.count = (group.count ?? 0) + 1
    groups.set(key, group)
  }
  return [...groups].map(([key, g]) => (g.count === 1 ? g.first : `${key} (${g.count}: ${g.ids.join(', ')})`))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e instanceof ReleaseRefused ? e.message : e); process.exit(1) })
}
