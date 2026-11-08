// The farm's roster (FM6, FM7, R3): every outfit on the release works, each in her trade's three places. Synthetic master
// data only (uma-data/testing): one invented outfit, and invented copies with other running styles.
import type { Outfit } from '@luismlorenzana/uma-data'
import { syntheticMasterData } from '@luismlorenzana/uma-data/testing'
import { describe, expect, it } from 'vitest'
import { newSave, type Save } from '../save/save'
import { startJob } from '../save/work'
import { farmRoster, isOutfitId, rosterContext, tradeLine } from './roster'

const base = syntheticMasterData().outfits[0]!
/** An invented copy of the synthetic outfit with her best running styles at A, the rest at C. */
const styled = (id: number, ...best: ('front' | 'pace' | 'late' | 'end')[]): Outfit => ({
  ...base, id,
  aptitudes: { ...base.aptitudes, strategy: { front: 'C', pace: 'C', late: 'C', end: 'C', ...Object.fromEntries(best.map((s) => [s, 'A'])) } },
})
const OUTFITS = [styled(900201, 'front'), styled(900202, 'pace'), styled(900203, 'pace', 'late'), styled(900204, 'end'), styled(900205, 'late')]
const AT = '2026-11-08T10:00:00.000Z'

describe('the roster (FM6, FM7)', () => {
  it('takes every outfit on the release, each with her trade and its line', () => {
    expect(farmRoster(syntheticMasterData())).toEqual([{ outfitId: '900101', trade: 'physical', line: 'metal' }])
    expect(farmRoster({ outfits: OUTFITS }).map((o) => [o.outfitId, o.trade, o.line])).toEqual([
      ['900201', 'physical', 'metal'], ['900202', 'physical-hybrid', 'wood'], ['900203', 'magical', 'stone'],
      ['900204', 'magical-hybrid', 'fish'], ['900205', 'healer', 'vegetables'],
    ])
    expect(farmRoster({ outfits: [{ ...base, id: 0 }] })).toEqual([])
    expect([tradeLine('physical'), tradeLine('healer')]).toEqual(['metal', 'vegetables'])
    expect([isOutfitId('900101'), isOutfitId('0'), isOutfitId('abc')]).toEqual([true, false, false])
  })

  it('keeps each Uma to her trade\'s places, with the whole roster counting for the open shop', () => {
    const context = rosterContext(farmRoster({ outfits: OUTFITS }))
    const save: Save = { ...newSave('u1', AT), items: { carrot: 1 } }
    // The Front runner works the Mine, not the Forest.
    expect(startJob(save, 'mine', 0, { outfitId: '900201' }, 'copper-ore', 1, AT, context).work['900201']?.slot).toEqual({ building: 'mine', slot: 0 })
    expect(() => startJob(save, 'forest', 0, { outfitId: '900201' }, 'pine-log', 1, AT, context)).toThrow('Another trade')
    // No Uma has worked yet, but the roster has a Late runner, so the Fields aren't an open shop.
    expect(() => startJob(save, 'fields-workbench', 0, { outfitId: '900201' }, 'chopped-carrot', 1, AT, context)).toThrow('Another trade')
    expect(startJob(save, 'fields-workbench', 0, { outfitId: '900205' }, 'chopped-carrot', 1, AT, context).items).toEqual({})
    // A roster with no Late runner leaves the Fields open to everyone.
    const noHealer = rosterContext(farmRoster({ outfits: OUTFITS.slice(0, 4) }))
    expect(startJob(save, 'fields-workbench', 0, { outfitId: '900201' }, 'chopped-carrot', 1, AT, noHealer).work['900201']?.slot?.building).toBe('fields-workbench')
  })

  it('lets any outfit on the roster work, and no other', () => {
    const context = rosterContext(farmRoster({ outfits: OUTFITS }))
    const save = newSave('u1', AT)
    const started = startJob(save, 'mine', 0, { outfitId: '900201' }, 'copper-ore', 1, AT, context)
    expect(started.umas).toEqual({ 900201: { craft: { level: 1, exp: 0 } } })
    expect(() => startJob(save, 'mine', 0, { outfitId: '123456' }, 'copper-ore', 1, AT, context)).toThrow()
    // Without a roster (settles, the API's parse), any well-formed outfit id may work.
    expect(startJob(save, 'mine', 0, { outfitId: '123456' }, 'copper-ore', 1, AT).umas['123456']).toEqual({ craft: { level: 1, exp: 0 } })
    expect(() => startJob(save, 'mine', 0, { outfitId: 'nobody' }, 'copper-ore', 1, AT)).toThrow()
  })
})
