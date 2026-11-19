import { describe, expect, it } from 'vitest'
import { expeditionBlock, sendExpedition } from '../expeditions/expeditions'
import { eatTonight } from '../farm/food'
import { handsTonight } from '../farm/farmhands'
import { talentsD } from '../farm/talents'
import { discoverOutput, discovered } from '../goods/discovery'
import { marketNight } from '../goods/market'
import { priceOf, starPrice } from '../goods/prices'
import { assistantLock, finishPlay, kitchenMakes, kitchenPlayBlock, staffBlock, startKitchenPlay } from '../kitchen/kitchen'
import { cookLock } from '../kitchen/contest'
import { runNight } from '../night/end-day'
import { giftV4 } from '../romance/acts'
import { togetherPlay } from '../romance/plays/which'
import { receptionOf } from '../romance/wedding'
import { GOLD_SHIPPED, payBin, ship } from '../save/bin'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type FarmSave, type StarCounts } from '../save/v4'
import { addGoods, goodCount, parseStockKey, stockKey } from '../save/warehouse'
import { atHomeInTown, castPack } from '../story/authored.fixture'
import { storyPackFrom } from '../story/pack'
import { exactMenuLine, knowsRestaurantRecipe, RESTAURANT_RECIPES, restaurantRecipe } from './recipes'
import { platePrice, portionsLeft, saveDishForMeals, serveTicket, serverLock, servingPerk, settleRestaurant, shiftBlock, startRestaurantShift } from './restaurant'
import { restaurantId, WRONG_PLATE_MS } from './rules'

const DAY = 87 // Winter, year two.
const AT = '2026-11-19T12:00:00.000Z'
const NOW = Date.parse(AT)
const HAND = '9800001'
const OTHER = '9800002'
const SALAD = 'dish-vegetables-1'
const GRILL = 'dish-fish-1'
const STOCK = restaurantId(15)
const ROAST = restaurantRecipe(restaurantId(26))!
const WITH_APPLE = restaurantRecipe(restaurantId(51))!
const row = (n: number, stars = 1): StarCounts => [1, 2, 3, 4, 5].map((s) => s === stars ? n : 0) as StarCounts
const read = (save: FarmSave) => parseSaveV5(JSON.parse(JSON.stringify(save)))
const key = (id: string, stars = 1) => stockKey(id, stars)

function farm(items: FarmSave['items'] = {}, cleared = 0): FarmSave {
  const base = newSave('f98-service', AT)
  return {
    ...base, calendar: { day: DAY }, farmer: { name: 'Robin' }, gold: 50_000,
    buildings: { ...base.buildings, kitchen: 1, restaurant: 1, expeditions: 1 },
    roster: { [HAND]: { ...newRosterUma(1), farmhand: 1 }, [OTHER]: { ...newRosterUma(1), farmhand: 1 } },
    love: { [HAND]: newLove(), [OTHER]: newLove() }, today: { ...base.today, town: true }, items,
    farm: { ...base.farm, points: 10_000, counts: { [GOLD_SHIPPED]: 1_000_000 } },
    ...(cleared ? { workshops: { ...base.workshops, restaurant: { shift: null, last: null, cleared } } } : {}),
  }
}

const prove = (save: FarmSave, ids: readonly string[]) => ids.reduce((s, id) => discoverOutput(s, id), save)

function serve(save: FarmSave, index: number, id?: string, late = 0): FarmSave {
  const shift = save.workshops.restaurant!.shift!
  const ticket = shift.tickets[index]!
  return serveTicket(save, index, id ?? parseStockKey(shift.tray[ticket.plate]!.key)!.id, shift.started + ticket.opens + late)
}

describe('exact-grade recipe rules', () => {
  it('learns independently when a page is open and all exact ingredient and component ancestors have production proof', () => {
    const held = Object.fromEntries(ROAST.proofs.map((id) => [id, row(20, 5)]))
    const planted = prove(farm(held, 2), [...ROAST.proofs.filter((id) => id !== 'carrot-grade-2' && id !== STOCK), 'carrot-grade-3', 'potato'])
    expect(knowsRestaurantRecipe(planted, ROAST)).toBe(false)
    const improved = discoverOutput(planted, 'carrot-grade-2')
    expect(knowsRestaurantRecipe(improved, ROAST)).toBe(false)
    const cooked = discoverOutput(improved, STOCK)
    expect(knowsRestaurantRecipe(cooked, ROAST)).toBe(true)
    const emptied: FarmSave = { ...cooked, items: {} }
    expect(knowsRestaurantRecipe(emptied, ROAST)).toBe(true)
    expect(discoverOutput(cooked, 'carrot-grade-2')).toBe(cooked)
    expect(knowsRestaurantRecipe({ ...cooked, workshops: { ...cooked.workshops, restaurant: { cleared: 1, shift: null, last: null } } }, ROAST)).toBe(false)
  })

  it('requires raw and refined proof and loads pre-discovery v5 data by its actual per-item records', () => {
    let save = farm({ 'apple-grade-2': row(10) }, 4)
    save = { ...save, crops: { ...save.crops, carrot: 5 }, diary: { ...save.diary, records: { 'size:carp': 20 } } }
    const older = read(save)
    expect(discovered(older, 'carrot')).toBe(true)
    expect(discovered(older, 'carp')).toBe(true)
    expect(discovered(older, 'carp-grade-2')).toBe(false)
    const refined = prove(older, WITH_APPLE.proofs.filter((id) => id !== 'apple-grade-2'))
    expect(knowsRestaurantRecipe(refined, WITH_APPLE)).toBe(false)
    expect(knowsRestaurantRecipe(discoverOutput(refined, 'apple-grade-2'), WITH_APPLE)).toBe(true)
    expect(discovered(refined, 'carrot')).toBe(true)
  })

  it('reserves component and exact inputs once, with weighted stars across lots at their matching grade', () => {
    const fresh = prove(farm({
      'sunflower-oil': row(2, 3), 'carrot-grade-2': [1, 0, 0, 0, 1], carrot: row(8, 5), [STOCK]: row(2, 4),
    }, 2), ROAST.proofs)
    const line = exactMenuLine(fresh, ROAST, 2)
    expect(line.inputs).toContainEqual({ key: 'carrot-grade-2@1', count: 1 })
    expect(line.inputs).toContainEqual({ key: 'carrot-grade-2@5', count: 1 })
    for (const wrong of ['potato@1', 'carrot-grade-3@1', 'carrot-grade-2@6']) {
      const inputs = line.inputs.map((input) => input.key === 'carrot-grade-2@1' ? { ...input, key: wrong } : input)
      expect(kitchenPlayBlock(fresh, [{ ...line, inputs }])).toBe('Choose the exact recipe ingredients.')
    }
    const cooking = read(startKitchenPlay(fresh, [line]))
    expect(kitchenMakes([line], { lift: 2, factor: 2 })).toEqual([{ dish: ROAST.id, stars: 5, count: 4 }])
    expect(goodCount(cooking.items, STOCK)).toBe(0)
    expect(goodCount(cooking.items, 'carrot')).toBe(8)
    expect(() => saveDishForMeals(cooking, key(STOCK, 4))).toThrow('available dish')
    const baked = finishPlay(cooking, null).save
    expect(baked.items[ROAST.id]).toEqual(row(2, 3))
    expect(discovered(baked, ROAST.id)).toBe(true)
    expect(knowsRestaurantRecipe(baked, ROAST)).toBe(true)
  })
})

describe('ticket service and saved commitments', () => {
  it('reserves each exact lot, checks timing, reloads between tickets, and pays an interrupted shift once', () => {
    const fresh = farm({ [SALAD]: row(5, 2), [GRILL]: row(2), [STOCK]: row(1, 3) })
    const tray = [{ key: key(SALAD, 2), count: 5 }, { key: key(GRILL), count: 2 }, { key: key(STOCK, 3), count: 1 }]
    let save = startRestaurantShift(fresh, 1, tray, HAND, NOW)
    const original = save.workshops.restaurant!.shift!
    expect(startRestaurantShift(fresh, 1, tray, HAND, NOW).workshops.restaurant!.shift).toEqual(original)
    expect(save.today.actions).toBe(1)
    expect(() => saveDishForMeals(save, key(STOCK, 3))).toThrow('available dish')
    expect(() => ship(save, STOCK, 3, 1)).toThrow('available dishes')
    expect(() => giftV4(save, castPack([OTHER]), OTHER, STOCK, 3)).toThrow('available')
    expect(() => receptionOf(save, { dish: STOCK, stars: 3 })).toThrow('Warehouse')
    expect(expeditionBlock(save, 'old-fort-ruins', [OTHER], [key(STOCK, 3)])).toBe('Not enough of that dish.')
    expect(expeditionBlock(save, 'old-fort-ruins', [HAND], [])).toBe('Serving today.')
    expect(assistantLock(save, HAND)).toBe('She’s serving today.')
    expect(cookLock(save, HAND)).toBe('She’s serving today.')
    expect(staffBlock(save, [key(STOCK, 3)])).toBe('Not enough in the Warehouse.')
    expect(serveTicket(save, 1, SALAD, NOW)).toBe(save)
    const first = parseStockKey(tray[original.tickets[0]!.plate]!.key)!
    save = serve(save, 0, first.id === SALAD ? GRILL : SALAD)
    expect(save.workshops.restaurant!.shift!.penalty).toBe(WRONG_PLATE_MS)
    expect(portionsLeft(save.workshops.restaurant!.shift!)).toEqual(tray)
    save = read(serve(save, 0))
    expect(serve(save, 0)).toBe(save)
    expect(serve(save, 1, undefined, 30_000)).toBe(save)
    const done = read(settleRestaurant(save))
    const { last } = done.workshops.restaurant!
    expect(last).toMatchObject({ covers: 1, cleared: false, grade: 'rough', sales: platePrice(first.id, first.stars) })
    expect(done.gold - fresh.gold).toBe(last!.sales + last!.tips)
    expect(done.diary.shipped[first.id]).toBe(1)
    expect(goodCount(done.items, first.id)).toBe(goodCount(fresh.items, first.id) - 1)
    expect(settleRestaurant(done)).toBe(done)
    expect(shiftBlock(done, 1, tray)).toBe('One shift per day.')
    const morning = runNight(save, {})
    expect(morning.workshops.restaurant?.last).toEqual(last)
    expect(morning.summary!.work).toContainEqual({ kind: 'restaurant', result: last })
    expect(morning.roster[HAND]!.ranks.serving.points).toBeGreaterThan(0)
    expect(morning.roster[HAND]!.ranks.serving.challenge).toBe(1)
  })

  it('needs a successful learned earlier dish starting at stage three and allows replay after success', () => {
    const tray = [{ key: key(SALAD), count: 7 }, { key: key(STOCK), count: 1 }]
    const fresh = farm({ [SALAD]: row(7), [STOCK]: row(1), [GRILL]: row(2) }, 2)
    expect(shiftBlock(fresh, 3, tray)).toMatch(/learned dish/)
    expect(shiftBlock(fresh, 2, [{ key: key(SALAD), count: 7 }, { key: key(SALAD), count: 1 }])).toMatch(/Warehouse/)
    const learned = prove(fresh, restaurantRecipe(STOCK)!.proofs)
    let shift = startRestaurantShift(learned, 3, tray, null, NOW)
    const tickets = shift.workshops.restaurant!.shift!.tickets
    const proof = tickets.findIndex(({ plate }) => plate === 1)
    expect(proof).toBeLessThanOrEqual(1)
    for (const i of tickets.keys()) if (i !== proof) shift = serve(shift, i)
    expect(settleRestaurant(shift).workshops.restaurant!.last).toMatchObject({ covers: 7, cleared: false })
    const success = settleRestaurant(serve(shift, proof))
    expect(success.workshops.restaurant).toMatchObject({ cleared: 3, last: { cleared: true, covers: 8, grade: 'masterwork' } })
    expect(shiftBlock(runNight(success, {}), 1, [{ key: key(GRILL), count: 2 }])).toMatch(/6 portions/)
  })

  it('uses an eligible server’s points, perks and work action and keeps the tray story play', () => {
    const pack = storyPackFrom(atHomeInTown({ cast: { umas: [{ characterId: HAND }] }, umas: { [HAND]: { favouriteLine: 'serving' } }, routes: {}, ties: { version: 1, ties: [] } }))
    const fresh = farm({ [SALAD]: row(6) })
    const save = { ...fresh, love: { ...fresh.love, [HAND]: { ...fresh.love[HAND]!, level: 7 } } }
    expect(servingPerk(save, HAND, pack)).toBe(10)
    expect(serverLock({ ...save, today: { ...save.today, assistant: HAND } }, HAND)).toBe('She’s booked today.')
    expect(serverLock({ ...save, today: { ...save.today, cook: HAND } }, HAND)).toBe('She’s booked today.')
    const trip = sendExpedition(save, 'old-fort-ruins', [HAND], [])
    expect(serverLock(trip, HAND)).toBe('She’s in an expedition party.')
    const tray = [{ key: key(SALAD), count: 6 }]
    const solo = startRestaurantShift(save, 1, tray, null, NOW)
    const helped = startRestaurantShift(save, 1, tray, HAND, NOW, { story: pack, talentOf: () => 7 })
    expect(helped.workshops.restaurant!.shift!.tipRate).toBeGreaterThan(solo.workshops.restaurant!.shift!.tipRate)
    expect(helped.workshops.restaurant!.shift!.tickets[0]!.closes).toBeGreaterThan(solo.workshops.restaurant!.shift!.tickets[0]!.closes)
    const ticket = helped.workshops.restaurant!.shift!.tickets[0]!
    expect(helped.workshops.restaurant!.shift!.graces).toBe(1)
    const late = serve(helped, 0, SALAD, ticket.closes - ticket.opens + 1000)
    expect(late.workshops.restaurant!.shift).toMatchObject({ served: [0], graces: 0 })
    const hands = handsTonight(helped, helped, talentsD, null)
    expect(hands.lines.find((line) => line.id === HAND)).toMatchObject({ spent: 1, restaurant: 1 })
    expect(togetherPlay({ kind: 'work', activity: 'serving' })).toEqual({ kind: 'rhythm', mark: 'tray', fallback: true })
  })
})

describe('dishes after the Kitchen', () => {
  it('ships every recipe, applies seasonal demand and crate easing, and records the sale once', () => {
    for (const recipe of RESTAURANT_RECIPES) {
      expect(platePrice(recipe.id, 1)).toBe(recipe.price)
      expect(recipe.price).toBeLessThanOrEqual(recipe.leafValue * 1.35)
      expect(starPrice(recipe.id, 5)).toBeGreaterThan(recipe.price)
    }
    const save = farm({ [STOCK]: row(61, 5) })
    const shipped = read(ship(save, STOCK, 5, 61))
    expect(priceOf(STOCK, 5, DAY)).toBeGreaterThan(platePrice(STOCK, 5))
    const paid = payBin(shipped, DAY)
    expect(paid.sales[0]).toMatchObject({ id: STOCK, count: 61, stars: 5, demand: true, eased: 10 })
    expect(paid.save.diary.shipped[STOCK]).toBe(61)
    expect(paid.save.farm.counts[GOLD_SHIPPED]).toBe(save.farm.counts[GOLD_SHIPPED]! + paid.gold)
    expect(payBin(paid.save, DAY).gold).toBe(0)
    expect(marketNight({}, shipped.bin)).toEqual({ [STOCK]: 1 })
  })

  it('uses one dish for six meals at its stars, saves takeout, and expires leftovers on the third night', () => {
    const fresh = farm({ [STOCK]: row(1, 4) })
    const booked = sendExpedition(fresh, 'old-fort-ruins', [HAND], [key(STOCK, 4)])
    expect(() => saveDishForMeals(booked, key(STOCK, 4))).toThrow('available dish')
    expect(() => ship(booked, STOCK, 4, 1)).toThrow('available dishes')
    const save = read(saveDishForMeals(fresh, key(STOCK, 4)))
    expect(save.farm.pantry).toEqual([{ day: DAY, stars: 4, meals: 6 }])
    expect(() => saveDishForMeals(save, key(STOCK, 4))).toThrow('available dish')
    const meal = eatTonight(save, [HAND, OTHER])
    expect(meal).toMatchObject({ pantry: 6, takeout: 0, fed: [HAND, OTHER] })
    expect(eatTonight(fresh, [HAND, OTHER]).takeout).toBe(6)
    const leftovers = saveDishForMeals({ ...fresh, items: addGoods(fresh.items, STOCK, 4, 1) }, key(STOCK, 4))
    const meals = saveDishForMeals(leftovers, key(STOCK, 4))
    expect(eatTonight({ ...meals, calendar: { day: DAY + 2 } }, [])).toMatchObject({ spoiled: 10, pantry: 2 })
  })
})
