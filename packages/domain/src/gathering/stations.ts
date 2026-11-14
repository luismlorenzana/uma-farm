// What a station's jobs can take from the Warehouse. A station is locked until built: the Farm Rank offers it, and it's
// built with gold and goods like every place (`farm/builds.ts`). Loaded with the screens.
import { goodOf, refinedOf } from '../goods/ids'
import { STATION_JOB_IDS, STATION_JOBS, stationJobOf, type StationId, type StationJobId } from './ids'
import type { FarmSave } from '../save/v4'

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
