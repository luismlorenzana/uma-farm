// The avatar: an Uma's small face wherever one shows as an avatar (the town's map, who's here, its keepers and People;
// the calendar; her profile, its ties and the Hearts list; the work board; the Dorm; Tonight and the evenings; the
// household; the farm map's houses; a scene's guests; the pair talks; the memories). One component, at uma-kit's
// FaceTile's sizes:
//   - a rounded square (`rounded-avatar`: its corners 18% of its side, at any size), never a circle;
//   - her picture inside it (`HerPicture`): a head-and-shoulders square cut from her portrait in today's season's outfit,
//     her calm face centred with a margin (`picture.ts`), so a badge or a count in a corner sits over her hair, her
//     shoulders or the backdrop; while she has no portraits, her blank profile in the season's colours;
//   - four corners for the caller's badges, over the picture's edge and never clipped by it.
// Nothing loads for an Uma without portraits (the art index says so first), and a base loads once, cached on the device
// as a scene's are. uma-kit's own pickers draw the same picture through the album's art (`master/album-art.tsx`).
// Loaded with the lists and the players, as her portraits are.
import type { FaceTileBadges } from '@luismlorenzana/uma-kit/album'
import { useArtUrl } from '@luismlorenzana/uma-kit/content'
import type { ReactNode } from 'react'
import { BlankPicture, useSeasonToday } from '../master/album-art'
import { pictureSource, pictureStyle, type PictureSource } from './picture'
import { portraitArt, usePortraitsState } from './portraits'

/** Her picture, filling a square box: her season's crop once her portraits are read, else her blank profile (lettered
 * from `name`, else master data's); nothing while they're read, so a pilot's picture never flashes blank. */
export function HerPicture({ id, name }: { id: string; name?: string }) {
  const season = useSeasonToday()
  const portraits = usePortraitsState(id)
  const source = portraits && portraits !== 'loading' ? pictureSource(portraits, season) : null
  return (
    <span className="relative block aspect-square w-full overflow-hidden" data-picture={source ? source.outfit : portraits === 'loading' ? 'loading' : 'blank'}>
      {source ? <Cut source={source} /> : portraits === null && <BlankPicture id={id} season={season} name={name} />}
    </span>
  )
}

/** Her crop: a square picture shown whole, or her base placed so its frame fills the box. */
function Cut({ source }: { source: PictureSource }) {
  const url = useArtUrl(source.path, portraitArt())
  if (!url) return null
  return source.kind === 'square'
    ? <img src={url} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover select-none" data-picture-cut="square" />
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
