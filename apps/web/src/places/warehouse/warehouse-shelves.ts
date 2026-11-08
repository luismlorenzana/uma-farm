// Copied from uma-rpg apps/web/src/places/warehouse/warehouse-shelves.ts at 30a322a (F5, FM2): the Warehouse's shelves as
// data. Every held line item and made item as a compact icon-grid entry, line by line, each with its grade. Selling stays
// behind (FM4), and so does the Branch Gem.
import type { ShelfItem } from '@luismlorenzana/uma-kit/places'
import { LINE_ITEMS, lineItem, MADE_IDENTITIES, MATERIAL_LINES, stockName, type FarmWorld } from '@farm/domain'
import { LINE_WORD, madeFacts, materialFacts } from '../../items/words'

/** A stack on a shelf: `line` is its sheet's line ("Metal · G3 · raw"). */
export interface Stock extends ShelfItem { line: string | null }

export interface WarehouseView { shelves: readonly { key: string; label: string }[]; items: Stock[]; header: string }

/** The order: each line raw G1–G10 then refined G1–G10; made items Arms Gems, Tome Ink, Armor Fittings, Accessory Settings,
 * Planet and Moon Jewels. */
const LINE_ORDER: readonly string[] = LINE_ITEMS.map((m) => m.id)
const MADE_ORDER: readonly string[] = (['weapon-gem', 'tome-ink', 'armor-fittings', 'accessory-setting', 'jewel-planet', 'jewel-moon'] as const)
  .flatMap((line) => MADE_IDENTITIES.filter((m) => m.line === line).map((m) => m.id))
const MADE_GRADE = new Map(MADE_IDENTITIES.map((m) => [m.id, m]))

const n = (count: number) => count.toLocaleString('en-US')

/** The Warehouse's seven shelves: All, the five lines and Made items. Every held stack also sits on All. */
export function warehouseView(world: Pick<FarmWorld, 'items'>): WarehouseView {
  const held = (ids: readonly string[]) => ids.filter((id) => (world.items[id] ?? 0) > 0)
  const materials: Stock[] = held(LINE_ORDER).map((id) => {
    // A material has a grade, so the kit's grade chips filter its shelf too.
    const material = lineItem(id)!
    return {
      id, shelf: material.line, name: stockName(id), grade: material.grade, count: world.items[id]!,
      line: materialFacts(id), group: `${material.line}-${material.refined ? 'refined' : 'raw'}`,
    }
  })
  const made: Stock[] = held(MADE_ORDER).map((id) => ({
    id, shelf: 'made', name: stockName(id), grade: MADE_GRADE.get(id)!.grade, count: world.items[id]!,
    line: madeFacts(id), group: MADE_GRADE.get(id)!.line,
  }))
  const total = (rows: readonly Stock[]) => n(rows.reduce((a, i) => a + i.count, 0))
  const all = [...materials, ...made].map((item) => ({ ...item, shelf: 'all' }))
  return {
    shelves: [
      { key: 'all', label: 'All' }, ...MATERIAL_LINES.map((line) => ({ key: line, label: LINE_WORD[line] })),
      { key: 'made', label: 'Made items' },
    ],
    items: [...all, ...materials, ...made], header: `${total(materials)} materials · ${total(made)} made items`,
  }
}
