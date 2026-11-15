// The avatar: an Uma's small face wherever one shows as an avatar (the town's map, who's here, its keepers and People;
// the calendar; her profile, its ties and the Hearts list; the work board; the Dorm; Tonight and the evenings; the
// household; the farm map's houses; a scene's guests; the pair talks; the memories). One component, at uma-kit's
// FaceTile's sizes:
//   - a rounded square (`rounded-avatar`: its corners 18% of its side, at any size), never a circle;
//   - her picture inside it (`HerPicture`), the first of:
//     1. her profile picture in today's season's outfit (uma-platform's 192 px crop of her portrait), drawn whole: her
//        calm face centred and out of the corners, so a badge or a count there sits over her hair, her shoulders or the
//        backdrop;
//     2. for a release made before profiles, the same head and shoulders cut in place from her season's base
//        (`picture.ts`);
//     3. without portraits, master data's face for her, filling the square as uma-kit's FaceTile filled it;
//     4. without that, her blank profile in the season's colours;
//   - four corners for the caller's badges, over the picture's edge and never clipped by it.
// With profiles an avatar loads only her 10 KB crop, never a base; nothing of her portraits loads for an Uma without
// them (the art index says so first); whatever loads is cached on the device by its hash, as a scene's pictures are. uma-kit's own pickers show the same through the album's art (`master/album-art.tsx`). Loaded with the
// lists and the players, as her portraits are.
import type { FaceTileBadges } from '@luismlorenzana/uma-kit/album'
import { useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ReactNode } from 'react'
import { BlankPicture, facePath, useSeasonToday } from '../master/album-art'
import { useMaster } from '../master/master'
import { pictureSource, pictureStyle, type PictureSource } from './picture'
import { portraitArt, usePortraitsState } from './portraits'

/** Her picture, filling a square box: her season's profile picture (or crop of her base) once her portraits are read;
 * without them, master data's face; without that, her blank profile (lettered from `name`, else master data's). Nothing while her portraits are read, so a
 * pilot's picture never flashes another first. */
export function HerPicture({ id, name }: { id: string; name?: string }) {
  const season = useSeasonToday()
  const master = useMaster()
  const portraits = usePortraitsState(id)
  const source = portraits && portraits !== 'loading' ? pictureSource(portraits, season) : null
  const face = portraits === null ? facePath(master.status === 'ready' ? master.view : null, id) : null
  return (
    <span className="relative block aspect-square w-full overflow-hidden"
      data-picture={source ? source.outfit : face ? 'face' : portraits === 'loading' ? 'loading' : 'blank'}>
      {source ? <Cut source={source} /> : face ? <Face path={face} /> : portraits === null && <BlankPicture id={id} season={season} name={name} />}
    </span>
  )
}

/** Master data's face for her (square, as the release draws them), filling the box as uma-kit's FaceTile did; nothing
 * while it loads. */
function Face({ path }: { path: string }) {
  const url = useArtUrl(path)
  return url ? <img src={url} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover object-top select-none" data-picture-cut="face" /> : null
}

/** Her crop: her profile picture shown whole, or her base placed so its frame fills the box. */
function Cut({ source }: { source: PictureSource }) {
  const url = useArtUrl(source.path, portraitArt())
  if (!url) return null
  return source.kind === 'profile'
    ? <img src={url} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover select-none" data-picture-cut="profile" />
    : <img src={url} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={pictureStyle(source)} data-picture-cut="base" />
}

/** An Uma's avatar: her picture in a rounded square up to `size` points wide, with the caller's badges in its corners. */
export function Avatar({ id, size, label, badges, className = '' }: { id: string; size: number; label: string; badges?: FaceTileBadges; className?: string }) {
  const corner = (node: ReactNode, at: string) => (node === undefined ? null : <span className={`pointer-events-none absolute z-10 ${at}`}>{node}</span>)
  return (
    <span className={`relative mx-auto block aspect-square w-full ${className}`} style={{ maxWidth: size }} data-avatar={id}>
      <span role="img" aria-label={label} className="rounded-avatar absolute inset-0 overflow-hidden border border-hairline bg-sunken shadow-1">
        <HerPicture id={id} name={label} />
      </span>
      {corner(badges?.topLeft, 'top-1 left-1')}
      {corner(badges?.topRight, 'top-1 right-1')}
      {corner(badges?.bottomLeft, 'bottom-1 left-1')}
      {corner(badges?.bottomRight, 'right-1 bottom-1')}
    </span>
  )
}
