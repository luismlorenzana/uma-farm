import {
  bookScenes, eventOf, festivalsOf, galleryOf, illustrationCues, ILLUSTRATION_RULES, kindsNow, occasionWith, readiness, routeRequirements, sceneFor,
  type BookReplay, type BookScene, type FarmSave, type IllustratedScene, type SceneGroup, type SpecialDays, type StoryPack,
} from '@farm/domain'
import type { Illustration } from '@luismlorenzana/uma-data'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useIllustrationsState, usePicture } from '../dialogue/illustrations'
import { routeRequirementWords } from '../loop/event-view'
import { namer } from '../story/people'
import { Avatar } from '../dialogue/Avatar'
import type { MasterView } from '../master/master'
import { libraryDate } from './LibraryPage'

const Replay = lazy(() => import('./LibraryReplay'))
const SCENES_PER_PAGE = 6
const GROUPS: Readonly<Record<SceneGroup | 'all' | 'art', string>> = {
  all: 'All scenes', route: 'Chapters', outings: 'Outings', occasions: 'Occasions', home: 'Home life', shared: 'Shared scenes', art: 'Illustrations', archive: 'Archive',
}

/** Match the same default art moments that the live players use. Other illustrations have their own gallery cards. */
function sceneArt(scene: BookScene, seen: readonly Illustration[]): Illustration | undefined {
  const script = scene.variants[0]?.script
  const moment: IllustratedScene | null = script === 'arrival' ? 'meeting' : script === 'confession' ? 'confession'
    : script === 'wedding' || script === 'wedding-night' ? script : script === 'a-night-in' ? 'night-in' : script === 'morning' ? 'companion' : null
  if (!moment) return undefined
  const allowed: readonly string[] = ILLUSTRATION_RULES[moment].moments
  return seen.find(art => allowed.includes(art.moment))
}

function Thumb({ picture, locked = false, owner }: { picture?: Illustration; locked?: boolean; owner?: string }) {
  const { url } = usePicture(picture?.path ?? null)
  if (url) return <img className="lib-thumbnail" src={url} alt="" />
  if (locked) return <span className="lib-thumbnail lib-silhouette" aria-hidden="true" />
  return <span className="lib-thumbnail" aria-hidden="true">{owner ? <Avatar id={owner} size={38} label="" /> : '▤'}</span>
}

export default function LibraryScenes({ save, pack, days, id, master }: {
  save: FarmSave; pack: StoryPack; days: SpecialDays; id: string; master: MasterView | null
}) {
  const location = useLocation()
  const leave = useLeave()
  const [params, set] = useSearchParams()
  const scenes = useMemo(() => bookScenes(save, pack, id, days), [save, pack, id, days])
  const art = useIllustrationsState(id)
  const seen = galleryOf(save, id)
  const illustrations = art && art !== 'loading' ? art.scenes : []
  const availableArt = illustrations.filter(scene => seen.includes(scene.id))
  const missingArt = seen.filter(key => !illustrations.some(scene => scene.id === key))
  const choice = params.get('group') ?? 'all'
  const group = Object.hasOwn(GROUPS, choice) ? choice : 'all'
  const filter = (scene: BookScene) => group === 'all' ? scene.group !== 'archive' : scene.group === group
  const tiles = group === 'art' ? [] : scenes.filter(filter)
  const length = group === 'art' ? illustrations.length + (art === 'loading' ? 0 : missingArt.length) : tiles.length
  const pages = Math.max(1, Math.ceil(length / SCENES_PER_PAGE))
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.get('leaf') ?? '1', 10) || 1))
  const offset = (page - 1) * SCENES_PER_PAGE
  const selected = params.get('tile')
  const replayKey = params.get('scene')
  const preferences = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(values)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    return next
  }
  const pick = (values: Record<string, string | null>) => set(preferences(values), { replace: true, state: location.state })
  const ready = readiness(save, pack, id)
  const occasion = occasionWith(save, pack, days, id)
  const today = new Set(kindsNow(save, pack, id))
  const readyLink = (scene: BookScene) => {
    if (ready.ready && scene.key === `route:${ready.rung}`) return withParam(location, 'event', id)
    if (occasion && scene.key === `occasion:${occasion.slot}:${occasion.id}`) return withParam(location, 'occasion', id)
    if ([...today].some(kind => scene.key === `evening:${kind}`)) return withParam(location, 'evening', id)
    return null
  }
  const playHref = (entry: BookReplay) => {
    if (entry.source === 'route') return withParam(location, 'memory', `${id}:${entry.script}`)
    if (entry.source === 'pair') return withParam(location, 'read', entry.script)
    if (entry.source === 'household') return `${withParam(location, 'household', entry.script)}&replay=1`
    return `?${preferences({ scene: entry.key })}`
  }
  const artHref = (picture: Illustration) => `?${preferences({ gallery: id, art: picture.id })}`
  const openedScene = scenes.find(scene => scene.key === selected && scene.earned)
  const [cues, setCues] = useState<{ tile: string; art: ReturnType<typeof illustrationCues> } | null>(null)
  useEffect(() => {
    if (!openedScene || availableArt.length === 0) return
    let live = true
    const scripts = openedScene.variants.filter(entry => (entry.source === 'route' && !entry.script.startsWith('alt-')) || entry.source === 'script')
    void Promise.all(scripts.map(entry => eventOf(pack, id, entry.script))).then(events => {
      if (live) setCues({ tile: openedScene.key, art: events.flatMap(event => illustrationCues(event.steps)) })
    }, () => undefined)
    return () => { live = false }
  }, [openedScene, pack, id, availableArt.length])
  const replay = replayKey ? scenes.flatMap(scene => scene.variants).find(entry => entry.key === replayKey && ['script', 'life'].includes(entry.source)) : null
  const sources = Object.entries(GROUPS).filter(([key]) => key !== 'archive' || scenes.some(scene => scene.group === 'archive'))
  const visibleArt = [...illustrations, ...(art !== 'loading' ? missingArt : [])].slice(offset, offset + SCENES_PER_PAGE)

  return <>
    <div className="lib-head"><h2>Scene Gallery</h2>
      <label className="sr-only" htmlFor="library-scene-group">Scene group</label>
      <select id="library-scene-group" className="lib-button bg-panel" value={group}
        onChange={event => pick({ group: event.target.value, leaf: null, tile: null, scene: null })}>
        {sources.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </div>
    {group === 'art' && art === 'loading' && <p>Loading illustrations…</p>}
    {length === 0 && art !== 'loading' && <p>Nothing here yet.</p>}
    <div className="lib-scene-grid">
      {tiles.slice(offset, offset + SCENES_PER_PAGE).map(scene => {
        const art = scene.earned ? sceneArt(scene, availableArt) : undefined
        const live = scene.earned ? null : readyLink(scene)
        return scene.earned ? <button type="button" key={scene.key} className="lib-scene" data-library-scene={scene.key}
          aria-pressed={openedScene?.key === scene.key} onClick={() => pick({ tile: openedScene?.key === scene.key ? null : scene.key })}>
          <Thumb picture={art} owner={id} /><span><strong>{scene.title}</strong><small>{libraryDate(scene.variants[0]?.day ?? scene.day ?? null, save.calendar)}</small></span>
        </button> : live ? <Link key={scene.key} className="lib-scene" data-locked data-ready to={live} state={{ back: true }}>
          <Thumb locked /><span><strong>Ready to play</strong><small>{GROUPS[scene.group]}</small></span>
        </Link> : <div key={scene.key} className="lib-scene" data-locked><Thumb locked /><span><strong>Locked scene</strong><small>{GROUPS[scene.group]}</small></span></div>
      })}
      {group === 'art' && visibleArt.map(picture => {
        if (typeof picture === 'string') return <div key={picture} className="lib-scene"><Thumb /><span><strong>Archived illustration</strong><small>{libraryDate(save.library?.[id]?.first[`art:${picture}`] ?? null, save.calendar)}</small></span></div>
        const unlocked = seen.includes(picture.id)
        return unlocked
          ? <Link key={picture.id} className="lib-scene" to={artHref(picture)} state={{ back: true }} data-library-art={picture.id}>
            <Thumb picture={picture} /><span><strong>{picture.title}</strong><small>View art ›</small></span>
          </Link>
          : <div key={picture.id} className="lib-scene" data-locked><Thumb locked /><span><strong>Locked illustration</strong></span></div>
      })}
    </div>
    {pages > 1 && <nav aria-label="Scene pages" className="lib-pagination">
      <button type="button" className="lib-button" disabled={page <= 1} aria-label="Previous scene page" onClick={() => pick({ leaf: String(page - 1), tile: null })}>‹</button>
      <span aria-live="polite">Page {page}/{pages}</span>
      <button type="button" className="lib-button" disabled={page >= pages} aria-label="Next scene page" onClick={() => pick({ leaf: String(page + 1), tile: null })}>›</button>
    </nav>}
    {openedScene && <section aria-label={openedScene.title} data-scene-details={openedScene.key} className="lib-lines">
      <h3>{openedScene.title}</h3>
      {openedScene.variants.length === 1 && openedScene.variants[0]?.script.startsWith('alt-') &&
        routeRequirements(save, pack, id, openedScene.key.slice('route:'.length)).map((reason, index) =>
          <p className="text-[13px] text-ink-soft" key={index}>{routeRequirementWords(reason, namer(master, pack), festivalsOf(pack))}</p>)}
      {openedScene.variants.length === 0 && <p>Replay unavailable.</p>}
      <div className="lib-actions">{openedScene.variants.map((entry, _, all) => <Link key={entry.key} className="lib-button" to={playHref(entry)} state={{ back: true }}
        data-replay={entry.key}>{entry.title === 'Original scene' ? (entry.day === null ? 'See original scene' : 'Replay original scene')
          : all.length > 1 ? `Replay · ${entry.title}` : 'Replay'}</Link>)}
      {(() => {
        const matched = cues?.tile === openedScene.key
          ? cues.art.flatMap(cue => sceneFor(availableArt, cue) ?? []) : []
        const fallback = sceneArt(openedScene, availableArt)
        const pictures = new Map([...matched, ...(fallback ? [fallback] : [])].map(picture => [picture.id, picture]))
        return [...pictures.values()].map(picture => <Link key={picture.id} className="lib-button" to={artHref(picture)} state={{ back: true }}>
          {pictures.size > 1 ? picture.title : 'View art ›'}
        </Link>)
      })()}</div>
    </section>}
    {replay && <Suspense fallback={null}><Replay key={replay.key} save={save} pack={pack} master={master} id={id} entry={replay}
      onClose={() => leave(withParam(location, 'scene', null))} /></Suspense>}
    {replayKey && !replay && <p role="status">Replay unavailable.</p>}
  </>
}
