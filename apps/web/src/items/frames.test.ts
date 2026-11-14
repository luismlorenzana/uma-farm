// Every farm item's icon sits where uma-art's published index puts it (copied from uma-rpg's frames.test.ts at 30a322a,
// cut to the goods and seeds).
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { GOODS } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { iconFrame, SHEET_SIZE } from './frames'

const itemFrame = (id: string) => items.frames[id as keyof typeof items.frames] as { x: number; y: number } | undefined

describe('icon frames', () => {
  it('finds the goods at their own frames (the eggs and milk drawn in code), and a seed at its crop\'s', () => {
    for (const good of GOODS.filter((g) => g.family !== 'eggs-milk')) {
      const frame = itemFrame(good.id)
      expect(iconFrame(good.id), good.id).toEqual({ sheet: 'items', x: frame!.x, y: frame!.y })
    }
    expect(iconFrame('seed-carrot')).toEqual(iconFrame('carrot'))
    expect(iconFrame('seed-wild-rice-own')).toEqual(iconFrame('wild-rice'))
    expect(items.width).toBe(SHEET_SIZE.items.w)
    expect(items.height).toBe(SHEET_SIZE.items.h)
    expect(iconFrame('nothing-here')).toBeNull()
    expect(iconFrame('egg')).toBeNull()
  })
})
