// The device's storage: the row, safety copies and an unreadable row. Invented data only.
import 'fake-indexeddb/auto'
import { newSaveV2 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { addSafetyCopy, db, readSaveRow, SAFETY_COPIES, safetyCopies } from './db'

const NOW = '2026-11-08T12:00:00.000Z'
const row = (uid = 'u1') => ({ id: 'main' as const, uid, revision: 4, dirty: true, save: newSaveV2(uid, NOW) })

describe('the device save', () => {
  it('reads its own row and no other account’s', async () => {
    await db.save.put(row())
    await expect(readSaveRow('u1')).resolves.toMatchObject({ revision: 4, dirty: true })
    await expect(readSaveRow('u2')).resolves.toBeNull()
  })

  it('keeps an unreadable row as a safety copy before boot writes over it', async () => {
    await db.save.put({ ...row(), save: { nonsense: true } as never })
    await expect(readSaveRow('u1')).resolves.toBeNull()
    expect((await safetyCopies('u1'))[0]).toMatchObject({ reason: 'unreadable', revision: 4, save: { nonsense: true } })
  })

  it('keeps the newest five safety copies of an account', async () => {
    await db.safety.clear()
    for (let i = 0; i < SAFETY_COPIES + 2; i++) await addSafetyCopy({ uid: 'u1', reason: 'replaced', at: NOW, revision: i, save: {} })
    const copies = await safetyCopies('u1')
    expect(copies.map((c) => c.revision)).toEqual([6, 5, 4, 3, 2])
  })
})
