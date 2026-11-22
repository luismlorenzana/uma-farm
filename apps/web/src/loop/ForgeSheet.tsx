import {
  ANNIVERSARY_LOOK_POINTS, benchOpen, farmPlace, forgeAssistants, forgeMaterialRows, formalLooks, giveHeirloom,
  goodName, goodOf, greaterLoveOf, HEIRLOOM_IDS, HEIRLOOMS, heirloomLock, heirloomOf, isBuildPlace, nextToolTier,
  orderHeirloom, orderTool, parseStockKey, placeBuilt, practiceForging, TOOL_IDS, TOOL_NAMES, TOOL_RECIPES,
  toolEffect, toolOrderLock, toolTierName, trackHeirloom, visitBeats, visitPortraitKey, type FarmSave, type ForgeMaterial,
  type HeirloomId, type StationId, type ToolId, type UpgradeTier,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { forecastCrewOn } from '../book/work-plan'
import { SceneBust, SceneLookProvider } from '../dialogue/Bust'
import { usePortraitsState } from '../dialogue/portraits'
import { JewelMark } from '../items/JewelMark'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { BuildCard } from './BuildCard'
import { Tempering } from './Tempering'
import { changeHomestead } from './homestead-actions'
import { byRelationship } from './relationship-order'
import { useTalents } from './talents'
import { shortDate } from './words'

const SELECT = 'min-h-11 max-w-full rounded-md border border-hairline bg-panel px-2'
const LINK = 'inline-flex min-h-11 items-center font-semibold text-accent-strong'

export default function ForgeSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const [params, setParams] = useSearchParams()
  const jewelTab = params.get('tab') === 'heirlooms'
  const switchTab = (heirlooms: boolean) => {
    const next = new URLSearchParams(params)
    if (heirlooms) next.set('tab', 'heirlooms')
    else next.delete('tab')
    setParams(next, { replace: true })
  }
  if (!save) return null
  return <Sheet open size="wide" title="Forge workshop" label="Forge workshop" onClose={() => leave(withParam(location, 'sheet', null))}>
    <div className="space-y-3 pb-3" data-forge-workshop>
      <nav className="flex flex-wrap items-center gap-2">
        <Button variant={!jewelTab ? 'primary' : 'secondary'} onClick={() => switchTab(false)} aria-pressed={!jewelTab}>Tools</Button>
        <Button variant={jewelTab ? 'primary' : 'secondary'} onClick={() => switchTab(true)} aria-pressed={jewelTab}>Heirlooms</Button>
        {benchOpen(save) ? <Link className={LINK} to="/?sheet=bench" state={{ back: true }}>Ring Bench ›</Link> : <span className="text-ink-soft">Ring Bench · After Romance 8</span>}
      </nav>
      {jewelTab || placeBuilt(save, 'forge')
        ? <Workshop key={`${jewelTab}:${params.get('recipient')}:${params.get('piece')}:${params.get('tool')}`} save={save} jewels={jewelTab}
          initialRecipient={params.get('recipient')} initialPiece={params.get('piece')} initialTool={params.get('tool')} />
        : <Restore save={save} />}
    </div>
  </Sheet>
}

function Restore({ save }: { save: FarmSave }) {
  const [message, setMessage] = useState('')
  const place = farmPlace('forge')
  if (!isBuildPlace(place)) return null
  return <div className="space-y-2">
    <p>Restore the workshop to upgrade the shared tools you and the Umas use.</p>
    <BuildCard save={save} place={place} say={setMessage} />
    {message && <p role="status">{message}</p>}
  </div>
}

function Workshop({ save, jewels, initialRecipient, initialPiece, initialTool }: {
  save: FarmSave; jewels: boolean; initialRecipient: string | null; initialPiece: string | null; initialTool: string | null
}) {
  const pack = useStory()
  const master = useMaster()
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const spouses = Object.keys(save.love).filter(id => save.love[id]?.stage === 'spouse').sort(byRelationship(save))
  const [recipient, chooseRecipient] = useState(() => initialRecipient && spouses.includes(initialRecipient) ? initialRecipient : spouses[0] ?? '')
  const [piece, choosePiece] = useState<HeirloomId>(() => HEIRLOOM_IDS.find(id => id === initialPiece) ?? 'earrings')
  const [tool, chooseTool] = useState<ToolId>(() => TOOL_IDS.find(id => id === initialTool) ?? 'watering-can')
  const [helper, chooseHelper] = useState('')
  const [useReserved, setReserved] = useState(false)
  const [practiceTier, setPracticeTier] = useState<UpgradeTier>(2)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const run = async (rule: (save: FarmSave) => FarmSave, success: string) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setMessage(null)
    setError(false)
    try { await changeHomestead(rule); setMessage(success); chooseHelper(''); setReserved(false) }
    catch (err) { setError(true); setMessage(err instanceof Error ? err.message : 'Try again.') }
    finally { setBusy(false); inFlight.current = false }
  }
  const assistants = forgeAssistants(save, pack)
  const assistant = assistants.includes(helper) ? helper : undefined
  const [artReady, artLoading] = useHeirloomArt(jewels ? recipient : '', piece)
  const tier = nextToolTier(save.tools[tool])
  const recipe = jewels ? HEIRLOOMS[piece] : tier && TOOL_RECIPES[tier]
  const order = jewels ? heirloomOf(save, recipient, piece) : undefined
  const lock = jewels ? heirloomLock(save, recipient, piece, artReady, useReserved) : toolOrderLock(save, tool, useReserved)
  const anyReserved = recipe && forgeMaterialRows(save, recipe.materials).some(row => row.free < row.count && row.held >= row.count)
  const tracked = save.forge?.tracked?.recipient === recipient && save.forge.tracked.piece === piece
  const canPractice = Object.values(save.tools).some(tier => tier > 1)
  const current = save.forge?.tool
  const installed = save.forge?.installed.find(order => order.tool === tool)
  const ready = (day: number) => shortDate(day, save.calendar)
  return <div className="space-y-3">
    {!jewels && current && <div className="rounded-md border border-hairline bg-panel p-2" data-tool-order={current.tool}>
      <strong>{toolTierName(current.tier)} {TOOL_NAMES[current.tool]} · Ready {ready(current.due)}</strong>
      {current.assistant && <p className="text-ink-soft">Prepared with {nameOf(current.assistant)}</p>}
      <Tempering key={current.ordered} order={current} />
    </div>}
    {jewels && <div className="space-y-2">
      <label className="flex flex-wrap items-center gap-2">For
        <select aria-label="Heirloom recipient" className={SELECT} value={recipient} onChange={event => { chooseRecipient(event.target.value); setReserved(false) }}>
          {!spouses.length && <option value="">Marry to commission</option>}
          {spouses.map(id => <option key={id} value={id}>{nameOf(id)}</option>)}
        </select>
      </label>
      {save.forge?.heirlooms.filter(row => !row.ready).map(row => <p key={`${row.recipient}:${row.piece}`} className="text-ink-soft">
        {nameOf(row.recipient)} · {HEIRLOOMS[row.piece].name} · Ready {ready(row.due)}
      </p>)}
    </div>}
    {assistants.length > 0 && (!jewels || !order) && <div className="space-y-1">
      <label className="flex flex-wrap items-center gap-2">Morning assistant
        <select className={SELECT} aria-label="Morning assistant" value={assistant ?? ''} onChange={event => chooseHelper(event.target.value)}>
          <option value="">Work solo</option>{assistants.map(id => <option key={id} value={id}>{nameOf(id)} · 1 crew action</option>)}
        </select>
      </label>
      {assistant && <AssistantImpact save={save} id={assistant} />}
    </div>}
    <div className="grid grid-cols-1 gap-3 min-[590px]:grid-cols-[minmax(130px,1fr)_minmax(0,2fr)]">
      <div className="grid grid-cols-2 content-start gap-1 min-[590px]:grid-cols-1" aria-label={jewels ? 'Heirlooms' : 'Shared tools'}>
        {jewels ? HEIRLOOM_IDS.map(id => <Button key={id} variant={piece === id ? 'primary' : 'secondary'}
          aria-pressed={piece === id} onClick={() => { choosePiece(id); setReserved(false) }}>{HEIRLOOMS[id].name}</Button>)
          : TOOL_IDS.map(id => <Button key={id} variant={tool === id ? 'primary' : 'secondary'}
            aria-pressed={tool === id} onClick={() => { chooseTool(id); setReserved(false) }}>{TOOL_NAMES[id]} · {toolTierName(save.tools[id])}</Button>)}
      </div>
      <div className="min-w-0 space-y-2" data-forge-selection={jewels ? piece : tool}>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">{jewels && <JewelMark piece={piece} />}{jewels ? HEIRLOOMS[piece].name : TOOL_NAMES[tool]}</h3>
        {jewels && artReady && <details className="rounded border border-hairline px-2">
          <summary className="flex min-h-11 items-center font-semibold">Preview her look</summary>
          <div className="flex h-36 justify-center">
            <SceneLookProvider value={{ day: save.calendar.day, leads: [recipient], own: 'wedding-night', portrait: visitPortraitKey('anniversary', HEIRLOOMS[piece].look) }}>
              <SceneBust who={recipient} name={nameOf(recipient)} size={144} emote="neutral" />
            </SceneLookProvider>
          </div>
        </details>}
        {jewels ? <p>Formal look {HEIRLOOMS[piece].look} · {greaterLoveOf(save, recipient).points}/{ANNIVERSARY_LOOK_POINTS[HEIRLOOMS[piece].look - 1]} Greater Love</p>
          : <><p>{toolTierName(save.tools[tool])}{tier ? ` → ${toolTierName(tier)}` : ''} · {toolEffect(tool, tier ?? save.tools[tool])}</p>
            {installed?.finish === 'stamped' && <p className="text-ink-soft">Maker’s stamp · {ready(installed.due)}</p>}
            {tier && <ToolForecast save={save} tool={tool} tier={tier} />}</>}
        {order ? <div className="space-y-2">
          <p>{order.gifted ? formalLooks(save, recipient).includes(HEIRLOOMS[piece].look) ? 'Look unlocked' : 'Gifted · Needs Greater Love'
            : order.ready ? 'Ready to give' : `In progress · Ready ${ready(order.due)}`}</p>
          {order.assistant && <p className="text-ink-soft">Prepared with {nameOf(order.assistant)}</p>}
          {order.ready && !order.gifted && <Button disabled={busy} onClick={() => void run(s => giveHeirloom(s, recipient, piece), 'Gifted.')}>Give to {nameOf(recipient)}</Button>}
        </div> : recipe && <>
          <Materials save={save} materials={recipe.materials} />
          <p className="font-semibold">{recipe.gold.toLocaleString()}g · 1 action · Ready {ready(save.calendar.day + recipe.days)}</p>
          {anyReserved && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={useReserved}
            onChange={event => setReserved(event.target.checked)} /> Use protected stock for this order</label>}
          {jewels && recipient && <Button variant="secondary" disabled={busy} onClick={() => void run(
            s => trackHeirloom(s, recipient, piece), tracked ? 'Tracking cleared.' : 'Added to What Next?',
          )}>{tracked ? 'Stop tracking' : 'Track materials'}</Button>}
          {lock && <p className="text-ink-soft">{jewels && artLoading && lock === 'Artwork coming.' ? 'Checking wardrobe art…' : lock}</p>}
          <Button disabled={busy || lock !== null} onClick={() => void run(
            s => jewels ? orderHeirloom(s, recipient, piece, artReady, pack, assistant, useReserved)
              : orderTool(s, tool, pack, assistant, useReserved), 'Order placed.',
          )}>{jewels ? 'Commission heirloom' : 'Place tool order'}</Button>
        </>}
        {message && <p role={error ? 'alert' : 'status'} className={error ? 'text-danger' : 'text-success'}>{message}</p>}
      </div>
    </div>
    {!jewels && assistant && canPractice && <details className="rounded-md border border-hairline px-2">
      <summary className="flex min-h-11 items-center font-semibold">Practice fitting</summary>
      <div className="space-y-2 pb-2">
        <label className="flex flex-wrap items-center gap-2">Tier
          <select className={SELECT} value={practiceTier} onChange={event => setPracticeTier(Number(event.target.value) as UpgradeTier)}>
            {([2, 3, 4, 5] as const).filter(tier => Object.values(save.tools).some(value => value >= tier)).map(tier =>
              <option key={tier} value={tier}>{toolTierName(tier)}</option>)}
          </select>
        </label>
        <p>{practiceTier === 2 ? '2 Pine Planks' : `1 Pine Plank and 1 ${goodName(TOOL_RECIPES[practiceTier].materials[0]!.id)}`} · 1 action from {nameOf(assistant)}</p>
        <Button variant="secondary" disabled={busy} onClick={() => void run(s => practiceForging(s, practiceTier, assistant, pack), 'Practice booked.')}>Book practice</Button>
      </div>
    </details>}
  </div>
}

function useHeirloomArt(id: string, piece: HeirloomId): [ready: boolean, loading: boolean] {
  const portraits = usePortraitsState(id || null)
  const pack = useStory()
  const look = HEIRLOOMS[piece].look
  const key = visitPortraitKey('anniversary', look)
  const ready = !!id && !!pack && !!portraits && portraits !== 'loading' && !!portraits.bases[key]
    && (['birthday', 'anniversary'] as const).every(kind =>
      visitBeats(pack, { day: 1, kind, who: [id], looks: [look] }).every(beat => beat.portrait === key || beat.outfit === key))
  return [ready, portraits === 'loading']
}

function Materials({ save, materials }: { save: FarmSave; materials: readonly ForgeMaterial[] }) {
  return <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="Exact materials">
    {forgeMaterialRows(save, materials).map(row => {
      const material = goodOf(row.id)!
      const station: StationId = material.family === 'woods' ? 'sawmill' : material.family === 'ores' ? 'smelter' : 'cutter'
      const dig = station === 'smelter' ? 'mine' : 'quarry'
      const floor = (material.grade - 1) * 3 + 1
      const queued = save.loads[station]?.reduce((sum, load) => sum + (parseStockKey(load.item)?.id === row.id ? load.count : 0), 0) ?? 0
      return <li key={row.id} className="px-2 py-1">
        <p>{goodName(row.id)} · G{material.grade} <strong>{row.free}/{row.count}</strong>
          {row.held > row.free && <span className="text-ink-soft"> · {row.held - row.free} protected</span>}
          {queued > 0 && <span className="text-ink-soft"> · {queued} refining</span>}</p>
        {row.free < row.count && <div className="flex flex-wrap gap-x-3">
          <Link className={LINK} to={`/?peek=${station}&output=${row.id}&quantity=${row.count}`}>Set {farmPlace(station)?.name} target ›</Link>
          {station !== 'sawmill' && <Link className={LINK} to={`/?peek=${dig}&floor=${floor}`}>{farmPlace(dig)?.name} · Floor {floor} ›</Link>}
        </div>}
      </li>
    })}
  </ul>
}

function AssistantImpact({ save, id }: { save: FarmSave; id: string }) {
  const pack = useStory()
  const talents = useTalents().of
  const gap = useMemo(() => {
    const before = forecastCrewOn(save, save.calendar.day, pack, talents)
    const after = forecastCrewOn({ ...save, today: { ...save.today, forgeHelper: { id, tier: 2 } } }, save.calendar.day, pack, talents)
    const missing = (result: typeof before) => result.needs.reduce((sum, need) => sum + need.count, 0)
    const work = (result: typeof before) => result.lines.reduce((sum, line) => sum + line.spent - (line.forge ?? 0), 0)
    return { loss: work(before) - work(after), gaps: missing(after) - missing(before) }
  }, [save, id, pack, talents])
  return <p className="text-ink-soft">Reserves one Morning action. {gap.loss > 0 ? `${gap.loss} fewer regular crew actions forecast.` : 'Crew orders still fit.'}
    {gap.gaps > 0 && ` ${gap.gaps} more work units open.`}</p>
}

function ToolForecast({ save, tool, tier }: { save: FarmSave; tool: ToolId; tier: UpgradeTier }) {
  const pack = useStory()
  const talents = useTalents().of
  const due = save.calendar.day + TOOL_RECIPES[tier].days
  const forecast = useMemo(() => {
    const baseline = forecastCrewOn(save, due, pack, talents)
    const upgraded = forecastCrewOn({ ...save, forge: save.forge ? { ...save.forge, tool: undefined } : undefined,
      tools: { ...save.tools, [tool]: tier } }, due, pack, talents)
    const stats = (shift: typeof baseline) => ({
      crew: shift.lines.length,
      actions: shift.lines.reduce((sum, row) => sum + row.spent, 0),
      goods: shift.lines.reduce((sum, row) => sum + row.items, 0),
      gaps: shift.needs.reduce((sum, row) => sum + row.count, 0),
    })
    return { before: stats(baseline), after: stats(upgraded) }
  }, [save, due, pack, talents, tool, tier])
  return <div className="space-y-1 rounded-md border border-hairline bg-panel p-2 text-sm">
    <p className="font-semibold">{shortDate(due, save.calendar)} · Crew preview</p>
    <p className="text-ink-soft">Based on {shortDate(save.calendar.day, save.calendar)} crops, stock and orders.</p>
    {forecast.before.crew === 0 ? <p>No crew scheduled. {toolEffect(tool, tier)}.</p>
      : <p>{forecast.before.actions} → {forecast.after.actions} crew actions · {forecast.before.gaps} → {forecast.after.gaps} work units open · {forecast.before.goods} → {forecast.after.goods} goods</p>}
  </div>
}
