// The Town: `/town`, down the farm map's road, a map you move around in landscape. Going into town takes one of the day's
// actions (Go into town); the town and its shop then stay open for the rest of the day, and moving between its locations
// is free. Two views, the second `?view=people`, and the Shop:
// - **The map:** its locations in groups (the six spots, the shops and offices, the story's workplaces and homes), each
//   with how many are there now and their first faces; you're at one (`?at=<id>`, the Plaza to start), and a tap on
//   another goes there. Beside the map, **where you are:** its name and line, who's here now (faces and names, as many as
//   there are, in a grid that scrolls), and its keeper at her post with her post's menu (the general store's seeds;
//   build orders, loans and animals coming later);
// - **People:** everyone who lives in town and the town's people, met or not, with where she is today, a search by
//   name, and a sort, met first or by name; a tap goes to her.
// Tap anyone (`?uma=<id>`) for her menu on the dialogue engine (`HerMenu.tsx`). Faces load as they scroll into view.
// Names and faces are master data's and the pack's, at run time. Its title is the town's name when the world gives
// one. Loaded on demand.
import { CAST, placeNameOf, townDay, type SaveV4, type StoryPack, type TownDay } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { PlaceHeader, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Tabs } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { storyReady, useStory } from '../story/story'
import { IntoTown } from '../loop/GoodsSheets'
import { HerMenu } from './HerMenu'
import { findPeople, locationViews, mapGroups, peopleRows, PEOPLE_SORTS, postMenu, sortPeople, type LocationView, type PeopleSort } from './town-view'

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
          <div className="mx-auto max-w-sm px-4 pt-3"><IntoTown save={save} line="Going into town takes an action. The town and its shop stay open for the rest of the day, and walking between its places is free." /></div>
        )}
      </main>
    </div>
  )
}

function About() {
  return (
    <>
      <p>Everyone lives in town: tap a place to walk there, free, and see who’s there now. The story puts each Uma where her life takes her (her home, her work, the places she likes); the rest are out at the town’s spots, a different few each day.</p>
      <p>Tap an Uma for what you can do with her, each an action: introduce yourself (that’s how you meet her), talk, give a gift, and her event when it’s ready.</p>
      <p>The town’s people are at their posts: the general store sells seeds.</p>
    </>
  )
}

function Town({ save, pack, master, view }: { save: SaveV4; pack: StoryPack; master: MasterView; view: View }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const nameOf = useMemo(() => namer(master, pack), [master, pack])
  const day = useMemo(() => townDay(save, pack), [save, pack])
  const views = useMemo(() => locationViews(day, pack), [day, pack])
  const asked = params.get('at')
  const here = views.find((v) => v.loc.id === asked) ?? views.find((v) => v.loc.id === START)!
  const uma = params.get('uma') ?? params.get('talk')
  // Walking between places is free: replacing keeps Back's way to the farm.
  const go = (at: string) => navigate(withParam(location, 'at', at), { replace: true, state: location.state })
  // Her menu over the town: at her place when she's out (so Back returns there), else over where you are.
  const open = (id: string, at?: string | null) => navigate(paramsTo(location, { ...(at ? { at } : {}), uma: id }), { state: { back: true } })
  return (
    <>
      {view === 'map' ? (
        <div className="flex h-full min-h-0 flex-row gap-3 px-4 pt-2 pb-3" data-town-today={day.where.size}>
          <TownMap groups={mapGroups(views)} here={here.loc.id} nameOf={nameOf} onGo={go} out={day.where.size} />
          <Place view={here} save={save} nameOf={nameOf} onOpen={(id) => open(id)} />
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
    <span ref={ref} className="block shrink-0 overflow-hidden rounded-full bg-sunken" style={{ width: size, height: size }} data-face={seen ? 'shown' : 'waiting'}>
      {seen && <FaceTile outfitId={id} size={size} label={name} round />}
    </span>
  )
}

// --- The map ----------------------------------------------------------------------------------------------------------

/** The map: its groups of places, each a tile with how many are there now and their first faces. Yours is marked. */
function TownMap({ groups, here, nameOf, onGo, out }: { groups: ReturnType<typeof mapGroups>; here: string; nameOf: NameOf; onGo: (id: string) => void; out: number }) {
  return (
    <nav aria-label="The town map" className="@container min-h-0 w-[56%] shrink-0 overflow-y-auto overscroll-contain rounded-lg border border-hairline bg-sunken p-2"
      data-town-map>
      <p className="px-1 pb-1 text-[12px] text-ink-soft" data-out={out}>{out === 0 ? 'No one’s out today.' : `${out} out today · walking is free`}</p>
      <div className="space-y-2">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.title} data-map-group={g.key}>
            <h2 className="text-micro px-1 pb-1">{g.title}</h2>
            <ul className="grid grid-cols-2 gap-1.5 @md:grid-cols-3">
              {g.places.map((v) => {
                const at = v.loc.id === here
                return (
                  <li key={v.loc.id}>
                    <button type="button" onClick={() => onGo(v.loc.id)} aria-current={at ? 'location' : undefined}
                      aria-label={`${v.loc.name}, ${v.here.length === 0 ? 'no one there now' : `${v.here.length} there now`}${at ? ', you’re here' : ''}`}
                      className={`flex min-h-14 w-full flex-col justify-between gap-1 rounded-md border px-2 py-1.5 text-left shadow-1 ${at ? 'border-accent bg-panel ring-2 ring-accent' : 'border-hairline bg-panel/85'}`}
                      data-location={v.loc.id} data-here-count={v.here.length} data-at={at || undefined}>
                      <span className="flex items-center gap-1">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{v.loc.name}</span>
                        {v.here.length > 0 && <span className="shrink-0 rounded-full bg-[#c2385e] px-1.5 text-[11px] font-bold text-white tabular-nums">{v.here.length}</span>}
                      </span>
                      <span className="flex h-6 items-center -space-x-1.5">
                        {v.here.slice(0, 4).map((id) => <Face key={id} id={id} size={24} name={nameOf(id)} />)}
                        {at && <span className="ml-auto pl-2 text-[11px] font-semibold text-accent-strong">You’re here</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}

// --- Where you are ----------------------------------------------------------------------------------------------------

/** Where you are: its name and line, who's here now, and its keeper at her post with her post's menu. */
function Place({ view, save, nameOf, onOpen }: { view: LocationView; save: SaveV4; nameOf: NameOf; onOpen: (id: string) => void }) {
  const location = useLocation()
  const { loc, here, keeper } = view
  const menu = loc.group === 'shop' ? postMenu(loc.id as Parameters<typeof postMenu>[0]) : []
  return (
    <section aria-label={loc.name} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain" data-place-panel={loc.id}>
      <h2 className="font-display text-[18px] leading-tight font-bold" data-place-name>{loc.name}</h2>
      {loc.line && <p className="text-[13px] text-ink-soft">{loc.line}</p>}
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
  const [sort, setSort] = useState<PeopleSort>('met')
  const all = useMemo(() => peopleRows(save, pack, day, nameOf), [save, pack, day, nameOf])
  const rows = useMemo(() => sortPeople(findPeople(all, query), sort), [all, query, sort])
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
