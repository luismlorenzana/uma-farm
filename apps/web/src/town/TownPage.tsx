// The Town: `/town`, the farm map's Town place. Two views, the second `?view=people`:
// - **Today:** the six spots, each with its line, its keeper (one of the town's people) and the few out there today: a
//   draw seeded by the player and the day, so the town is the same all day and a different few tomorrow;
// - **People:** everyone who lives in town and the town's people, met or not, with where she is today, a search by name,
//   and a sort, met first or by name.
// Tap one out today (`?talk=<id>`) to talk: her face, her name and her line for the day; the talk counts once a day,
// toward her trigger to meet. One at home, or on the farm, says so. A keeper's sheet shows her role and her ties. Faces
// load as they scroll into view. Names and faces are master data's and the pack's, at run time. Loaded on demand.
import { CAST, talkedToday, townDay, townOf, type SaveV4, type StoryPack, type TownDay } from '@farm/domain'
import { FaceTile, UmaBust } from '@luismlorenzana/uma-kit/album'
import { PlaceHeader, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Sheet, Tabs } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { storyReady, useStory } from '../story/story'
import { talkInTownOnce } from './town-actions'
import { findPeople, keeperTies, peopleRows, PEOPLE_SORTS, sortPeople, spotViews, talkWords, type PeopleSort, type SpotView } from './town-view'

type View = 'today' | 'people'
type NameOf = (id: string) => string

export default function TownPage() {
  const save = useLoopSave()
  const pack = useStory()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  useEffect(() => void storyReady().catch(() => undefined), [])
  if (!save) return null
  const view: View = params.get('view') === 'people' ? 'people' : 'today'
  // The view rides in the URL; replacing keeps Back's way to the farm.
  const setView = (next: View) => navigate(withParam(location, 'view', next === 'people' ? 'people' : null), { replace: true, state: location.state })
  return (
    <div className="absolute inset-0 flex flex-col" data-page="town" data-view={view}>
      <PlaceHeader title="Town" onBack={() => leave('/')} about={<About />} words={{ back: 'Back to the farm', about: 'About the town' }} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-town-scroll>
        <div className="space-y-3 px-4 pt-3 pb-24">
          <Tabs label="Views" value={view} onChange={setView} options={[{ value: 'today', label: 'Today' }, { value: 'people', label: 'People' }]} />
          <MasterGate>{(master) => (pack ? <Town save={save} pack={pack} master={master} view={view} /> : <p className="text-ink-soft">Loading…</p>)}</MasterGate>
        </div>
      </main>
    </div>
  )
}

function About() {
  return (
    <>
      <p>Everyone lives in town. Each day a few are out at the town’s spots, up to four at each; the rest are at home. Tomorrow, a different few.</p>
      <p>Tap one to talk. A talk costs nothing and counts once a day for each: talking on enough days is how her story begins.</p>
      <p>People lists everyone, met or not, and where she is today. Some are more often at a favourite spot.</p>
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
  const talk = params.get('talk')
  const open = (id: string) => navigate(withParam(location, 'talk', id), { state: { back: true } })
  return (
    <>
      {view === 'today' ? <Today day={day} pack={pack} save={save} nameOf={nameOf} onOpen={open} /> : <People save={save} pack={pack} day={day} nameOf={nameOf} onOpen={open} />}
      {talk && <TalkSheet key={talk} id={talk} save={save} pack={pack} day={day} nameOf={nameOf} onClose={() => leave(withParam(location, 'talk', null))} />}
    </>
  )
}

/** A face that loads once it scrolls into view (or at once, where the browser can't tell). */
function Face({ id, size, name }: { id: string; size: number; name: string }) {
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

// --- Today ------------------------------------------------------------------------------------------------------------

function Today({ day, pack, save, nameOf, onOpen }: { day: TownDay; pack: StoryPack; save: SaveV4; nameOf: NameOf; onOpen: (id: string) => void }) {
  const spots = spotViews(day, pack)
  const out = day.where.size
  return (
    <div className="space-y-3" data-town-today={out}>
      <p className="text-[13px] text-ink-soft" data-out={out}>{out === 0 ? 'No one’s out today.' : `${out} out today · a different few tomorrow`}</p>
      {spots.map((view) => <SpotCard key={view.spot.id} view={view} save={save} nameOf={nameOf} onOpen={onOpen} />)}
    </div>
  )
}

function SpotCard({ view, save, nameOf, onOpen }: { view: SpotView; save: SaveV4; nameOf: NameOf; onOpen: (id: string) => void }) {
  const { spot, keeper, out } = view
  return (
    <section className="space-y-2 rounded-md border border-hairline bg-panel p-3" aria-label={spot.name} data-spot={spot.id} data-spot-out={out.length}>
      <div>
        <h2 className="font-display text-[17px] font-bold">{spot.name}</h2>
        <p className="text-[13px] text-ink-soft">{spot.blurb}</p>
      </div>
      {out.length === 0 ? <p className="text-[13px] text-ink-soft">No one’s here today.</p> : (
        <ul className="grid grid-cols-4 gap-1">
          {out.map((id) => {
            const talked = talkedToday(save, id)
            return (
              <li key={id}>
                <button type="button" onClick={() => onOpen(id)} className="flex min-h-11 w-full flex-col items-center gap-1 rounded-md py-1" aria-label={`Talk with ${nameOf(id)}`}
                  data-person={id} data-talked={talked || undefined}>
                  <span className="relative">
                    <Face id={id} size={56} name={nameOf(id)} />
                    {talked && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-success text-[11px] font-bold text-white">✓</span>}
                  </span>
                  <span className="w-full truncate text-center text-[12px] font-semibold">{nameOf(id)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {keeper && (
        <button type="button" onClick={() => onOpen(keeper.characterId)} className="flex min-h-11 w-full items-center gap-2 border-t border-hairline pt-2 text-left"
          data-keeper={keeper.characterId}>
          <Face id={keeper.characterId} size={28} name={nameOf(keeper.characterId)} />
          <span className="min-w-0 flex-1 truncate text-[13px]"><span className="font-semibold">{nameOf(keeper.characterId)}</span>
            <span className="text-ink-soft"> · {keeper.role ? CAST[keeper.role].role : keeper.does}</span></span>
        </button>
      )}
    </section>
  )
}

// --- People -----------------------------------------------------------------------------------------------------------

function People({ save, pack, day, nameOf, onOpen }: { save: SaveV4; pack: StoryPack; day: TownDay; nameOf: NameOf; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PeopleSort>('met')
  const all = useMemo(() => peopleRows(save, pack, day, nameOf), [save, pack, day, nameOf])
  const rows = useMemo(() => sortPeople(findPeople(all, query), sort), [all, query, sort])
  return (
    <div className="space-y-2" data-people={all.length}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find by name" aria-label="Find by name" enterKeyHint="search"
        className="h-11 w-full rounded-md border border-hairline bg-panel px-3 text-[16px] text-ink placeholder:text-ink-faint" data-search />
      <Tabs label="Sort" value={sort} onChange={setSort} options={PEOPLE_SORTS} />
      <p className="text-[12px] text-ink-soft tabular-nums" data-found={rows.length}>{query.trim() ? `${rows.length} of ${all.length}` : `${all.length} people`}</p>
      {rows.length === 0 ? <p className="text-[14px] text-ink-soft" data-none>No one by that name.</p> : (
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => onOpen(r.id)} className="flex min-h-14 w-full items-center gap-3 px-3 py-1.5 text-left"
                data-person-row={r.id} data-where={r.met ? 'farm' : r.spot ?? 'home'}>
                <Face id={r.id} size={40} name={r.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{r.name}</span>
                  <span className="block truncate text-[12px] text-ink-soft">
                    {r.where}{r.role ? ` · ${r.role}` : ''}{!r.met && r.talks > 0 ? ` · talked ${r.talks} ${r.talks === 1 ? 'day' : 'days'}` : ''}
                  </span>
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

// --- The talk sheet ---------------------------------------------------------------------------------------------------

function TalkSheet({ id, save, pack, day, nameOf, onClose }: { id: string; save: SaveV4; pack: StoryPack; day: TownDay; nameOf: NameOf; onClose: () => void }) {
  const town = townOf(pack)
  const person = town.byId.get(id) ?? null
  const spot = day.where.get(id) ?? null
  const spotOf = spot ? town.spots.find((s) => s.id === spot)! : null
  const [error, setError] = useState<string | null>(null)
  // Tapping her is the talk: it counts once a day, as the sheet opens.
  useEffect(() => {
    if (spot !== null && !talkedToday(save, id)) void talkInTownOnce(id).catch((err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work. Try again.'))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const name = nameOf(id)
  return (
    <Sheet open onClose={onClose} title={name} label={`${name} in town`}>
      <div className="space-y-3 pb-2" data-talk={id} data-at={spot ?? (save.roster[id] ? 'farm' : person ? 'keeper' : 'home')}>
        <div className="flex justify-center"><UmaBust outfitId={id} label={name} size={168} /></div>
        {error && <p role="status" className="rounded-md bg-danger/10 px-3 py-2 text-[14px] font-semibold text-danger">{error}</p>}
        {person ? <KeeperWords id={id} pack={pack} nameOf={nameOf} />
          : spotOf ? <TalkLines save={save} pack={pack} id={id} spot={spotOf.name} keeper={spotOf.keeper} nameOf={nameOf} />
            : save.roster[id] ? (
              <p className="text-center text-[14px]" data-on-farm>She lives on the farm now. <Link to={`/hearts?uma=${id}`} state={{ back: true }} className="font-semibold text-accent-strong underline">Her profile ›</Link></p>
            ) : <p className="text-center text-[14px] text-ink-soft" data-at-home>At home today. Look for her another day.</p>}
      </div>
    </Sheet>
  )
}

/** Her line for the day, where she is, your talks with her, and her tie with the spot's keeper when she has one. */
function TalkLines({ save, pack, id, spot, keeper, nameOf }: { save: SaveV4; pack: StoryPack; id: string; spot: string; keeper: string | null; nameOf: NameOf }) {
  const words = talkWords(save, pack, id, keeper)
  return (
    <>
      <p className="text-center text-[12px] font-semibold text-ink-soft" data-talk-spot>{spot}</p>
      <p className="rounded-md border border-hairline bg-panel p-3 text-[16px] leading-snug shadow-1" data-talk-line>{words.line}</p>
      {words.tie && (
        <p className="flex items-center gap-2 text-[13px]" data-talk-tie={words.tie.with}>
          <Face id={words.tie.with} size={28} name={nameOf(words.tie.with)} />
          <span className="min-w-0 flex-1"><span className="font-semibold">{nameOf(words.tie.with)}</span><span className="text-ink-soft"> · {words.tie.line}</span></span>
        </p>
      )}
      <p className="text-center text-[13px] font-semibold text-success" data-talks>{words.talks}</p>
    </>
  )
}

/** One of the town's people: what she does, and her ties with the cast (they build no bond; their lines show here). */
function KeeperWords({ id, pack, nameOf }: { id: string; pack: StoryPack; nameOf: NameOf }) {
  const person = townOf(pack).byId.get(id)!
  const keeps = townOf(pack).spots.filter((s) => s.keeper === id).map((s) => s.name)
  const ties = keeperTies(pack, id)
  return (
    <>
      <p className="text-center text-[14px]" data-keeper-role>
        <span className="font-semibold">{person.role ? CAST[person.role].role : 'Of the town'}</span>
        <span className="block text-[13px] text-ink-soft">{person.does}{keeps.length > 0 ? ` · ${keeps.join(', ')}` : ''}</span>
      </p>
      {ties.length > 0 && (
        <ul className="divide-y divide-hairline rounded-md border border-hairline" data-keeper-ties>
          {ties.map((t) => (
            <li key={t.with} className="flex min-h-11 items-center gap-2 px-3 py-1.5 text-[13px]" data-keeper-tie={t.with}>
              <Face id={t.with} size={28} name={nameOf(t.with)} />
              <span className="min-w-0 flex-1"><span className="font-semibold">{nameOf(t.with)}</span><span className="text-ink-soft"> · {t.line}</span></span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
