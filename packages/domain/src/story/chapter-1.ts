// Chapter 1's scenes: "The Overgrown Farm" on day 1, once the farmer is named, and "First Shipment" the morning after
// the chapter's goals are met. Data, never Uma names: the town's cast speaks by name, and an Uma speaks only in a role the
// app fills at runtime (your newest hand, chapter 1's authored arrival), `{name}` and `{farmer}` filled at display time.
// The lines are original and short, one to a tap. The opening ends as the opening's Umas come up the road (its last line
// counts them: `chapterScene`); reading it brings them, and each walks in with her own arrival scene. Loaded on demand
// with the scene player.
import type { OutfitId } from '../save/v4'
import type { CastId } from './cast'
import type { ChapterSceneId } from './scenes'

/** Who speaks a beat: one of the cast, a role an Uma fills at runtime, or the narrator. */
export type Speaker =
  | { readonly kind: 'cast'; readonly id: CastId }
  /** Your newest hand: the chapter's authored arrival. */
  | { readonly kind: 'newest-hand' }
  | { readonly kind: 'narrator' }

export interface Beat {
  readonly speaker: Speaker
  /** One line; `{name}` is the Uma's name and `{farmer}` yours. */
  readonly line: string
}

export interface Scene {
  readonly id: ChapterSceneId
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

/** "First Shipment": the Mayor and Marta at the bin, Old Ben's plans for the Mill, your newest hand at the Gate,
 * and Dale Hart's wagon; then chapter 2's card. */
export const CLOSING_SCENE: Scene = {
  id: 'scene:1:close',
  title: 'First Shipment',
  beats: [
    narrator('Word of the farm’s shipments has reached the town.'),
    cast('hollis-pryor', '“Marta and I couldn’t stay away. The whole town heard about that bin!”'),
    cast('marta-quill', '“Keep it full, and my shelves will follow.”'),
    narrator('Old Ben unrolls a set of plans.'),
    cast('ben-carver', '“A mill. Build it beside the Fields, and your grain comes back as flour.”'),
    narrator('A visitor walks in at the Gate.'),
    { speaker: { kind: 'newest-hand' }, line: '“I’m {name}. I heard this farm is coming back to life. May I stay?”' },
    narrator('A wagon rattles up the road.'),
    cast('hollis-pryor', '“That’ll be Dale Hart, the rancher. He’ll bring you two chickens once there’s a coop to keep them in.”'),
  ],
}

export const SCENES: Readonly<Record<ChapterSceneId, Scene>> = { 'scene:1:open': OPENING_SCENE, 'scene:1:close': CLOSING_SCENE }

const COUNT_WORDS = ['No', 'An', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
/** The opening's last line for the Umas it brings: "An Uma comes up the road.", "Five Umas come up the road."; none
 * with nobody. */
export function roadLine(count: number): string | null {
  if (count <= 0) return null
  if (count === 1) return 'An Uma comes up the road.'
  return `${COUNT_WORDS[count] ?? count} Umas come up the road.`
}

/** A chapter scene as it plays: the opening's last line for the Umas it brings (`openingOf`, three unless the pack says),
 * else the scene as written. */
export function chapterScene(id: ChapterSceneId, opening = 3): Scene {
  if (id !== 'scene:1:open') return SCENES[id]
  const road = roadLine(opening)
  return { ...OPENING_SCENE, beats: [...OPENING_SCENE.beats.slice(0, -1), ...(road ? [narrator(road)] : [])] }
}

/** A beat as it plays: who speaks (a cast member, an Uma by outfit id, or the narrator) and the line, `{name}` still to
 * fill with her name from master data. */
export interface SceneLine {
  readonly speaker: { readonly kind: 'cast'; readonly id: CastId } | { readonly kind: 'uma'; readonly outfitId: OutfitId } | { readonly kind: 'narrator' }
  readonly line: string
}

/** A scene's lines: the newest hand's role filled with `newest` (chapter 1's authored arrival), or dropped when nobody
 * fills it. */
export function sceneLines(scene: Scene, newest: OutfitId | null): SceneLine[] {
  return scene.beats.flatMap((beat): SceneLine[] => {
    const { speaker } = beat
    if (speaker.kind === 'newest-hand') return newest ? [{ speaker: { kind: 'uma', outfitId: newest }, line: beat.line }] : []
    return [{ speaker, line: beat.line }]
  })
}
