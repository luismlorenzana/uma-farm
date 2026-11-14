// The blank profile: an Uma's small face where master data has none for her (a stand-in, or one master data doesn't
// hold): her head and shoulders on her colour, with her letters. And her tint, which the blank bust (`blank.tsx`) wears
// too: her hair from her theme colour, else a tone by her id. Small on purpose: the album's fallback reads it, so it
// loads at start. No art, name or colour of anyone's is in git.

/** Skin, on the blank bust and the blank profile alike. */
export const SKIN = '#f6e3d3'

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

/** Her blank profile's face: her head and shoulders on her colour, her letters over the shoulders. Fills its box. */
export function BlankProfile({ id, letters, tint, background }: { id: string; letters: string; tint: BlankTint; background: string }) {
  const hairBack = mix(tint.hair, '#000000', 0.18)
  return (
    <svg viewBox="0 0 100 100" className="size-full" role="img" aria-label={letters} data-blank-profile={id} data-disc={id}>
      <rect width="100" height="100" fill={background} />
      <path d="M50 22C28 22 22 40 23 56C24 70 22 80 26 92H74C78 80 76 70 77 56C78 40 72 22 50 22Z" fill={hairBack} />
      <path d="M34 30L28 6L46 26Z M66 30L72 6L54 26Z" fill={tint.hair} />
      <path d="M8 100C8 84 22 74 38 70H62C78 74 92 84 92 100Z" fill={mix(background, '#ffffff', 0.35)} />
      <ellipse cx="50" cy="46" rx="20" ry="23" fill={SKIN} />
      <path d="M29 52C27 32 37 24 50 24C63 24 73 32 71 52L68 52C67 46 65 42 64 40Q60 36 57 41Q53 35 50 41Q47 35 43 41Q40 36 36 40C35 42 33 46 32 52Z" fill={tint.hair} />
      <text x="50" y="94" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="20" fill="#ffffff">{letters}</text>
    </svg>
  )
}
