// The worker picker's Trade facet (FW7; from uma-rpg's trade-facet.test.ts at 30a322a): five trades by their lines in the
// map's order, each one's head count from her running styles, and every outfit on the release as a row.
import { newSave, startJob, rosterContext } from '@farm/domain'
import { runAlbumQuery } from '@luismlorenzana/uma-kit/roster'
import { describe, expect, it } from 'vitest'
import { albumRows, PICKER_FACETS, TRADE_FACET } from './rows'
import { albumFixture, NOW } from './testing'

const QUERY = { search: '', filters: {}, sort: 'name', direction: 'asc' as const, group: null, view: 'icons' as const, mode: null }

describe('the picker\'s Trade facet', () => {
  it('is a Trade group of five, named by their lines in the map\'s order', () => {
    expect([TRADE_FACET.group, TRADE_FACET.key, TRADE_FACET.options!.map((o) => o.label)]).toEqual(['Trade', 'trade', ['Metal', 'Vegetables', 'Wood', 'Fish', 'Stone']])
    expect(PICKER_FACETS[0]).toBe(TRADE_FACET)
  })

  it('lists every outfit at Craft Lv 1 before her first job, and counts each trade\'s heads', async () => {
    const { view } = await albumFixture()
    const rows = albumRows(view, newSave('u1', NOW), NOW)
    expect(rows.map((r) => [r.id, r.name, r.level, r.workLevel, r.free, r.worked])).toEqual([
      ['81001', 'Aster', 1, 1, true, false], ['81002', 'Beryl', 1, 1, true, false], ['81003', 'Cinder', 1, 1, true, false],
      ['81004', 'Dune', 1, 1, true, false], ['81005', 'Ember', 1, 1, true, false], ['81006', 'Fable', 1, 1, true, false],
    ])
    const result = runAlbumQuery(rows, PICKER_FACETS, QUERY)
    expect(result.counts.trade).toMatchObject({ physical: 1, 'physical-hybrid': 2, magical: 1, 'magical-hybrid': 1, healer: 1 })
    const wood = runAlbumQuery(rows, PICKER_FACETS, { ...QUERY, filters: { trade: ['physical-hybrid'] } })
    expect(wood.rows.map((r) => r.id)).toEqual(['81002', '81003'])
  })

  it('marks a working Uma busy, with her Craft Level, and finds her by name', async () => {
    const { view } = await albumFixture()
    const save = startJob({ ...newSave('u1', NOW), umas: { 81001: { craft: { level: 12, exp: 0 } } } }, 'mine', 0, { outfitId: '81001' }, 'copper-ore', 2, NOW,
      rosterContext(view.roster))
    const rows = albumRows(view, save, NOW)
    expect(rows[0]).toMatchObject({ id: '81001', craft: 12, workLevel: 12, free: false, busy: true, worked: true })
    expect(runAlbumQuery(rows, PICKER_FACETS, { ...QUERY, filters: { free: true } }).total).toBe(5)
    expect(runAlbumQuery(rows, PICKER_FACETS, { ...QUERY, search: 'ember' }).rows.map((r) => r.id)).toEqual(['81005'])
  })
})
