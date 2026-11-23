import { useCallback, useState } from 'react'
import type { FarmSave } from '@farm/domain'
import { Avatar } from '../dialogue/Avatar'
import { SceneBackground } from '../dialogue/SceneBackground'
import { environment } from '../dialogue/scene-context'
import { ActorLayer } from '../hd2d/ActorLayer'
import type { WalkingOutfit } from '../hd2d/character-art'

export interface VisibleActor {
  id: string
  name: string
  outfit: WalkingOutfit
  x: number
  y: number
}

export function WorldFigures({ figures, open, standing = true, height = 52 }: {
  figures: readonly VisibleActor[]; open(id: string): void; standing?: boolean; height?: number
}) {
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set())
  const markDrawn = useCallback((id: string) => setDrawn(previous => {
    if (previous.has(id)) return previous
    return new Set(previous).add(id)
  }), [])
  return <>
    {(['spring','pajamas','farm-work'] as const).map(outfit => {
      const matching = figures.filter(figure => figure.outfit === outfit)
      return matching.length > 0 && <ActorLayer key={outfit} outfit={outfit} height={height} standing={standing} onArt={markDrawn}
        actors={matching.map(({ id,x,y }) => ({ id, start: [x-.017,y], stop:[x,y] }))} />
    })}
    {figures.map(({id,name,x,y}) => <button key={id} type="button" aria-label={`Talk to ${name}`} data-world-actor={id}
      className="absolute z-10 flex min-h-[56px] min-w-11 -translate-x-1/2 -translate-y-full items-end justify-center rounded-md focus-visible:outline-2 focus-visible:outline-white"
      style={{ left: `${x*100}%`, top: `${y*100}%` }} onClick={() => open(id)}>
      {!drawn.has(id) && <Avatar id={id} size={36} label={name} />}
    </button>)}
  </>
}

/** Room plates use the same environment art as dialogue. The controls and standing positions belong to the room. */
export function WorldPlate({ save, place, art, cast, open }: {
  save: FarmSave; place: string; art?: string; cast: readonly Omit<VisibleActor,'x'|'y'>[]; open(id: string): void
}) {
  const figures = cast.slice(0,6).map((actor,i) => ({
    ...actor, x: .2 + (i % 3) * .3, y: i < 3 ? .68 : .95,
  }))
  return <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-sunken" data-world-plate={place}>
    {art ? <img src={art} alt="" className="absolute inset-0 size-full object-cover" /> : <SceneBackground environment={environment(save,place)} />}
    <WorldFigures key={figures.map(figure => figure.id + figure.outfit).join(',')} figures={figures} open={open} />
  </div>
}
