import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Mesh, MeshBasicMaterial, NearestFilter, RingGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Texture } from 'three'
import { Avatar } from '../dialogue/Avatar'
import { acquireWalkingArt } from '../hd2d/character-art'
import { mountRegion, type ScenePoint } from './farm-region-stage'
import { buildRoom } from './room-kit'
import { ENTRANCE, walkPath, type FloorPoint } from './room-walk'
import type { RoomId } from './room-specs'
import type { RoomActor } from './WorldPlate'

const MAX_SPRITES = 6
const lastPosition = new Map<string, FloorPoint>()
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))
const HIT_WIDTH = 44
const HIT_HEIGHT = 56

/** Choose walkable marks with enough screen room for each character's tap target. */
function openMarks(points: ReadonlyMap<string, ScenePoint>, width: number, height: number) {
  const marks: [string, ScenePoint][] = []
  for (const [key, point] of points) {
    const x = point.x * width
    const y = point.y * height
    if (x < HIT_WIDTH / 2 || width - x < HIT_WIDTH / 2 || y < HIT_HEIGHT || y > height) continue
    if (marks.some(([, used]) => Math.abs(point.x - used.x) * width < HIT_WIDTH + 2
      && Math.abs(point.y - used.y) * height < HIT_HEIGHT + 2)) continue
    marks.push([key, point])
    if (marks.length === MAX_SPRITES) break
  }
  return marks
}

export default function RoomDepth({ place, night, roomNumber, expanded, cast, open, fallback }: {
  place: RoomId; night: boolean; roomNumber: number; expanded: boolean
  cast: readonly RoomActor[]; open(id: string): void; fallback: ReactNode
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const goToEntrance = useRef<(() => void) | undefined>(undefined)
  const [points, setPoints] = useState<ReadonlyMap<string, ScenePoint> | null>(null)
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(new Set())
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [walked, setWalked] = useState(false)
  const signature = JSON.stringify(cast.slice(0, MAX_SPRITES).map(({ id, outfit }) => ({ id, outfit })))
  useEffect(() => {
    const node = canvas.current
    if (!node) return
    setDrawn(new Set())
    const room = buildRoom(place, night, roomNumber, expanded)
    let stage: ReturnType<typeof mountRegion>
    try { stage = mountRegion(node, room) }
    catch { room.scene.dispose(); setFailed(true); return }
    const actors = JSON.parse(signature) as Pick<RoomActor, 'id' | 'outfit'>[]
    const sprites = new Map<string, Sprite>()
    let alive = true
    let lostContext = false
    let frame = 0
    let last = 0
    let path: FloorPoint[] = []
    const key = place + ':' + roomNumber
    const saved = lastPosition.get(key)
    let position = saved && room.clear(saved) ? saved : ENTRANCE
    const marker = new Mesh(new RingGeometry(.12, .2, 16), new MeshBasicMaterial({ color: night ? '#ffce94' : '#fff0c3', toneMapped: false }))
    marker.rotation.x = -Math.PI / 2
    room.scene.root.add(marker)
    let anchors: Map<string, string> | undefined
    const draw = () => {
      if (!alive || lostContext || document.hidden || !node.clientWidth || !node.clientHeight) return
      try {
        if (!anchors) stage.project({ x: 0, z: 0, zoom: 1 }, points => {
          const marks = openMarks(points, node.clientWidth, node.clientHeight)
          anchors = new Map(actors.flatMap(({ id }, index) => marks[index] ? [[id, marks[index]![0]]] : []))
        })
        marker.position.set(position.x, .07, position.z)
        stage.project({ x: clamp(position.x * .42, -1.85, 1.85), z: clamp(position.z * .38, -1.12, 1.08), zoom: 1.18 }, points => {
          const targets = new Map<string, ScenePoint>()
          actors.forEach(({ id }) => {
            const anchor = anchors?.get(id)
            const point = anchor && points.get(anchor)
            const sprite = sprites.get(id)
            if (sprite) sprite.visible = Boolean(anchor)
            if (!anchor || !point) return
            if (sprite) sprite.position.set(...room.anchors.get(anchor)!)
            const half = HIT_WIDTH / (2 * node.clientWidth)
            if (point.x >= half && point.x <= 1 - half && point.y >= HIT_HEIGHT / node.clientHeight && point.y <= 1) targets.set(id, point)
          })
          setPoints(targets)
        })
      } catch { setFailed(true) }
    }
    const tick = (time: number) => {
      frame = 0
      if (!alive || lostContext) return
      if (document.hidden) { last = 0; return }
      let move = (last ? Math.min(50, time - last) : 16) * .006
      last = time
      while (path.length && move > 0) {
        const target = path[0]!
        const length = Math.hypot(target.x - position.x, target.z - position.z)
        if (length <= move) {
          position = target
          path.shift()
          move -= length
        } else {
          position = { x: position.x + (target.x - position.x) * move / length, z: position.z + (target.z - position.z) * move / length }
          move = 0
        }
      }
      lastPosition.set(key, position)
      draw()
      if (path.length) frame = requestAnimationFrame(tick)
      else last = 0
    }
    const go = (target: FloorPoint) => {
      if (lostContext) return
      const feet = [...anchors?.values() ?? []].map(id => room.anchors.get(id)!)
      path = walkPath(position, target, point => room.clear(point)
        && !feet.some(([x, , z]) => Math.hypot(point.x - x, point.z - z) < .29))
      if (path.length) {
        setWalked(true)
        if (!frame) frame = requestAnimationFrame(tick)
      }
    }
    goToEntrance.current = () => go(ENTRANCE)
    const tap = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return
      const rect = node.getBoundingClientRect()
      const at = stage.floorPoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height)
      if (at && Math.abs(at.x) <= 6 && at.z >= -4 && at.z <= 4) go(at)
    }
    const step = (event: KeyboardEvent) => {
      const direction = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key]
      if (!direction) return
      event.preventDefault()
      const next = path.at(-1) ?? position
      go({ x: next.x + direction[0] * .7, z: next.z + direction[1] * .7 })
    }
    const visibility = () => {
      draw()
      if (!document.hidden && path.length && !frame) frame = requestAnimationFrame(tick)
    }
    node.addEventListener('pointerup', tap)
    node.addEventListener('keydown', step)
    const leases = actors.map(({ id, outfit }) => {
      const lease = acquireWalkingArt(id, outfit)
      void lease.ready.then(art => {
        if (!art || !alive) return
        const { cell, page, foot, standing } = art.sprite
        const frame = standing.front
        const texture = new Texture(art.image)
        texture.minFilter = texture.magFilter = NearestFilter
        texture.generateMipmaps = false
        texture.colorSpace = SRGBColorSpace
        texture.repeat.set(cell.width / page.width, cell.height / page.height)
        texture.offset.set(frame.x / page.width, 1 - (frame.y + cell.height) / page.height)
        texture.needsUpdate = true
        const sprite = new Sprite(new SpriteMaterial({
          map: texture, color: night ? '#d8d6ef' : '#fff9ee', alphaTest: .38, toneMapped: false,
        }))
        sprite.center.set(foot.x / cell.width, 1 - foot.y / cell.height)
        sprite.scale.set(1.85 * cell.width / cell.height, 1.85, 1)
        room.scene.root.add(sprite)
        sprites.set(id, sprite)
        setDrawn(previous => new Set(previous).add(id))
        draw()
      }).catch(() => undefined)
      return lease
    })
    const lost = (event: Event) => {
      event.preventDefault()
      lostContext = true
      setFailed(true)
    }
    const restored = () => {
      setPoints(null)
      setFailed(false)
      setAttempt(n => n + 1)
    }
    node.addEventListener('webglcontextlost', lost)
    node.addEventListener('webglcontextrestored', restored)
    document.addEventListener('visibilitychange', visibility)
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw)
    resize?.observe(node)
    draw()
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      goToEntrance.current = undefined
      marker.removeFromParent()
      marker.geometry.dispose()
      marker.material.dispose()
      node.removeEventListener('pointerup', tap)
      node.removeEventListener('keydown', step)
      for (const lease of leases) lease.release()
      for (const sprite of sprites.values()) {
        sprite.removeFromParent()
        sprite.material.map?.dispose()
        sprite.material.dispose()
      }
      resize?.disconnect()
      node.removeEventListener('webglcontextlost', lost)
      node.removeEventListener('webglcontextrestored', restored)
      document.removeEventListener('visibilitychange', visibility)
      stage.dispose()
    }
  }, [place, night, roomNumber, expanded, signature, attempt])

  const ready = Boolean(points) && !failed
  return <div className="absolute inset-0" data-room-depth={ready ? 'ready' : failed ? 'unavailable' : 'loading'}>
    <canvas ref={canvas} className="absolute inset-0 size-full touch-none" aria-label="Modeled interior. Tap the floor or use the arrow keys to walk." tabIndex={ready ? 0 : -1} />
    {ready && !walked && <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[12px] text-white">Tap floor to walk</span>}
    {ready && <button type="button" className="absolute bottom-1 right-1 z-20 min-h-11 rounded bg-black/70 px-2 text-[12px] font-semibold text-white" onClick={() => goToEntrance.current?.()} aria-label="Walk to the entrance">Entrance</button>}
    {!ready ? fallback : cast.slice(0, MAX_SPRITES).map(({ id, name }) => {
      const point = points?.get(id)
      if (!point) return null
      return <button key={id} type="button" aria-label={'Talk to ' + name} data-world-actor={id}
        data-modeled-sprite={drawn.has(id) || undefined}
        className="absolute z-10 flex w-11 h-14 -translate-x-1/2 -translate-y-full items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-white"
        style={{ left: point.x * 100 + '%', top: point.y * 100 + '%' }} onClick={() => open(id)}>
        {!drawn.has(id) && <Avatar id={id} label={name} size={36} />}
      </button>
    })}
  </div>
}