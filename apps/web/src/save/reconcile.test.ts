import { newSave, touched } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { reconcile } from './reconcile'

const T0 = '2026-11-08T12:00:00.000Z'
const T1 = '2026-11-08T13:00:00.000Z'
const T2 = '2026-11-08T14:00:00.000Z'
const base = newSave('u1', T0)

describe('one sync round', () => {
  it('pushes a first local save to an empty server', () => {
    expect(reconcile({ revision: 0, save: base, dirty: true }, { revision: 0, save: null })).toEqual({ kind: 'push', baseRevision: 0, save: base })
  })

  it("adopts the server's save on a fresh device", () => {
    expect(reconcile({ revision: 0, save: null, dirty: false }, { revision: 3, save: base }).kind).toBe('adopt')
  })

  it('adopts newer server revisions when clean, and does nothing when up to date', () => {
    expect(reconcile({ revision: 2, save: base, dirty: false }, { revision: 3, save: base }).kind).toBe('adopt')
    expect(reconcile({ revision: 3, save: base, dirty: false }, { revision: 3, save: base }).kind).toBe('none')
  })

  it('pushes local changes on top of the revision they were based on', () => {
    const changed = touched(base, T1)
    expect(reconcile({ revision: 3, save: changed, dirty: true }, { revision: 3, save: base })).toEqual({ kind: 'push', baseRevision: 3, save: changed })
  })

  it('adopts a cloud calendar restart and preserves a newer dirty device in recovery', () => {
    const prior = { ...base, calendar: { day: 10 } }
    const restart = { ...touched(prior, T1), calendar: { day: 10, start: 10 } }
    const local = { revision: 7, save: touched(prior, T2), dirty: true }
    expect(reconcile(local, { revision: 8, save: restart })).toEqual({
      kind: 'adopt', envelope: { revision: 8, save: restart }, replacesUnsynced: true,
    })
  })

  it('keeps the save changed last when both sides moved, and flags only an adopt that replaces unsynced changes', () => {
    const older = touched(base, T1)
    const newer = touched(base, T2)
    expect(reconcile({ revision: 3, save: newer, dirty: true }, { revision: 4, save: older })).toEqual({ kind: 'push', baseRevision: 4, save: newer })
    expect(reconcile({ revision: 3, save: older, dirty: true }, { revision: 4, save: newer })).toMatchObject({ kind: 'adopt', replacesUnsynced: true })
    expect(reconcile({ revision: 3, save: older, dirty: false }, { revision: 4, save: newer })).toMatchObject({ kind: 'adopt', replacesUnsynced: false })
  })
})
