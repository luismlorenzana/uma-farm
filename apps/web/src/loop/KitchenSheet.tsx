// The Kitchen, a wide sheet at `?sheet=kitchen` from the farm map's Kitchen once it stands (and the Book's food row): two
// columns. **Today's play**: the menu (up to three known recipes sharing the level's base: a stepper each, its main and
// its side at one good and one star, a tap on either for the next held; Add a recipe), the assistant (none, or a farmhand
// with an action tonight: her Cooking and her term), the seed, and **Play · 1** (refused in the loop's words, "Short 2
// Carp."), which opens the stove (`?stove=1`); played today, it says so. **The staff meal**: tonight's table as the board
// stands and the dishes it takes, the dishes held (the most stars first, a tap to choose), and **Serve** (free, once a
// day); served, its mouths and well-fed days. **Its level** and the next (Upgrade, as a station's). **Recipes**: the ones
// known, each with what it takes, and the shop's shelf in town. On the Cooking Contest's day (and the day before), its
// card comes first (`Contest.tsx`); before the Kitchen stands, the sheet shows only that card and "Build the Kitchen
// first", the morning's Contest lines opening it either way. Loaded on demand.
import {
  actionCost, actionsLeft, aptitudeOf, APTITUDE_NAMES, assistantLock, assistantTerm, defaultMenu, dishesHeld, dishName, handDay, handsWorking, ingredientName, kitchenBase, kitchenBuilt,
  kitchenLevel, kitchenLevelLock, kitchenPlayBlock, kitchenPlayedToday, knownRecipes, KITCHEN_LEVELS, levelLockWords, mainsHeld, MEALS_A_DAY, MENU_RECIPES, menuLine, MOUTHS_A_DISH,
  nextKitchenLevel, recipeWords, shareEvenly, sidesHeld, staffBlock, staffDays, staffPicks, staffTable, stoveSeed,
  availableStock, exactMenuLine, goodName, knownRestaurantRecipes, menuTakes, parseStockKey, restaurantRecipe, type MenuLine, type SaveV4,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { ContestCard } from './Contest'
import { serveTheStaffMeal, startKitchen, upgradeTheKitchen } from './kitchen-actions'
import MealDishes from './MealDishes'
import { useTalents } from './talents'
import { plural } from './words'

/** `?sheet=kitchen`: the Kitchen over the farm. */
export default function KitchenSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  if (!save) return null
  return <Kitchen save={save} onClose={() => leave(withParam(location, 'sheet', null))} />
}

/** Well fed's days in words: "tomorrow", "2 days". */
const fedWords = (days: number): string => (days === 1 ? 'through tomorrow' : `${days} days`)
const errorWords = (e: unknown): string => (e instanceof Error ? e.message : 'That didn’t work. Try again.')

function Kitchen({ save, onClose }: { save: SaveV4; onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const act = async (run: () => Promise<unknown>, done: string | null = null) => {
    if (busy) return
    setBusy(true)
    setNote(null)
    try {
      await run()
      setNote(done)
    } catch (e) {
      setNote(errorWords(e))
    } finally {
      setBusy(false)
    }
  }
  const level = kitchenLevel(save)
  const base = kitchenBase(save)
  if (!kitchenBuilt(save)) {
    return (
      <Sheet open onClose={onClose} size="wide" title="Kitchen" label="The Kitchen">
        <div className="mx-auto max-w-md space-y-3 pb-2" data-kitchen-sheet={0}>
          <ContestCard save={save} />
          <p className="text-[14px] text-ink-soft" data-kitchen-unbuilt>Build the Kitchen first: the Farm Rank offers it at 3.</p>
        </div>
      </Sheet>
    )
  }
  return (
    <Sheet open onClose={onClose} size="wide" title="Kitchen" label="The Kitchen"
      footer={<p className="min-h-5 text-center text-[13px] text-ink-soft" role={note ? 'status' : undefined} data-kitchen-note>{note ?? `Level ${level} · ${plural(base, 'dish', 'dishes')} a play`}</p>}>
      <div className="@container pb-2"><div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2" data-kitchen-sheet={level}>
        <div className="space-y-3">
          <ContestCard save={save} />
          <TodaysPlay save={save} busy={busy} onPlay={(menu, assistant) => void act(async () => {
            await startKitchen(menu, assistant)
            navigate(withParam(location, 'stove', '1'), { replace: true })
          })} />
        </div>
        <div className="space-y-3">
          <StaffMeal save={save} busy={busy} onServe={(picks) => void act(() => serveTheStaffMeal(picks), 'Served: tonight’s table eats it.')} />
          <MealDishes save={save} />
          <Level save={save} busy={busy} onUpgrade={() => void act(() => upgradeTheKitchen(), 'Its next level comes tomorrow.')} />
          <Recipes save={save} />
        </div>
      </div></div>
    </Sheet>
  )
}

// --- Today's play -------------------------------------------------------------------------------------------------------

/** The menu, the assistant, the seed and Play. */
function TodaysPlay({ save, busy, onPlay }: { save: SaveV4; busy: boolean; onPlay: (menu: MenuLine[], assistant: string | null) => void }) {
  const talents = useTalents()
  const pack = useStory()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const base = kitchenBase(save)
  const [chosen, setChosen] = useState<MenuLine[] | null>(null)
  const [assistant, setAssistant] = useState<string | null>(null)
  const [exactPick, setExactPick] = useState('')
  const learned = knownRestaurantRecipes(save)
  const picked = learned.find((recipe) => recipe.id === exactPick) ?? learned[0]
  const draft = chosen ?? defaultMenu(save)
  const taken = menuTakes(draft.filter((line) => !('inputs' in line)))
  const menu = draft.map((line) => {
    if (!('inputs' in line)) return line
    const exact = exactMenuLine(save, restaurantRecipe(line.dish)!, line.count, taken)
    for (const input of exact.inputs) taken.set(input.key, (taken.get(input.key) ?? 0) + input.count)
    return exact
  })
  const hasExact = menu.some((line) => 'inputs' in line)
  const known = knownRecipes(save)
  const made = menu.reduce((n, l) => n + l.count, 0)
  const helper = assistant && assistantLock(save, assistant, pack) === null ? assistant : null
  const why = kitchenPlayBlock(save, menu, helper, pack)
  const ingredients = new Map<string, number>()
  for (const [key, count] of menuTakes(menu)) {
    const at = parseStockKey(key)
    if (at) ingredients.set(at.id, (ingredients.get(at.id) ?? 0) + count)
  }
  const useReserve = [...ingredients].some(([id, count]) => (save.farm.reserves?.[id] ?? 0) > 0 && count > availableStock(save, id))
  // The assistant: a farmhand on the farm today (her farm day) with an action tonight.
  const hands = handsWorking(save, pack).filter((id) => (handDay(save, id)?.actions ?? 0) > 0)
  const set = (next: MenuLine[]) => setChosen(next)
  const reshare = (lines: MenuLine[]) => {
    if (lines.some((line) => 'inputs' in line)) return lines
    const shares = shareEvenly(base, lines.length)
    return lines.map((l, i) => ({ ...l, count: shares[i]! }))
  }
  if (kitchenPlayedToday(save)) {
    return (
      <section className="space-y-1" aria-label="Today's play" data-played>
        <Head title="Today’s play" />
        <p className="rounded-md bg-success/15 px-3 py-2 text-[14px] font-semibold text-success">Played today. The Kitchen plays again tomorrow.</p>
        {save.workshops.best.kitchen !== undefined && <p className="text-[13px] text-ink-soft" data-best>Best score · {save.workshops.best.kitchen}</p>}
      </section>
    )
  }
  return (
    <section className="space-y-2" aria-label="Today's play" data-play-menu>
      <Head title="Today’s play" help />
      {known.length === 0 ? <p className="text-[13px] text-ink-soft">No recipes yet.</p> : (
        <ul className="space-y-1.5" aria-label="The menu">
          {menu.map((line, i) => {
            const mains = mainsHeld(save, line.dish)
            const sides = sidesHeld(save, line.dish)
            const cycle = (rows: { key: string }[], key: string) => rows[(rows.findIndex((r) => r.key === key) + 1) % Math.max(1, rows.length)]?.key ?? key
            return (
              <li key={line.dish} className="space-y-1 rounded-md border border-hairline bg-panel px-2 py-1.5" data-menu-line={line.dish}>
                <div className="flex items-center gap-1.5">
                  <ItemIcon id={line.dish} size={28} />
                  <span className="min-w-0 flex-1 text-[14px] leading-tight font-semibold">{dishName(line.dish)}</span>
                  <Stepper value={line.count} disabled={busy} onChange={(count) => set(menu.map((l, k) => (k === i ? { ...l, count } : l)))} />
                  <button type="button" className="grid size-11 shrink-0 place-items-center text-ink-soft" aria-label={`Take ${dishName(line.dish)} off the menu`} disabled={busy || menu.length === 1}
                    onClick={() => set(reshare(menu.filter((_, k) => k !== i)))} data-action="menu-remove">✕</button>
                </div>
                {'inputs' in line ? <p className="text-[12px] text-ink-soft">
                  {restaurantRecipe(line.dish)?.ingredients.map(({ id, count, grade }) => {
                    const name = goodName(id)
                    return `${line.count * count} × ${name.endsWith(` G${grade}`) ? name : `${name} G${grade}`}`
                  }).join(' · ')}
                </p> : <div className="grid grid-cols-2 gap-1.5">
                  <Chip label="Main" text={`2 × ${ingredientName(line.main)}`} id={line.main} disabled={busy || mains.length < 2}
                    onTap={() => set(menu.map((l, k) => (k === i ? { ...line, main: cycle(mains, line.main) } : l)))} data="main" />
                  <Chip label="Side" text={ingredientName(line.side)} id={line.side} disabled={busy || sides.length < 2}
                    onTap={() => set(menu.map((l, k) => (k === i ? { ...line, side: cycle(sides, line.side) } : l)))} data="side" />
                </div>}
              </li>
            )
          })}
        </ul>
      )}
      {menu.length < MENU_RECIPES && (!hasExact || made < base) && known.some((d) => !menu.some((l) => l.dish === d)) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Add a recipe">
          {known.filter((d) => !menu.some((l) => l.dish === d)).map((dish) => (
            <button key={dish} type="button" disabled={busy} onClick={() => set(reshare([...menu, menuLine(save, dish, hasExact ? 1 : 0, menuTakes(menu))]))}
              className="flex min-h-11 items-center gap-1 rounded-full border border-hairline px-2.5 text-[13px]" data-add-recipe={dish}>
              <ItemIcon id={dish} size={20} />+ {dishName(dish)}
            </button>
          ))}
        </div>
      )}
      {(save.workshops.restaurant || picked) && (
        <div className="space-y-1">
          <Link to="/?sheet=restaurant&recipes=1" className="flex min-h-11 items-center text-[13px] font-semibold text-accent">Restaurant recipes · {learned.length} learned ›</Link>
          {picked && <div className="flex gap-1">
            <select aria-label="Learned Restaurant recipe" value={picked.id} onChange={(e) => setExactPick(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded border border-hairline bg-panel px-2 text-[13px]">
              {learned.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name} · G{recipe.grade}</option>)}
            </select>
            <Button variant="secondary" disabled={busy || (chosen !== null && (made >= base || menu.length >= MENU_RECIPES)) || menu.some((line) => line.dish === picked.id)}
              onClick={() => {
                const picks = chosen === null ? [] : menu
                set([...picks, exactMenuLine(save, picked, 1, menuTakes(picks))])
              }}>Add</Button>
          </div>}
        </div>
      )}
      <p className={`text-[13px] ${hasExact ? made <= base ? 'text-ink-soft' : 'font-semibold text-danger' : made === base ? 'text-ink-soft' : 'font-semibold text-danger'}`} data-menu-dishes={made}>Dishes · {made} of {base}</p>
      <div className="space-y-1" aria-label="The assistant">
        <h4 className="text-micro">Assistant</h4>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={helper === null} onClick={() => setAssistant(null)} disabled={busy}
            className={`min-h-11 rounded-full border px-3 text-[13px] ${helper === null ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`} data-assistant="none">None</button>
          {hands.map((id) => {
            const uma = save.roster[id]!
            const lv = aptitudeOf(uma, 'cook', (a) => talents.of(id, a)).level
            const term = assistantTerm(save, id, talents.of, pack)
            return (
              <button key={id} type="button" aria-pressed={helper === id} onClick={() => setAssistant(id)} disabled={busy}
                className={`flex min-h-11 items-center gap-1.5 rounded-full border pr-3 pl-1 text-[13px] ${helper === id ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`} data-assistant={id}>
                <Avatar id={id} size={32} label={nameOf(id)} />
                <span>{nameOf(id)} · {APTITUDE_NAMES.cook} {lv} · ×{term.toFixed(2)}</span>
              </button>
            )
          })}
        </div>
        {hands.length === 0 && <p className="text-[12px] text-ink-faint">A farmhand with an action tonight can assist: one of her actions is the play’s.</p>}
      </div>
      <Button className="w-full" disabled={busy || why !== null} onClick={() => onPlay(menu, helper)} data-action="kitchen-play" data-why={why ?? undefined}>
        {`${useReserve ? 'Play with reserve' : 'Play'} · ${actionCost('kitchen')} · ${plural(hasExact ? made : base, 'dish', 'dishes')}`}
      </Button>
      <p className="text-[12px] text-ink-faint" data-kitchen-why>{why ?? `Seed ${stoveSeed(save)} · 60 seconds at the stove · ${actionsLeft(save)} actions left`}</p>
    </section>
  )
}

function Head({ title, help = false }: { title: string; help?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-micro">{title}</h3>
      {help && (
        <GuideButton topic="kitchen" title="The Kitchen" label="How the Kitchen works">
          <p>Once a day, one action: cook a menu of up to three recipes at the stove for 60 seconds. The menu shares the level’s dishes.</p>
          <p>A recipe takes two of its main and one side for each dish, each at one good and one star. The dishes’ stars are their goods’ average, plus the play’s tier.</p>
          <p>Rough makes the dishes as they are; Good a quarter more; Fine half again and a star more; Masterwork twice as many and two stars more.</p>
          <p>An assistant makes more: her Cooking and her cooking rank. One of her actions tonight is the play’s.</p>
          <p>The staff meal, free once a day, feeds tonight’s table from your dishes: one dish for every {MOUTHS_A_DISH} at the table, in place of their {MEALS_A_DAY} meals. Everyone who eats it is well fed: ★1–2 through tomorrow, ★3–4 two days, ★5 three.</p>
          <p>Restaurant dishes can ship. All dishes can be saved for meals or served at the Restaurant.</p>
        </GuideButton>
      )}
    </div>
  )
}

/** A count between 1 and the level's base: − and +, 44 pt each. */
function Stepper({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (n: number) => void }) {
  return (
    <span className="flex shrink-0 items-center" data-stepper={value}>
      <button type="button" className="grid size-11 place-items-center rounded-full text-[18px]" aria-label="One fewer" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-6 text-center text-[15px] font-bold tabular-nums">{value}</span>
      <button type="button" className="grid size-11 place-items-center rounded-full text-[18px]" aria-label="One more" disabled={disabled || value >= 15} onClick={() => onChange(value + 1)}>+</button>
    </span>
  )
}

/** An ingredient: its good and star; a tap moves to the next held. */
function Chip({ label, text, id, disabled, onTap, data }: { label: string; text: string; id: string; disabled: boolean; onTap: () => void; data: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onTap} className="flex min-h-11 items-center gap-1.5 rounded-md border border-hairline px-1.5 text-left text-[12px] disabled:opacity-100"
      data-chip={data} data-key={id}>
      <ItemIcon id={id.slice(0, id.lastIndexOf('@'))} size={22} />
      <span className="min-w-0 flex-1"><span className="block text-[10px] text-ink-faint">{label}</span><span className="block truncate font-semibold">{text}</span></span>
    </button>
  )
}

// --- The staff meal -----------------------------------------------------------------------------------------------------

/** Two picks at most a dish row: a tap adds one while the table takes more; with it full, a tap on a picked dish takes one
 * back, and on another swaps out the first. */
export function pickDish(picks: readonly string[], key: string, held: number, need: number): string[] {
  const mine = picks.filter((k) => k === key).length
  if (picks.length < need && mine < held) return [...picks, key]
  if (mine > 0) {
    const at = picks.lastIndexOf(key)
    return picks.filter((_, i) => i !== at)
  }
  return [...picks.slice(1), key]
}

function StaffMeal({ save, busy, onServe }: { save: SaveV4; busy: boolean; onServe: (picks: string[] | null) => void }) {
  // Tonight's table: the farmhands on their farm day, as the story pack's schedules say.
  const pack = useStory()
  const table = staffTable(save, pack)
  const held = dishesHeld(save)
  const [chosen, setChosen] = useState<string[] | null>(null)
  const picks = chosen ?? staffPicks(save, pack) ?? []
  const why = staffBlock(save, chosen, pack)
  const covered = Math.min(table.mouths, picks.length * MOUTHS_A_DISH)
  const served = save.today.staff
  return (
    <section className="space-y-1.5" aria-label="The staff meal" data-staff>
      <h3 className="text-micro">The staff meal</h3>
      {served ? (
        <p className="rounded-md bg-success/15 px-3 py-2 text-[14px] font-semibold text-success" data-served-staff>
          Served · {served.mouths} at the table · well fed {fedWords(served.days)}
        </p>
      ) : (
        <>
          <p className="text-[13px]" data-staff-table={table.mouths}>Tonight · {table.mouths} at the table · {plural(table.dishes, 'dish', 'dishes')}</p>
          {held.length === 0 ? <p className="text-[13px] text-ink-soft" data-no-dishes>No dishes yet: play the Kitchen to cook some.</p> : (
            <ul className="grid grid-cols-2 gap-1.5" aria-label="Dishes held">
              {held.map((row) => {
                const n = picks.filter((k) => k === row.key).length
                return (
                  <li key={row.key}>
                    <button type="button" aria-pressed={n > 0} disabled={busy} onClick={() => setChosen(pickDish(picks, row.key, row.count, table.dishes))}
                      className={`flex min-h-11 w-full items-center gap-1.5 rounded-md border px-2 text-left text-[13px] ${n > 0 ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`}
                      data-dish-key={row.key}>
                      <ItemIcon id={row.id} size={24} />
                      <span className="min-w-0 flex-1 truncate">{dishName(row.id)} ★{row.stars}</span>
                      <span className="shrink-0 text-[12px] text-ink-soft tabular-nums">{n > 0 ? `${n}/${row.count}` : `×${row.count}`}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <Button className="w-full" disabled={busy || why !== null} onClick={() => onServe(chosen)} data-action="serve-staff" data-why={why ?? undefined}>
            Serve the staff meal
          </Button>
          <p className="text-[12px] text-ink-faint" data-staff-why>
            {why ?? `Feeds ${covered} of ${table.mouths} · well fed ${fedWords(staffDays(picks))}`}
          </p>
        </>
      )}
    </section>
  )
}

// --- Its level, and the recipes ---------------------------------------------------------------------------------------------

function Level({ save, busy, onUpgrade }: { save: SaveV4; busy: boolean; onUpgrade: () => void }) {
  const level = kitchenLevel(save)
  const next = nextKitchenLevel(save)
  const lock = kitchenLevelLock(save)
  return (
    <section className="space-y-1" aria-label="Its level" data-kitchen-level={level}>
      <h3 className="text-micro">Level {level} · {plural(KITCHEN_LEVELS[level - 1]?.dishes ?? 0, 'dish', 'dishes')} a play</h3>
      {next && (
        <div className="flex min-h-12 items-center gap-2.5 rounded-sm border border-hairline bg-panel px-2.5 py-1.5" data-next-level={next.level}>
          <span className="min-w-0 flex-1 text-[14px]">
            <b>Level {next.level} · {plural(next.dishes, 'dish', 'dishes')} a play</b>
            <span className="block text-[12px] text-ink-soft">{levelLockWords(lock) ?? `${next.cost.toLocaleString('en-US')}g · ready tomorrow`}</span>
          </span>
          <Button size="sm" variant="secondary" disabled={busy || lock !== null} onClick={onUpgrade} data-action="kitchen-upgrade">Upgrade · {next.cost.toLocaleString('en-US')}g</Button>
        </div>
      )}
    </section>
  )
}

function Recipes({ save }: { save: SaveV4 }) {
  const location = useLocation()
  const navigate = useNavigate()
  const known = useMemo(() => knownRecipes(save), [save])
  return (
    <section className="space-y-1" aria-label="Recipes known" data-recipes={known.length}>
      <h3 className="text-micro">Recipes · {known.length} of 80</h3>
      <ul className="divide-y divide-hairline rounded-md border border-hairline">
        {known.map((dish) => (
          <li key={dish} className="flex min-h-11 items-center gap-2 px-2 text-[13px]" data-recipe={dish}>
            <ItemIcon id={dish} size={24} />
            <span className="min-w-0 flex-1 truncate"><b>{dishName(dish)}</b> <span className="text-ink-soft">· {recipeWords(dish)}</span></span>
          </li>
        ))}
      </ul>
      <button type="button" className="flex min-h-11 w-full items-center justify-between text-[13px]" onClick={() => navigate(withParam(location, 'sheet', 'shop'), { state: { back: true } })}
        data-action="recipe-shop">
        <span className="text-ink-soft">More recipes at the shop, in town</span><span className="font-semibold">Shop ›</span>
      </button>
    </section>
  )
}
