// Every farm item's icon sits where uma-art's published index puts it (copied from uma-rpg's frames.test.ts at 30a322a,
// cut to the goods and seeds).
import dishes from '@luismlorenzana/uma-art/dishes/atlas.json'
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { GOOD_IDS, GOODS, HEIRLOOM_IDS, RECIPES, RESTAURANT_RECIPES, RING_IDS, SEED_IDS, TOOL_IDS } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { iconFrame, SHEET_SIZE } from './frames'

const itemFrame = (id: string) => items.frames[id as keyof typeof items.frames] as { x: number; y: number } | undefined

describe('icon frames', () => {
  it('finds the goods at their own frames, the eggs and milk too, and a seed at its crop\'s', () => {
    for (const good of GOODS) {
      const frame = itemFrame(good.id)
      expect(iconFrame(good.id), good.id).toEqual({ sheet: 'items', x: frame!.x, y: frame!.y })
    }
    expect(iconFrame('seed-carrot')).toEqual(iconFrame('carrot'))
    expect(iconFrame('carrot-grade-2')).toEqual(iconFrame('carrot'))
    expect(iconFrame('seed-carrot-grade-3-own')).toEqual(iconFrame('carrot'))
    expect(iconFrame('seed-wild-rice-own')).toEqual(iconFrame('wild-rice'))
    expect(items.width).toBe(SHEET_SIZE.items.w)
    expect(items.height).toBe(SHEET_SIZE.items.h)
    expect(iconFrame('nothing-here')).toBeNull()
    expect(['egg', 'milk', 'duck-egg', 'goat-milk'].map((id) => iconFrame(id))).toEqual([0, 32, 64, 96].map((x) => ({ sheet: 'items', x, y: 1216 })))
    expect(Object.keys(items.frames)).toHaveLength(366)
  })

  it('covers the entire stock catalogue and dedicates frames to the new Farm artwork', () => {
    const restaurant = RESTAURANT_RECIPES.map(row => row.id)
    const stock = [...GOOD_IDS, ...SEED_IDS, ...RING_IDS, ...RECIPES.map(row => row.dish), ...restaurant]
    expect(new Set(stock).size).toBe(stock.length)
    for (const id of stock) expect(iconFrame(id), id).not.toBeNull()
    const authored = [
      ...RING_IDS, ...restaurant, 'strawberry-jam', 'preserved-egg', 'carrot-pickles',
      ...TOOL_IDS.flatMap(id => [1,2,3,4,5].map(tier => `tool/${id}/tier-${tier}`)),
      ...HEIRLOOM_IDS.map(id => `heirloom/${id}`),
      ...['coop', 'board', 'dock', 'expeditions', 'town', 'boat'].map(id => 'building/' + id),
    ]
    const frames = authored.map(id => iconFrame(id))
    expect(frames.every(frame => frame?.sheet === 'farm-items')).toBe(true)
    expect(new Set(frames.map(frame => `${frame!.x},${frame!.y}`)).size).toBe(authored.length)
  })

  it('finds the 80 dishes on the dishes atlas', () => {
    for (const { dish } of RECIPES) {
      const frame = dishes.frames[dish as keyof typeof dishes.frames] as { x: number; y: number } | undefined
      expect(iconFrame(dish), dish).toEqual({ sheet: 'dishes', x: frame!.x, y: frame!.y })
    }
    expect(dishes.width).toBe(SHEET_SIZE.dishes.w)
    expect(dishes.height).toBe(SHEET_SIZE.dishes.h)
    expect(iconFrame('dish-wood-1')).toBeNull()
  })
})
