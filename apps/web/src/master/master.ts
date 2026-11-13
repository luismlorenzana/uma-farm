// Master data: the release's manifest, characters, outfits and art through the API's proxy, cached by hash on the
// device. The farm's view of it is every outfit as a worker (`farmRoster`), the album's neutral rows (names and
// art keys, from the release at runtime only) and each outfit's stats for the loop's talents (read on
// demand, once a release: `loop/talents.ts`). Copied in shape from uma-rpg's `master/master.ts` (30a322a), cut to the sets
// the farm reads.
import { farmRoster, type FarmOutfit, type TalentOutfit } from '@farm/domain'
import type { ArtIndex, Character, Outfit, ReleaseManifest } from '@luismlorenzana/uma-data'
import { outfitRowBase, type OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import { useSyncExternalStore } from 'react'
import { CONTENT } from '../content/client'

export interface MasterView {
  manifest: ReleaseManifest
  /** Every outfit on the release, each with her trade. */
  roster: FarmOutfit[]
  /** The album's rows by outfit id: name, title, rarity, release date, aptitudes and art keys. */
  album: ReadonlyMap<string, OutfitRowBase>
  /** Each outfit's 5★ stats and growth rates, by outfit id: what the loop's talents read. */
  stats: ReadonlyMap<string, TalentOutfit>
  /** Each character's birthday, by character id: the romance's, read at runtime, never in git. */
  birthdays: ReadonlyMap<string, { month: number; day: number }>
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
/** How the romance build sees master data: through the story pack's cast. Null in the deployed build. */
let lens: ((view: MasterView) => MasterView) | null = null

function set(next: MasterState): void {
  state = next
  for (const listener of listeners) listener()
}

/** The ready state for the release, through the lens if one is set. */
const ready = (view: MasterView): MasterState => ({ status: 'ready', view: lens ? lens(view) : view })

/** Sees master data through the story pack's cast from now on: the romance build's loader sets it once the pack
 * loads, and a release already loaded is seen again through it. */
export function setMasterLens(next: (view: MasterView) => MasterView): void {
  lens = next
  if (raw) set(ready(raw))
}

/** The farm's view of a release's sets: only outfits the roster takes, each with her album row. */
export function masterView(manifest: ReleaseManifest, characters: readonly Character[], outfits: readonly Outfit[], art: ArtIndex | null): MasterView {
  const byCharacter = new Map(characters.map((c) => [c.id, c]))
  const roster = farmRoster({ outfits })
  const kept = new Set(roster.map((o) => o.outfitId))
  const ours = outfits.filter((o) => kept.has(String(o.id)))
  const album = new Map(ours.map((o) => [String(o.id), outfitRowBase(o, byCharacter.get(o.characterId))]))
  const birthdays = new Map(characters.map((c) => [String(c.id), { month: c.birthday.month, day: c.birthday.day }]))
  return { manifest, roster, album, stats: new Map(ours.map((o) => [String(o.id), o])), birthdays, art }
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

/** Master data once it has loaded, outside React: the loop's boot waits on it to migrate a v2 save and fill the start.
 *It starts the load if none is under way, and fails as the load does, so the boot gate offers Retry. */
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

/** The roster once it has loaded, else null: for the work actions, which read it outside React (the trade gate). */
export function masterRoster(): readonly FarmOutfit[] | null {
  return state.status === 'ready' ? state.view.roster : null
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
