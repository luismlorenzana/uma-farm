// The farm grows by building. Every place past the start is offered at its Farm Rank (`places.ts`), and you build it
// with gold and the farm's own goods:
//
//   offered      the Farm Rank reaches its rank (the boat once the dock stands too)
//   paid         its gold and goods leave now, the cheapest goods first; it waits in `farm.builds`
//   built        the next morning: night step 8 sets `buildings[id]` to 1, and the morning says "Built overnight"
//
// A place whose game isn't built yet shows what it'll be, "Not built yet", and can't be bought. Beside the builds, the
// farm's life with the Umas opens the homestead and the town: the ring bench at the first Romance 8, house *n* with the
// *n*-th wedding, the homestead's second row with three married, the Requests board with five met. The farm's projects
// (`farmProjects`) gather all of it for the Diary. Pure; never stamps. Loaded with the screens and the night.
import { farmRankOf, FARM_RANK_POINTS } from './farm'
import { BUILD_PLACES, farmPlace, isBuildPlace, placeBuilt, umasMet, type BuildGoods, type BuildPlace, type FarmPlaceId } from './places'
import { FAMILY_NAMES, goodOf, GOODS, type GoodsFamily } from '../goods/ids'
import { starPrice } from '../goods/prices'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { HOMESTEAD_ROW_MARRIED } from '../romance/homestead'
import { marriedCount, STATION_MAX_LEVEL, type BuildingId, type FarmSave, type Warehouse } from '../save/v4'
import { isStation } from '../gathering/ids'
import { takeGoods } from '../save/warehouse'
import { activateForge, benchOpen } from '../forge/state'

// --- The goods a build takes -----------------------------------------------------------------------------------------

/** A build's goods in the player's words: "logs", "planks", "fillets". */
const GOODS_WORDS: Partial<Record<GoodsFamily, readonly [raw: string, refined: string]>> = {
  woods: ['logs', 'planks'], fish: ['fish', 'fillets'], grains: ['grains', 'flour'], vegetables: ['vegetables', 'vegetables'],
  mushrooms: ['mushrooms', 'dried mushrooms'], 'herbs-spices': ['herbs', 'dried herbs'], fruits: ['fruit', 'preserves'],
  ores: ['ores', 'ingots'], stones: ['stones', 'stone blocks'], crystals: ['crystals', 'cut gems'],
}
/** One line of a build's goods: "20 logs". */
export const buildGoodsWords = (line: Pick<BuildGoods, 'family' | 'refined'> & { count?: number }): string => {
  const words = GOODS_WORDS[line.family]?.[line.refined ? 1 : 0] ?? `${FAMILY_NAMES[line.family].toLowerCase()}${line.refined ? ', refined' : ''}`
  return line.count === undefined ? words : `${line.count.toLocaleString('en-US')} ${words}`
}

const CATALOGUE = new Map(GOODS.map((g, i) => [g.id, i]))
/** Whether a held id is one of a build line's goods: its family, raw or refined, any grade. */
const isLineGood = (id: string, line: Pick<BuildGoods, 'family' | 'refined'>): boolean => {
  const good = goodOf(id)
  return !!good && good.family === line.family && good.refined === line.refined
}
/** How many of a line's goods the Warehouse holds, any grade, any stars. */
export const heldFor = (items: Warehouse, line: Pick<BuildGoods, 'family' | 'refined'>): number =>
  Object.entries(items).reduce((n, [id, row]) => (isLineGood(id, line) ? n + row.reduce((a, b) => a + b, 0) : n), 0)

/** The goods a line takes, the cheapest first: the lowest value (★1 price × the star's factor), then fewer stars, then
 * the catalogue's order. Null when fewer are held. */
export function pickFor(items: Warehouse, line: BuildGoods): { id: string; stars: number; count: number }[] | null {
  const stock = Object.entries(items).flatMap(([id, row]) => (isLineGood(id, line)
    ? row.flatMap((count, i) => (count > 0 ? [{ id, stars: i + 1, count, value: starPrice(id, i + 1) }] : []))
    : [])).sort((a, b) => a.value - b.value || a.stars - b.stars || (CATALOGUE.get(a.id) ?? 0) - (CATALOGUE.get(b.id) ?? 0))
  const pick: { id: string; stars: number; count: number }[] = []
  let left = line.count
  for (const s of stock) {
    if (left === 0) break
    const n = Math.min(left, s.count)
    pick.push({ id: s.id, stars: s.stars, count: n })
    left -= n
  }
  return left === 0 ? pick : null
}

// --- What stands in the way ------------------------------------------------------------------------------------------

/** A line of a build's cost as the farm stands: what it takes and what's held. */
export interface BuildNeed {
  goods: BuildGoods
  have: number
}
/** Each goods line of a build's cost with what the Warehouse holds. */
export const buildNeeds = (save: Pick<FarmSave, 'items'>, place: BuildPlace): BuildNeed[] =>
  place.opens.cost.goods.map((goods) => ({ goods, have: heldFor(save.items, goods) }))

/** What stands between the farm and building a place now, in order: built, paid today, its game not built ("Not built
 * yet"), its Farm Rank, the place it comes after, then the gold and goods it still lacks. */
export type BuildLock =
  | { by: 'built' }
  | { by: 'tonight' }
  | { by: 'game' }
  | { by: 'farm-rank'; rank: number }
  | { by: 'after'; place: FarmPlaceId }
  /** What's still lacking: gold short (0 when there's enough) and each goods line short. */
  | { by: 'short'; gold: number; goods: BuildNeed[] }

/** Options for the pacing's simulation: `games: false` treats every place's game as built. */
export interface BuildOptions { games?: boolean }

/** Why a place can't be built now, or null when it can. */
export function buildLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'gold' | 'items'>, id: FarmPlaceId, { games = true }: BuildOptions = {}): BuildLock | null {
  const place = farmPlace(id)
  if (!isBuildPlace(place)) return { by: 'built' }
  if (placeBuilt(save, id)) return { by: 'built' }
  if (save.farm.builds.includes(id)) return { by: 'tonight' }
  const { rank, game, after, cost } = place.opens
  if (games && !game) return { by: 'game' }
  if (farmRankOf(save.farm.points) < rank) return { by: 'farm-rank', rank }
  if (after && !placeBuilt(save, after)) return { by: 'after', place: after }
  const short = buildNeeds(save, place).filter((n) => n.have < n.goods.count)
  const gold = Math.max(0, cost.gold - save.gold)
  return gold > 0 || short.length > 0 ? { by: 'short', gold, goods: short } : null
}

/** A lock in the player's words: "Not built yet", "Opens at Farm Rank 3", "After the Dock", "Builds tonight", "Need 400g
 * and 12 logs more"; null when it can be built. */
export function buildLockWords(lock: BuildLock | null): string | null {
  if (!lock) return null
  switch (lock.by) {
    case 'built': return 'Built'
    case 'tonight': return 'Builds tonight'
    case 'game': return 'Not built yet'
    case 'farm-rank': return `Opens at Farm Rank ${lock.rank}`
    case 'after': return `After the ${farmPlace(lock.place)!.name}`
    case 'short': {
      const parts = [...(lock.gold > 0 ? [`${lock.gold.toLocaleString('en-US')}g`] : []), ...lock.goods.map((n) => buildGoodsWords({ ...n.goods, count: n.goods.count - n.have }))]
      return `Need ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]} more`
    }
  }
}

/** A build's cost in words: "1,000g · 20 logs". */
export const buildCostWords = (place: BuildPlace): string =>
  [`${place.opens.cost.gold.toLocaleString('en-US')}g`, ...place.opens.cost.goods.map((g) => buildGoodsWords(g))].join(' · ')

// --- Paying, and the night -------------------------------------------------------------------------------------------

/** Pays for a place: its gold and goods leave now (each line's cheapest goods first), and it waits in `farm.builds` to
 * stand the next morning. Refused with the lock's words: built already or paid today (`bad-job`), not built yet, its Farm
 * Rank or the place before it (`locked`), gold short (`no-gold`), goods short (`no-items`). Never stamps. */
export function payBuild<S extends FarmSave>(save: S, id: FarmPlaceId, options: BuildOptions = {}): S {
  const lock = buildLock(save, id, options)
  if (lock) {
    const words = buildLockWords(lock)!
    const reason = lock.by === 'built' || lock.by === 'tonight' ? 'bad-job' : lock.by === 'short' ? (lock.gold > 0 ? 'no-gold' : 'no-items') : 'locked'
    throw new SaveRuleError(reason, `${words}.`)
  }
  const place = farmPlace(id) as BuildPlace
  let items = save.items
  for (const line of place.opens.cost.goods) for (const p of pickFor(items, line)!) items = takeGoods(items, p.id, p.stars, p.count)
  const paid = spendGold(id === 'forge' ? activateForge(save) : save, place.opens.cost.gold)
  return { ...paid, items, farm: { ...paid.farm, builds: [...paid.farm.builds, id] } }
}

/** Night step 8, first: every place paid for yesterday stands (`buildings[id]` 1), and a station's or the Kitchen's level
 * bought yesterday comes (one already standing goes up a level, `gathering/stations.ts`, `kitchen/kitchen.ts`), in the
 * order paid; `farm.builds` empties. Both top out at level 5. */
export function raiseBuilds<S extends FarmSave>(save: S): { save: S; built: FarmPlaceId[] } {
  const built = save.farm.builds
  if (built.length === 0) return { save, built: [] }
  const buildings = { ...save.buildings }
  for (const id of built) {
    const was = buildings[id as BuildingId] ?? 0
    buildings[id as BuildingId] = (isStation(id) || id === 'kitchen') && was >= 1 ? Math.min(STATION_MAX_LEVEL, was + 1) : Math.max(1, was)
  }
  const current = built.includes('forge') ? activateForge(save) : save
  return { save: { ...current, buildings, farm: { ...current.farm, builds: [] } }, built: [...built] }
}

// --- The milestones with the Umas ------------------------------------------------------------------------------------

/** Five Umas met open the Requests board's place. */
export const BOARD_MET = 5

/** One milestone with the Umas, with how far along the farm is. */
export type UmaMilestone =
  /** The ring bench: the first Romance 8 anyone plays. */
  | { kind: 'bench'; have: number; need: 1; done: boolean }
  /** House *n* opens with the *n*-th wedding. */
  | { kind: 'house'; n: number; have: number; need: number; done: boolean }
  /** A homestead row opens with so many married. */
  | { kind: 'row'; row: number; have: number; need: number; done: boolean }
  /** The Requests board's place opens with five Umas met. */
  | { kind: 'board'; have: number; need: number; done: boolean }

/** The milestones with the Umas, as the farm stands: the ring bench, the next house to open (House 1 … 6), the
 * homestead's second and third rows, and the Requests board. */
export function umaMilestones(save: Pick<FarmSave, 'buildings' | 'forge' | 'love' | 'roster' | 'homestead'>): UmaMilestone[] {
  const married = marriedCount(save)
  const bench = benchOpen(save)
  const house = Math.min(6, married + 1)
  const out: UmaMilestone[] = [{ kind: 'bench', have: bench ? 1 : 0, need: 1, done: bench }]
  out.push({ kind: 'house', n: house, have: Math.min(married, house), need: house, done: married >= house })
  HOMESTEAD_ROW_MARRIED.forEach((need, i) => { if (i > 0) out.push({ kind: 'row', row: i + 1, have: Math.min(married, need), need, done: married >= need }) })
  const met = umasMet(save)
  out.push({ kind: 'board', have: Math.min(met, BOARD_MET), need: BOARD_MET, done: met >= BOARD_MET })
  return out
}

// --- The farm's projects ---------------------------------------------------------------------------------------------

/** A place you may build at your Farm Rank, with what still stands in the way (null: build it now). */
export interface Project {
  place: BuildPlace
  lock: BuildLock | null
}
/** The farm's projects: what you can build now (offered, not built, its game built: with what's lacking, or paid today),
 * what's offered whose game isn't built yet, what the next rank offers, and the milestones with the Umas. */
export interface FarmProjects {
  now: Project[]
  waiting: BuildPlace[]
  next: { rank: number; points: number; places: BuildPlace[] } | null
  milestones: UmaMilestone[]
}
export function farmProjects(save: FarmSave): FarmProjects {
  const rank = farmRankOf(save.farm.points)
  const offered = BUILD_PLACES.filter((p) => p.opens.rank <= rank && !placeBuilt(save, p.id))
  const now = offered.filter((p) => p.opens.game).map((place) => ({ place, lock: buildLock(save, place.id) }))
  const waiting = offered.filter((p) => !p.opens.game)
  const later = BUILD_PLACES.filter((p) => p.opens.rank > rank)
  const nextRank = later.length > 0 ? Math.min(...later.map((p) => p.opens.rank)) : null
  const next = nextRank === null ? null : { rank: nextRank, points: FARM_RANK_POINTS[nextRank - 1] ?? 0, places: later.filter((p) => p.opens.rank === nextRank) }
  return { now, waiting, next, milestones: umaMilestones(save) }
}

/** The places a Farm Rank offers to build, in map order. */
export const offeredAt = (rank: number): BuildPlace[] => BUILD_PLACES.filter((p) => p.opens.rank === rank)
