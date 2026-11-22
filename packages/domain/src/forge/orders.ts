import { bookedForExpedition } from '../expeditions/presence'
import { actionsLeft, MORNING_ACTIONS, spend } from '../farm/actions'
import { farmRankOf } from '../farm/farm'
import { handActionsLeft, handsWorking } from '../farm/farmhands'
import { placeBuilt } from '../farm/places'
import { availableStock } from '../farm/production'
import { goodName } from '../goods/names'
import { spendGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import type { FarmSave, ToolId } from '../save/v4'
import { goodCount, takeGoods } from '../save/warehouse'
import type { SchedulePack } from '../town/town'
import { HEIRLOOMS, TOOL_RECIPES, type ForgeMaterial } from './catalogue'
import { forgeState, heirloomOf, nextToolTier, type HeirloomId, type UpgradeTier } from './state'

export function forgeMaterialRows(save: FarmSave, materials: readonly ForgeMaterial[]) {
  return materials.map(material => ({
    ...material, free: availableStock(save, material.id), held: goodCount(save.items, material.id),
  }))
}

function stockLock(save: FarmSave, recipe: { gold: number; materials: readonly ForgeMaterial[] }, useReserved: boolean): string | null {
  if (actionsLeft(save) === 0) return 'Requires a Morning or Afternoon action.'
  if (save.gold < recipe.gold) return `Need ${(recipe.gold - save.gold).toLocaleString()}g more.`
  const short = forgeMaterialRows(save, recipe.materials).find(row => (useReserved ? row.held : row.free) < row.count)
  return short ? `Need ${short.count - (useReserved ? short.held : short.free)} more ${goodName(short.id)}.` : null
}

export function toolOrderLock(save: FarmSave, tool: ToolId, useReserved = false): string | null {
  if (!placeBuilt(save, 'forge')) return 'Restore the Forge workshop.'
  if (save.forge?.tool) return 'A tool order is in progress.'
  const tier = nextToolTier(save.tools[tool])
  if (!tier) return 'This tool is fully upgraded.'
  const recipe = TOOL_RECIPES[tier]
  return farmRankOf(save.farm.points) < recipe.rank ? `Opens at Farm Rank ${recipe.rank}.` : stockLock(save, recipe, useReserved)
}

export function heirloomLock(save: FarmSave, recipient: string, piece: HeirloomId, artReady: boolean, useReserved = false): string | null {
  if (!placeBuilt(save, 'forge')) return 'Restore the Forge workshop.'
  const recipe = HEIRLOOMS[piece]
  const rank = farmRankOf(save.farm.points)
  if (rank < recipe.rank) return `Opens at Farm Rank ${recipe.rank}.`
  if ((['mine', 'quarry', 'smelter', 'cutter'] as const).some(place => !placeBuilt(save, place))) return 'Build the Mine, Quarry, Smelter and Cutter.'
  if (save.love[recipient]?.stage !== 'spouse') return 'Choose a spouse.'
  if (heirloomOf(save, recipient, piece)) return 'This piece is already in her collection or on order.'
  if (!artReady) return 'Artwork coming.'
  if ((save.forge?.heirlooms.filter(order => !order.ready).length ?? 0) >= (rank === 10 ? 2 : 1)) return 'The heirloom orders are full.'
  return stockLock(save, recipe, useReserved)
}

function pay<S extends FarmSave>(save: S, materials: readonly ForgeMaterial[], gold: number, useAction = true): S {
  let items = save.items
  for (const row of materials) {
    let left = row.count
    for (let stars = 1; stars <= 5 && left > 0; stars++) {
      const take = Math.min(left, items[row.id]?.[stars - 1] ?? 0)
      if (take) items = takeGoods(items, row.id, stars, take)
      left -= take
    }
  }
  const stocked = { ...save, items }
  return spendGold(useAction ? spend(stocked, 'forge') : stocked, gold)
}

export function forgeAssistants(save: FarmSave, story: SchedulePack | null): string[] {
  if (save.today.actions >= MORNING_ACTIONS || save.today.crew || save.today.forgeHelper) return []
  return handsWorking(save, story).filter(id => !bookedForExpedition(save, id) && handActionsLeft(save, id) > 0)
}

function book<S extends FarmSave>(save: S, assistant: string | undefined, tier: UpgradeTier, story: SchedulePack | null): S {
  if (!assistant) return save
  if (!forgeAssistants(save, story).includes(assistant)) throw new SaveRuleError('not-ready', 'Choose an available Morning farmhand.')
  return { ...save, today: { ...save.today, forgeHelper: { id: assistant, tier } } }
}

export function orderTool<S extends FarmSave>(save: S, tool: ToolId, story: SchedulePack | null, assistant?: string, useReserved = false): S {
  const lock = toolOrderLock(save, tool, useReserved)
  const tier = nextToolTier(save.tools[tool])
  if (lock || !tier) throw new SaveRuleError('not-ready', lock ?? 'Choose a tool.')
  const recipe = TOOL_RECIPES[tier]
  const day = save.calendar.day
  const paid = pay(book(save, assistant, tier, story), recipe.materials, recipe.gold)
  return { ...paid, forge: { ...forgeState(save), tool: { tool, tier, ordered: day, due: day + recipe.days, ...(assistant ? { assistant } : {}) } } }
}

export function trackHeirloom<S extends FarmSave>(save: S, recipient: string, piece: HeirloomId): S {
  if (save.love[recipient]?.stage !== 'spouse') throw new SaveRuleError('not-ready', 'Choose a spouse.')
  const { tracked, ...forge } = forgeState(save)
  const same = tracked?.recipient === recipient && tracked.piece === piece
  return { ...save, forge: same ? forge : { ...forge, tracked: { recipient, piece } } }
}

export function orderHeirloom<S extends FarmSave>(save: S, recipient: string, piece: HeirloomId, artReady: boolean, story: SchedulePack | null, assistant?: string, useReserved = false): S {
  const lock = heirloomLock(save, recipient, piece, artReady, useReserved)
  if (lock) throw new SaveRuleError('not-ready', lock)
  const recipe = HEIRLOOMS[piece]
  const paid = pay(book(save, assistant, recipe.rank === 8 ? 4 : 5, story), recipe.materials, recipe.gold)
  const state = forgeState(save)
  const { tracked, ...rest } = state
  const forge = tracked?.recipient === recipient && tracked.piece === piece ? rest : state
  const day = save.calendar.day
  return { ...paid, forge: { ...forge, heirlooms: [...forge.heirlooms, { recipient, piece, ordered: day, due: day + recipe.days, ...(assistant ? { assistant } : {}) }] } }
}

export function giveHeirloom<S extends FarmSave>(save: S, recipient: string, piece: HeirloomId): S {
  const order = heirloomOf(save, recipient, piece)
  if (!save.forge || !order?.ready || order.gifted || save.love[recipient]?.stage !== 'spouse') throw new SaveRuleError('not-ready', 'This gift isn’t ready to give.')
  return { ...save, forge: { ...save.forge, heirlooms: save.forge.heirlooms.map(row => row === order ? { ...row, gifted: save.calendar.day } : row) } }
}

export function practiceForging<S extends FarmSave>(save: S, tier: UpgradeTier, assistant: string, story: SchedulePack | null): S {
  if (!placeBuilt(save, 'forge') || !Object.values(save.tools).some(installed => installed >= tier)) throw new SaveRuleError('locked', 'Install a tool at that tier first.')
  const materials = [{ id: 'pine-plank', count: tier === 2 ? 2 : 1 }, ...(tier === 2 ? [] : [{ id: TOOL_RECIPES[tier].materials[0]!.id, count: 1 }])]
  const lock = stockLock(save, { gold: 0, materials }, false)
  if (lock) throw new SaveRuleError('not-ready', lock)
  return pay(book(save, assistant, tier, story), materials, 0, false)
}

export function beginTempering<S extends FarmSave>(save: S, ordered: number): S {
  const tool = save.forge?.tool
  if (!save.forge || !tool || tool.ordered !== ordered || tool.finish || tool.due <= save.calendar.day) throw new SaveRuleError('not-ready', 'This order has already been finished.')
  return { ...save, forge: { ...save.forge, tool: { ...tool, finish: 'in-progress' } } }
}

export function finishTool<S extends FarmSave>(save: S, ordered: number, stamped: boolean): S {
  const tool = save.forge?.tool
  if (!save.forge || !tool || tool.ordered !== ordered || (stamped && tool.finish !== 'in-progress') || tool.finish === 'standard' || tool.finish === 'stamped' || tool.due <= save.calendar.day) {
    throw new SaveRuleError('not-ready', 'This order has already been finished.')
  }
  return { ...save, forge: { ...save.forge, tool: { ...tool, finish: stamped ? 'stamped' : 'standard' } } }
}

export function deliverForge<S extends FarmSave>(save: S): S {
  if (!save.forge) return save
  const day = save.calendar.day
  const { tool, ...forge } = save.forge
  const heirlooms = forge.heirlooms.map(order => !order.ready && order.due <= day ? { ...order, ready: day } : order)
  if (!tool || tool.due > day) {
    return heirlooms.some((row, index) => row !== forge.heirlooms[index]) ? { ...save, forge: { ...save.forge, heirlooms } } : save
  }
  return {
    ...save, tools: { ...save.tools, [tool.tool]: tool.tier },
    forge: { ...forge, heirlooms, installed: [...forge.installed.filter(order => order.tool !== tool.tool), { ...tool, finish: tool.finish === 'stamped' ? 'stamped' : 'standard' }] },
  }
}
