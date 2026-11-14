// The blank bust: every Uma's bust until her portraits are drawn, in code, so it needs no release. A soft silhouette of
// an Uma (her ears, her hair, her shoulders) in each outfit's colours, her hair tinted by her theme colour from master
// data (else one of a few hair tones, by her id), and a simple face for each of the 22 expressions. It composes as her
// portraits do (`Bust.tsx`'s `Portrait`): a base per outfit the size of a portrait (525 × 700), and a face per
// expression (224 × 224) laid over it at the base's face position, swapped line by line with the same fade. The blank
// profile (a list's or a card's small face) is the same head and shoulders on her colour, with her letters. No art,
// name or colour of anyone's is in git. Loaded with the players and the album's fallback.
import type { ArtOutfit, Expression } from '@farm/domain'
import { useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mix, SKIN, type BlankTint } from './blank-profile'

export { blankTint, mix, type BlankTint } from './blank-profile'

/** The base's size, a portrait's, and where the face sits on it. */
export const BLANK_BASE = { width: 525, height: 700 } as const
export const BLANK_FACE = { width: 224, height: 224, left: 150, top: 188 } as const
/** The face's fade, in ms: the portraits'. */
const FADE_MS = 140

// --- The outfits ----------------------------------------------------------------------------------------------------------

const SKIN_SHADE = '#ead0bd'
const INK = '#3a2c2a'

/** Each outfit's colours: its main cloth and its trim. */
const OUTFIT_COLOURS: Readonly<Record<ArtOutfit, { main: string; trim: string }>> = {
  spring: { main: '#a7d39a', trim: '#f6b8c6' },
  summer: { main: '#94cbe9', trim: '#ffffff' },
  fall: { main: '#d48f50', trim: '#9c4a2e' },
  winter: { main: '#4d6191', trim: '#f4f4f4' },
  swimsuit: { main: '#3bb7b1', trim: '#ffffff' },
  kimono: { main: '#c94a3e', trim: '#f4dfae' },
  dinner: { main: '#7a2d50', trim: '#f2e6d8' },
  wedding: { main: '#fdfbf6', trim: '#e2c77c' },
  'farm-work': { main: '#5f81b0', trim: '#f2e7c9' },
  'garden-party': { main: '#e3c7f0', trim: '#ffffff' },
  'pajamas-playful': { main: '#aac6f2', trim: '#ffffff' },
  'wedding-night': { main: '#f7ebe3', trim: '#eab6bc' },
}

/** The shoulders' outline, shared by every outfit. */
const TORSO = 'M30 700C30 590 90 520 190 492C215 486 235 478 262.5 478C290 478 310 486 335 492C435 520 495 590 495 700Z'

/** What an outfit draws over the shoulders: its neckline, collar, ribbon or sash. */
function outfitDetail(outfit: ArtOutfit, c: { main: string; trim: string }, ribbon: string): ReactNode {
  switch (outfit) {
    case 'spring': return <>
      <path d="M205 490Q262.5 548 320 490Q300 524 262.5 528Q225 524 205 490Z" fill="#ffffff" />
      <path d="M244 534L262.5 546L281 534L281 556L262.5 546L244 556Z" fill={c.trim} />
    </>
    case 'summer': return <>
      <path d="M188 494L262.5 604L337 494L312 488L262.5 566L213 488Z" fill={c.trim} />
      <path d="M246 590L262.5 606L279 590L284 622L262.5 606L241 622Z" fill="#2f4c7a" />
    </>
    case 'fall': return <>
      <path d="M262.5 530L250 700M262.5 530L275 700" stroke={mix(c.main, '#000000', 0.2)} strokeWidth="6" />
      <path d="M208 470Q262.5 508 317 470L322 498Q262.5 536 203 498Z" fill={c.trim} />
      <path d="M292 504L316 590L296 594L280 512Z" fill={c.trim} />
    </>
    case 'winter': return <path d="M196 478Q262.5 522 329 478Q348 500 326 520Q262.5 552 199 520Q177 500 196 478Z" fill={c.trim} />
    case 'swimsuit': return <>
      <path d="M118 700L136 632Q262.5 602 389 632L407 700Z" fill={c.main} />
      <path d="M182 640L212 500M343 640L313 500" stroke={c.main} strokeWidth="10" strokeLinecap="round" />
    </>
    case 'kimono': return <>
      <path d="M214 486L262.5 604L276 594L234 482Z" fill={c.trim} />
      <path d="M311 486L250 616L263 624L327 490Z" fill={c.trim} />
      <rect x="62" y="640" width="401" height="60" fill="#e8b84a" />
      <path d="M62 652H463M62 688H463" stroke="#c99a30" strokeWidth="4" />
      <circle cx="150" cy="560" r="10" fill={c.trim} opacity="0.7" /><circle cx="380" cy="585" r="12" fill={c.trim} opacity="0.7" />
    </>
    case 'dinner': return <>
      <path d="M60 700C60 642 110 604 170 594Q216 562 262.5 592Q309 562 355 594C415 604 465 642 465 700Z" fill={c.main} />
      <path d="M226 496Q262.5 522 299 496" stroke={c.trim} strokeWidth="5" strokeDasharray="1 9" strokeLinecap="round" fill="none" />
    </>
    case 'wedding': return <>
      <path d="M196 494Q262.5 556 329 494" stroke={c.trim} strokeWidth="5" fill="none" />
      <path d="M210 506Q262.5 560 315 506" stroke={c.trim} strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      <circle cx="262.5" cy="560" r="9" fill={c.trim} />
    </>
    case 'farm-work': return <>
      <path d="M198 560L327 560L340 700L185 700Z" fill={c.main} />
      <path d="M198 562L176 504M327 562L349 504" stroke={c.main} strokeWidth="16" strokeLinecap="round" />
      <circle cx="212" cy="574" r="6" fill="#e8b84a" /><circle cx="313" cy="574" r="6" fill="#e8b84a" />
      <path d="M236 484L262.5 530L289 484Z" fill="#d9483b" />
    </>
    case 'garden-party': return <>
      <path d="M200 488Q215 512 232 500Q247 522 262.5 506Q278 522 293 500Q310 512 325 488" stroke={c.trim} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M240 540L262.5 552L285 540L285 566L262.5 552L240 566Z" fill={ribbon} />
    </>
    case 'pajamas-playful': return <>
      <path d="M206 488L262.5 548L238 560Z M319 488L262.5 548L287 560Z" fill={c.trim} />
      {[[150, 600], [190, 660], [350, 610], [400, 670], [110, 680], [300, 670]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="9" fill={c.trim} opacity="0.8" />)}
      <circle cx="262.5" cy="590" r="5" fill={c.trim} /><circle cx="262.5" cy="640" r="5" fill={c.trim} />
    </>
    case 'wedding-night': return <>
      <path d="M212 486L262.5 590L250 700L228 700L240 594L196 492Z" fill={c.trim} />
      <path d="M313 486L262.5 590L275 700L297 700L285 594L329 492Z" fill={c.trim} />
      <path d="M90 660Q262.5 640 435 660" stroke={c.trim} strokeWidth="10" fill="none" />
    </>
  }
}

/** The base: her silhouette in an outfit, with no face of its own (the face layer draws it). */
export function BlankBase({ outfit, tint }: { outfit: ArtOutfit; tint: BlankTint }) {
  const cloth = OUTFIT_COLOURS[outfit]
  const hairBack = mix(tint.hair, '#000000', 0.18)
  const innerEar = mix(tint.hair, '#ffd9df', 0.55)
  const bare = outfit === 'swimsuit' || outfit === 'dinner'
  return (
    <svg viewBox={`0 0 ${BLANK_BASE.width} ${BLANK_BASE.height}`} className="absolute inset-0 size-full" aria-hidden data-blank-base={outfit}>
      <ellipse cx="262.5" cy="400" rx="250" ry="330" fill="#fff4dc" opacity="0.16" />
      {outfit === 'wedding' && <path d="M262.5 150C120 160 80 420 70 700H455C445 420 405 160 262.5 150Z" fill="#ffffff" opacity="0.55" />}
      <path d="M262.5 150C150 150 118 240 126 330C132 420 116 500 140 590L385 590C409 500 393 420 399 330C407 240 375 150 262.5 150Z" fill={hairBack} />
      <path d="M182 214L160 92Q158 76 174 84L238 182Z" fill={tint.hair} />
      <path d="M343 214L365 92Q367 76 351 84L287 182Z" fill={tint.hair} />
      <path d="M188 196L172 112L222 184Z" fill={innerEar} />
      <path d="M337 196L353 112L303 184Z" fill={innerEar} />
      <rect x="230" y="398" width="65" height="90" rx="12" fill={SKIN} />
      <path d={TORSO} fill={bare ? SKIN : cloth.main} />
      {outfitDetail(outfit, cloth, tint.ribbon)}
      <ellipse cx="262.5" cy="300" rx="108" ry="124" fill={SKIN} />
      <ellipse cx="262.5" cy="414" rx="40" ry="9" fill={SKIN_SHADE} />
      <path d="M148 330C140 205 190 158 262.5 158C335 158 385 205 377 330L366 330C364 296 356 276 350 262Q334 244 318 266Q298 240 280 266Q262.5 240 245 266Q227 240 207 266Q191 244 175 262C169 276 161 296 159 330Z" fill={tint.hair} />
      <path d="M150 290C138 340 146 392 166 432L180 428C166 390 164 342 170 300Z M375 290C387 340 379 392 359 432L345 428C359 390 361 342 355 300Z" fill={tint.hair} />
      <path d="M326 186Q340 172 352 184L344 200Q334 190 322 200Z" fill={tint.ribbon} />
      {outfit === 'wedding' && [[214, 176], [238, 164], [262.5, 160], [287, 164], [311, 176]].map(([x, y]) => <circle key={`${x}`} cx={x} cy={y} r="8" fill="#e2c77c" />)}
      {outfit === 'garden-party' && <><circle cx="196" cy="196" r="13" fill="#ffffff" /><circle cx="196" cy="196" r="5" fill="#f2c94c" /></>}
      {outfit === 'kimono' && <><circle cx="200" cy="192" r="12" fill="#f4dfae" /><circle cx="212" cy="204" r="8" fill="#e8b84a" /></>}
    </svg>
  )
}

// --- The faces ------------------------------------------------------------------------------------------------------------

const L = 78
const R = 146
const EY = 120
const MY = 170
const BLUSH = '#f29a9a'
const TEAR = '#9fd3f5'
const line = (d: string, width = 5, colour = INK) => <path d={d} stroke={colour} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />

type Eyes = 'open' | 'smile' | 'soft' | 'squeeze' | 'half' | 'wide' | 'startled' | 'sad' | 'glare' | 'set' | 'wink' | 'closed' | 'cry' | 'up' | 'down' | 'dreamy'
type Brows = 'soft' | 'raised' | 'high' | 'worried' | 'angry' | 'set' | 'low' | 'quirk'
type Mouth = 'small' | 'smile' | 'grin' | 'laugh' | 'o' | 'bigO' | 'frown' | 'flat' | 'wavy' | 'pout' | 'cat' | 'smirk' | 'yawn' | 'sob' | 'side'
type Extra = 'sweat' | 'anger' | 'tears' | 'streams' | 'sparkle' | 'zzz' | 'heart' | 'dots' | 'exclaim' | 'hatch' | 'puff'
interface FaceParts { eyes: Eyes; brows: Brows; mouth: Mouth; blush?: 'light' | 'strong'; extras?: readonly Extra[] }

/** Each expression's face: its eyes, brows and mouth, a blush, and its marks. */
export const BLANK_FACES: Readonly<Record<Expression, FaceParts>> = {
  neutral: { eyes: 'open', brows: 'soft', mouth: 'small' },
  happy: { eyes: 'smile', brows: 'soft', mouth: 'smile', blush: 'light' },
  laughing: { eyes: 'squeeze', brows: 'raised', mouth: 'laugh', blush: 'light' },
  surprised: { eyes: 'wide', brows: 'high', mouth: 'o' },
  thinking: { eyes: 'up', brows: 'quirk', mouth: 'side', extras: ['dots'] },
  sad: { eyes: 'sad', brows: 'worried', mouth: 'frown' },
  angry: { eyes: 'glare', brows: 'angry', mouth: 'frown', extras: ['anger'] },
  worried: { eyes: 'open', brows: 'worried', mouth: 'wavy', extras: ['sweat'] },
  determined: { eyes: 'set', brows: 'set', mouth: 'flat', extras: ['sparkle'] },
  pouting: { eyes: 'half', brows: 'angry', mouth: 'pout', blush: 'light', extras: ['puff'] },
  shy: { eyes: 'down', brows: 'worried', mouth: 'small', blush: 'strong' },
  tender: { eyes: 'soft', brows: 'soft', mouth: 'smile', blush: 'light' },
  flustered: { eyes: 'wide', brows: 'worried', mouth: 'wavy', blush: 'strong', extras: ['hatch'] },
  loving: { eyes: 'smile', brows: 'soft', mouth: 'smile', blush: 'strong', extras: ['heart'] },
  'tearful-joy': { eyes: 'smile', brows: 'worried', mouth: 'grin', blush: 'light', extras: ['tears'] },
  sleepy: { eyes: 'closed', brows: 'low', mouth: 'yawn', extras: ['zzz'] },
  crying: { eyes: 'cry', brows: 'worried', mouth: 'sob', extras: ['streams'] },
  teasing: { eyes: 'wink', brows: 'quirk', mouth: 'cat', blush: 'light' },
  smug: { eyes: 'half', brows: 'quirk', mouth: 'smirk' },
  embarrassed: { eyes: 'squeeze', brows: 'worried', mouth: 'wavy', blush: 'strong', extras: ['hatch', 'sweat'] },
  startled: { eyes: 'startled', brows: 'high', mouth: 'bigO', extras: ['exclaim'] },
  dreamy: { eyes: 'dreamy', brows: 'soft', mouth: 'smile', blush: 'light', extras: ['sparkle'] },
}

/** One open eye: her iris, its pupil and a highlight, under a lash line; `dx`/`dy` move the look. */
function iris(cx: number, eyes: string, { dx = 0, dy = 0, rx = 11, ry = 15, pupil = 1 } = {}) {
  return <>
    <ellipse cx={cx + dx} cy={EY + dy} rx={rx} ry={ry} fill={eyes} />
    <ellipse cx={cx + dx} cy={EY + dy + 2} rx={6 * pupil} ry={8 * pupil} fill={INK} />
    <circle cx={cx + dx - 4} cy={EY + dy - 6} r={3.5} fill="#ffffff" />
  </>
}
const lash = (cx: number, lift = 0) => line(`M${cx - 15} ${EY - 12 - lift}Q${cx} ${EY - 20 - lift} ${cx + 15} ${EY - 12 - lift}`, 5)

function eyePair(kind: Eyes, eyes: string): ReactNode {
  const both = (draw: (cx: number, side: -1 | 1) => ReactNode) => <>{draw(L, -1)}{draw(R, 1)}</>
  switch (kind) {
    case 'open': return both((cx) => <>{iris(cx, eyes)}{lash(cx)}</>)
    case 'up': return both((cx) => <>{iris(cx, eyes, { dx: 3, dy: -4 })}{lash(cx)}</>)
    case 'down': return both((cx) => <>{iris(cx, eyes, { dx: -3, dy: 4 })}{lash(cx, -2)}</>)
    case 'wide': return both((cx) => <>{iris(cx, eyes, { rx: 13, ry: 17, pupil: 0.7 })}{lash(cx, 4)}</>)
    case 'startled': return both((cx) => <><ellipse cx={cx} cy={EY} rx={13} ry={17} fill="#ffffff" stroke={INK} strokeWidth={4} /><circle cx={cx} cy={EY} r={4} fill={INK} /></>)
    case 'smile': return both((cx) => line(`M${cx - 13} ${EY + 4}Q${cx} ${EY - 10} ${cx + 13} ${EY + 4}`, 6))
    case 'soft': return both((cx) => line(`M${cx - 13} ${EY - 2}Q${cx} ${EY + 8} ${cx + 13} ${EY - 2}`, 5))
    case 'closed': return both((cx) => line(`M${cx - 13} ${EY + 2}L${cx + 13} ${EY + 2}`, 5))
    case 'squeeze': return both((cx, side) => line(side < 0 ? `M${cx - 12} ${EY - 9}L${cx + 10} ${EY}L${cx - 12} ${EY + 9}` : `M${cx + 12} ${EY - 9}L${cx - 10} ${EY}L${cx + 12} ${EY + 9}`, 6))
    case 'cry': return both((cx) => line(`M${cx - 13} ${EY + 4}Q${cx} ${EY - 8} ${cx + 13} ${EY + 4}`, 7))
    case 'half': return both((cx) => <>{iris(cx, eyes, { dy: 4, ry: 10 })}{line(`M${cx - 15} ${EY - 4}L${cx + 15} ${EY - 4}`, 6)}</>)
    case 'dreamy': return both((cx) => <>{iris(cx, eyes, { dx: 2, dy: 1, ry: 11 })}{line(`M${cx - 15} ${EY - 6}Q${cx} ${EY - 10} ${cx + 15} ${EY - 6}`, 6)}</>)
    case 'sad': return both((cx, side) => <>{iris(cx, eyes, { dy: 3 })}{line(side < 0 ? `M${cx - 15} ${EY - 4}L${cx + 14} ${EY - 14}` : `M${cx - 14} ${EY - 14}L${cx + 15} ${EY - 4}`, 5)}</>)
    case 'glare': return both((cx, side) => <>{iris(cx, eyes, { dy: 3, ry: 12 })}{line(side < 0 ? `M${cx - 15} ${EY - 14}L${cx + 15} ${EY - 4}` : `M${cx - 15} ${EY - 4}L${cx + 15} ${EY - 14}`, 6)}</>)
    case 'set': return both((cx) => <>{iris(cx, eyes, { dy: 2, ry: 13 })}{line(`M${cx - 15} ${EY - 10}L${cx + 15} ${EY - 10}`, 6)}</>)
    case 'wink': return <>{line(`M${L - 13} ${EY + 4}Q${L} ${EY - 10} ${L + 13} ${EY + 4}`, 6)}{iris(R, eyes)}{lash(R)}</>
  }
}

function browPair(kind: Brows): ReactNode {
  const d: Record<Brows, [string, string]> = {
    soft: ['M64 92Q78 85 92 90', 'M132 90Q146 85 160 92'],
    raised: ['M64 84Q78 76 92 82', 'M132 82Q146 76 160 84'],
    high: ['M64 76Q78 66 92 72', 'M132 72Q146 66 160 76'],
    worried: ['M64 92Q80 88 92 80', 'M132 80Q144 88 160 92'],
    angry: ['M64 82L92 94', 'M132 94L160 82'],
    set: ['M64 86L92 92', 'M132 92L160 86'],
    low: ['M64 96Q78 92 92 96', 'M132 96Q146 92 160 96'],
    quirk: ['M64 92Q78 88 92 92', 'M132 80Q146 72 160 82'],
  }
  return <>{line(d[kind][0], 5, '#5a4638')}{line(d[kind][1], 5, '#5a4638')}</>
}

function mouthOf(kind: Mouth): ReactNode {
  const fill = '#b5525a'
  switch (kind) {
    case 'small': return line(`M104 ${MY}Q112 ${MY + 5} 120 ${MY}`, 4, '#a0504a')
    case 'smile': return line(`M98 ${MY - 4}Q112 ${MY + 10} 126 ${MY - 4}`, 5, '#a0504a')
    case 'grin': return <path d={`M98 ${MY - 5}Q112 ${MY + 16} 126 ${MY - 5}Z`} fill={fill} stroke="#a0504a" strokeWidth={3} strokeLinejoin="round" />
    case 'laugh': return <path d={`M94 ${MY - 8}Q112 ${MY + 26} 130 ${MY - 8}Z`} fill={fill} stroke="#a0504a" strokeWidth={3} strokeLinejoin="round" />
    case 'o': return <ellipse cx={112} cy={MY + 2} rx={6} ry={7} fill={fill} />
    case 'bigO': return <ellipse cx={112} cy={MY + 4} rx={10} ry={13} fill={fill} />
    case 'yawn': return <ellipse cx={112} cy={MY + 2} rx={7} ry={9} fill={fill} />
    case 'frown': return line(`M100 ${MY + 6}Q112 ${MY - 4} 124 ${MY + 6}`, 5, '#a0504a')
    case 'sob': return <path d={`M98 ${MY + 10}Q112 ${MY - 8} 126 ${MY + 10}Z`} fill={fill} stroke="#a0504a" strokeWidth={3} strokeLinejoin="round" />
    case 'flat': return line(`M100 ${MY + 2}L124 ${MY + 2}`, 5, '#a0504a')
    case 'side': return line(`M108 ${MY + 2}L126 ${MY - 1}`, 5, '#a0504a')
    case 'wavy': return line(`M96 ${MY + 2}Q102 ${MY - 4} 108 ${MY + 2}Q114 ${MY + 8} 120 ${MY + 2}Q124 ${MY - 2} 128 ${MY + 1}`, 4, '#a0504a')
    case 'pout': return line(`M106 ${MY - 2}Q113 ${MY + 2} 107 ${MY + 6}Q113 ${MY + 10} 106 ${MY + 13}`, 4, '#a0504a')
    case 'cat': return line(`M98 ${MY - 2}Q105 ${MY + 7} 112 ${MY - 2}Q119 ${MY + 7} 126 ${MY - 2}`, 4, '#a0504a')
    case 'smirk': return line(`M100 ${MY + 3}Q114 ${MY + 5} 126 ${MY - 6}`, 5, '#a0504a')
  }
}

function extraOf(kind: Extra): ReactNode {
  switch (kind) {
    case 'sweat': return <path d="M184 52Q196 72 190 80Q182 88 176 80Q172 72 184 52Z" fill={TEAR} stroke="#5aa9d6" strokeWidth={2} />
    case 'anger': return line('M176 52Q184 60 176 66M196 52Q188 60 196 66M176 74Q184 66 192 74', 5, '#d9483b')
    case 'tears': return <>
      <path d={`M${L + 14} ${EY + 10}Q${L + 20} ${EY + 22} ${L + 14} ${EY + 28}Q${L + 8} ${EY + 22} ${L + 14} ${EY + 10}Z`} fill={TEAR} />
      <path d={`M${R - 14} ${EY + 10}Q${R - 8} ${EY + 22} ${R - 14} ${EY + 28}Q${R - 20} ${EY + 22} ${R - 14} ${EY + 10}Z`} fill={TEAR} />
    </>
    case 'streams': return <>
      <path d={`M${L - 6} ${EY + 6}L${L - 2} ${EY + 70}`} stroke={TEAR} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${R + 6} ${EY + 6}L${R + 2} ${EY + 70}`} stroke={TEAR} strokeWidth={8} strokeLinecap="round" />
    </>
    case 'sparkle': return <>
      <path d="M190 40L194 52L206 56L194 60L190 72L186 60L174 56L186 52Z" fill="#f5c542" />
      <path d="M34 60L36 67L43 69L36 71L34 78L32 71L25 69L32 67Z" fill="#f5c542" />
    </>
    case 'zzz': return <text x="176" y="62" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="30" fill="#6b7fb3">z<tspan fontSize="22" dy="-14">z</tspan></text>
    case 'heart': return <path d="M192 44C192 36 202 34 205 42C208 34 218 36 218 44C218 54 205 60 205 64C205 60 192 54 192 44Z" fill="#e0567a" />
    case 'dots': return <><circle cx="186" cy="62" r="5" fill="#8a8a9a" /><circle cx="198" cy="48" r="6" fill="#8a8a9a" /><circle cx="210" cy="32" r="7" fill="#8a8a9a" /></>
    case 'exclaim': return line('M186 36L180 56M204 44L192 60M210 66L196 70', 5, '#d9483b')
    case 'hatch': return line('M46 146L54 138M56 150L64 142M160 146L168 138M170 150L178 142', 3, '#d9737a')
    case 'puff': return line('M184 150Q196 160 184 172', 4, SKIN_SHADE)
  }
}

/** One face: transparent but for her features, drawn over the base at its face position. */
export function BlankFace({ expression, tint }: { expression: Expression; tint: BlankTint }) {
  const face = BLANK_FACES[expression]
  return (
    <svg viewBox={`0 0 ${BLANK_FACE.width} ${BLANK_FACE.height}`} className="size-full" aria-hidden>
      {face.blush && <>
        <ellipse cx="56" cy="148" rx="16" ry="8" fill={BLUSH} opacity={face.blush === 'strong' ? 0.75 : 0.45} />
        <ellipse cx="168" cy="148" rx="16" ry="8" fill={BLUSH} opacity={face.blush === 'strong' ? 0.75 : 0.45} />
      </>}
      {browPair(face.brows)}
      {eyePair(face.eyes, tint.eyes)}
      {mouthOf(face.mouth)}
      {(face.extras ?? []).map((e) => <g key={e}>{extraOf(e)}</g>)}
    </svg>
  )
}

// --- The bust ---------------------------------------------------------------------------------------------------------------

/** The blank bust as a stage shows it: the outfit's base, the line's face over it at the face position (as tall as its
 * panel, in a portrait's proportions). The face swaps line by line: the new one fades in as the last fades out; with
 * reduced motion, at once. */
export function BlankBust({ outfit, expression, tint, label, height = '100%' }: { outfit: ArtOutfit; expression: Expression; tint: BlankTint; label: string; height?: number | string }) {
  const reduced = useReducedMotionSetting()
  const [faces, setFaces] = useState<Expression[]>([expression])
  useEffect(() => {
    setFaces((now) => (now.at(-1) === expression ? now : [...now.slice(-1), expression]))
  }, [expression])
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (faces.length < 2) return
    settle.current = setTimeout(() => setFaces((now) => now.slice(-1)), reduced ? 0 : FADE_MS)
    return () => { if (settle.current) clearTimeout(settle.current) }
  }, [faces, reduced])
  const at = (n: number, of: number) => `${(n / of) * 100}%`
  return (
    <span role="img" aria-label={label} className="relative block shrink-0 overflow-hidden rounded-md"
      style={{ height, aspectRatio: `${BLANK_BASE.width} / ${BLANK_BASE.height}`, maxWidth: '100%' }}
      data-bust-art="blank" data-portrait={outfit} data-expression={faces.at(-1)}>
      <BlankBase outfit={outfit} tint={tint} />
      {faces.map((face, i) => {
        const newest = i === faces.length - 1
        const animation = reduced || faces.length < 2 ? null : newest ? 'portrait-face-in' : 'portrait-face-out'
        return (
          <span key={face} className="pointer-events-none absolute" data-blank-face={newest ? face : undefined}
            style={{
              left: at(BLANK_FACE.left, BLANK_BASE.width), top: at(BLANK_FACE.top, BLANK_BASE.height),
              width: at(BLANK_FACE.width, BLANK_BASE.width), height: at(BLANK_FACE.height, BLANK_BASE.height),
              ...(animation ? { animation: `${animation} ${FADE_MS}ms ease-out both` } : {}),
            }}>
            <BlankFace expression={face} tint={tint} />
          </span>
        )
      })}
    </span>
  )
}
