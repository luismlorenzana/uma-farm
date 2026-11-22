import type { FarmSave } from '../save/v4'
import { onDuty } from '../town/professions'
import { isCastId } from './cast'
import type { StoryPack } from './pack'
import { speakerId } from './placeholders'

type TownStory = Pick<StoryPack, 'cast' | 'town' | 'master'>
type Presence = Pick<FarmSave, 'calendar' | 'expeditions'>

/** Resolve the old town cast at the point of playback. Save-backed cast members keep their own speech. */
export function sceneSpeaker(pack: TownStory, save: Presence, who: string, leads: readonly string[] = []): string | null {
  if (!pack.town?.professions?.length) return speakerId(pack, who)
  if (pack.cast.umas.some(uma => uma.characterId === who)) return who
  const legacy = pack.town.people?.find(person => person.characterId === who)
  if (!legacy && !isCastId(who)) return who
  const role = legacy ? legacy.game : who
  if (role === 'hollis-pryor') return speakerId(pack, role)
  if (!role || !isCastId(role)) return null
  const worker = onDuty(pack, save, save.calendar.day, role)
  return worker && !leads.includes(worker) && pack.cast.umas.some(uma => uma.characterId === worker) ? worker : null
}
