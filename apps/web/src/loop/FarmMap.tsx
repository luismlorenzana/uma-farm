// The farm: `/`. A landscape tile map you look across, wider than the screen, so it scrolls sideways: the woods' edge,
// the field's sign over the pond's edge, a path, the farm's places on their lots (the yard, the homestead, the stations
// and the rest) and the road to town. The field's sign shows plot 1 small and the whole field's counts ("6 to water ·
// 2 ripe"); a tap opens the field's own screen, full screen, a plot a page (`/field`, `FieldScreen.tsx`). Tap the woods'
// edge to forage or chop, the pond's to fish, a station to start a load, the Coop or the
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
  ANIMAL_HOME, benchOpen, HEIRLOOMS, TOOL_NAMES, toolTierName, chapterTitle, farmPlace, fieldCounts, FIELD_COLUMNS, herChapters, homesteadShown, isBuildPlace, placeBuilt, placeOpen, placeWordsOf, stationBuilt,
  STATIONS, type BuildPlace, type DigId, type FarmPlace, type FarmPlaceId, type FarmSave, type RanchHome, type StationId,
} from '@farm/domain'
import { PeekPanel, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, LockedIcon, Sheet } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import type { FieldPondReviewProps } from '../hd2d/FieldPondReview'
import { GuideContent } from '../guide/Guide'
import { masterReady, useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { dismissSummary } from './actions'
import { RingArt } from '../items/RingArt'
import { BuildingArt, FieldSignArt, Trees, Water } from './farm-art'
import { CELL, FIELD, lockOf, MAP_ROWS, mapLots, MIN_CELL, placeLink, POND, WOODS, type Area } from './farm-map'
import { countsWords } from './farm-view'
import { GatherPanel, StationPanel } from './FarmPanels'
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
const FieldPondReview = lazy<ComponentType<FieldPondReviewProps>>(
  () => import('../hd2d/FieldPondReview').catch(() => ({ default: FieldPondUnavailable })),
)
const FIELD_POND = 'farm:field-pond'

function FieldPondUnavailable({ onUnavailable }: FieldPondReviewProps) {
  useEffect(onUnavailable, [onUnavailable])
  return null
}

function storedFieldPond(): boolean {
  if (typeof WebGL2RenderingContext === 'undefined') return false
  try { return sessionStorage.getItem(FIELD_POND) !== '0' } catch { return true }
}

function rememberFieldPond(on: boolean) {
  try {
    if (on) sessionStorage.setItem(FIELD_POND, '1')
    else sessionStorage.setItem(FIELD_POND, '0')
  } catch { /* A private session can play with the view open until it leaves the map. */ }
}

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

/** `/`, with an optional `?peek=<place>` (a quick look). An unknown one drops the panel; a tile's link from before the
 * field had its own screen (`?tile=<n>`) opens that tile there. */
export default function FarmRoute() {
  const [params] = useSearchParams()
  const location = useLocation()
  const save = useLoopSave()
  const peekId = params.get('peek')
  const peek = farmPlace(peekId)
  const tile = params.get('tile')
  if (tile !== null) return <Navigate to={`/field?tile=${encodeURIComponent(tile)}`} replace />
  if (peekId !== null && (!peek || peek.id === 'fields')) return <Navigate to={withParam(location, 'peek', null)} replace />
  if (!save) return null
  return <FarmScreen save={save} peek={peek} />
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
function FarmHelp({ onPreview }: { onPreview?: () => void }) {
  return (
    <div className={`absolute z-20 flex items-center gap-2 ${onPreview ? 'bottom-3 left-3' : 'right-3 top-2'}`}>
      <div className="rounded-full border border-hairline-strong bg-panel/95 shadow-3" data-farm-help>
        <HelpButton title="The farm" label="How the farm works">
          <GuideContent topic="farm">
            <p>The field’s sign shows what needs water, what’s ripe and where to plant. Tap it to open the plots.</p>
            <p>End the day to grow crops, sell goods and settle bills. Tap the date to see the calendar.</p>
          </GuideContent>
          <Link to="/guide?topic=actions" state={{ back: true }} className="flex min-h-11 items-center font-semibold text-accent-strong">Daily actions</Link>
        </HelpButton>
      </div>
      <Link to="/book?view=work" state={{ back: true }} className="inline-flex min-h-11 items-center rounded-full border border-hairline-strong bg-panel/95 px-3 text-[13px] font-semibold shadow-2" data-farm-work>Work</Link>
      <Link to="/?sheet=next" state={{ back: true }} className="inline-flex min-h-11 items-center rounded-full border border-hairline-strong bg-panel/95 px-3 text-[13px] font-semibold shadow-2" data-farm-next>What Next?</Link>
      {onPreview && typeof WebGL2RenderingContext !== 'undefined' &&
        <Button variant="secondary" className="min-h-11 shadow-2" onClick={onPreview}>Field and Pond</Button>}
    </div>
  )
}

/** The field's sign, a lot's size beside the woods: plot 1 drawn small, its name, and the whole field's counts at a
 * glance, "6 to water · 2 ripe"; a tap opens the field's screen. */
function FieldSign({ save, cell, name }: { save: FarmSave; cell: number; name: string }) {
  const words = countsWords(fieldCounts(save))
  const plots = save.fields.plots.length
  const label = [name, ...(plots > 1 ? [`${plots} plots`] : []), ...words].join(', ')
  return (
    <Link to="/field" state={{ back: true }} aria-label={label} className="absolute flex flex-col items-center justify-end gap-0.5 pb-1" style={at(FIELD, cell)}
      data-place="fields" data-field-sign>
      {/* The counts above the board, never over it: two short lines at most. */}
      {words.length > 0 && (
        <span className="flex max-w-full flex-wrap justify-center gap-0.5" data-field-counts>
          {words.map((w) => <span key={w} className="rounded-full bg-success px-1 text-[10px] leading-[14px] font-bold whitespace-nowrap text-ink-on-dark shadow-1">{w}</span>)}
        </span>
      )}
      <FieldSignArt tiles={save.fields.plots[0]!.tiles} plots={plots} size={cell * (words.length > 1 ? 1.2 : 1.45)} columns={FIELD_COLUMNS} />
      <span className="max-w-full truncate rounded-full bg-panel/90 px-1.5 text-[11px] font-semibold shadow-1">{name}</span>
    </Link>
  )
}

function FarmScreen({ save, peek }: { save: FarmSave; peek: FarmPlace | undefined }) {
  // The night reads master data: load it with the farm, so End the day doesn't wait for it. A failure shows
  // when the day ends, with Try again.
  useEffect(() => void masterReady().catch(() => undefined), [])
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const requested = params.get('map') === 'field-pond'
  const [preview, setPreview] = useState(() => requested || storedFieldPond())
  const [previewReady, setPreviewReady] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const choosePreview = useCallback((on: boolean) => {
    rememberFieldPond(on)
    setPreview(on)
    setPreviewFailed(false)
    if (!on) setPreviewReady(false)
  }, [])
  const previewUnavailable = useCallback(() => {
    choosePreview(false)
    setPreviewFailed(true)
  }, [choosePreview])
  const previewDidLoad = useCallback(() => setPreviewReady(true), [])
  useEffect(() => {
    if (!requested) return
    const next = new URLSearchParams(params)
    next.delete('map')
    choosePreview(true)
    setParams(next, { replace: true, state: location.state as unknown })
  }, [choosePreview, location.state, params, requested, setParams])
  const leave = useLeave()
  const [scroll, cell] = useCell()
  const readyNow = useReadyNow(save)
  const hearts = useMemo(() => new Set(readyNow.map((r) => r.id)), [readyNow])
  const story = useStory()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const { lots, road, cols } = mapLots(homesteadShown(save))
  const covered = peek !== undefined || params.get('sheet') !== null
  const peekWords = peek ? placeWordsOf(story, peek.id) : null
  const close = () => {
    const next = new URLSearchParams(location.search)
    next.delete('peek')
    const rest = next.toString()
    leave(`/${rest ? `?${rest}` : ''}`)
  }
  // From an open quick look, the next tap replaces it, so closing goes back to the farm as it was before the first.
  const hop = peek !== undefined ? { replace: true, state: location.state as unknown } : { state: { back: true } as unknown }
  const woods = placeWordsOf(story, 'forest')
  const pond = placeWordsOf(story, 'fishery')
  const fields = placeWordsOf(story, 'fields')
  return (
    <>
      <div ref={scroll} hidden={previewReady} className="absolute inset-0 overflow-x-auto overflow-y-hidden overscroll-contain" data-farm-scroll>
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
          {/* The field's sign: a tap opens the field's own screen. */}
          <FieldSign save={save} cell={cell} name={fields.name} />
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
      {preview && (
        <div className={`absolute inset-0 ${previewReady ? '' : 'invisible'}`}>
          <Suspense fallback={null}>
            <FieldPondReview save={save} story={story} covered={covered || save.summary !== null} hop={hop}
              onReady={previewDidLoad} onUnavailable={previewUnavailable} onClose={() => choosePreview(false)} />
          </Suspense>
        </div>
      )}
      <FarmHelp onPreview={previewReady ? undefined : () => choosePreview(true)} />
      {(previewFailed || (preview && !previewReady)) && (
        <p role="status" className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-panel px-3 py-2 text-[12px] shadow-2">
          {previewFailed ? 'Field and Pond is unavailable. Tile map restored.' : 'Loading Field and Pond…'}
        </p>
      )}
      {peek && peekWords && (
        <PeekPanel
          key={peek.id}
          title={peekWords.name}
          about={<p>{peekWords.line}</p>}
          onClose={close}
          words={{ close: 'Close', about: `About ${theName(peekWords.name)}`, backTo: 'Back to the farm' }}
          focusKey={`${previewReady ? '[data-field-pond] ' : ''}[data-place="${peek.id}"]`}
        >
          {peek.id === 'forge' ? <ForgeEntrance save={save} />
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

function ForgeEntrance({ save }: { save: FarmSave }) {
  return <div className="space-y-2 p-3">
    <Link to="/?sheet=forge" state={{ back: true }} className="grid min-h-11 place-items-center rounded-md border border-hairline bg-panel font-semibold">Forge workshop ›</Link>
    {benchOpen(save) ? <Suspense fallback={null}><BenchPeek save={save} /></Suspense>
      : <p className="text-ink-soft">Ring Bench · Opens the morning after your first Romance 8.</p>}
  </div>
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
  const tools = save.forge?.installed.filter(order => order.due === summary.day) ?? []
  const jewels = save.forge?.heirlooms.filter(order => order.ready === summary.day) ?? []
  return (
    <Sheet
      open={open}
      onClose={() => void dismissSummary()}
      size="wide"
      title={`Morning · ${shortDate(summary.day, save.calendar)}`}
      label="The morning summary"
      footer={<Button className="w-full" onClick={() => void dismissSummary()} data-action="start-day">Start the day</Button>}
    >
      <div className="space-y-3 pb-1" data-summary={summary.day}>
        {(tools.length > 0 || jewels.length > 0) && <section className="space-y-1" aria-label="Forge deliveries">
          <h3 className="text-micro">Forge deliveries</h3>
          {tools.map(order => <Link key={order.tool} className="block min-h-11" to={`/?sheet=forge&tool=${order.tool}`}>{toolTierName(order.tier)} {TOOL_NAMES[order.tool]} installed{order.assistant ? ` · Prepared with ${nameOf(order.assistant)}` : ''}</Link>)}
          {jewels.map(order => <Link key={`${order.recipient}:${order.piece}`} className="block min-h-11" to={`/?sheet=forge&tab=heirlooms&recipient=${order.recipient}&piece=${order.piece}`}>{HEIRLOOMS[order.piece].name} for {nameOf(order.recipient)} · Ready to give</Link>)}
        </section>}
        {parts.length === 0 && tools.length === 0 && jewels.length === 0 && <p className="text-ink-soft">A quiet night.</p>}
        {parts.map((part) => (
          <section key={part.section} data-section={part.section} aria-label={part.title}>
            <h3 className="text-micro pb-1">{part.title}</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline">
              {part.lines.map((line) => (
                <li key={line.key}>
                  <Link to={line.to} state={{ back: true }} className="flex min-h-11 items-center gap-2 px-3 text-[15px]" data-line={line.key}>
                    {line.ring && <RingArt id={line.ring} size={56} />}
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
