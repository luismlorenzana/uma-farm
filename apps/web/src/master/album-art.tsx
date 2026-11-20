// Copied from uma-rpg apps/web/src/master/album-art.tsx at 30a322a: the album's kinds mapped to uma-data's art
// families; uma-kit/content owns the authenticated, cached loading. The art comes from the release at runtime only.
// Every id goes through the one resolver (`outfitFor`), so a roster key, her character id, shows her cast
// outfit's art, and so does anyone in town (a sister her own outfit's, one of the town's people hers); a character with
// no outfit shows master data's character face. **Her face is her picture** (`dialogue/Avatar.tsx`): cut from her
// portraits in the season's outfit when she has them, so the kit's face tiles get no URL for her and their fallback
// draws it; else master data's face, as before; else her blank profile (the silhouette of an Uma in the season's
// colours, with her letters).
import type { AlbumArt, UmaArtKind } from '@luismlorenzana/uma-kit/album'
import { dateOf, type Season } from '@farm/domain'
import { imagePath, useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ArtIndex, ImageFamily } from '@luismlorenzana/uma-data'
import { lazy, Suspense } from 'react'
import { BlankProfile, blankTint } from '../dialogue/blank-profile'
import { useGame } from '../save/game'
import { discLetters, outfitFor } from '../story/story'
import { useMaster, type MasterView } from './master'

const FAMILY: Record<UmaArtKind, ImageFamily | null> = { face: 'outfit-faces', bust: 'outfit-busts', chibi: 'outfit-chibis', icon: null }
export function albumImagePath(art: ArtIndex | null, kind: UmaArtKind, id: string): string | null {
  const family = FAMILY[kind]
  return family ? imagePath(art, family, kind === 'chibi' ? `${id}-a` : id) : null
}
/** Whether master data's art index lists her portraits (`dialogue-portraits`): then her face is her picture's crop. */
export const hasPortraits = (view: MasterView | null, id: string): boolean => !!view?.art?.dialoguePortraits?.[id]

/** Master data's face for her, through the resolver: her outfit's, else (a character with no outfit of her own, one of
 * the town's people, say) her character's; null when the release has none. */
export function facePath(view: MasterView | null, id: string): string | null {
  if (!view) return null
  const target = outfitFor(id)
  return !view.outfits.has(target) && view.names?.has(target) ? imagePath(view.art, 'character-faces', target) : albumImagePath(view.art, 'face', target)
}

function useUrl(kind: UmaArtKind, id: string) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const target = outfitFor(id)
  // A character with no outfit of her own (one of the town's people, say): her bust from master data's characters.
  const own = view && kind !== 'chibi' && !view.outfits.has(target) && view.names?.has(target)
  // Her face: none while she has portraits (the fallback draws her picture's crop), else master data's.
  return useArtUrl(kind === 'face' ? (hasPortraits(view, id) ? null : facePath(view, id))
    : own ? imagePath(view.art, 'character-faces', target) : albumImagePath(view?.art ?? null, kind, target))
}

/** Today's season, the save's (spring before there is one): every picture wears it. */
export const useSeasonToday = (): Season => useGame((s) => dateOf(Math.max(1, s.save?.calendar.day ?? 1), s.save?.calendar).season)

/** Her blank profile, filling its box: the silhouette of an Uma in the season's outfit on the season's colour, her
 * hair her theme colour's, with her letters (`blank-profile.tsx`): her name's as given, else master data's. Her picture
 * while she has neither portraits nor a face in master data. */
export function BlankPicture({ id, season, name: given }: { id: string; season: Season; name?: string }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const name = given || (view ? view.album.get(id)?.name ?? view.names?.get(outfitFor(id)) ?? view.names?.get(id) ?? '' : '')
  const character = view?.outfits.get(outfitFor(id))?.characterId ?? id
  return <BlankProfile id={id} letters={discLetters(name)} tint={blankTint(id, view?.colors?.get(character))} season={season} />
}

/** Her picture, with the avatar's code: loaded on demand, so it stays out of the start. */
const HerPicture = lazy(() => import('../dialogue/Avatar').then((m) => ({ default: m.HerPicture })))

/** Whatever of hers has no URL (her face with portraits, else a face or a bust while it loads or when master data has
 * none): her picture. */
function Fallback({ outfitId }: { outfitId: string; size: number }) {
  return <Suspense fallback={null}><HerPicture id={outfitId} /></Suspense>
}
export const ALBUM_ART: AlbumArt = { useUrl, Fallback }
