import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { newSave, newSaveV2, touched, SAVE_VERSION as V } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { LocalSaveRepository } from './local-save.repository'
import { RevisionConflict } from './save.repository'

const NOW = '2026-11-08T12:00:00.000Z'
const LATER = '2026-11-08T13:00:00.000Z'
const file = async () => join(await mkdtemp(join(tmpdir(), 'farm-save-')), 'save.json')

describe('the local save store', () => {
  it('starts empty, stores revision 1, then refuses a stale write with what is stored', async () => {
    const repo = new LocalSaveRepository(await file())
    expect(await repo.load('u')).toEqual({ revision: 0, save: null })
    const first = await repo.put('u', 0, newSaveV2('u', NOW), V)
    expect(first.revision).toBe(1)
    await repo.put('u', 1, touched(first.save!, LATER), V)
    const stale = repo.put('u', 1, newSaveV2('u', NOW), V)
    await expect(stale).rejects.toBeInstanceOf(RevisionConflict)
    const error = await stale.then(() => null, (e: unknown) => e)
    if (!(error instanceof RevisionConflict)) throw new Error('expected a RevisionConflict')
    expect(error.current.revision).toBe(2)
    expect(error.current.save?.account.updatedAt).toBe(LATER)
    expect((await repo.load('other-user')).revision).toBe(0)
  })

  it('refuses a write from an older save version, even at the right revision', async () => {
    const path = await file()
    await writeFile(path, JSON.stringify({ u: { revision: 1, save: newSave('u', NOW) } }))
    const repo = new LocalSaveRepository(path)
    await expect(repo.put('u', 1, newSaveV2('u', NOW), V)).rejects.toBeInstanceOf(RevisionConflict)
    expect((await repo.load('u')).save).toEqual(newSave('u', NOW))
  })

  it('keeps a refused upload beside the file', async () => {
    const path = await file()
    const repo = new LocalSaveRepository(path)
    await repo.rescue('u', { anything: true }, 'why')
    await expect((await import('node:fs/promises')).readFile(`${path}.rescue.json`, 'utf8')).resolves.toContain('"why"')
  })
})
