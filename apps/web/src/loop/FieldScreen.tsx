// The field's own screen: `/field`, full screen in landscape (the shell's frame drops its rail and bar; the day's actions
// and End the day sit in the screen's own strip). One plot a page, 8 × 5 big tiles: a tap on a tile opens its panel at
// the right (`?tile=<i>`, its tile in the plot: clear, till, plant, water, harvest, an action each), the same panel the
// farm map had. Page dots in the strip, arrows at the plot's sides, a swipe across it or the arrow keys move between
// plots (`?plot=<n>`, 1 first); a plot not cleared yet shows locked with what opens it, and Clear once its Farm Rank has
// come. Each row has its tab at the left: the farmhands who work it, a droplet once one waters the whole row in one
// action, and a tap opens the row's panel (`?row=<r>`): what it holds, who works it and how much an action. Every move
// inside the screen replaces the entry, so the strip's Farm button and Back both go to the farm. Loaded on demand.
import {
  APTITUDE_NAMES, CROP_IDS, cropBaseGrade, cropGrades, dateOf, fieldIndex, FIELD_COLUMNS, FIELD_PLOTS, FIELD_ROWS, FIELD_TILES, handsTonight, itemNameOf,
  plantableIn, plotCounts, plotName, rowPlan, SEASONS, SEASON_NAMES, TASK_NAMES, townDay, type CropId, type FarmSave, type FieldPlan, type Season,
} from '@farm/domain'
import { useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button, CloseIcon, LockedIcon } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { DayActions } from '../shell/Bars'
import { clearPlotAt, planFieldRow } from './actions'
import { TileArt } from './farm-art'
import { countsWords, tileLabel, tileView, tileWhere } from './farm-view'
import { plotPages, rowCounts, rowHands, type PlotPage } from './field-view'
import { Notes, TilePanel, useAct } from './FarmPanels'
import { useTalents } from './talents'
import { useStory } from '../story/story'
import { namer } from '../story/people'
import { HerMenu } from '../town/HerMenu'
import { farmPresence } from '../world/farm-presence'
import type { ScenePoint } from '../world/farm-region-stage'

const PlotDepth = lazy(() => import('../world/PlotDepth').catch(() => ({ default: ({ fallback }: { fallback: ReactNode }) => <>{fallback}</> })))

/** The page's params: the plot's index, its tile and its row, each checked against the save; null where absent. */
interface FieldAt { plot: number; tile: number | null; row: number | null }

const intParam = (value: string | null): number | null => (value !== null && /^\d{1,3}$/.test(value) ? Number(value) : null)

/** `/field`, `?plot=<n>` (1 first), `?tile=<i>` (0–39 on its plot) or `?row=<r>` (1–5). An unknown one is dropped; a
 * tile's link from the farm map before plots (`?tile=` past 39) lands on its plot. */
export default function FieldRoute() {
  const save = useLoopSave()
  const [params] = useSearchParams()
  const location = useLocation()
  if (!save) return null
  const rawPlot = params.get('plot')
  const rawTile = params.get('tile')
  const rawRow = params.get('row')
  const plotN = rawPlot === null ? 1 : intParam(rawPlot)
  const tileN = rawTile === null ? null : intParam(rawTile)
  const rowN = rawRow === null ? null : intParam(rawRow)
  // A field index from an older link: its plot and its tile there.
  if (rawPlot === null && tileN !== null && tileN >= FIELD_TILES) {
    return <Navigate to={`/field?plot=${Math.floor(tileN / FIELD_TILES) + 1}&tile=${tileN % FIELD_TILES}`} replace state={location.state} />
  }
  const plot = plotN !== null && plotN >= 1 && plotN <= FIELD_PLOTS.length ? plotN - 1 : null
  const cleared = plot !== null && plot < save.fields.plots.length
  const tile = cleared && tileN !== null && tileN < FIELD_TILES ? tileN : null
  const row = cleared && tile === null && rowN !== null && rowN >= 1 && rowN <= FIELD_ROWS ? rowN - 1 : null
  if (plot === null || (rawTile !== null && tile === null) || (rawRow !== null && row === null)) {
    return <Navigate to={`/field${plot !== null && plot > 0 ? `?plot=${plot + 1}` : ''}`} replace state={location.state} />
  }
  return <FieldScreen save={save} at={{ plot, tile, row }} />
}

/** The field's path for a plot, with its tile or row. */
const fieldPath = (plot: number, extra: { tile?: number; row?: number } = {}): string => {
  const params = new URLSearchParams()
  if (plot > 0) params.set('plot', String(plot + 1))
  if (extra.tile !== undefined) params.set('tile', String(extra.tile))
  if (extra.row !== undefined) params.set('row', String(extra.row + 1))
  const search = params.toString()
  return `/field${search ? `?${search}` : ''}`
}

/** The tile's size: the plot's five rows and eight columns fit the space beside the row tabs (and the arrows, while
 * they show), 36 to 88 points. */
const ARROW = 44
const TAB = 30
function useTileSize(arrows: boolean): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(56)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      const byHeight = (el.clientHeight - 16) / FIELD_ROWS
      const byWidth = (el.clientWidth - (arrows ? 2 * ARROW : 0) - TAB - 16) / FIELD_COLUMNS
      setSize(Math.max(36, Math.min(88, Math.floor(Math.min(byHeight, byWidth)))))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [arrows])
  return [ref, size]
}

/** How the field works, behind the help button. */
function FieldHelp() {
  return (
    <GuideButton topic="fields" title="The field" label="How the field works">
      <p>The field is plots of 8 by 5 tiles, a page each. The dots, the arrows or a swipe across the plot move between them.</p>
      <p>Tap a tile for its action: clear, till, plant, water or harvest, one action each. A watered tile grows a stage at night.</p>
      <p>A row’s tab shows the farmhands who work it, and a droplet once one waters the whole row in one action. Set their tasks, a plot’s rows, on the Book’s work board.</p>
      <p>Use the seasonal row plan to choose the crop and seed grade for the Plant task. Orchard plants stay on their tile and bear once per year. Water them until established.</p>
      <p>A new plot opens at its Farm Rank: clear it for its gold and an action, and it’s yours at once, wild ground to clear and till. Plots cost no upkeep.</p>
    </GuideButton>
  )
}

function FieldScreen({ save, at }: { save: FarmSave; at: FieldAt }) {
  const navigate = useNavigate()
  const location = useLocation()
  const leave = useLeave()
  // The arrows step aside while a panel is open, so the plot keeps its size beside it; the dots and a swipe still turn.
  const panel = at.tile !== null || at.row !== null
  const [area, tileSize] = useTileSize(!panel)
  const [note, setNote] = useState<string | null>(null)
  const [gridView, setGridView] = useState(false)
  const [params] = useSearchParams()
  const master = useMaster()
  const pack = useStory()
  const { of } = useTalents()
  const presence = useMemo(() => farmPresence(save, pack, of).actors, [save, pack, of])
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const canTalk = Boolean(pack && master.status === 'ready')
  const crew = canTalk ? [...presence.values()].filter(actor => actor.door === 'fields:' + at.plot)
    .slice(0, 3).map(actor => ({ ...actor, name: nameOf(actor.id) })) : []
  const speaker = crew.find(actor => actor.id === params.get('fieldUma'))?.id
  const open = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('fieldUma', id)
    navigate(location.pathname + '?' + next.toString(), { state: { back: true } })
  }
  const canDraw = typeof WebGL2RenderingContext !== 'undefined'
  const grid = <>
    <PlotGrid save={save} plot={at.plot} tile={at.tile} row={at.row} size={tileSize} state={location.state} />
    {crew.length > 0 && <div className="absolute top-0 left-2 z-10 flex gap-1" aria-label="Farm crew">
      {crew.map(({ id, name, detail }) => <button key={id} type="button" title={detail} aria-label={'Talk to ' + name}
        data-plot-worker={id} className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-panel/90" onClick={() => open(id)}>
        <Avatar id={id} size={28} label={name} />
      </button>)}
    </div>}
  </>
  const pages = plotPages(save)
  const page = pages[at.plot]!
  const tally = plotCounts(save, at.plot)
  const counts = page.cleared ? countsWords(tally) : []
  // With nothing due, what the plot still needs: its ground to clear or till.
  const due = counts.length > 0 ? counts.join(' · ') : tally.clear > 0 ? `${tally.clear} to clear or till` : 'Nothing due'
  // Every move inside the screen replaces the entry and keeps how it was reached, so leaving goes back to the farm.
  const go = useCallback((to: string) => navigate(to, { replace: true, state: location.state }), [navigate, location.state])
  const turn = useCallback((by: number) => {
    const next = at.plot + by
    if (next < 0 || next >= pages.length) return
    setNote(null)
    go(fieldPath(next))
  }, [at.plot, pages.length, go])
  const close = useCallback(() => go(fieldPath(at.plot)), [go, at.plot])
  // The arrow keys turn the page; Escape closes a panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (speaker) return
      if (e.target instanceof HTMLElement && e.target.closest('input, select, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowLeft') turn(-1)
      else if (e.key === 'ArrowRight') turn(1)
      else if (e.key === 'Escape' && (at.tile !== null || at.row !== null)) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turn, close, at.tile, at.row, speaker])
  // A swipe across the plot turns the page; the tap that ends it opens nothing.
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)
  const swiped = useRef(false)
  const onPointerDown = (e: ReactPointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId } }
  const onPointerUp = (e: ReactPointerEvent) => {
    const from = swipe.current
    swipe.current = null
    if (!from || from.id !== e.pointerId) return
    const dx = e.clientX - from.x
    const dy = e.clientY - from.y
    if (Math.abs(dx) >= 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      swiped.current = true
      turn(dx < 0 ? 1 : -1)
    }
  }
  const onClickCapture = (e: React.MouseEvent) => {
    if (!swiped.current) return
    swiped.current = false
    e.preventDefault()
    e.stopPropagation()
  }
  const prev = pages[at.plot - 1]
  const next = pages[at.plot + 1]
  if (speaker && pack && master.status === 'ready') {
    const back = fieldPath(at.plot, at.tile !== null ? { tile: at.tile } : at.row !== null ? { row: at.row } : {})
    return <HerMenu id={speaker} save={save} pack={pack} master={master.view} day={townDay(save, pack)}
      nameOf={nameOf} farmSetting="fields" onClose={() => leave(back)} />
  }
  return (
    <div className="pl-safe pr-safe pb-safe absolute inset-0 flex flex-col bg-[#9cc27a]" data-field-screen data-plot-page={at.plot + 1}>
      <header className="flex min-h-12 shrink-0 items-center gap-1 border-b border-hairline bg-panel/95 pr-1 shadow-1">
        <button type="button" onClick={() => leave('/')} className="flex min-h-11 shrink-0 items-center gap-0.5 px-2 text-[14px] font-semibold text-ink" data-action="to-farm">
          <span aria-hidden className="text-[20px] leading-none">‹</span> Farm
        </button>
        <div className="min-w-0 flex-1 px-1">
          <h1 className="font-display truncate text-[17px] leading-tight font-bold">{page.name}</h1>
          <p className="truncate text-[12px] text-ink-soft" data-plot-counts>{page.cleared ? due : (page.lock ?? 'Ready to clear')}</p>
        </div>
        <PageDots pages={pages} plot={at.plot} onPick={(p) => { setNote(null); go(fieldPath(p)) }} />
        <span className="flex-1" />
        {page.cleared && canDraw && <button type="button" className="min-h-11 shrink-0 rounded-md border border-hairline px-2 text-[13px] font-semibold"
          data-action="plot-view" onClick={() => setGridView(value => !value)}>{gridView ? 'HD-2D' : 'Grid'}</button>}
        <FieldHelp />
        <DayActions />
      </header>
      <div className="relative flex min-h-0 flex-1">
        <div ref={area} className="relative min-w-0 flex-1 select-none" style={{ touchAction: 'pan-y' }}
          onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null }} onClickCapture={onClickCapture} data-plot-area>
          {note && <p role="status" className="absolute inset-x-0 top-1 z-10 mx-auto w-fit rounded-full bg-success px-3 py-0.5 text-[13px] font-semibold text-ink-on-dark shadow-2" data-plot-note>{note}</p>}
          {page.cleared
            ? canDraw && !gridView
              ? <Suspense fallback={grid}><PlotDepth key={at.plot} plot={at.plot} save={save} fallback={grid} crew={crew} open={open}
                className={panel ? 'absolute inset-0' : 'absolute inset-y-0 inset-x-11'}>
                {points => <PlotGrid save={save} plot={at.plot} tile={at.tile} row={at.row} size={tileSize} state={location.state} points={points} />}
              </PlotDepth></Suspense>
              : grid
            : <LockedPlot save={save} page={page} size={tileSize} onCleared={(words) => setNote(words)} />}
          {!panel && prev && <Arrow side="left" page={prev} onClick={() => turn(-1)} />}
          {!panel && next && <Arrow side="right" page={next} onClick={() => turn(1)} />}
        </div>
        {at.tile !== null && <Side label={tileView(save, fieldIndex(at.plot, at.tile)).title} onClose={close} data={{ 'data-tile-sheet': fieldIndex(at.plot, at.tile) }}>
          <TilePanel save={save} index={fieldIndex(at.plot, at.tile)} />
        </Side>}
        {at.row !== null && <Side label={`Row ${at.row + 1}`} onClose={close} data={{ 'data-row-sheet': at.row + 1 }}>
          <RowPanel save={save} plot={at.plot} row={at.row} />
        </Side>}
      </div>
    </div>
  )
}

/** The page dots: a dot a plot, the one shown lit, a lock on one not cleared. */
function PageDots({ pages, plot, onPick }: { pages: readonly PlotPage[]; plot: number; onPick: (plot: number) => void }) {
  return (
    <nav aria-label="Plots" className="flex shrink-0 items-center" data-page-dots>
      {pages.map((p) => {
        const on = p.plot === plot
        return (
          <button key={p.plot} type="button" onClick={() => onPick(p.plot)} aria-current={on ? 'page' : undefined}
            aria-label={p.cleared ? p.name : `${p.name}, locked${p.lock ? `: ${p.lock}` : ''}`}
            className="grid h-11 w-8 place-items-center" data-page-dot={p.plot + 1} data-locked={!p.cleared || undefined}>
            {p.cleared
              ? <span aria-hidden className={`block rounded-full transition-all ${on ? 'h-2.5 w-5 bg-accent' : 'size-2.5 bg-ink/30'}`} />
              : <span aria-hidden className={`grid place-items-center rounded-full ${on ? 'size-6 bg-accent text-accent-ink' : 'size-5 bg-ink/15 text-ink-soft'}`}><LockedIcon size={14} /></span>}
          </button>
        )
      })}
    </nav>
  )
}

/** An arrow at the plot's side to the next or the last page. */
function Arrow({ side, page, onClick }: { side: 'left' | 'right'; page: PlotPage; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${page.name}${page.cleared ? '' : ', locked'}`}
      className={`absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-hairline-strong bg-panel/90 text-[24px] leading-none text-ink shadow-2 ${side === 'left' ? 'left-1' : 'right-1'}`}
      data-action={side === 'left' ? 'prev-plot' : 'next-plot'}>
      <span aria-hidden>{side === 'left' ? '‹' : '›'}</span>
    </button>
  )
}

/** A plot's page: its rows, each with its tab at the left, then its eight tiles, a tap each. */
function projectedCell(points: ReadonlyMap<string, ScenePoint>, row: number, col: number): CSSProperties {
  const corners = [[row, col], [row, col + 1], [row + 1, col + 1], [row + 1, col]].map(([r, c]) => points.get('tile:' + r + ':' + c)!)
  const x = Math.min(...corners.map(point => point.x))
  const y = Math.min(...corners.map(point => point.y))
  const width = Math.max(...corners.map(point => point.x)) - x
  const height = Math.max(...corners.map(point => point.y)) - y
  const shape = corners.map(point => ((point.x - x) / width * 100) + '% ' + ((point.y - y) / height * 100) + '%')
  return { left: x * 100 + '%', top: y * 100 + '%', width: width * 100 + '%', height: height * 100 + '%', clipPath: 'polygon(' + shape.join(',') + ')' }
}

function PlotGrid({ save, plot, tile, row, size, state, points }: {
  save: FarmSave; plot: number; tile: number | null; row: number | null; size: number; state: unknown
  points?: ReadonlyMap<string, ScenePoint>
}) {
  const talents = useTalents()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const tiles = save.fields.plots[plot]!.tiles
  return (
    <div className="absolute inset-0 grid place-items-center" data-plot={plot + 1}>
      <div role="grid" aria-label={plotName(plot)} className={points ? 'absolute inset-0' : 'grid rounded-[6px] bg-[#6b4a2b]/30 p-1 shadow-2'}
        style={points ? undefined : { gridTemplateColumns: `${TAB}px repeat(${FIELD_COLUMNS}, ${size}px)`, gridAutoRows: `${size}px` }}>
        {Array.from({ length: FIELD_ROWS }, (_, r) => {
          const hands = rowHands(save, plot, r, talents.of)
          const label = `Row ${r + 1}${hands.length > 0 ? `: ${[...new Set(hands.map((h) => nameOf(h.id)))].join(', ')} ${hands.length === 1 ? 'works' : 'work'} it` : ''}`
          return (
            <div key={r} role="row" className="contents">
              <Link to={fieldPath(plot, { row: r })} replace state={state} aria-label={label} aria-current={row === r ? 'true' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-[4px] text-[12px] font-bold ${points ? 'absolute border-2 border-transparent bg-clip-padding' : 'mr-1'} ${row === r ? 'bg-panel text-ink' : 'bg-panel/70 text-ink-soft'}`}
                style={points ? projectedCell(points, r, -1) : undefined}
                data-row-tab={r + 1} data-row-hands={hands.length || undefined}>
                <span aria-hidden>{r + 1}</span>
                {hands[0] && <span aria-hidden className="w-[20px]"><Avatar id={hands[0].id} size={20} label="" /></span>}
                {hands.some((h) => h.row) && (
                  <svg aria-hidden viewBox="0 0 10 10" className="size-2.5" data-row-trick>
                    <path d="M5 1C5 1 2 5 2 6.5a3 3 0 006 0C8 5 5 1 5 1z" fill="#3f9fd8" />
                  </svg>
                )}
              </Link>
              {Array.from({ length: FIELD_COLUMNS }, (_, c) => {
                const i = r * FIELD_COLUMNS + c
                const t = tiles[i]!
                const index = fieldIndex(plot, i)
                return (
                  <div key={i} role="gridcell" className={points ? 'absolute' : 'p-[2px]'} style={points ? projectedCell(points, r, c) : undefined}>
                    <Link to={fieldPath(plot, { tile: i })} replace state={state} aria-label={tileLabel(save, index)} aria-current={tile === i ? 'true' : undefined}
                      className={`relative block size-full rounded-[4px] ${points ? 'hover:bg-white/15 focus-visible:bg-white/25' : ''} ${tile === i ? (points ? 'bg-white/30' : 'z-10 outline-[3px] outline-offset-1 outline-white outline-solid') : ''}`}
                      data-tile={i} data-crop={t.crop ?? undefined} data-ready={t.ready || undefined} data-grade={t.grade}>
                      {!points && <TileArt tile={t} cell={size} />}
                      {t.grade && <span aria-hidden className="absolute right-0 bottom-0 rounded-tl-sm bg-panel px-0.5 text-[10px] leading-tight font-bold">G{t.grade}</span>}
                    </Link>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {points && tiles.map((tile, index) => {
        const point = points.get('crop:' + index)
        return point && tile.crop && <span key={index} aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-sm" data-plot-crop={tile.crop}
          style={{ left: point.x * 100 + '%', top: point.y * 100 + '%' }}>
          <ItemIcon id={tile.crop} size={Math.round(size * (tile.ready ? .47 : .33))} />
        </span>
      })}
    </div>
  )
}

import { clearPlot, plotLock, plotLockWords } from '@farm/domain'
import { CreditPurchase } from './CreditPurchase'

/** A plot not cleared yet: wild ground behind a card that says what opens it, its cost, and Clear once its Farm Rank has
 * come. */
function LockedPlot({ save, page, size, onCleared }: { save: FarmSave; page: PlotPage; size: number; onCleared: (words: string) => void }) {
  const { note, error, busy, run } = useAct(page.plot)
  const cost = page.opens.by === 'clear' ? page.opens.gold : 0
  const rank = page.opens.by === 'clear' ? page.opens.rank : 1
  const clear = () => run(clearPlotAt(page.plot).then(() => {
    onCleared(`${page.name} is yours: clear and till its tiles.`)
    return null
  }))
  return (
    <div className="absolute inset-0 grid place-items-center" data-plot-locked={page.plot + 1}>
      <div aria-hidden className="rounded-[6px] opacity-60 shadow-2" style={{
        width: TAB + FIELD_COLUMNS * size + 8, height: FIELD_ROWS * size + 8, background: '#86ad63',
        backgroundImage: 'radial-gradient(circle at 30% 60%, #4f7a35 0 9%, transparent 11%), radial-gradient(circle at 70% 30%, #9a9a94 0 8%, transparent 10%)',
        backgroundSize: `${size}px ${size}px`,
      }} />
      <div className="absolute max-h-full w-[min(320px,80%)] space-y-2 overflow-y-auto rounded-lg border border-hairline bg-panel/95 p-4 text-center shadow-3">
        <span className="mx-auto grid size-9 place-items-center rounded-full bg-sunken text-ink-soft"><LockedIcon size={20} /></span>
        <h2 className="font-display text-[18px] font-bold">{page.name}</h2>
        <p className="text-[14px] font-semibold" data-plot-lock>{page.offered ? 'Ready to clear' : (page.lock ?? `Opens at Farm Rank ${rank}`)}</p>
        <p className="text-[13px] text-ink-soft">Farm Rank {rank} · {cost.toLocaleString('en-US')}g and an action. It opens at once, wild: clear and till its tiles. No upkeep.</p>
        <Notes note={note} error={error} />
        {page.offered && <CreditPurchase save={save} cost={cost} title={page.name}
          lock={plotLockWords(plotLock({ ...save, gold: cost }, page.plot))} order={s => clearPlot(s, page.plot)}
          onDone={() => onCleared(`${page.name} is yours.`)} />}
        {page.offered && (
          <Button className="w-full" disabled={busy || page.lock !== null} onClick={clear} data-action="clear-plot">
            {page.lock ?? `Clear ${page.name} · ${cost.toLocaleString('en-US')}g · 1 action`}
          </Button>
        )}
      </div>
    </div>
  )
}

/** A side panel at the right, beside the plot: a tile's or a row's. The plot narrows to make room for it. */
function Side({ label, onClose, data, children }: { label: string; onClose: () => void; data: Record<string, string | number>; children: ReactNode }) {
  return (
    <aside aria-label={label} className="flex w-[280px] max-w-[45%] shrink-0 flex-col border-l border-hairline bg-panel shadow-3" {...data}>
      <header className="flex min-h-11 items-center gap-2 border-b border-hairline pl-4">
        <h2 className="font-display min-w-0 flex-1 truncate text-[17px] font-bold">{label}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 shrink-0 place-items-center text-ink-soft" data-action="close-panel">
          <CloseIcon size={20} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </aside>
  )
}

/** A row's panel: what it holds, the farmhands who work it, each with her task there and what she does an action. */
function RowPanel({ save, plot, row }: { save: FarmSave; plot: number; row: number }) {
  const talents = useTalents()
  const story = useStory()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const counts = countsWords(rowCounts(save, plot, row))
  const hands = rowHands(save, plot, row, talents.of)
  const today = dateOf(save.calendar.day, save.calendar).season
  const forecast = rowPlan(save, plot, row, today) ? rowCounts(handsTonight(save, save, talents.of, story).save, plot, row) : null
  return (
    <div className="space-y-2.5 p-4" data-row-panel={row + 1}>
      <p className="text-[12px] text-ink-faint">{tileWhere(save, { plot, where: `Row ${row + 1}` })}</p>
      <p className="text-[15px]" data-row-counts>{counts.length > 0 ? counts.join(' · ') : 'Nothing due'}</p>
      <RowPlanEditor key={`${plot}:${row}`} save={save} plot={plot} row={row} today={today} />
      {forecast && (
        <p className="text-[12px] text-ink-soft" data-row-forecast>
          Tonight · {forecast.water ? `${forecast.water} still need water` : 'Water covered'}
          {forecast.ripe ? ` · ${forecast.ripe} ripe waiting` : ''}
          {forecast.plant ? ` · ${forecast.plant} empty tilled` : ''}
        </p>
      )}
      <h3 className="text-micro pt-1">Farmhands on this row</h3>
      {hands.length === 0 ? (
        <p className="text-[13px] text-ink-soft" data-row-none>No farmhand works this row.</p>
      ) : (
        <ul className="space-y-1.5">
          {hands.map((h) => (
            <li key={`${h.id}:${h.kind}`} className="flex items-center gap-2 rounded-sm border border-hairline px-2 py-1.5" data-row-hand={h.id} data-row-trick={h.row || undefined}>
              <span className="w-8 shrink-0"><Avatar id={h.id} size={32} label={nameOf(h.id)} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{nameOf(h.id)} · {TASK_NAMES[h.kind]}</span>
                <span className={`block text-[12px] ${h.row ? 'font-semibold text-success' : 'text-ink-soft'}`}>{APTITUDE_NAMES[h.aptitude]} {h.level} · {h.each}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[12px] text-ink-faint">Your own tools work a tile at a time: tap a tile.</p>
      <Link to="/book" state={{ back: true }} className="flex min-h-11 items-center justify-center rounded-md border border-hairline-strong text-[14px] font-semibold" data-action="work-board">
        The work board
      </Link>
    </div>
  )
}

function RowPlanEditor({ save, plot, row, today }: { save: FarmSave; plot: number; row: number; today: Season }) {
  const [season, setSeason] = useState<Season>(today)
  const { note, error, busy, run } = useAct(season)
  const plan = rowPlan(save, plot, row, season)
  const hasOtherSeason = SEASONS.some((other) => other !== season && rowPlan(save, plot, row, other))
  const grades = plan?.crop ? cropGrades(plan.crop) : []
  const choices = CROP_IDS.filter((crop) => plantableIn(crop, season)).sort((a, b) => itemNameOf(a).localeCompare(itemNameOf(b)))
  const setPlan = (next: FieldPlan | null) => run(planFieldRow(plot, row, season, next).then(() => null))
  const chooseCrop = (value: string) => {
    if (value === '') return setPlan(null)
    if (value === 'any') return setPlan({ crop: null, harvestNext: false })
    const crop = value as CropId
    setPlan({ crop, grade: cropBaseGrade(crop), harvestNext: false })
  }
  const select = 'min-h-11 max-w-full rounded-sm border border-hairline-strong bg-panel px-2'
  return (
    <fieldset className="space-y-1 text-[14px]">
      <legend className="text-micro">Seasonal row plan</legend>
      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2">Season
          <select className={select} value={season} onChange={(e) => setSeason(e.currentTarget.value as Season)}>
            {SEASONS.map((s) => <option key={s} value={s}>{SEASON_NAMES[s]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">Crop
          <select className={select} value={plan ? plan.crop ?? 'any' : ''} disabled={busy} onChange={(e) => chooseCrop(e.currentTarget.value)}>
            <option value="">{hasOtherSeason ? 'Idle this season' : 'Use Plant assignment'}</option>
            <option value="any">Any annual in season</option>
            {choices.map((crop) => <option key={crop} value={crop}>{itemNameOf(crop)}</option>)}
          </select>
        </label>
      </div>
      {plan?.crop && (
        <label className="flex items-center gap-2">Plant grade
          <select className={select} value={plan.grade} disabled={busy} onChange={(e) => {
            const grade = Number(e.currentTarget.value)
            setPlan({ ...plan, grade, harvestNext: plan.harvestNext && grades.some((g) => g.grade === grade + 1) })
          }}>
            {grades.map((g) => <option key={g.id} value={g.grade}>G{g.grade}</option>)}
          </select>
        </label>
      )}
      {plan && (
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" checked={plan.harvestNext} disabled={busy || (!!plan.crop && !grades.some((g) => g.grade === plan.grade + 1))}
            onChange={(e) => setPlan({ ...plan, harvestNext: e.currentTarget.checked })} />
          Harvest next grade when skilled
        </label>
      )}
      <Notes note={note} error={error} />
    </fieldset>
  )
}
