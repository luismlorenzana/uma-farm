import { EXPEDITION_REGIONS, type Expedition } from '@farm/domain'
import { shortDate } from './words'

export const EXPEDITION_POST = '/town?at=expeditions&sheet=expeditions'
export const awayWords = (trip: Expedition): string =>
  `Away · ${EXPEDITION_REGIONS[trip.region].name} · back ${shortDate(trip.back)}`
