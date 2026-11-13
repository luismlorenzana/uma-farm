// The story pack at runtime: the cast, the ties, the bibles by character id and which events each route scripts, read
// by the story's one reader (`authored.ts`) as the game reads it. The pack is open: every part is optional, any number of
// characters is fine, and a part with an error is skipped while the rest plays, so reading a pack never fails. The
// scripts load on demand through `route(id)`, a pair's conversations through `pair(a, b)`, and the pack says which levels
// each pair holds. The household file (household scenes, house lines and the finale) is read with the pack, since the
// night's house lines need it. The dev server reads the stand-in (`stand-in.ts`) through the web's one loader seam.
//
// Her outfit, her favourite line, its places and her tastes are read here, never from master data's strategy or a goods
// family; so are the menu's welcome list, her trigger to meet and her chapters, with their defaults.
import type { FarmPlaceId } from '../farm/places'
import type { Activity } from '../farm/ranks'
import type { Taste } from '../farm/visitors'
import { isGoodId } from '../goods/ids'
import { pairKey } from '../save/v3'
import {
  ARRIVAL, CHARACTER_ID, DEFAULT_CHAPTERS, DEFAULT_MEET, DEFAULT_WELCOME, checkBible, checkCast, checkHousehold, checkPair, checkRoute, checkTies, type Calling, type Cast,
  type CastEntry, type Findings, type HerChapter, type Household, type PairConversations, type Read, type Route, type StoryContext, type StoryTrigger, type Ties,
  type UmaBible, type Wish,
} from './authored'

/** A pack's files as a release holds them (`cast.json`, `ties.json`, `umas/<id>.json`, `routes/<id>.json` and
 * `pairs/<a>-<b>.json`, its name the two in `pairKey` order), unchecked. Any may be missing. */
export interface PackFiles {
  /** `cast.json`; none plays an empty cast. */
  cast?: unknown
  /** `ties.json`; none plays no ties. */
  ties?: unknown
  umas: Readonly<Record<string, unknown>>
  routes: Readonly<Record<string, unknown>>
  /** By `<a>-<b>`; none in a pack that has no pair written yet. */
  pairs?: Readonly<Record<string, unknown>>
  /** `household.json`; none until it's written. */
  household?: unknown
}

export interface StoryPack {
  /** The cast file: every character in its order, each with what the pack gives of her. */
  readonly cast: Cast
  readonly ties: Ties
  /** Her bible by character id; a character without one falls back to her calling and the game's own. */
  readonly bibles: ReadonlyMap<string, UmaBible>
  /** The event ids each route scripts. */
  readonly scripted: ReadonlyMap<string, ReadonlySet<string>>
  /** Her route's scripted events, loaded on demand; null when none are written. */
  route(id: string): Promise<Route | null>
  /** The bond levels each tie's pair has a conversation at, by `pairKey`: the authored ones. */
  readonly pairs: ReadonlyMap<string, ReadonlySet<number>>
  /** A pair's conversations, loaded on demand; null when none are written. */
  pair(a: string, b: string): Promise<PairConversations | null>
  /** The household: its scenes, house lines and the finale; null until it's written. */
  readonly household: Household | null
}

/** A release the game can't read: an index that isn't one, or a file that isn't what the index says. Never a pack's
 * content, whose errors only skip their parts. */
export class StoryPackError extends Error {
  readonly issues: readonly string[]
  constructor(issues: readonly string[]) {
    super(`The story pack has ${issues.length} issue${issues.length === 1 ? '' : 's'}: ${issues.slice(0, 3).join('; ')}`)
    this.name = 'StoryPackError'
    this.issues = issues
  }
}

/** The reader's context a read cast gives: its character ids, and which goods exist. */
export const packContext = (pack: Pick<StoryPack, 'cast'>, isGood: (id: string) => boolean = isGoodId): StoryContext =>
  ({ umas: new Set(pack.cast.umas.map((u) => u.characterId)), isGood })

/** The pairs the ties name, by `pairKey`: the only pairs whose conversations play. */
export const tiedPairs = (ties: Pick<Ties, 'ties'>): ReadonlySet<string> => new Set(ties.ties.map((t) => pairKey(t.a, t.b)))

/** A pair file, read: the reader's findings, and its name, which is its two ids in numeric order, `<a>-<b>` (an error:
 * the game finds it by that name). A pair the ties don't hold never plays (a note). */
export function checkPairFile(name: string, raw: unknown, tied: ReadonlySet<string>, ctx: StoryContext): Read<PairConversations | null> {
  const read = checkPair(raw, ctx)
  const pair = read.value
  if (!pair) return read
  if (pairKey(pair.a, pair.b) !== `${pair.a}:${pair.b}` || name !== `${pair.a}-${pair.b}`) {
    return { value: null, errors: [...read.errors, 'its name and its a, b are the two ids in numeric order, <a>-<b>; none is read'], notes: read.notes }
  }
  if (!tied.has(pairKey(pair.a, pair.b))) read.notes.push('not a tie’s pair, so its conversations never play')
  return read
}

/** A pack as the game reads it: what plays, its files with every broken part skipped (what a release writes), and what
 * the check found, each named by its file. */
export interface PackRead extends Findings {
  pack: StoryPack
  files: PackFiles & { cast: Cast; ties: Ties }
}

/** Reads a pack's files: every part on its own, a part with an error skipped, the rest kept; never throws. The notes
 * also say, for each character of the cast, what of hers isn't written yet and what plays instead. `exported` is the
 * Studio export's ids, the sandbox's. */
export function readStoryPack(files: PackFiles, isGood: (id: string) => boolean = isGoodId, exported?: ReadonlySet<string>): PackRead {
  const errors: string[] = []
  const notes: string[] = []
  const take = <T>(file: string, read: Read<T>): T => {
    errors.push(...read.errors.map((e) => `${file}: ${e}`))
    notes.push(...read.notes.map((n) => `${file}: ${n}`))
    return read.value
  }
  const cast = take('cast.json', checkCast(files.cast, { isGood, ...(exported ? { exported } : {}) }))
  const ctx = packContext({ cast }, isGood)
  const ties = take('ties.json', checkTies(files.ties, ctx))
  const bibles = new Map<string, UmaBible>()
  for (const [id, raw] of Object.entries(files.umas)) {
    if (!CHARACTER_ID.test(id)) { errors.push(`umas/${id}.json: a bible is named by her characterId; skipped`); continue }
    const bible = take(`umas/${id}.json`, checkBible(raw, id, ctx))
    if (bible) bibles.set(id, bible)
  }
  const routes = new Map<string, Route>()
  for (const [id, raw] of Object.entries(files.routes)) {
    if (!CHARACTER_ID.test(id)) { errors.push(`routes/${id}.json: a route is named by her characterId; skipped`); continue }
    const route = take(`routes/${id}.json`, checkRoute(raw, id, bibles.get(id) ?? null, ctx))
    if (route && route.events.length > 0) routes.set(id, route)
  }
  const tied = tiedPairs(ties)
  const pairs = new Map<string, PairConversations>()
  const pairFiles: Record<string, PairConversations> = {}
  for (const [name, raw] of Object.entries(files.pairs ?? {})) {
    const pair = take(`pairs/${name}.json`, checkPairFile(name, raw, tied, ctx))
    if (pair && pair.levels.length > 0) {
      pairs.set(pairKey(pair.a, pair.b), pair)
      pairFiles[name] = pair
    }
  }
  const household = files.household === undefined ? null : take('household.json', checkHousehold(files.household, ctx))
  const pack: StoryPack = {
    cast,
    ties,
    bibles,
    scripted: new Map([...routes].map(([id, route]) => [id, new Set(route.events.map((e) => e.id))])),
    route: async (id) => routes.get(id) ?? null,
    pairs: new Map([...pairs].map(([key, pair]) => [key, new Set(pair.levels.map((l) => l.hearts))])),
    pair: async (a, b) => pairs.get(pairKey(a, b)) ?? null,
    household,
  }
  notes.push(...castNotes(pack))
  return {
    pack,
    files: { cast, ties, umas: Object.fromEntries(bibles), routes: Object.fromEntries(routes), pairs: pairFiles, ...(household ? { household } : {}) },
    errors,
    notes,
  }
}

/** What the cast's characters don't have yet, and what plays instead: notes, each named by the file that would hold it. */
function castNotes(pack: StoryPack): string[] {
  const notes: string[] = []
  for (const { characterId: id } of pack.cast.umas) {
    if (!pack.bibles.has(id)) notes.push(`umas/${id}.json: no bible yet, so her calling gives her line, her tastes are neutral, and her chats are her temperament’s`)
    const scripted = pack.scripted.get(id)
    if (!scripted) notes.push(`routes/${id}.json: no route yet, so her arrival is the game’s own short scene and her events wait (“Her story is still being written”)`)
    else if (!scripted.has(ARRIVAL)) notes.push(`routes/${id}.json: no arrival scene, so the game’s own short one plays`)
    if (favouriteOf(pack, id) === null) notes.push(`cast.json: ${id} has no favourite line (no calling, no bible’s favouriteLine), so no perk works at her line`)
  }
  const opening = new Set(openingOf(pack))
  if (pack.cast.opening === undefined && !pack.cast.umas.some((u) => u.arrives?.kind === 'opening') && opening.size > 0) {
    notes.push(`cast.json: no opening, so the welcome list comes up the road at the opening (${[...opening].join(', ')})`)
  }
  const never = pack.cast.umas.filter((u) => !opening.has(u.characterId) && u.arrives === undefined).map((u) => u.characterId)
  if (never.length === 1) notes.push(`cast.json: ${never[0]} has no arrival and isn’t in the opening, so she doesn’t come to the farm until meeting her in town lands`)
  if (never.length > 1) notes.push(`cast.json: ${never.join(', ')} have no arrival and aren’t in the opening, so they don’t come to the farm until meeting her in town lands`)
  return notes
}

/** Reads a pack's files into a `StoryPack`: `readStoryPack`'s pack. Never throws: a part with an error is skipped. */
export function storyPackFrom(files: PackFiles, isGood: (id: string) => boolean = isGoodId): StoryPack {
  return readStoryPack(files, isGood).pack
}

/** Her wishes for married life: her bible's, none without one. */
export const wishesOf = (pack: Pick<StoryPack, 'bibles'>, id: string): readonly Wish[] => pack.bibles.get(id)?.wishes ?? []

// --- Her place in the cast ----------------------------------------------------------------------------------

/** Her cast entry, or undefined for a character the pack doesn't hold. */
export const castEntry = (pack: Pick<StoryPack, 'cast'>, id: string): CastEntry | undefined => pack.cast.umas.find((u) => u.characterId === id)
/** The cast's character ids, in the cast's order. */
export const castOrder = (pack: Pick<StoryPack, 'cast'>): string[] => pack.cast.umas.map((u) => u.characterId)

/** The one resolver: the outfit a roster id plays as. On v4 the roster's key is her character id and the
 * cast names her outfit; anything else (a v3 outfit id, no pack, no outfit named) is its own outfit. Faces, busts, names,
 * talents, temperaments and pickers all meet master data through it. */
export const outfitOf = (pack: Pick<StoryPack, 'cast'> | null, id: string): string => (pack ? castEntry(pack, id)?.outfitId : undefined) ?? id

// --- The menu's welcome list, her trigger and her chapters ----------------------------------------------------------

/** The welcome list: who comes to the farm in the first days, in order. The pack's `welcome`, else the first five of the
 * cast, in its order. Meeting her in town acts on it. */
export function welcomeOf(pack: Pick<StoryPack, 'cast'>): string[] {
  const named = pack.cast.welcome ?? []
  return named.length > 0 ? [...named] : castOrder(pack).slice(0, DEFAULT_WELCOME)
}

/** Her trigger to meet: her cast entry's `meet`, else talking with her on three different days. */
export const meetOf = (pack: Pick<StoryPack, 'cast'>, id: string): StoryTrigger => castEntry(pack, id)?.meet ?? DEFAULT_MEET

/** Her chapters: her cast entry's, else the four default ones ("Getting to know her", "Together", "The wedding",
 * "Married life"). Her chapters' screens act on them. */
export function chaptersOf(pack: Pick<StoryPack, 'cast'>, id: string): readonly HerChapter[] {
  const own = castEntry(pack, id)?.chapters ?? []
  return own.length > 0 ? own : DEFAULT_CHAPTERS
}

/** Who comes up the road at the opening, in order: the cast's `opening`, else those whose arrival is the opening, else
 * the welcome list; only characters in the cast. Until meeting her lands, this keeps the opening's hands on the farm. */
export function openingOf(pack: Pick<StoryPack, 'cast'>): string[] {
  const inCast = (id: string) => castEntry(pack, id) !== undefined
  if (pack.cast.opening) return pack.cast.opening.filter(inCast)
  const arriving = pack.cast.umas.filter((u) => u.arrives?.kind === 'opening').map((u) => u.characterId)
  return arriving.length > 0 ? arriving : welcomeOf(pack).filter(inCast)
}

// --- Her favourite line -----------------------------------------------------------------------------

/** Her calling's activity: quarry is mining, at the Quarry. */
export const CALLING_ACTIVITY: Readonly<Record<Calling, Activity>> = { farming: 'farming', foraging: 'foraging', fishing: 'fishing', mining: 'mining', quarry: 'mining' }

/** Her favourite line: her bible's `favouriteLine`, else her calling's (a missing bible: the stand-in's forager and
 * fisher). Null for someone the pack doesn't hold, or gives neither. */
export function favouriteOf(pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): Activity | null {
  const line = pack.bibles.get(id)?.favouriteLine
  if (line) return line
  const calling = castEntry(pack, id)?.calling
  return calling ? CALLING_ACTIVITY[calling] : null
}

/** Her line's places: where her perks work and her events default to. A miner's are the Mine and the
 * Smelter, or the Quarry and the Cutter when her calling is `quarry`. */
export function linePlaces(pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): FarmPlaceId[] {
  switch (favouriteOf(pack, id)) {
    case 'farming': return ['fields']
    case 'foraging': return ['forest', 'sawmill']
    case 'fishing': return ['fishery', 'smokehouse']
    case 'mining': return castEntry(pack, id)?.calling === 'quarry' ? ['quarry', 'cutter'] : ['mine', 'smelter']
    case 'ranch': return ['coop', 'barn']
    case 'cooking': return ['kitchen']
    case 'serving': return ['restaurant']
    case 'forging': return ['forge']
    default: return []
  }
}

// --- Her tastes -------------------------------------------------------------------------------------

/** What she thinks of a good as a gift: her bible's loved, liked and disliked, any number of each; everything else
 * neutral. A proposed good counts once it exists in `goods/ids.ts`; until then that slot is neutral. No bible: neutral.
 * The v4 gifts read it; v3's `giftTaste` stays for the live build. */
export function tasteOf(pack: Pick<StoryPack, 'bibles'>, id: string, good: string, isGood: (id: string) => boolean = isGoodId): Taste {
  const gifts = pack.bibles.get(id)?.gifts
  if (!gifts || !isGood(good)) return 'neutral'
  if (gifts.loved === good) return 'loved'
  if (gifts.liked?.includes(good)) return 'liked'
  if (gifts.disliked?.includes(good)) return 'disliked'
  return 'neutral'
}
