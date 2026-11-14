// A simulated first season: the farmer alone plays Spring's twelve days on the game's own rules, ten actions a day, by a
// plain bot. Each morning he harvests what's ripe, waters what grows, plants the tilled soil he has seeds for, tills
// and clears a little more while the field is small, ships once there's a crate's worth, goes into town for seeds when
// they run out, and spends what's left fishing and foraging. It checks the day's budget holds, that watered crops grow
// and dry ones don't, that the season's end withers what's left, and that the bin pays. No story pack (the night runs
// the farm's steps). `SEASON=1` prints the run.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown } from './actions'
import { DAYS_PER_SEASON, dateOf } from './calendar'
import { clearTile, harvestTile, plantTile, seedsInSeason, stagesOf, TILES_HARVESTED, tillTile, waterTile } from '../fields/fields'
import { chop, fish, forage } from '../gathering/hauls'
import { HOME_COUNT } from '../gathering/kinds'
import { goodOf } from '../goods/ids'
import { runNight } from '../night/end-day'
import { GOLD_SHIPPED, shipCrate, type CrateLine } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { buy, lineOpen, shopLines } from '../save/shop'
import { isOvergrown, newSave, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** The field the bot keeps: no more tiles growing than it can water. */
const KEEP_GROWING = 5

/** What the bot did, day by day. */
interface Day {
  day: number
  spent: number
  harvested: number
  watered: number
  planted: number
  grewTonight: number
  gold: number
}

const growing = (save: SaveV4): number[] => save.fields.tiles.flatMap((t, i) => (t.crop !== null && !t.ready ? [i] : []))
const left = actionsLeft

/** One day's play, then the night. */
function play(start: SaveV4, log: Day[]): SaveV4 {
  let save = start
  const day: Day = { day: save.calendar.day, spent: 0, harvested: 0, watered: 0, planted: 0, grewTonight: 0, gold: save.gold }
  const daysLeft = DAYS_PER_SEASON - dateOf(save.calendar.day).day + 1
  // Harvest what's ripe, then water what grows.
  for (const [i, t] of save.fields.tiles.entries()) if (t.ready && left(save) > 0) { save = harvestTile(save, i).save; day.harvested++ }
  for (const i of growing(save)) if (!save.fields.tiles[i]!.watered && left(save) > 0) { save = waterTile(save, i); day.watered++ }
  // Seeds: into town for Carrots when none are held and there's gold and time for them to ripen.
  if (seedsInSeason(save).length === 0 && daysLeft > stagesOf('carrot', false) && save.gold >= 100 && left(save) >= 3) {
    save = goToTown(save)
    const carrot = shopLines(save).find((l) => l.id === 'seed-carrot' && lineOpen(save, l))!
    save = buy(save, carrot, Math.min(9, Math.floor(save.gold / carrot.price)))
  }
  // Plant the tilled soil (and water it the same day) while the field is small and a crop can still ripen.
  const seeds = () => seedsInSeason(save)[0]
  for (const [i, t] of save.fields.tiles.entries()) {
    const seed = seeds()
    if (!seed || t.ground !== 'tilled' || t.crop !== null || growing(save).length >= KEEP_GROWING || left(save) < 2 || stagesOf(seed.crop, false) > daysLeft) continue
    save = waterTile(plantTile(save, i, seed.id), i)
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
  // Ship a crate once there's one worth the action: everything with a price.
  const crate: CrateLine[] = Object.entries(save.items).flatMap(([id, row]) => (goodOf(id) ? row.flatMap((count, s) => (count > 0 ? [{ id, stars: s + 1, count }] : [])) : []))
  if (crate.reduce((n, l) => n + l.count, 0) >= 6 && left(save) > 0) save = shipCrate(save, crate)
  // The rest: fish and forage, a log chopped now and then.
  for (let k = 0; left(save) > 0; k++) save = k % 3 === 0 ? fish(save, 'pond').save : k % 3 === 1 ? forage(save, 'woods').save : chop(save, 'woods').save
  day.spent = save.today.actions
  const before = save.fields.tiles.map((t) => t.growth)
  const morning = runNight(save, {})
  day.grewTonight = morning.fields.tiles.filter((t, i) => t.crop !== null && t.growth > before[i]!).length
  log.push(day)
  return morning
}

function simulate(): { log: Day[]; end: SaveV4; mornings: SaveV4[] } {
  let save: SaveV4 = { ...newSave('season', AT), farmer: { name: 'Sim' } }
  const log: Day[] = []
  const mornings: SaveV4[] = []
  for (let n = 0; n < DAYS_PER_SEASON; n++) {
    save = play(save, log)
    mornings.push(save)
  }
  if (process.env.SEASON) {
    console.log(log.map((d) => `Spring ${d.day}: ${d.spent} actions, harvested ${d.harvested}, watered ${d.watered}, planted ${d.planted}, ${d.grewTonight} grew tonight, ${d.gold}g`).join('\n'))
    console.log(`Summer 1: ${save.gold}g, shipped ${save.farm.counts[GOLD_SHIPPED] ?? 0}g, ${save.farm.counts[TILES_HARVESTED] ?? 0} tiles harvested, Farm Rank points ${save.farm.points}`)
  }
  return { log, end: save, mornings }
}

describe('a simulated first season, the farmer alone', () => {
  const { log, end, mornings } = simulate()

  it('spends exactly the day\'s ten actions, every day, and wakes to ten', () => {
    expect(log).toHaveLength(DAYS_PER_SEASON)
    for (const day of log) expect(day.spent, `Spring ${day.day}`).toBe(DAY_ACTIONS)
    for (const morning of mornings) expect(actionsLeft(morning)).toBe(DAY_ACTIONS)
  })

  it('grows what it waters: crops grow at night and ripen, and are harvested', () => {
    expect(log.some((d) => d.grewTonight > 0)).toBe(true)
    expect(log.reduce((n, d) => n + d.harvested, 0)).toBeGreaterThan(0)
    expect(end.farm.counts[TILES_HARVESTED]).toBeGreaterThan(0)
    expect(end.crops.carrot).toBeGreaterThan(0)
  })

  it('ships and is paid at night: the gold rises and the Farm Rank\'s points with it', () => {
    expect(end.farm.counts[GOLD_SHIPPED]).toBeGreaterThan(1000)
    expect(end.gold).toBeGreaterThan(500)
    expect(end.farm.points).toBeGreaterThan(0)
    expect(end.farm.counts[HOME_COUNT.fishery]).toBeGreaterThan(0)
    expect(end.farm.counts[HOME_COUNT.forest]).toBeGreaterThan(0)
  })

  it('withers what still grows at the season\'s end, and wakes to Summer', () => {
    expect(end.calendar.day).toBe(DAYS_PER_SEASON + 1)
    expect(end.fields.tiles.filter((t) => t.crop !== null && !t.ready).every((t) => t.crop === 'corn' || t.crop === 'cabbage')).toBe(true)
  })

  it('keeps a save the parse takes, every morning', () => {
    for (const morning of mornings) expect(parseSaveV5(json(morning))).toEqual(morning)
  })
})
