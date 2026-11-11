// Save v4's parse (F46 decision 7; romance spec RM10): as strict as v3's, whose parts it shares (`parse-loop.ts`). Unknown
// keys and v3-only keys (`start`, `visitors`, a roster Uma's `affinity`) are refused; roster keys are character ids by form
// (the API has no story pack or master data); `love` holds exactly the roster's keys, each in range; `memories` and
// `arrivals` name roster Umas; the farmer's name is empty or within RM8's rule; the Dorm is on its eight levels. Each later
// romance packet adds the checks for what it fills, while v4 grows in place (decision 1).
import { dateOf, FESTIVAL_IDS } from '../farm/calendar'
import { cleanFarmerName, farmerNameIssue } from '../romance/farmer'
import { isCropId, isGoodId, isWarehouseId, type CropId } from '../goods/ids'
import { LOOP_REQUESTS } from '../gathering/ids'
import type { HeartLine, MorningSummaryV4, NewsLineV4 } from '../night/summary'
import { bool, count, int, list, object, oneOf, parseAccount, record, text } from './parse'
import { pairKey } from './v3'
import {
  counts, day, fail, KEY, member, outfit, parseBinLines, parseBonds, parseBoard, parseBuildings, parseDiary, parseDig, parseDorm, parseExpeditions,
  parseFarm, parseFields, parseNewsLines, parseNudges, parseRanch, parseRankLines, parseRanks, parseTools, parseWarehouse, parseWork, parseWorkLines,
  parseWorkshops, unique, type LoopRequestKinds,
} from './parse-loop'
import { LOVE_STAGES, type Homestead, type Love, type RosterUmaV4, type SaveV4, type TodayV4 } from './v4'

export const SAVE_V4_KEYS = [
  'version', 'account', 'farmer', 'calendar', 'gold', 'today', 'roster', 'love', 'dorm', 'items', 'bin', 'work', 'fields', 'crops', 'ranch', 'places',
  'buildings', 'tools', 'workshops', 'expeditions', 'bonds', 'board', 'diary', 'farm', 'homestead', 'memories', 'arrivals', 'summary',
] as const

/** The homestead's houses: the Farmhouse and six (RM41). */
const MAX_HOUSES = 7
/** Events a route can hold: her arrival and 26 rungs, with room for later waves' extras. */
const MAX_MEMORIES = 64

// --- The roster and her route ----------------------------------------------------------------------------------------

function parseRoster(value: unknown, path: string, today: number): Record<string, RosterUmaV4> {
  const out: Record<string, RosterUmaV4> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    outfit(id, at)
    const u = object(raw, at, ['joined', 'ranks', 'wellFed'])
    const joined = day(u.joined, `${at}.joined`)
    if (joined > today) fail(`${at}.joined`, 'after today')
    out[id] = { joined, ranks: parseRanks(u.ranks, `${at}.ranks`), wellFed: count(u.wellFed, `${at}.wellFed`) }
  }
  return out
}

/** A day of hers that can't be after today: 0 is "never". */
const pastDay = (value: unknown, path: string, today: number): number => {
  const d = count(value, path)
  if (d > today) fail(path, 'after today')
  return d
}

const LOVE_KEYS = ['stage', 'level', 'points', 'last', 'friend', 'ring', 'wed', 'house', 'known', 'flags', 'evening', 'festivals'] as const

/** Her level's range on each stage (F47 decision 2): friendship and romance 0–9 (the tenth event moves her on), 10 while a
 * waiting rung waits, spouse 0–5. */
const LEVELS: Readonly<Record<Love['stage'], readonly [number, number]>> = {
  friendship: [0, 9], confession: [10, 10], romance: [0, 9], proposal: [10, 10], wedding: [10, 10], spouse: [0, 5],
}

/** A festival she's been at with you (F47 decision 9): `<festival>:<year>`, the year no later than this one. */
function festivalKey(value: unknown, path: string, year: number): string {
  const [festival, at] = typeof value === 'string' ? value.split(':') : []
  if (!(FESTIVAL_IDS as readonly string[]).includes(festival ?? '') || !/^[1-9]\d*$/.test(at ?? '') || Number(at) > year) fail(path, 'expected <festival>:<year>, this year or before')
  return value as string
}

/** Her route (RM10, decision 7; F47): her level in its stage's range; points whole and ≥ 0; `last` and `evening` no later
 * than today; `friend` only while the confession waits; `ring` only from the proposal on; `wed` and `house` only a
 * spouse's; festivals once each, by year. */
function parseLove(value: unknown, path: string, today: number, houses: number): Love {
  const o = object(value, path, LOVE_KEYS)
  const stage = oneOf(o.stage, `${path}.stage`, LOVE_STAGES)
  const [low, high] = LEVELS[stage]
  const love: Love = {
    stage, level: int(o.level, `${path}.level`, low, high), points: count(o.points, `${path}.points`),
    last: pastDay(o.last, `${path}.last`, today),
    known: unique(list(o.known, `${path}.known`, 0, 2000).map((g, i) => (typeof g === 'string' && isGoodId(g) ? g : fail(`${path}.known.${i}`, 'unknown good'))), `${path}.known`),
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
    if (!['proposal', 'wedding', 'spouse'].includes(stage)) fail(`${path}.ring`, 'only from the proposal on')
    love.ring = int(o.ring, `${path}.ring`, 0, 100)
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

function parseToday(value: unknown, path: string, roster: ReadonlySet<string>): TodayV4 {
  const o = object(value, path, ['chats', 'gifts', 'praise', 'praised', 'events', 'evenings', 'invites', 'bonds'])
  const umas = (raw: unknown, at: string) => unique(list(raw, at, 0, roster.size).map((v, i) => member(v, `${at}.${i}`, roster)), at)
  const kind = (v: unknown, at: string) => (typeof v === 'string' && KEY.test(v) ? v : fail(at, 'expected a kind'))
  return {
    chats: umas(o.chats, `${path}.chats`), gifts: umas(o.gifts, `${path}.gifts`), praise: umas(o.praise, `${path}.praise`),
    praised: umas(o.praised, `${path}.praised`), events: umas(o.events, `${path}.events`),
    evenings: list(o.evenings, `${path}.evenings`, 0, 2).map((v, i) => {
      const e = object(v, `${path}.evenings.${i}`, ['with', 'kind'])
      return { with: member(e.with, `${path}.evenings.${i}.with`, roster), kind: kind(e.kind, `${path}.evenings.${i}.kind`) }
    }),
    invites: unique(list(o.invites, `${path}.invites`, 0, 2).map((v, i) => {
      const at = `${path}.invites.${i}`
      const n = object(v, at, ['id', 'kind', 'answer'])
      const answer = n.answer === null ? null : oneOf(n.answer, `${at}.answer`, ['yes', 'no'] as const)
      return { id: member(n.id, `${at}.id`, roster), kind: kind(n.kind, `${at}.kind`), answer }
    }), `${path}.invites`, (n) => n.id),
    bonds: parseBondHeartsToday(o.bonds, `${path}.bonds`, roster),
  }
}

/** `today.bonds` (F52 decision 9): a pair of roster Umas by `pairKey` (numeric order), its hearts 0–5 before it first moved
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

function parseHomestead(value: unknown, path: string, today: number): Homestead {
  const o = object(value, path, ['houses', 'tonight', 'slept'])
  const houses = list(o.houses, `${path}.houses`, 1, MAX_HOUSES).map((v, i) => {
    const h = object(v, `${path}.houses.${i}`, ['name', 'extended'])
    const name = text(h.name, `${path}.houses.${i}.name`)
    if (name.length > 24) fail(`${path}.houses.${i}.name`, 'expected 1–24 characters')
    return { name, extended: bool(h.extended, `${path}.houses.${i}.extended`) }
  })
  const tonight = o.tonight === null ? null : int(o.tonight, `${path}.tonight`, 0, houses.length - 1)
  const slept = list(o.slept, `${path}.slept`, houses.length, houses.length).map((v, i) => pastDay(v, `${path}.slept.${i}`, today))
  return { houses, tonight, slept }
}

function parseFarmer(value: unknown, path: string): SaveV4['farmer'] {
  const o = object(value, path, ['name'])
  if (typeof o.name !== 'string') fail(`${path}.name`, 'expected a string')
  const name = o.name as string
  if (name !== '' && (farmerNameIssue(name) !== null || cleanFarmerName(name) !== name)) fail(`${path}.name`, 'expected 1–16 letters, spaces, apostrophes or hyphens')
  return { name }
}

// --- The morning (decision 15; F47) -----------------------------------------------------------------------------------------

/** §4 Hearts (F46 decision 15; F47 decision 14; F52 decisions 7 and 9): arrivals, birthdays and anniversaries, each an Uma
 * on the roster, once a kind each; an anniversary's item is a good on the day and null the day before; side by side once,
 * 1+ items; bond hearts 1–5 once a pair, two roster Umas in `pairKey` order. */
function parseHearts(value: unknown, path: string, roster: ReadonlySet<string>): HeartLine[] {
  const when = (v: unknown, at: string) => oneOf(v, at, ['today', 'tomorrow'] as const)
  const pairs = (roster.size * (roster.size - 1)) / 2
  return unique(list(value, path, 0, roster.size * 3 + pairs + 1).map((v, i): HeartLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['arrived', 'birthday', 'anniversary', 'side', 'bond'] as const)
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
  }), path, (h) => (h.kind === 'bond' ? `bond:${h.a}:${h.b}` : h.kind === 'side' ? 'side' : `${h.kind}:${h.id}`))
}

function parseSummaryV4(value: unknown, path: string, today: number, roster: ReadonlySet<string>): MorningSummaryV4 {
  const o = object(value, path, ['day', 'bin', 'work', 'ranks', 'hearts', 'news', 'nudges'])
  if (o.day !== today) fail(`${path}.day`, 'expected today: a summary is the morning it opens on')
  return {
    day: today, bin: parseBinLines(o.bin, `${path}.bin`), work: parseWorkLines(o.work, `${path}.work`), ranks: parseRankLines(o.ranks, `${path}.ranks`, roster),
    hearts: parseHearts(o.hearts, `${path}.hearts`, roster), news: parseNewsLines(o.news, `${path}.news`, roster, 4) as NewsLineV4[],
    nudges: parseNudges(o.nudges, `${path}.nudges`, roster),
  }
}

/** Parses a save v4. `kinds` is the work kinds' requests (`LOOP_REQUESTS`; tests pass their own kinds). */
export function parseSaveV4(value: unknown, path = 'save', kinds: LoopRequestKinds = LOOP_REQUESTS): SaveV4 {
  const o = object(value, path, SAVE_V4_KEYS)
  if (o.version !== 4) fail(`${path}.version`, 'expected 4')
  const c = object(o.calendar, `${path}.calendar`, ['day'])
  const today = day(c.day, `${path}.calendar.day`)
  const roster = parseRoster(o.roster, `${path}.roster`, today)
  const ids = new Set(Object.keys(roster))
  const buildings = parseBuildings(o.buildings, `${path}.buildings`, 4)
  const homestead = parseHomestead(o.homestead, `${path}.homestead`, today)
  const arrivals = unique(list(o.arrivals, `${path}.arrivals`, 0, ids.size).map((v, i) => member(v, `${path}.arrivals.${i}`, ids)), `${path}.arrivals`)
  return {
    version: 4,
    account: parseAccount(o.account, `${path}.account`),
    farmer: parseFarmer(o.farmer, `${path}.farmer`),
    calendar: { day: today },
    gold: count(o.gold, `${path}.gold`),
    today: parseToday(o.today, `${path}.today`, ids),
    roster,
    love: parseLoveAll(o.love, `${path}.love`, ids, today, homestead.houses.length),
    dorm: parseDorm(o.dorm, `${path}.dorm`, ids, buildings.dorm, 4),
    items: parseWarehouse(o.items, `${path}.items`, isWarehouseId),
    bin: parseWarehouse(o.bin, `${path}.bin`, isGoodId),
    work: parseWork(o.work, `${path}.work`, ids, kinds),
    fields: parseFields(o.fields, `${path}.fields`, ids),
    crops: counts(o.crops, `${path}.crops`, isCropId, 'unknown crop') as Partial<Record<CropId, number>>,
    ranch: parseRanch(o.ranch, `${path}.ranch`, ids),
    places: (() => {
      const p = object(o.places, `${path}.places`, ['mine', 'quarry'])
      return { mine: parseDig(p.mine, `${path}.places.mine`), quarry: parseDig(p.quarry, `${path}.places.quarry`) }
    })(),
    buildings,
    tools: parseTools(o.tools, `${path}.tools`),
    workshops: parseWorkshops(o.workshops, `${path}.workshops`, ids),
    expeditions: parseExpeditions(o.expeditions, `${path}.expeditions`, ids),
    bonds: parseBonds(o.bonds, `${path}.bonds`, ids, count),
    board: parseBoard(o.board, `${path}.board`),
    diary: parseDiary(o.diary, `${path}.diary`),
    farm: parseFarm(o.farm, `${path}.farm`),
    homestead,
    memories: parseMemories(o.memories, `${path}.memories`, ids),
    arrivals,
    summary: o.summary === null ? null : parseSummaryV4(o.summary, `${path}.summary`, today, ids),
  }
}
