// The ranch: the Coop and the Barn, their animals and the silo, in the farm loop's style.
//
//   buy          an animal at the rancher's, in town (free once there): gold, a place in its home, its Farm Rank
//   each day     feed it (1 action, a feed from the silo) and care for it (1 action), each once a day
//   collect      1 action takes every good waiting in a building into the Warehouse, its stars by the animal's hearts
//   the night    (step 3) a fed animal makes its good, waiting to be collected (one at a time) and grows a little fonder;
//                one left unfed goes hungry: it makes nothing and loses fondness, and never dies
//   the silo     stands with the first of the Coop and the Barn; it holds the feed: grass cut from the field's weeds (1
//                action, the weeds grow back), and fodder bought at the rancher's
//
// Fondness runs 0–200, a heart every 20: care adds 8 at once (a farmhand's more with her aptitude), a fed night 2, a
// hungry night takes 10. A good's quality is its animal's hearts ÷ 2.5 (`heartsQuality`), so ten hearts is always ★5.
// Every star is a seeded draw numbered by the farm's count of the ranch's goods, so every device draws alike. Pure; never
// stamps. Loaded with the ranch's screens and the night.
import { inTown, spend } from '../farm/actions'
import { draw } from '../farm/draw'
import { farmRankOf } from '../farm/farm'
import { placeBuilt } from '../farm/places'
import { goodName } from '../goods/ids'
import { drawStars, heartsQuality, quality } from '../goods/stars'
import type { RanchLine } from '../night/summary'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import {
  ANIMAL_HOME, ANIMAL_KINDS, FIELD_TILES, HOME_ROOM, MAX_FONDNESS, RANCH_HOMES, SILO_ROOM,
  type Animal, type AnimalKind, type FarmSave, type RanchHome,
} from '../save/v4'
import { addGoods, stockKey } from '../save/warehouse'

/** One kind of animal: its name, its home, the good it gives, its price at the rancher's and the Farm Rank that opens
 * it there. */
export interface AnimalRule {
  readonly name: string
  readonly home: RanchHome
  readonly good: string
  readonly price: number
  readonly rank: number
}
/** The seven animals: a chicken from the Coop's Farm Rank 2, the Barn's cow and sheep from its Farm Rank 3, and dearer
 * ones as the farm grows. Every one gives its good each night it's fed. */
export const ANIMALS: Readonly<Record<AnimalKind, AnimalRule>> = {
  chicken: { name: 'Chicken', home: 'coop', good: 'egg', price: 500, rank: 2 },
  duck: { name: 'Duck', home: 'coop', good: 'duck-egg', price: 1200, rank: 3 },
  cow: { name: 'Cow', home: 'barn', good: 'milk', price: 1500, rank: 3 },
  goat: { name: 'Goat', home: 'barn', good: 'goat-milk', price: 2500, rank: 4 },
  sheep: { name: 'Sheep', home: 'barn', good: 'wool', price: 2000, rank: 3 },
  alpaca: { name: 'Alpaca', home: 'barn', good: 'alpaca-fleece', price: 3500, rank: 5 },
  'cashmere-goat': { name: 'Cashmere Goat', home: 'barn', good: 'cashmere-fleece', price: 5000, rank: 6 },
}
/** The buildings' names. */
export const HOME_NAMES: Readonly<Record<RanchHome, string>> = { coop: 'Coop', barn: 'Barn' }

/** A heart every 20 fondness. */
export const FONDNESS_A_HEART = 20
/** Care: +8 at once (a farmhand's +1 more a level of her Animal care above 1). */
export const CARE_FONDNESS = 8
/** A fed night: +2. */
export const FED_FONDNESS = 2
/** A hungry night: −10, never below 0. */
export const HUNGRY_FONDNESS = 10
/** An animal's hearts, 0–10. */
export const heartsOf = (fondness: number): number => Math.min(MAX_FONDNESS / FONDNESS_A_HEART, Math.floor(fondness / FONDNESS_A_HEART))

/** Fodder at the rancher's: 10g a feed. */
export const FODDER_PRICE = 10
/** Grass cut on a weeds tile: 5 feed. */
export const GRASS_CUT = 5
/** The most fodder one purchase takes. */
export const MAX_FODDER = 99
/** The lifetime counters: animals bought (their ids), the ranch's goods collected (its star draws). */
export const ANIMALS_BOUGHT = 'animals-bought'
export const RANCH_GOODS = 'ranch-goods'

const bump = (counts: Record<string, number>, key: string, n = 1): Record<string, number> => ({ ...counts, [key]: (counts[key] ?? 0) + n })

/** Whether a building stands. */
export const homeBuilt = (save: Pick<FarmSave, 'buildings'>, home: RanchHome): boolean => placeBuilt(save, home)
/** Whether the silo stands: with the first of the Coop and the Barn. */
export const siloStands = (save: Pick<FarmSave, 'buildings'>): boolean => RANCH_HOMES.some((home) => homeBuilt(save, home))
/** A building's animals, in the order bought. */
export const animalsIn = (save: Pick<FarmSave, 'ranch'>, home: RanchHome): Animal[] => save.ranch.animals.filter((a) => ANIMAL_HOME[a.kind] === home)
/** The kinds of animal the farm keeps, in the rancher's order. */
export const keptKinds = (save: Pick<FarmSave, 'ranch'>): AnimalKind[] => ANIMAL_KINDS.filter((k) => save.ranch.animals.some((a) => a.kind === k))
/** The goods waiting in a building. */
export const readyIn = (save: Pick<FarmSave, 'ranch'>, home: RanchHome): number => animalsIn(save, home).filter((a) => a.ready).length
/** The silo's room left. */
export const siloRoom = (save: Pick<FarmSave, 'ranch'>): number => SILO_ROOM - save.ranch.silo

function animalAt(save: Pick<FarmSave, 'ranch'>, id: string): Animal {
  const animal = save.ranch.animals.find((a) => a.id === id)
  if (!animal) throw new SaveRuleError('bad-slot', 'No such animal.')
  return animal
}
const withAnimal = <S extends FarmSave>(save: S, id: string, change: (a: Animal) => Animal): S =>
  ({ ...save, ranch: { ...save.ranch, animals: save.ranch.animals.map((a) => (a.id === id ? change(a) : a)) } })

// --- The rancher's ---------------------------------------------------------------------------------------------------

/** Why an animal can't be bought now, in words, or null: its home built, its Farm Rank, room in its home. (Gold and
 * being in town are the purchase's.) */
export function animalLock(save: Pick<FarmSave, 'buildings' | 'farm' | 'ranch'>, kind: AnimalKind): string | null {
  const rule = ANIMALS[kind]
  if (!homeBuilt(save, rule.home)) return `Build the ${HOME_NAMES[rule.home]} first.`
  if (farmRankOf(save.farm.points) < rule.rank) return `Opens at Farm Rank ${rule.rank}.`
  if (animalsIn(save, rule.home).length >= HOME_ROOM) return `The ${HOME_NAMES[rule.home]} is full.`
  return null
}

/** Buys an animal at the rancher's: free once in town, its price in gold. It moves into its home at once, fondness 0,
 * as `<kind>-<n>` (n the farm's count of animals bought). Refused out of town and for its lock (`locked`), or short of
 * gold (`no-gold`). */
export function buyAnimal<S extends FarmSave>(save: S, kind: AnimalKind): { save: S; animal: Animal } {
  if (!inTown(save)) throw new SaveRuleError('locked', 'The rancher’s is in town.')
  if (!(ANIMAL_KINDS as readonly string[]).includes(kind)) throw new SaveRuleError('bad-job', 'The rancher doesn’t sell that.')
  const lock = animalLock(save, kind)
  if (lock) throw new SaveRuleError('locked', lock)
  const paid = spendGold(save, ANIMALS[kind].price)
  const n = (save.farm.counts[ANIMALS_BOUGHT] ?? 0) + 1
  const animal: Animal = { id: `${kind}-${n}`, kind, fondness: 0, fed: false, cared: false, ready: false }
  return {
    save: { ...paid, ranch: { ...paid.ranch, animals: [...paid.ranch.animals, animal] }, farm: { ...paid.farm, counts: bump(paid.farm.counts, ANIMALS_BOUGHT) } },
    animal,
  }
}

/** Buys fodder for the silo at the rancher's: free once in town, 10g a feed, up to the silo's room. Refused out of town or
 * before the silo stands (`locked`), for a count outside 1–99 or past its room (`bad-count`), short of gold (`no-gold`). */
export function buyFodder<S extends FarmSave>(save: S, count: number): S {
  if (!inTown(save)) throw new SaveRuleError('locked', 'The rancher’s is in town.')
  if (!siloStands(save)) throw new SaveRuleError('locked', 'Build the Coop or the Barn first: the silo stands with it.')
  if (!Number.isInteger(count) || count < 1 || count > MAX_FODDER) throw new SaveRuleError('bad-count', `Buy 1 to ${MAX_FODDER}.`)
  if (count > siloRoom(save)) throw new SaveRuleError('bad-count', siloRoom(save) === 0 ? 'The silo is full.' : `The silo has room for ${siloRoom(save)}.`)
  const paid = spendGold(save, FODDER_PRICE * count)
  return { ...paid, ranch: { ...paid.ranch, silo: paid.ranch.silo + count } }
}

// --- A day's care ----------------------------------------------------------------------------------------------------

/** Feeds an animal: one action, a feed from the silo, once a day. Refused fed already (`bad-job`) or with the silo empty
 * (`no-items`). */
export function feedAnimal<S extends FarmSave>(save: S, id: string): S {
  if (animalAt(save, id).fed) throw new SaveRuleError('bad-job', 'Fed already today.')
  if (save.ranch.silo < 1) throw new SaveRuleError('no-items', 'The silo is empty: cut grass or buy fodder.')
  return feedAt(spend(save, 'animal'), id)
}
/** A feeding itself, spending nothing: the farmer's action and a farmhand's work share it. */
export function feedAt<S extends FarmSave>(save: S, id: string): S {
  const fed = withAnimal(save, id, (a) => ({ ...a, fed: true }))
  return { ...fed, ranch: { ...fed.ranch, silo: fed.ranch.silo - 1 } }
}

/** Cares for an animal (a brush, a talk): one action, once a day, +8 fondness at once. Refused cared for already
 * (`bad-job`). */
export function careFor<S extends FarmSave>(save: S, id: string): S {
  if (animalAt(save, id).cared) throw new SaveRuleError('bad-job', 'Cared for already today.')
  return careAt(spend(save, 'animal'), id, 0)
}
/** A care itself, spending nothing: +8 fondness and `extra` (a farmhand's aptitude), held to the top. */
export function careAt<S extends FarmSave>(save: S, id: string, extra: number): S {
  return withAnimal(save, id, (a) => ({ ...a, cared: true, fondness: Math.min(MAX_FONDNESS, a.fondness + CARE_FONDNESS + extra) }))
}

/** What a collection brought: its goods as stock keys (`<id>@<stars>`). */
export interface Collected {
  home: RanchHome
  items: string[]
}

/** Collects a building's goods: one action takes every good waiting there into the Warehouse. Refused with none waiting
 * (`bad-job`). */
export function collect<S extends FarmSave>(save: S, home: RanchHome): { save: S; collected: Collected } {
  if (readyIn(save, home) === 0) throw new SaveRuleError('bad-job', 'Nothing to collect yet.')
  return collectAt(spend(save, 'animal'), home, 0)
}
/** A collection itself, spending nothing: each waiting good at its animal's hearts' quality and `extra` (a farmhand's
 * aptitude), its stars `draw(uid, day, 'ranch:<kind>', n)`, n the farm's count of the ranch's goods. */
export function collectAt<S extends FarmSave>(save: S, home: RanchHome, extra: number): { save: S; collected: Collected } {
  let items = save.items
  let n = save.farm.counts[RANCH_GOODS] ?? 0
  const got: string[] = []
  const animals = save.ranch.animals.map((a) => {
    if (!a.ready || ANIMAL_HOME[a.kind] !== home) return a
    const good = ANIMALS[a.kind].good
    const q = quality({ care: heartsQuality(heartsOf(a.fondness)) }) + extra
    const stars = drawStars(q, draw(save.account.uid, save.calendar.day, `ranch:${a.kind}`, n))
    n++
    items = addGoods(items, good, stars, 1)
    got.push(stockKey(good, stars))
    return { ...a, ready: false }
  })
  return {
    save: { ...save, items, ranch: { ...save.ranch, animals }, farm: { ...save.farm, counts: bump(save.farm.counts, RANCH_GOODS, got.length) } },
    collected: { home, items: got },
  }
}

// --- Grass for the silo ----------------------------------------------------------------------------------------------

/** Whether a tile has weeds to cut for grass. */
export const hasGrass = (save: Pick<FarmSave, 'fields'>, index: number): boolean => save.fields.tiles[index]?.ground === 'weeds'

/** Why grass can't be cut now, or null: the silo stands and has room. */
export function grassLock(save: Pick<FarmSave, 'buildings' | 'ranch'>): string | null {
  if (!siloStands(save)) return 'Build the Coop or the Barn first: its silo holds the grass.'
  return siloRoom(save) === 0 ? 'The silo is full.' : null
}

/** Cuts grass on a weeds tile: one action, 5 feed into the silo (up to its room); the weeds grow back, so a patch of
 * weeds is a meadow. Refused on any other tile (`bad-slot`) and without a silo or its room (`locked`, `bad-job`). */
export function cutGrass<S extends FarmSave>(save: S, index: number): { save: S; feed: number } {
  if (!Number.isInteger(index) || index < 0 || index >= FIELD_TILES) throw new SaveRuleError('bad-slot', `No tile ${index + 1} in the field.`)
  if (!hasGrass(save, index)) throw new SaveRuleError('bad-slot', 'Only weeds give grass.')
  const lock = grassLock(save)
  if (lock) throw new SaveRuleError(siloStands(save) ? 'bad-job' : 'locked', lock)
  return grassAt(spend(save, 'grass'))
}
/** A cut itself, spending nothing. */
export function grassAt<S extends FarmSave>(save: S): { save: S; feed: number } {
  const feed = Math.min(GRASS_CUT, siloRoom(save))
  return { save: { ...save, ranch: { ...save.ranch, silo: save.ranch.silo + feed } }, feed }
}

// --- The night -------------------------------------------------------------------------------------------------------

/** Night step 3: each animal fed today makes its good (waiting to be collected, one at a time) and grows 2 fonder; one
 * left unfed goes hungry, makes nothing and loses 10 fondness (never below 0). Then each is unfed and uncared for the
 * next day. A line for each building with animals. */
export function tendNight<S extends FarmSave>(save: S): { save: S; lines: RanchLine[] } {
  if (save.ranch.animals.length === 0) return { save, lines: [] }
  const animals = save.ranch.animals.map((a): Animal => (a.fed
    ? { ...a, fondness: Math.min(MAX_FONDNESS, a.fondness + FED_FONDNESS), ready: true, fed: false, cared: false }
    : { ...a, fondness: Math.max(0, a.fondness - HUNGRY_FONDNESS), fed: false, cared: false }))
  const lines = RANCH_HOMES.flatMap((home): RanchLine[] => {
    const before = save.ranch.animals.filter((a) => ANIMAL_HOME[a.kind] === home)
    if (before.length === 0) return []
    const fed = before.filter((a) => a.fed).length
    return [{ kind: 'ranch', home, fed, hungry: before.length - fed, ready: animals.filter((a) => ANIMAL_HOME[a.kind] === home && a.ready).length }]
  })
  return { save: { ...save, ranch: { ...save.ranch, animals } }, lines }
}

/** An animal's name with its number: "Chicken 2", by its order among its kind. */
export function animalName(save: Pick<FarmSave, 'ranch'>, animal: Animal): string {
  const same = save.ranch.animals.filter((a) => a.kind === animal.kind)
  return same.length === 1 ? ANIMALS[animal.kind].name : `${ANIMALS[animal.kind].name} ${same.findIndex((a) => a.id === animal.id) + 1}`
}

/** An animal's good in words: "Egg". */
export const animalGoodName = (kind: AnimalKind): string => goodName(ANIMALS[kind].good)
