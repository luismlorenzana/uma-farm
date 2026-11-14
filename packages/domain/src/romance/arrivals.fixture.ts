// The tests' farm with the cast on it. The opening brings only day 1's helper (`joinFirstHelper`), so a test that needs
// more home joins them here: each in order, home while a bed is free, her ties seeded with those already on the farm
// (the stand-in's 9000001 and 9000002 at 150, 9000001 and 9000003 at 50), as `arrive` joins anyone. By default the
// stand-in's three, or the whole cast when it doesn't hold them. Test support only.
import type { SaveV4 } from '../save/v4'
import { STAND_INS } from '../story/authored.fixture'
import { castEntry, castOrder, type StoryPack } from '../story/pack'
import { arrive } from './arrivals'

/** These (the stand-in's three, else the whole cast), not on the roster yet, join in order. */
export function joinCast(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>, ids?: readonly string[]): SaveV4 {
  const who = ids ?? (STAND_INS.every((id) => castEntry(pack, id)) ? STAND_INS : castOrder(pack))
  return who.reduce((next, id) => (next.roster[id] ? next : arrive(next, id, pack).save), save)
}
