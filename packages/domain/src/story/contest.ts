// The Cooking Contest's judging: a short scene at the play's end, on the dialogue engine. The town's cook (the Uma who
// plays the role, `town.json`'s, else master data's) tastes the three plates and says a line by your place, then the board
// goes up. The lines are original and short, one to a tap, and stay in git beside the smith's, with no name in them: hers
// is master data's, shown as she speaks; the rivals are their farms, the orchard and the ranch. They say "you" and never
// gender the farmer. It plays every Contest you finish at the stove (one settled as Rough later has no scene). Loaded on
// demand with its player.
import type { ContestPlace } from '../kitchen/contest'
import type { Beat } from './bench'
import type { CastId } from './cast'

const cast = (id: CastId, line: string): Beat => ({ speaker: { kind: 'cast', id }, line })
const narrator = (line: string): Beat => ({ speaker: { kind: 'narrator' }, line })
/** The judge: the town's cook. */
const JUDGE: CastId = 'rosa-bell'

/** "The judging": the plates, her tasting, her words by your place, and the board. */
export const CONTEST_SCENE_LINES: {
  readonly id: 'scene:contest'
  readonly title: string
  readonly opening: readonly Beat[]
  readonly byPlace: Readonly<Record<ContestPlace, readonly Beat[]>>
  readonly closing: readonly Beat[]
} = {
  id: 'scene:contest',
  title: 'The judging',
  opening: [
    narrator('Three covered plates wait on the long table under the lanterns: the orchard’s, the ranch’s and yours.'),
    cast(JUDGE, '“Three farms, three plates. I taste them all the same way: slowly, and with a clean spoon each time.”'),
    narrator('She tries the orchard’s, then the ranch’s, then yours, and sets the spoon down.'),
  ],
  byPlace: {
    1: [
      cast(JUDGE, '“This one. It tastes like it was cooked for the people at home, not for a judge.”'),
      cast(JUDGE, '“First place goes to your farm. Don’t let it go to your head: next year I’ll be hungry again.”'),
    ],
    2: [
      cast(JUDGE, '“Close. Very close. A little more care at the stove and this is the plate I’d remember.”'),
      cast(JUDGE, '“Second place for your farm. Bring me another one next year.”'),
    ],
    3: [
      cast(JUDGE, '“Honest food. I’d be glad of it on any ordinary night.”'),
      cast(JUDGE, '“But today the other two had more to say. Third place for your farm, and keep cooking.”'),
    ],
  },
  closing: [narrator('The board goes up beside the table, the chalk still drying.')],
}

/** The judging's beats for a place: the plates and her tasting, her words, the board going up. */
export const contestBeats = (place: ContestPlace): readonly Beat[] =>
  [...CONTEST_SCENE_LINES.opening, ...CONTEST_SCENE_LINES.byPlace[place], ...CONTEST_SCENE_LINES.closing]
