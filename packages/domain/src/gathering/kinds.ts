// The loop's work kinds: foraging an area, fishing a spot, and
// the stations' six jobs, on uma-work's day clock. A gathering job is days, its haul planned when it starts: each day's
// items by the bond rule with her rank, talent, tool and well-fed days as they stand then, their goods and stars drawn
// from the account and the day, so the same save always plans the same haul. A station job is items, its inputs taken
// at the start and its stars carried through. Talents aren't saved, so the kinds close over the app's `talentOf` (the
// night's `NightContext.talentOf`, the app's `talentsFor(view)`): `loopKinds(talentOf)`. Loaded with the screens and
// the night.
import { payItems, refuse, workRefusal, type PayContext, type PlannedItem, type Refusal, type WorkKindRules, type WorkOutput } from '@luismlorenzana/uma-work'
import { DAY_MS, dateOf } from '../farm/calendar'
import { draw } from '../farm/draw'
import { PLACE_ACTIVITY, rankBenefits, rankQuality, countChallenge } from '../farm/rank-rules'
import { RANKS, type Activity, type Rank } from '../farm/ranks'
import { countRound } from '../farm/round'
import { talentQuality, talentsD, talentYield, type TalentOf, type TalentStep } from '../farm/talents'
import { goodOf } from '../goods/ids'
import { starPrice } from '../goods/prices'
import { drawStars, quality, toolQuality, WELL_FED_QUALITY } from '../goods/stars'
import type { LoopKind, LoopKinds, LoopPlaceId } from '../save/parse-v3'
import type { LoopWorkRequest, OutfitId, SaveV3, ToolId } from '../save/v3'
import { parseStockKey, stockKey } from '../save/warehouse'
import type { LoopWorld } from '../work/loop-env'
import { keepsakeQuality, type PerkPack } from '../romance/perk-terms'
import {
  FISHING_SPOTS, FOREST_AREAS, LOOP_REQUESTS, MAX_GATHER_DAYS, MAX_STATION_ITEMS, STATION_JOB_IDS, STATION_JOBS, stationJobOf, type FishingSpotId,
  type ForestAreaId, type StationId, type StationJobId,
} from './ids'
import { FISH_SIZES, FISHERY, FOREST, HAUL_BASE, STATION_JOB_RULES, STATION_RATE, TOOL_YIELD, WELL_FED_YIELD, type Share } from './tables'
import type { FarmSave } from '../save/v4'

const DAY_S = DAY_MS / 1000

/** The gathering places and their kinds. */
export type GatherPlace = 'forest' | 'fishery'
export const GATHER_KIND: Readonly<Record<GatherPlace, 'forage' | 'fish'>> = { forest: 'forage', fishery: 'fish' }
/** The tool each gathering place uses: the Axe, the Rod. */
export const GATHER_TOOL: Readonly<Record<GatherPlace, ToolId>> = { forest: 'axe', fishery: 'rod' }
/** The lifetime counters of what each gathering place brought home (chapter 1's goal 3). */
export const HOME_COUNT: Readonly<Record<GatherPlace, string>> = { forest: 'home:forest', fishery: 'home:fishery' }

/** The farm day a moment on the work clock falls in. */
export const dayAt = (now: number): number => Math.floor(now / DAY_MS) + 1

/** What lifts her work in an activity: her rank, talent, the tool's tier (1 where none applies) and her well-fed days; on
 * save v4 her keepsake's quality at her line's place, 0 or absent anywhere else. */
export interface WorkTerms {
  rank: Rank
  talent: TalentStep
  tool: number
  wellFed: number
  keepsake?: number
}

/** Her terms in an activity on this save, or null when she isn't on the roster. */
export function termsOf(save: FarmSave, outfitId: OutfitId, activity: Activity, talentOf: TalentOf, tool: ToolId | null): WorkTerms | null {
  const uma = save.roster[outfitId]
  if (!uma) return null
  return { rank: uma.ranks[activity].rank, talent: talentOf(outfitId, activity), tool: tool ? save.tools[tool] : 1, wellFed: uma.wellFed }
}

/** `n` items' seconds over one day, whole and adding up to exactly 86,400, so the day's last item ends at the morning. */
export function daySeconds(n: number): number[] {
  const base = Math.floor(DAY_S / n)
  const extra = DAY_S - base * n
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0))
}

/** The good a draw `u` in [0, 1) lands on, by the shares' percents. */
export function pickShare(shares: readonly Share[], u: number): string {
  const total = shares.reduce((sum, [, p]) => sum + p, 0)
  let at = u * total
  for (const [good, p] of shares) {
    if (at < p) return good
    at -= p
  }
  return shares.at(-1)![0]
}

// --- What a day of gathering brings home -----------------------------------------------------------------

/** Items on day `k` of a gathering job (0 its first): `round(base × rank × talent × tool × well fed)`, never below 1.
 * Bonds (×1.1) come later. */
export function haulCount(place: GatherPlace, terms: WorkTerms, k = 0): number {
  return countRound(HAUL_BASE[place] * rankBenefits(terms.rank).yield * talentYield(terms.talent) * TOOL_YIELD[terms.tool - 1]! * (k < terms.wellFed ? WELL_FED_YIELD : 1))
}

/** A gathered good's quality points: 0.5 × her rank, her talent's points, the tool's +0.25 a tier, well fed +0.25;
 * on v4 her keepsake at her line's place. */
export function gatherQuality(terms: WorkTerms, fed: boolean): number {
  return quality({
    rank: rankQuality(terms.rank), talent: talentQuality(terms.talent), tool: toolQuality(terms.tool), ...(fed ? { boost: WELL_FED_QUALITY } : {}),
    ...(terms.keepsake ? { keepsake: terms.keepsake } : {}),
  })
}

/** Her keepsake's quality on her work at a place: a v4 save with the pack only; 0 on v3. */
export const keepsakeAt = (save: FarmSave, story: PerkPack | null, outfitId: OutfitId, place: string): number =>
  save.version === 4 && story ? keepsakeQuality(save, story, outfitId, place) : 0

/** Why she can't work an area or a spot yet, or null when she can: her rank ("From Hand"), and the sea's
 * chapter 7 and boat. */
export function placeLock(save: Pick<FarmSave, 'farm' | 'buildings'>, place: GatherPlace, where: string, rank: Rank): Refusal | null {
  if (place === 'forest') {
    const area = FOREST[where as ForestAreaId]
    if (!area) return workRefusal('not-here')
    return rank < area.opens ? refuse('locked', 'Opens at {rank}.', { rank: RANKS[area.opens] }) : null
  }
  const spot = FISHERY[where as FishingSpotId]
  if (!spot) return workRefusal('not-here')
  if (spot.chapter !== null && save.farm.chapter < spot.chapter) return refuse('locked', 'Opens with Chapter {chapter}.', { chapter: spot.chapter })
  if (spot.boat && (save.buildings.boat ?? 0) < 1) return refuse('locked', 'Needs the boat.')
  return rank < spot.opens ? refuse('locked', 'Opens at {rank}.', { rank: RANKS[spot.opens] }) : null
}

/** An area's or a spot's goods and shares on a day. */
export const sharesOn = (place: GatherPlace, where: string, day: number): readonly Share[] =>
  (place === 'forest' ? FOREST[where as ForestAreaId] : FISHERY[where as FishingSpotId]).seasons[dateOf(day).season]

/** A gathering job's plan: each day's items by the bond rule at her terms now, each good and its stars drawn with
 * `draw(uid, day, '<place>:<slot>:<n>', 0 | 1)`, the day's seconds adding up to 86,400. On save v4 with the pack her
 * keepsake lifts the stars at her line's place. */
export function planHaul(save: FarmSave, outfitId: OutfitId, place: GatherPlace, request: LoopWorkRequest, now: number, slot: number, talentOf: TalentOf, story: PerkPack | null = null): PlannedItem[] | Refusal {
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > MAX_GATHER_DAYS) return refuse('count', 'A job is 1 to {max} days.', { max: MAX_GATHER_DAYS })
  const found = termsOf(save, outfitId, PLACE_ACTIVITY[place], talentOf, GATHER_TOOL[place])
  if (!found) return workRefusal('unknown-worker', { uma: outfitId })
  const keepsake = keepsakeAt(save, story, outfitId, place)
  const terms: WorkTerms = keepsake > 0 ? { ...found, keepsake } : found
  const lock = placeLock(save, place, request.item, terms.rank)
  if (lock) return lock
  const start = dayAt(now)
  const items: PlannedItem[] = []
  for (let k = 0; k < request.count; k++) {
    const day = start + k
    const shares = sharesOn(place, request.item, day)
    const fed = k < terms.wellFed
    const q = gatherQuality(terms, fed)
    const seconds = daySeconds(haulCount(place, terms, k))
    seconds.forEach((s, n) => {
      const what = `${place}:${slot}:${n}`
      const good = pickShare(shares, draw(save.account.uid, day, what, 0))
      items.push({ seconds: s, inputs: [], output: { item: stockKey(good, drawStars(q, draw(save.account.uid, day, what, 1))) }, exp: 0 })
    })
  }
  return items
}

/** Her haul a day over `days` days from `now` at a place, at her terms now: the job sheet's sizes and "about 5 a day". */
export function haulDays(save: FarmSave, outfitId: OutfitId, place: GatherPlace, talentOf: TalentOf, days = MAX_GATHER_DAYS): number[] {
  const terms = termsOf(save, outfitId, PLACE_ACTIVITY[place], talentOf, GATHER_TOOL[place])
  return terms ? Array.from({ length: days }, (_, k) => haulCount(place, terms, k)) : []
}

// --- A catch's size --------------------------------------------------------------------------------

/** How much her catch leans big: `k = 1 + 0.25 × rank + 0.1 × talent step + 0.05 × Rod tier`. */
export const sizeSkill = (terms: Pick<WorkTerms, 'rank' | 'talent' | 'tool'>): number => 1 + 0.25 * terms.rank + 0.1 * terms.talent + 0.05 * terms.tool

/** A fish's size in cm, to a tenth: `min + (max − min) × u^(8/k)`. */
export function fishSize(fish: string, k: number, u: number): number {
  const range = FISH_SIZES[fish]
  if (!range) throw new RangeError(`${fish} isn't a fish`)
  const [min, max] = range
  return Math.round((min + (max - min) * u ** (8 / k)) * 10) / 10
}

/** The Diary's record for a fish: the biggest caught, in cm. */
export const sizeRecord = (fish: string): string => `size:${fish}`

/** A catch measured at a collect. */
export interface Measured {
  fish: string
  stars: number
  cm: number
  /** The biggest of its kind so far. */
  record: boolean
}

/** What a gathering pay tells the screen: the place, what came home, and each fish's size. */
export interface HaulDetail {
  place: GatherPlace
  items: string[]
  sizes: Measured[]
}

/**
 * Pays a haul: its starred goods into the Warehouse, `farm.counts['home:<place>']` up by the items, and each
 * fish measured, seeded by the account, the collect's day, the Uma and the fish's place in the farm's catches (that count
 * before it), so the same collect always measures the same; the biggest of each kind is kept in `diary.records`. Her
 * rank, talent and Rod at the collect set the sizes.
 */
function payHaul(place: GatherPlace, talentOf: TalentOf) {
  return <T extends LoopWorld>(state: T, outfitId: string, outputs: readonly WorkOutput[], context: PayContext<LoopWorld>): { state: T; detail: HaulDetail } => {
    const paid = payItems(state, outfitId, outputs, context).state
    const save = paid.save
    const items = outputs.map((o) => ('item' in o ? o.item : ''))
    const key = HOME_COUNT[place]
    const before = save.farm.counts[key] ?? 0
    const sizes: Measured[] = []
    let records = save.diary.records
    if (place === 'fishery') {
      const terms = termsOf(save, outfitId, 'fishing', talentOf, 'rod')
      const k = sizeSkill(terms ?? { rank: 0, talent: 3, tool: 1 })
      const day = dayAt(context.now)
      items.forEach((item, i) => {
        const at = parseStockKey(item)
        if (!at || !FISH_SIZES[at.id]) return
        const cm = fishSize(at.id, k, draw(save.account.uid, day, `size:${outfitId}`, before + i))
        const best = records[sizeRecord(at.id)] ?? 0
        if (cm > best) records = { ...records, [sizeRecord(at.id)]: cm }
        sizes.push({ fish: at.id, stars: at.stars, cm, record: cm > best })
      })
    }
    const next: FarmSave = { ...save, farm: { ...save.farm, counts: { ...save.farm.counts, [key]: before + items.length } }, diary: { ...save.diary, records } }
    return { state: { ...paid, save: next }, detail: { place, items, sizes } }
  }
}

function gatherRules(place: GatherPlace, talentOf: TalentOf, story: PerkPack | null): WorkKindRules<LoopWorld> {
  return {
    // A request is days; the items it makes are the haul, well past a Legend's four days.
    maxItems: MAX_STATION_ITEMS,
    plan: (world, outfitId, request, now, context) =>
      (context.slot.building !== place ? workRefusal('not-here') : planHaul(world.save, outfitId, place, request, now, context.slot.slot, talentOf, story)),
    pay: payHaul(place, talentOf),
  }
}

// --- The stations ----------------------------------------------------------------------------------

/** Whether a station is built (1 or more). */
export const stationBuilt = (save: Pick<FarmSave, 'buildings'>, station: StationId): boolean => (save.buildings[station] ?? -1) >= 1

/** Items she turns on day `k` of a station job: `round(8 × rank × talent × well fed)` in the station's activity; a
 * multi-day job (the preserves) gains its well-fed time at night instead. */
export function stationRate(terms: WorkTerms, k: number, multiDay: boolean): number {
  return countRound(STATION_RATE * rankBenefits(terms.rank).yield * talentYield(terms.talent) * (!multiDay && k < terms.wellFed ? WELL_FED_YIELD : 1))
}

/** How a station job's `count` items fall over its days: a 1-day job fills each day at that day's rate; a longer one (the
 * preserves, 2) runs at least its days on its batch. */
export function stationDays(job: StationJobId, terms: WorkTerms, count: number): number[] {
  const { days } = STATION_JOB_RULES[job]
  if (days === 1) {
    const out: number[] = []
    for (let left = count, k = 0; left > 0; k++) {
      const n = Math.min(left, stationRate(terms, k, false))
      out.push(n)
      left -= n
    }
    return out
  }
  const total = Math.max(days, Math.ceil(count / stationRate(terms, 0, true)))
  return Array.from({ length: total }, (_, k) => Math.floor((count * (k + 1)) / total) - Math.floor((count * k) / total))
}

/** `count` items' seconds over `days` days, whole and adding up to exactly that many days. */
function spread(count: number, days: number): number[] {
  const total = days * DAY_S
  return Array.from({ length: count }, (_, i) => Math.floor((total * (i + 1)) / count) - Math.floor((total * i) / count))
}

/** A station job's plan: one input of its raw good at the output's stars for each item, taken at the start;
 * its days by her rate. */
export function planStation(save: FarmSave, outfitId: OutfitId, job: StationJobId, request: LoopWorkRequest, building: string, talentOf: TalentOf): PlannedItem[] | Refusal {
  const { station } = STATION_JOBS[job]
  const { days } = STATION_JOB_RULES[job]
  if (building !== station) return workRefusal('not-here')
  if (!stationBuilt(save, station)) return refuse('locked', 'Build it first.')
  const at = parseStockKey(request.item)
  const input = at ? goodOf(at.id)?.input : null
  if (!at || !input || stationJobOf(at.id) !== job) return workRefusal('not-here')
  if (!Number.isInteger(request.count) || request.count < 1 || request.count > MAX_STATION_ITEMS) return workRefusal('count', { max: MAX_STATION_ITEMS })
  const terms = termsOf(save, outfitId, PLACE_ACTIVITY[station], talentOf, null)
  if (!terms) return workRefusal('unknown-worker', { uma: outfitId })
  const perDay = stationDays(job, terms, request.count)
  const seconds = days === 1 ? perDay.flatMap(daySeconds) : spread(request.count, perDay.length)
  return seconds.map((s) => ({ seconds: s, inputs: [{ item: stockKey(input, at.stars), qty: 1 }], output: { item: request.item }, exp: 0 }))
}

/** Her day's rate at a station job now: the job sheet's sizes ("1 day · 8", "2 days · 16"). */
export function stationRates(save: FarmSave, outfitId: OutfitId, job: StationJobId, talentOf: TalentOf, days = 2): number[] {
  const terms = termsOf(save, outfitId, PLACE_ACTIVITY[STATION_JOBS[job].station], talentOf, null)
  const multi = STATION_JOB_RULES[job].days > 1
  return terms ? Array.from({ length: days }, (_, k) => stationRate(terms, k, multi)) : []
}

function stationRules(job: StationJobId, talentOf: TalentOf): WorkKindRules<LoopWorld> {
  return {
    maxItems: MAX_STATION_ITEMS,
    plan: (world, outfitId, request, _now, context) => planStation(world.save, outfitId, job, request, context.slot.building, talentOf),
    pay: payItems,
  }
}

// --- The registry ---------------------------------------------------------------------------------------------------

function build(talentOf: TalentOf, story: PerkPack | null): LoopKinds {
  const kind = (id: string, rules: WorkKindRules<LoopWorld>, multiDay: boolean): [string, LoopKind] => [id, { ...LOOP_REQUESTS[id]!, rules, multiDay }]
  return Object.fromEntries([
    kind('forage', gatherRules('forest', talentOf, story), false),
    kind('fish', gatherRules('fishery', talentOf, story), false),
    ...STATION_JOB_IDS.map((job) => kind(job, stationRules(job, talentOf), STATION_JOB_RULES[job].days > 1)),
  ])
}

const BY_TALENTS = new WeakMap<TalentOf, LoopKinds>()
const BY_STORY = new WeakMap<PerkPack, WeakMap<TalentOf, LoopKinds>>()
/** The loop's kinds with her talents read from `talentOf` (master data's, once a release): one registry a resolver, so
 * screens can memo on it. A v4 farm passes the story pack (her keepsake at her line's place lifts a haul's
 * stars as it's planned); without it, or on v3, the kinds plan as before. */
export function loopKinds(talentOf: TalentOf = talentsD, story: PerkPack | null = null): LoopKinds {
  let byTalents = BY_TALENTS
  if (story) {
    byTalents = BY_STORY.get(story) ?? new WeakMap<TalentOf, LoopKinds>()
    BY_STORY.set(story, byTalents)
  }
  let kinds = byTalents.get(talentOf)
  if (!kinds) {
    kinds = build(talentOf, story)
    byTalents.set(talentOf, kinds)
  }
  return kinds
}
/** The loop's kinds with everyone D: the default where no talents are passed (tests, readings). Pure, so the initial JS,
 * which imports the work modules for their readings, drops it with the tables and the rules. */
export const LOOP_KINDS: LoopKinds = /* @__PURE__ */ loopKinds()

// --- The night: what came in tonight -----------------------------------------------------------------

/** Items an entry finished tonight: who, where, the request and the goods (stock keys). */
export interface MadeTonight {
  outfitId: OutfitId
  place: LoopPlaceId
  request: LoopWorkRequest
  items: string[]
}

/** The night's best catch: the most valuable fish caught tonight (its price at its stars), more stars first on a tie. */
export interface BestCatch {
  id: string
  stars: number
}

/**
 * Counts tonight's gathering toward each Uma's next rank's challenge: her catches at a spot, her items in an area
 * (`countChallenge`, which reads only the challenge it's for). Before step 6, so a challenge met tonight ranks her up
 * tonight. Returns the night's best catch for the morning.
 */
export function haulsTonight<S extends FarmSave>(save: S, made: readonly MadeTonight[]): { save: S; best: BestCatch | null } {
  let next = save
  let best: BestCatch | null = null
  let bestValue = 0
  for (const m of made) {
    if (m.items.length === 0) continue
    if (m.request.kind === 'forage' && (FOREST_AREAS as readonly string[]).includes(m.request.item)) {
      next = countChallenge(next, m.outfitId, 'foraging', { kind: 'gather', area: m.request.item as ForestAreaId, items: m.items.length })
    }
    if (m.request.kind === 'fish' && (FISHING_SPOTS as readonly string[]).includes(m.request.item)) {
      next = countChallenge(next, m.outfitId, 'fishing', { kind: 'catch', spot: m.request.item as FishingSpotId, fish: m.items.length })
      for (const item of m.items) {
        const at = parseStockKey(item)
        if (!at) continue
        const value = starPrice(at.id, at.stars)
        if (value > bestValue || (value === bestValue && best !== null && at.stars > best.stars)) {
          best = { id: at.id, stars: at.stars }
          bestValue = value
        }
      }
    }
  }
  return { save: next, best }
}
