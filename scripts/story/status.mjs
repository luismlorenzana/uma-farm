#!/usr/bin/env node
// `pnpm story:status`: where each Uma's story stands, as the game reads the pack: per Uma, a table of her pieces by part
// (her cast entry, her bible, her route), each hers, the default (`"draft": "default"`) or missing (the default story
// plays it), then what's left of her and the notes on the marker (a marked piece whose words changed). The checklist is
// the domain's (`story/complete.ts`), and so is the reading: a part with an error counts as missing. `story:ship`'s check
// prints the same.
//
//   pnpm story:status                 every Uma with a route
//   pnpm story:status --tier 1        the Ranker's Tier 1, in the board's order
//   pnpm story:status --ids 9000001,9000002
//   pnpm story:status --all           the whole cast
//   --from <dir>                      the pack (else STORY_DIR, else content/story)
//
// Her name, when master data's release is there (STORY_MASTER_DIR, else ../uma-platform/content/release). Needs Node
// with type stripping (22.18 or later), as the release does.
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readPack, releaseCheck } from './release.mjs'
import { chosenIds, herName, masterDir, packDir, readMaster, StoryToolRefused } from './umas.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const { draftNotes, leftWords, PARTS, umaStatus } = await import(pathToFileURL(join(ROOT, 'packages/domain/src/story/complete.ts')).href)
const USAGE = 'pnpm story:status [--tier <n> | --ids <id,…> | --all] [--married-life] [--from <dir>]'

/** The ids the status reads when none are named: every Uma with a route, in the cast's order (then any other route). */
export function withRoute(files) {
  const order = (files.cast?.umas ?? []).map((u) => u.characterId)
  const routes = Object.keys(files.routes ?? {})
  return [...order.filter((id) => routes.includes(id)), ...routes.filter((id) => !order.includes(id))]
}

const pad = (text, width) => (text.length >= width ? text : text + ' '.repeat(width - text.length))
const counts = (c) => `${c.hers} · ${c.default} · ${c.missing}`

/**
 * The status in lines: a row per Uma (hers · default · missing, by part), then what's left of each and the notes on the
 * marker. `files` are the pack as the game reads it (`releaseCheck`'s); `names` her name by id, when known.
 */
export function statusLines(files, ids, names = new Map()) {
  const statuses = ids.map((id) => umaStatus(files, id))
  const width = Math.max(4, ...ids.map((id) => id.length)) + 2
  const nameWidth = Math.max(4, ...ids.map((id) => (names.get(id) ?? '').length)) + 2
  const header = `${pad('Uma', width)}${names.size ? pad('Name', nameWidth) : ''}${PARTS.map((p) => pad(`${p[0].toUpperCase()}${p.slice(1)}`, 16)).join('')}`
  const lines = ['Each part: hers · default · missing (the default story plays what’s missing; "draft": "default" marks the default)', '', header]
  for (const s of statuses) {
    const state = s.complete ? (s.pieces.every((p) => p.state === 'hers') ? 'all hers' : 'complete') : 'missing pieces'
    lines.push(`${pad(s.id, width)}${names.size ? pad(names.get(s.id) ?? '', nameWidth) : ''}${PARTS.map((p) => pad(counts(s.parts[p]), 16)).join('')}${state}`)
  }
  const complete = statuses.filter((s) => s.complete).length
  lines.push('', `${complete} of ${statuses.length} complete (nothing missing); ${statuses.filter((s) => s.pieces.every((p) => p.state === 'hers')).length} all hers`)
  const left = statuses.filter((s) => leftWords(s).length > 0)
  if (left.length > 0) {
    lines.push('', 'What’s left:')
    for (const s of left) lines.push(`  ${s.id}${names.get(s.id) ? ` ${names.get(s.id)}` : ''}`, ...leftWords(s).map((w) => `    ${w}`))
  }
  const notes = ids.flatMap((id) => draftNotes(files, id))
  if (notes.length > 0) lines.push('', `Notes on the marker (${notes.length}), which block nothing:`, ...notes.map((n) => `  - ${n}`))
  return lines
}

/** The command line, read. */
export function parseArgs(argv) {
  const args = argv.filter((a) => a !== '--')
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag === '--all') { options.all = true; continue }
    if (flag === '--married-life') { options.marriedLife = true; continue }
    if (!['--tier', '--ids', '--from'].includes(flag)) throw new StoryToolRefused(`Unknown: ${flag}. Usage: ${USAGE}`)
    const value = args[++i]
    if (value === undefined) throw new StoryToolRefused(`${flag} needs a value. Usage: ${USAGE}`)
    options[flag.slice(2)] = value
  }
  if (options.all && (options.tier !== undefined || options.ids !== undefined)) throw new StoryToolRefused('--all, --tier and --ids each name the Umas: one at a time')
  return options
}

/** The status of the pack in `from` for the Umas named, as lines; with `names` from master data when it's there. */
export async function status({ from, tier, ids, all = false, marriedLife = false, env = process.env, master } = {}) {
  const dir = packDir(from, env)
  const read = await readPack(dir)
  const { files } = releaseCheck(read.files)
  const chosen = await chosenIds({ ids, tier }, env)
  const list = chosen?.ids ?? (all ? (files.cast?.umas ?? []).map((u) => u.characterId) : withRoute(files))
  const data = master === undefined ? await readMaster(masterDir(env)).catch(() => null) : master
  const names = new Map(data ? list.flatMap((id) => { const n = herName(data, files.cast, id); return n ? [[id, n]] : [] }) : [])
  const what = chosen ? chosen.from : all ? 'the whole cast' : 'every Uma with a route'
  const shown = dir.startsWith(ROOT) ? relative(ROOT, dir) : dir
  const lines = [`Story status: ${shown}, ${what} (${list.length} Uma${list.length === 1 ? '' : 's'})`, '', ...statusLines(files, list, names)]
  if (marriedLife) {
    lines.push('', 'Married Life looks (hers · default · missing)')
    for (const id of list) {
      const slots = files.umas[id]?.marriedLife
      const count = (key, total) => {
        const scripts = Object.values(slots?.[key] ?? {}).filter(script => Object.keys(script).length > 0)
        const defaults = scripts.filter(script => script.draft === 'default').length
        return `${scripts.length - defaults} · ${defaults} · ${total - scripts.length}`
      }
      lines.push(`  ${id} ${names.get(id) ?? ''} · Pajamas ${count('pajamas', 10)} · Anniversary ${count('anniversary', 5)}`)
    }
  }
  return lines
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  status(parseArgs(process.argv.slice(2))).then((lines) => console.log(lines.join('\n'))).catch((e) => {
    console.error(e instanceof StoryToolRefused ? e.message : e)
    process.exit(1)
  })
}
