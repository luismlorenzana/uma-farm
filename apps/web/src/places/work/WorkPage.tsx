// A place's page and quick look bodies, one lazy chunk (as uma-rpg's FacilityPage): master data's gate, the farm's work
// provider over the save at the clock, then the place's body. The clock ticks every 15 s and on focus, so jobs settle on
// open, on return and while the page is open; finished items wait for Collect.
import { MasterGate } from '../../master/MasterGate'
import { useWildsSave } from '../../save/game'
import { useNow } from '../../shell/useNow'
import { FarmWorkProvider } from './FarmWork'
import { PlaceBody, PlacePeek } from './PlaceBody'

export default function WorkPage({ placeId }: { placeId: string }) {
  const save = useWildsSave()
  const now = useNow(15_000)
  return (
    <MasterGate>
      {(view) => save && (
        <FarmWorkProvider view={view} save={save} now={now}>
          <PlaceBody view={view} save={save} now={now} placeId={placeId} />
        </FarmWorkProvider>
      )}
    </MasterGate>
  )
}

export function WorkPeek({ placeId }: { placeId: string }) {
  const save = useWildsSave()
  const now = useNow(15_000)
  return (
    <MasterGate>
      {(view) => save && (
        <FarmWorkProvider view={view} save={save} now={now}>
          <PlacePeek view={view} placeId={placeId} />
        </FarmWorkProvider>
      )}
    </MasterGate>
  )
}
