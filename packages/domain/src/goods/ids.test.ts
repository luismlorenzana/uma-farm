// The v3 Warehouse's ids (F17 decision 7; CS19). The web's test checks each good is on uma-art's atlas.
import { describe, expect, it } from 'vitest'
import { isLineItemId, LINE_ITEMS } from '../items/lines'
import { CROP_IDS, GOODS, GOOD_IDS, goodOf, isCropId, isGoodId, isSeedId, isWarehouseId, SEED_IDS, seedId, seedOf } from './ids'

const of = (families: string[]) => GOODS.filter((g) => families.includes(g.family))

describe('the goods (CS19)', () => {
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
    expect(goodOf('silver-ingot')).toEqual({ id: 'silver-ingot', family: 'ores', grade: 4, refined: true, crop: false })
    expect(goodOf('sugar-beet')).toEqual({ id: 'sugar-beet', family: 'sweets', grade: 3, refined: false, crop: true })
    expect(goodOf('chopped-carrot')).toBeUndefined()
    expect(isCropId('carrot') && !isCropId('chopped-carrot')).toBe(true)
  })

  it("keeps v2's ores and ingots, logs and planks, fish and fillets, crystals, and raw vegetables; not the rest", () => {
    const kept = LINE_ITEMS.filter((m) => isGoodId(m.id))
    expect(kept).toHaveLength(90)
    expect(LINE_ITEMS.filter((m) => !isGoodId(m.id)).every((m) => m.line === 'vegetables' && m.refined)).toBe(true)
    expect(isLineItemId('weapon-gem-g1') || isGoodId('weapon-gem-g1')).toBe(false)
  })
})

describe('seeds (decision 6)', () => {
  it('names a shop seed and an own seed for each crop', () => {
    expect(SEED_IDS).toHaveLength(54)
    expect(seedId('carrot')).toBe('seed-carrot')
    expect(seedId('carrot', true)).toBe('seed-carrot-own')
    expect(seedOf('seed-wild-rice-own')).toEqual({ crop: 'wild-rice', own: true })
    expect(seedOf('carrot')).toBeUndefined()
    expect(isSeedId('seed-carrot') && !isGoodId('seed-carrot') && isWarehouseId('seed-carrot')).toBe(true)
    expect(isWarehouseId('seed-chopped-carrot')).toBe(false)
  })
})
