// Copied from uma-rpg apps/web/src/master/album-art.tsx at 30a322a: the album's kinds mapped to uma-data's art
// families; uma-kit/content owns the authenticated, cached loading. The art comes from the release at runtime only.
// Every id goes through the one resolver (`outfitFor`), so a roster key, her character id, shows her cast
// outfit's art, and so does anyone in town (a sister her own outfit's, one of the town's people hers); a character with
// no outfit shows master data's character bust. **Her face is her picture** (`dialogue/Avatar.tsx`), never master data's
// face: the kit's face tiles get no URL, and their fallback draws her picture, cut from her portraits in the season's
// outfit, else her blank profile (the silhouette of an Uma in the season's colours, with her letters).
import type { AlbumArt, UmaArtKind } from '@luismlorenzana/uma-kit/album'
import { dateOf, type Season } from '@farm/domain'
import { imagePath, useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ArtIndex, ImageFamily } from '@luismlorenzana/uma-data'
import { lazy, Suspense } from 'react'
import { BlankProfile, blankTint } from '../dialogue/blank-profile'
import { useGame } from '../save/game'
import { discLetters, outfitFor } from '../story/story'
import { useMaster } from './master'

const FAMILY: Record<UmaArtKind, ImageFamily | null> = { face: 'outfit-faces', bust: 'outfit-busts', chibi: 'outfit-chibis', icon: null }
export function albumImagePath(art: ArtIndex | null, kind: UmaArtKind, id: string): string | null {
  const family = FAMILY[kind]
  return family ? imagePath(art, family, kind === 'chibi' ? `${id}-a` : id) : null
}
function useUrl(kind: UmaArtKind, id: string) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const target = outfitFor(id)
  // A character with no outfit of her own (one of the town's people, say): her bust from master data's characters.
  const face = view && kind !== 'chibi' && !view.outfits.has(target) && view.names?.has(target)
  // Her face is her picture, the fallback's: no URL for it.
  return useArtUrl(kind === 'face' ? null : face ? imagePath(view.art, 'character-faces', target) : albumImagePath(view?.art ?? null, kind, target))
}

/** Today's season, the save's (spring before there is one): every picture wears it. */
export const useSeasonToday = (): Season => useGame((s) => dateOf(Math.max(1, s.save?.calendar.day ?? 1)).season)

/** Her blank profile, filling its box: the silhouette of an Uma in the season's outfit on the season's colour, her
 * hair her theme colour's, with her letters (`blank-profile.tsx`): her name's as given, else master data's. Her picture
 * while she has no portraits. */
export function BlankPicture({ id, season, name: given }: { id: string; season: Season; name?: string }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const name = given || (view ? view.album.get(id)?.name ?? view.names?.get(outfitFor(id)) ?? view.names?.get(id) ?? '' : '')
  const character = view?.outfits.get(outfitFor(id))?.characterId ?? id
  return <BlankProfile id={id} letters={discLetters(name)} tint={blankTint(id, view?.colors?.get(character))} season={season} />
}

/** Her picture, with the avatar's code: loaded on demand, so it stays out of the start. */
const HerPicture = lazy(() => import('../dialogue/Avatar').then((m) => ({ default: m.HerPicture })))

/** Whatever of hers has no URL: her face always (her picture), and a bust while it loads or when master data has none. */
function Fallback({ outfitId }: { outfitId: string; size: number }) {
  return <Suspense fallback={null}><HerPicture id={outfitId} /></Suspense>
}
export const ALBUM_ART: AlbumArt = { useUrl, Fallback }
