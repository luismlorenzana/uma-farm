// The Warehouse's ids. The web's test checks each good is on uma-art's atlas.
import { describe, expect, it } from 'vitest'
import { CROP_IDS, GOODS, GOOD_IDS, goodName, goodOf, isCropId, refinedOf, isGoodId, isSeedId, isWarehouseId, SEED_IDS, seedId, seedOf } from './ids'

const of = (families: string[]) => GOODS.filter((g) => families.includes(g.family))

describe('the goods', () => {
  it('holds 260 goods, each once', () => {
    expect(GOOD_IDS).toHaveLength(260)
    expect(new Set(GOOD_IDS).size).toBe(260)
  })

  it('counts 27 crops and 10 flours, the forest 113, mining 60, fishing 20, expeditions 30', () => {
    expect(CROP_IDS).toHaveLength(27)
    expect(GOODS.filter((g) => g.crop).map((g) => g.id).sort()).toEqual([...CROP_IDS].sort())
    expect(of(['grains']).filter((g) => g.refined)).toHaveLength(10)
    expect(of(['woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets']).filter((g) => !g.crop)).toHaveLength(113)
    expect(of(['ores', 'stones', 'crystals'])).toHaveLength(60)
    expect(of(['fish'])).toHaveLength(20)
    expect(of(['hides-scales', 'bones-horns', 'essences'])).toHaveLength(30)
    expect(of(['hides-scales', 'bones-horns', 'essences']).some((g) => g.refined)).toBe(false)
  })

  it('gives each good its family and grade, raw then refined', () => {
    expect(goodOf('silver-ingot')).toEqual({ id: 'silver-ingot', family: 'ores', grade: 4, refined: true, crop: false, price: 100, input: 'silver-ore' })
    expect(goodOf('sugar-beet')).toEqual({ id: 'sugar-beet', family: 'sweets', grade: 3, refined: false, crop: true, price: 120, input: null })
    expect(refinedOf('sugar-beet')).toBe('beet-sugar')
    expect(refinedOf('carrot') ?? refinedOf('dragon-scale') ?? refinedOf('beet-sugar')).toBeNull()
    expect(goodOf('chopped-carrot')).toBeUndefined()
    expect(isCropId('carrot') && !isCropId('chopped-carrot')).toBe(true)
  })

  it('takes no item the catalogue doesn\'t hold', () => {
    expect(isGoodId('weapon-gem-g1') || isGoodId('chopped-carrot')).toBe(false)
  })
})

describe('seeds', () => {
  it('names a shop seed and an own seed for each crop', () => {
    expect(SEED_IDS).toHaveLength(54)
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
