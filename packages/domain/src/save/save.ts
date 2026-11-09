// The farm's save (FM16, F3): local first in Dexie, synced through `farm-api`. Nothing carries over from uma-rpg (P4).
// The shape, its parse and the conflict rule are copied from uma-rpg's `save/save.ts` at 30a322a (D32, D45, D260), cut to
// the farm's one account. Every change to the shape is a new version with its migration (N5), and no migration ever moves
// `account.updatedAt`.
//
// v1 (F3): the account. v2 (F4, FW5): the Wilds' world beside it: each Uma's Craft Level, the Warehouse and the work rows.
// v3 (F17, CS53): the farm's own loop (`v3.ts`). M4 is dark-launched (D29): production plays the Wilds on v2 until F24, so
// `parseSave` returns what's stored, v2 or v3 (a v1 still becomes v2), and the loop's boot migrates a v2 with master data
// (`migrate-v3.ts`), which the API's parse doesn't have.
import type { DroppedQueue, Entry, ItemQty, LastWork, Refusal, SlotRef, WorkOutput, WorkRow } from '@luismlorenzana/uma-work'
import type { JobKind } from '../economy/jobs'
import { maxJobCount, PROFESSION_MAX_LEVEL } from '../economy/pacing'
import { jobKindV4, placeSpecV4 } from '../economy/places-v4'
import { PLACE_SLOTS_V3 } from '../economy/professions'
import { isStockItemId } from '../items/stock-id'
import { isOutfitId } from '../roster/roster'
import type { FarmWorkRequest } from '../work/request'
import type { FarmUma, FarmWorld, ProfessionLevel } from '../work/world'
import { count, list, object, parseAccount, positive, record, SaveParseError } from './parse'
import { parseSaveV3 } from './parse-v3'
import type { SaveV3 } from './v3'

export { SaveParseError }

/** The Wilds' save version: what production writes until F24 turns the loop on (D29). */
export const SAVE_VERSION = 2
/** The newest version this app reads: v3, built in F17 and live from F24. */
export const NEWEST_SAVE_VERSION = 3

export interface Account {
  /** The Firebase uid the save belongs to. */
  uid: string
  createdAt: string
  /** When the save last changed on a device: the conflict rule's clock. Only a player's own change moves it. */
  updatedAt: string
}

export interface SaveV1 {
  version: 1
  account: Account
}

/** Save v2 (F4): the account and the Wilds' world, whole. */
export interface SaveV2 extends FarmWorld {
  version: 2
  account: Account
}

/** The Wilds' save, which their code plays: v2 until F24 retires the Wilds. The loop's is `SaveV3`. */
export type Save = SaveV2

/** A save as stored and synced while M4 is dark: the Wilds' v2 or the loop's v3 (D29). */
export type StoredSave = SaveV2 | SaveV3

/** What the API stores and returns: the save and its revision (0: nothing stored yet). */
export interface SaveEnvelope {
  revision: number
  save: StoredSave | null
}

/** A save upload: the revision it was based on, the save, and the version the client sent before any migration. */
export interface SavePut {
  baseRevision: number
  save: StoredSave
  /** The API refuses a version older than what it stores (uma-rpg D45). */
  sentVersion: number
}

/** A new Wilds account's save: nobody has worked yet, and the Warehouse is empty. The loop's day 1 is `newSave` (v3). */
export function newSaveV2(uid: string, now: string): SaveV2 {
  return { version: 2, account: { uid, createdAt: now, updatedAt: now }, umas: {}, items: {}, buildings: {}, work: {} }
}

/** A save after a player's change at `now`: the only thing that moves `updatedAt`. */
export const touched = <S extends StoredSave>(save: S, now: string): S => ({ ...save, account: { ...save.account, updatedAt: now } })

/** The world after a player's change, put back in its save at `now` (uma-rpg's `withWorld`). */
export function withWorld(save: Save, world: FarmWorld, now: string): Save {
  return { ...save, account: { ...save.account, updatedAt: now }, umas: world.umas, items: world.items, buildings: world.buildings, work: world.work }
}

/** The conflict rule (uma-rpg D32): when two devices both changed the save, the one changed last wins whole, and a tie
 * keeps this device's. The loser is kept, never dropped: as a safety copy on the device, or in `saveRescues` on the server. */
export function resolveConflict<S extends StoredSave>(local: S, remote: S): S {
  return Date.parse(local.account.updatedAt) >= Date.parse(remote.account.updatedAt) ? local : remote
}

// --- Migrations: each older version to the next, never moving `account.updatedAt` --------------------------------------

/** v1 → v2 (F4): the Wilds arrive empty. */
export function toV2(save: SaveV1): SaveV2 {
  return { version: 2, account: save.account, umas: {}, items: {}, buildings: {}, work: {} }
}

// --- Parsing: explicit, path-reporting, strict on unknown keys (the helpers are `parse.ts`'s) -------------------------

function parseCraft(value: unknown, path: string): ProfessionLevel {
  const v = object(value, path, ['level', 'exp'])
  const level = count(v.level, `${path}.level`)
  if (level < 1 || level > PROFESSION_MAX_LEVEL) throw new SaveParseError(`${path}.level`, `expected 1–${PROFESSION_MAX_LEVEL}`)
  return { level, exp: count(v.exp, `${path}.exp`) }
}

function parseUmas(value: unknown, path: string): Record<string, FarmUma> {
  const out: Record<string, FarmUma> = {}
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    if (!isOutfitId(id)) throw new SaveParseError(at, 'outfit ids are positive integers')
    out[id] = { craft: parseCraft(object(raw, at, ['craft']).craft, `${at}.craft`) }
  }
  return out
}

/** The Warehouse (H77, the farm by line, D224): the hundred line items and the made items. */
function parseStock(value: unknown, path: string): Record<string, number> {
  const items: Record<string, number> = {}
  for (const [id, n] of Object.entries(record(value, path))) {
    if (!isStockItemId(id)) throw new SaveParseError(`${path}.${id}`, 'unknown item')
    const c = count(n, `${path}.${id}`)
    if (c > 0) items[id] = c
  }
  return items
}

// --- Work (SC3): the shared engine's rows, parsed strictly (uma-rpg's v31 rules: fifteen places, four slots) ------------

/** Up to three requests wait behind the running one (the engine's MAX_QUEUE). */
const MAX_QUEUED = 3
/** The most started entries a row can hold: one running and its queue's finished ones waiting for Collect. */
const MAX_ENTRIES = MAX_QUEUED + 1

/** A slot: one of the fifteen places (FL25), four slots each. */
function parseSlot(value: unknown, path: string): SlotRef {
  const o = object(value, path, ['building', 'slot'])
  if (typeof o.building !== 'string' || !placeSpecV4(o.building)) throw new SaveParseError(`${path}.building`, 'not a place')
  const slot = count(o.slot, `${path}.slot`)
  if (slot >= PLACE_SLOTS_V3) throw new SaveParseError(`${path}.slot`, 'no such slot')
  return { building: o.building, slot }
}

/** A request at a slot: the place's one kind, an item the place makes, 1 to the kind's most. */
function parseRequest(value: unknown, path: string, slot: SlotRef): FarmWorkRequest {
  const r = object(value, path, ['kind', 'item', 'count'])
  const kindAtPlace = placeSpecV4(slot.building)!.kinds[0]!
  if (r.kind !== kindAtPlace) throw new SaveParseError(`${path}.kind`, `expected ${kindAtPlace}`)
  const kind = r.kind as JobKind
  if (typeof r.item !== 'string' || jobKindV4(slot.building, r.item) !== kind) throw new SaveParseError(`${path}.item`, 'not made at this place')
  const n = count(r.count, `${path}.count`)
  if (n < 1 || n > maxJobCount(kind)) throw new SaveParseError(`${path}.count`, `expected 1–${maxJobCount(kind)}`)
  return { kind, item: r.item, count: n }
}

function parseQty(value: unknown, path: string): ItemQty {
  const o = object(value, path, ['item', 'qty'])
  if (typeof o.item !== 'string' || !isStockItemId(o.item)) throw new SaveParseError(`${path}.item`, 'unknown item')
  const qty = count(o.qty, `${path}.qty`)
  if (qty < 1) throw new SaveParseError(`${path}.qty`, 'expected at least 1')
  return { item: o.item, qty }
}

const ENTRY_KEYS = ['request', 'seconds', 'inputs', 'outputs', 'exp', 'startedAt', 'acceleratedMs', 'collected', 'speed', 'fromQueue'] as const

function parseEntry(value: unknown, path: string, slot: SlotRef): Entry<FarmWorkRequest> {
  const e = object(value, path, ENTRY_KEYS)
  const request = parseRequest(e.request, `${path}.request`, slot)
  const n = request.count
  const each = <T>(raw: unknown, key: string, parse: (v: unknown, at: string) => T): T[] => list(raw, `${path}.${key}`, n, n).map((v, i) => parse(v, `${path}.${key}.${i}`))
  const seconds = each(e.seconds, 'seconds', positive)
  const inputs = each(e.inputs, 'inputs', (v, at) => list(v, at, 0, 8).map((q, j) => parseQty(q, `${at}.${j}`)))
  const outputs = each(e.outputs, 'outputs', (v, at): WorkOutput => {
    const o = object(v, at, ['item'])
    if (o.item !== request.item) throw new SaveParseError(`${at}.item`, 'expected the request\'s item')
    return { item: request.item }
  })
  const exp = each(e.exp, 'exp', count)
  const collected = count(e.collected, `${path}.collected`)
  if (collected > n) throw new SaveParseError(`${path}.collected`, 'more than the entry makes')
  if (typeof e.fromQueue !== 'boolean') throw new SaveParseError(`${path}.fromQueue`, 'expected true or false')
  return { request, seconds, inputs, outputs, exp, startedAt: count(e.startedAt, `${path}.startedAt`), acceleratedMs: count(e.acceleratedMs, `${path}.acceleratedMs`),
    collected, speed: positive(e.speed, `${path}.speed`), fromQueue: e.fromQueue }
}

function parseRefusal(value: unknown, path: string): Refusal | null {
  if (value === null) return null
  const o = object(value, path, ['refused', 'code', 'message', 'data'])
  if (o.refused !== true || typeof o.code !== 'string' || typeof o.message !== 'string') throw new SaveParseError(path, 'expected a refusal')
  if (o.data === undefined) return { refused: true, code: o.code, message: o.message }
  const data = record(o.data, `${path}.data`)
  if (Object.values(data).some((v) => typeof v !== 'string' && typeof v !== 'number')) throw new SaveParseError(`${path}.data`, 'expected strings and numbers')
  return { refused: true, code: o.code, message: o.message, data: data as Record<string, string | number> }
}

function parseDropped(value: unknown, path: string): DroppedQueue<FarmWorkRequest> | null {
  if (value === null) return null
  const d = object(value, path, ['at', 'slot', 'requests', 'short', 'refused'])
  const slot = parseSlot(d.slot, `${path}.slot`)
  return {
    at: count(d.at, `${path}.at`), slot,
    requests: list(d.requests, `${path}.requests`, 1, MAX_QUEUED + 1).map((r, i) => parseRequest(r, `${path}.requests.${i}`, slot)),
    short: list(d.short, `${path}.short`, 0, 8).map((q, i) => parseQty(q, `${path}.short.${i}`)),
    refused: parseRefusal(d.refused, `${path}.refused`),
  }
}

function parseLast(value: unknown, path: string): LastWork<FarmWorkRequest> | null {
  if (value === null) return null
  const l = object(value, path, ['slot', 'request'])
  const slot = parseSlot(l.slot, `${path}.slot`)
  return { slot, request: parseRequest(l.request, `${path}.request`, slot) }
}

/** Places have no levels (PP4): the engine's levels stay empty. */
function parseBuildings(value: unknown, path: string): Record<string, { level: number }> {
  object(value, path, [])
  return {}
}

function parseWork(value: unknown, path: string, umas: Record<string, FarmUma>): Record<string, WorkRow<FarmWorkRequest>> {
  const out: Record<string, WorkRow<FarmWorkRequest>> = {}
  const held = new Set<string>()
  for (const [id, raw] of Object.entries(record(value, path))) {
    const at = `${path}.${id}`
    if (!umas[id]) throw new SaveParseError(at, 'expected an Uma who has worked')
    const r = object(raw, at, ['outfitId', 'slot', 'entries', 'queue', 'last', 'dropped'])
    if (r.outfitId !== id) throw new SaveParseError(`${at}.outfitId`, 'expected its own key')
    const slot = r.slot === null ? null : parseSlot(r.slot, `${at}.slot`)
    const entries = list(r.entries, `${at}.entries`, 0, MAX_ENTRIES)
    const queue = list(r.queue, `${at}.queue`, 0, MAX_QUEUED)
    if (!slot && (entries.length > 0 || queue.length > 0)) throw new SaveParseError(`${at}.slot`, 'work needs a slot')
    if (slot && entries.length > 0) {
      const key = `${slot.building}:${slot.slot}`
      if (held.has(key)) throw new SaveParseError(`${at}.slot`, 'already held')
      held.add(key)
    }
    out[id] = {
      outfitId: id, slot,
      entries: entries.map((e, i) => parseEntry(e, `${at}.entries.${i}`, slot!)),
      queue: queue.map((q, i) => parseRequest(q, `${at}.queue.${i}`, slot!)),
      last: parseLast(r.last, `${at}.last`), dropped: parseDropped(r.dropped, `${at}.dropped`),
    }
  }
  return out
}

/** The version a stored or sent value claims, or 0 when it claims none. */
export function versionOf(value: unknown): number {
  const v = (value as { version?: unknown } | null)?.version
  return typeof v === 'number' && Number.isSafeInteger(v) ? v : 0
}

function parseV1(value: unknown, path: string): SaveV1 {
  const o = object(value, path, ['version', 'account'])
  return { version: 1, account: parseAccount(o.account, `${path}.account`) }
}

function parseV2(value: unknown, path: string): SaveV2 {
  const o = object(value, path, ['version', 'account', 'umas', 'items', 'buildings', 'work'])
  const umas = parseUmas(o.umas, `${path}.umas`)
  return {
    version: 2, account: parseAccount(o.account, `${path}.account`), umas, items: parseStock(o.items, `${path}.items`),
    buildings: parseBuildings(o.buildings, `${path}.buildings`), work: parseWork(o.work, `${path}.work`, umas),
  }
}

/** Parses a save of any version the farm has written and returns it at the version stored (D29): v1 still migrates to v2
 * (`toV2`); v2 stays v2 for the Wilds, and v3 is the loop's. A version from a newer app is refused, so an old client can
 * never half-read a newer save. */
export function parseSave(value: unknown, path = 'save'): StoredSave {
  const version = versionOf(value)
  if (version > NEWEST_SAVE_VERSION) throw new SaveParseError(`${path}.version`, `version ${version} is newer than this app (${NEWEST_SAVE_VERSION})`)
  if (version === 1) return toV2(parseV1(value, path))
  if (version === 2) return parseV2(value, path)
  if (version === 3) return parseSaveV3(value, path)
  throw new SaveParseError(`${path}.version`, `expected 1–${NEWEST_SAVE_VERSION}`)
}

/** The body of `PUT /api/save`. */
export function parseSavePut(value: unknown): SavePut {
  const o = object(value, 'body', ['baseRevision', 'save'])
  return { baseRevision: count(o.baseRevision, 'body.baseRevision'), save: parseSave(o.save, 'body.save'), sentVersion: versionOf(o.save) }
}
