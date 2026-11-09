// The Fields' page (F20 decision 11): `/fields` in the loop's build, the farm's own page, not uma-kit/work's slot rows.
// Four block cards, A to D: a locked one shows its Farm Rank and cost with Buy · 800g; an owned one its tender's row and
// a 3 × 3 grid of plots. A plot shows its crop's icon and the nights left, or Ready; a tap on an empty plot plants
// (`?plant=A.4`), on a growing one shows it (`?plot=A.4`), on a Ready one harvests. Plant all (`?plant=A`) and Harvest all
// do a block, and the tender comes from uma-kit's picker over the Umas home (`?tend=A`), with F21's talents and ranks:
// "Hand · B" in farming on each card, opening by farming. Each sheet is a search parameter, so Back closes it. Loaded on
// demand, loop's build only.
import { CROPS, isBusy, itemNameOf, receiptItems, tendedBlock, type BlockId, type FarmingTalentOf, type HarvestReceipt, type SaveV3 } from '@farm/domain'
import { FaceTile, UmaPicker } from '@luismlorenzana/uma-kit/album'
import { PlaceHeader, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster, type MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { buyLand, harvestBlock, harvestPlot, plantEvery, plantSeed, tendBlock } from './actions'
import {
  cropFacts, fieldsView, growthWords, nightsWords, noSeedsWords, plotKey, seedOptions, tenderRank, type LockedBlock, type OwnedBlock, type PlotView,
} from './fields-view'
import { goldWords } from './goods-view'
import { activityOrder, pickerSorts, rankTalent, UMA_FACETS, umaRows, type LoopUmaRow } from './roster-view'
import { farmingTalents, useTalents } from './talents'
import { umaBadges } from './UmaMarks'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** The page's sheets: a plot to plant (or a block, Plant all), a plot to show, a block's tender. */
const SHEETS = ['plant', 'plot', 'tend'] as const

/** The location with its sheets closed and, optionally, one param set. */
function withSheets(location: { pathname: string; search: string }, key?: string, value?: string): string {
  const params = new URLSearchParams(location.search)
  for (const sheet of SHEETS) params.delete(sheet)
  if (key && value) params.set(key, value)
  const search = params.toString()
  return `${location.pathname}${search ? `?${search}` : ''}`
}

/** "+9 Carrot (★1 × 7, ★2 × 2) · 1 seed back". */
function receiptWords(receipt: HarvestReceipt, crop: string | null): string {
  const items = receiptItems(receipt)
  const stars = receipt.stars.flatMap((n, i) => (n > 0 ? [`★${i + 1} × ${n}`] : [])).join(', ')
  const seeds = receipt.seeds > 0 ? ` · ${receipt.seeds} seed${receipt.seeds === 1 ? '' : 's'} back` : ''
  return `+${items}${crop ? ` ${crop}` : ''} (${stars})${seeds}`
}

export default function FieldsPage() {
  const save = useLoopSave()
  if (!save) return null
  return <Fields save={save} />
}

/** How the Fields work, behind the header's (i). */
function About() {
  return (
    <>
      <p>Tap an empty plot to plant a seed, and a Ready plot to harvest. Plant all and Harvest all do a block.</p>
      <p>An Uma who tends a block makes it grow faster (1.25 a night at Novice, 1 untended) and lifts its crops’ stars. She stays until you move her, and can’t take a job meanwhile.</p>
      <p>Her farming rank and talent (“Hand · B”) make it grow faster and better. Each night her block has a growing crop, she earns farming rank points.</p>
      <p>Harvests sometimes give seeds back. Each harvest raises the crop’s level, twice as fast from your own seeds, and each level lifts its stars.</p>
      <p>On a season’s last night, crops still growing that don’t grow next season wither. Ready crops wait.</p>
    </>
  )
}

function Fields({ save }: { save: SaveV3 }) {
  const leave = useLeave()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const talents = useTalents()
  const farming = useMemo(() => farmingTalents(talents.of), [talents.of])
  const blocks = useMemo(() => fieldsView(save, farming), [save, farming])
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const open = (key: string, value: string) => navigate(withParam(location, key, value), { state: { back: true } })
  const close = () => leave(withSheets(location))
  const run = (action: Promise<unknown>, done?: (value: unknown) => void) => {
    setError(null)
    setNote(null)
    action.then((value) => done?.(value)).catch((err: unknown) => setError(errorWords(err)))
  }
  const tap = (block: BlockId, plot: PlotView) => {
    if (plot.state === 'empty') open('plant', `${block}.${plot.index}`)
    else if (plot.state === 'growing') open('plot', `${block}.${plot.index}`)
    else run(harvestPlot(block, plot.index), (r) => setNote(receiptWords(r as HarvestReceipt, itemNameOf(plot.crop!))))
  }
  const plantKey = plotKey(params.get('plant'))
  const plotAt = plotKey(params.get('plot'))
  const tendKey = plotKey(params.get('tend'))
  return (
    <div className="absolute inset-0 flex flex-col" data-page="fields">
      <PlaceHeader title="Fields" onBack={() => leave('/')} about={<About />} words={{ back: 'Back to the farm', about: 'About the Fields' }} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-3 pb-24">
          {(note || error) && (
            <p role="status" className={`rounded-md px-3 py-2 text-[14px] font-semibold ${error ? 'bg-danger/10 text-danger' : 'bg-success/15 text-success'}`} data-fields-note>
              {error ?? note}
            </p>
          )}
          {blocks.map((block) => block.owned
            ? (
              <BlockCard
                key={block.id}
                save={save}
                block={block}
                master={view}
                talentOf={farming}
                onPlot={(plot) => tap(block.id, plot)}
                onPlantAll={() => open('plant', block.id)}
                onHarvestAll={() => run(harvestBlock(block.id), (r) => setNote(receiptWords(r as HarvestReceipt, null)))}
                onTend={() => open('tend', block.id)}
                onStop={() => run(tendBlock(block.id, null))}
              />
            )
            : <LockedCard key={block.id} block={block} onBuy={() => run(buyLand(block.id), () => setNote(`Block ${block.id} is yours`))} />)}
        </div>
      </main>
      {plantKey && <PlantSheet save={save} block={plantKey.block} index={plantKey.index} onClose={close} onError={setError} />}
      {plotAt && plotAt.index >= 0 && <PlotSheet save={save} block={plotAt.block} index={plotAt.index} master={view} onClose={close} />}
      {tendKey && <TenderPicker save={save} block={tendKey.block} master={view} talents={talents.table} onClose={close} onError={setError} />}
    </div>
  )
}

/** An owned block (decision 11): its name and growth, Plant all and Harvest all, its tender's row and its nine plots. */
function BlockCard({ save, block, master, talentOf, onPlot, onPlantAll, onHarvestAll, onTend, onStop }: {
  save: SaveV3
  block: OwnedBlock
  master: MasterView | null
  talentOf: FarmingTalentOf
  onPlot: (plot: PlotView) => void
  onPlantAll: () => void
  onHarvestAll: () => void
  onTend: () => void
  onStop: () => void
}) {
  const name = block.tender ? master?.album.get(block.tender)?.name ?? 'Uma' : null
  return (
    <section className="space-y-2 rounded-md border border-hairline bg-panel p-3" data-block={block.id} aria-label={`Block ${block.id}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold">Block {block.id}</h2>
          <p className="text-[12px] text-ink-soft" data-growth={block.growth}>{block.tender ? 'Tended' : 'Untended'} · {growthWords(block.growth)}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {block.empty > 0 && <Button variant="secondary" size="sm" onClick={onPlantAll} data-action="plant-all">Plant all</Button>}
          {block.ready > 0 && <Button size="sm" onClick={onHarvestAll} data-action="harvest-all">Harvest all · {block.ready}</Button>}
        </div>
      </div>
      <div className="flex min-h-12 items-center gap-2.5 rounded-md bg-sunken/60 px-2 py-1" data-tender={block.tender ?? ''}>
        {block.tender
          ? <FaceTile outfitId={block.tender} size={36} label={name ?? 'Uma'} round />
          : <span aria-hidden className="grid size-9 place-items-center rounded-full border border-dashed border-hairline-strong text-ink-faint">—</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{name ?? 'No tender'}</span>
          <span className="block text-[12px] text-ink-soft">{block.tender ? `${tenderRank(save, block.tender, talentOf)} · Farming` : 'Grows 1 a night, at ★1'}</span>
        </span>
        {block.tender && <Button variant="tertiary" size="sm" onClick={onStop} data-action="stop-tending">Stop</Button>}
        <Button variant="secondary" size="sm" onClick={onTend} data-action="tend">{block.tender ? 'Change' : 'Tend'}</Button>
      </div>
      <ol className="grid grid-cols-3 gap-2" aria-label={`Block ${block.id}'s plots`}>
        {block.plots.map((plot) => (
          <li key={plot.index}>
            <PlotButton plot={plot} onClick={() => onPlot(plot)} />
          </li>
        ))}
      </ol>
    </section>
  )
}

/** A plot: empty (a tap plants), growing (its crop and the nights left; a tap shows it) or Ready (a tap harvests). */
function PlotButton({ plot, onClick }: { plot: PlotView; onClick: () => void }) {
  const tone = plot.state === 'ready' ? 'border-success bg-success/10 ring-2 ring-success/40' : plot.state === 'growing' ? 'border-hairline bg-[#8a6a43]/15' : 'border-dashed border-hairline-strong bg-[#8a6a43]/8'
  return (
    <button type="button" onClick={onClick} aria-label={plot.label} data-plot={plot.index} data-state={plot.state}
      className={`relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-md border ${tone}`}>
      {plot.crop === null
        ? <span aria-hidden className="text-[26px] leading-none text-ink-faint">+</span>
        : <ItemIcon id={plot.crop} size={40} className={plot.state === 'growing' ? 'opacity-80' : ''} />}
      {plot.state === 'growing' && (
        <>
          {plot.withers
            ? <span className="text-[11px] font-semibold text-danger" data-withers>Withers tonight</span>
            : <span className="text-[11px] font-semibold text-ink-soft tabular-nums">{plot.nights === 1 ? '1 night' : `${plot.nights} nights`}</span>}
          <span aria-hidden className="absolute inset-x-2 bottom-1.5 h-1 overflow-hidden rounded-full bg-sunken">
            <span className="block h-full rounded-full bg-success/70" style={{ width: `${Math.round(plot.progress * 100)}%` }} />
          </span>
        </>
      )}
      {plot.state === 'ready' && <span className="rounded-full bg-success px-1.5 text-[11px] font-bold text-white">Ready</span>}
      {plot.own && <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-[#4f9a3c]" title="Own seeds" />}
    </button>
  )
}

/** A block not bought yet: its Farm Rank and cost, and Buy · 800g once the rank is reached. */
function LockedCard({ block, onBuy }: { block: LockedBlock; onBuy: () => void }) {
  return (
    <section className="flex min-h-16 items-center gap-3 rounded-md border border-dashed border-hairline-strong p-3" data-block={block.id} data-locked aria-label={`Block ${block.id}, locked`}>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[17px] font-bold text-ink-soft">Block {block.id}</h2>
        <p className="text-[12px] text-ink-soft">{block.open ? (block.short > 0 ? `Need ${goldWords(block.short)} more` : '9 plots') : `Opens at ${block.opens}`}</p>
      </div>
      <Button size="sm" disabled={!block.open || block.short > 0} onClick={onBuy} data-action="buy-block">Buy · {goldWords(block.cost)}</Button>
    </section>
  )
}

/** Planting (decisions 7 and 9): for a plot, each seed held that plants today, own seeds first; for Plant all, each crop
 * with all its seeds. With none, a way to the shop. */
function PlantSheet({ save, block, index, onClose, onError }: { save: SaveV3; block: BlockId; index: number; onClose: () => void; onError: (text: string) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const all = index < 0
  const options = seedOptions(save, all)
  const [busy, setBusy] = useState(false)
  const pick = (key: string) => {
    setBusy(true)
    const option = options.find((o) => o.key === key)!
    const done = all ? plantEvery(block, option.crop) : plantSeed(block, index, option.id)
    done.then(onClose).catch((err: unknown) => {
      onError(errorWords(err))
      onClose()
    }).finally(() => setBusy(false))
  }
  return (
    <Sheet open onClose={onClose} title={all ? `Plant all · Block ${block}` : `Plant · Block ${block}, plot ${index + 1}`} label="Plant">
      <div className="space-y-2 pb-1" data-plant={all ? block : `${block}.${index}`}>
        {options.length === 0 && (
          <div className="space-y-2 py-1">
            <p className="text-[15px] text-ink-soft" data-no-seeds>{noSeedsWords(save)}</p>
            <Button variant="secondary" className="w-full" onClick={() => navigate(withSheets(location, 'sheet', 'shop'), { replace: true, state: location.state })} data-action="shop">Shop</Button>
          </div>
        )}
        <ul className="divide-y divide-hairline rounded-md border border-hairline">
          {options.map((option) => (
            <li key={option.key}>
              <button type="button" disabled={busy} onClick={() => pick(option.key)} data-seed={option.key}
                className="flex min-h-14 w-full items-center gap-2.5 px-2.5 py-1.5 text-left disabled:opacity-55">
                <ItemIcon id={option.id} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{option.name}</span>
                  <span className="block text-[12px] text-ink-soft">{nightsWords(CROPS[option.crop].days)} untended · {cropFacts(option.crop).join(' · ')}</span>
                </span>
                <span className="shrink-0 text-[14px] font-semibold tabular-nums">× {option.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

/** A growing plot (decision 11's "shows"): its crop, the nights left, who tends it and where its seed came from. */
function PlotSheet({ save, block, index, master, onClose }: { save: SaveV3; block: BlockId; index: number; master: MasterView | null; onClose: () => void }) {
  const view = fieldsView(save).find((b): b is OwnedBlock => b.owned && b.id === block)
  const plot = view?.plots[index]
  if (!view || !plot || plot.crop === null) return null
  const tender = view.tender ? master?.album.get(view.tender)?.name ?? 'Uma' : null
  return (
    <Sheet open onClose={onClose} title={itemNameOf(plot.crop)} label="A plot">
      <div className="flex items-start gap-3 pb-2" data-plot-sheet={`${block}.${index}`}>
        <ItemIcon id={plot.crop} size={48} />
        <ul className="min-w-0 flex-1 space-y-1 text-[14px]">
          <li className="font-display text-[17px] font-semibold">{plot.state === 'ready' ? 'Ready' : plot.withers ? 'Withers tonight' : nightsWords(plot.nights)}</li>
          {plot.withers && <li className="text-danger">It doesn’t grow next season, and it won’t be Ready by morning.</li>}
          <li className="text-ink-soft">Block {block}, plot {index + 1}{plot.regrowing ? ' · regrowing' : ''}{plot.own ? ' · own seeds' : ''}</li>
          <li className="text-ink-soft">{tender ? `Tended by ${tender} · ${growthWords(view.growth)}` : `Untended · ${growthWords(view.growth)}`}</li>
          <li className="text-ink-soft">{cropFacts(plot.crop).join(' · ')}</li>
        </ul>
      </div>
    </Sheet>
  )
}

interface TenderRow extends LoopUmaRow {
  /** "Tends Block A", or her farming rank and talent. */
  note: string
  working: boolean
}

/** The tender's picker (F20; F21 decision 7): uma-kit's picker over the Umas home, each card her farming rank and talent
 * ("Hand · B") with her favourite line and best talent on her face, the filters and sorts of the roster, opening by
 * farming. A working Uma is shown and can't be picked; a tender of another block moves here. */
function TenderPicker({ save, block, master, talents, onClose, onError }: {
  save: SaveV3; block: BlockId; master: MasterView | null; talents: ReturnType<typeof useTalents>['table']; onClose: () => void; onError: (text: string) => void
}) {
  const rows = useMemo((): TenderRow[] => umaRows(save, save.dorm.home, master?.album ?? new Map(), talents, master?.roster ?? []).map((row) => {
    const tends = tendedBlock(save, row.id)
    return { ...row, note: tends ? `Tends Block ${tends}` : rankTalent(row, 'farming'), working: tends === null && isBusy(save, row.id) }
  }), [save, master, talents])
  const sorts = useMemo(() => pickerSorts<TenderRow>('farming'), [])
  const byFarming = useMemo(() => activityOrder('farming'), [])
  const current = save.fields.blocks.find((b) => b.id === block)?.tender
  return (
    <UmaPicker<TenderRow>
      open
      rows={rows}
      title={`Tend Block ${block}`}
      facets={UMA_FACETS}
      sorts={sorts}
      selectedIds={current ? [current] : []}
      order={(a, b) => Number(a.working) - Number(b.working) || byFarming(a, b)}
      disabled={(row) => (row.working ? 'Working' : null)}
      describe={(row) => row.note}
      renderBadges={umaBadges}
      words={{ level: 'Farming rank' }}
      onPick={(ids) => {
        const id = ids[0]
        if (id && id !== current) tendBlock(block, id).catch((err: unknown) => onError(errorWords(err)))
      }}
      onClose={onClose}
    />
  )
}
