// The Wilds (FM19, FW6; from uma-rpg apps/web/src/hub/HubScreen.tsx at 30a322a, F5): Home is one Hub page on uma-kit's map
// (`HubMap`: the Phaser canvas, loaded on demand, and the place links over it). Five rows of three, each line's gathering,
// processing and making places left to right, with uma-art's buildings; the Forge and the Post stand below as "Soon"
// placeholders. A place's quick look opens in the side panel (`/?peek=:placeId`), its page is `/wilds/:placeId`. The
// Collect all pill and the help button float over the map, which scrolls on a short screen (`MAP_MIN_HEIGHT`). uma-rpg's
// other pages, plaza, tiers and locks stay behind.
import { farmWorkEnv, placeById, wildsPlaces, type FarmWorld, type Place } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { HubMap, PALETTES, type HubMapPlace, type PageGround, type PipModel } from '@luismlorenzana/uma-kit/hub'
import { FloatingPill, navState, PeekPanel, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { HelpButton, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { workView, type WorkView } from '@luismlorenzana/uma-kit/work'
import { lazy, Suspense, useState } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { collectEverything, useGame } from '../save/game'
import { useNow } from '../shell/useNow'
import { readySlots } from './ready'
import { SOON_PLACES, soonPlace, type SoonPlace } from './soon'

const WorkPeek = lazy(() => import('../places/work/WorkPage').then((m) => ({ default: m.WorkPeek })))

const GROUND: PageGround = { id: 'wilds', tiles: 'wilds', palette: PALETTES.wilds!, stream: true }
/** The map's least height: 25 rows of 24 px, so the five trios keep uma-rpg's four rows apart (arch pips included) and
 * the Forge and the Post fit a sixth row below them. A shorter screen (375 × 667) scrolls the map a little; the help
 * button, the Collect all pill and the quick look stay put. */
export const MAP_MIN_HEIGHT = 600
const ENV = farmWorkEnv()

/** `/`, with an optional `?peek=:placeId` quick look. An unknown place drops the panel. */
export default function WildsRoute() {
  const [params] = useSearchParams()
  const location = useLocation()
  const peekId = params.get('peek')
  const peek = placeById(peekId ?? undefined) ?? soonPlace(peekId)
  if (peekId !== null && !peek) return <Navigate to={withParam(location, 'peek', null)} replace />
  return <WildsScreen peek={peek} />
}

/** A place's slot pips over its building in a half arch: workers' faces ringed by their job's progress, each with her
 * Craft Level, or free dots. `work` is the save's work settled once at the clock, for every place. */
function pipsOf(place: Place, world: FarmWorld | null, work: WorkView | null): PipModel[] {
  if (!world || !work) return Array.from({ length: place.slots }, (): PipModel => ({ state: 'free' }))
  return work.cards(place.id).map((card): PipModel => {
    if (card.kind === 'free') return { state: 'free' }
    const craft = world.umas[card.outfitId]?.craft.level
    return {
      state: card.running ? 'busy' : 'ready', progress: card.progress, queued: card.queue.length,
      face: <FaceTile outfitId={card.outfitId} size={24} label="Working Uma" round />,
      ...(craft === undefined ? {} : { badge: String(craft) }),
    }
  })
}

/** One tap collects every finished job in the Wilds. */
function CollectAll({ ready }: { ready: number }) {
  const [note, setNote] = useState<string | null>(null)
  if (ready === 0 && !note) return null
  return (
    <FloatingPill
      text={note ?? `Collect all · ${ready} ready`}
      onClick={() => {
        if (ready === 0) return
        void collectEverything().then((r) => {
          setNote(r.items > 0 ? `+${r.items} collected` : 'Collected')
          setTimeout(() => setNote(null), 2200)
        })
      }}
    />
  )
}

/** How the Wilds work, behind the help button (N9), at the map's foot on the left, across from the Collect all pill. */
function WildsHelp() {
  return (
    <div className="absolute bottom-3 left-3 z-20">
      <div className="rounded-full border border-hairline-strong bg-panel/95 shadow-3" data-wilds-help>
        <HelpButton title="The Wilds" label="How the Wilds work">
          <p>Five rows, one line each: gather, then process, then make, left to right.</p>
          <p>Every Uma can work. Her best running styles give her trade: one line’s three places.</p>
          <p>Tap a place, then a free slot: choose an Uma, what to make and how many. Up to three more jobs can queue behind hers.</p>
          <p>Jobs keep going while the app is closed. Collect brings what’s made to the Warehouse.</p>
          <p>Every job raises her Craft Level. Grade g opens at Craft Lv 5g − 4.</p>
          <p>The Forge and the Post open later.</p>
        </HelpButton>
      </div>
    </div>
  )
}

function WildsScreen({ peek }: { peek: Place | SoonPlace | undefined }) {
  const save = useGame((s) => s.save)
  const now = useNow(15_000)
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const reducedMotion = useReducedMotionSetting()
  const ready = readySlots(save, now)
  const work = save ? workView(save, now, ENV) : null
  const places: HubMapPlace[] = [
    ...wildsPlaces().map((place): HubMapPlace => {
      const slots = ready.get(place.id) ?? 0
      return {
        id: place.id, name: place.name, frame: place.frame ?? place.id, at: place.at,
        to: withParam({ pathname: '/', search: '' }, 'peek', place.id),
        label: slots > 0 ? `${place.name}, ready to collect` : place.name,
        ready: slots > 0 ? 'Ready' : undefined,
        pips: pipsOf(place, save, work), pipsAt: 'arch',
      }
    }),
    ...SOON_PLACES.map((place): HubMapPlace => ({
      id: place.id, name: `${place.name} · Soon`, frame: place.frame, at: place.at,
      to: withParam({ pathname: '/', search: '' }, 'peek', place.id), label: `${place.name}, opens soon`, locked: true,
    })),
  ]
  const covered = peek !== undefined || params.get('sheet') !== null
  const total = [...ready.values()].reduce((a, b) => a + b, 0)
  return (
    <>
      <div className="absolute inset-0 overflow-y-auto overscroll-contain" data-wilds-scroll>
        <div className="relative h-full" style={{ minHeight: MAP_MIN_HEIGHT }}>
          <HubMap
            label="Wilds map"
            page="wilds"
            pages={['wilds']}
            onPage={() => undefined}
            ground={GROUND}
            places={places}
            covered={covered}
            reducedMotion={reducedMotion}
            canvas={import.meta.env.DEV && params.has('canvas')}
            debug={import.meta.env.DEV}
          />
        </div>
      </div>
      <WildsHelp />
      <CollectAll ready={total} />
      {peek && (
        <PeekPanel
          key={peek.id}
          title={peek.name}
          about={<p>{peek.blurb}</p>}
          onClose={() => leave(withParam(location, 'peek', null))}
          enter={'opens' in peek ? undefined : { to: `/wilds/${peek.id}`, label: `Enter the ${peek.name}`, state: { back: navState(location).back } }}
          words={{ close: 'Close', about: `About the ${peek.name}`, backTo: 'Back to the Wilds' }}
          focusKey={`[data-place="${peek.id}"]`}
        >
          {'opens' in peek
            ? <SoonPeek place={peek} />
            : <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}><WorkPeek placeId={peek.id} /></Suspense>}
        </PeekPanel>
      )}
    </>
  )
}

/** A placeholder's quick look: what it will do, and when it opens. */
function SoonPeek({ place }: { place: SoonPlace }) {
  return (
    <div className="space-y-2 p-4" data-soon={place.id}>
      <p className="text-[15px] font-semibold">Soon: opens in {place.opens}.</p>
      <p className="text-[14px] text-ink-soft">{place.blurb}</p>
    </div>
  )
}
