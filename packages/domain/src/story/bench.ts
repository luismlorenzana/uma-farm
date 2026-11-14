// The ring bench's scene: the morning after your first Romance 8
// event, the town's smith (the Uma who plays the role, `town.json`'s, else master data's) comes up from town and opens
// the old Forge as a ring bench; the Forge's merge game, built later, lights its fire. The lines are original and short,
// one to a tap, and stay in git, with no name in them: hers is master data's, shown as she speaks. They say "you" and
// never gender the farmer. It plays once, as `scene:bench` in `diary.read`. Loaded on demand with its player.
import type { CastId } from './cast'
import { BENCH_SCENE } from './scenes'

/** Who speaks a beat of the town's scene: one of the town's cast, or the narrator. */
export type Speaker =
  | { readonly kind: 'cast'; readonly id: CastId }
  | { readonly kind: 'narrator' }

/** One line of the town's scene, one to a tap; `{farmer}` is your name. */
export interface Beat {
  readonly speaker: Speaker
  readonly line: string
}

const cast = (id: CastId, line: string): Beat => ({ speaker: { kind: 'cast', id }, line })
const narrator = (line: string): Beat => ({ speaker: { kind: 'narrator' }, line })

/** "The Ring Bench": the smith up from town, the old Forge, a bench by the door. */
export const BENCH_SCENE_LINES: { readonly id: typeof BENCH_SCENE; readonly title: string; readonly beats: readonly Beat[] } = {
  id: BENCH_SCENE,
  title: 'The Ring Bench',
  beats: [
    narrator('A cart creaks up from town and stops at the old Forge.'),
    cast('ida-stone', '“I keep the smithy down in town. They told me this Forge was still standing.”'),
    narrator('She runs a hand along the cold hearth, then looks at you.'),
    cast('ida-stone', '“The fire can wait for another year. But a bench by the door, that I can set up today.”'),
    cast('ida-stone', '“Bring three refined goods of one grade, and you’ll make a ring of that grade. Planks, fillets, flour: whatever you have.”'),
    cast('ida-stone', '“One ring a day, and no charge. Word in town is that someone on this farm has your heart.”'),
    narrator('The Forge’s door stays open. A small bench waits inside, by the light.'),
  ],
}
