// The farm map's art: a tile drawn in simple shapes (weeds, a stone, a stump, cleared ground, tilled soil, watered
// soil) with its crop's look over it (seeds, a sprout, then the crop's own item icon growing to ripe), a building from
// uma-art's sheet through the kit's art, and the woods' and the pond's edges. No character art. Part of the farm map's
// chunk.
import type { CropLook, Tile } from '@farm/domain'
import { CROPS, cropLook, established } from '@farm/domain'
import { ItemIcon } from '../items/ItemIcon'
import { useBuildingAtlas } from './building-atlas'

/** The ground's colours: grass under what's overgrown, then light earth, tilled soil and watered soil. */
const GRASS = '#86ad63'
const EARTH = '#c9a46c'
const SOIL = '#8a5a32'
const WET = '#5d3b20'

/** A building from uma-art's sheet, `size` points wide, pixel-crisp; a plain roof shape until the sheet loads. */
export function BuildingArt({ frame, size, dim = false }: { frame: string; size: number; dim?: boolean }) {
  const art = useBuildingAtlas()
  const f = art?.index.frames[frame]
  if (!art || !f) {
    return (
      <span aria-hidden className="relative inline-block" style={{ width: size, height: size }}>
        <span className="absolute inset-x-[12%] bottom-[8%] top-[40%] rounded-sm bg-[#d8c7a3]" />
        <span className="absolute inset-x-[4%] top-[14%] h-[34%] bg-[#a8563f]" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
      </span>
    )
  }
  const scale = size / f.w
  return (
    <span aria-hidden className="inline-block shrink-0 bg-no-repeat" data-building={frame} style={{
      width: f.w * scale, height: f.h * scale, imageRendering: 'pixelated', backgroundImage: `url(${art.url})`,
      backgroundSize: `${art.index.width * scale}px ${art.index.height * scale}px`, backgroundPosition: `-${f.x * scale}px -${f.y * scale}px`,
      filter: dim ? 'grayscale(0.85) opacity(0.7)' : undefined,
    }} />
  )
}

/** What covers a tile, drawn in simple shapes. */
function Ground({ tile }: { tile: Tile }) {
  switch (tile.ground) {
    case 'weeds': return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <path d="M5 18l2-7 1 7M10 19l2-9 2 9M16 18l1-6 2 6" fill="none" stroke="#4f7a35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
    case 'stone': return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <ellipse cx="12" cy="14.5" rx="7" ry="5" fill="#9a9a94" />
        <ellipse cx="10.5" cy="12.8" rx="3.4" ry="2" fill="#bdbdb6" />
      </svg>
    )
    case 'stump': return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <rect x="6" y="11" width="12" height="7" rx="1.5" fill="#7a4e2a" />
        <ellipse cx="12" cy="11" rx="6" ry="2.6" fill="#c08a52" />
        <ellipse cx="12" cy="11" rx="3" ry="1.2" fill="none" stroke="#8a5a32" strokeWidth="0.8" />
      </svg>
    )
    case 'tilled': return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <path d="M3 8h18M3 13h18M3 18h18" stroke={tile.watered ? '#3f2814' : '#6b4424'} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
    case 'clear': return null
  }
}

/** A crop's look over its soil: seeds, a sprout, then its own icon, larger as it grows, ringed once ripe. */
function Crop({ crop, look, cell }: { crop: string; look: CropLook; cell: number }) {
  if (look === 'seed') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <circle cx="9" cy="12" r="1.3" fill="#e9d7a7" /><circle cx="13" cy="15" r="1.3" fill="#e9d7a7" /><circle cx="15" cy="10" r="1.3" fill="#e9d7a7" />
      </svg>
    )
  }
  if (look === 'sprout') {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <path d="M12 19v-6" stroke="#3f8a2e" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 14c-3 0-5-2-5-4 3 0 5 1.5 5 4zM12 13c3 0 5-2 5-4.5-3 0-5 1.8-5 4.5z" fill="#5fb043" />
      </svg>
    )
  }
  const size = Math.round(cell * (look === 'growing' ? 0.5 : look === 'nearly' ? 0.66 : 0.8))
  return (
    <span className="absolute inset-0 flex items-center justify-center" data-look={look}>
      {look === 'ripe' && <span aria-hidden className="absolute inset-1 rounded-full bg-[#ffe27a]/45 ring-2 ring-[#f2c230]" />}
      <ItemIcon id={crop} size={size} className={look === 'ripe' ? '' : 'opacity-90 saturate-[0.8]'} />
    </span>
  )
}

/** A field tile: its ground, its crop, a droplet once watered. */
export function TileArt({ tile, cell }: { tile: Tile; cell: number }) {
  const look = cropLook(tile)
  const woody = tile.crop ? CROPS[tile.crop].woody : undefined
  const tree = woody && (established(tile) || look === 'nearly')
  const background = tile.ground === 'tilled' ? (tile.watered ? WET : SOIL) : tile.ground === 'clear' ? EARTH : GRASS
  return (
    <span aria-hidden className="absolute inset-0 overflow-hidden rounded-[3px]" style={{ background }} data-ground={tile.ground}>
      <Ground tile={tile} />
      {tree ? (
        <span className="absolute inset-0 flex items-center justify-center" data-look={look}>
          <ItemIcon id={`orchard-${woody}`} size={Math.round(cell * .85)} />
          {tile.ready && tile.crop && <ItemIcon id={tile.crop} size={Math.round(cell * .5)} className="!absolute right-0 bottom-0 rounded-full bg-[#ffe27a]/60" />}
        </span>
      ) : tile.crop && look && <Crop crop={tile.crop} look={look} cell={cell} />}
      {tile.watered && (
        <svg aria-hidden viewBox="0 0 10 10" className="absolute top-0.5 right-0.5 size-2.5" data-watered>
          <path d="M5 1C5 1 2 5 2 6.5a3 3 0 006 0C8 5 5 1 5 1z" fill="#6ec3f0" />
        </svg>
      )}
    </span>
  )
}

/** A tile at a glance, for the field's sign: its ground's colour, and a dot for a crop (green growing, gold ripe, blue
 * once watered). */
function miniTile(tile: Tile): { ground: string; dot: string | null } {
  const ground = tile.ground === 'tilled' ? (tile.watered ? WET : SOIL) : tile.ground === 'clear' ? EARTH : GRASS
  return { ground, dot: tile.crop === null ? null : tile.ready ? '#f2c230' : tile.watered ? '#6ec3f0' : '#5fb043' }
}

/** The field's sign on the farm map: a wooden board with plot 1 drawn small, tile by tile, `size` points wide, and a
 * page mark for each plot past the first. */
export function FieldSignArt({ tiles, plots, size, columns }: { tiles: readonly Tile[]; plots: number; size: number; columns: number }) {
  const rows = Math.ceil(tiles.length / columns)
  const w = columns + 1
  const h = rows + 1 + (plots > 1 ? 0.9 : 0)
  return (
    <svg aria-hidden viewBox={`-0.5 -0.5 ${w} ${h}`} width={size} height={(size * h) / w} className="shrink-0 drop-shadow-sm" data-field-sign-art>
      <rect x={-0.5} y={-0.5} width={w} height={h} rx={0.45} fill="#8a5a32" />
      <rect x={-0.2} y={-0.2} width={w - 0.6} height={rows + 0.4} rx={0.2} fill="#6b4424" />
      {tiles.map((tile, i) => {
        const { ground, dot } = miniTile(tile)
        const x = (i % columns) + 0.04
        const y = Math.floor(i / columns) + 0.04
        return (
          <g key={i}>
            <rect x={x} y={y} width={0.92} height={0.92} rx={0.12} fill={ground} />
            {dot && <circle cx={x + 0.46} cy={y + 0.46} r={0.27} fill={dot} />}
          </g>
        )
      })}
      {plots > 1 && Array.from({ length: plots }, (_, p) => (
        <circle key={p} cx={w / 2 - 0.5 - ((plots - 1) * 0.7) / 2 + p * 0.7} cy={rows + 0.55} r={0.22} fill={p === 0 ? '#f3e3c3' : '#d9b98a'} />
      ))}
    </svg>
  )
}

/** The woods' edge: trees in rows, darker toward the back. */
export function Trees() {
  return (
    <span aria-hidden className="absolute inset-0 overflow-hidden" style={{
      background: '#4f7d3e',
      backgroundImage: 'radial-gradient(circle at 50% 45%, #2f5d2a 0 34%, transparent 36%), radial-gradient(circle at 50% 45%, #3c6e33 0 30%, transparent 32%)',
      backgroundSize: '28px 30px, 22px 24px', backgroundPosition: '0 0, 11px 13px',
    }} />
  )
}

/** The pond's edge: water with a ripple or two, reeds along the bank. */
export function Water() {
  return (
    <span aria-hidden className="absolute inset-0 overflow-hidden rounded-t-[18px]" style={{
      background: 'linear-gradient(#5aa8d6, #3d86bb)',
      backgroundImage: 'radial-gradient(ellipse 14px 3px at 50% 50%, rgba(255,255,255,0.35) 0 60%, transparent 62%), linear-gradient(#5aa8d6, #3d86bb)',
      backgroundSize: '64px 26px, 100% 100%',
    }} />
  )
}
