// Her illustrations' source: master data's `illustrations` family, each Uma's full-screen scenes by character id (in the
// art's order, each with its title, outfit and moment). Her manifest is read once, the first time a scene of hers cues
// one or her gallery opens, through the content client (`client.illustrations`, checked against the release); each
// full-size picture loads when its scene starts or its artwork is opened. The gallery reads a separate thumbnail.
// Both are verified and cached on the device
// by its hash. An Uma the art index doesn't list has none, known at once with nothing fetched, and her scenes play on her
// bust. No title, path or picture of hers is in git. Loaded with the players and her profile.
import type { Illustrations } from '@luismlorenzana/uma-data'
import type { ArtSource } from '@luismlorenzana/uma-kit/content'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { CONTENT } from '../content/client'
import { masterReady, useMaster } from '../master/master'
import { castArtIdentity, castArtKey } from './art-identity'

/** Where illustrations come from: her manifest by character id (null when she has none), whether master data lists
 * hers at all (known without a fetch: undefined while it can't say), and how a picture's path becomes a URL. */
export interface IllustrationSource {
  illustrationsOf(characterId: string): Promise<Illustrations | null>
  listed?(characterId: string, art: { illustrations?: Record<string, string> } | null | undefined): boolean | undefined
  art: ArtSource
}


/** Master data's family, through the content client: nothing is fetched for an Uma the art index doesn't list. */
const RELEASE: IllustrationSource = {
  async illustrationsOf(characterId) {
    const key = castArtKey(characterId)
    if (!key) return null
    const view = await masterReady()
    const identity = castArtIdentity(characterId, view.outfits)
    if (!identity || !view.art?.illustrations?.[key]) return null
    const client = await CONTENT.release()
    return client.illustrations(view.manifest, view.art, identity.characterId, identity.outfitId)
  },
  listed: (characterId, art) => {
    const key = castArtKey(characterId)
    return art === undefined ? undefined : Boolean(key && art?.illustrations?.[key])
  },
  art: CONTENT,
}

let source: IllustrationSource = RELEASE
const read = new Map<string, Illustrations | null | 'loading'>()
const listeners = new Set<() => void>()
const changed = () => { for (const listener of listeners) listener() }

function load(id: string): void {
  if (read.has(id)) return
  read.set(id, 'loading')
  const from = source
  void from.illustrationsOf(id).catch(() => null).then((found) => {
    if (from !== source) return
    read.set(id, found)
    changed()
  })
}

/** Her illustrations as read: `loading` until they are, null when she has none (at once when master data doesn't list
 * her). */
export function useIllustrationsState(id: string | null): Illustrations | null | 'loading' {
  const master = useMaster()
  const art = master.status === 'ready' ? master.view.art : undefined
  const listed = id ? source.listed?.(id, art) : undefined
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => (id ? (read.has(id) ? read.get(id)! : 'loading') : null),
    () => null,
  )
  useEffect(() => { if (id && listed !== false) load(id) }, [id, listed])
  return listed === false ? null : value
}

/** Her illustrations once read (null while they load, and when she has none). */
export function useIllustrationsOf(id: string | null): Illustrations | null {
  const value = useIllustrationsState(id)
  return value === 'loading' ? null : value
}

/** The pictures' source (the content client, or the tests'). */
export const illustrationArt = (): ArtSource => source.art

/** Reads from another source from now on (the tests' synthetic family), forgetting what was read; none puts master
 * data's back. */
export function setIllustrationSource(next: IllustrationSource | null): void {
  source = next ?? RELEASE
  read.clear()
  changed()
}

/** A picture's URL once loaded (verified and cached by its hash), held while it's in use; `failed` when it can't load
 * (offline and not on the device yet). */
export function usePicture(path: string | null): { url: string | null; failed: boolean } {
  const [state, setState] = useState<{ path: string | null; url: string | null; failed: boolean }>({ path: null, url: null, failed: false })
  useEffect(() => {
    if (!path) return
    const art = source.art
    const release = art.hold(path)
    let live = true
    void art.artUrl(path).then((url) => live && setState({ path, url, failed: false }), () => live && setState({ path, url: null, failed: true }))
    return () => {
      live = false
      release()
    }
  }, [path])
  return state.path === path && path ? { url: state.url, failed: state.failed } : { url: null, failed: false }
}

/** Loads and holds these pictures while a scene plays: its illustrations load as it starts. */
export function usePreloadPictures(paths: readonly string[]): void {
  const key = paths.join('|')
  useEffect(() => {
    if (paths.length === 0) return
    const art = source.art
    const releases = paths.map((path) => art.hold(path))
    for (const path of paths) void art.artUrl(path).catch(() => undefined)
    return () => releases.forEach((release) => release())
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}
