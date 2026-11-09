// The loop's plain home (F17): the date, the gold, the Umas on the farm with their best rank, the Warehouse's count.
import { newRosterUma, newSave, type SaveV3 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { bestRank, loopHomeView } from './home-view'

const AT = '2026-11-09T10:00:00.000Z'

describe('the loop home', () => {
  it('shows day 1 with its gold, its Umas and the Warehouse', () => {
    const miner = newRosterUma(1)
    miner.ranks.mining = { points: 160, rank: 2, challenge: 0 }
    const save: SaveV3 = { ...newSave('u1', AT), gold: 1250, roster: { 101: miner, 202: newRosterUma(1), 303: newRosterUma(1) },
      dorm: { level: 1, home: ['101', '202'], swaps: [] }, items: { 'seed-carrot': [9, 0, 0, 0, 0], carp: [1, 2, 0, 0, 0] } }
    expect(loopHomeView(save)).toEqual({
      date: 'Spring 1', year: 'Year 1', gold: '1,250g', away: 1, stock: 12,
      home: [{ outfitId: '101', rank: 'Skilled · Mining' }, { outfitId: '202', rank: 'Novice' }],
    })
    expect(loopHomeView({ ...save, calendar: { day: 49 } })).toMatchObject({ date: 'Spring 1', year: 'Year 2' })
    expect(loopHomeView({ ...save, calendar: { day: 30 } })).toMatchObject({ date: 'Autumn 6', year: 'Year 1' })
  })

  it('names her best rank: the highest, then the most points', () => {
    const uma = newRosterUma(1)
    uma.ranks.fishing = { points: 12, rank: 0, challenge: 0 }
    expect(bestRank(uma)).toBe('Novice · Fishing')
    uma.ranks.farming = { points: 41, rank: 1, challenge: 0 }
    uma.ranks.foraging = { points: 60, rank: 1, challenge: 0 }
    expect(bestRank(uma)).toBe('Hand · Foraging')
  })
})
