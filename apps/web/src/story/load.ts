// The story pack's one loader seam: the private pack from farm-api's
// `/api/content/story…` (`delivery.ts`: the index fresh, each file verified by hash and cached, the last index offline).
// The invented stand-in from `@farm/domain` plays whenever farm-api serves no pack at all (a 404 for `story.json`: nothing
// published yet, or no `content/story-release/` on the dev server), so a farm always opens; and in Vitest with
// `VITE_FARM_STORY=stand-in`. Loaded on demand, with the pack, so neither reaches the initial JS.
import { castEntry, outfitOf, STAND_IN_FILES, storyPackFrom, type StoryPack } from '@farm/domain'
import type { OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import { CONTENT } from '../content/client'
import { setMasterLens, type MasterView } from '../master/master'
import { deviceIndexStore, loadReleasedPack } from './delivery'
import { unknownName } from './story'

/** The invented stand-in, read by the game's reader as any pack is: what plays while no pack is published. */
const standIn = async (): Promise<StoryPack> => storyPackFrom(STAND_IN_FILES)

/** The pack the game plays: the release farm-api serves, or the stand-in when it serves none. */
export async function loadStoryPack(): Promise<StoryPack> {
  if (import.meta.env.DEV && import.meta.env.VITE_FARM_STORY === 'stand-in') return standIn()
  return loadReleasedPack(CONTENT, deviceIndexStore(), { missing: standIn })
}

/** An album row for a character master data doesn't hold (the stand-ins): her lettered disc's name, nothing else. */
function unknownRow(id: string): OutfitRowBase {
  const grades = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 'G'])) as Record<K, 'G'>
  return {
    id, name: unknownName(id), title: null, rarity: 3, releasedAt: '',
    aptitudes: { surface: grades(['turf', 'dirt']), distance: grades(['sprint', 'mile', 'medium', 'long']), strategy: grades(['front', 'pace', 'late', 'end']) },
    art: { icon: id, bust: id, face: id, chibi: `${id}-a` },
  }
}

/** Master data seen through the resolver: each cast Uma's character id gets her outfit's album row (her
 * name is her character's) and stats, so the screens, the talents and the pickers read the roster's character ids as
 * outfits. A character master data lacks gets a lettered disc's row and no stats (D talents). */
export function castLens(pack: StoryPack): (view: MasterView) => MasterView {
  return (view) => {
    const album = new Map(view.album)
    const stats = new Map(view.stats)
    for (const { characterId } of pack.cast.umas) {
      const outfit = outfitOf(pack, characterId)
      const row = view.album.get(outfit)
      album.set(characterId, row ? { ...row, id: characterId } : unknownRow(characterId))
      const stat = view.stats.get(outfit)
      if (stat) stats.set(characterId, stat)
    }
    return { ...view, album, stats }
  }
}

/** Turns the pack on: master data's view through the cast, and the resolver the album's art reads. */
export function installStory(pack: StoryPack): (id: string) => string {
  setMasterLens(castLens(pack))
  return (id) => (castEntry(pack, id) ? outfitOf(pack, id) : id)
}
