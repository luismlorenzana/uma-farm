// The farm's save parse, shared by v3 and v4 (F17, F46; core spec CS53, romance spec RM10): strict keys, explicit paths,
// every id checked. Roster ids are checked by form, as in v2: the API has no master data or story pack, and an id a later
// release drops still parses. Internal to `save/`: `parse-v3.ts` and `parse-v4.ts` compose these, and `parse-v3.ts`
// re-exports the public names (the work places, their slots and the kinds' types), so nothing outside moved.
import type { DroppedQueue, Entry, ItemQty, LastWork, Refusal, SlotRef, WorkKindRules, WorkOutput, WorkRow } from '@luismlorenzana/uma-work'
import { FESTIVAL_IDS, SEASONS } from '../farm/calendar'
import { bedsFor, dormMaxLevel, FARM_RANK_POINTS } from '../farm/farm'
import { DIARY_ROWS, isDiaryPaidId, MILESTONES } from '../farm/milestones'
import { ACTIVITIES, type Activity, type Rank } from '../farm/ranks'
import { GOOD_IDS, goodOf, isCropId, isGoodId, isSeedId, isWarehouseId } from '../goods/ids'
import type { BinSale, NewsLine, Nudge, RankLine, WorkLine } from '../night/summary'
import { isOutfitId } from '../roster/roster'
import type { LoopWorld } from '../work/loop-env'
import { amount, bool, count, int, list, object, oneOf, positive, record, SaveParseError, type Obj } from './parse'
import {
  ANIMAL_HOME, ANIMAL_KINDS, BLOCK_IDS, BUILDING_IDS, BUILDING_MAX_LEVEL, DEEPEST_FLOOR, EXTRA_KINDS, isDishId, pairKey, PLOTS_PER_BLOCK,
  REGION_IDS, TOOL_IDS, VISITOR_FROM, WORKSHOP_IDS, type Animal, type Block, type BoardRequest, type BuildingId, type Dig, type DormSwap,
  type Expedition, type Extra, type FestivalResult, type LoopWorkRequest, type Plot, type RankState, type SaveV3, type StarCounts,
  type ToolId, type ToolTier, type Visitor, type Warehouse, type WorkshopId,
} from './v3'
import { MAX_STARS, parseStockKey } from './warehouse'

/** The places v3 work rows sit at (decision 11): the forest, the Fishery and their stations in M4; the Mine, the Quarry and
 * theirs from M5. Four slots each (D24 #13). */
export const LOOP_WORK_PLACES = ['forest', 'fishery', 'mill', 'sawmill', 'smokehouse', 'mine', 'quarry', 'smelter', 'cutter'] as const
export type LoopPlaceId = typeof LOOP_WORK_PLACES[number]
export const LOOP_SLOTS = 4

/** A v3 work kind's request (F17 decision 11): the places it works at and its request's parse (strict keys, its own ids;
 * a `SaveParseError` with the path when wrong). The save's parse reads only this, so it stays in the initial JS. */
export interface LoopRequestKind {
  readonly places: readonly LoopPlaceId[]
  parseRequest(value: Obj, path: string): LoopWorkRequest
}
export type LoopRequestKinds = Readonly<Record<string, LoopRequestKind>>

/** A v3 work kind (F17 decision 11, F18, F22): its request, its rules on uma-work's day clock (`farmEnvV3`), and whether
 * it runs for days at a time. F22's are `LOOP_KINDS` (`gathering/kinds.ts`, loaded with the screens and the night); the
 * save's parse reads their requests from `LOOP_REQUESTS` (`gathering/ids.ts`). */
export interface LoopKind extends LoopRequestKind {
  /** How it plans and pays (uma-work's kind rules), over the loop's world. */
  readonly rules: WorkKindRules<LoopWorld>
  /** A multi-day kind (making; in M4 the Mill's preserves; later expeditions): a well-fed Uma's running entry gains a
   * quarter day a night (CS22, F18 decision 4). A 1-day kind's plan takes ×1.25 items instead (F22). */
  readonly multiDay: boolean
}
export type LoopKinds = Readonly<Record<string, LoopKind>>

/** Up to three requests wait behind the running one (the engine's MAX_QUEUE); four started entries at most. */
export const MAX_QUEUED = 3
export const MAX_ENTRIES = MAX_QUEUED + 1
/** The most items one entry makes: well past a Legend's day at the forest (CS17). */
export const MAX_ENTRY_ITEMS = 200
/** The most recruits, visitors or departures one morning can name. */
export const MAX_ROSTER_NEWS = 60
/** The most goal lines one morning can hold (F24): a chapter, every Farm Rank, every milestone and row. */
export const MAX_GOAL_NEWS = 1 + FARM_RANK_POINTS.length + MILESTONES.length + DIARY_ROWS.length
/** The chapter a save may be in: 1–9 (CS43's eight, then the story's end). */
export const MAX_CHAPTER = 9
/** Ids the save names itself (requests, milestones, animals, records): short kebab words, colons allowed. */
export const KEY = /^[a-z0-9][a-z0-9:._-]{0,63}$/

export const fail = (path: string, message: string): never => {
  throw new SaveParseError(path, message)
}

export function key(value: unknown, path: string): string {
  if (typeof value !== 'string' || !KEY.test(value)) fail(path, 'expected an id')
  return value as string
}
export function outfit(value: unknown, path: string): string {
  if (typeof value !== 'string' || !isOutfitId(value)) fail(path, 'outfit ids are positive integers')
  return value as string
}
/** An outfit on the roster (or among `word`'s set). */
export function member(value: unknown, path: string, roster: ReadonlySet<string>, word = 'expected an Uma on the roster'): string {
  const id = outfit(value, path)
  if (!roster.has(id)) fail(path, word)
  return id
}
/** A farm day, 1 or later. */
export const day = (value: unknown, path: string): number => {
  const d = count(value, path)
  if (d < 1) fail(path, 'expected a day from 1')
  return d
}
/** A list with no repeats. */
export function unique<T>(items: T[], path: string, keyOf: (item: T) => string = String): T[] {
  const seen = new Set<string>()
  items.forEach((item, i) => {
    const k = keyOf(item)
    if (seen.has(k)) fail(`${path}.${i}`, 'repeated')
    seen.add(k)
  })
  return items
}
/** A record of counts (or amounts) whose keys `check` accepts. */
export function counts(value: unknown, path: string, check: (id: string) => boolean, word: string, parse = count): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [id, n] of Object.entries(record(value, path))) {
    if (!check(id)) fail(`${path}.${id}`, word)
    out[id] = parse(n, `${path}.${id}`)
  }
  return out
}

// --- The roster -----------------------------------------------------------------------------------------------------

export function parseRanks(value: unknown, path: string): Record<Activity, RankState> {
  const o = object(value, path, ACTIVITIES)
  return Object.fromEntries(ACTIVITIES.map((a) => {
    const at = `${path}.${a}`
    const r = object(o[a], at, ['points', 'rank', 'challenge'])
    return [a, { points: amount(r.points, `${at}.points`), rank: int(r.rank, `${at}.rank`, 0, 5) as Rank, challenge: count(r.challenge, `${at}.challenge`) }]
  })) as Record<Activity, RankState>
}

/** The Dorm on a save's version (F46 decision 12): v3's ten levels (CS34), v4's eight (RM5); home at most its beds. */
export function parseDorm(value: unknown, path: string, roster: ReadonlySet<string>, bought: number | undefined, version = 3): SaveV3['dorm'] {
  const o = object(value, path, ['level', 'home', 'swaps'])
  const top = dormMaxLevel(version)
  const level = int(o.level, `${path}.level`, 1, top)
  if (bought === undefined || level > bought) fail(`${path}.level`, 'above the level bought (buildings.dorm)')
  const home = unique(list(o.home, `${path}.home`, 0, bedsFor(version, level)).map((v, i) => member(v, `${path}.home.${i}`, roster)), `${path}.home`)
  const atHome = new Set(home)
  const swaps = list(o.swaps, `${path}.swaps`, 0, bedsFor(version, top)).map((v, i): DormSwap => {
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

export function parseVisitors(value: unknown, path: string, roster: ReadonlySet<string>): Visitor[] {
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
export function parseWarehouse(value: unknown, path: string, check: (id: string) => boolean): Warehouse {
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

export function stock(value: unknown, path: string): string {
  if (typeof value !== 'string' || !parseStockKey(value)) fail(path, 'expected a stock key <id>@<stars>')
  return value as string
}

export function parseSlot(value: unknown, path: string): SlotRef {
  const o = object(value, path, ['building', 'slot'])
  const building = oneOf(o.building, `${path}.building`, LOOP_WORK_PLACES)
  return { building, slot: int(o.slot, `${path}.slot`, 0, LOOP_SLOTS - 1) }
}

export function parseRequest(value: unknown, path: string, slot: SlotRef, kinds: LoopRequestKinds): LoopWorkRequest {
  const o = record(value, path)
  const kind = typeof o.kind === 'string' && Object.hasOwn(kinds, o.kind) ? kinds[o.kind]! : fail(`${path}.kind`, 'unknown kind')
  if (!(kind.places as readonly string[]).includes(slot.building)) fail(`${path}.kind`, 'not worked at this place')
  return kind.parseRequest(o, path)
}

export function parseQty(value: unknown, path: string): ItemQty {
  const o = object(value, path, ['item', 'qty'])
  const qty = count(o.qty, `${path}.qty`)
  if (qty < 1) fail(`${path}.qty`, 'expected at least 1')
  return { item: stock(o.item, `${path}.item`), qty }
}

export const ENTRY_KEYS = ['request', 'seconds', 'inputs', 'outputs', 'exp', 'startedAt', 'acceleratedMs', 'collected', 'speed', 'fromQueue'] as const

export function parseEntry(value: unknown, path: string, slot: SlotRef, kinds: LoopRequestKinds): Entry<LoopWorkRequest> {
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

export function parseRefusal(value: unknown, path: string): Refusal | null {
  if (value === null) return null
  const o = object(value, path, ['refused', 'code', 'message', 'data'])
  if (o.refused !== true || typeof o.code !== 'string' || typeof o.message !== 'string') fail(path, 'expected a refusal')
  const base = { refused: true as const, code: o.code as string, message: o.message as string }
  if (o.data === undefined) return base
  const data = record(o.data, `${path}.data`)
  if (Object.values(data).some((v) => typeof v !== 'string' && typeof v !== 'number')) fail(`${path}.data`, 'expected strings and numbers')
  return { ...base, data: data as Record<string, string | number> }
}

export function parseDropped(value: unknown, path: string, kinds: LoopRequestKinds): DroppedQueue<LoopWorkRequest> | null {
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

export function parseLast(value: unknown, path: string, kinds: LoopRequestKinds): LastWork<LoopWorkRequest> | null {
  if (value === null) return null
  const l = object(value, path, ['slot', 'request'])
  const slot = parseSlot(l.slot, `${path}.slot`)
  return { slot, request: parseRequest(l.request, `${path}.request`, slot, kinds) }
}

export function parseWork(value: unknown, path: string, roster: ReadonlySet<string>, kinds: LoopRequestKinds): Record<string, WorkRow<LoopWorkRequest>> {
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

export function parsePlot(value: unknown, path: string): Plot {
  const o = object(value, path, ['crop', 'growth', 'ready', 'regrowing', 'own'])
  const crop = o.crop === null ? null : typeof o.crop === 'string' && isCropId(o.crop) ? o.crop : fail(`${path}.crop`, 'unknown crop')
  const plot: Plot = { crop, growth: amount(o.growth, `${path}.growth`), ready: bool(o.ready, `${path}.ready`), regrowing: bool(o.regrowing, `${path}.regrowing`),
    own: bool(o.own, `${path}.own`) }
  if (!crop && (plot.growth > 0 || plot.ready || plot.regrowing || plot.own)) fail(path, 'an empty plot holds nothing')
  return plot
}

export function parseFields(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['fields'] {
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

export function parseRanch(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['ranch'] {
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

export function parseDig(value: unknown, path: string): Dig {
  const o = object(value, path, ['deepest', 'stairs'])
  return { deepest: int(o.deepest, `${path}.deepest`, 0, DEEPEST_FLOOR), stairs: amount(o.stairs, `${path}.stairs`) }
}

export function parseBuildings(value: unknown, path: string, version = 3): Partial<Record<BuildingId, number>> {
  const out: Partial<Record<BuildingId, number>> = {}
  for (const [id, level] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    const building = oneOf(id, at, BUILDING_IDS)
    out[building] = int(level, at, 0, building === 'dorm' ? dormMaxLevel(version) : BUILDING_MAX_LEVEL)
  }
  if (!out.dorm) fail(`${path}.dorm`, 'the Dorm is built from day 1')
  return out
}

export function parseTools(value: unknown, path: string): Record<ToolId, ToolTier> {
  const o = object(value, path, TOOL_IDS)
  return Object.fromEntries(TOOL_IDS.map((t) => [t, int(o[t], `${path}.${t}`, 1, 5) as ToolTier])) as Record<ToolId, ToolTier>
}

export function parseWorkshops(value: unknown, path: string, roster: ReadonlySet<string>): SaveV3['workshops'] {
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

export function parseExpeditions(value: unknown, path: string, roster: ReadonlySet<string>): Expedition[] {
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

export function parseBonds(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, number> {
  return counts(value, path, (k) => {
    const [a, b, ...rest] = k.split(':')
    return rest.length === 0 && !!a && !!b && a !== b && roster.has(a) && roster.has(b) && pairKey(a, b) === k
  }, 'expected two roster ids in numeric order, idA:idB', amount)
}

export function parseExtra(value: unknown, path: string): Extra | null {
  if (value === null) return null
  const o = object(value, path, ['kind', 'id'])
  const kind = oneOf(o.kind, `${path}.kind`, EXTRA_KINDS)
  const id = typeof o.id === 'string' ? o.id : ''
  const ok = kind === 'recipe' ? isDishId(id) : kind === 'seeds' ? isSeedId(id) : kind === 'animal' ? (ANIMAL_KINDS as readonly string[]).includes(id) : isOutfitId(id)
  if (!ok) fail(`${path}.id`, `expected the ${kind}'s id`)
  return { kind, id }
}

export function parseBoard(value: unknown, path: string): BoardRequest[] {
  return unique(list(value, path, 0, 5).map((v, i): BoardRequest => {
    const at = `${path}.${i}`
    const r = object(v, at, ['id', 'from', 'item', 'count', 'stars', 'due', 'reward', 'extra'])
    const item = typeof r.item === 'string' && isGoodId(r.item) ? r.item : fail(`${at}.item`, 'unknown good')
    return { id: key(r.id, `${at}.id`), from: key(r.from, `${at}.from`), item, count: int(r.count, `${at}.count`, 1, 99), stars: int(r.stars, `${at}.stars`, 1, MAX_STARS),
      due: day(r.due, `${at}.due`), reward: count(r.reward, `${at}.reward`), extra: parseExtra(r.extra, `${at}.extra`) }
  }), path, (r) => r.id)
}

export function keys(value: unknown, path: string): string[] {
  return unique(list(value, path, 0, 2000).map((v, i) => key(v, `${path}.${i}`)), path)
}

export function parseDiary(value: unknown, path: string): SaveV3['diary'] {
  const o = object(value, path, ['shipped', 'milestones', 'records', 'read'])
  return {
    shipped: counts(o.shipped, `${path}.shipped`, isGoodId, 'unknown good'),
    milestones: keys(o.milestones, `${path}.milestones`),
    records: counts(o.records, `${path}.records`, (k) => KEY.test(k), 'expected an id', amount),
    read: keys(o.read, `${path}.read`),
  }
}

export function parseFarm(value: unknown, path: string): SaveV3['farm'] {
  const o = object(value, path, ['points', 'chapter', 'goals', 'festivals', 'counts'])
  const festivals = list(o.festivals, `${path}.festivals`, 0, 1000).map((v, i): FestivalResult => {
    const at = `${path}.festivals.${i}`
    const f = object(v, at, ['id', 'day', 'score', 'place'])
    return { id: key(f.id, `${at}.id`), day: day(f.day, `${at}.day`), score: amount(f.score, `${at}.score`), place: int(f.place, `${at}.place`, 1, 3) as 1 | 2 | 3 }
  })
  return {
    points: count(o.points, `${path}.points`), chapter: int(o.chapter, `${path}.chapter`, 1, MAX_CHAPTER),
    goals: counts(o.goals, `${path}.goals`, (k) => KEY.test(k), 'expected an id'), festivals,
    counts: counts(o.counts, `${path}.counts`, (k) => KEY.test(k), 'expected an id'),
  }
}

// --- The morning summary (F18 decision 11): ids and counts only, the morning it was built for ---------------------

export const none = (value: unknown, path: string): [] => list(value, path, 0, 0) as []

/** §1 The bin (F19). */
export function parseBinLines(value: unknown, path: string): BinSale[] {
  // A good at one star once, a whole count and gold; the gold isn't re-priced (a later price can't break it).
  return unique(list(value, path, 0, GOOD_IDS.length * MAX_STARS).map((v, i): BinSale => {
    const at = `${path}.${i}`
    const b = object(v, at, ['kind', 'id', 'stars', 'count', 'gold', 'demand'])
    oneOf(b.kind, `${at}.kind`, ['sold'] as const)
    const id = typeof b.id === 'string' && isGoodId(b.id) ? b.id : fail(`${at}.id`, 'unknown good')
    return {
      kind: 'sold', id, stars: int(b.stars, `${at}.stars`, 1, MAX_STARS), count: int(b.count, `${at}.count`, 1, Number.MAX_SAFE_INTEGER), gold: count(b.gold, `${at}.gold`),
      demand: bool(b.demand, `${at}.demand`),
    }
  }), path, (b) => `${b.id}@${b.stars}`)
}

/** §2 Work done (F18, F20, F22). */
export function parseWorkLines(value: unknown, path: string): WorkLine[] {
  // Work done: jobs by place (F18); crops ready by block and what withered, by block and crop (F20). A plot count is 1–9.
  const plots = (value: unknown, at: string) => int(value, at, 1, PLOTS_PER_BLOCK)
  return unique(list(value, path, 0, LOOP_WORK_PLACES.length + 1 + BLOCK_IDS.length * (1 + PLOTS_PER_BLOCK)).map((v, i): WorkLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['jobs', 'catch', 'crops', 'withered'] as const)
    if (kind === 'catch') {
      // F22: the night's best catch, a fish at its stars.
      const c = object(v, at, ['kind', 'id', 'stars'])
      const id = typeof c.id === 'string' && goodOf(c.id)?.family === 'fish' && !goodOf(c.id)!.refined ? c.id : fail(`${at}.id`, 'expected a fish')
      return { kind, id, stars: int(c.stars, `${at}.stars`, 1, MAX_STARS) }
    }
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
  }), path, (w) => (w.kind === 'jobs' ? `jobs:${w.place}` : w.kind === 'catch' ? 'catch' : w.kind === 'crops' ? `crops:${w.block}` : `withered:${w.block}:${w.crop}`))
}

/** §3 Ranks (F21): rank-ups, then points full, each an Uma on the roster in an activity, a rank Hand–Legend; once each. */
export function parseRankLines(value: unknown, path: string, roster: ReadonlySet<string>): RankLine[] {
  return unique(list(value, path, 0, 2 * ACTIVITIES.length * roster.size).map((v, i): RankLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['rank-up', 'full'] as const)
    const r = object(v, at, kind === 'full' ? ['kind', 'outfitId', 'activity', 'rank', 'challenge'] : ['kind', 'outfitId', 'activity', 'rank'])
    const line = { outfitId: member(r.outfitId, `${at}.outfitId`, roster), activity: oneOf(r.activity, `${at}.activity`, ACTIVITIES), rank: int(r.rank, `${at}.rank`, 1, 5) as Rank }
    return kind === 'full' ? { kind, ...line, challenge: count(r.challenge, `${at}.challenge`) } : { kind, ...line }
  }), path, (r) => `${r.kind}:${r.outfitId}:${r.activity}`)
}

/** v3's news kinds; v4 drops `joined`, `gate` and `left` (its arrivals are §4's hearts, F46 decision 15). */
const NEWS_KINDS = ['season', 'festival', 'chapter', 'farm-rank', 'milestone', 'dorm', 'home', 'joined', 'gate', 'left'] as const
const NEWS_KINDS_V4 = ['season', 'festival', 'chapter', 'farm-rank', 'milestone', 'dorm', 'home'] as const

/** §5 New today (F18, F23, F24), on a save's version: the Dorm's levels and beds are its ladder's. */
export function parseNewsLines(value: unknown, path: string, roster: ReadonlySet<string>, version = 3): NewsLine[] {
  const top = dormMaxLevel(version)
  // F23: the Dorm's new level, Umas home from a swap, recruits who joined (on the roster), a visitor at the Gate and those
  // who left (outfit ids by form: she may since have joined, or gone).
  return unique(list(value, path, 0, 8 + 3 * MAX_ROSTER_NEWS + MAX_GOAL_NEWS).map((v, i): NewsLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, version >= 4 ? NEWS_KINDS_V4 : NEWS_KINDS)
    switch (kind) {
      // F24: the chapter completed tonight (one of the story's), a Farm Rank reached (2–10), a Diary milestone or row paid.
      case 'chapter': return { kind, chapter: int(object(v, at, ['kind', 'chapter']).chapter, `${at}.chapter`, 1, MAX_CHAPTER - 1) }
      case 'farm-rank': return { kind, rank: int(object(v, at, ['kind', 'rank']).rank, `${at}.rank`, 2, FARM_RANK_POINTS.length) }
      case 'milestone': {
        const id = object(v, at, ['kind', 'id']).id
        return { kind, id: typeof id === 'string' && isDiaryPaidId(id) ? id : fail(`${at}.id`, 'unknown milestone') }
      }
      case 'season': return { kind, season: oneOf(object(v, at, ['kind', 'season']).season, `${at}.season`, SEASONS) }
      case 'festival': {
        const f = object(v, at, ['kind', 'festival', 'when'])
        return { kind, festival: oneOf(f.festival, `${at}.festival`, FESTIVAL_IDS), when: oneOf(f.when, `${at}.when`, ['today', 'tomorrow'] as const) }
      }
      case 'dorm': return { kind, level: int(object(v, at, ['kind', 'level']).level, `${at}.level`, 2, top) }
      case 'home': {
        const h = object(v, at, ['kind', 'umas'])
        return { kind, umas: unique(list(h.umas, `${at}.umas`, 1, bedsFor(version, top)).map((id, j) => member(id, `${at}.umas.${j}`, roster)), `${at}.umas`) }
      }
      case 'joined': {
        const j = object(v, at, ['kind', 'outfitId', 'home'])
        return { kind, outfitId: member(j.outfitId, `${at}.outfitId`, roster), home: bool(j.home, `${at}.home`) }
      }
      case 'gate': case 'left': return { kind, outfitId: outfit(object(v, at, ['kind', 'outfitId']).outfitId, `${at}.outfitId`) }
    }
  }), path, (n) => (n.kind === 'season' || n.kind === 'dorm' || n.kind === 'home' || n.kind === 'chapter' ? n.kind : n.kind === 'festival' ? `festival:${n.when}`
    : n.kind === 'farm-rank' ? `farm-rank:${n.rank}` : n.kind === 'milestone' ? `milestone:${n.id}` : `${n.kind}:${n.outfitId}`))
}

/** §6 Today's nudges (F18, F20). */
export function parseNudges(value: unknown, path: string, roster: ReadonlySet<string>): Nudge[] {
  return unique(list(value, path, 0, 4).map((v, i): Nudge => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['idle', 'seeds'] as const)
    if (kind === 'seeds') return { kind, plots: int(object(v, at, ['kind', 'plots']).plots, `${at}.plots`, 1, BLOCK_IDS.length * PLOTS_PER_BLOCK) }
    const n = object(v, at, ['kind', 'umas'])
    return { kind, umas: unique(list(n.umas, `${at}.umas`, 1, roster.size).map((id, j) => member(id, `${at}.umas.${j}`, roster)), `${at}.umas`) }
  }), path, (n) => n.kind)
}
