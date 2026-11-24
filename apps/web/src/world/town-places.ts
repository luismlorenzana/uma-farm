import { atHome, awayForNight, currentDatePeriod, townDay, type FarmSave, type StoryPack, type TownDay, type TownLocationPlayed } from '@farm/domain'
import { isRoom, type RoomId } from './room-specs'

const legacyRooms: Readonly<Record<string, RoomId>> = { bakery: 'laurel-bakery', salon: 'mejiro-salon', garage: 'espoir-garage' }

export function townRoom(place: TownLocationPlayed): RoomId | undefined {
  if (isRoom(place.id)) return place.id
  return legacyRooms[place.id] ?? (place.group === 'work' || place.group === 'shop' ? 'estate-office' : undefined)
}
/** Town jobs and routines come from the story schedule. Housed residents return to their farm rooms at night. */
export function currentTownDay(save: FarmSave, pack: StoryPack): TownDay {
  const day = townDay(save,pack)
  if (currentDatePeriod(save)) return day
  const where = new Map([...day.where].filter(([id]) => !atHome(save, id) && !awayForNight(save, id, save.calendar.day)))
  const by = new Map([...day.by].filter(([id]) => where.has(id)))
  const at = new Map([...day.at].map(([place,people]) => [place, people.filter(id => where.has(id))] as const))
  return { day:day.day, where, by, at }
}
