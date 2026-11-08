// Copied from uma-rpg packages/domain/src/work/env.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The farm's side of the shared work engine (SC3, uma-platform P53): Craft Level from every collect, and who may work:
// every outfit (FM6), not only the Umas a world owns.
// uma-rpg's v1 facilities, kinds and upgrades, its Speed Tickets and its Laurels stay behind (FM4): the ticket balance is
// always 0, so the engine refuses every speed-up.
import type { TicketRules, WorkEnv } from '@luismlorenzana/uma-work'
import { grantProfessionExp } from '../economy/pacing'
import { gradeUnlockLevel } from '../items/catalog'
import { isOutfitId } from '../roster/roster'
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
      // Her row comes with her first job; one made before it (an old save) starts at Craft Lv 1.
      const uma = world.umas[outfitId] ?? { craft: { level: 1, exp: 0 } }
      const after = grantProfessionExp(uma.craft, exp)
      return { state: { ...world, umas: { ...world.umas, [outfitId]: { ...uma, craft: after } } }, detail: { levelsUp: after.level - uma.craft.level } satisfies CraftGain }
    },
    gradeOpen: (world, outfitId, _kind, grade) => (world.umas[outfitId]?.craft.level ?? 1) >= gradeUnlockLevel(grade),
  },
  // Every outfit on the release may work (FM6): the roster says who when the caller has it (`env-v4.ts`), and any
  // well-formed outfit id when it hasn't (settles, the API's parse).
  isWorker: (_world, outfitId) => isOutfitId(outfitId),
}
