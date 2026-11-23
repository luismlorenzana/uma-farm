import { availableDishes } from '../expeditions/stock'
import { isDishId, type FarmSave } from '../save/v4'
import { stockKey } from '../save/warehouse'

/** Reserve lots from the stricter orders first, including partial stock on hand. */
export function requestHolds(save: FarmSave, id: string): ReadonlyMap<number, number> {
  const wanted = Object.values(save.farm.requests?.slots ?? {}).filter(order => order.item === id
    && order.status === 'accepted' && (order.due === null || order.due >= save.calendar.day)).sort((a, b) => b.stars - a.stars)
  const holds = new Map<number, number>()
  for (const order of wanted) {
    let left = order.count
    for (let stars = order.stars; left > 0 && stars <= 5; stars++) {
      const held = holds.get(stars) ?? 0
      const stock = isDishId(id) ? availableDishes(save, stockKey(id, stars)) : save.items[id]?.[stars - 1] ?? 0
      const count = Math.min(left, stock - held)
      holds.set(stars, held + count)
      left -= count
    }
  }
  return holds
}
