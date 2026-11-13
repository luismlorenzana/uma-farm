// The homestead on the farm map (the farm map's rows, grown), save v4 only: its rows sit after the yard and
// before the town edge, which stays the map's last row: the Farmhouse, House 1 and House 2; Houses 3–5; House 6. Built
// houses and the next lot show, so the map grows a row at a time. A house's pips are its residents' faces (a Ready one
// badged ♥) and its free rooms' dots; a tap opens the homestead's sheet at that house; the next lot shows the house's
// frame locked with "Build · 8,000g" (or what it waits for). v3's map is untouched: this module loads only in the romance
// build, for a v4 save. Loaded on demand.
import { homesteadRows, homesteadShown, HOMESTEAD_FIRST_ROW, nextLot, residentsOf, roomsOf, type FarmPlace, type SaveV4 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import type { HubMapPlace, PipModel } from '@luismlorenzana/uma-kit/hub'
import { mapTilesFor, placeAt } from './farm-map'
import { priceWords } from './homestead-view'

/** The v4 map's rows: the eight, less the town edge, then the homestead's, then the town edge. */
export interface MapLayout {
  tiles: number
  townRow: number
}
export function homesteadLayout(save: Pick<SaveV4, 'homestead'>): MapLayout {
  const townRow = HOMESTEAD_FIRST_ROW + homesteadRows(save)
  return { tiles: mapTilesFor(townRow), townRow }
}

/** A farm place on the v4 map: the town edge moves below the homestead. */
export const placeOnV4 = (place: FarmPlace, layout: MapLayout): Pick<FarmPlace, 'row' | 'col'> => (place.group === 'town' ? { row: layout.townRow, col: place.col } : place)

/** The homestead's places on the map, with their pips and links. */
export function homesteadPlaces(save: SaveV4, layout: MapLayout, hearts: ReadonlySet<string>, nameOf: (id: string) => string = () => 'An Uma'): HubMapPlace[] {
  const lot = nextLot(save)
  return homesteadShown(save).map((place): HubMapPlace => {
    const built = save.homestead.houses[place.n]
    const at = placeAt({ row: place.row, col: place.col }, layout.tiles)
    const to = `/?sheet=homestead&house=${place.n}`
    if (!built) {
      const words = lot?.open ? priceWords('Build', lot.cost, 0) : 'Your first wedding'
      return { id: place.id, name: lot?.open ? words : place.name, frame: place.frame, at, to, locked: true, label: `${place.name}, locked: ${lot?.open ? words : 'Opens with your first wedding'}` }
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
