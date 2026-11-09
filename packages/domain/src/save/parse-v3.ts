// Save v3's parse (F17; core spec CS53): strict keys, explicit paths, every id checked. Outfit ids are checked by form, as
// in v2: the API has no master data, and an outfit a later release drops still parses.
import type { DroppedQueue, Entry, ItemQty, LastWork, Refusal, SlotRef, WorkKindRules, WorkOutput, WorkRow } from '@luismlorenzana/uma-work'
import { FESTIVAL_IDS, SEASONS } from '../farm/calendar'
import { bedsAt, DORM_MAX_LEVEL } from '../farm/farm'
import { ACTIVITIES, type Activity, type Rank } from '../farm/ranks'
import { GOOD_IDS, isCropId, isGoodId, isSeedId, isWarehouseId, type CropId } from '../goods/ids'
import type { BinSale, MorningSummary, NewsLine, Nudge, WorkLine } from '../night/summary'
import { isOutfitId } from '../roster/roster'
import type { LoopWorld } from '../work/loop-env'
import {
  amount, bool, count, int, list, object, oneOf, parseAccount, positive, record, SaveParseError, type Obj,
} from './parse'
import {
  ANIMAL_HOME, ANIMAL_KINDS, BLOCK_IDS, BUILDING_IDS, BUILDING_MAX_LEVEL, DEEPEST_FLOOR, EXTRA_KINDS, isDishId, pairKey, PLOTS_PER_BLOCK,
  REGION_IDS, TOOL_IDS, VISITOR_FROM, WORKSHOP_IDS, type Animal, type Block, type BoardRequest, type BuildingId, type Dig, type DormSwap,
  type Expedition, type Extra, type FestivalResult, type LoopWorkRequest, type Plot, type RankState, type RosterUma, type SaveV3, type StarCounts,
  type ToolId, type ToolTier, type Visitor, type Warehouse, type WorkshopId,
} from './v3'
import { MAX_STARS, parseStockKey } from './warehouse'

export const SAVE_V3_KEYS = [
  'version', 'account', 'calendar', 'gold', 'start', 'today', 'roster', 'dorm', 'visitors', 'items', 'bin', 'work', 'fields', 'crops', 'ranch',
  'places', 'buildings', 'tools', 'workshops', 'expeditions', 'bonds', 'board', 'diary', 'farm', 'summary',
] as const

/** The places v3 work rows sit at (decision 11): the forest, the Fishery and their stations in M4; the Mine, the Quarry and
 * theirs from M5. Four slots each (D24 #13). */
export const LOOP_WORK_PLACES = ['forest', 'fishery', 'mill', 'sawmill', 'smokehouse', 'mine', 'quarry', 'smelter', 'cutter'] as const
export type LoopPlaceId = typeof LOOP_WORK_PLACES[number]
export const LOOP_SLOTS = 4

/** A v3 work kind (F17 decision 11, F18): the places it works at, its request's parse (strict keys, its own ids; a
 * `SaveParseError` with the path when wrong), its rules on uma-work's day clock (`farmEnvV3`), and whether it runs for
 * days at a time. F22 fills `LOOP_KINDS`. */
export interface LoopKind {
  readonly places: readonly LoopPlaceId[]
  parseRequest(value: Obj, path: string): LoopWorkRequest
  /** How it plans and pays (uma-work's kind rules), over the loop's world. */
  readonly rules: WorkKindRules<LoopWorld>
  /** A multi-day kind (making; in M4 the Mill's preserves; later expeditions): a well-fed Uma's running entry gains a
   * quarter day a night (CS22, F18 decision 4). A 1-day kind's plan takes ×1.25 items instead (F22). */
  readonly multiDay: boolean
}
export type LoopKinds = Readonly<Record<string, LoopKind>>
/** The loop's work kinds, by kind. Empty until F22: a v3 save has no work until then. */
export const LOOP_KINDS: LoopKinds = {}

/** Up to three requests wait behind the running one (the engine's MAX_QUEUE); four started entries at most. */
const MAX_QUEUED = 3
const MAX_ENTRIES = MAX_QUEUED + 1
/** The most items one entry makes: well past a Legend's day at the forest (CS17). */
const MAX_ENTRY_ITEMS = 200
/** Ids the save names itself (requests, milestones, animals, records): short kebab words, colons allowed. */
const KEY = /^[a-z0-9][a-z0-9:._-]{0,63}$/

const fail = (path: string, message: string): never => {
  throw new SaveParseError(path, message)
}

function key(value: unknown, path: string): string {
  if (typeof value !== 'string' || !KEY.test(value)) fail(path, 'expected an id')
  return value as string
}
function outfit(value: unknown, path: string): string {
  if (typeof value !== 'string' || !isOutfitId(value)) fail(path, 'outfit ids are positive integers')
  return value as string
}
/** An outfit on the roster (or among `word`'s set). */
function member(value: unknown, path: string, roster: ReadonlySet<string>, word = 'expected an Uma on the roster'): string {
  const id = outfit(value, path)
  if (!roster.has(id)) fail(path, word)
  return id
}
/** A farm day, 1 or later. */
const day = (value: unknown, path: string): number => {
  const d = count(value, path)
  if (d < 1) fail(path, 'expected a day from 1')
  return d
}
/** A list with no repeats. */
function unique<T>(items: T[], path: string, keyOf: (item: T) => string = String): T[] {
  const seen = new Set<string>()
  items.forEach((item, i) => {
    const k = keyOf(item)
    if (seen.has(k)) fail(`${path}.${i}`, 'repeated')
    seen.add(k)
  })
  return items
}
/** A record of counts (or amounts) whose keys `check` accepts. */
function counts(value: unknown, path: string, check: (id: string) => boolean, word: string, parse = count): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, n] of Object.entries(record(value, path))) {
    if (!check(id)) fail(`${path}.${id}`, word)
    out[id] = parse(n, `${path}.${id}`)
  }
  return out
}

// --- The roster -----------------------------------------------------------------------------------------------------

function parseRanks(value: unknown, path: string): Record<Activity, RankState> {
  const o = object(value, path, ACTIVITIES)
  return Object.fromEntries(ACTIVITIES.map((a) => {
    const at = `${path}.${a}`
    const r = object(o[a], at, ['points', 'rank', 'challenge'])
    return [a, { points: amount(r.points, `${at}.points`), rank: int(r.rank, `${at}.rank`, 0, 5) as Rank, challenge: count(r.challenge, `${at}.challenge`) }]
  })) as Record<Activity, RankState>
}

function parseRoster(value: unknown, path: string, today: number): Record<string, RosterUma> {
  const out: Record<string, RosterUma> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    outfit(id, at)
    const u = object(raw, at, ['joined', 'ranks', 'affinity', 'wellFed'])
    const joined = day(u.joined, `${at}.joined`)
    if (joined > today) fail(`${at}.joined`, 'after today')
    out[id] = { joined, ranks: parseRanks(u.ranks, `${at}.ranks`), affinity: amount(u.affinity, `${at}.affinity`), wellFed: count(u.wellFed, `${at}.wellFed`) }
  }
  return out
}

function parseDorm(value: unknown, path: string, roster: ReadonlySet<string>, bought: number | undefined): SaveV3['dorm'] {
  const o = object(value, path, ['level', 'home', 'swaps'])
  const level = int(o.level, `${path}.level`, 1, DORM_MAX_LEVEL)
  if (bought === undefined || level > bought) fail(`${path}.level`, 'above the level bought (buildings.dorm)')
  const home = unique(list(o.home, `${path}.home`, 0, bedsAt(level)).map((v, i) => member(v, `${path}.home.${i}`, roster)), `${path}.home`)
  const atHome = new Set(home)
  const swaps = list(o.swaps, `${path}.swaps`, 0, bedsAt(DORM_MAX_LEVEL)).map((v, i): DormSwap => {
    const at = `${path}.swaps.${i}`
    const s = object(v, at, ['out', 'in'])
    const out = member(s.out, `${at}.out`, roster)
    const into = member(s.in, `${at}.in`, roster)
    if (!atHome.has(out)) fail(`${at}.out`, 'expected an Uma at home')
    if (atHome.has(into)) fail(`${at}.in`, 'expected an Uma away')
    return { out, in: into }
  })
  unique(swaps, `${path}.swaps`, (s) => s.out)
  unique(swaps, `${path}.swaps`, (s) => s.in)
  return { level, home, swaps }
}

function parseVisitors(value: unknown, path: string, roster: ReadonlySet<string>): Visitor[] {
  return unique(list(value, path, 0, 60).map((v, i): Visitor => {
    const at = `${path}.${i}`
    const o = object(v, at, ['outfitId', 'from', 'leaves', 'affinity'])
    const id = outfit(o.outfitId, `${at}.outfitId`)
    if (roster.has(id)) fail(`${at}.outfitId`, 'already on the roster')
    return { outfitId: id, from: oneOf(o.from, `${at}.from`, VISITOR_FROM), leaves: day(o.leaves, `${at}.leaves`), affinity: amount(o.affinity, `${at}.affinity`) }
  }), path, (v) => v.outfitId)
}

// --- The Warehouse --------------------------------------------------------------------------------------------------

/** Rows of star counts; rows of all zeros are dropped, and seeds hold ★1 only. */
function parseWarehouse(value: unknown, path: string, check: (id: string) => boolean): Warehouse {
  const out: Warehouse = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    if (!check(id)) fail(at, 'unknown item')
    const row = list(raw, at, MAX_STARS, MAX_STARS).map((n, i) => count(n, `${at}.${i}`)) as StarCounts
    if (isSeedId(id) && row.slice(1).some((n) => n > 0)) fail(at, 'seeds are ★1 only')
    if (row.some((n) => n > 0)) out[id] = row
  }
  return out
}

// --- Work (decision 11): uma-work's rows at the v3 places, their stock keys, and each kind's own requests --------------

function stock(value: unknown, path: string): string {
  if (typeof value !== 'string' || !parseStockKey(value)) fail(path, 'expected a stock key <id>@<stars>')
  return value as string
}

function parseSlot(value: unknown, path: string): SlotRef {
  const o = object(value, path, ['building', 'slot'])
  const building = oneOf(o.building, `${path}.building`, LOOP_WORK_PLACES)
  return { building, slot: int(o.slot, `${path}.slot`, 0, LOOP_SLOTS - 1) }
}

function parseRequest(value: unknown, path: string, slot: SlotRef, kinds: LoopKinds): LoopWorkRequest {
  const o = record(value, path)
  const kind = typeof o.kind === 'string' && Object.hasOwn(kinds, o.kind) ? kinds[o.kind]! : fail(`${path}.kind`, 'unknown kind')
  if (!(kind.places as readonly string[]).includes(slot.building)) fail(`${path}.kind`, 'not worked at this place')
  return kind.parseRequest(o, path)
}

function parseQty(value: unknown, path: string): ItemQty {
  const o = object(value, path, ['item', 'qty'])
  const qty = count(o.qty, `${path}.qty`)
  if (qty < 1) fail(`${path}.qty`, 'expected at least 1')
  return { item: stock(o.item, `${path}.item`), qty }
}

const ENTRY_KEYS = ['request', 'seconds', 'inputs', 'outputs', 'exp', 'startedAt', 'acceleratedMs', 'collected', 'speed', 'fromQueue'] as const

function parseEntry(value: unknown, path: string, slot: SlotRef, kinds: LoopKinds): Entry<LoopWorkRequest> {
  const e = object(value, path, ENTRY_KEYS)
  const request = parseRequest(e.request, `${path}.request`, slot, kinds)
  const seconds = list(e.seconds, `${path}.seconds`, 1, MAX_ENTRY_ITEMS).map((v, i) => positive(v, `${path}.seconds.${i}`))
  const n = seconds.length
  const each = <T>(raw: unknown, k: string, parse: (v: unknown, at: string) => T): T[] => list(raw, `${path}.${k}`, n, n).map((v, i) => parse(v, `${path}.${k}.${i}`))
  const inputs = each(e.inputs, 'inputs', (v, at) => list(v, at, 0, 8).map((q, j) => parseQty(q, `${at}.${j}`)))
  const outputs = each(e.outputs, 'outputs', (v, at): WorkOutput => ({ item: stock(object(v, at, ['item']).item, `${at}.item`) }))
  const exp = each(e.exp, 'exp', count)
  const collected = count(e.collected, `${path}.collected`)
  if (collected > n) fail(`${path}.collected`, 'more than the entry makes')
  return { request, seconds, inputs, outputs, exp, startedAt: count(e.startedAt, `${path}.startedAt`), acceleratedMs: count(e.acceleratedMs, `${path}.acceleratedMs`),
    collected, speed: positive(e.speed, `${path}.speed`), fromQueue: bool(e.fromQueue, `${path}.fromQueue`) }
}

function parseRefusal(value: unknown, path: string): Refusal | null {
  if (value === null) return null
  const o = object(value, path, ['refused', 'code', 'message', 'data'])
  if (o.refused !== true || typeof o.code !== 'string' || typeof o.message !== 'string') fail(path, 'expected a refusal')
  const base = { refused: true as const, code: o.code as string, message: o.message as string }
  if (o.data === undefined) return base
  const data = record(o.data, `${path}.data`)
  if (Object.values(data).some((v) => typeof v !== 'string' && typeof v !== 'number')) fail(`${path}.data`, 'expected strings and numbers')
  return { ...base, data: data as Record<string, string | number> }
}

function parseDropped(value: unknown, path: string, kinds: LoopKinds): DroppedQueue<LoopWorkRequest> | null {
  if (value === null) return null
  const d = object(value, path, ['at', 'slot', 'requests', 'short', 'refused'])
  const slot = parseSlot(d.slot, `${path}.slot`)
  return {
    at: count(d.at, `${path}.at`), slot,
    requests: list(d.requests, `${path}.requests`, 1, MAX_QUEUED + 1).map((r, i) => parseRequest(r, `${path}.requests.${i}`, slot, kinds)),
    short: list(d.short, `${path}.short`, 0, 8).map((q, i) => parseQty(q, `${path}.short.${i}`)),
    refused: parseRefusal(d.refused, `${path}.refused`),
  }
}

function parseLast(value: unknown, path: string, kinds: LoopKinds): LastWork<LoopWorkRequest> | null {
  if (value === null) return null
  const l = object(value, path, ['slot', 'request'])
  const slot = parseSlot(l.slot, `${path}.slot`)
  return { slot, request: parseRequest(l.request, `${path}.request`, slot, kinds) }
}

function parseWork(value: unknown, path: string, roster: ReadonlySet<string>, kinds: LoopKinds): Record<string, WorkRow<LoopWorkRequest>> {
  const out: Record<string, WorkRow<LoopWorkRequest>> = {}
  const held = new Set<string>()
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    member(id, at, roster)
    const r = object(raw, at, ['outfitId', 'slot', 'entries', 'queue', 'last', 'dropped'])
    if (r.outfitId !== id) fail(`${at}.outfitId`, 'expected its own key')
    const slot = r.slot === null ? null : parseSlot(r.slot, `${at}.slot`)
    const entries = list(r.entries, `${at}.entries`, 0, MAX_ENTRIES)
    const queue = list(r.queue, `${at}.queue`, 0, MAX_QUEUED)
    if (!slot && (entries.length > 0 || queue.length > 0)) fail(`${at}.slot`, 'work needs a slot')
    if (slot && entries.length > 0) {
      const k = `${slot.building}:${slot.slot}`
      if (held.has(k)) fail(`${at}.slot`, 'already held')
      held.add(k)
    }
    out[id] = {
      outfitId: id, slot,
      entries: entries.map((e, i) => parseEntry(e, `${at}.entries.${i}`, slot!, kinds)),
      queue: queue.map((q, i) => parseRequest(q, `${at}.queue.${i}`, slot!, kinds)),
      last: parseLast(r.last, `${at}.last`, kinds), dropped: parseDropped(r.dropped, `${at}.dropped`, kinds),
    }
  }
  return out
}

// --- The fields, the ranch, the places, buildings and tools ----------------------------------------------------------

function parsePlot(value: unknown, path: string): Plot {
  const o = object(value, path, ['crop', 'growth', 'ready', 'regrowing', 'own'])
  const crop = o.crop === null ? null : typeof o.crop === 'string' && isCropId(o.crop) ? o.crop : fail(`${path}.crop`, 'unknown crop')
  const plot: Plot = { crop, growth: amount(o.growth, `${path}.growth`), ready: bool(o.ready, `${path}.ready`), regrowing: bool(o.regrowing, `${path}.regrowing`),
    own: bool(o.own, `${path}.own`) }
  if (!crop && (plot.growth > 0 || plot.ready || plot.regrowing || plot.own)) fail(path, 'an empty plot holds nothing')
  return plot
}

function parseFields(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['fields'] {
  const o = object(value, path, ['blocks'])
  const blocks = list(o.blocks, `${path}.blocks`, 1, BLOCK_IDS.length).map((v, i): Block => {
    const at = `${path}.blocks.${i}`
    const b = object(v, at, ['id', 'tender', 'plots'])
    return {
      id: oneOf(b.id, `${at}.id`, BLOCK_IDS), tender: b.tender === null ? null : member(b.tender, `${at}.tender`, roster),
      plots: list(b.plots, `${at}.plots`, PLOTS_PER_BLOCK, PLOTS_PER_BLOCK).map((p, j) => parsePlot(p, `${at}.plots.${j}`)),
    }
  })
  blocks.forEach((b, i) => {
    if (i > 0 && BLOCK_IDS.indexOf(b.id) <= BLOCK_IDS.indexOf(blocks[i - 1]!.id)) fail(`${path}.blocks.${i}.id`, 'blocks run A, B, C, D, each once')
  })
  unique(blocks.filter((b) => b.tender !== null), `${path}.blocks`, (b) => b.tender!)
  return { blocks }
}

function parseRanch(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['ranch'] {
  const o = object(value, path, ['animals'])
  const animals = list(o.animals, `${path}.animals`, 0, 28).map((v, i): Animal => {
    const at = `${path}.animals.${i}`
    const a = object(v, at, ['id', 'kind', 'building', 'affection', 'streak', 'carer', 'next'])
    const kind = oneOf(a.kind, `${at}.kind`, ANIMAL_KINDS)
    const building = oneOf(a.building, `${at}.building`, ['coop', 'barn'] as const)
    if (building !== ANIMAL_HOME[kind]) fail(`${at}.building`, `a ${kind} lives in the ${ANIMAL_HOME[kind]}`)
    return { id: key(a.id, `${at}.id`), kind, building, affection: amount(a.affection, `${at}.affection`), streak: count(a.streak, `${at}.streak`),
      carer: a.carer === null ? null : member(a.carer, `${at}.carer`, roster), next: count(a.next, `${at}.next`) }
  })
  return { animals: unique(animals, `${path}.animals`, (a) => a.id) }
}

function parseDig(value: unknown, path: string): Dig {
  const o = object(value, path, ['deepest', 'stairs'])
  return { deepest: int(o.deepest, `${path}.deepest`, 0, DEEPEST_FLOOR), stairs: amount(o.stairs, `${path}.stairs`) }
}

function parseBuildings(value: unknown, path: string): Partial<Record<BuildingId, number>> {
  const out: Partial<Record<BuildingId, number>> = {}
  for (const [id, level] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    const building = oneOf(id, at, BUILDING_IDS)
    out[building] = int(level, at, 0, building === 'dorm' ? DORM_MAX_LEVEL : BUILDING_MAX_LEVEL)
  }
  if (!out.dorm) fail(`${path}.dorm`, 'the Dorm is built from day 1')
  return out
}

function parseTools(value: unknown, path: string): Record<ToolId, ToolTier> {
  const o = object(value, path, TOOL_IDS)
  return Object.fromEntries(TOOL_IDS.map((t) => [t, int(o[t], `${path}.${t}`, 1, 5) as ToolTier])) as Record<ToolId, ToolTier>
}

function parseWorkshops(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['workshops'] {
  const o = object(value, path, ['played', 'current', 'recipes', 'best'])
  const p = object(o.played, `${path}.played`, WORKSHOP_IDS)
  const played = Object.fromEntries(WORKSHOP_IDS.map((w) => [w, count(p[w], `${path}.played.${w}`)])) as Record<WorkshopId, number>
  let current: SaveV3['workshops']['current'] = null
  if (o.current !== null) {
    const c = object(o.current, `${path}.current`, ['workshop', 'assistant', 'day'])
    current = { workshop: oneOf(c.workshop, `${path}.current.workshop`, WORKSHOP_IDS), assistant: member(c.assistant, `${path}.current.assistant`, roster),
      day: day(c.day, `${path}.current.day`) }
  }
  const recipes = unique(list(o.recipes, `${path}.recipes`, 0, 80).map((v, i) => (typeof v === 'string' && isDishId(v) ? v : fail(`${path}.recipes.${i}`, 'unknown dish'))), `${path}.recipes`)
  return { played, current, recipes, best: counts(o.best, `${path}.best`, (k) => KEY.test(k), 'expected an id', amount) }
}

function parseExpeditions(value: unknown, path: string, roster: ReadonlySet<string>): Expedition[] {
  const out = list(value, path, 0, 3).map((v, i): Expedition => {
    const at = `${path}.${i}`
    const e = object(v, at, ['region', 'party', 'supplies', 'left', 'back'])
    const party = unique(list(e.party, `${at}.party`, 1, 4).map((m, j) => member(m, `${at}.party.${j}`, roster)), `${at}.party`)
    const supplies = list(e.supplies, `${at}.supplies`, 0, 8).map((s, j) => (typeof s === 'string' && isWarehouseId(s) ? s : fail(`${at}.supplies.${j}`, 'unknown item')))
    const left = day(e.left, `${at}.left`)
    const back = day(e.back, `${at}.back`)
    if (back <= left) fail(`${at}.back`, 'expected after the day it left')
    return { region: oneOf(e.region, `${at}.region`, REGION_IDS), party, supplies, left, back }
  })
  unique(out.flatMap((e) => e.party), path)
  return out
}

function parseBonds(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, number> {
  return counts(value, path, (k) => {
    const [a, b, ...rest] = k.split(':')
    return rest.length === 0 && !!a && !!b && a !== b && roster.has(a) && roster.has(b) && pairKey(a, b) === k
  }, 'expected two roster ids in numeric order, idA:idB', amount)
}

function parseExtra(value: unknown, path: string): Extra | null {
  if (value === null) return null
  const o = object(value, path, ['kind', 'id'])
  const kind = oneOf(o.kind, `${path}.kind`, EXTRA_KINDS)
  const id = typeof o.id === 'string' ? o.id : ''
  const ok = kind === 'recipe' ? isDishId(id) : kind === 'seeds' ? isSeedId(id) : kind === 'animal' ? (ANIMAL_KINDS as readonly string[]).includes(id) : isOutfitId(id)
  if (!ok) fail(`${path}.id`, `expected the ${kind}'s id`)
  return { kind, id }
}

function parseBoard(value: unknown, path: string): BoardRequest[] {
  return unique(list(value, path, 0, 5).map((v, i): BoardRequest => {
    const at = `${path}.${i}`
    const r = object(v, at, ['id', 'from', 'item', 'count', 'stars', 'due', 'reward', 'extra'])
    const item = typeof r.item === 'string' && isGoodId(r.item) ? r.item : fail(`${at}.item`, 'unknown good')
    return { id: key(r.id, `${at}.id`), from: key(r.from, `${at}.from`), item, count: int(r.count, `${at}.count`, 1, 99), stars: int(r.stars, `${at}.stars`, 1, MAX_STARS),
      due: day(r.due, `${at}.due`), reward: count(r.reward, `${at}.reward`), extra: parseExtra(r.extra, `${at}.extra`) }
  }), path, (r) => r.id)
}

function keys(value: unknown, path: string): string[] {
  return unique(list(value, path, 0, 2000).map((v, i) => key(v, `${path}.${i}`)), path)
}

function parseDiary(value: unknown, path: string): SaveV3['diary'] {
  const o = object(value, path, ['shipped', 'milestones', 'records', 'read'])
  return {
    shipped: counts(o.shipped, `${path}.shipped`, isGoodId, 'unknown good'),
    milestones: keys(o.milestones, `${path}.milestones`),
    records: counts(o.records, `${path}.records`, (k) => KEY.test(k), 'expected an id', amount),
    read: keys(o.read, `${path}.read`),
  }
}

function parseFarm(value: unknown, path: string): SaveV3['farm'] {
  const o = object(value, path, ['points', 'chapter', 'goals', 'festivals', 'counts'])
  const festivals = list(o.festivals, `${path}.festivals`, 0, 1000).map((v, i): FestivalResult => {
    const at = `${path}.festivals.${i}`
    const f = object(v, at, ['id', 'day', 'score', 'place'])
    return { id: key(f.id, `${at}.id`), day: day(f.day, `${at}.day`), score: amount(f.score, `${at}.score`), place: int(f.place, `${at}.place`, 1, 3) as 1 | 2 | 3 }
  })
  return {
    points: count(o.points, `${path}.points`), chapter: int(o.chapter, `${path}.chapter`, 1, 9),
    goals: counts(o.goals, `${path}.goals`, (k) => KEY.test(k), 'expected an id'), festivals,
    counts: counts(o.counts, `${path}.counts`, (k) => KEY.test(k), 'expected an id'),
  }
}

// --- The morning summary (F18 decision 11): ids and counts only, the morning it was built for ---------------------

const none = (value: unknown, path: string): [] => list(value, path, 0, 0) as []

function parseSummary(value: unknown, path: string, today: number, roster: ReadonlySet<string>): MorningSummary {
  const o = object(value, path, ['day', 'bin', 'work', 'ranks', 'bonds', 'news', 'nudges'])
  if (o.day !== today) fail(`${path}.day`, 'expected today: a summary is the morning it opens on')
  // The bin (F19): a good at one star once, a whole count and gold; the gold isn't re-priced (a later price can't break it).
  const bin = unique(list(o.bin, `${path}.bin`, 0, GOOD_IDS.length * MAX_STARS).map((v, i): BinSale => {
    const at = `${path}.bin.${i}`
    const b = object(v, at, ['kind', 'id', 'stars', 'count', 'gold', 'demand'])
    oneOf(b.kind, `${at}.kind`, ['sold'] as const)
    const id = typeof b.id === 'string' && isGoodId(b.id) ? b.id : fail(`${at}.id`, 'unknown good')
    return {
      kind: 'sold', id, stars: int(b.stars, `${at}.stars`, 1, MAX_STARS), count: int(b.count, `${at}.count`, 1, Number.MAX_SAFE_INTEGER), gold: count(b.gold, `${at}.gold`),
      demand: bool(b.demand, `${at}.demand`),
    }
  }), `${path}.bin`, (b) => `${b.id}@${b.stars}`)
  // Work done: jobs by place (F18); crops ready by block and what withered, by block and crop (F20). A plot count is 1–9.
  const plots = (value: unknown, at: string) => int(value, at, 1, PLOTS_PER_BLOCK)
  const work = unique(list(o.work, `${path}.work`, 0, LOOP_WORK_PLACES.length + BLOCK_IDS.length * (1 + PLOTS_PER_BLOCK)).map((v, i): WorkLine => {
    const at = `${path}.work.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['jobs', 'crops', 'withered'] as const)
    if (kind === 'crops') {
      const c = object(v, at, ['kind', 'block', 'plots'])
      return { kind, block: oneOf(c.block, `${at}.block`, BLOCK_IDS), plots: plots(c.plots, `${at}.plots`) }
    }
    if (kind === 'withered') {
      const c = object(v, at, ['kind', 'block', 'crop', 'plots'])
      const crop = typeof c.crop === 'string' && isCropId(c.crop) ? c.crop : fail(`${at}.crop`, 'unknown crop')
      return { kind, block: oneOf(c.block, `${at}.block`, BLOCK_IDS), crop, plots: plots(c.plots, `${at}.plots`) }
    }
    const w = object(v, at, ['kind', 'place', 'jobs', 'items'])
    return { kind, place: oneOf(w.place, `${at}.place`, LOOP_WORK_PLACES), jobs: int(w.jobs, `${at}.jobs`, 1, 4 * 60), items: count(w.items, `${at}.items`) }
  }), `${path}.work`, (w) => (w.kind === 'jobs' ? `jobs:${w.place}` : w.kind === 'crops' ? `crops:${w.block}` : `withered:${w.block}:${w.crop}`))
  const ranks = none(o.ranks, `${path}.ranks`)
  const bonds = none(o.bonds, `${path}.bonds`)
  const news = unique(list(o.news, `${path}.news`, 0, 8).map((v, i): NewsLine => {
    const at = `${path}.news.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['season', 'festival'] as const)
    if (kind === 'season') return { kind, season: oneOf(object(v, at, ['kind', 'season']).season, `${at}.season`, SEASONS) }
    const f = object(v, at, ['kind', 'festival', 'when'])
    return { kind, festival: oneOf(f.festival, `${at}.festival`, FESTIVAL_IDS), when: oneOf(f.when, `${at}.when`, ['today', 'tomorrow'] as const) }
  }), `${path}.news`, (n) => (n.kind === 'season' ? 'season' : `festival:${n.when}`))
  const nudges = unique(list(o.nudges, `${path}.nudges`, 0, 4).map((v, i): Nudge => {
    const at = `${path}.nudges.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['idle', 'seeds'] as const)
    if (kind === 'seeds') return { kind, plots: int(object(v, at, ['kind', 'plots']).plots, `${at}.plots`, 1, BLOCK_IDS.length * PLOTS_PER_BLOCK) }
    const n = object(v, at, ['kind', 'umas'])
    return { kind, umas: unique(list(n.umas, `${at}.umas`, 1, roster.size).map((id, j) => member(id, `${at}.umas.${j}`, roster)), `${at}.umas`) }
  }), `${path}.nudges`, (n) => n.kind)
  return { day: today, bin, work, ranks, bonds, news, nudges }
}

/** Parses a save v3. `kinds` is the work kinds' registry (`LOOP_KINDS`; tests pass their own). */
export function parseSaveV3(value: unknown, path = 'save', kinds: LoopKinds = LOOP_KINDS): SaveV3 {
  const o = object(value, path, SAVE_V3_KEYS)
  if (o.version !== 3) fail(`${path}.version`, 'expected 3')
  const c = object(o.calendar, `${path}.calendar`, ['day'])
  const today = day(c.day, `${path}.calendar.day`)
  const roster = parseRoster(o.roster, `${path}.roster`, today)
  const ids = new Set(Object.keys(roster))
  const buildings = parseBuildings(o.buildings, `${path}.buildings`)
  const s = object(o.start, `${path}.start`, ['redraws'])
  const t = object(o.today, `${path}.today`, ['chats', 'gifts'])
  const visitors = parseVisitors(o.visitors, `${path}.visitors`, ids)
  const met = new Set([...ids, ...visitors.map((v) => v.outfitId)])
  const talked = (raw: unknown, at: string) => unique(list(raw, at, 0, met.size).map((v, i) => member(v, `${at}.${i}`, met, 'expected an Uma on the roster or a visitor')), at)
  const crops = counts(o.crops, `${path}.crops`, isCropId, 'unknown crop') as Partial<Record<CropId, number>>
  return {
    version: 3,
    account: parseAccount(o.account, `${path}.account`),
    calendar: { day: today },
    gold: count(o.gold, `${path}.gold`),
    start: { redraws: count(s.redraws, `${path}.start.redraws`) },
    today: { chats: talked(t.chats, `${path}.today.chats`), gifts: talked(t.gifts, `${path}.today.gifts`) },
    roster,
    dorm: parseDorm(o.dorm, `${path}.dorm`, ids, buildings.dorm),
    visitors,
    items: parseWarehouse(o.items, `${path}.items`, isWarehouseId),
    bin: parseWarehouse(o.bin, `${path}.bin`, isGoodId),
    work: parseWork(o.work, `${path}.work`, ids, kinds),
    fields: parseFields(o.fields, `${path}.fields`, ids),
    crops,
    ranch: parseRanch(o.ranch, `${path}.ranch`, ids),
    places: (() => {
      const p = object(o.places, `${path}.places`, ['mine', 'quarry'])
      return { mine: parseDig(p.mine, `${path}.places.mine`), quarry: parseDig(p.quarry, `${path}.places.quarry`) }
    })(),
    buildings,
    tools: parseTools(o.tools, `${path}.tools`),
    workshops: parseWorkshops(o.workshops, `${path}.workshops`, ids),
    expeditions: parseExpeditions(o.expeditions, `${path}.expeditions`, ids),
    bonds: parseBonds(o.bonds, `${path}.bonds`, ids),
    board: parseBoard(o.board, `${path}.board`),
    diary: parseDiary(o.diary, `${path}.diary`),
    farm: parseFarm(o.farm, `${path}.farm`),
    summary: o.summary === null ? null : parseSummary(o.summary, `${path}.summary`, today, ids),
  }
}
