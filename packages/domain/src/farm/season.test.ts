// A simulated first year: the farmer plays the year's 48 days on the game's own rules, ten actions a day, by a plain bot,
// and pays his way. Each morning he harvests what's ripe, waters what grows, plants the tilled soil he has seeds for,
// tills and clears a little more while the field is small, ships once there's a crate's worth, goes into town for the
// season's quickest seeds when they run out, and spends what's left fishing, foraging and chopping (chopping first while
// his next build waits for logs). He keeps the logs and fish his next build takes, and builds as he goes: the Mill on a
// loan from the mayor's office as soon as he holds its logs (Spring), the Dorm's second level from Autumn, then the Farm
// Rank 3 stations, with his own gold or a loan. Two Umas live on the farm from Summer, three from Autumn and four from
// Winter, though nobody works it but him yet. Every night takes the loans' shares, then the upkeep, after the bin.
//
// Spring's checks are the first season's: the day's budget holds, watered crops grow and dry ones don't, the season's
// end withers what's left, and the bin pays. The year's: the upkeep is always paid (never a short night), the loan
// clears, every season earns more than its upkeep and loans take, and the year ends richer than it started. No story
// pack (the night runs the farm's steps). `SEASON=1` prints the run.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown } from './actions'
import { heldFor, payBuild } from './builds'
import { DAYS_PER_SEASON, DAYS_PER_YEAR, dateOf, SEASONS, type Season } from './calendar'
import { borrowFor, buildOrders, upkeepOf } from './economy'
import { bedsAt, farmRankOf } from './farm'
import { buyDorm, dormBought } from './dorm'
import { placeBuilt, farmPlace, type FarmPlaceId } from './places'
import { clearTile, harvestTile, plantTile, seedsInSeason, stagesOf, TILES_HARVESTED, tillTile, waterTile } from '../fields/fields'
import { chop, fish, forage } from '../gathering/hauls'
import { HOME_COUNT } from '../gathering/kinds'
import { goodOf, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { isOvergrown, newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** The field the bot keeps: no more tiles growing than it can water. */
const KEEP_GROWING = 5
/** What he builds, in order, each from its season once the Farm Rank offers it: the Mill as soon as he holds its logs,
 * the Dorm's second level for a fourth Uma, then the Farm Rank 3 stations. */
const PLAN: readonly { project: string; from: Season }[] = [
  { project: 'mill', from: 'spring' }, { project: 'dorm:2', from: 'autumn' }, { project: 'sawmill', from: 'spring' }, { project: 'smokehouse', from: 'spring' },
]
/** Who lives on the farm from each season, as the beds allow: invented ids, nobody working yet. */
const RESIDENTS: Readonly<Record<Season, readonly string[]>> = {
  spring: [], summer: ['9001', '9002'], autumn: ['9001', '9002', '9003'], winter: ['9001', '9002', '9003', '9004'],
}

/** What the bot did, day by day. */
interface Day {
  day: number
  spent: number
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
}

const growing = (save: SaveV4): number[] => save.fields.tiles.flatMap((t, i) => (t.crop !== null && !t.ready ? [i] : []))
const left = actionsLeft
/** Whether a project is done: built, paid today, or the Dorm's level bought. */
const done = (save: SaveV4, project: string): boolean => {
  const dorm = /^dorm:(\d)$/.exec(project)
  return dorm ? dormBought(save) >= Number(dorm[1]) : placeBuilt(save, project as FarmPlaceId) || save.farm.builds.includes(project as FarmPlaceId)
}
const nextProject = (save: SaveV4): string | null => PLAN.find((p) => !done(save, p.project))?.project ?? null
/** The goods the next build takes, held back from the bin: its logs and its fish. */
function keep(save: SaveV4, id: string): number {
  const next = farmPlace(nextProject(save))
  const good = goodOf(id)
  if (!next || next.opens.by !== 'build' || !good || good.refined) return 0
  return next.opens.cost.goods.find((g) => g.family === good.family && !g.refined)?.count ?? 0
}
/** Whether the next build still waits for logs: he chops first. */
const wantsLogs = (save: SaveV4): boolean => keep(save, 'pine-log') > heldFor(save.items, { family: 'woods', refined: false })

/** Everyone the season has on the farm, home in the Dorm, as many as its beds take. */
function residents(save: SaveV4): SaveV4 {
  const ids = RESIDENTS[dateOf(save.calendar.day).season].slice(0, bedsAt(save.dorm.level))
  if (ids.every((id) => save.dorm.home.includes(id))) return save
  return {
    ...save, roster: { ...save.roster, ...Object.fromEntries(ids.filter((id) => !save.roster[id]).map((id) => [id, newRosterUma(save.calendar.day)])) },
    love: { ...save.love, ...Object.fromEntries(ids.filter((id) => !save.love[id]).map((id) => [id, newLove()])) }, dorm: { ...save.dorm, home: [...ids] },
  }
}

/** The next build, from its season and once its goods are held: with his own gold, else a loan from the mayor's office
 * (going into town for it). */
function build(start: SaveV4): { save: SaveV4; built: string | null } {
  const next = PLAN.find((p) => !done(start, p.project))
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

/** The season's quickest seed in the shop, and whether it can still ripen. */
function quickestSeed(save: SaveV4, daysLeft: number) {
  return shopLines(save).filter((l) => lineOpen(save, l)).map((l) => ({ line: l, stages: stagesOf(l.id.slice('seed-'.length) as CropId, false) }))
    .filter((s) => s.stages < daysLeft).sort((a, b) => a.stages - b.stages || a.line.price - b.line.price)[0]?.line ?? null
}

/** One day's play, then the night. */
function play(start: SaveV4, log: Day[]): SaveV4 {
  let save = residents(start)
  const day: Day = {
    day: save.calendar.day, spent: 0, harvested: 0, watered: 0, planted: 0, grewTonight: 0, gold: save.gold, income: 0, upkeep: 0, repaid: 0, short: false, built: null,
  }
  const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  // Harvest what's ripe, then water what grows.
  for (const [i, t] of save.fields.tiles.entries()) if (t.ready && left(save) > 0) { save = harvestTile(save, i).save; day.harvested++ }
  for (const i of growing(save)) if (!save.fields.tiles[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  // Build what's next once its goods are held: his own gold, else a loan in town.
  const built = build(save)
  save = built.save
  day.built = built.built
  // Seeds: into town for the season's quickest when none are held and there's gold and time for them to ripen.
  const seed = quickestSeed(save, daysLeft)
  if (seedsInSeason(save).length === 0 && seed && save.gold >= seed.price * 3 && (save.today.town || left(save) >= 3)) {
    save = goToTown(save)
    save = buy(save, seed, Math.min(9, Math.floor(save.gold / seed.price)))
  }
  // Plant the tilled soil (and water it the same day) while the field is small and a crop can still ripen.
  const seeds = () => seedsInSeason(save)[0]
  for (const [i, t] of save.fields.tiles.entries()) {
    const held = seeds()
    if (!held || t.ground !== 'tilled' || t.crop !== null || growing(save).length >= KEEP_GROWING || left(save) < 2 || stagesOf(held.crop, false) > daysLeft) continue
    save = waterTile(plantTile(save, i, held.id), i)
    day.planted++
  }
  // Till cleared ground for the seeds held; clear a tile when there's none to till.
  const tilledEmpty = save.fields.tiles.filter((t) => t.ground === 'tilled' && t.crop === null).length
  const wanted = Math.min(seedsInSeason(save).reduce((n, s) => n + s.count, 0), KEEP_GROWING) - growing(save).length - tilledEmpty
  for (let n = 0; n < wanted && left(save) > 3; n++) {
    const clear = save.fields.tiles.findIndex((t) => t.ground === 'clear')
    if (clear >= 0) save = tillTile(save, clear)
    else save = clearTile(save, save.fields.tiles.findIndex((t) => isOvergrown(t.ground))).save
  }
  // Ship a crate once there's one worth the action: everything with a price, less what the next build takes.
  const crate: CrateLine[] = Object.entries(save.items).flatMap(([id, row]) => {
    if (!goodOf(id)) return []
    let held = keep(save, id)
    return row.flatMap((count, s) => {
      const kept = Math.min(held, count)
      held -= kept
      return count - kept > 0 ? [{ id, stars: s + 1, count: count - kept }] : []
    })
  })
  if (crate.reduce((n, l) => n + l.count, 0) >= 6 && left(save) > 0) save = shipCrate(save, crate)
  // The rest: chop while the next build waits for logs; then fish and forage, a log chopped now and then.
  while (wantsLogs(save) && left(save) > 0) save = chop(save, 'woods').save
  for (let k = 0; left(save) > 0; k++) save = k % 3 === 0 ? fish(save, 'pond').save : k % 3 === 1 ? forage(save, 'woods').save : chop(save, 'woods').save
  day.spent = save.today.actions
  const before = save.fields.tiles.map((t) => t.growth)
  const morning = runNight(save, {})
  day.grewTonight = morning.fields.tiles.filter((t, i) => t.crop !== null && t.growth > before[i]!).length
  const money = morning.summary?.money ?? []
  day.income = morning.summary!.bin.reduce((n, s) => n + s.gold, 0)
  day.upkeep = money.reduce((n, m) => n + (m.kind === 'upkeep' ? m.paid : 0), 0)
  day.repaid = money.reduce((n, m) => n + (m.kind === 'loan' ? m.paid : 0), 0)
  day.short = money.some((m) => m.kind === 'short')
  log.push(day)
  return morning
}

/** A season's books: what it earned and what its upkeep and loans took. */
interface Books { season: Season; income: number; upkeep: number; repaid: number; short: number; gold: number; rank: number; upkeepNow: number }

function simulate(): { log: Day[]; end: SaveV4; mornings: SaveV4[]; books: Books[] } {
  let save: SaveV4 = { ...newSave('season', AT), farmer: { name: 'Sim' } }
  const log: Day[] = []
  const mornings: SaveV4[] = []
  const books: Books[] = []
  for (let n = 0; n < DAYS_PER_YEAR; n++) {
    save = play(save, log)
    mornings.push(save)
    if ((n + 1) % DAYS_PER_SEASON === 0) {
      const days = log.slice(-DAYS_PER_SEASON)
      const sum = (pick: (d: Day) => number) => days.reduce((a, d) => a + pick(d), 0)
      books.push({
        season: SEASONS[books.length]!, income: sum((d) => d.income), upkeep: sum((d) => d.upkeep), repaid: sum((d) => d.repaid), short: days.filter((d) => d.short).length,
        gold: save.gold, rank: farmRankOf(save.farm.points), upkeepNow: upkeepOf(save).gold,
      })
    }
  }
  if (process.env.SEASON) {
    console.log(log.map((d) => `${dateOf(d.day).season} ${dateOf(d.day).day}: ${d.spent} actions, harvested ${d.harvested}, watered ${d.watered}, planted ${d.planted}, `
      + `${d.grewTonight} grew tonight, ${d.gold}g morning, +${d.income} bin, −${d.upkeep} upkeep, −${d.repaid} loan${d.short ? ', SHORT' : ''}${d.built ? `, built ${d.built}` : ''}`).join('\n'))
    console.log(books.map((b) => `${b.season}: income ${b.income}g, upkeep ${b.upkeep}g, loans ${b.repaid}g, net ${b.income - b.upkeep - b.repaid}g, short nights ${b.short}, `
      + `ends on ${b.gold}g, Farm Rank ${b.rank}, upkeep ${b.upkeepNow}g a night`).join('\n'))
    console.log(`Year 2: ${save.gold}g, shipped ${save.farm.counts[GOLD_SHIPPED] ?? 0}g, ${save.farm.counts[TILES_HARVESTED] ?? 0} tiles harvested, Farm Rank points ${save.farm.points}`)
  }
  return { log, end: save, mornings, books }
}

const { log, end, mornings, books } = simulate()
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
