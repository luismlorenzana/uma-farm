import {
  atHome, currentDatePeriod, fieldCounts, residentsOf, townDay, type FarmSave, type StoryPack, type TalentOf,
} from '@farm/domain'
import { useLeave } from '@luismlorenzana/uma-kit/shell'
import type { MasterView } from '../master/master'
import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { namer } from '../story/people'
import { HerMenu } from '../town/HerMenu'
import { FARM_REGIONS, REGIONS, farmEntrances, regionUrl, withinRegion, type FarmEntrance, type FarmRegion } from './farm-regions'
import { countsWords } from '../loop/farm-view'
import { awayFromWorld, farmPresence, residentTownPlace, type FarmActor } from './farm-presence'
import type { CameraPose, ScenePoint } from './farm-region-stage'
import { WorldFigures, WorldPlate } from './WorldPlate'
import overview from './farm-overview.webp'
import './farm-world.css'

const RegionDepth = lazy(() => import('./FarmRegionDepth').catch(() => ({
  default: () => <p role="status" className="p-3">Use the destination list to explore this section.</p>,
})))
const START_POSE: CameraPose = { x:0,z:0,zoom:1 }
// The farm route unmounts while a field or warehouse screen is open.
const lastFarmCamera: Partial<Record<FarmRegion,CameraPose>> = {}
const BACK = { back:true }
const CONTROL = 'flex min-h-11 items-center gap-2 rounded-md border border-hairline bg-panel px-2 text-sm font-semibold'

function Overview({ save }: { save: FarmSave }) {
  const residents = Object.keys(save.love).filter(id => atHome(save,id)).length
  const details = {
    farm: `${save.fields.plots.length} ${save.fields.plots.length === 1 ? 'plot' : 'plots'}`,
    forest: '', pond: '',
    barns: save.ranch.animals.length ? `${save.ranch.animals.length} animals` : '',
    living: `${residents} ${residents === 1 ? 'resident' : 'residents'}`,
    work: save.farm.builds.length ? `${save.farm.builds.length} building${save.farm.builds.length === 1 ? '' : 's'} tonight` : '',
  }
  return <section className="farm-world-overview" data-farm-overview aria-label="Farm map">
    <div className="farm-world-painting">
      <img src={overview} alt="" draggable={false} width={1440} height={810} />
      {REGIONS.map(region => {
        const { label,at:[x,y] } = FARM_REGIONS[region]
        return <Link key={region} to={regionUrl(region)} state={BACK} data-region-target={region} className="farm-world-hotspot"
          style={{ left:`${x}%`, top:`${y}%` }}>
          <span>{label}</span>{details[region] && <small>{details[region]}</small>}
        </Link>
      })}
      <Link to="/town" state={BACK} className="farm-world-hotspot farm-world-road" data-world-road>To town ›</Link>
    </div>
    <nav className="farm-world-shortcuts" aria-label="Farm destinations">
      {REGIONS.map(region => <Link key={region} to={regionUrl(region)} state={BACK}>{FARM_REGIONS[region].label}</Link>)}
      <Link to="/town" state={BACK}>Town</Link>
    </nav>
  </section>
}

function entranceLink(region: FarmRegion, entrance: FarmEntrance) {
  return entrance.plate && !entrance.locked ? regionUrl(region,entrance.id) : withinRegion(entrance.to,region)
}

function listPeople(cast: readonly FarmActor[], name: (id:string) => string, open:(id:string)=>void) {
  return cast.length > 0 && <ul className="space-y-1" aria-label="Here now">
    {cast.map(actor => <li key={actor.id}><button type="button" className={CONTROL + ' w-full text-left'} onClick={() => open(actor.id)} data-here-actor={actor.id}>
      <span className="min-w-0 flex-1 truncate">{name(actor.id)}</span><small>{actor.detail}{actor.planned ? ' · planned' : ''}</small>
    </button></li>)}
  </ul>
}

function SectionScene({ region, save, entrances, cast, name, open, pose, setPose, night }: {
  region: FarmRegion; save: FarmSave; entrances: readonly FarmEntrance[]; cast: readonly FarmActor[]; name(id: string): string; open(id:string):void
  pose: CameraPose; setPose(pose: CameraPose):void; night: boolean
}) {
  function visible(points: ReadonlyMap<string,ScenePoint>) {
    const spaces = new Map<string,number>()
    return cast.flatMap(actor => {
      const anchor = points.get(actor.door)
      if (!anchor) return []
      const count = spaces.get(actor.door) ?? 0
      spaces.set(actor.door,count + 1)
      const x = anchor.x + (count % 2 === 0 ? -.041 : .041) * (1 + Math.floor(count / 2) * .66)
      const y = anchor.y - .028 - Math.floor(count / 2) * .025
      return x > .045 && x < .955 && y > .24 && y < .88 ? [{...actor,x,y,name:name(actor.id)}] : []
    }).slice(0,6)
  }
  return <Suspense fallback={<p role="status" className="p-3">Loading section…</p>}>
    <RegionDepth region={region} save={save} entrances={entrances} night={night} pose={pose} setPose={setPose}>
      {points => <>
        {entrances.map(entrance => {
          const point = points.get(entrance.id)
          if (!point || point.x < .07 || point.x > .93 || point.y < .16 || point.y > .94) return null
          return <Link key={entrance.id} to={entranceLink(region,entrance)} state={BACK} aria-label={entrance.name}
            className="farm-depth-door" style={{left:`${point.x*100}%`,top:`${point.y*100}%`}}
            data-world-entrance={entrance.id}>{entrance.name}</Link>
        })}
        <WorldFigures figures={visible(points)} open={open} standing={false} height={46} />
      </>}
    </RegionDepth>
  </Suspense>
}

export function FarmWorld({ save, pack, master, talentOf, region, covered }: {
  save: FarmSave; pack: StoryPack | null; master: MasterView | null; talentOf: TalentOf; region?: FarmRegion | undefined; covered: boolean
}) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const [camera,setCamera] = useState<Partial<Record<FarmRegion,CameraPose>>>(() => ({ ...lastFarmCamera }))
  const entrances = useMemo(() => region ? farmEntrances(save,pack,region) : [],[save,pack,region])
  const presence = useMemo(() => region ? farmPresence(save,pack,talentOf) : null,[save,pack,talentOf,region])
  const allTown = useMemo(() => pack ? townDay(save,pack) : null,[save,pack])
  const name = master && pack ? namer(master,pack) : (id:string) => master?.album.get(id)?.name ?? 'An Uma'
  if (!region) return <Overview save={save} />
  const period = currentDatePeriod(save)
  const selected = entrances.find(entrance => entrance.id === params.get('door') && !entrance.locked && entrance.plate)
  const actor = params.get('farmUma')
  const cast = [...(presence?.actors.values() ?? [])].filter(person => person.region === region && (!selected || selected.id === person.door))
  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('farmUma')
    leave(location.pathname + '?' + next.toString())
  }
  const open = (id:string) => {
    if (!cast.some(person => person.id === id)) return
    const next = new URLSearchParams(params)
    next.set('farmUma',id)
    navigate(location.pathname + '?' + next.toString(),{state:BACK})
  }
  const found = actor && cast.some(person => person.id === actor)
  const details = region === 'farm' ? countsWords(fieldCounts(save)).join(' · ')
    : region === 'barns' ? `${save.ranch.animals.filter(animal => animal.fed).length}/${save.ranch.animals.length} fed · ${save.ranch.animals.filter(animal => animal.ready).length} ready`
    : region === 'work' && save.farm.builds.length ? `${save.farm.builds.length} scheduled construction` : null
  const houses = region === 'living' ? save.homestead.houses.flatMap((house,index) => {
    if (selected && selected.id !== `house:${index}`) return []
    return [{ id:index,name:house.name,people:residentsOf(save,index) }]
  }) : []
  return <>
    <section className="farm-world-section" data-farm-region={region} hidden={Boolean(actor && found && master && pack)}>
      <header className="flex min-h-11 shrink-0 items-center gap-2">
        <Link to={selected ? regionUrl(region) : '/'} className={CONTROL}>{selected ? `‹ ${FARM_REGIONS[region].label}` : '‹ Farm map'}</Link>
        <h1 className="font-display min-w-0 flex-1 truncate text-lg font-bold">{selected?.name ?? FARM_REGIONS[region].label}</h1>
        {details && <small className="text-ink-soft">{details}</small>}
        <Link to={withinRegion('/?sheet=next',region,selected?.id)} className={CONTROL}>What Next?</Link>
      </header>
      <div className="farm-world-split">
        <div className="relative flex min-h-0 min-w-0 overflow-hidden rounded-lg bg-sunken">
          {!covered && (!actor || !found) && (selected
            ? <WorldPlate save={save} place={selected.plate!} cast={cast.map(person => ({...person,name:name(person.id)}))} open={open} />
            : <SectionScene region={region} save={save} entrances={entrances} cast={region === 'living' ? [] : cast} name={name} open={open} night={!period}
                pose={camera[region] ?? START_POSE} setPose={pose => {
                  lastFarmCamera[region] = pose
                  setCamera(previous => ({...previous,[region]:pose}))
                }} />)}
        </div>
        <aside className="min-h-0 min-w-0 space-y-2 overflow-y-auto overscroll-contain pr-1" aria-label={selected ? 'Room and people' : 'Destinations and people'}>
          {selected ? <Link className={CONTROL + ' justify-center bg-accent'} to={withinRegion(selected.to,region,selected.id)} state={BACK}>
              {region === 'living' ? 'Manage rooms' : 'Use ' + selected.name}
            </Link>
            : <ul className="space-y-1">{entrances.map(entrance => <li key={entrance.id}>
              <Link to={entranceLink(region,entrance)} className={CONTROL} state={BACK} data-region-destination={entrance.id}
                data-locked={entrance.locked ? true : undefined}>
                <span className="min-w-0 flex-1">{entrance.name}</span>
                {(entrance.locked || entrance.detail) && <small className="max-w-[50%] text-right text-ink-soft" data-tag={entrance.locked ? undefined : true}>{entrance.locked ?? entrance.detail}</small>}
              </Link>
            </li>)}</ul>}
          {region === 'work' && !selected && <Link className={CONTROL} to="/book?view=work" state={BACK}>Work board</Link>}
          {region === 'living' && !selected && <Link className={CONTROL} to="/?region=living&sheet=homestead" state={BACK}>Manage homes</Link>}
          {region === 'living' && !period && <Link className={CONTROL} to={selected ? regionUrl(region,selected.id)+'&visits=1' : '/?region=living&visits=1'} state={BACK}>Night visits</Link>}
          {region !== 'living' && listPeople(cast,name,open)}
          {houses.map(house => <div key={house.id} className="space-y-1" data-home-directory={house.id}>
            <h2 className="font-display text-sm font-bold">{house.name}</h2>
            {house.people.map(id => {
              const at = presence?.town?.where.get(id)
              const person = presence?.actors.get(id)
              const here = person?.region === 'living' && (!selected || person.door === selected.id)
              const away = awayFromWorld(save, id, Boolean(period))
              const to = at ? `/town?at=${encodeURIComponent(at)}` : person ? regionUrl(person.region,person.door) : `/library?uma=${encodeURIComponent(id)}`
              const detail = at ? residentTownPlace(pack,at) : away ? 'On expedition' : person?.detail ?? 'Her book'
              return here
                ? <button type="button" key={id} data-farm-resident={id} onClick={() => open(id)} className={CONTROL + ' w-full text-left'}>
                    <span className="min-w-0 flex-1 truncate">{name(id)}</span><small>{detail}</small>
                  </button>
                : <Link key={id} to={to} state={BACK} className={CONTROL} data-farm-resident={id}>
                    <span className="min-w-0 flex-1 truncate">{name(id)}</span><small>{detail} ›</small>
                  </Link>
            })}
          </div>)}
          {actor && !found && <div role="status" className="space-y-1 rounded-md border border-hairline p-2">
            <p>She is no longer here.</p><button type="button" className={CONTROL} onClick={close}>Close</button>
          </div>}
        </aside>
      </div>
    </section>
    {actor && found && master && pack && allTown && <HerMenu key={actor} id={actor} save={save} pack={pack} master={master}
      day={allTown} nameOf={name} onClose={close} farmSetting={selected?.plate ?? (presence?.actors.get(actor)?.door.split(':')[0] === 'house' ? 'home-threshold' : presence?.actors.get(actor)?.door.split(':')[0] ?? 'fields')} />}
  </>
}
