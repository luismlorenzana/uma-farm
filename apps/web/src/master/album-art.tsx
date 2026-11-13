// Copied from uma-rpg apps/web/src/master/album-art.tsx at 30a322a: the album's kinds mapped to uma-data's art
// families; uma-kit/content owns the authenticated, cached loading. The art comes from the release at runtime only.
// F46: every id goes through the one resolver (`outfitFor`), so a v4 roster key, her character id, shows her cast
// outfit's art; a cast Uma whose outfit master data doesn't hold (the stand-ins) shows a lettered disc.
import type { AlbumArt, UmaArtKind } from '@luismlorenzana/uma-kit/album'
import { AtlasSprite, imagePath, useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ArtIndex, ImageFamily } from '@luismlorenzana/uma-data'
import { discLetters, inCast, outfitFor } from '../story/story'
import { useMaster } from './master'

const FAMILY: Record<UmaArtKind, ImageFamily | null> = { face: 'outfit-faces', bust: 'outfit-busts', chibi: 'outfit-chibis', icon: null }
export function albumImagePath(art: ArtIndex | null, kind: UmaArtKind, id: string): string | null {
  const family = FAMILY[kind]
  return family ? imagePath(art, family, kind === 'chibi' ? `${id}-a` : id) : null
}
function useUrl(kind: UmaArtKind, id: string) {
  const master = useMaster()
  return useArtUrl(albumImagePath(master.status === 'ready' ? master.view.art : null, kind, outfitFor(id)))
}

/** A disc's colour from her id: the same every time, never from her name. */
const DISC_COLORS = ['#6b5aa6', '#c4573a', '#3a7aa0', '#5f9a3c', '#c08a22', '#8a5a7a', '#4f7a6a', '#a0603a']
const discColor = (id: string): string => DISC_COLORS[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % DISC_COLORS.length]!

/** A cast Uma master data doesn't hold: her letters on a coloured disc. */
export function LetterDisc({ id, size }: { id: string; size: number }) {
  const master = useMaster()
  const name = master.status === 'ready' ? master.view.album.get(id)?.name ?? '' : ''
  return (
    <span aria-hidden className={`font-display mx-auto flex items-center justify-center font-bold text-white ${size >= 120 ? 'rounded-full' : 'size-full'}`}
      style={{ background: discColor(id), fontSize: Math.max(10, size * 0.34), ...(size >= 120 ? { width: size, maxWidth: '100%', aspectRatio: '1 / 1' } : {}) }} data-disc={id}>
      {discLetters(name)}
    </span>
  )
}

function Fallback({ outfitId, size }: { outfitId: string; size: number }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  if (view && inCast(outfitId) && !view.stats.has(outfitId)) return <LetterDisc id={outfitId} size={size} />
  return <AtlasSprite art={view?.art ?? null} family="outfit-icons" frameKey={outfitFor(outfitId)} size={size} className="max-w-full" />
}
export const ALBUM_ART: AlbumArt = { useUrl, Fallback }
