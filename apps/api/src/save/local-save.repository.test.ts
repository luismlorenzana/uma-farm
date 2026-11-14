// The local store: revisions, a v5 over an older save, and the older save read as its version and account. Invented
// data only.
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { freshV5, newSave, touched } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { LocalSaveRepository } from './local-save.repository'
import { RevisionConflict } from './save.repository'

const NOW = '2026-11-08T12:00:00.000Z'
const LATER = '2026-11-08T13:00:00.000Z'
const ACCOUNT = { uid: 'u', createdAt: NOW, updatedAt: NOW }
const file = async () => join(await mkdtemp(join(tmpdir(), 'farm-save-')), 'save.json')

describe('the local save store', () => {
  it('starts empty, stores revision 1, then refuses a stale write with what is stored', async () => {
    const repo = new LocalSaveRepository(await file())
    expect(await repo.load('u')).toEqual({ revision: 0, save: null })
    const first = await repo.put('u', 0, newSave('u', NOW))
    expect(first.revision).toBe(1)
    await repo.put('u', 1, touched(newSave('u', NOW), LATER))
    const stale = repo.put('u', 1, newSave('u', NOW))
    await expect(stale).rejects.toBeInstanceOf(RevisionConflict)
    const error = await stale.then(() => null, (e: unknown) => e)
    if (!(error instanceof RevisionConflict)) throw new Error('expected a RevisionConflict')
    expect(error.current.revision).toBe(2)
    expect(error.current.save?.account.updatedAt).toBe(LATER)
    expect((await repo.load('other-user')).revision).toBe(0)
  })

  it('reads a stored v3 or v4 as its version and account, then stores the new farm over it', async () => {
    for (const version of [3, 4] as const) {
      const path = await file()
      await writeFile(path, JSON.stringify({ u: { revision: 7, save: { version, account: ACCOUNT, gold: 812, roster: { 1001: {} } } } }))
      const repo = new LocalSaveRepository(path)
      expect(await repo.load('u')).toEqual({ revision: 7, save: { version, account: ACCOUNT } })
      const fresh = freshV5({ account: ACCOUNT })
      await expect(repo.put('u', 7, fresh)).resolves.toEqual({ revision: 8, save: fresh })
      expect(await repo.load('u')).toEqual({ revision: 8, save: fresh })
    }
  })

  it('refuses a save older than the stored version, even at the right revision', async () => {
    const path = await file()
    await writeFile(path, JSON.stringify({ u: { revision: 1, save: newSave('u', NOW) } }))
    const repo = new LocalSaveRepository(path)
    // The parse refuses an older upload before it gets here; the store's own check refuses it too.
    await expect(repo.put('u', 1, { ...newSave('u', NOW), version: 3 as unknown as 5 })).rejects.toBeInstanceOf(RevisionConflict)
    expect((await repo.load('u')).save).toEqual(newSave('u', NOW))
  })

  it('keeps a refused upload beside the file', async () => {
    const path = await file()
    const repo = new LocalSaveRepository(path)
    await repo.rescue('u', { anything: true }, 'why')
    await expect((await import('node:fs/promises')).readFile(`${path}.rescue.json`, 'utf8')).resolves.toContain('"why"')
  })
})
