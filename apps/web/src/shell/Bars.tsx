// The farm's top and bottom bars on uma-kit (as uma-rpg's): the account's initial, which opens Account, and the sync chip.
// No currencies. The bottom bar holds the Wilds, with its Ready count, the Warehouse and the menu (F5).
import { useAuth } from '@luismlorenzana/uma-kit/auth'
import { AccountBar, BottomBar, withParam, type BarTab } from '@luismlorenzana/uma-kit/shell'
import { PickaxeIcon, ViewGridIcon } from '@luismlorenzana/uma-kit/ui'
import { useLocation } from 'react-router'
import { useGame } from '../save/game'
import { readyTotal } from '../wilds/ready'
import { useNow } from './useNow'

export type BarPage = 'wilds' | 'warehouse'

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

export function FarmBottomBar({ page }: { page: BarPage | null }) {
  const location = useLocation()
  const save = useGame((s) => s.save)
  const now = useNow(15_000)
  const ready = readyTotal(save, now)
  const tabs: BarTab[] = [
    { key: 'wilds', to: '/', label: 'Wilds', Icon: PickaxeIcon, active: page === 'wilds', badge: ready, badgeLabel: `Wilds, ${ready} ready` },
    { key: 'warehouse', to: '/warehouse', label: 'Warehouse', Icon: ViewGridIcon, active: page === 'warehouse' },
  ]
  return <BottomBar label="Pages" tabs={tabs} menu={{ to: withParam(location, 'sheet', 'menu'), label: 'Every place', text: 'Menu' }} />
}
