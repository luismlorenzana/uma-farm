// A refused upload is kept: a server that sends every upload back and keeps nothing leaves days of play on
// one phone. Uploads are v5 only. Invented data only.
import { BadRequestException, ConflictException } from '@nestjs/common'
import { newSave } from '@farm/domain'
import { describe, expect, it, vi } from 'vitest'
import { SaveController } from './save.controller'
import { EMPTY_ENVELOPE, RevisionConflict, type SaveRepository } from './save.repository'

const NOW = '2026-11-08T12:00:00.000Z'
const upload = (uid = 'u') => ({ baseRevision: 3, save: JSON.parse(JSON.stringify(newSave(uid, NOW))) as unknown })
function fake(put: SaveRepository['put'], rescue: SaveRepository['rescue'] = vi.fn(async () => undefined)) {
  const repo: SaveRepository = { load: async () => EMPTY_ENVELOPE, put, rescue }
  return { repo, controller: new SaveController(repo) }
}

describe('the save upload', () => {
  it('stores a v5 as sent and keeps nothing aside', async () => {
    const { repo, controller } = fake(async (_uid, revision, save) => ({ revision: revision + 1, save }))
    const body = upload()
    await expect(controller.put('u', body)).resolves.toEqual({ revision: 4, save: body.save })
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
    const body = { baseRevision: 3, save: { version: 6, nonsense: true } }
    await expect(controller.put('u', body)).rejects.toBeInstanceOf(BadRequestException)
    expect(repo.rescue).toHaveBeenCalledWith('u', body, expect.any(String))
  })

  it('refuses a malformed v5 with its path, and keeps it', async () => {
    const { repo, controller } = fake(async () => { throw new Error('never stored') })
    const body = { baseRevision: 3, save: { ...JSON.parse(JSON.stringify(newSave('u', NOW))), gold: -1 } }
    await expect(controller.put('u', body)).rejects.toThrow('body.save.gold: expected a non-negative integer')
    expect(repo.rescue).toHaveBeenCalledWith('u', body, expect.any(String))
  })

  it('refuses a save from before v5, an old cached build\'s, and keeps it whole', async () => {
    for (const version of [3, 4]) {
      const { repo, controller } = fake(async () => { throw new Error('never stored') })
      const body = { baseRevision: 3, save: { version, account: { uid: 'u', createdAt: NOW, updatedAt: NOW }, gold: 812 } }
      await expect(controller.put('u', body)).rejects.toThrow('body.save.version: expected 6')
      expect(repo.rescue).toHaveBeenCalledWith('u', body, expect.stringContaining('expected 6'))
    }
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

  it('keeps an upload refused as older than what is stored', async () => {
    const stored = { revision: 5, save: { ...newSave('u', NOW), version: 7 as unknown as 6 } }
    const { repo, controller } = fake(async () => { throw new RevisionConflict(stored) })
    const body = upload()
    await expect(controller.put('u', body)).rejects.toBeInstanceOf(ConflictException)
    expect(repo.rescue).toHaveBeenCalledWith('u', body, 'save version 5 is older than the stored 6')
  })

  it('never lets a failed rescue hide why the upload failed', async () => {
    const { controller } = fake(async () => { throw new Error('the real reason') }, async () => { throw new Error('no rescue') })
    await expect(controller.put('u', upload())).rejects.toThrow('the real reason')
  })
})
