// Copied from uma-rpg apps/web/src/items/ItemIcon.tsx at 30a322a (F5, FM2), cut to the items and gems sheets: a line or
// made item's icon from uma-art's atlases (P37–P38), drawn pixel-crisp at any size. Gear and its kind badges stay behind.
import gemsUrl from '@luismlorenzana/uma-art/gems/atlas.png?url'
import itemsUrl from '@luismlorenzana/uma-art/items/atlas.png?url'
import { seedOf } from '@farm/domain'
import { ATLAS_CELL, iconFrame, SHEET_SIZE, type Sheet } from './frames'

const URL: Readonly<Record<Sheet, string>> = { items: itemsUrl, gems: gemsUrl }

/** A seed's icon is its crop's with a corner tag (F20 decision 11) until F25's seed-packet badge: brown from the shop,
 * green for own seeds. */
export function ItemIcon({ id, size = 32, className = '', label }: { id: string; size?: number; className?: string; label?: string }) {
  const frame = iconFrame(id)
  const seed = seedOf(id)
  const tag = Math.max(8, Math.round(size * 0.38))
  const scale = size / ATLAS_CELL
  const sheet = frame ? SHEET_SIZE[frame.sheet] : null
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-item-icon={id}
      className={`relative inline-block shrink-0 bg-no-repeat ${className}`}
      style={{
        width: size, height: size, imageRendering: 'pixelated',
        ...(frame && sheet ? { backgroundImage: `url(${URL[frame.sheet]})`, backgroundSize: `${sheet.w * scale}px ${sheet.h * scale}px`, backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px` } : {}),
      }}
    >
      {seed && (
        <span aria-hidden data-seed-tag={seed.own ? 'own' : 'shop'} className="absolute right-0 bottom-0 rounded-[3px] border border-white/80 shadow-1"
          style={{ width: tag, height: tag, background: seed.own ? '#4f9a3c' : '#a8743a' }} />
      )}
    </span>
  )
}
