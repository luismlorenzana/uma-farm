// The story pack's release: the private pack ships as hash-named files and
// one index, `story.json`, laid out as the bucket is and served by farm-api at `/api/content/…` behind the owner guard.
// `scripts/story/release.mjs` writes them; the web reads the index at boot, then the cast, the ties, the bibles and the
// household, and each route and pair on demand, every file verified by its hash in uma-kit's content cache. The format
// is here, beside `storyPackFrom`, so the release script and the game read one definition. Nothing private is in it.
import { isGoodId } from '../goods/ids'
import { pairKey } from '../save/v3'
import type { PairConversations, Route, UmaBible } from './authored'
import { pairFileIssues, packContext, routeFileIssues, storyPackFrom, StoryPackError, tiedPairs, type StoryPack } from './pack'

/** The index's path in the release, revalidated on every read. */
export const STORY_INDEX = 'story.json'
/** A file's name in the release: lowercase letters and digits in words joined by `-` (`cast`, `uma-<id>`, `pair-<a>-<b>`). */
export const STORY_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** What the farm-api route serves: the index, and hash-named files under `story/`. */
export const STORY_FILE_PATH = /^story\/[a-z0-9]+(-[a-z0-9]+)*\.[a-f0-9]{8}\.json$/

/** Each file's name in the release, by what it holds. */
export const storyFileName = {
  cast: 'cast',
  ties: 'ties',
  household: 'household',
  /** Her bible, `umas/<id>.json`. */
  uma: (id: string): string => `uma-${id}`,
  /** Her scripted events, `routes/<id>.json`. */
  route: (id: string): string => `route-${id}`,
  /** A tie's conversations, `pairs/<a>-<b>.json`, by its name. */
  pair: (name: string): string => `pair-${name}`,
} as const

/** A file's path in the release: `story/<name>.<the first 8 hex of its SHA-256>.json`. */
export const storyFilePath = (name: string, sha256: string): string => `story/${name}.${sha256.slice(0, 8)}.json`

/** A pair's name: its two character ids in numeric order, `<a>-<b>` (`farm/bonds.ts`'s `pairName`, kept light here). */
const pairFile = (a: string, b: string): string => pairKey(a, b).replace(':', '-')

/** A file as the index lists it: uma-kit's envelope (uma-data's `ReleaseFile`), which the content client verifies. */
export interface StoryFile {
  path: string
  bytes: number
  /** Lowercase hex SHA-256 of the file's bytes. */
  sha256: string
}

/** `story.json`: what the release holds, so the game reads the pack without listing the bucket. */
export interface StoryIndex {
  version: 1
  /** The release's id: the first 8 hex of the SHA-256 of its files' names and hashes. The same files, the same id. */
  release: string
  builtAt: string
  /** Every file by its name (`storyFileName`). */
  files: Record<string, StoryFile>
  /** The event ids each route scripts, by character id, so Ready knows what's scripted before a route loads. */
  scripted: Record<string, string[]>
  /** The bond levels each pair's file holds, by its name (`<a>-<b>`), so the morning knows which levels have words. */
  pairs: Record<string, number[]>
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0

/** Reads `story.json`, checked whole: every file hash-named at its path, the cast and the ties there, each route and pair
 * listed both ways. Throws `StoryPackError` with every issue. */
export function parseStoryIndex(value: unknown): StoryIndex {
  if (!isObject(value)) throw new StoryPackError(['story.json: not an index'])
  const issues: string[] = []
  if (value.version !== 1) issues.push('story.json: version is 1')
  if (typeof value.release !== 'string' || !/^[a-f0-9]{8}$/.test(value.release)) issues.push('story.json: release is 8 hex')
  if (!isText(value.builtAt)) issues.push('story.json: no builtAt')
  const files = isObject(value.files) ? value.files : {}
  if (!isObject(value.files)) issues.push('story.json: no files')
  for (const [name, file] of Object.entries(files)) {
    if (!STORY_NAME.test(name)) issues.push(`story.json: ${name} isn't a file name`)
    if (!isObject(file) || typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.bytes) || (file.bytes as number) < 1 ||
      file.path !== storyFilePath(name, file.sha256)) issues.push(`story.json: ${name} is { path: story/${name}.<hash8>.json, bytes, sha256 }`)
  }
  for (const name of [storyFileName.cast, storyFileName.ties]) if (!(name in files)) issues.push(`story.json: no ${name}`)
  const lists = (key: 'scripted' | 'pairs', ok: (v: unknown) => boolean, words: string): Record<string, unknown[]> => {
    const list = value[key]
    if (!isObject(list)) { issues.push(`story.json: no ${key}`); return {} }
    for (const [id, items] of Object.entries(list)) if (!Array.isArray(items) || items.length === 0 || !items.every(ok)) issues.push(`story.json: ${key}.${id} is a list of ${words}`)
    return list as Record<string, unknown[]>
  }
  const scripted = lists('scripted', isText, 'event ids')
  const pairs = lists('pairs', (h) => Number.isInteger(h), 'bond levels')
  for (const id of Object.keys(scripted)) if (!(storyFileName.route(id) in files)) issues.push(`story.json: scripted.${id} has no ${storyFileName.route(id)}`)
  for (const name of Object.keys(pairs)) if (!(storyFileName.pair(name) in files)) issues.push(`story.json: pairs.${name} has no ${storyFileName.pair(name)}`)
  for (const name of Object.keys(files)) {
    if (name.startsWith('route-') && !(name.slice(6) in scripted)) issues.push(`story.json: ${name} isn't in scripted`)
    if (name.startsWith('pair-') && !(name.slice(5) in pairs)) issues.push(`story.json: ${name} isn't in pairs`)
  }
  if (issues.length > 0) throw new StoryPackError(issues)
  return value as unknown as StoryIndex
}

/** Reads a file of the release by its name, as JSON: the web verifies its bytes against the index first. */
export type ReadStoryFile = (name: string, file: StoryFile) => Promise<unknown>

const sameList = (a: readonly (string | number)[], b: readonly (string | number)[]): boolean => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())

/**
 * The pack a release holds: its cast, ties, bibles and household read at once and checked whole as
 * `storyPackFrom` checks them; its routes and pairs listed by the index and read on demand, each checked as it loads
 * (the partial mode) and refused when it doesn't hold what the index says. A file that fails to load or check rejects
 * that call and is read again next time. Throws `StoryPackError` with every issue.
 */
export async function releasedStoryPack(index: StoryIndex, read: ReadStoryFile, isGood: (id: string) => boolean = isGoodId): Promise<StoryPack> {
  const file = (name: string) => read(name, index.files[name]!)
  const umaIds = Object.keys(index.files).filter((n) => n.startsWith('uma-')).map((n) => n.slice(4))
  const [cast, ties, household, ...bibles] = await Promise.all([
    file(storyFileName.cast), file(storyFileName.ties),
    storyFileName.household in index.files ? file(storyFileName.household) : Promise.resolve(undefined),
    ...umaIds.map((id) => file(storyFileName.uma(id))),
  ])
  const base = storyPackFrom({ cast, ties, umas: Object.fromEntries(umaIds.map((id, i) => [id, bibles[i]])), routes: {}, household }, isGood)
  const ctx = packContext(cast, isGood)
  const tied = tiedPairs(ties)
  const issues: string[] = []
  for (const id of Object.keys(index.scripted)) if (!ctx.umas.has(id)) issues.push(`story.json: scripted.${id} isn't in the cast`)
  for (const name of Object.keys(index.pairs)) {
    const [a = '', b = ''] = name.split('-')
    if (pairFile(a, b) !== name || !tied.has(pairKey(a, b))) issues.push(`story.json: pairs.${name} isn't a tie's pair, <a>-<b> in numeric order`)
  }
  if (issues.length > 0) throw new StoryPackError(issues)

  const routes = new Map<string, Promise<Route>>()
  const route = (id: string): Promise<Route | null> => {
    const events = index.scripted[id]
    if (!events) return Promise.resolve(null)
    let loading = routes.get(id)
    if (!loading) {
      loading = file(storyFileName.route(id)).then((value) => {
        const found = routeFileIssues(id, value, base.bibles.get(id) ?? null, ctx)
        if (found.length === 0 && !sameList((value as Route).events.map((e) => e.id), events)) found.push(`routes/${id}: its events aren't the index's`)
        if (found.length > 0) throw new StoryPackError(found)
        return value as Route
      })
      routes.set(id, loading)
      loading.catch(() => routes.delete(id))
    }
    return loading
  }
  const pairs = new Map<string, Promise<PairConversations>>()
  const pair = (a: string, b: string): Promise<PairConversations | null> => {
    const name = pairFile(a, b)
    const levels = index.pairs[name]
    if (!levels) return Promise.resolve(null)
    let loading = pairs.get(name)
    if (!loading) {
      loading = file(storyFileName.pair(name)).then((value) => {
        const found = pairFileIssues(name, value, tied, ctx)
        if (found.length === 0 && !sameList((value as PairConversations).levels.map((l) => l.hearts), levels)) found.push(`pairs/${name}: its levels aren't the index's`)
        if (found.length > 0) throw new StoryPackError(found)
        return value as PairConversations
      })
      pairs.set(name, loading)
      loading.catch(() => pairs.delete(name))
    }
    return loading
  }
  return {
    cast: base.cast,
    ties: base.ties,
    bibles: base.bibles as ReadonlyMap<string, UmaBible>,
    scripted: new Map(Object.entries(index.scripted).map(([id, events]) => [id, new Set(events)])),
    route,
    pairs: new Map(Object.entries(index.pairs).map(([name, levels]) => [name.replace('-', ':'), new Set(levels)])),
    pair,
    household: base.household,
  }
}
