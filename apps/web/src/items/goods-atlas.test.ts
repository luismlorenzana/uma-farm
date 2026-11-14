// The goods are uma-art 2.21.0's own items: each id is on the items atlas with the family, grade and
// form `goods/ids.ts` gives it, so names and icons come from ids. The ranch's eggs and milk are the farm's own until
// uma-art draws them: not on the atlas yet.
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { EGGS_MILK, GOODS } from '@farm/domain'
import { describe, expect, it } from 'vitest'

type Frame = { family?: string; grade?: number; refined?: boolean }
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
  it('waits for the eggs and milk on the atlas', () => {
    for (const id of EGGS_MILK) expect(frameOf(id), id).toBeUndefined()
  })
})
