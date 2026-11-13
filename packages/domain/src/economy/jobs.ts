// Copied from uma-rpg packages/domain/src/economy/jobs.ts at 30a322a, with its Wilds-only parts cut.
// The engine's four job kinds The jobs themselves run in the shared engine
// (`save/work.ts`); v1's facilities stay behind.

/** Gathering at a site, refining at the Workbench, crafting gear at the Forge, cutting Star Gems at the Lapidary. */
export type JobKind = 'gather' | 'refine' | 'craft' | 'cut'
