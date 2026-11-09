// The price rule (F19 decisions 1–3; CS9, CS4): the spec's worked prices, CS14's, CS15's and CS16's tables as the rule's
// output row for row, the crops' own prices, stars never compounded, and demand by season.
import { describe, expect, it } from 'vitest'
import { farmDay } from '../farm/calendar'
import { CROP_IDS, GOODS, goodOf, type GoodFamily } from './ids'
import { demandRule, hasPrice, inDemand, madePrice, priceOf, starFactor, STARS } from './prices'
import { CROP_PRICES, DEMAND, FAMILY_FACTOR, LADDER, ladderPrice } from './rule'

const SPRING_1 = farmDay({ year: 1, season: 'spring', day: 1 })
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })
const AUTUMN_5 = farmDay({ year: 1, season: 'autumn', day: 5 })
const WINTER_7 = farmDay({ year: 1, season: 'winter', day: 7 })

/** A family's ten raw or refined prices ★1, G1 → G10. */
const row = (family: GoodFamily, refined: boolean): number[] =>
  GOODS.filter((g) => g.family === family && g.refined === refined).sort((a, b) => a.grade - b.grade).map((g) => g.price)
/** A table row as the spec prints it: "30 · 40 · 50". */
const spec = (text: string): number[] => text.split(' · ').map(Number)

describe('the ladder and the factors (CS9)', () => {
  it('climbs ten grades from 30g to 300g', () => {
    expect(LADDER).toEqual([30, 40, 50, 65, 85, 110, 140, 180, 230, 300])
    expect(ladderPrice('ores', 1)).toBe(30)
    expect(() => ladderPrice('ores', 11)).toThrow(RangeError)
  })

  it('gives every family that isn\'t all crops a factor', () => {
    expect(FAMILY_FACTOR).toEqual({
      ores: 1.0, stones: 0.8, crystals: 1.6, woods: 0.8, mushrooms: 1.0, 'herbs-spices': 0.9, fruits: 1.1, 'nuts-seeds': 1.0, sweets: 1.1, fish: 1.3,
      'hides-scales': 1.5, 'bones-horns': 1.6, essences: 1.8,
    })
    for (const good of GOODS.filter((g) => g.family === 'grains' || g.family === 'vegetables')) expect(good.crop || good.refined, good.id).toBe(true)
  })
})

describe('the worked prices (CS9)', () => {
  it('prices Silver Ore 65g, a Silver Ingot 100g and a ★3 Silver Ingot 150g', () => {
    expect(priceOf('silver-ore', 1, SPRING_1)).toBe(65)
    expect(priceOf('silver-ingot', 1, SPRING_1)).toBe(100)
    expect(priceOf('silver-ingot', 3, SPRING_1)).toBe(150)
  })

  it('prices a Salmon 110g, and a ★2 Salmon in Summer 165g', () => {
    expect(priceOf('salmon', 1, SPRING_1)).toBe(110)
    expect(priceOf('salmon', 2, SUMMER_3)).toBe(165)
  })
})

describe('the tables are the rule\'s output, row for row', () => {
  it.each<[GoodFamily, string, string]>([
    // CS14
    ['ores', '30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300', '45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450'],
    ['stones', '25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240', '40 · 45 · 60 · 75 · 105 · 135 · 165 · 220 · 280 · 360'],
    ['crystals', '50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480', '75 · 100 · 120 · 160 · 205 · 265 · 340 · 435 · 555 · 720'],
    // CS16
    ['woods', '25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240', '40 · 45 · 60 · 75 · 105 · 135 · 165 · 220 · 280 · 360'],
    ['mushrooms', '30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300', '45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450'],
    ['herbs-spices', '45 · 45 · 45 · 60 · 200 · 100 · 125 · 160 · 520 · 270', '70 · 70 · 70 · 90 · 300 · 150 · 190 · 240 · 780 · 405'],
    ['fruits', '35 · 45 · 55 · 70 · 95 · 120 · 155 · 200 · 255 · 330', '55 · 70 · 85 · 105 · 145 · 180 · 235 · 300 · 385 · 495'],
    ['nuts-seeds', '35 · 75 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300', '55 · 115 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450'],
    ['sweets', '35 · 45 · 120 · 70 · 95 · 120 · 155 · 200 · 255 · 330', '55 · 70 · 180 · 105 · 145 · 180 · 235 · 300 · 385 · 495'],
  ])('%s: raw and refined G1 → G10', (family, raw, refined) => {
    expect(row(family, false)).toEqual(spec(raw))
    expect(row(family, true)).toEqual(spec(refined))
  })

  it('fish and fillets as CS15 prices them', () => {
    const fish = ['carp', 'trout', 'sardine', 'mackerel', 'salmon', 'sea-bream', 'eel', 'tuna', 'silverfin', 'rainbow-koi']
    expect(fish.map((id) => goodOf(id)!.price)).toEqual([40, 50, 65, 85, 110, 145, 180, 235, 300, 390])
    expect(fish.map((id) => goodOf(`${id}-fillet`)!.price)).toEqual([60, 75, 100, 130, 165, 220, 270, 355, 450, 585])
    expect(goodOf('salmon-fillet')!.input).toBe('salmon')
  })
})

describe('crops have their own prices (CS11)', () => {
  it('prices all 27, and the seven that are forest goods keep them', () => {
    expect(Object.keys(CROP_PRICES).sort()).toEqual([...CROP_IDS].sort())
    for (const crop of CROP_IDS) expect(goodOf(crop)!.price, crop).toBe(CROP_PRICES[crop])
    expect(['basil', 'mint', 'ginger', 'mandrake', 'peanut', 'sunflower-seed', 'sugar-beet'].map((id) => [goodOf(id)!.family, goodOf(id)!.price])).toEqual([
      ['herbs-spices', 45], ['herbs-spices', 45], ['herbs-spices', 200], ['herbs-spices', 520], ['nuts-seeds', 35], ['nuts-seeds', 75], ['sweets', 120],
    ])
  })

  it('refines a crop at ×1.5: the flours, Dried Mint', () => {
    expect(['wheat-flour', 'rolled-oats', 'pearl-barley', 'polished-rice', 'cornmeal', 'rye-flour', 'buckwheat-flour', 'hulled-wild-rice', 'moonrice-flour',
      'sunwheat-flour'].map((id) => goodOf(id)!.price)).toEqual([60, 60, 70, 75, 210, 90, 115, 240, 360, 390])
    expect(goodOf('dried-mint')).toMatchObject({ price: 70, input: 'mint' })
  })

  it('prices every one of the 260, each a whole 5g', () => {
    for (const good of GOODS) expect(good.price % 5, good.id).toBe(0)
    expect(GOODS.every((g) => g.price >= 25)).toBe(true)
  })
})

describe('stars (CS9 rule 5, D24 #12)', () => {
  it('adds a quarter a star, never compounded', () => {
    expect(STARS.map(starFactor)).toEqual([1, 1.25, 1.5, 1.75, 2])
    expect(STARS.map((s) => priceOf('silver-ingot', s, SPRING_1))).toEqual([100, 125, 150, 175, 200])
    expect(STARS.map((s) => priceOf('carrot', s, AUTUMN_5))).toEqual([60, 75, 90, 105, 120])
    expect(() => starFactor(6)).toThrow(RangeError)
    expect(() => priceOf('carrot', 0, SPRING_1)).toThrow(RangeError)
  })

  it('rounds the unit price once, to 5g, after stars and demand (decision 2)', () => {
    expect(priceOf('silver-ore', 2, SPRING_1)).toBe(80) // 81.25
    expect(priceOf('trout', 2, SUMMER_3)).toBe(75) // 50 × 1.25 × 1.2 = 75
    expect(priceOf('pine-log', 4, SPRING_1)).toBe(45) // 25 × 1.75 = 43.75
  })
})

describe('demand (CS4, decision 3)', () => {
  it('lifts a Summer Salmon and a Summer Salmon Fillet, not a Summer Carrot', () => {
    expect(inDemand('salmon', SUMMER_3) && inDemand('salmon-fillet', SUMMER_3)).toBe(true)
    expect(inDemand('carrot', SUMMER_3)).toBe(false)
    expect(priceOf('salmon-fillet', 1, SUMMER_3)).toBe(200) // 165 × 1.2 = 198
    expect(priceOf('carrot', 1, SUMMER_3)).toBe(60)
  })

  it('names each season\'s families, raw and refined; Winter\'s preserves only', () => {
    const lifted = (day: number) => GOODS.filter((g) => inDemand(g.id, day)).map((g) => `${g.family}${g.refined ? '/refined' : ''}`)
    const rows = (day: number) => [...new Set(lifted(day))]
    expect(rows(SPRING_1)).toEqual(['vegetables', 'sweets', 'sweets/refined'])
    expect(rows(SUMMER_3)).toEqual(['fruits', 'fruits/refined', 'fish', 'fish/refined'])
    expect(rows(AUTUMN_5)).toEqual(['grains', 'grains/refined', 'nuts-seeds', 'nuts-seeds/refined', 'mushrooms', 'mushrooms/refined'])
    expect(rows(WINTER_7)).toEqual(['fruits/refined'])
    expect(DEMAND.winter.map((r) => r.name)).toEqual(['Dishes', 'Cloth', 'Preserves'])
  })

  it('follows a crop\'s family, so Sugar Beet is a Spring sweet and Peanut an Autumn nut', () => {
    expect(demandRule('sugar-beet', SPRING_1)?.name).toBe('Sweets')
    expect(demandRule('peanut', AUTUMN_5)?.name).toBe('Nuts and seeds')
    expect(demandRule('ginger', SPRING_1) ?? demandRule('ginger', SUMMER_3) ?? demandRule('ginger', AUTUMN_5) ?? demandRule('ginger', WINTER_7)).toBeNull()
    expect(inDemand('apple-preserve', WINTER_7) && !inDemand('apple', WINTER_7)).toBe(true)
  })

  it('lifts a good once, and follows the year round', () => {
    expect(priceOf('apple-preserve', 2, SUMMER_3)).toBe(priceOf('apple-preserve', 2, SUMMER_3 + 48))
    expect(priceOf('apple-preserve', 1, SUMMER_3)).toBe(65) // 55 × 1.2 = 66
  })
})

describe('what has a price', () => {
  it('prices goods and nothing else: a seed has none', () => {
    expect(hasPrice('carrot')).toBe(true)
    expect(hasPrice('seed-carrot') || hasPrice('seed-carrot-own') || hasPrice('chopped-carrot')).toBe(false)
    expect(() => priceOf('seed-carrot', 1, SPRING_1)).toThrow(RangeError)
  })

  it('prices a made good at ×1.25 its inputs at ★1 (rule 3)', () => {
    expect(madePrice({ 'silver-ingot': 2, 'cut-garnet': 1 })).toBe(450) // (200 + 160) × 1.25
    expect(() => madePrice({ 'seed-carrot': 1 })).toThrow(RangeError)
  })
})
