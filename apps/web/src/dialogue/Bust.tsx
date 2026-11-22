// A speaker's bust in a scene, the dialogue engine's compositor. Who she is (a role goes to the Uma who plays it), what
// she wears (the scene's look: its own outfit, else the moment's, else the day's season), and what her face shows (the
// line's `emote`, else neutral):
//   1. her portraits, when master data holds them: the outfit's base (else her first in Farm Life's order: spring) with
//      the face over it at that base's face position, unscaled, straight alpha (the browser's own compositing); only the
//      face swaps from line to line, fading in (at once with reduced motion);
//   2. else the blank bust (`blank.tsx`): her silhouette in the outfit's colours, her hair her theme colour's, and a face
//      for every one of the 22 expressions, laid over it as a portrait's face is. It comes before her master-data bust,
//      which has no faces: a scene's point is her face changing line by line, and every Uma without portraits looks
//      alike on the stage until hers are drawn. Her master-data bust stays on cards; her small face in lists is her
//      picture (`Avatar.tsx`);
//   3. a role no one plays: its lettered disc.
// While her portraits load, the panel holds her place, so a pilot's bust never flashes blank. Loaded with the players.
import { CAST, dateDayOf, dressOf, faceFor, isCastId, isSister, sceneSpeaker, sisterOutfit, type CastId, type SceneLook } from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { useArtUrl, type ArtSource } from '@luismlorenzana/uma-kit/content'
import { useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useMaster } from '../master/master'
import { useGame } from '../save/game'
import { whoIs } from '../story/people'
import { useStory } from '../story/story'
import { BLANK_BASE, BlankBust, blankTint, type BlankTint } from './blank'
import { portraitArt, portraitPick, usePortraitsState, usePreload, type PortraitPick } from './portraits'

// --- The scene's look ---------------------------------------------------------------------------------------------------

const LookContext = createContext<SceneLook>({ day: 1 })
/** Each player gives its scene's look: the story's outfit for it, its moments, the day and its own Umas. */
export function SceneLookProvider({ value, children }: { value: SceneLook; children: ReactNode }) {
  const clock = useGame(state => state.save?.calendar)
  const look = clock?.start ? { ...value, day: Math.max(1, dateDayOf(value.day, clock)) } : value
  return <LookContext.Provider value={look}>{children}</LookContext.Provider>
}
export const useSceneLook = (): SceneLook => useContext(LookContext)

/** Resolve speaker aliases using the live schedule, the expedition roster, and the scene's leads. */
export function useSceneSpeaker(who: string | null): string | null {
  const story = useStory()
  const calendar = useGame(state => state.save?.calendar)
  const expeditions = useGame(state => state.save?.expeditions)
  const { leads } = useSceneLook()
  return story && who ? sceneSpeaker(story, { calendar: calendar ?? { day: 1 }, expeditions: expeditions ?? [] }, who, leads) : who
}

/** What a speaker shows for a line: who she is once roles are filled, her portrait's pick (null without portraits), and
 * whether her portraits are still loading. */
export function useBustPick(who: string | null, emote: unknown): { id: string | null; pick: PortraitPick | null; loading: boolean } {
  const look = useSceneLook()
  const id = useSceneSpeaker(who)
  const portraits = usePortraitsState(id && !isCastId(id) ? id : null)
  const ready = portraits !== 'loading' ? portraits : null
  return { id, pick: ready && id ? portraitPick(ready, dressOf(look, id), emote, look.portrait) : null, loading: portraits === 'loading' }
}

/** Her tint on the blank bust: her character's theme colours from master data (a sister's, her outfit's character's),
 * else a tone by her id. */
export function useBlankTint(id: string): BlankTint {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const character = isSister(id) ? view?.outfits.get(sisterOutfit(id))?.characterId ?? null : id
  return blankTint(id, character ? view?.colors?.get(character) : null)
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

/** Anyone's bust as she speaks: her portrait (as tall as its panel) in the scene's outfit with the line's face, else the
 * blank bust in that outfit with the line's face, else a role's disc. */
export function SceneBust({ who, name, emote = null, size }: { who: string; name: string; emote?: string | null; size: number }) {
  const { id, pick, loading } = useBustPick(who, emote)
  if (id === null) return null
  if (isCastId(id)) return <RoleDisc id={id} size={Math.round(size * 0.74)} />
  if (pick) return <Portrait key={`${id}:${pick.base.path}`} pick={pick} art={portraitArt()} label={name} height="100%" />
  if (loading) return <span aria-hidden className="block shrink-0" style={{ height: '100%', aspectRatio: `${BLANK_BASE.width} / ${BLANK_BASE.height}` }} data-bust-art="loading" />
  return <SceneBlank id={id} name={name} emote={emote} />
}

/** The blank bust in the scene's outfit, with the line's face: every one of the 22 is drawn, so the emote shows as written
 * (an unknown one as neutral). */
function SceneBlank({ id, name, emote }: { id: string; name: string; emote: string | null }) {
  const look = useSceneLook()
  const tint = useBlankTint(id)
  return <BlankBust outfit={dressOf(look, id)} expression={faceFor(emote, () => true)} tint={tint} label={name} />
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
