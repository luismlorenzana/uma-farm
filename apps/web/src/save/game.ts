// The farm's store and its sync engine (copied from uma-rpg at 30a322a): the save lives on the device
// (Dexie) and in a Zustand store; every change writes both and schedules a background sync. Play never waits on the
// network once a device save exists.
//
// The store plays v6. Boot expands v5 on the device and syncs it without stamping player progress.
// Earlier saves stop at the start-over card. Its button keeps a dirty device copy before starting fresh
// with the original account. A newer save stops boot and sync and opens the update prompt.
import {
  morningShiftDue, prepareDayChange, expandCalendar, freshV6, isOlderSave, newSave, parseStored, SAVE_VERSION, touched, versionOf, type FarmSave, type OlderSave, type SaveEnvelope, type StoredSave,
} from '@farm/domain'
import { create } from 'zustand'
import { conflictEnvelope, saveApi } from '../api/client'
import { forgetArrived } from '../story/news'
import { keepOnCast, prepareStorySave, storyReady } from '../story/story'
import { addSafetyCopy, readSafetyCopy, readSaveRow, readStoredRow, removeSafetyCopy, writeSaveRow } from './db'
import { reconcile } from './reconcile'

export type GameStatus = 'idle' | 'booting' | 'ready'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface GameState {
  uid: string | null
  status: GameStatus
  /** The save the farm plays: v6. */
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
// Everyone on the farm stays in the story's cast as a save comes in (an Uma a release dropped plays on placeholders).
useGame.subscribe((state, before) => {
  if (state.save !== before.save) keepOnCast(Object.keys(state.save?.roster ?? {}), state.save?.longGame?.celebrations['cohort:50'] !== undefined)
})

/** The save once booted, or null. */
export const useLoopSave = (): FarmSave | null => useGame((s) => s.save)

/** A save from a newer app: this build can't play it, and nothing writes over it (the kit's update prompt brings the
 * build that can). */
export const NEWER_SAVE_WORDS = 'This save is from a newer version of the farm.'

/** A stored save as the farm plays it. The
 * same object comes back when nothing changed, so the store knows when to commit. */
function playable(save: StoredSave): FarmSave {
  if (versionOf(save) > SAVE_VERSION) throw new Error(NEWER_SAVE_WORDS)
  return isOlderSave(save) ? freshV6(save) : save.version === 5 ? expandCalendar(save) : save
}

/** A server envelope as the farm plays it, and whether its save changed on the way (an older save made new). */
function playableEnvelope(envelope: SaveEnvelope): { revision: number; save: FarmSave | null; migrated: boolean } {
  if (!envelope.save) return { revision: envelope.revision, save: null, migrated: false }
  const save = playable(envelope.save)
  return { revision: envelope.revision, save: prepareStorySave(save), migrated: save !== envelope.save }
}

/** A new account: day 1, nobody on the roster yet; the farmer's name is the first tap. */
const freshSave = (uid: string): FarmSave => newSave(uid, nowIso())

const nowIso = () => new Date().toISOString()

function persist(): Promise<void> {
  const { uid, save, revision, dirty, lastSyncedAt } = useGame.getState()
  if (!uid || !save) return Promise.resolve()
  return writeSaveRow({ id: 'main', uid, revision, save, dirty, lastSyncedAt })
}

/** An older save boot found, waiting for the start-over card's button: where it was, its revision, and whether the
 * device held changes the server never got. */
interface OlderFound {
  save: OlderSave
  revision: number
  dirty: boolean
  lastSyncedAt: string | null
  fromDevice: boolean
}
let olderFound: OlderFound | null = null

/** Whether boot stopped at an older save: the start-over card shows until `startOver`. */
export const startingOver = (): boolean => olderFound !== null

/**
 * Opens the device save, else the server's, else starts a new account. Safe to call again for the same uid. A fresh
 * device needs the server's answer first: starting a new save offline could later outrank the real one (the conflict rule
 * keeps the save changed last), so boot fails instead and the gate offers Retry. Resolves whether the farm starts over:
 * a save older than v5 waits for the start-over card's button (`startOver`).
 */
export async function boot(uid: string): Promise<{ startOver: boolean }> {
  const state = useGame.getState()
  if (state.uid === uid && state.status !== 'idle') return { startOver: startingOver() }
  useGame.setState({ ...INITIAL, uid, status: 'booting' })
  olderFound = null
  try {
    await storyReady()
    const row = await readSaveRow(uid)
    if (row) {
      if (versionOf(row.save) > SAVE_VERSION) throw new Error(NEWER_SAVE_WORDS)
      if (isOlderSave(row.save)) {
        olderFound = { save: row.save, revision: row.revision, dirty: row.dirty, lastSyncedAt: row.lastSyncedAt ?? null, fromDevice: true }
        return { startOver: true }
      }
      const save = playable(row.save)
      useGame.setState({ status: 'ready', save: prepareStorySave(save), revision: row.revision, dirty: row.dirty || save !== row.save, lastSyncedAt: row.lastSyncedAt ?? null })
      if (save !== row.save) await persist()
      void syncNow()
      return { startOver: false }
    }
    const remote = await saveApi.load()
    if (remote.save && versionOf(remote.save) > SAVE_VERSION) throw new Error(NEWER_SAVE_WORDS)
    if (remote.save && isOlderSave(remote.save)) {
      olderFound = { save: remote.save, revision: remote.revision, dirty: false, lastSyncedAt: null, fromDevice: false }
      return { startOver: true }
    }
    if (remote.save) {
      const save = playable(remote.save)
      const migrated = save !== remote.save
      useGame.setState({ status: 'ready', save: prepareStorySave(save), revision: remote.revision, dirty: migrated, sync: migrated ? 'idle' : 'synced', lastSyncedAt: nowIso() })
      await persist()
      if (migrated) void syncNow()
      return { startOver: false }
    }
    useGame.setState({ status: 'ready', revision: remote.revision })
    // A new farm meets the story in its opening: no "New story arrived" the first morning.
    forgetArrived()
    await commit(freshSave(uid))
    return { startOver: false }
  } catch (err) {
    olderFound = null
    useGame.setState({ ...INITIAL })
    throw err
  }
}

/**
 * The start-over card's button: the older save boot found becomes a fresh v6 on day 1, its account copied whole, and
 * is committed unstamped, so it uploads (the server backs the older save up when the v6 replaces it). A device save with
 * changes the server never got is kept first as a safety copy; if it can't be kept, nothing changes and this throws.
 */
export async function startOver(): Promise<void> {
  const found = olderFound
  const { uid } = useGame.getState()
  if (!found || !uid) return
  if (found.fromDevice && found.dirty) {
    const kept = await addSafetyCopy({ uid, reason: 'wiped', at: nowIso(), revision: found.revision, save: (await readStoredRow(uid)) ?? found.save })
    if (!kept) throw new Error('This device couldn’t keep a copy of its save. Try again.')
  }
  olderFound = null
  useGame.setState({ status: 'ready', revision: found.revision, dirty: found.dirty, lastSyncedAt: found.lastSyncedAt })
  forgetArrived()
  await commit(freshV6(found.save))
}

export function resetGame(): void {
  olderFound = null
  useGame.setState(INITIAL)
}

/** Every change goes through here: on screen, on the device, then to the server. It never stamps `updatedAt`: a player's
 * change arrives stamped by its rule. */
let loadingShift = false

export async function commit(save: FarmSave): Promise<void> {
  const before = useGame.getState().save
  if (loadingShift) throw new Error('The morning shift is still loading. Try again in a moment.')
  if (before) save = prepareDayChange(before, save)
  if (morningShiftDue(save)) {
    loadingShift = true
    try {
      const { finishMorningShift } = await import('../loop/morning-shift')
      save = await finishMorningShift(save)
      if (useGame.getState().save !== before) throw new Error('The farm changed while the shift was loading. Try again.')
    } finally {
      loadingShift = false
    }
  }
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
    let remote = playableEnvelope(await saveApi.load())
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
        // An older save made new isn't what the server holds: it goes up on the next pass.
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
        remote = playableEnvelope(current) // someone else wrote first: reconcile against what's stored now
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
    const stored = parseStored(copy.save)
    // A copy from before v5 would only start over again: it isn't restored.
    if (isOlderSave(stored)) return false
    const { start, expandedAt } = save.calendar
    if (stored.calendar.day < Math.max(start ?? 1, expandedAt ?? 1)) return false
    // The clock setting belongs to this cloud farm, including when restoring its unsynced progress.
    const recovered = playable(stored)
    restored = { ...recovered, calendar: { ...save.calendar, day: recovered.calendar.day } }
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

/** Syncs when the app comes back to the foreground or the network returns. Returns a stop function. (No push schedule:
 * days are turns, so nothing finishes while the app is closed.) */
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
