// Copied from uma-rpg packages/domain/src/economy/jobs.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// The engine's four job kinds (design §8.6, D55, D144). The jobs themselves run in the shared engine (SC3,
// `save/work.ts`); v1's facilities stay behind.

/** Gathering at a site, refining at the Workbench, crafting gear at the Forge, cutting Star Gems at the Lapidary. */
export type JobKind = 'gather' | 'refine' | 'craft' | 'cut'
export const JOB_KINDS: readonly JobKind[] = ['gather', 'refine', 'craft', 'cut']
