// The pages (F18–F24), inside the shell: `/` the farm map (`?peek=<place>` a quick look), `/roster`, `/diary` and
// `/account`; F19's Warehouse by stars, `/warehouse` (`?pick=bin` to ship from it); F20's Fields, `/fields`; F22's
// forest, Fishery and stations, `/forest`, `/fishery`, `/mill`, `/sawmill`, `/smokehouse`; and F23's Dorm, `/dorm`. Every
// page but Account loads on demand; anything else (the Wilds' old `/wilds/<place>` among them) goes to the farm. The romance
// build's Hearts tab is `/hearts` (`?view=work` the roster's album, `?uma=` her profile, F48 decision 2), and there
// `/roster` lands on the Work view; the M4 build keeps `/roster` and has no `/hearts`.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router'
import { AccountView } from '../home/AccountView'
import { Shell } from '../shell/Shell'
import { romanceOn } from './romance'
import { Root } from './Root'

const FarmMap = lazy(() => import('../loop/FarmMap'))
// Each build keeps only its own Umas' page: the switch folds at build time, and the unused page's import is dropped.
const RosterPage = /* @__PURE__ */ lazy(() => import('../loop/RosterPage'))
const HeartsPage = /* @__PURE__ */ lazy(() => import('../loop/HeartsPage'))
const DiaryPage = lazy(() => import('../loop/DiaryPage'))
const WarehousePage = lazy(() => import('../loop/WarehousePage'))
const FieldsPage = lazy(() => import('../loop/FieldsPage'))
const WorkPlace = lazy(() => import('../loop/WorkPlace'))
const DormPage = lazy(() => import('../loop/DormPage'))

const loading = (page: ReactNode) => <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>{page}</Suspense>
const work = (place: 'forest' | 'fishery' | 'mill' | 'sawmill' | 'smokehouse'): RouteObject => ({ path: place, element: loading(<WorkPlace key={place} place={place} />) })

/** `/roster`: M4's page, or in the romance build the Hearts tab's Work view, her `?uma=` kept. */
function RosterRoute() {
  const location = useLocation()
  if (!romanceOn()) return loading(<RosterPage />)
  const params = new URLSearchParams(location.search)
  params.delete('view')
  const rest = params.toString()
  return <Navigate to={`/hearts?view=work${rest ? `&${rest}` : ''}`} replace state={location.state} />
}
/** `/hearts`: the romance build's only. */
const HeartsRoute = () => (romanceOn() ? loading(<HeartsPage />) : <Navigate to="/" replace />)

export const ROUTES: RouteObject[] = [
  { index: true, element: loading(<FarmMap />) },
  work('forest'), work('fishery'), work('mill'), work('sawmill'), work('smokehouse'),
  { path: 'roster', element: <RosterRoute /> },
  { path: 'hearts', element: <HeartsRoute /> },
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
