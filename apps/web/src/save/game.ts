// The farm's store and its sync engine (copied from uma-rpg at 30a322a; its D32, D260): the save lives on the device
// (Dexie) and in a Zustand store; every change writes both and schedules a background sync. Play never waits on the
// network once a device save exists. F4's rules commit through `commit`.
import { newSave, parseSave, touched, type Save } from '@farm/domain'
import { create } from 'zustand'
import { conflictEnvelope, saveApi } from '../api/client'
import { addSafetyCopy, readSafetyCopy, readSaveRow, removeSafetyCopy, writeSaveRow } from './db'
import { reconcile } from './reconcile'

export type GameStatus = 'idle' | 'booting' | 'ready'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface GameState {
  uid: string | null
  status: GameStatus
  save: Save | null
  /** The server revision the save is based on (0: never synced). */
  revision: number
  dirty: boolean
  sync: SyncStatus
  lastSyncedAt: string | null
  /** When a newer save last replaced this device's unsynced changes: a safety copy holds them. */
  replacedAt: string | null
}

const INITIAL: GameState = { uid: null, status: 'idle', save: null, revision: 0, dirty: false, sync: 'idle', lastSyncedAt: null, replacedAt: null }

export const useGame = create<GameState>(() => INITIAL)

const nowIso = () => new Date().toISOString()

function persist(): Promise<void> {
  const { uid, save, revision, dirty, lastSyncedAt } = useGame.getState()
  if (!uid || !save) return Promise.resolve()
  return writeSaveRow({ id: 'main', uid, revision, save, dirty, lastSyncedAt })
}

/**
 * Opens the device save, else the server's, else starts a new account. Safe to call again for the same uid. A fresh
 * device needs the server's answer first: starting a new save offline could later outrank the real one (the conflict rule
 * keeps the save changed last), so boot fails instead and the gate offers Retry.
 */
export async function boot(uid: string): Promise<void> {
  const state = useGame.getState()
  if (state.uid === uid && state.status !== 'idle') return
  useGame.setState({ ...INITIAL, uid, status: 'booting' })
  const row = await readSaveRow(uid)
  if (row) {
    useGame.setState({ status: 'ready', save: row.save, revision: row.revision, dirty: row.dirty, lastSyncedAt: row.lastSyncedAt ?? null })
    void syncNow()
    return
  }
  let remote
  try {
    remote = await saveApi.load()
  } catch (err) {
    useGame.setState({ ...INITIAL })
    throw err
  }
  if (remote.save) {
    useGame.setState({ status: 'ready', save: remote.save, revision: remote.revision, dirty: false, sync: 'synced', lastSyncedAt: nowIso() })
    await persist()
    return
  }
  useGame.setState({ status: 'ready', revision: remote.revision })
  await commit(newSave(uid, nowIso()))
}

export function resetGame(): void {
  useGame.setState(INITIAL)
}

/** Every change goes through here: on screen, on the device, then to the server. */
export async function commit(save: Save): Promise<void> {
  useGame.setState({ save, dirty: true })
  await persist()
  scheduleSync()
}

// --- Sync -------------------------------------------------------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | null = null
let running: Promise<void> | null = null
let again = false

function scheduleSync(delayMs = 1500): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void syncNow()
  }, delayMs)
}

/** One sync pass: read the server, then adopt, push, or do nothing (reconcile.ts). Concurrent calls coalesce. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    do {
      again = false
      await syncPass()
    } while (again)
  })().finally(() => {
    running = null
  })
  return running
}

async function syncPass(): Promise<void> {
  const start = useGame.getState()
  if (!start.uid || !start.save) return
  useGame.setState({ sync: 'syncing' })
  try {
    let remote = await saveApi.load()
    for (let attempt = 0; attempt < 3; attempt++) {
      const local = useGame.getState()
      const step = reconcile(local, remote)
      if (step.kind === 'none') break
      if (step.kind === 'adopt') {
        if (useGame.getState().save !== local.save) {
          again = true // changed meanwhile: decide again next pass
          break
        }
        // Unsynced changes are never replaced without a copy: no copy, no adopt, and the warning shows instead.
        if (step.replacesUnsynced && local.save) {
          const kept = await addSafetyCopy({ uid: start.uid, reason: 'replaced', at: nowIso(), revision: local.revision, save: local.save })
          if (!kept) throw new Error('no safety copy')
          if (useGame.getState().save !== local.save) {
            again = true
            break
          }
        }
        useGame.setState({ save: step.envelope.save, revision: step.envelope.revision, dirty: false, ...(step.replacesUnsynced ? { replacedAt: nowIso() } : {}) })
        await persist()
        break
      }
      try {
        const stored = await saveApi.put(step.baseRevision, step.save)
        const changedSince = useGame.getState().save !== step.save
        useGame.setState({ revision: stored.revision, dirty: changedSince })
        await persist()
        if (changedSince) again = true
        break
      } catch (err) {
        const current = conflictEnvelope(err)
        if (!current) throw err
        remote = current // someone else wrote first: reconcile against what's stored now
      }
    }
    // Changes left unsent (three conflicts in a row) aren't synced; the time says when the server last held everything.
    const { dirty } = useGame.getState()
    if (dirty && !again) throw new Error('changes left unsent')
    useGame.setState({ sync: 'synced', ...(dirty ? {} : { lastSyncedAt: nowIso() }) })
    if (!dirty) await persist()
  } catch {
    useGame.setState({ sync: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error' })
  }
}

/**
 * Puts a safety copy back, the player's own choice, so it counts as the newest change and uploads over the server's.
 * What it replaces becomes a safety copy first, so a restore can be undone. False, changing nothing, when the copy can't
 * be read or today's save can't be kept.
 */
export async function restoreSafetyCopy(id: number): Promise<boolean> {
  const { uid, save, revision } = useGame.getState()
  if (!uid || !save) return false
  const copy = await readSafetyCopy(id)
  if (copy?.uid !== uid) return false
  let restored: Save
  try {
    restored = parseSave(copy.save)
  } catch {
    return false
  }
  if (!(await addSafetyCopy({ uid, reason: 'restore', at: nowIso(), revision, save }))) return false
  await removeSafetyCopy(id)
  useGame.setState({ replacedAt: null })
  await commit(touched(restored, nowIso()))
  return true
}

/** The warning that a newer save replaced this device's changes has been read. */
export function seeReplaced(): void {
  useGame.setState({ replacedAt: null })
}

/** Syncs when the app comes back to the foreground or the network returns. Returns a stop function. */
export function startSyncTriggers(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncNow()
  }
  const onOnline = () => void syncNow()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', onOnline)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('online', onOnline)
  }
}
