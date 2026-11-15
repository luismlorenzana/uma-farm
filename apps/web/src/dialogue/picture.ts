// Her picture: the small square face an avatar shows (`Avatar.tsx`), from her own portraits in today's season's outfit
// (spring, summer, autumn, winter; spring when that one isn't drawn), her calm face: the base's own, no face laid over
// it. Her season's profile picture (uma-platform's 192 px crop of the base, P180) when the release has it; else, for a
// release made before them, a square cut in place from her season's base. Pure: which picture she shows, and where the
// square sits on a base. Her portraits are master data's `dialogue-portraits` family, read at runtime; no art, name or
// path of hers is in git.
import { ART_NAMES, type Season } from '@farm/domain'
import { dialoguePortraitFor, dialogueProfileFor, type DialoguePortraits } from '@luismlorenzana/uma-data'

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

/** Where her picture comes from: her profile picture, a square shown whole (`profile`, about 10 KB), or a square cut in
 * place from her base (`base`, 300 KB or so, for a release made before profiles). */
export type PictureSource =
  | { kind: 'profile'; outfit: string; path: string }
  | { kind: 'base'; outfit: string; path: string; width: number; height: number; frame: PictureFrame }

/** **The crop's seam:** the one place her picture's source is chosen. Her season's profile picture, else her first in
 * Farm Life's order that has one (`dialogueProfileFor`: spring first), shown whole; with none (a release made before
 * profiles, uma-data 1.9.0's P180), her season's base, cut in place from where its face sits. */
export function pictureSource(p: DialoguePortraits, season: Season): PictureSource {
  const outfit = ART_NAMES[season]
  const profile = dialogueProfileFor(p, outfit)
  if (profile) return { kind: 'profile', outfit: profile.outfit, path: profile.profile.path }
  const { base, outfit: drawn } = dialoguePortraitFor(p, outfit, 'neutral')
  return { kind: 'base', outfit: drawn, path: base.path, width: base.width, height: base.height, frame: pictureFrame(base, p.faceSize) }
}

/** The base's place in a square box showing its frame, in the box's percentages (as uma-kit's atlas frames are drawn). */
export function pictureStyle(source: Extract<PictureSource, { kind: 'base' }>): { left: string; top: string; width: string; height: string } {
  const share = (n: number) => `${(n / source.frame.side) * 100}%`
  return { left: share(-source.frame.left), top: share(-source.frame.top), width: share(source.width), height: share(source.height) }
}
