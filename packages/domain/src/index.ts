// uma-farm's rules: pure, no I/O. F3 brought save v1; F4 the Wilds' rules, copied from uma-rpg at 30a322a (FM2,
// docs/technical/wilds-copy.md), and save v2; F17 the loop's units, goods and save v3 with its migration.
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

// The loop (F17, core spec CS1, CS3, CS32, CS53, CS54): the units, the goods' ids, save v3, its Warehouse by stars and
// the migration from v2. Dark until F24 (D29).
export * from './farm/calendar'
export * from './farm/draw'
export * from './farm/round'
export * from './farm/ranks'
export * from './farm/farm'
export * from './goods/ids'
export * from './save/v3'
export * from './save/parse-v3'
export * from './save/warehouse'
export * from './save/gold'
export * from './save/migrate-v3'

// The day (F18, core spec CS4–CS8): the farm map's places, uma-work on the day clock, End the day's nine steps, the nudge
// and the morning summary. Dark until F24 (D29).
export * from './farm/places'
export * from './work/loop-env'
export * from './save/loop-work'
export * from './night/summary'
export * from './night/nudge'
export * from './night/end-day'

// Goods (F19, core spec CS9, CS10, CS26): the price rule, stars, the bin and the shop. Dark until F24 (D29).
export * from './goods/rule'
export * from './goods/prices'
export * from './goods/stars'
export * from './save/bin'
export * from './save/shop'

// The Fields (F20, core spec CS11, CS12): the crops, the blocks, planting, tending, harvesting, crop levels, growth and
// withering at night, and the shop's seeds. Dark until F24 (D29).
export * from './fields/crops'
export * from './fields/fields'
