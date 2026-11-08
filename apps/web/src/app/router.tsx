// The pages (F3, F5), inside the shell: `/` the Wilds (`?peek=:placeId` a place's quick look), `/wilds/:placeId` a place's
// page, `/warehouse` and `/account`. The Wilds map, the work pages and the Warehouse load on demand; anything else goes
// to the Wilds.
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AccountView } from '../home/AccountView'
import { PlaceRoute } from '../places/PlacePage'
import { Shell } from '../shell/Shell'
import { Root } from './Root'

const WildsRoute = lazy(() => import('../wilds/WildsScreen'))
const WarehousePage = lazy(() => import('../places/warehouse/WarehousePage'))

const loading = (page: ReactNode) => <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>{page}</Suspense>

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: loading(<WildsRoute />) },
          { path: 'wilds', element: <Navigate to="/" replace /> },
          { path: 'wilds/:placeId', element: <PlaceRoute /> },
          { path: 'warehouse', element: loading(<WarehousePage />) },
          { path: 'account', element: <AccountView /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
