// The shell (uma-kit's AppFrame, unchanged; FM18): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`). In the loop's build (F18) also End the day (`?sheet=end`) and the calendar
// (`?sheet=calendar`); F19's bin (`?sheet=bin`) and shop (`?sheet=shop`). Each is loaded when one opens. F23: while the
// roster holds fewer than three, the start's sheet covers everything, the game's first tap.
import { picksLeft } from '@farm/domain'
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { loopOn } from '../app/loop'
import { useGame } from '../save/game'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

const LoopSheets = lazy(() => import('../loop/LoopSheets'))
const StartPicks = lazy(() => import('../loop/StartPicks'))

const LOOP_PAGES: Readonly<Record<string, BarPage>> = { '/': 'farm', '/roster': 'roster', '/diary': 'diary' }
const LOOP_SHEETS = ['end', 'calendar', 'bin', 'shop'] as const
type LoopSheet = typeof LOOP_SHEETS[number]
const isLoopSheet = (sheet: string | null): sheet is LoopSheet => (LOOP_SHEETS as readonly (string | null)[]).includes(sheet)

function pageOf(pathname: string): BarPage | null {
  if (loopOn()) return LOOP_PAGES[pathname] ?? null
  return pathname === '/' || pathname.startsWith('/wilds') ? 'wilds' : pathname === '/warehouse' ? 'warehouse' : null
}

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const sheet = search.get('sheet')
  const picking = useGame((s) => s.save?.version === 3 && picksLeft(s.save) > 0)
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={pageOf(location.pathname)} />}
      overlays={
        <>
          <MenuSheet open={sheet === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />
          {loopOn() && isLoopSheet(sheet) && !picking && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
          {loopOn() && picking && <Suspense fallback={null}><StartPicks /></Suspense>}
        </>
      }
    >
      <Outlet />
    </AppFrame>
  )
}
