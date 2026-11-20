import {
  dateOf, dishesHeld, dishName, exactHeld, farmRankOf, goodName, goodOf, handsWorking, ingredientSources, knownRestaurantRecipes,
  knowsRestaurantRecipe, MAX_TRAY, MENU_RECIPES, missingRecipeProofs, nextRestaurantStage, parseStockKey,
  portionsLeft, restaurantGrade, restaurantStage, RESTAURANT_RECIPES, RESTAURANT_STAGES, serverLock, shiftBlock,
  shiftLength, shiftTime, ticketOpen, tierByGrade, type FarmSave, type RestaurantResult, type RestaurantShift, type StockPortions,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { goldWords } from './goods-view'
import { closeRestaurantShift, openRestaurantShift, plateRestaurantTicket } from './restaurant-actions'
import { plural } from './words'

const KITCHEN = '/?sheet=kitchen'
const PICK = 'min-h-11 min-w-0 rounded-md border border-hairline bg-panel px-2 text-[14px]'
const LINK = 'flex min-h-11 items-center font-semibold text-accent'
const dishAt = (key: string) => parseStockKey(key)!.id

export default function RestaurantSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const [tab, setTab] = useState<'shift' | 'recipes'>(() => new URLSearchParams(location.search).has('recipes') ? 'recipes' : 'shift')
  const [note, setNote] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const running = useRef(false)
  const act = async (run: () => Promise<void>) => {
    if (running.current) return
    running.current = true
    setPending(true)
    setNote(null)
    try {
      await run()
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Try again.')
    } finally {
      running.current = false
      setPending(false)
    }
  }
  if (!save) return null
  const shift = save.workshops.restaurant?.shift
  const close = () => leave(withParam({ ...location, search: withParamSearch(location.search) }, 'sheet', null))
  return (
    <Sheet open onClose={shift ? () => void act(() => closeRestaurantShift(shift.started)) : close}
      size="wide" title="Restaurant" label="The Restaurant">
      {shift ? (
        <Service shift={shift} locked={pending} onPlate={(index, dish) => void act(() => plateRestaurantTicket(shift.started, index, dish))}
          onEnd={() => void act(() => closeRestaurantShift(shift.started))} />
      ) : (
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-2 gap-1 rounded-md bg-sunken p-1">
              {(['shift', 'recipes'] as const).map((name) => (
                <button key={name} type="button" aria-pressed={tab === name} onClick={() => setTab(name)}
                  className={`min-h-11 rounded text-[14px] font-semibold ${tab === name ? 'bg-panel text-ink' : 'text-ink-soft'}`}>
                  {name === 'shift' ? 'Shift' : 'Recipes'}
                </button>
              ))}
            </div>
            <GuideButton topic="restaurant" title="Restaurant" label="How the Restaurant works">
              <p>Stock cooked dishes for a shift. Tap an open ticket, then its matching plate. A wrong plate costs time.</p>
              <p>Clear a stage to open 15 recipes. Produce their exact ingredients to learn them, then cook them at the Kitchen.</p>
              <p>Sell the dishes, use them in another recipe, or save them for meals. One shift costs one action. An Uma serving spends one work action.</p>
            </GuideButton>
          </div>
          {tab === 'recipes' ? <RecipeBook save={save} /> : <ShiftSetup save={save} locked={pending}
            onStart={(stage, tray, server) => void act(() => openRestaurantShift(stage, tray, server))} onRecipes={() => setTab('recipes')} />}
        </div>
      )}
      {note && <p role="status" className="py-1 text-[13px] text-danger">{note}</p>}
    </Sheet>
  )
}

function withParamSearch(search: string) {
  const params = new URLSearchParams(search)
  params.delete('recipes')
  const rest = params.toString()
  return rest ? `?${rest}` : ''
}

function ShiftResult({ result, onRecipes }: { result: RestaurantResult; onRecipes: () => void }) {
  return (
    <section data-shift-result className="grid grid-cols-[1fr_auto] items-center gap-1 rounded-md border border-hairline bg-panel p-2.5">
      <div>
        <p className="text-[15px] font-semibold">{restaurantStage(result.stage)!.name} · {result.cleared ? 'Cleared' : 'Shift ended'}</p>
        <p className="text-[13px] text-ink-soft">
          {result.covers}/{restaurantStage(result.stage)!.tickets} covers · {tierByGrade(result.grade).name} · {goldWords(result.sales)} sales · {goldWords(result.tips)} tips
          {result.opened && ` · Page opened · ${plural(result.learned, 'recipe')} learned`}
        </p>
      </div>
      <button type="button" className={LINK} onClick={onRecipes}>Recipes ›</button>
    </section>
  )
}

function ShiftSetup({ save, locked, onStart, onRecipes }: {
  save: FarmSave
  locked: boolean
  onStart: (stage: number, tray: StockPortions[], server: string | null) => void
  onRecipes: () => void
}) {
  const story = useStory()
  const master = useMaster()
  const next = nextRestaurantStage(save)
  const [stage, setStage] = useState(next)
  const [server, setServer] = useState<string | null>(null)
  const [pick, setPick] = useState('')
  const [chosen, setChosen] = useState<StockPortions[]>([])
  const rule = restaurantStage(stage)!
  const held = dishesHeld(save)
  const total = chosen.reduce((sum, line) => sum + line.count, 0)
  const types = new Set(chosen.map((line) => dishAt(line.key)))
  const selectable = held.filter((line) => types.has(line.id) || types.size < MENU_RECIPES)
  const lot = selectable.find((line) => line.key === pick) ?? selectable[0]
  const amount = (key: string) => chosen.find((line) => line.key === key)?.count ?? 0
  const change = (key: string, by: number) => setChosen((tray) => {
    const count = (tray.find((line) => line.key === key)?.count ?? 0) + by
    return [...tray.filter((line) => line.key !== key), ...(count > 0 ? [{ key, count }] : [])]
  })
  const openTypes = Math.max(0, rule.types - types.size - Number(lot !== undefined && !types.has(lot.id)))
  const adding = lot ? Math.max(0, Math.min(lot.count - amount(lot.key), MAX_TRAY - total - openTypes, Math.max(1, rule.tickets - total - openTypes))) : 0
  const servers = handsWorking(save, story).filter((id) => serverLock(save, id, story) === null)
  const why = shiftBlock(save, stage, chosen, server, story)
  const last = save.workshops.restaurant?.last
  const played = save.workshops.played.restaurant === save.calendar.day
  return (
    <div className="space-y-2" data-shift-setup>
      {last && <ShiftResult result={last} onRecipes={onRecipes} />}
      {played ? <p className="py-2 text-[14px] text-ink-soft">The next shift is tomorrow.</p> : (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2 rounded-md border border-hairline p-2.5">
            <label className="grid gap-1 text-[13px] font-semibold">Stage
              <select value={stage} className={PICK} onChange={(e) => setStage(Number(e.target.value))}>
                {RESTAURANT_STAGES.slice(0, next).map((stage, i) => <option key={stage.name} value={i + 1}>{i + 1} · {stage.name}</option>)}
              </select>
            </label>
            <p className="text-[13px] text-ink-soft">{rule.target}/{rule.tickets} covers to clear · {rule.seconds}s</p>
            <p className="text-[13px] text-ink-soft">{plural(rule.types, 'dish type')} minimum{stage >= 3 ? ' · includes a learned dish from an earlier stage' : ''}</p>
            <label className="grid gap-1 text-[13px] font-semibold">Server
              <select value={server ?? ''} className={PICK} onChange={(e) => setServer(e.target.value || null)}>
                <option value="">Just me</option>
                {servers.map((id) => <option key={id} value={id}>{(master.status === 'ready' ? master.view.album.get(id)?.name : null) ?? `Uma ${id}`}</option>)}
              </select>
            </label>
          </div>
          <div className="min-w-0 space-y-1 rounded-md border border-hairline p-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Stock the tray</h3><span className="text-[13px] tabular-nums">{total}/{MAX_TRAY}</span>
            </div>
            {lot ? (
              <>
                <div className="flex gap-1">
                  <select className={`${PICK} flex-1`} aria-label="Dish lot" value={lot.key} onChange={(e) => setPick(e.target.value)}>
                    {selectable.map((row) => <option key={row.key} value={row.key}>{dishName(row.id)} · ★{row.stars} · {row.count} held</option>)}
                  </select>
                  <Button variant="secondary" disabled={locked || adding === 0} onClick={() => change(lot.key, adding)}>Add {adding || ''}</Button>
                </div>
                {chosen.map((line) => {
                  const at = parseStockKey(line.key)!
                  return (
                    <div key={line.key} className="flex min-h-11 items-center gap-1.5 text-[13px]" data-stocked={line.key}>
                      <ItemIcon id={at.id} size={23} />
                      <span className="min-w-0 flex-1 leading-tight">{dishName(at.id)} · ★{at.stars} × {line.count}</span>
                      <button type="button" className="size-11" aria-label={`Remove a portion of ${dishName(at.id)}`} onClick={() => change(line.key, -1)}>−</button>
                    </div>
                  )
                })}
              </>
            ) : <p className="text-[13px] text-ink-soft">No dishes available.</p>}
            <Link className={LINK} to={KITCHEN}>Kitchen ›</Link>
          </div>
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-1 border-t border-hairline bg-panel py-2 sm:col-span-2">
            <p className="text-[13px] text-ink-soft">{why ?? (stage <= (save.workshops.restaurant?.cleared ?? 0) ? 'Replay this stage' : 'Opens 15 recipes on first clear')}</p>
            <Button disabled={locked || why !== null} onClick={() => onStart(stage, chosen, server)}>Open shift · 1</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Service({ shift, locked, onPlate, onEnd }: { shift: RestaurantShift; locked: boolean; onPlate: (ticket: number, dish: string) => void; onEnd: () => void }) {
  const [now, setNow] = useState(Date.now)
  const [selected, setSelected] = useState<number | null>(null)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [])
  const elapsed = shiftTime(shift, now)
  const left = shiftLength(shift) - elapsed
  const done = left <= 0 || shift.served.length === shift.tickets.length
  useEffect(() => {
    if (done && !locked) onEnd()
  }, [done, locked, onEnd])
  const open = shift.tickets.flatMap((_, i) => ticketOpen(shift, i, elapsed) ? [i] : [])
  const next = shift.tickets.find((ticket) => ticket.opens > elapsed)
  const active = selected !== null && open.includes(selected) ? selected : null
  const plates = new Map<string, number>()
  for (const line of portionsLeft(shift)) {
    const dish = dishAt(line.key)
    plates.set(dish, (plates.get(dish) ?? 0) + line.count)
  }
  return (
    <div className="space-y-2 pb-1" data-service>
      <header className="flex flex-wrap items-center justify-between gap-x-2 text-[14px]">
        <h3 className="font-semibold">{restaurantStage(shift.stage)!.name}</h3>
        <span className="tabular-nums">{shift.served.length}/{shift.tickets.length} covers · {Math.ceil(Math.max(0, left) / 1000)}s</span>
      </header>
      <div className="h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label="Time left" aria-valuemin={0}
        aria-valuemax={shiftLength(shift)} aria-valuenow={Math.max(0, left)}>
        <div className="h-full bg-accent" style={{ width: `${Math.max(0, left) * 100 / shiftLength(shift)}%` }} />
      </div>
      <div className="flex min-h-12 flex-wrap items-center gap-1.5" aria-label="Open tickets">
        {open.length ? open.map((index) => {
          const ticket = shift.tickets[index]!
          const id = dishAt(shift.tray[ticket.plate]!.key)
          return <button key={index} type="button" data-ticket={index} aria-pressed={active === index} onClick={() => setSelected(index)}
            className={`flex min-h-11 items-center gap-1.5 rounded border px-2 text-left text-[13px] ${active === index ? 'border-accent bg-accent/15' : 'border-hairline'}`}>
            <ItemIcon id={id} size={25} />{dishName(id)}
          </button>
        }) : <p className="text-[13px] text-ink-soft">{next ? `Next ticket in ${Math.ceil((next.opens - elapsed) / 1000)}s` : 'Service complete'}</p>}
      </div>
      <div className={`grid gap-1.5 ${plates.size === 3 ? 'grid-cols-3' : plates.size === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {[...plates].map(([dish, count]) => (
          <button key={dish} type="button" data-plate={dish} disabled={locked || active === null || count === 0} onClick={() => {
            if (active === null) return
            onPlate(active, dish)
            setNow(Date.now())
          }} className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-hairline bg-panel px-1 py-1 text-[12px] leading-tight">
            <ItemIcon id={dish} size={29} />
            <span className="font-semibold">{dishName(dish)}</span>
            <span className="text-ink-soft">{count} left</span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-ink-soft">{shift.penalty > 0 ? `Wrong plates · −${shift.penalty / 1000}s` : active === null ? 'Choose a ticket.' : 'Choose its plate.'}</p>
        <Button variant="secondary" disabled={locked} onClick={onEnd}>End shift</Button>
      </div>
    </div>
  )
}

const gradeName = (id: string) => {
  const grade = goodOf(id)?.grade ?? restaurantGrade(id)
  const name = goodName(id)
  return grade && !name.endsWith(` G${grade}`) ? `${name} G${grade}` : name
}

function sourceHint(save: FarmSave, id: string): string {
  const sources = ingredientSources(id)
  const { season } = dateOf(save.calendar.day)
  const rank = farmRankOf(save.farm.points)
  return (sources.find((source) => source.rank <= rank && source.seasons.includes(season)) ?? sources[0])?.label ?? 'Cook in the Kitchen'
}

function RecipeBook({ save }: { save: FarmSave }) {
  const next = nextRestaurantStage(save)
  const [stage, setStage] = useState(Math.max(1, save.workshops.restaurant?.cleared ?? next))
  const [filter, setFilter] = useState<'ready' | 'need' | 'stage'>('stage')
  const learned = knownRestaurantRecipes(save).length
  const cleared = save.workshops.restaurant?.cleared ?? 0
  const rows = RESTAURANT_RECIPES.flatMap((recipe) => {
    const known = knowsRestaurantRecipe(save, recipe)
    const shortage = known ? recipe.ingredients.filter(({ id, count }) => [1, 2, 3, 4, 5].reduce((n, stars) => n + exactHeld(save, id, stars), 0) < count) : []
    if (filter === 'ready' && (!known || shortage.length) || filter === 'need' && (recipe.grade > cleared || known && !shortage.length)
      || filter === 'stage' && recipe.grade !== stage) return []
    return [{ recipe, known, shortage, missing: recipe.grade <= cleared && !known ? missingRecipeProofs(save, recipe) : [] }]
  })
  return (
    <section className="space-y-2" data-recipe-book>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold">{learned}/{RESTAURANT_RECIPES.length} learned</p>
        <Link className={LINK} to={KITCHEN}>Kitchen ›</Link>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {([['ready', 'Ready'], ['need', 'Need ingredients'], ['stage', 'By stage']] as const).map(([value, name]) => (
          <button className={`${PICK} ${filter === value ? 'border-accent bg-accent/10 font-semibold' : ''}`} key={value} type="button"
            onClick={() => setFilter(value)} aria-pressed={filter === value}>{name}</button>
        ))}
      </div>
      {filter === 'stage' && <select className={`${PICK} w-full`} value={stage} aria-label="Recipe stage" onChange={(event) => setStage(Number(event.target.value))}>
        {RESTAURANT_STAGES.map((rule, i) => <option key={rule.name} value={i + 1}>{i + 1} · {rule.name}</option>)}
      </select>}
      {rows.length === 0 && <p className="py-2 text-[13px] text-ink-soft">{filter === 'ready' ? 'No recipe can be cooked with the current stock.' : 'No opened recipe is missing ingredients.'}</p>}
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {rows.map(({ recipe, known, shortage, missing }) => (
          <li key={recipe.id} data-recipe={recipe.id} className="rounded-md border border-hairline bg-panel p-2">
            <div className="flex items-center gap-1.5">
              <ItemIcon id={recipe.id} size={25} />
              <h3 className="min-w-0 text-[14px] font-semibold leading-tight">{recipe.name} · G{recipe.grade}</h3>
            </div>
            <p className="text-[12px] text-ink-soft">{recipe.ingredients.map(({ id, count }) => `${count} × ${gradeName(id)}`).join(' · ')}</p>
            <p className="mt-1 text-[12px] font-semibold">{recipe.grade > cleared ? `Clear Stage ${recipe.grade}` : known
              ? shortage.length ? `Short on ${shortage.map(({ id }) => gradeName(id)).join(', ')}` : 'Ready to cook'
              : 'Produce on the farm'}</p>
            {missing.length > 0 && <ul className="text-[12px] text-ink-soft">
              {missing.map((id) => <li key={id}>{gradeName(id)} · {sourceHint(save, id)}</li>)}
            </ul>}
          </li>
        ))}
      </ul>
    </section>
  )
}
