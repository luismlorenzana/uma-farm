// Copied from uma-rpg packages/domain/src/work/request.ts at 30a322a, with its Wilds-only parts cut.
// What an Uma is asked to make: one of the four kinds of work, an item, and how many. The shared engine
// (`@luismlorenzana/uma-work`) stores requests as given; the kinds in `kinds-v4/` plan them.
import type { ItemRequest } from '@luismlorenzana/uma-work'
import type { JobKind } from '../economy/jobs'

/** Gather at a gathering place, process at its workbench, craft at a forge, cut at the Lapidary. */
export type FarmWorkRequest = ItemRequest<JobKind>
