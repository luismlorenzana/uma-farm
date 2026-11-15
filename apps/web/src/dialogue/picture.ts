// Her picture: the small square face an avatar shows (`Avatar.tsx`), cut from her own portraits in today's season's
// outfit (spring, summer, autumn, winter; spring when that base isn't drawn), her calm face: the base's own, no face
// laid over it. Pure: which picture she shows, and where the square sits on it. Her portraits are master data's
// `dialogue-portraits` family, read at runtime; no art, name or path of hers is in git.
import { ART_NAMES, type Season } from '@farm/domain'
import { dialoguePortraitFor, type DialoguePortraits } from '@luismlorenzana/uma-data'

/** The square's side, in her face's widths: her head and shoulders, her face big enough to read at 22 pt, and centred,
 * so a badge or a count in a corner sits over her hair, her ears, her shoulders or the backdrop. */
export const PICTURE_SPAN = 1.6
/** Where her face's middle sits down the square: a little above its middle, for her shoulders under it. */
export const PICTURE_FACE_AT = 0.46

/** The square cut from a base, in the base's pixels. */
export interface PictureFrame { left: number; top: number; side: number }

const clamp = (n: number, low: number, high: number) => Math.min(Math.max(n, low), high)

/** Her head and shoulders on a base: a square `PICTURE_SPAN` faces wide (never wider than the base), her face centred
 * across it and `PICTURE_FACE_AT` down it, kept inside the base. */
export function pictureFrame(base: { width: number; height: number; face: { left: number; top: number } }, face: { width: number; height: number }): PictureFrame {
  const side = Math.min(Math.round(face.width * PICTURE_SPAN), base.width, base.height)
  const middle = { x: base.face.left + face.width / 2, y: base.face.top + face.height / 2 }
  return {
    left: Math.round(clamp(middle.x - side / 2, 0, base.width - side)),
    top: Math.round(clamp(middle.y - side * PICTURE_FACE_AT, 0, base.height - side)),
    side,
  }
}

/** Where her picture comes from: a square cut in place from her season's base (`base`, today's only source), or a
 * square picture shown whole (`square`, for the small crops uma-platform is asked to publish). */
export type PictureSource =
  | { kind: 'base'; outfit: string; path: string; width: number; height: number; frame: PictureFrame }
  | { kind: 'square'; outfit: string; path: string }

/** **The crop's seam:** the one place her picture's source is chosen. Master data's `dialogue-portraits` (uma-data
 * 1.8.0) has no small crops yet, so it's her season's base, cut in place from where its face sits. When uma-platform
 * publishes the crops (asked: about 192 px a base), this returns `square` from them, and every avatar reads those. */
export function pictureSource(p: DialoguePortraits, season: Season): PictureSource {
  const { base, outfit } = dialoguePortraitFor(p, ART_NAMES[season], 'neutral')
  return { kind: 'base', outfit, path: base.path, width: base.width, height: base.height, frame: pictureFrame(base, p.faceSize) }
}

/** The base's place in a square box showing its frame, in the box's percentages (as uma-kit's atlas frames are drawn). */
export function pictureStyle(source: Extract<PictureSource, { kind: 'base' }>): { left: string; top: string; width: string; height: string } {
  const share = (n: number) => `${(n / source.frame.side) * 100}%`
  return { left: share(-source.frame.left), top: share(-source.frame.top), width: share(source.width), height: share(source.height) }
}
