// The farm: `/`. A landscape tile map you look across, wider than the screen, so it scrolls sideways: the woods' edge,
// the field's tiles over the pond's edge, a path, the farm's places on their lots (the yard, the homestead, the stations
// and the rest) and the road to town. Tap a tile for its actions (`/?tile=<n>`): clear, till, plant, water, harvest,
// one action each. Tap the woods' edge to forage or chop, the pond's to fish, a station to start a load, the Coop or the
// Barn to feed, care for and collect, the Mine or the Quarry to work a face and take the stairs (their menus in the side
// panel, `/?peek=forest|fishery|<station>|coop|barn|mine|quarry`, the ranch's and the digs' loaded on demand), the bin
// to ship. A place's quick look opens in the side panel
// too: what it is, and what opens it while it's locked; a place to build with its Build card (`BuildCard.tsx`; the
// Dock's with the Boat's once it stands); the Gate's says the town is where you meet everyone. After a night the morning summary opens over the map until the player starts the
// day; its Hearts section lists who's Ready, read live; its bond hearts carry Read while a conversation waits, which
// plays over the morning (`?read=`); an invitation's line carries Yes, tonight and Another day; the Forge's quick look
// is the ring bench's once it stands. A place's name and its quick look's line are the pack's `world.json` where it
// gives them, else the game's own (`placeWordsOf`). Loaded on demand.
import {
  ANIMAL_HOME, chapterTitle, farmPlace, herChapters, homesteadShown, isBuildPlace, placeBuilt, placeOpen, placeWordsOf, stationBuilt, STATIONS,
  type BuildPlace, type DigId, type FarmPlace, type FarmPlaceId, type FarmSave, type RanchHome, type StationId,
} from '@farm/domain'
import { PeekPanel, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, CloseIcon, HelpButton, LockedIcon, Sheet } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { masterReady, useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { dismissSummary } from './actions'
import { BuildingArt, TileArt, Trees, Water } from './farm-art'
import { CELL, FIELD, lockOf, MAP_ROWS, mapLots, MIN_CELL, placeLink, POND, tileArea, WOODS, type Area } from './farm-map'
import { tileLabel, tileView } from './farm-view'
import { GatherPanel, StationPanel, TilePanel } from './FarmPanels'
import { GatePeek } from './GatePeek'
import { pairWords, readyLines } from './hearts-view'
import { houseLot } from './homestead-map'
import { homeWords } from './homestead-view'
import { NO_HOME, NO_WORLD, summaryParts, worldWords, type ChapterOf, type NoteOf } from './summary-words'
import { useTalents } from './talents'
import { shortDate, theName } from './words'

const InviteAnswer = lazy(() => import('./InviteAnswer'))
const BenchPeek = lazy(() => import('./BenchSheet').then((m) => ({ default: m.BenchPeek })))
const HouseAnswer = lazy(() => import('./HouseAnswer'))
const BuildCard = lazy(() => import('./BuildCard').then((m) => ({ default: m.BuildCard })))
const RanchPanel = lazy(() => import('./RanchPanels').then((m) => ({ default: m.RanchPanel })))
const DigPanel = lazy(() => import('./RanchPanels').then((m) => ({ default: m.DigPanel })))

const isStation = (id: string): id is StationId => (STATIONS as readonly string[]).includes(id)
const isHome = (id: string): id is RanchHome => id === 'coop' || id === 'barn'
const isDig = (id: string): id is DigId => id === 'mine' || id === 'quarry'
/** A place's tag on the map: a load ready tomorrow, the goods waiting in the Coop or the Barn, the floor a dig is on. */
function placeTag(save: FarmSave, id: FarmPlaceId): string | null {
  if (isStation(id) && stationBuilt(save, id) && save.loads[id]) return 'Ready tomorrow'
  if (isHome(id) && placeBuilt(save, id)) {
    const ready = save.ranch.animals.filter((a) => a.ready && ANIMAL_HOME[a.kind] === id).length
    return ready > 0 ? `${ready} to collect` : null
  }
  return isDig(id) && placeBuilt(save, id) ? `Floor ${Math.max(1, save.places[id].deepest)}` : null
}

/** `/`, with an optional `?tile=<n>` (a tile's actions) or `?peek=<place>` (a quick look). An unknown one drops the
 * panel. */
export default function FarmRoute() {
  const [params] = useSearchParams()
  const location = useLocation()
  const save = useLoopSave()
  const peekId = params.get('peek')
  const peek = farmPlace(peekId)
  const tileParam = params.get('tile')
  const tile = tileParam === null ? null : Number(tileParam)
  if (peekId !== null && (!peek || peek.id === 'fields')) return <Navigate to={withParam(location, 'peek', null)} replace />
  if (save && tile !== null && !(Number.isInteger(tile) && tile >= 0 && tile < save.fields.tiles.length)) return <Navigate to={withParam(location, 'tile', null)} replace />
  if (!save) return null
  return <FarmScreen save={save} peek={peek} tile={tile} />
}

/** Who's Ready today, read live; nobody before the pack loads. */
function useReadyNow(save: FarmSave) {
  const pack = useStory()
  return useMemo(() => (pack ? readyLines(save, pack) : []), [save, pack])
}

/** A cell's size: the map's seven rows fill the page's height, 40 to 52 points. */
function useCell(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [cell, setCell] = useState(CELL)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const fit = () => setCell(Math.max(MIN_CELL, Math.min(52, Math.floor(el.clientHeight / MAP_ROWS))))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, cell]
}

const at = (area: Area, cell: number): CSSProperties => ({ left: area.col * cell, top: area.row * cell, width: area.cols * cell, height: area.rows * cell })

/** How the farm works, behind the help button, at the map's foot on the left. */
function FarmHelp() {
  return (
    <div className="absolute bottom-3 left-3 z-20">
      <div className="rounded-full border border-hairline-strong bg-panel/95 shadow-3" data-farm-help>
        <HelpButton title="The farm" label="How the farm works">
          <p>A day holds 10 actions. Each task costs one: clear, till, plant, water or harvest a tile; forage, chop or fish; feed or care for an animal, or collect its building’s goods; work a face at the Mine or the Quarry; start a load; ship a crate; go into town.</p>
          <p>Looking is free, and so is building, and so are the mine’s stairs once found; the shops are free once you’re in town.</p>
          <p>A fed animal leaves its good by morning; one left hungry loses fondness. Cut grass on a weeds tile for the silo, or buy fodder at the rancher’s.</p>
          <p>A watered tile grows a stage at night; a dry one doesn’t. A season’s end withers what still grows.</p>
          <p>When the actions run out, end the day: the night pays the bin and the morning shows what grew.</p>
          <p>Tap the date for the calendar and the year’s festivals.</p>
        </HelpButton>
      </div>
    </div>
  )
}

function FarmScreen({ save, peek, tile }: { save: FarmSave; peek: FarmPlace | undefined; tile: number | null }) {
  // The night reads master data: load it with the farm, so End the day doesn't wait for it. A failure shows
  // when the day ends, with Try again.
  useEffect(() => void masterReady().catch(() => undefined), [])
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const [scroll, cell] = useCell()
  const readyNow = useReadyNow(save)
  const hearts = useMemo(() => new Set(readyNow.map((r) => r.id)), [readyNow])
  const story = useStory()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const { lots, road, cols } = mapLots(homesteadShown(save))
  const covered = peek !== undefined || tile !== null || params.get('sheet') !== null
  const peekWords = peek ? placeWordsOf(story, peek.id) : null
  const tilePath = (i: number) => {
    const next = new URLSearchParams(location.search)
    next.delete('peek')
    next.set('tile', String(i))
    return `/?${next}`
  }
  const close = () => {
    const next = new URLSearchParams(location.search)
    next.delete('peek')
    next.delete('tile')
    const rest = next.toString()
    leave(`/${rest ? `?${rest}` : ''}`)
  }
  // A tile's panel covers the map's right side: the map scrolls so the tile stays in view beside it.
  useEffect(() => {
    const el = scroll.current
    if (tile === null || !el) return
    const area = tileArea(tile)
    const left = area.col * cell
    const panel = Math.min(280, el.clientWidth * 0.45)
    const room = el.clientWidth - panel - 8
    if (left < el.scrollLeft) el.scrollTo({ left: Math.max(0, left - cell), behavior: 'smooth' })
    else if (left + cell > el.scrollLeft + room) el.scrollTo({ left: left + 2 * cell - room, behavior: 'smooth' })
  }, [tile, cell, scroll])
  // From an open tile, the next tap replaces it, so closing goes back to the farm as it was before the first tile.
  const hop = tile !== null ? { replace: true, state: location.state as unknown } : { state: { back: true } as unknown }
  const woods = placeWordsOf(story, 'forest')
  const pond = placeWordsOf(story, 'fishery')
  return (
    <>
      <div ref={scroll} className="absolute inset-0 overflow-x-auto overflow-y-hidden overscroll-contain" data-farm-scroll>
        <div className="relative" style={{ width: cols * cell, height: MAP_ROWS * cell, background: '#9cc27a' }} data-farm-map data-cell={cell}>
          {/* The woods' edge: forage and chop. */}
          <Link to="/?peek=forest" {...hop} aria-label={`${woods.name}: forage or chop`} className="absolute" style={at(WOODS, cell)} data-place="forest">
            <Trees />
            <span className="absolute inset-x-0 top-2 flex flex-col items-center gap-0.5">
              <BuildingArt frame="forest" size={cell * 1.2} />
              <span className="rounded-full bg-panel/90 px-1.5 text-[11px] font-semibold shadow-1">{woods.name}</span>
            </span>
          </Link>
          {/* The pond's edge: fish. */}
          <Link to="/?peek=fishery" {...hop} aria-label={`${pond.name}: fish`} className="absolute" style={at(POND, cell)} data-place="fishery">
            <Water />
            <span className="absolute inset-0 flex items-center justify-center gap-2">
              <BuildingArt frame="fishery" size={cell * 1.1} />
              <span className="rounded-full bg-panel/90 px-1.5 text-[11px] font-semibold shadow-1">{pond.name}</span>
            </span>
          </Link>
          {/* The field: a tap a tile. */}
          <div aria-hidden className="absolute rounded-[4px] ring-2 ring-[#6b4a2b]/40" style={at(FIELD, cell)} />
          <ul className="contents" aria-label="The field">
            {save.fields.tiles.map((t, i) => (
              <li key={i} className="absolute p-[1.5px]" style={at(tileArea(i), cell)}>
                <Link to={tilePath(i)} {...hop} aria-label={tileLabel(save, i)} aria-current={tile === i ? 'true' : undefined}
                  className={`relative block size-full rounded-[3px] ${tile === i ? 'z-10 outline-[3px] outline-offset-1 outline-white outline-solid' : ''}`} data-tile={i}
                  data-crop={t.crop ?? undefined} data-ready={t.ready || undefined}>
                  <TileArt tile={t} cell={cell} />
                </Link>
              </li>
            ))}
          </ul>
          {/* The farm's places on their lots. */}
          {lots.map((lot) => {
            if (lot.kind === 'house') {
              const house = houseLot(save, lot.place, nameOf)
              return (
                <Link key={house.id} to={house.to} {...hop} aria-label={house.label} className="absolute flex flex-col items-center justify-end gap-0.5 pb-1"
                  style={at(lot.area, cell)} data-place={house.id} data-locked={house.locked || undefined}>
                  <BuildingArt frame={house.frame} size={cell * 1.35} dim={house.locked} />
                  <span className="max-w-full truncate rounded-full bg-panel/90 px-1.5 text-[11px] font-semibold shadow-1">{house.name}</span>
                  {house.residents.length > 0 && (
                    <span className="absolute top-1 right-1 flex -space-x-1.5">
                      {house.residents.map((id) => (
                        <span key={id} className="relative">
                          <Avatar id={id} size={20} label={nameOf(id)} />
                          {hearts.has(id) && <span aria-hidden className="absolute -top-1 -right-1 text-[10px] text-danger">♥</span>}
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
              )
            }
            const place = farmPlace(lot.id)!
            const { name } = placeWordsOf(story, place.id)
            const lock = lockOf(save, place)
            const tag = placeTag(save, place.id)
            return (
              <Link key={place.id} to={placeLink(save, place)} {...hop} className="absolute flex flex-col items-center justify-end gap-0.5 pb-1" style={at(lot.area, cell)}
                aria-label={lock ? `${name}, locked: ${lock}` : tag ? `${name}, ${tag.toLowerCase()}` : name}
                data-place={place.id} data-locked={lock !== null || undefined}>
                <BuildingArt frame={place.frame} size={cell * 1.35} dim={lock !== null} />
                <span className="flex max-w-full items-center gap-0.5 truncate rounded-full bg-panel/90 px-1.5 text-[11px] font-semibold shadow-1">
                  {lock && <LockedIcon size={14} />}{name}
                </span>
                {tag && <span className="absolute top-1 rounded-full bg-success px-1.5 text-[10px] font-bold text-ink-on-dark shadow-1" data-tag>{tag}</span>}
              </Link>
            )
          })}
          {/* The road to town. */}
          <Link to="/town" aria-label="The road to town" className="absolute flex flex-col items-center justify-center gap-1 bg-[#cdb48a] text-[11px] font-bold text-[#5b4325]"
            style={at(road, cell)} data-place="road">
            <span aria-hidden className="text-[18px]">›</span>
            <span className="[writing-mode:vertical-rl]">To town</span>
          </Link>
        </div>
      </div>
      <FarmHelp />
      {tile !== null && <TileSheet save={save} tile={tile} onClose={close} />}
      {peek && peekWords && (
        <PeekPanel
          key={peek.id}
          title={peekWords.name}
          about={<p>{peekWords.line}</p>}
          onClose={close}
          words={{ close: 'Close', about: `About ${theName(peekWords.name)}`, backTo: 'Back to the farm' }}
          focusKey={`[data-place="${peek.id}"]`}
        >
          {peek.id === 'forge' && lockOf(save, peek) === null ? <Suspense fallback={null}><BenchPeek save={save} /></Suspense>
            : peek.id === 'forest' || peek.id === 'fishery' ? <GatherPanel save={save} place={peek.id} />
              : peek.id === 'gate' && lockOf(save, peek) === null ? <GatePeek save={save} />
                : isStation(peek.id) && placeOpen(save, peek) && stationBuilt(save, peek.id) ? <StationPanel save={save} station={peek.id} />
                  : isHome(peek.id) && placeBuilt(save, peek.id) ? <Suspense fallback={null}><RanchPanel save={save} home={peek.id} /></Suspense>
                    : isDig(peek.id) && placeBuilt(save, peek.id) ? <Suspense fallback={null}><DigPanel save={save} dig={peek.id} /></Suspense>
                      : <PlacePeek save={save} place={peek} />}
        </PeekPanel>
      )}
      <Morning save={save} open={!covered} />
    </>
  )
}

/** A tile's panel down the right edge, with no veil over the map, so a tap on another tile moves it there: tile after
 * tile without closing it. Close or Escape puts it away. */
function TileSheet({ save, tile, onClose }: { save: FarmSave; tile: number; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const view = tileView(save, tile)
  return (
    <aside aria-label={`${view.title}, ${view.where}`} className="pr-safe absolute inset-y-0 right-0 z-30 flex w-[280px] max-w-[45%] flex-col border-l border-hairline bg-panel shadow-3" data-tile-sheet={tile}>
      <header className="flex min-h-11 items-center gap-2 border-b border-hairline pl-4">
        <h2 className="font-display min-w-0 flex-1 truncate text-[17px] font-bold">{view.title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center text-ink-soft" data-action="close-tile">
          <CloseIcon size={20} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <TilePanel save={save} index={tile} />
      </div>
    </aside>
  )
}

/** A place's quick look while its page isn't wired up: what it is, and what opens it; a place to build, its Build card
 * until it stands. The Dock, once built, offers the Boat. */
function PlacePeek({ save, place }: { save: FarmSave; place: FarmPlace }) {
  const [note, setNote] = useState<string | null>(null)
  const { line } = placeWordsOf(useStory(), place.id)
  const lock = lockOf(save, place)
  const boat = farmPlace('boat') as BuildPlace
  const build = isBuildPlace(place) && !placeBuilt(save, place.id) ? place : place.id === 'dock' && !placeBuilt(save, 'boat') ? boat : null
  return (
    <div className="space-y-2 p-4" data-peek={place.id} data-lock={lock ?? undefined}>
      {note && <p role="status" className="text-[13px] font-semibold text-success" data-build-note>{note}</p>}
      {lock && !build && <p className="text-[15px] font-semibold">{lock === 'Soon' ? 'Opens soon' : `Opens with ${lock}`}</p>}
      {build === boat && <p className="text-[14px]" data-dock-open>The Sea Pier is open at the pond’s edge. The Boat takes you to the Deep Sea.</p>}
      {place.id === 'dock' && placeBuilt(save, 'boat') && <p className="text-[14px]" data-dock-open>The Sea Pier and the Deep Sea are open at the pond’s edge.</p>}
      {build ? <Suspense fallback={null}><BuildCard save={save} place={build} say={setNote} /></Suspense> : <p className="text-[14px] text-ink-soft" data-place-line>{line}</p>}
    </div>
  )
}

/** The morning summary: one wide card after every night, its sections in order with the empty ones
 * hidden, each line a tap to its place. "Start the day" puts it away; a tap on a line leaves it for later. */
function Morning({ save, open }: { save: FarmSave; open: boolean }) {
  const summary = save.summary
  const master = useMaster()
  const album = master.status === 'ready' ? master.view.album : null
  const ready = useReadyNow(save)
  const pack = useStory()
  const talents = useTalents()
  // Which bond lines have a conversation to Read, from the pack and what's been read.
  const pairs = useMemo(() => (pack ? pairWords(save, pack) : null), [save, pack])
  const nameOf = useMemo(() => (id: string) => album?.get(id)?.name ?? 'An Uma', [album])
  // The homestead's lines.
  const home = useMemo(() => (pack ? homeWords(save, pack, nameOf, (id) => talents.table?.get(id)?.temperament ?? 'steady') : NO_HOME),
    [save, pack, nameOf, talents.table])
  // A chapter's title by its number, from her chapters in the pack.
  const chapterOf = useMemo((): ChapterOf | undefined => {
    if (!pack) return undefined
    return (id, n) => {
      const chapter = herChapters(pack, id)[n - 1]
      return chapter ? chapterTitle(chapter) : null
    }
  }, [pack])
  // A new story release's note, from the release the game plays.
  const noteOf = useMemo((): NoteOf | undefined => (pack ? (n) => (pack.release?.number === n ? pack.release.note : null) : undefined), [pack])
  // The world's words: festivals' names, the season's line, the Town notes' titles and the town's name.
  const world = useMemo(() => (pack ? worldWords(pack) : NO_WORLD), [pack])
  const parts = useMemo(() => (summary ? summaryParts(summary, nameOf, ready, pairs, home, chapterOf, noteOf, world) : []), [summary, nameOf, ready, pairs, home, chapterOf, noteOf, world])
  if (!summary) return null
  return (
    <Sheet
      open={open}
      onClose={() => void dismissSummary()}
      size="wide"
      title={`Morning · ${shortDate(summary.day)}`}
      label="The morning summary"
      footer={<Button className="w-full" onClick={() => void dismissSummary()} data-action="start-day">Start the day</Button>}
    >
      <div className="space-y-3 pb-1" data-summary={summary.day}>
        {parts.length === 0 && <p className="text-ink-soft">A quiet night.</p>}
        {parts.map((part) => (
          <section key={part.section} data-section={part.section} aria-label={part.title}>
            <h3 className="text-micro pb-1">{part.title}</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline">
              {part.lines.map((line) => (
                <li key={line.key}>
                  <Link to={line.to} state={{ back: true }} className="flex min-h-11 items-center gap-2 px-3 text-[15px]" data-line={line.key}>
                    <span className="min-w-0 flex-1">{line.text}</span>
                    {line.tag && (
                      <span className={`shrink-0 rounded-full px-1.5 text-[11px] font-semibold ${line.warn ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`} data-tag data-warn={line.warn || undefined}>
                        {line.tag}
                      </span>
                    )}
                  </Link>
                  {line.quote && <p className="px-3 pb-2 text-[13px] italic text-ink-soft" data-house-quote>{line.quote}</p>}
                  {line.invite && <Suspense fallback={null}><InviteAnswer id={line.invite} /></Suspense>}
                  {line.misses !== undefined && <Suspense fallback={null}><HouseAnswer house={line.misses} /></Suspense>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
