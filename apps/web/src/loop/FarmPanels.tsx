// The farm map's side panels, one action a tap: a tile's (clear, till, plant, water, harvest; cut grass on weeds for the
// silo), the woods' edge (forage or chop at an area), the pond's edge (fish a spot) and a built station's (start a load). Each says what the action
// brought, and the day's actions left. Part of the farm map's chunk.
import {
  actionsLeft, CROPS, cropBaseGrade, dayActions, FULL_HAULS, goodName, grassLock, hasGrass, itemNameOf, receiptItems, SILO_ROOM, siloStands, tileAt, type FarmSave, type GatherPlace,
  type HarvestReceipt,
  type StationId,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { chopAt, clearAt, fishAt, forageAt, grassAt, harvestAt, loadAt, plantAt, removeOrchardAt, tillAt, upgradeAt, waterAt } from './actions'
import { reachRows, stationView, thinWords, tileView, tileWhere, type TileAction } from './farm-view'
import { actionWords, plural } from './words'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** Stock keys in words: "Pine Log, Shiitake". */
export const goodsWords = (keys: readonly string[]): string => keys.map((key) => goodName(key.slice(0, key.lastIndexOf('@')))).join(', ')
/** A harvest in words: "+2 Potato · 1 seed back". */
function harvestWords(r: HarvestReceipt): string {
  const crops = r.lots ? r.lots.map((lot) => `+1 ${goodName(lot.id)}`).join(' · ') : `+${receiptItems(r)} ${itemNameOf(r.crop)}`
  return `${crops}${r.seeds > 0 ? ' · 1 seed back' : ''}`
}

/** One action at a time: what it brought, or why it was refused. */
export function useAct(key: string | number) {
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setNote(null)
    setError(null)
  }, [key])
  const run = (action: Promise<string | null>) => {
    setBusy(true)
    setError(null)
    action.then((words) => setNote(words), (err: unknown) => {
      setNote(null)
      setError(errorWords(err))
    }).finally(() => setBusy(false))
  }
  return { note, error, busy, run }
}

/** The day's actions left, at a panel's foot. */
export function ActionsLeft({ save }: { save: FarmSave }) {
  const left = actionsLeft(save)
  return <p className="text-[12px] text-ink-faint" data-left={left}>{left === 0 ? 'No actions left today.' : `${actionWords(left)} left of ${dayActions(save)}`}</p>
}

export function Notes({ note, error }: { note: string | null; error: string | null }) {
  return (
    <>
      {note && <p role="status" className="text-[13px] font-semibold text-success" data-note>{note}</p>}
      {error && <p role="status" className="text-[13px] text-danger" data-error>{error}</p>}
    </>
  )
}

const ACTION_WORDS: Readonly<Record<Exclude<TileAction['kind'], 'plant'>, string>> = { clear: 'Clear', till: 'Till', water: 'Water', harvest: 'Harvest' }

/** A tile's panel: where it is, what's on it, and the action it takes next. `index` is its field index. */
export function TilePanel({ save, index }: { save: FarmSave; index: number }) {
  const location = useLocation()
  const view = tileView(save, index)
  const { note, error, busy, run } = useAct(index)
  const out = actionsLeft(save) === 0
  const doIt = (a: TileAction) => {
    switch (a.kind) {
      case 'clear': return run(clearAt(index).then((found) => (found ? `Cleared · +1 ${itemNameOf(found)}` : 'Cleared')))
      case 'till': return run(tillAt(index).then(() => 'Tilled'))
      case 'plant': return run(plantAt(index, a.seed).then(() => `Planted ${a.name}`))
      case 'water': return run(waterAt(index).then(() => 'Watered: it grows tonight'))
      case 'harvest': return run(harvestAt(index).then(harvestWords))
    }
  }
  const plants = view.actions.filter((a): a is Extract<TileAction, { kind: 'plant' }> => a.kind === 'plant')
  const single = view.actions.find((a) => a.kind !== 'plant')
  const tile = tileAt(save, index)
  const [confirmRemove, setConfirmRemove] = useState(false)
  useEffect(() => setConfirmRemove(false), [index])
  const tilledEmpty = tile.ground === 'tilled' && tile.crop === null
  return (
    <div className="space-y-2.5 p-4" data-tile-panel={index}>
      <p className="text-[12px] text-ink-faint" data-tile-where>{tileWhere(save, view)}</p>
      <p className="text-[15px]" data-tile-line>{view.line}</p>
      {view.withers && <p className="text-[13px] font-semibold text-danger" data-withers>Withers tonight: it won’t ripen before the season ends.</p>}
      <Notes note={note} error={error} />
      {single && (
        <Button className="w-full" disabled={busy || out} onClick={() => doIt(single)} data-action={single.kind}>
          {single.kind === 'harvest' && tile.crop ? `Harvest G${tile.grade ?? cropBaseGrade(tile.crop)}` : ACTION_WORDS[single.kind]} · 1 action
        </Button>
      )}
      {hasGrass(save, index) && siloStands(save) && (
        <Button variant="secondary" className="w-full" disabled={busy || out || grassLock(save) !== null} data-action="grass"
          onClick={() => run(grassAt(index).then((feed) => `Cut grass · +${feed} feed in the silo (${save.ranch.silo + feed} of ${SILO_ROOM})`))}>
          {grassLock(save) ?? 'Cut grass for the silo · 1 action'}
        </Button>
      )}
      {plants.length > 0 && (
        <ul className="space-y-1.5" aria-label="Seeds to plant">
          {plants.map((a) => (
            <li key={a.seed} className="flex min-h-12 items-center gap-2.5 rounded-sm border border-hairline bg-panel px-2 py-1" data-seed={a.seed}>
              <ItemIcon id={a.seed} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{a.name} <span className="font-normal text-ink-soft">× {a.count}</span></span>
                <span className={`block text-[12px] ${a.late ? 'text-danger' : 'text-ink-soft'}`}>{a.late ? 'Won’t ripen this season'
                  : a.bears ? `${plural(a.stages, 'watered night')} to establish · bears ${a.bears}` : `${plural(a.stages, 'watered night')} to ripe`}</span>
              </span>
              <Button size="sm" disabled={busy || out} onClick={() => doIt(a)} data-action="plant">Plant</Button>
            </li>
          ))}
        </ul>
      )}
      {tilledEmpty && plants.length === 0 && (
        <Link to={withParam(location, 'sheet', 'shop')} state={{ back: true }} className="flex min-h-11 items-center justify-center rounded-md border border-hairline-strong text-[14px] font-semibold" data-action="shop">
          Seeds at the shop, in town
        </Link>
      )}
      {tile.crop && CROPS[tile.crop].woody && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy || out} data-action={confirmRemove ? 'confirm-remove-orchard' : 'remove-orchard'}
            onClick={() => {
              if (!confirmRemove) setConfirmRemove(true)
              else run(removeOrchardAt(index).then(() => { setConfirmRemove(false); return 'Removed · soil ready to plant' }))
            }}>
            {confirmRemove ? `Remove ${itemNameOf(tile.crop)} permanently · 1 action` : 'Remove orchard plant'}
          </Button>
          {confirmRemove && <Button variant="secondary" onClick={() => setConfirmRemove(false)}>Cancel</Button>}
        </div>
      )}
      <ActionsLeft save={save} />
    </div>
  )
}

/** The woods' edge or the pond's: each area or spot in the farmer's reach with its season's finds, and Forage, Chop or
 * Fish, one action each. */
export function GatherPanel({ save, place }: { save: FarmSave; place: GatherPlace }) {
  const rows = reachRows(save, place)
  const { note, error, busy, run } = useAct(place)
  const out = actionsLeft(save) === 0
  return (
    <div className="space-y-2.5 p-4" data-gather={place}>
      <Notes note={note} error={error} />
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.id} className={`space-y-1.5 rounded-sm border border-hairline bg-panel px-2.5 py-2 ${row.lock ? 'opacity-60' : ''}`} data-where={row.id}>
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{row.name}</span>
              {row.lock && <span className="shrink-0 text-[12px] text-ink-soft">{row.lock.replace(/\.$/, '')}</span>}
              {!row.lock && <ThinMark hauls={row.hauls} />}
            </div>
            <div className="flex flex-wrap gap-1" aria-label={`Finds: ${row.finds.map((id) => itemNameOf(id)).join(', ')}`}>
              {row.finds.map((id) => <ItemIcon key={id} id={id} size={24} />)}
            </div>
            {!row.lock && (
              <div className="flex gap-1.5">
                {place === 'forest' ? (
                  <>
                    <Button size="sm" className="flex-1" disabled={busy || out} data-action="forage"
                      onClick={() => run(forageAt(row.id).then((haul) => `Foraged · +${goodsWords(haul.items)}`))}>Forage · 1</Button>
                    <Button size="sm" variant="secondary" className="flex-1" disabled={busy || out} data-action="chop"
                      onClick={() => run(chopAt(row.id).then((haul) => `Chopped · +${goodsWords(haul.items)}`))}>Chop · 1</Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1" disabled={busy || out} data-action="fish"
                    onClick={() => run(fishAt(row.id).then((c) => (c ? `${itemNameOf(c.fish)} ★${c.stars} · ${c.cm} cm${c.record ? ', a record' : ''}` : 'Nothing bit: it’s thin here today')))}>Fish · 1</Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <ActionsLeft save={save} />
    </div>
  )
}

/** An area's, a spot's or a dig's day: its full hauls left once one is taken, then "Thin · half hauls". */
export function ThinMark({ hauls, noun }: { hauls: number; noun?: string }) {
  const words = thinWords(hauls, noun)
  if (!words) return null
  const thin = hauls >= FULL_HAULS
  return <span className={`shrink-0 text-[12px] ${thin ? 'rounded-full bg-warning/15 px-1.5 font-semibold text-warning' : 'text-ink-soft'}`} data-thin={thin ? 'thin' : hauls}>{words}</span>
}

/** A built station's panel: its level and loads a day, today's loads, ready tomorrow; what it can take now while it takes
 * more, each a load of up to eight for one action; and its next level. */
export function StationPanel({ save, station }: { save: FarmSave; station: StationId }) {
  const view = stationView(save, station)
  const { note, error, busy, run } = useAct(station)
  const out = actionsLeft(save) === 0
  const words = (item: string) => {
    const at = item.lastIndexOf('@')
    return `${goodName(item.slice(0, at))} ★${item.slice(at + 1)}`
  }
  const full = view.loads.length >= view.perDay
  return (
    <div className="space-y-2.5 p-4" data-station={station} data-level={view.level}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-[18px] font-bold" data-station-level>Level {view.level}</p>
        <p className="text-[13px] text-ink-soft" data-loads={`${view.loads.length}/${view.perDay}`}>{view.loads.length} of {plural(view.perDay, 'load')} today</p>
      </div>
      <Notes note={note} error={error} />
      {view.loads.map((load, i) => (
        <div key={i} className="flex min-h-12 items-center gap-2.5 rounded-sm border border-hairline bg-panel px-2.5 py-1.5" data-load={load.item}>
          <ItemIcon id={load.item.slice(0, load.item.lastIndexOf('@'))} size={32} />
          <span className="min-w-0 flex-1 text-[14px]"><b>{words(load.item)} × {load.count}</b><span className="block text-[12px] text-ink-soft">Ready tomorrow morning</span></span>
        </div>
      ))}
      {!full && view.options.length === 0 && <p className="text-[14px] text-ink-soft" data-station-empty>Nothing to process yet: bring its goods home first.</p>}
      {view.options.length > 0 && (
        <ul className="space-y-1.5" aria-label="What it can make">
          {view.options.map((o) => (
            <li key={o.item} className="flex min-h-12 items-center gap-2.5 rounded-sm border border-hairline bg-panel px-2 py-1" data-option={o.item}>
              <ItemIcon id={o.output} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{words(o.item)}</span>
                <span className="block text-[12px] text-ink-soft">From {itemNameOf(o.input)} · {o.held} held</span>
              </span>
              <Button size="sm" disabled={busy || out} data-action="load"
                onClick={() => run(loadAt(station, o.item, o.most).then(() => `Loaded ${o.most} · ready tomorrow`))}>Load {o.most}</Button>
            </li>
          ))}
        </ul>
      )}
      {view.next && (
        <div className="flex min-h-12 items-center gap-2.5 rounded-sm border border-hairline bg-panel px-2.5 py-1.5" data-next-level={view.next.level}>
          <span className="min-w-0 flex-1 text-[14px]">
            <b>Level {view.next.level} · {plural(view.next.loads, 'load')} a day</b>
            <span className="block text-[12px] text-ink-soft">{view.next.lock ?? `${view.next.cost.toLocaleString('en-US')}g · ready tomorrow`}</span>
          </span>
          {view.next.cost > 0 && (
            <Button size="sm" variant="secondary" disabled={busy || view.next.lock !== null} data-action="upgrade"
              onClick={() => run(upgradeAt(station).then(() => `Level ${view.next!.level} tomorrow`))}>Upgrade · {view.next.cost.toLocaleString('en-US')}g</Button>
          )}
        </div>
      )}
      <ActionsLeft save={save} />
    </div>
  )
}
