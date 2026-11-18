// The field's plots. The field is a list of plots, each 8 × 5 tiles: one page each on the field's screen. The farm starts
// with plot 1, the field it always had, and clears more as the Farm Rank rises:
//
//   plot 1   day 1: the field, its cleared patch of nine and the rest overgrown
//   plot 2   Farm Rank 3: cleared like a building, for its gold and an action. It opens at once, wild (weeds, stones and
//            stumps by the account's draw, no cleared patch), and its tiles are worked as plot 1's are
//   plot 3–8 Farm Rank 4, 5, 6, 7, 8 and 9, each after the one before, for more gold: up to 320 tiles of work
//
// A plot is land, not a building: it adds no upkeep (`farm/economy.ts` counts buildings, houses, beds and Umas). Plots
// open in order, each after the one before. Its tiles are worked by hand (`fields.ts`) and by the farmhands, whose field
// tasks name their plot (`farm/farmhands.ts`). Pure; never stamps.
import { actionsLeft, spend } from '../farm/actions'
import { needsWater } from './crops'
import { farmRankOf } from '../farm/farm'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { FIELD_COLUMNS, FIELD_ROWS, fieldTiles, isOvergrown, wildPlot, type FarmSave, type Tile } from '../save/v4'

/** What opens a plot: there from the start, or cleared from a Farm Rank for its gold and an action. */
export type PlotOpens = { by: 'start' } | { by: 'clear'; rank: number; gold: number }

/** The plots, in order: plot 1 from the start, plot 2 cleared from Farm Rank 3 for 2,500g and an action (about a Farm
 * Rank 3 station's gold, with no goods: it's the field hands' work that it asks for), then one a Farm Rank to plot 8 at
 * 9, each about that rank's places' gold: up to eight plots, 320 tiles, the farm's biggest employer at scale. */
export const FIELD_PLOTS: readonly PlotOpens[] = [
  { by: 'start' },
  { by: 'clear', rank: 3, gold: 2_500 },
  { by: 'clear', rank: 4, gold: 5_000 },
  { by: 'clear', rank: 5, gold: 10_000 },
  { by: 'clear', rank: 6, gold: 15_000 },
  { by: 'clear', rank: 7, gold: 25_000 },
  { by: 'clear', rank: 8, gold: 35_000 },
  { by: 'clear', rank: 9, gold: 50_000 },
]

/** A plot's name: "Plot 2". `plot` is its index, 0 for plot 1. */
export const plotName = (plot: number): string => `Plot ${plot + 1}`

/** The plots this save has cleared. */
export const plotsCleared = (save: Pick<FarmSave, 'fields'>): number => save.fields.plots.length

/** Why a plot can't be cleared now, in order: cleared already, its Farm Rank, the plot before it first, the gold it's
 * short, no actions left. */
export type PlotLock =
  | { by: 'cleared' }
  | { by: 'before'; plot: number }
  | { by: 'farm-rank'; rank: number }
  | { by: 'gold'; short: number }
  | { by: 'actions' }

/** Why a plot (its index) can't be cleared now, or null when it can. A plot the rules don't have is refused outright. */
export function plotLock(save: Pick<FarmSave, 'fields' | 'farm' | 'gold' | 'calendar' | 'today'>, plot: number): PlotLock | null {
  const opens = FIELD_PLOTS[plot]
  if (!Number.isInteger(plot) || !opens) throw new SaveRuleError('bad-slot', 'There’s no such plot.')
  if (plot < plotsCleared(save) || opens.by === 'start') return { by: 'cleared' }
  if (farmRankOf(save.farm.points) < opens.rank) return { by: 'farm-rank', rank: opens.rank }
  if (plot > plotsCleared(save)) return { by: 'before', plot: plot - 1 }
  if (save.gold < opens.gold) return { by: 'gold', short: opens.gold - save.gold }
  return actionsLeft(save) < 1 ? { by: 'actions' } : null
}

/** A plot's lock in the player's words: "Opens at Farm Rank 3", "Clear Plot 2 first", "Need 400g more", "No actions left
 * today"; null when it can be cleared. */
export function plotLockWords(lock: PlotLock | null): string | null {
  if (!lock) return null
  switch (lock.by) {
    case 'cleared': return 'Cleared'
    case 'before': return `Clear ${plotName(lock.plot)} first`
    case 'farm-rank': return `Opens at Farm Rank ${lock.rank}`
    case 'gold': return `Need ${lock.short.toLocaleString('en-US')}g more`
    case 'actions': return 'No actions left today'
  }
}

/** Clears a plot (its index): one action and its gold, and it opens at once as the next page of the field, wild (every
 * tile overgrown by the account's draw, `wildPlot`). Refused with the lock's words: cleared already (`bad-job`), the plot
 * before it or its Farm Rank (`locked`), gold short (`no-gold`), no actions left (`no-actions`). Never stamps. */
export function clearPlot<S extends FarmSave>(save: S, plot: number): S {
  const lock = plotLock(save, plot)
  if (lock) {
    const reason = lock.by === 'cleared' ? 'bad-job' : lock.by === 'gold' ? 'no-gold' : lock.by === 'actions' ? 'no-actions' : 'locked'
    throw new SaveRuleError(reason, `${plotLockWords(lock)!}.`)
  }
  const opens = FIELD_PLOTS[plot] as Extract<PlotOpens, { by: 'clear' }>
  const paid = spendGold(spend(save, 'plot'), opens.gold)
  return { ...paid, fields: { plots: [...paid.fields.plots, wildPlot(save.account.uid, plot)] } }
}

// --- What a screen reads ---------------------------------------------------------------------------------------------

/** What tiles hold at a glance: dry growing tiles to water, ripe ones to harvest, empty tilled ones to plant, and ground
 * still to clear or till. */
export interface FieldCounts {
  water: number
  ripe: number
  plant: number
  clear: number
}
export function countTiles(tiles: readonly Tile[]): FieldCounts {
  const out: FieldCounts = { water: 0, ripe: 0, plant: 0, clear: 0 }
  for (const t of tiles) {
    if (t.ready) out.ripe++
    else if (t.crop !== null) { if (needsWater(t)) out.water++ }
    else if (t.ground === 'tilled') out.plant++
    else if (isOvergrown(t.ground) || t.ground === 'clear') out.clear++
  }
  return out
}
/** The whole field's counts, every plot's: the farm map's sign. */
export const fieldCounts = (save: Pick<FarmSave, 'fields'>): FieldCounts => countTiles(fieldTiles(save))
/** One plot's counts (its index); none for a plot not cleared. */
export const plotCounts = (save: Pick<FarmSave, 'fields'>, plot: number): FieldCounts => countTiles(save.fields.plots[plot]?.tiles ?? [])

/** A row's tiles in its plot, 0–39: `row` 0 for the top row. */
export const rowOfPlot = (row: number): number[] => Array.from({ length: FIELD_COLUMNS }, (_, c) => row * FIELD_COLUMNS + c)
/** The plot's rows, top to bottom, 0 first. */
export const PLOT_ROWS: readonly number[] = Array.from({ length: FIELD_ROWS }, (_, r) => r)
