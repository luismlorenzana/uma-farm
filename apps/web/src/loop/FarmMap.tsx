// The farm: `/`. uma-kit's Hub map in eight rows of three, the core
// loop's rows, on uma-art's buildings; taller than a phone's screen, it scrolls, with the help button and the Collect all
// pill fixed. A place's quick look opens in the side panel (`/?peek=<place>`): what it is, and what opens it while it's
// locked, a place to build with its Build card (`BuildCard.tsx`; the Dock's with the Boat's once it stands); the Gate's
// says what brings the next arrivals. After a night the morning summary opens over the map until the
// player starts the day. A Ready Uma's pip carries ♥ wherever the map draws her and the morning's Hearts section lists
// who's Ready, both read live; its bond hearts carry Read while a conversation waits, which plays over the morning
// (`?read=`); an invitation's line carries Yes, tonight and Another day; the Forge's quick look is the ring bench's once
// it stands. The map grows the homestead's rows after the yard, the town edge moving below them (`homestead-map.tsx`).
// With the preview switch on (Account → HD-2D farm), the same places draw on the shared HD-2D
// stage instead (`FarmStage.tsx`, its own chunk with three.js), with the Umas on it from the same work view and Ready
// hearts as the pips; off, the Hub is as it was. Loaded on demand.
import {
  farmEnv, farmPlace, isBuildPlace, LOOP_WORK_PLACES, loopKinds, loopReadyWork, loopWorld, MAP_PLACES, placeBuilt, placeOpen, readyPlots, workNow, type BuildPlace,
  type FarmPlace, type LoopPlaceId, type FarmSave,
} from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { ART_TILE, artScale, HubMap, hubDpr, PALETTES, type HubMapPlace, type PageGround, type PipModel } from '@luismlorenzana/uma-kit/hub'
import { FloatingPill, PeekPanel, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { workView, type WorkView } from '@luismlorenzana/uma-kit/work'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { useStageOn } from '../app/stage-switch'
import { masterReady, useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { collectFarm, dismissSummary } from './actions'
import { FARM_MAP_TILES, lockOf, placeAt, placeLink } from './farm-map'
import { FieldsPeek, fieldsPips } from './FieldsPeek'
import { GatePeek } from './GatePeek'
import { pairWords, readyLines } from './hearts-view'
import { homeWords } from './homestead-view'
import { NO_HOME, summaryParts } from './summary-words'
import { farmingTalents, useTalents } from './talents'
import { shortDate } from './words'
import { WorkPlacePeek } from './WorkPlace'
import { isWorkScreen } from './work-view'

const GROUND: PageGround = { id: 'farm', tiles: 'farmlands', palette: PALETTES.farmlands! }
const InviteAnswer = lazy(() => import('./InviteAnswer'))
const BenchPeek = lazy(() => import('./BenchSheet').then((m) => ({ default: m.BenchPeek })))
const HouseAnswer = lazy(() => import('./HouseAnswer'))
const BuildCard = lazy(() => import('./BuildCard').then((m) => ({ default: m.BuildCard })))
type HomesteadMap = typeof import('./homestead-map')
// Home on the shared HD-2D stage, with three.js, loaded only when the preview switch is on.
const FarmStage = lazy(() => import('./FarmStage'))
/** Sheets and scenes that cover all of Home: the stage rests under them. */
const FULL_SCREEN = ['event', 'ask', 'memory', 'album', 'read', 'evening', 'level', 'household'] as const

/** The homestead's map module, loaded on demand; null until it's in. */
function useHomesteadMap(): HomesteadMap | null {
  const [module, setModule] = useState<HomesteadMap | null>(null)
  useEffect(() => {
    if (module === null) void import('./homestead-map').then(setModule)
  }, [module])
  return module
}
const WORK_PLACES: ReadonlySet<string> = new Set(LOOP_WORK_PLACES)

/** `/`, with an optional `?peek=<place>` quick look. An unknown place drops the panel. */
export default function FarmRoute() {
  const [params] = useSearchParams()
  const location = useLocation()
  const save = useLoopSave()
  const peekId = params.get('peek')
  const peek = farmPlace(peekId)
  if (peekId !== null && !peek) return <Navigate to={withParam(location, 'peek', null)} replace />
  if (!save) return null
  return <FarmScreen save={save} peek={peek} />
}

/** A work place's slot pips: who works there, ringed by her job's progress, or free dots; a Ready Uma's carries ♥. */
function pipsOf(place: FarmPlace, work: WorkView, hearts: ReadonlySet<string>): PipModel[] | undefined {
  if (!WORK_PLACES.has(place.id)) return undefined
  return work.cards(place.id).map((card): PipModel => card.kind === 'free' ? { state: 'free' } : {
    state: card.running ? 'busy' : 'ready', progress: card.progress, queued: card.queue.length,
    face: <FaceTile outfitId={card.outfitId} size={24} label="Working Uma" round />, ...(hearts.has(card.outfitId) ? { badge: '♥' } : {}),
  })
}

/** Who's Ready today, read live; nobody before the pack loads. */
function useReadyNow(save: FarmSave) {
  const pack = useStory()
  return useMemo(() => (pack ? readyLines(save, pack) : []), [save, pack])
}

/** One tap collects every finished job on the farm and harvests every Ready plot. */
function CollectAll({ ready }: { ready: number }) {
  const [note, setNote] = useState<string | null>(null)
  if (ready === 0 && !note) return null
  return (
    <FloatingPill
      text={note ?? `Collect all · ${ready} ready`}
      onClick={() => {
        if (ready === 0) return
        void collectFarm().then((items) => {
          setNote(items > 0 ? `+${items} collected` : 'Collected')
          setTimeout(() => setNote(null), 2200)
        }, () => {
          setNote('Try again')
          setTimeout(() => setNote(null), 2200)
        })
      }}
    />
  )
}

/** How the farm works, behind the help button (N9), at the map's foot on the left. */
function FarmHelp() {
  return (
    <div className="absolute bottom-3 left-3 z-20">
      <div className="rounded-full border border-hairline-strong bg-panel/95 shadow-3" data-farm-help>
        <HelpButton title="The farm" label="How the farm works">
          <p>A day is a turn: nothing moves until you end it, even with the app closed.</p>
          <p>Plant the Fields, put your Umas to work, then tap End the day. Jobs and crops take whole days.</p>
          <p>The night settles everything at once, and the morning shows what it brought.</p>
          <p>The farm grows by building: the Farm Rank offers a place, and you build it with gold and the farm’s goods. It stands the next morning. The rows run gathering, its station, then the ranch or a workshop; the yard and the town are below.</p>
          <p>Tap the date for the calendar: a festival on each season’s 10th day.</p>
        </HelpButton>
      </div>
    </div>
  )
}

function FarmScreen({ save, peek }: { save: FarmSave; peek: FarmPlace | undefined }) {
  // The night reads master data: load it with the farm, so End the day doesn't wait for it. A failure shows
  // when the day ends, with Try again.
  useEffect(() => void masterReady().catch(() => undefined), [])
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const reducedMotion = useReducedMotionSetting()
  const talents = useTalents()
  const farming = useMemo(() => farmingTalents(talents.of), [talents.of])
  const tile = ART_TILE * artScale(hubDpr())
  const ready = useMemo(() => loopReadyWork(save), [save])
  const readyNow = useReadyNow(save)
  const hearts = useMemo(() => new Set(readyNow.map((r) => r.id)), [readyNow])
  const plots = readyPlots(save)
  const story = useStory()
  const env = useMemo(() => farmEnv(loopKinds(talents.of, story)), [talents.of, story])
  const work = useMemo(() => workView(loopWorld(save), workNow(save), env), [save, env])
  const homestead = useHomesteadMap()
  const master = useMaster()
  const layout = homestead ? homestead.homesteadLayout(save) : null
  // The map waits for the homestead's rows, so the town edge never jumps.
  const waiting = layout === null
  const places: HubMapPlace[] = [...MAP_PLACES.map((place): HubMapPlace => {
    const lock = lockOf(save, place)
    const slots = place.id === 'fields' ? plots : ready.get(place.id as LoopPlaceId) ?? 0
    const pips = place.id === 'fields' ? fieldsPips(save, farming, hearts) : pipsOf(place, work, hearts)
    const busy = pips?.some((p) => p.state !== 'free') ?? false
    return {
      id: place.id, name: place.name, frame: place.frame, at: layout && homestead ? placeAt(homestead.placeOnV4(place, layout), layout.tiles) : placeAt(place),
      to: placeLink(save, place),
      label: lock ? `${place.name}, locked: ${lock}` : slots > 0 ? `${place.name}, ready to collect` : place.name,
      locked: lock !== null, ready: slots > 0 ? 'Ready' : undefined,
      ...(pips && (lock === null || busy) ? { pips, pipsAt: 'arch' as const } : {}),
    }
  }), ...(layout && homestead
    ? homestead.homesteadPlaces(save, layout, hearts, (id) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma') : [])]
  const covered = peek !== undefined || params.get('sheet') !== null
  const total = [...ready.values()].reduce((a, b) => a + b, plots)
  const stage = useStageOn()
  return (
    <>
      {stage ? (
        <Suspense fallback={null}>
          {!waiting && <FarmStage save={save} places={places} work={work} hearts={hearts} open={peek?.id ?? null} reducedMotion={reducedMotion}
            paused={FULL_SCREEN.some((key) => params.has(key))} />}
        </Suspense>
      ) : <div className="absolute inset-0 overflow-y-auto overscroll-contain" data-farm-scroll>
        <div className="relative h-full" style={{ minHeight: (layout?.tiles ?? FARM_MAP_TILES) * tile }}>
          {!waiting && <HubMap
            label="Farm map"
            page="farm"
            pages={['farm']}
            onPage={() => undefined}
            ground={GROUND}
            places={places}
            covered={covered || save.summary !== null}
            reducedMotion={reducedMotion}
            canvas={import.meta.env.DEV && params.has('canvas')}
            debug={import.meta.env.DEV}
          />}
        </div>
      </div>}
      <FarmHelp />
      <CollectAll ready={total} />
      {peek && (
        <PeekPanel
          key={peek.id}
          title={peek.name}
          about={<p>{peek.blurb}</p>}
          onClose={() => leave(withParam(location, 'peek', null))}
          words={{ close: 'Close', about: `About the ${peek.name}`, backTo: 'Back to the farm' }}
          focusKey={`[data-place="${peek.id}"]`}
        >
          {peek.id === 'forge' && lockOf(save, peek) === null ? <Suspense fallback={null}><BenchPeek save={save} /></Suspense>
            : peek.id === 'fields' && lockOf(save, peek) === null ? <FieldsPeek save={save} talentOf={farming} />
            : peek.id === 'gate' && lockOf(save, peek) === null ? <GatePeek save={save} />
              : isWorkScreen(peek.id) && placeOpen(save, peek) ? <WorkPlacePeek save={save} place={peek.id} />
                : <PlacePeek save={save} place={peek} />}
        </PeekPanel>
      )}
      <Morning save={save} open={!covered} />
    </>
  )
}

/** A place's quick look while its page isn't wired up: what it is, and what opens it; a place to build, its Build card
 * until it stands. The Dock, once built, offers the Boat. */
function PlacePeek({ save, place }: { save: FarmSave; place: FarmPlace }) {
  const [note, setNote] = useState<string | null>(null)
  const lock = lockOf(save, place)
  const boat = farmPlace('boat') as BuildPlace
  const build = isBuildPlace(place) && !placeBuilt(save, place.id) ? place : place.id === 'dock' && !placeBuilt(save, 'boat') ? boat : null
  return (
    <div className="space-y-2 p-4" data-peek={place.id} data-lock={lock ?? undefined}>
      {note && <p role="status" className="text-[13px] font-semibold text-success" data-build-note>{note}</p>}
      {lock && !build && <p className="text-[15px] font-semibold">{lock === 'Soon' ? 'Opens soon' : `Opens with ${lock}`}</p>}
      {build === boat && <p className="text-[14px]" data-dock-open>The Sea Pier is open at the Fishery. The Boat takes you to the Deep Sea.</p>}
      {place.id === 'dock' && placeBuilt(save, 'boat') && <p className="text-[14px]" data-dock-open>The Sea Pier and the Deep Sea are open at the Fishery.</p>}
      {build ? <Suspense fallback={null}><BuildCard save={save} place={build} say={setNote} /></Suspense> : <p className="text-[14px] text-ink-soft">{place.blurb}</p>}
    </div>
  )
}

/** The morning summary: one card after every night, its sections in order with the empty ones
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
  const parts = useMemo(() => (summary ? summaryParts(summary, nameOf, ready, pairs, home) : []), [summary, nameOf, ready, pairs, home])
  if (!summary) return null
  return (
    <Sheet
      open={open}
      onClose={() => void dismissSummary()}
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
                    {line.tag && <span className="shrink-0 rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success" data-tag>{line.tag}</span>}
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
