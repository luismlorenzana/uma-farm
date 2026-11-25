import { currentDatePeriod, dateOf, type FarmSave } from '@farm/domain'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { buildPlot, mountRegion, type ScenePoint } from './farm-region-stage'
import { PLOT_CAMERA } from './travel-camera'

export default function PlotDepth({ save, plot, className, fallback, children }: {
  save: FarmSave; plot: number; className: string; fallback: ReactNode
  children(points: ReadonlyMap<string, ScenePoint>): ReactNode
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const current = useRef(save)
  current.current = save
  const [points, setPoints] = useState<ReadonlyMap<string, ScenePoint> | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const tiles = save.fields.plots[plot]?.tiles
  const season = dateOf(save.calendar.day, save.calendar).season
  const night = currentDatePeriod(save) === null
  useEffect(() => {
    const node = canvas.current
    if (!node || !tiles) return
    const layout = buildPlot(current.current, plot, night)
    let stage: ReturnType<typeof mountRegion>
    try { stage = mountRegion(node, layout) }
    catch { layout.scene.dispose(); setFailed(true); return }
    let lost = false
    const draw = () => {
      if (lost || document.hidden || !node.clientWidth || !node.clientHeight) return
      try { setPoints(stage.project(PLOT_CAMERA)) }
      catch { setFailed(true) }
    }
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      setFailed(true)
    }
    const onRestored = () => { setFailed(false); setPoints(null); setRetry(value => value + 1) }
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(draw)
    resize?.observe(node)
    node.addEventListener('webglcontextlost', onLost)
    node.addEventListener('webglcontextrestored', onRestored)
    document.addEventListener('visibilitychange', draw)
    window.addEventListener('resize', draw)
    draw()
    return () => {
      resize?.disconnect()
      document.removeEventListener('visibilitychange', draw)
      window.removeEventListener('resize', draw)
      node.removeEventListener('webglcontextlost', onLost)
      node.removeEventListener('webglcontextrestored', onRestored)
      stage.dispose()
    }
  }, [plot, tiles, season, night, retry])
  const ready = points && !failed
  return <>
    <div className={className} data-plot-depth={ready ? 'ready' : failed ? 'unavailable' : 'loading'} hidden={!ready && failed}>
      <canvas className="absolute inset-0 size-full" ref={canvas} aria-hidden />
      {ready && children(points)}
    </div>
    {!ready && fallback}
  </>
}
