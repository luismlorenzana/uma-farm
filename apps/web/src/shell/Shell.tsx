// The shell (uma-kit's AppFrame, unchanged; FM18): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`). In the loop's build (F18) also End the day (`?sheet=end`) and the calendar
// (`?sheet=calendar`), loaded when one opens.
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { loopOn } from '../app/loop'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

const LoopSheets = lazy(() => import('../loop/LoopSheets'))

const LOOP_PAGES: Readonly<Record<string, BarPage>> = { '/': 'farm', '/roster': 'roster', '/diary': 'diary' }

function pageOf(pathname: string): BarPage | null {
  if (loopOn()) return LOOP_PAGES[pathname] ?? null
  return pathname === '/' || pathname.startsWith('/wilds') ? 'wilds' : pathname === '/warehouse' ? 'warehouse' : null
}

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const sheet = search.get('sheet')
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={pageOf(location.pathname)} />}
      overlays={
        <>
          <MenuSheet open={sheet === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />
          {loopOn() && (sheet === 'end' || sheet === 'calendar') && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
        </>
      }
    >
      <Outlet />
    </AppFrame>
  )
}
