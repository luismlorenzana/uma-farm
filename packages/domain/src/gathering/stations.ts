// The stations' loads and levels. A station turns one raw good into its refined form, one for one, keeping its stars
// (the recipes are its jobs', `ids.ts`). One action starts a load of up to 8 of one good at one star: its inputs leave
// the Warehouse now, and it's ready the next morning, straight into the Warehouse (night step 4, `finishLoads`).
//
//   its level   level n takes n loads a day, up to level 5 (`STATION_LEVELS`). Level 1 is the station built; each later
//               level is bought at the station: its gold now, from its Farm Rank, and the level the
//               next morning (night step 8, `raiseBuilds`). One level a day
//   a load      an action each, up to the day's loads; each its own good and stars
//
// A station is locked until built: the Farm Rank offers it, and it's built with gold and goods like every place
// (`farm/builds.ts`). Loaded with the screens and the night.
import { spend } from '../farm/actions'
import { farmRankOf } from '../farm/farm'
import { availableStock } from '../farm/production'
import { discoverOutput } from '../goods/discovery'
import { CATALOGUE, goodOf, type Good } from '../goods/ids'
import { MAX_PRODUCTION_TARGET, MAX_STATION_TARGETS } from '../goods/production-catalogue'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { STATION_MAX_LEVEL, type FarmSave, type StationLoad, type StationTarget } from '../save/v4'
import { addGoods, goodCount, parseStockKey, takeGoods } from '../save/warehouse'
import { STATION_JOB_IDS, STATION_JOBS, stationJobLevel, stationJobOf, stationJobUnits, STATIONS, type StationId, type StationJobId } from './ids'
import { stationBuilt } from './kinds'
import { STATION_RATE } from './tables'

/** The most a load takes: a Novice's day at a station. */
export const LOAD_SIZE = STATION_RATE

// --- Its level -------------------------------------------------------------------------------------------------------

/** One level of a station: the loads a day it takes, its gold and the Farm Rank it opens at (level 1 is the station
 * built, by its own build). */
export interface StationLevel {
  level: number
  loads: number
  cost: number
  farmRank: number
}
/** A station's levels, the same for every station: level n takes n loads a day; levels 2–5 at Farm Rank 3, 4, 5 and 6,
 * for 2,000g, 5,000g, 10,000g and 20,000g, gold only. A load pays about 200–700g over its goods
 * (a refined good sells for half again its input), so a level pays its way in a week or a few. */
export const STATION_LEVELS: readonly StationLevel[] = [
  { level: 1, loads: 1, cost: 0, farmRank: 1 },
  { level: 2, loads: 2, cost: 2_000, farmRank: 3 },
  { level: 3, loads: 3, cost: 5_000, farmRank: 4 },
  { level: 4, loads: 4, cost: 10_000, farmRank: 5 },
  { level: 5, loads: 5, cost: 20_000, farmRank: 6 },
]

/** A station's level in effect today: 0 before it's built. */
export const stationLevel = (save: Pick<FarmSave, 'buildings'>, station: StationId): number =>
  (stationBuilt(save, station) ? Math.min(STATION_MAX_LEVEL, save.buildings[station]!) : 0)
/** The loads a station takes a day at its level today. */
export const loadsADay = (save: Pick<FarmSave, 'buildings'>, station: StationId): number => STATION_LEVELS[stationLevel(save, station) - 1]?.loads ?? 0
/** The loads it holds today, in the order started. */
export const loadsToday = (save: Pick<FarmSave, 'loads'>, station: StationId): StationLoad[] => save.loads[station] ?? []
/** How many more loads it takes today. */
export const loadsLeft = (save: Pick<FarmSave, 'buildings' | 'loads'>, station: StationId): number =>
  Math.max(0, loadsADay(save, station) - loadsToday(save, station).length)
/** A level bought today, standing the next morning. */
export const levelTonight = (save: Pick<FarmSave, 'buildings' | 'farm'>, station: StationId): boolean => stationBuilt(save, station) && save.farm.builds.includes(station)

/** Why a station's next level can't be bought now, in order: not built, a level bought today (one a day), at its top
 * level, its Farm Rank, the gold short. */
export type LevelLock =
  | { by: 'built' }
  | { by: 'tonight'; level: number }
  | { by: 'top' }
  | { by: 'farm-rank'; rank: number }
  | { by: 'gold'; short: number }

/** The station's next level to buy: the one after today's (after tomorrow's, once one is bought today); null at the top
 * (level 5) or before it's built. */
export function nextStationLevel(save: Pick<FarmSave, 'buildings' | 'farm'>, station: StationId): StationLevel | null {
  const level = stationLevel(save, station)
  return level === 0 ? null : STATION_LEVELS[level + (levelTonight(save, station) ? 1 : 0)] ?? null
}
/** Why the next level can't be bought now, or null when it can. */
export function levelLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'gold'>, station: StationId): LevelLock | null {
  if (!stationBuilt(save, station)) return { by: 'built' }
  if (levelTonight(save, station)) return { by: 'tonight', level: stationLevel(save, station) + 1 }
  const next = nextStationLevel(save, station)
  if (!next) return { by: 'top' }
  if (farmRankOf(save.farm.points) < next.farmRank) return { by: 'farm-rank', rank: next.farmRank }
  return save.gold < next.cost ? { by: 'gold', short: next.cost - save.gold } : null
}
/** A level's lock in the player's words: "Build it first", "Level 3 tomorrow", "At its top level", "Opens at Farm Rank 4",
 * "Need 400g more"; null when it can be bought. */
export function levelLockWords(lock: LevelLock | null): string | null {
  if (!lock) return null
  switch (lock.by) {
    case 'built': return 'Build it first'
    case 'tonight': return `Level ${lock.level} tomorrow`
    case 'top': return 'At its top level'
    case 'farm-rank': return `Opens at Farm Rank ${lock.rank}`
    case 'gold': return `Need ${lock.short.toLocaleString('en-US')}g more`
  }
}

/** Buys a station's next level: its gold now, and the level (a load more a day) the next morning, as a build stands
 * (`farm.builds`, night step 8). Takes no action. Refused with the lock's words: not built, a level bought today or at
 * its top (`bad-job`), its Farm Rank (`locked`), gold short (`no-gold`). Never stamps. */
export function upgradeStation<S extends FarmSave>(save: S, station: StationId): S {
  const lock = levelLock(save, station)
  if (lock) {
    const reason = lock.by === 'farm-rank' ? 'locked' : lock.by === 'gold' ? 'no-gold' : 'bad-job'
    throw new SaveRuleError(reason, `${levelLockWords(lock)!}.`)
  }
  const paid = spendGold(save, nextStationLevel(save, station)!.cost)
  return { ...paid, farm: { ...paid.farm, builds: [...paid.farm.builds, station] } }
}

// --- A load ----------------------------------------------------------------------------------------------------------

/** One thing a station can make now: its job, the output at the input's stars, the input and how many are held. */
export interface StationOption {
  job: StationJobId
  /** The load's item: `<output>@<stars>`. */
  item: string
  output: string
  input: string
  stars: number
  held: number
  units: number
  available: number
}

const byInput = new Map<string, Good[]>()
for (const good of CATALOGUE) if (good.input) {
  const options = byInput.get(good.input)
  if (options) options.push(good)
  else byInput.set(good.input, [good])
}

export function stationRecipes(station: StationId, level = STATION_MAX_LEVEL): Good[] {
  return CATALOGUE.filter((good) => {
    const job = stationJobOf(good.id)
    return job !== null && STATION_JOBS[job].station === station && stationJobLevel(good.id) <= level
  })
}

/** What a station's jobs can take from the Warehouse now, job by job in the stations' order, then by grade and
 * stars. */
export function stationOptions(save: Pick<FarmSave, 'items'> & Partial<Pick<FarmSave, 'buildings' | 'farm'>>, station: StationId): StationOption[] {
  const out: StationOption[] = []
  const level = save.buildings?.[station] ?? STATION_MAX_LEVEL
  for (const [input, row] of Object.entries(save.items)) {
    for (const { id: output } of byInput.get(input) ?? []) {
      const job = stationJobOf(output)
      if (!job || STATION_JOBS[job].station !== station || stationJobLevel(output) > level) continue
      const units = stationJobUnits(output)
      row.forEach((held, i) => {
        if (held >= units) out.push({ job, item: `${output}@${i + 1}`, output, input, stars: i + 1, held, units,
          available: Math.min(held, availableStock(save, input)) })
      })
    }
  }
  const order = (o: StationOption) => [STATION_JOB_IDS.indexOf(o.job), goodOf(o.input)!.family, goodOf(o.input)!.grade, o.stars] as const
  return out.sort((a, b) => {
    const [ja, fa, ga, sa] = order(a)
    const [jb, fb, gb, sb] = order(b)
    return ja - jb || fa.localeCompare(fb) || ga - gb || sa - sb
  })
}

export function setStationPlan<S extends FarmSave>(save: S, station: StationId, targets: readonly StationTarget[]): S {
  const offered = new Set(stationRecipes(station, stationLevel(save, station)).map((good) => good.id))
  if (targets.length > MAX_STATION_TARGETS || new Set(targets.map((entry) => entry.output)).size !== targets.length
    || targets.some(({ output, target }) => !offered.has(output) || !Number.isInteger(target) || target < 1 || target > MAX_PRODUCTION_TARGET)) {
    throw new SaveRuleError('bad-count', 'Choose up to six different unlocked outputs, each with a target from 1 to 99.')
  }
  const stationPlans = { ...save.farm.stationPlans }
  if (targets.length > 0) stationPlans[station] = targets.map((entry) => ({ ...entry }))
  else delete stationPlans[station]
  return { ...save, farm: { ...save.farm, stationPlans } }
}

export function nextStationLoad(save: FarmSave, station: StationId, size: number): { option: StationOption; batches: number; target?: number } | null {
  if (loadsLeft(save, station) === 0) return null
  const options = stationOptions(save, station).filter((o) => o.available >= o.units).sort((a, b) => b.available - a.available)
  const plan = save.farm.stationPlans?.[station]
  if (!plan) {
    const option = options[0]
    return option ? { option, batches: Math.floor(Math.min(size, option.available) / option.units) } : null
  }
  for (const { output, target } of plan) {
    const queued = loadsToday(save, station).reduce((sum, load) => sum + (parseStockKey(load.item)?.id === output ? load.count : 0), 0)
    const remaining = target - queued - goodCount(save.items, output)
    if (remaining <= 0) continue
    const option = options.find((row) => row.output === output)
    if (option) return { option, target: remaining, batches: Math.min(remaining, Math.floor(Math.min(size, option.available) / option.units)) }
  }
  return null
}

/** Starts a load: one action, `count` (1–8) of an output at its stars (`<output>@<stars>`), each taking one of its raw
 * good at the same stars now. Refused before the station is built (`locked`), once it holds its loads for the day (one
 * a level: `busy`), for an output it doesn't make (`bad-job`), a count outside 1–8 (`bad-count`) and when the Warehouse
 * is short (`no-items`). */
export function startLoad<S extends FarmSave>(save: S, station: StationId, item: string, count: number, useReserved = false): S {
  if (!stationBuilt(save, station)) throw new SaveRuleError('locked', 'Build it first.')
  if (loadsLeft(save, station) === 0) throw new SaveRuleError('busy', 'It’s busy until morning.')
  const at = parseStockKey(item)
  const input = at ? goodOf(at.id)?.input : null
  const job = at ? stationJobOf(at.id) : null
  if (!at || !input || !job || STATION_JOBS[job].station !== station) throw new SaveRuleError('bad-job', 'It doesn’t make that.')
  if (stationJobLevel(at.id) > stationLevel(save, station)) throw new SaveRuleError('locked', `Opens at station level ${stationJobLevel(at.id)}.`)
  const units = stationJobUnits(at.id)
  const most = Math.floor(LOAD_SIZE / units)
  if (!Number.isInteger(count) || count < 1 || count > most) throw new SaveRuleError('bad-count', `A load is 1 to ${most}.`)
  const inputs = count * units
  if ((save.items[input]?.[at.stars - 1] ?? 0) < inputs) throw new SaveRuleError('no-items', 'Not enough in the Warehouse.')
  if (!useReserved && availableStock(save, input) < inputs) throw new SaveRuleError('locked', 'That input is reserved.')
  return loadAt(spend(save, 'load'), station, item, inputs, count)
}

/** A load itself, spending nothing, checked by its caller: `inputs` of the raw good leave the Warehouse now, and `out` of
 * the output at its stars come in the next morning (a farmhand's yield can bring more out than goes in). It joins the
 * station's loads today. */
export function loadAt<S extends FarmSave>(save: S, station: StationId, item: string, inputs: number, out: number): S {
  const at = parseStockKey(item)!
  const input = goodOf(at.id)!.input!
  return { ...save, items: takeGoods(save.items, input, at.stars, inputs), loads: { ...save.loads, [station]: [...loadsToday(save, station), { item, count: out }] } }
}

/** A load done overnight: where, what and how many. */
export interface LoadDone {
  station: StationId
  item: string
  count: number
}

/** Night step 4: every load started today is done: its goods into the Warehouse at their stars, and the station free for
 * the morning. In the stations' order, each station's in the order started. */
export function finishLoads<S extends FarmSave>(save: S): { save: S; done: LoadDone[] } {
  const done: LoadDone[] = []
  let next = save
  for (const station of STATIONS) {
    for (const load of loadsToday(save, station)) {
      const at = parseStockKey(load.item)
      if (!at) continue
      next = discoverOutput({ ...next, items: addGoods(next.items, at.id, at.stars, load.count) }, at.id)
      done.push({ station, item: load.item, count: load.count })
    }
  }
  return { save: Object.keys(save.loads).length === 0 ? next : { ...next, loads: {} }, done }
}
