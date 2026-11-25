import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Animal } from '@farm/domain'
import type { CharacterFacing, CharacterSpriteVariant } from '@luismlorenzana/uma-data'
import { atlasFigure } from '@luismlorenzana/uma-stage/look'
import { CapsuleGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, SphereGeometry } from 'three'
import type { ScenePhase } from '../dialogue/scene-context'
import { Link } from 'react-router'
import { occupyRoomKit } from './room-models'
import { Avatar } from '../dialogue/Avatar'
import { acquireWalkingArt } from '../hd2d/character-art'
import { mountRegion, type ScenePoint } from './farm-region-stage'
import { buildRoom } from './room-kit'
import { mountPracticalLights, ROOM_QUALITY, roomQuality, type RoomQuality } from './room-light'
import { ranchAnimals, roomAnimals } from './ranch-actors'
import { ENTRANCE, walkPath, type FloorPoint } from './room-walk'
import type { RoomId } from './room-specs'
import type { RoomActor, RoomService } from './WorldPlate'
import { followCamera, roomCamera, ROOM_SPRITE_PITCH, ROOM_VIEWS, type RoomView } from './travel-camera'

const MAX_SPRITES = 6
const lastRoom = new Map<string, { position: FloorPoint; view: RoomView }>()
let chosenQuality: RoomQuality | undefined
const viewNames: Record<RoomView, string> = { walk: 'Walk', close: 'Close', whole: 'Whole room' }
const qualityNames: Record<RoomQuality, string> = { saver: 'Saver', medium: 'Balanced', high: 'High' }
const HIT_WIDTH = 44
const HIT_HEIGHT = 56
const SERVICE_WIDTH = 124
const SERVICE_HEIGHT = 44

function walkingFrame(art: CharacterSpriteVariant, facing: CharacterFacing, elapsed: number) {
  const frames = art.walking[facing]
  const duration = frames.reduce((total, frame) => total + frame.durationMs, 0)
  let left = elapsed % Math.max(1, duration)
  for (const frame of frames) {
    left -= frame.durationMs
    if (left < 0) return frame
  }
  return art.standing[facing]
}

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

function serviceMark(desk: ScenePoint, people: ReadonlyMap<string, ScenePoint>, width: number, height: number) {
  const deskX = desk.x * width
  const deskY = desk.y * height
  if (deskX < 0 || deskX > width || deskY < 0 || deskY > height * .72) return null
  const margin = SERVICE_WIDTH / 2 + 4
  const clampX = (x: number) => Math.max(margin, Math.min(width - margin, x))
  const x = clampX(deskX)
  const above = deskY - SERVICE_HEIGHT - 6
  const spots = [[x, above], [x, deskY - 6], [x, deskY + 18], [x, above - SERVICE_HEIGHT],
    [clampX(x + 36), above], [clampX(x - 36), above]] as const
  for (const [left, top] of spots) {
    if (top < 4 || top + SERVICE_HEIGHT > height - 52) continue
    const overlaps = [...people.values()].some(person => Math.abs(person.x * width - left) < (HIT_WIDTH + SERVICE_WIDTH) / 2 + 4
      && top < person.y * height + 4 && top + SERVICE_HEIGHT > person.y * height - HIT_HEIGHT - 4)
    if (!overlaps) return { x: left / width, y: top / height }
  }
  return null
}

export default function RoomDepth({ place, phase, roomNumber, expanded, cast, open, fallback, animals, service }: {
  place: RoomId; phase: ScenePhase; roomNumber: number; expanded: boolean
  cast: readonly RoomActor[]; open(id: string): void; fallback: ReactNode; animals: readonly Animal[]; service?: RoomService | undefined
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const key = place + ':' + roomNumber
  const night = phase === 'night'
  const hasService = Boolean(service)
  const goToEntrance = useRef<(() => void) | undefined>(undefined)
  const changeView = useRef<((view: RoomView) => void) | undefined>(undefined)
  const view = useRef<RoomView>(lastRoom.get(key)?.view ?? 'walk')
  const [mode, setMode] = useState(view.current)
  const [quality, setQuality] = useState<RoomQuality>(() => chosenQuality ?? roomQuality())
  const [servicePoint, setServicePoint] = useState<ScenePoint | null>(null)
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
    delete node.dataset.roomKit
    const room = buildRoom(place, phase, roomNumber, expanded)
    const ranch = place === 'barn' || place === 'coop' ? roomAnimals(ranchAnimals(animals, place), room.clear) : []
    const layout = { ...room, ranch, night, roomQuality: quality }
    node.dataset.roomQuality = quality
    node.dataset.roomPhase = phase
    node.dataset.ranchAnimals = ranch.map(({ animal }) => animal.kind).join(' ')
    let stage: ReturnType<typeof mountRegion>
    try { stage = mountRegion(node, layout) }
    catch { setFailed(true); return }
    const clearLights = mountPracticalLights(room.scene.root, place, phase, quality)
    const kit = occupyRoomKit(place, room.scene.root)
    const actors = JSON.parse(signature) as Pick<RoomActor, 'id' | 'outfit'>[]
    const sprites = new Map<string, { figure: ReturnType<typeof atlasFigure>; art: CharacterSpriteVariant; facing: CharacterFacing; step?: { from: FloorPoint; elapsed: number } }>()
    let alive = true
    let lostContext = false
    let frame = 0
    let last = 0
    let path: FloorPoint[] = []
    const previous = lastRoom.get(key)
    const saved = previous?.position
    let position = saved && room.clear(saved) ? saved : ENTRANCE
    view.current = previous?.view ?? 'walk'
    setMode(view.current)
    let camera = roomCamera(position, view.current)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const marker = new Mesh(new RingGeometry(.12, .2, 16), new MeshBasicMaterial({ color: night ? '#ffce94' : '#fff0c3', toneMapped: false }))
    marker.rotation.x = -Math.PI / 2
    const walker = new Group()
    const coat = new Mesh(new CapsuleGeometry(.16, .29, 4, 8), new MeshStandardMaterial({ color: '#7b5849', roughness: .92 }))
    const hat = new Mesh(new SphereGeometry(.152, 8, 6), new MeshStandardMaterial({ color: '#e5be73', roughness: .85 }))
    coat.position.y = .29
    hat.position.y = .59
    coat.castShadow = hat.castShadow = true
    walker.add(coat, hat)
    room.scene.root.add(marker, walker)
    let anchors: Map<string, string> | undefined
    const draw = (elapsed = 0) => {
      const width = node.clientWidth
      const height = node.clientHeight
      if (!alive || lostContext || document.hidden || !width || !height) return
      try {
        if (!anchors) stage.project({ x: 0, z: 0, zoom: 1 }, points => {
          const available = new Map([...points].filter(([id]) => {
            const [x, , z] = room.anchors.get(id)!
            return !ranch.some(animal => Math.hypot(x - animal.x, z - animal.z) < .68)
          }))
          const marks = openMarks(available, width, height)
          anchors = new Map(actors.flatMap(({ id }, index) => marks[index] ? [[id, marks[index]![0]]] : []))
        })
        const floor = room.heightAt?.(position) ?? 0
        marker.position.set(position.x, floor + .032, position.z)
        walker.position.set(position.x, floor, position.z)
        stage.project(camera, points => {
          const targets = new Map<string, ScenePoint>()
          actors.forEach(({ id }) => {
            const anchor = anchors?.get(id)
            const person = sprites.get(id)
            if (person) person.figure.sprite.visible = Boolean(anchor)
            if (!anchor) return
            const mark = room.anchors.get(anchor)!
            let point = points.get(anchor)!
            if (person) {
              const step = person.step
              if (step && !reduced.matches) {
                step.elapsed += elapsed
                const t = Math.min(1, step.elapsed / 420)
                const at = { x: step.from.x + (mark[0] - step.from.x) * t, z: step.from.z + (mark[2] - step.from.z) * t }
                const foot = [at.x, (room.heightAt?.(at) ?? 0) + .025, at.z] as const
                person.figure.sprite.position.set(...foot)
                point = stage.screenPoint(foot)
                person.figure.frame(walkingFrame(person.art, person.facing, step.elapsed))
                if (t === 1) person.step = undefined
              } else {
                person.step = undefined
                person.figure.sprite.position.set(...mark)
                person.figure.frame(person.art.standing[person.facing])
              }
            }
            const half = HIT_WIDTH / (2 * width)
            if (point.x >= half && point.x <= 1 - half && point.y >= HIT_HEIGHT / height && point.y <= 1) targets.set(id, point)
          })
          const desk = hasService ? serviceMark(stage.screenPoint(room.service), targets, width, height) : null
          setServicePoint(old => old && desk && Math.abs(old.x - desk.x) < .001 && Math.abs(old.y - desk.y) < .001 ? old : desk ?? null)
          setPoints(previous => previous && previous.size === targets.size && [...targets].every(([id, point]) => {
            const old = previous.get(id)
            return old && Math.abs(point.x - old.x) < .0008 && Math.abs(point.y - old.y) < .0008
          }) ? previous : targets)
        })
      } catch { setFailed(true) }
    }
    const tick = (time: number) => {
      frame = 0
      if (!alive || lostContext) return
      if (document.hidden) { last = 0; return }
      const elapsed = last ? Math.min(50, time - last) : 16
      let move = elapsed * .006
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
      lastRoom.set(key, { position, view: view.current })
      node.dataset.walkPosition = position.x.toFixed(2) + ',' + position.z.toFixed(2)
      const desired = roomCamera(position, view.current)
      const settling = Math.abs(desired.x - camera.x) + Math.abs(desired.z - camera.z) + Math.abs(desired.zoom - camera.zoom) > .012
      camera = settling && !reduced.matches ? followCamera(camera, desired, elapsed) : desired
      draw(elapsed)
      if (path.length || (settling && !reduced.matches) || [...sprites.values()].some(actor => actor.step)) frame = requestAnimationFrame(tick)
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
    changeView.current = (next) => {
      view.current = next
      setMode(next)
      lastRoom.set(key, { position, view: next })
      if (!frame) frame = requestAnimationFrame(tick)
    }
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
      if (!document.hidden && !frame) frame = requestAnimationFrame(tick)
    }
    node.addEventListener('pointerup', tap)
    node.addEventListener('keydown', step)
    const leases = actors.map(({ id, outfit }) => {
      const lease = acquireWalkingArt(id, outfit)
      void lease.ready.then(art => {
        if (!art || !alive) return
        const { cell, page, foot, standing } = art.sprite
        const figure = atlasFigure(art.image, cell, page, foot, 1.62)
        figure.actor.rotation.x = ROOM_SPRITE_PITCH
        const name = anchors?.get(id)
        const mark = name ? room.anchors.get(name) : undefined
        const from = mark ? { x: mark[0], z: mark[2] + .54 } : undefined
        const walking = actors[0]?.id === id && mark && from && room.clear(from) && !reduced.matches
        const facing = walking ? 'back' : 'front'
        figure.frame(standing[facing])
        room.scene.root.add(figure.sprite)
        sprites.set(id, { figure, art: art.sprite, facing, ...(walking ? { step: { from, elapsed: 0 } } : {}) })
        if (walking && !frame) frame = requestAnimationFrame(tick)
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
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { anchors = undefined; draw() })
    resize?.observe(node)
    void kit.ready.then(ready => {
      if (alive && ready) { node.dataset.roomKit = 'verified'; draw() }
    }, () => { if (alive) node.dataset.roomKit = 'procedural' })
    draw()
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      goToEntrance.current = undefined
      changeView.current = undefined
      marker.removeFromParent()
      walker.removeFromParent()
      coat.geometry.dispose()
      coat.material.dispose()
      hat.geometry.dispose()
      hat.material.dispose()
      kit.release()
      clearLights()
      marker.geometry.dispose()
      marker.material.dispose()
      node.removeEventListener('pointerup', tap)
      node.removeEventListener('keydown', step)
      for (const lease of leases) lease.release()
      for (const sprite of sprites.values()) sprite.figure.dispose()
      resize?.disconnect()
      node.removeEventListener('webglcontextlost', lost)
      node.removeEventListener('webglcontextrestored', restored)
      document.removeEventListener('visibilitychange', visibility)
      stage.dispose()
    }
  }, [place, phase, night, key, roomNumber, expanded, signature, attempt, animals, quality, hasService])

  const ready = Boolean(points) && !failed
  return <div className="absolute inset-0" data-room-depth={ready ? 'ready' : failed ? 'unavailable' : 'loading'} data-room-view={mode}>
    <canvas ref={canvas} className="absolute inset-0 size-full touch-none" aria-label="Modeled interior. Tap the floor or use the arrow keys to walk." tabIndex={ready ? 0 : -1} />
    {ready && !walked && <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[12px] text-white">Tap floor to walk</span>}
    {ready && <div className="absolute right-1 bottom-1 z-20 flex gap-1">
      <select aria-label="Room camera" className="min-h-11 rounded bg-black/75 px-1 text-[12px] font-semibold text-white" value={mode}
        onChange={event => changeView.current?.(event.target.value as RoomView)}>
        {ROOM_VIEWS.map(mode => <option key={mode} value={mode}>{viewNames[mode]}</option>)}
      </select>
      <select aria-label="Room graphics" className="min-h-11 rounded bg-black/75 px-1 text-[12px] text-white" value={quality}
        onChange={event => { chosenQuality = event.target.value as RoomQuality; setQuality(chosenQuality) }}>
        {ROOM_QUALITY.map(quality => <option key={quality} value={quality}>{qualityNames[quality]}</option>)}
      </select>
      <button type="button" className="min-h-11 rounded bg-black/70 px-2 text-[12px] font-semibold text-white" onClick={() => goToEntrance.current?.()} aria-label="Walk to the entrance">Entrance</button>
    </div>}
    {ready && service && servicePoint &&
      <Link to={service.to} state={{ back: true }} aria-label={service.label} data-room-service={service.label}
        className="absolute z-20 flex h-11 -translate-x-1/2 items-center justify-center rounded-md border border-white/25 bg-black/75 px-2 text-center text-xs font-semibold text-white"
        style={{left: servicePoint.x * 100 + '%', top: servicePoint.y * 100 + '%', width: SERVICE_WIDTH}}><span className="truncate">{service.label} ›</span></Link>}
    {failed && <button type="button" className="absolute bottom-1 right-1 z-20 min-h-11 rounded bg-black/75 px-2 text-xs font-semibold text-white" onClick={() => { setFailed(false); setAttempt(at => at + 1) }}>Retry room</button>}
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