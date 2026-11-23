import { availableDishes } from '../expeditions/stock'
import { actionsLeft, spendActions } from '../farm/actions'
import { BOARD_MET } from '../farm/builds'
import { dateOf } from '../farm/calendar'
import { placeBuilt, type FarmPlaceId } from '../farm/places'
import { discovered } from '../goods/discovery'
import { hasPrice } from '../goods/prices'
import { ingredientSources } from '../goods/sources'
import { buyRecipe, kitchenBuilt, knowsRecipe } from '../kitchen/recipes'
import { platePrice } from '../restaurant/restaurant'
import { crateWorth, GOLD_SHIPPED } from '../save/bin'
import { earnGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { isDishId, type FarmSave } from '../save/v4'
import { goodCount, stockKey, takeGoods } from '../save/warehouse'
import type { SchedulePack } from './town'
import { professionWorker } from './professions'

export const REQUEST_SLOTS = ['food', 'makers', 'town'] as const
export type RequestSlot = typeof REQUEST_SLOTS[number]
export const TROUT_GRILL = 'dish-fish-2'
export const CAFE_TUTORIAL = 'cafe-trout-grill'
const TUTORIAL = CAFE_TUTORIAL
const TUTORIAL_DONE = 'cafe-first-delivery'

interface Definition {
  id: string
  title: string
  from: string
  item: string
  count: number
  built?: FarmPlaceId
  stage?: number
}

export const TOWN_REQUESTS = {
  food: [
    { id: TUTORIAL, title: 'Trout Grill for the Café', from: 'cook', item: TROUT_GRILL, count: 1, built: 'kitchen' },
    { id: 'window-platter', title: 'A platter for the window table', from: 'cafe-host', item: 'dish-vegetables-1', count: 2, built: 'kitchen' },
    { id: 'evening-soup', title: 'Soup for the evening rush', from: 'cook', item: 'dish-mushrooms-1', count: 2, built: 'kitchen' },
    { id: 'morning-bread', title: 'Bread for the morning counter', from: 'baker', item: 'dish-grains-1', count: 2, built: 'kitchen' },
    { id: 'harbour-lunch', title: 'A harbour lunch', from: 'cafe-host', item: 'dish-restaurant-008', count: 2, built: 'restaurant', stage: 1 },
  ],
  makers: [
    { id: 'bakers-flour', title: 'Flour before opening', from: 'baker', item: 'wheat-flour', count: 6, built: 'mill' },
    { id: 'preserves-fruit', title: 'Fruit for the preserves shelf', from: 'miller', item: 'apple', count: 4 },
    { id: 'handrail-planks', title: 'Planks for a handrail', from: 'carpenter', item: 'pine-plank', count: 6, built: 'sawmill' },
    { id: 'repair-copper', title: 'Copper for a small repair', from: 'smith', item: 'copper-ingot', count: 4, built: 'smelter' },
    { id: 'harbour-fillets', title: 'Fillets for the harbour counter', from: 'fisher', item: 'carp-fillet', count: 4, built: 'smokehouse' },
    { id: 'stall-honey', title: 'Honey for the stall', from: 'beekeeper', item: 'honey', count: 3, built: 'mill' },
  ],
  town: [
    { id: 'neighbour-eggs', title: 'Eggs for a neighbour', from: 'rancher', item: 'egg', count: 4, built: 'coop' },
    { id: 'inn-milk', title: 'Milk for the inn kitchen', from: 'innkeeper', item: 'milk', count: 4, built: 'barn' },
    { id: 'display-herbs', title: 'Fresh herbs for the display', from: 'florist', item: 'basil', count: 4 },
    { id: 'noticeboard-timber', title: 'Timber for the noticeboard', from: 'courier', item: 'pine-log', count: 6 },
    { id: 'guides-basket', title: 'A basket for the guide', from: 'woodland-guide', item: 'button-mushroom', count: 4 },
    { id: 'quay-provisions', title: 'A quay provisions order', from: 'dock-steward', item: 'sardine', count: 4, built: 'dock' },
    { id: 'tasting-honeycomb', title: 'Honeycomb for the tasting stand', from: 'beekeeper', item: 'honeycomb', count: 3 },
  ],
} satisfies Record<RequestSlot, readonly Definition[]>

type RequestStatus = 'offered' | 'accepted' | 'cancelled' | 'delivered'
export interface RequestOrder {
  id: string
  title: string
  from: string
  worker: string | null
  item: string
  count: number
  stars: number
  posted: number
  due: number | null
  status: RequestStatus
  payment?: number
  closed?: number
}
export interface RequestBook {
  slots: Partial<Record<RequestSlot, RequestOrder>>
  pending: number
}
type Offer = Omit<RequestOrder, 'status' | 'payment'>
export type RequestCard = Offer & { slot: RequestSlot; status: RequestStatus | 'expired'; payment: number; held: number }

const weekOf = (day: number) => Math.floor((day - 1) / 7)
export const boardOpen = (save: Pick<FarmSave, 'roster'>) => Object.keys(save.roster).length >= BOARD_MET
function eligible(save: FarmSave, def: Definition): boolean {
  return (!def.built || placeBuilt(save, def.built))
    && (!def.stage || (save.workshops.restaurant?.cleared ?? 0) >= def.stage)
    && (isDishId(def.item) || goodCount(save.items, def.item) > 0 || ingredientSources(def.item).some(source => source.seasons.includes(dateOf(save.calendar.day, save.calendar).season)))
    && (def.id === TUTORIAL || discovered(save, def.item))
}

function offered(save: FarmSave, slot: RequestSlot, pack: SchedulePack | null): Offer | null {
  const day = save.calendar.day
  const week = weekOf(day)
  const definitions: readonly Definition[] = TOWN_REQUESTS[slot]
  const tutorial = slot === 'food' && !save.diary.milestones.includes(TUTORIAL_DONE)
    && eligible(save, definitions[0]!) ? definitions[0]! : null
  const pool = definitions.filter(def => def.id !== TUTORIAL)
  const first = week % pool.length
  const def = tutorial ?? [...pool.slice(first), ...pool.slice(0, first)].find(row => eligible(save, row))
  return def ? {
    id: def.id, title: def.title, from: def.from, worker: professionWorker(pack, save, day, def.from),
    item: def.item, count: def.count, stars: 1, posted: day, due: null,
  } : null
}

function goodsFor(save: FarmSave, order: Offer) {
  let remaining = order.count
  return (save.items[order.item] ?? []).flatMap((inStock, index) => {
    const stars = index + 1
    if (stars < order.stars) return []
    const stock = isDishId(order.item) ? availableDishes(save, stockKey(order.item, stars)) : inStock
    const count = Math.min(stock, remaining)
    remaining -= count
    return count ? [{ id: order.item, count, stars }] : []
  })
}

function payout(save: FarmSave, order: Offer, estimate = false) {
  const goods = goodsFor(save, order)
  const held = goods.reduce((sum, row) => sum + row.count, 0)
  const lines = estimate && held < order.count ? [...goods, { id: order.item, count: order.count - held, stars: order.stars }] : goods
  const base = hasPrice(order.item) ? crateWorth(save, lines)
    : lines.reduce((sum, row) => sum + platePrice(row.id, row.stars) * row.count, 0)
  return { goods, held, base, payment: base + Math.min(250, Math.floor(base / 10)) }
}

function currentOrder(save: FarmSave, slot: RequestSlot): RequestOrder | undefined {
  const old = save.farm.requests?.slots[slot]
  const today = save.calendar.day
  if (!old) return
  if (old.status === 'accepted' && (old.due === null || today <= old.due)) return old
  if (weekOf(old.closed ?? old.posted) === weekOf(today)) return old
}

export function requestCards(save: FarmSave, pack: SchedulePack | null): RequestCard[] {
  if (!boardOpen(save)) return []
  return REQUEST_SLOTS.flatMap(slot => {
    const old = currentOrder(save, slot)
    const offer = old ?? offered(save, slot, pack)
    if (!offer) return []
    const expired = offer.due !== null && offer.due < save.calendar.day && old?.status !== 'delivered'
    const quote = payout(save, offer, true)
    return [{ ...offer, slot, status: expired ? 'expired' : old?.status ?? 'offered', held: quote.held, payment: old?.payment ?? quote.payment }]
  })
}

function record<S extends FarmSave>(save: S, slot: RequestSlot, order: RequestOrder, cash = 0): S {
  const previous = save.farm.requests
  return { ...save, farm: { ...save.farm, requests: { slots: { ...previous?.slots, [slot]: order }, pending: (previous?.pending ?? 0) + cash } } }
}

export function acceptRequest<S extends FarmSave>(save: S, pack: SchedulePack | null, slot: RequestSlot, id: string): S {
  const card = requestCards(save, pack).find(row => row.slot === slot && row.id === id)
  if (!card || (card.status !== 'offered' && card.status !== 'cancelled')) throw new SaveRuleError('locked', 'This order has closed.')
  const { held: _held, payment: _payment, slot: _slot, ...order } = card
  return record(save, slot, { ...order, due: id === TUTORIAL ? null : order.due ?? save.calendar.day + 6, status: 'accepted' })
}

export function cancelRequest<S extends FarmSave>(save: S, slot: RequestSlot, id: string): S {
  const old = currentOrder(save, slot)
  if (!old || old.id !== id || old.status !== 'accepted') return save
  return record(save, slot, { ...old, status: 'cancelled' })
}

export const requestDeliveryLock = (save: FarmSave, card: RequestCard): string | null =>
  card.status !== 'accepted' ? 'Accept the order first.' : card.held < card.count ? 'More stock needed.'
    : actionsLeft(save) < 1 ? 'No actions left today.' : null

export function deliverRequest<S extends FarmSave>(save: S, pack: SchedulePack | null, slot: RequestSlot, id: string): S {
  const old = currentOrder(save, slot)
  const card = requestCards(save, pack).find(row => row.slot === slot && row.id === id)
  if (!old || !card) throw new SaveRuleError('locked', 'This order has closed.')
  const lock = requestDeliveryLock(save, card)
  if (lock) throw new SaveRuleError('locked', lock)
  const quote = payout(save, old)
  const items = quote.goods.reduce((stock, row) => takeGoods(stock, row.id, row.stars, row.count), save.items)
  const next = spendActions(save, 1)
  const milestones = id === TUTORIAL && !save.diary.milestones.includes(TUTORIAL_DONE)
    ? [...save.diary.milestones, TUTORIAL_DONE] : save.diary.milestones
  const counts = { ...save.farm.counts, [GOLD_SHIPPED]: (save.farm.counts[GOLD_SHIPPED] ?? 0) + quote.base }
  return record({ ...next, items, diary: { ...save.diary, milestones }, farm: { ...save.farm, counts } },
    slot, { ...old, closed: save.calendar.day, status: 'delivered', payment: quote.payment }, quote.payment)
}

/** Pin eligible offers once per slot and game week, with the date and worker who posted them. */
export function refreshTownRequests<S extends FarmSave>(save: S, pack: SchedulePack | null): S {
  if (!boardOpen(save)) return save
  let next = save
  for (const slot of REQUEST_SLOTS) {
    const old = currentOrder(next, slot)
    const offer = offered(next, slot, pack)
    if (!offer || (old && !(slot === 'food' && offer.id === TUTORIAL && old.id !== TUTORIAL && old.status === 'offered'))) continue
    next = record(next, slot, { ...offer, status: 'offered' })
  }
  return next
}

export { requestHolds } from './request-stock'

export function payTownOrders<S extends FarmSave>(save: S): { save: S; gold: number } {
  const book = save.farm.requests
  if (!book?.pending) return { save, gold: 0 }
  return { save: earnGold({ ...save, farm: { ...save.farm, requests: { ...book, pending: 0 } } }, book.pending), gold: book.pending }
}

export function learnTroutGrill<S extends FarmSave>(save: S, fromDiscovery: boolean): S {
  if (!fromDiscovery) return buyRecipe(save, TROUT_GRILL)
  if (!save.today.town || !kitchenBuilt(save)) throw new SaveRuleError('locked', 'The lesson needs a working Kitchen.')
  if (knowsRecipe(save, TROUT_GRILL)) return save
  if (!discovered(save, 'trout')) throw new SaveRuleError('locked', 'Record a Trout discovery first.')
  return { ...save, workshops: { ...save.workshops, recipes: [...save.workshops.recipes, TROUT_GRILL] } }
}
