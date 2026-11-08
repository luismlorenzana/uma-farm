// Copied from uma-rpg packages/domain/src/hub/places.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The place registry (D33, D144, D147), cut to the Wilds: the fifteen places in five rows, one source for the map, the hit
// targets, the global menu and the routes. uma-rpg's other pages (Town Hall, Learning, Battle), its slices and its tiers
// stay behind.

export type PlaceKind = 'gather-site' | 'station'

export interface Place {
  id: string
  page: 'wilds'
  kind: PlaceKind
  name: string
  /** One or two lines from the design. */
  blurb: string
  /** What it will do once open: produces, trains, or the feature. */
  details: string[]
  /** Uma slot pips shown on the map (assigned Umas' icons later). */
  slots: number
  /** Center on the page map, as fractions of its width and height. */
  at: { x: number; y: number }
  /** The uma-art building frame, when it isn't the id. */
  frame?: string
}

/** The Wilds' trios (D230, FL25): five rows of three, each line's gathering, processing and making places left to right, a
 * sixth of the map so it snaps to the same tile spacing on a short screen (24 rows at 375×667), leaving room for the
 * pips' arch (D233). */
const WILDS_LAYOUT: readonly { x: number; y: number }[] = [
  { x: 0.2, y: 0.155 }, { x: 0.5, y: 0.155 }, { x: 0.8, y: 0.155 },
  { x: 0.2, y: 0.315 }, { x: 0.5, y: 0.315 }, { x: 0.8, y: 0.315 },
  { x: 0.2, y: 0.475 }, { x: 0.5, y: 0.475 }, { x: 0.8, y: 0.475 },
  { x: 0.2, y: 0.635 }, { x: 0.5, y: 0.635 }, { x: 0.8, y: 0.635 },
  { x: 0.2, y: 0.795 }, { x: 0.5, y: 0.795 }, { x: 0.8, y: 0.795 },
]

/** One Wilds place, at its trio's spot (`WILDS_LAYOUT`). */
const placeV3 = (at: number, id: string, kind: PlaceKind, name: string, blurb: string, detail: string, frame?: string): Place => ({
  id, page: 'wilds', kind, name, blurb, details: [detail, 'Four slots, ×1.25'], slots: 4, at: WILDS_LAYOUT[at]!, ...(frame ? { frame } : {}),
})

/** The Wilds' trios (D230, FL25–FL27): each line's gathering, processing and making places. */
const WILDS_V4: Place[] = [
  placeV3(0, 'mine', 'gather-site', 'Mine', 'Mining: metal, G1–G10.', 'Ores G1–G10'),
  placeV3(1, 'mine-workbench', 'station', 'Mine Workbench', 'Smelting: ores into ingots.', 'Processes Metal G1–G10'),
  placeV3(2, 'weapon-forge', 'station', 'Weapon Forge', 'Arms Crafting: Arms Gems.', 'Makes Arms Gems G1–G10'),
  placeV3(3, 'fields', 'gather-site', 'Fields', 'Farming: vegetables, G1–G10.', 'Vegetables G1–G10', 'vegetable-garden'),
  placeV3(4, 'fields-workbench', 'station', 'Fields Workbench', 'Prepping: vegetables into cuts.', 'Processes Vegetables G1–G10'),
  placeV3(5, 'tome-forge', 'station', 'Tome Forge', 'Tome Crafting: Tome Ink.', 'Makes Tome Ink G1–G10'),
  placeV3(6, 'forest', 'gather-site', 'Forest', 'Wood Chopping: wood, G1–G10.', 'Logs G1–G10'),
  placeV3(7, 'forest-workbench', 'station', 'Forest Workbench', 'Sawing: logs into planks.', 'Processes Wood G1–G10'),
  placeV3(8, 'armorer', 'station', 'Armorer', 'Armor Crafting: Armor Fittings.', 'Makes Armor Fittings G1–G10', 'lancers-barracks'),
  placeV3(9, 'fishery', 'gather-site', 'Fishery', 'Fishing: fish, G1–G10.', 'Fish G1–G10'),
  placeV3(10, 'fishery-workbench', 'station', 'Fishery Workbench', 'Filleting: fish into fillets.', 'Processes Fish G1–G10'),
  placeV3(11, 'charm-forge', 'station', 'Charm Forge', 'Accessory Crafting: Accessory Settings.', 'Makes Accessory Settings G1–G10'),
  placeV3(12, 'monster-den', 'gather-site', 'Monster Den', 'Hunting: stone, G1–G10.', 'Stones G1–G10'),
  placeV3(13, 'den-workbench', 'station', 'Den Workbench', 'Stonecutting: stones into cut stones.', 'Processes Stone G1–G10'),
  placeV3(14, 'lapidary', 'station', 'Lapidary', 'Jewel Crafting: Planet and Moon Jewels.', 'Makes Planet and Moon Jewels I–V'),
]

/** The Wilds' fifteen places. */
export function wildsPlaces(): Place[] {
  return WILDS_V4
}

/** Every place. */
export const PLACES: readonly Place[] = WILDS_V4

const BY_ID = new Map(PLACES.map((p) => [p.id, p]))

export function placeById(id: string | undefined): Place | undefined {
  return id === undefined ? undefined : BY_ID.get(id)
}

/** Places drawn on a page's map, in registry order. */
export function placesOn(page: 'wilds'): Place[] {
  return PLACES.filter((p) => p.page === page)
}
