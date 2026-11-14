// The opening, "The Overgrown Farm", on day 1 once the farmer is named. Data, never Uma names: the town's cast speaks by
// name, and `{farmer}` is filled at display time. The lines are original and short, one to a tap. The opening ends as
// the opening's Umas come up the road (its last line counts them: `openingScene`); reading it brings them, and each walks
// in with her own arrival scene. The farm has no global chapters: this is the town's welcome, never a plot. Loaded on
// demand with the scene player.
import type { OutfitId } from '../save/v4'
import type { CastId } from './cast'
import type { OpeningSceneId } from './scenes'

/** Who speaks a beat: one of the cast, or the narrator. */
export type Speaker =
  | { readonly kind: 'cast'; readonly id: CastId }
  | { readonly kind: 'narrator' }

export interface Beat {
  readonly speaker: Speaker
  /** One line; `{farmer}` is your name. */
  readonly line: string
}

export interface Scene {
  readonly id: OpeningSceneId
  readonly title: string
  readonly beats: readonly Beat[]
}

const cast = (id: CastId, line: string): Beat => ({ speaker: { kind: 'cast', id }, line })
const narrator = (line: string): Beat => ({ speaker: { kind: 'narrator' }, line })

/** "The Overgrown Farm": the Mayor at the gate welcomes you by name, Old Ben's nine Carrot seeds and the tended row,
 * Marta's shop and the bin, then three Umas come up the road. */
export const OPENING_SCENE: Scene = {
  id: 'scene:1:open',
  title: 'The Overgrown Farm',
  beats: [
    narrator('Morning at the farm gate. The weeds stand as high as the fence.'),
    cast('hollis-pryor', '“Welcome, {farmer}! I’m Hollis Pryor, mayor of the town down the road.”'),
    cast('hollis-pryor', '“This farm has stood empty since Old Ben retired. The whole town hopes you can wake it up.”'),
    cast('ben-carver', '“I kept one block tilled, just in case. Here: nine Carrot seeds to start you off.”'),
    cast('ben-carver', '“A tended row grows faster. Tap a plot, then pick who tends it.”'),
    cast('marta-quill', '“Marta Quill, from the general store at the town edge. The shop is open whenever you need seeds.”'),
    cast('marta-quill', '“And that’s the shipping bin. Anything you put in pays tonight.”'),
    cast('hollis-pryor', '“You’ll want help with all this. I hear some is on its way.”'),
    narrator('Three Umas come up the road.'),
  ],
}

const COUNT_WORDS = ['No', 'An', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
/** The opening's last line for the Umas it brings: "An Uma comes up the road.", "Five Umas come up the road."; none
 * with nobody. */
export function roadLine(count: number): string | null {
  if (count <= 0) return null
  if (count === 1) return 'An Uma comes up the road.'
  return `${COUNT_WORDS[count] ?? count} Umas come up the road.`
}

/** The opening as it plays: its last line for the Umas it brings (`openingOf`, three unless the pack says). */
export function openingScene(opening = 3): Scene {
  const road = roadLine(opening)
  return { ...OPENING_SCENE, beats: [...OPENING_SCENE.beats.slice(0, -1), ...(road ? [narrator(road)] : [])] }
}

/** A beat as it plays: who speaks (a cast member, an Uma by outfit id, or the narrator) and the line, `{name}` still to
 * fill with her name from master data. The ring bench's and the arrival scenes play the same way. */
export interface SceneLine {
  readonly speaker: { readonly kind: 'cast'; readonly id: CastId } | { readonly kind: 'uma'; readonly outfitId: OutfitId } | { readonly kind: 'narrator' }
  readonly line: string
}

/** A scene's lines, as the player shows them. */
export const sceneLines = (scene: Pick<Scene, 'beats'>): SceneLine[] => scene.beats.map((beat) => ({ speaker: beat.speaker, line: beat.line }))
