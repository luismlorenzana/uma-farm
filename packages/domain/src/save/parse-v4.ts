// Save v5's parse: strict keys, explicit paths, every id checked, the farm's parts from `parse-loop.ts`. Unknown
// keys (an older save's `start`, `visitors`, `work`, a roster Uma's `affinity` among them) are refused; roster keys are character ids by form,
// or a sister's `s<outfitId>` (the API has no story pack or master data): the roster is everyone you've met, her `joined`
// the day you met her; `love` holds exactly the roster's keys, each in range; `memories` and
// `arrivals` name roster Umas; the farmer's name is empty or within its rule; the retired Dorm keeps its level, and loading clears who was home and its swaps. Each
// part of the romance adds the checks for what it fills. Today's evenings fill the day's slots (one, two on days
// divisible by 4 from 10 married, and festival night once at most: the story says which days are festivals) with the
// evening kinds, and its invitations are one (two from 10 married), each a different Uma, asking for a date game. The
// day's actions and event actions are counts (the budget is the rules', so an upgrade never breaks a save), and the areas
// and spots worked today their ids, each once; today's occasion scenes, when any played, the roster Umas who played one.
// The Diary's Town notes are ids. Her gallery names roster Umas, each with her scenes seen by id.
import { dateOf, DAYS_PER_SEASON, FESTIVAL_IDS } from '../farm/calendar'
import { cleanFarmerName, farmerNameIssue, houseNameIssue } from '../romance/farmer'
import { GALLERY_MAX, ILLUSTRATION_ID } from './gallery'
import { canSaveCropSeed, cropGoodId, isCropId, isGoodId, isGoodOrRingId, type CropId } from '../goods/ids'
import { FISHING_SPOTS, FOREST_AREAS, STATIONS } from '../gathering/ids'
import { isStockId, parseStockKey } from './warehouse'
import type { HeartLine, MorningSummary } from '../night/summary'
import { bool, count, int, list, object, oneOf, parseAccount, record, text } from './parse'
import {
  counts, day, fail, KEY, member, outfit, parseBinLines, parseBonds, parseBoard, parseBuildings, parseDiary, parseDig, parseDorm, parseExpeditions, parseExpeditionReturn,
  legacyChapter, parseFarm, parseFields, parseLoads, parseMoneyLines, parseNewsLines, parseNudges, parseRanch, parseRankLines, parseRanks, parseTools, parseWarehouse, parseWorkLines,
  parseWorkshops, unique,
} from './parse-loop'
import {
  type BuildingId, EVENING_KINDS, eveningsOn, FARMHOUSE, FESTIVAL_NIGHT, FIELD_TILES, FINALE_MARRIED, MAX_FIELD_TILES, MAX_PLOTS, FURNITURE_PIECES, invitesFor, LOVE_STAGES, marriedCount, MAX_HOUSES, residentsOf, roomsOf,
  isDishId, MEALS, pairKey, TOWN_ID, type EveningKind, type Homestead, type InviteKind, type Love, type RosterUma, type SaveV5, type StaffMeal, type TodayV4, type TownTalks,
  APTITUDE_IDS, DIGS, MAX_TASKS, RANCH_HOMES, TASK_KINDS, type FarmTask,
} from './v4'

export { isRosterId, LOOP_SLOTS, LOOP_WORK_PLACES } from './parse-loop'
export type { LoopPlaceId } from './parse-loop'

export const SAVE_V5_KEYS = [
  'version', 'account', 'farmer', 'calendar', 'gold', 'today', 'roster', 'love', 'dorm', 'items', 'bin', 'fields', 'loads', 'crops', 'ranch', 'places',
  'buildings', 'tools', 'workshops', 'expeditions', 'expeditionLog', 'bonds', 'board', 'diary', 'farm', 'homestead', 'memories', 'arrivals', 'gallery', 'summary', 'town',
] as const

/** The most actions a day can hold: well past any budget the farm grows to. */
const MAX_DAY_ACTIONS = 100
/** The areas and spots a day can work. */
const GATHER_IDS: readonly string[] = [...FOREST_AREAS, ...FISHING_SPOTS]
/** The places that thin: the areas, the spots and the two digs (`today.hauls`). */
const HAUL_IDS: readonly string[] = [...GATHER_IDS, ...DIGS]

/** Events a route can hold: her arrival and 26 rungs, with room for later waves' extras. */
const MAX_MEMORIES = 64

// --- The roster and her route ----------------------------------------------------------------------------------------

function parseRoster(value: unknown, path: string, today: number): Record<string, RosterUma> {
  const out: Record<string, RosterUma> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    outfit(id, at)
    const u = object(raw, at, ['joined', 'ranks', 'wellFed', 'farmhand', 'tasks', 'practice'])
    const joined = day(u.joined, `${at}.joined`)
    if (joined > today) fail(`${at}.joined`, 'after today')
    out[id] = { joined, ranks: parseRanks(u.ranks, `${at}.ranks`), wellFed: count(u.wellFed, `${at}.wellFed`) }
    // The day she started working the farm: absent before you invite her (the save grows it in place).
    if (u.farmhand !== undefined) {
      const hired = day(u.farmhand, `${at}.farmhand`)
      if (hired > today || hired < joined) fail(`${at}.farmhand`, 'expected a day from the day she joined to today')
      out[id].farmhand = hired
    }
    // Her tasks on the work board (a farmhand's) and her practice: absent before any (the save grows them in place).
    if (u.tasks !== undefined) {
      if (out[id].farmhand === undefined) fail(`${at}.tasks`, 'only a farmhand’s')
      out[id].tasks = list(u.tasks, `${at}.tasks`, 0, MAX_TASKS).map((t, i) => parseTask(t, `${at}.tasks.${i}`))
    }
    if (u.practice !== undefined) out[id].practice = counts(u.practice, `${at}.practice`, (k) => (APTITUDE_IDS as readonly string[]).includes(k), 'unknown aptitude')
  }
  return out
}

/** One task on her board: the field's over a plot's tiles (each once, 0–39; its plot from 2 on, absent for plot 1, so a
 * task from before plots is plot 1's; planting one crop or any), a station's load, a forest area's forage or chop, a
 * fishing spot's catch, the Coop's or the Barn's care, a dig's face, the kitchen's cooking. */
function parseTask(value: unknown, path: string): FarmTask {
  const kind = oneOf(record(value, path).kind, `${path}.kind`, TASK_KINDS)
  switch (kind) {
    case 'harvest': case 'water': case 'till': case 'plant': {
      const o = object(value, path, kind === 'plant' ? ['kind', 'tiles', 'plot', 'crop'] : ['kind', 'tiles', 'plot'])
      const tiles = unique(list(o.tiles, `${path}.tiles`, 1, FIELD_TILES).map((v, i) => int(v, `${path}.tiles.${i}`, 0, FIELD_TILES - 1)), `${path}.tiles`)
      // Plot 1 is written without one: a plot from 2 on (its index, 1 up).
      const plot = o.plot === undefined ? {} : { plot: int(o.plot, `${path}.plot`, 1, MAX_PLOTS - 1) }
      if (kind !== 'plant') return { kind, tiles, ...plot }
      return o.crop === undefined ? { kind, tiles, ...plot } : { kind, tiles, ...plot, crop: typeof o.crop === 'string' && isCropId(o.crop) ? o.crop : fail(`${path}.crop`, 'unknown crop') }
    }
    case 'save-seed': {
      const o = object(value, path, ['kind', 'crop', 'grade', 'improve', 'target'])
      const crop = o.crop === undefined ? 'carrot' : typeof o.crop === 'string' && isCropId(o.crop) ? o.crop : fail(`${path}.crop`, 'unknown crop')
      const grade = int(o.grade, `${path}.grade`, 1, 10)
      const improve = bool(o.improve, `${path}.improve`)
      if (!canSaveCropSeed(crop) || !cropGoodId(crop, grade) || (improve && !cropGoodId(crop, grade + 1))) fail(path, 'unknown saved seed grade')
      return { kind, ...(o.crop === undefined ? {} : { crop }), grade, improve, target: int(o.target, `${path}.target`, 1, 99) }
    }
    case 'load': return { kind, station: oneOf(object(value, path, ['kind', 'station']).station, `${path}.station`, STATIONS) }
    case 'forage': case 'chop': return { kind, area: oneOf(object(value, path, ['kind', 'area']).area, `${path}.area`, FOREST_AREAS) }
    case 'fish': return { kind, spot: oneOf(object(value, path, ['kind', 'spot']).spot, `${path}.spot`, FISHING_SPOTS) }
    case 'care': return { kind, home: oneOf(object(value, path, ['kind', 'home']).home, `${path}.home`, RANCH_HOMES) }
    case 'mine': return { kind, dig: oneOf(object(value, path, ['kind', 'dig']).dig, `${path}.dig`, DIGS) }
    case 'cook': return (object(value, path, ['kind']), { kind })
  }
}

/** A day of hers that can't be after today: 0 is "never". */
const pastDay = (value: unknown, path: string, today: number): number => {
  const d = count(value, path)
  if (d > today) fail(path, 'after today')
  return d
}

const LOVE_KEYS = ['stage', 'level', 'points', 'last', 'friend', 'ring', 'wed', 'house', 'known', 'flags', 'evening', 'festivals', 'morning', 'dish', 'night'] as const

/** Her level's range on each stage: friendship and romance 0–9 (the tenth event moves her on), 10 while a
 * waiting rung waits, spouse 0–5. */
const LEVELS: Readonly<Record<Love['stage'], readonly [number, number]>> = {
  friendship: [0, 9], confession: [10, 10], romance: [0, 9], proposal: [10, 10], wedding: [10, 10], spouse: [0, 5],
}

/** A festival she's been at with you: `<festival>:<year>`, the year no later than this one. */
function festivalKey(value: unknown, path: string, year: number): string {
  const [festival, at] = typeof value === 'string' ? value.split(':') : []
  if (!(FESTIVAL_IDS as readonly string[]).includes(festival ?? '') || !/^[1-9]\d*$/.test(at ?? '') || Number(at) > year) fail(path, 'expected <festival>:<year>, this year or before')
  return value as string
}

/** Her route: her level in its stage's range; points whole and ≥ 0; `last` and `evening` no later
 * than today; `friend` only while the confession waits; `ring` only from the proposal on; `wed` and `house` only a
 * spouse's; festivals once each, by year; `morning` only from Romance 2 on, no later than today; `dish` a dish
 * id, only from Friendship 4 on. */
function parseLove(value: unknown, path: string, today: number, houses: number): Love {
  const o = object(value, path, LOVE_KEYS)
  const stage = oneOf(o.stage, `${path}.stage`, LOVE_STAGES)
  const [low, high] = LEVELS[stage]
  const love: Love = {
    stage, level: int(o.level, `${path}.level`, low, high), points: count(o.points, `${path}.points`),
    last: pastDay(o.last, `${path}.last`, today),
    known: unique(list(o.known, `${path}.known`, 0, 2000).map((g, i) => (typeof g === 'string' && (isGoodId(g) || isDishId(g)) ? g : fail(`${path}.known.${i}`, 'unknown good'))), `${path}.known`),
    flags: unique(list(o.flags, `${path}.flags`, 0, 200).map((f, i) => (typeof f === 'string' && KEY.test(f) ? f : fail(`${path}.flags.${i}`, 'expected a flag id'))), `${path}.flags`),
    evening: pastDay(o.evening, `${path}.evening`, today),
    festivals: unique(list(o.festivals, `${path}.festivals`, 0, 1000).map((f, i) => festivalKey(f, `${path}.festivals.${i}`, dateOf(today).year)), `${path}.festivals`),
  }
  if (o.friend !== undefined) {
    if (o.friend !== true) fail(`${path}.friend`, 'expected true')
    if (stage !== 'confession') fail(`${path}.friend`, 'only while her confession waits')
    love.friend = true
  }
  if (o.ring !== undefined) {
    // Her ring's grade, set when the proposal plays (her wedding's wait on).
    if (stage !== 'wedding' && stage !== 'spouse') fail(`${path}.ring`, 'only from the proposal on')
    love.ring = int(o.ring, `${path}.ring`, 1, 10)
  }
  if (o.wed !== undefined) {
    if (stage !== 'spouse') fail(`${path}.wed`, 'only a spouse')
    love.wed = day(o.wed, `${path}.wed`)
    if (love.wed > today) fail(`${path}.wed`, 'after today')
  }
  if (o.house !== undefined) {
    if (stage !== 'spouse') fail(`${path}.house`, 'only a spouse')
    love.house = int(o.house, `${path}.house`, 0, houses - 1)
  }
  if (o.morning !== undefined) {
    if (stage === 'friendship' || stage === 'confession' || (stage === 'romance' && love.level < 2)) fail(`${path}.morning`, 'only from Romance 2 on')
    love.morning = pastDay(o.morning, `${path}.morning`, today)
  }
  if (o.dish !== undefined) {
    if (stage === 'friendship' && love.level < 4) fail(`${path}.dish`, 'only from Friendship 4 on')
    love.dish = typeof o.dish === 'string' && isDishId(o.dish) ? o.dish : fail(`${path}.dish`, 'unknown dish')
  }
  if (o.night !== undefined) {
    // The last night she was your companion: a spouse's, absent before any.
    if (stage !== 'spouse') fail(`${path}.night`, 'only a spouse')
    love.night = pastDay(o.night, `${path}.night`, today)
  }
  return love
}

function parseLoveAll(value: unknown, path: string, roster: ReadonlySet<string>, today: number, houses: number): Record<string, Love> {
  const out: Record<string, Love> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    member(id, `${path}.${id}`, roster, 'expected an Uma on the roster')
    out[id] = parseLove(raw, `${path}.${id}`, today, houses)
  }
  for (const id of roster) if (!out[id]) fail(`${path}.${id}`, 'missing for an Uma on the roster')
  return out
}

function parseMemories(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    member(id, at, roster)
    out[id] = unique(list(raw, at, 0, MAX_MEMORIES).map((v, i) => (typeof v === 'string' && KEY.test(v) ? v : fail(`${at}.${i}`, 'expected an event id'))), at)
  }
  return out
}

/** Her gallery, by roster Uma: her illustrations seen, each a scene's id once (`ILLUSTRATION_ID`), at most
 * `GALLERY_MAX`. Grows in place: an older v5 has none, and `updatedAt` never moves. */
function parseGallery(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, string[]> {
  if (value === undefined) return {}
  const out: Record<string, string[]> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    member(id, at, roster)
    out[id] = unique(list(raw, at, 0, GALLERY_MAX).map((v, i) => (typeof v === 'string' && ILLUSTRATION_ID.test(v) ? v : fail(`${at}.${i}`, 'expected a scene id'))), at)
  }
  return out
}

/** An evening's kind: a date game or festival night. */
const eveningKind = (v: unknown, at: string): EveningKind => oneOf(v, at, EVENING_KINDS)
/** An invitation's kind: a date game, never festival night. */
const inviteKind = (v: unknown, at: string): InviteKind => (v === FESTIVAL_NIGHT ? fail(at, 'expected a date game') : eveningKind(v, at) as InviteKind)

/** An occasion's id in `today.occasions`: lowercase words joined by `-` (`romance/occasions.ts`). */
const OCCASION_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
/** Today's occasions played: each `<her id>:<occasion id>`, or her id alone (the old form: the day's one occasion), once
 * each; at most three a roster Uma (the old form, the day's and the night's). */
function parseOccasions(value: unknown, path: string, roster: ReadonlySet<string>): string[] {
  return unique(list(value, path, 0, roster.size * 3).map((v, i) => {
    const at = `${path}.${i}`
    if (typeof v !== 'string') return fail(at, 'expected an occasion')
    const [id, occasion, ...rest] = v.split(':')
    member(id, at, roster)
    if (occasion !== undefined && (rest.length > 0 || !OCCASION_ID.test(occasion) || occasion.length > 64)) fail(at, 'expected <id>:<occasion>')
    return v
  }), path)
}

/** `today`: the evenings within the day's slots (`evenings` regular ones, and festival
 * night once at most), and `invites` invitations, each a different Uma. */
function parseToday(value: unknown, path: string, roster: ReadonlySet<string>, day: number, married: number): TodayV4 {
  const o = object(value, path, ['actions', 'eventActions', 'town', 'gathered', 'chats', 'gifts', 'praise', 'praised', 'events', 'occasions', 'asked', 'evenings', 'invites', 'bonds', 'ring', 'reception', 'meals', 'fed', 'hauls', 'staff', 'assistant', 'cook'])
  const umas = (raw: unknown, at: string) => unique(list(raw, at, 0, roster.size).map((v, i) => member(v, `${at}.${i}`, roster)), at)
  const slots = eveningsOn(day, married)
  const evenings = list(o.evenings, `${path}.evenings`, 0, slots + 1).map((v, i) => {
    const e = object(v, `${path}.evenings.${i}`, ['with', 'kind'])
    return { with: member(e.with, `${path}.evenings.${i}.with`, roster), kind: eveningKind(e.kind, `${path}.evenings.${i}.kind`) }
  })
  const nights = evenings.filter((e) => e.kind === FESTIVAL_NIGHT).length
  // Festival night once a day at most. Which days hold a festival is the story's (`festivalsOf`: it may move or add
  // them), so the save reads any day's; the evening's rule spends it only on a festival day or the Festival of Vows.
  if (nights > 1) fail(`${path}.evenings`, 'festival night once a day at most')
  if (evenings.length - nights > slots) fail(`${path}.evenings`, `expected at most ${slots} evening${slots === 1 ? '' : 's'} today`)
  return {
    actions: int(o.actions, `${path}.actions`, 0, MAX_DAY_ACTIONS), eventActions: int(o.eventActions, `${path}.eventActions`, 0, MAX_DAY_ACTIONS),
    town: bool(o.town, `${path}.town`),
    gathered: unique(list(o.gathered, `${path}.gathered`, 0, GATHER_IDS.length).map((v, i) => oneOf(v, `${path}.gathered.${i}`, GATHER_IDS)), `${path}.gathered`),
    chats: umas(o.chats, `${path}.chats`), gifts: umas(o.gifts, `${path}.gifts`), praise: umas(o.praise, `${path}.praise`),
    praised: umas(o.praised, `${path}.praised`), events: umas(o.events, `${path}.events`),
    // Today's occasion scenes: absent until one plays (a save from before the calendar has none). Each is
    // `<her id>:<occasion id>`, or her id alone (a save from before every occasion played: the day's one).
    ...(o.occasions === undefined ? {} : { occasions: parseOccasions(o.occasions, `${path}.occasions`, roster) }),
    asked: umas(o.asked, `${path}.asked`),
    evenings,
    invites: unique(list(o.invites, `${path}.invites`, 0, invitesFor(married)).map((v, i) => {
      const at = `${path}.invites.${i}`
      const n = object(v, at, ['id', 'kind', 'answer'])
      const answer = n.answer === null ? null : oneOf(n.answer, `${at}.answer`, ['yes', 'no'] as const)
      return { id: member(n.id, `${at}.id`, roster), kind: inviteKind(n.kind, `${at}.kind`), answer }
    }), `${path}.invites`, (n) => n.id),
    bonds: parseBondHeartsToday(o.bonds, `${path}.bonds`, roster),
    // The ring made today (its grade, 0 none) and the reception's well-fed days (0 none).
    ring: int(o.ring, `${path}.ring`, 0, 10),
    reception: int(o.reception, `${path}.reception`, 0, 3),
    // The household's meals cooked today, each once: absent until one is cooked (the save grows it in place).
    ...(o.meals === undefined ? {} : { meals: unique(list(o.meals, `${path}.meals`, 0, MEALS.length).map((v, i) => oneOf(v, `${path}.meals.${i}`, MEALS)), `${path}.meals`) }),
    // The farmhands well fed this morning: absent with none (the save grows it in place).
    ...(o.fed === undefined ? {} : { fed: umas(o.fed, `${path}.fed`) }),
    // The hauls today at each area and spot, the farmer's and the farmhands' (a place thins past four): absent until the
    // first (the save grows it in place). Each counted place is one worked today.
    ...(o.hauls === undefined ? {} : { hauls: parseHauls(o.hauls, `${path}.hauls`) }),
    // Tonight's staff meal (its mouths from 1, its well-fed days 1–3) and the Kitchen's assistant today: absent until
    // there's one (the save grows them in place).
    ...(o.staff === undefined ? {} : { staff: parseStaff(o.staff, `${path}.staff`) }),
    ...(o.assistant === undefined ? {} : { assistant: member(o.assistant, `${path}.assistant`, roster) }),
    // The Cooking Contest's cook today: absent with none (the save grows it in place).
    ...(o.cook === undefined ? {} : { cook: member(o.cook, `${path}.cook`, roster) }),
  }
}

/** `today.staff`: the mouths it was served for, from 1, and its well-fed days, 1–3. */
function parseStaff(value: unknown, path: string): StaffMeal {
  const o = object(value, path, ['mouths', 'days'])
  return { mouths: int(o.mouths, `${path}.mouths`, 1, MAX_MOUTHS), days: int(o.days, `${path}.days`, 1, 3) }
}
/** The most mouths a table holds: the farmer and every Uma, with room to spare. */
const MAX_MOUTHS = 10_000

/** `today.hauls`: an area or a spot, its hauls today (1 or more). */
function parseHauls(value: unknown, path: string): Record<string, number> {
  return Object.fromEntries(Object.entries(record(value, path)).map(([where, n]) => [oneOf(where, `${path}.${where}`, HAUL_IDS), int(n, `${path}.${where}`, 1, MAX_HAULS)]))
}
/** The most hauls a place takes in a day: far past any farm's. */
const MAX_HAULS = 10_000

/** `today.bonds`: a pair of roster Umas by `pairKey` (numeric order), its hearts 0–5 before it first moved
 * since the last morning. */
function parseBondHeartsToday(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [key, raw] of Object.entries(record(value, path))) {
    const [a, b, ...rest] = key.split(':')
    if (rest.length > 0 || !a || !b || a === b || !roster.has(a) || !roster.has(b) || pairKey(a, b) !== key) fail(`${path}.${key}`, 'expected two roster ids in numeric order, idA:idB')
    out[key] = int(raw, `${path}.${key}`, 0, 5)
  }
  return out
}

/** The homestead: the Farmhouse first (two rooms, never extended), then up to six houses, each named by the
 * letters rule (1–20 characters); tonight's house a built one; "her room" only with tonight's house; a night slept in each
 * house, no later than today; the furniture none or five pieces, each in a built house or not placed; the married count
 * the night last saw, and the finale's morning (no later than today, only from 20 married). Who lives where is `love.house`,
 * checked with the roster (`parseRooms`). */
function parseHomestead(value: unknown, path: string, today: number, roster: ReadonlySet<string>): Homestead {
  const o = object(value, path, ['houses', 'tonight', 'alone', 'slept', 'furniture', 'married', 'finale', 'companion'])
  const houses = list(o.houses, `${path}.houses`, 1, MAX_HOUSES).map((v, i) => {
    const at = `${path}.houses.${i}`
    const h = object(v, at, ['name', 'extended'])
    const name = text(h.name, `${at}.name`)
    if (houseNameIssue(name) !== null || cleanFarmerName(name) !== name) fail(`${at}.name`, 'expected 1–20 letters, spaces, apostrophes or hyphens')
    const extended = bool(h.extended, `${at}.extended`)
    if (i === 0 && (name !== FARMHOUSE.name || extended)) fail(at, 'expected the Farmhouse, never extended')
    return { name, extended }
  })
  const tonight = o.tonight === null ? null : int(o.tonight, `${path}.tonight`, 0, houses.length - 1)
  const alone = o.alone === null ? null : member(o.alone, `${path}.alone`, roster)
  if (alone !== null && tonight === null) fail(`${path}.alone`, 'her room is tonight’s house')
  const slept = list(o.slept, `${path}.slept`, houses.length, houses.length).map((v, i) => pastDay(v, `${path}.slept.${i}`, today))
  const furniture = list(o.furniture, `${path}.furniture`, 0, FURNITURE_PIECES).map((v, i) => (v === null ? null : int(v, `${path}.furniture.${i}`, 0, houses.length - 1)))
  if (furniture.length !== 0 && furniture.length !== FURNITURE_PIECES) fail(`${path}.furniture`, `expected none or ${FURNITURE_PIECES} pieces`)
  const married = int(o.married, `${path}.married`, 0, 10_000)
  const finale = pastDay(o.finale, `${path}.finale`, today)
  if (finale > 0 && married < FINALE_MARRIED) fail(`${path}.finale`, `only from ${FINALE_MARRIED} married`)
  if (furniture.length > 0 && married < 5) fail(`${path}.furniture`, 'only from 5 married')
  // Tonight's companion: your pick, with tonight's house (hers); absent before a pick (the save grows it in place).
  const companion = o.companion === undefined ? undefined : member(o.companion, `${path}.companion`, roster)
  if (companion !== undefined && tonight === null) fail(`${path}.companion`, 'her house is tonight’s house')
  return { houses, tonight, alone, slept, furniture, married, finale, ...(companion === undefined ? {} : { companion }) }
}

/** Who lives where: no house holds more residents than its rooms; her room tonight is hers, a spouse in tonight's house; the married count the night saw
 * is no more than the spouses now. */
function parseRooms(save: Pick<SaveV5, 'love' | 'homestead'>, path: string): void {
  save.homestead.houses.forEach((house, i) => {
    if (residentsOf(save, i).length > roomsOf(house)) fail(`${path}.homestead.houses.${i}`, `expected at most ${roomsOf(house)} residents`)
  })
  const { alone, tonight, married, companion } = save.homestead
  if (alone !== null && save.love[alone]?.house !== tonight) fail(`${path}.homestead.alone`, 'expected a spouse in tonight’s house')
  if (companion !== undefined && save.love[companion]?.house !== tonight) fail(`${path}.homestead.companion`, 'expected a spouse in tonight’s house')
  if (married > marriedCount(save)) fail(`${path}.homestead.married`, 'more than are married')
}

function parseFarmer(value: unknown, path: string): SaveV5['farmer'] {
  const o = object(value, path, ['name'])
  if (typeof o.name !== 'string') fail(`${path}.name`, 'expected a string')
  const name = o.name as string
  if (name !== '' && (farmerNameIssue(name) !== null || cleanFarmerName(name) !== name)) fail(`${path}.name`, 'expected 1–16 letters, spaces, apostrophes or hyphens')
  return { name }
}

// --- The morning -----------------------------------------------------------------------------------------

/** A morning item's stock key: a good at ★1–5, `<good>@<stars>`. */
function itemKey(v: unknown, at: string): string {
  const parsed = typeof v === 'string' ? parseStockKey(v) : null
  return parsed && isGoodId(parsed.id) ? (v as string) : fail(at, 'expected <good>@<stars>')
}

/** A chapter's number on a morning line: at most one chapter a rung with an event, her arrival's and the 26 others
 * (`RUNGS`, kept out of the save's parser so the story's reader loads on demand). */
const MAX_CHAPTERS = 27

/** §4 Hearts:
 * invitations, arrivals, birthdays, anniversaries, morning items and chapters opened, each an Uma on the roster, once a
 * kind each (a chapter numbered 1–27); an
 * invitation asks for a date game; an anniversary's item is a good on the day and null the day before; a morning item 1–3
 * goods at their stars; the night's chores once, items, growth (quarters) and fondness (absent at 0), one of them more
 * than 0; the perks' extras
 * once, 1+ items; side by side once, 1+ items; bond hearts 1–5 once a pair, two roster Umas in `pairKey` order. */
function parseHearts(value: unknown, path: string, roster: ReadonlySet<string>, houses: number): HeartLine[] {
  const when = (v: unknown, at: string) => oneOf(v, at, ['today', 'tomorrow'] as const)
  const pairs = (roster.size * (roster.size - 1)) / 2
  return unique(list(value, path, 0, roster.size * 8 + pairs + 6).map((v, i): HeartLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['morning', 'invite', 'arrived', 'birthday', 'anniversary', 'item', 'chores', 'perks', 'side', 'bond', 'house', 'misses', 'moved', 'level', 'vows', 'chapter'] as const)
    // The night's companion, who greets you this morning.
    if (kind === 'morning') return { kind, id: member(object(v, at, ['kind', 'id']).id, `${at}.id`, roster) }
    if (kind === 'chapter') {
      const o = object(v, at, ['kind', 'id', 'chapter'])
      return { kind, id: member(o.id, `${at}.id`, roster), chapter: int(o.chapter, `${at}.chapter`, 1, MAX_CHAPTERS) }
    }
    // The house's morning, a house that misses you, a move-in, a night level, the Festival of Vows.
    if (kind === 'house') {
      const o = object(v, at, ['kind', 'house', 'umas', 'paid', 'breakfast', 'items'])
      const umas = unique(list(o.umas, `${at}.umas`, 1, 4).map((id, n) => member(id, `${at}.umas.${n}`, roster)), `${at}.umas`)
      return {
        kind, house: int(o.house, `${at}.house`, 0, houses - 1), umas, paid: int(o.paid, `${at}.paid`, 0, 100_000),
        breakfast: int(o.breakfast, `${at}.breakfast`, 0, roster.size), items: int(o.items, `${at}.items`, 0, umas.length),
      }
    }
    if (kind === 'misses') return { kind, house: int(object(v, at, ['kind', 'house']).house, `${at}.house`, 0, houses - 1) }
    if (kind === 'moved') {
      const o = object(v, at, ['kind', 'id', 'house'])
      return { kind, id: member(o.id, `${at}.id`, roster), house: int(o.house, `${at}.house`, 0, houses - 1) }
    }
    if (kind === 'level') {
      const o = object(v, at, ['kind', 'id', 'rung'])
      return { kind, id: member(o.id, `${at}.id`, roster), rung: oneOf(o.rung, `${at}.rung`, ['s2', 's4'] as const) }
    }
    if (kind === 'vows') {
      const o = object(v, at, ['kind', 'spouses', 'paid'])
      return { kind, spouses: int(o.spouses, `${at}.spouses`, 1, roster.size), paid: int(o.paid, `${at}.paid`, 0, 1_000_000) }
    }
    if (kind === 'item') {
      const o = object(v, at, ['kind', 'id', 'items'])
      return { kind, id: member(o.id, `${at}.id`, roster), items: list(o.items, `${at}.items`, 1, 3).map((k, n) => itemKey(k, `${at}.items.${n}`)) }
    }
    if (kind === 'chores') {
      const o = object(v, at, ['kind', 'items', 'watered', 'fondness'])
      const items = int(o.items, `${at}.items`, 0, 100_000)
      const watered = int(o.watered, `${at}.watered`, 0, MAX_FIELD_TILES)
      const fondness = o.fondness === undefined ? 0 : int(o.fondness, `${at}.fondness`, 1, 100_000)
      if (items === 0 && watered === 0 && fondness === 0) fail(at, 'expected items, tiles watered or fondness')
      return { kind, items, watered, ...(fondness > 0 ? { fondness } : {}) }
    }
    if (kind === 'perks') {
      const o = object(v, at, ['kind', 'items'])
      return { kind, items: int(o.items, `${at}.items`, 1, 100_000) }
    }
    if (kind === 'invite') {
      const n = object(v, at, ['kind', 'id', 'evening'])
      return { kind, id: member(n.id, `${at}.id`, roster), evening: inviteKind(n.evening, `${at}.evening`) }
    }
    if (kind === 'birthday') {
      const b = object(v, at, ['kind', 'id', 'when'])
      return { kind, id: member(b.id, `${at}.id`, roster), when: when(b.when, `${at}.when`) }
    }
    if (kind === 'anniversary') {
      const a = object(v, at, ['kind', 'id', 'when', 'item'])
      const day = when(a.when, `${at}.when`)
      const item = day === 'tomorrow'
        ? (a.item === null ? null : fail(`${at}.item`, 'expected null the day before'))
        : (typeof a.item === 'string' && isGoodId(a.item) ? a.item : fail(`${at}.item`, 'unknown good'))
      return { kind, id: member(a.id, `${at}.id`, roster), when: day, item }
    }
    if (kind === 'side') {
      const o = object(v, at, ['kind', 'items'])
      return { kind, items: int(o.items, `${at}.items`, 1, 100_000) }
    }
    if (kind === 'bond') {
      const o = object(v, at, ['kind', 'a', 'b', 'hearts'])
      const a = member(o.a, `${at}.a`, roster)
      const b = member(o.b, `${at}.b`, roster)
      if (a === b || pairKey(a, b) !== `${a}:${b}`) fail(`${at}.b`, 'expected two Umas in numeric order')
      return { kind, a, b, hearts: int(o.hearts, `${at}.hearts`, 1, 5) }
    }
    const a = object(v, at, ['kind', 'id', 'home'])
    return { kind: 'arrived', id: member(a.id, `${at}.id`, roster), home: bool(a.home, `${at}.home`) }
  }), path, (h) => (h.kind === 'bond' ? `bond:${h.a}:${h.b}` : h.kind === 'side' || h.kind === 'chores' || h.kind === 'perks' || h.kind === 'house' || h.kind === 'misses' || h.kind === 'vows' || h.kind === 'morning' ? h.kind : `${h.kind}:${h.id}`))
}

function parseSummary(value: unknown, path: string, today: number, roster: ReadonlySet<string>, houses: number): MorningSummary {
  const o = object(value, path, ['day', 'bin', 'money', 'work', 'ranks', 'hearts', 'news', 'nudges'])
  if (o.day !== today) fail(`${path}.day`, 'expected today: a summary is the morning it opens on')
  return {
    day: today, bin: parseBinLines(o.bin, `${path}.bin`), ...(o.money === undefined ? {} : { money: parseMoneyLines(o.money, `${path}.money`) }),
    work: parseWorkLines(o.work, `${path}.work`, roster), ranks: parseRankLines(o.ranks, `${path}.ranks`, roster),
    hearts: parseHearts(o.hearts, `${path}.hearts`, roster, houses), news: parseNewsLines(o.news, `${path}.news`, roster),
    nudges: parseNudges(o.nudges, `${path}.nudges`),
  }
}

/** The places each global chapter opened, before the farm grew by building: chapter 2 the Coop and the Barn, 3 the
 * Mine, the Smelter, the Quarry and the Cutter, 4 the Kitchen, 5 the expedition post, 6 the Restaurant, 7 the Forge and
 * the sea (the dock and the boat). */
const CHAPTER_OPENED: readonly (readonly BuildingId[])[] = [
  [], [], ['coop', 'barn'], ['mine', 'smelter', 'quarry', 'cutter'], ['kitchen'], ['expeditions'], ['restaurant'], ['forge', 'dock', 'boat'],
]

/** An older v4's buildings with what its chapter had opened standing: a place a chapter opened stays open, built
 * (`buildings[id]` at least 1). Chapter 1's Mill plans (`buildings.mill` 0) are an unbuilt Mill now. */
export function chapterOpened(buildings: SaveV5['buildings'], chapter: number): SaveV5['buildings'] {
  const opened = CHAPTER_OPENED.slice(0, chapter + 1).flat().filter((id) => (buildings[id] ?? 0) < 1)
  return opened.length === 0 ? buildings : { ...buildings, ...Object.fromEntries(opened.map((id) => [id, 1])) }
}

/** The most characters the town's talks hold: master data's and the pack's sisters, with room to spare. */
const MAX_TOWN = 2000

/** You and each Uma: a character's (or a sister's) days talked, the last day talked (0 before any) and the last day
 * you gave her a gift (0 before any; an older v5's has none: 0), none after today. Grows in place: no migration, and
 * `updatedAt` never moves. An older v4 has none: none. */
function parseTown(value: unknown, path: string, today: number): Record<string, TownTalks> {
  if (value === undefined) return {}
  const raw = record(value, path)
  const ids = Object.keys(raw)
  if (ids.length > MAX_TOWN) fail(path, `at most ${MAX_TOWN}`)
  const out: Record<string, TownTalks> = {}
  for (const id of ids) {
    const at = `${path}.${id}`
    if (!TOWN_ID.test(id)) fail(at, 'expected a character id or a sister’s')
    const o = object(raw[id], at, ['talks', 'last', 'gift'])
    const talks = int(o.talks, `${at}.talks`, 0, today)
    const last = int(o.last, `${at}.last`, 0, today)
    if ((talks > 0) !== (last > 0)) fail(`${at}.talks`, 'expected days talked with the last day talked, or neither')
    const gift = o.gift === undefined ? 0 : int(o.gift, `${at}.gift`, 0, today)
    out[id] = { talks, last, gift }
  }
  return out
}

/** Parses a save v5. A `farm.chapter` and `farm.goals` (the global chapters') are ignored, what the chapter opened kept
 * standing (`chapterOpened`); a missing `farm.builds` is none, a missing `town` or `gallery` none, missing accounts (`farm.loans`,
 * `owed`, `short`, `income`) none, and a morning without its upkeep section (`summary.money`) has none. The ranch and the
 * digs from before their game read leniently: no silo is an empty one, an animal's older shape its fondness, and a dig's
 * fractional stairs whole (`parseRanch`, `parseDig`). */
export function parseSaveV5(value: unknown, path = 'save'): SaveV5 {
  const o = object(value, path, SAVE_V5_KEYS)
  if (o.version !== 5) fail(`${path}.version`, 'expected 5')
  const c = object(o.calendar, `${path}.calendar`, ['day'])
  const today = day(c.day, `${path}.calendar.day`)
  const roster = parseRoster(o.roster, `${path}.roster`, today)
  const ids = new Set(Object.keys(roster))
  const buildings = chapterOpened(parseBuildings(o.buildings, `${path}.buildings`), legacyChapter(o.farm))
  const homestead = parseHomestead(o.homestead, `${path}.homestead`, today, ids)
  const arrivals = unique(list(o.arrivals, `${path}.arrivals`, 0, ids.size).map((v, i) => member(v, `${path}.arrivals.${i}`, ids)), `${path}.arrivals`)
  const love = parseLoveAll(o.love, `${path}.love`, ids, today, homestead.houses.length)
  const save: SaveV5 = {
    version: 5,
    account: parseAccount(o.account, `${path}.account`),
    farmer: parseFarmer(o.farmer, `${path}.farmer`),
    calendar: { day: today },
    gold: count(o.gold, `${path}.gold`),
    today: parseToday(o.today, `${path}.today`, ids, today, marriedCount({ love })),
    roster,
    love,
    dorm: parseDorm(o.dorm, `${path}.dorm`, buildings.dorm),
    items: parseWarehouse(o.items, `${path}.items`, isStockId),
    bin: parseWarehouse(o.bin, `${path}.bin`, isGoodOrRingId),
    fields: parseFields(o.fields, `${path}.fields`),
    loads: parseLoads(o.loads, `${path}.loads`),
    crops: counts(o.crops, `${path}.crops`, isCropId, 'unknown crop') as Partial<Record<CropId, number>>,
    ranch: parseRanch(o.ranch, `${path}.ranch`),
    places: (() => {
      const p = object(o.places, `${path}.places`, ['mine', 'quarry'])
      return { mine: parseDig(p.mine, `${path}.places.mine`), quarry: parseDig(p.quarry, `${path}.places.quarry`) }
    })(),
    buildings,
    tools: parseTools(o.tools, `${path}.tools`),
    workshops: parseWorkshops(o.workshops, `${path}.workshops`, ids),
    expeditions: parseExpeditions(o.expeditions, `${path}.expeditions`, ids),
    ...(o.expeditionLog === undefined ? {} : { expeditionLog: list(o.expeditionLog, `${path}.expeditionLog`, 0, 20)
      .map((row, i) => parseExpeditionReturn(row, `${path}.expeditionLog.${i}`, ids)) }),
    bonds: parseBonds(o.bonds, `${path}.bonds`, ids),
    board: parseBoard(o.board, `${path}.board`),
    diary: parseDiary(o.diary, `${path}.diary`),
    farm: parseFarm(o.farm, `${path}.farm`, today),
    homestead,
    memories: parseMemories(o.memories, `${path}.memories`, ids),
    arrivals,
    gallery: parseGallery(o.gallery, `${path}.gallery`, ids),
    summary: o.summary === null ? null : parseSummary(o.summary, `${path}.summary`, today, ids, homestead.houses.length),
    town: parseTown(o.town, `${path}.town`, today),
  }
  // Booked dishes are still in stock until tonight. Refuse a save that would fail out of End the day.
  const reserved = new Map<string, number>()
  for (const party of save.expeditions.filter((e) => e.left === today)) {
    for (const key of party.supplies) {
      const dish = parseStockKey(key)
      if (!dish || !isDishId(dish.id)) continue
      const n = (reserved.get(key) ?? 0) + 1
      if (n > (save.items[dish.id]?.[dish.stars - 1] ?? 0)) fail(`${path}.expeditions`, 'not enough dishes reserved for tonight')
      reserved.set(key, n)
    }
  }
  parseRooms(save, path)
  parsePlotTasks(save, path)
  return save
}

/** A field task works a plot the farm has cleared. */
function parsePlotTasks(save: SaveV5, path: string): void {
  for (const field of ['carrotRows', 'fieldPlans'] as const) {
    for (const key of Object.keys(save.farm[field] ?? {})) {
      if (Number(key[0]) >= save.fields.plots.length) fail(`${path}.farm.${field}.${key}`, 'a plot the farm hasn’t cleared')
    }
  }
  const season = Math.floor((save.calendar.day - 1) / DAYS_PER_SEASON)
  for (const [plot, field] of save.fields.plots.entries()) {
    for (const [index, tile] of field.tiles.entries()) {
      if (tile.fruitSeason !== undefined && tile.fruitSeason > season) fail(`${path}.fields.plots.${plot}.tiles.${index}.fruitSeason`, 'after today')
    }
  }
  for (const [id, uma] of Object.entries(save.roster)) {
    (uma.tasks ?? []).forEach((task, i) => {
      if ('plot' in task && task.plot !== undefined && task.plot >= save.fields.plots.length) fail(`${path}.roster.${id}.tasks.${i}.plot`, 'a plot the farm hasn’t cleared')
    })
  }
}
