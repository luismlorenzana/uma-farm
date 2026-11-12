#!/usr/bin/env node
// Builds the story pack's release (F56 decision 3; romance spec RM58, RM60): the private pack in the ignored
// content/story/, checked whole by the game's own validator (`storyPackFrom`, read in place with Node's type stripping as
// the Story Sandbox reads it), written to the ignored content/story-release/ laid out as the bucket is: each file
// minified as `story/<name>.<hash8>.json` and the index `story.json`. The same inputs give the same files.
//
// It refuses a pack where anything fails the validator, or where a cast Uma lacks her bible or her arrival scene (D64:
// the go-live needs all of them); routes, pairs and the household may be partial ("Her story is still being written").
// Only the pack's files are read (cast, ties, umas/, routes/, pairs/, household): the sandbox's notes, reviews and the
// cast pack's images beside them never leave the folder.
//
//   pnpm story:release                  content/story → content/story-release
//   pnpm story:release --stand-in       the invented stand-in in git, for the dev server (its forager and fisher have
//                                       no bible by design, D51 b, so only there a bible may be missing)
//   pnpm story:release --from <dir> --out <dir>
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
export const SOURCE = join(ROOT, 'content/story')
export const OUT = join(ROOT, 'content/story-release')
/** The invented stand-in in git (9000001–9000003), in the pack's layout. */
export const STAND_IN = join(DOMAIN, 'story/stand-in')

if (!process.features?.typescript) throw new Error('This Node reads no TypeScript: the release needs Node 22.18 or later (type stripping).')
register(pathToFileURL(join(ROOT, 'tools/story-sandbox/lib/resolve-ts.mjs')))
const { storyPackFrom, StoryPackError } = await import(pathToFileURL(join(DOMAIN, 'story/pack.ts')).href)
const { parseStoryIndex, releasedStoryPack, STORY_INDEX, STORY_NAME, storyFileName, storyFilePath } = await import(pathToFileURL(join(DOMAIN, 'story/release.ts')).href)

/** A pack the release refuses, with every reason. */
export class ReleaseRefused extends Error {
  constructor(issues) {
    super(`The story pack can't be released (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n${issues.map((i) => `  - ${i}`).join('\n')}`)
    this.name = 'ReleaseRefused'
    this.issues = issues
  }
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Reads a JSON file, or undefined when it isn't there. A file that doesn't parse is an issue. */
async function json(path, issues, from) {
  let text
  try { text = await readFile(path, 'utf8') } catch (e) { if (e.code === 'ENOENT') return undefined; throw e }
  try { return JSON.parse(text) } catch (e) { issues.push(`${relative(from, path)}: not JSON (${e.message})`); return undefined }
}

/** A folder's `<name>.json` files, by name; none when the folder isn't there. */
async function folder(dir, issues, from) {
  const names = (await readdir(dir).catch(() => [])).filter((n) => n.endsWith('.json')).sort()
  const out = {}
  for (const file of names) {
    const name = basename(file, '.json')
    if (!STORY_NAME.test(name)) { issues.push(`${relative(from, join(dir, file))}: a file name is lowercase letters, digits and -`); continue }
    const value = await json(join(dir, file), issues, from)
    if (value !== undefined) out[name] = value
  }
  return out
}

/** The pack's files in `from`, laid out as F40 writes them (`PackFiles`). */
export async function readPack(from) {
  if (!existsSync(from)) throw new ReleaseRefused([`No story pack in ${from}`])
  const issues = []
  const cast = await json(join(from, 'cast.json'), issues, from)
  const ties = await json(join(from, 'ties.json'), issues, from)
  if (cast === undefined && !issues.some((i) => i.startsWith('cast.json'))) issues.push('cast.json is missing')
  if (ties === undefined && !issues.some((i) => i.startsWith('ties.json'))) issues.push('ties.json is missing')
  const files = {
    cast, ties,
    umas: await folder(join(from, 'umas'), issues, from),
    routes: await folder(join(from, 'routes'), issues, from),
    pairs: await folder(join(from, 'pairs'), issues, from),
  }
  const household = await json(join(from, 'household.json'), issues, from)
  if (household !== undefined) files.household = household
  return { files, issues }
}

/** Every issue that refuses a release: the validator's, then each cast Uma's missing bible or arrival scene. */
export function releaseIssues(files, { bibles = true } = {}) {
  const issues = []
  try { storyPackFrom(files) } catch (e) { if (e instanceof StoryPackError) issues.push(...e.issues); else throw e }
  const cast = isObject(files.cast) && Array.isArray(files.cast.umas) ? files.cast.umas.filter((u) => isObject(u) && typeof u.characterId === 'string') : []
  for (const { characterId: id } of cast) {
    if (bibles && files.umas[id] === undefined) issues.push(`umas/${id}.json: her bible is missing`)
    const route = files.routes[id]
    if (!isObject(route) || !Array.isArray(route.events) || !route.events.some((e) => isObject(e) && e.id === 'arrival')) issues.push(`routes/${id}.json: her arrival scene is missing`)
  }
  return issues
}

const byId = (a, b) => (Number(a) - Number(b)) || a.localeCompare(b)

/** The release's files, minified, in name order: [name, bytes]. */
function releaseFiles(files) {
  const out = [[storyFileName.cast, files.cast], [storyFileName.ties, files.ties]]
  if (files.household !== undefined) out.push([storyFileName.household, files.household])
  for (const id of Object.keys(files.umas).sort(byId)) out.push([storyFileName.uma(id), files.umas[id]])
  for (const id of Object.keys(files.routes).sort(byId)) out.push([storyFileName.route(id), files.routes[id]])
  for (const name of Object.keys(files.pairs).sort()) out.push([storyFileName.pair(name), files.pairs[name]])
  return out.map(([name, value]) => [name, Buffer.from(JSON.stringify(value), 'utf8')]).sort(([a], [b]) => a.localeCompare(b))
}

/**
 * Builds the release of the pack in `from` into `out`: the hash-named files under `story/`, swapped in whole, then
 * `story.json`. Checks its own output as the game reads it (the index, then every route and pair). Returns the index
 * and a summary in ids and counts. Throws `ReleaseRefused` and writes nothing when the pack isn't releasable.
 */
export async function buildRelease({ from = SOURCE, out = OUT, builtAt = new Date().toISOString(), bibles = true } = {}) {
  const { files, issues } = await readPack(from)
  if (issues.length === 0) issues.push(...releaseIssues(files, { bibles }))
  if (issues.length > 0) throw new ReleaseRefused(issues)

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

  // The game's reader takes it: the index, the files at boot, every route and pair.
  const bytesOf = new Map(written)
  const pack = await releasedStoryPack(parseStoryIndex(index), async (name, file) => {
    const bytes = bytesOf.get(name)
    if (!bytes || sha256(bytes) !== file.sha256) throw new Error(`${name}: not the bytes the index lists`)
    return JSON.parse(bytes.toString('utf8'))
  })
  for (const id of Object.keys(index.scripted)) await pack.route(id)
  for (const name of Object.keys(index.pairs)) await pack.pair(...name.split('-'))

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
  }
  return { index, summary }
}

async function main() {
  const args = process.argv.slice(2)
  const option = (flag) => { const i = args.indexOf(flag); return i >= 0 ? resolve(args[i + 1] ?? '') : undefined }
  const standIn = args.includes('--stand-in')
  const from = option('--from') ?? process.env.STORY_FROM ?? (standIn ? STAND_IN : SOURCE)
  const out = option('--out') ?? process.env.STORY_OUT ?? OUT
  const builtAt = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString() : undefined
  const { summary: s } = await buildRelease({ from, out, bibles: !standIn, ...(builtAt ? { builtAt } : {}) })
  console.log(`Story release ${s.release}${standIn ? ' (the stand-in)' : ''}: ${s.files} files, ${(s.bytes / 1024).toFixed(1)} KB → ${out.startsWith(ROOT) ? relative(ROOT, out) : out}`)
  console.log(`  ${s.cast} Umas, ${s.bibles} bibles; ${s.routes} routes scripting ${s.events} events (bibles hold ${s.beats} beats); ${s.pairs} pairs; household ${s.household ? 'yes' : 'not yet'}`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e instanceof ReleaseRefused ? e.message : e); process.exit(1) })
}
