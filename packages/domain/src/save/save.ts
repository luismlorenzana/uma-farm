// The farm's save: local first in Dexie, synced through `farm-api`. Nothing carries over from uma-rpg.
// The envelope, the parse and the conflict rule are copied from uma-rpg's `save/save.ts` at 30a322a, cut to the farm's
// one account. No change ever moves `account.updatedAt` but a player's own (`touched`).
//
// V6 expands the calendar. V5 is read in full and converted on the device.
// Saves from before v5 provide the account for a fresh farm. A newer version is refused.
import { object, parseAccount, count, SaveParseError } from './parse'
import { parseSaveV5, parseSaveV6 } from './parse-v4'
import { legacyDateDay, turnOfDateDay } from '../farm/calendar'
import type { SaveV5, SaveV6 } from './v4'

export { SaveParseError }

/** The version the farm writes. V5 is read whole and expanded on the device. */
export const SAVE_VERSION = 6

export interface Account {
  /** The Firebase uid the save belongs to. */
  uid: string
  createdAt: string
  /** When the save last changed on a device: the conflict rule's clock. Only a player's own change moves it. */
  updatedAt: string
}

/** A save from before this farm (v1–v4): only its version and account are read. Nothing plays it: the app starts a
 * fresh v6 from its account, and nothing ever writes one again. */
export interface OlderSave {
  version: 1 | 2 | 3 | 4
  account: Account
}

/** A save as stored, including the formats the device can upgrade. */
export type StoredSave = SaveV6 | SaveV5 | OlderSave

/** Whether a stored save is from before v5. */
export const isOlderSave = (save: StoredSave): save is OlderSave => save.version < 5

/** Keep elapsed turns intact. A booked wedding is a civil appointment and keeps its old printed date. */
export function expandCalendar(save: SaveV5): SaveV6 {
  const finishingContest = save.workshops.current?.play === 'contest' ? 'cooking-contest' as const : save.workshops.festival?.active?.id
  const calendar = { ...save.calendar, expandedAt: save.calendar.day, ...(finishingContest ? { finishingContest } : {}) }
  const love = Object.fromEntries(Object.entries(save.love).map(([id, route]) => [
    id, route.weddingDay !== undefined && route.weddingDay > calendar.day
      ? { ...route, weddingDay: turnOfDateDay(legacyDateDay(route.weddingDay, save.calendar), calendar) }
      : route,
  ]))
  return parseSaveV6({ ...save, version: SAVE_VERSION, calendar, love })
}

/** What the API stores and returns: the save and its revision (0: nothing stored yet). */
export interface SaveEnvelope {
  revision: number
  save: StoredSave | null
}

/** A save upload: the revision it was based on, and the save. */
export interface SavePut {
  baseRevision: number
  save: SaveV6
}

/** A save after a player's change at `now`: the only thing that moves `updatedAt`. */
export const touched = <S extends SaveV6>(save: S, now: string): S => ({ ...save, account: { ...save.account, updatedAt: now } })

/** The conflict rule: when two devices both changed the save, the one changed last wins whole, and a tie
 * keeps this device's. The loser is kept, never dropped: as a safety copy on the device, or in `saveRescues` on the server. */
export function resolveConflict<S extends StoredSave>(local: S, remote: S): S {
  return Date.parse(local.account.updatedAt) >= Date.parse(remote.account.updatedAt) ? local : remote
}

/** The version a stored or sent value claims, or 0 when it claims none. */
export function versionOf(value: unknown): number {
  const v = (value as { version?: unknown } | null)?.version
  return typeof v === 'number' && Number.isSafeInteger(v) ? v : 0
}

function refuseNewer(value: unknown, path: string): void {
  const version = versionOf(value)
  if (version > SAVE_VERSION) throw new SaveParseError(`${path}.version`, `version ${version} is newer than this app (${SAVE_VERSION})`)
}

/** Parses a save v5, strictly: what an upload must be. An older save is refused (the app starts it over and uploads the
 * new farm), and so is a save from a newer app, so an old client can never half-read or overwrite a newer save. */
export function parseSave(value: unknown, path = 'save'): SaveV6 {
  refuseNewer(value, path)
  const version = versionOf(value)
  if (version !== SAVE_VERSION) throw new SaveParseError(`${path}.version`, `expected ${SAVE_VERSION}${version === 5 ? ': update the farm to convert this save' : version >= 1 ? ': an older save starts over on the device' : ''}`)
  return parseSaveV6(value, path)
}

/** Reads a save as stored, on the server or a device: v5 or v6 parsed strictly, or an older save's version and account (the
 * rest stays as stored, unread). A save from a newer app is refused. */
export function parseStored(value: unknown, path = 'save'): StoredSave {
  refuseNewer(value, path)
  const version = versionOf(value)
  if (version === 5) return parseSaveV5(value, path)
  if (version >= 1 && version < 5) {
    const account = parseAccount((value as { account?: unknown }).account, `${path}.account`)
    return { version: version as OlderSave['version'], account }
  }
  return parseSave(value, path)
}

/** The body of `PUT /api/save`. */
export function parseSavePut(value: unknown): SavePut {
  const o = object(value, 'body', ['baseRevision', 'save'])
  return { baseRevision: count(o.baseRevision, 'body.baseRevision'), save: parseSave(o.save, 'body.save') }
}
