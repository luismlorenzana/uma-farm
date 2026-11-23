import {
  farmPlace, FIELD_PLOTS, homesteadShown, placeWordsOf, type FarmPlaceId, type FarmSave, type StoryPack,
} from '@farm/domain'
import { lockOf, placeLink } from '../loop/farm-map'
import { reachRows } from '../loop/farm-view'
import { houseLot } from '../loop/homestead-map'

export const FARM_REGIONS = {
  farm: { label: 'Farm', at: [44, 32], places: ['fields', 'mill', 'gate'] },
  forest: { label: 'Forest', at: [18, 29], places: ['forest', 'sawmill'] },
  pond: { label: 'Pond', at: [18, 70], places: ['fishery', 'smokehouse', 'dock', 'boat'] },
  barns: { label: 'Barns', at: [78, 29], places: ['coop', 'barn'] },
  living: { label: 'Living', at: [78, 63], places: [] },
  work: { label: 'Work', at: [49, 80], places: ['kitchen', 'mine', 'smelter', 'quarry', 'cutter', 'forge', 'warehouse', 'restaurant', 'bin', 'board'] },
} as const satisfies Record<string, { label: string; at: readonly [number, number]; places: readonly FarmPlaceId[] }>

export type FarmRegion = keyof typeof FARM_REGIONS
export const REGIONS = Object.keys(FARM_REGIONS) as FarmRegion[]
export const regionOf = (place: string | null | undefined): FarmRegion | undefined => {
  if (!place) return undefined
  if (/^house:\d+$/.test(place)) return 'living'
  const parent = place.split(':')[0]!
  return REGIONS.find(region => (FARM_REGIONS[region].places as readonly string[]).includes(parent))
}
const sheetPlaces: Record<string, string> = { kitchen: 'kitchen', forge: 'forge', bench: 'forge', restaurant: 'restaurant', bin: 'bin', requests: 'board' }

export interface FarmEntrance {
  id: string
  name: string
  to: string
  detail?: string | undefined
  locked?: string | undefined
  plate?: string | undefined
}

export function regionUrl(region: FarmRegion, door?: string): string {
  const params = new URLSearchParams({ region })
  if (door) params.set('door', door)
  return '/?' + params.toString()
}

export function withinRegion(to: string, region: FarmRegion, door?: string): string {
  if (!to.startsWith('/?')) return to
  const params = new URLSearchParams(to.slice(2))
  params.set('region', region)
  if (door) params.set('door', door)
  return '/?' + params.toString()
}

export function regionFromParams(params: URLSearchParams): FarmRegion | undefined {
  const asked = params.get('region')
  if (asked && Object.hasOwn(FARM_REGIONS, asked)) return asked as FarmRegion
  if (params.get('map') === 'field-pond') return 'farm'
  if (params.get('sheet') === 'homestead') return 'living'
  return regionOf(params.get('door') ?? params.get('peek') ?? sheetPlaces[params.get('sheet') ?? ''])
}

const interiors: Readonly<Record<string, string>> = {
  mill:'mill', sawmill:'sawmill', smokehouse:'smokehouse', coop:'coop', barn:'barn',
  kitchen:'kitchen', smelter:'smelter', cutter:'cutter', forge:'forge', warehouse:'warehouse', restaurant:'restaurant',
}

export function farmEntrances(save: FarmSave, pack: StoryPack | null, region: FarmRegion): FarmEntrance[] {
  if (region === 'living') return homesteadShown(save).map(place => {
    const lot = houseLot(save, place)
    return { id: `house:${place.n}`, name: save.homestead.houses[place.n]?.name ?? place.name,
      to: lot.to, detail: lot.rooms ? `${lot.rooms} rooms` : undefined, locked: lot.locked ? lot.label : undefined, plate: 'home-table' }
  })
  const doors: FarmEntrance[] = []
  for (const id of FARM_REGIONS[region].places) {
    if (id === 'boat') continue
    if (id === 'fields') {
      for (const [plot] of FIELD_PLOTS.entries()) {
        const open = plot < save.fields.plots.length
        if (!open && plot !== save.fields.plots.length) break
        doors.push({ id: `fields:${plot}`, name: `Plot ${plot + 1}`, to: `/field?plot=${plot + 1}`,
          locked: open ? undefined : 'Uncleared plot' })
      }
      continue
    }
    if (id === 'forest' || id === 'fishery') {
      for (const row of reachRows(save, id)) doors.push({
        id: `${id}:${row.id}`, name: row.name, to: `/?peek=${id}&spot=${row.id}`, locked: row.lock ?? undefined,
      })
      continue
    }
    const place = farmPlace(id)!
    doors.push({
      id, name: placeWordsOf(pack, id).name, to: placeLink(save, place),
      locked: lockOf(save, place) ?? undefined,
      plate: interiors[id],
      detail: id in save.loads ? 'Batch in progress' : undefined,
    })
  }
  return doors
}
