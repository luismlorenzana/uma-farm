// The farm's top and bottom bars on uma-kit (as uma-rpg's): the account's initial, which opens Account, and the sync chip.
// No currencies yet. The bottom bar holds Home and the menu; F5 adds the Wilds and the Warehouse.
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountBar, BottomBar, withParam, type BarTab } from '@luismlorenzana/uma-kit/shell'
import { HomeIcon } from '@luismlorenzana/uma-kit/ui'
import { useLocation } from 'react-router'
import { useGame } from '../save/game'

export function FarmAccountBar() {
  const auth = useAuth()
  const sync = useGame((s) => s.sync)
  const name = auth.user?.name ?? auth.user?.email ?? 'Farm'
  return (
    <AccountBar
      initial={name.slice(0, 1).toUpperCase()}
      account={{ to: '/account', label: `Account: ${name}` }}
      chips={[]}
      sync={sync === 'offline' ? { state: 'offline', text: 'Offline', label: 'Offline: changes sync when you’re back', to: '/account' }
        : sync === 'error' ? { state: 'paused', text: 'Sync paused', label: 'Sync paused', to: '/account' } : undefined}
    />
  )
}

export function FarmBottomBar({ page }: { page: 'home' | null }) {
  const location = useLocation()
  const tabs: BarTab[] = [{ key: 'home', to: '/', label: 'Home', Icon: HomeIcon, active: page === 'home' }]
  return <BottomBar label="Pages" tabs={tabs} menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
}
