import { describe, expect, it } from 'vitest'
import { goToTown } from '../farm/actions'
import { dateOf, DAYS_PER_YEAR, SEASONS, type Season } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { handsTonight, handsWorking, setTasks } from '../farm/farmhands'
import { TALENT_D } from '../farm/talents'
import { discovered } from '../goods/discovery'
import { CROP_IDS, cropBaseGrade, cropGoodId, cropGradeOf, cropSeedId, goodOf, seedId, seedOf, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { GOLD_SHIPPED, shipCrate } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { bareTile, fieldTiles, FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, newLove, newRosterUma, newSave, type FarmSave, type FarmTask } from '../save/v4'
import { goodCount } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { CROPS, established, growsIn, needsWater } from './crops'
import { growTiles, harvestTile, plantTile, removeOrchard, tileAt, tillTile, waterTile } from './fields'
import { RARE_CROPS } from './plantables'
import { saveCropSeeds, setCropReserve, setFieldPlan } from './production'

const NOW = '2026-11-18T12:00:00.000Z'
const FIXTURE_RANK = 6
const PLOTS = 5
const APTITUDE = { harvest: 210, water: 150, plant: 60 }
const sampleGrades: readonly CropId[] = ['green-peas', 'zucchini', 'sweet-potato', 'cauliflower', 'apple', 'blueberry']
const fresh = (uid: string): FarmSave => ({
  ...newSave(uid, NOW), farmer: { name: 'Robin' }, gold: 20_000,
})
const reload = (save: FarmSave): FarmSave => parseSaveV5(JSON.parse(JSON.stringify(save)))

function coverRank(save: FarmSave): FarmSave {
  const points = FARM_RANK_POINTS[FIXTURE_RANK - 1]!
  return { ...save, farm: { ...save.farm, points, counts: { ...save.farm.counts, [GOLD_SHIPPED]: points * 100 } } }
}

function prepare(uid: string, perPlot: number) {
  const count = PLOTS * perPlot
  const ids = Array.from({ length: count }, (_, i) => String(9_600_001 + i))
  const pack = castPack(ids)
  let save = coverRank(fresh(uid))
  save = {
    ...save,
    fields: { plots: Array.from({ length: PLOTS }, () => ({ tiles: Array.from({ length: FIELD_TILES }, () => bareTile('tilled')) })) },
    roster: Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1, practice: APTITUDE }])),
    love: Object.fromEntries(ids.map((id) => [id, newLove()])),
  }
  return { save, ids, pack }
}

/** Shared row plans are set once. Multi-season crops retain their row across the change of season. */
function planYear(start: FarmSave, tilesPerCrop: number) {
  const rows = Array.from({ length: PLOTS * FIELD_ROWS }, (_, i) => ({ plot: i % PLOTS, row: Math.floor(i / PLOTS) }))
  const woody = CROP_IDS.filter((crop) => CROPS[crop].woody)
  const annualRows = rows.slice(woody.length)
  const mixed: readonly CropId[] = ['cabbage', 'corn', 'onion']
  let save = start
  const fieldTiles = new Map<number, Set<number>>()
  const assign = (crop: CropId, season: Season, slot: { plot: number; row: number }) => {
    const { plot, row } = slot
    const tiles = fieldTiles.get(plot) ?? new Set<number>()
    for (let i = 0; i < tilesPerCrop; i++) tiles.add(row * FIELD_COLUMNS + i)
    fieldTiles.set(plot, tiles)
    save = setFieldPlan(save, plot, row, season, { crop, grade: cropBaseGrade(crop), harvestNext: sampleGrades.includes(crop) })
  }
  woody.forEach((crop, i) => SEASONS.forEach((season) => assign(crop, season, rows[i]!)))
  for (const season of SEASONS) {
    const annual = CROP_IDS.filter((crop) => !CROPS[crop].woody && !mixed.includes(crop) && growsIn(crop, season))
    mixed.forEach((crop, i) => { if (growsIn(crop, season)) assign(crop, season, annualRows[i]!) })
    annual.forEach((crop, i) => assign(crop, season, annualRows[mixed.length + i]!))
  }
  for (const crop of sampleGrades) save = setCropReserve(save, crop, cropBaseGrade(crop) + 1, 1)
  return { save, fieldTiles }
}

function buyTheSeason(save: FarmSave, tilesPerCrop: number): FarmSave {
  const year = dateOf(save.calendar.day).year
  return shopLines(save).reduce((next, line) => {
    const { crop } = seedOf(line.id)!
    if (!lineOpen(next, line) || (year > 1 && CROPS[crop].woody)) return next
    const desired = crop === 'corn' ? tilesPerCrop * 2 : tilesPerCrop
    const need = Math.max(0, desired - goodCount(next.items, line.id) - goodCount(next.items, seedId(crop, true)))
    return need ? buy(goToTown(next), line, need) : next
  }, save)
}

/** Sell through one player crate, keeping two from each base crop and one of each upgraded grade. */
function shipSurplus(save: FarmSave): FarmSave {
  const lines = Object.entries(save.items).flatMap(([id, stars]) => {
    const crop = cropGradeOf(id)
    if (!crop) return []
    let sell = goodCount(save.items, id) - (id === crop.crop ? 2 : 1)
    return stars.flatMap((n, i) => {
      const count = Math.min(n, sell)
      if (count <= 0) return []
      sell -= count
      return [{ id, stars: i + 1, count }]
    })
  })
  return lines.length ? shipCrate(save, lines) : save
}

interface SeasonReport {
  season: string
  crewActions: number
  playerActions: number
  seeds: number
  bin: number
  takeout: number
  firstCrops: number
  withered: number
  firstPlantingLosses: number
  grownPicks: number
}

function playYear(perPlot: number, tilesPerCrop: number, years: number) {
  const setup = prepare(`orchard-${perPlot}-${tilesPerCrop}`, perPlot)
  const plan = planYear(setup.save, tilesPerCrop)
  const context = { story: setup.pack, talentOf: () => TALENT_D }
  let save = plan.save
  setup.ids.forEach((id, i) => {
    const plot = Math.floor(i / perPlot)
    const tiles = [...plan.fieldTiles.get(plot)!].sort((a, b) => a - b)
    const scope = { tiles, ...(plot ? { plot } : {}) }
    const tasks: FarmTask[] = [{ kind: 'harvest', ...scope }, { kind: 'plant', ...scope }, { kind: 'water', ...scope }, { kind: 'cook' }]
    save = setTasks(save, id, tasks)
  })
  const report: SeasonReport[] = []
  let current: SeasonReport | undefined
  for (let turn = 0; turn < DAYS_PER_YEAR * years; turn++) {
    const { day, season, year } = dateOf(save.calendar.day)
    if (day === 1) {
      current = { season: `${year}/${season}`, crewActions: 0, playerActions: 0, seeds: 0, bin: 0, takeout: 0, firstCrops: 0, withered: 0, firstPlantingLosses: 0, grownPicks: 0 }
      report.push(current)
      const before = save.gold
      save = buyTheSeason(save, tilesPerCrop)
      current.seeds = before - save.gold
    }
    const stats = current!
    if (day % 2 === 0) save = shipSurplus(save)
    stats.playerActions += save.today.actions
    expect(handsWorking(save, setup.pack).length).toBeGreaterThan(0)
    if (day === 12) {
      const preview = growTiles(handsTonight(save, save, context.talentOf, setup.pack).save).save
      const nextSeason = dateOf(save.calendar.day + 1).season
      stats.firstPlantingLosses = fieldTiles(preview).filter((t) => t.crop && !t.regrowing && !t.ready && !CROPS[t.crop].woody && !growsIn(t.crop, nextSeason)).length
    }
    const before = save.farm.counts['tiles-harvested'] ?? 0
    save = runNight(save, context)
    stats.grownPicks += (save.farm.counts['tiles-harvested'] ?? 0) - before
    for (const line of save.summary!.work) {
      if (line.kind === 'farmhand') stats.crewActions += line.spent
      if (line.kind === 'withered') stats.withered += line.tiles
      if (line.kind === 'discovery' && cropGradeOf(line.id)?.crop === line.id) stats.firstCrops++
    }
    stats.bin += save.summary!.bin.reduce((n, line) => n + line.gold, 0)
    stats.takeout += (save.summary!.money ?? []).reduce((n, line) => n + (line.kind === 'takeout' ? line.due : 0), 0)
    if (day === 12) save = reload(save)
  }
  if (process.env.F99_REPORT === '1') console.table(report)
  return { save, report }
}

describe('F99 fields and orchards', () => {
  it('grows every species over all four seasons with 15 Umas and repeats the orchard cycle', () => {
    const { save, report } = playYear(3, 3, 2)
    expect(CROP_IDS.filter((crop) => !discovered(save, crop)), 'crops still missing').toEqual([])
    expect(CROP_IDS.filter((crop) => (save.crops[crop] ?? 0) <= 0), 'crops verified by a harvest').toEqual([])
    expect(sampleGrades.every((crop) => discovered(save, cropGoodId(crop, cropBaseGrade(crop) + 1)!))).toBe(true)
    expect(report.every((row) => row.crewActions / (row.crewActions + row.playerActions) >= .8)).toBe(true)
    expect(report.every((row) => row.grownPicks > 0)).toBe(true)
    expect(report.slice(0, 4).reduce((n, row) => n + row.firstCrops, 0)).toBe(51)
    for (const crop of RARE_CROPS) expect(save.farm.counts[`rare-seed:${crop}`]).toBe(crop === 'golden-carrot' ? 3 : 2)
    expect(save.gold).toBeGreaterThan(0)
  })

  it('compares the same seasonal plan on a 10-Uma crew with two tiles per crop', () => {
    const { save, report } = playYear(2, 2, 1)
    expect(report).toHaveLength(4)
    expect(report.every((row) => row.crewActions / (row.crewActions + row.playerActions) >= .8)).toBe(true)
    expect(CROP_IDS.filter((crop) => !discovered(save, crop)), 'crops still missing with 10 Umas').toEqual([])
  })

  it('establishes an orchard across a season boundary, holds one pick, and requires deliberate removal', () => {
    let save = { ...coverRank(fresh('single-fruit')), calendar: { day: 35 } }
    const line = shopLines(save).find((row) => row.id === seedId('apple'))!
    save = plantTile(tillTile(buy(goToTown(save), line, 1), 0), 0, seedId('apple'))
    for (let i = 0; i < 6; i++) save = reload(runNight(waterTile(save, 0), {}))
    expect(tileAt(save, 0)).toMatchObject({ crop: 'apple', ready: false })
    expect(established(tileAt(save, 0))).toBe(true)
    while (save.calendar.day < 73) save = reload(runNight(save, {}))
    expect(tileAt(save, 0)).toMatchObject({ crop: 'apple', ready: true, fruitSeason: 6 })
    while (save.calendar.day < 121) save = reload(runNight(save, {}))
    expect(tileAt(save, 0)).toMatchObject({ crop: 'apple', ready: true, fruitSeason: 10 })
    save = harvestTile(save, 0).save
    expect(goodCount(save.items, 'apple')).toBe(CROPS.apple.yield)
    expect(discovered(save, 'apple')).toBe(true)
    expect(needsWater(tileAt(save, 0))).toBe(false)
    expect(established(tileAt(save, 0))).toBe(true)
    expect(() => saveCropSeeds(save, 'apple', 1, true, 1)).toThrow('3 Apple crop points')
    expect(goodCount(saveCropSeeds(save, 'apple', 1, false, 1).items, cropSeedId('apple', true))).toBeGreaterThan(0)
    expect(tileAt(removeOrchard(save, 0), 0)).toEqual(bareTile('tilled'))
    expect(goodOf('apple')).toMatchObject({ family: 'fruits', grade: 1, price: 35 })
  })
})
