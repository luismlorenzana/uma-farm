#!/usr/bin/env node
// `pnpm story:scaffold`: lays out every piece of story the game reads for each Uma named (a complete Uma,
// `story/complete.ts`), filled from the default story rendered for her and marked `"draft": "default"`, so the story
// session sees each one whole, rewrites what it wants (removing the marker), and ships complete packs.
//
// - **Only what's missing:** a piece that's there, hers or marked, read or not, is never touched, and a second run writes
//   nothing. A file it can't read as its shape (not JSON, not an object) is never written.
// - **Rendered for her:** her name from master data (a sister's from her cast entry), her favourite good and her line's
//   work as the game fills them, her temperament from her bible's own `temperament`, else her outfit's (master data's),
//   else steady; `{farmer}` stays the placeholder.
// - **Her schedule:** with none, the game's own default schedule (the town's `scheduleOf`) as her routine, marked: her
//   favourite spot (`spot`; else the six in turn by her place in the cast) on every third day of each season, from day 1,
//   2 or 3 by her place in the cast. No home and no job, so she plays exactly where she did.
// - **Backed up first:** every file it changes is copied to the ignored content/story-backups/<time>/ before it writes.
//
//   pnpm story:scaffold --tier 1 [--dry-run]        the Ranker's Tier 1 (../uma-platform's plan), in the board's order
//   pnpm story:scaffold --ids 9000001,9000002 [--dry-run]
//   --from <dir>                                     the pack (else STORY_DIR, else content/story)
//
// STORY_RANKER_PLAN, STORY_MASTER_DIR and STORY_PLATFORM_DIR say where the plan and master data are (`umas.mjs`). Needs
// Node with type stripping (22.18 or later), as the release does.
import { existsSync } from 'node:fs'
import { copyFile, mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readPack } from './release.mjs'
import { chosenIds, herName, herTemperament, masterDir, packDir, readMaster, StoryToolRefused } from './umas.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const { PARTS, pieceWords, scaffoldPack } = await import(pathToFileURL(join(ROOT, 'packages/domain/src/story/complete.ts')).href)
const USAGE = 'pnpm story:scaffold (--tier <n> | --ids <id,…>) [--dry-run] [--from <dir>]'
/** A file the scaffold can't read stands in as this, so the domain refuses it and nothing is written over it. */
const UNREADABLE = 'unreadable'

/** The command line, read. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== '--')
  const options = { dryRun: false }
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--dry-run') { options.dryRun = true; continue }
    if (!['--tier', '--ids', '--from'].includes(flag)) throw new StoryToolRefused(`Unknown: ${flag}. Usage: ${USAGE}`)
    const value = args[++i]
    if (value === undefined) throw new StoryToolRefused(`${flag} needs a value. Usage: ${USAGE}`)
    options[flag.slice(2)] = value
  }
  if (options.tier === undefined && options.ids === undefined) throw new StoryToolRefused(`Name the Umas: --tier <n> or --ids <id,…>. Usage: ${USAGE}`)
  return options
}

/** A pack file's text as the scaffold writes it: two-space JSON and a newline, as the pack's files are. */
const text = (value) => `${JSON.stringify(value, null, 2)}\n`
/** A time that names a folder on any system: 2026-11-14T09-30-00Z. */
const stampOf = (now) => now.toISOString().replace(/\.\d+Z$/, 'Z').replaceAll(':', '-')

/**
 * Scaffolds the pack in `from` for the Umas named (`--tier n` or `--ids`): every missing piece, marked. With `dryRun`,
 * lists what it would write and writes nothing. Returns per Uma what it wrote (or would), what it couldn't, the files it
 * changed and where it backed them up. Throws `StoryToolRefused` before writing anything when it can't name the Umas, or
 * has no master data to name them by (a dry run lists them unnamed).
 */
export async function scaffold({ from, tier, ids, dryRun = false, env = process.env, now = new Date(), log = console.log } = {}) {
  const dir = packDir(from, env)
  if (!existsSync(dir)) throw new StoryToolRefused(`No story pack in ${dir}`)
  const chosen = await chosenIds({ ids, tier }, env)
  if (!chosen) throw new StoryToolRefused(`Name the Umas: --tier <n> or --ids <id,…>. Usage: ${USAGE}`)
  const master = await readMaster(masterDir(env))
  if (!master && !dryRun) throw new StoryToolRefused(`No master data at ${masterDir(env)}, so her name can't be filled in. Set STORY_MASTER_DIR (or STORY_PLATFORM_DIR)`)

  const { files, errors } = await readPack(dir)
  // What's there but doesn't read as JSON is never written over: it stands in as a value the domain refuses.
  if (existsSync(join(dir, 'cast.json')) && files.cast === undefined) files.cast = UNREADABLE
  for (const id of chosen.ids) {
    if (existsSync(join(dir, 'umas', `${id}.json`)) && files.umas[id] === undefined) files.umas[id] = UNREADABLE
    if (existsSync(join(dir, 'routes', `${id}.json`)) && files.routes[id] === undefined) files.routes[id] = UNREADABLE
  }
  const hers = chosen.ids.map((id) => ({ id, name: herName(master, files.cast, id), temperament: herTemperament(master, files.cast, id) }))
  const unnamed = hers.filter((h) => h.name === null).map((h) => h.id)
  if (unnamed.length > 0 && !dryRun) throw new StoryToolRefused(`Master data at ${master.dir} has no name for ${unnamed.join(', ')}. Name only Umas master data holds (a sister needs her elder there)`)
  const result = scaffoldPack(files, hers, master?.cast)

  // The files it changes, as written.
  const changes = [
    ...(result.cast ? [['cast.json', result.cast]] : []),
    ...Object.entries(result.umas).map(([id, v]) => [join('umas', `${id}.json`), v]),
    ...Object.entries(result.routes).map(([id, v]) => [join('routes', `${id}.json`), v]),
  ]
  const shown = dir.startsWith(ROOT) ? relative(ROOT, dir) : dir
  log(`Scaffolding ${chosen.from} (${chosen.ids.length} Uma${chosen.ids.length === 1 ? '' : 's'}) in ${shown}${dryRun ? ' (a dry run: nothing is written)' : ''}`)
  if (!master) log(`  No master data at ${masterDir(env)}: names unknown, so this dry run lists ids only`)
  if (errors.length > 0) log(`  Files the game can't read, never written over:\n${errors.map((e) => `    - ${e}`).join('\n')}`)
  let pieces = 0
  for (const her of hers) {
    const wrote = result.wrote[her.id] ?? []
    pieces += wrote.length
    const byPart = PARTS.map((part) => wrote.filter((w) => w.part === part).map((w) => w.piece))
    log(`\n${her.id}${her.name ? ` ${her.name}` : ''}: ${wrote.length === 0 ? 'nothing missing' : `${dryRun ? 'would write' : 'wrote'} ${wrote.length} piece${wrote.length === 1 ? '' : 's'} (cast ${byPart[0].length}, bible ${byPart[1].length}, route ${byPart[2].length})`}`)
    PARTS.forEach((part, i) => { if (byPart[i].length > 0) log(`  ${part}: ${pieceWords(byPart[i])}`) })
    for (const r of result.refused[her.id] ?? []) log(`  not written: ${r}`)
  }
  if (changes.length === 0 || dryRun) {
    log(`\n${pieces === 0 ? `Nothing missing: nothing ${dryRun ? 'to write' : 'written'}` : `${pieces} piece${pieces === 1 ? '' : 's'} in ${changes.length} file${changes.length === 1 ? '' : 's'} would be written`}`)
    return { wrote: result.wrote, refused: result.refused, files: changes.map(([path]) => path), backup: null, dryRun }
  }

  // Back up every file it changes, then write each whole (a part file, renamed in).
  const backup = join(dirname(dir), 'story-backups', stampOf(now))
  for (const [path] of changes) {
    if (!existsSync(join(dir, path))) continue
    await mkdir(dirname(join(backup, path)), { recursive: true })
    await copyFile(join(dir, path), join(backup, path))
  }
  for (const [path, value] of changes) {
    await mkdir(dirname(join(dir, path)), { recursive: true })
    await writeFile(join(dir, `${path}.part`), text(value))
    await rename(join(dir, `${path}.part`), join(dir, path))
  }
  const backedUp = existsSync(backup)
  log(`\nWrote ${pieces} piece${pieces === 1 ? '' : 's'} in ${changes.length} file${changes.length === 1 ? '' : 's'}${backedUp ? `; the files as they were are in ${backup.startsWith(ROOT) ? relative(ROOT, backup) : backup}` : ''}`)
  log('Next: rewrite what you want in her words (remove each piece’s "draft": "default" as you do), check with pnpm story:status, and ship with pnpm story:ship')
  return { wrote: result.wrote, refused: result.refused, files: changes.map(([path]) => path), backup: backedUp ? backup : null, dryRun }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve().then(() => scaffold(parseArgs(process.argv.slice(2)))).catch((e) => {
    console.error(e instanceof StoryToolRefused ? e.message : e)
    process.exit(1)
  })
}
