// Test-only constructors for the farm's world, in place of uma-rpg's `save/economy-v3.fixture.ts` (`gradedWorld`,
// `gradedUma`), whose graded Umas carry gear and classes the farm doesn't have.
import type { FarmUma, FarmWorld } from './world'

export const ECONOMY_V3_NOW = '2026-10-25T12:00:00.000Z'

export function gradedUma(overrides: Partial<FarmUma> = {}): FarmUma {
  return { craft: { level: 1, exp: 0 }, ...overrides }
}

export function gradedWorld(overrides: Partial<FarmWorld> = {}): FarmWorld {
  return { items: {}, buildings: {}, work: {}, ...overrides, umas: overrides.umas ?? { '101': gradedUma() } }
}
