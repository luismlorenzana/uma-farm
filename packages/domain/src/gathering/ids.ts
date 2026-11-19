// The forest's areas, the Fishery's spots and the stations' jobs by id: what a haul or a load names. Light on purpose:
// the save's parse (in the initial JS) reads this file, while the area and fish tables (`tables.ts`) and the rules
// (`kinds.ts`, `hauls.ts`, `stations.ts`) load with the loop's screens and the night.
import { goodOf, type GoodFamily } from '../goods/ids'

/** The forest's areas, deepest last. */
export const FOREST_AREAS = ['woods', 'hills', 'old-forest', 'mountain', 'misty-vale', 'world-tree'] as const
export type ForestAreaId = typeof FOREST_AREAS[number]
/** The Fishery's spots: the five freshwater ones and the two at sea (the Dock's and the Boat's). */
export const FISHING_SPOTS = ['pond', 'river', 'lake', 'falls', 'moon-pool', 'sea-pier', 'deep-sea'] as const
export type FishingSpotId = typeof FISHING_SPOTS[number]
export const AREA_NAMES: Readonly<Record<ForestAreaId, string>> = {
  woods: 'the Woods', hills: 'the Hills', 'old-forest': 'the Old Forest', mountain: 'the Mountain', 'misty-vale': 'the Misty Vale', 'world-tree': 'the World Tree',
}
export const SPOT_NAMES: Readonly<Record<FishingSpotId, string>> = {
  pond: 'the Pond', river: 'the River', lake: 'the Lake', falls: 'the Falls', 'moon-pool': 'the Moon Pool', 'sea-pier': 'the Sea Pier', 'deep-sea': 'the Deep Sea',
}

/** The five stations, each at its gathering place's row: the Mill, the Sawmill and the Smokehouse, then the mine's
 * Smelter and the quarry's Cutter. */
export const STATIONS = ['mill', 'sawmill', 'smokehouse', 'smelter', 'cutter'] as const
export type StationId = typeof STATIONS[number]
export const isStation = (id: string): id is StationId => (STATIONS as readonly string[]).includes(id)

/** A station's job: where it runs and the families whose raw goods it refines one for one. Its days and name are
 * `STATION_JOB_RULES` (`tables.ts`). The Mill weaves the Barn's wool and fleeces into cloth. */
export interface StationJob {
  readonly station: StationId
  readonly families: readonly GoodFamily[]
}
export const STATION_JOBS = {
  flour: { station: 'mill', families: ['grains'] },
  'sugars-oils': { station: 'mill', families: ['sweets', 'nuts-seeds'] },
  preserves: { station: 'mill', families: ['fruits'] },
  weaving: { station: 'mill', families: ['fibers'] },
  dairy: { station: 'mill', families: ['eggs-milk'] },
  planks: { station: 'sawmill', families: ['woods'] },
  drying: { station: 'sawmill', families: ['mushrooms', 'herbs-spices'] },
  preserving: { station: 'sawmill', families: ['vegetables', 'eggs-milk'] },
  smoking: { station: 'smokehouse', families: ['fish'] },
  smelting: { station: 'smelter', families: ['ores'] },
  cutting: { station: 'cutter', families: ['crystals'] },
  blocks: { station: 'cutter', families: ['stones'] },
} as const satisfies Readonly<Record<string, StationJob>>
export type StationJobId = keyof typeof STATION_JOBS
export const STATION_JOB_IDS = Object.keys(STATION_JOBS) as StationJobId[]

/** The station job that makes a refined good from its raw one, or null (a raw good, a vegetable, loot). */
export function stationJobOf(output: string): StationJobId | null {
  const good = goodOf(output)
  if (!good?.refined) return null
  if (good.conversion) return good.conversion.job
  return STATION_JOB_IDS.find((job) => (STATION_JOBS[job].families as readonly GoodFamily[]).includes(good.family)) ?? null
}

export const stationJobLevel = (output: string): number => goodOf(output)?.conversion?.level ?? 1
export const stationJobUnits = (output: string): number => goodOf(output)?.conversion?.units ?? 1
