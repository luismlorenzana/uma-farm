// What one sync round should do, as a pure decision (copied from uma-rpg at 30a322a; its D32): adopt the server's save,
// push ours, or nothing. Generic over the save, so the store's v3 stays v3 (F24).
import { resolveConflict, type StoredSave } from '@farm/domain'

export interface LocalState<S extends StoredSave = StoredSave> {
  revision: number
  save: S | null
  dirty: boolean
}

/** What the server holds: a revision and its save (0 and null: nothing yet). */
export interface RemoteState<S extends StoredSave = StoredSave> {
  revision: number
  save: S | null
}

export type SyncStep<S extends StoredSave = StoredSave> =
  /** `replacesUnsynced`: this device holds changes the server never got, so a safety copy comes first. */
  | { kind: 'adopt'; envelope: { revision: number; save: S }; replacesUnsynced: boolean }
  | { kind: 'push'; baseRevision: number; save: S }
  | { kind: 'none' }

export function reconcile<S extends StoredSave>(local: LocalState<S>, remote: RemoteState<S>): SyncStep<S> {
  if (!remote.save) return local.save ? { kind: 'push', baseRevision: remote.revision, save: local.save } : { kind: 'none' }
  const remoteEnvelope = { revision: remote.revision, save: remote.save }
  if (!local.save) return { kind: 'adopt', envelope: remoteEnvelope, replacesUnsynced: false }
  if (!local.dirty) return remote.revision > local.revision ? { kind: 'adopt', envelope: remoteEnvelope, replacesUnsynced: false } : { kind: 'none' }
  if (remote.revision === local.revision) return { kind: 'push', baseRevision: local.revision, save: local.save }
  // The server moved on while this device had changes: the save changed last wins whole.
  return resolveConflict(local.save, remote.save) === local.save
    ? { kind: 'push', baseRevision: remote.revision, save: local.save }
    : { kind: 'adopt', envelope: remoteEnvelope, replacesUnsynced: true }
}
