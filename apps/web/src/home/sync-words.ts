import type { StoryRelease } from '@farm/domain'
import type { GameState } from '../save/game'

/** The save's state in a few words, for Home and Account. */
export function syncWords(state: Pick<GameState, 'sync' | 'dirty' | 'revision'>): string {
  if (state.sync === 'syncing') return 'Syncing…'
  if (state.sync === 'offline') return 'Offline · saved on this phone'
  if (state.sync === 'error') return state.dirty ? 'Sync paused · saved on this phone' : 'Sync paused'
  if (state.dirty) return 'Saved on this phone'
  return state.revision > 0 ? 'Synced' : 'Not synced yet'
}

/** Account's Story row: the release the game plays, "Release 4, 14 Nov 2026" (its ship's number and date; an
 * unnumbered one by its id and build date), or "No story yet" when none plays; "Loading…" until the pack loads. */
export function storyWords(pack: { release?: StoryRelease } | null, locale?: string): string {
  if (!pack) return 'Loading…'
  const release = pack.release
  if (!release) return 'No story yet'
  const date = new Date(release.shippedAt ?? release.builtAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  return `Release ${release.number ?? release.id}, ${date}`
}
