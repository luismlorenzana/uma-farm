// What plays as what: an event's play is its route's `play` step (its `game`, and a
// farming play's `as`), else its beat's `together`; `help` and `talk` have no play, so their grade is the best choice's.
// An activity whose game isn't built yet plays Rhythm with that activity's mark, the same grades (the fallback): cooking
// (a pot, the Kitchen's practice mode), serving (a tray), forging (an anvil), the footrace (the track) and an
// expedition (the pack). When a real game ships, the event plays it. Pure.
import type { Activity } from '../../farm/ranks'
import type { DateGame, Play, Together } from '../../story/authored'
import type { PlayKind } from './grade'
import type { RhythmMark } from './rhythm'

/** A play to play: which of the five, Rhythm's mark, and whether it stands in for a game not built yet. */
export interface PlayAs {
  kind: PlayKind
  mark: RhythmMark | null
  fallback: boolean
}

const play = (kind: PlayKind, mark: RhythmMark | null = null, fallback = false): PlayAs => ({ kind, mark, fallback })

/** The table, by `together`'s work activity or date game (a `play` step's `game` reads the same). */
export const PLAY_MAP: Readonly<Record<Activity | DateGame, PlayAs>> = {
  farming: play('pick'),
  foraging: play('pick'),
  fishing: play('cast'),
  mining: play('rhythm', 'swing'),
  ranch: play('rhythm', 'brush'),
  cooking: play('rhythm', 'pot', true),
  serving: play('rhythm', 'tray', true),
  forging: play('rhythm', 'anvil', true),
  expeditions: play('rhythm', 'pack', true),
  walk: play('walk'),
  boat: play('rhythm', 'oar'),
  picnic: play('pick'),
  market: play('pick'),
  stargazing: play('pick'),
  dance: play('rhythm', 'step'),
  crafting: play('rhythm', 'hands'),
  footrace: play('rhythm', 'track', true),
}

/** A `play` step's play: its game's, a farming play's `as` choosing Pick (the default) or Rhythm with the hoe. */
export function playOf(step: Pick<Play, 'game' | 'as'>): PlayAs {
  if (step.game === 'farming' && step.as === 'rhythm') return play('rhythm', 'hoe')
  return PLAY_MAP[step.game]
}

/** A beat's `together` as a play: work and dates by the table, a gift Choose, help and talk none. */
export function togetherPlay(together: Together): PlayAs | null {
  switch (together.kind) {
    case 'work': return PLAY_MAP[together.activity]
    case 'date': return PLAY_MAP[together.game]
    case 'gift': return play('choose')
    case 'help': case 'talk': return null
  }
}
