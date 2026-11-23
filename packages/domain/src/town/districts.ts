import { storyLocationsOf } from '../story/placeholders'
import type { StoryPack } from '../story/pack'

export const HARBOUR_INN = 'harbour-inn'

export const TOWN_DISTRICTS = [
  { id: 'plaza', label: 'Plaza', places: ['plaza', 'mayor', 'estate-office', 'little-studio'] },
  { id: 'market', label: 'Market', places: ['market', 'store', 'laurel-bakery', 'mejiro-salon'] },
  { id: 'library', label: 'Library & Café', places: ['library', 'cafe'] },
  { id: 'harbour', label: 'Harbour', places: ['harbour', HARBOUR_INN] },
  { id: 'workshop', label: 'Smithy & Ranch', places: ['smith', 'espoir-garage', 'rancher'] },
  { id: 'hilltop', label: 'Hilltop', places: ['track', 'expeditions'] },
] as const

export type TownDistrict = typeof TOWN_DISTRICTS[number]
export const districtOf = (id: string): TownDistrict | undefined =>
  TOWN_DISTRICTS.find(district => (district.places as readonly string[]).includes(id))

export const DISTRICT_LOCATIONS = [
  { id: 'estate-office', name: 'The Estate Office', line: 'Plans and materials for farm projects.' },
  { id: 'little-studio', name: 'The Little Studio', line: 'The town’s exhibition of farm and festival milestones.' },
  { id: 'laurel-bakery', name: 'The Little Bakery', line: 'Recipes, bread and flour orders.' },
  { id: 'mejiro-salon', name: 'The Salon', line: 'Outfits and the milestones that unlock them.' },
  { id: 'espoir-garage', name: 'The Garage', line: 'The farm’s shared tools and charges.' },
  { id: HARBOUR_INN, name: 'The Harbour Inn', line: 'Town residents, meals and provisions.' },
  { id: 'expeditions', name: 'Expedition post', line: 'Party planning and dispatch. Opens at Farm Rank 7.' },
] as const

type LocationPack = Partial<Pick<StoryPack, 'town'>>

/** Preserve original story settings. Arrival links and ordinary home stops share the Inn. */
export function publicTownPlace(pack: LocationPack, id: string): string {
  return storyLocationsOf(pack).some(place => place.id === id && place.kind === 'home') ? HARBOUR_INN : id
}

const counters: Readonly<Record<string, string>> = {
  baker: 'laurel-bakery',
  tailor: 'mejiro-salon',
  innkeeper: HARBOUR_INN,
}

export const professionCounter = (job: { id: string; at: string }): string => counters[job.id] ?? job.at
