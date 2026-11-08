// Copied from uma-rpg packages/domain/src/economy/professions.test.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The professions and trades (H77; profession-progression.md §2, §4.1, PP1–PP3, PP4; the farm by line, D224, FL1–FL3):
// fifteen professions in three kinds, fifteen places each one line's, and one trade an Uma by her calling.
import { describe, expect, it } from 'vitest'
import { FARM_BUILDINGS, farmWorkEnv } from '../work/env-v4'
import { PLACES_V4, placeSpecV4 } from './places-v4'
import { professionById, PROFESSIONS, tradePlaces, tradeProfessions, TRADES } from './professions'

describe('fifteen professions (FL25)', () => {
  it('splits into five gathering, processing and making professions, one place each', () => {
    expect(PROFESSIONS.map((p) => [p.id, p.name, p.kind, p.place])).toEqual([
      ['mining', 'Mining', 'gathering', 'mine'], ['smelting', 'Smelting', 'processing', 'mine-workbench'],
      ['arms-crafting', 'Arms Crafting', 'making', 'weapon-forge'], ['farming', 'Farming', 'gathering', 'fields'],
      ['prepping', 'Prepping', 'processing', 'fields-workbench'], ['tome-crafting', 'Tome Crafting', 'making', 'tome-forge'],
      ['wood-chopping', 'Wood Chopping', 'gathering', 'forest'], ['sawing', 'Sawing', 'processing', 'forest-workbench'],
      ['armor-crafting', 'Armor Crafting', 'making', 'armorer'], ['fishing', 'Fishing', 'gathering', 'fishery'],
      ['filleting', 'Filleting', 'processing', 'fishery-workbench'], ['accessory-crafting', 'Accessory Crafting', 'making', 'charm-forge'],
      ['hunting', 'Hunting', 'gathering', 'monster-den'], ['stonecutting', 'Stonecutting', 'processing', 'den-workbench'],
      ['jewel-crafting', 'Jewel Crafting', 'making', 'lapidary'],
    ])
    expect(professionById('jewel-crafting')?.name).toBe('Jewel Crafting')
  })

  it('keeps the engine\'s four job kinds, exactly one per place', () => {
    expect(Object.fromEntries(PLACES_V4.map((p) => [p.id, p.kinds.join('+')]))).toEqual({
      mine: 'gather', 'mine-workbench': 'refine', 'weapon-forge': 'craft', fields: 'gather', 'fields-workbench': 'refine', 'tome-forge': 'craft',
      forest: 'gather', 'forest-workbench': 'refine', armorer: 'craft', fishery: 'gather', 'fishery-workbench': 'refine', 'charm-forge': 'craft',
      'monster-den': 'gather', 'den-workbench': 'refine', lapidary: 'cut',
    })
    for (const place of PLACES_V4) expect(professionById(place.profession)?.place).toBe(place.id)
    expect(PLACES_V4.filter((p) => p.kinds.includes('gather')).map((p) => p.line)).toEqual(['metal', 'vegetables', 'wood', 'fish', 'stone'])
    expect(placeSpecV4('weapon-forge')?.made).toEqual(['weapon-gem'])
    expect(placeSpecV4('lapidary')?.made).toEqual(['jewel-planet', 'jewel-moon'])
    expect(placeSpecV4('quarry')).toBeUndefined()
  })

  it('works the Wilds\' places on the farm\'s env', () => {
    expect(farmWorkEnv().buildings).toBe(FARM_BUILDINGS)
  })
})

describe('the trade (PP2, PP3)', () => {
  it('gives each trade its gathering, processing and crafting places', () => {
    expect(Object.fromEntries(TRADES.map((t) => [t.id, tradePlaces(t.id)]))).toEqual({
      physical: ['mine', 'mine-workbench', 'weapon-forge'], 'physical-hybrid': ['forest', 'forest-workbench', 'armorer'],
      healer: ['fields', 'fields-workbench', 'tome-forge'], 'magical-hybrid': ['fishery', 'fishery-workbench', 'charm-forge'],
      magical: ['monster-den', 'den-workbench', 'lapidary'],
    })
    expect(tradeProfessions('healer')).toEqual(['farming', 'prepping', 'tome-crafting'])
    // Every profession belongs to exactly one trade.
    expect(TRADES.flatMap((t) => tradeProfessions(t.id)).sort()).toEqual(PROFESSIONS.map((p) => p.id).sort())
  })
})
