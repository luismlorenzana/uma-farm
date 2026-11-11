// The story pack's one loader seam (F46 decision 6; RM59): the dark build reads the invented stand-in from `@farm/domain`,
// checked by F40's validator as any pack is (`storyPackFrom`). F56 points this at the private pack (`/api/content/story…`,
// D48). Loaded on demand, with the pack, so neither reaches the initial JS.
import { castEntry, outfitOf, STAND_IN_FILES, storyPackFrom, type StoryPack } from '@farm/domain'
import type { OutfitRowBase } from '@luismlorenzana/uma-kit/roster'
import { setMasterLens, type MasterView } from '../master/master'
import { unknownName } from './story'

/** The pack the game plays: the stand-in, until F56. */
export async function loadStoryPack(): Promise<StoryPack> {
  return storyPackFrom(STAND_IN_FILES)
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

/** Master data seen through the resolver (decision 5): each cast Uma's character id gets her outfit's album row (her
 * name is her character's) and stats, so the screens, the talents and the pickers read v4's roster keys as they read v3's
 * outfit ids. A character master data lacks gets a lettered disc's row and no stats (D talents). */
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
