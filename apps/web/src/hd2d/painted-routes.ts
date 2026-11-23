import type { ActorRoute, FootPoint } from './actor-route'

/** Short approaches around a landmark. The buttons and people lists remain the interactive layer. */
export function paintedRoutes(ids: readonly string[], points: readonly FootPoint[]): ActorRoute[] {
  return [...new Set(ids)].slice(0, points.length).map((id, index) => {
    const stop = points[index]!
    return { id, stop, start: [stop[0] + (index % 2 ? .11 : -.11), stop[1] + .018] }
  })
}
