// The farm's store and its sync engine (copied from uma-rpg at 30a322a; its D32, D260): the save lives on the device
// (Dexie) and in a Zustand store; every change writes both and schedules a background sync. Play never waits on the
// network once a device save exists. F4's rules commit through `commit`; F5's work actions through `edit`. Every sync
// also sends the push schedule (F6), and so does the app going to the background.
//
// While M4 is dark (F17, D29) the store holds what's stored, the Wilds' v2 or the loop's v3. The Wilds' build plays v2 and
// stops at a v3; the loop's build carries every v2 it meets into v3 (`loop/boot.ts`), on boot, on sync and on a restore,
// and commits it without moving `updatedAt`.
import {
  collectAll, collectWorker, dismissStopped, editWorkerQueue, newSaveV2, parseSave, recallWorker, repeatJob, restartStopped, rosterContext,
  startJob, touched, type Collected, type FarmOutfit, type FarmQueueInput, type Save, type SaveEnvelope, type SaveV3, type StoredSave,
  type WorkContext,
} from '@farm/domain'
import { create } from 'zustand'
import { conflictEnvelope, saveApi } from '../api/client'
import { loopOn } from '../app/loop'
import { masterRoster } from '../master/master'
import { resetSchedule, sendSchedule } from '../push/push'
import { addSafetyCopy, readSafetyCopy, readSaveRow, removeSafetyCopy, writeSaveRow } from './db'
import { reconcile } from './reconcile'

export type GameStatus = 'idle' | 'booting' | 'ready'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface GameState {
  uid: string | null
  status: GameStatus
  /** The Wilds' v2 or the loop's v3 (F17): `useWildsSave` and `useLoopSave` read the one their screens play. */
  save: StoredSave | null
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

/** The Wilds' save, or null while the loop plays. */
export const wildsSave = (save: StoredSave | null): Save | null => (save?.version === 2 ? save : null)
export const useWildsSave = (): Save | null => useGame((s) => wildsSave(s.save))
/** The loop's save, or null in the Wilds' build. */
export const useLoopSave = (): SaveV3 | null => useGame((s) => (s.save?.version === 3 ? s.save : null))

/** The Wilds' build meeting a loop save: it can't play it, and nothing writes over it. */
export const LOOP_SAVE_WORDS = 'This save is from a newer version of the farm.'

/** A stored save as this build plays it: the Wilds' v2 as it is (a v3 stops them), or the loop's v3, migrating a v2 and
 * filling the start once master data has loaded. The same object comes back when nothing changed. */
async function playable(save: StoredSave): Promise<StoredSave> {
  if (!loopOn()) {
    if (save.version !== 2) throw new Error(LOOP_SAVE_WORDS)
    return save
  }
  const { toLoopSave } = await import('../loop/boot')
  return toLoopSave(save)
}

/** A server envelope as this build plays it, and whether its save changed on the way (a v2 the loop migrated). */
async function playableEnvelope(envelope: SaveEnvelope): Promise<SaveEnvelope & { migrated: boolean }> {
  if (!envelope.save) return { ...envelope, migrated: false }
  const save = await playable(envelope.save)
  return { revision: envelope.revision, save, migrated: save !== envelope.save }
}

/** A new account: the Wilds' empty v2, or the loop's day 1. */
async function freshSave(uid: string): Promise<StoredSave> {
  if (!loopOn()) return newSaveV2(uid, nowIso())
  const { newLoopSave } = await import('../loop/boot')
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
      useGame.setState({ status: 'ready', save, revision: row.revision, dirty: row.dirty, lastSyncedAt: row.lastSyncedAt ?? null })
      // A migration is committed once, as it is: `updatedAt` stays, and the next boot reads the v3.
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
  resetSchedule()
}

/** Every change goes through here: on screen, on the device, then to the server. It never stamps `updatedAt`: a player's
 * change arrives stamped by its rule. */
export async function commit(save: StoredSave): Promise<void> {
  useGame.setState({ save, dirty: true })
  await persist()
  scheduleSync()
}

// --- The Wilds' work (F5) -----------------------------------------------------------------------------------------

let context: { roster: readonly FarmOutfit[]; value: WorkContext } | null = null

/** What the work rules ask of the caller: each Uma's trade and who may work, from master data's roster (FM6, FM7). Before
 * it loads the gate is open, as for a settle; the API's parse accepts any well-formed outfit id either way. */
export function workContext(roster: readonly FarmOutfit[] | null = masterRoster()): WorkContext {
  if (!roster) return {}
  if (context?.roster !== roster) context = { roster, value: rosterContext(roster) }
  return context.value
}

/** Every work action, as uma-rpg's `edit`: the save is read right before the rule runs, so two quick taps each apply to
 * the other's result instead of one overwriting the other. A rule's refusal throws (`SaveRuleError`) and changes nothing. */
async function edit(change: (save: Save, now: string, context: WorkContext) => Save): Promise<void> {
  const save = wildsSave(useGame.getState().save)
  if (!save) return
  const next = change(save, nowIso(), workContext())
  if (next !== save) await commit(next)
}

/** Puts an Uma in a free slot: `count` items, made one after another; the inputs leave the Warehouse now. */
export const startWork = (placeId: string, slot: number, outfitId: string, output: string, count: number) =>
  edit((s, now, c) => startJob(s, placeId, slot, { outfitId }, output, count, now, c))
/** Adds, removes or moves a job in her queue (the kit's queue input). */
export const editWorkQueue = (input: FarmQueueInput) => edit((s, now, c) => editWorkerQueue(s, input, now, c))
/** Ends her work early: what's made is collected, unfinished inputs come back, her queue drops. */
export const recallWork = (outfitId: string) => edit((s, now) => recallWorker(s, outfitId, now))
/** Starts her last job again where she did it, collecting first when she's done. */
export const repeatWork = (outfitId: string) => edit((s, now, c) => repeatJob(s, outfitId, now, c))
/** A queue that stopped: start it again now, or forget it. */
export const restartWork = (outfitId: string) => edit((s, now, c) => restartStopped(s, outfitId, now, c))
export const dismissWork = (outfitId: string) => edit((s, now) => dismissStopped(s, outfitId, now))

/** Collects one Uma's finished items, with her Craft EXP. */
export async function collectWork(outfitId: string): Promise<Collected> {
  const save = wildsSave(useGame.getState().save)
  if (!save) return { items: 0, exp: 0, levelsUp: 0, done: false }
  const r = collectWorker(save, outfitId, nowIso())
  await commit(r.save)
  return r.got
}

/** Collects every finished job, on these places or everywhere. Nothing ready changes nothing. */
export async function collectEverything(placeIds?: readonly string[]): Promise<{ items: number; levelsUp: number }> {
  const save = wildsSave(useGame.getState().save)
  if (!save) return { items: 0, levelsUp: 0 }
  const r = collectAll(save, nowIso(), placeIds)
  if (r.items > 0) await commit(r.save)
  return { items: r.items, levelsUp: r.levelsUp }
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
        // A v2 the loop migrated isn't what the server holds: it goes up on the next pass.
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
    void sendSchedule(useGame.getState().save)
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
  let restored: StoredSave
  try {
    restored = await playable(parseSave(copy.save))
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

/** Syncs when the app comes back to the foreground or the network returns, and sends the push schedule as it goes to the
 * background. Returns a stop function. */
export function startSyncTriggers(): () => void {
  const onVisible = () => {
    if (document.visibilityState === 'visible') void syncNow()
    else void sendSchedule(useGame.getState().save)
  }
  const onOnline = () => void syncNow()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', onOnline)
  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('online', onOnline)
  }
}
