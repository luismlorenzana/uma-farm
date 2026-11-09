// The farm (F18 decision 5; FC28, FR5–FR9): `/` in the loop's build. uma-kit's Hub map in eight rows of three, the core
// loop's rows, on uma-art's buildings; taller than a phone's screen, it scrolls, with the help button and the Collect all
// pill fixed. A place's quick look opens in the side panel (`/?peek=<place>`): what it is, and what opens it while it's
// locked. After a night the morning summary opens over the map until the player starts the day. Loaded on demand, and
// only in the loop's build.
import {
  farmEnvV3, FARM_PLACES, farmPlace, LOOP_WORK_PLACES, loopReadyWork, loopWorld, readyPlots, workNow, type FarmPlace, type LoopPlaceId, type SaveV3,
} from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { ART_TILE, artScale, HubMap, hubDpr, PALETTES, type HubMapPlace, type PageGround, type PipModel } from '@luismlorenzana/uma-kit/hub'
import { FloatingPill, PeekPanel, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { workView, type WorkView } from '@luismlorenzana/uma-kit/work'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router'
import { masterReady, useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { collectFarm, dismissSummary } from './actions'
import { FARM_MAP_TILES, lockOf, placeAt, placeLink } from './farm-map'
import { FieldsPeek, fieldsPips } from './FieldsPeek'
import { summaryParts } from './summary-words'
import { farmingTalents, useTalents } from './talents'
import { shortDate } from './words'

const GROUND: PageGround = { id: 'farm', tiles: 'farmlands', palette: PALETTES.farmlands! }
const ENV = farmEnvV3()
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

/** A work place's slot pips: who works there, ringed by her job's progress, or free dots. */
function pipsOf(place: FarmPlace, work: WorkView): PipModel[] | undefined {
  if (!WORK_PLACES.has(place.id)) return undefined
  return work.cards(place.id).map((card): PipModel => card.kind === 'free' ? { state: 'free' } : {
    state: card.running ? 'busy' : 'ready', progress: card.progress, queued: card.queue.length,
    face: <FaceTile outfitId={card.outfitId} size={24} label="Working Uma" round />,
  })
}

/** One tap collects every finished job on the farm and harvests every Ready plot (F20). */
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
          <p>Places open with chapters and the Farm Rank. The rows run gathering, its station, then the ranch or a workshop; the yard and the town are below.</p>
          <p>Tap the date for the calendar: a festival on each season’s 10th day.</p>
        </HelpButton>
      </div>
    </div>
  )
}

function FarmScreen({ save, peek }: { save: SaveV3; peek: FarmPlace | undefined }) {
  // The night reads master data (decision 2): load it with the farm, so End the day doesn't wait for it. A failure shows
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
  const plots = readyPlots(save)
  const work = useMemo(() => workView(loopWorld(save), workNow(save), ENV), [save])
  const places: HubMapPlace[] = FARM_PLACES.map((place): HubMapPlace => {
    const lock = lockOf(save, place)
    const slots = place.id === 'fields' ? plots : ready.get(place.id as LoopPlaceId) ?? 0
    const pips = place.id === 'fields' ? fieldsPips(save, farming) : pipsOf(place, work)
    const busy = pips?.some((p) => p.state !== 'free') ?? false
    return {
      id: place.id, name: place.name, frame: place.frame, at: placeAt(place),
      to: placeLink(save, place),
      label: lock ? `${place.name}, locked: ${lock}` : slots > 0 ? `${place.name}, ready to collect` : place.name,
      locked: lock !== null, ready: slots > 0 ? 'Ready' : undefined,
      ...(pips && (lock === null || busy) ? { pips, pipsAt: 'arch' as const } : {}),
    }
  })
  const covered = peek !== undefined || params.get('sheet') !== null
  const total = [...ready.values()].reduce((a, b) => a + b, plots)
  return (
    <>
      <div className="absolute inset-0 overflow-y-auto overscroll-contain" data-farm-scroll>
        <div className="relative h-full" style={{ minHeight: FARM_MAP_TILES * tile }}>
          <HubMap
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
          />
        </div>
      </div>
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
          {peek.id === 'fields' && lockOf(save, peek) === null ? <FieldsPeek save={save} talentOf={farming} /> : <PlacePeek save={save} place={peek} />}
        </PeekPanel>
      )}
      <Morning save={save} open={!covered} />
    </>
  )
}

/** A place's quick look while F19–F23 wire up its page: what it is, and what opens it. */
function PlacePeek({ save, place }: { save: SaveV3; place: FarmPlace }) {
  const lock = lockOf(save, place)
  return (
    <div className="space-y-2 p-4" data-peek={place.id} data-lock={lock ?? undefined}>
      {lock && <p className="text-[15px] font-semibold">{lock === 'Soon' ? 'Opens soon' : `Opens with ${lock}`}</p>}
      <p className="text-[14px] text-ink-soft">{place.blurb}</p>
    </div>
  )
}

/** The morning summary (CS5, decision 11): one card after every night, CS5's sections in order with the empty ones
 * hidden, each line a tap to its place. "Start the day" puts it away; a tap on a line leaves it for later. */
function Morning({ save, open }: { save: SaveV3; open: boolean }) {
  const summary = save.summary
  const master = useMaster()
  const album = master.status === 'ready' ? master.view.album : null
  const parts = useMemo(() => (summary ? summaryParts(summary, (id) => album?.get(id)?.name ?? 'An Uma') : []), [summary, album])
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
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
