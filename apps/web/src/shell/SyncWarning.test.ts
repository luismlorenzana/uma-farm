import { describe, expect, it } from 'vitest'
import { syncWarning, SYNC_WARNING_AFTER_MS } from './SyncWarning'
import { storyWords, syncWords } from '../home/sync-words'

const NOW = '2026-11-08T12:00:00.000Z'
const ago = (ms: number) => new Date(Date.parse(NOW) - ms).toISOString()

describe('the sync warning', () => {
  it('says nothing while synced, or for a moment’s error', () => {
    expect(syncWarning({ sync: 'synced', dirty: false, lastSyncedAt: NOW, replacedAt: null }, NOW)).toBeNull()
    expect(syncWarning({ sync: 'error', dirty: true, lastSyncedAt: ago(60_000), replacedAt: null }, NOW)).toBeNull()
    expect(syncWarning({ sync: 'error', dirty: false, lastSyncedAt: ago(SYNC_WARNING_AFTER_MS * 2), replacedAt: null }, NOW)).toBeNull()
  })

  it('warns once unsynced changes have waited ten minutes, and when a newer save replaced them', () => {
    expect(syncWarning({ sync: 'error', dirty: true, lastSyncedAt: ago(SYNC_WARNING_AFTER_MS + 1), replacedAt: null }, NOW)).toMatch(/^Not backed up since/)
    expect(syncWarning({ sync: 'error', dirty: true, lastSyncedAt: null, replacedAt: null }, NOW)).toMatch(/^Not backed up\./)
    expect(syncWarning({ sync: 'synced', dirty: false, lastSyncedAt: NOW, replacedAt: NOW }, NOW)).toMatch(/newer save/)
  })

  it('puts the save’s state in a few words', () => {
    expect(syncWords({ sync: 'synced', dirty: false, revision: 3 })).toBe('Synced')
    expect(syncWords({ sync: 'idle', dirty: true, revision: 0 })).toBe('Saved on this phone')
    expect(syncWords({ sync: 'offline', dirty: true, revision: 1 })).toBe('Offline · saved on this phone')
  })
})

describe('Account\'s Story row', () => {
  const release = { id: 'abcdef12', builtAt: '2026-11-12T08:00:00.000Z', number: 4, shippedAt: '2026-11-14T09:00:00.000Z', note: 'An invented chapter.' }
  it('names the release the game plays by its number and date, or says none plays', () => {
    expect(storyWords({ release }, 'en-GB')).toBe('Release 4, 14 Nov 2026')
    expect(storyWords({ release: { ...release, number: null, shippedAt: null } }, 'en-GB')).toBe('Release abcdef12, 12 Nov 2026')
    expect(storyWords({}, 'en-GB')).toBe('No story yet')
    expect(storyWords(null)).toBe('Loading…')
  })
})
