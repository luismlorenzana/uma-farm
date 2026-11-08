// The menu, "Every place" (uma-kit's PlaceMenu, as uma-rpg's): the Wilds' fifteen places in map order with their Ready
// counts, each opening its quick look; the Forge and the Post, locked until they open; then the Warehouse and the
// Account, and the build at the foot. `?sheet=menu` on the route it opens over, so Back closes it.
import { wildsPlaces } from '@farm/domain'
import { PlaceMenu, type MenuGroup } from '@luismlorenzana/uma-kit/shell'
import { Sheet } from '@luismlorenzana/uma-kit/ui'
import { APP_BUILD_ID } from '../app/build'
import { useGame } from '../save/game'
import { readySlots } from '../wilds/ready'
import { SOON_PLACES } from '../wilds/soon'
import { useNow } from './useNow'

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const save = useGame((s) => s.save)
  const now = useNow(15_000)
  const ready = readySlots(save, now)
  const groups: MenuGroup[] = [
    { key: 'wilds', label: 'Wilds', places: wildsPlaces().map((p) => ({ key: p.id, name: p.name, to: `/?peek=${p.id}`, count: ready.get(p.id) ?? 0 })) },
    { key: 'soon', label: 'Soon', places: SOON_PLACES.map((p) => ({ key: p.id, name: p.name, to: `/?peek=${p.id}`, locked: true })) },
  ]
  return (
    <Sheet open={open} onClose={onClose} title="Every place">
      <PlaceMenu groups={groups} extra={[{ key: 'warehouse', name: 'Warehouse', to: '/warehouse' }, { key: 'account', name: 'Account', to: '/account' }]} />
      <p className="mt-4 text-center text-[12px] text-ink-faint">Build {APP_BUILD_ID}</p>
    </Sheet>
  )
}
