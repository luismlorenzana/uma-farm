// What the Wilds can collect (from uma-rpg apps/web/src/hub/ready.ts at 30a322a, F5): the Collect all pill, the map's
// Ready badges, the menu's counts and the Wilds tab's badge.
import { readyWork, type FarmWorld } from '@farm/domain'

/** Each place with something to collect, and how many of its slots have it. */
export function readySlots(world: FarmWorld | null, now: number): ReadonlyMap<string, number> {
  return world ? readyWork(world, new Date(now).toISOString()) : new Map()
}

/** Slots with something to collect across the Wilds. */
export function readyTotal(world: FarmWorld | null, now: number): number {
  let n = 0
  for (const slots of readySlots(world, now).values()) n += slots
  return n
}
