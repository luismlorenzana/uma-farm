// The save's parse helpers for the farm's parts: strict keys, explicit paths, every id checked. Roster ids are checked
// by form: the API has no master data or story pack, and an id a later release drops still parses. Internal to `save/`:
// `parse-v4.ts` composes these and re-exports the public names (the work places and their slots).
import { SEASONS } from '../farm/calendar'
import { DORM_MAX_LEVEL, FARM_RANK_POINTS } from '../farm/farm'
import { DIARY_ROWS, isDiaryPaidId, MILESTONES } from '../farm/milestones'
import { BUILD_PLACES, farmPlace, isBuildPlace, type FarmPlaceId } from '../farm/places'
import { ACTIVITIES, type Activity, type Rank } from '../farm/ranks'
import { isStation, STATION_JOBS, stationJobOf, STATIONS, type StationId } from '../gathering/ids'
import { goodOf, GOOD_IDS, isCropId, isGoodId, isGoodOrRingId, isSeedId, isWarehouseId, RING_IDS } from '../goods/ids'
import type { BinSale, MoneyLine, NewsLine, Nudge, RankLine, WorkLine } from '../night/summary'
import { amount, bool, count, int, list, object, oneOf, record, SaveParseError, type Obj } from './parse'
import {
  ANIMAL_HOME, ANIMAL_KINDS, APTITUDE_IDS, MAX_TASKS, TASK_KINDS, BUILDING_IDS, BUILDING_MAX_LEVEL, DEEPEST_FLOOR, DORM_LOAN, EXTRA_KINDS, FIELD_TILES, GROUNDS, HOME_ROOM, HOUSE_LOAN, INCOME_NIGHTS,
  MARKET_FLOOR, MAX_FIELD_TILES, MAX_KITCHEN_BASE, MAX_PLOTS, MEAL_KEEPS, MENU_RECIPES, STATION_MAX_LEVEL, STOVE_PLAYS,
  isDishId, MAX_FONDNESS, MAX_LOANS, pairKey, RANCH_HOMES, SILO_ROOM,
  EXPEDITION_OUTCOMES, REGION_IDS, TOOL_IDS, TOWN_ID, WORKSHOP_IDS, type Animal, type BoardRequest, type BuildingId, type Dig,
  type Expedition, type ExpeditionReturn, type Extra, type FestivalResult, type Loan, type MenuLine, type PantryLot, type PlayInProgress, type RankState, type SaveV5, type StarCounts,
  type StationLoad, type Tile, type ToolId, type ToolTier, type Warehouse, type WorkshopId,
} from './v4'
import { MAX_STARS, parseStockKey } from './warehouse'

/** The places an Uma works: the forest, the Fishery and their stations; the Mine, the Quarry and theirs; the Coop and
 * the Barn; the kitchen (the farmhouse's, until the Kitchen stands). What the night's `worked` and `made` name, kept for
 * the farmhands; four slots each. */
export const LOOP_WORK_PLACES = ['forest', 'fishery', 'mill', 'sawmill', 'smokehouse', 'mine', 'quarry', 'smelter', 'cutter', 'coop', 'barn', 'kitchen'] as const
export type LoopPlaceId = typeof LOOP_WORK_PLACES[number]
export const LOOP_SLOTS = 4

/** The most goal lines one morning can hold: every Farm Rank, every milestone and row, every place built overnight. */
export const MAX_GOAL_NEWS = FARM_RANK_POINTS.length + MILESTONES.length + DIARY_ROWS.length + BUILD_PLACES.length
/** Ids the save names itself (requests, milestones, animals, records): short kebab words, colons allowed. */
export const KEY = /^[a-z0-9][a-z0-9:._-]{0,63}$/

export const fail = (path: string, message: string): never => {
  throw new SaveParseError(path, message)
}

export function key(value: unknown, path: string): string {
  if (typeof value !== 'string' || !KEY.test(value)) fail(path, 'expected an id')
  return value as string
}
/** A character id (or a master outfit id), as master data's stable key: a positive integer of up to twelve digits. */
export const ROSTER_ID = /^[1-9]\d{0,11}$/
export const isRosterId = (id: string): boolean => ROSTER_ID.test(id)
/** A roster id by form: a character id, or a sister's (`s<outfitId>`): anyone in town can be met. */
export function outfit(value: unknown, path: string): string {
  if (typeof value !== 'string' || !TOWN_ID.test(value)) fail(path, 'ids are positive integers, or a sister’s s<outfitId>')
  return value as string
}
/** An Uma on the roster (or among `word`'s set). */
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

/** The retired Dorm, kept in its shape (v5 grows in place): its level on its eight levels, no higher than the level
 * bought, and read by nothing; who was home and the swaps waiting are cleared, whatever they held, so everyone who lived
 * there lives in town from this load. Pure, so a load never stamps the save. */
export function parseDorm(value: unknown, path: string, bought: number | undefined): SaveV5['dorm'] {
  const o = object(value, path, ['level', 'home', 'swaps'])
  const level = int(o.level, `${path}.level`, 1, DORM_MAX_LEVEL)
  if (bought === undefined || level > bought) fail(`${path}.level`, 'above the level bought (buildings.dorm)')
  if (!Array.isArray(o.home)) fail(`${path}.home`, 'expected a list')
  if (!Array.isArray(o.swaps)) fail(`${path}.swaps`, 'expected a list')
  return { level, home: [], swaps: [] }
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

// --- The field, the stations' loads, the ranch, the places, buildings and tools --------------------------------------

/** The most nights a crop grows to ripe: the longest's days (10). */
const MAX_GROWTH = 10

/** A tile: its ground; a crop only on tilled soil, its growth whole nights below its ripeness unless ripe; an empty
 * tile holds nothing else. */
export function parseTile(value: unknown, path: string): Tile {
  const o = object(value, path, ['ground', 'crop', 'growth', 'ready', 'regrowing', 'own', 'watered'])
  const ground = oneOf(o.ground, `${path}.ground`, GROUNDS)
  const crop = o.crop === null ? null : typeof o.crop === 'string' && isCropId(o.crop) ? o.crop : fail(`${path}.crop`, 'unknown crop')
  const tile: Tile = {
    ground, crop, growth: int(o.growth, `${path}.growth`, 0, MAX_GROWTH), ready: bool(o.ready, `${path}.ready`), regrowing: bool(o.regrowing, `${path}.regrowing`),
    own: bool(o.own, `${path}.own`), watered: bool(o.watered, `${path}.watered`),
  }
  if (crop && ground !== 'tilled') fail(`${path}.ground`, 'a crop grows on tilled soil')
  if (!crop && (tile.growth > 0 || tile.ready || tile.regrowing || tile.own || tile.watered)) fail(path, 'an empty tile holds nothing')
  if (tile.ready && tile.watered) fail(`${path}.watered`, 'a ripe crop isn’t watered')
  return tile
}

/** A plot: exactly its 40 tiles, row by row. */
const parsePlotTiles = (value: unknown, path: string): Tile[] => list(value, path, FIELD_TILES, FIELD_TILES).map((t, i) => parseTile(t, `${path}.${i}`))

/** The field: its plots, 1 up to the rules' most, each exactly its tiles. A save from before plots holds the one field's
 * tiles (`tiles`) and reads as plot 1, unchanged: grown in place, no migration, and `updatedAt` never moves. */
export function parseFields(value: unknown, path: string): SaveV5['fields'] {
  const o = object(value, path, ['tiles', 'plots'])
  if (o.plots === undefined) {
    if (o.tiles === undefined) fail(`${path}.plots`, 'expected the field’s plots')
    return { plots: [{ tiles: parsePlotTiles(o.tiles, `${path}.tiles`) }] }
  }
  if (o.tiles !== undefined) fail(`${path}.tiles`, 'the field’s tiles are its plots’')
  return { plots: list(o.plots, `${path}.plots`, 1, MAX_PLOTS).map((p, i) => ({ tiles: parsePlotTiles(object(p, `${path}.plots.${i}`, ['tiles']).tiles, `${path}.plots.${i}.tiles`) })) }
}

/** The stations' loads: each station's loads today, 1 up to its top level's, in the order started; each an output it
 * makes at its stars, 1–20 of them. An older v5's one load (an object, before the stations' levels) reads as a list of
 * one: grown in place, no migration, and `updatedAt` never moves. */
export function parseLoads(value: unknown, path: string): Partial<Record<StationId, StationLoad[]>> {
  const out: Partial<Record<StationId, StationLoad[]>> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    const station = oneOf(id, at, STATIONS)
    const one = (v: unknown, where: string): StationLoad => {
      const o = object(v, where, ['item', 'count'])
      const key = typeof o.item === 'string' ? parseStockKey(o.item) : null
      const job = key ? stationJobOf(key.id) : null
      if (!key || !job || STATION_JOBS[job].station !== station) fail(`${where}.item`, 'expected a good this station makes, at its stars')
      return { item: o.item as string, count: int(o.count, `${where}.count`, 1, MAX_LOAD) }
    }
    out[station] = Array.isArray(raw) ? list(raw, at, 1, STATION_MAX_LEVEL).map((v, i) => one(v, `${at}.${i}`)) : [one(raw, at)]
  }
  return out
}
/** The most a load holds: a farmhand's biggest load (12 at the trick's level) at her best yield, with room. The
 * farmer's are 1–8. */
const MAX_LOAD = 20

/** An animal's keys, and those of the ranch's shape before its game (`building`, `affection`, `streak`, `carer`, `next`),
 * which reads leniently: its affection as fondness (whole, held to the top), nothing fed, cared for or waiting. */
const ANIMAL_KEYS = ['id', 'kind', 'fondness', 'fed', 'cared', 'ready'] as const
const OLDER_ANIMAL_KEYS = ['id', 'kind', 'building', 'affection', 'streak', 'carer', 'next'] as const

/** The ranch: each animal once, at most a building's room in each, and the silo's feed (a save from before the ranch's
 * game has none: 0). Grows in place: no migration, and `updatedAt` never moves. */
export function parseRanch(value: unknown, path: string): SaveV5['ranch'] {
  const o = object(value, path, ['animals', 'silo'])
  const animals = list(o.animals, `${path}.animals`, 0, RANCH_HOMES.length * HOME_ROOM).map((v, i): Animal => {
    const at = `${path}.animals.${i}`
    const raw = record(v, at)
    if ('affection' in raw || 'building' in raw) {
      const a = object(v, at, OLDER_ANIMAL_KEYS)
      const fondness = Math.min(MAX_FONDNESS, Math.floor(amount(a.affection, `${at}.affection`)))
      return { id: key(a.id, `${at}.id`), kind: oneOf(a.kind, `${at}.kind`, ANIMAL_KINDS), fondness, fed: false, cared: false, ready: false }
    }
    const a = object(v, at, ANIMAL_KEYS)
    return {
      id: key(a.id, `${at}.id`), kind: oneOf(a.kind, `${at}.kind`, ANIMAL_KINDS), fondness: int(a.fondness, `${at}.fondness`, 0, MAX_FONDNESS),
      fed: bool(a.fed, `${at}.fed`), cared: bool(a.cared, `${at}.cared`), ready: bool(a.ready, `${at}.ready`),
    }
  })
  unique(animals, `${path}.animals`, (a) => a.id)
  for (const home of RANCH_HOMES) {
    if (animals.filter((a) => ANIMAL_HOME[a.kind] === home).length > HOME_ROOM) fail(`${path}.animals`, `the ${home} holds ${HOME_ROOM}`)
  }
  return { animals, silo: o.silo === undefined ? 0 : int(o.silo, `${path}.silo`, 0, SILO_ROOM) }
}

/** A dig: its deepest floor (0 before its first face) and the faces worked toward that floor's stairs, whole (an older
 * save's fractional stairs-days read down to whole). */
export function parseDig(value: unknown, path: string): Dig {
  const o = object(value, path, ['deepest', 'stairs'])
  return { deepest: int(o.deepest, `${path}.deepest`, 0, DEEPEST_FLOOR), stairs: Math.floor(amount(o.stairs, `${path}.stairs`)) }
}

export function parseBuildings(value: unknown, path: string): Partial<Record<BuildingId, number>> {
  const out: Partial<Record<BuildingId, number>> = {}
  for (const [id, level] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    const building = oneOf(id, at, BUILDING_IDS)
    out[building] = int(level, at, 0, building === 'dorm' ? DORM_MAX_LEVEL : BUILDING_MAX_LEVEL)
  }
  if (!out.dorm) fail(`${path}.dorm`, 'the Dorm is built from day 1')
  return out
}

export function parseTools(value: unknown, path: string): Record<ToolId, ToolTier> {
  const o = object(value, path, TOOL_IDS)
  return Object.fromEntries(TOOL_IDS.map((t) => [t, int(o[t], `${path}.${t}`, 1, 5) as ToolTier])) as Record<ToolId, ToolTier>
}

export function parseWorkshops(value: unknown, path: string, roster: ReadonlySet<string>): SaveV5['workshops'] {
  const o = object(value, path, ['played', 'current', 'recipes', 'best'])
  const p = object(o.played, `${path}.played`, WORKSHOP_IDS)
  const played = Object.fromEntries(WORKSHOP_IDS.map((w) => [w, count(p[w], `${path}.played.${w}`)])) as Record<WorkshopId, number>
  const current = o.current === null ? null : parsePlay(o.current, `${path}.current`, roster)
  const recipes = unique(list(o.recipes, `${path}.recipes`, 0, 80).map((v, i) => (typeof v === 'string' && isDishId(v) ? v : fail(`${path}.recipes.${i}`, 'unknown dish'))), `${path}.recipes`)
  return { played, current, recipes, best: counts(o.best, `${path}.best`, (k) => KEY.test(k), 'expected an id', amount) }
}

/** A stove's stock key: a good or a dish the Warehouse holds, at its stars. */
const stoveKey = (value: unknown, path: string): string => (typeof value === 'string' && parseStockKey(value) !== null ? value : fail(path, 'expected <good>@<stars>'))

/** A play at the stove under way: a batch's two goods, the Kitchen's menu (one to three recipes, each once, a share of
 * 1–15, its main and side at one good and star) with an assistant on the roster or none, or the Cooking Contest's one
 * dish (a menu of one line, one dish) with a cook on the roster or none; its seed four digits, its length 1–600 seconds.
 * The shape from before the stove (a workshop, an assistant and a day, never written by any build) reads as no play. */
function parsePlay(value: unknown, path: string, roster: ReadonlySet<string>): PlayInProgress | null {
  const c = object(value, path, ['workshop', 'play', 'day', 'seed', 'length', 'assistant', 'goods', 'menu'])
  if (c.play === undefined) return null
  const play = oneOf(c.play, `${path}.play`, STOVE_PLAYS)
  const out: PlayInProgress = {
    workshop: oneOf(c.workshop, `${path}.workshop`, WORKSHOP_IDS), play, day: day(c.day, `${path}.day`), seed: int(c.seed, `${path}.seed`, 1000, 9999),
    length: int(c.length, `${path}.length`, 1, 600),
  }
  if (play === 'batch') {
    if (c.assistant !== undefined || c.menu !== undefined) fail(path, 'a batch has two goods, and no menu or assistant')
    out.goods = list(c.goods, `${path}.goods`, 2, 2).map((v, i) => stoveKey(v, `${path}.goods.${i}`))
    return out
  }
  if (c.goods !== undefined) fail(`${path}.goods`, 'the Kitchen’s play has a menu')
  if (c.assistant !== undefined) out.assistant = member(c.assistant, `${path}.assistant`, roster)
  out.menu = unique(list(c.menu, `${path}.menu`, 1, MENU_RECIPES).map((v, i): MenuLine => {
    const at = `${path}.menu.${i}`
    const m = object(v, at, ['dish', 'count', 'main', 'side'])
    return { dish: typeof m.dish === 'string' && isDishId(m.dish) ? m.dish : fail(`${at}.dish`, 'unknown dish'), count: int(m.count, `${at}.count`, 1, MAX_KITCHEN_BASE),
      main: stoveKey(m.main, `${at}.main`), side: stoveKey(m.side, `${at}.side`) }
  }), `${path}.menu`, (m) => m.dish)
  if (play === 'contest' && (out.menu.length !== 1 || out.menu[0]!.count !== 1)) fail(`${path}.menu`, 'the Contest cooks one dish')
  return out
}

export function parseExpeditions(value: unknown, path: string, roster: ReadonlySet<string>): Expedition[] {
  const out = list(value, path, 0, 3).map((v, i): Expedition => {
    const at = `${path}.${i}`
    const e = object(v, at, ['region', 'party', 'supplies', 'left', 'back'])
    const party = unique(list(e.party, `${at}.party`, 1, 4).map((m, j) => member(m, `${at}.party.${j}`, roster)), `${at}.party`)
    const supplies = list(e.supplies, `${at}.supplies`, 0, 8).map((s, j) => (typeof s === 'string' && (isWarehouseId(s) || isDishId(parseStockKey(s)?.id ?? '')) ? s : fail(`${at}.supplies.${j}`, 'unknown supply')))
    const left = day(e.left, `${at}.left`)
    const back = day(e.back, `${at}.back`)
    if (back <= left || back - left > 5) fail(`${at}.back`, 'expected 1–5 days after departure')
    return { region: oneOf(e.region, `${at}.region`, REGION_IDS), party, supplies, left, back }
  })
  unique(out.flatMap((e) => e.party), path)
  return out
}

export function parseExpeditionReturn(value: unknown, path: string, roster: ReadonlySet<string>, summary = false): ExpeditionReturn {
  const e = object(value, path, ['region', 'party', 'left', 'back', 'result', 'loot', ...(summary ? ['kind'] : [])])
  const party = unique(list(e.party, `${path}.party`, 1, 4).map((id, i) => member(id, `${path}.party.${i}`, roster)), `${path}.party`)
  const left = day(e.left, `${path}.left`)
  const back = day(e.back, `${path}.back`)
  if (back <= left || back - left > 5) fail(`${path}.back`, 'expected 1–5 days after departure')
  const loot = counts(e.loot, `${path}.loot`, (key) => {
    const family = goodOf(parseStockKey(key)?.id ?? '')?.family
    return family === 'hides-scales' || family === 'bones-horns' || family === 'essences'
  }, 'expected an expedition good at its stars')
  const total = Object.values(loot).reduce((sum, n) => sum + n, 0)
  if (total < 1 || total > 90) fail(`${path}.loot`, 'expected 1–90 goods')
  return { region: oneOf(e.region, `${path}.region`, REGION_IDS), party, left, back,
    result: oneOf(e.result, `${path}.result`, EXPEDITION_OUTCOMES), loot }
}

/** Bond points by pair: two roster ids in numeric order, whole. */
export function parseBonds(value: unknown, path: string, roster: ReadonlySet<string>): Record<string, number> {
  return counts(value, path, (k) => {
    const [a, b, ...rest] = k.split(':')
    return rest.length === 0 && !!a && !!b && a !== b && roster.has(a) && roster.has(b) && pairKey(a, b) === k
  }, 'expected two roster ids in numeric order, idA:idB')
}

export function parseExtra(value: unknown, path: string): Extra | null {
  if (value === null) return null
  const o = object(value, path, ['kind', 'id'])
  const kind = oneOf(o.kind, `${path}.kind`, EXTRA_KINDS)
  const id = typeof o.id === 'string' ? o.id : ''
  const ok = kind === 'recipe' ? isDishId(id) : kind === 'seeds' ? isSeedId(id) : kind === 'animal' ? (ANIMAL_KINDS as readonly string[]).includes(id) : isRosterId(id)
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

/** The Diary: what's shipped is the catalogue's goods and the rings. */
export function parseDiary(value: unknown, path: string): SaveV5['diary'] {
  const o = object(value, path, ['shipped', 'milestones', 'records', 'read', 'notes'])
  return {
    shipped: counts(o.shipped, `${path}.shipped`, isGoodOrRingId, 'unknown good'),
    milestones: keys(o.milestones, `${path}.milestones`),
    records: counts(o.records, `${path}.records`, (k) => KEY.test(k), 'expected an id', amount),
    read: keys(o.read, `${path}.read`),
    // The Town notes unlocked: an older v4 has none.
    notes: o.notes === undefined ? [] : keys(o.notes, `${path}.notes`),
  }
}

/** A farm's keys: `chapter` and `goals` are an older v4's, from the global chapters, read and ignored (`legacyChapter`
 * keeps what a chapter had opened); `builds` is missing on one, and defaults to none. The accounts (`loans`, `owed`,
 * `short`, `income`) grow v5 in place: a save from before upkeep has none, read as no loans, nothing owed and no nights,
 * and nothing moves `updatedAt` for it. So does the pantry (`pantry`): a save from before food reads as an empty one. */
const FARM_KEYS = ['points', 'festivals', 'counts', 'builds', 'loans', 'owed', 'short', 'income', 'pantry', 'market', 'chapter', 'goals'] as const
const LOAN_KEYS = ['for', 'day', 'lent', 'fee', 'owed', 'nightly'] as const

/** A loan's project: a place you build, a house on the homestead (`house:1` … `house:6`), or a level of the retired
 * Dorm (`dorm:2` … `dorm:8`) a save may still owe on. */
const isLoanFor = (id: unknown): id is string => typeof id === 'string' && (isBuildPlace(farmPlace(id)) || DORM_LOAN.test(id) || HOUSE_LOAN.test(id))
const LOAN_FOR_WORDS = 'expected a place you build, dorm:2 to dorm:8, or house:1 to house:6'

/** The mayor's office's loans: at most two, one a project, each with gold lent, its fee, what's still owed (1 up to both)
 * and a nightly share from 1. */
function parseLoans(value: unknown, path: string, today: number): Loan[] {
  return unique(list(value, path, 0, MAX_LOANS).map((v, i): Loan => {
    const at = `${path}.${i}`
    const l = object(v, at, LOAN_KEYS)
    const lent = int(l.lent, `${at}.lent`, 1, Number.MAX_SAFE_INTEGER)
    const fee = count(l.fee, `${at}.fee`)
    return {
      for: isLoanFor(l.for) ? l.for : fail(`${at}.for`, LOAN_FOR_WORDS), day: int(l.day, `${at}.day`, 1, today), lent, fee,
      owed: int(l.owed, `${at}.owed`, 1, lent + fee), nightly: int(l.nightly, `${at}.nightly`, 1, lent + fee),
    }
  }), path, (l) => l.for)
}

/** The pantry's meals: each lot cooked today or on the two days before (a meal keeps three days), at ★1–★5, a meal or
 * more; one lot a day
 * and star, the oldest first and the best first within a day. */
function parsePantry(value: unknown, path: string, today: number): PantryLot[] {
  const lots = unique(list(value, path, 0, MEAL_KEEPS * MAX_STARS).map((v, i): PantryLot => {
    const at = `${path}.${i}`
    const l = object(v, at, ['day', 'stars', 'meals'])
    return { day: int(l.day, `${at}.day`, Math.max(1, today - MEAL_KEEPS + 1), today), stars: int(l.stars, `${at}.stars`, 1, MAX_STARS), meals: int(l.meals, `${at}.meals`, 1, MAX_PANTRY_MEALS) }
  }), path, (l) => `${l.day}@${l.stars}`)
  lots.forEach((l, i) => {
    const prev = lots[i - 1]
    if (prev && (prev.day > l.day || (prev.day === l.day && prev.stars < l.stars))) fail(`${path}.${i}`, 'expected the oldest first, the best first within a day')
  })
  return lots
}
/** The most meals a lot holds: well past any day's cooking. */
const MAX_PANTRY_MEALS = 100_000

export function parseFarm(value: unknown, path: string, today: number): SaveV5['farm'] {
  const o = object(value, path, FARM_KEYS)
  const festivals = list(o.festivals, `${path}.festivals`, 0, 1000).map((v, i): FestivalResult => {
    const at = `${path}.festivals.${i}`
    const f = object(v, at, ['id', 'day', 'score', 'place'])
    return { id: key(f.id, `${at}.id`), day: day(f.day, `${at}.day`), score: amount(f.score, `${at}.score`), place: int(f.place, `${at}.place`, 1, 3) as 1 | 2 | 3 }
  })
  const builds = o.builds === undefined ? [] : unique(list(o.builds, `${path}.builds`, 0, BUILD_PLACES.length)
    .map((v, i) => (typeof v === 'string' && isBuildPlace(farmPlace(v)) ? v as FarmPlaceId : fail(`${path}.builds.${i}`, 'expected a place you build'))), `${path}.builds`)
  // Upkeep owed and the short nights in a row come together: a short night leaves gold owed, and paying it clears both.
  const owed = o.owed === undefined ? 0 : count(o.owed, `${path}.owed`)
  const short = o.short === undefined ? 0 : count(o.short, `${path}.short`)
  if ((owed > 0) !== (short > 0)) fail(`${path}.short`, 'expected short nights with upkeep owed, or neither')
  return {
    points: count(o.points, `${path}.points`), festivals,
    counts: counts(o.counts, `${path}.counts`, (k) => KEY.test(k), 'expected an id'), builds,
    loans: o.loans === undefined ? [] : parseLoans(o.loans, `${path}.loans`, today), owed, short,
    income: o.income === undefined ? [] : list(o.income, `${path}.income`, 0, INCOME_NIGHTS).map((v, i) => count(v, `${path}.income.${i}`)),
    pantry: o.pantry === undefined ? [] : parsePantry(o.pantry, `${path}.pantry`, today),
    // The market: each good a flood eased, 1 to the floor's steps; a save from before the market has none.
    market: o.market === undefined ? {} : counts(o.market, `${path}.market`, isGoodOrRingId, 'unknown good', (v, at) => int(v, at, 1, MARKET_FLOOR)),
  }
}

/** An older v4's chapter (`farm.chapter`, 1 before the global chapters went), read leniently: 1 when it isn't there or
 * isn't a chapter. */
export function legacyChapter(value: unknown): number {
  const chapter = typeof value === 'object' && value !== null ? (value as Obj).chapter : undefined
  return typeof chapter === 'number' && Number.isSafeInteger(chapter) && chapter >= 1 && chapter <= 9 ? chapter : 1
}

// --- The morning summary: ids and counts only, the morning it was built for ---------------------

export const none = (value: unknown, path: string): [] => list(value, path, 0, 0) as []

/** §1 The bin: the catalogue's goods and the rings. */
export function parseBinLines(value: unknown, path: string): BinSale[] {
  // A good at one star once, a whole count and gold; the gold isn't re-priced (a later price can't break it).
  return unique(list(value, path, 0, (GOOD_IDS.length + RING_IDS.length) * MAX_STARS).map((v, i): BinSale => {
    const at = `${path}.${i}`
    const b = object(v, at, ['kind', 'id', 'stars', 'count', 'gold', 'demand', 'eased'])
    oneOf(b.kind, `${at}.kind`, ['sold'] as const)
    const id = typeof b.id === 'string' && isGoodOrRingId(b.id) ? b.id : fail(`${at}.id`, 'unknown good')
    return {
      kind: 'sold', id, stars: int(b.stars, `${at}.stars`, 1, MAX_STARS), count: int(b.count, `${at}.count`, 1, Number.MAX_SAFE_INTEGER), gold: count(b.gold, `${at}.gold`),
      demand: bool(b.demand, `${at}.demand`),
      // A flood's ease, in percent: a morning from before the market has none.
      ...(b.eased === undefined ? {} : { eased: int(b.eased, `${at}.eased`, 1, 100) }),
    }
  }), path, (b) => `${b.id}@${b.stars}`)
}

/** §1½ Food, upkeep and loans: a loan's share once a loan (what's left, 0 once cleared), the staff meal once (its mouths
 * from 1, its well-fed days 1–3), the pantry once (meals eaten,
 * spoiled and the Umas well fed), the takeout once (a meal or more, paid no more than due), the upkeep once (paid no more
 * than due), a short night once (gold owed from 1, the nights in a row from 1), the owed paid once. An older morning has
 * no food lines. */
export function parseMoneyLines(value: unknown, path: string): MoneyLine[] {
  const gold = (v: unknown, at: string, min = 0) => int(v, at, min, Number.MAX_SAFE_INTEGER)
  return unique(list(value, path, 0, MAX_LOANS + 6).map((v, i): MoneyLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['loan', 'staff', 'pantry', 'takeout', 'upkeep', 'short', 'paid-up'] as const)
    switch (kind) {
      case 'staff': {
        const m = object(v, at, ['kind', 'mouths', 'days'])
        return { kind, mouths: gold(m.mouths, `${at}.mouths`, 1), days: int(m.days, `${at}.days`, 1, 3) }
      }
      case 'loan': {
        const l = object(v, at, ['kind', 'for', 'paid', 'left'])
        return { kind, for: isLoanFor(l.for) ? l.for : fail(`${at}.for`, LOAN_FOR_WORDS), paid: gold(l.paid, `${at}.paid`), left: gold(l.left, `${at}.left`) }
      }
      case 'pantry': {
        const p = object(v, at, ['kind', 'meals', 'spoiled', 'fed'])
        return { kind, meals: gold(p.meals, `${at}.meals`), spoiled: gold(p.spoiled, `${at}.spoiled`), fed: gold(p.fed, `${at}.fed`) }
      }
      case 'takeout': {
        const t = object(v, at, ['kind', 'meals', 'paid', 'due'])
        const due = gold(t.due, `${at}.due`, 1)
        return { kind, meals: gold(t.meals, `${at}.meals`, 1), paid: int(t.paid, `${at}.paid`, 0, due), due }
      }
      case 'upkeep': {
        const u = object(v, at, ['kind', 'paid', 'due'])
        const due = gold(u.due, `${at}.due`, 1)
        return { kind, paid: int(u.paid, `${at}.paid`, 0, due), due }
      }
      case 'short': {
        const s = object(v, at, ['kind', 'owed', 'nights'])
        return { kind, owed: gold(s.owed, `${at}.owed`, 1), nights: gold(s.nights, `${at}.nights`, 1) }
      }
      case 'paid-up': return { kind, owed: gold(object(v, at, ['kind', 'owed']).owed, `${at}.owed`, 1) }
    }
  }), path, (m) => (m.kind === 'loan' ? `loan:${m.for}` : m.kind))
}

/** §2 Work done: each farmhand's day once (an Uma on the roster: her actions and those spent, half pace and well fed,
 * what she did by task and the goods it brought); each station's loads, one a level (an output it makes at its stars, 1 up to a
 * farmhand's biggest); the Coop's and the Barn's night once each (animals fed, hungry and with a good waiting, each up to
 * a building's room); the field's growth once (tiles that grew, 1 or more, and how many of them turned ripe); a crop
 * that withered once, on 1 or more tiles. */
export function parseWorkLines(value: unknown, path: string, roster: ReadonlySet<string>): WorkLine[] {
  const tiles = (value: unknown, at: string, min = 1) => int(value, at, min, MAX_FIELD_TILES)
  const loads = new Map<string, number>()
  return unique(list(value, path, 0, roster.size + STATIONS.length * STATION_MAX_LEVEL + RANCH_HOMES.length + 4 + MAX_FIELD_TILES).map((v, i): WorkLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['farmhand', 'load', 'ranch', 'grew', 'withered', 'expedition'] as const)
    if (kind === 'expedition') return { kind, ...parseExpeditionReturn(v, at, roster, true) }
    if (kind === 'ranch') {
      // A building's night: its animals fed today, those that went hungry, and the goods waiting this morning.
      const r = object(v, at, ['kind', 'home', 'fed', 'hungry', 'ready'])
      const animals = (n: unknown, p: string) => int(n, p, 0, HOME_ROOM)
      return { kind, home: oneOf(r.home, `${at}.home`, RANCH_HOMES), fed: animals(r.fed, `${at}.fed`), hungry: animals(r.hungry, `${at}.hungry`), ready: animals(r.ready, `${at}.ready`) }
    }
    if (kind === 'farmhand') {
      const f = object(v, at, ['kind', 'id', 'actions', 'spent', 'half', 'fed', 'tasks', 'done', 'items', 'kitchen'])
      const actions = int(f.actions, `${at}.actions`, 0, MAX_HAND_ACTIONS)
      return {
        kind, id: member(f.id, `${at}.id`, roster), actions, spent: int(f.spent, `${at}.spent`, 0, actions), half: bool(f.half, `${at}.half`), fed: bool(f.fed, `${at}.fed`),
        tasks: int(f.tasks, `${at}.tasks`, 0, MAX_TASKS),
        done: counts(f.done, `${at}.done`, (k) => (TASK_KINDS as readonly string[]).includes(k), 'unknown task'), items: count(f.items, `${at}.items`),
        // Her action at the Kitchen's play as its assistant (F92); older lines have none.
        ...(f.kitchen !== undefined ? { kitchen: int(f.kitchen, `${at}.kitchen`, 1, actions) } : {}),
      }
    }
    if (kind === 'load') {
      const l = object(v, at, ['kind', 'station', 'item', 'count'])
      const station = oneOf(l.station, `${at}.station`, STATIONS)
      const key = typeof l.item === 'string' ? parseStockKey(l.item) : null
      const job = key ? stationJobOf(key.id) : null
      if (!key || !job || STATION_JOBS[job].station !== station) fail(`${at}.item`, 'expected a good this station makes, at its stars')
      return { kind, station, item: l.item as string, count: int(l.count, `${at}.count`, 1, MAX_LOAD) }
    }
    if (kind === 'grew') {
      const g = object(v, at, ['kind', 'tiles', 'ripe'])
      const grew = tiles(g.tiles, `${at}.tiles`)
      const ripe = tiles(g.ripe, `${at}.ripe`, 0)
      if (ripe > grew) fail(`${at}.ripe`, 'more than grew')
      return { kind, tiles: grew, ripe }
    }
    const c = object(v, at, ['kind', 'crop', 'tiles'])
    const crop = typeof c.crop === 'string' && isCropId(c.crop) ? c.crop : fail(`${at}.crop`, 'unknown crop')
    return { kind, crop, tiles: tiles(c.tiles, `${at}.tiles`) }
  }), path, (w) => (w.kind === 'farmhand' ? `farmhand:${w.id}` : w.kind === 'load' ? loadKey(w.station) : w.kind === 'ranch' ? `ranch:${w.home}` : w.kind === 'grew' ? 'grew'
    : w.kind === 'expedition' ? `expedition:${w.party[0]}:${w.left}` : `withered:${w.crop}`))
  // A station's loads: one a level, so up to its top level's (each its own line, in the order started).
  function loadKey(station: string): string {
    const n = (loads.get(station) ?? 0) + 1
    loads.set(station, n)
    if (n > STATION_MAX_LEVEL) fail(path, `more than ${STATION_MAX_LEVEL} loads at the ${station}`)
    return `load:${station}:${n}`
  }
}
/** The most actions a farmhand's day can hold: well past any she grows to. */
const MAX_HAND_ACTIONS = 30

/** §3 Ranks: rank-ups, then points full, each an Uma on the roster in an activity, a rank Hand–Legend; then aptitudes
 * up, an Uma on the roster in an aptitude, a level 2–10; once each. */
export function parseRankLines(value: unknown, path: string, roster: ReadonlySet<string>): RankLine[] {
  return unique(list(value, path, 0, (2 * ACTIVITIES.length + APTITUDE_IDS.length) * roster.size).map((v, i): RankLine => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['rank-up', 'full', 'aptitude'] as const)
    if (kind === 'aptitude') {
      const a = object(v, at, ['kind', 'outfitId', 'aptitude', 'level'])
      return { kind, outfitId: member(a.outfitId, `${at}.outfitId`, roster), aptitude: oneOf(a.aptitude, `${at}.aptitude`, APTITUDE_IDS), level: int(a.level, `${at}.level`, 2, 10) }
    }
    const r = object(v, at, kind === 'full' ? ['kind', 'outfitId', 'activity', 'rank', 'challenge'] : ['kind', 'outfitId', 'activity', 'rank'])
    const line = { outfitId: member(r.outfitId, `${at}.outfitId`, roster), activity: oneOf(r.activity, `${at}.activity`, ACTIVITIES), rank: int(r.rank, `${at}.rank`, 1, 5) as Rank }
    return kind === 'full' ? { kind, ...line, challenge: count(r.challenge, `${at}.challenge`) } : { kind, ...line }
  }), path, (r) => `${r.kind}:${r.outfitId}:${r.kind === 'aptitude' ? r.aptitude : r.activity}`)
}

/** §5's kinds: the roster's arrivals are §4's hearts. */
const NEWS_KINDS = ['story', 'season', 'new-year', 'festival', 'days', 'notes', 'chapter', 'built', 'farm-rank', 'milestone', 'dorm', 'home', 'household'] as const
/** A festival's id in the news: one of the game's five, or one of the story's own (its world.json is the pack's, so the
 * save reads the id's shape only). */
const FESTIVAL_NEWS_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
/** The household milestones a morning may announce. */
const HOUSEHOLD_NEWS = [1, 5, 10, 15, 20] as const

/** The most Umas a retired Dorm's "home" line named: its top level's 20 beds. */
const DORM_HOME_NEWS = 20
/** §5 New today. An older v4's "chapter done" line (the global chapters') and the retired Dorm's lines are read and
 * dropped. */
export function parseNewsLines(value: unknown, path: string, roster: ReadonlySet<string>): NewsLine[] {
  // A new story release, the season, New Year's, festivals and the story's days (today and tomorrow), the goals' news,
  // the retired Dorm's news (read and dropped), and the household's.
  const read = list(value, path, 0, 1 + 8 + 4 + 1 + MAX_GOAL_NEWS + 2 + HOUSEHOLD_NEWS.length).map((v, i): NewsLine | null => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, NEWS_KINDS)
    switch (kind) {
      // A story release that reached the device: its ship's number (its note is the release's, never the save's).
      case 'story': return { kind, number: int(object(v, at, ['kind', 'number']).number, `${at}.number`, 1, Number.MAX_SAFE_INTEGER) }
      case 'chapter': int(object(v, at, ['kind', 'chapter']).chapter, `${at}.chapter`, 1, 8); return null
      // A place built overnight, a Farm Rank reached (2–10), a Diary milestone or row paid.
      case 'built': {
        // A station's or the Kitchen's new level (2–5) comes with it once a level goes up; a morning from before levels has none.
        const b = object(v, at, ['kind', 'place', 'level'])
        const place = typeof b.place === 'string' && isBuildPlace(farmPlace(b.place)) ? b.place as FarmPlaceId : fail(`${at}.place`, 'expected a place you build')
        if (b.level !== undefined && !isStation(place) && place !== 'kitchen') fail(`${at}.level`, 'only a station or the Kitchen goes up a level')
        return { kind, place, ...(b.level === undefined ? {} : { level: int(b.level, `${at}.level`, 2, STATION_MAX_LEVEL) }) }
      }
      case 'farm-rank': return { kind, rank: int(object(v, at, ['kind', 'rank']).rank, `${at}.rank`, 2, FARM_RANK_POINTS.length) }
      case 'milestone': {
        const id = object(v, at, ['kind', 'id']).id
        return { kind, id: typeof id === 'string' && isDiaryPaidId(id) ? id : fail(`${at}.id`, 'unknown milestone') }
      }
      case 'season': return { kind, season: oneOf(object(v, at, ['kind', 'season']).season, `${at}.season`, SEASONS) }
      case 'festival': {
        const f = object(v, at, ['kind', 'festival', 'when'])
        const festival = typeof f.festival === 'string' && FESTIVAL_NEWS_ID.test(f.festival) && f.festival.length <= 40 ? f.festival : fail(`${at}.festival`, 'expected a festival’s id')
        return { kind, festival, when: oneOf(f.when, `${at}.when`, ['today', 'tomorrow'] as const) }
      }
      case 'new-year': return { kind, when: oneOf(object(v, at, ['kind', 'when']).when, `${at}.when`, ['today', 'tomorrow'] as const) }
      // The story's holidays and minor days, by id.
      case 'days': {
        const d = object(v, at, ['kind', 'ids', 'when'])
        const ids = list(d.ids, `${at}.ids`, 1, 40).map((id, j) => (typeof id === 'string' && FESTIVAL_NEWS_ID.test(id) && id.length <= 40 ? id : fail(`${at}.ids.${j}`, 'expected a day’s id')))
        return { kind, ids: unique(ids, `${at}.ids`), when: oneOf(d.when, `${at}.when`, ['today', 'tomorrow'] as const) }
      }
      // The Town notes the night unlocked.
      case 'notes': {
        const ids = keys(object(v, at, ['kind', 'ids']).ids, `${at}.ids`)
        return { kind, ids: ids.length > 0 ? ids : fail(`${at}.ids`, 'expected a note’s id') }
      }
      // The retired Dorm's news, a new level or Umas home from a swap: a morning from before its retirement is read and
      // drops it.
      case 'dorm': int(object(v, at, ['kind', 'level']).level, `${at}.level`, 2, DORM_MAX_LEVEL); return null
      case 'home': list(object(v, at, ['kind', 'umas']).umas, `${at}.umas`, 1, DORM_HOME_NEWS).forEach((id, j) => member(id, `${at}.umas.${j}`, roster)); return null
      // A household milestone.
      case 'household': {
        const married = object(v, at, ['kind', 'married']).married
        return { kind, married: (HOUSEHOLD_NEWS as readonly unknown[]).includes(married) ? married as number : fail(`${at}.married`, 'expected 1, 5, 10, 15 or 20') }
      }
    }
  })
  return unique(read.filter((n): n is NewsLine => n !== null), path, (n) => (n.kind === 'story' || n.kind === 'season' || n.kind === 'notes' ? n.kind
    : n.kind === 'festival' || n.kind === 'new-year' || n.kind === 'days' ? `${n.kind}:${n.when}` : n.kind === 'built' ? `built:${n.place}` : n.kind === 'farm-rank' ? `farm-rank:${n.rank}`
      : n.kind === 'milestone' ? `milestone:${n.id}` : `household:${n.married}`))
}

/** §6 Today's nudges: tiles to water and tiles to plant, each once, 1 or more. */
export function parseNudges(value: unknown, path: string): Nudge[] {
  return unique(list(value, path, 0, 2).map((v, i): Nudge => {
    const at = `${path}.${i}`
    const kind = oneOf(record(v, at).kind, `${at}.kind`, ['water', 'seeds'] as const)
    return { kind, tiles: int(object(v, at, ['kind', 'tiles']).tiles, `${at}.tiles`, 1, MAX_FIELD_TILES) }
  }), path, (n) => n.kind)
}
