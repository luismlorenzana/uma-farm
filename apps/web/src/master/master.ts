// Master data: the release's manifest, characters, outfits and art through the API's proxy, cached by hash on the
// device. The farm's view of it is the album's neutral rows of every outfit with a stable id (names and art keys, from
// the release at runtime only), each outfit's stats for the loop's talents (read on demand, once a release:
// `loop/talents.ts`), the characters' birthdays, and each outfit's character and variant (the story's placeholders read
// her default outfit from them, on demand), seen through the story pack's cast once it loads (`setMasterLens`).
// Copied in shape from uma-rpg's `master/master.ts` (30a322a), cut to the sets the farm reads.
import { isRosterId, type TalentOutfit } from '@farm/domain'
import type { ArtIndex, Character, Outfit, ReleaseManifest } from '@luismlorenzana/uma-data'
import { outfitRowBase, type OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import { useSyncExternalStore } from 'react'
import { CONTENT } from '../content/client'

export interface MasterView {
  manifest: ReleaseManifest
  /** The album's rows by outfit id: name, title, rarity, release date, aptitudes and art keys. */
  album: ReadonlyMap<string, OutfitRowBase>
  /** Each outfit's 5★ stats and growth rates, by outfit id: what the loop's talents read. */
  stats: ReadonlyMap<string, TalentOutfit>
  /** Each character's birthday, by character id: the romance's, read at runtime, never in git. */
  birthdays: ReadonlyMap<string, { month: number; day: number }>
  /** Each outfit's character and variant (null for an original outfit), by outfit id: the story's placeholders read her
   * default outfit and her line from them (`story/load.ts`). */
  outfits: ReadonlyMap<string, { characterId: string; variant: string | null }>
  art: ArtIndex | null
}

export type MasterState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; view: MasterView }
  | { status: 'error'; offline: boolean; message: string }

let state: MasterState = { status: 'idle' }
const listeners = new Set<() => void>()
/** The release as loaded, before any lens. */
let raw: MasterView | null = null
/** How the farm sees master data: through the story pack's cast, once it loads. */
let lens: ((view: MasterView) => MasterView) | null = null

function set(next: MasterState): void {
  state = next
  for (const listener of listeners) listener()
}

/** The ready state for the release, through the lens if one is set. */
const ready = (view: MasterView): MasterState => ({ status: 'ready', view: lens ? lens(view) : view })

/** Sees master data through the story pack's cast from now on: the story's loader sets it once the pack loads, and a
 * release already loaded is seen again through it. */
export function setMasterLens(next: (view: MasterView) => MasterView): void {
  lens = next
  if (raw) set(ready(raw))
}

/** The farm's view of a release's sets: every outfit with a stable id, each with her album row. */
export function masterView(manifest: ReleaseManifest, characters: readonly Character[], outfits: readonly Outfit[], art: ArtIndex | null): MasterView {
  const byCharacter = new Map(characters.map((c) => [c.id, c]))
  const ours = outfits.filter((o) => isRosterId(String(o.id)))
  const album = new Map(ours.map((o) => [String(o.id), outfitRowBase(o, byCharacter.get(o.characterId))]))
  const birthdays = new Map(characters.map((c) => [String(c.id), { month: c.birthday.month, day: c.birthday.day }]))
  const kinds = new Map(ours.filter((o) => byCharacter.has(o.characterId)).map((o) => [String(o.id), { characterId: String(o.characterId), variant: o.variant }]))
  return { manifest, album, stats: new Map(ours.map((o) => [String(o.id), o])), birthdays, outfits: kinds, art }
}

function loadMaster(): void {
  if (state.status === 'loading' || state.status === 'ready') return
  set({ status: 'loading' })
  void (async () => {
    try {
      const [client, manifest] = await Promise.all([CONTENT.release(), CONTENT.manifest()])
      const [characters, outfits, art] = await Promise.all([client.set(manifest, 'characters'), client.set(manifest, 'outfits'), client.art(manifest)])
      raw = masterView(manifest, characters, outfits, art)
      set(ready(raw))
    } catch (err) {
      set({ status: 'error', offline: typeof navigator !== 'undefined' && navigator.onLine === false, message: err instanceof Error ? err.message : String(err) })
    }
  })()
}

/** Master data once it has loaded, outside React: the night, the work and the harvests wait on it. It starts the load if
 * none is under way, and fails as the load does, so a caller can offer Try again. */
export function masterReady(): Promise<MasterView> {
  if (state.status === 'error') retryMaster()
  else loadMaster()
  return new Promise((resolve, reject) => {
    const check = (): boolean => {
      if (state.status === 'ready') resolve(state.view)
      else if (state.status === 'error') reject(new Error(state.offline ? 'Connect once to download the game data.' : 'The game data could not be loaded.'))
      else return false
      return true
    }
    if (check()) return
    const listener = () => {
      if (check()) listeners.delete(listener)
    }
    listeners.add(listener)
  })
}

export function useMaster(): MasterState {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )
  if (snapshot.status === 'idle') queueMicrotask(loadMaster)
  return snapshot
}

/** Tries again after a failed load (for example back online). */
export function retryMaster(): void {
  if (state.status !== 'error') return
  CONTENT.refresh()
  set({ status: 'idle' })
  loadMaster()
}
