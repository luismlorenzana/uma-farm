// The menu (uma-kit's PlaceMenu): every place, then the Account, and the build at the foot. `?sheet=menu` on the route it
// opens over, so Back closes it.
import { PlaceMenu } from '@luismlorenzana/uma-kit/shell'
import { Sheet } from '@luismlorenzana/uma-kit/ui'
import { APP_BUILD_ID } from '../app/build'

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Every place">
      <PlaceMenu groups={[{ key: 'farm', label: 'Farm', places: [{ key: 'home', name: 'Home', to: '/' }] }]}
        extra={[{ key: 'account', name: 'Account', to: '/account' }]} />
      <p className="mt-4 text-center text-[12px] text-ink-faint">Build {APP_BUILD_ID}</p>
    </Sheet>
  )
}
