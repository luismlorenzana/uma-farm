// The shell (uma-kit's AppFrame, unchanged; FM18): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`).
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const page: BarPage | null = location.pathname === '/' || location.pathname.startsWith('/wilds') ? 'wilds' : location.pathname === '/warehouse' ? 'warehouse' : null
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={page} />}
      overlays={<MenuSheet open={search.get('sheet') === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />}
    >
      <Outlet />
    </AppFrame>
  )
}
