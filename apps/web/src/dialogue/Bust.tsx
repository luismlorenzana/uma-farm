// A speaker's bust in a scene, the dialogue engine's compositor. Who she is (a role goes to the Uma who plays it), what
// she wears (the scene's look: its own outfit, else the moment's, else the day's season), and what her face shows (the
// line's `emote`, else neutral):
//   1. her portraits, when master data holds them: the outfit's base (else her first in Farm Life's order: spring) with
//      the face over it at that base's face position, unscaled, straight alpha (the browser's own compositing); only the
//      face swaps from line to line, fading in (at once with reduced motion);
//   2. else her master-data bust, without faces, the emote as uma-art's bubble beside it;
//   3. a role no one plays: its lettered disc.
// F76 adds the blank bust between 1 and 2. Loaded with the players.
import emoteIndex from '@luismlorenzana/uma-art/emote/atlas.json'
import emoteUrl from '@luismlorenzana/uma-art/emote/atlas.png?url'
import { CAST, dressOf, fallbackChain, isCastId, type CastId, type Expression, type SceneLook } from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { useArtUrl, type ArtSource } from '@luismlorenzana/uma-kit/content'
import { useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { whoIs } from '../story/people'
import { useStory } from '../story/story'
import { portraitArt, portraitPick, usePortraitsOf, usePreload, type PortraitPick } from './portraits'

// --- The scene's look ---------------------------------------------------------------------------------------------------

const LookContext = createContext<SceneLook>({ day: 1 })
/** Each player gives its scene's look: the story's outfit for it, its moments, the day and its own Umas. */
export const SceneLookProvider = LookContext.Provider
export const useSceneLook = (): SceneLook => useContext(LookContext)

/** What a speaker shows for a line: who she is once roles are filled, and her portrait's pick (null without portraits). */
export function useBustPick(who: string | null, emote: unknown): { id: string | null; pick: PortraitPick | null } {
  const story = useStory()
  const look = useSceneLook()
  const id = who === null ? null : whoIs(story, who)
  const portraits = usePortraitsOf(id && !isCastId(id) ? id : null)
  return { id, pick: portraits && id ? portraitPick(portraits, dressOf(look, id), emote) : null }
}

/** The next line's base and face, loaded and decoded while this line shows. */
export function PreloadLine({ who, emote }: { who: string | null; emote: unknown }) {
  const { pick } = useBustPick(who, emote)
  usePreload(pick ? [pick.base.path, ...(pick.face ? [pick.face.path] : [])] : [])
  return null
}

// --- The bust ------------------------------------------------------------------------------------------------------------

/** A role's lettered disc, while no one plays it (with no master data): its word's first letter. */
export function RoleDisc({ id, size }: { id: CastId; size: number }) {
  return (
    <span aria-hidden className="font-display flex shrink-0 items-center justify-center rounded-full bg-[#6f6a63] font-bold text-white shadow-2 ring-4 ring-white/70"
      style={{ width: size, height: size, fontSize: size * 0.42 }} data-cast={id}>
      {CAST[id].role.replace(/^The /, '').charAt(0).toUpperCase()}
    </span>
  )
}

/** Anyone's bust as she speaks: her portrait (as tall as its panel) in the scene's outfit with the line's face, else her
 * master-data bust with the emote's bubble, else a role's disc. */
export function SceneBust({ who, name, emote = null, size }: { who: string; name: string; emote?: string | null; size: number }) {
  const { id, pick } = useBustPick(who, emote)
  if (id && isCastId(id)) return <RoleDisc id={id} size={Math.round(size * 0.74)} />
  if (pick) return <Portrait key={`${id}:${pick.base.path}`} pick={pick} art={portraitArt()} label={name} height="100%" />
  return (
    <span className="relative inline-flex" data-bust-art="master">
      <UmaBust outfitId={id ?? who} label={name} size={size} />
      {emote && <EmoteBubble emote={emote} />}
    </span>
  )
}

/** Anyone's master-data bust outside a scene (a sheet's small one): a role's disc while no one plays it. */
export function PersonBust({ who, name, size }: { who: string; name: string; size: number }) {
  const story = useStory()
  const id = whoIs(story, who)
  return isCastId(id) ? <RoleDisc id={id} size={Math.round(size * 0.74)} /> : <UmaBust outfitId={id} label={name} size={size} />
}

/** One face layer: its key (the face's file, or `neutral`: the base's own face, drawn as nothing), its URL once loaded,
 * and its size in the base's pixels. */
interface Layer { key: string; url: string | null; width: number; height: number; expression: string }

/** Her portrait: the base, and the face over it at the base's face position, in the base's own proportions. The face
 * swaps line by line without moving the base: a new face fades in over the last, which stays under it until then;
 * neutral fades the last away. With reduced motion it swaps at once. Until a new face has loaded, the last one stays. */
export function Portrait({ pick, art, label, height }: { pick: PortraitPick; art: ArtSource; label: string; height: number | string }) {
  const reduced = useReducedMotionSetting()
  const { base, face } = pick
  const baseUrl = useArtUrl(base.path, art)
  const faceUrl = useArtUrl(face?.path ?? null, art)
  const target: Layer | null = !face ? { key: 'neutral', url: null, width: 0, height: 0, expression: 'neutral' }
    : faceUrl ? { key: face.path, url: faceUrl, width: face.width, height: face.height, expression: pick.expression } : null
  const [layers, setLayers] = useState<Layer[]>(() => (target ? [target] : []))
  useEffect(() => {
    if (target) setLayers((now) => (now.at(-1)?.key === target.key ? now : [...now.slice(-1), target]))
  }, [target?.key, target?.url]) // eslint-disable-line react-hooks/exhaustive-deps
  // The last face goes once the new one is in.
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (layers.length < 2) return
    settle.current = setTimeout(() => setLayers((now) => now.slice(-1)), reduced ? 0 : FADE_MS)
    return () => { if (settle.current) clearTimeout(settle.current) }
  }, [layers, reduced])
  const at = (n: number, of: number) => `${(n / of) * 100}%`
  const top = layers.at(-1)
  return (
    <span role="img" aria-label={label} className="relative block shrink-0 overflow-hidden rounded-md bg-sunken shadow-2 ring-1 ring-black/5"
      style={{ height, aspectRatio: `${base.width} / ${base.height}`, maxWidth: '100%' }}
      data-portrait={pick.outfit} data-expression={top?.expression ?? pick.expression} data-bust-art="portrait">
      {baseUrl && <img src={baseUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" data-portrait-base />}
      {layers.map((layer, i) => {
        if (!layer.url) return null
        const newest = i === layers.length - 1
        // A new face fades in over the last; neutral fades the last one out.
        const animation = reduced || layers.length < 2 ? null : newest ? 'portrait-face-in' : top?.url === null ? 'portrait-face-out' : null
        return (
          <img key={layer.key} src={layer.url} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none" data-portrait-face={newest ? layer.expression : undefined}
            style={{
              left: at(pick.at.left, base.width), top: at(pick.at.top, base.height), width: at(layer.width, base.width), height: at(layer.height, base.height),
              ...(animation ? { animation: `${animation} ${FADE_MS}ms ease-out both` } : {}),
            }} />
        )
      })}
    </span>
  )
}
/** The face's fade, in ms. */
export const FADE_MS = 140

// --- The emote's bubble (no faces) --------------------------------------------------------------------------------------

/** uma-art's bubbles, by the expression that has its own. */
const OWN_BUBBLE: Readonly<Partial<Record<Expression, string>>> = {
  happy: 'emote/music', laughing: 'emote/music', shy: 'emote/sweat', sad: 'emote/ellipsis', angry: 'emote/anger', surprised: 'emote/exclaim',
  thinking: 'emote/question', tender: 'emote/heart', sleepy: 'emote/zzz',
}
/** An emote's bubble beside a bust without faces: its own, else its nearest's by the expressions' fallbacks; none for
 * neutral or an unknown emote. */
export const bubbleOf = (emote: unknown): string | null => fallbackChain(emote).map((e) => OWN_BUBBLE[e]).find((b) => b !== undefined) ?? null

type EmoteFrames = { width: number; height: number; frames: Record<string, { x: number; y: number; w: number; h: number }> }
/** The emote's bubble, top right of a bust without faces. */
export function EmoteBubble({ emote }: { emote: string }) {
  const bubble = bubbleOf(emote)
  const index = emoteIndex as unknown as EmoteFrames
  const frame = bubble ? index.frames[bubble] : undefined
  if (!bubble) return null
  const scale = 0.75
  return (
    <span role="img" aria-label={emote} className="absolute -top-2 -right-2" data-emote={emote} data-emote-frame={bubble}
      style={frame ? {
        width: frame.w * scale, height: frame.h * scale, backgroundImage: `url(${emoteUrl})`, backgroundSize: `${index.width * scale}px ${index.height * scale}px`,
        backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`, backgroundRepeat: 'no-repeat',
      } : undefined}>
      {!frame && emote}
    </span>
  )
}
