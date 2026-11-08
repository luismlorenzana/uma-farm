// The pages (F3): Home and Account inside the shell. F5 adds the Wilds' places and the Warehouse.
import { createBrowserRouter, Navigate } from 'react-router'
import { AccountView } from '../home/AccountView'
import { HomePage } from '../home/HomePage'
import { Shell } from '../shell/Shell'
import { Root } from './Root'

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'account', element: <AccountView /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
