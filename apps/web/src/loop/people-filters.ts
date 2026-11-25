import { greaterLoveOf, TRUE_LOVE, type SaveV4 } from '@farm/domain'

export const PEOPLE_FILTERS = [
  { key: 'true-love', label: 'True Love', full: 'True Love' },
  { key: 'married', label: 'Married', full: 'Married' },
  { key: 'partners', label: 'Romance', full: 'Relationship' },
  { key: 'farmhands', label: 'Hands', full: 'Farmhands · Friendship 3–10' },
  { key: 'acquaintances', label: 'Met', full: 'Acquaintances · Friendship 0–2' },
] as const

export type PeopleFilter = typeof PEOPLE_FILTERS[number]['key']

/** The relationship chips are exclusive. Actual crew membership lives on the Work board. */
export function peopleFilters(save: Pick<SaveV4, 'love' | 'roster' | 'longGame'>, id: string): PeopleFilter[] {
  if (!save.roster[id]) return []
  const love = save.love[id]
  if (love?.stage === 'spouse') return [greaterLoveOf(save, id).points >= TRUE_LOVE ? 'true-love' : 'married']
  if (love?.stage === 'romance' || love?.stage === 'proposal' || love?.stage === 'wedding') return ['partners']
  if (love?.stage === 'confession' || (love?.level ?? 0) >= 3) return ['farmhands']
  return ['acquaintances']
}
