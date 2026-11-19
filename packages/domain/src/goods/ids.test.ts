// The Warehouse's ids. The web's test checks each good is on uma-art's atlas.
import { describe, expect, it } from 'vitest'
import { CROP_IDS, GOODS, GOOD_IDS, goodOf, isCropId, LEGACY_CROP_IDS, refinedOf, isGoodId, isSeedId, isWarehouseId, SEED_IDS, seedId, seedOf } from './ids'
import { goodName } from './names'

const of = (families: string[]) => GOODS.filter((g) => families.includes(g.family))

describe('the goods', () => {
  it('holds 522 goods, each once', () => {
    expect(GOOD_IDS).toHaveLength(522)
    expect(new Set(GOOD_IDS).size).toBe(522)
  })

  it('counts 27 crops and 10 flours, the forest 113, mining 60, fishing 20, expeditions 30, the ranch 24', () => {
    expect(of(['fibers'])).toHaveLength(20)
    expect(of(['eggs-milk']).map((g) => [g.id, g.grade, g.price])).toEqual([['egg', 1, 60], ['milk', 2, 80], ['duck-egg', 3, 100], ['goat-milk', 4, 130]])
    expect(['wool', 'alpaca-fleece', 'cashmere-fleece', 'wool-cloth'].map((id) => goodOf(id)!.price)).toEqual([100, 130, 170, 150])
    expect(refinedOf('egg')).toBe('preserved-egg')
    expect(CROP_IDS).toHaveLength(51)
    expect(GOODS.filter((g) => g.crop && g.family !== 'fruits').map((g) => g.id).sort()).toEqual([...LEGACY_CROP_IDS].sort())
    expect(of(['grains']).filter((g) => g.refined)).toHaveLength(10)
    expect(of(['woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets']).filter((g) => !g.crop || g.family === 'fruits')).toHaveLength(113)
    expect(of(['ores', 'stones', 'crystals'])).toHaveLength(60)
    expect(of(['fish'])).toHaveLength(20)
    expect(of(['hides-scales', 'bones-horns', 'essences'])).toHaveLength(30)
    expect(of(['hides-scales', 'bones-horns', 'essences']).some((g) => g.refined)).toBe(false)
  })

  it('gives each good its family and grade, raw then refined', () => {
    expect(goodOf('silver-ingot')).toEqual({ id: 'silver-ingot', family: 'ores', grade: 4, refined: true, crop: false, price: 100, input: 'silver-ore' })
    expect(goodOf('sugar-beet')).toEqual({ id: 'sugar-beet', family: 'sweets', grade: 3, refined: false, crop: true, price: 120, input: null })
    expect(refinedOf('sugar-beet')).toBe('beet-sugar')
    expect(refinedOf('carrot')).toBe('carrot-pickles')
    expect(refinedOf('dragon-scale') ?? refinedOf('beet-sugar')).toBeNull()
    expect(goodOf('chopped-carrot')).toBeUndefined()
    expect(isCropId('carrot') && !isCropId('chopped-carrot')).toBe(true)
  })

  it('takes no item the catalogue doesn\'t hold', () => {
    expect(isGoodId('weapon-gem-g1') || isGoodId('chopped-carrot')).toBe(false)
  })
})

describe('seeds', () => {
  it('names a shop seed and an own seed for each crop', () => {
    expect(SEED_IDS).toHaveLength(192)
    expect(seedId('carrot')).toBe('seed-carrot')
    expect(seedId('carrot', true)).toBe('seed-carrot-own')
    expect(seedOf('seed-wild-rice-own')).toEqual({ crop: 'wild-rice', own: true })
    expect(seedOf('carrot')).toBeUndefined()
    expect(isSeedId('seed-carrot') && !isGoodId('seed-carrot') && isWarehouseId('seed-carrot')).toBe(true)
    expect(isWarehouseId('seed-chopped-carrot')).toBe(false)
  })

  it('names goods by their ids and seeds by their crops', () => {
    expect([goodName('sunflower-seed'), goodName('seed-carrot'), goodName('seed-wild-rice-own'), goodName('cut-philosophers-stone')]).toEqual([
      'Sunflower Seed', 'Carrot seeds', 'Wild Rice seeds (own)', "Cut Philosopher's Stone",
    ])
  })
})
