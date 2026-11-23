import {
  atHome, awayForNight, awayOn, currentDatePeriod, handsTonight, onFarmToday, placeWordsOf, townDay, townLocation, worksOn,
  type FarmSave, type StoryPack, type TalentOf, type WorkedOrder,
} from '@farm/domain'
import type { WalkingOutfit } from '../hd2d/character-art'
import { regionOf, type FarmRegion } from './farm-regions'

export interface FarmActor {
  id: string
  region: FarmRegion
  door: string
  detail: string
  outfit: WalkingOutfit
  planned?: boolean
}

function orderPlace(key: string): string | null {
  const [kind, where] = key.split(':')
  switch (kind) {
    case 'harvest': case 'plant': case 'water': case 'till': return `fields:${where ?? '0'}`
    case 'forage': case 'chop': return where ? `forest:${where}` : null
    case 'fish': return where ? `fishery:${where}` : null
    case 'mine': case 'care': case 'load': return where ?? null
    case 'cook': return 'kitchen'
    case 'save-seed': return 'mill'
    case 'ship-surplus': return 'bin'
    default: return null
  }
}

const jobLabel: Record<string, string> = {
  harvest:'Harvesting', plant:'Planting', water:'Watering', till:'Tilling', forage:'Foraging', chop:'Chopping',
  fish:'Fishing', mine:'Mining', care:'Animal care', load:'Processing', cook:'Cooking', 'save-seed':'Saving seeds',
  'ship-surplus':'Shipping',
}

function requiredPlace(door: string): string {
  return door.split(':')[0]!
}

export function awayFromWorld(save: FarmSave, id: string, daytime: boolean): boolean {
  return daytime ? Boolean(awayOn(save, id, save.calendar.day)) : awayForNight(save, id, save.calendar.day)
}

export function farmPresence(save: FarmSave, pack: StoryPack | null, talentOf: TalentOf): { actors: Map<string, FarmActor>; town: ReturnType<typeof townDay> | null } {
  const period = currentDatePeriod(save)
  const town = pack && period ? townDay(save, pack) : null
  const actors = new Map<string, FarmActor>()
  const crew = period === 'morning' && (save.today.crew || Object.values(save.roster).some(uma => uma.farmhand !== undefined))
    ? save.today.crew ?? handsTonight(save, save, talentOf, pack) : null
  const jobs = new Map<string, WorkedOrder>()
  for (const job of crew?.jobs ?? []) {
    const door = orderPlace(job.key)
    if (!door || !regionOf(requiredPlace(door)) || job.actions <= (jobs.get(job.id)?.actions ?? 0)) continue
    if (!worksOn(save, pack, job.id)) continue
    jobs.set(job.id, job)
  }
  for (const [id, job] of jobs) {
    const door = orderPlace(job.key)!
    const region = regionOf(requiredPlace(door))!
    actors.set(id, { id, region, door, detail: jobLabel[job.key.split(':')[0]!] ?? 'Working',
      outfit: 'farm-work', planned: !save.today.crew })
  }
  for (const id of Object.keys(save.roster)) {
    if (actors.has(id) || awayFromWorld(save, id, Boolean(period)) || town?.where.has(id)) continue
    const house = save.love[id]?.house
    if (house !== undefined && atHome(save, id) && save.homestead.houses[house]) {
      actors.set(id, { id, region: 'living', door: `house:${house}`, detail: 'Home now', outfit: period ? 'spring' : 'pajamas' })
    } else if (period && pack && onFarmToday(save, pack, id)) {
      actors.set(id, { id, region: 'farm', door: 'gate', detail: 'On the farm', outfit: 'spring' })
    }
  }
  return { actors, town }
}

export function residentTownPlace(pack: StoryPack | null, at: string): string {
  return pack && townLocation(pack, at)?.name || placeWordsOf(pack, 'town').name
}
