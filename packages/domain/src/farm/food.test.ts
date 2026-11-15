// Food: who eats (the farmer, everyone on the farm, the farmhands who work), the pantry and its three days, takeout at
// 15g a meal charged with the upkeep from the first night, a short night's takeout owed like upkeep, the farmer's batch
// and its refusals, the plain rule's goods, a ★2+ meal's well fed without stacking, the Cook task's batches by her
// Cooking, a household meal's batch, and the save's pantry, grown in place. Invented ids; no story pack.
import { describe, expect, it } from 'vitest'
import { actionsLeft, DAY_ACTIONS, goToTown } from './actions'
import { settleAccounts } from './economy'
import { aptitudeOf, handDay, handsTonight, setTasks, tableTonight } from './farmhands'
import {
  addMeals, BATCH_MEALS, batchBlock, batchStars, COOK_BATCH, cookBatch, cookBatchAt, eatTonight, foodHeld, FOOD_FAMILIES, isFoodId, mealsNeeded, MEALS_A_DAY, pantryMeals,
  plainBatch, TAKEOUT_PRICE,
} from './food'
import { talentsD } from './talents'
import { GOOD_FAMILIES } from '../goods/ids'
import { ship } from '../save/bin'
import { runNight, endDay } from '../night/end-day'
import { cookMeal } from '../romance/loop'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'

const AT = '2026-11-14T10:00:00.000Z'
const LATER = '2026-11-14T21:30:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const [A, B, C] = ['101', '202', '303']
const night = (save: SaveV4): SaveV4 => runNight(save, {})

/** A named farm on `day`, with `gold` and goods. */
function farm(gold = 500, items: SaveV4['items'] = {}, day = 1): SaveV4 {
  const save = newSave('food', AT)
  return { ...save, farmer: { name: 'Robin' }, gold, items: { ...save.items, ...items }, calendar: { day } }
}
/** Umas home in the Dorm. */
const home = (save: SaveV4, ids: string[]): SaveV4 => ({
  ...save, roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])) }, love: { ...save.love, ...Object.fromEntries(ids.map((id) => [id, newLove()])) },
  dorm: { ...save.dorm, home: [...save.dorm.home, ...ids] },
})
/** Friends from town invited to work on day 1. */
const hands = (save: SaveV4, ids: string[]): SaveV4 => ({
  ...save, roster: { ...save.roster, ...Object.fromEntries(ids.map((id) => [id, { ...newRosterUma(1), farmhand: 1 }])) },
  love: { ...save.love, ...Object.fromEntries(ids.map((id) => [id, newLove()])) },
})
const money = (save: SaveV4) => save.summary!.money ?? []

describe('who eats, and takeout', () => {
  it('feeds a new farm\'s farmer two meals of takeout the first night: 30g, charged with the upkeep', () => {
    expect([MEALS_A_DAY, TAKEOUT_PRICE]).toEqual([2, 15])
    const morning = endDay(farm(), {}, LATER)
    expect(morning.gold).toBe(470)
    expect(money(morning)).toEqual([{ kind: 'takeout', meals: 2, paid: 30, due: 30 }])
    expect(morning.farm).toMatchObject({ owed: 0, short: 0, pantry: [] })
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })

  it('feeds everyone living on the farm and every farmhand who works tonight; one in town with nothing to do doesn\'t eat', () => {
    // Two Umas home; two farmhands from town: A forages, B has no tasks.
    const save = setTasks(hands(home(farm(), [C, '404']), [A, B]), A, [{ kind: 'forage', area: 'woods' }])
    const morning = night(save)
    // The farmer, two home and A: four mouths, eight meals.
    expect(money(morning)).toContainEqual({ kind: 'takeout', meals: 8, paid: 120, due: 120 })
    expect(mealsNeeded(save)).toBe(8)
  })

  it('owes the takeout it can\'t pay, like upkeep: a short night counted, half pace from the second', () => {
    const first = night(farm(20))
    expect(first.gold).toBe(0)
    expect(first.farm).toMatchObject({ owed: 10, short: 1 })
    expect(money(first)).toEqual([{ kind: 'takeout', meals: 2, paid: 20, due: 30 }, { kind: 'short', owed: 10, nights: 1 }])
    const second = night(first)
    // The owed 10g rides on the upkeep's line, tonight's 30g of takeout on its own.
    expect(money(second)).toEqual([{ kind: 'takeout', meals: 2, paid: 0, due: 30 }, { kind: 'upkeep', paid: 0, due: 10 }, { kind: 'short', owed: 40, nights: 2 }])
    expect(second.farm).toMatchObject({ owed: 40, short: 2 })
    // Takeout is paid first from what gold there is.
    const { lines } = settleAccounts({ ...home(farm(25), [A]), farm: { ...farm().farm } }, 0, { pantry: 0, spoiled: 0, fed: 0, takeout: 4 })
    expect(lines).toEqual([{ kind: 'takeout', meals: 4, paid: 25, due: 60 }, { kind: 'upkeep', paid: 0, due: 10 }, { kind: 'short', owed: 45, nights: 1 }])
  })
})

describe('the farmer\'s batch', () => {
  it('cooks six meals from two goods of food for an action; the farm eats from the pantry, the oldest first, and they keep three days', () => {
    expect(BATCH_MEALS).toBe(6)
    const save = cookBatch(farm(500, { carp: [2, 0, 0, 0, 0], 'pine-log': [5, 0, 0, 0, 0] }))
    expect(actionsLeft(save)).toBe(DAY_ACTIONS - 1)
    expect(save.items.carp).toBeUndefined()
    expect(save.items['pine-log']).toEqual([5, 0, 0, 0, 0])
    expect(save.farm.pantry).toEqual([{ day: 1, stars: 1, meals: BATCH_MEALS }])
    // Tonight: he eats two of them, and pays no takeout; four keep for the next two nights.
    const day2 = night(save)
    expect(day2.gold).toBe(500)
    expect(money(day2)).toEqual([{ kind: 'pantry', meals: 2, spoiled: 0, fed: 0 }])
    expect(day2.farm.pantry).toEqual([{ day: 1, stars: 1, meals: 4 }])
    // Tomorrow night two more, the night after the last two: alone, he eats all six, and pays no takeout for three nights.
    const day3 = night(day2)
    expect(money(day3)).toEqual([{ kind: 'pantry', meals: 2, spoiled: 0, fed: 0 }])
    expect(day3.farm.pantry).toEqual([{ day: 1, stars: 1, meals: 2 }])
    const day4 = night(day3)
    expect(money(day4)).toEqual([{ kind: 'pantry', meals: 2, spoiled: 0, fed: 0 }])
    expect(day4.farm.pantry).toEqual([])
    expect(day4.gold).toBe(500)
    expect(money(night(day4))).toEqual([{ kind: 'takeout', meals: 2, paid: 30, due: 30 }])
    expect(parseSaveV5(json(day3))).toEqual(day3)
  })

  it('saves gold: a ★1 batch of two Button Mushrooms (60g at the bin) is 90g of takeout, three a night or one for three nights', () => {
    const save = home(farm(500, { 'button-mushroom': [2, 0, 0, 0, 0] }), [A, B])
    // Shipped and takeout bought: the bin pays 60g, three mouths eat 90g of takeout, two Umas' upkeep is 20g.
    const bought = night(ship(save, 'button-mushroom', 1, 2))
    expect(bought.gold).toBe(500 + 60 - 90 - 20)
    // Cooked: the six meals are tonight's, and nothing is bought.
    const cooked = night(cookBatch(save))
    expect(money(cooked)).toEqual([{ kind: 'pantry', meals: 6, spoiled: 0, fed: 0 }, { kind: 'upkeep', paid: 20, due: 20 }])
    expect(cooked.gold - bought.gold).toBe(30)
    // Alone: three nights of his meals for the same two mushrooms.
    const alone = farm(500, { 'button-mushroom': [2, 0, 0, 0, 0] })
    const three = (s: SaveV4) => night(night(night(s)))
    expect(three(cookBatch(alone)).gold - three(ship(alone, 'button-mushroom', 1, 2)).gold).toBe(30)
  })

  it('spoils what\'s past three days: three batches on one day feed him three nights, the rest is gone', () => {
    let save = farm(500, { carp: [6, 0, 0, 0, 0] })
    for (let n = 0; n < 3; n++) save = cookBatch(save)
    expect(pantryMeals(save)).toBe(18)
    const day4 = night(night(night(save)))
    expect(money(day4)).toEqual([{ kind: 'pantry', meals: 2, spoiled: 12, fed: 0 }])
    expect(day4.farm.pantry).toEqual([])
  })

  it('takes the plain rule\'s goods: the two cheapest of ★2 or more, so the meals feed well, else the two cheapest; only food', () => {
    expect(FOOD_FAMILIES).toEqual(['grains', 'vegetables', 'herbs-spices', 'nuts-seeds', 'sweets', 'fruits', 'mushrooms', 'fish', 'eggs-milk'])
    expect(GOOD_FAMILIES.filter((f) => !FOOD_FAMILIES.includes(f))).toEqual(['woods', 'ores', 'stones', 'crystals', 'fibers', 'hides-scales', 'bones-horns', 'essences'])
    expect([isFoodId('carrot'), isFoodId('wheat-flour'), isFoodId('egg'), isFoodId('salmon-fillet'), isFoodId('pine-log'), isFoodId('seed-carrot'), isFoodId('ring-g1')])
      .toEqual([true, true, true, true, false, false, false])
    // Carp (40g) and wheat (40g) at ★1 and one salmon at ★2: one ★2 is no pair, so the two cheapest.
    const mixed = farm(500, { carp: [1, 0, 0, 0, 0], wheat: [3, 0, 0, 0, 0], salmon: [0, 1, 0, 0, 0], 'iron-ore': [9, 0, 0, 0, 0] })
    expect(foodHeld(mixed).map((f) => f.key)).toEqual(['carp@1', 'wheat@1', 'salmon@2'])
    expect(plainBatch(mixed)).toEqual(['carp@1', 'wheat@1'])
    // Two of ★2 or more held, of one good or two: the two cheapest of them, their meals ★2.
    const good = { ...mixed, items: { ...mixed.items, carrot: [0, 0, 1, 0, 0] as [number, number, number, number, number] } }
    expect(foodHeld(good).map((f) => f.key)).toEqual(['carp@1', 'wheat@1', 'carrot@3', 'salmon@2'])
    expect(plainBatch(good)).toEqual(['carrot@3', 'salmon@2'])
    expect(cookBatch(good).farm.pantry).toEqual([{ day: 1, stars: 2, meals: 6 }])
    expect(plainBatch(farm(500, { carp: [0, 2, 0, 0, 0], wheat: [0, 0, 0, 2, 0] }))).toEqual(['carp@2', 'carp@2'])
    // A meal's stars: its goods' average, rounded down; the Kitchen's lift, later, on top.
    expect([batchStars(['carp@1', 'salmon@3']), batchStars(['carp@1', 'salmon@2']), batchStars(['carp@4', 'salmon@5'], 1)]).toEqual([2, 1, 5])
    // Any two you choose.
    expect(cookBatch(mixed, ['salmon@2', 'carp@1']).farm.pantry).toEqual([{ day: 1, stars: 1, meals: 6 }])
  })

  it('refuses without two goods of food, a pick not held or not food, anything but two, and with no action left', () => {
    expect(() => cookBatch(farm(500, { carp: [1, 0, 0, 0, 0], 'pine-log': [9, 0, 0, 0, 0] }))).toThrow('Two goods of food make a batch')
    const save = farm(500, { carp: [1, 0, 0, 0, 0], wheat: [1, 0, 0, 0, 0], 'pine-log': [9, 0, 0, 0, 0] })
    expect(batchBlock(save)).toBeNull()
    expect(() => cookBatch(save, ['carp@1', 'carp@1'])).toThrow('Not enough in the Warehouse.')
    expect(() => cookBatch(save, ['carp@1', 'pine-log@1'])).toThrow('Only food goes in a batch.')
    expect(() => cookBatch(save, ['carp@1'])).toThrow('A batch takes two goods.')
    expect(() => cookBatch({ ...save, today: { ...save.today, actions: DAY_ACTIONS } })).toThrow('No actions left today.')
  })
})

describe('well fed from a good meal', () => {
  it('leaves an Uma who eats a ★2+ meal well fed through tomorrow: one more action, and never stacked', () => {
    const save = setTasks(hands(farm(500, { carrot: [0, 4, 0, 0, 0] }), [A]), A, [{ kind: 'forage', area: 'woods' }])
    const cooked = cookBatch(cookBatch(save))
    const morning = night(cooked)
    expect(money(morning)).toContainEqual({ kind: 'pantry', meals: 4, spoiled: 0, fed: 1 })
    expect(morning.roster[A]!.wellFed).toBe(1)
    expect(morning.today.fed).toEqual([A])
    expect(handDay(morning, A)).toMatchObject({ fed: 1, actions: 4 })
    // A ★1 meal feeds, but not well.
    const plain = night(cookBatch(cookBatch({ ...save, items: { carrot: [4, 0, 0, 0, 0] } })))
    expect(plain.roster[A]!.wellFed).toBe(0)
    expect(plain.today.fed).toBeUndefined()
    // Never shortening a longer one: a reception's three days stay three before the night counts down.
    const reception = { ...cooked, roster: { ...cooked.roster, [A]: { ...cooked.roster[A]!, wellFed: 3 } } }
    expect(eatTonight(reception, [A]).save.roster[A]!.wellFed).toBe(3)
    // A household meal's two days and a good meal the same night: still two, counted down once.
    const both = { ...cooked, roster: { ...cooked.roster, [A]: { ...cooked.roster[A]!, wellFed: 2 } } }
    expect(night(both).roster[A]!.wellFed).toBe(1)
  })
})

describe('the Cook task', () => {
  /** A cook (A) and a forager (B), both from town; two Umas home. */
  const kitchen = (items: SaveV4['items']): SaveV4 => {
    const save = hands(home(farm(500, items, 2), [C, '404']), [A, B])
    return setTasks(setTasks(save, A, [{ kind: 'cook' }, { kind: 'forage', area: 'woods' }]), B, [{ kind: 'forage', area: 'woods' }])
  }

  it('cooks a batch an action by her Cooking, until the pantry holds tonight\'s meals; then her other tasks', () => {
    expect(COOK_BATCH).toEqual([6, 7, 7, 8, 9, 9, 10, 11, 11, 12])
    expect([cookBatchAt(1), cookBatchAt(5), cookBatchAt(10)]).toEqual([6, 9, 12])
    const save = kitchen({ carp: [10, 0, 0, 0, 0] })
    // Five mouths: the farmer, two home, two farmhands; ten meals. A D talent starts her at Cooking 2: two batches of 7,
    // from four carp; her third action forages.
    expect(mealsNeeded(save)).toBe(10)
    expect(aptitudeOf(save.roster[A]!, 'cook', () => 3).level).toBe(2)
    const { lines, worked } = handsTonight(save, save, talentsD, null)
    expect(lines[0]).toMatchObject({ id: A, spent: 3, done: { cook: 14, forage: 1 } })
    expect(worked).toContainEqual({ outfitId: A, place: 'kitchen' })
    const morning = night(save)
    // No takeout: only the four Umas' upkeep.
    expect(money(morning)).toEqual([{ kind: 'pantry', meals: 10, spoiled: 0, fed: 0 }, { kind: 'upkeep', paid: 40, due: 40 }])
    expect(morning.gold).toBe(460)
    expect(morning.items.carp).toEqual([6, 0, 0, 0, 0])
    // Four keep for tomorrow night.
    expect(morning.farm.pantry).toEqual([{ day: 2, stars: 1, meals: 4 }])
    // Her practice and her rank points are cooking's.
    expect(morning.roster[A]!.practice).toEqual({ cook: 2, forage: 1 })
    expect(morning.roster[A]!.ranks.cooking.points).toBeGreaterThan(0)
    // With a meal kept from today, she cooks only what's short.
    const kept = { ...save, farm: { ...save.farm, pantry: [{ day: 2, stars: 1, meals: 6 }] } }
    expect(handsTonight(kept, kept, talentsD, null).lines[0]).toMatchObject({ spent: 3, done: { cook: 7, forage: 2 } })
    expect(parseSaveV5(json(morning))).toEqual(morning)
  })

  it('cooks bigger batches as her Cooking rises, and stops when the food runs out', () => {
    const skilled = kitchen({ carp: [2, 0, 0, 0, 0] })
    const cook = { ...skilled, roster: { ...skilled.roster, [A]: { ...skilled.roster[A]!, practice: { cook: 450 } } } }
    expect(aptitudeOf(cook.roster[A]!, 'cook', () => 3).level).toBe(10)
    const { lines } = handsTonight(cook, cook, talentsD, null)
    // One batch of 12 from her two carp covers the ten; her other two actions forage.
    expect(lines[0]).toMatchObject({ spent: 3, done: { cook: 12, forage: 2 } })
    const none = kitchen({ 'pine-log': [9, 0, 0, 0, 0] })
    expect(handsTonight(none, none, talentsD, null).lines[0]).toMatchObject({ spent: 3, done: { forage: 3 } })
  })

  it('shows tonight\'s table as the farm stands: the cook\'s meals, the pantry, the takeout', () => {
    expect(tableTonight(kitchen({ carp: [10, 0, 0, 0, 0] }), talentsD, null)).toEqual({ mouths: 5, pantry: 10, cooked: 14, takeout: 0, gold: 0, fed: 0 })
    expect(tableTonight(kitchen({ carp: [2, 0, 0, 0, 0] }), talentsD, null)).toEqual({ mouths: 5, pantry: 7, cooked: 7, takeout: 3, gold: 45, fed: 0 })
    expect(tableTonight(farm(), talentsD, null)).toEqual({ mouths: 1, pantry: 0, cooked: 0, takeout: 2, gold: 30, fed: 0 })
  })
})

describe('a household meal', () => {
  it('cooks a batch for the pantry too, when the Warehouse holds two goods of food', () => {
    const wed = { ...hands(farm(500, { carp: [2, 0, 0, 0, 0] }), [A]), love: { [A]: { ...newLove(), stage: 'spouse' as const, level: 0, wed: 1, house: 0 } } }
    const done = cookMeal(wed, 'breakfast')
    expect(done.batch).toBe(BATCH_MEALS)
    expect(done.save.farm.pantry).toEqual([{ day: 1, stars: 1, meals: 6 }])
    expect(done.save.items.carp).toBeUndefined()
    const bare = cookMeal(done.save, 'dinner')
    expect(bare.batch).toBe(0)
    expect(bare.save.farm.pantry).toEqual(done.save.farm.pantry)
  })
})

describe('the save', () => {
  it('loads a save from before food with an empty pantry, its updatedAt kept', () => {
    const save = cookBatch(goToTown(farm(500, { carp: [2, 0, 0, 0, 0] })))
    const { pantry: _p, ...older } = save.farm
    const read = parseSaveV5(json({ ...save, farm: older }))
    expect(read.farm.pantry).toEqual([])
    expect(read.account.updatedAt).toBe(AT)
    expect(parseSaveV5(json(save))).toEqual(save)
  })

  it('refuses a pantry lot older than the day before yesterday, after today, out of order or empty', () => {
    const save = farm(500, {}, 5)
    const bad = (pantry: unknown) => () => parseSaveV5(json({ ...save, farm: { ...save.farm, pantry } }))
    expect(bad([{ day: 3, stars: 1, meals: 1 }, { day: 4, stars: 2, meals: 3 }, { day: 5, stars: 1, meals: 4 }])).not.toThrow()
    expect(bad([{ day: 2, stars: 1, meals: 4 }])).toThrow('expected 3–5')
    expect(bad([{ day: 6, stars: 1, meals: 4 }])).toThrow('expected 3–5')
    expect(bad([{ day: 5, stars: 1, meals: 4 }, { day: 4, stars: 1, meals: 4 }])).toThrow('expected the oldest first')
    expect(bad([{ day: 5, stars: 1, meals: 0 }])).toThrow('expected 1–')
    expect(bad([{ day: 5, stars: 1, meals: 1 }, { day: 5, stars: 1, meals: 2 }])).toThrow('repeated')
    expect(addMeals([{ day: 4, stars: 1, meals: 2 }], 5, 2, 4)).toEqual([{ day: 4, stars: 1, meals: 2 }, { day: 5, stars: 2, meals: 4 }])
  })
})
