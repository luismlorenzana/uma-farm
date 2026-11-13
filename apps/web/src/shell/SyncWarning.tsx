// The warning a failed backup earns (copied from uma-rpg at 30a322a): once the server has gone ten minutes
// without this device's changes, the app says so in words, on every page. It also says when a newer save replaced changes
// here. Either opens the Account, where the safety copies are.
import { Link } from 'react-router'
import { useGame, type GameState } from '../save/game'
import { useNow } from './useNow'

export const SYNC_WARNING_AFTER_MS = 10 * 60_000

/** "8 Nov, 14:05": when the server last held everything. */
export const dateWords = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** The warning for this state at `now`, or null. Only unsynced changes earn one. */
export function syncWarning(state: Pick<GameState, 'sync' | 'dirty' | 'lastSyncedAt' | 'replacedAt'>, now: string): string | null {
  if (state.replacedAt) return 'A newer save replaced this device’s changes. They’re kept in Account.'
  if (state.sync !== 'error' || !state.dirty) return null
  const last = state.lastSyncedAt
  if (last && Date.parse(now) - Date.parse(last) < SYNC_WARNING_AFTER_MS) return null
  return last ? `Not backed up since ${dateWords(last)}. Your progress is only on this device.` : 'Not backed up. Your progress is only on this device.'
}

export function SyncWarning() {
  const now = useNow(30_000)
  const warning = useGame((s) => syncWarning(s, new Date(now).toISOString()))
  if (!warning) return null
  return (
    <Link to="/account" role="status" data-sync-warning
      className="block bg-danger/15 px-4 py-2 text-center text-[13px] font-semibold leading-4 text-danger">{warning}</Link>
  )
}
