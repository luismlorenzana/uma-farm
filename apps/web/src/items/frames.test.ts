// Every farm item's icon sits where uma-art's published indexes put it (copied from uma-rpg's frames.test.ts at 30a322a,
// cut to the line and made items).
import gems from '@luismlorenzana/uma-art/gems/atlas.json'
import items from '@luismlorenzana/uma-art/items/atlas.json'
import { LINE_ITEMS, MADE_IDENTITIES } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { iconFrame, SHEET_SIZE } from './frames'

const itemFrame = (id: string) => items.frames[id as keyof typeof items.frames] as { x: number; y: number } | undefined
const gemFrame = (id: string) => gems.frames[id as keyof typeof gems.frames] as { x: number; y: number }

describe('icon frames', () => {
  it('finds the hundred line items at their own frames', () => {
    expect(LINE_ITEMS).toHaveLength(100)
    for (const m of LINE_ITEMS) {
      const frame = itemFrame(m.id)
      expect(frame, m.id).toBeDefined()
      expect(iconFrame(m.id), m.id).toEqual({ sheet: 'items', x: frame!.x, y: frame!.y })
    }
  })

  it('finds the made items: their own rows, Tome Ink on the infusions, the jewels on the gem sheet', () => {
    for (const made of MADE_IDENTITIES.filter((m) => !m.line.startsWith('jewel-') && m.line !== 'tome-ink')) {
      const frame = itemFrame(made.id)
      expect(frame, made.id).toBeDefined()
      expect(iconFrame(made.id), made.id).toEqual({ sheet: 'items', x: frame!.x, y: frame!.y })
    }
    // Tome Ink borrows the essences' refined row at its grade (row 19).
    for (const made of MADE_IDENTITIES.filter((m) => m.line === 'tome-ink')) expect(iconFrame(made.id)).toEqual({ sheet: 'items', x: (made.grade - 1) * 32, y: 19 * 32 })
    const jewelArt = {
      'jewel-planet-1': 'gem-sun-4', 'jewel-planet-2': 'gem-sun-4', 'jewel-planet-3': 'gem-sun-6', 'jewel-planet-4': 'gem-sun-8', 'jewel-planet-5': 'gem-sun-10',
      'jewel-moon-1': 'gem-limit-2', 'jewel-moon-2': 'gem-limit-4', 'jewel-moon-3': 'gem-limit-6', 'jewel-moon-4': 'gem-limit-8', 'jewel-moon-5': 'gem-limit-10',
    } as const
    for (const [id, art] of Object.entries(jewelArt)) expect(iconFrame(id), id).toEqual({ sheet: 'gems', x: gemFrame(art).x, y: gemFrame(art).y })
    expect(MADE_IDENTITIES).toHaveLength(50)
    expect([items, gems].map((a) => ({ w: a.width, h: a.height }))).toEqual([SHEET_SIZE.items, SHEET_SIZE.gems])
    expect(iconFrame('nothing-here')).toBeNull()
  })
})
