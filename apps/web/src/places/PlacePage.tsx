// A place's page (from uma-rpg apps/web/src/places/PlacePage.tsx and hub/HubScreen.tsx's PlaceRoute at 30a322a, F5):
// `/wilds/:placeId`, uma-kit's place header (Back, the name, (i) with its blurb) over the scrolling work page, which loads
// on demand. An unknown place, or the Forge and the Post before they open, go to the Wilds' quick look.
import { placeById } from '@farm/domain'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Navigate, useParams } from 'react-router'

const WorkPage = lazy(() => import('./work/WorkPage'))

export function PlaceRoute() {
  const { placeId } = useParams()
  const place = placeById(placeId)
  if (!place) return <Navigate to={placeId ? `/?peek=${encodeURIComponent(placeId)}` : '/'} replace />
  return <PlacePage placeId={place.id} name={place.name} blurb={place.blurb} />
}

function PlacePage({ placeId, name, blurb }: { placeId: string; name: string; blurb: string }) {
  const leave = useLeave()
  return (
    <div className="absolute inset-0 flex flex-col" data-place-page={placeId}>
      <PlaceHeader title={name} onBack={() => leave('/')} about={<p>{blurb}</p>} words={{ back: 'Back to the Wilds', about: `About the ${name}` }} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Suspense fallback={<p className="p-4 text-ink-soft">Loading…</p>}>
          <WorkPage placeId={placeId} />
        </Suspense>
      </main>
    </div>
  )
}
