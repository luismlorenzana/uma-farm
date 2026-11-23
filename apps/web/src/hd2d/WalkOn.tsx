import { ActorLayer } from './ActorLayer'
import { paintedRoutes } from './painted-routes'
import type { WalkingOutfit } from './character-art'

export function WalkOn({ who, outfit }: { who: readonly string[]; outfit: WalkingOutfit }) {
  return <ActorLayer actors={paintedRoutes(who, [[.47, .74], [.57, .78]])}
    outfit={outfit} height={58} oneWay />
}
