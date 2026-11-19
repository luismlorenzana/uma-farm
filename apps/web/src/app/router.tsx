// The pages, inside the shell: `/` the farm map (`?peek=<place>` a quick look: the woods' edge, the pond's, a station);
// `/field` the field's screen, full screen, a plot a page (`?plot=<n>`, `?tile=<i>` a tile's actions, `?row=<r>` a
// row's); the Hearts tab `/hearts` (`?view=work` the roster's album, `?uma=` her profile), `/diary` and `/account`; the Warehouse by stars, `/warehouse` (`?pick=bin` to pick a crate to ship); the
// Town, `/town` (`?view=people` the People list); and the farm's book, `/book`. `/roster` lands on the
// Hearts tab's Work view. Every page but Account loads on demand; anything else goes to the farm.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation, type RouteObject } from 'react-router'
import { Shell } from '../shell/Shell'
import { Root } from './Root'

const FarmMap = lazy(() => import('../loop/FarmMap'))
const FieldScreen = lazy(() => import('../loop/FieldScreen'))
const HeartsPage = lazy(() => import('../loop/HeartsPage'))
const LibraryPage = lazy(() => import('../library/LibraryPage'))
const DiaryPage = lazy(() => import('../loop/DiaryPage'))
const WarehousePage = lazy(() => import('../loop/WarehousePage'))
const TownPage = lazy(() => import('../town/TownPage'))
const BookPage = lazy(() => import('../book/BookPage'))
const AccountView = lazy(() => import('../home/AccountView').then(module => ({ default: module.AccountView })))

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
  { path: 'field', element: loading(<FieldScreen />) },
  { path: 'roster', element: <RosterRoute /> },
  { path: 'hearts', element: loading(<HeartsPage />) },
  { path: 'library', element: loading(<LibraryPage />) },
  { path: 'diary', element: loading(<DiaryPage />) },
  { path: 'warehouse', element: loading(<WarehousePage />) },
  { path: 'town', element: loading(<TownPage />) },
  { path: 'book', element: loading(<BookPage />) },
  { path: 'account', element: loading(<AccountView />) },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [{ element: <Shell />, children: ROUTES }],
  },
])
