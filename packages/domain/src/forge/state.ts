import type { FarmSave, ToolId, ToolTier } from '../save/v4'
import { ANNIVERSARY_LOOK_POINTS, unlockedLooks, visitLookKind } from '../save/long-game'

export type UpgradeTier = Exclude<ToolTier, 1>
export const HEIRLOOM_IDS = ['earrings', 'necklace', 'bracelet', 'brooch'] as const
export type HeirloomId = typeof HEIRLOOM_IDS[number]
export const TOOL_DAWNS = { 2: 1, 3: 1, 4: 2, 5: 2 } as const
export const HEIRLOOM_DAWNS: Record<HeirloomId, number> = { earrings: 2, necklace: 3, bracelet: 4, brooch: 5 }
export interface ToolOrder {
  tool: ToolId
  tier: UpgradeTier
  fromTier?: Exclude<ToolTier, 5>
  ordered: number
  due: number
  assistant?: string
  finish?: 'in-progress' | 'standard' | 'stamped'
}

export interface HeirloomOrder {
  recipient: string
  piece: HeirloomId
  ordered: number
  due: number
  ready?: number
  gifted?: number
  assistant?: string
}

export interface ForgeState {
  bench: boolean
  ringOrder?: { grade: number; due: number }
  legacyLooks: Record<string, number[]>
  tool?: ToolOrder
  installed: ToolOrder[]
  rack?: ToolOrder[]
  rackGoal?: { tool: ToolId; fromTier: Exclude<ToolTier, 5> }
  crewGoal?: string
  heirlooms: HeirloomOrder[]
  tracked?: { recipient: string; piece: HeirloomId }
}

export function releaseCrewGoal(forge: ForgeState, key: string): ForgeState {
  if (forge.crewGoal !== key) return forge
  const next = { ...forge }
  delete next.crewGoal
  return next
}

export const benchOpen = (save: Pick<FarmSave, 'buildings' | 'forge'>): boolean => save.forge?.bench ?? save.buildings.forge !== undefined

export function forgeState(save: Pick<FarmSave, 'forge' | 'buildings' | 'love' | 'longGame'>): ForgeState {
  if (save.forge) return save.forge
  const legacyLooks: ForgeState['legacyLooks'] = {}
  for (const [id, heart] of Object.entries(save.longGame?.love ?? {})) {
    if (save.love[id]?.stage !== 'spouse') continue
    const slots = new Set(Array.from({ length: unlockedLooks(heart.points, 'anniversary') - 1 }, (_, i) => i + 2))
    for (const visit of heart.memories) {
      const index = visit.who.indexOf(id)
      const slot = visit.looks[index]
      if (slot && slot > 1 && visitLookKind(visit, index) === 'anniversary') slots.add(slot)
    }
    if (slots.size) legacyLooks[id] = [...slots].sort((a, b) => a - b)
  }
  return { bench: save.buildings.forge !== undefined, legacyLooks, installed: [], heirlooms: [] }
}

export function activateForge<S extends FarmSave>(save: S): S {
  return save.forge ? save : { ...save, forge: forgeState(save) }
}

export const nextToolTier = (tier: ToolTier): UpgradeTier | null => tier >= 5 ? null : (tier + 1) as UpgradeTier
export const heirloomOf = (save: Pick<FarmSave, 'forge'>, id: string, piece: HeirloomId) =>
  save.forge?.heirlooms.find(order => order.recipient === id && order.piece === piece)

export function formalLooks(save: Pick<FarmSave, 'forge' | 'longGame'>, id: string): number[] {
  const points = save.longGame?.love[id]?.points ?? 0
  if (!save.forge) return Array.from({ length: unlockedLooks(points, 'anniversary') }, (_, i) => i + 1)
  const legacy = save.forge.legacyLooks[id] ?? []
  return [1, ...HEIRLOOM_IDS.flatMap((piece, index) => {
    const look = index + 2
    return legacy.includes(look) || (heirloomOf(save, id, piece)?.gifted && points >= ANNIVERSARY_LOOK_POINTS[look - 1]!) ? [look] : []
  })]
}
