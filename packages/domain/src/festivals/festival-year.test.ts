import { setImmediate } from 'node:timers/promises'
import { describe, expect, it } from 'vitest'
import { actionsLeft, GAME_DAYS, goToTown } from '../farm/actions'
import { buildLock, payBuild } from '../farm/builds'
import { dateOf, DAYS_PER_SEASON, DAYS_PER_YEAR, SEASONS, type Season } from '../farm/calendar'
import { farmRankOf, FARM_RANK_POINTS } from '../farm/farm'
import { setTasks } from '../farm/farmhands'
import { talentsD } from '../farm/talents'
import { needsWater } from '../fields/crops'
import { harvestTile, plantTile, stagesOf, tillTile, waterTile } from '../fields/fields'
import { setFieldPlan } from '../fields/production'
import { chop, fish, forage } from '../gathering/hauls'
import { HOME_COUNT } from '../gathering/kinds'
import { setStationPlan } from '../gathering/stations'
import { cropBaseGrade, goodOf, seedId, type CropId } from '../goods/ids'
import { runNight } from '../night/end-day'
import { buyAnimal, buyFodder, careFor, collect, feedAnimal } from '../ranch/ranch'
import { GOLD_SHIPPED, shipCrate } from '../save/bin'
import { parseSaveV6 } from '../save/parse-v4'
import { buy, shopLines } from '../save/shop'
import { bareTile, fieldTiles, newLove, newRosterUma, newSave, START_CLEAR, type FarmSave, type FarmTask } from '../save/v4'
import { goodCount, stockKey } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { worksOn } from '../town/town'
import {
  animalPreview, answerAnimal, castDerby, contestCutoffs, cupCategory, cupPreview, cupWorkDay, derbyMeet, enterAnimal, enterCup, enterDerby, enterFlower,
  festivalHandLock, festivalResult, flowerPreview, markFlowerTile, type ContestContext, type CupEntry,
} from './contests'
import { activeContest, CONTESTS, type CupCategory } from './state'

const AT = '2026-11-19T12:00:00.000Z'
const ROTATION: Record<Season, CropId> = { spring: 'carrot', summer: 'tomato', autumn: 'wheat', winter: 'oats' }
const TILES = START_CLEAR.slice(0, 7)
type Crew = 0 | 10 | 20 | 50
const roundTrip = (save: FarmSave) => parseSaveV6(JSON.parse(JSON.stringify(save)))

function setup(size: Crew) {
  const ids = Array.from({ length: size }, (_, i) => String(9_800_001 + i))
  const story = castPack(ids)
  const base = { ...newSave('festival-year-' + size, AT), farmer: { name: 'Robin' } }
  if (!size) return { save: base, ids, story }
  const rank = size === 10 ? 3 : size === 20 ? 6 : 10
  const points = FARM_RANK_POINTS[rank - 1]!
  const inherited = { points: 900, rank: 4 as const, challenge: 0 }
  let save: FarmSave = {
    ...base, calendar: { day: DAYS_PER_YEAR + 1 }, gold: size === 50 ? 40_000 : 22_000,
    buildings: { ...base.buildings, coop: 1, mill: 1 },
    fields: { plots: [{ tiles: fieldTiles(base).map((tile, i) => TILES.includes(i) ? bareTile('tilled') : tile) }] },
    farm: { ...base.farm, points, counts: { [GOLD_SHIPPED]: points * 100 } },
    roster: Object.fromEntries(ids.map((id) => {
      const uma = newRosterUma(1)
      return [id, { ...uma, farmhand: 1, ranks: { ...uma.ranks, farming: inherited, fishing: inherited, ranch: inherited },
        practice: { harvest: 330, water: 330, plant: 200, fish: 400, care: 330, mill: 200 } }]
    })),
    love: Object.fromEntries(ids.map((id) => [id, newLove()])),
  }
  save = buyAnimal(goToTown(save), 'chicken').save
  for (const season of SEASONS) save = setFieldPlan(save, 0, 0, season, { crop: ROTATION[season], grade: cropBaseGrade(ROTATION[season]), harvestNext: false })
  const field: FarmTask[] = [{ kind: 'harvest', tiles: [...TILES] }, { kind: 'plant', tiles: [...TILES] }, { kind: 'water', tiles: [...TILES] }]
  const care: FarmTask = { kind: 'care', home: 'coop' }
  const pond: FarmTask = { kind: 'fish', spot: 'pond' }
  const woods: FarmTask = { kind: 'forage', area: 'woods' }
  const mill: FarmTask = { kind: 'load', station: 'mill' }
  const roles: FarmTask[][] = [
    [...field, pond], [care, mill, woods], [pond], [woods], [pond], [...field, woods], [care, mill, pond], [woods], [pond], [woods],
  ]
  ids.forEach((id, i) => { save = setTasks(save, id, roles[i % roles.length]!) })
  return { save, ids, story }
}

function buySeeds(save: FarmSave, crop: CropId, left: number) {
  const id = seedId(crop)
  const line = shopLines(save).find((line) => line.id === id)
  return line && goodCount(save.items, id) < 4 && save.gold >= line.price * left ? buy(goToTown(save), line, left) : save
}

function shipExtras(save: FarmSave) {
  const stock = Object.entries(save.items).filter(([id]) => ['fish', 'wild', 'ranch'].includes(cupCategory(id) ?? ''))
  const lines = stock.flatMap(([id, counts]) => counts.flatMap((count, i) => count > 1 ? [{ id, stars: i + 1, count: Math.min(40, count - 1) }] : []))
  return lines.length && actionsLeft(save) ? shipCrate(save, lines.slice(0, 15)) : save
}

function careToday(save: FarmSave, reserve: number) {
  const animal = save.ranch.animals[0]
  if (!animal) return save
  if (save.ranch.silo === 0 && save.gold >= 100) save = buyFodder(goToTown(save), 10)
  if (actionsLeft(save) > reserve && save.ranch.silo && !animal.fed) save = feedAnimal(save, animal.id)
  if (actionsLeft(save) > reserve && !animal.cared) save = careFor(save, animal.id)
  if (actionsLeft(save) > reserve && animal.ready) save = collect(save, 'coop').save
  return save
}

function soloDay(save: FarmSave) {
  const { season, day } = dateOf(save.calendar.day)
  const reserve = save.buildings.coop ? 2 : 3
  save = careToday(save, reserve)
  const crop = season === 'autumn' ? 'sweet-potato' : season === 'winter' ? 'leek' : ROTATION[season]
  for (const tile of TILES) if (actionsLeft(save) > reserve && fieldTiles(save)[tile]!.ready) save = harvestTile(save, tile).save
  for (const tile of TILES) if (actionsLeft(save) > reserve && needsWater(fieldTiles(save)[tile]!)) save = waterTile(save, tile)
  if (stagesOf(crop, false) + day <= DAYS_PER_SEASON && (!save.buildings.coop || save.ranch.animals.length)) {
    save = buySeeds(save, crop, 7)
    for (const index of TILES) {
      if (actionsLeft(save) <= reserve + 1 || !goodCount(save.items, seedId(crop))) break
      const tile = fieldTiles(save)[index]!
      if (tile.crop) continue
      if (tile.ground === 'clear') save = tillTile(save, index)
      save = plantTile(save, index, seedId(crop))
      if (actionsLeft(save) > reserve && needsWater(fieldTiles(save)[index]!)) save = waterTile(save, index)
    }
  }
  if (!save.buildings.coop && !buildLock(save, 'coop')) save = payBuild(goToTown(save), 'coop')
  if (save.buildings.coop && !save.ranch.animals.length && save.gold >= 600) {
    save = buyFodder(buyAnimal(goToTown(save), 'chicken').save, 10)
    save = careToday(save, 1)
  }
  while (actionsLeft(save) > 1) {
    const logs = Object.entries(save.items).reduce((sum, [id, row]) => sum + (goodOf(id)?.family === 'woods' && !goodOf(id)?.refined ? goodCount({ [id]: row }, id) : 0), 0)
    save = !save.buildings.coop && logs < 30 ? chop(save, 'woods').save
      : (actionsLeft(save) + day) % 4 === 0 ? forage(save, 'woods').save : fish(save, 'pond').save
  }
  return shipExtras(save)
}

function derbyYear(save: FarmSave, ids: string[], context: ContestContext) {
  const fishers = ids.filter((id) => cupWorkDay(save, id, 'fish') && !festivalHandLock(save, id, context.story)).slice(0, 2)
  if (ids.length) expect(fishers).toHaveLength(2)
  const crew = [null, fishers[0] ?? null, fishers[1] ?? null]
  const before = save.farm.counts[HOME_COUNT.fishery] ?? 0
  save = enterDerby(save, 'pond', crew, context)
  for (const [slot, by] of crew.entries()) {
    const play = activeContest(save)
    if (play?.id !== 'fishing-derby') throw new Error('Derby turn missing')
    save = castDerby(save, slot, by ? null : derbyMeet(play, slot))
    if (slot === 0) expect(roundTrip(save)).toEqual(save)
  }
  const card = festivalResult(save, 'fishing-derby')!
  expect(card.catches?.map(({ by }) => by)).toEqual(crew)
  expect(card.credit).toEqual(card.place === 1 ? fishers : [])
  expect(save.farm.counts[HOME_COUNT.fishery]).toBe(before + 3)
  return save
}

function animalYear(save: FarmSave, ids: string[], context: ContestContext) {
  const animal = save.ranch.animals[0]
  expect(animal, 'coop built and chicken bought before the Animal Show').toBeDefined()
  save = feedAnimal(save, animal!.id)
  const entry = animalPreview(save, animal!.id)!
  expect(entry.dates).toBeGreaterThanOrEqual(4)
  const present = entry.caretakers.filter((id) => !festivalHandLock(save, id, context.story))
  const away = entry.caretakers.filter((id) => festivalHandLock(save, id, context.story))
  const nominated = ids.length === 20 ? away[0] ?? present[0] : present[0]
  if (ids.length) expect(nominated).toBeDefined()
  const handler = !!nominated && present.includes(nominated)
  save = enterAnimal(save, animal!.id, nominated ?? null, handler, context)
  while (activeContest(save)?.id === 'animal-show') {
    const play = activeContest(save)!
    if (play.id !== 'animal-show') throw new Error('Missing animal turn')
    expect(roundTrip(save)).toEqual(save)
    const slot = play.answers.length
    save = answerAnimal(save, slot, play.cues[slot]!)
  }
  const card = festivalResult(save, 'animal-show')!
  if (ids.length === 20 && away.length) expect(nominated).toBe(away[0])
  expect(card.animal?.id).toBe(animal!.id)
  expect(card.staff).toEqual(handler ? [nominated] : [])
  expect(card.credit).toEqual(card.place === 1 && nominated ? [nominated] : [])
  return save
}

function cupYear(save: FarmSave, ids: string[], context: ContestContext) {
  const entries: CupEntry[] = []
  const categories: CupCategory[] = ids.length === 20 ? ['workshop', 'ranch', 'fish'] : ids.length ? ['ranch', 'wild', 'fish'] : ['field', 'wild', 'fish']
  for (const category of categories) {
    const choices = Object.entries(save.items).filter(([id]) => cupCategory(id) === category)
      .flatMap(([id, lots]) => lots.flatMap((count, i) => count ? [{ id, key: stockKey(id, i + 1), score: 4 * (i + 1) + goodOf(id)!.grade }] : []))
      .sort((a, b) => b.score - a.score)
    expect(choices[0], `missing ${category} exhibit`).toBeDefined()
    const by = ids.find((id) => cupWorkDay(save, id, category) && !festivalHandLock(save, id, context.story) && !entries.some((entry) => entry.by === id))
    if (ids.length) expect(by, `missing ${category} presenter`).toBeDefined()
    entries.push({ key: choices[0]!.key, by: by ?? null })
  }
  expect(cupPreview(save, entries, context.story).block).toBeNull()
  const before = entries.map(({ key }) => { const [id, stars] = key.split('@'); return save.items[id!]![Number(stars) - 1]! })
  const next = enterCup(save, entries, context)
  expect(festivalResult(next, 'harvest-cup')?.presenters).toEqual(entries.map(({ by }) => by))
  entries.forEach(({ key }, i) => {
    const [id, stars] = key.split('@')
    expect(next.items[id!]?.[Number(stars) - 1] ?? 0).toBe(before[i]! - 1)
  })
  return next
}

describe('a year of farm contests through normal farm actions', () => {
  it.each([0, 10, 20, 50] as const)('plays all four contests with %i Umas', async (size) => {
    const { save: initial, ids, story } = setup(size)
    const context = { days: GAME_DAYS, story, talentOf: talentsD }
    let save = initial
    let booked = 0
    let work = 0
    let manual = 0
    let halfPace = 0
    for (let turn = 0; turn < DAYS_PER_YEAR; turn++) {
      const { day, season } = dateOf(save.calendar.day)
      const event = GAME_DAYS.festivals.find((rule) => rule.season === season && rule.day === day)?.rule
      if (season === 'spring' && day === 10) save = markFlowerTile(save, TILES[0]!, 'carrot', GAME_DAYS)
      if (size) {
        if (season === 'winter' && day === 27) {
          const eligible = ids.filter(id => worksOn(save, story, id) && worksOn(save, story, id, save.calendar.day + 1))
          const [miller] = eligible
          const caretaker = eligible[1] ?? eligible[0]
          if (caretaker) {
            for (const id of ids) {
              const current = save.roster[id]!.tasks ?? []
              if (current.some(task => task.kind === 'care')) save = setTasks(save, id, current.filter(task => task.kind !== 'care'))
            }
            save = setTasks(save, caretaker, [{ kind: 'care', home: 'coop' }])
          }
          if (size === 20 && miller) {
            save = setStationPlan(save, 'mill', [{ output: 'wheat-flour', target: 40 }])
            save = setTasks(save, miller, [{ kind: 'load', station: 'mill' }, { kind: 'forage', area: 'woods' }])
          }
        }
        if (day <= 8) save = buySeeds(save, ROTATION[season], 22)
        if (save.ranch.silo === 0 && save.gold >= 120) save = buyFodder(goToTown(save), 12)
        if (day % 3 === 0) save = shipExtras(save)
      }
      if (event === 'flower-show' || event === 'fishing-derby' || event === 'animal-show' || event === 'harvest-cup') {
        const before = save
        if (event === 'flower-show') {
          const preview = flowerPreview(save, null, null)!
          expect(preview.key).toMatch(/^carrot/)
          const grower = preview.hands[0] ?? null
          expect(Boolean(grower)).toBe(size > 0)
          if (grower) expect(flowerPreview(save, preview.key, grower)?.valid ?? false).toBe(false)
          save = enterFlower(save, null, grower, GAME_DAYS)
          const card = festivalResult(save, event)!
          const cuts = contestCutoffs('flower-show', farmRankOf(before.farm.points))
          expect(card.place).toBe(preview.score >= cuts[0] ? 1 : preview.score >= cuts[1] ? 2 : 3)
          expect(card.credit).toEqual(card.place === 1 && grower ? [grower] : [])
        } else if (event === 'fishing-derby') save = derbyYear(save, ids, context)
        else if (event === 'animal-show') save = animalYear(save, ids, context)
        else save = cupYear(save, ids, context)
        const card = festivalResult(save, event)!
        expect(card.place).not.toBeNull()
        expect(save.gold - before.gold).toBe(card.gold)
        expect(save.today.eventActions - before.today.eventActions).toBe(3)
        const activity = event === 'flower-show' ? 'farming' : event === 'animal-show' ? 'ranch' : 'fishing'
        for (const id of ids) {
          expect(save.roster[id]!.ranks[activity].challenge - before.roster[id]!.ranks[activity].challenge).toBe(card.credit.includes(id) ? 1 : 0)
          expect(save.love[id]!.points - before.love[id]!.points).toBe(card.staff.includes(id) ? 50 : 0)
        }
      }
      if (!size) save = soloDay(save)
      manual += save.today.actions
      save = runNight(save, context)
      const hands = save.summary!.work.filter((line) => line.kind === 'farmhand')
      for (const line of hands) {
        const card = event && CONTESTS.find((id) => id === event) ? festivalResult(save, event as typeof CONTESTS[number]) : null
        expect(line.festival ?? 0).toBe(card?.staff.includes(line.id) ? 1 : 0)
        expect(line.spent).toBeLessThanOrEqual(line.actions)
        booked += line.festival ?? 0
        work += line.spent - (line.festival ?? 0)
      }
      if (save.farm.short >= 2) halfPace++
      if (day % 6 === 0) await setImmediate()
    }
    expect(roundTrip(save)).toEqual(save)
    const cards = CONTESTS.map((id) => festivalResult(save, id)!)
    expect(save.farm.festivals.map(({ id }) => id)).toEqual(CONTESTS)
    expect(booked).toBe(cards.reduce((sum, card) => sum + card.staff.length, 0))
    if (size) expect(work).toBeGreaterThan(manual * 5)
    console.log(JSON.stringify({ size, manual, work, booked, halfPace, gold: save.gold, cards }))
  }, 30_000)
})
