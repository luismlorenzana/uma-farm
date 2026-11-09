// The Fields as the screens show them (F20 decision 11): four block cards, a locked one with its Farm Rank and cost, an
// owned one with its tender and its 3 × 3 plots (a crop's icon, the nights left, or Ready), the seeds that plant today,
// and the quick look's lines. Pure, so the page, the map and the tests read the same. Loaded with the loop's screens.
import {
  BLOCK_IDS, BLOCK_RULES, blockGrowth, blockOf, CROPS, dateOf, growsIn, isSeasonEnd, itemNameOf, nightsLeft, opened, RANKS, readyAt, SEASON_NAMES,
  seedsInSeason, type BlockId, type CropId, type Plot, type SaveV3, type Season,
} from '@farm/domain'

export type PlotState = 'empty' | 'growing' | 'ready'

export interface PlotView {
  index: number
  crop: CropId | null
  state: PlotState
  /** Nights left at the block's growth now; 0 when empty or Ready. */
  nights: number
  /** Growth toward Ready, 0–1. */
  progress: number
  own: boolean
  regrowing: boolean
  /** It's the season's last day, it won't be Ready by the morning, and it doesn't grow next season: it withers tonight. */
  withers: boolean
  /** "Carrot, Ready in 2 nights": the plot's VoiceOver line. */
  label: string
}

export interface OwnedBlock {
  id: BlockId
  owned: true
  tender: string | null
  /** Its growth tonight: 1 untended, the tender's rate tended. */
  growth: number
  plots: PlotView[]
  ready: number
  empty: number
  growing: number
}

export interface LockedBlock {
  id: BlockId
  owned: false
  cost: number
  /** "Farm Rank 2". */
  opens: string
  /** Its Farm Rank is reached, so it's for sale. */
  open: boolean
  /** Gold short of its cost; 0 when the farm can pay. */
  short: number
}

export type BlockView = OwnedBlock | LockedBlock

/** "Ready tomorrow", "Ready in 3 nights". */
export const nightsWords = (nights: number): string => (nights <= 1 ? 'Ready tomorrow' : `Ready in ${nights} nights`)
/** "1.25 a night". */
export const growthWords = (growth: number): string => `${Number(growth.toFixed(4))} a night`

/** The season after tonight when tonight is a season's last night, else null. */
const lastNight = (day: number): Season | null => (isSeasonEnd(day) ? dateOf(day + 1).season : null)

function plotView(plot: Plot, index: number, growth: number, next: Season | null): PlotView {
  const base = { index, own: plot.own, regrowing: plot.regrowing, withers: false }
  if (plot.crop === null) return { ...base, crop: null, state: 'empty', nights: 0, progress: 0, own: false, regrowing: false, label: `Plot ${index + 1}, empty` }
  const name = itemNameOf(plot.crop)
  if (plot.ready) return { ...base, crop: plot.crop, state: 'ready', nights: 0, progress: 1, label: `Plot ${index + 1}, ${name}, Ready` }
  const nights = nightsLeft(plot, growth)
  const withers = next !== null && nights > 1 && !growsIn(plot.crop, next)
  return {
    ...base, crop: plot.crop, state: 'growing', nights, progress: Math.min(1, plot.growth / readyAt(plot.crop, plot.regrowing)), withers,
    label: `Plot ${index + 1}, ${name}, ${withers ? 'withers tonight' : nightsWords(nights)}`,
  }
}

/** The four blocks, A to D. */
export function fieldsView(save: SaveV3): BlockView[] {
  return BLOCK_IDS.map((id): BlockView => {
    const block = blockOf(save, id)
    if (!block) {
      const rule = BLOCK_RULES[id]
      return {
        id, owned: false, cost: rule.cost, opens: rule.opens.by === 'farm-rank' ? `Farm Rank ${rule.opens.rank}` : 'Day 1', open: opened(save, rule.opens),
        short: Math.max(0, rule.cost - save.gold),
      }
    }
    const growth = blockGrowth(save, id)
    const next = lastNight(save.calendar.day)
    const plots = block.plots.map((plot, i) => plotView(plot, i, growth, next))
    return {
      id, owned: true, tender: block.tender, growth, plots, ready: plots.filter((p) => p.state === 'ready').length,
      empty: plots.filter((p) => p.state === 'empty').length, growing: plots.filter((p) => p.state === 'growing').length,
    }
  })
}

/** A plot on a block, by its key `A.4`, or null. */
export function plotKey(key: string | null): { block: BlockId; index: number } | null {
  const m = key ? /^([ABCD])(?:\.([0-8]))?$/.exec(key) : null
  return m ? { block: m[1] as BlockId, index: m[2] === undefined ? -1 : Number(m[2]) } : null
}

/** A seed to plant: one id (own or the shop's) for a plot, or a crop with every seed of it for Plant all. */
export interface SeedOption {
  key: string
  /** The seed id whose icon and name it shows. */
  id: string
  crop: CropId
  name: string
  count: number
}

/** The seeds that plant today: for one plot each id, own seeds first; for Plant all each crop, its seeds added up. */
export function seedOptions(save: SaveV3, all: boolean): SeedOption[] {
  const held = seedsInSeason(save)
  if (!all) return held.map((s) => ({ key: s.id, id: s.id, crop: s.crop, name: `${itemNameOf(s.crop)}${s.own ? ' (own)' : ''}`, count: s.count }))
  const crops = [...new Set(held.map((s) => s.crop))]
  return crops.map((crop) => {
    const of = held.filter((s) => s.crop === crop)
    return { key: crop, id: of[0]!.id, crop, name: itemNameOf(crop), count: of.reduce((n, s) => n + s.count, 0) }
  })
}

/** "No seeds for Spring." */
export const noSeedsWords = (save: Pick<SaveV3, 'calendar'>): string => `No seeds for ${SEASON_NAMES[dateOf(save.calendar.day).season]}.`

/** A crop's facts for a growing plot's sheet: "Regrows every 3 days" and its yield. */
export function cropFacts(crop: CropId): string[] {
  const c = CROPS[crop]
  return [`${c.yield} a plot`, ...(c.regrows !== null ? [`Regrows every ${c.regrows} days`] : [])]
}

/** The tender's rank in farming: "Novice". F21 adds her talent. */
export const tenderRank = (save: SaveV3, outfitId: string): string => RANKS[save.roster[outfitId]?.ranks.farming.rank ?? 0]

/** The quick look's line for a block: "9 growing · 3 ready", "Empty", or what opens a locked one. */
export function blockLine(block: BlockView): string {
  if (!block.owned) return `${block.opens} · ${block.cost.toLocaleString('en-US')}g`
  const parts = [...(block.growing > 0 ? [`${block.growing} growing`] : []), ...(block.ready > 0 ? [`${block.ready} ready`] : [])]
  if (parts.length === 0) return 'Empty'
  const soonest = block.plots.filter((p) => p.state === 'growing').reduce((n, p) => Math.min(n, p.nights), Infinity)
  return block.ready === 0 && Number.isFinite(soonest) ? `${parts.join(' · ')} · ${nightsWords(soonest).toLowerCase()}` : parts.join(' · ')
}
