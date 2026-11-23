import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { FarmSave } from '@farm/domain'
import { buildRegion, mountRegion, type CameraPose, type ScenePoint } from './farm-region-stage'
import type { FarmEntrance, FarmRegion } from './farm-regions'

export default function FarmRegionDepth({ region, save, entrances, night, pose, setPose, children }: {
  region: FarmRegion; save: FarmSave; entrances: readonly FarmEntrance[]; night: boolean; pose: CameraPose; setPose(pose: CameraPose): void
  children(points: ReadonlyMap<string,ScenePoint>): ReactNode
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<ReturnType<typeof mountRegion> | null>(null)
  const moving = useRef<{ x: number; z: number; pointer: number } | null>(null)
  const current = useRef(pose)
  current.current = pose
  const [points, setPoints] = useState<ReadonlyMap<string,ScenePoint> | null>(null)
  const [failed,setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    setPoints(null)
    setFailed(false)
    setAttempt(previous => previous + 1)
  }
  useEffect(() => {
    const node = canvas.current
    if (!node || typeof WebGL2RenderingContext === 'undefined') { setFailed(true); return }
    const layout = buildRegion(region,save,entrances,night)
    let stage: ReturnType<typeof mountRegion>
    try { stage = mountRegion(node,layout) }
    catch { layout.scene.dispose(); setFailed(true); return }
    renderer.current = stage
    const draw = () => {
      if (document.hidden || !node.clientWidth || !node.clientHeight) return
      try { setPoints(stage.project(current.current)) } catch { setFailed(true) }
    }
    const lost = (event: Event) => { event.preventDefault(); setFailed(true) }
    node.addEventListener('webglcontextlost',lost)
    node.addEventListener('webglcontextrestored',retry)
    document.addEventListener('visibilitychange',draw)
    const resize = new ResizeObserver(draw)
    resize.observe(node)
    draw()
    return () => {
      renderer.current = null
      node.removeEventListener('webglcontextlost',lost)
      node.removeEventListener('webglcontextrestored',retry)
      document.removeEventListener('visibilitychange',draw)
      resize.disconnect()
      stage.dispose()
    }
  },[region,save,entrances,night,attempt])
  useEffect(() => {
    if (renderer.current && !document.hidden) {
      try { setPoints(renderer.current.project(pose)) } catch { setFailed(true) }
    }
  },[pose])

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const from = moving.current
    if (from?.pointer !== event.pointerId) return
    moving.current = { x:event.clientX,z:event.clientY,pointer:event.pointerId }
    const clamp = (v: number) => Math.min(7,Math.max(-7,v))
    setPose({ ...pose, x:clamp(pose.x + (from.x-event.clientX)*.035), z:clamp(pose.z + (from.z-event.clientY)*.035) })
  }
  return <div className="absolute inset-0 overflow-hidden rounded-lg bg-sunken" data-region-depth={failed ? 'unavailable' : points ? 'ready' : 'loading'}>
    <canvas ref={canvas} className="absolute inset-0 size-full touch-none" aria-label="HD-2D farm section" hidden={failed}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return
        moving.current = { x:event.clientX,z:event.clientY,pointer:event.pointerId }
        event.currentTarget.setPointerCapture(event.pointerId)
      }} onPointerMove={move} onLostPointerCapture={() => { moving.current = null }} />
    {failed ? <div className="space-y-2 p-3 text-sm">
      <p role="status">Use the destination list to explore this section.</p>
      {typeof WebGL2RenderingContext !== 'undefined' && <button type="button" onClick={retry} className="min-h-11 rounded-md bg-panel px-3 font-semibold">Retry 3D view</button>}
    </div> : points && <>
      {children(points)}
      <button type="button" className="absolute bottom-2 right-2 z-20 min-h-11 rounded-md bg-panel px-3 font-semibold"
        onClick={() => setPose(pose.zoom > 1 ? {x:0,z:0,zoom:1} : { ...pose,zoom:1.35 })}>{pose.zoom > 1 ? 'Reset view' : 'Zoom in'}</button>
    </>}
  </div>
}
