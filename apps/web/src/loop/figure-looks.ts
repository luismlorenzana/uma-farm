// How an Uma looks on the HD-2D stage: her outfit's sprite set from master data's
// `outfit-sprites` by outfit id (her roster key goes through `outfitFor`), loaded only when the stage's
// cap lets it go live, through uma-stage's loader and the release client, so its hash-named files are cached on the device
// (the service worker's cache-first rule for `/api/master/files/`) and download once. With no set (most outfits today), or
// while hers loads, she's a standee: her face from `outfit-faces` on a card, or a plain card when the release has none.
// At work, a live sprite nods now and then: her set's `nod` action. Part of the stage's lazy chunk.
import type { ArtIndex, ReleaseManifest } from '@luismlorenzana/uma-data'
import { decodeImage, loadSpriteSet, type ActorSource } from '@luismlorenzana/uma-stage'
import { CONTENT } from '../content/client'
import { albumImagePath } from '../master/album-art'

/** Her set's key on this release (its hash-named file), or null when her outfit has none: always a standee. */
export const setKey = (art: ArtIndex | null, outfit: string): string | null => art?.sprites?.[outfit] ?? null

/** The action a sprite set plays for the working nod, once, through uma-stage's `emote` (a set without it never nods). */
export const NOD = 'nod'

/** Her set's loader for the stage's cap. `live` is told when it has loaded, so a resting stage draws her. */
export function setLoader(manifest: ReleaseManifest, art: ArtIndex, outfit: string, live: () => void): () => Promise<ActorSource | null> {
  return async () => {
    const client = await CONTENT.release()
    const loaded = await loadSpriteSet(client, manifest, art, Number(outfit), decodeImage)
    live()
    return loaded ? { set: loaded.set, pages: loaded.pages } : null
  }
}

/** Faces by release path: each decoded once a session, and kept as decoded, so Home's next visit has them at once. */
const faces = new Map<string, Promise<HTMLImageElement | null>>()
const decoded = new Map<string, HTMLImageElement | null>()

/** Her face if it's decoded already, else null (a plain card until `faceOf` brings it). */
export function faceNow(art: ArtIndex | null, outfit: string): HTMLImageElement | null {
  const path = albumImagePath(art, 'face', outfit)
  return path ? decoded.get(path) ?? null : null
}

/** Her face for a standee's card, decoded, or null when the release has none or it can't load. */
export function faceOf(art: ArtIndex | null, outfit: string): Promise<HTMLImageElement | null> {
  const path = albumImagePath(art, 'face', outfit)
  if (!path) return Promise.resolve(null)
  let face = faces.get(path)
  if (!face) {
    const release = CONTENT.hold(path)
    face = CONTENT.artUrl(path).then(async (url) => {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    }).catch(() => null).then((img) => {
      decoded.set(path, img)
      return img
    }).finally(release)
    faces.set(path, face)
  }
  return face
}
