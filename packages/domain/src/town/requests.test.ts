import { describe, expect, it } from 'vitest'
import { goToTown } from '../farm/actions'
import { surplusCrate } from '../farm/production'
import { fish, forage } from '../gathering/hauls'
import { goodOf } from '../goods/ids'
import { discoverOutput, discovered } from '../goods/discovery'
import { canMake, finishPlay, menuLine, startKitchenPlay } from '../kitchen/kitchen'
import { knowsRecipe, recipeOf } from '../kitchen/recipes'
import { runNight } from '../night/end-day'
import { finishArrival } from '../romance/love'
import { introduce } from '../romance/meeting'
import { GOLD_SHIPPED } from '../save/bin'
import { parseSave } from '../save/save'
import { isDishId, newRosterUma, newLove, newSave, type FarmSave } from '../save/v4'
import { addGoods, goodCount } from '../save/warehouse'
import { storyPackFrom } from '../story/pack'
import { CAFE_TUTORIAL, TROUT_GRILL, TOWN_REQUESTS, REQUEST_SLOTS, acceptRequest, boardOpen, cancelRequest,
  deliverRequest, learnTroutGrill, payTownOrders, refreshTownRequests, requestCards, requestHolds } from './requests'

const AT = '2026-11-22T12:00:00.000Z'
const IDS = Array.from({ length: 5 }, (_, i) => String(9700301 + i))
const pack = storyPackFrom({ cast: { umas: IDS.map(characterId => ({ characterId })) }, umas: {}, routes: {},
  town: { professions: [{ id: 'cook', name: 'Cook', at: 'cafe', off: 'sunday', role: 'rosa-bell', partners: [IDS[0]!, IDS[1]!] }] } })
const raw = (day = 1): FarmSave => ({ ...newSave('town-requests', AT), farmer: { name: 'Robin' }, calendar: { day } })
const met = (day = 1): FarmSave => IDS.reduce((save, id) => finishArrival(introduce(save, pack, id), id, { choice: 30, flags: [] }), goToTown(raw(day)))

describe('F113 town orders', () => {
  it('meets five, learns Trout Grill from a real catch, cooks it, delivers once, reloads and pays it on the next turn', () => {
    expect(boardOpen(raw())).toBe(false)
    let save = met()
    expect(Object.keys(save.roster)).toHaveLength(5)
    expect(boardOpen(save)).toBe(true)
    expect(requestCards(save, pack).find(row => row.id === CAFE_TUTORIAL)).toBeUndefined()
    // Rank 3 checkpoint for the service playthrough. Stock after this point all comes from real actions.
    save = { ...save, buildings: { ...save.buildings, kitchen: 1 } }
    const bought = { ...save, items: addGoods(save.items, 'trout', 1, 3) }
    expect(() => learnTroutGrill(bought, true)).toThrow('Trout discovery')
    expect(recipeOf(TROUT_GRILL)!.price).toBe(500)
    expect(learnTroutGrill(save, false).gold).toBe(save.gold - 500)
    const card = requestCards(save, pack).find(row => row.id === CAFE_TUTORIAL)!
    expect(card.worker).toBe(IDS[0])
    save = acceptRequest(save, pack, 'food', CAFE_TUTORIAL)
    for (let days = 0; days < 29 && canMake(save, TROUT_GRILL) < 6; days++) {
      save = fish(save, 'pond').save
      save = fish(save, 'pond').save
      save = forage(save, 'woods').save
      save = forage(save, 'woods').save
      save = runNight(save, { story: pack })
    }
    expect(discovered(save, 'trout')).toBe(true)
    save = learnTroutGrill(goToTown(save), true)
    expect(knowsRecipe(save, TROUT_GRILL)).toBe(true)
    save = finishPlay(startKitchenPlay(save, [menuLine(save, TROUT_GRILL, 6)], null, pack), null).save
    const portions = goodCount(save.items, TROUT_GRILL)
    expect(portions).toBeGreaterThan(0)
    expect(requestHolds(save, TROUT_GRILL).size).toBe(1)
    expect(() => deliverRequest({ ...save, today: { ...save.today, actions: 10 } }, pack, 'food', CAFE_TUTORIAL)).toThrow('No actions')
    const delivered = deliverRequest(save, pack, 'food', CAFE_TUTORIAL)
    expect(goodCount(delivered.items, TROUT_GRILL)).toBe(portions - 1)
    expect(delivered.today.actions).toBe(save.today.actions + 1)
    expect(delivered.gold).toBe(save.gold)
    expect(delivered.farm.counts[GOLD_SHIPPED]).toBeGreaterThan(save.farm.counts[GOLD_SHIPPED] ?? 0)
    expect(() => deliverRequest(delivered, pack, 'food', CAFE_TUTORIAL)).toThrow()
    const loaded = parseSave(JSON.parse(JSON.stringify(delivered)))
    expect(loaded).toEqual(delivered)
    const payment = loaded.farm.requests!.pending
    expect(payment).toBeGreaterThan(0)
    const morning = runNight(loaded, { story: pack })
    expect(morning.farm.accounts?.at(-1)).toMatchObject({ townOrders: payment, shipping: 0 })
    expect(morning.summary?.money).toContainEqual({ kind: 'town-orders', gold: payment })
    expect(payTownOrders(morning).gold).toBe(0)
    expect(parseSave(JSON.parse(JSON.stringify(morning)))).toEqual(morning)
  })

  it('books a recurring order for seven days, protects real lots and frees them after cancellation or expiry', () => {
    let save = discoverOutput(met(), 'pine-log')
    save = { ...save, items: addGoods(save.items, 'pine-log', 1, 30), farm: { ...save.farm, surplus: { goods: ['pine-log'], limit: 99 } } }
    save = refreshTownRequests(save, pack)
    const offered = requestCards(save, pack).find(row => row.slot === 'town')!
    expect(offered.id).toBe('noticeboard-timber')
    const waited = { ...save, calendar: { day: 3 } }
    const accepted = acceptRequest(waited, pack, 'town', offered.id)
    expect(accepted.farm.requests?.slots.town).toMatchObject({ posted: 1, due: 9 })
    expect(surplusCrate(accepted).find(row => row.id === 'pine-log')?.count).toBe(24)
    expect(surplusCrate(cancelRequest(accepted, 'town', offered.id)).find(row => row.id === 'pine-log')?.count).toBe(30)
    const expired = { ...accepted, calendar: { day: 10 } }
    expect(requestHolds(expired, 'pine-log').size).toBe(0)
    expect(() => deliverRequest(expired, pack, 'town', offered.id)).toThrow()
  })

  it('can deliver every launch order with its own Warehouse item and proof', () => {
    for (const slot of REQUEST_SLOTS) for (const def of TOWN_REQUESTS[slot]) {
      expect(goodOf(def.item) || isDishId(def.item)).toBeTruthy()
      const base = raw(15)
      let save: FarmSave = {
        ...base, today: { ...base.today, town: true }, roster: Object.fromEntries(IDS.map(id => [id, newRosterUma(1)])),
        love: Object.fromEntries(IDS.map(id => [id, newLove()])), buildings: { mill: 1, sawmill: 1, kitchen: 1, smelter: 1, coop: 1, barn: 1, smokehouse: 1, dock: 1, restaurant: 1 },
        workshops: { ...base.workshops, restaurant: { cleared: 1, shift: null, last: null } },
        diary: { ...base.diary, milestones: def.id === CAFE_TUTORIAL ? [] : ['cafe-first-delivery'] },
        items: addGoods({}, def.item, 1, def.count),
      }
      save = discoverOutput(save, def.item)
      const card = requestCards(save, pack).find(row => row.id === def.id)
      expect(card, def.id).toBeDefined()
      const result = deliverRequest(acceptRequest(save, pack, slot, def.id), pack, slot, def.id)
      expect(result.farm.requests?.pending, def.id).toBeGreaterThan(0)
      expect(goodCount(result.items, def.item)).toBe(0)
    }
  })
})
