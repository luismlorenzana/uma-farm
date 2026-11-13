// The Diary's milestones and collection rows by id, and the Farm Rank's point values (F24 decisions 1–3; core spec
// CS38, CS39): what the save's parse and the morning's words read. Light on purpose: the rules that count and pay them
// (`diary.ts`) load with the night and the screens.
import { FISHING_SPOTS, FOREST_AREAS } from '../gathering/ids'
import { GOOD_FAMILIES, GOODS, RING_FAMILY, RING_IDS, type GoodFamily } from '../goods/ids'
import { RANKS, type Rank } from './ranks'

/** Farm Rank points: 1 per 100g shipped, 5 a Diary entry, 25 a milestone, 250 a chapter done. Festivals (150 /
 * 75 / 25) and decorations (1 per 100g) come with M6. */
export const GOLD_PER_POINT = 100
export const ENTRY_POINTS = 5
export const MILESTONE_POINTS = 25
export const CHAPTER_POINTS = 250

/** A milestone: what reaches it, and the gold it pays once. Each is worth `MILESTONE_POINTS`. */
export type Milestone =
  /** Gold shipped at the bin, all time (`farm.counts['gold-shipped']`). */
  | { readonly id: string; readonly kind: 'shipped'; readonly at: number; readonly gold: number }
  /** Umas on the roster, the starters included (decision 2). */
  | { readonly id: string; readonly kind: 'recruited'; readonly at: number; readonly gold: number }
  /** The first Uma to reach a rank, in any activity. */
  | { readonly id: string; readonly kind: 'rank'; readonly rank: Rank; readonly gold: number }
  /** The first haul from a forest area or a fishing spot past the first (decision 2: the Woods and the Pond pay none). */
  | { readonly id: string; readonly kind: 'depth'; readonly place: 'forest' | 'fishery'; readonly area: string; readonly gold: number }
  /** The first crop to reach a level. */
  | { readonly id: string; readonly kind: 'crop-level'; readonly level: number; readonly gold: number }

const DEPTH_GOLD = 500
const rankId = (rank: Rank): string => `rank:${RANKS[rank].toLowerCase()}`

/** M4's milestones in CS38's order. "Umas recruited" at 100 and 272, festivals won, Mine floors, an animal at 10 hearts
 * and a Masterwork wait for the packets that pay them. */
export const MILESTONES: readonly Milestone[] = [
  ...([[10_000, 300], [50_000, 1_000], [100_000, 2_000], [250_000, 4_000], [500_000, 8_000], [1_000_000, 15_000]] as const)
    .map(([at, gold]): Milestone => ({ id: `shipped:${at}`, kind: 'shipped', at, gold })),
  ...([[5, 300], [10, 1_000], [20, 2_500], [40, 6_000], [60, 10_000]] as const)
    .map(([at, gold]): Milestone => ({ id: `recruited:${at}`, kind: 'recruited', at, gold })),
  ...([[1, 300], [2, 600], [3, 900], [4, 1_200], [5, 1_500]] as const)
    .map(([rank, gold]): Milestone => ({ id: rankId(rank), kind: 'rank', rank, gold })),
  ...FOREST_AREAS.slice(1).map((area): Milestone => ({ id: `depth:${area}`, kind: 'depth', place: 'forest', area, gold: DEPTH_GOLD })),
  ...FISHING_SPOTS.slice(1).map((area): Milestone => ({ id: `depth:${area}`, kind: 'depth', place: 'fishery', area, gold: DEPTH_GOLD })),
  ...([5, 10] as const).map((level): Milestone => ({ id: `crop-level:${level}`, kind: 'crop-level', level, gold: 500 })),
]
const MILESTONE_BY_ID = new Map(MILESTONES.map((m) => [m.id, m]))
export const milestoneOf = (id: string): Milestone | undefined => MILESTONE_BY_ID.get(id)

/** A collection row: a family's ten raw goods, or its ten refined ones, each shipped once. It pays
 * `ROW_GOLD` once (and a decoration), and isn't a milestone: its goods are already entries. */
export interface DiaryRow {
  readonly id: string
  readonly family: GoodFamily
  readonly refined: boolean
  readonly goods: readonly string[]
}
export const ROW_GOLD = 500
/** The 26 rows: the fifteen families' raw goods, then the eleven families with refined forms. */
export const DIARY_ROWS: readonly DiaryRow[] = [false, true].flatMap((refined) => GOOD_FAMILIES.flatMap((family): DiaryRow[] => {
  const goods = GOODS.filter((g) => g.family === family && g.refined === refined).map((g) => g.id)
  return goods.length > 0 ? [{ id: `row:${family}${refined ? ':refined' : ''}`, family, refined, goods }] : []
}))
/** The rings' row: v4's catalogue only, its ten rings each shipped once. */
export const RING_ROW: DiaryRow = { id: `row:${RING_FAMILY}`, family: RING_FAMILY, refined: false, goods: RING_IDS }
/** v4's 27 rows: v3's 26, then the rings'. */
export const DIARY_ROWS_V4: readonly DiaryRow[] = [...DIARY_ROWS, RING_ROW]
/** The rows a save's version pays: v3's 26 (M4's, as live), or v4's 27. */
export const diaryRowsOf = (version: number): readonly DiaryRow[] => (version >= 4 ? DIARY_ROWS_V4 : DIARY_ROWS)
const ROW_BY_ID = new Map(DIARY_ROWS_V4.map((r) => [r.id, r]))
/** A row by its id, either version's (the morning's words read it). */
export const diaryRowOf = (id: string): DiaryRow | undefined => ROW_BY_ID.get(id)

/** What the Diary has paid (`diary.milestones`): a milestone or a row, of a save's version (the rings' row is v4's). */
export const isDiaryPaidId = (id: string, version = 3): boolean => MILESTONE_BY_ID.has(id) || diaryRowsOf(version).some((r) => r.id === id)
