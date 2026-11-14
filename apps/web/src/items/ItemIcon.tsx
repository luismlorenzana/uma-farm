// Copied from uma-rpg apps/web/src/items/ItemIcon.tsx at 30a322a, cut to the items sheet: a good's or
// seed's icon from uma-art's atlas, drawn pixel-crisp at any size. Gear and its kind badges stay behind.
import itemsUrl from '@luismlorenzana/uma-art/items/atlas.png?url'
import { seedOf } from '@farm/domain'
import { UiMark } from '@luismlorenzana/uma-kit/ui'
import { ATLAS_CELL, iconFrame, SHEET_SIZE, type Sheet } from './frames'

const URL: Readonly<Record<Sheet, string>> = { items: itemsUrl }

/** The ranch's eggs and milk, drawn in code until uma-art's items atlas has them: an egg (a duck's pale green), a
 * bottle of milk (a goat's with a green cap). Nothing for any other id without a frame. */
const DRAWN: Readonly<Record<string, { kind: 'egg' | 'bottle'; fill: string; mark: string }>> = {
  egg: { kind: 'egg', fill: '#f4e7c8', mark: '#c9a46c' },
  'duck-egg': { kind: 'egg', fill: '#cfe7dc', mark: '#7fae9c' },
  milk: { kind: 'bottle', fill: '#fbfaf5', mark: '#4f86c6' },
  'goat-milk': { kind: 'bottle', fill: '#fbfaf5', mark: '#5f9a4a' },
}
function DrawnGood({ id, size }: { id: string; size: number }) {
  const look = DRAWN[id]
  if (!look) return null
  return (
    <svg aria-hidden viewBox="0 0 32 32" width={size} height={size} className="absolute inset-0" data-drawn-good={id}>
      {look.kind === 'egg' ? (
        <>
          <ellipse cx="16" cy="18" rx="9" ry="11.5" fill={look.fill} stroke="#5b4325" strokeWidth="1.5" />
          <ellipse cx="12.5" cy="13" rx="2.2" ry="3.2" fill="#ffffff" opacity="0.7" />
          <circle cx="19" cy="22" r="1.2" fill={look.mark} />
          <circle cx="15" cy="25" r="0.9" fill={look.mark} />
        </>
      ) : (
        <>
          <path d="M12 4h8v4l3 4v15a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V12l3-4z" fill={look.fill} stroke="#5b4325" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="11.5" y="2.5" width="9" height="4" rx="1" fill={look.mark} stroke="#5b4325" strokeWidth="1.2" />
          <rect x="11" y="16" width="10" height="7" rx="1" fill={look.mark} opacity="0.85" />
        </>
      )}
    </svg>
  )
}

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
      {!frame && <DrawnGood id={id} size={size} />}
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
