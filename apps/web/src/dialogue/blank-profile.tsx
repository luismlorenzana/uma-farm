// The blank profile: an Uma's picture while she has neither portraits nor a face in master data (`Avatar.tsx`): her head
// and shoulders in the season's outfit on the season's colour, with her letters, a square like every picture. And her tint, which the blank bust
// (`blank.tsx`) wears too: her hair from her theme colour, else a tone by her id. Small on purpose: the album's fallback
// reads it, so it loads at start. No art, name or colour of anyone's is in git.
import type { Season } from '@farm/domain'
import { SEASON_COLOR } from '../loop/words'

/** Skin, on the blank bust and the blank profile alike. */
export const SKIN = '#f6e3d3'
const INK = '#3a2c2a'

/** Each season's outfit colours, its main cloth and its trim: the blank bust's season outfits, and the blank profile's. */
export const SEASON_CLOTH: Readonly<Record<Season, { main: string; trim: string }>> = {
  spring: { main: '#a7d39a', trim: '#f6b8c6' },
  summer: { main: '#94cbe9', trim: '#ffffff' },
  autumn: { main: '#d48f50', trim: '#9c4a2e' },
  winter: { main: '#4d6191', trim: '#f4f4f4' },
}
/** The blank profile's backdrop: the season's colour (the date chip's), washed light. */
export const seasonBackdrop = (season: Season): string => mix(SEASON_COLOR[season], '#ffffff', 0.55)

// --- Her tint -------------------------------------------------------------------------------------------------------------

/** Her colours on the blank bust: her hair, her ribbon and her eyes. */
export interface BlankTint { hair: string; ribbon: string; eyes: string }

const HEX = /^#[0-9a-f]{6}$/i
const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
/** Two colours mixed, `t` of the second. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)]
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`
}
/** Hair tones for someone with no theme colour, picked by her id: the same every time. */
const HAIR_TONES = ['#8a5a3c', '#3f3330', '#c9a26a', '#b8b6c4', '#7a3b2e', '#5a4636', '#d8c09a', '#2f2d3a']
const RIBBONS = ['#e0567a', '#4f8fd6', '#5fae6e', '#e8a33d', '#9a6ad0', '#d9483b']
const pick = <T,>(list: readonly T[], id: string): T => list[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % list.length]!

/** Her tint: her theme colours (master data's, `#rrggbb`) softened toward a hair tone, else a tone by her id. */
export function blankTint(id: string, colors?: { main: string; sub: string } | null): BlankTint {
  const main = colors && HEX.test(colors.main) ? colors.main : null
  const sub = colors && HEX.test(colors.sub) ? colors.sub : null
  const hair = main ? mix(main, '#5c4a3d', 0.35) : pick(HAIR_TONES, id)
  const ribbon = sub ?? (main ? mix(main, '#ffffff', 0.2) : pick(RIBBONS, id))
  return { hair, ribbon, eyes: mix(sub ?? main ?? ribbon, '#2a2030', 0.35) }
}

/** A colour's lightness, 0–255: dark ink reads on a light one, white on a dark one. */
const lightness = (hex: string): number => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b }

/** Her blank profile: her head and shoulders in the season's outfit on the season's colour, her letters over her
 * shoulders. A square that fills its box. */
export function BlankProfile({ id, letters, tint, season }: { id: string; letters: string; tint: BlankTint; season: Season }) {
  const hairBack = mix(tint.hair, '#000000', 0.18)
  const cloth = SEASON_CLOTH[season]
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="block size-full" aria-hidden data-blank-profile={id} data-disc={id} data-season={season}>
      <rect width="100" height="100" fill={seasonBackdrop(season)} />
      <path d="M50 22C28 22 22 40 23 56C24 70 22 80 26 92H74C78 80 76 70 77 56C78 40 72 22 50 22Z" fill={hairBack} />
      <path d="M34 30L28 6L46 26Z M66 30L72 6L54 26Z" fill={tint.hair} />
      <path d="M8 100C8 84 22 74 38 70H62C78 74 92 84 92 100Z" fill={cloth.main} />
      <path d="M38 70Q50 82 62 70L58 69Q50 76 42 69Z" fill={cloth.trim} />
      <ellipse cx="50" cy="46" rx="20" ry="23" fill={SKIN} />
      <path d="M29 52C27 32 37 24 50 24C63 24 73 32 71 52L68 52C67 46 65 42 64 40Q60 36 57 41Q53 35 50 41Q47 35 43 41Q40 36 36 40C35 42 33 46 32 52Z" fill={tint.hair} />
      <text x="50" y="94" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="20" fill={lightness(cloth.main) > 140 ? INK : '#ffffff'}>{letters}</text>
    </svg>
  )
}
