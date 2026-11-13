// Copied from uma-rpg apps/web/src/items/ItemIcon.tsx at 30a322a, cut to the items sheet: a good's or
// seed's icon from uma-art's atlas, drawn pixel-crisp at any size. Gear and its kind badges stay behind.
import itemsUrl from '@luismlorenzana/uma-art/items/atlas.png?url'
import { seedOf } from '@farm/domain'
import { UiMark } from '@luismlorenzana/uma-kit/ui'
import { ATLAS_CELL, iconFrame, SHEET_SIZE, type Sheet } from './frames'

const URL: Readonly<Record<Sheet, string>> = { items: itemsUrl }

/** A seed's icon is its crop's with uma-art's seed-packet badge in its corner (`farm/seed-packet`),
 * an own seed's with a green dot beside it; without the mark, the corner tag: brown from the shop, green
 * for own seeds. */
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
        <span aria-hidden data-seed-tag={seed.own ? 'own' : 'shop'} className="absolute right-0 bottom-0 flex items-end">
          <UiMark mark="farm/seed-packet" scale={size >= 40 ? 2 : 1} fallback={
            <span className="block rounded-[3px] border border-white/80 shadow-1" style={{ width: tag, height: tag, background: seed.own ? '#4f9a3c' : '#a8743a' }} />
          } />
          {seed.own && <span className="absolute -top-1 -left-1 block size-2 rounded-full bg-[#4f9a3c] ring-1 ring-white/80" />}
        </span>
      )}
    </span>
  )
}
