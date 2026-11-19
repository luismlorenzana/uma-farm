// The goods as the loop's screens show them: the Warehouse by stars in its family tabs, the bin's
// lines and its night estimate, the shop's lines, and gold in words. Pure, so the screens and the tests read the same.
import {
  binSales, binTotal, easedPercent, easedPrice, easeOf, FAMILY_NAMES, GOOD_IDS, goodName, goodOf, hasPrice, inDemand, isDishId, lineOpen, refinedOf, restaurantGrade, RING_IDS, SEED_IDS, STARS,
  type BinSale, type Good, type Market,
  type GoodFamily, type FarmSave, type ShopLine, type StarCounts,
} from '@farm/domain'
import { opensWords } from './farm-map'

/** "1,240g". */
export const goldWords = (gold: number): string => `${gold.toLocaleString('en-US')}g`
/** "★2". */
export const starWords = (stars: number): string => `★${stars}`

/** The Warehouse's tabs: the crops, the forest's six families, fish, mining and seeds; the expeditions' loot
 * only when the Warehouse holds some (none can be had yet); the rings and dishes (the bench's, the reception's, the
 * Kitchen's) likewise. */
export const SHELVES = ['crops', 'woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets', 'ranch', 'fish', 'mining', 'seeds', 'loot', 'rings', 'dishes'] as const
export type Shelf = typeof SHELVES[number]
const SHELF_NAMES: Readonly<Record<Shelf, string>> = {
  crops: 'Crops', woods: 'Woods', mushrooms: 'Mushrooms', 'herbs-spices': 'Herbs and spices', fruits: 'Fruits', 'nuts-seeds': 'Nuts and seeds',
  sweets: 'Sweets', ranch: 'Ranch', fish: 'Fish', mining: 'Mining', seeds: 'Seeds', loot: 'Loot', rings: 'Rings', dishes: 'Dishes',
}
/** The tabs shown only while something is on them. */
const WHEN_HELD: ReadonlySet<Shelf> = new Set(['loot', 'rings', 'dishes'])
const MINING: ReadonlySet<GoodFamily> = new Set(['ores', 'stones', 'crystals'])
const LOOT: ReadonlySet<GoodFamily> = new Set(['hides-scales', 'bones-horns', 'essences'])
/** The catalogue's order, then the seeds' and the rings'. */
const ORDER = new Map([...GOOD_IDS, ...SEED_IDS, ...RING_IDS].map((id, i) => [id, i]))
const orderOf = (id: string): number => ORDER.get(id) ?? Infinity

/** A good's tab: the 27 crops and the flours on Crops (Farming), the rest by family. */
export function shelfOf(good: Pick<Good, 'family' | 'crop'>): Shelf {
  if (good.family === 'fruits') return 'fruits'
  if (good.crop || good.family === 'grains' || good.family === 'vegetables') return 'crops'
  if (good.family === 'eggs-milk' || good.family === 'fibers') return 'ranch'
  if (MINING.has(good.family)) return 'mining'
  if (LOOT.has(good.family)) return 'loot'
  if (good.family === 'rings') return 'rings'
  return good.family as Shelf
}

/** One star of a held good: how many, and what one sells for today (null for a seed). */
export interface StarCell {
  stars: number
  count: number
  price: number | null
}

/** A row in the Warehouse: a good (or seed) with its five star counts and prices, and its facts for the sheet. */
export interface GoodRow {
  id: string
  name: string
  shelf: Shelf
  total: number
  cells: StarCell[]
  demand: boolean
  /** "Fish · G5 · raw", or a seed's line. */
  facts: string
  /** "Refines into Salmon Fillet", "Refined from Salmon", or null. */
  pair: string | null
  /** Whether the bin takes it (seeds don't). */
  sells: boolean
  /** Everything held, at today's prices. */
  worth: number
  /** A flood's ease on its price today, in percent (10–50); 0 when it isn't eased. */
  eased: number
}

export interface WarehouseTab {
  shelf: Shelf
  label: string
  count: number
  rows: GoodRow[]
}

/** A good's facts: its family, grade and form. */
export const goodFacts = (good: Good): string => `${FAMILY_NAMES[good.family]} · G${good.grade} · ${good.family === 'rings' ? 'made at the ring bench' : good.refined ? 'refined' : 'raw'}`

/** What a good refines into, or what it's refined from. */
export function goodPair(good: Good): string | null {
  if (good.input) return `Refined from ${goodName(good.input)}`
  const into = refinedOf(good.id)
  return into ? `Refines into ${goodName(into)}` : null
}

/** A held good's (or seed's) row on `day`, its prices at the market's ease (a flood's: `goods/market.ts`). Its worth is
 * what shipping it all tonight would pay, past a crate's ease and all. */
export function goodRow(id: string, row: StarCounts, day: number, market: Market = {}): GoodRow {
  const good = goodOf(id)
  const steps = easeOf(market, id)
  const sells = hasPrice(id)
  const cells = STARS.map((stars): StarCell => ({ stars, count: row[stars - 1] ?? 0, price: sells ? easedPrice(id, stars, day, steps) : null }))
  const dish = !good && isDishId(id)
  const grade = restaurantGrade(id)
  return {
    id, name: goodName(id), shelf: good ? shelfOf(good) : dish ? 'dishes' : 'seeds', total: row.reduce((a, b) => a + b, 0), cells,
    demand: sells && inDemand(id, day), facts: good ? goodFacts(good) : grade ? `Restaurant dish · G${grade}` : dish ? 'Kitchen dish · Meals and service' : 'Seeds: they don’t sell', pair: good ? goodPair(good) : null,
    sells, worth: sells ? binTotal({ [id]: row }, day, market) : 0, eased: sells ? easedPercent(steps) : 0,
  }
}

/** The Warehouse by stars: each tab's held goods in the catalogue's order; the loot tab only when held. */
export function warehouseTabs(save: Pick<FarmSave, 'items' | 'calendar'> & Partial<Pick<FarmSave, 'farm'>>): WarehouseTab[] {
  const rows = Object.entries(save.items)
    .filter(([, row]) => row.some((n) => n > 0))
    .sort(([a], [b]) => orderOf(a) - orderOf(b))
    .map(([id, row]) => goodRow(id, row, save.calendar.day, save.farm?.market))
  return SHELVES.map((shelf) => {
    const on = rows.filter((row) => row.shelf === shelf)
    return { shelf, label: SHELF_NAMES[shelf], count: on.reduce((n, row) => n + row.total, 0), rows: on }
  }).filter((tab) => !WHEN_HELD.has(tab.shelf) || tab.rows.length > 0)
}

/** The tab the Warehouse opens on: the first holding something that sells in pick mode, else the first holding anything. */
export function firstTab(tabs: readonly WarehouseTab[], picking: boolean): Shelf {
  const held = tabs.filter((tab) => tab.rows.some((row) => !picking || row.sells))
  return (held[0] ?? tabs[0])?.shelf ?? 'crops'
}

/** The bin's sheet: today's lines, their gold, and the night's estimate. */
export interface BinView {
  lines: (BinSale & { name: string })[]
  total: number
}

/** The bin's sheet, at the market's ease: a good eased by a flood sells at its ease, and past a crate of it each crate
 * more a step lower (each line's `eased`). */
export function binView(save: Pick<FarmSave, 'bin' | 'calendar'> & Partial<Pick<FarmSave, 'farm'>>): BinView {
  const market = save.farm?.market ?? {}
  return {
    lines: binSales(save.bin, save.calendar.day, market).map((sale) => ({ ...sale, name: goodName(sale.id) })),
    total: binTotal(save.bin, save.calendar.day, market),
  }
}

/** A flood's ease in words: "Eased −20%". */
export const easedWords = (percent: number): string => `Eased −${percent}%`

/** "Carrot ★2 × 3". */
export const saleWords = (sale: Pick<BinSale, 'id' | 'stars' | 'count'>): string => `${goodName(sale.id)} ${starWords(sale.stars)} × ${sale.count}`

/** A shop line as its row shows it: the name, the price each, and the gate's words while it's shut. */
export interface ShopRow {
  line: ShopLine
  name: string
  /** "From Farm Rank 2", or null once it's open. */
  gate: string | null
}

export function shopRows(save: Pick<FarmSave, 'farm'>, lines: readonly ShopLine[]): ShopRow[] {
  return lines.map((line) => ({ line, name: goodName(line.id), gate: lineOpen(save, line) ? null : `From ${opensWords(line.opens)}` }))
}
