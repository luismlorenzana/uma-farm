// What one sync round should do, as a pure decision (copied from uma-rpg at 30a322a; its D32): adopt the server's save,
// push ours, or nothing.
import { resolveConflict, type SaveEnvelope, type StoredSave } from '@farm/domain'

export interface LocalState {
  revision: number
  save: StoredSave | null
  dirty: boolean
}

export type SyncStep =
  /** `replacesUnsynced`: this device holds changes the server never got, so a safety copy comes first. */
  | { kind: 'adopt'; envelope: SaveEnvelope & { save: StoredSave }; replacesUnsynced: boolean }
  | { kind: 'push'; baseRevision: number; save: StoredSave }
  | { kind: 'none' }

export function reconcile(local: LocalState, remote: SaveEnvelope): SyncStep {
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
