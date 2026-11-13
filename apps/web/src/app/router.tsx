// The pages, inside the shell: `/` the farm map (`?peek=<place>` a quick look), the Hearts tab `/hearts` (`?view=work`
// the roster's album, `?uma=` her profile), `/diary` and `/account`; the Warehouse by stars, `/warehouse` (`?pick=bin`
// to ship from it); the Fields, `/fields`; the forest, Fishery and stations, `/forest`, `/fishery`, `/mill`, `/sawmill`,
// `/smokehouse`; and the Dorm, `/dorm`. `/roster` lands on the Hearts tab's Work view. Every page but Account loads on
// demand; anything else goes to the farm.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router'
import { AccountView } from '../home/AccountView'
import { Shell } from '../shell/Shell'
import { Root } from './Root'

const FarmMap = lazy(() => import('../loop/FarmMap'))
const HeartsPage = lazy(() => import('../loop/HeartsPage'))
const DiaryPage = lazy(() => import('../loop/DiaryPage'))
const WarehousePage = lazy(() => import('../loop/WarehousePage'))
const FieldsPage = lazy(() => import('../loop/FieldsPage'))
const WorkPlace = lazy(() => import('../loop/WorkPlace'))
const DormPage = lazy(() => import('../loop/DormPage'))

const loading = (page: ReactNode) => <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>{page}</Suspense>
const work = (place: 'forest' | 'fishery' | 'mill' | 'sawmill' | 'smokehouse'): RouteObject => ({ path: place, element: loading(<WorkPlace key={place} place={place} />) })

/** `/roster`: the Hearts tab's Work view, her `?uma=` kept. */
function RosterRoute() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  params.delete('view')
  const rest = params.toString()
  return <Navigate to={`/hearts?view=work${rest ? `&${rest}` : ''}`} replace state={location.state} />
}
export const ROUTES: RouteObject[] = [
  { index: true, element: loading(<FarmMap />) },
  work('forest'), work('fishery'), work('mill'), work('sawmill'), work('smokehouse'),
  { path: 'roster', element: <RosterRoute /> },
  { path: 'hearts', element: loading(<HeartsPage />) },
  { path: 'diary', element: loading(<DiaryPage />) },
  { path: 'warehouse', element: loading(<WarehousePage />) },
  { path: 'fields', element: loading(<FieldsPage />) },
  { path: 'dorm', element: loading(<DormPage />) },
  { path: 'account', element: <AccountView /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [{ element: <Shell />, children: ROUTES }],
  },
])
