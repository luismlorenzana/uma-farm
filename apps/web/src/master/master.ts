// Master data, as far as F3 needs it: the release's version, which proves the path from uma-platform's bucket through the
// API's proxy. F4 and F5 build the roster on it. Copied in shape from uma-rpg's `master/master.ts` (30a322a).
import type { ReleaseManifest } from '@luismlorenzana/uma-data'
import { useSyncExternalStore } from 'react'
import { CONTENT } from '../content/client'

export type MasterState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; manifest: ReleaseManifest }
  | { status: 'error'; offline: boolean; message: string }

let state: MasterState = { status: 'idle' }
const listeners = new Set<() => void>()

function set(next: MasterState): void {
  state = next
  for (const listener of listeners) listener()
}

function loadMaster(): void {
  if (state.status === 'loading' || state.status === 'ready') return
  set({ status: 'loading' })
  CONTENT.manifest().then(
    (manifest) => set({ status: 'ready', manifest }),
    (err: unknown) => set({ status: 'error', offline: typeof navigator !== 'undefined' && navigator.onLine === false, message: err instanceof Error ? err.message : String(err) }),
  )
}

export function useMaster(): MasterState {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )
  if (snapshot.status === 'idle') queueMicrotask(loadMaster)
  return snapshot
}

/** Tries again after a failed load (for example back online). */
export function retryMaster(): void {
  if (state.status !== 'error') return
  CONTENT.refresh()
  set({ status: 'idle' })
  loadMaster()
}
