// The field's screen as data: its pages, one a plot, each cleared or locked with what opens it; a plot's counts and its
// rows; and a row's farmhands, each with her task there, her aptitude and what she does an action (a tile, two, or the
// whole row once her Watering has the trick). Pure, so the screen and the tests read the same.
import { byRelationship } from './relationship-order'
import {
  aptitudeOf, countTiles, FIELD_PLOTS, fieldIndex, handsInOrder, isTileTask, plotLock, plotLockWords, plotName, rowOfPlot, taskPlot,
  tilesAnAction, TRICK_AT, type AptitudeId, type FarmSave, type FieldCounts, type PlotOpens, type TalentOf, type TileTaskKind,
} from '@farm/domain'

/** A page of the field: its plot, cleared or not, and what opens it while it isn't. */
export interface PlotPage {
  /** The plot's index, 0 for plot 1. */
  plot: number
  name: string
  cleared: boolean
  opens: PlotOpens
  /** Why it can't be cleared now, in words ("Opens at Farm Rank 3", "Need 400g more"); null once cleared or clearable. */
  lock: string | null
  /** Its Clear button shows: its Farm Rank has come and the plot before it is cleared (gold or actions may still lack). */
  offered: boolean
}

/** Every page of the field, in order: the rules' plots. */
export function plotPages(save: Pick<FarmSave, 'fields' | 'farm' | 'gold' | 'calendar' | 'today'>): PlotPage[] {
  return FIELD_PLOTS.map((opens, plot) => {
    const cleared = plot < save.fields.plots.length
    const lock = cleared ? null : plotLock(save, plot)
    return {
      plot, name: plotName(plot), cleared, opens, lock: cleared ? null : plotLockWords(lock),
      offered: !cleared && (lock === null || lock.by === 'gold' || lock.by === 'actions'),
    }
  })
}

/** A row's tiles as field indices: `row` 0 for the top row of its plot. */
export const rowIndices = (plot: number, row: number): number[] => rowOfPlot(row).map((i) => fieldIndex(plot, i))

/** A row's counts at a glance. */
export function rowCounts(save: Pick<FarmSave, 'fields'>, plot: number, row: number): FieldCounts {
  const tiles = save.fields.plots[plot]?.tiles ?? []
  return countTiles(rowOfPlot(row).flatMap((i) => (tiles[i] ? [tiles[i]] : [])))
}

/** A farmhand on a row: her field task there, its aptitude and her level, and what she does there an action. */
export interface RowHand {
  id: string
  kind: TileTaskKind
  aptitude: AptitudeId
  level: number
  /** "a tile an action", "two tiles an action", "the whole row in one action". */
  each: string
  /** She works the whole row in one action: Watering's trick. */
  row: boolean
}

/** What a field task does an action at her level. */
function eachWords(kind: TileTaskKind, level: number): { each: string; row: boolean } {
  if (kind === 'water' && level >= TRICK_AT.waterRow) return { each: 'the whole row in one action', row: true }
  if (kind === 'till') return { each: level >= TRICK_AT.tillInOne ? 'a tile cleared and tilled in one action' : 'a step on a tile an action', row: false }
  return { each: tilesAnAction(kind, level) === 2 ? 'two tiles an action' : 'a tile an action', row: false }
}

/** The farmhands whose field tasks reach a row of a plot, in the order they work, each task once. */
export function rowHands(save: Pick<FarmSave, 'roster' | 'love' | 'longGame'>, plot: number, row: number, talentOf: TalentOf): RowHand[] {
  const tiles = new Set(rowOfPlot(row))
  return handsInOrder(save).sort(byRelationship(save)).flatMap((id) => {
    const uma = save.roster[id]!
    return (uma.tasks ?? []).flatMap((task): RowHand[] => {
      if (!isTileTask(task) || taskPlot(task) !== plot || !task.tiles.some((i) => tiles.has(i))) return []
      const aptitude = task.kind
      const level = aptitudeOf(uma, aptitude, (a) => talentOf(id, a)).level
      return [{ id, kind: task.kind, aptitude, level, ...eachWords(task.kind, level) }]
    })
  })
}
