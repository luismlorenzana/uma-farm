// "The Overgrown Farm", re-cut for save v4: the Mayor at the gate welcomes you by name
// once, Old Ben's nine Carrot seeds and the tended row, Marta's shop and the bin, then the opening's Umas come up the road
// (the pack says how many: three in the stand-in); each walks in with her own arrival scene, the last ending on chapter 1's
// card. No hello lines, no picks. The lines are
// original and stay in git; `{farmer}` is filled at display time. Kept apart from `chapter-1.ts`, whose live opening the
// v3 build and the story sandbox read. Loaded on demand with the scene player.
import type { CastId } from './cast'
import type { Beat, Scene } from './chapter-1'
import { SCENES } from './chapter-1'
import type { ChapterSceneId } from './scenes'

const cast = (id: CastId, line: string): Beat => ({ speaker: { kind: 'cast', id }, line })
const narrator = (line: string): Beat => ({ speaker: { kind: 'narrator' }, line })

export const OPENING_SCENE_V4: Scene = {
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

/** A chapter scene as a save's version plays it: v4's re-cut opening, its last line for the `opening` Umas it brings
 * (three unless the pack says), else chapter 1's. */
export function chapterScene(id: ChapterSceneId, version: number, opening = 3): Scene {
  if (version < 4 || id !== 'scene:1:open') return SCENES[id]
  const road = roadLine(opening)
  return { ...OPENING_SCENE_V4, beats: [...OPENING_SCENE_V4.beats.slice(0, -1), ...(road ? [narrator(road)] : [])] }
}
