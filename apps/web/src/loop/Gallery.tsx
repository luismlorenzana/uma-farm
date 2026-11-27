// Her gallery: `?gallery=<characterId>` over any page, from her profile's **Gallery**. Every illustration of hers in the
// art's order, three to a row in landscape (two on a narrow phone), each a 16:9 tile with its title under it: the ones
// you've seen show their picture, the rest a locked silhouette with the title. A tap on a seen one opens it full screen:
// the whole picture on black, its title at the foot, ‹ › (or a swipe, or the arrow keys) to her other seen ones, ✕ (or
// Escape) back to the grid. Earned tiles use small previews. Opening the viewer loads one full-size picture.
import { galleryOf, galleryTiles } from '@farm/domain'
import type { Illustration } from '@luismlorenzana/uma-data'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { useIllustrationsState, usePicture } from '../dialogue/illustrations'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { nameOfAnyone } from '../story/people'
import { useStory } from '../story/story'

export default function Gallery({ id }: { id: string }) {
  const save = useLoopSave()
  const story = useStory()
  const master = useMaster()
  const location = useLocation()
  const leave = useLeave()
  const fromLibrary = location.pathname === '/library'
  const state = useIllustrationsState(id)
  const [open, setOpen] = useState<string | null>(() => new URLSearchParams(location.search).get('art'))
  const close = () => {
    const params = new URLSearchParams(location.search)
    params.delete('art')
    leave(withParam({ ...location, search: params.size ? `?${params}` : '' }, 'gallery', null))
  }
  // Someone you haven't met, or an Uma with no illustrations: nothing to show.
  useEffect(() => {
    if (save && (!save.roster[id] || state === null)) close()
  }, [save, id, state]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || !save.roster[id]) return null
  const name = nameOfAnyone(master.status === 'ready' ? master.view : null, story, id)
  const ills = state === 'loading' ? null : state
  const tiles = ills ? galleryTiles(ills.scenes, galleryOf(save, id)) : []
  const seen = tiles.filter((t) => t.unlocked).map((t) => t.scene)
  const shown = open ? seen.findIndex((s) => s.id === open) : -1
  return createPortal(
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex flex-col bg-[#141018] text-white" role="dialog" aria-modal="true" aria-label={`${name}: her gallery`} data-gallery={id}>
      <header className="flex min-h-12 shrink-0 items-center gap-3 px-4">
        <h2 className="font-display min-w-0 flex-1 truncate text-[17px] font-bold">{name} · Gallery</h2>
        {ills && <span className="text-[14px] tabular-nums text-white/70" data-gallery-seen={seen.length}>{seen.length} of {tiles.length}</span>}
        <button type="button" onClick={close} aria-label="Close" className="grid size-11 place-items-center rounded-full text-[18px] text-white/85" data-action="close-gallery">✕</button>
      </header>
      {shown >= 0 ? null : !ills ? <p className="px-4 text-[15px] text-white/70" data-loading>…</p> : (
        <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-x-3 gap-y-4 overflow-y-auto px-4 pb-4 max-[560px]:grid-cols-2" data-tiles={tiles.length}>
          {tiles.map(({ scene, unlocked }) => (
            <li key={scene.id}>
              {unlocked
                ? <button type="button" onClick={() => setOpen(scene.id)} className="block w-full text-left" data-tile={scene.id} data-unlocked aria-label={scene.title}><Tile scene={scene} /></button>
                : <div data-tile={scene.id} data-locked><Locked title={fromLibrary ? 'Locked illustration' : scene.title} /></div>}
            </li>
          ))}
        </ul>
      )}
      {shown >= 0 && <Viewer scenes={seen} at={shown} onAt={(i) => setOpen(seen[i]!.id)} onClose={fromLibrary ? close : () => setOpen(null)} />}
    </div>,
    document.body,
  )
}

/** A seen one's tile: its picture at 16:9, its title under it. */
function Tile({ scene }: { scene: Illustration }) {
  const { url } = usePicture(scene.thumbnail?.path ?? null)
  return (
    <>
      <span className="block aspect-[16/9] overflow-hidden rounded-lg bg-white/8 shadow-2 ring-1 ring-white/10">
        {url && <img src={url} alt="" draggable={false} className="size-full object-cover select-none" />}
      </span>
      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-snug font-semibold">{scene.title}</span>
    </>
  )
}

/** A locked one: an Uma's silhouette on a dark tile, a lock, and its title, muted. */
function Locked({ title }: { title: string }) {
  return (
    <>
      <svg viewBox="0 0 160 90" className="block aspect-[16/9] w-full overflow-hidden rounded-lg ring-1 ring-white/10" role="img" aria-label={`Locked: ${title}`}>
        <defs>
          <linearGradient id="gallery-locked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2c2436" />
            <stop offset="1" stopColor="#1b1622" />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="url(#gallery-locked)" />
        <g fill="#3d3349">
          <path d="M67 31L62 11L75 26Z M93 31L98 11L85 26Z" />
          <path d="M80 23C66 23 62 34 63 45C64 55 62 62 65 70H95C98 62 96 55 97 45C98 34 94 23 80 23Z" />
          <path d="M44 90C46 74 60 66 72 64H88C100 66 114 74 116 90Z" />
        </g>
        <g fill="none" stroke="#8d82a0" strokeWidth="2.2">
          <path d="M134 72V67a5 5 0 0 1 10 0V72" />
        </g>
        <rect x="131" y="71" width="16" height="12" rx="2.5" fill="#8d82a0" />
      </svg>
      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-snug text-white/55">{title}</span>
    </>
  )
}

/** One seen illustration full screen: the whole picture on black, its title at the foot, ‹ › to the others. */
function Viewer({ scenes, at, onAt, onClose }: { scenes: readonly Illustration[]; at: number; onAt: (i: number) => void; onClose: () => void }) {
  const scene = scenes[at]!
  const { url } = usePicture(scene.path)
  const prev = at > 0 ? () => onAt(at - 1) : null
  const next = at < scenes.length - 1 ? () => onAt(at + 1) : null
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev?.()
      else if (e.key === 'ArrowRight') next?.()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })
  // A swipe goes to the next or the last.
  const from = useRef<number | null>(null)
  const swipe = (x: number) => {
    if (from.current === null) return
    const dx = x - from.current
    from.current = null
    if (dx < -48) next?.()
    else if (dx > 48) prev?.()
  }
  return (
    <div className="fixed inset-0 z-[61] bg-black" role="dialog" aria-modal="true" aria-label={scene.title} data-viewer={scene.id}
      onPointerDown={(e) => { from.current = e.clientX }} onPointerUp={(e) => swipe(e.clientX)} onPointerCancel={() => { from.current = null }}>
      {url && <img key={url} src={url} alt={scene.title} draggable={false} className="absolute inset-0 size-full object-contain select-none" style={{ animation: 'portrait-face-in 300ms ease-out both' }} />}
      <div className="pt-safe pr-safe absolute inset-x-0 top-0 flex justify-end p-2" style={{ background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent)' }}>
        <button type="button" onClick={onClose} aria-label="Back to the gallery" className="grid size-11 place-items-center rounded-full bg-black/40 text-[18px] text-white" data-action="close-viewer">✕</button>
      </div>
      {prev && <Arrow side="left" onTap={prev} />}
      {next && <Arrow side="right" onTap={next} />}
      <p className="pb-safe pl-safe pr-safe absolute inset-x-0 bottom-0 px-6 pt-8 pb-3 text-center text-[15px] font-semibold text-white" style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.6), transparent)' }} data-viewer-title>
        {scene.title} <span className="pl-2 font-normal text-white/60 tabular-nums">{at + 1} / {scenes.length}</span>
      </p>
    </div>
  )
}

function Arrow({ side, onTap }: { side: 'left' | 'right'; onTap: () => void }) {
  return (
    <button type="button" onClick={onTap} aria-label={side === 'left' ? 'The one before' : 'The next one'} data-action={side === 'left' ? 'previous' : 'next'}
      className={`absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-[24px] text-white ${side === 'left' ? 'left-[max(0.75rem,env(safe-area-inset-left))]' : 'right-[max(0.75rem,env(safe-area-inset-right))]'}`}>
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
