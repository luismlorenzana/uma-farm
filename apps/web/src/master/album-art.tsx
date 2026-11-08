// Copied from uma-rpg apps/web/src/master/album-art.tsx at 30a322a (F5, FM2): the album's kinds mapped to uma-data's art
// families; uma-kit/content owns the authenticated, cached loading. The art comes from the release at runtime only.
import type { AlbumArt, UmaArtKind } from '@luismlorenzana/uma-kit/album'
import { AtlasSprite, imagePath, useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ArtIndex, ImageFamily } from '@luismlorenzana/uma-data'
import { useMaster } from './master'

const FAMILY: Record<UmaArtKind, ImageFamily | null> = { face: 'outfit-faces', bust: 'outfit-busts', chibi: 'outfit-chibis', icon: null }
export function albumImagePath(art: ArtIndex | null, kind: UmaArtKind, id: string): string | null {
  const family = FAMILY[kind]
  return family ? imagePath(art, family, kind === 'chibi' ? `${id}-a` : id) : null
}
function useUrl(kind: UmaArtKind, id: string) {
  const master = useMaster()
  return useArtUrl(albumImagePath(master.status === 'ready' ? master.view.art : null, kind, id))
}
function Fallback({ outfitId, size }: { outfitId: string; size: number }) {
  const master = useMaster()
  return <AtlasSprite art={master.status === 'ready' ? master.view.art : null} family="outfit-icons" frameKey={outfitId} size={size} className="max-w-full" />
}
export const ALBUM_ART: AlbumArt = { useUrl, Fallback }
