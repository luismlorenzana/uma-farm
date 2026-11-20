import { setImmediate } from 'node:timers/promises'
import { describe, expect, it } from 'vitest'
import { goToTown } from '../farm/actions'
import { payBuild } from '../farm/builds'
import { dateOf } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { handsWorking, setTasks } from '../farm/farmhands'
import { CROPS } from '../fields/crops'
import { setFieldPlan } from '../fields/production'
import { FISHING_SPOTS, FOREST_AREAS, STATIONS, STATION_JOBS, stationJobOf, type StationId } from '../gathering/ids'
import { FISHERY, FOREST } from '../gathering/tables'
import { setStationPlan } from '../gathering/stations'
import { discovered } from '../goods/discovery'
import { cropBaseGrade, cropGradeOf, goodOf, seedId, type CropId } from '../goods/ids'
import { assistantLock, dishesHeld, finishPlay, kitchenPlayBlock, startKitchenPlay } from '../kitchen/kitchen'
import { botMenu, botTaps } from '../kitchen/stove-bots'
import { runNight } from '../night/end-day'
import { buyFodder, setCollectionCap } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate } from '../save/bin'
import { parseSaveV6 } from '../save/parse-v4'
import { buy, shopLines } from '../save/shop'
import { bareTile, FIELD_TILES, newLove, newRosterUma, newSave, type Animal, type FarmSave, type FarmTask } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { exactMenuLine, knownRestaurantRecipes, RESTAURANT_RECIPES, restaurantRecipe } from './recipes'
import { nextRestaurantStage, saveDishForMeals, serveTicket, serverLock, settleRestaurant, shiftBlock, startRestaurantShift } from './restaurant'
import { isRestaurantDish, LAST_STAGE, restaurantGrade, restaurantId, restaurantStage, type StockPortions } from './rules'

const COMPONENTS = [...new Set(RESTAURANT_RECIPES.flatMap((recipe) => recipe.ingredients.map(({ id }) => id).filter(isRestaurantDish)))]
const PROOFS = [...new Set(RESTAURANT_RECIPES.flatMap((recipe) => recipe.proofs))].filter((id) => !isRestaurantDish(id))
const STAPLE = restaurantId(11) // Shiitake and basil can both come from the Woods year-round.
const AIMS = new Map(PROOFS.map((id) => [id, 4]))
for (const id of COMPONENTS) {
  for (const ingredient of restaurantRecipe(id)!.ingredients) {
    if (!isRestaurantDish(ingredient.id)) AIMS.set(ingredient.id, (AIMS.get(ingredient.id) ?? 0) + ingredient.count * 3)
  }
}
const RAW = PROOFS.filter((id) => !goodOf(id)?.input)
const START = 49 // An established farm at Spring 1 of Year 2.
const AT = '2026-11-19T12:00:00.000Z'
const TIME = Date.parse(AT)

function buildFarm(crew: number) {
  const ids = Array.from({ length: crew }, (_, i) => String(9_800_001 + i))
  const story = castPack(ids)
  const plots = crew >= 50 ? 5 : crew >= 20 ? 3 : 2
  const base = newSave(`f98-scale-${crew}`, AT)
  const practice = { harvest: 160, plant: 150, water: 150, care: 180, mill: 150, sawmill: 150, smokehouse: 150, fish: 210, cook: 60, forage: 150 }
  const animals: Animal[] = (['chicken', 'duck', 'cow', 'goat'] as const).map((kind) =>
    ({ id: `${kind}-1`, kind, fondness: 100, ready: false, fed: false, cared: false }))
  let save: FarmSave = {
    ...base, farmer: { name: 'Robin' }, gold: 320_000, calendar: { ...base.calendar, day: START },
    fields: { plots: Array.from({ length: plots }, () => ({ tiles: Array.from({ length: FIELD_TILES }, () => bareTile('tilled')) })) },
    buildings: { ...base.buildings, kitchen: 1, coop: 1, barn: 1, mill: 5, sawmill: 3, smokehouse: 3, dock: 1, boat: 1 },
    ranch: { silo: 80, animals },
    // The construction stock is spent that day. No ingredient stock or discovery records are seeded.
    items: { 'pine-plank': [80, 0, 0, 0, 0], 'carp-fillet': [40, 0, 0, 0, 0], carrot: [30, 0, 0, 0, 0] },
    farm: { ...base.farm, points: FARM_RANK_POINTS[9]!, counts: { [GOLD_SHIPPED]: FARM_RANK_POINTS[9]! * 100 } },
    roster: Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1, practice }])),
    love: Object.fromEntries(ids.map((id) => [id, newLove()])),
  }
  save = payBuild(save, 'restaurant')
  const occupied = new Map<number, Set<string>>()
  const tiles = new Map<number, number[]>()
  const cropsBySeason = new Map<string, Set<CropId>>()
  for (const id of RAW) {
    const crop = cropGradeOf(id)
    if (!crop) continue
    const { crop: species, grade } = crop
    const base = cropBaseGrade(species)
    if (grade === base && species !== 'basil' && Object.values(FOREST).some((area) =>
      Object.values(area.seasons).some((shares) => shares.some(([good]) => good === id)))) continue
    const season = CROPS[species].seasons[0]!
    const tree = species === 'apple'
    let row = tree ? 0 : 1
    while (CROPS[species].seasons.some((season) => occupied.get(row)?.has(season))) row++
    occupied.set(row, new Set([...occupied.get(row) ?? [], ...CROPS[species].seasons]))
    const plot = Math.floor(row / 5)
    const rowInPlot = row % 5
    const selected = tiles.get(plot) ?? []
    for (let i = 0; i < (tree ? 3 : 4); i++) {
      const tile = rowInPlot * 8 + i
      if (!selected.includes(tile)) selected.push(tile)
    }
    tiles.set(plot, selected)
    save = setFieldPlan(save, plot, rowInPlot, season, { crop: species, grade: base, harvestNext: grade > base })
    const plants = cropsBySeason.get(season) ?? new Set<CropId>()
    plants.add(species)
    cropsBySeason.set(season, plants)
  }
  return { save, story, tiles, cropsBySeason }
}

function gatherJobs(save: FarmSave): FarmTask[] {
  const season = dateOf(save.calendar.day).season
  const need = (id: string) => !AIMS.has(id) ? 0 : !discovered(save, id) ? 5 : (goodCount(save.items, id) < AIMS.get(id)! ? 1 : 0)
  const forest = FOREST_AREAS.map((area) => ({
    task: { kind: 'forage', area } as const,
    weight: FOREST[area].seasons[season].reduce((n, [id, share]) => n + need(id) * Math.max(10, share), 0),
  }))
  const fish = FISHING_SPOTS.map((spot) => ({
    task: { kind: 'fish', spot, mode: (need('carp-grade-2') || need('carp-fillet-grade-2')) && spot === 'pond' ? 'improved' : 'standard' } as const,
    weight: FISHERY[spot].seasons[season].reduce((n, [id, share]) => n + (need(id) + (id === 'carp' && spot === 'pond' ? need('carp-grade-2') : 0)) * Math.max(10, share), 0),
  }))
  return [...forest, ...fish].filter((job) => job.weight > 0).sort((a, b) => b.weight - a.weight).map(({ task }) => task)
}

function plans(save: FarmSave): { save: FarmSave; stations: StationId[] } {
  const stations: StationId[] = []
  for (const station of STATIONS) {
    if (!save.buildings[station]) continue
    const targets = PROOFS.filter((id) => {
      const job = stationJobOf(id)
      const input = goodOf(id)?.input
      return job && STATION_JOBS[job].station === station && input && goodCount(save.items, input) > 0
        && (!discovered(save, id) || goodCount(save.items, id) < AIMS.get(id)!)
    }).sort((a, b) => Number(discovered(save, a)) - Number(discovered(save, b)))
      .slice(0, 6).map((output) => ({ output, target: AIMS.get(output)! }))
    save = setStationPlan(save, station, targets)
    if (targets.length) stations.push(station)
  }
  return { save, stations }
}

function stockShift(save: FarmSave, stage: number): StockPortions[] {
  const rule = restaurantStage(stage)!
  const held = dishesHeld(save).filter((dish) => !COMPONENTS.includes(dish.id))
  const earlier = (id: string) => restaurantGrade(id) > 0 && restaurantGrade(id) < stage
  const types = [...new Set(held.map((dish) => dish.id))].sort((a, b) => Number(earlier(b)) - Number(earlier(a)))
  const tray: StockPortions[] = []
  const want = (key: string, count: number) => {
    const existing = tray.find((line) => line.key === key)
    if (existing) existing.count += count
    else tray.push({ key, count })
  }
  for (const dish of types.slice(0, rule.types)) want(held.find((lot) => lot.id === dish)!.key, 1)
  let left = rule.tickets - tray.reduce((n, lot) => n + lot.count, 0)
  for (const lot of held.filter((lot) => types.slice(0, rule.types).includes(lot.id))) {
    const count = Math.min(left, lot.count - (tray.find(({ key }) => key === lot.key)?.count ?? 0))
    if (count > 0) want(lot.key, count)
    left -= count
    if (left === 0) break
  }
  return tray
}

function bake(save: FarmSave, hands: string[], known: ReturnType<typeof knownRestaurantRecipes>) {
  const assistant = hands.find((id) => assistantLock(save, id) === null) ?? null
  const component = known.find(({ id }) => COMPONENTS.includes(id) && !discovered(save, id)
    && kitchenPlayBlock(save, [exactMenuLine(save, restaurantRecipe(id)!, 1)], assistant) === null)
  const staple = known.find(({ id }) => id === STAPLE)
  const useStaple = staple && goodCount(save.items, STAPLE) < 10
  const candidates = component ? [exactMenuLine(save, component, kitchenPlayBlock(save, [exactMenuLine(save, component, 2)], assistant) === null ? 2 : 1)]
    : useStaple ? [exactMenuLine(save, staple, 4)] : null
  const menu = candidates && !kitchenPlayBlock(save, candidates, assistant) ? candidates : botMenu(save)
  if (!menu || kitchenPlayBlock(save, menu, assistant)) return save
  const cooking = startKitchenPlay(save, menu, assistant)
  const play = cooking.workshops.current!
  return finishPlay(cooking, botTaps(play.seed, play.length * 1000, 'careful')).save
}

describe('Restaurant playthrough on a roster-run farm', () => {
  it.each([10, 20, 50])('serves all eight stages and learns 120 recipes with %i Umas', async (crew) => {
    const fixture = buildFarm(crew)
    let { save } = fixture
    const { story } = fixture
    const clears: number[] = []
    let stalledShifts = 0
    let ingredientNights = 0
    let shipped = 0
    let served = 0
    let meals = 0
    let missed = 0
    let converted = false
    let platedForBin = false
    expect(save.buildings.restaurant).toBeUndefined()
    for (let night = 0; night < 144; night++) {
      const day = save.calendar.day
      if (night % 8 === 0) await setImmediate()
      const { season, day: date } = dateOf(day)
      if (date === 1) {
        const seeds = shopLines(save).filter(({ id }) => [...fixture.cropsBySeason.get(season) ?? []].some((crop) => seedId(crop) === id))
        for (const line of seeds) if (goodCount(save.items, line.id) < 8) save = buy(goToTown(save), line, 16)
      }
      if (save.ranch.silo < 10) save = buyFodder(goToTown(save), 70)
      if (goodCount(save.items, 'milk') >= 5) save = setCollectionCap(save, 'cow', goodCount(save.items, 'milk-grade-3') < 8 ? 1 : 0)
      const known = knownRestaurantRecipes(save)
      const hands = handsWorking(save, story)
      save = bake(save, hands.slice().reverse(), known)
      if (save.buildings.restaurant && (save.workshops.restaurant?.cleared ?? 0) < LAST_STAGE) {
        const stage = nextRestaurantStage(save)
        const tray = stockShift(save, stage)
        const server = hands.find((id) => serverLock(save, id, story) === null) ?? null
        const block = shiftBlock(save, stage, tray, server, story)
        if (block) stalledShifts++
        else {
          save = startRestaurantShift(save, stage, tray, server, TIME, { story })
          const shift = save.workshops.restaurant!.shift!
          for (const [i, ticket] of shift.tickets.entries()) {
            if ((stage === 4 || stage === 6) && i === shift.tickets.length - 1) continue
            save = serveTicket(save, i, parseStockKey(shift.tray[ticket.plate]!.key)!.id, TIME + ticket.opens)
          }
          save = settleRestaurant(save)
          const result = save.workshops.restaurant!.last!
          expect(result.cleared).toBe(true)
          expect(knownRestaurantRecipes(save).every((recipe) => recipe.grade <= stage)).toBe(true)
          clears.push(day - START)
          served += result.sales + result.tips
          missed += shift.tickets.length - result.covers
          expect(parseSaveV6(JSON.parse(JSON.stringify(save)))).toEqual(save)
        }
      }
      // A component produced by the Kitchen has separate uses without duplicating the lot.
      const surplus = dishesHeld(save).find((lot) => COMPONENTS.includes(lot.id) && lot.count > 2)
      if (surplus && !platedForBin) {
        save = shipCrate(save, [{ id: surplus.id, stars: surplus.stars, count: 1 }])
        platedForBin = true
      }
      if (surplus && !converted && goodCount(save.items, surplus.id) >= 2) {
        save = saveDishForMeals(save, surplus.key)
        converted = true
      }
      if (known.length < (save.workshops.restaurant?.cleared ?? 0) * 15) ingredientNights++
      const plan = plans(save)
      save = plan.save
      const wild = gatherJobs(save)
      const teams: FarmTask[][] = [...fixture.tiles].flatMap(([plot, tiles]) =>
        [tiles.filter((i) => i < 24), tiles.filter((i) => i >= 24)].filter((group) => group.length).map((tiles): FarmTask[] => [
          { kind: 'harvest', plot, tiles }, { kind: 'water', plot, tiles }, { kind: 'plant', plot, tiles }, { kind: 'water', plot, tiles },
        ]))
      teams.push([{ kind: 'care', home: 'coop' }], [{ kind: 'care', home: 'barn' }])
      if (plan.stations.length) teams.push(plan.stations.map((station) => ({ kind: 'load', station })))
      if (crew >= 20) teams.push([{ kind: 'cook' }])
      for (const [i, id] of hands.entries()) {
        const gather = wild.length ? [wild[(i + day) % wild.length]!] : []
        const tasks = [...teams[i] ?? [], ...gather]
        save = setTasks(save, id, tasks)
      }
      save = runNight(save, { story })
      shipped += save.summary!.bin.reduce((n, lot) => n + lot.gold, 0)
      meals += save.summary!.money?.find((line) => line.kind === 'pantry')?.meals ?? 0
      if (knownRestaurantRecipes(save).length === 120 && clears.length === 8) break
    }
    const missing = RESTAURANT_RECIPES.filter((recipe) => !knownRestaurantRecipes(save).includes(recipe))
      .map((recipe) => [recipe.id, recipe.proofs.filter((id) => !discovered(save, id))])
    expect(missing).toEqual([])
    expect(clears).toHaveLength(8)
    expect(platedForBin && converted).toBe(true)
    expect(COMPONENTS.every((id) => (save.farm.counts[`cooked:${id}`] ?? 0) > 0)).toBe(true)
    expect(PROOFS.every((id) => (save.farm.discoveries?.[id] ?? 0) >= START)).toBe(true)
    console.info({ crew, clears, ingredientNights, stalledShifts, allLearned: save.calendar.day - START, shipped, served, meals, missed })
  }, 90_000)
})
