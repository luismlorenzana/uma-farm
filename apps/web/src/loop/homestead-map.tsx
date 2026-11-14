// The homestead on the farm map: its houses on their own lots beside the yard, three to a column: the Farmhouse, House 1
// and House 2; Houses 3–5 with three married; House 6 with six. Built houses and every lot of an open row show, so the
// map grows a column at a time (`homesteadShown`). A house shows its residents' faces (a Ready one badged ♥) and its
// rooms; a tap opens the homestead's sheet at that house; the next lot shows the house's frame locked with
// "Build · 8,000g" once its wedding has come, a lot the wedding it waits for. Part of the farm map's chunk.
import { houseOpensWords, nextLot, residentsOf, roomsOf, type HomesteadPlace, type SaveV4 } from '@farm/domain'
import { priceWords } from './homestead-view'

/** A house's lot as the map draws it. */
export interface HouseLot {
  id: string
  name: string
  frame: string
  to: string
  label: string
  locked: boolean
  /** Its residents, in wedding order; none for a lot. */
  residents: string[]
  /** "2/2"; null for a lot. */
  rooms: string | null
}

/** A homestead place as its lot shows it. */
export function houseLot(save: SaveV4, place: HomesteadPlace, nameOf: (id: string) => string = () => 'An Uma'): HouseLot {
  const built = save.homestead.houses[place.n]
  const to = `/?sheet=homestead&house=${place.n}`
  if (!built) {
    const lot = nextLot(save)
    const open = lot?.n === place.n && lot.open
    const words = open ? priceWords('Build', lot.cost, 0) : houseOpensWords(place.n).replace(/\.$/, '')
    return { id: place.id, name: open ? words : place.name, frame: place.frame, to, label: `${place.name}, locked: ${words}`, locked: true, residents: [], rooms: null }
  }
  const residents = residentsOf(save, place.n)
  return {
    id: place.id, name: built.name, frame: place.frame, to, locked: false, residents, rooms: `${residents.length}/${roomsOf(built)}`,
    label: `${built.name}, ${residents.length} of ${roomsOf(built)} rooms${residents.length > 0 ? `: ${residents.map(nameOf).join(', ')}` : ''}`,
  }
}
