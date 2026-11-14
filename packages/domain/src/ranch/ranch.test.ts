// The ranch: buying at the rancher's, the silo's feed (grass and fodder), a day's feeding, care and collecting, the night's
// goods and fondness, the stars by hearts, the morning's lines, an older save's ranch read leniently, and the save.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown } from '../farm/actions'
import { upkeepOf, UPKEEP_BUILDING } from '../farm/economy'
import { goodOf } from '../goods/ids'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { MAX_FONDNESS, newSave, SILO_ROOM, type SaveV4 } from '../save/v4'
import {
  animalLock, ANIMALS, animalsIn, buyAnimal, buyFodder, careFor, collect, cutGrass, feedAnimal, FODDER_PRICE, GRASS_CUT, heartsOf, readyIn, siloStands, tendNight,
} from './ranch'

const AT = '2026-11-14T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
/** A farm at Farm Rank 2 with the Coop built, `gold` held, in town. */
function farm(gold = 5000, points = 200): SaveV4 {
  const save = newSave('ranch', AT)
  return goToTown({ ...save, farmer: { name: 'Sim' }, gold, buildings: { ...save.buildings, coop: 1 }, farm: { ...save.farm, points } })
}
const night = (save: SaveV4): SaveV4 => runNight(save, {})
/** The next morning, in town again (an action) and the summary put away. */
const morning = (save: SaveV4): SaveV4 => ({ ...night(save), summary: null })
const WEEDS = (save: SaveV4): number => save.fields.tiles.findIndex((t) => t.ground === 'weeds')

describe('the rancher\'s', () => {
  it('sells an animal in town, free of actions: its price in gold, into its home at once, fondness 0', () => {
    const { save, animal } = buyAnimal(farm(), 'chicken')
    expect(animal).toEqual({ id: 'chicken-1', kind: 'chicken', fondness: 0, fed: false, cared: false, ready: false })
    expect(save.gold).toBe(5000 - ANIMALS.chicken.price)
    expect(save.today.actions).toBe(1) // going into town; buying is free
    expect(animalsIn(save, 'coop')).toEqual([animal])
    expect(buyAnimal(save, 'chicken').animal.id).toBe('chicken-2')
  })

  it('refuses out of town, before its home or its Farm Rank, with the home full, short of gold', () => {
    expect(() => buyAnimal({ ...farm(), today: { ...farm().today, town: false } }, 'chicken')).toThrow('The rancher’s is in town.')
    expect(animalLock(farm(), 'cow')).toBe('Build the Barn first.')
    expect(animalLock(farm(), 'duck')).toBe('Opens at Farm Rank 3.')
    expect(() => buyAnimal(farm(), 'duck')).toThrow('Opens at Farm Rank 3.')
    let full = farm(99_999)
    for (let i = 0; i < 8; i++) full = buyAnimal(full, 'chicken').save
    expect(() => buyAnimal(full, 'chicken')).toThrow('The Coop is full.')
    expect(() => buyAnimal(farm(100), 'chicken')).toThrow('Not enough gold')
  })

  it('sells fodder for the silo, 10g a feed, up to its room, once the silo stands', () => {
    const save = buyFodder(farm(), 20)
    expect(save.ranch.silo).toBe(20)
    expect(save.gold).toBe(5000 - 20 * FODDER_PRICE)
    expect(() => buyFodder({ ...farm(), buildings: { dorm: 1 } }, 5)).toThrow('Build the Coop or the Barn first')
    expect(() => buyFodder({ ...farm(), ranch: { animals: [], silo: SILO_ROOM - 3 } }, 5)).toThrow('The silo has room for 3.')
    expect(() => buyFodder(farm(), 0)).toThrow('Buy 1 to 99.')
    expect(siloStands(newSave('x', AT))).toBe(false)
  })
})

describe('a day\'s care', () => {
  const chicken = () => buyFodder(buyAnimal(farm(), 'chicken').save, 10)

  it('feeds an animal for an action and a feed, once a day; refuses with the silo empty', () => {
    const fed = feedAnimal(chicken(), 'chicken-1')
    expect(fed.ranch.silo).toBe(9)
    expect(fed.ranch.animals[0]!.fed).toBe(true)
    expect(actionsLeft(fed)).toBe(DAY_ACTIONS - 2)
    expect(() => feedAnimal(fed, 'chicken-1')).toThrow('Fed already today.')
    expect(() => feedAnimal(buyAnimal(farm(), 'chicken').save, 'chicken-1')).toThrow('The silo is empty: cut grass or buy fodder.')
    expect(() => feedAnimal(chicken(), 'cow-9')).toThrow('No such animal.')
  })

  it('cares for an animal for an action, once a day: +8 fondness at once', () => {
    const cared = careFor(chicken(), 'chicken-1')
    expect(cared.ranch.animals[0]).toMatchObject({ cared: true, fondness: 8 })
    expect(() => careFor(cared, 'chicken-1')).toThrow('Cared for already today.')
  })

  it('cuts grass on a weeds tile for 5 feed, the weeds left standing; not without the silo, nor on other ground', () => {
    const save = farm()
    const at = WEEDS(save)
    const { save: cut, feed } = cutGrass(save, at)
    expect([feed, cut.ranch.silo, cut.fields.tiles[at]!.ground, cut.today.actions]).toEqual([GRASS_CUT, GRASS_CUT, 'weeds', 2])
    expect(() => cutGrass(save, 0)).toThrow('Only weeds give grass.')
    expect(() => cutGrass({ ...save, buildings: { dorm: 1 } }, at)).toThrow('Build the Coop or the Barn first')
    expect(() => cutGrass({ ...save, ranch: { animals: [], silo: SILO_ROOM } }, at)).toThrow('The silo is full.')
    expect(cutGrass({ ...save, ranch: { animals: [], silo: SILO_ROOM - 2 } }, at).feed).toBe(2)
  })
})

describe('the night and collecting', () => {
  it('makes a fed animal\'s good overnight, collected the next day for an action, into the Warehouse', () => {
    const fed = feedAnimal(buyFodder(buyAnimal(farm(), 'chicken').save, 10), 'chicken-1')
    const next = morning(fed)
    expect(next.ranch.animals[0]).toEqual({ id: 'chicken-1', kind: 'chicken', fondness: 2, fed: false, cared: false, ready: true })
    expect(readyIn(next, 'coop')).toBe(1)
    const { save, collected } = collect(next, 'coop')
    expect(collected).toEqual({ home: 'coop', items: ['egg@1'] })
    expect(save.items.egg).toEqual([1, 0, 0, 0, 0])
    expect(save.ranch.animals[0]!.ready).toBe(false)
    expect(() => collect(save, 'coop')).toThrow('Nothing to collect yet.')
    expect(goodOf('egg')!.price).toBe(60)
  })

  it('keeps one good waiting at a time, and an unfed animal goes hungry: no good, −10 fondness, never below 0, never gone', () => {
    const fed = feedAnimal(buyFodder(buyAnimal(farm(), 'chicken').save, 10), 'chicken-1')
    const twice = morning(feedAnimal(morning(fed), 'chicken-1'))
    expect(readyIn(twice, 'coop')).toBe(1)
    const fond = { ...twice, ranch: { ...twice.ranch, animals: [{ ...twice.ranch.animals[0]!, fondness: 50, ready: false }] } }
    const hungry = morning(fond)
    expect(hungry.ranch.animals[0]).toMatchObject({ fondness: 40, ready: false })
    expect(morning(morning(morning(morning(morning(hungry))))).ranch.animals[0]).toMatchObject({ fondness: 0, ready: false })
  })

  it('says each building\'s night in the morning: fed, hungry and goods waiting', () => {
    let save = buyFodder(buyAnimal(buyAnimal(farm(), 'chicken').save, 'chicken').save, 10)
    save = feedAnimal(save, 'chicken-1')
    expect(tendNight(save).lines).toEqual([{ kind: 'ranch', home: 'coop', fed: 1, hungry: 1, ready: 1 }])
    expect(night(save).summary!.work).toContainEqual({ kind: 'ranch', home: 'coop', fed: 1, hungry: 1, ready: 1 })
    expect(tendNight(farm()).lines).toEqual([])
  })

  it('lifts the stars with fondness: ten hearts is always ★5', () => {
    expect([heartsOf(0), heartsOf(19), heartsOf(20), heartsOf(MAX_FONDNESS)]).toEqual([0, 0, 1, 10])
    const save = buyAnimal(farm(), 'chicken').save
    const loved = { ...save, ranch: { ...save.ranch, animals: [{ ...save.ranch.animals[0]!, fondness: MAX_FONDNESS, ready: true }] } }
    expect(collect(loved, 'coop').collected.items).toEqual(['egg@5'])
  })

  it('counts the Coop in the upkeep once it stands; the animals cost their feed only', () => {
    const base = upkeepOf({ ...farm(), buildings: { dorm: 1 } }).gold
    expect(upkeepOf(buyAnimal(farm(), 'chicken').save).gold).toBe(base + UPKEEP_BUILDING)
  })
})

describe('the save', () => {
  it('keeps a ranch the parse takes, and reads an older ranch leniently: no silo is an empty one, an older animal its fondness', () => {
    const fed = feedAnimal(buyFodder(buyAnimal(farm(), 'chicken').save, 10), 'chicken-1')
    expect(parseSaveV5(json(fed))).toEqual(fed)
    expect(parseSaveV5(json(night(fed)))).toEqual(night(fed))
    const older = json(newSave('older', AT)) as unknown as Record<string, unknown>
    older.ranch = { animals: [] }
    expect(parseSaveV5(older).ranch).toEqual({ animals: [], silo: 0 })
    expect(parseSaveV5(older).account.updatedAt).toBe(AT)
    older.ranch = { animals: [{ id: 'a1', kind: 'cow', building: 'barn', affection: 340.5, streak: 2, carer: null, next: 1 }] }
    expect(parseSaveV5(older).ranch.animals).toEqual([{ id: 'a1', kind: 'cow', fondness: MAX_FONDNESS, fed: false, cared: false, ready: false }])
    older.places = { mine: { deepest: 4, stairs: 1.25 }, quarry: { deepest: 0, stairs: 0 } }
    expect(parseSaveV5(older).places.mine).toEqual({ deepest: 4, stairs: 1 })
  })
})
