import { setImmediate } from 'node:timers/promises'
import { actionsLeft, goToTown } from './actions'
import { dateOf, DAYS_PER_YEAR, SEASONS, type Season } from './calendar'
import { FARM_RANK_POINTS } from './farm'
import { handsTonight, setTasks } from './farmhands'
import { cookBatch, plainBatch } from './food'
import { availableStock, setStockReserve, setSurplusPlan } from './production'
import { talentsD } from './talents'
import { sendExpedition } from '../expeditions/expeditions'
import { awayOn } from '../expeditions/presence'
import { needsWater } from '../fields/crops'
import { harvestTile, plantTile, stagesOf, waterTile } from '../fields/fields'
import { plantingPlan, setFieldPlan } from '../fields/production'
import { setFishingMode } from '../gathering/fishing-grades'
import { fish } from '../gathering/hauls'
import { STATIONS } from '../gathering/ids'
import { loadsADay, nextStationLoad, setStationPlan, startLoad } from '../gathering/stations'
import { baseGoodId, cropBaseGrade, goodOf, seedId, seedOf, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { buyFodder, careFor, collect, cutGrass, feedAnimal, readyIn, setCollectionCap, siloRoom } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV6 } from '../save/parse-v4'
import { buy, shopLines } from '../save/shop'
import { bareTile, FIELD_TILES, fieldTiles, newLove, newRosterUma, newSave, RANCH_HOMES, type Animal, type FarmSave, type FarmTask } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'

const AT = '2026-11-19T12:00:00.000Z'
export const PRODUCTION_CREWS = [0, 3, 10, 20, 50] as const
type CrewSize = typeof PRODUCTION_CREWS[number]
const rotation: Readonly<Record<Season, CropId>> = { spring: 'carrot', summer: 'tomato', autumn: 'wheat', winter: 'oats' }
const samples = ['carrot-grade-2', 'milk-grade-3', 'cultured-yogurt-grade-3', 'carp-grade-2', 'carp-fillet-grade-2'] as const
const saleGoods = ['cultured-yogurt-grade-3', 'carp-fillet-grade-2', 'carp', 'trout', 'salmon', 'eel', 'silverfin',
  'rainbow-koi', 'milk-grade-3', 'egg-grade-2', 'carrot-pickles-grade-2', 'apple-preserve', 'wheat-flour',
  'carrot-grade-2', 'carrot', 'tomato', 'wheat', 'oats', 'apple'] as const
const supplyOf = (save: FarmSave, crop: CropId) => goodCount(save.items, seedId(crop)) + goodCount(save.items, seedId(crop, true))
const sum = (values: readonly number[]) => values.reduce((total, n) => total + n, 0)

function setup(crew: CrewSize, standard = false) {
  const ids = Array.from({ length: crew }, (_, i) => String(9_700_001 + i))
  const story = castPack(ids)
  const plots = crew >= 50 ? 5 : crew >= 20 ? 3 : crew >= 10 ? 2 : 1
  const width = crew >= 10 ? 8 : crew === 3 ? 4 : 2
  const rank = crew >= 10 ? 10 : 6
  const base = newSave(`f99-scale-${crew}`, AT)
  const practiced = { harvest: 150, plant: 60, water: 150, care: 150, mill: 150, fish: 210, cook: 60 }
  const herd = (kind: Animal['kind'], count: number): Animal[] => Array.from({ length: count }, (_, i) => ({
    id: `${kind}-${i + 1}`, kind, fondness: 80, ready: false, fed: false, cared: false,
  }))
  let save: FarmSave = {
    ...base, farmer: { name: 'Robin' }, gold: 20_000,
    fields: { plots: Array.from({ length: plots }, () => ({
      tiles: Array.from({ length: FIELD_TILES }, (_, i) => bareTile(i >= 16 ? 'weeds' : 'tilled')),
    })) },
    buildings: { ...base.buildings, coop: 1, barn: 1, mill: 2, sawmill: 2, smokehouse: 2, ...(crew >= 10 ? { expeditions: 1 } : {}) },
    ranch: { silo: 10, animals: [...herd('cow', crew >= 20 ? 4 : 1), ...herd('chicken', crew >= 10 ? 2 : 1)] },
    farm: { ...base.farm, points: FARM_RANK_POINTS[rank - 1]!, counts: { [GOLD_SHIPPED]: FARM_RANK_POINTS[rank - 1]! * 100 } },
    roster: Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1, practice: practiced }])),
    love: Object.fromEntries(ids.map((id) => [id, newLove()])),
  }
  const annual = Array.from({ length: width }, (_, i) => i)
  const tiles = [...annual, 8, 9]
  for (let plot = 0; plot < plots; plot++) for (const season of SEASONS) {
    const crop = rotation[season]
    save = setFieldPlan(save, plot, 0, season, { crop, grade: cropBaseGrade(crop), harvestNext: crew >= 3 && crop === 'carrot' })
    save = setFieldPlan(save, plot, 1, season, { crop: 'apple', grade: 1, harvestNext: false })
  }
  save = setCollectionCap(setCollectionCap(save, 'cow', 1), 'chicken', 1)
  save = setFishingMode(save, 'pond', 'improved')
  const mill = [{ output: 'cultured-yogurt-grade-3', target: 8 }, { output: 'apple-preserve', target: 8 }, { output: 'wheat-flour', target: 6 }]
  save = setStationPlan(save, 'mill', mill)
  save = setStationPlan(save, 'sawmill', [{ output: 'carrot-pickles-grade-2', target: 8 }])
  save = setStationPlan(save, 'smokehouse', [{ output: 'carp-fillet-grade-2', target: 12 }])
  if (!standard) {
    save = setSurplusPlan(save, { goods: [...saleGoods], limit: 50 })
    save = setStockReserve(setStockReserve(save, 'milk-grade-3', 2), 'carp-grade-2', 1)
  }
  const field = (plot: number): FarmTask[] => [
    { kind: 'harvest', tiles, ...(plot ? { plot } : {}) },
    { kind: 'water', tiles, ...(plot ? { plot } : {}) },
    { kind: 'plant', tiles, ...(plot ? { plot } : {}) },
    { kind: 'water', tiles, ...(plot ? { plot } : {}) },
  ]
  const barn: FarmTask = { kind: 'care', home: 'barn' }
  const coop: FarmTask = { kind: 'care', home: 'coop' }
  const cook: FarmTask = { kind: 'cook' }
  const ship: FarmTask = { kind: 'ship-surplus' }
  const millLoad: FarmTask = { kind: 'load', station: 'mill' }
  const smoke: FarmTask = { kind: 'load', station: 'smokehouse' }
  const pond: FarmTask = { kind: 'fish', spot: 'pond', mode: 'improved' }
  ids.forEach((id, i) => {
    let tasks: FarmTask[]
    if (crew === 3) {
      tasks = i === 0 ? [...field(0), cook] : i === 1 ? [barn, coop, millLoad, ship] : [smoke, ship, pond]
    } else if (i < plots * 2) {
      // With three plots, rotate the second group so each backup has a different town day.
      const offset = i >= plots && plots === 3 ? 1 : 0
      tasks = [...field((i + offset) % plots), cook]
    } else {
      const work: FarmTask[][] = [
        [barn, millLoad, cook, ship], [coop, { kind: 'load', station: 'sawmill' }, ship, cook],
        [smoke, ship, pond], [cook, ship, { kind: 'fish', spot: 'lake', mode: 'select' }],
        [barn, coop, millLoad, cook, pond], [smoke, cook, ship, pond],
        [cook, { kind: 'forage', area: 'mountain' }], [cook, { kind: 'fish', spot: 'falls', mode: 'select' }],
      ]
      tasks = work[(i - plots * 2) % work.length]!
    }
    save = setTasks(save, id, standard ? tasks.filter(task => task.kind !== 'ship-surplus') : tasks)
  })
  return { save, story, ids, plots, width, tiles }
}

/** Seasonal setup uses the actual shop, then manual fallback covers uncovered routine work. */
function stockSeason(save: FarmSave, season: Season, plots: number, width: number): FarmSave {
  for (const line of shopLines(save)) {
    const { crop } = seedOf(line.id)!
    const want = crop === rotation[season] ? plots * width * (season === 'spring' ? 3 : 2)
      : crop === 'apple' ? fieldTiles(save).filter((tile, index) => [8, 9].includes(index % FIELD_TILES) && tile.crop === null).length : 0
    let missing = Math.max(0, want - supplyOf(save, crop))
    while (missing > 0) {
      const count = Math.min(missing, 99)
      save = buy(goToTown(save), line, count)
      missing -= count
    }
  }
  return save
}

function manualCrate(save: FarmSave): FarmSave {
  const lines: CrateLine[] = []
  let room = 50
  for (const id of saleGoods) {
    const hold = id === 'carp' ? 3 : 0
    let left = Math.min(room, Math.max(0, availableStock(save, id) - hold))
    for (const [i, units] of (save.items[id] ?? []).entries()) {
      const count = Math.min(units, left)
      if (count > 0) lines.push({ id, stars: i + 1, count })
      left -= count
      room -= count
    }
  }
  return lines.length ? shipCrate(save, lines) : save
}

/** Ship a specific order from the shelf so the repeating plan has something to replenish. */
function shipSeasonalOrder(save: FarmSave): FarmSave {
  const lines: CrateLine[] = []
  for (const id of ['cultured-yogurt-grade-3', 'carp-fillet-grade-2']) {
    const row = save.items[id] ?? []
    const index = row.findIndex(count => count > 0)
    if (index >= 0) lines.push({ id, stars: index + 1, count: Math.min(row[index]!, 2) })
  }
  return lines.length && actionsLeft(save) ? shipCrate(save, lines) : save
}

function soloDay(save: FarmSave, tiles: readonly number[]): FarmSave {
  for (const home of RANCH_HOMES) if (readyIn(save, home) > 0) save = collect(save, home).save
  for (const animal of save.ranch.animals) {
    if (save.ranch.silo < 1) save = cutGrass(save, 16).save
    save = feedAnimal(save, animal.id)
    if (animal.fondness < 60 && actionsLeft(save) > 1) save = careFor(save, animal.id)
  }
  for (const index of tiles) {
    if (actionsLeft(save) <= 2) break
    const tile = fieldTiles(save)[index]!
    if (tile.ready) { save = harvestTile(save, index).save; continue }
    const plan = plantingPlan(save, index)
    if (!tile.crop && plan?.crop && supplyOf(save, plan.crop) && (plan.crop === 'apple' || stagesOf(plan.crop, false) <= 13 - dateOf(save.calendar.day).day)) {
      const own = seedId(plan.crop, true)
      save = plantTile(save, index, goodCount(save.items, own) ? own : seedId(plan.crop))
    }
    if (needsWater(fieldTiles(save)[index]!)) save = waterTile(save, index)
  }
  if (actionsLeft(save) > 2 && plainBatch(save)) save = cookBatch(save)
  if (actionsLeft(save) > 2) {
    const station = nextStationLoad(save, 'mill', 8)
    if (station) save = startLoad(save, 'mill', station.option.item, station.batches)
  }
  while (actionsLeft(save) > 1) save = fish(save, 'pond').save
  return manualCrate(save)
}

function stash(save: FarmSave) {
  const list = Object.entries(save.items).map(([id, row]) => ({ good: goodOf(id), units: sum(row) }))
  return {
    raw: sum(list.filter((entry) => entry.good && !entry.good.refined).map((entry) => entry.units)),
    refined: sum(list.filter((entry) => entry.good?.refined).map((entry) => entry.units)),
    seeds: sum(list.filter((entry) => !entry.good).map((entry) => entry.units)),
  }
}

interface ProductionDay {
  year: number; season: Season; manual: number; crew: number; idle: number; dry: number; hungry: number; seedStockout: number
  capacity: number; loads: number; gold: number; repeats: number; shipped: number; takeout: number; pantry: number; stock: ReturnType<typeof stash>
}

export async function playProductionFarm(crew: CrewSize, standard = false) {
  const { save: initial, story, ids, plots, width, tiles } = setup(crew, standard)
  const duration = standard ? 1 : 4
  let save = initial
  const days: ProductionDay[] = []
  let missingFarmhands = 0
  for (let turn = 0; turn < DAYS_PER_YEAR * duration; turn++) {
    const { year, season, day } = dateOf(save.calendar.day)
    const gold = save.gold
    if (day === 1) {
      save = stockSeason(save, season, plots, width)
      if (!standard && crew >= 10 && year > 1) save = shipSeasonalOrder(save)
    }
    if (crew >= 10 && year === 3 && season === 'summer' && (day === 3 || day === 8)) {
      save = sendExpedition(goToTown(save), 'sky-ruins', [ids[0]!, ids[plots * 2]!, ids[plots * 2 + 2]!], [])
    }
    if (crew === 0) save = soloDay(save, tiles)
    else {
      // Preview with the real scheduler. Fill urgent gaps by hand without altering the recurring assignments.
      const before = handsTonight(save, save, talentsD, story)
      if (save.expeditions.length > 0) missingFarmhands += ids.filter((id) =>
        awayOn(save, id, save.calendar.day) && before.lines.every((line) => line.id !== id)).length
      for (const [i, tile] of fieldTiles(before.save).entries()) {
        if (!actionsLeft(save)) break
        if (needsWater(tile) && needsWater(fieldTiles(save)[i]!)) save = waterTile(save, i)
      }
      for (const animal of before.save.ranch.animals.filter((a) => !a.fed)) {
        if (!actionsLeft(save)) break
        if (save.ranch.silo < 1) save = buyFodder(goToTown(save), Math.min(siloRoom(save), 30))
        if (actionsLeft(save)) save = feedAnimal(save, animal.id)
      }
      if (!standard && actionsLeft(save) && day % 4 === 0 && (crew < 10 || save.gold < 10_000)) save = manualCrate(save)
    }
    const manual = save.today.actions
    const due = handsTonight(save, save, talentsD, story).save
    const dry = fieldTiles(due).filter(needsWater).length
    const hungry = due.ranch.animals.filter((a) => !a.fed).length
    const seedStockout = supplyOf(due, rotation[season]) === 0 && day <= 13 - stagesOf(rotation[season], false)
      ? fieldTiles(due).filter((tile, i) => i % FIELD_TILES < width && !tile.crop).length : 0
    const capacity = sum(STATIONS.map((station) => loadsADay(save, station)))
    save = runNight(save, { story, talentOf: talentsD })
    const morning = save.summary!
    const work = morning.work.filter((line) => line.kind === 'farmhand')
    const loads = morning.work.filter((line) => line.kind === 'load')
    days.push({
      year, season, manual, crew: sum(work.map((line) => line.spent)), idle: sum(work.map((line) => line.actions - line.spent)),
      dry, hungry, seedStockout, capacity, loads: loads.length, gold: save.gold - gold,
      repeats: sum(loads.filter((line) => samples.some((id) => id === parseStockKey(line.item)?.id)).map((line) => line.count)),
      shipped: sum(morning.bin.map((line) => line.gold)), takeout: sum((morning.money ?? []).flatMap((line) => line.kind === 'takeout' ? [line.due] : [])),
      pantry: morning.money?.find((line) => line.kind === 'pantry')?.meals ?? 0,
      stock: stash(save),
    })
    if (day === 12) {
      save = parseSaveV6(JSON.parse(JSON.stringify(save)))
      await setImmediate()
    }
  }
  const years = Array.from({ length: duration }, (_, i) => {
    const year = i + 1
    const inYear = days.filter((d) => d.year === year)
    const covered = sum(inYear.map((d) => d.crew))
    const manual = sum(inYear.map((d) => d.manual))
    const daily = inYear.map((d) => d.manual).sort((a, b) => a - b)
    return {
      year, manual, crew: covered, share: Math.round(1000 * covered / (manual + covered)) / 10,
      typicalFree: 10 - daily[Math.floor(daily.length / 2)]!, idle: sum(inYear.map((d) => d.idle)),
      dry: sum(inYear.map((d) => d.dry)), hungry: sum(inYear.map((d) => d.hungry)), seedStockouts: sum(inYear.map((d) => d.seedStockout)),
      station: `${sum(inYear.map((d) => d.loads))}/${sum(inYear.map((d) => d.capacity))}`, repeats: sum(inYear.map((d) => d.repeats)),
      shipped: sum(inYear.map((d) => d.shipped)), takeout: sum(inYear.map((d) => d.takeout)), pantry: sum(inYear.map((d) => d.pantry)),
      gold: sum(inYear.map((d) => d.gold)), ...inYear.at(-1)!.stock,
    }
  })
  const first = Object.fromEntries(samples.map((id) => [id, save.farm.discoveries?.[id] ?? null]))
  const seasonGold = years.map(({ year }) => SEASONS.map((season) => sum(days.filter((d) => d.year === year && d.season === season).map((d) => d.gold))))
  const cropCount = Object.keys(save.crops).filter((id) => baseGoodId(id) === id).length
  return { years, seasonGold, save, first, cropCount, missingFarmhands }
}
