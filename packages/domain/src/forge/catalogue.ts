import type { ToolId, ToolTier } from '../save/v4'
import { HEIRLOOM_DAWNS, TOOL_DAWNS, type HeirloomId, type UpgradeTier } from './state'

export const TOOL_NAMES: Record<ToolId, string> = {
  'watering-can': 'Watering Can', hoe: 'Hoe', brush: 'Brush', pick: 'Pick', hammer: 'Hammer', rod: 'Rod', axe: 'Axe',
}
export const TIER_NAMES = ['Basic', 'Fitted', 'Iron', 'Gold', 'Mythril'] as const
export const toolTierName = (tier: ToolTier) => TIER_NAMES[tier - 1]!

export interface ForgeMaterial { id: string; count: number }
interface Recipe { rank: number; gold: number; days: number; materials: readonly ForgeMaterial[] }

export const TOOL_RECIPES: Record<UpgradeTier, Recipe> = {
  2: { rank: 3, gold: 300, days: TOOL_DAWNS[2], materials: [{ id: 'pine-plank', count: 6 }] },
  3: { rank: 4, gold: 1200, days: TOOL_DAWNS[3], materials: [{ id: 'iron-ingot', count: 4 }, { id: 'pine-plank', count: 4 }] },
  4: { rank: 6, gold: 3600, days: TOOL_DAWNS[4], materials: [{ id: 'gold-ingot', count: 6 }, { id: 'iron-ingot', count: 4 }] },
  5: { rank: 8, gold: 9000, days: TOOL_DAWNS[5], materials: [{ id: 'mythril-ingot', count: 8 }, { id: 'gold-ingot', count: 4 }] },
}
interface HeirloomRecipe extends Recipe { name: string; look: 2 | 3 | 4 | 5 }
export const HEIRLOOMS: Record<HeirloomId, HeirloomRecipe> = {
  earrings: { name: 'Diamond Earrings', look: 2, rank: 8, gold: 24000, days: HEIRLOOM_DAWNS.earrings, materials: [
    { id: 'titanium-ingot', count: 16 }, { id: 'cut-diamond', count: 12 }, { id: 'gold-ingot', count: 8 },
  ] },
  necklace: { name: 'Starstone Necklace', look: 3, rank: 8, gold: 40000, days: HEIRLOOM_DAWNS.necklace, materials: [
    { id: 'mythril-ingot', count: 24 }, { id: 'cut-starstone', count: 16 }, { id: 'cut-diamond', count: 12 },
  ] },
  bracelet: { name: 'Orichalcum Bracelet', look: 4, rank: 10, gold: 64000, days: HEIRLOOM_DAWNS.bracelet, materials: [
    { id: 'orichalcum-ingot', count: 32 }, { id: 'cut-philosophers-stone', count: 20 }, { id: 'mythril-ingot', count: 12 }, { id: 'runestone-block', count: 12 },
  ] },
  brooch: { name: 'Philosopher’s Brooch', look: 5, rank: 10, gold: 96000, days: HEIRLOOM_DAWNS.brooch, materials: [
    { id: 'orichalcum-ingot', count: 44 }, { id: 'cut-philosophers-stone', count: 28 }, { id: 'cut-starstone', count: 20 }, { id: 'meteorite-block', count: 16 },
  ] },
}
