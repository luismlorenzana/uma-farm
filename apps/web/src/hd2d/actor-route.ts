import type { CharacterFacing } from '@luismlorenzana/uma-data'

export type FootPoint = readonly [x: number, y: number]
export interface ActorRoute { id: string; start: FootPoint; stop: FootPoint }
const WALK_MS = 2600
const STOP_MS = 1800
const LAP_MS = 2 * (WALK_MS + STOP_MS)

export function routePose(route: ActorRoute, ms: number, offset = 0, oneWay = false) {
  const elapsed = oneWay ? Math.min(ms + offset, WALK_MS) : (ms + offset) % LAP_MS
  const reverse = elapsed >= WALK_MS + STOP_MS
  const phase = elapsed % (WALK_MS + STOP_MS)
  const travel = Math.min(1, phase / WALK_MS)
  const moving = phase < WALK_MS
  const t = reverse ? 1 - travel : travel
  const [x, y] = route.start
  const dx = route.stop[0] - x
  const dy = route.stop[1] - y
  const facing: CharacterFacing = !moving ? 'front'
    : Math.abs(dx) >= Math.abs(dy) ? (dx < 0) !== reverse ? 'left' : 'right'
      : (dy < 0) !== reverse ? 'back' : 'front'
  return { x: x + dx * t, y: y + dy * t, facing, moving }
}
