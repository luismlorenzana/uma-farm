// The town map: the six spots, the shops and offices, and the homes and workplaces the story adds. Only the cast lives in
// town (the owner's Umas, sisters included), less the town's people, who are at their posts. Going into town takes an
// action (`farm/actions.ts`); moving between its locations is free. A location lists who's there now. Nobody is placed at
// random: every Uma keeps a fixed schedule (`scheduleOf`), and the town, her profile and the calendar all read it. Pure.
//
//   her story       her routine's first stop that holds today (its days of the season and its seasons), else her
//                   part-time job on its days, else her home: she's there
//   the default     an Uma the story hasn't scheduled: at her favourite spot (her cast `spot`, else the six in turn by
//                   her place in the cast, three Umas each) on every third day of each season, starting on day 1, 2 or 3
//                   by her place in the cast; at home, off the map, the other days
//   a spot          holds everyone the schedules put there: the map shows how many and their first faces
//   on the farm     a spouse in her room lives at the farm, never in town; a farmhand is at the farm on her farm
//                   days, the days her schedule doesn't put her out in town (`farmDaysIn`), and in town on the rest
//   the posts       each of the town's people is at her post: the spot town.json has her keep, else the shop or office of
//                   her role, else the spot the game has her keep
//
// The same day always shows the same town, and the same season the same days.
import { dateOf, DAYS_PER_SEASON, type Season } from '../farm/calendar'
import { draw } from '../farm/draw'
import { awayOn } from '../expeditions/presence'
import { atHome, type SaveV4, type TownTalks } from '../save/v4'
import { GAME_LOCATIONS, SHOP_IDS, SPOT_IDS, type LifeWhen, type LocationKind, type ShopId, type SpotId } from '../story/authored'
import type { CastId } from '../story/cast'
import { castOrder, type StoryPack } from '../story/pack'
import { favouriteSpotOf, herHomeOf, herJobOf, herRoutineOf, storyLocationsOf, townLinesOf, townOf } from '../story/placeholders'

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
 * are at their posts. Nobody else from master data is in the game. A spouse in her room and a farmhand on her farm day are among them;
 * they're at the farm. */
export function townsfolk(pack: TownPack): string[] {
  const people = townOf(pack).byId
  return [...new Set(pack.cast.umas.map((u) => u.characterId))].filter((id) => !people.has(id))
}

/** Whether a place in her life holds on a day: its days of the season and its seasons, each every one when left out. */
export function lifeHolds(when: LifeWhen, day: number): boolean {
  const date = dateOf(day)
  return (when.days === undefined || when.days.includes(date.day)) && (when.seasons === undefined || when.seasons.includes(date.season))
}

/** Why she's where she is: her routine, her job, her home (the story's), or the default schedule (her favourite spot on
 * her days). */
export type HereBy = 'routine' | 'job' | 'home' | 'default'

/** One stop of her schedule: where (a location of the town map), when (its days of the season and its seasons, each every
 * one when left out), and whose it is. */
export interface ScheduleStop extends LifeWhen {
  readonly at: string
  readonly by: HereBy
}
/** Her schedule: the story's stops in the order they're tried (`own`), else the game's default, one stop. */
export interface Schedule {
  readonly own: boolean
  readonly stops: readonly ScheduleStop[]
}

/** The default schedule: every third day of each season. */
export const DEFAULT_EVERY = 3

/** Her place in the cast (0 first); one the cast doesn't hold comes after it, where she'd join. */
export function castPlace(pack: Pick<StoryPack, 'cast'>, id: string): number {
  const order = castOrder(pack)
  const at = order.indexOf(id)
  return at < 0 ? order.length : at
}
/** The default schedule's days for her place in the cast: every third day of the season, starting on day 1, 2 or 3. */
export function defaultDays(place: number): number[] {
  const days: number[] = []
  for (let d = 1 + (place % DEFAULT_EVERY); d <= DAYS_PER_SEASON; d += DEFAULT_EVERY) days.push(d)
  return days
}
/** The default schedule's spot: her favourite (her cast `spot`), else the six in turn by her place in the cast, three
 * Umas each, so a spot's three start on days 1, 2 and 3. */
export function defaultSpot(pack: Pick<StoryPack, 'cast'>, id: string, place = castPlace(pack, id)): SpotId {
  return favouriteSpotOf(pack, id) ?? SPOT_IDS[Math.floor(place / DEFAULT_EVERY) % SPOT_IDS.length]!
}

export type SchedulePack = Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>
const schedules = new WeakMap<object, Map<string, Schedule>>()

/** Her schedule: the story's when it's written (her routine's stops, then her job, then her home; a location the map
 * doesn't hold is passed over, and with none left the story hasn't scheduled her), else the default: her favourite spot
 * on every third day of each season, from day 1, 2 or 3 by her place in the cast, and at home off the map the other days.
 * The one source for the town, her profile and the calendar, and what the story's scaffold writes as her routine. Read
 * once a pack. */
export function scheduleOf(pack: SchedulePack, id: string): Schedule {
  let known = schedules.get(pack)
  if (!known) schedules.set(pack, (known = new Map()))
  const hit = known.get(id)
  if (hit) return hit
  const map = new Set(townLocations(pack).map((l) => l.id))
  const when = (w: LifeWhen): LifeWhen => ({ ...(w.days ? { days: w.days } : {}), ...(w.seasons ? { seasons: w.seasons } : {}) })
  const job = herJobOf(pack, id)
  const home = herHomeOf(pack, id)
  const stops: ScheduleStop[] = [
    ...herRoutineOf(pack, id).filter((s) => map.has(s.at)).map((s): ScheduleStop => ({ at: s.at, ...when(s), by: 'routine' })),
    ...(job && map.has(job.at) ? [{ at: job.at, ...when(job), by: 'job' as const }] : []),
    ...(home && map.has(home) ? [{ at: home, by: 'home' as const }] : []),
  ]
  const place = castPlace(pack, id)
  const schedule: Schedule = stops.length > 0 ? { own: true, stops }
    : { own: false, stops: [{ at: defaultSpot(pack, id, place), days: defaultDays(place), by: 'default' }] }
  known.set(id, schedule)
  return schedule
}

/** Whether a stop holds on a day of a season. */
const holdsIn = (when: LifeWhen, season: Season, day: number): boolean =>
  (when.days === undefined || when.days.includes(day)) && (when.seasons === undefined || when.seasons.includes(season))

/** Where her schedule puts her on a farm day, and why: its first stop that holds; at null (at home, off the map) when none
 * does. Whether she's on the farm instead is the save's (`onFarmToday`). */
export function whereOn(pack: SchedulePack, id: string, day: number): { at: string | null; by: HereBy | null } {
  const stop = scheduleOf(pack, id).stops.find((s) => lifeHolds(s, day))
  return stop ? { at: stop.at, by: stop.by } : { at: null, by: null }
}

/** The next day after `day` that her schedule puts her out in town, and where; null when none does within a year. */
export function nextOut(pack: SchedulePack, id: string, day: number): { day: number; at: string } | null {
  for (let d = day + 1; d <= day + DAYS_PER_SEASON * 4; d++) {
    const at = whereOn(pack, id, d).at
    if (at !== null) return { day: d, at }
  }
  return null
}

/** One place of her season: where her schedule puts her (null: at home, off the map), why, and on which days. */
export interface SeasonPlace {
  readonly at: string | null
  readonly by: HereBy | null
  readonly days: readonly number[]
}
/** Her season by place: each place her schedule puts her and its days, in the order of the first. */
export function seasonSchedule(pack: SchedulePack, id: string, season: Season): SeasonPlace[] {
  const out: { at: string | null; by: HereBy | null; days: number[] }[] = []
  const { stops } = scheduleOf(pack, id)
  for (let day = 1; day <= DAYS_PER_SEASON; day++) {
    const stop = stops.find((s) => holdsIn(s, season, day))
    const at = stop?.at ?? null
    const by = stop?.by ?? null
    const group = out.find((g) => g.at === at && g.by === by)
    if (group) group.days.push(day)
    else out.push({ at, by, days: [day] })
  }
  return out
}

// --- Farm days ----------------------------------------------------------------------------------------------------

/** Whether her schedule puts her out in town on a day of a season: by her routine, her job or the default schedule
 * (her favourite spot on her days). Her `home` in town, and at home off the map, aren't: those days are free. */
const outIn = (stops: readonly ScheduleStop[], season: Season, day: number): boolean => {
  const stop = stops.find((s) => holdsIn(s, season, day))
  return stop !== undefined && stop.by !== 'home'
}

const farmDayCache = new WeakMap<object, Map<string, readonly number[]>>()

/** Her farm days in a season, the days of the season (1–12) a farmhand comes to work: every day her schedule doesn't put
 * her out in town (`outIn`: her routine, her job or the default schedule's spot), including a day at her `home` in town
 * or at home off the map. A season her schedule leaves without one: the default schedule's other days (8 of 12, by her
 * place in the cast), so every farmhand works. Read once a pack. */
export function farmDaysIn(pack: SchedulePack, id: string, season: Season): readonly number[] {
  let known = farmDayCache.get(pack)
  if (!known) farmDayCache.set(pack, (known = new Map()))
  const key = `${id}:${season}`
  const hit = known.get(key)
  if (hit) return hit
  const { stops } = scheduleOf(pack, id)
  const all = Array.from({ length: DAYS_PER_SEASON }, (_, i) => i + 1)
  const free = all.filter((day) => !outIn(stops, season, day))
  const out = new Set(defaultDays(castPlace(pack, id)))
  const days = free.length > 0 ? free : all.filter((day) => !out.has(day))
  known.set(key, days)
  return days
}

/** Whether a day is one of her farm days (`farmDaysIn`). Every other day is a town day. */
export function farmDayOn(pack: SchedulePack, id: string, day: number): boolean {
  const date = dateOf(day)
  return farmDaysIn(pack, id, date.season).includes(date.day)
}

/** Her next farm day after `day`; null when none comes within a year (never: every season has one). */
export function nextFarmDay(pack: SchedulePack, id: string, day: number): number | null {
  for (let d = day + 1; d <= day + DAYS_PER_SEASON * 4; d++) if (farmDayOn(pack, id, d)) return d
  return null
}

/** Whether she's on the farm on a day (today, unless another is given): a spouse in her room every day, or a farmhand on
 * her farm days (`farmDayOn`). Either way she's in front of you there, and not in town. A farmhand's town days, and
 * everyone else you've met (a spouse waiting for a room among them, unless she's a farmhand on a farm day), are in town
 * by her schedule. A day ahead reads the save as it stands. */
export const onFarmToday = (save: Pick<SaveV4, 'roster' | 'love' | 'calendar'> & Partial<Pick<SaveV4, 'expeditions'>>, pack: SchedulePack, id: string, day = save.calendar.day): boolean =>
  !awayOn(save, id, day) && !!save.roster[id] && (atHome(save, id) || (save.roster[id]!.farmhand !== undefined && farmDayOn(pack, id, day)))

/** Whether she works the farm on a day (today, unless another is given): a farmhand on the farm (`onFarmToday`: her farm
 * day, or every day once she's a spouse in her room). With no pack to read her schedule, every farmhand works every day.
 * On a town day she's in town: she doesn't work, eat on the farm or cost anything. */
export function worksOn(save: Pick<SaveV4, 'roster' | 'love' | 'calendar'> & Partial<Pick<SaveV4, 'expeditions'>>, pack: SchedulePack | null, id: string, day = save.calendar.day): boolean {
  if (save.roster[id]?.farmhand === undefined || awayOn(save, id, day)) return false
  return pack === null || onFarmToday(save, pack, id, day)
}

/** One day in town: who's at each location, and where each one out is. */
export interface TownDay {
  readonly day: number
  /** Each location's Umas, by id, in the cast's order. */
  readonly at: ReadonlyMap<string, readonly string[]>
  /** Where she is that day, for everyone out in town. */
  readonly where: ReadonlyMap<string, string>
  /** Why she's there. */
  readonly by: ReadonlyMap<string, HereBy>
}

/** The town on a day (the save's, unless another is given): everyone who lives in town where her schedule puts her (the
 * story's, else the default), the rest at home off the map. An Uma on the farm that day (a spouse in her room, or a
 * farmhand on her farm day) isn't in town. A spot holds everyone the schedules put there. A day ahead reads the save as it stands. */
export function townDay(save: Pick<SaveV4, 'calendar' | 'roster' | 'love'> & Partial<Pick<SaveV4, 'expeditions'>>, pack: TownPack, day = save.calendar.day): TownDay {
  const locations = townLocations(pack)
  const at = new Map<string, string[]>(locations.map((l) => [l.id, []]))
  const where = new Map<string, string>()
  const by = new Map<string, HereBy>()
  for (const id of townsfolk(pack)) {
    if (awayOn(save, id, day) || onFarmToday(save, pack, id, day)) continue
    const placed = whereOn(pack, id, day)
    if (placed.at === null || placed.by === null) continue
    at.get(placed.at)?.push(id)
    where.set(id, placed.at)
    by.set(id, placed.by)
  }
  return { day, at, where, by }
}

/** Where you'd find her now: on the farm (a spouse in her room, or a farmhand on her farm day), or at `at` in town today
 * (null: at home, not out); `here` once she's in front of you: on the farm, or out in town with you there today. */
export interface MeetWhere {
  readonly here: boolean
  readonly farm: boolean
  /** Her place in town today; null on the farm or at home. */
  readonly at: string | null
}
/** Whether she lives in town: one of the cast, and not one of the town's people (they're at their posts). */
export const livesInTown = (pack: SchedulePack, id: string): boolean => castOrder(pack).includes(id) && !townOf(pack).byId.has(id)

/** Where you meet her now (the talk-and-gift rule, and the evening's): on the farm when she lives there (a spouse in her
 * room) or it's her farm day (a farmhand), else where her schedule puts her in town today; she's in front of you there
 * once you've gone into town. */
export function whereYouMeet(save: Pick<SaveV4, 'calendar' | 'roster' | 'love' | 'today'> & Partial<Pick<SaveV4, 'expeditions'>>, pack: SchedulePack, id: string): MeetWhere {
  if (awayOn(save, id, save.calendar.day)) return { here: false, farm: false, at: null }
  if (onFarmToday(save, pack, id)) return { here: true, farm: true, at: null }
  const at = livesInTown(pack, id) ? whereOn(pack, id, save.calendar.day).at : null
  return { here: at !== null && save.today.town, farm: false, at }
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
