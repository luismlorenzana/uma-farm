// A refused upload is kept: a server that sends every upload back and keeps nothing leaves days of play on
// one phone. Invented data only.
import { BadRequestException, ConflictException } from '@nestjs/common'
import { newSave, newSaveV2, type Save } from '@farm/domain'
import { describe, expect, it, vi } from 'vitest'
import { SaveController } from './save.controller'
import { EMPTY_ENVELOPE, RevisionConflict, type SaveRepository } from './save.repository'

const NOW = '2026-11-08T12:00:00.000Z'
const upload = (uid = 'u') => ({ baseRevision: 3, save: JSON.parse(JSON.stringify(newSaveV2(uid, NOW))) as Save })
function fake(put: SaveRepository['put'], rescue: SaveRepository['rescue'] = vi.fn(async () => undefined)) {
  const repo: SaveRepository = { load: async () => EMPTY_ENVELOPE, put, rescue }
  return { repo, controller: new SaveController(repo) }
}

describe('the save upload', () => {
  it('stores it and keeps nothing aside', async () => {
    const { repo, controller } = fake(async (_uid, revision, save) => ({ revision: revision + 1, save }))
    await expect(controller.put('u', upload())).resolves.toMatchObject({ revision: 4 })
    expect(repo.rescue).not.toHaveBeenCalled()
  })

  it('keeps an upload the store refuses, as sent, and still fails it', async () => {
    const { repo, controller } = fake(async () => { throw new Error('3 INVALID_ARGUMENT: invalid nested entity') })
    const body = upload()
    await expect(controller.put('u', body)).rejects.toThrow('invalid nested entity')
    expect(repo.rescue).toHaveBeenCalledWith('u', body, '3 INVALID_ARGUMENT: invalid nested entity')
  })

  it('keeps an upload that fails the save rules, as sent, and says why', async () => {
    const { repo, controller } = fake(async () => { throw new Error('never stored') })
    const body = { baseRevision: 3, save: { version: 1, nonsense: true } }
    await expect(controller.put('u', body)).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.rescue).toHaveBeenCalledWith('u', body, expect.any(String))
  })

  it("refuses another account's save, and keeps it", async () => {
    const { repo, controller } = fake(async () => { throw new Error('never stored') })
    await expect(controller.put('u', upload('someone-else'))).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.rescue).toHaveBeenCalled()
  })

  it('keeps nothing for a revision conflict: the device simply syncs again', async () => {
    const { repo, controller } = fake(async () => { throw new RevisionConflict(EMPTY_ENVELOPE) })
    await expect(controller.put('u', upload())).rejects.toBeInstanceOf(ConflictException)
    expect(repo.rescue).not.toHaveBeenCalled()
  })

  it('stores a v3 upload as sent (F17)', async () => {
    const { repo, controller } = fake(async (_uid, revision, save) => ({ revision: revision + 1, save }))
    const save = JSON.parse(JSON.stringify(newSave('u', NOW))) as unknown
    await expect(controller.put('u', { baseRevision: 3, save })).resolves.toEqual({ revision: 4, save })
    expect(repo.rescue).not.toHaveBeenCalled()
  })

  it('refuses a malformed v3 with its path, and keeps it', async () => {
    const { repo, controller } = fake(async () => { throw new Error('never stored') })
    const body = { baseRevision: 3, save: { ...JSON.parse(JSON.stringify(newSave('u', NOW))), gold: -1 } }
    await expect(controller.put('u', body)).rejects.toThrow('body.save.gold: expected a non-negative integer')
    expect(repo.rescue).toHaveBeenCalledWith('u', body, expect.any(String))
  })

  it('keeps a v2 upload refused for a stored v3: a Wilds client after the loop (F17)', async () => {
    const stored = { revision: 5, save: newSave('u', NOW) }
    const { repo, controller } = fake(async () => { throw new RevisionConflict(stored) })
    const body = upload()
    await expect(controller.put('u', body)).rejects.toBeInstanceOf(ConflictException)
    expect(repo.rescue).toHaveBeenCalledWith('u', body, 'save version 2 is older than the stored 3')
  })

  it('never lets a failed rescue hide why the upload failed', async () => {
    const { controller } = fake(async () => { throw new Error('the real reason') }, async () => { throw new Error('no rescue') })
    await expect(controller.put('u', upload())).rejects.toThrow('the real reason')
  })
})
