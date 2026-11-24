import { draw } from '../farm/draw'
import type { FarmSave, ToolId, ToolTier } from '../save/v4'

export const tillCapacity = (tier: ToolTier) => ([1, 2, 2, 3, 4] as const)[tier - 1]!
export const brushCapacity = (tier: ToolTier) => tier
export const hoeQuality = (tier: number) => 0.125 * (tier - 1)
export const hoeSeedsBack = (tier: number) => 0.02 * (tier - 1)
export const BONUS_TOOLS = ['axe', 'rod', 'pick', 'hammer'] as const
export type BonusTool = typeof BONUS_TOOLS[number]

/** Tile IDs are ordered by the assignment. Its caller supplies one plot and only tiles that need water. */
export function waterTargets(indices: readonly number[], tier: ToolTier, skill: number, columns: number): number[] {
  const rows = Math.max(tier - 2, skill >= 6 ? 1 : 0)
  if (rows === 0) return indices.slice(0, tier >= 2 || skill >= 3 ? 2 : 1)
  const selected = new Set([...new Set(indices.map(index => Math.floor(index / columns)))].slice(0, rows))
  return indices.filter(index => selected.has(Math.floor(index / columns)))
}

export function toolEffect(tool: ToolId, tier: ToolTier): string {
  if (tool === 'watering-can') return tier >= 3 ? `Water ${tier - 2} dry ${tier === 3 ? 'row' : 'rows'} per action` : `Water ${tier} dry ${tier === 1 ? 'tile' : 'tiles'} per action`
  if (tool === 'hoe') return `Till ${tillCapacity(tier)} clear ${tier === 1 ? 'tile' : 'tiles'} per action${tier > 1 ? ' · Better harvest quality and seed return' : ''}`
  if (tool === 'brush') return `Care for ${tier} ${tier === 1 ? 'animal' : 'animals'} per action`
  const unit = { axe: 'log', rod: 'catch', pick: 'ore', hammer: 'find' }[tool]
  return tier === 1 ? 'Standard haul' : `Up to ${tier - 1} extra ${unit === 'catch' && tier > 2 ? 'catches' : unit + (tier > 2 && unit !== 'ore' ? 's' : '')} per day`
}

type EquippedSave = Pick<FarmSave, 'tools'> & Partial<Pick<FarmSave, 'forge'>>

export function bestToolTier(save: EquippedSave, tool: ToolId): ToolTier {
  return (save.forge?.rack ?? []).reduce((best, copy) => copy.tool === tool && copy.tier > best ? copy.tier : best, save.tools[tool])
}

export function copyCharges(save: Partial<Pick<FarmSave, 'forge'>> & Pick<FarmSave, 'today'>, index: number) {
  const copy = save.forge?.rack?.[index]
  return copy ? Math.max(0, copy.tier - 1 - (save.today.rackCharges?.[index] ?? 0)) : 0
}

const legacyCharges = (save: Pick<FarmSave, 'tools' | 'today'>, tool: BonusTool) =>
  Math.max(0, save.tools[tool] - 1 - (save.today.toolCharges?.[tool] ?? 0))

export const toolChargesLeft = (save: EquippedSave & Pick<FarmSave, 'today'>, tool: BonusTool) =>
  (save.forge?.rack ?? []).reduce((sum, copy, index) => sum + (copy.tool === tool ? copyCharges(save, index) : 0), legacyCharges(save, tool))

/** One extra item per eligible action. Each copy has its own roll and daily allowance. */
export function takeToolCharge<S extends FarmSave>(save: S, tool: BonusTool, eligible = true, equipped?: number | null) {
  if (!eligible) return { save, roll: null }
  let slot = equipped
  if (slot === undefined) {
    let best = legacyCharges(save, tool) > 0 ? save.tools[tool] : 1
    slot = null
    save.forge?.rack?.forEach((copy, index) => {
      if (copy.tool !== tool || copy.tier <= best || copyCharges(save, index) === 0) return
      best = copy.tier
      slot = index
    })
  }
  if (slot !== null && slot !== undefined) {
    if (save.forge?.rack?.[slot]?.tool !== tool || copyCharges(save, slot) === 0) return { save, roll: null }
    const number = save.today.rackCharges?.[slot] ?? 0
    const next: S = { ...save, today: { ...save.today, rackCharges: { ...save.today.rackCharges, [slot]: number + 1 } } }
    return { save: next, roll: (kind: string) => draw(save.account.uid, save.calendar.day, `rack:${tool}:${slot}:${kind}`, number) }
  }
  if (legacyCharges(save, tool) === 0) return { save, roll: null }
  const number = save.today.toolCharges?.[tool] ?? 0
  const next: S = { ...save, today: { ...save.today, toolCharges: { ...save.today.toolCharges, [tool]: number + 1 } } }
  return { save: next, roll: (kind: string) => draw(save.account.uid, save.calendar.day, `tool:${tool}:${kind}`, number) }
}
