// uma-farm's rules: pure, no I/O. F3 brought save v1; F4 the Wilds' rules, copied from uma-rpg at 30a322a (FM2,
// docs/technical/wilds-copy.md), and save v2.
export const GAME = 'uma-farm' as const

// The lines, their items and the made items (R2, R4).
export * from './items/lines'
export * from './items/made-id'
export * from './items/made'
export * from './items/made-v4'
export * from './items/catalog'
export * from './items/stock-id'
export * from './economy/stock'

// The places, the trades and the pace (R2).
export * from './economy/jobs'
export * from './economy/pacing'
export * from './economy/professions'
export * from './economy/places-v4'
export * from './hub/places'

// Who works (FM6, FM7, R3).
export * from './roster/template'
export * from './roster/roster'

// The work engine's env (FM5).
export * from './work/world'
export * from './work/request'
export * from './work/env'
export * from './work/env-v3'
export * from './work/env-v4'

// The save (R5) and its work (R7), and what finished, for push (F6).
export * from './save/save'
export * from './save/rules'
export * from './save/work'
export * from './save/notify'
