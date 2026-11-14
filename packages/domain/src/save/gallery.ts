// Her gallery in the save: the ids of her illustrations seen, by character, each kept for good (`save.gallery`). The
// pictures and titles are master data's, read at runtime (`story/illustrations.ts` for the scenes). Small on purpose: the
// save's parse reads it at boot. Pure.
import type { CharacterId, SaveV4 } from './v4'

/** A scene's id as master data names it (and a moment's): lowercase words joined by `-`, at most 64 characters. */
export const ILLUSTRATION_ID = /^(?=.{1,64}$)[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/** The most scenes a gallery keeps for one Uma: well past her nine. */
export const GALLERY_MAX = 64

/** Her gallery: the scene ids you've seen, in the order first seen. */
export const galleryOf = (save: Pick<SaveV4, 'gallery'>, id: CharacterId): readonly string[] => save.gallery[id] ?? []

/** The save with her scene seen: it joins her gallery for good. Unchanged when it's in already, she isn't on the roster,
 * the id isn't a scene's or her gallery is full. Never stamps: the app's action does. */
export function seeIllustration<S extends Pick<SaveV4, 'gallery' | 'roster'>>(save: S, id: CharacterId, scene: string): S {
  const seen = save.gallery[id] ?? []
  if (!save.roster[id] || !ILLUSTRATION_ID.test(scene) || seen.includes(scene) || seen.length >= GALLERY_MAX) return save
  return { ...save, gallery: { ...save.gallery, [id]: [...seen, scene] } }
}
