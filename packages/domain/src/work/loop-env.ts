// The loop's work env (F18 decisions 1 and 4; core spec CS7, FC6, D25): uma-work on the day clock. Day d starts at
// (d − 1) × DAY_MS (`workNow`) and every work operation runs then, so nothing moves until the night ends the day. The v3
// work places hold four slots each at speed 1 (a day is a day), with no upgrades and no Speed Tickets; who may work is
// who's home on the farm and not leaving tomorrow (F23); work pays no EXP (ranks tick at night, F21); and the kinds are F22's `LOOP_KINDS`, or
// `loopKinds(talentOf)` with master data's talents. uma-work sees the Warehouse through F17's `<id>@<stars>` bridge.
import {
  buildingTable, SPEED_TICKET_MS, type BuildingRules, type ExpRules, type TicketRules, type WorkEnv, type WorkRow, type WorkState,
} from '@luismlorenzana/uma-work'
import { DAY_MS } from '../farm/calendar'
import { LOOP_KINDS } from '../gathering/kinds'
import { LOOP_SLOTS, LOOP_WORK_PLACES, type LoopKinds } from '../save/parse-v3'
import { onFarm, type LoopWorkRequest, type OutfitId, type SaveV3 } from '../save/v3'
import { fromWorkStock, workStock } from '../save/warehouse'
import type { FarmSave } from '../save/v4'

/** uma-work's state over a v3 or v4 save (F46: on v4 a row's `outfitId` is her character id, the roster's key): the Warehouse as the engine's flat `<id>@<stars>` view, no building levels, the work
 * rows, and the save around them for the kinds to read (ranks, well fed, the day, the account). The world's own `items`
 * and `work` are the live ones; `save`'s copies of them are stale while an operation runs. A kind's pay may move the
 * save's `farm` and `diary` (F22: what came home, a catch's record), which `withLoopWorld` keeps. */
export interface LoopWorld extends WorkState<LoopWorkRequest> {
  readonly items: Readonly<Record<string, number>>
  readonly buildings: Readonly<Record<string, { readonly level: number }>>
  readonly work: Readonly<Record<OutfitId, WorkRow<LoopWorkRequest>>>
  readonly save: FarmSave
}

/** The world a save's work runs in. */
export const loopWorld = (save: FarmSave): LoopWorld => ({ items: workStock(save.items), buildings: {}, work: save.work, save })

/** The save with the world's Warehouse and work put back, and what its pays moved in `farm` and `diary` (F22). Nothing
 * else changes, `account.updatedAt` included. */
export const withLoopWorld = <S extends FarmSave>(save: S, world: LoopWorld): S =>
  ({ ...save, items: fromWorkStock(world.items), work: { ...world.work }, farm: world.save.farm, diary: world.save.diary })

/** The v3 work places as uma-work's buildings: four slots at speed 1, no levels above the first. */
export const LOOP_BUILDINGS: BuildingRules = /* @__PURE__ */ buildingTable(Object.fromEntries(LOOP_WORK_PLACES.map((id) => [id, { slots: [LOOP_SLOTS], speed: [1], upgrades: [] }])))

/** No Speed Tickets by day (FM4). */
const NO_TICKETS: TicketRules<LoopWorld> = { balance: () => 0, spend: (state) => state }
/** The night's tickets cost nothing: well fed's quarter day is 12 of them (decision 4). */
const FREE_TICKETS: TicketRules<LoopWorld> = { balance: () => Number.MAX_SAFE_INTEGER, spend: (state) => state }
/** A quarter day in Speed Tickets: 12 × 30 minutes = 21,600,000 ms (decision 4). */
export const WELL_FED_TICKETS = DAY_MS / 4 / SPEED_TICKET_MS

/** Work pays no EXP: ranks come at night (F21). Grades are each kind's own rule. */
const NO_EXP: ExpRules<LoopWorld> = { grant: (state) => ({ state }), gradeOpen: () => true }

/** The loop's env: the kinds' rules from the registry (`LOOP_KINDS` unless the app passes `loopKinds(talentOf)` or a test
 * its own). */
export function farmEnvV3(kinds: LoopKinds = LOOP_KINDS): WorkEnv<LoopWorld> {
  return {
    kinds: Object.fromEntries(Object.entries(kinds).map(([id, kind]) => [id, kind.rules])),
    buildings: LOOP_BUILDINGS,
    tickets: NO_TICKETS,
    exp: NO_EXP,
    isWorker: (world, outfitId) => onFarm(world.save, outfitId),
  }
}

/** The night's env (decision 4): the same, with free tickets for well fed's quarter day. Never used by day. */
export const nightEnvV3 = (kinds: LoopKinds = LOOP_KINDS): WorkEnv<LoopWorld> => ({ ...farmEnvV3(kinds), tickets: FREE_TICKETS })
