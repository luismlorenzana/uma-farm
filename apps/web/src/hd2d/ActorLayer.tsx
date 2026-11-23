import { useEffect, useRef } from 'react'
import { acquireWalkingArt, type WalkingArt, type WalkingOutfit } from './character-art'
import { routePose, type ActorRoute } from './actor-route'
import type { CharacterSpritePlayer } from '@luismlorenzana/uma-stage/character-player'

interface Figure extends WalkingArt { route: ActorRoute; player: CharacterSpritePlayer; offset: number }

/** An overlay on a painted location. Layout coordinates are the image's normalized feet positions. */
export function ActorLayer({ actors, outfit, height = 38, oneWay = false, standing = false, onArt }: {
  actors: readonly ActorRoute[]; outfit: WalkingOutfit; height?: number; oneWay?: boolean; standing?: boolean; onArt?(id: string): void
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const signature = JSON.stringify(actors)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || signature === '[]' || typeof CanvasRenderingContext2D === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const routes = JSON.parse(signature) as ActorRoute[]
    const leases = routes.map(actor => acquireWalkingArt(actor.id, outfit))
    const figures: Figure[] = []
    let disposed = false, pending = 0, time = 0, last: number | null = null
    let shown = typeof IntersectionObserver === 'undefined'
    const frame = (now: number) => {
      pending = 0
      if (disposed || !figures.length) return
      const delta = last === null ? 0 : Math.min(now - last, 80)
      time += delta
      last = now
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(canvas.clientWidth * scale)
      const tall = Math.round(canvas.clientHeight * scale)
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== tall) canvas.height = tall
      ctx.clearRect(0, 0, width, tall)
      ctx.imageSmoothingEnabled = false
      const positions = figures.map(figure => ({ figure, pose: standing ? { x:figure.route.stop[0],y:figure.route.stop[1],facing:'front' as const,moving:false } : routePose(figure.route, time, figure.offset, oneWay) }))
      positions.sort((a, b) => a.pose.y - b.pose.y)
      for (const { figure, pose } of positions) {
        const { cell, foot } = figure.sprite
        const ratio = height * scale / cell.height
        const crop = figure.player.update(delta, pose.facing, pose.moving)
        ctx.drawImage(figure.image, crop.x, crop.y, cell.width, cell.height,
          Math.round(width * pose.x - foot.x * ratio), Math.round(tall * pose.y - foot.y * ratio), cell.width * ratio, height * scale)
      }
      if (!standing && (!oneWay || time < 2600)) schedule()
    }
    const schedule = () => {
      if (!pending && shown && !document.hidden && figures.length && !disposed) pending = requestAnimationFrame(frame)
    }
    const visibility = () => {
      last = null
      if (!shown || document.hidden) { cancelAnimationFrame(pending); pending = 0 }
      else schedule()
    }
    const watch = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      shown = !!entry?.isIntersecting
      visibility()
    })
    watch?.observe(canvas)
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resize?.observe(canvas)
    document.addEventListener('visibilitychange', visibility)
    for (const [index, lease] of leases.entries()) {
      void lease.ready.then(async art => {
        if (disposed || !art) return
        const { CharacterSpritePlayer } = await import('@luismlorenzana/uma-stage/character-player')
        if (!disposed) {
          figures.push({ ...art, route: routes[index]!, player: new CharacterSpritePlayer(art.sprite), offset: oneWay ? 0 : index * 740 })
          canvas.dataset.walkingActors = String(figures.length)
          onArt?.(routes[index]!.id)
          schedule()
        }
      }).catch(() => undefined)
    }
    return () => {
      disposed = true
      cancelAnimationFrame(pending)
      document.removeEventListener('visibilitychange', visibility)
      watch?.disconnect()
      resize?.disconnect()
      for (const lease of leases) lease.release()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      delete canvas.dataset.walkingActors
    }
  }, [signature, outfit, height, oneWay, standing, onArt])
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}
