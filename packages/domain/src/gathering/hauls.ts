// The farmer's hauls: one action at the woods' edge or the water, straight into the Warehouse.
//
//   forage an area   one haul: 2 of its season's finds, by their shares
//   chop at an area  2 logs of its woods
//   fish a spot      one catch, measured as it lands (a record when it's the biggest of its kind)
//
// The areas, the spots, their seasons and finds are the forest's and the Fishery's tables (`tables.ts`). The farmer
// works them as a Novice with a D talent and the farm's Axe or Rod, so his goods are ★1 until the tools improve; his
// reach is the Farm Rank's: each depth an Uma's rank opened (Novice … Legend) opens for him at Farm Rank 1, 2, 4, 6, 8
// and 10, the sea's spots once their place stands too. Every pick is a seeded draw, numbered by the farm's lifetime
// count of what came home, so each haul draws anew and every device draws alike. Pure; never stamps.
import { dateDayOf } from '../farm/calendar'
import { spend } from '../farm/actions'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { TALENT_D } from '../farm/talents'
import { goodOf } from '../goods/ids'
import type { FishMode } from '../goods/production-catalogue'
import { discoverOutput, discoverStock } from '../goods/discovery'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'
import { AREA_NAMES, FISHING_SPOTS, FOREST_AREAS, SPOT_NAMES, type FishingSpotId, type ForestAreaId } from './ids'
import {
  fishSize, GATHER_TOOL, gatherQuality, HOME_COUNT, pickOn, pickShare, sharesOn, sizeRecord, sizeSkill, starsOn, type GatherPlace, type Measured,
  type WorkTerms,
} from './kinds'
import { FISHERY, FOREST } from './tables'
import { catchGrade } from './fishing-grades'
import { draw } from '../farm/draw'

/** A forage's haul: two of the area's season's finds. */
export const FORAGE_HAUL = 2
/** Chopping at an area: two logs of its woods. */
export const CHOP_LOGS = 2
/** The Farm Rank that opens each depth for the farmer, by the rank an Uma needed there (Novice … Legend). */
export const FARMER_REACH: readonly number[] = [1, 2, 4, 6, 8, 10]
/** The lifetime count of logs chopped. */
export const LOGS_CHOPPED = 'logs-chopped'

/** The farmer's terms at a gathering place: Novice, a D talent, the farm's Axe or Rod. */
export const farmerTerms = (save: Pick<FarmSave, 'tools'>, place: GatherPlace): WorkTerms => ({ rank: 0, talent: TALENT_D, tool: save.tools[GATHER_TOOL[place]], wellFed: 0 })

/** The Farm Rank an area or a spot opens at for the farmer. */
export const reachOf = (place: GatherPlace, where: string): number =>
  FARMER_REACH[(place === 'forest' ? FOREST[where as ForestAreaId] : FISHERY[where as FishingSpotId]).opens]!

/** Why the farmer can't work an area or a spot yet, in words, or null when he can: the Farm Rank ("Opens at Farm Rank
 * 2."), and the sea's place built ("Needs the Dock."). */
export function reachLock(save: Pick<FarmSave, 'farm' | 'buildings'>, place: GatherPlace, where: string): string | null {
  const known: readonly string[] = place === 'forest' ? FOREST_AREAS : FISHING_SPOTS
  if (!known.includes(where)) return 'Not here.'
  const needs = place === 'fishery' ? FISHERY[where as FishingSpotId].needs : null
  if (needs !== null && !placeBuilt(save, needs)) return `Needs the ${needs === 'dock' ? 'Dock' : 'Boat'}.`
  const rank = reachOf(place, where)
  return farmRankOf(save.farm.points) < rank ? `Opens at Farm Rank ${rank}.` : null
}

function open(save: Pick<FarmSave, 'farm' | 'buildings'>, place: GatherPlace, where: string): void {
  const lock = reachLock(save, place, where)
  if (lock) throw new SaveRuleError('locked', lock)
}

/** Today's areas and spots with this one added, once. */
const gathered = (save: Pick<FarmSave, 'today'>, where: string): string[] => (save.today.gathered.includes(where) ? save.today.gathered : [...save.today.gathered, where])
const bump = (counts: Record<string, number>, key: string, n: number): Record<string, number> => ({ ...counts, [key]: (counts[key] ?? 0) + n })

// --- Thinning: four full hauls a place a day ---------------------------------------------------------------------------

/** Each area and spot gives full hauls the first four times a day, the farmer's by day and the farmhands' at night
 * together; past that it's thin: half hauls, the fraction drawn. So gathering takes a few hands a place, not any number. */
export const FULL_HAULS = 4
export const THIN_SHARE = 0.5
/** The hauls at an area or a spot today. */
export const haulsToday = (save: Pick<FarmSave, 'today'>, where: string): number => save.today.hauls?.[where] ?? 0
/** Whether a place is thin today: its four full hauls taken. */
export const thinToday = (save: Pick<FarmSave, 'today'>, where: string): boolean => haulsToday(save, where) >= FULL_HAULS
/** A haul's count at a place now: its full count for the first four today, then half, the fraction drawn
 * (`draw(uid, day, 'thin:<where>', n)`, numbered by the place's hauls today); a thin cast may land nothing. */
export function haulAt(save: Pick<FarmSave, 'today' | 'account' | 'calendar'>, where: string, count: number): number {
  const n = haulsToday(save, where)
  if (n < FULL_HAULS) return count
  const half = count * THIN_SHARE
  const whole = Math.floor(half + 1e-9)
  return whole + (draw(save.account.uid, save.calendar.day, `thin:${where}`, n) < half - whole - 1e-9 ? 1 : 0)
}
/** Today with a haul at a place: worked today (`gathered`), and its hauls one more. */
const hauled = (save: Pick<FarmSave, 'today'>, where: string): FarmSave['today'] =>
  ({ ...save.today, gathered: gathered(save, where), hauls: { ...save.today.hauls, [where]: haulsToday(save, where) + 1 } })

/** What a haul brought: its goods as stock keys (`<id>@<stars>`). */
export interface Haul {
  where: string
  items: string[]
}

/** Who gathers: the farmer (his terms: a Novice, a D talent, the farm's Axe or Rod), or a farmhand: her quality
 * points, how many a haul brings (a forage's finds, a chop's logs, a cast's fish), and her catch's lean. */
export interface Gatherer {
  q: number
  count: number
  skill: number
}
/** The farmer's at a place: ★1 with the Basic tools, a forage's two finds, a chop's two logs, one fish a cast. */
export function farmerGatherer(save: Pick<FarmSave, 'tools'>, place: GatherPlace, count: number): Gatherer {
  const terms = farmerTerms(save, place)
  return { q: gatherQuality(terms, false), count, skill: sizeSkill(terms) }
}

/** Forages an area: one action, one haul of its season's finds (`draw(uid, day, 'forage:<area>', n)` for each good and
 * `'forage-stars:<area>'` for its stars, numbered from the farm's count home from the forest). Refused where his reach
 * doesn't go yet (`locked`). */
export function forage<S extends FarmSave>(save: S, area: string): { save: S; haul: Haul } {
  open(save, 'forest', area)
  return forageAt(spend(save, 'forage'), area, farmerGatherer(save, 'forest', FORAGE_HAUL))
}
/** A forage itself, spending nothing: the farmer's action and a farmhand's work share it. A thin area's haul is half
 * (`haulAt`). */
export function forageAt<S extends FarmSave>(save: S, area: string, by: Gatherer): { save: S; haul: Haul } {
  const before = save.farm.counts[HOME_COUNT.forest] ?? 0
  let items = save.items
  const got: string[] = []
  const many = haulAt(save, area, by.count)
  for (let k = 0; k < many; k++) {
    const good = pickOn(save, 'forest', area, `forage:${area}`, before + k)
    const stars = starsOn(save, by.q, `forage-stars:${area}`, before + k)
    items = addGoods(items, good, stars, 1)
    got.push(stockKey(good, stars))
  }
  return {
    save: discoverStock({ ...save, items, today: hauled(save, area), farm: { ...save.farm, counts: bump(save.farm.counts, HOME_COUNT.forest, got.length) } }, got),
    haul: { where: area, items: got },
  }
}

/** Chops at an area: one action, two logs of its woods (`draw(uid, day, 'chop:<area>', n)`, numbered from the logs chopped
 * so far). Refused where his reach doesn't go yet. */
export function chop<S extends FarmSave>(save: S, area: string): { save: S; haul: Haul } {
  open(save, 'forest', area)
  return chopAt(spend(save, 'chop'), area, farmerGatherer(save, 'forest', CHOP_LOGS))
}
/** A chop itself, spending nothing. A thin area's chop is half (`haulAt`). */
export function chopAt<S extends FarmSave>(save: S, area: string, by: Gatherer): { save: S; haul: Haul } {
  const before = save.farm.counts[LOGS_CHOPPED] ?? 0
  const woods = sharesOn('forest', area, dateDayOf(save.calendar.day, save.calendar)).filter(([id]) => goodOf(id)?.family === 'woods')
  let items = save.items
  const got: string[] = []
  const many = haulAt(save, area, by.count)
  for (let k = 0; k < many; k++) {
    const log = pickShare(woods, draw(save.account.uid, save.calendar.day, `chop:${area}`, before + k))
    const stars = starsOn(save, by.q, `chop-stars:${area}`, before + k)
    items = addGoods(items, log, stars, 1)
    got.push(stockKey(log, stars))
  }
  const counts = bump(bump(save.farm.counts, LOGS_CHOPPED, got.length), HOME_COUNT.forest, got.length)
  return { save: discoverStock({ ...save, items, today: hauled(save, area), farm: { ...save.farm, counts } }, got), haul: { where: area, items: got } }
}

/** Fishes a spot: one action, one catch of its season's fish (`draw(uid, day, 'fish:<spot>', n)`, its stars
 * `'fish-stars:<spot>'`, numbered from the farm's count home from the Fishery), measured as it lands (`'size:farmer'`):
 * the biggest of each kind is kept in `diary.records`. A thin spot's cast lands a fish half the time: `caught` is null
 * when nothing bit. Refused where his reach doesn't go yet. */
export function fish<S extends FarmSave>(save: S, spot: string): { save: S; haul: Haul; caught: Measured | null } {
  open(save, 'fishery', spot)
  const mode = save.farm.fishingModes?.[spot as FishingSpotId] ?? 'standard'
  const done = fishAt(spend(save, 'fish'), spot, farmerGatherer(save, 'fishery', 1), mode, undefined, true)
  return { save: done.save, haul: done.haul, caught: done.caught[0] ?? null }
}
/** A cast itself, spending nothing: `by.count` fish (half at a thin spot, `haulAt`), each measured as it lands. */
export function fishAt<S extends FarmSave>(save: S, spot: string, by: Gatherer, mode: FishMode = 'standard', aptitude?: number, manual = false): { save: S; haul: Haul; caught: Measured[] } {
  let next: S = { ...save, today: hauled(save, spot) }
  const caught: Measured[] = []
  const casts = haulAt(save, spot, by.count)
  for (let k = 0; k < casts; k++) {
    const before = next.farm.counts[HOME_COUNT.fishery] ?? 0
    const good = pickOn(next, 'fishery', spot, `fish:${spot}`, before)
    const stars = starsOn(next, by.q, `fish-stars:${spot}`, before)
    const cm = fishSize(good, by.skill, draw(next.account.uid, next.calendar.day, 'size:farmer', before))
    const best = next.diary.records[sizeRecord(good)] ?? 0
    const records = cm > best ? { ...next.diary.records, [sizeRecord(good)]: cm } : next.diary.records
    const picked = catchGrade(next, good, mode, aptitude, manual)
    next = discoverOutput(picked.save, picked.id)
    next = { ...next, items: addGoods(next.items, picked.id, stars, 1),
      farm: { ...next.farm, counts: bump(next.farm.counts, HOME_COUNT.fishery, 1) }, diary: { ...next.diary, records } }
    caught.push({ fish: good, stars, cm, record: cm > best, ...(picked.id === good ? {} : { gradeId: picked.id }) })
  }
  return { save: next, haul: { where: spot, items: caught.map((c) => stockKey(c.gradeId ?? c.fish, c.stars)) }, caught }
}

/** The areas or spots in their order, each with its name, the Farm Rank it opens at and what holds it back now. */
export function reachList(save: Pick<FarmSave, 'farm' | 'buildings'>, place: GatherPlace): { id: string; name: string; rank: number; lock: string | null }[] {
  const ids: readonly string[] = place === 'forest' ? FOREST_AREAS : FISHING_SPOTS
  return ids.map((id) => ({
    id, name: place === 'forest' ? AREA_NAMES[id as ForestAreaId] : SPOT_NAMES[id as FishingSpotId], rank: reachOf(place, id), lock: reachLock(save, place, id),
  }))
}
