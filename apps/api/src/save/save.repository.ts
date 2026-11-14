import type { SaveEnvelope, SaveV4 } from '@farm/domain'

/** A stale write: the stored revision moved on, or the client's save is older than what's stored. Carries what's stored so
 * the client can reconcile. */
export class RevisionConflict extends Error {
  readonly current: SaveEnvelope
  constructor(current: SaveEnvelope) {
    super(`revision conflict: stored ${current.revision}`)
    this.name = 'RevisionConflict'
    this.current = current
  }
}

// One snapshot document per account. A local JSON file in dev, Firestore's `farm` database in production. Copied from
// uma-rpg's `apps/api/src/save` at 30a322a. It stores a v5 as sent; a stored save from before v5 reads as its version and
// account (`parseStored`) until the first v5 replaces it.
export interface SaveRepository {
  load(uid: string): Promise<SaveEnvelope>
  /** Stores `save` as `baseRevision + 1` when the stored revision equals `baseRevision` and the save's version isn't
   * older than the stored one; otherwise RevisionConflict with what's stored. */
  put(uid: string, baseRevision: number, save: SaveV4): Promise<SaveEnvelope>
  /** Keeps an upload this server refused, as sent: the device may hold the only copy. */
  rescue(uid: string, upload: unknown, reason: string): Promise<void>
}

export const SAVE_REPOSITORY = Symbol('SAVE_REPOSITORY')

export const EMPTY_ENVELOPE: SaveEnvelope = { revision: 0, save: null }
