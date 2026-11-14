// Copied from uma-rpg apps/web/src/master/album-art.tsx at 30a322a: the album's kinds mapped to uma-data's art
// families; uma-kit/content owns the authenticated, cached loading. The art comes from the release at runtime only.
// Every id goes through the one resolver (`outfitFor`), so a roster key, her character id, shows her cast
// outfit's art, and so does anyone in town (a sister her own outfit's, one of the town's people hers); a character with
// no outfit shows master data's character face; a cast Uma whose outfit master data doesn't hold (the stand-ins) shows her blank
// profile: the silhouette of an Uma, with her letters.
import type { AlbumArt, UmaArtKind } from '@luismlorenzana/uma-kit/album'
import { AtlasSprite, imagePath, useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ArtIndex, ImageFamily } from '@luismlorenzana/uma-data'
import { BlankProfile, blankTint } from '../dialogue/blank-profile'
import { discLetters, inCast, outfitFor } from '../story/story'
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
  // A character with no outfit of her own (one of the town's people, say): her face from master data's characters.
  const face = view && kind !== 'chibi' && !view.outfits.has(target) && view.names?.has(target)
  return useArtUrl(face ? imagePath(view.art, 'character-faces', target) : albumImagePath(view?.art ?? null, kind, target))
}

/** A disc's colour from her id: the same every time, never from her name. */
const DISC_COLORS = ['#6b5aa6', '#c4573a', '#3a7aa0', '#5f9a3c', '#c08a22', '#8a5a7a', '#4f7a6a', '#a0603a']
const discColor = (id: string): string => DISC_COLORS[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % DISC_COLORS.length]!

/** A cast Uma master data doesn't hold, or a character with no art of her own: her blank profile, the silhouette of an
 * Uma on her colour with her letters (`blank-profile.tsx`). */
export function LetterDisc({ id, size }: { id: string; size: number }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const name = view ? view.album.get(id)?.name ?? view.names?.get(outfitFor(id)) ?? '' : ''
  const character = view?.outfits.get(outfitFor(id))?.characterId ?? id
  return (
    <span aria-hidden className={`mx-auto block overflow-hidden ${size >= 120 ? 'rounded-full' : 'size-full'}`}
      style={size >= 120 ? { width: size, maxWidth: '100%', aspectRatio: '1 / 1' } : undefined}>
      <BlankProfile id={id} letters={discLetters(name)} tint={blankTint(id, view?.colors?.get(character))} background={discColor(id)} />
    </span>
  )
}

function Fallback({ outfitId, size }: { outfitId: string; size: number }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const target = outfitFor(outfitId)
  // A cast Uma master data doesn't hold, or a character with no outfit (one of the town's people, say): her letters.
  if (view && ((inCast(outfitId) && !view.stats.has(outfitId)) || (!view.outfits.has(target) && view.names?.has(target)))) return <LetterDisc id={outfitId} size={size} />
  return <AtlasSprite art={view?.art ?? null} family="outfit-icons" frameKey={outfitFor(outfitId)} size={size} className="max-w-full" />
}
export const ALBUM_ART: AlbumArt = { useUrl, Fallback }
