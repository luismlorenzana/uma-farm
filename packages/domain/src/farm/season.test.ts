// A simulated first year: the farmer plays the year's 48 days on the game's own rules, ten actions a day, by a plain bot,
// and pays his way. Each morning he harvests what's ripe, waters what grows, plants the tilled soil he has seeds for,
// tills and clears a little more while the field is small, ships once there's a crate's worth, goes into town for the
// season's quickest seeds when they run out, and spends what's left fishing, foraging and chopping (chopping first while
// his next build waits for logs), each where it isn't thin yet today (four full hauls a place; a farmhand's places left to
// her). He keeps the logs and fish his next build takes, and builds as he goes, never into a
// night he can't pay: the Mill on a loan from the mayor's office as soon as he holds its logs (Spring), then the Farm
// Rank 3 stations, with his own gold or a loan. Alone, nobody lives on the farm: an Uma there eats, and one with no work
// costs her upkeep and her meals for nothing. Every night the farm eats, then pays its bill after the bin: the loans'
// shares, then the takeout and the upkeep. **He eats takeout** (30g a night) while his gold holds, and cooks a batch
// from his cheapest goods to bridge a night it wouldn't: six meals, his next three nights'.
//
// **Beside him, the same year with two farmhands**, two friends from town invited to work on Spring 2 (10g of upkeep
// each a night from then on): one waters the whole field, the other forages and fishes at the deepest places the farm
// reaches. Two Umas live on the farm from Summer, three from Autumn and four from Winter (the Dorm's second level for the
// fourth), though none of them works it. The farmer then grows a field twice the size, plants it and harvests it, waters
// only what she won't reach tonight, gathers no more than he did alone, and spends the rest of his day with the people in
// town; their aptitudes grow with the year. **The field hand is the Cook**: once the field's watered, her actions left
// cook a batch each until the pantry holds tonight's meals, and he keeps back from the bin the goods her batches take
// (★2 goods first, whose meals leave everyone well fed). The same farm on takeout alone is the measure of what she saves.
//
// **And the whole farm, over two years**: the same farm with its two farmhands builds the Coop as soon as the Farm Rank
// offers it and its logs and vegetables are held, keeps four chickens there, fed from fodder he buys in town, and invites
// a third friend to care for them (feed, collect, care); in its second year it builds the Mine (its planks sawn from
// his logs at the Sawmill), invites a fourth to work its face, and takes the stairs whenever she finds them. The Coop and
// the Mine add their upkeep (15g a night each) and their farmhands' (10g each); the chickens cost their price and their
// feed. The Cook feeds them all.
//
// Spring's checks are the first season's: the day's budget holds, watered crops grow and dry ones don't, the season's
// end withers what's left, and the bin pays. The year's: the bill is always paid (never a short night), the loan
// clears, every season earns more than its takeout, upkeep and loans take, and the year ends richer than it started;
// with the farmhands, richer than the farmer alone, his own watering mostly theirs. Food's: takeout bites from the first
// night and never sinks the farm alone, and cooking every night he can alone eats every meal and never runs short; the
// Cook's farm eats from the pantry and ends the year richer than on takeout.
// The whole farm's: never a short night in two years, every season ahead of its bill, and the eggs and the ores each
// paying more than their place's nights cost (its upkeep, its farmhand's, the feed and the hens). No story pack (the
// night runs the farm's steps). `SEASON=1` prints the six runs.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown, spendActions } from './actions'
import { heldFor, payBuild } from './builds'
import { DAYS_PER_SEASON, DAYS_PER_YEAR, dateOf, SEASONS, type Season } from './calendar'
import { borrowFor, buildOrders, UPKEEP_BUILDING, UPKEEP_RESIDENT, upkeepOf } from './economy'
import { aptitudeOf, aptitudesOf, handsTonight, setTasks } from './farmhands'
import { addBatch, BATCH_GOODS, cookBatch, cookBatchAt, foodHeld, mealsNeeded, MEALS_A_DAY, pantryMeals, plainBatch, TAKEOUT_PRICE } from './food'
import { talentsD } from './talents'
import { bedsAt, farmRankOf } from './farm'
import { buyDorm, dormBought } from './dorm'
import { placeBuilt, farmPlace, type FarmPlaceId } from './places'
import { clearTile, harvestTile, plantTile, seedsInSeason, stagesOf, TILES_HARVESTED, tillTile, waterTile } from '../fields/fields'
import { stairsLock, takeStairs } from '../gathering/digs'
import { chop, fish, forage, reachList, thinToday } from '../gathering/hauls'
import { HOME_COUNT } from '../gathering/kinds'
import { LOAD_SIZE, startLoad, stationOptions } from '../gathering/stations'
import { goodOf, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { animalsIn, ANIMALS, buyAnimal, buyFodder, FODDER_PRICE, siloRoom } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { fieldTiles, FIELD_TILES, isOvergrown, newLove, newRosterUma, newSave, type FarmTask, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** The three runs: the farmer alone, with two farmhands, and the whole farm (the Coop and the Mine too). */
type Run = 'alone' | 'hands' | 'whole'
/** How the farm eats: all takeout, or cooked (alone, the farmer's batches on a tight night; with the farmhands, one of
 * them on Cook); or, alone, a batch every night the pantry won't hold his two meals (`stove`). */
type Food = 'takeout' | 'cook' | 'stove'
/** The field the bot keeps: no more tiles growing than it can water. */
const KEEP_GROWING = 5
/** With two farmhands, the field he keeps: one of them waters it. */
const KEEP_GROWING_HANDS = 10
/** With the farmhands, he gathers no more than he did alone (about four actions a day): the rest go to the people. */
const GATHER_ALONE = 4
/** The two farmhands, friends from town invited to work on Spring 2: one waters the field, one gathers. On the whole farm,
 * a third cares for the Coop from the day it stands, a fourth works the Mine's face. */
const HANDS = { field: '9101', gather: '9102' } as const
const RANCH_HANDS = { coop: '9103', mine: '9104' } as const
/** The Cook: the field hand, once the field's watered. */
const COOK = HANDS.field
const HIRED = 2
const FIELD = Array.from({ length: FIELD_TILES }, (_, i) => i)
/** What he builds, in order, each from its season once the Farm Rank offers it: the Mill as soon as he holds its logs,
 * the Dorm's second level for a fourth Uma, then the Farm Rank 3 stations. Alone, nobody lives on the farm: no Dorm. */
const PLAN: readonly { project: string; from: Season }[] = [
  { project: 'mill', from: 'spring' }, { project: 'dorm:2', from: 'autumn' }, { project: 'sawmill', from: 'spring' }, { project: 'smokehouse', from: 'spring' },
]
const PLAN_ALONE = PLAN.filter((p) => !p.project.startsWith('dorm'))
/** The whole farm's: the Coop after the Mill (from Summer, its Farm Rank's season), the rest as before, then the Mine. */
const PLAN_WHOLE: readonly { project: string; from: Season }[] = [
  { project: 'mill', from: 'spring' }, { project: 'coop', from: 'summer' }, { project: 'dorm:2', from: 'autumn' }, { project: 'sawmill', from: 'spring' },
  { project: 'smokehouse', from: 'spring' }, { project: 'mine', from: 'spring' },
]
const planOf = (run: Run) => (run === 'whole' ? PLAN_WHOLE : run === 'alone' ? PLAN_ALONE : PLAN)
/** The Coop's chickens, and the gold he keeps back for the nights when buying hens and feed. */
const HENS = 4
const RESERVE = 600
/** Fodder: a buy when the silo runs low. */
const FEED_LOW = 12
const FEED_BUY = 40
/** Who lives on the farm from each season, as the beds allow: invented ids, nobody working yet. The farmer alone keeps
 * nobody: everyone who lives on the farm eats, and an Uma who doesn't work it costs her upkeep and her meals for nothing. */
const RESIDENTS: Readonly<Record<Season, readonly string[]>> = {
  spring: [], summer: ['9001', '9002'], autumn: ['9001', '9002', '9003'], winter: ['9001', '9002', '9003', '9004'],
}
const residentsOf = (run: Run, season: Season): readonly string[] => (run === 'alone' ? [] : RESIDENTS[season])

/** What the bot did, day by day. */
interface Day {
  day: number
  spent: number
  /** The farmhands' actions spent tonight, in all. */
  hands: number
  /** His own actions left for the people, in town. */
  people: number
  harvested: number
  watered: number
  planted: number
  grewTonight: number
  gold: number
  /** The night's bin, upkeep and loans' shares. */
  income: number
  upkeep: number
  repaid: number
  short: boolean
  built: string | null
  /** The whole farm's: the night's eggs and ores sold, and what the hens and their feed cost today. */
  eggs: number
  ores: number
  ranchSpent: number
  /** The night's food: the mouths at the table, meals from the pantry, meals bought in and their gold, meals spoiled,
   * the farmer's batches today and the Cook's meals tonight, the goods the kitchen took, and the Umas a ★2+ meal fed. */
  mouths: number
  pantry: number
  takeoutMeals: number
  takeout: number
  spoiled: number
  batches: number
  cooked: number
  goods: number
  fed: number
}

const growing = (save: SaveV4): number[] => fieldTiles(save).flatMap((t, i) => (t.crop !== null && !t.ready ? [i] : []))
const left = actionsLeft
/** The places a farmhand gathers at tonight: he leaves them to her. */
const hers = (save: SaveV4): string[] => Object.values(save.roster).flatMap((u) => (u.tasks ?? []).flatMap((t) => (t.kind === 'forage' ? [t.area] : t.kind === 'fish' ? [t.spot] : [])))
/** Whether a place is thin for him today: its four full hauls taken, or it's a farmhand's tonight. */
const thinFor = (save: SaveV4, where: string): boolean => thinToday(save, where) || hers(save).includes(where)
/** Where he gathers: the nearest area or spot in his reach that isn't thin for him yet today (four full hauls a place,
 * a farmhand's left to her), else the nearest. */
const fresh = (save: SaveV4, place: 'forest' | 'fishery'): string => {
  const open = reachList(save, place).filter((r) => r.lock === null)
  return (open.find((r) => !thinFor(save, r.id)) ?? open[0]!).id
}
/** A haul, by turns: a catch, a forage, a chop, each where it isn't thin; the next by turn when its place is thin and
 * another's isn't. */
function haul(save: SaveV4, k: number): SaveV4 {
  const kinds = [0, 1, 2].map((n) => (k + n) % 3)
  const pick = kinds.find((n) => !thinFor(save, fresh(save, n === 0 ? 'fishery' : 'forest'))) ?? k % 3
  return pick === 0 ? fish(save, fresh(save, 'fishery')).save : pick === 1 ? forage(save, fresh(save, 'forest')).save : chop(save, fresh(save, 'forest')).save
}
/** Whether a project is done: built, paid today, or the Dorm's level bought. */
const done = (save: SaveV4, project: string): boolean => {
  const dorm = /^dorm:(\d)$/.exec(project)
  return dorm ? dormBought(save) >= Number(dorm[1]) : placeBuilt(save, project as FarmPlaceId) || save.farm.builds.includes(project as FarmPlaceId)
}
const nextProject = (save: SaveV4, run: Run): string | null => planOf(run).find((p) => !done(save, p.project))?.project ?? null
/** Whether the next build's season has come. */
const nextInSeason = (save: SaveV4, run: Run): boolean => {
  const next = planOf(run).find((p) => !done(save, p.project))
  return !!next && SEASONS.indexOf(dateOf(save.calendar.day).season) >= SEASONS.indexOf(next.from)
}
/** The goods the next build takes, from its season, held back from the bin: its logs, fish, vegetables and planks; for
 * planks, the logs the planks still lack. */
function keep(save: SaveV4, id: string, run: Run): number {
  const next = farmPlace(nextProject(save, run))
  const good = goodOf(id)
  if (!next || next.opens.by !== 'build' || !good || !nextInSeason(save, run)) return 0
  const line = next.opens.cost.goods.find((g) => g.family === good.family && g.refined === good.refined)
  if (line) return line.count
  const planks = good.refined ? undefined : next.opens.cost.goods.find((g) => g.family === good.family && g.refined)
  return planks ? Math.max(0, planks.count - heldFor(save.items, { family: planks.family, refined: true })) : 0
}
/** Whether the next build still waits for logs: he chops first. */
const wantsLogs = (save: SaveV4, run: Run): boolean => keep(save, 'pine-log', run) > heldFor(save.items, { family: 'woods', refined: false })

/** Everyone the season has on the farm, home in the Dorm, as many as its beds take. */
function residents(save: SaveV4, run: Run): SaveV4 {
  const ids = residentsOf(run, dateOf(save.calendar.day).season).slice(0, bedsAt(save.dorm.level))
  if (ids.every((id) => save.dorm.home.includes(id))) return save
  return {
    ...save, roster: { ...save.roster, ...Object.fromEntries(ids.filter((id) => !save.roster[id]).map((id) => [id, newRosterUma(save.calendar.day)])) },
    love: { ...save.love, ...Object.fromEntries(ids.filter((id) => !save.love[id]).map((id) => [id, newLove()])) }, dorm: { ...save.dorm, home: [...ids] },
  }
}

/** A friend from town invited to work today, with her tasks. */
function invite(save: SaveV4, id: string, tasks: FarmTask[]): SaveV4 {
  const day = save.calendar.day
  const next = save.roster[id] ? save : { ...save, roster: { ...save.roster, [id]: { ...newRosterUma(day), farmhand: day } }, love: { ...save.love, [id]: { ...newLove(), level: 3 } } }
  return setTasks(next, id, tasks)
}

/** From Spring 2, the two farmhands: friends from town (they live there), each with her tasks; the gatherer's follow the
 * farm's reach to its deepest area and spot. Cooking, the field hand is the Cook: once the field's watered, her actions
 * left cook a batch each until the pantry holds tonight's meals. */
function hire(save: SaveV4, food: Food): SaveV4 {
  if (save.calendar.day < HIRED) return save
  const deepest = (place: 'forest' | 'fishery') => reachList(save, place).filter((r) => r.lock === null).at(-1)!.id
  const water: FarmTask = { kind: 'water', tiles: FIELD }
  const next = invite(save, HANDS.field, food === 'cook' ? [water, { kind: 'cook' }] : [water])
  return invite(next, HANDS.gather, [{ kind: 'forage', area: deepest('forest') as 'woods' }, { kind: 'fish', spot: deepest('fishery') as 'pond' }])
}

/** The goods tonight's kitchen takes, kept back from the crate: with a Cook, two for each batch she'll need for what the
 * pantry is short, the plain rule's (the cheapest first). */
function kitchenKeeps(save: SaveV4, food: Food, run: Run): Map<string, number> {
  const keeps = new Map<string, number>()
  if (food !== 'cook' || run === 'alone' || !save.roster[COOK]) return keeps
  const level = aptitudeOf(save.roster[COOK]!, 'cook', () => 3).level
  const short = Math.max(0, mealsNeeded(save) - pantryMeals(save))
  // Her batches tonight, by the plain rule, as she'll take them.
  let kitchen = save
  for (let n = Math.ceil(short / cookBatchAt(level)); n > 0; n--) {
    const two = plainBatch(kitchen)
    if (!two) break
    for (const key of two) keeps.set(key, (keeps.get(key) ?? 0) + 1)
    kitchen = addBatch(kitchen, two, 0)
  }
  return keeps
}

/** Alone, cooking: the farmer pays takeout while his gold can, and cooks when it can't: while his gold won't cover a few
 * nights of takeout and the pantry won't hold tonight's two meals, a batch from his two cheapest goods of food (a ★2
 * meal does nothing for him). */
function cookAlone(start: SaveV4, day: Day, always = false): SaveV4 {
  let save = start
  const cheapest = () => foodHeld(save).flatMap((r) => Array.from({ length: Math.min(r.count, BATCH_GOODS) }, () => r.key)).slice(0, BATCH_GOODS)
  while ((always || save.gold < LOW_GOLD) && pantryMeals(save) < MEALS_A_DAY && left(save) > 0 && cheapest().length === BATCH_GOODS) {
    save = cookBatch(save, cheapest())
    day.batches++
    day.goods += BATCH_GOODS
  }
  return save
}
/** The gold under which the farmer alone cooks rather than buy: three nights of his takeout. */
const LOW_GOLD = 3 * MEALS_A_DAY * TAKEOUT_PRICE

/** The whole farm's ranch and mine: once the Coop stands, a friend cares for it, and he keeps four hens and feed in the
 * silo (into town for them, with gold to spare); once the Mine stands, a friend works its face, and he takes the stairs
 * whenever they're found. Before the Mine, its planks are sawn from his logs, a load a day. What the hens and feed cost
 * goes in the day's books. */
function ranchAndMine(start: SaveV4, day: Day, run: Run): SaveV4 {
  let save = start
  if (placeBuilt(save, 'coop')) {
    save = invite(save, RANCH_HANDS.coop, [{ kind: 'care', home: 'coop' }])
    const hens = () => animalsIn(save, 'coop').length < HENS && save.gold >= ANIMALS.chicken.price + RESERVE
    const feed = () => save.ranch.silo < FEED_LOW && save.gold >= FEED_BUY * FODDER_PRICE + RESERVE
    if ((hens() || feed()) && (save.today.town || left(save) > 0)) {
      save = goToTown(save)
      while (hens()) { save = buyAnimal(save, 'chicken').save; day.ranchSpent += ANIMALS.chicken.price }
      if (feed()) { const n = Math.min(FEED_BUY, siloRoom(save)); save = buyFodder(save, n); day.ranchSpent += n * FODDER_PRICE }
    }
  }
  if (placeBuilt(save, 'mine')) {
    save = invite(save, RANCH_HANDS.mine, [{ kind: 'mine', dig: 'mine' }])
    while (stairsLock(save, 'mine') === null) save = takeStairs(save, 'mine')
  }
  // Planks for the Mine: a load of logs at the Sawmill a day.
  if (nextProject(save, run) === 'mine' && placeBuilt(save, 'sawmill') && !save.loads.sawmill && left(save) > 0
    && heldFor(save.items, { family: 'woods', refined: true }) < 60) {
    const logs = stationOptions(save, 'sawmill').filter((o) => goodOf(o.output)?.family === 'woods').sort((a, b) => b.held - a.held)[0]
    if (logs) save = startLoad(save, 'sawmill', logs.item, Math.min(logs.held, LOAD_SIZE))
  }
  return save
}

/** Tonight's bill as the farm stands: its upkeep and anything owed, and takeout for every meal the pantry is short. */
const billTonight = (save: SaveV4): number =>
  upkeepOf(save).gold + save.farm.owed + Math.max(0, mealsNeeded(save) - pantryMeals(save)) * TAKEOUT_PRICE

/** The next build, from its season and once its goods are held: with his own gold, else a loan from the mayor's office
 * (going into town for it); never one that leaves less gold than tonight's bill. */
function build(start: SaveV4, run: Run): { save: SaveV4; built: string | null } {
  const next = planOf(run).find((p) => !done(start, p.project))
  if (!next || SEASONS.indexOf(dateOf(start.calendar.day).season) < SEASONS.indexOf(next.from)) return { save: start, built: null }
  // The office's order as it'd stand in town: its lock is the loan's.
  const order = buildOrders({ ...start, today: { ...start.today, town: true } }).find((o) => o.project === next.project)
  if (!order) return { save: start, built: null }
  if (start.gold + order.borrow - order.cost < billTonight(start)) return { save: start, built: null }
  if (order.own === null) {
    const save = order.kind === 'dorm' ? buyDorm(start) : payBuild(start, next.project as FarmPlaceId)
    return { save, built: `${next.project} (own gold)` }
  }
  if (order.lock !== null || (!start.today.town && left(start) < 1)) return { save: start, built: null }
  return { save: borrowFor(goToTown(start), next.project), built: `${next.project} (loan ${order.borrow}g)` }
}

/** The season's quickest seed in the shop that can still ripen: a vegetable's while the next build waits for
 * vegetables. */
function quickestSeed(save: SaveV4, daysLeft: number, run: Run) {
  const all = shopLines(save).filter((l) => lineOpen(save, l)).map((l) => ({ line: l, crop: l.id.slice('seed-'.length) as CropId }))
    .map((s) => ({ ...s, stages: stagesOf(s.crop, false) })).filter((s) => s.stages < daysLeft).sort((a, b) => a.stages - b.stages || a.line.price - b.line.price)
  const vegetables = keep(save, 'carrot', run) > heldFor(save.items, { family: 'vegetables', refined: false })
  return (vegetables ? all.find((s) => goodOf(s.crop)?.family === 'vegetables') : undefined)?.line ?? all[0]?.line ?? null
}

/** One day's play, then the night; with farmhands, he leaves her the watering she'll do tonight. */
function play(start: SaveV4, log: Day[], run: Run, food: Food): SaveV4 {
  const hands = run !== 'alone'
  let save = residents(start, run)
  if (hands) save = hire(save, food)
  const keepGrowing = hands ? KEEP_GROWING_HANDS : KEEP_GROWING
  const day: Day = {
    day: save.calendar.day, spent: 0, hands: 0, people: 0, harvested: 0, watered: 0, planted: 0, grewTonight: 0, gold: save.gold, income: 0, upkeep: 0, repaid: 0, short: false, built: null,
    eggs: 0, ores: 0, ranchSpent: 0, mouths: 0, pantry: 0, takeoutMeals: 0, takeout: 0, spoiled: 0, batches: 0, cooked: 0, goods: 0, fed: 0,
  }
  const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  // Harvest what's ripe, then water what grows (with the farmhands, once the planting's done: below).
  for (const [i, t] of fieldTiles(save).entries()) if (t.ready && left(save) > 0) { save = harvestTile(save, i).save; day.harvested++ }
  if (!hands) for (const i of growing(save)) if (!fieldTiles(save)[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  // Build what's next once its goods are held: his own gold, else a loan in town.
  const built = build(save, run)
  save = built.save
  day.built = built.built
  if (run === 'whole') save = ranchAndMine(save, day, run)
  // Seeds: into town for the season's quickest when none are held and there's gold and time for them to ripen.
  const seed = quickestSeed(save, daysLeft, run)
  const spare = save.gold - billTonight(save)
  if (seedsInSeason(save).length === 0 && seed && spare >= seed.price * 3 && (save.today.town || left(save) >= 3)) {
    save = goToTown(save)
    save = buy(save, seed, Math.min(9, Math.floor(spare / seed.price)))
  }
  // Plant the tilled soil (and water it the same day, or leave it to her) while the field is small and a crop can still
  // ripen.
  const seeds = () => seedsInSeason(save)[0]
  for (const [i, t] of fieldTiles(save).entries()) {
    const held = seeds()
    if (!held || t.ground !== 'tilled' || t.crop !== null || growing(save).length >= keepGrowing || left(save) < (hands ? 1 : 2) || stagesOf(held.crop, false) > daysLeft) continue
    save = plantTile(save, i, held.id)
    if (!hands) save = waterTile(save, i)
    day.planted++
  }
  // Till cleared ground for the seeds held; clear a tile when there's none to till.
  const tilledEmpty = fieldTiles(save).filter((t) => t.ground === 'tilled' && t.crop === null).length
  const wanted = Math.min(seedsInSeason(save).reduce((n, s) => n + s.count, 0), keepGrowing) - growing(save).length - tilledEmpty
  for (let n = 0; n < wanted && left(save) > 3; n++) {
    const clear = fieldTiles(save).findIndex((t) => t.ground === 'clear')
    if (clear >= 0) save = tillTile(save, clear)
    else save = clearTile(save, fieldTiles(save).findIndex((t) => isOvergrown(t.ground))).save
  }
  // With the farmhands: water what she won't reach tonight, as the farm stands now.
  if (hands) {
    const tonight = fieldTiles(handsTonight(save, save, talentsD, null).save)
    for (const i of growing(save)) if (!fieldTiles(save)[i]!.watered && !tonight[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  }
  // Ship a crate once there's one worth the action: everything with a price, less what the next build takes and what
  // tonight's kitchen takes.
  const kitchen = kitchenKeeps(save, food, run)
  const crate: CrateLine[] = Object.entries(save.items).flatMap(([id, row]) => {
    if (!goodOf(id)) return []
    let held = keep(save, id, run)
    return row.flatMap((count, s) => {
      const kept = Math.min(count, held + (kitchen.get(`${id}@${s + 1}`) ?? 0))
      held = Math.max(0, held - count)
      return count - kept > 0 ? [{ id, stars: s + 1, count: count - kept }] : []
    })
  })
  if (crate.reduce((n, l) => n + l.count, 0) >= 6 && left(save) > 0) save = shipCrate(save, crate)
  // The rest: chop while the next build waits for logs; then fish and forage, a log chopped now and then. With the
  // farmhands, no more gathering than he did alone; the rest of his day goes to the people, in town.
  // Alone and cooking, with his gold low: an action kept for the stove, after the day's hauls.
  const stove = !hands && (food === 'stove' || (food === 'cook' && save.gold < LOW_GOLD)) && pantryMeals(save) < MEALS_A_DAY ? 1 : 0
  const gather = hands ? Math.min(left(save), GATHER_ALONE) : Math.max(0, left(save) - stove)
  const until = left(save) - gather
  while (wantsLogs(save, run) && left(save) > until + stove) save = chop(save, fresh(save, 'forest')).save
  for (let k = 0; left(save) > until; k++) save = haul(save, k)
  if (stove > 0) save = cookAlone(save, day, food === 'stove')
  if (left(save) > 0) {
    day.people = left(save) - (save.today.town ? 0 : 1)
    save = spendActions(goToTown(save), left(goToTown(save)))
  }
  day.spent = save.today.actions
  const before = fieldTiles(save).map((t) => t.growth)
  const morning = runNight(save, {})
  day.hands = morning.summary!.work.reduce((n, w) => n + (w.kind === 'farmhand' ? w.spent : 0), 0)
  day.grewTonight = fieldTiles(morning).filter((t, i) => t.crop !== null && t.growth > before[i]!).length
  const money = morning.summary?.money ?? []
  day.income = morning.summary!.bin.reduce((n, s) => n + s.gold, 0)
  day.eggs = morning.summary!.bin.reduce((n, s) => n + (goodOf(s.id)?.family === 'eggs-milk' ? s.gold : 0), 0)
  day.ores = morning.summary!.bin.reduce((n, s) => n + (goodOf(s.id)?.family === 'ores' ? s.gold : 0), 0)
  day.upkeep = money.reduce((n, m) => n + (m.kind === 'upkeep' ? m.paid : 0), 0)
  day.repaid = money.reduce((n, m) => n + (m.kind === 'loan' ? m.paid : 0), 0)
  day.short = money.some((m) => m.kind === 'short')
  for (const m of money) {
    if (m.kind === 'pantry') { day.pantry = m.meals; day.spoiled = m.spoiled; day.fed = m.fed }
    if (m.kind === 'takeout') { day.takeoutMeals = m.meals; day.takeout = m.due }
  }
  day.mouths = (day.pantry + day.takeoutMeals) / MEALS_A_DAY
  const cook = morning.summary!.work.find((w) => w.kind === 'farmhand' && w.id === COOK)
  day.cooked = cook?.kind === 'farmhand' ? cook.done.cook ?? 0 : 0
  const batches = (morning.roster[COOK]?.practice?.cook ?? 0) - (save.roster[COOK]?.practice?.cook ?? 0)
  day.goods += batches * BATCH_GOODS
  log.push(day)
  return morning
}

/** A season's books: what it earned and what its takeout, upkeep and loans took, and its food: the meals eaten from the
 * pantry and bought in, the goods the kitchen took (at their price ★1, out of demand), the farmer's batches and the
 * Cook's meals, the meals spoiled and the nights a ★2+ meal left an Uma well fed. */
interface Books {
  season: Season; income: number; takeout: number; upkeep: number; repaid: number; short: number; gold: number; rank: number; upkeepNow: number
  pantry: number; takeoutMeals: number; goods: number; batches: number; cooked: number; spoiled: number; fed: number
}

function simulate(run: Run, years = 1, food: Food = 'cook'): { log: Day[]; end: SaveV4; mornings: SaveV4[]; books: Books[] } {
  let save: SaveV4 = { ...newSave('season', AT), farmer: { name: 'Sim' } }
  const log: Day[] = []
  const mornings: SaveV4[] = []
  const books: Books[] = []
  for (let n = 0; n < DAYS_PER_YEAR * years; n++) {
    save = play(save, log, run, food)
    mornings.push(save)
    if ((n + 1) % DAYS_PER_SEASON === 0) {
      const days = log.slice(-DAYS_PER_SEASON)
      const sum = (pick: (d: Day) => number) => days.reduce((a, d) => a + pick(d), 0)
      books.push({
        season: SEASONS[books.length % SEASONS.length]!, income: sum((d) => d.income), takeout: sum((d) => d.takeout), upkeep: sum((d) => d.upkeep), repaid: sum((d) => d.repaid),
        short: days.filter((d) => d.short).length, gold: save.gold, rank: farmRankOf(save.farm.points), upkeepNow: upkeepOf(save).gold,
        pantry: sum((d) => d.pantry), takeoutMeals: sum((d) => d.takeoutMeals), goods: sum((d) => d.goods), batches: sum((d) => d.batches), cooked: sum((d) => d.cooked),
        spoiled: sum((d) => d.spoiled), fed: sum((d) => d.fed),
      })
    }
  }
  if (process.env.SEASON) {
    const name = run === 'alone' ? 'The farmer alone' : run === 'hands' ? 'With two farmhands' : 'The whole farm: the Coop and the Mine, two years'
    console.log(`--- ${name}, ${food === 'cook' ? 'cooking' : food === 'stove' ? 'cooking every night he can' : 'on takeout'} ---`)
    console.log(log.map((d) => `${dateOf(d.day).season} ${dateOf(d.day).day}: ${d.spent} actions${hands(run) ? ` (+${d.hands} theirs, ${d.people} with the people)` : ''}, harvested ${d.harvested}, watered ${d.watered}, planted ${d.planted}, `
      + `${d.grewTonight} grew tonight, ${d.gold}g morning, +${d.income} bin${d.eggs + d.ores > 0 ? ` (eggs ${d.eggs}, ores ${d.ores})` : ''}, ${d.mouths} mouths: ${d.pantry} from the pantry, `
      + `${d.takeoutMeals} takeout −${d.takeout}${d.batches > 0 ? `, ${d.batches} batches` : ''}${d.cooked > 0 ? `, cooked ${d.cooked}` : ''}${d.fed > 0 ? `, ${d.fed} well fed` : ''}, −${d.upkeep} upkeep, −${d.repaid} loan`
      + `${d.ranchSpent > 0 ? `, −${d.ranchSpent} hens and feed` : ''}${d.short ? ', SHORT' : ''}${d.built ? `, built ${d.built}` : ''}`).join('\n'))
    console.log(books.map((b) => `${b.season}: income ${b.income}g, takeout ${b.takeout}g (${b.takeoutMeals} meals), upkeep ${b.upkeep}g, loans ${b.repaid}g, `
      + `net ${b.income - b.takeout - b.upkeep - b.repaid}g, short nights ${b.short}, ends on ${b.gold}g, Farm Rank ${b.rank}, upkeep ${b.upkeepNow}g a night; `
      + `${b.pantry} meals from the pantry, ${b.goods} goods cooked, ${b.batches} farmer's batches, ${b.cooked} cooked by the Cook, ${b.spoiled} spoiled, ${b.fed} well fed`).join('\n'))
    console.log(`Year ${years + 1}: ${save.gold}g, shipped ${save.farm.counts[GOLD_SHIPPED] ?? 0}g, ${save.farm.counts[TILES_HARVESTED] ?? 0} tiles harvested, Farm Rank points ${save.farm.points}`)
    const sum = (pick: (d: Day) => number) => log.reduce((a, d) => a + pick(d), 0)
    console.log(`His watering ${sum((d) => d.watered)}, crops grown ${sum((d) => d.grewTonight)}, the farmhands' actions ${sum((d) => d.hands)}, his with the people ${sum((d) => d.people)}`)
    if (run === 'whole') {
      const coop = ranchBooks(log, mornings, 'coop')
      const mine = ranchBooks(log, mornings, 'mine')
      console.log(`The Coop: ${coop.nights} nights, eggs ${coop.earned}g against ${coop.cost}g (upkeep, its farmhand, hens and feed); the Mine: ${mine.nights} nights, ores ${mine.earned}g against ${mine.cost}g; deepest floor ${save.places.mine.deepest}`)
    }
    if (hands(run)) {
      for (const id of [...Object.values(HANDS), ...(run === 'whole' ? Object.values(RANCH_HANDS) : [])]) {
        const uma = save.roster[id]
        if (!uma) continue
        console.log(`${id}: ${aptitudesOf(uma, () => 3).filter((a) => a.practice > 0).map((a) => `${a.id} ${a.level} (${a.practice})`).join(', ')}; ranks ${JSON.stringify(uma.ranks.foraging)} ${JSON.stringify(uma.ranks.fishing)} ${JSON.stringify(uma.ranks.farming)} ${JSON.stringify(uma.ranks.ranch)} ${JSON.stringify(uma.ranks.mining)}`)
      }
    }
  }
  return { log, end: save, mornings, books }
}
const hands = (run: Run): boolean => run !== 'alone'

/** A place's own books on the whole farm, from the night it stood: its goods sold (the eggs, the ores) against its
 * nights' upkeep, its farmhand's and, for the Coop, the hens and their feed. */
function ranchBooks(log: readonly Day[], mornings: readonly SaveV4[], place: 'coop' | 'mine'): { nights: number; earned: number; cost: number } {
  const from = mornings.findIndex((m) => placeBuilt(m, place))
  if (from < 0) return { nights: 0, earned: 0, cost: 0 }
  const days = log.slice(from + 1)
  const earned = days.reduce((n, d) => n + (place === 'coop' ? d.eggs : d.ores), 0)
  const spent = place === 'coop' ? log.reduce((n, d) => n + d.ranchSpent, 0) : 0
  return { nights: days.length, earned, cost: days.length * (UPKEEP_BUILDING + UPKEEP_RESIDENT) + spent }
}

const { log, end, mornings, books } = simulate('alone')
const withHands = simulate('hands')
const whole = simulate('whole', 2)
/** The same farms on takeout alone, for what cooking saves. */
const aloneTakeout = simulate('alone', 1, 'takeout')
/** Alone, a batch whenever the pantry won't hold tonight's two meals: six meals, three nights of his. */
const aloneStove = simulate('alone', 1, 'stove')
const handsTakeout = simulate('hands', 1, 'takeout')
const spring = log.slice(0, DAYS_PER_SEASON)
const summer1 = mornings[DAYS_PER_SEASON - 1]!

describe('a simulated first season, the farmer alone', () => {
  it('spends exactly the day\'s ten actions, every day, and wakes to ten', () => {
    expect(spring).toHaveLength(DAYS_PER_SEASON)
    for (const day of log) expect(day.spent, `day ${day.day}`).toBe(DAY_ACTIONS)
    for (const morning of mornings) expect(actionsLeft(morning)).toBe(DAY_ACTIONS)
  })

  it('grows what it waters: crops grow at night and ripen, and are harvested', () => {
    expect(spring.some((d) => d.grewTonight > 0)).toBe(true)
    expect(spring.reduce((n, d) => n + d.harvested, 0)).toBeGreaterThan(0)
    expect(summer1.farm.counts[TILES_HARVESTED]).toBeGreaterThan(0)
    expect(summer1.crops.carrot).toBeGreaterThan(0)
  })

  it('ships and is paid at night: the gold rises and the Farm Rank\'s points with it', () => {
    expect(summer1.farm.counts[GOLD_SHIPPED]).toBeGreaterThan(1000)
    expect(summer1.gold).toBeGreaterThan(500)
    expect(summer1.farm.points).toBeGreaterThan(0)
    expect(summer1.farm.counts[HOME_COUNT.fishery]).toBeGreaterThan(0)
    expect(summer1.farm.counts[HOME_COUNT.forest]).toBeGreaterThan(0)
  })

  it('withers what still grows at the season\'s end, and wakes to Summer', () => {
    expect(summer1.calendar.day).toBe(DAYS_PER_SEASON + 1)
    expect(fieldTiles(summer1).filter((t) => t.crop !== null && !t.ready).every((t) => t.crop === 'corn' || t.crop === 'cabbage')).toBe(true)
  })

  it('builds the Mill early on a loan, and runs a small surplus', () => {
    expect(spring.find((d) => d.built)?.built).toMatch(/^mill \(loan \d+g\)$/)
    expect(placeBuilt(summer1, 'mill')).toBe(true)
    expect(books[0]!.income).toBeGreaterThan(books[0]!.takeout + books[0]!.upkeep + books[0]!.repaid)
  })
})

describe('a simulated first year: the farm pays its way', () => {
  it('pays every night\'s bill: never a short night, never half pace', () => {
    expect(log.filter((d) => d.short).map((d) => d.day)).toEqual([])
    for (const morning of mornings) expect(morning.farm).toMatchObject({ owed: 0, short: 0 })
  })

  it('earns more each season than its takeout, upkeep and loans take, and ends the year richer', () => {
    for (const b of books) expect(b.income, b.season).toBeGreaterThan(b.takeout + b.upkeep + b.repaid)
    expect(end.gold).toBeGreaterThan(newSave('season', AT).gold)
    expect(end.calendar.day).toBe(DAYS_PER_YEAR + 1)
  })

  it('clears every loan and builds the Mill; the farmer alone reaches Farm Rank 2', () => {
    expect(end.farm.loans).toEqual([])
    expect(log.flatMap((d) => (d.built ? [d.built.split(' ')[0]] : []))).toEqual(['mill'])
    expect(end.dorm).toMatchObject({ level: 1, home: [] })
    // The Farm Rank 3 stations wait for the farmhands' pace: the farmer alone ships about 9,000g in a year.
    expect(farmRankOf(end.farm.points)).toBe(2)
  })

  it('keeps a save the parse takes, every morning', () => {
    for (const morning of mornings) expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})

describe('a simulated first year with two farmhands: they pay their way', () => {
  const { log: days, end: last, mornings: mornings2, books: books2 } = withHands

  it('pays their upkeep, 10g each a night, and every night\'s: never a short night, never half pace', () => {
    expect(days.filter((d) => d.short).map((d) => d.day)).toEqual([])
    for (const morning of mornings2) expect(morning.farm).toMatchObject({ owed: 0, short: 0 })
    // Four home and the two farmhands.
    expect(upkeepOf(last).residents).toBe(6)
    expect(upkeepOf(last).gold - upkeepOf(end).gold).toBeGreaterThanOrEqual(6 * UPKEEP_RESIDENT)
  })

  it('works their actions every night from Spring 2, and the morning reports them', () => {
    expect(days[0]!.hands).toBe(0)
    for (const d of days.slice(1)) expect(d.hands, `day ${d.day}`).toBeGreaterThanOrEqual(3)
    expect(mornings2.at(-1)!.summary!.work.filter((w) => w.kind === 'farmhand').map((w) => w.kind === 'farmhand' && w.id)).toEqual([HANDS.field, HANDS.gather])
  })

  it('earns more each season than its takeout, upkeep and loans take, and ends the year richer than the farmer alone', () => {
    for (const b of books2) expect(b.income, b.season).toBeGreaterThan(b.takeout + b.upkeep + b.repaid)
    for (const [i, b] of books2.entries()) expect(b.income, b.season).toBeGreaterThan(books[i]!.income)
    expect(last.gold + last.farm.counts[GOLD_SHIPPED]!).toBeGreaterThan(end.gold + end.farm.counts[GOLD_SHIPPED]!)
    expect(last.farm.loans).toEqual([])
  })

  it('frees the farmer\'s own day for the people: her watering is most of the field\'s', () => {
    const his = (d: readonly Day[]) => d.reduce((n, x) => n + x.watered, 0)
    expect(his(days)).toBeLessThan(his(log) / 2)
    expect(days.reduce((n, d) => n + d.people, 0)).toBeGreaterThan(DAYS_PER_YEAR * 2)
    expect(days.reduce((n, d) => n + d.grewTonight, 0)).toBeGreaterThan(log.reduce((n, d) => n + d.grewTonight, 0))
  })

  it('raises their aptitudes over the year: the field hand waters a row in one action by its end', () => {
    const talentIn = () => 3 as const
    expect(aptitudeOf(last.roster[HANDS.field]!, 'water', talentIn).level).toBeGreaterThanOrEqual(6)
    expect(aptitudeOf(last.roster[HANDS.gather]!, 'fish', talentIn).level).toBeGreaterThanOrEqual(4)
    expect(aptitudeOf(last.roster[HANDS.gather]!, 'forage', talentIn).level).toBeGreaterThanOrEqual(4)
  })

  it('keeps a save the parse takes, every morning', () => {
    for (const morning of mornings2) expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})

describe('food, the farmer alone: takeout bites from the first night, and never sinks him', () => {
  const year = (b: readonly Books[], pick: (x: Books) => number) => b.reduce((n, x) => n + pick(x), 0)

  it('eats takeout from the first night: the first morning says 30g, and the year\'s takeout is a sixth of what he ships', () => {
    expect(mornings[0]!.summary!.money).toEqual([{ kind: 'takeout', meals: 2, paid: 30, due: 30 }])
    const takeout = year(books, (b) => b.takeout)
    const shipped = end.farm.counts[GOLD_SHIPPED]!
    expect(takeout).toBeGreaterThan(1000)
    expect(takeout / shipped).toBeGreaterThan(0.1)
    expect(takeout / shipped).toBeLessThan(0.2)
  })

  it('cooks a batch to bridge a tight night (the Mill\'s, on a loan), and pays takeout while his gold holds: the two end the year alike', () => {
    expect(log.slice(0, DAYS_PER_SEASON).reduce((n, d) => n + d.batches, 0)).toBeGreaterThan(0)
    expect(aloneTakeout.log.filter((d) => d.short)).toEqual([])
    expect(Math.abs(end.gold - aloneTakeout.end.gold) / aloneTakeout.end.gold).toBeLessThan(0.1)
  })

  it('cooks every night he can alone: he eats all six of each batch, buys a quarter of the takeout, never runs short', () => {
    const books = aloneStove.books
    expect(books.reduce((n, b) => n + b.spoiled, 0)).toBe(0)
    expect(books.reduce((n, b) => n + b.takeout, 0)).toBeLessThan(aloneTakeout.books.reduce((n, b) => n + b.takeout, 0) / 3)
    expect(aloneStove.log.filter((d) => d.short)).toEqual([])
    // The stove's action is one fewer haul: the year ends within an eighth of the farm on takeout (which reaches Farm Rank 2
    // and its richer Hills and River by Winter, where the stove's doesn't quite).
    expect(Math.abs(aloneStove.end.gold - aloneTakeout.end.gold) / aloneTakeout.end.gold).toBeLessThan(0.125)
  })
})

describe('food with two farmhands, the field hand on Cook: cooking pays for itself once the field yields', () => {
  const { log: days, end: last, books: seasons } = withHands
  const takeout = handsTakeout

  it('pays its takeout and upkeep on takeout alone too: it bites, a fifth of what the farm ships, and never sinks it', () => {
    expect(takeout.log.filter((d) => d.short)).toEqual([])
    const bought = takeout.books.reduce((n, b) => n + b.takeout, 0)
    expect(bought / takeout.end.farm.counts[GOLD_SHIPPED]!).toBeGreaterThan(0.15)
    expect(bought / takeout.end.farm.counts[GOLD_SHIPPED]!).toBeLessThan(0.3)
  })

  it('feeds the farm from the pantry once the field yields: less takeout each season from Summer, under a third of it by Winter', () => {
    const [, summer, autumn, winter] = seasons
    expect(autumn!.takeout).toBeLessThan(summer!.takeout)
    expect(winter!.takeout).toBeLessThan(autumn!.takeout)
    expect(winter!.takeout).toBeLessThan(takeout.books[3]!.takeout / 3)
    expect(winter!.pantry).toBeGreaterThan(winter!.takeoutMeals * 2)
    // Her batches grow with her Cooking, and her ★2 meals leave the farmhands well fed.
    expect(aptitudeOf(last.roster[COOK]!, 'cook', () => 3).level).toBeGreaterThanOrEqual(3)
    expect(winter!.fed).toBeGreaterThan(DAYS_PER_SEASON)
    expect(days.reduce((n, d) => n + d.spoiled, 0)).toBe(0)
  })

  it('ends the year richer than the same farm on takeout', () => {
    expect(last.gold).toBeGreaterThan(takeout.end.gold)
    for (const season of [2, 3]) expect(seasons[season]!.income - seasons[season]!.takeout).toBeGreaterThan(takeout.books[season]!.income - takeout.books[season]!.takeout)
  })
})

describe('the whole farm over two years: the Coop and the Mine pay their way', () => {
  const { log: days, end: last, mornings: all, books: seasons } = whole
  const builtOn = (place: string) => days.find((d) => d.built?.startsWith(`${place} `))?.day ?? null

  it('pays every night\'s upkeep for two years: never a short night, never half pace', () => {
    expect(days).toHaveLength(2 * DAYS_PER_YEAR)
    expect(days.filter((d) => d.short).map((d) => d.day)).toEqual([])
    for (const morning of all) expect(morning.farm).toMatchObject({ owed: 0, short: 0 })
  })

  it('earns more each season than its upkeep and loans take, and ends the two years richer than one year with two farmhands', () => {
    expect(seasons).toHaveLength(8)
    for (const [i, b] of seasons.entries()) expect(b.income, `${b.season} ${i < 4 ? 1 : 2}`).toBeGreaterThan(b.takeout + b.upkeep + b.repaid)
    expect(last.gold).toBeGreaterThan(withHands.end.gold)
    expect(last.farm.loans).toEqual([])
  })

  it('builds the Coop in its first year and the Mine in its second, and counts both in the upkeep', () => {
    expect(builtOn('coop')).toBeLessThanOrEqual(DAYS_PER_YEAR)
    expect(builtOn('mine')).toBeGreaterThan(DAYS_PER_YEAR)
    expect(upkeepOf(last).places).toBe(upkeepOf(withHands.end).places + 2)
    expect(upkeepOf(last).residents).toBe(upkeepOf(withHands.end).residents + 2)
  })

  it('pays more in eggs than the Coop\'s nights cost (its upkeep, its farmhand, the hens and their feed), and more in ores than the Mine\'s', () => {
    const coop = ranchBooks(days, all, 'coop')
    const mine = ranchBooks(days, all, 'mine')
    expect(coop.nights).toBeGreaterThan(DAYS_PER_YEAR)
    expect(coop.earned).toBeGreaterThan(coop.cost)
    expect(mine.nights).toBeGreaterThan(DAYS_PER_SEASON)
    expect(mine.earned).toBeGreaterThan(mine.cost)
  })

  it('reports the farmhands at the Coop and the Mine each morning, and takes the stairs to the Farm Rank\'s reach', () => {
    const morning = all.at(-1)!.summary!.work
    expect(morning).toContainEqual(expect.objectContaining({ kind: 'farmhand', id: RANCH_HANDS.coop, done: expect.objectContaining({ care: expect.any(Number) }) }))
    expect(morning).toContainEqual(expect.objectContaining({ kind: 'farmhand', id: RANCH_HANDS.mine, done: { mine: expect.any(Number) } }))
    expect(morning).toContainEqual(expect.objectContaining({ kind: 'ranch', home: 'coop', hungry: 0 }))
    expect(last.places.mine.deepest).toBeGreaterThanOrEqual(10)
    expect(last.diary.shipped.egg).toBeGreaterThan(0)
  })

  it('keeps a save the parse takes, every morning', () => {
    for (const morning of all) expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})
