// Copied from uma-rpg packages/domain/src/roster/template-v19.test.ts at 30a322a, with its Wilds-only parts cut.
// Classes v3's calling (classes-v3.md §5): her Tier 0 from her best running styles alone, no pick. Invented
// outfits only: every grade here is made up.
import type { AptitudeGrade, Aptitudes } from '@luismlorenzana/uma-data'
import { describe, expect, it } from 'vitest'
import { UMA_ROW_CALLING_V3, umaCalling, umaCallingRowV3, type CallingOutfit, type UmaCallingClass } from './template'

type Style = keyof Aptitudes['strategy']
type Grades<K extends string> = Partial<Record<K, AptitudeGrade>>
/** An invented outfit; every running-style grade not given is B (below A). */
function uma(style: Grades<Style>): CallingOutfit {
  return { aptitudes: { strategy: { front: 'B', pace: 'B', late: 'B', end: 'B', ...style } } }
}
const best = (styles: readonly Style[]) => uma(Object.fromEntries(styles.map((s) => [s, 'A'])))

describe('the calling by running style (CV19, §5)', () => {
  it('reads §5.1\'s five rows, the first that fits', () => {
    expect([best(['front']), best(['pace']), best(['pace', 'late']), best(['end']), best(['late'])].map(umaCallingRowV3)).toEqual([1, 2, 3, 4, 5])
    expect(UMA_ROW_CALLING_V3).toEqual({ 1: 'recruit', 2: 'duelist', 3: 'apprentice', 4: 'caller', 5: 'acolyte' })
  })

  it('gives every combination of best styles §5.2\'s Tier 0', () => {
    const styles: readonly Style[] = ['front', 'pace', 'late', 'end']
    const subsets = Array.from({ length: 15 }, (_, i) => styles.filter((_, k) => (i + 1) & (1 << k)))
    const want = (set: readonly Style[]): UmaCallingClass => set.includes('front') ? 'recruit' : set.includes('pace') ? (set.length === 1 ? 'duelist' : 'apprentice')
      : set.includes('end') ? 'caller' : 'acolyte'
    for (const set of subsets) expect(umaCalling(best(set)), set.join(' + ')).toBe(want(set))
    // §5.2's rows by name.
    const table: [Style[], UmaCallingClass][] = [
      [['front'], 'recruit'], [['front', 'pace'], 'recruit'], [['front', 'late'], 'recruit'], [['front', 'end'], 'recruit'],
      [['front', 'pace', 'late', 'end'], 'recruit'], [['pace'], 'duelist'], [['pace', 'late'], 'apprentice'], [['pace', 'late', 'end'], 'apprentice'],
      [['pace', 'end'], 'apprentice'], [['late', 'end'], 'caller'], [['end'], 'caller'], [['late'], 'acolyte'],
    ]
    for (const [set, t0] of table) expect(umaCalling(best(set)), set.join(' + ')).toBe(t0)
    // A better grade wins: Late S over Front A is a pure Late.
    expect(umaCalling(uma({ front: 'A', late: 'S' }))).toBe('acolyte')
  })
})
