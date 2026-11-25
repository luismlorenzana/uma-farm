// The shell (uma-kit's AppFrame on the landscape stage, `landscape="rail-and-bar"`): the rail down the left, then the page
// under the thin bar, and the menu's panel (`?sheet=menu`). The field's screen (`/field`) is full screen: no rail and no
// bar, its own strip at the top; every sheet and scene still opens over it. The rail clears the left safe area; the page keeps clear of
// the right and bottom ones (the notch's side and the home indicator). End the day (`?sheet=end`) and calendar (`?sheet=calendar`); the bin
// (`?sheet=bin`) and shop (`?sheet=shop`); the Farm Rank (`?sheet=rank`). Each is loaded when one opens. While the
// farmer is unnamed, the name sheet covers everything, the game's first screen; then a scene due plays over everything
// (the opening, the ring bench's, then the meeting scenes: right after you introduce yourself in town). Over any
// page,
// once no scene is due: `?read=<a>-<b>:<levels>` plays a pair's conversations; the event player at `?event=`, `?ask=` or
// `?memory=`, and her Memories' album at `?album=`; the evening at `?evening=` (Tonight's picker, or her kinds sheet, the
// play and its card); the ring bench at `?sheet=bench` from the Forge's quick look; the homestead at
// `?sheet=homestead`, a night level's scene and card at `?level=<id>:<s2|s4>` and a household scene or the finale at
// `?household=<id>` (`&replay=1` from the Diary); an occasion scene at `?occasion=<id>`, from the calendar's day; her life's
// short scenes at `?life=<kind>:<id>` (the night's companion's morning greeting, moving in, the invitation to work, a meal's line); her gallery of
// illustrations at `?gallery=<id>`, from her profile; the Kitchen at `?sheet=kitchen`, the Cooking Contest's entry at
// `?sheet=contest`, and the stove at `?stove=1` while a play this session started is under way. A play at the stove left behind (the app closed mid-play, or its screen left) settles as Rough
// as the shell finds it (`kitchen-actions.ts`).
import { sceneDue } from '@farm/domain'
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { useGame } from '../save/game'
import { playHeld } from '../loop/stove-session'
import { castIds, useStory } from '../story/story'
import { FarmBar, FarmRail, railPageOf } from './Bars'

/** The field's screen: full screen, its own strip at the top, no rail. */
const FIELD_PATH = '/field'

const MenuSheet = lazy(() => import('./MenuSheet').then((module) => ({ default: module.MenuSheet })))
const SyncWarning = lazy(() => import('./SyncWarning').then(module => ({ default: module.SyncWarning })))
const OutOfActions = lazy(() => import('./OutOfActions'))
const RequestsSheet = lazy(() => import('../town/RequestsSheet'))
const LoopSheets = lazy(() => import('../loop/LoopSheets'))
const EventAgenda = lazy(() => import('../loop/EventAgenda'))
const ScenePlayer = lazy(() => import('../loop/ScenePlayer'))
const NameSheet = lazy(() => import('../loop/NameSheet'))
const PairPlayer = lazy(() => import('../loop/PairPlayer'))
const EventPlayer = lazy(() => import('../loop/EventPlayer'))
const Memories = lazy(() => import('../loop/Memories'))
const EveningPlayer = lazy(() => import('../loop/EveningPlayer'))
const ForgeSheet = lazy(() => import('../loop/ForgeSheet'))
const BenchSheet = lazy(() => import('../loop/BenchSheet'))
const HomesteadSheet = lazy(() => import('../loop/HomesteadSheet'))
const NightLevel = lazy(() => import('../loop/NightLevel'))
const HouseholdPlayer = lazy(() => import('../loop/HouseholdPlayer'))
const OccasionPlayer = lazy(() => import('../loop/OccasionPlayer'))
const LifePlayer = lazy(() => import('../loop/LifeScene'))
const NightVisits = lazy(() => import('../loop/NightVisits'))
const Gallery = lazy(() => import('../loop/Gallery'))
const KitchenSheet = lazy(() => import('../loop/KitchenSheet'))
const RestaurantSheet = lazy(() => import('../loop/RestaurantSheet'))
const ContestSheet = lazy(() => import('../loop/Contest'))
const FestivalSheet = lazy(() => import('../loop/FestivalSheet'))
const StovePlayer = lazy(() => import('../loop/StovePlayer'))

const SHEETS = ['end', 'calendar', 'bin', 'shop', 'rank', 'next'] as const
type LoopSheet = typeof SHEETS[number]
const isLoopSheet = (sheet: string | null): sheet is LoopSheet => (SHEETS as readonly (string | null)[]).includes(sheet)

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const sheet = search.get('sheet')
  const naming = useGame((s) => s.save?.farmer.name === '')
  useStory() // a scene's order waits for the pack
  const scene = useGame((s) => (s.save ? sceneDue(s.save, castIds()) : null))
  const read = search.get('read')
  const playing = search.get('event') ?? search.get('ask') ?? search.get('memory')
  const album = search.get('album')
  const evening = search.get('evening')
  const level = search.get('level')
  const household = search.get('household')
  const occasion = search.get('occasion')
  const life = search.get('life')
  const visitReplay = search.get('visitReplay')
  const visitMorning = search.has('visitMorning')
  const visits = search.has('visits')
  const gallery = search.get('gallery')
  const farm = useGame((s) => s.save !== null)
  const free = farm && !naming && !scene
  // A play at the stove left behind (the app closed mid-play, or its screen left) settles as Rough.
  const stove = search.get('stove')
  const underWay = useGame((s) => s.save?.workshops.current?.seed ?? null)
  useEffect(() => {
    if (underWay === null || playHeld(underWay)) return
    void import('../loop/kitchen-actions').then((m) => m.settleLeftPlay()).catch(() => undefined)
  }, [underWay, stove])
  return (
    <AppFrame
      landscape="rail-and-bar"
      fullScreen={location.pathname === FIELD_PATH || (location.pathname === '/town' && search.get('view') !== 'people')}
      top={<FarmBar />}
      bottom={<FarmRail page={railPageOf(location.pathname)} />}
      overlays={
        <>
          {sheet === 'menu' && <Suspense fallback={null}><MenuSheet open onClose={() => leave(withParam(location, 'sheet', null))} /></Suspense>}
          {free && <Suspense fallback={null}><OutOfActions /></Suspense>}
          {isLoopSheet(sheet) && !naming && !scene && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
          {naming && <Suspense fallback={null}><NameSheet /></Suspense>}
          {scene && <Suspense fallback={null}><ScenePlayer key={scene} scene={scene} /></Suspense>}
          {read && free && <Suspense fallback={null}><PairPlayer key={read} read={read} /></Suspense>}
          {album && free && <Suspense fallback={null}><Memories key={album} /></Suspense>}
          {playing && free && !read && <Suspense fallback={null}><EventPlayer key={playing} /></Suspense>}
          {evening && free && !read && !playing && <Suspense fallback={null}><EveningPlayer key={evening} /></Suspense>}
          {sheet === 'forge' && free && <Suspense fallback={null}><ForgeSheet /></Suspense>}
          {sheet === 'bench' && free && <Suspense fallback={null}><BenchSheet /></Suspense>}
          {sheet === 'homestead' && free && <Suspense fallback={null}><HomesteadSheet /></Suspense>}
          {level && free && !read && !playing && <Suspense fallback={null}><NightLevel key={level} value={level} /></Suspense>}
          {household && free && !read && !playing && <Suspense fallback={null}><HouseholdPlayer key={household} value={household} replay={search.get('replay') === '1'} /></Suspense>}
          {occasion && free && !read && !playing && <Suspense fallback={null}><OccasionPlayer key={occasion + ':' + (search.get('occasionId') ?? '')} id={occasion} /></Suspense>}
          {life && free && !read && !playing && <Suspense fallback={null}><LifePlayer key={life} value={life} /></Suspense>}
          {(visits || visitReplay || visitMorning) && free && !read && !playing && <Suspense fallback={null}>
            <NightVisits key={visitReplay ?? (visitMorning ? 'morning' : 'tonight')} replay={visitReplay} morning={visitMorning} />
          </Suspense>}
          {gallery && free && !read && !playing && <Suspense fallback={null}><Gallery key={gallery} id={gallery} /></Suspense>}
          {sheet === 'kitchen' && free && <Suspense fallback={null}><KitchenSheet /></Suspense>}
          {sheet === 'requests' && free && <Suspense fallback={null}><RequestsSheet /></Suspense>}
          {sheet === 'restaurant' && free && <Suspense fallback={null}><RestaurantSheet /></Suspense>}
          {sheet === 'events' && free && <Suspense fallback={null}><EventAgenda key={search.get('eventDay') ?? 'today'} /></Suspense>}
          {sheet === 'contest' && free && <Suspense fallback={null}><ContestSheet /></Suspense>}
          {sheet === 'festival' && free && <Suspense fallback={null}><FestivalSheet /></Suspense>}
          {stove && free && <Suspense fallback={null}><StovePlayer key={stove} /></Suspense>}
        </>
      }
    >
      <div className="flex h-full flex-col" data-farm-frame>
        <Suspense fallback={null}><SyncWarning /></Suspense>
        <div className="pr-safe pb-safe relative min-h-0 flex-1">
          <div className="relative h-full" data-farm-page>
            <Outlet />
          </div>
        </div>
      </div>
    </AppFrame>
  )
}
