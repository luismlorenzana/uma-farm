// Copied from uma-rpg packages/domain/src/work/env-v4.ts at 30a322a, with its Wilds-only parts cut.
// The farm's work env: fifteen places of four slots at ×1.25, each one
// line and one kind. Craft EXP and who may work are `env.ts`'s; the trade gate and the open shop are R2's.
import { buildingTable, type WorkEnv } from '@luismlorenzana/uma-work'
import { PLACE_SLOTS_V3, PLACE_SPEED_V3 } from '../economy/professions'
import { PLACES_V4 } from '../economy/places-v4'
import { FARM_WORK_BASE } from './env'
import type { WorkContext } from './env-v3'
import { makeV4 } from './kinds-v4/make'
import { materialKindV4 } from './kinds-v4/material'
import type { FarmWorld } from './world'

/** The fifteen places as buildings, in the Wilds' order (the engine's tie-break order). */
export const FARM_BUILDINGS = buildingTable(Object.fromEntries(PLACES_V4.map((p) => [p.id, { slots: [PLACE_SLOTS_V3], speed: [PLACE_SPEED_V3], upgrades: [] }])))

/** The farm's env, with the caller's context: her trade, for the gate, and the roster, who may work. */
export function farmWorkEnv(context: WorkContext = {}): WorkEnv<FarmWorld> {
  const setup = { ...(context.tradeOf ? { tradeOf: context.tradeOf } : {}), ...(context.roster ? { roster: context.roster } : {}) }
  const roster = context.roster
  return {
    ...FARM_WORK_BASE,
    ...(roster ? { isWorker: (_world: FarmWorld, outfitId: string) => roster.has(outfitId) } : {}),
    kinds: { gather: materialKindV4('gather', setup), refine: materialKindV4('refine', setup), craft: makeV4('craft', setup), cut: makeV4('cut', setup) },
    buildings: FARM_BUILDINGS,
  }
}
