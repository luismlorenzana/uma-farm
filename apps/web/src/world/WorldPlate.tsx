import { lazy, Suspense, type ReactNode } from 'react'
import type { FarmSave } from '@farm/domain'
import { Avatar } from '../dialogue/Avatar'
import { SceneBackground } from '../dialogue/SceneBackground'
import { environment } from '../dialogue/scene-context'
import type { WalkingOutfit } from '../hd2d/character-art'
import { isRoom, type RoomId } from './room-specs'

export interface RoomActor {
  id: string
  name: string
  outfit: WalkingOutfit
}
interface PositionedProfile { id: string; name: string; x: number; y: number }

const RoomDepth = lazy(() => import('./RoomDepth').catch(() => ({ default: ({ fallback }: { fallback: ReactNode }) => <>{fallback}</> })))

export function WorldProfiles({ figures, open }: { figures: readonly PositionedProfile[]; open(id: string): void }) {
  return <>{figures.map(({id,name,x,y}) => <button key={id} type="button" aria-label={'Talk to '+name} data-world-actor={id}
    className="absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-full items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-white"
    style={{left:x*100+'%',top:y*100+'%'}} onClick={()=>open(id)}>
    <Avatar id={id} size={36} label={name} />
  </button>)}</>
}

export function WorldPlate({ save, place, art, cast, open, room = isRoom(place) ? place : undefined, roomNumber = 0, active = true }: {
  save: FarmSave; place: string; art?: string; cast: readonly RoomActor[]; open(id: string): void; room?: RoomId | undefined; roomNumber?: number; active?: boolean
}) {
  const scene = environment(save,place)
  const fallback = <>
    {art ? <img src={art} alt="" className="absolute inset-0 size-full object-cover" /> : <SceneBackground environment={scene} />}
    <WorldProfiles figures={cast.slice(0,6).map((actor,i)=>({...actor,x:.2+(i%3)*.3,y:i<3?.68:.94}))} open={open} />
  </>
  return <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-sunken" data-world-plate={place}>
    {active && (room && typeof WebGL2RenderingContext !== 'undefined'
      ? <Suspense fallback={fallback}>
          <RoomDepth place={room} night={scene.phase==='night'} roomNumber={roomNumber}
            expanded={!!save.homestead.houses[roomNumber]?.extended} cast={cast} open={open} fallback={fallback} />
        </Suspense>
      : fallback)}
  </div>
}
