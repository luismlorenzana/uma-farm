import { HARBOUR_INN, innResidents, placeBuilt, type SaveV4, type StoryPack, type TownDay } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { byRelationship } from '../loop/relationship-order'
import { TownLibrary } from './TownLibrary'
import { serviceOf, serviceReport, serviceStaff, TOWN_SERVICES, type ServiceId } from './services'

const labelClass = 'inline-flex min-h-11 items-center rounded-md border border-hairline px-2 text-[13px] font-semibold'
const directLinks: Readonly<Record<string, readonly [string, string][]>> = {
  plaza: [['Requests', 'requests'], ['Calendar', 'calendar']],
  cafe: [['Requests', 'requests'], ['Kitchen', 'kitchen']],
  library: [['Field guides', 'town-guide']],
  'espoir-garage': [['Shared tools', 'town-garage']],
  'harbour-inn': [['Resident directory', 'inn']],
  smith: [['Ring Bench', 'bench']],
  'laurel-bakery': [['Kitchen', 'kitchen']],
  track: [['Festival entries', 'festival']],
}

export function TownServices({ at, pack, save, nameOf }: {
  at: string; pack: StoryPack; save: SaveV4; nameOf: (id: string) => string
}) {
  const location = useLocation()
  const services = (Object.keys(TOWN_SERVICES) as ServiceId[]).filter(id => {
    const service = serviceOf(id)!
    return service.at === at || service.also === at
  })
  const shortcuts = directLinks[at] ?? []
  if (!services.length && !shortcuts.length) return null
  return (
    <div className="my-1 space-y-1" aria-label="Town services">
      {!!shortcuts.length && <div className="flex flex-wrap gap-1">
        {shortcuts.map(([label, sheet]) => <Link key={sheet} className={labelClass}
          to={withParam(location, 'sheet', sheet)} state={{ back: true }}>{label}</Link>)}
      </div>}
      {services.map(id => {
        const staff = serviceStaff(save, pack, id)
        return (
          <Link key={id} to={withParam(location, 'service', id)} state={{ back: true }} data-town-service={id}
            className="flex min-h-11 flex-col justify-center rounded-md border border-hairline bg-panel px-2 py-1">
            <strong className="text-[13px] leading-tight">{TOWN_SERVICES[id].title} ›</strong>
            <span className="text-[11px] text-ink-soft">{staff ? `On shift · ${nameOf(staff)}` : 'Self-service'}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function ServiceSheet({ id, save, pack, day, nameOf, close }: {
  id: string; save: SaveV4; pack: StoryPack; day: TownDay; nameOf: (id: string) => string; close: () => void
}) {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const service = serviceOf(id)
  if (!service && !['town-guide', 'town-garage', 'inn'].includes(id)) return null
  const worker = service ? serviceStaff(save, pack, id as ServiceId) : null
  const title = service?.title ?? (id === 'inn' ? 'Harbour Inn directory' : id === 'town-guide' ? 'Field guides' : 'Shared tools')
  const library = id === 'librarian' ? 'cookbook' : id === 'archivist' ? 'restaurant' : id === 'town-guide' ? 'guide' : null
  const residents = id === 'inn' ? innResidents(save, pack).sort(byRelationship(save)) : []
  const report = service ? serviceReport(id as ServiceId, save, pack) : id === 'town-garage' ? serviceReport('garage', save, pack) : []
  const params = new URLSearchParams(location.search)
  params.delete('service')
  const base = { ...location, search: params.toString() }
  const to = service?.to.startsWith('?sheet=') ? withParam(base, 'sheet', service.to.slice(7))
    : id === 'expedition-outfitter' && !placeBuilt(save, 'expeditions') ? '/town?at=expeditions' : service?.to
  return (
    <Sheet open size="wide" title={title} label={title} onClose={close}>
      <div className="space-y-2" data-open-town-service={id}>
        {service && <div className="rounded-md bg-panel p-2">
          <p className="text-micro">{worker ? nameOf(worker) : 'Self-service'}</p>
          {worker && <p className="text-sm">{service.greeting}</p>}
        </div>}
        {library ? <TownLibrary save={save} tab={library} /> : report.length > 0 && <ul className="divide-y divide-hairline rounded-md border border-hairline bg-panel px-2">
          {report.map((line, i) => <li className="py-2 text-sm" key={i}>{line}</li>)}
        </ul>}
        {id === 'inn' && <>
          <p className="text-sm">{residents.length} Umas live at the Inn. Rooms move to the farm when assigned.</p>
          <input type="search" aria-label="Find an Inn resident" placeholder="Find an Inn resident" value={query}
            onChange={event => setQuery(event.target.value)} className="min-h-11 w-full rounded-md border border-hairline bg-panel px-3 text-base" />
          <ul className="grid gap-1 sm:grid-cols-2">
            {residents.filter(id => nameOf(id).toLowerCase().includes(query.trim().toLowerCase())).map(id => {
              const at = day.where.get(id)
              const params = new URLSearchParams({ at: at ?? HARBOUR_INN, uma: id })
              return <li key={id} className="flex min-h-11 items-center justify-between gap-1 rounded-md border border-hairline px-2 text-sm" data-inn-resident={id}>
                <strong>{nameOf(id)}</strong>
                {at ? <Link to={`/town?${params}`} state={{ back: true }} className="grid min-h-11 items-center text-xs underline">{at === HARBOUR_INN ? 'In the lobby' : 'Find her'} ›</Link>
                  : <span className="text-xs text-ink-soft">Out today</span>}
              </li>
            })}
          </ul>
          {residents.length === 0 && <p className="text-sm text-ink-soft">Everyone has moved to the farm. Meals and provisions are still available.</p>}
        </>}
        <div className="flex flex-wrap gap-1">
          {id === 'innkeeper' && <Link to={placeBuilt(save, 'expeditions') ? '/town?at=expeditions&sheet=expeditions' : '/town?at=expeditions'} state={{ back: true }} className={labelClass}>Expedition provisions ›</Link>}
          {id === 'carpenter' && <Link to="/town?at=mayor&sheet=mayor" state={{ back: true }} className={labelClass}>Permits and credit ›</Link>}
          {to && !library && <Link to={to} state={{ back: true }} className={labelClass}>{id === 'expedition-outfitter' && !placeBuilt(save, 'expeditions') ? 'See post requirements' : service?.link} ›</Link>}
          {id === 'innkeeper' && <Link to="/town?at=harbour-inn&sheet=inn" state={{ back: true }} className={labelClass}>Resident directory ›</Link>}
          {id === 'town-garage' && <Link to="/?sheet=forge" state={{ back: true }} className={labelClass}>Open Forge ›</Link>}
          {worker && day.where.has(worker) && <Link to={`/town?at=${day.where.get(worker)}&uma=${worker}`} state={{ back: true }} className={labelClass}>Talk to {nameOf(worker)} ›</Link>}
        </div>
      </div>
    </Sheet>
  )
}
