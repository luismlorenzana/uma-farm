// The ring bench as its sheet shows it: one row a grade you can make now, each with the three goods it would take
// (the lowest-value refined goods of that grade, any family, any mix) and the ring it makes; a tap on one of the three
// offers the grade's other goods held; the ring's own recipe (2 ingots + 1 cut gem) greyed until the Smelter and the Cutter stand; her bonus
// once married; and the one button, "Make an Iron Ring · 1 a day". Pure, so the sheet and the tests read the same.
// Every word says "you". Loaded on demand with the sheet.
import {
  benchGrades, benchPick, benchStock, forgeRecipe, goodName, MAKE_BONUS, miningOpen, ringId, ringName, ringPercent, type BenchInput, type BenchStock, type SaveV4,
} from '@farm/domain'

/** The sheet's fixed words. */
export const BENCH_TEXT = {
  title: 'The Forge · ring bench',
  rule: 'A ring of grade g: 3 refined goods of grade g, any family',
  bonus: `Her bonus once married: +${ringPercent(1)}% a grade`,
  merge: `(Soon, the Forge’s merge game: +${MAKE_BONUS.fine} / +${MAKE_BONUS.great} / +${MAKE_BONUS.masterwork} more for a Fine, Great or Masterwork ring)`,
  none: 'Nothing to make yet. Three refined goods of one grade make a ring: planks from the Sawmill, fillets from the Smokehouse, flour from the Mill.',
  made: 'One ring a day. Come back tomorrow.',
  help: [
    'The town’s smith opened the old Forge as a ring bench: three refined goods of one grade make a ring of that grade. No gold, one ring a day.',
    'Any ring makes the proposal Ready once she’s at Romance 10. Once she’s your spouse, her ring adds +1% at her line a grade.',
    'Give her a better ring from her profile any day: she keeps the best, and the old one comes back to the Warehouse.',
  ],
} as const

/** "an Iron Ring", "a Copper Ring". */
export const withArticle = (name: string): string => `${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}`
/** The button: "Make an Iron Ring · 1 a day". */
export const makeWords = (grade: number): string => `Make ${withArticle(ringName(grade))} · 1 a day`
/** The ring's own recipe line: greyed until the Smelter and the Cutter stand, the grade's own pair after. */
export function forgeRecipeWords(save: Pick<SaveV4, 'buildings'>): { text: string; open: boolean } {
  return miningOpen(save)
    ? { text: 'Or use the ring’s own recipe: 2 ingots + 1 cut gem of its grade', open: true }
    : { text: '2 ingots + 1 cut gem · Opens when the Smelter and the Cutter are built', open: false }
}
/** A grade's own recipe in words: "2 Iron Ingot + 1 Cut Citrine". */
export const forgePairWords = (grade: number): string => {
  const r = forgeRecipe(grade)
  return `2 ${goodName(r.ingot)} + 1 ${goodName(r.gem)}`
}

/** One grade's row: its three, the ring and what it's worth to her once married. */
export interface BenchRow {
  grade: number
  ring: string
  name: string
  pick: BenchInput[]
  /** "+3% once married". */
  bonus: string
}

/** The rows: every grade you can make now, lowest first, each with its three (yours where you've swapped one, else the
 * cheapest). */
export function benchRows(save: SaveV4, swapped: Readonly<Record<number, readonly BenchInput[]>> = {}): BenchRow[] {
  return benchGrades(save).map((grade) => ({
    grade, ring: ringId(grade), name: ringName(grade), pick: [...(swapped[grade] ?? benchPick(save, grade)!)], bonus: `+${ringPercent(grade)}% once married`,
  }))
}

/** What one slot of a row may hold instead (a tap swaps it): the grade's goods held, each at its stars, with how many are
 * left once the other two slots take theirs. */
export function swapOptions(save: SaveV4, grade: number, pick: readonly BenchInput[], slot: number): (BenchStock & { left: number })[] {
  const others = pick.filter((_, i) => i !== slot)
  return benchStock(save, grade).map((s) => ({ ...s, left: s.count - others.filter((o) => o.id === s.id && o.stars === s.stars).length })).filter((s) => s.left > 0)
}

/** The three in words: "Cedar Plank ×3" or "Cedar Plank ×2 · Pearl Barley". */
export function pickWords(pick: readonly BenchInput[]): string {
  const counts = new Map<string, number>()
  for (const p of pick) counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
  return [...counts].map(([id, n]) => `${goodName(id)}${n > 1 ? ` ×${n}` : ''}`).join(' · ')
}
