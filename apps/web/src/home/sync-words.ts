import type { GameState } from '../save/game'

/** The save's state in a few words, for Home and Account. */
export function syncWords(state: Pick<GameState, 'sync' | 'dirty' | 'revision'>): string {
  if (state.sync === 'syncing') return 'Syncing…'
  if (state.sync === 'offline') return 'Offline · saved on this phone'
  if (state.sync === 'error') return state.dirty ? 'Sync paused · saved on this phone' : 'Sync paused'
  if (state.dirty) return 'Saved on this phone'
  return state.revision > 0 ? 'Synced' : 'Not synced yet'
}
