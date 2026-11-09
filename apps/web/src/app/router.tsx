// The pages (F3, F5), inside the shell: `/` the Wilds (`?peek=:placeId` a place's quick look), `/wilds/:placeId` a place's
// page, `/warehouse` and `/account`. The Wilds map, the work pages and the Warehouse load on demand; anything else goes
// to the Wilds. The loop's build (F17, D29) has the bottom bar's pages (F18): `/` the farm (`?peek=<place>` a quick look),
// `/roster`, `/diary` and `/account`; F19's Warehouse by stars, `/warehouse` (`?pick=bin` to ship from it); F20's
// Fields, `/fields`; F22's forest, Fishery and stations, `/forest`, `/fishery`, `/mill`, `/sawmill`, `/smokehouse`; and
// F23's Dorm, `/dorm`.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AccountView } from '../home/AccountView'
import { PlaceRoute } from '../places/PlacePage'
import { Shell } from '../shell/Shell'
import { loopOn } from './loop'
import { Root } from './Root'

const WildsRoute = lazy(() => import('../wilds/WildsScreen'))
const WarehousePage = lazy(() => import('../places/warehouse/WarehousePage'))

const loading = (page: ReactNode) => <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>{page}</Suspense>

const WILDS: RouteObject[] = [
  { index: true, element: loading(<WildsRoute />) },
  { path: 'wilds', element: <Navigate to="/" replace /> },
  { path: 'wilds/:placeId', element: <PlaceRoute /> },
  { path: 'warehouse', element: loading(<WarehousePage />) },
  { path: 'account', element: <AccountView /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

/** The loop's pages, made only in its build, so the deployed one carries none of them. */
function loopRoutes(): RouteObject[] {
  const FarmMap = lazy(() => import('../loop/FarmMap'))
  const RosterPage = lazy(() => import('../loop/RosterPage'))
  const DiaryPage = lazy(() => import('../loop/DiaryPage'))
  const LoopWarehouse = lazy(() => import('../loop/WarehousePage'))
  const FieldsPage = lazy(() => import('../loop/FieldsPage'))
  const WorkPlace = lazy(() => import('../loop/WorkPlace'))
  const DormPage = lazy(() => import('../loop/DormPage'))
  const work = (place: 'forest' | 'fishery' | 'mill' | 'sawmill' | 'smokehouse'): RouteObject => ({ path: place, element: loading(<WorkPlace key={place} place={place} />) })
  return [
    { index: true, element: loading(<FarmMap />) },
    work('forest'), work('fishery'), work('mill'), work('sawmill'), work('smokehouse'),
    { path: 'roster', element: loading(<RosterPage />) },
    { path: 'diary', element: loading(<DiaryPage />) },
    { path: 'warehouse', element: loading(<LoopWarehouse />) },
    { path: 'fields', element: loading(<FieldsPage />) },
    { path: 'dorm', element: loading(<DormPage />) },
    { path: 'account', element: <AccountView /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ]
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [{ element: <Shell />, children: loopOn() ? loopRoutes() : WILDS }],
  },
])
