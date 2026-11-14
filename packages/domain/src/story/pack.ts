// The story pack at runtime: the cast, the ties, the bibles by character id, which events each route scripts, the
// opening's lines and the world (`world.json`: names, history, festivals, places, seasons and Town notes), read by the story's one reader (`authored.ts`) as the game reads it. The pack is open: every part is optional, any number of
// characters is fine, and a part with an error is skipped while the rest plays, so reading a pack never fails. The
// scripts load on demand through `route(id)`, a pair's conversations through `pair(a, b)`, and the pack says which levels
// each pair holds. The household file (household scenes, house lines and the finale) is read with the pack, since the
// night's house lines need it. The tests read the invented stand-in (`stand-in.ts`).
//
// Every read of it goes through `placeholders.ts`: the pack's, or the placeholder. There her outfit, her favourite line
// and its places, her tastes, the opening, her life in town and her chapters are read, never from master data's
// strategy or a goods family; and with no pack at all, master data's first five play on placeholders.
import { isGoodId } from '../goods/ids'
import { pairKey } from '../save/v4'
import {
  ARRIVAL, checkBible, checkCast, checkHousehold, checkOpening, checkPair, checkRoute, checkTies, checkTown, checkWorld, GAME_LOCATIONS, STORY_ID, type Cast, type CastEntry, type Findings,
  type Household, type Opening, type PairConversations, type Read, type Route, type StoryContext, type Ties, type Town, type UmaBible, type World,
} from './authored'
import { isFestivalId } from '../farm/calendar'
import { favouriteOf, type MasterCast } from './placeholders'
import type { StoryRelease } from './release'

/** A pack's files as a release holds them (`cast.json`, `ties.json`, `umas/<id>.json`, `routes/<id>.json`,
 * `pairs/<a>-<b>.json`, its name the two in `pairKey` order, `household.json`, `opening.json` and `town.json`), unchecked.
 * Any may be missing. */
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
  /** `opening.json`; none plays the game's own opening. */
  opening?: unknown
  /** `town.json`; none plays the game's own town, its people from master data. */
  town?: unknown
  /** `world.json`; none plays the game's own words: its names, festivals, places' lines and seasons, and no Town notes. */
  world?: unknown
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
  /** The opening's lines, played once on day 1; null until they're written (the game's own play: `openingOf`). */
  readonly opening: Opening | null
  /** The town's people and spots; none until it's written (the game's own: `townOf`). */
  readonly town?: Town | null
  /** The world: names, history, festivals, places, seasons and Town notes; none until it's written (the game's own words:
   * `placeholders.ts`' lookups). */
  readonly world?: World | null
  /** What master data gives the placeholders (her default outfit, her line from her stats), once the app has read it;
   * none in the tests that leave it out. */
  readonly master?: MasterCast
  /** The release it came from (its number, date and note); none with no pack, or the stand-in. */
  readonly release?: StoryRelease
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

/** The town's people the pack names, by character id. */
export const townPeopleOf = (pack: Partial<Pick<StoryPack, 'town'>>): ReadonlySet<string> => new Set((pack.town?.people ?? []).map((p) => p.characterId))

/** The town map's locations by id: the game's six spots and four shops, and the ones `town.json` adds. */
export const locationIdsOf = (pack: Partial<Pick<StoryPack, 'town'>>): ReadonlySet<string> =>
  new Set([...GAME_LOCATIONS, ...(pack.town?.locations ?? []).map((l) => l.id)])

/** The reader's context a read cast gives: its character ids, the town's people, and which goods exist. */
export const packContext = (pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>, isGood: (id: string) => boolean = isGoodId): StoryContext =>
  ({ umas: new Set(pack.cast.umas.map((u) => u.characterId)), isGood, town: townPeopleOf(pack) })

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
  files: PackFiles & { cast: Cast; ties: Ties; town?: Town; world?: World }
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
  const town = files.town === undefined ? null : take('town.json', checkTown(files.town))
  // The world first: a cast's festival trigger may name one of the story's own festivals.
  const world = files.world === undefined ? null : take('world.json', checkWorld(files.world, { isGood }))
  const festivals = new Set((world?.festivals ?? []).map((e) => e.id).filter((id) => !isFestivalId(id)))
  const cast = take('cast.json', checkCast(files.cast, { isGood, town: townPeopleOf({ town }), festivals, locations: locationIdsOf({ town }), ...(exported ? { exported } : {}) }))
  const ctx = packContext({ cast, town }, isGood)
  const ties = take('ties.json', checkTies(files.ties, ctx))
  const bibles = new Map<string, UmaBible>()
  for (const [id, raw] of Object.entries(files.umas)) {
    if (!STORY_ID.test(id)) { errors.push(`umas/${id}.json: a bible is named by her characterId (or a sister’s s<outfitId>); skipped`); continue }
    const bible = take(`umas/${id}.json`, checkBible(raw, id, ctx))
    if (bible) bibles.set(id, bible)
  }
  const routes = new Map<string, Route>()
  for (const [id, raw] of Object.entries(files.routes)) {
    if (!STORY_ID.test(id)) { errors.push(`routes/${id}.json: a route is named by her characterId (or a sister’s s<outfitId>); skipped`); continue }
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
  const opening = files.opening === undefined ? null : take('opening.json', checkOpening(files.opening, ctx))
  if (files.opening === undefined) notes.push('opening.json: no opening yet, so the game’s own lines play')
  if (files.world === undefined) notes.push('world.json: no world yet, so the game’s own names, festivals, places and seasons play, and there are no Town notes')
  const pack: StoryPack = {
    cast,
    ties,
    bibles,
    scripted: new Map([...routes].map(([id, route]) => [id, new Set(route.events.map((e) => e.id))])),
    route: async (id) => routes.get(id) ?? null,
    pairs: new Map([...pairs].map(([key, pair]) => [key, new Set(pair.levels.map((l) => l.hearts))])),
    pair: async (a, b) => pairs.get(pairKey(a, b)) ?? null,
    household,
    opening,
    town,
    world,
  }
  notes.push(...castNotes(pack))
  return {
    pack,
    files: {
      cast, ties, umas: Object.fromEntries(bibles), routes: Object.fromEntries(routes), pairs: pairFiles, ...(household ? { household } : {}), ...(opening ? { opening } : {}),
      ...(town ? { town } : {}),
      ...(world ? { world } : {}),
    },
    errors,
    notes,
  }
}

/** What the cast's characters don't have yet, and what plays instead: notes, each named by the file that would hold it. */
function castNotes(pack: StoryPack): string[] {
  const notes: string[] = []
  for (const { characterId: id } of pack.cast.umas) {
    if (!pack.bibles.has(id)) notes.push(`umas/${id}.json: no bible yet, so her calling or her stats give her line, she loves her line’s favourite good, and she talks the default story’s lines`)
    const scripted = pack.scripted.get(id)
    if (!scripted) notes.push(`routes/${id}.json: no route yet, so her meeting scene and her events play the default story’s, which pay as written ones do`)
    else if (!scripted.has(ARRIVAL)) notes.push(`routes/${id}.json: no arrival scene, so the default story’s meeting plays`)
    if (favouriteOf(pack, id) === null) notes.push(`cast.json: ${id} has no calling and no bible’s favouriteLine, so her line is the work her stats in master data suit best`)
  }
  return notes
}

/** Reads a pack's files into a `StoryPack`: `readStoryPack`'s pack. Never throws: a part with an error is skipped. */
export function storyPackFrom(files: PackFiles, isGood: (id: string) => boolean = isGoodId): StoryPack {
  return readStoryPack(files, isGood).pack
}

// --- Her place in the cast ----------------------------------------------------------------------------------

/** Her cast entry, or undefined for a character the pack doesn't hold. */
export const castEntry = (pack: Pick<StoryPack, 'cast'>, id: string): CastEntry | undefined => pack.cast.umas.find((u) => u.characterId === id)
/** The cast's character ids, in the cast's order. */
export const castOrder = (pack: Pick<StoryPack, 'cast'>): string[] => pack.cast.umas.map((u) => u.characterId)
