// Copied from uma-rpg packages/domain/src/work/kinds-v3/setup.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// What the job kinds plan with (H77): the caller's trade resolver, when it has one.
import type { TradeOf } from '../../economy/professions'

export interface KindSetup { tradeOf?: TradeOf }
