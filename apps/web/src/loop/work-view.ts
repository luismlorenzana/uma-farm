// The forest's, the Fishery's and the stations' screens as data: days in the kit's words,
// the What step's areas, spots and station options, the job sheet's sizes, a request's label, and a collect's words.
// Pure, so the pages and the tests read the same. Loaded with the loop's work screens.
import {
  ACTIVITY_NAMES, AREA_NAMES, DAY_MS, FISHING_SPOTS, FOREST, FOREST_AREAS, GATHER_KIND, goodName, goodOf, haulDays, MAX_GATHER_DAYS, MAX_STATION_ITEMS,
  PLACE_ACTIVITY, parseStockKey, placeLock, sharesOn, SPOT_NAMES, STATION_JOB_RULES, STATION_JOBS, stationJobOf, stationOptions, stationRates,
  type GatherPlace, type LoopCollected, type LoopPlaceId, type LoopWorkRequest, type FarmSave, type StationId, type StationJobId, type StationOption,
  type TalentOf,
} from '@farm/domain'
import type { DurationUse, RequestLabel, SizeRule, WorkWords } from '@luismlorenzana/uma-kit/work'
import { dayCount } from './words'

// --- Days in the kit's words ------------------------------------------------------------------------

/** Whole days in a span on the day clock, rounding a well-fed job's quarter days up. */
const daysIn = (ms: number): number => Math.max(0, Math.ceil(ms / DAY_MS - 1e-9))

/**
 * uma-kit 0.19.0's `formatDuration` on the farm's day clock: what's `left` on a running job ("Tomorrow", "In 2 days"), a
 * job's `length` ("1 day", "3 days") and how long `ago` a queue stopped ("today", "yesterday", "2 days ago"). The kit's
 * rows, sheets and chips never say "24h".
 */
export function dayWords(ms: number, use: DurationUse): string {
  const days = daysIn(ms)
  if (use === 'ago') return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  if (use === 'left') return days <= 1 ? 'Tomorrow' : `In ${days} days`
  return dayCount(Math.max(1, days))
}

/** The kit's words on the day clock: a stopped queue's line reads "Forest · stopped yesterday", not "stopped yesterday
 * ago", and a running card's voice says when it's ready. */
export const LOOP_WORK_WORDS: Partial<WorkWords> = {
  stoppedLine: '{place} · stopped {time}',
  cardRunning: '{uma}. {what}, {made} of {count} made. Ready: {left}.',
  workLevel: 'Rank',
}

// --- Names ------------------------------------------------------------------------------------------------------------

/** "Pine Log ★3" for a stock key, a good's name for an id. */
export function itemWords(key: string): string {
  const at = parseStockKey(key)
  return at ? `${goodName(at.id)} ★${at.stars}` : goodName(key)
}
/** "Woods", "Moon Pool": an area or a spot without its article. */
export const whereName = (place: GatherPlace, id: string): string =>
  (place === 'forest' ? AREA_NAMES[id as keyof typeof AREA_NAMES] : SPOT_NAMES[id as keyof typeof SPOT_NAMES])?.replace(/^the /, '') ?? id

/** A request as the kit's rows, queue chips and stopped cards name it: an area or a spot and its first good this season,
 * or a station's output at its stars. */
export function requestWords(request: LoopWorkRequest, day: number): RequestLabel {
  if (request.kind === 'forage' || request.kind === 'fish') {
    const place: GatherPlace = request.kind === 'forage' ? 'forest' : 'fishery'
    return { name: whereName(place, request.item), item: sharesOn(place, request.item, day)[0]?.[0] }
  }
  return { name: itemWords(request.item), item: request.item, count: request.count }
}

/** The place a work screen shows: a gathering place or a station. */
export type WorkPlaceId = GatherPlace | StationId
export const WORK_SCREENS: readonly WorkPlaceId[] = ['forest', 'fishery', 'mill', 'sawmill', 'smokehouse']
export const isWorkScreen = (id: string): id is WorkPlaceId => (WORK_SCREENS as readonly string[]).includes(id)
export const isGatherPlace = (id: string): id is GatherPlace => id === 'forest' || id === 'fishery'

/** The header's line: "Foraging · 4 slots". */
export const placeLine = (place: WorkPlaceId, slots: number): string => `${ACTIVITY_NAMES[PLACE_ACTIVITY[place as LoopPlaceId]]} · ${slots} slots`

// --- The What step: where to gather -----------------------------------------------------------------------

/** One area or spot in the What step: its goods this season, and why she can't go yet or how much she'd bring. */
export interface WhereRow {
  id: string
  name: string
  /** This season's goods, most common first. */
  goods: string[]
  /** "From Hand", "Chapter 7", or null when she can go. */
  lock: string | null
  /** "About 5 a day · G1–G2". */
  note: string
}

/** The What step's rows for a gathering place: every area or spot, those her rank hasn't opened greyed with the rank
 * that opens them, each with this season's goods and about how many she'd bring a day. */
export function whereRows(save: FarmSave, place: GatherPlace, outfitId: string | null, talentOf: TalentOf): WhereRow[] {
  const ids: readonly string[] = place === 'forest' ? FOREST_AREAS : FISHING_SPOTS
  const activity = PLACE_ACTIVITY[place]
  const rank = outfitId ? save.roster[outfitId]?.ranks[activity].rank ?? 0 : 0
  const perDay = outfitId ? haulDays(save, outfitId, place, talentOf, 1)[0] : undefined
  return ids.map((id) => {
    const refusal = placeLock(save, place, id, rank)
    const lock = refusal === null ? null : refusal.data?.chapter ? `Chapter ${refusal.data.chapter}` : refusal.data?.rank ? `From ${refusal.data.rank}` : 'Locked'
    const grades = place === 'forest' ? `G${FOREST[id as keyof typeof FOREST].grades.join('–G')}` : null
    const note = [perDay === undefined ? null : `About ${perDay} a day`, grades].filter(Boolean).join(' · ')
    return { id, name: whereName(place, id), goods: sharesOn(place, id, save.calendar.day).map(([good]) => good), lock, note }
  })
}

/** Where the sheet opens for her: the deepest place she can go. */
export function initialWhere(save: FarmSave, place: GatherPlace, outfitId: string | null, talentOf: TalentOf): string {
  const rows = whereRows(save, place, outfitId, talentOf)
  return (rows.filter((r) => r.lock === null).at(-1) ?? rows[0]!).id
}

// --- The job sheet's sizes -------------------------------------------------------------------------

/** A gathering job's sizes: her haul after 1, 2, 3 and 4 days ("×5 · 1 day", "×10 · 2 days"). The kit counts items, so
 * each size is the items those days bring, and `gatherRequest` turns it back into days. */
export function gatherSizes(save: FarmSave, place: GatherPlace, outfitId: string | null, talentOf: TalentOf): number[] {
  const days = outfitId ? haulDays(save, outfitId, place, talentOf, MAX_GATHER_DAYS) : []
  const per = days.length > 0 ? days : Array.from({ length: MAX_GATHER_DAYS }, () => 1)
  return per.map((_, i) => per.slice(0, i + 1).reduce((a, b) => a + b, 0))
}

/** The days a gathering size asks for: the fewest whose haul reaches it (1–4). */
export function daysFor(count: number, sizes: readonly number[]): number {
  const i = sizes.findIndex((n) => n >= count)
  return i === -1 ? MAX_GATHER_DAYS : i + 1
}

/** A gathering request from the kit's size: the area or spot and its days. */
export const gatherRequest = (place: GatherPlace, where: string, count: number, sizes: readonly number[]): LoopWorkRequest =>
  ({ kind: GATHER_KIND[place], item: where, count: daysFor(count, sizes) })

/** A gathering job's size rule for the kit: its four day sizes, the last the most. */
export function gatherSizeRule(sizes: readonly number[]): SizeRule {
  return { mode: 'duration', sizes, max: sizes.at(-1) ?? 1 }
}

/** A station job's sizes: a job's least days at her rate ("×8 · 1 day"), twice that ("×16 · 2 days"), and all
 * held ("×5"), at most 100. */
export function stationSizeRule(save: FarmSave, item: string, outfitId: string | null, talentOf: TalentOf): SizeRule | undefined {
  const at = parseStockKey(item)
  const job = at ? stationJobOf(at.id) : null
  const input = at ? goodOf(at.id)?.input : null
  if (!at || !job || !input) return undefined
  const held = save.items[input]?.[at.stars - 1] ?? 0
  const least = STATION_JOB_RULES[job].days
  const rates = outfitId ? stationRates(save, outfitId, job, talentOf, 2) : [8, 8]
  const batch = least > 1 ? rates[0]! * least : rates[0]!
  const twice = least > 1 ? batch * 2 : rates[0]! + rates[1]!
  const sizes = [...new Set([batch, twice, held].filter((n) => n >= 1).map((n) => Math.min(MAX_STATION_ITEMS, n)))].sort((a, b) => a - b)
  return { mode: 'duration', sizes, max: Math.min(MAX_STATION_ITEMS, Math.max(held, twice)) }
}

/** A station request from the kit's job (`<output>@<stars>`) and size. */
export const stationRequest = (item: string, count: number): LoopWorkRequest => ({ kind: stationJobOf(parseStockKey(item)?.id ?? '') ?? 'planks', item, count })

/** A station's What step: its jobs, each with what the Warehouse holds for it. */
export interface StationGroup {
  job: StationJobId
  name: string
  options: StationOption[]
}
export function stationGroups(save: FarmSave, station: StationId): StationGroup[] {
  const options = stationOptions(save, station)
  return (Object.keys(STATION_JOBS) as StationJobId[]).filter((job) => STATION_JOBS[job].station === station)
    .map((job) => ({ job, name: STATION_JOB_RULES[job].name, options: options.filter((o) => o.job === job) }))
}
/** What a station's jobs take, in words: "logs, mushrooms or herbs". */
export const STATION_TAKES: Readonly<Record<StationId, string>> = { mill: 'grain, sweets, nuts or fruit', sawmill: 'logs, mushrooms or herbs', smokehouse: 'fish' }

// --- A collect, in words ----------------------------------------------------------------------------------

/** "+5 · ★1 × 4, ★2 × 1", and a catch's biggest: "Carp 41.2 cm, a record". Nothing collected says nothing. */
export function haulWords(got: Pick<LoopCollected, 'goods' | 'sizes'>): string | null {
  if (got.goods.length === 0) return null
  const stars = [0, 0, 0, 0, 0]
  for (const key of got.goods) {
    const at = parseStockKey(key)
    if (at) stars[at.stars - 1]! += 1
  }
  const byStar = stars.flatMap((n, i) => (n > 0 ? [`★${i + 1} × ${n}`] : [])).join(', ')
  const biggest = [...got.sizes].sort((a, b) => Number(b.record) - Number(a.record) || b.cm - a.cm)[0]
  const size = biggest ? ` · ${goodName(biggest.fish)} ${biggest.cm.toFixed(1)} cm${biggest.record ? ', a record' : ''}` : ''
  return `+${got.goods.length} · ${byStar}${size}`
}

// --- Help ------------------------------------------------------------------------------------------------------------

/** How a place works, behind its (i). */
export function helpLines(place: WorkPlaceId): string[] {
  if (isGatherPlace(place)) {
    const what = place === 'forest' ? 'wood, mushrooms, herbs and the season’s finds' : 'fish, by the season'
    const opens = place === 'forest' ? 'Her foraging rank opens deeper areas (the Hills at Hand)' : 'Her fishing rank opens new spots (the River at Hand); the sea waits for chapter 7'
    return [
      `An Uma brings home ${what}: ${place === 'forest' ? 5 : 3} a day at Novice, more with her rank, talent and tools.`,
      `${opens}. Deeper places give better goods.`,
      'A job is 1 to 4 days. Each day’s haul is ready the next morning: collect it, or queue more days.',
      ...(place === 'fishery' ? ['Each fish is measured when you collect it; the Diary keeps the biggest.'] : []),
      `A day here earns ${ACTIVITY_NAMES[PLACE_ACTIVITY[place]].toLowerCase()} rank points.`,
    ]
  }
  return [
    `Turns ${STATION_TAKES[place]} into goods worth half again as much, one for one, keeping their stars.`,
    `8 a day at Novice, more with her ${ACTIVITY_NAMES[PLACE_ACTIVITY[place]].toLowerCase()} rank and talent. The inputs leave the Warehouse when the job starts.`,
    ...(place === 'mill' ? ['Preserves take at least 2 days.'] : []),
    `A day here earns ${ACTIVITY_NAMES[PLACE_ACTIVITY[place]].toLowerCase()} rank points.`,
  ]
}
