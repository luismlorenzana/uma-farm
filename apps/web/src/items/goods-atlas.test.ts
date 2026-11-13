// The goods are uma-art 2.21.0's own items: each id is on the items atlas with the family, grade and
// form `goods/ids.ts` gives it, so names and icons come from ids.
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { GOODS } from '@farm/domain'
import { describe, expect, it } from 'vitest'

type Frame = { family?: string; grade?: number; refined?: boolean }
const frameOf = (id: string) => (items.frames as Record<string, Frame>)[id]

describe('the goods on the atlas', () => {
  it('finds all 260 at their family, grade and form', () => {
    expect(GOODS).toHaveLength(260)
    for (const good of GOODS) {
      const frame = frameOf(good.id)
      expect(frame, good.id).toBeDefined()
      expect({ family: frame!.family, grade: frame!.grade, refined: frame!.refined }, good.id).toEqual({ family: good.family, grade: good.grade, refined: good.refined })
    }
  })
})
