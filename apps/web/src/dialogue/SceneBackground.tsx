import { createContext, useContext, useEffect, useState } from 'react'
import { useStory } from '../story/story'
import { sceneAssets } from './scene-assets'
import { resolveEnvironment, type SceneEnvironment } from './scene-context'

const SceneContext = createContext<SceneEnvironment>({ place: 'fields', phase: 'afternoon', season: 'spring' })
export const EnvironmentProvider = SceneContext.Provider
export const useEnvironment = () => useContext(SceneContext)

export function SceneBackground({ environment }: { environment: SceneEnvironment }) {
  const story = useStory()
  const selected = resolveEnvironment(environment, story)
  const upcoming = environment.nextPlace && resolveEnvironment({ ...environment, place: environment.nextPlace, view: undefined }, story)
  return <Plate key={selected.key} selected={selected} upcoming={upcoming && upcoming.key !== selected.key ? upcoming.key : null} />
}

function Plate({ selected, upcoming }: { selected: ReturnType<typeof resolveEnvironment>; upcoming: string | null }) {
  const [failed, setFailed] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [small, large] = sceneAssets[failed === 0 ? selected.key : selected.fallback] ?? []
  useEffect(() => {
    if (!loaded || !upcoming) return
    const [src, highResolution] = sceneAssets[upcoming] ?? []
    if (src) {
      const next = new Image()
      next.fetchPriority = 'low'
      if (highResolution) {
        next.sizes = '100vw'
        next.srcset = src + ' 896w, ' + highResolution + ' 1600w'
      }
      next.src = src
    }
  }, [loaded, upcoming])
  return <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-sunken" data-scene-environment={selected.key}
    data-scene-phase={selected.phase} data-scene-fallback={failed || undefined}>
    {failed < 2 && (!failed || selected.fallback !== selected.key) && small && <img key={failed} alt="" src={small} srcSet={large ? `${small} 896w, ${large} 1600w` : undefined}
      sizes="100vw" decoding="async" className="absolute inset-0 size-full object-cover"
      style={{ objectPosition: selected.key === 'gate' ? '55% 48%' : '50% 48%',
        filter: selected.tint && !failed ? 'brightness(.54) saturate(.74) hue-rotate(12deg)' : undefined }}
      onLoad={() => setLoaded(true)} onError={() => setFailed(current => current + 1)} />}
    <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30" />
  </div>
}
