// Her illustration, full screen in a scene: the dialogue engine's picture for her big moments. A scene's frame (the scene
// player's `Frame`, the event player's `Shell`) hosts it (`ArtHost`): the picture covers the whole screen in landscape,
// behind the frame's title line and the text box, which sits over its lower edge; no bust shows while it's up. The scene
// inside says what's up now (`ArtCue`: her illustration a cue asks for, by id or by moment, from the scene's steps), and
// every picture its steps can put up loads as it starts, verified and cached on the device by its hash. It fades in and
// out (and from one to the next) over 450 ms; with reduced motion it simply swaps. While her manifest or the picture
// loads, the screen holds a dark ground (no bust flashes); a cue she has no scene for, or a picture that can't load,
// shows her bust as before. Each picture shown joins her gallery for good (the host's `onSeen`, the loop's
// `seeIllustrationOnce`). Loaded with the players.
import { illustrationCues, sceneFor, type IllustrationAsk, type Step } from '@farm/domain'
import { useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useIllustrationsState, usePicture, usePreloadPictures } from './illustrations'

/** Whether her illustration is up on the frame: `up` once its picture shows, `loading` while it loads (the dark ground,
 * no bust), `none` for her bust. */
export type ArtMode = 'none' | 'loading' | 'up'
/** The fade in and out, in ms. */
export const ART_FADE_MS = 450

/** What a scene says is up: her illustration the cue asks for (null: none), and the scene's steps, whose pictures load
 * as it starts. */
interface Cue { owner: string; ask: IllustrationAsk; steps: readonly Step[] }
interface ArtState { mode: ArtMode; set: (cue: Cue | null) => void }
const ArtContext = createContext<ArtState>({ mode: 'none', set: () => undefined })

/** Whether her illustration is up on this frame. Outside a host (a pair's conversation, a sheet): none. */
export const useArtMode = (): ArtMode => useContext(ArtContext).mode

const askKey = (ask: IllustrationAsk): string => (ask === null ? '' : ask.by === 'id' ? ask.id : `@${ask.moment}`)

/** A scene's frame hosts her illustration: the picture behind everything, and what the scene inside says is up. Each
 * one shown is `onSeen` (her gallery). */
export function ArtHost({ onSeen, children }: { onSeen?: (owner: string, scene: string) => Promise<void>; children: ReactNode }) {
  const [cue, setCue] = useState<Cue | null>(null)
  const set = useCallback((next: Cue | null) => setCue((now) => (
    now === next || (now && next && now.owner === next.owner && askKey(now.ask) === askKey(next.ask) && now.steps === next.steps) ? now : next
  )), [])
  const state = useIllustrationsState(cue && cue.ask ? cue.owner : null)
  const ills = state === 'loading' ? null : state
  const scene = ills && cue ? sceneFor(ills.scenes, cue.ask) : null
  // Every picture the scene can put up loads as it starts.
  const paths = useMemo(() => (ills && cue ? illustrationCues(cue.steps).flatMap((a) => sceneFor(ills.scenes, a)?.path ?? []) : []), [ills, cue])
  usePreloadPictures(paths)
  const picture = usePicture(scene?.path ?? null)
  const mode: ArtMode = !cue?.ask ? 'none' : state === 'loading' ? 'loading' : !scene || picture.failed ? 'none' : picture.url ? 'up' : 'loading'
  const value = useMemo(() => ({ mode, set }), [mode, set])
  // Shown: it joins her gallery for good.
  const owner = cue?.owner ?? null
  const shown = mode === 'up' && scene ? scene.id : null
  useEffect(() => {
    if (owner && shown) void onSeen?.(owner, shown).catch(() => undefined)
  }, [owner, shown]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ArtContext.Provider value={value}>
      <ArtLayer active={mode !== 'none'} url={mode === 'up' ? picture.url : null} label={mode === 'up' ? scene?.title ?? null : null} id={shown} />
      {children}
    </ArtContext.Provider>
  )
}

/** What's up now on the scene's frame: her (`owner`) illustration `ask` names, from the scene's `steps` (memoized: their
 * pictures load as it starts). Gone with the scene: down. */
export function ArtCue({ owner, ask, steps }: { owner: string; ask: IllustrationAsk; steps: readonly Step[] }) {
  const { set } = useContext(ArtContext)
  const key = askKey(ask)
  useEffect(() => { set({ owner, ask, steps }) }, [owner, key, steps]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => set(null), [set])
  return null
}

/** The picture, full screen behind the frame: a dark ground, the picture over it (a new one fading in over the last; on
 * a screen wider than the art, cropped mostly from its foot, under the text box), and soft shades at the top and the
 * foot for the title line and the text box. It fades in as it comes up and out as it goes
 * down; with reduced motion it simply swaps. */
function ArtLayer({ active, url, label, id }: { active: boolean; url: string | null; label: string | null; id: string | null }) {
  const reduced = useReducedMotionSetting()
  const [mounted, setMounted] = useState(active)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (active) {
      setMounted(true)
      setLeaving(false)
      return
    }
    if (reduced) {
      setMounted(false)
      return
    }
    setLeaving(true)
    const timer = setTimeout(() => { setMounted(false); setLeaving(false) }, ART_FADE_MS)
    return () => clearTimeout(timer)
  }, [active, reduced])
  // The pictures: the newest over the last, which goes once the new one is in.
  const [layers, setLayers] = useState<string[]>(() => (url ? [url] : []))
  useEffect(() => {
    if (url) setLayers((now) => (now.at(-1) === url ? now : [...now.slice(-1), url]))
  }, [url])
  // Gone once faded out: the next time it comes up, it starts on its own picture.
  useEffect(() => {
    if (!mounted && !active) setLayers([])
  }, [mounted, active])
  useEffect(() => {
    if (layers.length < 2) return
    const timer = setTimeout(() => setLayers((now) => now.slice(-1)), reduced ? 0 : ART_FADE_MS)
    return () => clearTimeout(timer)
  }, [layers, reduced])
  if (!mounted && !active) return null
  const fade = reduced ? undefined : `${leaving ? 'portrait-face-out' : 'portrait-face-in'} ${ART_FADE_MS}ms ease-out both`
  return (
    <div role={label ? 'img' : undefined} aria-label={label ?? undefined} aria-hidden={label ? undefined : true}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#140f18]" style={fade ? { animation: fade } : undefined}
      data-illustration={id ?? (active ? 'loading' : 'leaving')}>
      {layers.map((u, i) => {
        const newest = i === layers.length - 1
        return (
          <img key={u} src={u} alt="" draggable={false} className="absolute inset-0 size-full object-cover object-[50%_15%] select-none"
            style={newest && layers.length > 1 && !reduced ? { animation: `portrait-face-in ${ART_FADE_MS}ms ease-out both` } : undefined}
            data-illustration-picture={newest ? id ?? undefined : undefined} />
        )
      })}
      <div className="absolute inset-x-0 top-0 h-20" style={{ background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.45), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.5), transparent)' }} />
    </div>
  )
}

/** The frame's title line over her illustration: light on the shade. */
export function useArtHeader(): string {
  return useArtMode() === 'none' ? 'relative z-10' : 'relative z-10 [&_button]:text-white/90 [&_p]:text-white/85 [&_button]:[text-shadow:0_1px_2px_rgb(0_0_0/0.5)] [&_p]:[text-shadow:0_1px_2px_rgb(0_0_0/0.5)]'
}
