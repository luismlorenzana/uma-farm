// The save's strict parse helpers (F3, F4; shared by every version since F17): explicit, path-reporting, and strict on
// unknown keys, so an older client can't half-write a newer save. Internal to `save/`: the versions' parsers use them.
import type { Account } from './save'

export class SaveParseError extends Error {
  readonly path: string
  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = 'SaveParseError'
    this.path = path
  }
}

export type Obj = Record<string, unknown>

/** An object with exactly these keys at most. */
export function object(value: unknown, path: string, keys: readonly string[]): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SaveParseError(path, 'expected an object')
  const extra = Object.keys(value).filter((k) => !keys.includes(k))
  if (extra.length > 0) throw new SaveParseError(path, `unknown keys ${extra.join(', ')}`)
  return value as Obj
}

/** An object whose keys are data (ids), each checked by its caller. */
export function record(value: unknown, path: string): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new SaveParseError(path, 'expected an object')
  return value as Obj
}

export function count(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new SaveParseError(path, 'expected a non-negative integer')
  return value
}

/** A whole number from `min` to `max`. */
export function int(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new SaveParseError(path, `expected ${min}–${max}`)
  return value
}

/** A non-negative number, fractions allowed (growth, points). */
export function amount(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new SaveParseError(path, 'expected a non-negative number')
  return value
}

export function positive(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new SaveParseError(path, 'expected a positive number')
  return value
}

export function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new SaveParseError(path, 'expected true or false')
  return value
}

export function timestamp(value: unknown, path: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new SaveParseError(path, 'expected an ISO timestamp')
  return value
}

export function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) throw new SaveParseError(path, 'expected a non-empty string')
  return value
}

/** One of a fixed set of strings. */
export function oneOf<T extends string>(value: unknown, path: string, options: readonly T[]): T {
  if (typeof value !== 'string' || !(options as readonly string[]).includes(value)) throw new SaveParseError(path, `expected one of ${options.join(', ')}`)
  return value as T
}

export function list(value: unknown, path: string, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new SaveParseError(path, `expected ${min}–${max} entries`)
  return value
}

/** The account, unchanged since v1. */
export function parseAccount(value: unknown, path: string): Account {
  const o = object(value, path, ['uid', 'createdAt', 'updatedAt'])
  return { uid: text(o.uid, `${path}.uid`), createdAt: timestamp(o.createdAt, `${path}.createdAt`), updatedAt: timestamp(o.updatedAt, `${path}.updatedAt`) }
}
