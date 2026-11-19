import { describe, expect, it } from 'vitest'
import { GAME_DAYS, goToTown, spendForEvent } from '../farm/actions'
import { DAYS_PER_YEAR } from '../farm/calendar'
import { FARM_RANK_POINTS } from '../farm/farm'
import { expeditionMemberBlock, sendExpedition } from '../expeditions/expeditions'
import { harvestTile, plantTile, reapTile, removeOrchard, tillTile, waterTile } from '../fields/fields'
import { HOME_COUNT } from '../gathering/kinds'
import { seedId } from '../goods/ids'
import { assistantLock, finishPlay, startKitchenPlay, startStoveBatch } from '../kitchen/kitchen'
import { cookLock } from '../kitchen/contest'
import { runNight } from '../night/end-day'
import { buyAnimal, buyFodder, careAt, feedAnimal } from '../ranch/ranch'
import { serverLock, startRestaurantShift } from '../restaurant/restaurant'
import { shipCrate } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type FarmSave } from '../save/v4'
import { addGoods, parseStockKey } from '../save/warehouse'
import { castPack } from '../story/authored.fixture'
import { storyPackFrom } from '../story/pack'
import { festivalsOf } from '../story/placeholders'
import { worksOn } from '../town/town'
import {
  animalPreview, answerAnimal, castDerby, contestCutoffs, cupPreview, cupWorkDay, derbyMeet, enterAnimal, enterCup, enterDerby, enterFlower, festivalEntryLock,
  festivalHandLock, festivalPrize, festivalResult, festivalStock, flowerPreview, markFlowerTile, releaseFlower, settleFestival,
} from './contests'
import { activeContest, SHOW_CUES } from './state'

const AT = '2026-11-19T12:00:00.000Z'
const CTX = { days: GAME_DAYS }
const raw = (save: FarmSave) => JSON.parse(JSON.stringify(save))
const fresh = (day = 1): FarmSave => ({ ...newSave('contest-proofs', AT), calendar: { day }, farmer: { name: 'Robin' } })
const hands = ['101', '102', '103', '104', '105', '106', '107', '108']
const crew = (day: number): FarmSave => {
  const save = fresh(day)
  return goToTown({ ...save, gold: 50_000, farm: { ...save.farm, points: FARM_RANK_POINTS[7]! },
    buildings: { ...save.buildings, kitchen: 1, restaurant: 1, coop: 1, expeditions: 1 },
    roster: Object.fromEntries(hands.map((id) => [id, { ...newRosterUma(1), farmhand: 1 }])),
    love: Object.fromEntries(hands.map((id) => [id, newLove()])),
  })
}
const holds = (save: FarmSave, ...ids: string[]) => ({ ...save, items: ids.reduce((items, id) => addGoods(items, id, 1, 1), save.items) })

describe('festival dates and entries', () => {
  it('opens only the resolved date, spends event actions first and allows one entry per rule each year', () => {
    const base = GAME_DAYS.festivals[0]!
    const moved = { ...GAME_DAYS, festivals: [{ ...base, name: 'Bloom Fair', day: 11 }, { ...base, id: 'lanterns', name: 'Lanterns', day: 10, rule: null }] }
    const day = holds(fresh(11), 'carrot')
    expect(festivalEntryLock(fresh(10), 'flower-show', moved)).toMatch(/festival day/)
    expect(festivalEntryLock(fresh(12), 'flower-show', moved)).toMatch(/festival day/)
    const busy = spendForEvent({ ...day, today: { ...day.today, actions: 8 } }, 3, moved)
    expect(festivalEntryLock(busy, 'flower-show', moved)).toMatch(/3 actions/)
    const shown = enterFlower({ ...day, today: { ...day.today, actions: 10 } }, 'carrot@1', null, moved)
    expect(shown.today).toMatchObject({ actions: 10, eventActions: 3 })
    const again = holds({ ...shown, calendar: { day: 12 }, today: day.today }, 'carrot')
    expect(() => enterFlower(again, 'carrot@1', null, { ...moved, festivals: [{ ...base, day: 12 }] })).toThrow(/already entered/i)
    const nextYear = { ...again, calendar: { day: 11 + DAYS_PER_YEAR } }
    expect(enterFlower(nextYear, 'carrot@1', null, moved).farm.festivals).toHaveLength(2)
    expect(parseSaveV5(raw(day))).toEqual(day)
  })

  it('reserves a real harvest once and returns it if the show is missed', () => {
    let save = tillTile(fresh(), 0)
    save = markFlowerTile(save, 0, 'carrot', GAME_DAYS)
    save = plantTile(save, 0, seedId('carrot'))
    expect(() => plantTile(save, 0, seedId('carrot'))).toThrow()
    for (let i = 0; i < 4; i++) save = runNight(waterTile(save, 0), {})
    save = harvestTile(save, 0).save
    const box = save.workshops.festival!.box!
    expect(box.dates).toHaveLength(5)
    const { id, stars } = parseStockKey(box.key)!
    expect(save.items[id]?.[stars - 1] ?? 0).toBe(0)
    expect(() => shipCrate(save, [{ id, stars, count: 1 }])).toThrow()
    const held = holds(save, id)
    expect(flowerPreview(held, box.key, '101')?.valid).toBe(false)
    expect(flowerPreview(save, null, null)?.parts).toEqual([10 * stars, 2, 30])
    while (save.calendar.day <= 10) save = runNight(save, {})
    expect(save.items[id]?.[stars - 1]).toBe(1)
    expect(save.workshops.festival?.box).toBeUndefined()
    expect(festivalResult(save, 'flower-show')).toBeUndefined()
  })

  it('treats ties as wins and checks the same exact stock again at confirmation', () => {
    const day: FarmSave = { ...fresh(48), items: { oats: [0, 1, 0, 0, 0], shiitake: [0, 0, 1, 0, 0], 'carp-grade-2': [1, 0, 0, 0, 0] } }
    const entries = ['oats@2', 'shiitake@3', 'carp-grade-2@1'].map((key) => ({ key, by: null }))
    const cutoff = contestCutoffs('harvest-cup', 1)[0]
    expect(cupPreview(day, entries).score).toBe(cutoff)
    const next = enterCup(day, entries, CTX)
    expect(festivalResult(next, 'harvest-cup')).toMatchObject({ place: 1, score: cutoff, gold: festivalPrize('harvest-cup', 1, 1, 1) })
    expect(next.diary.records['festival:harvest-cup']).toBe(cutoff)
    const sold = shipCrate(day, [{ id: 'carp-grade-2', count: 1, stars: 1 }])
    expect(() => enterCup(sold, entries, CTX)).toThrow(/available exhibit/)
    expect(() => enterCup(next, entries, CTX)).toThrow(/already entered/i)
  })

  it('starts a new proof for a second crop cycle and tracks an established orchard by tile', () => {
    const story = storyPackFrom({ cast: { umas: [] }, ties: { version: 1, ties: [] }, umas: {}, routes: {},
      world: { festivals: [{ id: 'flower-show', season: 'summer', day: 12 }] },
    })
    const summer = { ...GAME_DAYS, festivals: festivalsOf(story) }
    let save = plantTile(holds(tillTile(crew(13), 0), seedId('cucumber')), 0, seedId('cucumber'))
    for (let i = 0; i < 5; i++) save = runNight(waterTile(save, 0), {})
    save = harvestTile(save, 0).save
    save = markFlowerTile(save, 0, 'cucumber', summer)
    for (let i = 0; i < 3; i++) save = runNight(waterTile(save, 0), { story })
    save = harvestTile(save, 0).save
    expect(save.workshops.festival?.box?.dates.map(({ day }) => day)).toEqual([18, 19, 20, 21])
    expect(releaseFlower(save).workshops.festival?.box).toBeUndefined()

    const autumn = { ...GAME_DAYS, festivals: [{ ...GAME_DAYS.festivals[0]!, season: 'autumn' as const, day: 12 }] }
    let orchard = plantTile(holds(tillTile(crew(25), 0), seedId('apple')), 0, seedId('apple'))
    for (let i = 0; i < 6; i++) orchard = runNight(waterTile(orchard, 0), {})
    orchard = markFlowerTile(orchard, 0, 'apple', autumn)
    expect(removeOrchard(orchard, 0).workshops.festival?.mark).toBeUndefined()
    const show = 36
    const cast = castPack(hands)
    const grower = hands.find((id) => !worksOn(orchard, cast, id, show))!
    const picked = reapTile(orchard, 0, null, undefined, grower)
    expect(flowerPreview(picked.save, null, grower, autumn)).toMatchObject({ valid: true, hands: [grower] })
    expect(flowerPreview(picked.save, null, grower, autumn)?.parts[2]).toBe(6)
    expect(flowerPreview(picked.save, null, grower)?.valid).toBe(false)
    const live = { ...picked.save, calendar: { day: show } }
    expect(festivalHandLock(live, grower, cast)).toMatch(/town/)
    expect(() => enterFlower(live, null, grower, autumn)).not.toThrow()
  })
})

describe('ticketed turns and exact contributors', () => {
  it('retains one catch on End day after reload, ignores stale taps, and forfeits three misses', () => {
    const initial = enterDerby(fresh(22), 'pond', [null, null, null], CTX)
    const play = activeContest(initial)!
    if (play.id !== 'fishing-derby') throw new Error('Missing derby')
    const one = castDerby(initial, 0, derbyMeet(play, 0))
    expect(one.farm.counts[HOME_COUNT.fishery]).toBeUndefined()
    expect(castDerby(one, 0, 400)).toBe(one)
    const saved = parseSaveV5(raw(one))
    const morning = runNight(saved, {})
    expect(morning.farm.counts[HOME_COUNT.fishery]).toBe(1)
    expect(morning.summary?.work).toContainEqual(expect.objectContaining({ kind: 'festival-result', id: 'fishing-derby' }))
    expect(settleFestival(morning)).toBe(morning)
    const empty = [0, 1, 2].reduce((save, slot) => castDerby(save, slot, null), initial)
    expect(festivalResult(empty, 'fishing-derby')).toMatchObject({ place: null, score: null, gold: 0 })
    expect(empty.farm.festivals).toEqual([])
    expect(() => enterDerby(empty, 'pond', [null, null, null], CTX)).toThrow(/already entered/i)
    expect(empty.items).toEqual(initial.items)
    const corrupt = raw(one)
    corrupt.workshops.festival.active.catches[0].slot = 1
    expect(() => parseSaveV5(corrupt)).toThrow(/match its caster/)
  })

  it('requires dated care on the same animal and a correct cue to judge', () => {
    let save = buyFodder(crew(44), 10)
    const bought = buyAnimal(save, 'chicken')
    const other = buyAnimal(bought.save, 'chicken')
    save = careAt(other.save, bought.animal.id, 0, '101')
    expect(careAt(save, bought.animal.id, 0, '102')).toBe(save)
    save = goToTown(runNight(save, {}))
    save = careAt(save, bought.animal.id, 0, '101')
    save = careAt(save, other.animal.id, 0, '102')
    save = feedAnimal(runNight(save, {}), other.animal.id)
    expect(animalPreview(save, bought.animal.id)?.caretakers).toEqual(['101'])
    expect(animalPreview(save, other.animal.id)?.caretakers).toEqual([])
    expect(() => enterAnimal(save, other.animal.id, '101', false, CTX)).toThrow(/qualified caretaker/)
    save = enterAnimal(save, other.animal.id, null, false, CTX)
    for (let slot = 0; slot < 4; slot++) {
      const play = activeContest(save)!
      if (play.id !== 'animal-show') throw new Error('Missing show')
      save = answerAnimal(save, slot, SHOW_CUES.find((cue) => cue !== play.cues[slot])!)
    }
    expect(festivalResult(save, 'animal-show')).toMatchObject({ place: null, gold: 0, animal: { id: other.animal.id } })
    expect(save.ranch.animals).toHaveLength(2)
  })

  it('rechecks both directions of Kitchen, Restaurant and expedition commitments', () => {
    const stocked = holds(crew(22), 'carrot', 'shiitake', 'dish-fish-1')
    const day = { ...stocked, items: addGoods(stocked.items, 'dish-vegetables-1', 1, 6) }
    const uma = hands.find((id) => worksOn(day, null, id))!
    const booked = enterDerby(day, 'pond', [uma, null, null], CTX)
    expect(assistantLock(booked, uma)).toMatch(/festival/)
    expect(cookLock(booked, uma)).toMatch(/festival/)
    expect(serverLock(booked, uma)).toMatch(/booked/)
    expect(expeditionMemberBlock(booked, uma)).toMatch(/festival/)
    expect(() => startStoveBatch(booked)).toThrow(/under way/)
    expect(() => enterDerby(startStoveBatch(day), 'pond', [uma, null, null], CTX)).toThrow(/under way/)
    const returned = settleFestival(booked)
    expect(expeditionMemberBlock(returned, uma)).toMatch(/festival/)
    const shift = startRestaurantShift(day, 1, [{ key: 'dish-vegetables-1@1', count: 6 }], uma, Date.parse(AT))
    expect(() => enterDerby(shift, 'pond', [null, null, null], CTX)).toThrow(/under way/)
    const leaving = sendExpedition(day, 'old-fort-ruins', [uma], ['dish-fish-1@1'])
    expect(festivalStock(leaving, 'dish-fish-1@1')).toBe(0)
    expect(() => enterDerby(leaving, 'pond', [uma, null, null], CTX)).toThrow(/expedition/)
    expect(festivalHandLock({ ...day, today: { ...day.today, assistant: uma } }, uma)).toMatch(/booked/)
    expect(festivalHandLock({ ...day, today: { ...day.today, server: uma } }, uma)).toMatch(/booked/)
  })

  it('stamps Kitchen work only when an assisted play produces dishes and expires the dated receipt', () => {
    const base = crew(47)
    const uma = hands.find((id) => worksOn(base, null, id, 47) && worksOn(base, null, id, 48))!
    const stocked = { ...base, items: addGoods(addGoods(base.items, 'carrot', 1, 12), 'basil', 1, 6) }
    const started = startKitchenPlay(stocked, [{ dish: 'dish-vegetables-1', count: 6, main: 'carrot@1', side: 'basil@1' }], uma)
    expect(started.workshops.festival?.worked?.[uma]).toBeUndefined()
    const completed = finishPlay(started, null).save
    expect(completed.workshops.festival?.worked?.[uma]?.kitchen).toBe(47)
    expect(cupWorkDay(completed, uma, 'kitchen')).toBeNull()
    const next = runNight(completed, {})
    expect(cupWorkDay(next, uma, 'kitchen')).toBe(47)
    expect(cupWorkDay({ ...next, calendar: { day: 51 } }, uma, 'kitchen')).toBeNull()
  })
})
