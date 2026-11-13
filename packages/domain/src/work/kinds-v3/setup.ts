// Copied from uma-rpg packages/domain/src/work/kinds-v3/setup.ts at 30a322a, with its Wilds-only parts cut.
// What the job kinds plan with: the caller's trade resolver and roster, when it has them.
import type { TradeOf } from '../../economy/professions'

export interface KindSetup { tradeOf?: TradeOf; roster?: ReadonlySet<string> }
