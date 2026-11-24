import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NearestFilter, Sprite, SpriteMaterial, SRGBColorSpace, Texture } from 'three'
import { Avatar } from '../dialogue/Avatar'
import { acquireWalkingArt } from '../hd2d/character-art'
import { mountRegion, type ScenePoint } from './farm-region-stage'
import { buildRoom } from './room-kit'
import type { RoomId } from './room-specs'
import type { RoomActor } from './WorldPlate'

const MAX_SPRITES = 6
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
  const [points, setPoints] = useState<ReadonlyMap<string, ScenePoint> | null>(null)
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(new Set())
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
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
    const draw = () => {
      if (!alive || lostContext || document.hidden || !node.clientWidth || !node.clientHeight) return
      try {
        stage.project({ x: 0, z: 0, zoom: 1 }, points => {
          const marks = openMarks(points, node.clientWidth, node.clientHeight)
          const targets = new Map<string, ScenePoint>()
          actors.forEach(({ id }, i) => {
            const mark = marks[i]
            const sprite = sprites.get(id)
            if (sprite) sprite.visible = !!mark
            if (!mark) return
            const [key, point] = mark
            if (sprite) sprite.position.set(...room.anchors.get(key)!)
            targets.set(id, point)
          })
          setPoints(targets)
        })
      } catch { setFailed(true) }
    }
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
    document.addEventListener('visibilitychange', draw)
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw)
    resize?.observe(node)
    draw()
    return () => {
      alive = false
      for (const lease of leases) lease.release()
      for (const sprite of sprites.values()) {
        sprite.removeFromParent()
        sprite.material.map?.dispose()
        sprite.material.dispose()
      }
      resize?.disconnect()
      node.removeEventListener('webglcontextlost', lost)
      node.removeEventListener('webglcontextrestored', restored)
      document.removeEventListener('visibilitychange', draw)
      stage.dispose()
    }
  }, [place, night, roomNumber, expanded, signature, attempt])

  const ready = Boolean(points) && !failed
  return <div className="absolute inset-0" data-room-depth={ready ? 'ready' : failed ? 'unavailable' : 'loading'}>
    <canvas ref={canvas} className="absolute inset-0 size-full" aria-label="Modeled interior" />
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