// A place's page as data (copied from uma-rpg's place-view-v4.test.ts at 30a322a, F5): a gathering place's ten raw tiles,
// a workbench's refined ones, a making place's chips with their gates, each job's kind and sizes, the opening job, the help
// and the quick look.
import { describe, expect, it } from 'vitest'
import { gatherTiles, helpLines, initialJob, jobKindAt, jobSizesOf, makeGroups, peekLine, processTiles } from './place-view'

describe('a place\'s What step', () => {
  it('lists a gathering place\'s ten raw items, grade g open at Craft Lv 5g − 4', () => {
    const tiles = gatherTiles('metal', 5)
    expect(tiles.map((t) => t.id)).toEqual(['copper-ore', 'tin-ore', 'iron-ore', 'silver-ore', 'cobalt-ore', 'gold-ore', 'platinum-ore', 'titanium-ore',
      'mythril-ore', 'orichalcum-ore'])
    expect(tiles.map((t) => t.locked)).toEqual([null, 'From Craft Lv 6', 'From Craft Lv 11', 'From Craft Lv 16', 'From Craft Lv 21', 'From Craft Lv 26',
      'From Craft Lv 31', 'From Craft Lv 36', 'From Craft Lv 41', 'From Craft Lv 46'])
    expect(gatherTiles('metal', 6)[1]!.locked).toBeNull()
    expect(gatherTiles('fish', 50).map((t) => t.id).slice(0, 3)).toEqual(['carp', 'trout', 'sardine'])
  })

  it('gives a workbench its line\'s refined tiles and a making place its chips', () => {
    expect(processTiles('vegetables', 1).map((t) => t.id).slice(0, 3)).toEqual(['chopped-carrot', 'diced-potato', 'shredded-cabbage'])
    expect(makeGroups('mine-workbench', 11)).toEqual([])
    const forge = makeGroups('weapon-forge', 11)
    expect(forge).toHaveLength(1)
    expect(forge[0]!.chips.map((c) => c.id)).toEqual(Array.from({ length: 10 }, (_, i) => `weapon-gem-g${i + 1}`))
    expect(forge[0]!.chips.map((c) => c.locked === null)).toEqual([true, true, true, false, false, false, false, false, false, false])
    expect(makeGroups('tome-forge', 1)[0]!.chips[0]!.id).toBe('tome-ink-g1')
    expect(makeGroups('armorer', 1)[0]!.chips[9]!.id).toBe('armor-fittings-g10')
    expect(makeGroups('charm-forge', 1)[0]!.chips[0]!.id).toBe('accessory-setting-g1')
    const lapidary = makeGroups('lapidary', 21)
    expect(lapidary.map((g) => [g.label, g.chips.map((c) => `${c.label}:${c.grade}:${c.locked === null}`)])).toEqual([
      ['Planet', ['I:1:true', 'II:3:true', 'III:5:true', 'IV:7:false', 'V:9:false']],
      ['Moon', ['I:2:true', 'II:4:true', 'III:6:false', 'IV:8:false', 'V:10:false']],
    ])
    expect(makeGroups('mine', 50)).toEqual([])
  })

  it('tells each job\'s kind and sizes, up to about 8 hours', () => {
    expect(jobKindAt('mine-workbench', 'copper-ingot')).toBe('refine')
    expect(jobKindAt('weapon-forge', 'weapon-gem-g1')).toBe('craft')
    expect(jobKindAt('mine', 'tin-ore')).toBe('gather')
    expect(jobKindAt('lapidary', 'jewel-planet-1')).toBe('cut')
    expect(jobKindAt('den-workbench', 'cut-ruby')).toBe('refine')
    expect(jobSizesOf('tin-ore')).toEqual([1, 2, 3, 5, 10, 15, 20, 30])
    expect(jobSizesOf('copper-ingot')).toEqual([1, 2, 3, 5, 10, 15, 20, 30])
    expect(jobSizesOf('armor-fittings-g1')).toEqual([1, 2, 3, 5, 10])
    expect(jobSizesOf('jewel-moon-1')).toEqual([1, 2, 3, 5, 6])
    expect(jobSizesOf('weapon-gem-g4')).toEqual([1, 2, 3])
    expect(jobSizesOf('tome-ink-g1')).toEqual([1, 2, 3])
    expect(jobSizesOf('accessory-setting-g1')).toEqual([1, 2, 3, 5, 6])
  })

  it('opens on the highest grade she can take', () => {
    expect(initialJob('weapon-forge', 12)).toBe('weapon-gem-g3')
    expect(initialJob('weapon-forge', 1)).toBe('weapon-gem-g1')
    expect(initialJob('mine-workbench', 12)).toBe('iron-ingot')
    expect(initialJob('mine', 26)).toBe('gold-ore')
    expect(initialJob('lapidary', 16)).toBe('jewel-moon-2')
  })

  it('says what each place does and shows it in the quick look', () => {
    expect(helpLines('mine')[0]).toBe('Gathers metal, G1–G10. Grade g opens at Craft Lv 5g − 4.')
    expect(helpLines('mine')[1]).toContain('Metal Umas work here')
    expect(helpLines('mine-workbench')[0]).toBe('Processes metal’s raw items into refined ones, one for one. Grade g opens at Craft Lv 5g − 4.')
    expect(helpLines('weapon-forge')[0]).toBe('Makes Arms Gems from Ingots, one step for each refined item in it. Grade g opens at Craft Lv 5g − 4.')
    expect(helpLines('tome-forge')[0]).toContain('Tome Ink from vegetable cuts')
    expect(peekLine('fields')).toEqual({ icons: ['carrot', 'potato', 'cabbage', 'onion', 'tomato', 'bell-pepper', 'eggplant', 'asparagus', 'golden-carrot', 'emperor-pumpkin'] })
    expect(peekLine('mine-workbench')).toEqual({ icons: ['copper-ingot', 'tin-ingot', 'iron-ingot', 'silver-ingot', 'cobalt-ingot', 'gold-ingot',
      'platinum-ingot', 'titanium-ingot', 'mythril-ingot', 'orichalcum-ingot'] })
    const forge = peekLine('weapon-forge')
    expect('chips' in forge && forge.chips).toHaveLength(10)
    expect('chips' in peekLine('lapidary') && (peekLine('lapidary') as { chips: unknown[] }).chips).toHaveLength(10)
  })
})
