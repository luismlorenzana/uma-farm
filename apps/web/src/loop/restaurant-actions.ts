import {
  saveDishForMeals, serveTicket, settleRestaurant, startRestaurantShift, touched, type FarmSave, type StockPortions,
} from '@farm/domain'
import { masterReady } from '../master/master'
import { commit, useGame } from '../save/game'
import { storyReady } from '../story/story'
import { talentsFor } from './talents'

async function change(rule: (save: FarmSave) => FarmSave) {
  const save = useGame.getState().save
  if (!save) return
  const next = rule(save)
  if (next !== save) await commit(touched(next, new Date().toISOString()))
}

export async function openRestaurantShift(stage: number, tray: readonly StockPortions[], server: string | null) {
  const [master, story] = await Promise.all([masterReady(), storyReady()])
  await change((save) => startRestaurantShift(save, stage, tray, server, Date.now(), { story, talentOf: talentsFor(master) }))
}

export const plateRestaurantTicket = (started: number, index: number, dish: string) =>
  change((save) => save.workshops.restaurant?.shift?.started === started ? serveTicket(save, index, dish, Date.now()) : save)

export const closeRestaurantShift = (started: number) =>
  change((save) => save.workshops.restaurant?.shift?.started === started ? settleRestaurant(save) : save)

export const putDishInPantry = (key: string) => change((save) => saveDishForMeals(save, key))
