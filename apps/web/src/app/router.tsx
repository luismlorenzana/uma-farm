// The pages, inside the shell: `/` the farm map (`?tile=<n>` a tile's actions, `?peek=<place>` a quick look: the woods'
// edge, the pond's, a station), the Hearts tab `/hearts` (`?view=work` the roster's album, `?uma=` her profile),
// `/diary` and `/account`; the Warehouse by stars, `/warehouse` (`?pick=bin` to pick a crate to ship); the Dorm,
// `/dorm`; the Town, `/town` (`?view=people` the People list); and the farm's book, `/book`. `/roster` lands on the
// Hearts tab's Work view. Every page but Account loads on demand; anything else goes to the farm.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router'
import { AccountView } from '../home/AccountView'
import { Shell } from '../shell/Shell'
import { Root } from './Root'

const FarmMap = lazy(() => import('../loop/FarmMap'))
const HeartsPage = lazy(() => import('../loop/HeartsPage'))
const DiaryPage = lazy(() => import('../loop/DiaryPage'))
const WarehousePage = lazy(() => import('../loop/WarehousePage'))
const DormPage = lazy(() => import('../loop/DormPage'))
const TownPage = lazy(() => import('../town/TownPage'))
const BookPage = lazy(() => import('../book/BookPage'))

const loading = (page: ReactNode) => <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>{page}</Suspense>

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
  { path: 'roster', element: <RosterRoute /> },
  { path: 'hearts', element: loading(<HeartsPage />) },
  { path: 'diary', element: loading(<DiaryPage />) },
  { path: 'warehouse', element: loading(<WarehousePage />) },
  { path: 'dorm', element: loading(<DormPage />) },
  { path: 'town', element: loading(<TownPage />) },
  { path: 'book', element: loading(<BookPage />) },
  { path: 'account', element: <AccountView /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [{ element: <Shell />, children: ROUTES }],
  },
])
