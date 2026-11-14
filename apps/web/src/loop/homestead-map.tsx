// The homestead on the farm map (the farm map's rows, grown): its rows sit after the yard and
// before the town edge and the Town, which stay the map's last rows: the Farmhouse, House 1 and House 2; Houses 3–5 with three
// married; House 6 with six. Built houses and every lot of an open row show, so the map grows a row at a time. A house's
// pips are its residents' faces (a Ready one badged ♥) and its free rooms' dots; a tap opens the homestead's sheet at
// that house; the next lot shows the house's frame locked with "Build · 8,000g" once its wedding has come, a lot shows
// the wedding it waits for. Loaded on demand.
import {
  FARM_MAP_ROWS, homesteadRows, homesteadShown, HOMESTEAD_FIRST_ROW, houseOpensWords, nextLot, residentsOf, roomsOf, TOWN_FIRST_ROW, type FarmPlace, type SaveV4,
} from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import type { HubMapPlace, PipModel } from '@luismlorenzana/uma-kit/hub'
import { mapTilesFor, placeAt } from './farm-map'
import { priceWords } from './homestead-view'

/** The map's rows: the farm's, then the homestead's, then the town's two (the town edge, then the Town). `townRow` is
 * the town edge's. */
export interface MapLayout {
  tiles: number
  townRow: number
}
/** The town's rows: the town edge and the Town. */
const TOWN_ROWS = FARM_MAP_ROWS - TOWN_FIRST_ROW + 1
export function homesteadLayout(save: Pick<SaveV4, 'homestead' | 'love'>): MapLayout {
  const townRow = HOMESTEAD_FIRST_ROW + homesteadRows(save)
  return { tiles: mapTilesFor(townRow + TOWN_ROWS - 1), townRow }
}

/** A farm place on the map: the town's rows move below the homestead. */
export const placeOnV4 = (place: FarmPlace, layout: MapLayout): Pick<FarmPlace, 'row' | 'col'> =>
  (place.group === 'town' ? { row: layout.townRow + place.row - TOWN_FIRST_ROW, col: place.col } : place)

/** The homestead's places on the map, with their pips and links. */
export function homesteadPlaces(save: SaveV4, layout: MapLayout, hearts: ReadonlySet<string>, nameOf: (id: string) => string = () => 'An Uma'): HubMapPlace[] {
  const lot = nextLot(save)
  return homesteadShown(save).map((place): HubMapPlace => {
    const built = save.homestead.houses[place.n]
    const at = placeAt({ row: place.row, col: place.col }, layout.tiles)
    const to = `/?sheet=homestead&house=${place.n}`
    if (!built) {
      const open = lot?.n === place.n && lot.open
      const words = open ? priceWords('Build', lot.cost, 0) : houseOpensWords(place.n).replace(/\.$/, '')
      return { id: place.id, name: open ? words : place.name, frame: place.frame, at, to, locked: true, label: `${place.name}, locked: ${words}` }
    }
    const residents = residentsOf(save, place.n)
    const pips: PipModel[] = [
      ...residents.map((id): PipModel => ({ state: 'busy', progress: 1, face: <FaceTile outfitId={id} size={24} label={nameOf(id)} round />, ...(hearts.has(id) ? { badge: '♥' } : {}) })),
      ...Array.from({ length: roomsOf(built) - residents.length }, (): PipModel => ({ state: 'free' })),
    ]
    return {
      id: place.id, name: built.name, frame: place.frame, at, to,
      label: `${built.name}, ${residents.length} of ${roomsOf(built)} rooms`, locked: false, pips, pipsAt: 'arch',
    }
  })
}
