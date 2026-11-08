// Who takes a slot (from uma-rpg's place-view.test.ts at 30a322a, F5): her trade's Umas first, the rest greyed "Another
// trade", and the open shop when the roster has none of a place's trade.
import { describe, expect, it } from 'vitest'
import { albumFixture } from '../album/testing'
import { isOpenShop, tradeLabel, TRADES_BY_ROW, whoAt } from './trade'

describe('who takes a slot', () => {
  it('puts her trade\'s Umas first and greys the rest "Another trade"', async () => {
    const { view } = await albumFixture()
    const forge = whoAt('weapon-forge', view.roster)
    expect(['81001', '81002', '81006'].map((id) => [forge.first(id), forge.reason(id)])).toEqual([[true, null], [false, 'Another trade'], [false, 'Another trade']])
    // The Forest Workbench is Wood's: both Pace-alone Umas work it.
    const bench = whoAt('forest-workbench', view.roster)
    expect([bench.first('81002'), bench.first('81003'), bench.first('81001')]).toEqual([true, true, false])
    // An outfit the roster doesn't hold is never greyed.
    expect(forge.reason('999')).toBeNull()
  })

  it('opens a place to everyone when no outfit on the roster has its trade', async () => {
    const { view } = await albumFixture([['front'], ['pace']])
    expect(isOpenShop('lapidary', view.roster)).toBe(true)
    expect(isOpenShop('mine', view.roster)).toBe(false)
    const who = whoAt('lapidary', view.roster)
    expect(['81001', '81002'].map((id) => [who.first(id), who.reason(id)])).toEqual([[true, null], [true, null]])
  })

  it('names the trades by their lines, in the map\'s row order', () => {
    expect(TRADES_BY_ROW.map(tradeLabel)).toEqual(['Metal', 'Vegetables', 'Wood', 'Fish', 'Stone'])
  })
})
