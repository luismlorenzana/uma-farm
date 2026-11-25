import type { SaveV4 } from '@farm/domain'

export const PEOPLE_FILTERS = [
  { key: 'married', label: 'Married', full: 'Married' },
  { key: 'partners', label: 'Romance', full: 'Relationship' },
  { key: 'farmhands', label: 'Hands', full: 'Farmhands' },
  { key: 'acquaintances', label: 'Met', full: 'Acquaintances' },
] as const

export type PeopleFilter = typeof PEOPLE_FILTERS[number]['key']

/** Farmhand membership is independent of romance and stays with her after marriage. */
export function peopleFilters(save: Pick<SaveV4, 'love' | 'roster'>, id: string): PeopleFilter[] {
  const uma = save.roster[id]
  if (!uma) return []
  const stage = save.love[id]?.stage ?? 'friendship'
  const filters: PeopleFilter[] = []
  if (stage === 'spouse') filters.push('married')
  if (stage === 'romance' || stage === 'proposal' || stage === 'wedding') filters.push('partners')
  if (uma.farmhand !== undefined) filters.push('farmhands')
  else if (stage === 'friendship' || stage === 'confession') filters.push('acquaintances')
  return filters
}
