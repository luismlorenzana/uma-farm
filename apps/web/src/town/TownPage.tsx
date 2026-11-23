// The Town: `/town`, down the farm map's road. Entering this screen and walking between its locations are free.
// Two views, the second `?view=people`, and the Shop:
// - **The map:** its locations in groups (the six spots, the shops and offices, the story's workplaces and homes), each
//   with how many are there now, their first four faces and "+n" for a crowded one (a spot holds everyone the schedules
//   put there); you're at one (`?at=<id>`, the Plaza to start), and a tap on
//   another goes there. Beside the map, **where you are:** its name and line, who's here now (faces and names, as many as
//   there are, in a grid that scrolls), and its keeper at her post with her post's menu (the general store's seeds; the
//   mayor's office's build orders and loans, its sheet at `?sheet=mayor` (`MayorSheet.tsx`); the rancher's animals and
//   fodder, her sheet at `?sheet=rancher` (`RancherSheet.tsx`));
// - **People:** everyone who lives in town and the town's people, met or not, with where she is today, a search by
//   name, and a sort, met first or by name; a tap goes to her.
// Tap anyone (`?uma=<id>`) for her menu on the dialogue engine (`HerMenu.tsx`). Faces load as they scroll into view.
// Names and faces are master data's and the pack's, at run time. Its title is the town's name when the world gives
// one. Loaded on demand.
import { CAST, districtOf, placeBuilt, placeNameOf, publicTownPlace, TOWN_DISTRICTS, townDay, townOf, type SaveV4, type StoryPack, type TownDay } from '@farm/domain'
import { PlaceHeader, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Tabs } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { talentsFor } from '../loop/talents'
import { Avatar } from '../dialogue/Avatar'
import { GuideContent } from '../guide/Guide'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { storyReady, useStory } from '../story/story'
import { IntoTown } from '../loop/GoodsSheets'
import { intoTown } from '../loop/actions'
import { HerMenu } from './HerMenu'
import { TownMap } from './TownMap'
import { ServiceSheet, TownServices } from './TownServices'

const ExpeditionSheet = lazy(() => import('./ExpeditionSheet'))
const MayorSheet = lazy(() => import('./MayorSheet'))
const RancherSheet = lazy(() => import('./RancherSheet'))
import { findPeople, locationViews, peopleRows, PEOPLE_SORTS, postMenu, sortPeople, type LocationView, type PeopleSort } from './town-view'

type View = 'map' | 'people'

/** The location with these params set (or removed, for null). */
function paramsTo(location: { pathname: string; search: string }, set: Readonly<Record<string, string | null>>): string {
  const next = new URLSearchParams(location.search)
  for (const [key, value] of Object.entries(set)) {
    if (value === null) next.delete(key)
    else next.set(key, value)
  }
  const search = next.toString()
  return `${location.pathname}${search ? `?${search}` : ''}`
}
type NameOf = (id: string) => string
/** Where you arrive in town. */
const START = 'plaza'

export default function TownPage() {
  const save = useLoopSave()
  const pack = useStory()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  useEffect(() => void storyReady().catch(() => undefined), [])
  const arrived = save?.today.town
  const day = save?.calendar.day
  const [tryArrival, setTryArrival] = useState(false)
  useEffect(() => {
    if (arrived !== false) return
    setTryArrival(false)
    void intoTown().catch(() => setTryArrival(true))
  }, [arrived, day])
  if (!save) return null
  const view: View = params.get('view') === 'people' ? 'people' : 'map'
  // The view rides in the URL; replacing keeps Back's way to the farm.
  const setView = (next: View) => navigate(withParam(location, 'view', next === 'people' ? 'people' : null), { replace: true, state: location.state })
  return (
    <div className="absolute inset-0 flex flex-col" data-page="town" data-view={view}>
      <PlaceHeader title={placeNameOf(pack, 'town')} onBack={() => leave('/')} about={<About />} words={{ back: 'Back to the farm', about: 'About the town' }}>
        {save.today.town && (
          <span className="flex items-center gap-2">
            <Tabs label="Views" value={view} onChange={setView} options={[{ value: 'map', label: 'Map' }, { value: 'people', label: 'People' }]} />
            <Link to={withParam(location, 'sheet', 'shop')} state={{ back: true }} className="flex min-h-11 shrink-0 items-center rounded-md border border-hairline-strong px-3 text-[14px] font-semibold" data-action="shop">Shop</Link>
          </span>
        )}
      </PlaceHeader>
      <main className="min-h-0 flex-1" data-town-scroll>
        {save.today.town ? (
          <MasterGate>{(master) => (pack ? <Town save={save} pack={pack} master={master} view={view} /> : <p className="p-4 text-ink-soft">Loading…</p>)}</MasterGate>
        ) : (
          <div className="mx-auto max-w-sm px-4 pt-3">
            {tryArrival ? <IntoTown line="The town couldn’t open." /> : <p className="text-ink-soft" role="status">Opening town…</p>}
          </div>
        )}
      </main>
    </div>
  )
}

function About() {
  return (
    <GuideContent topic="town">
      <p>Tap a district, then a building to open its services and see who’s there. Walking is free. Umas live at the Harbour Inn until they move into a farm room. Her profile shows her town and farm shifts.</p>
      <p>Tap an Uma for what you can do with her, each an action: introduce yourself (that’s how you meet her), talk, give a gift, ask her out (two actions, one evening a day), and her event when it’s ready.</p>
      <p>Umas staff the shops on their town shifts. You can shop on days off. The mayor’s office takes build orders and lends toward them.</p>
    </GuideContent>
  )
}

function Town({ save, pack, master, view }: { save: SaveV4; pack: StoryPack; master: MasterView; view: View }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const nameOf = useMemo(() => namer(master, pack), [master, pack])
  const day = useMemo(() => townDay(save, pack), [save, pack])
  const views = useMemo(() => locationViews(day, pack, save), [day, pack, save])
  const asked = params.get('at')
  const at = asked ? publicTownPlace(pack, asked) : null
  const chosenDistrict = params.get('district')
  const district = TOWN_DISTRICTS.find(entry => entry.id === chosenDistrict) ?? (at ? districtOf(at) : undefined)
  const here = views.find((v) => v.loc.id === at) ?? views.find((v) => v.loc.id === START)!
  const candidate = params.get('uma') ?? params.get('talk')
  const uma = candidate && (pack.cast.umas.some(member => member.characterId === candidate) || townOf(pack).byId.has(candidate)) ? candidate : null
  // Walking between places is free: replacing keeps Back's way to the farm.
  const go = (at: string) => navigate(paramsTo(location, { at, district: null }), { replace: true, state: location.state })
  const goDistrict = (id: string | null) => {
    const next = TOWN_DISTRICTS.find(entry => entry.id === id)
    navigate(paramsTo(location, { district: next?.id ?? null, at: next?.places[0] ?? null }), { replace: true, state: location.state })
  }
  const services = params.get('service') ?? (['inn', 'town-guide', 'town-garage'].includes(params.get('sheet') ?? '') ? params.get('sheet') : null)
  // Her menu over the town: at her place when she's out (so Back returns there), else over where you are.
  const open = (id: string, at?: string | null) => navigate(paramsTo(location, { ...(at ? { at, district: null } : {}), uma: id }), { state: { back: true } })
  return (
    <>
      {view === 'map' ? (
        <div className="flex h-full min-h-0 flex-row gap-3 px-4 pt-2 pb-3" data-town-today={day.where.size}>
          <TownMap district={district} views={views} here={here.loc.id} onDistrict={goDistrict} onGo={go} />
          <Place key={here.loc.id} view={here} save={save} pack={pack} nameOf={nameOf} onOpen={(id) => open(id)} />
        </div>
      ) : (
        <div className="h-full overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
          <People save={save} pack={pack} day={day} nameOf={nameOf} onOpen={(id, at) => open(id, at)} />
        </div>
      )}
      {uma && (
        <HerMenu key={uma} id={uma} save={save} pack={pack} master={master} day={day} nameOf={nameOf}
          onClose={() => leave(paramsTo(location, { uma: null, talk: null }))} />
      )}
      {services && <ServiceSheet key={services} id={services} save={save} pack={pack} day={day} nameOf={nameOf}
        close={() => leave(paramsTo(location, { service: null, sheet: null }))} />}
      {params.get('sheet') === 'expeditions' && (
        <Suspense fallback={null}>
          <ExpeditionSheet save={save} nameOf={nameOf} talentOf={talentsFor(master)} onClose={() => leave(paramsTo(location, { sheet: null }))} />
        </Suspense>
      )}
      {params.get('sheet') === 'mayor' && (
        <Suspense fallback={null}>
          <MayorSheet title={views.find((v) => v.loc.id === 'mayor')?.loc.name ?? 'The Mayor’s Office'} onClose={() => leave(paramsTo(location, { sheet: null }))} />
        </Suspense>
      )}
      {params.get('sheet') === 'rancher' && (
        <Suspense fallback={null}>
          <RancherSheet title={views.find((v) => v.loc.id === 'rancher')?.loc.name ?? 'The Rancher’s'} onClose={() => leave(paramsTo(location, { sheet: null }))} />
        </Suspense>
      )}
    </>
  )
}

/** A face that loads once it scrolls into view (or at once, where the browser can't tell). */
export function Face({ id, size, name }: { id: string; size: number; name: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (seen || !el) return
    const watch = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true)
        watch.disconnect()
      }
    }, { rootMargin: '160px' })
    watch.observe(el)
    return () => watch.disconnect()
  }, [seen])
  return (
    <span ref={ref} className="rounded-avatar block shrink-0 bg-sunken" style={{ width: size, height: size }} data-face={seen ? 'shown' : 'waiting'}>
      {seen && <Avatar id={id} size={size} label={name} />}
    </span>
  )
}

// --- Where you are ----------------------------------------------------------------------------------------------------

/** Where you are: its name and line, who's here now, and its keeper at her post with her post's menu. */
function Place({ view, save, pack, nameOf, onOpen }: { view: LocationView; save: SaveV4; pack: StoryPack; nameOf: NameOf; onOpen: (id: string) => void }) {
  const location = useLocation()
  const { loc, here, keeper } = view
  const menu = loc.group === 'shop' ? postMenu(loc.id as Parameters<typeof postMenu>[0]) : []
  return (
    <section aria-label={loc.name} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain" data-place-panel={loc.id}>
      <h2 className="font-display text-[18px] leading-tight font-bold" data-place-name>{loc.name}</h2>
      {loc.line && <p className="text-[13px] text-ink-soft">{loc.line}</p>}
      {loc.id === 'expeditions' && (
        <Link to={placeBuilt(save, 'expeditions') ? withParam(location, 'sheet', 'expeditions') : '/?peek=expeditions'} state={{ back: true }}
          className="mt-2 grid min-h-11 place-items-center rounded-md bg-accent font-semibold text-accent-ink">{placeBuilt(save, 'expeditions') ? 'Open post' : 'Post requirements'} ›</Link>
      )}
      <TownServices at={loc.id} pack={pack} save={save} nameOf={nameOf} />
      <h3 className="text-micro pt-2 pb-1">Here now · {here.length}</h3>
      {here.length === 0 ? <p className="text-[13px] text-ink-soft" data-nobody>No one’s here now.</p> : (
        <ul className="grid grid-cols-4 gap-1" data-here={here.length}>
          {here.map((id) => {
            const talked = save.today.chats.includes(id)
            return (
              <li key={id}>
                <button type="button" onClick={() => onOpen(id)} className="flex min-h-11 w-full flex-col items-center gap-0.5 rounded-md py-1" aria-label={`${nameOf(id)}${save.roster[id] ? ', met' : ''}`}
                  data-person={id} data-met={save.roster[id] ? true : undefined} data-talked={talked || undefined}>
                  <span className="relative">
                    <Face id={id} size={48} name={nameOf(id)} />
                    {save.roster[id] && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-[#c2385e] text-[11px] text-white">♥</span>}
                    {talked && <span aria-hidden className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-success text-[11px] font-bold text-white">✓</span>}
                  </span>
                  <span className="w-full truncate text-center text-[12px] font-semibold">{nameOf(id)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {(keeper || menu.length > 0) && (
        <div className="mt-2 space-y-1.5 border-t border-hairline pt-2" data-post={loc.id}>
          {view.selfService && <p className="text-[13px] text-ink-soft" data-self-service>Self-service today</p>}
          {keeper && (
            <button type="button" onClick={() => onOpen(keeper.characterId)} className="flex min-h-11 w-full items-center gap-2 text-left" data-keeper={keeper.characterId}>
              <Face id={keeper.characterId} size={32} name={nameOf(keeper.characterId)} />
              <span className="min-w-0 flex-1 truncate text-[13px]"><span className="font-semibold">{nameOf(keeper.characterId)}</span>
                <span className="text-ink-soft"> · {keeper.role ? CAST[keeper.role].role : keeper.does}</span></span>
            </button>
          )}
          {menu.map((m) => (m.to ? (
            <Link key={m.key} to={withParam(location, 'sheet', m.to)} state={{ back: true }} data-post-item={m.key}
              className="font-display grid min-h-11 place-items-center rounded-md bg-accent text-[15px] font-bold text-accent-ink">{m.label} ›</Link>
          ) : (
            <p key={m.key} className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-hairline px-3 text-[14px]" data-post-item={m.key} data-why={m.why}>
              <span className="font-semibold text-ink-soft">{m.label}</span><span className="text-[12px] text-ink-faint">{m.why}</span>
            </p>
          )))}
        </div>
      )}
    </section>
  )
}

// --- People -----------------------------------------------------------------------------------------------------------

function People({ save, pack, day, nameOf, onOpen }: { save: SaveV4; pack: StoryPack; day: TownDay; nameOf: NameOf; onOpen: (id: string, at: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PeopleSort>('relationship')
  const all = useMemo(() => peopleRows(save, pack, day, nameOf), [save, pack, day, nameOf])
  const rows = useMemo(() => sortPeople(findPeople(all, query), sort, save), [all, query, sort, save])
  return (
    <div className="@container space-y-2" data-people={all.length}>
      <div className="flex items-center gap-2">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by name" aria-label="Find by name" enterKeyHint="search"
          className="h-11 min-w-0 flex-1 rounded-md border border-hairline bg-panel px-3 text-[16px] text-ink placeholder:text-ink-faint" data-search />
        <Tabs label="Sort" value={sort} onChange={setSort} options={PEOPLE_SORTS} />
      </div>
      <p className="text-[12px] text-ink-soft tabular-nums" data-found={rows.length}>{query.trim() ? `${rows.length} of ${all.length}` : `${all.length} people`}</p>
      {rows.length === 0 ? <p className="text-[14px] text-ink-soft" data-none>No one by that name.</p> : (
        <ul className="grid gap-x-4 border-t border-hairline @xl:grid-cols-2">
          {rows.map((r) => (
            <li key={r.id} className="border-b border-hairline">
              <button type="button" onClick={() => onOpen(r.id, r.farm ? null : r.at)} className="flex min-h-14 w-full items-center gap-3 px-3 py-1.5 text-left"
                data-person-row={r.id} data-where={r.farm ? 'farm' : r.at ?? 'home'}>
                <Face id={r.id} size={40} name={r.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{r.name}</span>
                  <span className="block truncate text-[12px] text-ink-soft">{r.where}{r.role ? ` · ${r.role}` : ''}</span>
                </span>
                {r.met && <span className="shrink-0 rounded-full bg-[#e0567a]/12 px-2 text-[11px] font-semibold text-[#c2385e]" data-met>Met</span>}
                {r.today && <span className="shrink-0 text-[13px] font-bold text-success" aria-label="Talked today">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
