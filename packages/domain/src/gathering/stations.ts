// Building a station, and what its jobs can take from the Warehouse. A
// station is locked until built: the Mill needs its plans (`buildings.mill` 0, chapter 1's reward), the Sawmill and
// the Smokehouse Farm Rank 3; building sets its level to 1 for its gold. Loaded with the screens.
import { farmRankOf } from '../farm/farm'
import { goodOf, refinedOf } from '../goods/ids'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import type { SaveV3 } from '../save/v3'
import { STATION_JOB_IDS, STATION_JOBS, stationJobOf, type StationId, type StationJobId } from './ids'
import { stationBuilt } from './kinds'
import { STATION_RULES } from './tables'
import type { FarmSave } from '../save/v4'

/** What stands between the farm and building a station: null when it can be built now. */
export type StationLock =
  | { by: 'built' }
  | { by: 'plans' }
  | { by: 'farm-rank'; rank: number }
  | { by: 'gold'; short: number }

/** Why a station can't be built now, or null when it can. */
export function stationLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'gold'>, station: StationId): StationLock | null {
  if (stationBuilt(save, station)) return { by: 'built' }
  const rule = STATION_RULES[station]
  if (rule.opens.by === 'plans' && save.buildings[station] !== 0) return { by: 'plans' }
  if (rule.opens.by === 'farm-rank' && farmRankOf(save.farm.points) < rule.opens.rank) return { by: 'farm-rank', rank: rule.opens.rank }
  return save.gold < rule.cost ? { by: 'gold', short: rule.cost - save.gold } : null
}

/** Builds a station: its level becomes 1 and its gold is spent. Refused while it's locked, and when it's
 * built already. Never stamps `updatedAt`: the app's action does. */
export function buildStation<S extends FarmSave>(save: S, station: StationId): S {
  const lock = stationLock(save, station)
  if (lock?.by === 'built') throw new SaveRuleError('bad-job', 'Built already.')
  if (lock?.by === 'plans') throw new SaveRuleError('locked', 'Needs the Mill’s plans: chapter 1’s reward.')
  if (lock?.by === 'farm-rank') throw new SaveRuleError('locked', `Opens at Farm Rank ${lock.rank}.`)
  return { ...spendGold(save, STATION_RULES[station].cost), buildings: { ...save.buildings, [station]: 1 } }
}

/** One thing a station can make now: its job, the output at the input's stars, the input and how many are held. */
export interface StationOption {
  job: StationJobId
  /** The request's item: `<output>@<stars>`. */
  item: string
  output: string
  input: string
  stars: number
  held: number
}

/** What a station's jobs can take from the Warehouse now, job by job in the stations' order, then by grade and
 * stars. */
export function stationOptions(save: Pick<FarmSave, 'items'>, station: StationId): StationOption[] {
  const out: StationOption[] = []
  for (const [input, row] of Object.entries(save.items)) {
    const output = refinedOf(input)
    const job = output ? stationJobOf(output) : null
    if (!output || !job || STATION_JOBS[job].station !== station) continue
    row.forEach((held, i) => {
      if (held > 0) out.push({ job, item: `${output}@${i + 1}`, output, input, stars: i + 1, held })
    })
  }
  const order = (o: StationOption) => [STATION_JOB_IDS.indexOf(o.job), goodOf(o.input)!.family, goodOf(o.input)!.grade, o.stars] as const
  return out.sort((a, b) => {
    const [ja, fa, ga, sa] = order(a)
    const [jb, fb, gb, sb] = order(b)
    return ja - jb || fa.localeCompare(fb) || ga - gb || sa - sb
  })
}
