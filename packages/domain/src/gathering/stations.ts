// The stations' loads. A station turns one raw good into its refined form, one for one, keeping its stars (the recipes
// are its jobs', `ids.ts`). One action starts a load of up to 8 of one good at one star: its inputs leave the Warehouse
// now, and it's ready the next morning, straight into the Warehouse (night step 4, `finishLoads`). A station holds one
// load a day. A station is locked until built: the Farm Rank offers it, and it's built with gold and goods like every
// place (`farm/builds.ts`). Loaded with the screens and the night.
import { spend } from '../farm/actions'
import { goodOf, refinedOf } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import type { FarmSave, StationLoad } from '../save/v4'
import { addGoods, parseStockKey, takeGoods } from '../save/warehouse'
import { STATION_JOB_IDS, STATION_JOBS, stationJobOf, STATIONS, type StationId, type StationJobId } from './ids'
import { stationBuilt } from './kinds'
import { STATION_RATE } from './tables'

/** The most a load takes: a Novice's day at a station. */
export const LOAD_SIZE = STATION_RATE

/** One thing a station can make now: its job, the output at the input's stars, the input and how many are held. */
export interface StationOption {
  job: StationJobId
  /** The load's item: `<output>@<stars>`. */
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

/** Starts a load: one action, `count` (1–8) of an output at its stars (`<output>@<stars>`), each taking one of its raw
 * good at the same stars now. Refused before the station is built (`locked`), while it holds today's load (`busy`), for
 * an output it doesn't make (`bad-job`), a count outside 1–8 (`bad-count`) and when the Warehouse is short
 * (`no-items`). */
export function startLoad<S extends FarmSave>(save: S, station: StationId, item: string, count: number): S {
  if (!stationBuilt(save, station)) throw new SaveRuleError('locked', 'Build it first.')
  if (save.loads[station]) throw new SaveRuleError('busy', 'It’s busy until morning.')
  const at = parseStockKey(item)
  const input = at ? goodOf(at.id)?.input : null
  const job = at ? stationJobOf(at.id) : null
  if (!at || !input || !job || STATION_JOBS[job].station !== station) throw new SaveRuleError('bad-job', 'It doesn’t make that.')
  if (!Number.isInteger(count) || count < 1 || count > LOAD_SIZE) throw new SaveRuleError('bad-count', `A load is 1 to ${LOAD_SIZE}.`)
  if ((save.items[input]?.[at.stars - 1] ?? 0) < count) throw new SaveRuleError('no-items', 'Not enough in the Warehouse.')
  const spent = spend(save, 'load')
  return { ...spent, items: takeGoods(spent.items, input, at.stars, count), loads: { ...spent.loads, [station]: { item, count } } }
}

/** A load done overnight: where, what and how many. */
export interface LoadDone {
  station: StationId
  item: string
  count: number
}

/** Night step 4: every load started today is done: its goods into the Warehouse at their stars, and the station free for
 * the morning. In the stations' order. */
export function finishLoads<S extends FarmSave>(save: S): { save: S; done: LoadDone[] } {
  const done: LoadDone[] = []
  let items = save.items
  for (const station of STATIONS) {
    const load: StationLoad | undefined = save.loads[station]
    const at = load ? parseStockKey(load.item) : null
    if (!load || !at) continue
    items = addGoods(items, at.id, at.stars, load.count)
    done.push({ station, item: load.item, count: load.count })
  }
  return { save: done.length === 0 && Object.keys(save.loads).length === 0 ? save : { ...save, items, loads: {} }, done }
}
