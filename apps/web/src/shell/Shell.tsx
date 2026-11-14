// The shell (uma-kit's AppFrame, unchanged): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`). End the day (`?sheet=end`) and calendar (`?sheet=calendar`); the bin
// (`?sheet=bin`) and shop (`?sheet=shop`); the Farm Rank (`?sheet=rank`). Each is loaded when one opens. While the
// farmer is unnamed, the name sheet covers everything, the game's first screen; then a scene due plays over everything
// (the opening, the ring bench's, then the arrival scenes). Over any page,
// once no scene is due: `?read=<a>-<b>:<levels>` plays a pair's conversations; the event player at `?event=`, `?ask=` or
// `?memory=`, and her Memories' album at `?album=`; the evening at `?evening=` (Tonight's picker, or her kinds sheet, the
// play and its card); the ring bench at `?sheet=bench` from the Forge's quick look; the homestead at
// `?sheet=homestead`, a night level's card at `?level=<id>:<s2|s4>` and a household scene or the finale at
// `?household=<id>` (`&replay=1` from the Diary).
import { sceneDue } from '@farm/domain'
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { useGame } from '../save/game'
import { castIds, useStory } from '../story/story'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

const LoopSheets = lazy(() => import('../loop/LoopSheets'))
const ScenePlayer = lazy(() => import('../loop/ScenePlayer'))
const NameSheet = lazy(() => import('../loop/NameSheet'))
const PairPlayer = lazy(() => import('../loop/PairPlayer'))
const EventPlayer = lazy(() => import('../loop/EventPlayer'))
const Memories = lazy(() => import('../loop/Memories'))
const EveningPlayer = lazy(() => import('../loop/EveningPlayer'))
const BenchSheet = lazy(() => import('../loop/BenchSheet'))
const HomesteadSheet = lazy(() => import('../loop/HomesteadSheet'))
const NightLevel = lazy(() => import('../loop/NightLevel'))
const HouseholdPlayer = lazy(() => import('../loop/HouseholdPlayer'))

const PAGES: Readonly<Record<string, BarPage>> = { '/': 'farm', '/hearts': 'hearts', '/diary': 'diary' }
const SHEETS = ['end', 'calendar', 'bin', 'shop', 'rank'] as const
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
  const farm = useGame((s) => s.save !== null)
  const free = farm && !naming && !scene
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={PAGES[location.pathname] ?? null} />}
      overlays={
        <>
          <MenuSheet open={sheet === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />
          {isLoopSheet(sheet) && !naming && !scene && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
          {naming && <Suspense fallback={null}><NameSheet /></Suspense>}
          {scene && <Suspense fallback={null}><ScenePlayer key={scene} scene={scene} /></Suspense>}
          {read && free && <Suspense fallback={null}><PairPlayer key={read} read={read} /></Suspense>}
          {album && free && <Suspense fallback={null}><Memories key={album} /></Suspense>}
          {playing && free && !read && <Suspense fallback={null}><EventPlayer key={playing} /></Suspense>}
          {evening && free && !read && !playing && <Suspense fallback={null}><EveningPlayer key={evening} /></Suspense>}
          {sheet === 'bench' && free && <Suspense fallback={null}><BenchSheet /></Suspense>}
          {sheet === 'homestead' && free && <Suspense fallback={null}><HomesteadSheet /></Suspense>}
          {level && free && !read && !playing && <Suspense fallback={null}><NightLevel key={level} value={level} /></Suspense>}
          {household && free && !read && !playing && <Suspense fallback={null}><HouseholdPlayer key={household} value={household} replay={search.get('replay') === '1'} /></Suspense>}
        </>
      }
    >
      <Outlet />
    </AppFrame>
  )
}
