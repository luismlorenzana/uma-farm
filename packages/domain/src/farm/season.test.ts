// A simulated first year: the farmer plays the year's 48 days on the game's own rules, ten actions a day, by a plain bot,
// and pays his way. Each morning he harvests what's ripe, waters what grows, plants the tilled soil he has seeds for,
// tills and clears a little more while the field is small, ships once there's a crate's worth, goes into town for the
// season's quickest seeds when they run out, and spends what's left fishing, foraging and chopping (chopping first while
// his next build waits for logs). He keeps the logs and fish his next build takes, and builds as he goes: the Mill on a
// loan from the mayor's office as soon as he holds its logs (Spring), the Dorm's second level from Autumn, then the Farm
// Rank 3 stations, with his own gold or a loan. Two Umas live on the farm from Summer, three from Autumn and four from
// Winter, though none of them works it. Every night takes the loans' shares, then the upkeep, after the bin.
//
// **Beside him, the same year with two farmhands**, two friends from town invited to work on Spring 2 (10g of upkeep
// each a night from then on): one waters the whole field, the other forages and fishes at the deepest places the farm
// reaches. The farmer then grows a field twice the size, plants it and harvests it, waters only what she won't reach
// tonight, gathers no more than he did alone, and spends the rest of his day with the people in town; their aptitudes
// grow with the year.
//
// **And the whole farm, over two years**: the same farm with its two farmhands builds the Coop as soon as the Farm Rank
// offers it and its logs and vegetables are held, keeps four chickens there, fed from fodder he buys in town, and invites
// a third friend to care for them (feed, collect, care); in its second year it builds the Mine (its planks sawn from
// his logs at the Sawmill), invites a fourth to work its face, and takes the stairs whenever she finds them. The Coop and
// the Mine add their upkeep (15g a night each) and their farmhands' (10g each); the chickens cost their price and their
// feed.
//
// Spring's checks are the first season's: the day's budget holds, watered crops grow and dry ones don't, the season's
// end withers what's left, and the bin pays. The year's: the upkeep is always paid (never a short night), the loan
// clears, every season earns more than its upkeep and loans take, and the year ends richer than it started; with the
// farmhands, richer than the farmer alone, his own watering mostly theirs. The whole farm's: never a short night in two
// years, every season ahead of its upkeep and loans, and the eggs and the ores each paying more than their place's
// nights cost (its upkeep, its farmhand's, the feed and the hens). No story pack (the night runs the farm's steps).
// `SEASON=1` prints the three runs.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown, spendActions } from './actions'
import { heldFor, payBuild } from './builds'
import { DAYS_PER_SEASON, DAYS_PER_YEAR, dateOf, SEASONS, type Season } from './calendar'
import { borrowFor, buildOrders, UPKEEP_BUILDING, UPKEEP_RESIDENT, upkeepOf } from './economy'
import { aptitudeOf, aptitudesOf, handsTonight, setTasks } from './farmhands'
import { talentsD } from './talents'
import { bedsAt, farmRankOf } from './farm'
import { buyDorm, dormBought } from './dorm'
import { placeBuilt, farmPlace, type FarmPlaceId } from './places'
import { clearTile, harvestTile, plantTile, seedsInSeason, stagesOf, TILES_HARVESTED, tillTile, waterTile } from '../fields/fields'
import { stairsLock, takeStairs } from '../gathering/digs'
import { chop, fish, forage, reachList } from '../gathering/hauls'
import { HOME_COUNT } from '../gathering/kinds'
import { LOAD_SIZE, startLoad, stationOptions } from '../gathering/stations'
import { goodOf, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { animalsIn, ANIMALS, buyAnimal, buyFodder, FODDER_PRICE, siloRoom } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { FIELD_TILES, isOvergrown, newLove, newRosterUma, newSave, type FarmTask, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** The three runs: the farmer alone, with two farmhands, and the whole farm (the Coop and the Mine too). */
type Run = 'alone' | 'hands' | 'whole'
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
const HIRED = 2
const FIELD = Array.from({ length: FIELD_TILES }, (_, i) => i)
/** What he builds, in order, each from its season once the Farm Rank offers it: the Mill as soon as he holds its logs,
 * the Dorm's second level for a fourth Uma, then the Farm Rank 3 stations. */
const PLAN: readonly { project: string; from: Season }[] = [
  { project: 'mill', from: 'spring' }, { project: 'dorm:2', from: 'autumn' }, { project: 'sawmill', from: 'spring' }, { project: 'smokehouse', from: 'spring' },
]
/** The whole farm's: the Coop after the Mill (from Summer, its Farm Rank's season), the rest as before, then the Mine. */
const PLAN_WHOLE: readonly { project: string; from: Season }[] = [
  { project: 'mill', from: 'spring' }, { project: 'coop', from: 'summer' }, { project: 'dorm:2', from: 'autumn' }, { project: 'sawmill', from: 'spring' },
  { project: 'smokehouse', from: 'spring' }, { project: 'mine', from: 'spring' },
]
const planOf = (run: Run) => (run === 'whole' ? PLAN_WHOLE : PLAN)
/** The Coop's chickens, and the gold he keeps back for the nights when buying hens and feed. */
const HENS = 4
const RESERVE = 600
/** Fodder: a buy when the silo runs low. */
const FEED_LOW = 12
const FEED_BUY = 40
/** Who lives on the farm from each season, as the beds allow: invented ids, nobody working yet. */
const RESIDENTS: Readonly<Record<Season, readonly string[]>> = {
  spring: [], summer: ['9001', '9002'], autumn: ['9001', '9002', '9003'], winter: ['9001', '9002', '9003', '9004'],
}

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
}

const growing = (save: SaveV4): number[] => save.fields.tiles.flatMap((t, i) => (t.crop !== null && !t.ready ? [i] : []))
const left = actionsLeft
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
function residents(save: SaveV4): SaveV4 {
  const ids = RESIDENTS[dateOf(save.calendar.day).season].slice(0, bedsAt(save.dorm.level))
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
 * farm's reach to its deepest area and spot. */
function hire(save: SaveV4): SaveV4 {
  if (save.calendar.day < HIRED) return save
  const deepest = (place: 'forest' | 'fishery') => reachList(save, place).filter((r) => r.lock === null).at(-1)!.id
  const next = invite(save, HANDS.field, [{ kind: 'water', tiles: FIELD }])
  return invite(next, HANDS.gather, [{ kind: 'forage', area: deepest('forest') as 'woods' }, { kind: 'fish', spot: deepest('fishery') as 'pond' }])
}

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

/** The next build, from its season and once its goods are held: with his own gold, else a loan from the mayor's office
 * (going into town for it). */
function build(start: SaveV4, run: Run): { save: SaveV4; built: string | null } {
  const next = planOf(run).find((p) => !done(start, p.project))
  if (!next || SEASONS.indexOf(dateOf(start.calendar.day).season) < SEASONS.indexOf(next.from)) return { save: start, built: null }
  // The office's order as it'd stand in town: its lock is the loan's.
  const order = buildOrders({ ...start, today: { ...start.today, town: true } }).find((o) => o.project === next.project)
  if (!order) return { save: start, built: null }
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
function play(start: SaveV4, log: Day[], run: Run): SaveV4 {
  const hands = run !== 'alone'
  let save = residents(start)
  if (hands) save = hire(save)
  const keepGrowing = hands ? KEEP_GROWING_HANDS : KEEP_GROWING
  const day: Day = {
    day: save.calendar.day, spent: 0, hands: 0, people: 0, harvested: 0, watered: 0, planted: 0, grewTonight: 0, gold: save.gold, income: 0, upkeep: 0, repaid: 0, short: false, built: null,
    eggs: 0, ores: 0, ranchSpent: 0,
  }
  const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  // Harvest what's ripe, then water what grows (with the farmhands, once the planting's done: below).
  for (const [i, t] of save.fields.tiles.entries()) if (t.ready && left(save) > 0) { save = harvestTile(save, i).save; day.harvested++ }
  if (!hands) for (const i of growing(save)) if (!save.fields.tiles[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  // Build what's next once its goods are held: his own gold, else a loan in town.
  const built = build(save, run)
  save = built.save
  day.built = built.built
  if (run === 'whole') save = ranchAndMine(save, day, run)
  // Seeds: into town for the season's quickest when none are held and there's gold and time for them to ripen.
  const seed = quickestSeed(save, daysLeft, run)
  if (seedsInSeason(save).length === 0 && seed && save.gold >= seed.price * 3 && (save.today.town || left(save) >= 3)) {
    save = goToTown(save)
    save = buy(save, seed, Math.min(9, Math.floor(save.gold / seed.price)))
  }
  // Plant the tilled soil (and water it the same day, or leave it to her) while the field is small and a crop can still
  // ripen.
  const seeds = () => seedsInSeason(save)[0]
  for (const [i, t] of save.fields.tiles.entries()) {
    const held = seeds()
    if (!held || t.ground !== 'tilled' || t.crop !== null || growing(save).length >= keepGrowing || left(save) < (hands ? 1 : 2) || stagesOf(held.crop, false) > daysLeft) continue
    save = plantTile(save, i, held.id)
    if (!hands) save = waterTile(save, i)
    day.planted++
  }
  // Till cleared ground for the seeds held; clear a tile when there's none to till.
  const tilledEmpty = save.fields.tiles.filter((t) => t.ground === 'tilled' && t.crop === null).length
  const wanted = Math.min(seedsInSeason(save).reduce((n, s) => n + s.count, 0), keepGrowing) - growing(save).length - tilledEmpty
  for (let n = 0; n < wanted && left(save) > 3; n++) {
    const clear = save.fields.tiles.findIndex((t) => t.ground === 'clear')
    if (clear >= 0) save = tillTile(save, clear)
    else save = clearTile(save, save.fields.tiles.findIndex((t) => isOvergrown(t.ground))).save
  }
  // With the farmhands: water what she won't reach tonight, as the farm stands now.
  if (hands) {
    const tonight = handsTonight(save, save, talentsD, null).save.fields.tiles
    for (const i of growing(save)) if (!save.fields.tiles[i]!.watered && !tonight[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  }
  // Ship a crate once there's one worth the action: everything with a price, less what the next build takes.
  const crate: CrateLine[] = Object.entries(save.items).flatMap(([id, row]) => {
    if (!goodOf(id)) return []
    let held = keep(save, id, run)
    return row.flatMap((count, s) => {
      const kept = Math.min(held, count)
      held -= kept
      return count - kept > 0 ? [{ id, stars: s + 1, count: count - kept }] : []
    })
  })
  if (crate.reduce((n, l) => n + l.count, 0) >= 6 && left(save) > 0) save = shipCrate(save, crate)
  // The rest: chop while the next build waits for logs; then fish and forage, a log chopped now and then. With the
  // farmhands, no more gathering than he did alone; the rest of his day goes to the people, in town.
  const gather = hands ? Math.min(left(save), GATHER_ALONE) : left(save)
  const until = left(save) - gather
  while (wantsLogs(save, run) && left(save) > until) save = chop(save, 'woods').save
  for (let k = 0; left(save) > until; k++) save = k % 3 === 0 ? fish(save, 'pond').save : k % 3 === 1 ? forage(save, 'woods').save : chop(save, 'woods').save
  if (left(save) > 0) {
    day.people = left(save) - (save.today.town ? 0 : 1)
    save = spendActions(goToTown(save), left(goToTown(save)))
  }
  day.spent = save.today.actions
  const before = save.fields.tiles.map((t) => t.growth)
  const morning = runNight(save, {})
  day.hands = morning.summary!.work.reduce((n, w) => n + (w.kind === 'farmhand' ? w.spent : 0), 0)
  day.grewTonight = morning.fields.tiles.filter((t, i) => t.crop !== null && t.growth > before[i]!).length
  const money = morning.summary?.money ?? []
  day.income = morning.summary!.bin.reduce((n, s) => n + s.gold, 0)
  day.eggs = morning.summary!.bin.reduce((n, s) => n + (goodOf(s.id)?.family === 'eggs-milk' ? s.gold : 0), 0)
  day.ores = morning.summary!.bin.reduce((n, s) => n + (goodOf(s.id)?.family === 'ores' ? s.gold : 0), 0)
  day.upkeep = money.reduce((n, m) => n + (m.kind === 'upkeep' ? m.paid : 0), 0)
  day.repaid = money.reduce((n, m) => n + (m.kind === 'loan' ? m.paid : 0), 0)
  day.short = money.some((m) => m.kind === 'short')
  log.push(day)
  return morning
}

/** A season's books: what it earned and what its upkeep and loans took. */
interface Books { season: Season; income: number; upkeep: number; repaid: number; short: number; gold: number; rank: number; upkeepNow: number }

function simulate(run: Run, years = 1): { log: Day[]; end: SaveV4; mornings: SaveV4[]; books: Books[] } {
  let save: SaveV4 = { ...newSave('season', AT), farmer: { name: 'Sim' } }
  const log: Day[] = []
  const mornings: SaveV4[] = []
  const books: Books[] = []
  for (let n = 0; n < DAYS_PER_YEAR * years; n++) {
    save = play(save, log, run)
    mornings.push(save)
    if ((n + 1) % DAYS_PER_SEASON === 0) {
      const days = log.slice(-DAYS_PER_SEASON)
      const sum = (pick: (d: Day) => number) => days.reduce((a, d) => a + pick(d), 0)
      books.push({
        season: SEASONS[books.length % SEASONS.length]!, income: sum((d) => d.income), upkeep: sum((d) => d.upkeep), repaid: sum((d) => d.repaid),
        short: days.filter((d) => d.short).length, gold: save.gold, rank: farmRankOf(save.farm.points), upkeepNow: upkeepOf(save).gold,
      })
    }
  }
  if (process.env.SEASON) {
    console.log(run === 'alone' ? '--- The farmer alone ---' : run === 'hands' ? '--- With two farmhands ---' : '--- The whole farm: the Coop and the Mine, two years ---')
    console.log(log.map((d) => `${dateOf(d.day).season} ${dateOf(d.day).day}: ${d.spent} actions${hands(run) ? ` (+${d.hands} theirs, ${d.people} with the people)` : ''}, harvested ${d.harvested}, watered ${d.watered}, planted ${d.planted}, `
      + `${d.grewTonight} grew tonight, ${d.gold}g morning, +${d.income} bin${d.eggs + d.ores > 0 ? ` (eggs ${d.eggs}, ores ${d.ores})` : ''}, −${d.upkeep} upkeep, −${d.repaid} loan`
      + `${d.ranchSpent > 0 ? `, −${d.ranchSpent} hens and feed` : ''}${d.short ? ', SHORT' : ''}${d.built ? `, built ${d.built}` : ''}`).join('\n'))
    console.log(books.map((b) => `${b.season}: income ${b.income}g, upkeep ${b.upkeep}g, loans ${b.repaid}g, net ${b.income - b.upkeep - b.repaid}g, short nights ${b.short}, `
      + `ends on ${b.gold}g, Farm Rank ${b.rank}, upkeep ${b.upkeepNow}g a night`).join('\n'))
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
    expect(summer1.fields.tiles.filter((t) => t.crop !== null && !t.ready).every((t) => t.crop === 'corn' || t.crop === 'cabbage')).toBe(true)
  })

  it('builds the Mill early on a loan, and runs a small surplus', () => {
    expect(spring.find((d) => d.built)?.built).toMatch(/^mill \(loan \d+g\)$/)
    expect(placeBuilt(summer1, 'mill')).toBe(true)
    expect(books[0]!.income).toBeGreaterThan(books[0]!.upkeep + books[0]!.repaid)
  })
})

describe('a simulated first year: the farm pays its way', () => {
  it('pays every night\'s upkeep: never a short night, never half pace', () => {
    expect(log.filter((d) => d.short).map((d) => d.day)).toEqual([])
    for (const morning of mornings) expect(morning.farm).toMatchObject({ owed: 0, short: 0 })
  })

  it('earns more each season than its upkeep and loans take, and ends the year richer', () => {
    for (const b of books) expect(b.income, b.season).toBeGreaterThan(b.upkeep + b.repaid)
    expect(end.gold).toBeGreaterThan(newSave('season', AT).gold)
    expect(end.calendar.day).toBe(DAYS_PER_YEAR + 1)
  })

  it('clears every loan, and builds the Dorm\'s second level for a fourth Uma; the farmer alone reaches Farm Rank 2', () => {
    expect(end.farm.loans).toEqual([])
    expect(log.flatMap((d) => (d.built ? [d.built.split(' ')[0]] : []))).toEqual(['mill', 'dorm:2'])
    expect(end.dorm).toMatchObject({ level: 2, home: ['9001', '9002', '9003', '9004'] })
    // The Farm Rank 3 stations wait for the farmhands' pace: the farmer alone ships about 9,500g in a year.
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
    expect(upkeepOf(last).residents).toBe(upkeepOf(end).residents + 2)
    expect(upkeepOf(last).gold - upkeepOf(end).gold).toBeGreaterThanOrEqual(2 * UPKEEP_RESIDENT)
  })

  it('works their actions every night from Spring 2, and the morning reports them', () => {
    expect(days[0]!.hands).toBe(0)
    for (const d of days.slice(1)) expect(d.hands, `day ${d.day}`).toBeGreaterThanOrEqual(3)
    expect(mornings2.at(-1)!.summary!.work.filter((w) => w.kind === 'farmhand').map((w) => w.kind === 'farmhand' && w.id)).toEqual([HANDS.field, HANDS.gather])
  })

  it('earns more each season than its upkeep and loans take, and ends the year richer than the farmer alone', () => {
    for (const b of books2) expect(b.income, b.season).toBeGreaterThan(b.upkeep + b.repaid)
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
    for (const [i, b] of seasons.entries()) expect(b.income, `${b.season} ${i < 4 ? 1 : 2}`).toBeGreaterThan(b.upkeep + b.repaid)
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
