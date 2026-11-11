// The story pack at runtime (F46 decision 6; romance spec RM58, RM59): the cast, the ties, the bibles by character id and
// which events each route scripts, checked by F40's validator as the game reads it (routes may be partial: an unscripted
// beat waits, "Her story is still being written"). The scripts load on demand through `route(id)`. The dark build reads
// the stand-in (`stand-in.ts`) through the web's one loader seam; F56 points that seam at the private pack. Pairs (F52) and
// the household file (F54) join with their packets.
//
// Her outfit, her favourite line, its places and her tastes are read here (RM2, RM6, RM7), never from master data's
// strategy or a goods family.
import type { FarmPlaceId } from '../farm/places'
import type { Activity } from '../farm/ranks'
import type { Taste } from '../farm/visitors'
import { isGoodId } from '../goods/ids'
import { bibleIssues, castIssues, routeIssues, tiesIssues, type Calling, type Cast, type CastEntry, type Route, type StoryContext, type Ties, type UmaBible } from './authored'

/** A pack's files as a release holds them (`cast.json`, `ties.json`, `umas/<id>.json`, `routes/<id>.json`), unchecked. */
export interface PackFiles {
  cast: unknown
  ties: unknown
  umas: Readonly<Record<string, unknown>>
  routes: Readonly<Record<string, unknown>>
}

export interface StoryPack {
  /** The cast file: every Uma in arrival order, each with her outfit (RM2) and her arrival (RM4). */
  readonly cast: Cast
  readonly ties: Ties
  /** Her bible by character id; an Uma without one (the stand-in's 9000002 and 9000003) falls back to her calling. */
  readonly bibles: ReadonlyMap<string, UmaBible>
  /** The event ids each route scripts. */
  readonly scripted: ReadonlyMap<string, ReadonlySet<string>>
  /** Her route's scripted events, loaded on demand; null when none are written. */
  route(id: string): Promise<Route | null>
}

/** A pack the validator refuses: the game never plays a broken pack. */
export class StoryPackError extends Error {
  readonly issues: readonly string[]
  constructor(issues: readonly string[]) {
    super(`The story pack has ${issues.length} issue${issues.length === 1 ? '' : 's'}: ${issues.slice(0, 3).join('; ')}`)
    this.name = 'StoryPackError'
    this.issues = issues
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Reads a pack's files into a `StoryPack`, checked whole: the cast, the ties, each bible, and each route in the partial
 * mode (decision 16). Throws `StoryPackError` with every issue. */
export function storyPackFrom(files: PackFiles, isGood: (id: string) => boolean = isGoodId): StoryPack {
  const castIds = isObject(files.cast) && Array.isArray(files.cast.umas)
    ? files.cast.umas.flatMap((u) => (isObject(u) && typeof u.characterId === 'string' ? [u.characterId] : [])) : []
  const ctx: StoryContext = { umas: new Set(castIds), isGood }
  const issues = [...castIssues(files.cast, ctx), ...tiesIssues(files.ties, ctx)]
  const bibles = new Map<string, UmaBible>()
  for (const [id, bible] of Object.entries(files.umas)) {
    const found = bibleIssues(bible, ctx).map((i) => `umas/${id}: ${i}`)
    if (isObject(bible) && bible.characterId !== id) found.push(`umas/${id}: its characterId is ${String(bible.characterId)}`)
    issues.push(...found)
    if (found.length === 0) bibles.set(id, bible as unknown as UmaBible)
  }
  const routes = new Map<string, Route>()
  for (const [id, route] of Object.entries(files.routes)) {
    const found = routeIssues(route, bibles.get(id) ?? null, ctx, { partial: true }).map((i) => `routes/${id}: ${i}`)
    if (isObject(route) && route.characterId !== id) found.push(`routes/${id}: its characterId is ${String(route.characterId)}`)
    if (!ctx.umas.has(id)) found.push(`routes/${id}: not in the cast`)
    issues.push(...found)
    if (found.length === 0) routes.set(id, route as unknown as Route)
  }
  if (issues.length > 0) throw new StoryPackError(issues)
  return {
    cast: files.cast as Cast,
    ties: files.ties as Ties,
    bibles,
    scripted: new Map([...routes].map(([id, route]) => [id, new Set(route.events.map((e) => e.id))])),
    route: async (id) => routes.get(id) ?? null,
  }
}

// --- Her place in the cast (RM2, RM3) ----------------------------------------------------------------------------------

/** Her cast entry, or undefined for a character the pack doesn't hold. */
export const castEntry = (pack: Pick<StoryPack, 'cast'>, id: string): CastEntry | undefined => pack.cast.umas.find((u) => u.characterId === id)
/** The cast's character ids, in arrival order. */
export const castOrder = (pack: Pick<StoryPack, 'cast'>): string[] => pack.cast.umas.map((u) => u.characterId)

/** The one resolver (decision 5): the outfit a roster id plays as. On v4 the roster's key is her character id and the
 * cast names her outfit; anything else (a v3 outfit id, no pack) is its own outfit. Faces, busts, names, talents,
 * temperaments and pickers all meet master data through it. */
export const outfitOf = (pack: Pick<StoryPack, 'cast'> | null, id: string): string => (pack ? castEntry(pack, id)?.outfitId : undefined) ?? id

// --- Her favourite line (RM6; decision 13) -----------------------------------------------------------------------------

/** Her calling's activity: quarry is mining, at the Quarry. */
export const CALLING_ACTIVITY: Readonly<Record<Calling, Activity>> = { farming: 'farming', foraging: 'foraging', fishing: 'fishing', mining: 'mining', quarry: 'mining' }

/** Her favourite line (RM6): her bible's `favouriteLine`, else her calling's (a missing bible: the stand-in's forager and
 * fisher). Null for someone the pack doesn't hold. */
export function favouriteOf(pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): Activity | null {
  const bible = pack.bibles.get(id)
  if (bible) return bible.favouriteLine
  const entry = castEntry(pack, id)
  return entry ? CALLING_ACTIVITY[entry.calling] : null
}

/** Her line's places (RM6's table): where her perks work (F51) and her events default to. A miner's are the Mine and the
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

// --- Her tastes (RM7; decision 13) -------------------------------------------------------------------------------------

/** What she thinks of a good as a gift (RM7): her bible's one loved, three liked and two disliked; everything else
 * neutral. A proposed good counts once it exists in `goods/ids.ts`; until then that slot is neutral. No bible: neutral.
 * F47's gifts read it; v3's `giftTaste` stays for the live build. */
export function tasteOf(pack: Pick<StoryPack, 'bibles'>, id: string, good: string, isGood: (id: string) => boolean = isGoodId): Taste {
  const gifts = pack.bibles.get(id)?.gifts
  if (!gifts || !isGood(good)) return 'neutral'
  if (gifts.loved === good) return 'loved'
  if (gifts.liked.includes(good)) return 'liked'
  if ((gifts.disliked as readonly string[]).includes(good)) return 'disliked'
  return 'neutral'
}
