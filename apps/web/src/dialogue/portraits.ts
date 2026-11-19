// The dialogue engine's art source: master data's `dialogue-portraits` family, each Uma's portraits by character id (a
// base per outfit, with where the face sits on it, and a face per expression). Her manifest is read once, the first time
// she's on a stage, through the content client (`client.dialoguePortraits`, checked against the release); each picture
// then loads by its path, verified and cached on the device by its hash. An Uma the family doesn't hold has none, and her
// bust falls back (`Bust.tsx`). No art, name or path of hers is in git. Loaded with the players.
import { faceFor, type ArtOutfit } from '@farm/domain'
import { dialoguePortraitFor, type DialoguePortraits } from '@luismlorenzana/uma-data'
import type { ArtSource } from '@luismlorenzana/uma-kit/content'
import { useEffect, useSyncExternalStore } from 'react'
import { CONTENT } from '../content/client'
import { masterReady } from '../master/master'
import { castArtIdentity, castArtKey } from './art-identity'

/** Where portraits come from: her manifest by character id (null when she has none), and how a picture's path becomes
 * a URL. */
export interface PortraitSource {
  portraitsOf(characterId: string): Promise<DialoguePortraits | null>
  art: ArtSource
}

/** Master data's family, through the content client: nothing is fetched for an Uma the art index doesn't list. */
const RELEASE: PortraitSource = {
  async portraitsOf(characterId) {
    const key = castArtKey(characterId)
    if (!key) return null
    const view = await masterReady()
    const identity = castArtIdentity(characterId, view.outfits)
    if (!identity || !view.art?.dialoguePortraits?.[key]) return null
    const client = await CONTENT.release()
    return client.dialoguePortraits(view.manifest, view.art, identity.characterId, identity.outfitId)
  },
  art: CONTENT,
}

let source: PortraitSource = RELEASE
/** Each character's portraits as read: `loading` until then, null when she has none. */
const read = new Map<string, DialoguePortraits | null | 'loading'>()
const listeners = new Set<() => void>()
const changed = () => { for (const listener of listeners) listener() }

function load(id: string): void {
  if (read.has(id)) return
  read.set(id, 'loading')
  const from = source
  void from.portraitsOf(id).catch(() => null).then((found) => {
    if (from !== source) return
    read.set(id, found)
    changed()
  })
}

/** Her portraits as read: `loading` until they are (from her first moment on a stage), null when she has none. */
export function usePortraitsState(id: string | null): DialoguePortraits | null | 'loading' {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => (id ? (read.has(id) ? read.get(id)! : 'loading') : null),
    () => null,
  )
  useEffect(() => { if (id) load(id) }, [id])
  return value
}

/** Her portraits once read (null while they load, and when she has none). */
export function usePortraitsOf(id: string | null): DialoguePortraits | null {
  const value = usePortraitsState(id)
  return value === 'loading' ? null : value
}

/** The pictures' source (the content client, or the tests'). */
export const portraitArt = (): ArtSource => source.art

/** Reads from another source from now on (the tests' synthetic family), forgetting what was read; none puts master
 * data's back. */
export function setPortraitSource(next: PortraitSource | null): void {
  source = next ?? RELEASE
  read.clear()
  changed()
}

/** What a line shows of her portraits: the outfit's base (else her first in Farm Life's order: spring), and the face of
 * the line's emote, else its nearest she has by the expressions' fallbacks, else neutral (the base alone). */
export type PortraitPick = ReturnType<typeof dialoguePortraitFor>
export function portraitPick(p: DialoguePortraits, outfit: ArtOutfit, emote: unknown): PortraitPick {
  return dialoguePortraitFor(p, outfit, faceFor(emote, (e) => p.faces[e] !== undefined))
}

/** Warms these pictures (the next line's base and face): loaded, decoded and held while the line before it shows. */
export function usePreload(paths: readonly string[]): void {
  const key = paths.join('|')
  useEffect(() => {
    if (paths.length === 0) return
    const art = source.art
    const releases = paths.map((path) => art.hold(path))
    for (const path of paths) {
      void art.artUrl(path).then((url) => {
        if (typeof Image === 'undefined') return
        const image = new Image()
        image.src = url
        return image.decode?.()
      }).catch(() => undefined)
    }
    return () => releases.forEach((release) => release())
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}
