// The forest's areas, the Fishery's spots and the stations' jobs by id: what a v3 work
// request names, and each request's parse. Light on purpose: the save's parse (in the initial JS) reads this file, while
// the area and fish tables (`tables.ts`) and the kinds' rules (`kinds.ts`) load with the loop's screens and the night.
import { goodOf, type GoodFamily } from '../goods/ids'
import { int, object, oneOf, SaveParseError, type Obj } from '../save/parse'
import type { LoopPlaceId, LoopRequestKind } from '../save/parse-v3'
import type { LoopWorkRequest } from '../save/v3'
import { parseStockKey } from '../save/warehouse'

/** The forest's areas, deepest last. */
export const FOREST_AREAS = ['woods', 'hills', 'old-forest', 'mountain', 'misty-vale', 'world-tree'] as const
export type ForestAreaId = typeof FOREST_AREAS[number]
/** The Fishery's spots: the five freshwater ones and the two at sea (chapter 7). */
export const FISHING_SPOTS = ['pond', 'river', 'lake', 'falls', 'moon-pool', 'sea-pier', 'deep-sea'] as const
export type FishingSpotId = typeof FISHING_SPOTS[number]
export const AREA_NAMES: Readonly<Record<ForestAreaId, string>> = {
  woods: 'the Woods', hills: 'the Hills', 'old-forest': 'the Old Forest', mountain: 'the Mountain', 'misty-vale': 'the Misty Vale', 'world-tree': 'the World Tree',
}
export const SPOT_NAMES: Readonly<Record<FishingSpotId, string>> = {
  pond: 'the Pond', river: 'the River', lake: 'the Lake', falls: 'the Falls', 'moon-pool': 'the Moon Pool', 'sea-pier': 'the Sea Pier', 'deep-sea': 'the Deep Sea',
}

/** A gathering job is 1–4 days; a queue adds up to three more jobs. */
export const MAX_GATHER_DAYS = 4
/** A station job makes up to 100 items. */
export const MAX_STATION_ITEMS = 100

/** The three stations M4 opens, each at its gathering place's row. */
export const STATIONS = ['mill', 'sawmill', 'smokehouse'] as const
export type StationId = typeof STATIONS[number]
export const isStation = (id: string): id is StationId => (STATIONS as readonly string[]).includes(id)

/** A station's job: where it runs and the families whose raw goods it refines one for one. Its days and name are
 * `STATION_JOB_RULES` (`tables.ts`). The Mill's Cloth waits for the ranch's wool. */
export interface StationJob {
  readonly station: StationId
  readonly families: readonly GoodFamily[]
}
export const STATION_JOBS = {
  flour: { station: 'mill', families: ['grains'] },
  'sugars-oils': { station: 'mill', families: ['sweets', 'nuts-seeds'] },
  preserves: { station: 'mill', families: ['fruits'] },
  planks: { station: 'sawmill', families: ['woods'] },
  drying: { station: 'sawmill', families: ['mushrooms', 'herbs-spices'] },
  smoking: { station: 'smokehouse', families: ['fish'] },
} as const satisfies Readonly<Record<string, StationJob>>
export type StationJobId = keyof typeof STATION_JOBS
export const STATION_JOB_IDS = Object.keys(STATION_JOBS) as StationJobId[]

/** The station job that makes a refined good from its raw one, or null (a raw good, a vegetable, loot). */
export function stationJobOf(output: string): StationJobId | null {
  const good = goodOf(output)
  if (!good?.refined) return null
  return STATION_JOB_IDS.find((job) => (STATION_JOBS[job].families as readonly GoodFamily[]).includes(good.family)) ?? null
}

// --- The requests' parse: strict keys, the kind's own ids ------------------------------------------

const fail = (path: string, message: string): never => {
  throw new SaveParseError(path, message)
}

/** A day's gathering: `{ kind, item: <area or spot>, count: days }`. */
const gatherParse = (kind: 'forage' | 'fish', ids: readonly string[]) => (value: Obj, path: string): LoopWorkRequest => {
  const r = object(value, path, ['kind', 'item', 'count'])
  return { kind, item: oneOf(r.item, `${path}.item`, ids), count: int(r.count, `${path}.count`, 1, MAX_GATHER_DAYS) }
}

/** A station job: `{ kind, item: '<output>@<stars>', count }`, its output a refined good the job makes. */
const stationParse = (kind: StationJobId) => (value: Obj, path: string): LoopWorkRequest => {
  const r = object(value, path, ['kind', 'item', 'count'])
  const at = typeof r.item === 'string' ? parseStockKey(r.item) : null
  if (!at || stationJobOf(at.id) !== kind) fail(`${path}.item`, 'expected a good it makes, at its stars')
  return { kind, item: r.item as string, count: int(r.count, `${path}.count`, 1, MAX_STATION_ITEMS) }
}

/** Each loop kind's places and request parse: what the save's parse needs (`parseSaveV3`). Their rules are `LOOP_KINDS`
 * (`kinds.ts`), loaded with the screens and the night. */
export const LOOP_REQUESTS: Readonly<Record<string, LoopRequestKind>> = {
  forage: { places: ['forest'], parseRequest: gatherParse('forage', FOREST_AREAS) },
  fish: { places: ['fishery'], parseRequest: gatherParse('fish', FISHING_SPOTS) },
  ...Object.fromEntries(STATION_JOB_IDS.map((job) => [job, { places: [STATION_JOBS[job].station as LoopPlaceId], parseRequest: stationParse(job) }])),
}
