// The goods are uma-art's own items: each id is on the items atlas with the family, grade and form `goods/ids.ts` gives
// it, so names and icons come from ids. The ranch's eggs and milk came with uma-art 2.30.0: kind `ranch`, line
// `eggs-milk`, by grade, with no family or form of their own.
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { EGGS_MILK, GOODS } from '@farm/domain'
import { describe, expect, it } from 'vitest'

type Frame = { family?: string; grade?: number; refined?: boolean; kind?: string; line?: string }
const frameOf = (id: string) => (items.frames as Record<string, Frame>)[id]

describe('the goods on the atlas', () => {
  it('finds all 280 of uma-art\'s at their family, grade and form, and none of the farm\'s own eggs and milk', () => {
    expect(GOODS).toHaveLength(284)
    for (const good of GOODS.filter((g) => !(EGGS_MILK as readonly string[]).includes(g.id))) {
      const frame = frameOf(good.id)
      expect(frame, good.id).toBeDefined()
      expect({ family: frame!.family, grade: frame!.grade, refined: frame!.refined }, good.id).toEqual({ family: good.family, grade: good.grade, refined: good.refined })
    }
  })
  it('finds the ranch\'s eggs and milk by their line and grade', () => {
    for (const id of EGGS_MILK) {
      const good = GOODS.find((g) => g.id === id)!
      expect(frameOf(id), id).toMatchObject({ kind: 'ranch', line: good.family, grade: good.grade })
      expect(good.refined).toBe(false)
    }
  })
})
