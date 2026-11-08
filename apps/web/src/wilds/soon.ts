// The Forge and the Post on the Wilds map before they open (FW6, D8): each an existing uma-art building with a "Soon"
// label, its quick look saying when it opens. No new art until F9; the Forge opens in M4 (F8), the Post in M5 (F10).
import type { PlaceAt } from '@luismlorenzana/uma-kit/hub'

export interface SoonPlace {
  id: 'forge' | 'post'
  name: string
  /** uma-art's building it borrows. */
  frame: string
  at: PlaceAt
  blurb: string
  opens: 'M4' | 'M5'
}

/** A sixth row below the five trios, between their columns (the map is at least 25 rows tall for it, `MAP_MIN_HEIGHT`). */
export const SOON_PLACES: readonly SoonPlace[] = [
  { id: 'forge', name: 'Forge', frame: 'forge', at: { x: 0.35, y: 0.955 }, blurb: 'Turns made items into the other games’ items.', opens: 'M4' },
  { id: 'post', name: 'Post', frame: 'card-library', at: { x: 0.65, y: 0.955 }, blurb: 'Sends parcels to the other games.', opens: 'M5' },
]

export const soonPlace = (id: string | null | undefined): SoonPlace | undefined => SOON_PLACES.find((p) => p.id === id)
