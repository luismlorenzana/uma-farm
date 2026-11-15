// The town map: the six spots, the shops and offices, and the homes and workplaces the story adds. Every character of
// master data's lives in town, once each, with the pack's sisters, less the town's people, who are at their posts. Going
// into town takes an action (`farm/actions.ts`); moving between its locations is free. A location lists who's there now.
// Pure.
//
//   her story       her routine's first stop that holds today (its days of the season and its seasons), else her
//                   part-time job on its days, else her home: she's there, whatever the draw says
//   the draw        everyone else in town: in the order of draw(uid, day, 'town:<id>', 0), lowest first, up to four at each
//                   of the six spots, the rest at home; her favourite spot while it has room when draw(…, 1) < 0.6, else
//                   one with room by draw(…, 2)
//   on the farm     an Uma living on the farm is at the farm, never in town; in the draw she keeps her place, unseen, so
//                   the day's town never shifts when someone moves in. One you've met who lives in town is out like anyone
//   the posts       each of the town's people is at her post: the spot town.json has her keep, else the shop or office of
//                   her role, else the spot the game has her keep
//
// The same day always shows the same town, and tomorrow a different few.
import { dateOf } from '../farm/calendar'
import { draw } from '../farm/draw'
import { atHome, type SaveV4, type TownTalks } from '../save/v4'
import { GAME_LOCATIONS, SHOP_IDS, SPOT_IDS, type LifeWhen, type LocationKind, type ShopId, type SpotId } from '../story/authored'
import type { CastId } from '../story/cast'
import type { StoryPack } from '../story/pack'
import { favouriteSpotOf, herHomeOf, herJobOf, herRoutineOf, storyLocationsOf, townLinesOf, townOf } from '../story/placeholders'

/** How many the draw puts at a spot at once. Those the story places there stand besides them. */
export const SPOT_ROOM = 4
/** How often she's at her favourite spot when the draw puts her out (while it has room); else at any with room. */
export const FAVOURITE_SPOT = 0.6

/** The town's shops and offices: each one's name, line, the role that keeps it, and what it offers. */
export interface TownShop {
  readonly id: ShopId
  readonly name: string
  readonly line: string
  readonly keeper: CastId
}
export const SHOPS: Readonly<Record<ShopId, TownShop>> = {
  store: { id: 'store', name: 'The General Store', line: 'Seeds for the season, and the town’s bakery.', keeper: 'marta-quill' },
  rancher: { id: 'rancher', name: 'The Rancher’s', line: 'Animals and feed, out by the paddock.', keeper: 'dale-hart' },
  mayor: { id: 'mayor', name: 'The Mayor’s Office', line: 'Permits, plans and the town’s ledger.', keeper: 'hollis-pryor' },
  smith: { id: 'smith', name: 'The Smithy', line: 'An anvil, a forge and a bench for fine work.', keeper: 'ida-stone' },
}

/** A location's kind on the map: one of the six spots, a shop or office, or one the story adds (a home, a workplace, a
 * spot of its own). */
export type LocationGroup = 'spot' | 'shop' | LocationKind

/** One location of the town map as the game plays it. */
export interface TownLocationPlayed {
  readonly id: string
  readonly group: LocationGroup
  readonly name: string
  readonly line: string
  /** One of the town's people at her post here, by character id; null when no one keeps it, or she's at her shop. */
  readonly keeper: string | null
}

type TownPack = Pick<StoryPack, 'cast' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'master'>>

/** The town map's locations, in the map's order: the six spots (their names, lines and keepers the pack's, else the
 * game's), the four shops and offices, then the story's homes, workplaces and spots in `town.json`'s order. Each of the
 * town's people is at one post: the spot `town.json` has her keep, else her role's shop or office, else the spot the game
 * has her keep; a location whose keeper is posted elsewhere shows none. */
export function townLocations(pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>): TownLocationPlayed[] {
  const town = townOf(pack)
  const posted = new Set<string>()
  const post = (id: string | null | undefined): string | null => {
    if (!id || posted.has(id)) return null
    posted.add(id)
    return id
  }
  const written = new Set((pack.town?.spots ?? []).filter((s) => s.keeper !== undefined).map((s) => s.id))
  const storyKeeper = new Map(town.spots.filter((s) => written.has(s.id)).map((s) => [s.id, post(s.keeper)]))
  const shopKeeper = new Map(SHOP_IDS.map((id) => [id, post(town.byRole.get(SHOPS[id].keeper))]))
  const spots = town.spots.map((s): TownLocationPlayed => ({
    id: s.id, group: 'spot', name: s.name, line: s.blurb, keeper: written.has(s.id) ? storyKeeper.get(s.id) ?? null : post(s.keeper),
  }))
  const shops = SHOP_IDS.map((id): TownLocationPlayed => ({ id, group: 'shop', name: SHOPS[id].name, line: SHOPS[id].line, keeper: shopKeeper.get(id) ?? null }))
  const story = storyLocationsOf(pack).map((l): TownLocationPlayed => ({ id: l.id, group: l.kind ?? 'spot', name: l.name, line: l.line ?? '', keeper: null }))
  return [...spots, ...shops, ...story]
}

/** One of the town map's locations by id, or undefined. */
export const townLocation = (pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>, id: string): TownLocationPlayed | undefined =>
  townLocations(pack).find((l) => l.id === id)

/** Whether an id is one of the game's own locations: the six spots and the four shops. */
export const isGameLocation = (id: string): boolean => GAME_LOCATIONS.includes(id)

/** Everyone who lives in town: the cast, in its order (the owner's Umas, sisters included), less the town's people, who
 * are at their posts. Nobody else from master data is in the game. The Umas on the farm are among them; they're at the
 * farm. */
export function townsfolk(pack: TownPack): string[] {
  const people = townOf(pack).byId
  return [...new Set(pack.cast.umas.map((u) => u.characterId))].filter((id) => !people.has(id))
}

/** Whether a place in her life holds on a day: its days of the season and its seasons, each every one when left out. */
export function lifeHolds(when: LifeWhen, day: number): boolean {
  const date = dateOf(day)
  return (when.days === undefined || when.days.includes(date.day)) && (when.seasons === undefined || when.seasons.includes(date.season))
}

/** Why she's where she is today: her routine, her job, her home (the story's), or the draw. */
export type HereBy = 'routine' | 'job' | 'home' | 'draw'

/** Where her story puts her today, and why: her routine's first stop that holds, else her job on its days, else her home;
 * null when the story says nothing for today (the draw places her). A location the map doesn't hold is passed over. */
export function storyPlaceOf(pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town'>>, id: string, day: number, known: ReadonlySet<string>): { at: string; by: Exclude<HereBy, 'draw'> } | null {
  const stop = herRoutineOf(pack, id).find((s) => known.has(s.at) && lifeHolds(s, day))
  if (stop) return { at: stop.at, by: 'routine' }
  const job = herJobOf(pack, id)
  if (job && known.has(job.at) && lifeHolds(job, day)) return { at: job.at, by: 'job' }
  const home = herHomeOf(pack, id)
  return home && known.has(home) ? { at: home, by: 'home' } : null
}

/** One day in town: who's at each location, and where each one out is. */
export interface TownDay {
  readonly day: number
  /** Each location's few, by id: the story's first (in the town's order), then the draw's, in the order they came. */
  readonly at: ReadonlyMap<string, readonly string[]>
  /** Where she is today, for everyone in town. */
  readonly where: ReadonlyMap<string, string>
  /** Why she's there. */
  readonly by: ReadonlyMap<string, HereBy>
}

/** The town on the save's day: the story places those it says something of for today; the seeded draw places everyone
 * else at the six spots, up to four at each, the rest at home. An Uma living on the farm is at the farm, keeping her place
 * in the draw unseen, so the same day always shows the same town, whoever moves in. */
export function townDay(save: Pick<SaveV4, 'account' | 'calendar' | 'roster' | 'dorm' | 'love'>, pack: TownPack): TownDay {
  const uid = save.account.uid
  const day = save.calendar.day
  const locations = townLocations(pack)
  const known = new Set(locations.map((l) => l.id))
  const at = new Map<string, string[]>(locations.map((l) => [l.id, []]))
  const where = new Map<string, string>()
  const by = new Map<string, HereBy>()
  const farm = (id: string) => !!save.roster[id] && atHome(save, id)
  const drawn: string[] = []
  for (const id of townsfolk(pack)) {
    const placed = storyPlaceOf(pack, id, day, known)
    if (!placed) { drawn.push(id); continue }
    if (farm(id)) continue
    at.get(placed.at)!.push(id)
    where.set(id, placed.at)
    by.set(id, placed.by)
  }
  const order = drawn.map((id) => [id, draw(uid, day, `town:${id}`, 0)] as const).sort(([a, x], [b, y]) => x - y || a.localeCompare(b))
  const room = new Map<SpotId, number>(SPOT_IDS.map((s) => [s, 0]))
  for (const [id] of order) {
    const open = SPOT_IDS.filter((s) => room.get(s)! < SPOT_ROOM)
    if (open.length === 0) break
    const favourite = favouriteSpotOf(pack, id)
    const spot = favourite && open.includes(favourite) && draw(uid, day, `town:${id}`, 1) < FAVOURITE_SPOT
      ? favourite : open[Math.min(open.length - 1, Math.floor(draw(uid, day, `town:${id}`, 2) * open.length))]!
    room.set(spot, room.get(spot)! + 1)
    // Who lives on the farm keeps her place, unseen.
    if (farm(id)) continue
    at.get(spot)!.push(id)
    where.set(id, spot)
    by.set(id, 'draw')
  }
  return { day, at, where, by }
}

/** How many are out in town today. */
export const outToday = (day: TownDay): number => day.where.size

/** Her talks in town so far, or none. */
export const townTalksOf = (save: Pick<SaveV4, 'town'>, id: string): TownTalks | null => save.town[id] ?? null
/** Whether you've talked with her today: a talk counts once a day. */
export const talkedToday = (save: Pick<SaveV4, 'town' | 'calendar'>, id: string): boolean => save.town[id]?.last === save.calendar.day
/** Whether you've given her a gift today: one a day. */
export const giftedToday = (save: Pick<SaveV4, 'town' | 'calendar'>, id: string): boolean => save.town[id]?.gift === save.calendar.day

/** Her line when you find her in town today: one of her town lines (the pack's, else the game's), the same all day.
 * `{farmer}` fills as it shows. */
export function townLineOf(save: Pick<SaveV4, 'account' | 'calendar'>, pack: Pick<StoryPack, 'bibles'>, id: string): string {
  const lines = townLinesOf(pack, id)
  return lines[Math.min(lines.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, `town-line:${id}`, 0) * lines.length))]!
}
