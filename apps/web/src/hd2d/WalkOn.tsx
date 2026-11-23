import { ActorLayer } from './ActorLayer'
import { paintedRoutes } from './painted-routes'
import type { WalkingOutfit } from './character-art'

export function WalkOn({ who, outfit }: { who: readonly string[]; outfit: WalkingOutfit }) {
  return <ActorLayer actors={paintedRoutes(who, [[.19, .94], [.32, .97]])}
    outfit={outfit} height={52} oneWay />
}
