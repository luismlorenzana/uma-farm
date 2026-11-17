// The farm at scale: three farms play four years on the game's own rules, each bringing in its Umas over years 1–4 as
// farmhands, until it works with **10**, **20** or **50** of them. Each comes on her farm days, the eight of a season's
// twelve her default schedule leaves free, and works and eats on the farm those days. A plain bot is the farmer: each morning he builds what
// the Farm Rank offers (the plan below), clears a plot for every five Umas and buys the stations' next levels once their
// rank comes, keeps the Coop and the Barn stocked, buys each plot's seeds in town, tends the field by hand with what his
// day leaves, ships a crate of all the farm has to spare, and spends the rest of his day with the people. The farmhands
// on the farm today are set to work by **a plain rule**, every morning, in the order they came: **the field's plots** (harvest, plant,
// water), **the animals**, **the stations' loads**, **the kitchen** (Cook), **gathering and mining** (four full hauls at
// every area, spot and dig, one place each), then the plots' **new ground** (a row a plot a day); each takes what its work
// needs today, as her aptitudes count it, and the next takes what's left. Past every job, an Uma gathers where it's thin.
//
// How it counts an Uma's night: her **real work** is the field, the animals, the loads, the kitchen, a full haul and a
// full face; **thin** is a haul or a face past its place's four (half a haul: idle-ish); **idle** is an action she had
// nothing to do with. She's **in a real job** when real work is at least half her actions; else she's **idle-ish**. Phase
// 2's employers (expeditions, the Restaurant, the Forge) aren't built: they're counted as to come.
//
// `SCALE=1` prints the three farms' tables, year by year. The night reads a pack of the fifty alone (`castPack`: invented,
// on the default schedule, no bible), for their farm days; everyone a D talent.
import { describe, expect, it } from 'vitest'
import { actionsLeft, goToTown, spendActions } from './actions'
import { buildLock, heldFor, payBuild, pickFor } from './builds'
import { DAYS_PER_SEASON, DAYS_PER_YEAR, dateOf, SEASONS } from './calendar'
import { upkeepOf } from './economy'
import { farmRankOf } from './farm'
import { aptitudeOf, handDay, handsInOrder, handsTonight, handsWorking, setTasks, tilesAnAction, TRICK_AT } from './farmhands'
import { castPack } from '../story/authored.fixture'
import { addBatch, cookBatchAt, foodHeld, MEALS_A_DAY, pantryMeals, plainBatch, TAKEOUT_PRICE } from './food'
import { kitchenBase, kitchenLevelLock, nextKitchenLevel, staffTable, upgradeKitchen } from '../kitchen/kitchen'
import { buyRecipe, recipeLock, recipeOf } from '../kitchen/recipes'
import { botKitchen, botKitchenKeeps, botRecipe } from '../kitchen/stove-bots'
import { farmPlace, placeBuilt, type BuildPlace, type FarmPlaceId } from './places'
import { talentsD } from './talents'
import { growsIn, CROPS } from '../fields/crops'
import { harvestTile, plantTile, stagesOf, waterTile } from '../fields/fields'
import { clearPlot, FIELD_PLOTS, plotLock } from '../fields/plots'
import { digBuilt, stairsLock, takeStairs } from '../gathering/digs'
import { chop, FULL_HAULS, reachList } from '../gathering/hauls'
import { STATIONS, type FishingSpotId, type ForestAreaId } from '../gathering/ids'
import { levelLock, LOAD_SIZE, loadsADay, nextStationLevel, stationLevel, stationOptions, upgradeStation } from '../gathering/stations'
import { goodOf, seedId, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { animalLock, animalsIn, ANIMALS, buyAnimal, buyFodder, FODDER_PRICE, homeBuilt, siloRoom } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import {
  ANIMAL_KINDS, FIELD_COLUMNS, FIELD_TILES, fieldIndex, HOME_ROOM, isOvergrown, MAX_TASKS, newLove, newRosterUma, newSave, RANCH_HOMES, type AptitudeId, type FarmTask,
  type RanchHome, type SaveV4,
} from '../save/v4'

const AT = '2026-11-15T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const sum = (ns: readonly number[]): number => ns.reduce((a, b) => a + b, 0)

/** The three farms: the Umas each works with in the end. */
type Stage = 10 | 20 | 50
const STAGES: readonly Stage[] = [10, 20, 50]
const YEARS = 4
/** The Umas working each farm each season, years 1–4: two to start, then ten by year 2's Spring, twenty by year 3's,
 * fifty by year 4's Summer. */
const SCHEDULE: Readonly<Record<Stage, readonly number[]>> = {
  10: [2, 4, 6, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  20: [2, 4, 6, 8, 10, 12, 14, 17, 20, 20, 20, 20, 20, 20, 20, 20],
  50: [2, 4, 6, 8, 10, 12, 14, 17, 20, 26, 32, 38, 44, 50, 50, 50],
}
/** The farmhands' ids: invented, in the order they come. */
const handId = (n: number): string => String(9_500_001 + n)
/** The fifty's pack, in the order they come: each on the default schedule, out in town every third day of a season (from
 * day 1, 2 or 3 by her place), on the farm the other eight. */
const PACK = castPack(Array.from({ length: 50 }, (_, n) => handId(n)))
/** The farmhands on the farm today, in the order they came. */
const working = (save: SaveV4): string[] => handsWorking(save, PACK)

/** What he builds, in order, each once the Farm Rank offers it and its gold and goods are there: the stations, the ranch,
 * the Kitchen, the digs and the sea. (The Restaurant, the Expedition post and the Forge have no game yet.) */
const PLAN: readonly FarmPlaceId[] = ['mill', 'coop', 'kitchen', 'sawmill', 'smokehouse', 'barn', 'mine', 'smelter', 'quarry', 'cutter', 'dock', 'boat']

/** A day's work by kind, in actions. */
interface Work {
  field: number
  animals: number
  stations: number
  kitchen: number
  /** Full hauls: an area's or a spot's first four a day. */
  gather: number
  mining: number
  /** Hauls past an area's or a spot's four: half hauls. */
  thin: number
  /** Actions with nothing to do. */
  idle: number
}
const REAL: readonly (keyof Work)[] = ['field', 'animals', 'stations', 'kitchen', 'gather', 'mining']
const noWork = (): Work => ({ field: 0, animals: 0, stations: 0, kitchen: 0, gather: 0, mining: 0, thin: 0, idle: 0 })

/** Where the bin's gold came from: the field's crops, the woods and the water, the ranch, the digs, the stations'
 * refined goods. */
const SOURCES = ['field', 'forest', 'fish', 'ranch', 'mining', 'refined'] as const
type Source = typeof SOURCES[number]
function sourceOf(id: string): Source {
  const good = goodOf(id)!
  if (good.refined) return 'refined'
  if (good.crop) return 'field'
  if (good.family === 'fish') return 'fish'
  if (good.family === 'eggs-milk' || good.family === 'fibers') return 'ranch'
  if (good.family === 'ores' || good.family === 'stones' || good.family === 'crystals') return 'mining'
  return 'forest'
}

/** One day of a farm. */
interface Day {
  day: number
  umas: number
  /** Their actions today, in all. */
  actions: number
  work: Work
  /** The real work on offer today: what the jobs needed, filled or not (mining's no limit isn't counted). */
  offered: number
  /** The real work no one took today. */
  unfilled: number
  /** Umas in real jobs, and idle-ish. */
  real: number
  idleish: number
  income: number
  /** The bin's pay by where its goods came from. */
  sources: Record<Source, number>
  /** The Kitchen: the dishes its play made today, its score, and whether the staff meal was served. */
  dishes: number
  score: number | null
  staff: boolean
  upkeep: number
  takeout: number
  pantry: number
  fed: number
  short: boolean
  eased: number
  gold: number
  rank: number
  /** The farmhands on the farm today: on their farm days. */
  today: number
  plots: number
}

// --- The farmer's day ---------------------------------------------------------------------------------------------

/** The Umas the season brings: friends from town invited to work today, each a D talent. */
function hire(save: SaveV4, count: number): SaveV4 {
  const day = save.calendar.day
  const fresh = Array.from({ length: count }, (_, n) => handId(n)).filter((id) => !save.roster[id])
  if (fresh.length === 0) return save
  return {
    ...save,
    roster: { ...save.roster, ...Object.fromEntries(fresh.map((id) => [id, { ...newRosterUma(day), farmhand: day }])) },
    love: { ...save.love, ...Object.fromEntries(fresh.map((id) => [id, { ...newLove(), level: 3 }])) },
  }
}

/** Tonight's bill as the farm stands, and the gold he keeps back: a week of it (a season's first week can bring in
 * nothing while the whole crew plants and waters). */
const bill = (save: SaveV4): number => upkeepOf(save).gold + save.farm.owed + MEALS_A_DAY * (handsInOrder(save).length + 1) * TAKEOUT_PRICE
const reserve = (save: SaveV4): number => 6 * bill(save)
const spare = (save: SaveV4): number => save.gold - reserve(save)

/** The places he builds, the plots he clears and the stations' levels he buys: in the plan's order, then the next plot
 * (a plot for every five Umas), then each station's next level, each with spare gold. */
function grow(start: SaveV4, room: boolean): SaveV4 {
  let save = start
  for (const id of PLAN) {
    const place = farmPlace(id) as BuildPlace
    if (buildLock(save, id) === null && spare(save) >= place.opens.cost.gold) save = payBuild(save, id)
  }
  const plot = save.fields.plots.length
  const opens = FIELD_PLOTS[plot]
  if (room && opens?.by === 'clear' && plotLock(save, plot) === null && spare(save) >= opens.gold) save = clearPlot(save, plot)
  for (const station of STATIONS) {
    const next = nextStationLevel(save, station)
    if (next && levelLock(save, station) === null && spare(save) >= next.cost) save = upgradeStation(save, station)
  }
  // The Kitchen's next level, while the staff meal takes more dishes than a play's base.
  const kitchen = nextKitchenLevel(save)
  if (kitchen && kitchenLevelLock(save) === null && spare(save) >= kitchen.cost && staffTable(save, PACK).dishes > kitchenBase(save)) save = upgradeKitchen(save)
  return save
}

/** The animals: each building kept full with the best the rancher sells it, and fodder in the silo; into town for them. */
function stock(start: SaveV4): SaveV4 {
  let save = start
  const town = (s: SaveV4): SaveV4 => (s.today.town || actionsLeft(s) === 0 ? s : goToTown(s))
  for (const home of RANCH_HOMES) {
    if (!homeBuilt(save, home)) continue
    const best = [...ANIMAL_KINDS].filter((k) => ANIMALS[k].home === home && animalLock(save, k) === null).sort((a, b) => ANIMALS[b].price - ANIMALS[a].price)[0]
    while (best && animalsIn(save, home).length < HOME_ROOM && animalLock(save, best) === null && spare(save) >= ANIMALS[best].price) {
      save = town(save)
      if (!save.today.town) break
      save = buyAnimal(save, best).save
    }
  }
  const animals = save.ranch.animals.length
  if (animals > 0 && save.ranch.silo < 2 * animals && siloRoom(save) > 0) {
    const n = Math.min(99, siloRoom(save))
    if (spare(save) >= n * FODDER_PRICE) {
      save = town(save)
      if (save.today.town) save = buyFodder(save, n)
    }
  }
  return save
}

/** What a crop brings a tile a day: its price × its yield over its days (a regrowing crop's over its regrowth). */
const cropValue = (crop: CropId): number => (goodOf(crop)!.price * CROPS[crop].yield) / (CROPS[crop].regrows ?? CROPS[crop].days)
/** The crops a plot can plant today: the shop's open lines this season that ripen before it ends (or grow on), best a
 * tile a day first. */
function cropsToday(save: SaveV4): CropId[] {
  const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  const next = dateOf(save.calendar.day + daysLeft).season
  return shopLines(save).filter((l) => lineOpen(save, l)).map((l) => l.id.slice('seed-'.length) as CropId)
    .filter((c) => stagesOf(c, false) <= daysLeft || growsIn(c, next)).sort((a, b) => cropValue(b) - cropValue(a))
}
/** Each plot's crop today: the best ones, a different one a plot by turns, so no crop floods the market. */
const plotCrop = (crops: readonly CropId[], plot: number): CropId | null => crops[plot % Math.max(1, crops.length)] ?? null

/** Each plot's seeds, into town for them: as many as its empty tilled tiles and today's harvests will take. */
function seeds(start: SaveV4): SaveV4 {
  let save = start
  const crops = cropsToday(save)
  const want = new Map<CropId, number>()
  save.fields.plots.forEach((plot, p) => {
    const crop = plotCrop(crops, p)
    if (!crop) return
    const free = plot.tiles.filter((t) => (t.ground === 'tilled' && t.crop === null) || (t.ready && !t.regrowing && CROPS[t.crop!].regrows === null)).length
    const clear = plot.tiles.filter((t) => t.ground === 'clear').length
    want.set(crop, (want.get(crop) ?? 0) + free + Math.min(clear, 8))
  })
  for (const [crop, n] of want) {
    const line = shopLines(save).find((l) => l.id === seedId(crop))
    const held = save.items[seedId(crop)]?.[0] ?? 0
    let need = n - held
    while (line && need > 0 && spare(save) >= line.price * Math.min(99, need)) {
      if (!save.today.town) { if (actionsLeft(save) === 0) break; save = goToTown(save) }
      const k = Math.min(99, need)
      save = buy(save, line, k)
      need -= k
    }
  }
  return save
}

// --- The plain rule ---------------------------------------------------------------------------------------------------

/** A job's work today and how an Uma's actions fill it: `fill(id, actions)` takes up to her actions and returns how many
 * it used; `left` is what it still needs, in a D-talent hand's actions at the farm's levels. */
interface Job {
  kind: keyof Work
  tasks: FarmTask[]
  fill: (id: string, actions: number) => number
  left: () => number
}
const levelOf = (save: SaveV4, id: string, aptitude: AptitudeId): number => aptitudeOf(save.roster[id]!, aptitude, () => 3).level
const ROWS = Array.from({ length: FIELD_TILES / FIELD_COLUMNS }, (_, r) => r)
const ALL_TILES = Array.from({ length: FIELD_TILES }, (_, i) => i)
/** A plot for every five Umas: the design's targets (two plots at 10, four at 20, all eight from 40). */
const UMAS_A_PLOT = 5
/** New ground a plot takes a day: a row's worth, cleared and tilled. */
const TILL_A_DAY = FIELD_COLUMNS

/** A plot's tending today: its ripe tiles, those to plant (with seeds), those growing and still dry to water. */
function tendJob(save: SaveV4, p: number, crop: CropId | null): Job {
  const tiles = save.fields.plots[p]!.tiles
  const seedsHeld = crop ? (save.items[seedId(crop)]?.[0] ?? 0) : 0
  let ripe = tiles.filter((t) => t.ready).length
  let empty = tiles.filter((t) => t.ground === 'tilled' && t.crop === null).length
  let dry = tiles.filter((t) => t.crop !== null && !t.ready && !t.watered).length
  let planted = 0
  const plot = p === 0 ? {} : { plot: p }
  const tasks: FarmTask[] = [
    { kind: 'harvest', tiles: ALL_TILES, ...plot }, { kind: 'plant', tiles: ALL_TILES, ...(crop ? { crop } : {}), ...plot }, { kind: 'water', tiles: ALL_TILES, ...plot },
  ]
  const actsFor = (id: string | null) => {
    const lv = (a: AptitudeId) => (id ? levelOf(save, id, a) : 2)
    const harvest = Math.ceil(ripe / tilesAnAction('harvest', lv('harvest')))
    const plantable = Math.min(empty + ripe, Math.max(0, seedsHeld - planted))
    const plant = Math.ceil(plantable / tilesAnAction('plant', lv('plant')))
    const toWater = dry + plantable
    const water = lv('water') >= TRICK_AT.waterRow ? Math.min(ROWS.length, Math.ceil(toWater / FIELD_COLUMNS)) : Math.ceil(toWater / tilesAnAction('water', lv('water')))
    return { harvest, plantable, plant, water }
  }
  return {
    kind: 'field', tasks,
    left: () => { const a = actsFor(null); return a.harvest + a.plant + a.water },
    fill: (id, actions) => {
      let a = actions
      const need = actsFor(id)
      const h = Math.min(a, need.harvest)
      a -= h
      const harvested = Math.min(ripe, h * tilesAnAction('harvest', levelOf(save, id, 'harvest')))
      ripe -= harvested
      empty += harvested
      const pl = Math.min(a, need.plant)
      a -= pl
      const sown = Math.min(need.plantable, pl * tilesAnAction('plant', levelOf(save, id, 'plant')))
      empty -= Math.min(empty, sown)
      planted += sown
      dry += sown
      const w = Math.min(a, actsFor(id).water)
      a -= w
      const wet = levelOf(save, id, 'water') >= TRICK_AT.waterRow ? w * FIELD_COLUMNS : w * tilesAnAction('water', levelOf(save, id, 'water'))
      dry -= Math.min(dry, wet)
      return actions - a
    },
  }
}

/** A plot's new ground today: a row's worth, the next tiles to clear or till, what tomorrow's seeds will take. */
function groundJob(save: SaveV4, p: number): Job {
  const tiles = save.fields.plots[p]!.tiles
  const ground = ALL_TILES.filter((i) => isOvergrown(tiles[i]!.ground) || tiles[i]!.ground === 'clear').slice(0, TILL_A_DAY)
  let wild = ground.filter((i) => isOvergrown(tiles[i]!.ground)).length
  let cleared = ground.length - wild
  const acts = (id: string | null) => cleared + wild * ((id ? levelOf(save, id, 'till') : 2) >= TRICK_AT.tillInOne ? 1 : 2)
  return {
    kind: 'field', tasks: ground.length > 0 ? [{ kind: 'till', tiles: ground, ...(p === 0 ? {} : { plot: p }) }] : [], left: () => acts(null),
    fill: (id, actions) => {
      const used = Math.min(actions, acts(id))
      const inOne = levelOf(save, id, 'till') >= TRICK_AT.tillInOne
      for (let k = 0; k < used; k++) {
        if (cleared > 0) cleared--
        else if (wild > 0) { wild--; if (!inOne) cleared++ }
      }
      return used
    },
  }
}

/** The farmer's own field work, by hand with the actions his day leaves (one kept for the crate): each plot's ripe tiles
 * harvested, its empty tilled tiles planted with its crop, its dry growing tiles watered. */
function tendByHand(start: SaveV4): SaveV4 {
  let save = start
  const crops = cropsToday(save)
  const free = () => actionsLeft(save) > 1
  save.fields.plots.forEach((_, p) => {
    for (const i of ALL_TILES) if (free() && save.fields.plots[p]!.tiles[i]!.ready) save = harvestTile(save, fieldIndex(p, i)).save
    const crop = plotCrop(crops, p)
    for (const i of ALL_TILES) {
      const t = save.fields.plots[p]!.tiles[i]!
      if (free() && crop && t.ground === 'tilled' && t.crop === null && (save.items[seedId(crop)]?.[0] ?? 0) > 0) save = plantTile(save, fieldIndex(p, i), seedId(crop))
    }
    for (const i of ALL_TILES) {
      const t = save.fields.plots[p]!.tiles[i]!
      if (free() && t.crop !== null && !t.ready && !t.watered) save = waterTile(save, fieldIndex(p, i))
    }
  })
  return save
}

/** A building's animals today: each fed (two an action from Animal care 3), the goods collected, each cared for (two an
 * action from 5). */
function careJob(save: SaveV4, home: RanchHome): Job {
  let left = animalsIn(save, home).length
  const acts = (id: string | null) => {
    const lv = id ? levelOf(save, id, 'care') : 2
    return left === 0 ? 0 : Math.ceil(left / (lv >= TRICK_AT.feedTwo ? 2 : 1)) + 1 + Math.ceil(left / (lv >= TRICK_AT.careTwo ? 2 : 1))
  }
  return {
    kind: 'animals', tasks: [{ kind: 'care', home }], left: () => acts(null),
    fill: (id, actions) => {
      const need = acts(id)
      const used = Math.min(actions, need)
      if (used >= need) left = 0
      else left = Math.max(0, Math.floor(left * (1 - used / need)))
      return used
    },
  }
}

/** A station's loads today: one an action, as many as its level, while it holds something to load (a load takes up to
 * eight of one good at one star). */
function loadJob(save: SaveV4, station: typeof STATIONS[number]): Job {
  let left = Math.min(loadsADay(save, station), sum(stationOptions(save, station).map((o) => Math.ceil(o.held / LOAD_SIZE))))
  return {
    kind: 'stations', tasks: [{ kind: 'load', station }], left: () => left,
    fill: (_id, actions) => { const used = Math.min(actions, left); left -= used; return used },
  }
}

/** The kitchen's batches tonight: the meals everyone eats, less the pantry's, a batch an action by her Cooking, while the
 * Warehouse holds food. */
function cookJob(save: SaveV4): Job {
  const mouths = working(save).length + 1 - (save.today.staff?.mouths ?? 0)
  let meals = Math.max(0, MEALS_A_DAY * mouths - pantryMeals(save))
  let batches = Math.floor(foodHeld(save).reduce((n, r) => n + r.count, 0) / 2)
  const acts = (id: string | null) => Math.min(batches, Math.ceil(meals / cookBatchAt(id ? levelOf(save, id, 'cook') : 2)))
  return {
    kind: 'kitchen', tasks: [{ kind: 'cook' }], left: () => acts(null),
    fill: (id, actions) => {
      const used = Math.min(actions, acts(id))
      meals = Math.max(0, meals - used * cookBatchAt(levelOf(save, id, 'cook')))
      batches -= used
      return used
    },
  }
}

/** An area's, a spot's or a dig's four full hauls today: a forage there, a catch, a face. */
function haulJob(kind: 'gather' | 'mining', task: FarmTask, taken = 0): Job {
  let left = Math.max(0, FULL_HAULS - taken)
  return { kind, tasks: [task], left: () => left, fill: (_id, actions) => { const used = Math.min(actions, left); left -= used; return used } }
}
const isOpen = (job: Job): boolean => job.kind === 'gather' || job.kind === 'mining'

/** Today's jobs, in the plain rule's order: the plots' tending, the animals, the loads, the kitchen, the full hauls at
 * every area and spot in reach (deepest first: they pay the most) and the digs' four faces each, then the plots' new
 * ground (a row a plot a day). */
function jobsToday(save: SaveV4): Job[] {
  const crops = cropsToday(save)
  // While the next build the Farm Rank offers waits for logs, the nearest area's four full hauls are chops.
  const chopAt = logsWanted(save) ? 'woods' : null
  const areas = reachList(save, 'forest').filter((r) => r.lock === null).reverse()
    .map((r) => haulJob('gather', r.id === chopAt ? { kind: 'chop', area: r.id as ForestAreaId } : { kind: 'forage', area: r.id as ForestAreaId }, save.today.hauls?.[r.id] ?? 0))
  const spots = reachList(save, 'fishery').filter((r) => r.lock === null).reverse().map((r) => haulJob('gather', { kind: 'fish', spot: r.id as FishingSpotId }))
  return [
    ...save.fields.plots.map((_, p) => tendJob(save, p, plotCrop(crops, p))),
    ...RANCH_HOMES.filter((h) => homeBuilt(save, h) && animalsIn(save, h).length > 0).map((h) => careJob(save, h)),
    // The Sawmill's logs wait while a build does.
    ...STATIONS.filter((s) => stationLevel(save, s) > 0 && !(s === 'sawmill' && chopAt)).map((s) => loadJob(save, s)),
    cookJob(save),
    ...areas.flatMap((a, i) => [a, spots[i]].filter((j): j is Job => j !== undefined)), ...spots.slice(areas.length),
    ...(['mine', 'quarry'] as const).filter((d) => digBuilt(save, d)).map((dig) => haulJob('mining', { kind: 'mine', dig })),
    ...save.fields.plots.map((_, p) => groundJob(save, p)).filter((j) => j.tasks.length > 0),
  ]
}

/** Logs for the next build: while it's short of them, he chops at the nearest area, up to four a day (its full hauls; the
 * plain rule leaves the farmhands what he hasn't taken). */
function chopForBuilds(start: SaveV4): SaveV4 {
  let save = start
  for (let n = 0; n < FULL_HAULS && actionsLeft(save) > 2 && logsWanted(save); n++) save = chop(save, 'woods').save
  return save
}

/** Whether the next place in the plan the Farm Rank offers, not built, is short of logs. */
function logsWanted(save: SaveV4): boolean {
  const rank = farmRankOf(save.farm.points)
  const next = PLAN.find((id) => !placeBuilt(save, id) && !save.farm.builds.includes(id) && (farmPlace(id) as BuildPlace).opens.rank <= rank)
  const line = next ? (farmPlace(next) as BuildPlace).opens.cost.goods.find((g) => g.family === 'woods' && !g.refined) : undefined
  return !!line && heldFor(save.items, line) < line.count
}

/** The plain rule: each farmhand in her order takes the first jobs with work left, as much as her actions fill, up to
 * six tasks, and one place to gather or dig (her gathering and digging share her actions by turns); past every job, she
 * gathers where it's thin. Returns the boards set, the real work on offer and what no one took. */
function assign(start: SaveV4): { save: SaveV4; offered: number; unfilled: number } {
  let save = start
  const jobs = jobsToday(save)
  const open = jobs.filter(isOpen)
  let filled = 0
  for (const [n, id] of working(save).entries()) {
    let actions = handDay(save, id)!.actions
    const tasks: FarmTask[] = []
    let gathers = false
    for (const job of jobs) {
      if (actions <= 0) break
      if (job.left() <= 0 || tasks.length + job.tasks.length > MAX_TASKS) continue
      // One place to gather or dig each: the one her actions fit best (the deepest of those), else the one with the most left.
      if (isOpen(job) && gathers) continue
      const avail = open.filter((h) => h.left() > 0).sort((a, b) => a.left() - b.left())
      const fit = isOpen(job) ? avail.find((h) => h.left() >= actions) ?? avail.at(-1) : job
      const used = fit!.fill(id, actions)
      if (used <= 0) continue
      tasks.push(...fit!.tasks)
      filled += used
      actions -= used
      if (isOpen(job)) gathers = true
    }
    // Nothing real left: she gathers where it's thin, by turns.
    if (actions > 0 && !gathers && tasks.length < MAX_TASKS && open.length > 0) tasks.push(open[n % open.length]!.tasks[0]!)
    save = setTasks(save, id, tasks)
  }
  const unfilled = sum(jobs.map((j) => j.left()))
  return { save, offered: filled + unfilled, unfilled }
}

// --- Shipping -------------------------------------------------------------------------------------------------------

/** What he keeps back from the crate: the next builds' goods, each station's loads tonight, and the kitchen's batches. */
function keeps(save: SaveV4): Map<string, number> {
  const keep = new Map<string, number>()
  const add = (key: string, n: number) => keep.set(key, (keep.get(key) ?? 0) + n)
  const next = PLAN.filter((id) => !placeBuilt(save, id) && !save.farm.builds.includes(id)).slice(0, 2)
  for (const id of next) {
    const place = farmPlace(id) as BuildPlace
    if (farmRankOf(save.farm.points) < place.opens.rank) continue
    for (const line of place.opens.cost.goods) {
      // Its goods, the cheapest first, as many as it takes or all that's held; planks still short, their logs.
      const held = heldFor(save.items, line)
      for (const p of pickFor(save.items, { ...line, count: Math.min(held, line.count) }) ?? []) add(`${p.id}@${p.stars}`, p.count)
      if (line.refined && held < line.count) {
        const raw = { ...line, refined: false }
        for (const p of pickFor(save.items, { ...raw, count: Math.min(heldFor(save.items, raw), line.count - held) }) ?? []) add(`${p.id}@${p.stars}`, p.count)
      }
    }
  }
  for (const station of STATIONS) {
    if (stationLevel(save, station) === 0) continue
    const options = stationOptions(save, station).sort((a, b) => b.held - a.held).slice(0, loadsADay(save, station))
    for (const o of options) add(`${o.input}@${o.stars}`, Math.min(o.held, 12))
  }
  // Tomorrow's play at the Kitchen.
  for (const [key, n] of botKitchenKeeps(save)) add(key, n)
  let kitchen = save
  const mouths = working(save).length + 1 - (save.today.staff?.mouths ?? 0)
  for (let n = Math.ceil(Math.max(0, MEALS_A_DAY * mouths - pantryMeals(save)) / 6); n > 0; n--) {
    const two = plainBatch(kitchen)
    if (!two) break
    for (const key of two) add(key, 1)
    kitchen = addBatch(kitchen, two, 0)
  }
  return keep
}

/** A crate of everything with a price, less what he keeps. */
function ship(save: SaveV4): SaveV4 {
  const keep = keeps(save)
  const lines: CrateLine[] = Object.entries(save.items).flatMap(([id, row]) => (goodOf(id)
    ? row.flatMap((count, s) => {
      const n = count - Math.min(count, keep.get(`${id}@${s + 1}`) ?? 0)
      return n > 0 ? [{ id, stars: s + 1, count: n }] : []
    })
    : []))
  return lines.length > 0 && actionsLeft(save) > 0 ? shipCrate(save, lines) : save
}

// --- A day, and a farm's run ------------------------------------------------------------------------------------------

const PLACE_OF: Readonly<Record<string, keyof Work>> = {
  harvest: 'field', water: 'field', plant: 'field', till: 'field', care: 'animals', mill: 'stations', sawmill: 'stations', smokehouse: 'stations', smelter: 'stations',
  cutter: 'stations', cook: 'kitchen', forage: 'gather', chop: 'gather', fish: 'gather', mine: 'mining',
}

/** Tonight's work by kind, each farmhand's from her practice tonight, her hauls split full and thin by the hauls at her
 * places; and who's in a real job. */
function measure(save: SaveV4): { work: Work; real: number; idleish: number; actions: number } {
  const night = handsTonight(save, save, talentsD, PACK)
  const hauls = night.save.today.hauls ?? {}
  const work = noWork()
  let real = 0
  let idleish = 0
  let actions = 0
  for (const line of night.lines) {
    const before = save.roster[line.id]!.practice ?? {}
    const after = night.save.roster[line.id]!.practice ?? {}
    const mine = noWork()
    for (const [aptitude, n] of Object.entries(after)) mine[PLACE_OF[aptitude]!] += n - (before[aptitude as AptitudeId] ?? 0)
    // Her hauls and faces past her place's four are thin: her share of theirs.
    const places = (save.roster[line.id]!.tasks ?? []).flatMap((t) => (t.kind === 'forage' || t.kind === 'chop' ? [t.area] : t.kind === 'fish' ? [t.spot] : t.kind === 'mine' ? [t.dig] : []))
    const all = sum(places.map((w) => hauls[w] ?? 0))
    const over = sum(places.map((w) => Math.max(0, (hauls[w] ?? 0) - FULL_HAULS)))
    const share = (n: number) => (all > 0 ? Math.round((n * over) / all) : 0)
    const thinGather = share(mine.gather)
    const thinMining = share(mine.mining)
    mine.thin = thinGather + thinMining
    mine.gather -= thinGather
    mine.mining -= thinMining
    mine.idle = line.actions - line.spent
    for (const k of Object.keys(work) as (keyof Work)[]) work[k] += mine[k]
    const useful = sum(REAL.map((k) => mine[k]))
    if (useful * 2 >= line.actions) real++
    else idleish++
    actions += line.actions
  }
  return { work, real, idleish, actions }
}

function play(start: SaveV4, stage: Stage, log: Day[]): SaveV4 {
  const season = Math.floor((start.calendar.day - 1) / DAYS_PER_SEASON)
  let save = hire(start, SCHEDULE[stage][season]!)
  save = grow(save, save.fields.plots.length < Math.ceil(handsInOrder(save).length / UMAS_A_PLOT))
  // The stairs the faces found, taken (free).
  for (const dig of ['mine', 'quarry'] as const) while (stairsLock(save, dig) === null) save = takeStairs(save, dig)
  save = stock(save)
  save = seeds(save)
  // The Kitchen, once it stands: his play (the casual bot), then the staff meal; and a recipe for the goods the farm holds
  // most of, bought in town at the day's end with spare gold. Then logs for the next build, by his own hand.
  const kitchen = botKitchen(save, 'casual', PACK)
  save = chopForBuilds(kitchen.save)
  const recipe = botRecipe(save, spare(save))
  save = tendByHand(save)
  const plan = assign(save)
  save = ship(plan.save)
  if (actionsLeft(save) > 0) save = spendActions(goToTown(save), actionsLeft(goToTown(save)))
  if (recipe && save.today.town && recipeLock(save, recipe) === null && spare(save) >= recipeOf(recipe)!.price) save = buyRecipe(save, recipe)
  const night = measure(save)
  const morning = runNight(save, { story: PACK })
  const money = morning.summary?.money ?? []
  const pantry = money.find((m) => m.kind === 'pantry')
  // Well fed tonight: a ★2+ meal from the pantry, or the staff meal (every Uma who eats it).
  const staffFed = sum(money.map((m) => (m.kind === 'staff' ? m.mouths - 1 : 0)))
  log.push({
    day: save.calendar.day, umas: handsInOrder(save).length, actions: night.actions, work: night.work, offered: plan.offered, unfilled: plan.unfilled, real: night.real, idleish: night.idleish,
    income: sum(morning.summary!.bin.map((s) => s.gold)), dishes: kitchen.dishes, score: kitchen.score, staff: kitchen.served,
    sources: Object.fromEntries(SOURCES.map((k) => [k, sum(morning.summary!.bin.filter((s) => goodOf(s.id) && sourceOf(s.id) === k).map((s) => s.gold))])) as Record<Source, number>,
    upkeep: sum(money.map((m) => (m.kind === 'upkeep' ? m.paid : 0))),
    takeout: sum(money.map((m) => (m.kind === 'takeout' ? m.due : 0))), pantry: pantry?.kind === 'pantry' ? pantry.meals : 0, fed: (pantry?.kind === 'pantry' ? pantry.fed : 0) + staffFed,
    short: money.some((m) => m.kind === 'short'), eased: Object.keys(morning.farm.market).length, gold: morning.gold, rank: farmRankOf(morning.farm.points),
    today: working(save).length, plots: morning.fields.plots.length,
  })
  return morning
}

/** A year of a farm, as its table row: averages a day, and the year's gold. */
interface Year {
  year: number
  umas: number
  actions: number
  offered: number
  unfilled: number
  work: Work
  real: number
  idleish: number
  income: number
  upkeep: number
  takeout: number
  pantry: number
  fed: number
  /** The Kitchen: dishes made, the staff meals served, its plays and their average score. */
  dishes: number
  staff: number
  plays: number
  score: number
  short: number
  gold: number
  rank: number
  plots: number
  /** The farmhands on the farm a day, on average: on their farm days. */
  today: number
  eased: number
  levels: number
  sources: Record<Source, number>
  built: string[]
}

function simulate(stage: Stage): { log: Day[]; years: Year[]; end: SaveV4; mornings: SaveV4[] } {
  let save: SaveV4 = { ...newSave(`scale-${stage}`, AT), farmer: { name: 'Sim' } }
  const log: Day[] = []
  const years: Year[] = []
  const mornings: SaveV4[] = []
  for (let n = 0; n < DAYS_PER_YEAR * YEARS; n++) {
    save = play(save, stage, log)
    if (n % DAYS_PER_SEASON === DAYS_PER_SEASON - 1) mornings.push(save)
    if ((n + 1) % DAYS_PER_YEAR === 0) {
      const days = log.slice(-DAYS_PER_YEAR)
      const avg = (pick: (d: Day) => number) => Math.round(sum(days.map(pick)) / days.length)
      const work = noWork()
      for (const k of Object.keys(work) as (keyof Work)[]) work[k] = avg((d) => d.work[k])
      years.push({
        year: years.length + 1, umas: days.at(-1)!.umas, actions: avg((d) => d.actions), offered: avg((d) => d.offered), unfilled: avg((d) => d.unfilled), work, real: avg((d) => d.real), idleish: avg((d) => d.idleish),
        income: sum(days.map((d) => d.income)), upkeep: sum(days.map((d) => d.upkeep)), takeout: sum(days.map((d) => d.takeout)), pantry: sum(days.map((d) => d.pantry)),
        sources: Object.fromEntries(SOURCES.map((k) => [k, sum(days.map((d) => d.sources[k]))])) as Record<Source, number>,
        fed: avg((d) => d.fed), dishes: sum(days.map((d) => d.dishes)), staff: days.filter((d) => d.staff).length,
        plays: days.filter((d) => d.score !== null).length,
        score: Math.round(sum(days.map((d) => d.score ?? 0)) / Math.max(1, days.filter((d) => d.score !== null).length)),
        short: days.filter((d) => d.short).length, gold: save.gold, rank: farmRankOf(save.farm.points), plots: save.fields.plots.length,
        today: avg((d) => d.today), eased: avg((d) => d.eased), levels: sum(STATIONS.map((s) => stationLevel(save, s))),
        built: PLAN.filter((id) => placeBuilt(save, id)),
      })
    }
  }
  return { log, years, end: save, mornings }
}

const farms = Object.fromEntries(STAGES.map((stage) => [stage, simulate(stage)])) as Record<Stage, ReturnType<typeof simulate>>
/** Each farm's stage: the years it works with all its Umas (10 from year 2, 20 from year 3, 50 in year 4). */
const STAGE_YEARS: Readonly<Record<Stage, readonly number[]>> = { 10: [2, 3, 4], 20: [3, 4], 50: [4] }

if (process.env.SCALE) {
  const g = (n: number) => `${n.toLocaleString('en-US')}g`
  const row = (label: string, pick: (y: Year) => string | number) => (years: readonly Year[]) => `| ${label} | ${years.map((y) => pick(y)).join(' | ')} |`
  const ROWS = [
    row('Umas working the farm, at the year’s end', (y) => y.umas),
    row('On the farm a day (their farm days)', (y) => y.today),
    row('Their actions a day', (y) => y.actions),
    row('Real work on offer a day (taken, and waiting)', (y) => `${y.offered} (${y.offered - y.unfilled}, ${y.unfilled})`),
    row('The field: tending and new ground', (y) => y.work.field),
    row('The animals', (y) => y.work.animals),
    row('The stations’ loads', (y) => y.work.stations),
    row('The kitchen', (y) => y.work.kitchen),
    row('Full hauls (an area’s or a spot’s first four)', (y) => y.work.gather),
    row('Faces (a dig’s first four)', (y) => y.work.mining),
    row('**Thin** hauls and faces (past the four)', (y) => y.work.thin),
    row('**Idle** actions (nothing to do)', (y) => y.work.idle),
    row('**Umas in real jobs** · idle-ish', (y) => `**${y.real}** · ${y.idleish}`),
    row('The bin, the year', (y) => g(y.income)),
    row('Upkeep, the year', (y) => g(y.upkeep)),
    row('Takeout, the year', (y) => g(y.takeout)),
    row('Meals from the pantry, the year', (y) => y.pantry.toLocaleString('en-US')),
    row('Well fed, a night', (y) => `${y.fed} of ${y.today}`),
    row('The Kitchen: plays (their average score) · dishes made, the year', (y) => `${y.plays} (${y.score}) · ${y.dishes.toLocaleString('en-US')}`),
    row('Staff meals served, the year', (y) => y.staff),
    row('Short nights', (y) => y.short),
    row('Gold at the year’s end', (y) => g(y.gold)),
    row('Farm Rank · plots · station levels', (y) => `${y.rank} · ${y.plots} · ${y.levels}`),
    row('Goods eased by a flood, a day', (y) => y.eased),
  ]
  for (const stage of STAGES) {
    const { years, end } = farms[stage]
    console.log(`\n##### The farm of ${stage}\n\n|  | ${years.map((y) => `Year ${y.year}`).join(' | ')} |\n|---|${years.map(() => '---').join('|')}|`)
    console.log(ROWS.map((r) => r(years)).join('\n'))
    console.log(`\nBuilt: ${years.map((y) => `Y${y.year} ${y.built.join(', ')}`).join('; ')}. Shipped ${g(end.farm.counts[GOLD_SHIPPED] ?? 0)}. The bin by source, year 4: ${JSON.stringify(years.at(-1)!.sources)}`)
  }
}

describe('the farm at scale: 10, 20 and 50 Umas, brought in over four years', () => {
  const year = (stage: Stage, n: number): Year => farms[stage].years[n - 1]!

  it('pays every night, at every stage: never a short night, never half pace', () => {
    for (const stage of STAGES) expect(farms[stage].log.filter((d) => d.short).map((d) => d.day), `${stage}`).toEqual([])
  })

  it('brings its Umas in over four years: 10 by year 2, 20 by year 3, 50 by year 4', () => {
    expect(STAGES.map((stage) => STAGE_YEARS[stage].map((y) => year(stage, y).umas))).toEqual([[10, 10, 10], [20, 20], [50]])
  })

  it('keeps 10 and 20 Umas fully in real jobs on their farm days, with real work still waiting', () => {
    for (const stage of [10, 20] as const) {
      const last = year(stage, 4)
      // Two thirds of them on the farm a day, each on her farm day, every one in a real job.
      expect(last.today, `${stage}`).toBe(Math.round((stage * 2) / 3))
      expect(last.real, `${stage}`).toBeGreaterThanOrEqual(last.today - 1)
      expect(last.unfilled, `${stage}`).toBeGreaterThan(0)
      expect(last.work.thin + last.work.idle, `${stage}`).toBeLessThan(last.actions / 10)
    }
  })

  it('brings 50 Umas to the farm two thirds a day, on their farm days, nearly all in real jobs, with real work still waiting', () => {
    const last = year(50, 4)
    // Farm days hold the fifty to about 33 a day (from 44 in Spring, 50 from Summer): the farm's real jobs still take them.
    expect(last.today).toBeGreaterThan(30)
    expect(last.today).toBeLessThan(last.umas)
    expect(last.real).toBeGreaterThanOrEqual(last.today - 1)
    expect(last.unfilled).toBeGreaterThan(0)
    expect(last.work.thin + last.work.idle).toBeLessThan(last.actions / 10)
    expect(last.plots).toBe(6)
  })

  it('grows the work with the people: plots and station levels as the Farm Rank comes', () => {
    expect([year(10, 4).plots, year(20, 4).plots, year(50, 4).plots]).toEqual([2, 4, 6])
    expect(year(50, 4).levels).toBe(25)
  })

  it('builds the Kitchen once the Farm Rank offers it, plays it most days and serves the staff meal', () => {
    for (const stage of STAGES) {
      const last = year(stage, 4)
      expect(last.built, `${stage}`).toContain('kitchen')
      expect(last.plays, `${stage}`).toBeGreaterThan(DAYS_PER_YEAR / 4)
      expect(last.staff, `${stage}`).toBeGreaterThan(DAYS_PER_YEAR / 2)
      expect(last.score, `${stage}`).toBeGreaterThanOrEqual(50)
    }
  })

  it('keeps a save the parse takes, every season', () => {
    for (const stage of STAGES) for (const morning of farms[stage].mornings) expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})

