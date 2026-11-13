// Copied from uma-rpg packages/domain/src/roster/template.ts at 30a322a, with its Wilds-only parts cut.
// The calling rule (uma-templates §2.2; Classes v3), the one part of uma-rpg's Uma templates the Wilds read: her
// calling, from her best running styles alone, names her trade. Strides, knacks, families, the calling pick and the
// templates themselves stay behind with the classes.
import type { AptitudeGrade, Aptitudes } from '@luismlorenzana/uma-data'

/** A Tier 0 class (uma-rpg's `RpgTier0Class`): only the calling's name, never a class the farm fights as. */
export type UmaCallingClass = 'recruit' | 'duelist' | 'apprentice' | 'caller' | 'acolyte'

/** Classes v3's calling row: 1–5. */
export type UmaCallingRowV3 = 1 | 2 | 3 | 4 | 5

/** What the calling reads of an outfit: her running-style grades. */
export interface CallingOutfit { aptitudes: Pick<Aptitudes, 'strategy'> }

// The rule's orders: Front wins a best-style tie, then Pace owns any remaining tie; grades run best first.
const STYLES = ['front', 'pace', 'late', 'end'] as const
const GRADES: readonly AptitudeGrade[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
/** Classes v3's calling by row: her Tier 0. The manual prints them from H134. */
export const UMA_ROW_CALLING_V3: Readonly<Record<UmaCallingRowV3, UmaCallingClass>> = { 1: 'recruit', 2: 'duelist', 3: 'apprentice', 4: 'caller', 5: 'acolyte' }

const grade = (g: AptitudeGrade): number => GRADES.indexOf(g)
/** The best key of a group in the rule's order: the first at the best grade. */
function bestKey<K extends string>(grades: Readonly<Record<K, AptitudeGrade>>, order: readonly K[]): K {
  return order.reduce((top, k) => (grade(grades[k]) < grade(grades[top]) ? k : top))
}
/** The keys at a group's best grade, in the rule's order. */
function atBest<K extends string>(grades: Readonly<Record<K, AptitudeGrade>>, order: readonly K[]): K[] {
  const top = grade(grades[bestKey(grades, order)])
  return order.filter((k) => grade(grades[k]) === top)
}

/** Classes v3's calling row, the first that fits, from her best running styles alone (every style at her top grade;
 * no Power, Wit or distance): 1 Front among them; 2 Pace alone; 3 Pace with Late or End; 4 End among them (Late + End, or
 * End); 5 Late alone. */
export function umaCallingRowV3(outfit: { aptitudes: Pick<Aptitudes, 'strategy'> }): UmaCallingRowV3 {
  const styles = atBest(outfit.aptitudes.strategy, STYLES)
  if (styles.includes('front')) return 1
  if (styles.includes('pace')) return styles.length === 1 ? 2 : 3
  if (styles.includes('end')) return 4
  return 5
}

/** Her calling: her Tier 0 by Classes v3's row. */
export function umaCalling(outfit: CallingOutfit): UmaCallingClass {
  return UMA_ROW_CALLING_V3[umaCallingRowV3(outfit)]
}
