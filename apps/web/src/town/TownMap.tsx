import { TOWN_DISTRICTS, type TownDistrict } from '@farm/domain'
import { ActorLayer } from '../hd2d/ActorLayer'
import { hasWalkingArt } from '../hd2d/character-art'
import { paintedRoutes } from '../hd2d/painted-routes'
import type { ArtIndex } from '@luismlorenzana/uma-data'
import type { LocationView } from './town-view'
import townArt from './art/town.jpg'
import plazaArt from './art/plaza.jpg'
import marketArt from './art/market.jpg'
import libraryArt from './art/library.jpg'
import harbourArt from './art/harbour.jpg'
import workshopArt from './art/workshop.jpg'
import hilltopArt from './art/hilltop.jpg'
import './town-map.css'

type Footprint = readonly [left: number, top: number, width: number, height: number]
const districtArt = { plaza: plazaArt, market: marketArt, library: libraryArt, harbour: harbourArt, workshop: workshopArt, hilltop: hilltopArt }
const districts: Record<TownDistrict['id'], Footprint> = {
  hilltop: [31, 3, 41, 25],
  workshop: [4, 30, 33, 24],
  plaza: [38, 28, 25, 29],
  library: [68, 25, 31, 27],
  market: [18, 57, 38, 22],
  harbour: [62, 53, 36, 30],
}
const buildings: Record<TownDistrict['places'][number], Footprint> = {
  mayor: [3, 8, 28, 34],
  'estate-office': [36, 10, 28, 33],
  'little-studio': [68, 12, 30, 31],
  plaza: [28, 48, 26, 28],
  market: [3, 17, 42, 25],
  store: [56, 12, 41, 31],
  'laurel-bakery': [4, 48, 40, 36],
  'mejiro-salon': [58, 50, 38, 34],
  library: [3, 13, 44, 54],
  cafe: [58, 22, 40, 47],
  harbour: [53, 44, 44, 32],
  'harbour-inn': [8, 19, 37, 43],
  smith: [1, 25, 30, 38],
  'espoir-garage': [34, 28, 33, 34],
  rancher: [70, 26, 29, 40],
  track: [3, 38, 42, 29],
  expeditions: [61, 25, 35, 30],
}

interface Target {
  id: string
  label: string
  at: Footprint
  count?: number
}

export function TownMap({ district, views, here, art, onDistrict, onGo }: {
  district: TownDistrict | undefined
  views: readonly LocationView[]
  here: string
  art: ArtIndex | null
  onDistrict: (id: string | null) => void
  onGo: (id: string) => void
}) {
  const targets: Target[] = district ? district.places.flatMap(id => {
    const location = views.find(view => view.loc.id === id)
    return location ? [{ id, label: location.loc.name.replace(/^The /, ''), at: buildings[id], count: location.here.length }] : []
  }) : TOWN_DISTRICTS.map(({ id, label }) => ({ id, label, at: districts[id] }))
  const actors = district ? targets.flatMap(({ id, at: [left, top, width, height] }) => {
    const people = views.find(view => view.loc.id === id)?.here.filter(id => hasWalkingArt(art, id)) ?? []
    const x = (left + width * .54) / 100
    const y = Math.min(.87, (top + height + 3) / 100)
    return paintedRoutes(people, [[x, y], [Math.min(.89, x + .08), y + .027]])
  }).slice(0, 6) : []
  return (
    <nav aria-label="Town map" className="flex min-h-0 w-[64%] shrink-0 flex-col gap-1" data-town-map>
      <div className="flex min-h-11 items-center justify-between gap-1">
        <h2 className="font-display px-1 text-base font-bold">{district?.label ?? 'Town districts'}</h2>
        {district && <button type="button" onClick={() => onDistrict(null)} data-town-overview className="min-h-11 rounded-md border border-hairline px-2 text-xs font-semibold">‹ All town</button>}
      </div>
      <div className="town-art-frame rounded-lg border border-hairline bg-sunken">
        <div className="town-art" data-town-district={district?.id ?? 'overview'}>
          <img src={district ? districtArt[district.id] : townArt} alt="" width={1080} height={720} draggable={false} />
          {actors.length > 0 && <ActorLayer actors={actors} outfit="spring" />}
          {targets.map(({ id, label, at: [left, top, width, height], count }) => {
            const selected = !!district && here === id
            return (
              <button key={id} type="button" className="town-art-target" aria-current={selected ? 'location' : undefined}
                style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                onClick={() => district ? onGo(id) : onDistrict(id)} data-district={district ? undefined : id}
                data-location={district ? id : undefined} data-here-count={count} data-at={selected || undefined}>
                <span>{label}{!!count && <b aria-label={`${count} here`}>{count}</b>}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
