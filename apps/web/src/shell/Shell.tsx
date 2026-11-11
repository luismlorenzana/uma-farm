// The shell (uma-kit's AppFrame, unchanged; FM18): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`). F18's End the day (`?sheet=end`) and calendar (`?sheet=calendar`); F19's bin
// (`?sheet=bin`) and shop (`?sheet=shop`); F24's Farm Rank (`?sheet=rank`). Each is loaded when one opens. While the
// roster holds fewer than three, the start's sheet covers everything, the game's first tap (F23); then a scene due plays
// over everything (F24: the opening scene after the picks, the closing scene the morning after chapter 1). On save v4
// (F46) the farmer's name sheet is the first screen instead, and arrival scenes play after the chapter's.
import { picksLeft, sceneDue } from '@farm/domain'
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { useGame } from '../save/game'
import { castIds, useStory } from '../story/story'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

const LoopSheets = lazy(() => import('../loop/LoopSheets'))
const StartPicks = lazy(() => import('../loop/StartPicks'))
const ScenePlayer = lazy(() => import('../loop/ScenePlayer'))
const NameSheet = lazy(() => import('../loop/NameSheet'))

const PAGES: Readonly<Record<string, BarPage>> = { '/': 'farm', '/roster': 'roster', '/diary': 'diary' }
const SHEETS = ['end', 'calendar', 'bin', 'shop', 'rank'] as const
type LoopSheet = typeof SHEETS[number]
const isLoopSheet = (sheet: string | null): sheet is LoopSheet => (SHEETS as readonly (string | null)[]).includes(sheet)

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const sheet = search.get('sheet')
  const picking = useGame((s) => s.save?.version === 3 && picksLeft(s.save) > 0)
  const naming = useGame((s) => s.save?.version === 4 && s.save.farmer.name === '')
  useStory() // a scene's order waits for the pack (v4)
  const scene = useGame((s) => (s.save ? sceneDue(s.save, castIds()) : null))
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={PAGES[location.pathname] ?? null} />}
      overlays={
        <>
          <MenuSheet open={sheet === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />
          {isLoopSheet(sheet) && !picking && !naming && !scene && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
          {picking && <Suspense fallback={null}><StartPicks /></Suspense>}
          {naming && <Suspense fallback={null}><NameSheet /></Suspense>}
          {scene && <Suspense fallback={null}><ScenePlayer key={scene} scene={scene} /></Suspense>}
        </>
      }
    >
      <Outlet />
    </AppFrame>
  )
}
