// The tests' farm with the cast on it: each in order is met (as introducing yourself meets her) and lives in town; her
// ties are seeded with those already met (the stand-in's 9000001 and 9000002 at 150, 9000001 and 9000003 at 50), as
// `meet` seeds anyone's. By default the stand-in's three, or the whole cast when it doesn't hold them. Test support only.
import type { SaveV4 } from '../save/v4'
import { STAND_INS } from '../story/authored.fixture'
import { castEntry, castOrder, type StoryPack } from '../story/pack'
import { meet } from './meeting'

/** These (the stand-in's three, else the whole cast), not met yet, are met in order. */
export function joinCast(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>, ids?: readonly string[]): SaveV4 {
  const who = ids ?? (STAND_INS.every((id) => castEntry(pack, id)) ? STAND_INS : castOrder(pack))
  return who.reduce((next, id) => (next.roster[id] ? next : meet(next, id, pack).save), save)
}
