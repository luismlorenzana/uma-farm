// The field's plots: plot 1 is the field the farm always had, plot 2 is cleared from Farm Rank 3 for its gold and an
// action, wild by the account's draw; its tiles are worked as plot 1's, grow and wither at night, and add no upkeep.
import { describe, expect, it } from 'vitest'
import { actionsLeft } from '../farm/actions'
import { upkeepOf } from '../farm/economy'
import { FARM_RANK_POINTS } from '../farm/farm'
import { endDay } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import {
  bareTile, FIELD_TILES, fieldIndex, fieldTiles, isOvergrown, MAX_PLOTS, newSave, plotOf, readyTiles, startField, tileInPlot, wildPlot, type SaveV4, type Tile,
} from '../save/v4'
import { clearTile, harvestTile, isTile, plantTile, tileAt, tillTile, waterTile } from './fields'
import { clearPlot, countTiles, FIELD_PLOTS, fieldCounts, plotCounts, plotLock, plotLockWords, plotName } from './plots'

const AT = '2026-11-15T10:00:00.000Z'
const LATER = '2026-11-15T21:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const reason = (run: () => unknown): string | null => {
  try {
    run()
    return null
  } catch (err) {
    return err instanceof SaveRuleError ? err.reason : String(err)
  }
}

/** A farm at a Farm Rank with gold, a day's actions ahead. */
function farm(rank = 3, gold = 5_000): SaveV4 {
  const save = newSave('plots', AT)
  return { ...save, farmer: { name: 'Sim' }, calendar: { day: 5 }, gold, farm: { ...save.farm, points: FARM_RANK_POINTS[rank - 1]! }, items: { 'seed-carrot': [9, 0, 0, 0, 0] } }
}
/** The save with tiles set by field index, every plot's. */
function withTiles(save: SaveV4, tiles: Record<number, Tile>): SaveV4 {
  return { ...save, fields: { plots: save.fields.plots.map((p, n) => ({ tiles: p.tiles.map((t, i) => tiles[fieldIndex(n, i)] ?? t) })) } }
}

describe('the plots', () => {
  it('holds plot 1 from the start, plot 2 from Farm Rank 3 for 2,500g and one a rank to plot 8 at 9; the save holds as many as the rules', () => {
    expect(FIELD_PLOTS.slice(0, 2)).toEqual([{ by: 'start' }, { by: 'clear', rank: 3, gold: 2_500 }])
    expect(FIELD_PLOTS.slice(1).map((p) => (p.by === 'clear' ? [p.rank, p.gold] : null))).toEqual([
      [3, 2_500], [4, 5_000], [5, 10_000], [6, 15_000], [7, 25_000], [8, 35_000], [9, 50_000],
    ])
    expect(FIELD_PLOTS).toHaveLength(8)
    expect(FIELD_PLOTS).toHaveLength(MAX_PLOTS)
    expect(newSave('plots', AT).fields.plots).toEqual([{ tiles: startField('plots') }])
    expect([plotName(0), plotName(1)]).toEqual(['Plot 1', 'Plot 2'])
  })

  it('numbers every plot\'s tiles on from plot 1\'s: plot 1 keeps 0–39', () => {
    expect([plotOf(0), tileInPlot(0), plotOf(39), plotOf(40), tileInPlot(41), fieldIndex(1, 1)]).toEqual([0, 0, 0, 1, 1, 41])
    const two = clearPlot(farm(), 1)
    expect(fieldTiles(two)).toHaveLength(2 * FIELD_TILES)
    expect(fieldTiles(two).slice(0, FIELD_TILES)).toEqual(farm().fields.plots[0]!.tiles)
    expect(isTile(farm(), 40)).toBe(false)
    expect(isTile(two, 79)).toBe(true)
    expect(isTile(two, 80)).toBe(false)
  })

  it('locks plot 2 before Farm Rank 3, then clears it for its gold and an action, at once', () => {
    expect(plotLock(farm(2), 1)).toEqual({ by: 'farm-rank', rank: 3 })
    expect(plotLockWords(plotLock(farm(2), 1))).toBe('Opens at Farm Rank 3')
    expect(reason(() => clearPlot(farm(2), 1))).toBe('locked')
    expect(plotLock(farm(), 1)).toBeNull()
    const save = farm()
    const two = clearPlot(save, 1)
    expect(two.gold).toBe(save.gold - 2_500)
    expect(actionsLeft(two)).toBe(actionsLeft(save) - 1)
    expect(two.fields.plots).toHaveLength(2)
    expect(two.fields.plots[0]).toBe(save.fields.plots[0])
    expect(two.account).toEqual(save.account)
  })

  it('opens plot 2 wild: every tile overgrown by the account\'s own draw, the same for the same account', () => {
    const two = clearPlot(farm(), 1)
    const plot = two.fields.plots[1]!
    expect(plot.tiles).toHaveLength(FIELD_TILES)
    expect(plot.tiles.every((t) => isOvergrown(t.ground) && t.crop === null)).toBe(true)
    expect(new Set(plot.tiles.map((t) => t.ground))).toEqual(new Set(['weeds', 'stone', 'stump']))
    expect(plot).toEqual(wildPlot('plots', 1))
    expect(wildPlot('other', 1)).not.toEqual(plot)
  })

  it('refuses a plot cleared already, out of order, short of gold, with no actions left, or past the rules', () => {
    const two = clearPlot(farm(), 1)
    expect(plotLock(two, 1)).toEqual({ by: 'cleared' })
    expect(plotLock(farm(), 0)).toEqual({ by: 'cleared' })
    expect(reason(() => clearPlot(two, 1))).toBe('bad-job')
    expect(plotLock(farm(3, 2_100), 1)).toEqual({ by: 'gold', short: 400 })
    expect(plotLockWords(plotLock(farm(3, 2_100), 1))).toBe('Need 400g more')
    expect(reason(() => clearPlot(farm(3, 2_100), 1))).toBe('no-gold')
    const tired = { ...farm(), today: { ...farm().today, actions: 10 } }
    expect(plotLockWords(plotLock(tired, 1))).toBe('No actions left today')
    expect(reason(() => clearPlot(tired, 1))).toBe('no-actions')
    expect(plotLock(farm(), 2)).toEqual({ by: 'farm-rank', rank: 4 })
    expect(plotLock(farm(4), 2)).toEqual({ by: 'before', plot: 1 })
    expect(reason(() => clearPlot(farm(), 2))).toBe('locked')
    expect(reason(() => clearPlot(farm(), MAX_PLOTS))).toBe('bad-slot')
    expect(plotLockWords({ by: 'before', plot: 1 })).toBe('Clear Plot 2 first')
  })

  it('clears plots 3 to 8 in order, each from its Farm Rank, up to 320 tiles; the parse takes all eight', () => {
    let save = clearPlot(farm(9, 200_000), 1)
    for (let plot = 2; plot < MAX_PLOTS; plot++) {
      expect(plotLock({ ...save, farm: { ...save.farm, points: FARM_RANK_POINTS[plot]! } }, plot)).toEqual({ by: 'farm-rank', rank: plot + 2 })
      save = clearPlot({ ...save, today: { ...save.today, actions: 0 } }, plot)
    }
    expect(save.fields.plots).toHaveLength(8)
    expect(fieldTiles(save)).toHaveLength(320)
    expect(save.gold).toBe(200_000 - 2_500 - 5_000 - 10_000 - 15_000 - 25_000 - 35_000 - 50_000)
    expect(save.fields.plots[7]).toEqual(wildPlot('plots', 7))
    expect(parseSaveV5(json(save)).fields.plots).toHaveLength(8)
  })

  it('adds no upkeep: a plot is land, not a building', () => {
    expect(upkeepOf(clearPlot(farm(), 1))).toEqual(upkeepOf(farm()))
  })

  it('round-trips a save with two plots', () => {
    const two = clearPlot(farm(), 1)
    expect(parseSaveV5(json(two))).toEqual(two)
  })
})

describe('plot 2\'s tiles', () => {
  it('are worked by hand as plot 1\'s: clear, till, plant, water, harvest', () => {
    let save = clearPlot(farm(), 1)
    const at = fieldIndex(1, 0)
    save = clearTile(save, at).save
    expect(tileAt(save, at).ground).toBe('clear')
    save = tillTile(save, at)
    save = plantTile(save, at, 'seed-carrot')
    save = waterTile(save, at)
    expect(tileAt(save, at)).toMatchObject({ crop: 'carrot', watered: true })
    // Plot 1 is untouched by plot 2's work.
    expect(save.fields.plots[0]).toEqual(farm().fields.plots[0])
    const ripe = withTiles(save, { [at]: { ...bareTile('tilled'), crop: 'carrot', growth: 4, ready: true } })
    expect(readyTiles(ripe)).toBe(1)
    expect(tileAt(harvestTile({ ...ripe, today: { ...ripe.today, actions: 0 } }, at).save, at)).toEqual(bareTile('tilled'))
  })

  it('grow at night when watered, and the night keeps plot 1\'s draws as they were', () => {
    const start = clearPlot(farm(), 1)
    const growing = withTiles(start, {
      0: { ...bareTile('tilled'), crop: 'carrot', watered: true },
      [fieldIndex(1, 3)]: { ...bareTile('tilled'), crop: 'carrot', watered: true },
      [fieldIndex(1, 4)]: { ...bareTile('tilled'), crop: 'carrot' },
    })
    const morning = endDay(growing, {}, LATER)
    expect(tileAt(morning, 0).growth).toBe(1)
    expect(tileAt(morning, fieldIndex(1, 3))).toMatchObject({ growth: 1, watered: false })
    expect(tileAt(morning, fieldIndex(1, 4)).growth).toBe(0)
  })

  it('count at a glance, each plot and the whole field: to water, ripe, to plant, to clear', () => {
    const save = withTiles(clearPlot(farm(), 1), {
      0: { ...bareTile('tilled'), crop: 'carrot' },
      1: { ...bareTile('tilled'), crop: 'carrot', growth: 4, ready: true },
      2: bareTile('tilled'),
      [fieldIndex(1, 0)]: { ...bareTile('tilled'), crop: 'carrot' },
      [fieldIndex(1, 1)]: { ...bareTile('tilled'), crop: 'carrot', watered: true },
    })
    expect(plotCounts(save, 0)).toEqual({ water: 1, ripe: 1, plant: 1, clear: 37 })
    expect(plotCounts(save, 1)).toEqual({ water: 1, ripe: 0, plant: 0, clear: 38 })
    expect(fieldCounts(save)).toEqual({ water: 2, ripe: 1, plant: 1, clear: 75 })
    expect(plotCounts(farm(), 1)).toEqual({ water: 0, ripe: 0, plant: 0, clear: 0 })
    expect(countTiles([])).toEqual({ water: 0, ripe: 0, plant: 0, clear: 0 })
  })
})
