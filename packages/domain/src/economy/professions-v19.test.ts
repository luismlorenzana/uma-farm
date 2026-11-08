// Copied from uma-rpg packages/domain/src/economy/professions-v19.test.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// Classes v3's trades (H126; classes-v3.md §6, CV20): one trade a Tier 0, her calling naming it; the trade ids keep their
// names. Invented outfits only.
import { describe, expect, it } from 'vitest'
import { UMA_ROW_CALLING_V3 } from '../roster/template'
import { tradeOfCalling, tradePlaces, tradeResolver, umaTrade } from './professions'

const TIER0 = Object.values(UMA_ROW_CALLING_V3)
const outfit = (style: 'front' | 'pace' | 'late' | 'end', also?: 'late' | 'end') => ({
  aptitudes: { strategy: { front: 'B', pace: 'B', late: 'B', end: 'B', [style]: 'A', ...(also ? { [also]: 'A' } : {}) },
    distance: { sprint: 'B', mile: 'B', medium: 'A', long: 'B' } },
  baseStats: { power: 100, wit: 90 },
}) as const

describe('trades by Tier 0 (CV20)', () => {
  it('gives each Tier 0 one trade: Warrior Metal, Spellblade Wood, Healer Vegetables, Summoner Fish, Mage Stone', () => {
    expect(Object.fromEntries(TIER0.map((c) => [c, tradeOfCalling(c)]))).toEqual({
      recruit: 'physical', duelist: 'physical-hybrid', acolyte: 'healer', caller: 'magical-hybrid', apprentice: 'magical',
    })
    expect(Object.fromEntries(TIER0.map((c) => [c, tradePlaces(tradeOfCalling(c))[0]]))).toEqual({
      recruit: 'mine', duelist: 'forest', acolyte: 'fields', caller: 'fishery', apprentice: 'monster-den',
    })
  })

  it('reads her trade from her Tier 0', () => {
    const pace = outfit('pace')
    expect(umaTrade(pace)).toBe('physical-hybrid')
    // Pace + Late: the Mage's Stone.
    expect(umaTrade(outfit('pace', 'late'))).toBe('magical')
    expect(umaTrade(outfit('front'))).toBe('physical')
    expect(umaTrade(outfit('late'))).toBe('healer')
    expect([umaTrade(outfit('end')), umaTrade(outfit('late', 'end'))]).toEqual(['magical-hybrid', 'magical-hybrid'])
  })

  it('resolves a world\'s trades', () => {
    const world = { umas: { a: {}, b: {} } }
    const outfits = new Map([['a', outfit('pace')], ['b', outfit('late')]])
    const of = tradeResolver(world, (id) => outfits.get(id))
    expect([of('a'), of('b'), of('c')]).toEqual(['physical-hybrid', 'healer', null])
  })
})
