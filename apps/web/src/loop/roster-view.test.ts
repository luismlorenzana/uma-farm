// The roster page's view (F18): the Umas on the farm with their best rank, and how many are away.
import { newRosterUma, newSave, type SaveV3 } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { bestRank, rosterView } from './roster-view'

const AT = '2026-11-09T10:00:00.000Z'

describe('the roster page', () => {
  it('lists the Umas on the farm with their best rank, and counts those away', () => {
    const miner = newRosterUma(1)
    miner.ranks.mining = { points: 160, rank: 2, challenge: 0 }
    const save: SaveV3 = { ...newSave('u1', AT), roster: { 101: miner, 202: newRosterUma(1), 303: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202'], swaps: [] } }
    expect(rosterView(save)).toEqual({ away: 1, home: [{ outfitId: '101', rank: 'Skilled · Mining' }, { outfitId: '202', rank: 'Novice' }] })
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
