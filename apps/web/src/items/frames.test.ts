// Every farm item's icon sits where uma-art's published index puts it (copied from uma-rpg's frames.test.ts at 30a322a,
// cut to the goods and seeds).
import dishes from '@luismlorenzana/uma-art/dishes/atlas.json'
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { GOODS, RECIPES } from '@farm/domain'
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
    expect(iconFrame('seed-wild-rice-own')).toEqual(iconFrame('wild-rice'))
    expect(items.width).toBe(SHEET_SIZE.items.w)
    expect(items.height).toBe(SHEET_SIZE.items.h)
    expect(iconFrame('nothing-here')).toBeNull()
    expect(['egg', 'milk', 'duck-egg', 'goat-milk'].map((id) => iconFrame(id))).toEqual([0, 32, 64, 96].map((x) => ({ sheet: 'items', x, y: 1216 })))
    expect(Object.keys(items.frames)).toHaveLength(366)
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
