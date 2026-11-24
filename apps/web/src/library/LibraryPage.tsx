import {
  archivedDiscoveries, atHome, awayOn, bookDiscoveries, bookHistory, bookMilestones, bookProgress, dateOf, festivalsOf, gradeOf,
  GRADE_NAMES, greaterLoveOf, handsTonight, LAUNCH_CAST, levelWords, libraryEntryName, longGameEnabled, NO_BIRTHDAYS, SEASON_NAMES, TOOL_NAMES, toolTierName, TRUE_LOVE,
  type FarmSave, type SpecialDays, type StoryPack,
} from '@farm/domain'
import { GuideButton } from '../guide/Guide'
import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { Avatar } from '../dialogue/Avatar'
import { ProfileChapters, ProfileDetails, TownCard } from '../loop/HeartProfile'
import { nextCard, profileLine } from '../loop/hearts-view'
import { LoveActs } from '../loop/Love'
import { byRelationship } from '../loop/relationship-order'
import { umaRows } from '../loop/roster-view'
import { WorkFacts, WorkSide } from '../loop/RosterAlbum'
import { talentTable, useTalents } from '../loop/talents'
import { useMaster, type MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useSpecialDays, useStory } from '../story/story'
import { MarriedLife } from './MarriedLife'
import { Jewelry } from './Jewelry'
import { RelationshipPage } from './RelationshipPage'
import './library.css'

const GalleryPage = lazy(() => import('./LibraryScenes'))
const PER_TIER = 10
const BOOK_PAGES = [['relationship', 'Relationship'], ['profile', 'Profile'], ['abilities', 'Abilities'], ['chapters', 'Chapters'], ['scenes', 'Scenes'], ['history', 'Our Story'], ['married', 'Married Life'], ['jewelry', 'Jewelry']] as const
export const libraryDate = (day: number | null, clock?: FarmSave['calendar']) => {
  if (day === null) return 'Date unknown'
  const { year, season, day: d } = dateOf(day, clock)
  return `Y${year} · ${SEASON_NAMES[season]} ${d}`
}
export const libraryHref = (uma: string, page = 'relationship') => `/library?uma=${encodeURIComponent(uma)}&page=${page}`
const button = 'lib-button'

interface Shelf { name: string; ids: (string | null)[] }
type ShelfOrder = 'relationship' | 'cast' | 'name' | 'tier'
const SHELF_ORDERS: readonly [ShelfOrder, string][] = [
  ['relationship', 'Relationship'], ['cast', 'Cast order'], ['name', 'Name (A–Z)'], ['tier', 'By tier'],
]
function collectionShelves(save: FarmSave, pack: StoryPack): Shelf[] {
  const cast = new Set(pack.cast.umas.map(uma => uma.characterId))
  const known = new Set(LAUNCH_CAST)
  const shelves: Shelf[] = []
  for (let at = 0; at < LAUNCH_CAST.length; at += PER_TIER) {
    const tier = LAUNCH_CAST.slice(at, at + PER_TIER)
    if (!tier.some(id => cast.has(id))) continue
    shelves.push({ name: `Tier ${at / PER_TIER + 1}`, ids: tier.map(id => cast.has(id) ? id : null) })
  }
  const extra = [...cast].filter(id => !known.has(id))
  for (let at = 0; at < extra.length; at += PER_TIER) shelves.push({ name: `Shelf ${shelves.length + 1}`, ids: extra.slice(at, at + PER_TIER) })
  const others = Object.keys(save.roster).filter(id => !cast.has(id)).sort((a, b) => save.roster[a]!.joined - save.roster[b]!.joined || a.localeCompare(b))
  for (let at = 0; at < others.length; at += PER_TIER) shelves.push({ name: 'Earlier cast', ids: others.slice(at, at + PER_TIER) })
  return shelves
}

function shelvesFor(save: FarmSave, pack: StoryPack, order: ShelfOrder, master: MasterView | null): Shelf[] {
  const tiers = collectionShelves(save, pack)
  if (order === 'tier') return tiers
  const ids = tiers.flatMap(shelf => shelf.ids.filter((id): id is string => !!id && !!save.roster[id]))
  if (order === 'relationship') ids.sort(byRelationship(save))
  if (order === 'name') {
    const nameOf = namer(master, pack)
    ids.sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  }
  return Array.from({ length: Math.ceil(ids.length / PER_TIER) }, (_, i) => ({
    name: `Shelf ${i + 1}`, ids: ids.slice(i * PER_TIER, (i + 1) * PER_TIER),
  }))
}

export default function LibraryPage() {
  const save = useLoopSave()
  const pack = useStory()
  const master = useMaster()
  const special = useSpecialDays()
  const [params, set] = useSearchParams()
  const [order, setOrder] = useState<ShelfOrder>('relationship')
  const view = master.status === 'ready' ? master.view : null
  const days = useMemo(() => special ?? { festivals: festivalsOf(pack), birthdays: NO_BIRTHDAYS }, [special, pack])
  const shelves = useMemo(() => save && pack ? shelvesFor(save, pack, order, view) : [], [save, pack, order, view])
  if (!save || !pack) return null
  const id = params.get('uma')
  return <main className="uma-library absolute inset-0 overflow-y-auto overscroll-contain" data-page="library">
    {id && save.roster[id] && save.love[id]
      ? <OpenBook key={id} save={save} pack={pack} days={days} id={id} master={view} params={params} shelves={shelves} />
      : <ShelfView save={save} pack={pack} days={days} master={view} params={params} shelves={shelves} order={order}
          setOrder={next => { setOrder(next); set({ shelf: '1' }, { replace: true }) }}
          setShelf={shelf => set({ shelf: String(shelf + 1) }, { replace: true })} />}
  </main>
}

type Base = { save: FarmSave; pack: StoryPack; days: SpecialDays; master: MasterView | null }

function ShelfView({ save, pack, days, master, params, shelves, order, setOrder, setShelf }: Base & {
  params: URLSearchParams; shelves: Shelf[]; order: ShelfOrder; setOrder: (order: ShelfOrder) => void; setShelf: (shelf: number) => void
}) {
  const index = Number(params.get('shelf') ?? 0) - 1
  const start = Math.max(0, shelves.findIndex(shelf => shelf.ids.some(id => id && save.roster[id])))
  const shown = Number.isInteger(index) && shelves[index] ? index : start
  const shelf = shelves[shown]
  const touch = useRef<[number, number] | null>(null)
  const met = Object.keys(save.roster).length
  const total = new Set([...pack.cast.umas.map(uma => uma.characterId), ...Object.keys(save.roster)]).size
  const nameOf = namer(master, pack)
  return <>
    <header className="lib-head">
      <div><h1>Uma Library</h1><p>{met} of {total} met</p></div>
      {shelf && shelves.length > 1 && <nav aria-label="Shelves" className="lib-pagination">
        <button type="button" className={button} disabled={!shelves[shown - 1]} onClick={() => setShelf(shown - 1)} aria-label="Previous shelf">‹</button>
        <span aria-live="polite">{order === 'tier' ? `${shelf.name} · ` : ''}{shown + 1}/{shelves.length}</span>
        <button type="button" className={button} disabled={!shelves[shown + 1]} onClick={() => setShelf(shown + 1)} aria-label="Next shelf">›</button>
      </nav>}
      <div className="lib-actions">
        {met > 0 && <select className={button} aria-label="Sort books" value={order} onChange={e => setOrder(e.target.value as ShelfOrder)}>
          {SHELF_ORDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>}
        <Link className={button} to="/hearts" state={{ back: true }}>People &amp; work</Link>
        <GuideButton topic="library" title="Uma Library" label="About the Library">
          <p>Meet an Uma to place her book on the shelf. Playing her scenes, learning her tastes and reaching milestones fills the book.</p>
          <p>Open a book, read a page or replay a scene for free.</p>
        </GuideButton>
      </div>
    </header>
    {met === 0 ? <div className="lib-empty"><p>Meet someone in town.</p><Link className={button} to="/town?view=people">Town ›</Link></div>
      : shelf && <>
        <div className="lib-shelves" data-shelf={shown + 1}
          onTouchStart={e => { const first = e.touches[0]; if (first) touch.current = [first.clientX, first.clientY] }}
          onTouchEnd={e => {
            const origin = touch.current
            const end = e.changedTouches[0]
            touch.current = null
            if (!origin || !end) return
            const x = end.clientX - origin[0]
            if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(end.clientY - origin[1])) {
              const step = shown + (x < 0 ? 1 : -1)
              if (shelves[step]) setShelf(step)
            }
          }}>
          {[0, 5].map(from => <div key={from} className="lib-row">
            {Array.from({ length: 5 }, (_, offset) => {
              const id = shelf.ids[from + offset]
              if (!id || !save.roster[id]) return <span key={offset} className="lib-spacer" aria-hidden="true" />
              const name = nameOf(id)
              const progress = bookProgress(save, pack, id, days)
              const full = progress.available > 0 && progress.filled === progress.available
              const love = save.love[id]!
              const standing = levelWords(love, true)
              const greater = love.stage === 'spouse' && longGameEnabled(save, pack) ? greaterLoveOf(save, id).points : null
              const married = greater === null ? null : greater >= TRUE_LOVE ? 'True Love' : `Greater Love ${greater}/${TRUE_LOVE}`
              return <Link key={id} className="lib-cover" data-book-cover={id} data-tone={(from + offset) % 5} data-completed={full || undefined}
                to={libraryHref(id)} state={{ back: true }} aria-label={`Open ${name}’s book, ${standing}${married ? `, ${married}` : ''}, ${progress.filled} of ${progress.available} filled`}>
                <Avatar id={id} size={52} label={name} />
                <strong>{name}</strong>
                <span className="lib-cover-standing">{standing}</span>
                {married && <span className="lib-cover-greater">{married}</span>}
                <small className="tabular-nums">{full ? '✓ ' : ''}{progress.filled}/{progress.available}</small>
              </Link>
            })}
          </div>)}
        </div>
      </>}
  </>
}

function OpenBook({ save, pack, days, master, id, params, shelves }: Base & { id: string; params: URLSearchParams; shelves: Shelf[] }) {
  const love = save.love[id]!
  const pages = BOOK_PAGES.filter(([key]) => {
    if (key === 'married') return love.stage === 'spouse' && longGameEnabled(save, pack)
    if (key === 'jewelry') return ['proposal', 'wedding', 'spouse'].includes(love.stage) || love.ring !== undefined
    return true
  })
  const page = pages.find(([key]) => key === params.get('page')) ?? BOOK_PAGES[0]
  const nameOf = namer(master, pack)
  const name = nameOf(id)
  const index = shelves.findIndex(shelf => shelf.ids.includes(id))
  const toShelf = `/library?shelf=${Math.max(1, index + 1)}`
  const progress = useMemo(() => bookProgress(save, pack, id, days), [save, pack, id, days])
  const complete = progress.available > 0 && progress.filled === progress.available
  return <div data-open-book={id}>
    <header className="lib-head lib-book-head">
      <Link to={toShelf} className={button}>‹ Shelves</Link>
      <h1>{name}</h1>
      <p className="tabular-nums" data-book-progress={`${progress.filled}/${progress.available}`}>{complete ? 'Complete · ' : ''}{progress.filled}/{progress.available}</p>
    </header>
    <div className="lib-spread">
      <aside className="lib-binding">
        <div className="lib-portrait"><Avatar id={id} size={48} label={name} /><span>{levelWords(love, longGameEnabled(save, pack))}</span></div>
        <nav aria-label="Book pages" className="lib-tabs">{pages.map(([key, label]) =>
          <Link className={button} aria-current={key === page[0] ? 'page' : undefined} key={key} to={libraryHref(id, key)} replace>{label}</Link>)}</nav>
        <ul className="lib-counts">
          {Object.entries({ Scenes: progress.scenes, Discoveries: progress.facts, Milestones: progress.milestones }).map(([label, value]) =>
            <li key={label}>{label} <b>{value.filled}/{value.available}</b></li>)}
        </ul>
      </aside>
      <article className="lib-paper" aria-label={page[1]} data-library-page={page[0]}>
        {page[0] === 'relationship' && <RelationshipPage save={save} pack={pack} days={days} id={id} nameOf={nameOf} />}
        {page[0] === 'profile' && <BookProfile save={save} pack={pack} days={days} id={id} nameOf={nameOf} archived={params.get('facts') === 'archive'} />}
        {page[0] === 'abilities' && <Abilities save={save} pack={pack} id={id} master={master} />}
        {page[0] === 'chapters' && <>
          <h2>Chapters</h2>
          {master && <LoveActs save={save} pack={pack} id={id} name={name} temperament={talentTable(master).get(id)?.temperament ?? null} master={master} onPaid={() => undefined} />}
          <ProfileChapters save={save} pack={pack} id={id} card={nextCard(save, pack, id, nameOf)} nameOf={nameOf} />
        </>}
        {page[0] === 'scenes' && <Suspense fallback={<p>Loading scenes…</p>}><GalleryPage save={save} pack={pack} days={days} id={id} master={master} /></Suspense>}
        {page[0] === 'history' && <History save={save} pack={pack} id={id} tab={params.get('journal')} />}
        {page[0] === 'jewelry' && <Jewelry save={save} pack={pack} id={id} />}
        {page[0] === 'married' && <MarriedLife save={save} pack={pack} id={id} nameOf={nameOf} />}
      </article>
    </div>
  </div>
}

function BookProfile({ save, pack, days, id, nameOf, archived }: Omit<Base, 'master'> & { id: string; nameOf: (id: string) => string; archived: boolean }) {
  const facts = bookDiscoveries(save, pack, id, days)
  const archive = archivedDiscoveries(save, id, facts)
  return <>
    <h2>Profile</h2>
    <p>{profileLine(save, pack, id, days.birthdays).join(' · ')}</p>
    {(!atHome(save, id) || pack.town?.professions?.length || awayOn(save, id, save.calendar.day)) && <TownCard save={save} pack={pack} id={id} />}
    <div className="lib-head"><h3>Discoveries</h3>{archive.length > 0 && <Link className={button} replace
      to={libraryHref(id, 'profile') + (archived ? '' : '&facts=archive')}>{archived ? 'Current' : 'Archive'}</Link>}</div>
    <ul className="lib-lines">{(archived ? archive : facts).map(fact =>
      <li key={fact.key} data-discovery={fact.value === null ? 'unknown' : 'known'}>
        <span>{fact.title}</span>
        <strong>{fact.value ?? (archived ? 'Previously discovered' : 'Undiscovered')}</strong>
        {fact.day !== null && <small>{libraryDate(fact.day, save.calendar)}</small>}
      </li>)}</ul>
    <ProfileDetails save={save} pack={pack} id={id} nameOf={nameOf} showRing={false} />
  </>
}

function Abilities({ save, pack, id, master }: Pick<Base, 'save' | 'pack' | 'master'> & { id: string }) {
  const row = umaRows(save, [id], master?.album ?? new Map(), master ? talentTable(master) : null, pack)[0]
  return <>
    <div className="lib-head"><h2>Abilities</h2>{row && row.farmhand !== null && <Link className={button} to={`/book?hand=${id}`}>Work orders ›</Link>}</div>
    {row?.farmhand != null && <ShiftEquipment save={save} pack={pack} id={id} />}
    {row && <><WorkFacts row={row} /><WorkSide row={row} /></>}
  </>
}

function ShiftEquipment({ save, pack, id }: Pick<Base, 'save' | 'pack'> & { id: string }) {
  const { of } = useTalents()
  const shift = useMemo(() => save.forge?.rack?.length ? handsTonight(save, save, of, pack) : null, [save, of, pack])
  const onShift = shift?.lines.some(line => line.id === id)
  const slots = [...new Set(shift?.jobs?.filter(job => job.id === id).flatMap(job => job.rackSlot ?? []) ?? [])]
  return <section>
    <div className="lib-head"><h3>Shift tools</h3><Link className={button} to="/?sheet=forge" state={{ back: true }}>Tool Rack ›</Link></div>
    {slots.length ? <ul className="lib-lines" data-shift-tools={save.today.crew ? 'actual' : 'forecast'}>
      {slots.map(slot => {
        const copy = save.forge?.rack?.[slot]
        return copy && <li key={slot}>
          <ItemIcon id={`tool/${copy.tool}/tier-${copy.tier}`} size={24} />
          <span>{toolTierName(copy.tier)} {TOOL_NAMES[copy.tool]}</span>
          <small>{save.today.crew ? 'Used today' : 'Forecast today'}</small>
        </li>
      })}
    </ul> : <p>{shift && !onShift ? 'Off shift today.' : 'No rack copies assigned today.'}</p>}
  </section>
}

function History({ save, pack, id, tab }: Pick<Base, 'save' | 'pack'> & { id: string; tab: string | null }) {
  const history = bookHistory(save, id)
  const progress = bookMilestones(save, id, pack).filter(row => row.earned)
  const completed = save.library?.[id]?.complete
  const recorded = completed === undefined ? progress : [...progress, { key: 'complete', title: 'Completed her book', day: completed, earned: true }]
  const moments = [...recorded].sort((a, b) => (a.day ?? Infinity) - (b.day ?? Infinity))
  const recent = tab === 'recent'
  return <>
    <h2>Our Story</h2>
    <nav aria-label="Journal" className="lib-actions">
      <Link to={libraryHref(id, 'history')} className={button} aria-current={!recent ? 'page' : undefined} replace>Milestones</Link>
      <Link to={libraryHref(id, 'history') + '&journal=recent'} className={button} aria-current={recent ? 'page' : undefined} replace>Recent outings</Link>
    </nav>
    {recent ? <>
      {!history.recent.length && <p>{history.lastEvening ? `Last evening · ${libraryDate(history.lastEvening, save.calendar)}` : 'No outings yet.'}</p>}
      <ol className="lib-lines">{history.recent.map(([day, entry, score], at) => {
        const [family, kind] = entry.split(':')
        const current = kind && (kind === 'cooking-contest' ? save.calendar.day === day
          : Object.entries(save.workshops.festival?.last ?? {}).some(([id, card]) => id === kind && card.day === day))
        return <li key={`${day}:${entry}:${at}`} data-journal-entry={entry}>
        <small>{libraryDate(day, save.calendar)}</small><strong>{libraryEntryName(entry, pack)}</strong>
        {score !== null && <span>{entry.startsWith('evening:') ? GRADE_NAMES[gradeOf(score)] : `${score} pts`}</span>}
        {family === 'evening' && <Link className={button} to={libraryHref(id, 'scenes') + `&group=outings&tile=evening:${kind}`}>Scene ›</Link>}
        {family === 'festival' && <Link className={button} to={!current ? '/diary' : kind === 'cooking-contest' ? '/?sheet=kitchen' : `/?sheet=festival&contest=${kind}`}>Result ›</Link>}
        {family === 'expedition' && <Link className={button} to="/?peek=expeditions">Expedition post ›</Link>}
      </li>})}</ol>
      {Object.keys(history.totals).length > 0 && <><h3>Lifetime</h3><ul className="lib-lines">
        {Object.entries(history.totals).map(([kind, [count, first, latest, best]]) => <li key={kind}>
          <strong>{libraryEntryName(kind, pack)}</strong><span>{count} · First {libraryDate(first, save.calendar)} · Latest {libraryDate(latest, save.calendar)}</span>
          {best !== null && <span>Best {kind.startsWith('evening:') ? GRADE_NAMES[gradeOf(best)] : `${best} pts`}</span>}
        </li>)}
      </ul></>}
    </> : <ol className="lib-lines">{moments.map(moment => <li key={moment.key} data-milestone={moment.key}>
      <small>{libraryDate(moment.day, save.calendar)}</small><strong>{moment.title}</strong>
      {moment.key === 'proposal' || moment.key === 'wedding' || moment.key === 'confession' || moment.key === 'met'
        ? <Link className={button} to={libraryHref(id, 'scenes') + `&group=route&tile=route:${moment.key === 'met' ? 'arrival' : moment.key}`}>Scene ›</Link> : null}
    </li>)}</ol>}
    <Link className={button} to="/diary">Farm Diary ›</Link>
  </>
}
