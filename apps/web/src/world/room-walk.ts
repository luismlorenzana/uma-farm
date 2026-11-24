export interface FloorPoint { x: number; z: number }

const STEP = .35
const COLUMNS = 33
const ROWS = 21
const indexOf = (col: number, row: number) => row * COLUMNS + col
const onGrid = (index: number): FloorPoint => ({
  x: (index % COLUMNS - (COLUMNS - 1) / 2) * STEP,
  z: (Math.floor(index / COLUMNS) - (ROWS - 1) / 2) * STEP,
})
const distance = (a: FloorPoint, b: FloorPoint) => Math.hypot(a.x - b.x, a.z - b.z)

export const ENTRANCE = { x: 0, z: 3.15 }

export function walkPath(start: FloorPoint, destination: FloorPoint, clear: (point: FloorPoint) => boolean): FloorPoint[] {
  const total = COLUMNS * ROWS
  const nearest = (target: FloorPoint, reachable: (index: number) => boolean) => {
    let pick = -1
    let best = Infinity
    for (let index = 0; index < total; index++) {
      if (!reachable(index)) continue
      const gap = distance(onGrid(index), target)
      if (gap < best) { best = gap; pick = index }
    }
    return pick
  }
  const open = Array.from({ length: total }, (_, index) => clear(onGrid(index)))
  const source = nearest(start, index => open[index] === true)
  if (source < 0) return []
  const queue = [source]
  const previous = new Int16Array(total).fill(-1)
  previous[source] = source
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head]!
    const col = at % COLUMNS, row = Math.floor(at / COLUMNS)
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = col + dx, z = row + dz
      if (x < 0 || x >= COLUMNS || z < 0 || z >= ROWS) continue
      const index = indexOf(x, z)
      if (previous[index] !== -1 || !open[index]) continue
      const a = onGrid(at), b = onGrid(index)
      if (!clear({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })) continue
      previous[index] = at
      queue.push(index)
    }
  }
  const end = nearest(destination, index => previous[index] !== -1)
  const path: FloorPoint[] = []
  for (let cursor = end; cursor >= 0 && cursor !== source; cursor = previous[cursor]!) path.push(onGrid(cursor))
  if (distance(start, onGrid(source)) > .01) path.push(onGrid(source))
  return path.reverse()
}
