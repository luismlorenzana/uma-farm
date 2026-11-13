// The ring bench: the proposal needs a ring, and the Forge's
// merge game is M6's, so on save v4 the Forge's building opens early as a bench with no game. The night after the first
// Romance 8 event anyone plays, step 8 sets `buildings.forge = 0` (D30: the building held, its fire not lit) and Ida
// Stone's scene comes up the next morning (`story/bench.ts`); chapter 7 still lights the fire.
//
//   a ring of grade g  =  3 refined goods of grade g, any family, any mix (planks, fillets, flours, preserves, dried goods;
//                         the mining families' ingots, blocks and cut gems from chapter 3, which is CS25's own recipe)
//   no gold, no game, no assistant, no score: a Rough make, ★1 in the Warehouse; one ring a day (`today.ring`)
//
// Worked: 3 Cedar Planks (G3, 60g each) make an Iron Ring (`ring-g3`, 340g); 3 Salmon Fillets (G5) a Cobalt Ring. Her
// ring's bonus once married is its grade in % at her line (+1% a grade, inside her own cap); a better ring may be
// given any day from the proposal on, the old one back in the Warehouse. Pure; v3's Forge is untouched (`benchOpen` is v4's
// only). Loaded with the bench's sheet, the night and the events.
import { goodOf, GOODS, isRingId, ringGrade, ringId, RING_IDS, type GoodFamily } from '../goods/ids'
import { starPrice } from '../goods/prices'
import { SaveRuleError } from '../save/rules'
import type { FarmSave, SaveV4 } from '../save/v4'
import { addGoods, goodCount, takeGoods } from '../save/warehouse'
import type { Warehouse } from '../save/v3'

// --- The bench's state -----------------------------------------------------------------------------------

/** Whether the Forge stands as the ring bench: a v4 farm with `buildings.forge` set. Never on v3. */
export const benchOpen = (save: Pick<FarmSave, 'version' | 'buildings'>): boolean => save.version === 4 && save.buildings.forge !== undefined
/** The rung whose first event anywhere opens the bench. */
export const BENCH_RUNG = 'r8'
/** Whether the bench opens tonight: not standing yet, and an Uma's Romance 8 is in her Memories. */
export const benchDue = (save: Pick<SaveV4, 'buildings' | 'memories'>): boolean =>
  save.buildings.forge === undefined && Object.values(save.memories).some((played) => played.includes(BENCH_RUNG))
/** Night step 8: the bench stands, `buildings.forge = 0`, once. */
export const openBench = (save: SaveV4): SaveV4 => (benchDue(save) ? { ...save, buildings: { ...save.buildings, forge: 0 } } : save)

// --- The recipe ------------------------------------------------------------------------------------

/** A ring takes three refined goods of its grade. */
export const RING_INPUTS = 3
/** The mining families' refined goods (ingots, stone blocks, cut gems) count from chapter 3, when their places open. */
export const MINING_FAMILIES: readonly GoodFamily[] = ['ores', 'stones', 'crystals']
export const MINING_CHAPTER = 3

/** CS25's own recipe for a grade: 2 of its ingot and 1 of its cut gem, from chapter 3. */
export function forgeRecipe(grade: number): { ingot: string; gem: string } {
  const of = (family: GoodFamily) => GOODS.find((g) => g.family === family && g.refined && g.grade === grade)!.id
  return { ingot: of('ores'), gem: of('crystals') }
}

/** Whether the bench takes a good at the farm's chapter: any refined good, the mining families' from chapter 3. */
export function benchTakes(chapter: number, id: string): boolean {
  const good = goodOf(id)
  return !!good && good.refined && (chapter >= MINING_CHAPTER || !MINING_FAMILIES.includes(good.family))
}

/** One of the three: a good at its stars. */
export interface BenchInput { id: string; stars: number }
/** A held good the bench takes, at one star: how many, and what one is worth at the bin out of demand. */
export interface BenchStock extends BenchInput { count: number; value: number }

const CATALOGUE = new Map(GOODS.map((g, i) => [g.id, i]))

/** The held goods a grade's ring could take: the lowest value first (★1 price × the star's factor), then
 * fewer stars, then the catalogue's order. */
export function benchStock(save: Pick<SaveV4, 'items' | 'farm'>, grade: number): BenchStock[] {
  return Object.entries(save.items).flatMap(([id, row]) => (benchTakes(save.farm.chapter, id) && goodOf(id)!.grade === grade
    ? row.flatMap((count, i): BenchStock[] => (count > 0 ? [{ id, stars: i + 1, count, value: starPrice(id, i + 1) }] : []))
    : [])).sort((a, b) => a.value - b.value || a.stars - b.stars || (CATALOGUE.get(a.id) ?? 0) - (CATALOGUE.get(b.id) ?? 0))
}

/** The three a grade's ring would take now: the lowest-value goods first, any family, any mix; null when
 * fewer than three are held. */
export function benchPick(save: Pick<SaveV4, 'items' | 'farm'>, grade: number): BenchInput[] | null {
  const pick: BenchInput[] = []
  for (const s of benchStock(save, grade)) for (let n = 0; n < s.count && pick.length < RING_INPUTS; n++) pick.push({ id: s.id, stars: s.stars })
  return pick.length === RING_INPUTS ? pick : null
}

/** The grades whose ring you can make now, lowest first (the sheet's rows). */
export const benchGrades = (save: Pick<SaveV4, 'items' | 'farm'>): number[] => RING_IDS.map((_, i) => i + 1).filter((g) => benchPick(save, g) !== null)

/** The bench's refusals, in the player's words. */
export const BENCH_WORDS = {
  closed: 'The ring bench opens with your first Romance 8.',
  three: 'Three refined goods of one grade.',
  mining: 'Ingots, blocks and cut gems open with chapter 3.',
  today: 'One ring a day.',
  short: 'Not enough in the Warehouse.',
} as const

/** Why three goods can't make a ring now, or null. */
export function benchRefusal(save: SaveV4, inputs: readonly BenchInput[]): string | null {
  if (!benchOpen(save)) return BENCH_WORDS.closed
  if (save.today.ring > 0) return BENCH_WORDS.today
  const goods = inputs.map((i) => goodOf(i.id))
  if (inputs.length !== RING_INPUTS || goods.some((g) => !g || !g.refined) || new Set(goods.map((g) => g?.grade)).size !== 1) return BENCH_WORDS.three
  if (inputs.some((i) => !benchTakes(save.farm.chapter, i.id))) return BENCH_WORDS.mining
  const need = new Map<string, number>()
  for (const i of inputs) need.set(`${i.id}@${i.stars}`, (need.get(`${i.id}@${i.stars}`) ?? 0) + 1)
  for (const [key, n] of need) {
    const [id, stars] = key.split('@') as [string, string]
    if ((save.items[id]?.[Number(stars) - 1] ?? 0) < n) return BENCH_WORDS.short
  }
  return null
}

/**
 * Makes a ring at the bench: the three goods leave the Warehouse, a ring of their grade comes in at ★1 (a
 * Rough make) and `today.ring` holds its grade. No gold moves. Refused with the bench's words. Pure; never stamps.
 */
export function makeRing(save: SaveV4, inputs: readonly BenchInput[]): { save: SaveV4; ring: string } {
  const refusal = benchRefusal(save, inputs)
  if (refusal) throw new SaveRuleError(refusal === BENCH_WORDS.short ? 'no-items' : refusal === BENCH_WORDS.today ? 'busy' : 'locked', refusal)
  const grade = goodOf(inputs[0]!.id)!.grade
  const ring = ringId(grade)
  const taken = inputs.reduce((items, i) => takeGoods(items, i.id, i.stars, 1), save.items)
  return { save: { ...save, items: addGoods(taken, ring, 1, 1), today: { ...save.today, ring: grade } }, ring }
}

// --- Her ring --------------------------------------------------------------------------------------

/** Her ring's bonus once married, a grade's worth: +1% a grade, every ring a Rough make until M6. */
export const RING_PERCENT_A_GRADE = 1
/** M6's merge game adds this for a Fine, Great or Masterwork make: the bench's sheet says it. */
export const MAKE_BONUS = { rough: 0, fine: 1, great: 3, masterwork: 5 } as const
/** A ring's bonus in % (a Rough make). */
export const ringPercent = (grade: number): number => grade * RING_PERCENT_A_GRADE

/** The rings in the Warehouse, best grade first: the proposal's picker, the best preselected. */
export const heldRings = (save: Pick<SaveV4, 'items'>): string[] => [...RING_IDS].reverse().filter((id) => goodCount(save.items, id) > 0)

/** The rings she'd take over hers: any held of a higher grade, best first; none before the proposal. */
export function betterRings(save: Pick<SaveV4, 'items' | 'love'>, id: string): string[] {
  const ring = save.love[id]?.ring
  return ring === undefined ? [] : heldRings(save).filter((r) => ringGrade(r) > ring)
}

/** One of a good, its lowest stars first; refused when none is held. */
export function takeOne(items: Warehouse, id: string): Warehouse {
  const stars = (items[id] ?? []).findIndex((n) => n > 0) + 1
  if (stars === 0) throw new SaveRuleError('no-items', BENCH_WORDS.short)
  return takeGoods(items, id, stars, 1)
}

/**
 * A better ring: from the proposal on, any ring of a higher grade than hers. The new one leaves the
 * Warehouse (lowest stars first), her old one (`ring-g<old>`, ★1) comes back, and `love.ring` is the new grade, so her
 * bonus rises once she's married. Refused before the proposal and for a ring no better than hers. Pure; never stamps.
 */
export function giveRing(save: SaveV4, id: string, ring: string): SaveV4 {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (love.ring === undefined) throw new SaveRuleError('locked', 'Her ring comes with the proposal.')
  if (!isRingId(ring) || ringGrade(ring) <= love.ring) throw new SaveRuleError('bad-job', 'A better ring: a higher grade than hers.')
  const items = addGoods(takeOne(save.items, ring), ringId(love.ring), 1, 1)
  return { ...save, items, love: { ...save.love, [id]: { ...love, ring: ringGrade(ring) } } }
}
