// The farm's save (FM16, F3): local first in Dexie, synced through `farm-api`. Nothing carries over from uma-rpg (P4).
// The shape, its parse and the conflict rule are copied from uma-rpg's `save/save.ts` at 30a322a (D32, D45, D260), cut to
// the farm's one account. Every change to the shape is a new version with its migration (N5): `parseSave` takes any
// version the farm ever wrote and returns the current one, and never moves `account.updatedAt`.

/** The save's version now. */
export const SAVE_VERSION = 1

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

/** The save as the app and the API use it: always the current version. */
export type Save = SaveV1

/** What the API stores and returns: the save and its revision (0: nothing stored yet). */
export interface SaveEnvelope {
  revision: number
  save: Save | null
}

/** A save upload: the revision it was based on, the save, and the version the client sent before any migration. */
export interface SavePut {
  baseRevision: number
  save: Save
  /** The API refuses a version older than what it stores (uma-rpg D45). */
  sentVersion: number
}

export class SaveParseError extends Error {
  readonly path: string
  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'SaveParseError'
    this.path = path
  }
}

/** A new account's save. */
export function newSave(uid: string, now: string): Save {
  return { version: SAVE_VERSION, account: { uid, createdAt: now, updatedAt: now } }
}

/** A save after a player's change at `now`: the only thing that moves `updatedAt`. */
export const touched = (save: Save, now: string): Save => ({ ...save, account: { ...save.account, updatedAt: now } })

/** The conflict rule (uma-rpg D32): when two devices both changed the save, the one changed last wins whole, and a tie
 * keeps this device's. The loser is kept, never dropped: as a safety copy on the device, or in `saveRescues` on the server. */
export function resolveConflict(local: Save, remote: Save): Save {
  return Date.parse(local.account.updatedAt) >= Date.parse(remote.account.updatedAt) ? local : remote
}

// --- Parsing: explicit, path-reporting, strict on unknown keys so an older client can't half-write a newer save ---------

type Obj = Record<string, unknown>

function object(value: unknown, path: string, keys: readonly string[]): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SaveParseError(path, 'expected an object')
  const extra = Object.keys(value).filter((k) => !keys.includes(k))
  if (extra.length > 0) throw new SaveParseError(path, `unknown keys ${extra.join(', ')}`)
  return value as Obj
}

function count(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new SaveParseError(path, 'expected a non-negative integer')
  return value
}

function timestamp(value: unknown, path: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new SaveParseError(path, 'expected an ISO timestamp')
  return value
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) throw new SaveParseError(path, 'expected a non-empty string')
  return value
}

function parseAccount(value: unknown, path: string): Account {
  const o = object(value, path, ['uid', 'createdAt', 'updatedAt'])
  return { uid: text(o.uid, `${path}.uid`), createdAt: timestamp(o.createdAt, `${path}.createdAt`), updatedAt: timestamp(o.updatedAt, `${path}.updatedAt`) }
}

/** The version a stored or sent value claims, or 0 when it claims none. */
export function versionOf(value: unknown): number {
  const v = (value as { version?: unknown } | null)?.version
  return typeof v === 'number' && Number.isSafeInteger(v) ? v : 0
}

/** Parses a save of any version the farm has written and returns the current one. A version from a newer app is refused,
 * so an old client can never half-read a newer save. */
export function parseSave(value: unknown, path = 'save'): Save {
  const version = versionOf(value)
  if (version > SAVE_VERSION) throw new SaveParseError(`${path}.version`, `version ${version} is newer than this app (${SAVE_VERSION})`)
  if (version !== 1) throw new SaveParseError(`${path}.version`, `expected 1–${SAVE_VERSION}`)
  const o = object(value, path, ['version', 'account'])
  return { version: 1, account: parseAccount(o.account, `${path}.account`) }
}

/** The body of `PUT /api/save`. */
export function parseSavePut(value: unknown): SavePut {
  const o = object(value, 'body', ['baseRevision', 'save'])
  return { baseRevision: count(o.baseRevision, 'body.baseRevision'), save: parseSave(o.save, 'body.save'), sentVersion: versionOf(o.save) }
}
