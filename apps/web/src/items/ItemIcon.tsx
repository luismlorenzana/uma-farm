// Copied from uma-rpg apps/web/src/items/ItemIcon.tsx at 30a322a (F5, FM2), cut to the items and gems sheets: a line or
// made item's icon from uma-art's atlases (P37–P38), drawn pixel-crisp at any size. Gear and its kind badges stay behind.
import gemsUrl from '@luismlorenzana/uma-art/gems/atlas.png?url'
import itemsUrl from '@luismlorenzana/uma-art/items/atlas.png?url'
import { ATLAS_CELL, iconFrame, SHEET_SIZE, type Sheet } from './frames'

const URL: Readonly<Record<Sheet, string>> = { items: itemsUrl, gems: gemsUrl }

export function ItemIcon({ id, size = 32, className = '', label }: { id: string; size?: number; className?: string; label?: string }) {
  const frame = iconFrame(id)
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
    />
  )
}
