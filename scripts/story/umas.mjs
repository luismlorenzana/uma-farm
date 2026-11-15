// Which Umas the story tools work on, and what master data says of each: shared by `story:scaffold` and `story:status`.
// - **Tier n** is the Uma Ranker's row Tn, read from the private plan in the sibling uma-platform checkout
//   (`content/authoring/ranker/plan.json`: the `umas` board's `order`, each entry's `tier` and `characterId`, a sister's
//   `s<outfitId>`), in the board's order. No name or id of it is in git.
// - **Her name and temperament** come from master data at run time: the local release the API reads
//   (`../uma-platform/content/release`), its characters' names and her outfit's stats (`farm/talents.ts`' rule).
//
// STORY_DIR (or STORY_FROM, or --from) is the pack; STORY_PLATFORM_DIR the uma-platform checkout; STORY_RANKER_PLAN the
// plan; STORY_MASTER_DIR master data's release.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SOURCE } from './release.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DOMAIN = join(ROOT, 'packages/domain/src')
// The game's own rules, read in place (release.mjs registered the TypeScript hook).
const { masterCastFrom, sisterNameOf } = await import(pathToFileURL(join(DOMAIN, 'story/placeholders.ts')).href)
const { talentsOf } = await import(pathToFileURL(join(DOMAIN, 'farm/talents.ts')).href)
const { STORY_ID } = await import(pathToFileURL(join(DOMAIN, 'story/authored.ts')).href)

/** A request the story tools refuse, with its reason: nothing is written. */
export class StoryToolRefused extends Error {
  constructor(message) {
    super(message)
    this.name = 'StoryToolRefused'
  }
}

/** The sibling uma-platform checkout. */
export const platformDir = (env = process.env) => (env.STORY_PLATFORM_DIR ? resolve(env.STORY_PLATFORM_DIR) : resolve(ROOT, '..', 'uma-platform'))
/** The Ranker's private plan. */
export const planPath = (env = process.env) => (env.STORY_RANKER_PLAN ? resolve(env.STORY_RANKER_PLAN) : join(platformDir(env), 'content/authoring/ranker/plan.json'))
/** Master data's local release. */
export const masterDir = (env = process.env) => (env.STORY_MASTER_DIR ? resolve(env.STORY_MASTER_DIR) : join(platformDir(env), 'content/release'))
/** The pack: `--from`, else STORY_DIR, else STORY_FROM, else content/story. */
export const packDir = (from, env = process.env) => (from ? resolve(from) : env.STORY_DIR ? resolve(env.STORY_DIR) : env.STORY_FROM ? resolve(env.STORY_FROM) : SOURCE)

/** `--ids 9000001,9000002`: the ids, each a character's or a sister's, once, in the order given. */
export function parseIds(text) {
  const ids = [...new Set(String(text ?? '').split(/[\s,]+/).filter(Boolean))]
  const bad = ids.filter((id) => !STORY_ID.test(id))
  if (ids.length === 0 || bad.length > 0) throw new StoryToolRefused(`--ids is a list of character ids (or a sister's s<outfitId>), comma-separated${bad.length ? `: ${bad.join(', ')} isn't one` : ''}`)
  return ids
}

/** The Umas of Tier n on the Ranker's `umas` board, in its order: a character's id, a sister's `s<outfitId>`. */
export async function tierIds(n, path = planPath()) {
  if (!/^[1-9]\d*$/.test(String(n))) throw new StoryToolRefused(`--tier is a tier's number (1 for T1), not "${n}"`)
  if (!existsSync(path)) {
    throw new StoryToolRefused(`No Ranker plan at ${path}, so Tier ${n} can't be read. Set STORY_RANKER_PLAN (or STORY_PLATFORM_DIR), or name the Umas: --ids <id,…>`)
  }
  let plan
  try { plan = JSON.parse(await readFile(path, 'utf8')) } catch (e) { throw new StoryToolRefused(`The Ranker plan at ${path} isn't JSON (${e.message}). Name the Umas instead: --ids <id,…>`) }
  const board = Array.isArray(plan?.boards) ? plan.boards.find((b) => b?.id === 'umas') : undefined
  if (!Array.isArray(board?.order)) throw new StoryToolRefused(`The Ranker plan at ${path} has no umas board with an order. Name the Umas instead: --ids <id,…>`)
  const ids = board.order.filter((o) => o?.tier === `T${n}`).map((o) => (o.sister ? `s${o.outfitId}` : String(o.characterId)))
  if (ids.length === 0) throw new StoryToolRefused(`Tier ${n} is empty on the Ranker's umas board (${path}). Name the Umas instead: --ids <id,…>`)
  const bad = ids.filter((id) => !STORY_ID.test(id))
  if (bad.length > 0) throw new StoryToolRefused(`Tier ${n} on the Ranker's board names ${bad.join(', ')}, which isn't a character's id or a sister's`)
  return [...new Set(ids)]
}

/** The Umas a command names: `--ids`, or `--tier n`, else none. */
export async function chosenIds({ ids, tier }, env = process.env) {
  if (ids !== undefined && tier !== undefined) throw new StoryToolRefused('Name the Umas by --tier or by --ids, not both')
  if (ids !== undefined) return { ids: parseIds(ids), from: '--ids' }
  if (tier !== undefined) return { ids: await tierIds(tier, planPath(env)), from: `Tier ${tier}` }
  return null
}

/** Master data from its local release (`manifest.json`'s characters and outfits), as the story tools read it: names by
 * character id, her line and default outfit for the placeholders (`masterCastFrom`), and each outfit's stats. Null when
 * there's no release there. */
export async function readMaster(dir = masterDir()) {
  const manifestFile = join(dir, 'manifest.json')
  if (!existsSync(manifestFile)) return null
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
  const set = async (name) => {
    const path = manifest?.sets?.[name]
    if (typeof path !== 'string') throw new StoryToolRefused(`Master data at ${dir} lists no ${name} set`)
    const value = JSON.parse(await readFile(join(dir, path), 'utf8'))
    return Array.isArray(value?.items) ? value.items : []
  }
  const [characters, outfits] = await Promise.all([set('characters'), set('outfits')])
  const names = new Map(characters.flatMap((c) => {
    const name = c?.name?.global ?? c?.name?.en ?? c?.name?.ja ?? ''
    return name ? [[String(c.id), name]] : []
  }))
  const read = outfits.flatMap((o) => (o?.stats?.star5 && o?.growthRatePercents
    ? [{ id: String(o.id), characterId: String(o.characterId), variant: o.variant ?? null, stats: o.stats, growthRatePercents: o.growthRatePercents }] : []))
  return { dir, names, cast: masterCastFrom(read), stats: new Map(read.map((o) => [o.id, o])) }
}

/** Her cast entry in a cast file, as written. */
const entryOf = (cast, id) => (Array.isArray(cast?.umas) ? cast.umas.find((u) => u?.characterId === id) : undefined)
/** The outfit she plays as: a sister's own, the cast's, else master data's default for her. */
const outfitFor = (master, cast, id) => (id.startsWith('s') ? id.slice(1) : entryOf(cast, id)?.outfitId ?? master?.cast.outfits.get(id) ?? null)

/** Her name as the screen knows it: master data's; a sister's her cast entry's, else her elder's, as her sister. */
export function herName(master, cast, id) {
  if (!id.startsWith('s')) return master?.names.get(id) ?? null
  const elder = master?.stats.get(id.slice(1))?.characterId
  return sisterNameOf({ cast: { umas: Array.isArray(cast?.umas) ? cast.umas : [] } }, id, elder ? master.names.get(elder) ?? null : null)
}

/** Her temperament as the game plays it: her outfit's stats' (`talentsOf`); null without them. */
export function herTemperament(master, cast, id) {
  const outfit = outfitFor(master, cast, id)
  const stats = outfit ? master?.stats.get(String(outfit)) : undefined
  try { return stats ? talentsOf(stats).temperament : null } catch { return null }
}
