// The forest's and the Fishery's rules as an Uma works them: her terms in an activity (rank, talent, tool, well fed,
// keepsake), a day's haul by the bond rule, a gathered good's quality, where her rank reaches, and a catch's size. The
// Umas' multi-day jobs retired with the day of actions; these rules stay for what still reads an Uma's work (her line's
// goods and night chores, `romance/days.ts` and `perk-effects.ts`) and for the farmhands. The farmer's own hauls are
// `hauls.ts`. Talents aren't saved, so callers pass the app's `talentOf`.
import { dateOf } from '../farm/calendar'
import { placeBuilt } from '../farm/places'
import { draw } from '../farm/draw'
import { rankBenefits, rankQuality } from '../farm/rank-rules'
import { RANKS, type Activity, type Rank } from '../farm/ranks'
import { countRound } from '../farm/round'
import { talentQuality, talentYield, type TalentOf, type TalentStep } from '../farm/talents'
import { drawStars, quality, toolQuality, WELL_FED_QUALITY } from '../goods/stars'
import type { LoopPlaceId } from '../save/parse-v4'
import type { OutfitId, ToolId } from '../save/v4'
import { keepsakeQuality, type PerkPack } from '../romance/perk-terms'
import type { FishingSpotId, ForestAreaId, StationId } from './ids'
import { FISH_SIZES, FISHERY, FOREST, HAUL_BASE, STATION_RATE, TOOL_YIELD, WELL_FED_YIELD, type Share } from './tables'
import type { FarmSave } from '../save/v4'

/** The gathering places. */
export type GatherPlace = 'forest' | 'fishery'
/** The tool each gathering place uses: the Axe, the Rod. */
export const GATHER_TOOL: Readonly<Record<GatherPlace, ToolId>> = { forest: 'axe', fishery: 'rod' }
/** The lifetime counters of what each gathering place brought home. */
export const HOME_COUNT: Readonly<Record<GatherPlace, string>> = { forest: 'home:forest', fishery: 'home:fishery' }

/** What lifts her work in an activity: her rank, talent, the tool's tier (1 where none applies) and her well-fed days;
 * her keepsake's quality at her line's place, 0 or absent anywhere else. */
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

/** An Uma's items on day `k` of her gathering (0 its first): `round(base × rank × talent × tool × well fed)`, never
 * below 1. */
export function haulCount(place: GatherPlace, terms: WorkTerms, k = 0): number {
  return countRound(HAUL_BASE[place] * rankBenefits(terms.rank).yield * talentYield(terms.talent) * TOOL_YIELD[terms.tool - 1]! * (k < terms.wellFed ? WELL_FED_YIELD : 1))
}

/** A gathered good's quality points: 0.5 × her rank, her talent's points, the tool's +0.25 a tier, well fed +0.25;
 * her keepsake at her line's place. */
export function gatherQuality(terms: WorkTerms, fed: boolean): number {
  return quality({
    rank: rankQuality(terms.rank), talent: talentQuality(terms.talent), tool: toolQuality(terms.tool), ...(fed ? { boost: WELL_FED_QUALITY } : {}),
    ...(terms.keepsake ? { keepsake: terms.keepsake } : {}),
  })
}

/** Her keepsake's quality on her work at a place: with the pack only. */
export const keepsakeAt = (save: FarmSave, story: PerkPack | null, outfitId: OutfitId, place: string): number =>
  story ? keepsakeQuality(save, story, outfitId, place) : 0

/** Why an Uma can't work an area or a spot yet, in words, or null when she can: her rank ("Opens at Hand."), and the
 * sea's place built ("Needs the Dock.", "Needs the Boat."). */
export function placeLock(save: Pick<FarmSave, 'buildings'>, place: GatherPlace, where: string, rank: Rank): string | null {
  if (place === 'forest') {
    const area = FOREST[where as ForestAreaId]
    if (!area) return 'Not here.'
    return rank < area.opens ? `Opens at ${RANKS[area.opens]}.` : null
  }
  const spot = FISHERY[where as FishingSpotId]
  if (!spot) return 'Not here.'
  if (spot.needs !== null && !placeBuilt(save, spot.needs)) return `Needs the ${spot.needs === 'dock' ? 'Dock' : 'Boat'}.`
  return rank < spot.opens ? `Opens at ${RANKS[spot.opens]}.` : null
}

/** An area's or a spot's goods and shares on a day. */
export const sharesOn = (place: GatherPlace, where: string, day: number): readonly Share[] =>
  (place === 'forest' ? FOREST[where as ForestAreaId] : FISHERY[where as FishingSpotId]).seasons[dateOf(day).season]

// --- A catch's size --------------------------------------------------------------------------------

/** How much a catch leans big: `k = 1 + 0.25 × rank + 0.1 × talent step + 0.05 × Rod tier`. */
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

/** A catch, measured as it lands. */
export interface Measured {
  fish: string
  stars: number
  cm: number
  /** The biggest of its kind so far. */
  record: boolean
}

// --- The stations ----------------------------------------------------------------------------------

/** Whether a station is built (1 or more). */
export const stationBuilt = (save: Pick<FarmSave, 'buildings'>, station: StationId): boolean => (save.buildings[station] ?? -1) >= 1

/** Items an Uma turns at a station in a day: `round(8 × rank × talent × well fed)` in the station's activity. */
export function stationRate(terms: WorkTerms, k: number, multiDay: boolean): number {
  return countRound(STATION_RATE * rankBenefits(terms.rank).yield * talentYield(terms.talent) * (!multiDay && k < terms.wellFed ? WELL_FED_YIELD : 1))
}

// --- The night: what the Umas' work brought in tonight ------------------------------------------------

/** Items a farmhand's work brought in tonight: who, where (the Fields, a gathering place or a station) and the goods
 * (stock keys). The romance's night steps read it: side by side, the perks' extras and praise. */
export interface MadeTonight {
  outfitId: OutfitId
  place: WorkPlace
  items: string[]
}
/** Where an Uma works a day: the Fields, or one of the loop's work places. */
export type WorkPlace = LoopPlaceId | 'fields'

/** A seeded pick of a place's season's goods: `draw(uid, day, what, n)`. */
export const pickOn = (save: Pick<FarmSave, 'account' | 'calendar'>, place: GatherPlace, where: string, what: string, n: number): string =>
  pickShare(sharesOn(place, where, save.calendar.day), draw(save.account.uid, save.calendar.day, what, n))

/** A seeded star draw at quality `q`: `draw(uid, day, what, n)`. */
export const starsOn = (save: Pick<FarmSave, 'account' | 'calendar'>, q: number, what: string, n: number): number =>
  drawStars(q, draw(save.account.uid, save.calendar.day, what, n))
