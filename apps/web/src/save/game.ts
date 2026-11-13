// The farm's store and its sync engine (copied from uma-rpg at 30a322a): the save lives on the device
// (Dexie) and in a Zustand store; every change writes both and schedules a background sync. Play never waits on the
// network once a device save exists.
//
// The M4 build (live) holds save v3, the farm's own loop (F24: the loop is the app). Every v2 it meets (the Wilds' save, on
// the device, from the server, in a 409 or from a safety copy) migrates once master data has loaded (`loop/boot.ts`), and
// the migration is committed without moving `updatedAt`, so it uploads and the next boot reads v3. It stops at a v4, with
// the kit's update prompt, and never writes over one.
//
// The romance build (`VITE_FARM_ROMANCE=1`, dark until F56) holds save v4. Every v1–v3 it meets, wherever it meets one, is
// wiped into a fresh v4 (`freshV4`, the account copied whole) and committed without stamping, so it uploads and the server
// backs the v3 up; a dirty v3 on the device is kept as a safety copy first. The farmer's name is the first stamp. Its boot
// waits for the story pack, as the loop waits for master data.
import { freshV4, parseSave, touched, type FarmSave, type SaveEnvelope, type StoredSave } from '@farm/domain'
import { create } from 'zustand'
import { conflictEnvelope, saveApi } from '../api/client'
import { romanceOn } from '../app/romance'
import { storyReady } from '../story/story'
import { addSafetyCopy, readSafetyCopy, readSaveRow, removeSafetyCopy, writeSaveRow } from './db'
import { reconcile } from './reconcile'

export type GameStatus = 'idle' | 'booting' | 'ready'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface GameState {
  uid: string | null
  status: GameStatus
  /** The save the build plays: v3 (a v2 migrated) in the M4 build, v4 (any older one wiped) in the romance build. */
  save: FarmSave | null
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

/** The save once booted, or null. */
export const useLoopSave = (): FarmSave | null => useGame((s) => s.save)

/** The M4 build meeting a v4: it can't play it, and nothing writes over it (the kit's update prompt
 * brings the build that can). */
export const NEWER_SAVE_WORDS = 'This save is from a newer version of the farm.'

/** A stored save as this build plays it. The M4 build: a v3 as it is, a v2 migrated once master data has loaded
 * (`loop/boot.ts`), a v4 refused. The romance build: a v4 as it is, any v1–v3 wiped (`freshV4`), once the story pack has
 * loaded. The same object comes back when nothing changed, so the store knows when to commit. */
async function playable(save: StoredSave): Promise<FarmSave> {
  if (romanceOn()) {
    await storyReady()
    return save.version === 4 ? save : freshV4(save)
  }
  if (save.version === 4) throw new Error(NEWER_SAVE_WORDS)
  if (save.version === 3) return save
  const { toLoopSave } = await import('../loop/boot')
  return toLoopSave(save)
}

/** A server envelope as the farm plays it, and whether its save changed on the way (a v2 migrated, a v3 wiped). */
async function playableEnvelope(envelope: SaveEnvelope): Promise<{ revision: number; save: FarmSave | null; migrated: boolean }> {
  if (!envelope.save) return { revision: envelope.revision, save: null, migrated: false }
  const save = await playable(envelope.save)
  return { revision: envelope.revision, save, migrated: save !== envelope.save }
}

/** A new account: day 1, nobody on the roster yet; the start's sheet is the first tap, or the farmer's name
 * (the romance build). */
async function freshSave(uid: string): Promise<FarmSave> {
  const { newLoopSave, newRomanceSave } = await import('../loop/boot')
  if (romanceOn()) {
    await storyReady()
    return newRomanceSave(uid, nowIso())
  }
  return newLoopSave(uid, nowIso())
}

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
  try {
    const row = await readSaveRow(uid)
    if (row) {
      const save = await playable(row.save)
      // The wipe never loses unsynced play silently: a dirty older save is kept on the device first.
      if (save.version !== row.save.version && row.dirty && romanceOn()) {
        const kept = await addSafetyCopy({ uid, reason: 'wiped', at: nowIso(), revision: row.revision, save: row.save })
        if (!kept) throw new Error('This device couldn’t keep a copy of its save. Try again.')
      }
      useGame.setState({ status: 'ready', save, revision: row.revision, dirty: row.dirty, lastSyncedAt: row.lastSyncedAt ?? null })
      // A migration or a wipe is committed once, as it is: `updatedAt` stays, and the next boot reads the new version.
      if (save !== row.save) await commit(save)
      void syncNow()
      return
    }
    const remote = await playableEnvelope(await saveApi.load())
    if (remote.save) {
      useGame.setState({ status: 'ready', save: remote.save, revision: remote.revision, dirty: false, sync: 'synced', lastSyncedAt: nowIso() })
      if (remote.migrated) await commit(remote.save)
      else await persist()
      return
    }
    useGame.setState({ status: 'ready', revision: remote.revision })
    await commit(await freshSave(uid))
  } catch (err) {
    useGame.setState({ ...INITIAL })
    throw err
  }
}

export function resetGame(): void {
  useGame.setState(INITIAL)
}

/** The save this device's last change committed. */
let committed: FarmSave | null = null
/** Whether a save is the one this device's last change made (F12: the HD-2D farm walks the Umas a change made here moved,
 * and places everyone at once for a save from the server or the device's boot). A sync's push keeps the object. */
export const madeHere = (save: FarmSave): boolean => save === committed

/** Every change goes through here: on screen, on the device, then to the server. It never stamps `updatedAt`: a player's
 * change arrives stamped by its rule. */
export async function commit(save: FarmSave): Promise<void> {
  committed = save
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
    let remote = await playableEnvelope(await saveApi.load())
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
        // A v2 the loop migrated, or a v3 the romance build wiped, isn't what the server holds: it goes up on the next pass.
        useGame.setState({ save: step.envelope.save, revision: step.envelope.revision, dirty: remote.migrated, ...(step.replacesUnsynced ? { replacedAt: nowIso() } : {}) })
        await persist()
        if (remote.migrated) again = true
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
        remote = await playableEnvelope(current) // someone else wrote first: reconcile against what's stored now
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
  let restored: FarmSave
  try {
    const stored = parseSave(copy.save)
    // In the romance build a copy from before v4 would only wipe again: it isn't restored.
    if (romanceOn() && stored.version < 4) return false
    restored = await playable(stored)
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

/** Syncs when the app comes back to the foreground or the network returns. Returns a stop function. (The Wilds' push
 * schedule went with them in F24: days are turns, so nothing finishes while the app is closed.) */
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
