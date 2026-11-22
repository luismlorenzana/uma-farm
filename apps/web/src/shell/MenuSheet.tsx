// The menu, "Every place" (uma-kit's PlaceMenu, as uma-rpg's): the farm's places by kind, locked ones marked, the field
// with its ripe tiles, then Account and the switch "Ask before ending the day", and the
// build at the foot. `?sheet=menu` on the route it opens over, so Back closes it.
import { MAP_PLACES, readyTiles, type FarmPlaceGroup, type FarmSave } from '@farm/domain'
import { PlaceMenu, type MenuGroup } from '@luismlorenzana/uma-kit/shell'
import { Sheet } from '@luismlorenzana/uma-kit/ui'
import { APP_BUILD_ID } from '../app/build'
import { setAskBeforeEnd, useAskBeforeEnd } from '../loop/ask'
import { lockOf, placeLink } from '../loop/farm-map'
import { useLoopSave } from '../save/game'

const ACCOUNT = { key: 'account', name: 'Account', to: '/account' }
const NEXT = { key: 'next', name: 'What Next?', to: '/?sheet=next' }
const GUIDES = { key: 'guide', name: 'Farm guides', to: '/guide' }

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Every place">
      <LoopMenu />
      <p className="mt-4 text-center text-[12px] text-ink-faint">Build {APP_BUILD_ID}</p>
    </Sheet>
  )
}

const GROUPS: readonly { group: FarmPlaceGroup; label: string }[] = [
  { group: 'gathering', label: 'Gathering' }, { group: 'station', label: 'Stations' }, { group: 'ranch', label: 'The ranch' },
  { group: 'workshop', label: 'Workshops' }, { group: 'yard', label: 'The yard' }, { group: 'town', label: 'The town' },
]

/** The farm's places by kind, each opening its screen once it's landed (the bin, the Warehouse, the shop; the woods'
 * edge, the pond's and a station's menus), else its quick look on the map. The Fields count their ripe tiles. */
export function loopMenuGroups(save: FarmSave | null): MenuGroup[] {
  const ready = new Map<string, number>(save ? [['fields', readyTiles(save)]] : [])
  return GROUPS.map(({ group, label }) => ({
    key: group, label,
    places: MAP_PLACES.filter((p) => p.group === group).map((p) => ({
      key: p.id, name: p.name, to: save ? placeLink(save, p) : `/?peek=${p.id}`, count: ready.get(p.id) ?? 0, locked: !save || lockOf(save, p) !== null,
    })),
  }))
}

function LoopMenu() {
  const save = useLoopSave()
  const ask = useAskBeforeEnd()
  return (
    <>
      <PlaceMenu groups={loopMenuGroups(save)} extra={[NEXT, GUIDES, ACCOUNT]} />
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
