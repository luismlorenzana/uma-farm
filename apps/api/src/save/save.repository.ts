import type { Save, SaveEnvelope } from '@farm/domain'

/** A stale write: the stored revision moved on, or the client's save is older than what's stored. Carries what's stored so
 * the client can reconcile (uma-rpg D32, D45). */
export class RevisionConflict extends Error {
  readonly current: SaveEnvelope
  constructor(current: SaveEnvelope) {
    super(`revision conflict: stored ${current.revision}`)
    this.name = 'RevisionConflict'
    this.current = current
  }
}

// One snapshot document per account. A local JSON file in dev, Firestore's `farm` database in production. Copied from
// uma-rpg's `apps/api/src/save` at 30a322a (F3).
export interface SaveRepository {
  load(uid: string): Promise<SaveEnvelope>
  /** Stores `save` as `baseRevision + 1` when the stored revision equals `baseRevision` and the client's save version isn't
   * older than the stored one; otherwise RevisionConflict with what's stored. */
  put(uid: string, baseRevision: number, save: Save, sentVersion: number): Promise<SaveEnvelope>
  /** Keeps an upload this server refused, as sent (uma-rpg D260): the device may hold the only copy. */
  rescue(uid: string, upload: unknown, reason: string): Promise<void>
}

export const SAVE_REPOSITORY = Symbol('SAVE_REPOSITORY')

export const EMPTY_ENVELOPE: SaveEnvelope = { revision: 0, save: null }
