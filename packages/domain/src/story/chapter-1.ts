// Chapter 1's scenes (F24 decisions 6 and 7; core spec CS42, CS41, CS46): "The Overgrown Farm" on day 1 and "First
// Shipment" the morning after the chapter's goals are met. Data, never Uma names: the town's cast speaks by name, and Umas
// speak only in roles the app fills from master data (your first hands, your newest hand), `{name}` filled at runtime.
// The lines are original and short, one to a tap. Loaded on demand with the scene player.
import type { Temperament } from '../farm/talents'
import type { OutfitId, SaveV3 } from '../save/v3'
import type { CastId } from './cast'
import type { ChapterSceneId } from './scenes'
import type { FarmSave } from '../save/v4'

/** Who speaks a beat: one of the cast, a role an Uma fills at runtime, or the narrator. */
export type Speaker =
  | { readonly kind: 'cast'; readonly id: CastId }
  /** Your first hands (CS41): the start's three, in the order they joined. Her line is her temperament's hello. */
  | { readonly kind: 'first-hand'; readonly index: 0 | 1 | 2 }
  /** Your newest hand (CS41): the chapter's recruit. */
  | { readonly kind: 'newest-hand' }
  | { readonly kind: 'narrator' }

export interface Beat {
  readonly speaker: Speaker
  /** One line; `{name}` is the Uma's name. A first hand's line is her hello (`HELLO_LINES`), so it's left empty here. */
  readonly line: string
}

export interface Scene {
  readonly id: ChapterSceneId
  readonly title: string
  readonly beats: readonly Beat[]
}

const cast = (id: CastId, line: string): Beat => ({ speaker: { kind: 'cast', id }, line })
const narrator = (line: string): Beat => ({ speaker: { kind: 'narrator' }, line })
const hand = (index: 0 | 1 | 2): Beat => ({ speaker: { kind: 'first-hand', index }, line: '' })

/** The hello lines (decision 7): one a temperament (F21's five), `{name}` filled at runtime. */
export const HELLO_LINES: Readonly<Record<Temperament, string>> = {
  breezy: '“Hi, I’m {name}! Point me at the work and I’m off.”',
  steady: '“{name}. I’ll be here every morning, rain or shine.”',
  bold: '“I’m {name}, and this farm is about to wake up.”',
  gritty: '“{name} here. Weeds don’t scare me.”',
  clever: '“Hello, I’m {name}. I’ve counted the plots already: nine.”',
}

/** "The Overgrown Farm" (CS42): the gate, the Mayor, Old Ben's seeds, your first hands, Marta and the bin; then the
 * chapter card. */
export const OPENING_SCENE: Scene = {
  id: 'scene:1:open',
  title: 'The Overgrown Farm',
  beats: [
    narrator('Morning at the farm gate. The weeds stand as high as the fence.'),
    cast('hollis-pryor', '“Welcome! I’m Hollis Pryor, mayor of the town down the road.”'),
    cast('hollis-pryor', '“This farm has stood empty since Old Ben retired. We hope the Umas who spend their off-season here can bring it back.”'),
    cast('ben-carver', '“I kept one block tilled, just in case. Here: nine Carrot seeds to start you off.”'),
    cast('ben-carver', '“A tended row grows faster. Tap a plot, then pick who tends it.”'),
    narrator('Your first hands come in through the Gate.'),
    hand(0),
    hand(1),
    hand(2),
    cast('marta-quill', '“Marta Quill, from the general store at the town edge. The shop is open whenever you need seeds.”'),
    cast('marta-quill', '“And that’s the shipping bin. Anything you put in pays tonight.”'),
    cast('hollis-pryor', '“Here’s what the town hopes to see first.”'),
  ],
}

/** "First Shipment" (CS42): the Mayor and Marta at the bin, Old Ben's plans for the Mill, your newest hand at the Gate,
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

/** Your first hands (CS41): the start's three, the first three on the roster by the day they joined, then by id. */
export function firstHands(save: Pick<FarmSave, 'roster'>): OutfitId[] {
  return Object.entries(save.roster).sort(([a, x], [b, y]) => x.joined - y.joined || Number(a) - Number(b)).slice(0, 3).map(([id]) => id)
}

/** Your newest hand (CS41): the last to join, by day, then the higher id; the chapter's recruit on the closing morning. */
export function newestHand(save: Pick<FarmSave, 'roster'>): OutfitId | null {
  const [newest] = Object.entries(save.roster).sort(([a, x], [b, y]) => y.joined - x.joined || Number(b) - Number(a))
  return newest?.[0] ?? null
}

/** A beat as it plays: who speaks (a cast member, an Uma by outfit id, or the narrator) and the line, `{name}` still to
 * fill with her name from master data. */
export interface SceneLine {
  readonly speaker: { readonly kind: 'cast'; readonly id: CastId } | { readonly kind: 'uma'; readonly outfitId: OutfitId } | { readonly kind: 'narrator' }
  readonly line: string
}

/** A scene's lines on this save: each role filled (a first hand speaks her temperament's hello), a role nobody fills
 * dropped. On v4 (F46 decision 9) the newest hand is named, not read from the roster: chapter 1's authored arrival, or
 * nobody when the cast has none. */
export function sceneLines(scene: Scene, save: Pick<FarmSave, 'roster'>, temperamentOf: (outfitId: OutfitId) => Temperament, newestId?: OutfitId | null): SceneLine[] {
  const hands = firstHands(save)
  const newest = newestId === undefined ? newestHand(save) : newestId
  return scene.beats.flatMap((beat): SceneLine[] => {
    const { speaker } = beat
    if (speaker.kind === 'first-hand') {
      const id = hands[speaker.index]
      return id ? [{ speaker: { kind: 'uma', outfitId: id }, line: HELLO_LINES[temperamentOf(id)] }] : []
    }
    if (speaker.kind === 'newest-hand') return newest ? [{ speaker: { kind: 'uma', outfitId: newest }, line: beat.line }] : []
    return [{ speaker, line: beat.line }]
  })
}
