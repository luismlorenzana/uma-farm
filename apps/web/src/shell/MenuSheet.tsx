// The menu, "Every place" (uma-kit's PlaceMenu, as uma-rpg's). The Wilds (F5): the fifteen places in map order with their
// Ready counts, each opening its quick look; the Forge and the Post, locked until they open; then the Warehouse and the
// Account, and the build at the foot. The loop's build (F18): the farm's 23 places by FC28's rows, locked ones marked,
// Account, and the switch "Ask before ending the day" (decision 10). `?sheet=menu` on the route it opens over, so Back
// closes it.
import { FARM_PLACES, loopReadyWork, wildsPlaces, type FarmPlaceGroup, type LoopPlaceId, type SaveV3 } from '@farm/domain'
import { PlaceMenu, type MenuGroup } from '@luismlorenzana/uma-kit/shell'
import { Sheet } from '@luismlorenzana/uma-kit/ui'
import { APP_BUILD_ID } from '../app/build'
import { loopOn } from '../app/loop'
import { setAskBeforeEnd, useAskBeforeEnd } from '../loop/ask'
import { lockOf, placeLink } from '../loop/farm-map'
import { useLoopSave, useWildsSave } from '../save/game'
import { readySlots } from '../wilds/ready'
import { SOON_PLACES } from '../wilds/soon'
import { useNow } from './useNow'

const ACCOUNT = { key: 'account', name: 'Account', to: '/account' }

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Every place">
      {loopOn() ? <LoopMenu /> : <WildsMenu />}
      <p className="mt-4 text-center text-[12px] text-ink-faint">Build {APP_BUILD_ID}</p>
    </Sheet>
  )
}

function WildsMenu() {
  const save = useWildsSave()
  const now = useNow(15_000)
  const ready = readySlots(save, now)
  const groups: MenuGroup[] = [
    { key: 'wilds', label: 'Wilds', places: wildsPlaces().map((p) => ({ key: p.id, name: p.name, to: `/?peek=${p.id}`, count: ready.get(p.id) ?? 0 })) },
    { key: 'soon', label: 'Soon', places: SOON_PLACES.map((p) => ({ key: p.id, name: p.name, to: `/?peek=${p.id}`, locked: true })) },
  ]
  return <PlaceMenu groups={groups} extra={[{ key: 'warehouse', name: 'Warehouse', to: '/warehouse' }, ACCOUNT]} />
}

const GROUPS: readonly { group: FarmPlaceGroup; label: string }[] = [
  { group: 'gathering', label: 'Gathering' }, { group: 'station', label: 'Stations' }, { group: 'ranch', label: 'The ranch' },
  { group: 'workshop', label: 'Workshops' }, { group: 'yard', label: 'The yard' }, { group: 'town', label: 'The town' },
]

/** The farm's places by FC28's rows, each opening its screen once it's landed (F19: the bin, the Warehouse, the shop), else
 * its quick look on the map. */
export function loopMenuGroups(save: SaveV3 | null): MenuGroup[] {
  const ready = save ? loopReadyWork(save) : new Map<LoopPlaceId, number>()
  return GROUPS.map(({ group, label }) => ({
    key: group, label,
    places: FARM_PLACES.filter((p) => p.group === group).map((p) => ({
      key: p.id, name: p.name, to: save ? placeLink(save, p) : `/?peek=${p.id}`, count: ready.get(p.id as LoopPlaceId) ?? 0, locked: !save || lockOf(save, p) !== null,
    })),
  }))
}

function LoopMenu() {
  const save = useLoopSave()
  const ask = useAskBeforeEnd()
  return (
    <>
      <PlaceMenu groups={loopMenuGroups(save)} extra={[ACCOUNT]} />
      <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-1" data-setting="ask-end-day">
        <span className="text-[14px] font-semibold">Ask before ending the day</span>
        {/* A 44 pt target around the track, as the Notifications switch. */}
        <button type="button" role="switch" aria-checked={ask} aria-label="Ask before ending the day" onClick={() => setAskBeforeEnd(!ask)}
          className="flex h-11 w-16 shrink-0 items-center justify-center">
          <span className={`relative h-8 w-14 rounded-full transition-colors ${ask ? 'bg-accent' : 'bg-sunken'}`}>
            <span className={`absolute top-1 size-6 rounded-full bg-white shadow-2 transition-all ${ask ? 'left-7' : 'left-1'}`} />
          </span>
        </button>
      </div>
    </>
  )
}
