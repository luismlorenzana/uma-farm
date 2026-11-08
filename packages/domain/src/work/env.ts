// Copied from uma-rpg packages/domain/src/work/env.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The farm's side of the shared work engine (SC3, uma-platform P53): Craft Level from every collect, and who may work.
// uma-rpg's v1 facilities, kinds and upgrades, its Speed Tickets and its Laurels stay behind (FM4): the ticket balance is
// always 0, so the engine refuses every speed-up.
import type { TicketRules, WorkEnv } from '@luismlorenzana/uma-work'
import { grantProfessionExp } from '../economy/pacing'
import { gradeUnlockLevel } from '../items/catalog'
import type { FarmWorld } from './world'

/** What a collect's Craft EXP did. */
export interface CraftGain { levelsUp: number }

/** No Speed Tickets (FM4): none to spend, ever. */
export const NO_TICKETS: TicketRules<FarmWorld> = {
  balance: () => 0,
  spend: (world) => world,
}

/** Everything but the kinds and the buildings, which `env-v4.ts` adds. */
export const FARM_WORK_BASE: Omit<WorkEnv<FarmWorld>, 'kinds' | 'buildings'> = {
  tickets: NO_TICKETS,
  exp: {
    grant(world, outfitId, exp) {
      const uma = world.umas[outfitId]
      if (!uma) return { state: world, detail: { levelsUp: 0 } satisfies CraftGain }
      const after = grantProfessionExp(uma.craft, exp)
      return { state: { ...world, umas: { ...world.umas, [outfitId]: { ...uma, craft: after } } }, detail: { levelsUp: after.level - uma.craft.level } satisfies CraftGain }
    },
    gradeOpen: (world, outfitId, _kind, grade) => (world.umas[outfitId]?.craft.level ?? 1) >= gradeUnlockLevel(grade),
  },
  isWorker: (world, outfitId) => world.umas[outfitId] !== undefined,
}
