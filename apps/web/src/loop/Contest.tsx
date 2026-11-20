// The Cooking Contest on screen, at the Kitchen. **Its card** on the Kitchen's sheet: the day before, "Cooking Contest
// tomorrow"; on its day, **Enter the Cooking Contest · 3** (or why not: "Build the Kitchen to enter.", "Entering takes 3
// actions."), and once judged, the board. **Its entry** at `?sheet=contest`, a wide side panel in two columns: your dish
// (a known recipe, a tap each; its main and its side, a tap for the next held; its stars before the stove) and the
// judging (the rivals at today's Farm Rank, the score's rule, an optional cook: none, or a farmhand with an action
// tonight), then **Enter · 3**, which opens the stove (`?stove=1`). The festival's name is the story's (a moved or renamed
// Contest). Loaded on demand with the Kitchen's sheet.
import {
  actionsLeft, aptitudeOf, APTITUDE_NAMES, boardRows, CONTEST_ACTIONS, contestBlock, contestBoard, contestDefault, contestMains, contestOn, contestResult, contestSides, cookLock,
  dishName, entryStars, eventActionsLeft, FESTIVALS, GAME_DAYS, handDay, handsInOrder, ingredientName, knownRecipes, placeWords, PLAY_TIERS, recipeWords, stoveSeed,
  type ContestBoard, type ContestEntry, type SaveV4,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useSpecialDays, useStory, useStoryYear } from '../story/story'
import { enterTheContest } from './kitchen-actions'
import { useTalents } from './talents'
import { plural } from './words'

const errorWords = (e: unknown): string => (e instanceof Error ? e.message : 'That didn’t work. Try again.')
/** The festival's name mid-sentence: "the Cooking Contest" (the story's "The Harvest Kitchen" reads "the Harvest Kitchen"). */
export const theContest = (name: string): string => `the ${name.replace(/^the\s+/i, '')}`
/** The Fine and Masterwork tiers' lifts. */
const LIFTS = PLAY_TIERS.filter((t) => t.lift > 0)

/** The board in a line: "1st · You 78 · the orchard 70 · the ranch 61". */
export const boardWords = (board: Pick<ContestBoard, 'score' | 'place' | 'rivals'>): string =>
  [placeWords(board.place), ...boardRows(board).map((r) => `${r.who === 'you' ? 'You' : r.farm} ${r.score}`)].join(' · ')
/** Its prize in a line: "+1,800g · +150 Farm Rank points". */
export const prizeWords = (board: Pick<ContestBoard, 'gold' | 'points'>): string => `+${board.gold.toLocaleString('en-US')}g · +${board.points} Farm Rank points`

/** The board: your place, each farm's score (the best first, you ahead on a tie), and the prize. */
export function BoardView({ board, big = false }: { board: ContestBoard; big?: boolean }) {
  return (
    <div className="space-y-1" data-board={board.place} data-board-score={board.score}>
      <p className={`font-display font-bold ${big ? 'text-[34px] leading-none' : 'text-[20px]'}`} data-place>{placeWords(board.place)}</p>
      <ol className="divide-y divide-hairline rounded-md border border-hairline bg-panel" aria-label="The board">
        {boardRows(board).map((r) => (
          <li key={r.who} className={`flex min-h-10 items-center gap-2 px-3 text-[14px] ${r.who === 'you' ? 'font-semibold text-accent' : ''}`} data-row={r.who}>
            <span className="flex-1">{r.who === 'you' ? 'You' : r.farm![0]!.toUpperCase() + r.farm!.slice(1)}</span>
            <span className="font-display tabular-nums">{r.score}</span>
          </li>
        ))}
      </ol>
      <p className="text-[14px] font-semibold text-success" data-prize>{prizeWords(board)}</p>
    </div>
  )
}

/** The Kitchen's card: the Contest tomorrow, or today (Enter, why not, or the board). Nothing on any other day. */
export function ContestCard({ save }: { save: SaveV4 }) {
  const year = useStoryYear() ?? FESTIVALS
  const days = useSpecialDays() ?? GAME_DAYS
  const navigate = useNavigate()
  const location = useLocation()
  const today = contestOn(save.calendar.day, year, save.calendar)
  const tomorrow = contestOn(save.calendar.day + 1, year, save.calendar)
  if (!today && !tomorrow) return null
  if (!today) {
    return (
      <section className="space-y-1 rounded-md border border-accent/40 bg-accent/5 px-3 py-2" aria-label={`${tomorrow!.name} tomorrow`} data-contest="tomorrow">
        <h3 className="font-display text-[16px] font-bold">{tomorrow!.name} tomorrow</h3>
        <p className="text-[13px] text-ink-soft">Enter here tomorrow with {CONTEST_ACTIONS} actions: one dish, cooked live, judged against the orchard and the ranch.</p>
      </section>
    )
  }
  const result = contestResult(save)
  if (result) {
    return (
      <section className="space-y-1.5 rounded-md border border-success/40 bg-success/5 px-3 py-2" aria-label={today.name} data-contest="judged">
        <h3 className="font-display text-[16px] font-bold">{today.name}</h3>
        <BoardView board={contestBoard(save, result.day, result.score)} />
      </section>
    )
  }
  // Its gates only: the recipe and the cook are the entry's.
  const gate = contestBlock(save, days, null)
  const why = gate === 'Choose a recipe.' ? null : gate
  return (
    <section className="space-y-1.5 rounded-md border border-accent/40 bg-accent/5 px-3 py-2" aria-label={`${today.name} today`} data-contest="today">
      <h3 className="font-display text-[16px] font-bold">{today.name} today</h3>
      <p className="text-[13px] text-ink-soft">One dish, cooked live, judged against the orchard and the ranch. The places pay gold and Farm Rank points.</p>
      <Button className="w-full" disabled={why !== null} onClick={() => navigate(withParam(location, 'sheet', 'contest'), { state: { back: true } })}
        data-action="contest-enter" data-why={why ?? undefined}>
        {`Enter ${theContest(today.name)} · ${CONTEST_ACTIONS}`}
      </Button>
      {why && <p className="text-[12px] text-ink-faint" data-contest-why>{why}</p>}
      {why === 'Build the Kitchen to enter.' && <Link to="/?peek=kitchen" className="flex min-h-11 items-center text-[13px] font-semibold" data-action="contest-build">The Kitchen ›</Link>}
    </section>
  )
}

/** `?sheet=contest`: the entry. */
export default function ContestSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  if (!save) return null
  return <Entry save={save} onClose={() => leave(withParam(location, 'sheet', null))} />
}

function Entry({ save, onClose }: { save: SaveV4; onClose: () => void }) {
  const pack = useStory()
  const year = useStoryYear() ?? FESTIVALS
  const days = useSpecialDays() ?? GAME_DAYS
  const navigate = useNavigate()
  const location = useLocation()
  const talents = useTalents()
  const master = useMaster()
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const [chosen, setChosen] = useState<ContestEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const festival = contestOn(save.calendar.day, year, save.calendar)
  const name = festival?.name ?? 'Cooking Contest'
  const result = contestResult(save)
  const entry = chosen ?? contestDefault(save)
  const why = contestBlock(save, days, entry, pack)
  const known = knownRecipes(save)
  const hands = handsInOrder(save).filter((id) => (handDay(save, id)?.actions ?? 0) > 0)
  const rivals = contestBoard(save, save.calendar.day, 0).rivals
  const set = (next: Partial<ContestEntry>) => setChosen({ ...(entry ?? { dish: '', main: '', side: '', cook: null }), ...next })
  const pickDish = (dish: string) => set({ dish, main: contestMains(save, dish)[0] ?? '', side: contestSides(save, dish)[0] ?? '' })
  const cycle = (rows: string[], key: string) => rows[(rows.indexOf(key) + 1) % Math.max(1, rows.length)] ?? key
  const enter = async () => {
    if (busy || !entry || why) return
    setBusy(true)
    setNote(null)
    try {
      await enterTheContest(entry)
      navigate(withParam(location, 'stove', '1'), { replace: true })
    } catch (e) {
      setNote(errorWords(e))
    } finally {
      setBusy(false)
    }
  }
  const stars = entry && entry.main && entry.side ? entryStars(entry) : null
  return (
    <Sheet open onClose={onClose} size="wide" title={name} label={`Enter ${theContest(name)}`}
      footer={<p className="min-h-5 text-center text-[13px] text-ink-soft" role={note ? 'status' : undefined} data-contest-note>{note ?? (result ? 'One entry a Contest.' : `${CONTEST_ACTIONS} actions, the festival’s first · 60 seconds at the stove`)}</p>}>
      {result ? (
        <div className="mx-auto max-w-md pb-2" data-contest-sheet="judged"><BoardView board={contestBoard(save, result.day, result.score)} big /></div>
      ) : (
        <div className="@container pb-2"><div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2" data-contest-sheet="entry">
          <section className="space-y-2" aria-label="Your dish">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-micro">Your dish</h3>
              <GuideButton topic="festivals" title={name} label={`How ${theContest(name)} works`}>
                <p>Cook one dish live at the stove for 60 seconds. Its stars are the Kitchen’s: its goods’ average, plus a star from Fine and two from Masterwork.</p>
                <p>The town’s cook judges it: 10 a star, plus half your play’s score. The orchard and the ranch cook too, better as your Farm Rank grows. Ties go to you.</p>
                <p>1st pays 600g × the season’s number × the year and 150 Farm Rank points; 2nd half the gold and 75 points; 3rd a fifth and 25. The points count tonight.</p>
                <p>A cook, if you pick one, spends one of her actions tonight. A 1st counts toward her cooking Legend.</p>
              </GuideButton>
            </div>
            <ul className="grid grid-cols-2 gap-1.5" aria-label="Recipes known">
              {known.map((dish) => {
                const can = contestMains(save, dish).length > 0 && contestSides(save, dish).length > 0
                return (
                  <li key={dish}>
                    <button type="button" aria-pressed={entry?.dish === dish} disabled={busy} onClick={() => pickDish(dish)}
                      className={`flex min-h-11 w-full items-center gap-1.5 rounded-md border px-2 text-left text-[13px] ${entry?.dish === dish ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'} ${can ? '' : 'text-ink-faint'}`}
                      data-contest-dish={dish}>
                      <ItemIcon id={dish} size={24} />
                      <span className="min-w-0 flex-1 truncate">{dishName(dish)}</span>
                      {!can && <span className="shrink-0 text-[11px]">Short</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
            {entry && (
              <>
                <p className="text-[12px] text-ink-soft">{recipeWords(entry.dish)}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Ingredient label="Main" text={entry.main ? `2 × ${ingredientName(entry.main)}` : 'None held'} id={entry.main} disabled={busy || contestMains(save, entry.dish).length < 2}
                    onTap={() => set({ main: cycle(contestMains(save, entry.dish), entry.main) })} data="main" />
                  <Ingredient label="Side" text={entry.side ? ingredientName(entry.side) : 'None held'} id={entry.side} disabled={busy || contestSides(save, entry.dish).length < 2}
                    onTap={() => set({ side: cycle(contestSides(save, entry.dish), entry.side) })} data="side" />
                </div>
                {stars !== null && (
                  <p className="text-[13px]" data-entry-stars={stars}>
                    <b>{dishName(entry.dish)} ★{stars}</b> <span className="text-ink-soft">before the stove · {LIFTS.map((t) => `${t.name} ★${Math.min(5, stars + t.lift)}`).join(' · ')}</span>
                  </p>
                )}
              </>
            )}
          </section>
          <section className="space-y-2" aria-label="The judging">
            <h3 className="text-micro">The judging</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="The rivals" data-rivals>
              {rivals.map((r) => (
                <li key={r.id} className="flex min-h-10 items-center px-3 text-[14px]" data-rival={r.id}>
                  <span className="flex-1">{r.farm[0]!.toUpperCase() + r.farm.slice(1)}</span><span className="font-display tabular-nums">{r.score}</span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-ink-soft">Your score: 10 a star + half your play’s score. Ties go to you.</p>
            <div className="space-y-1" aria-label="The cook">
              <h4 className="text-micro">Cook</h4>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" aria-pressed={!entry?.cook} onClick={() => set({ cook: null })} disabled={busy}
                  className={`min-h-11 rounded-full border px-3 text-[13px] ${!entry?.cook ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`} data-cook="none">None</button>
                {hands.map((id) => {
                  const lock = cookLock(save, id, pack)
                  const lv = aptitudeOf(save.roster[id]!, 'cook', (a) => talents.of(id, a)).level
                  return (
                    <button key={id} type="button" aria-pressed={entry?.cook === id} onClick={() => set({ cook: id })} disabled={busy || lock !== null} title={lock ?? undefined}
                      className={`flex min-h-11 items-center gap-1.5 rounded-full border pr-3 pl-1 text-[13px] ${entry?.cook === id ? 'border-accent bg-accent/10 font-semibold' : 'border-hairline'}`} data-cook={id}>
                      <Avatar id={id} size={32} label={nameOf(id)} />
                      <span>{nameOf(id)} · {APTITUDE_NAMES.cook} {lv}</span>
                    </button>
                  )
                })}
              </div>
              {hands.length === 0 && <p className="text-[12px] text-ink-faint">A farmhand with an action tonight can cook for you.</p>}
            </div>
            <Button className="w-full" disabled={busy || why !== null} onClick={() => void enter()} data-action="contest-start" data-why={why ?? undefined}>
              {`Enter · ${CONTEST_ACTIONS}`}
            </Button>
            <p className="text-[12px] text-ink-faint" data-contest-entry-why>
              {why ?? `Seed ${stoveSeed(save)} · ${plural(eventActionsLeft(save, days), 'action')} for events, ${actionsLeft(save)} of the day’s left`}
            </p>
          </section>
        </div></div>
      )}
    </Sheet>
  )
}

/** An ingredient: its good and star; a tap moves to the next held. */
function Ingredient({ label, text, id, disabled, onTap, data }: { label: string; text: string; id: string; disabled: boolean; onTap: () => void; data: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onTap} className="flex min-h-11 items-center gap-1.5 rounded-md border border-hairline px-1.5 text-left text-[12px] disabled:opacity-100"
      data-entry-chip={data} data-key={id}>
      {id && <ItemIcon id={id.slice(0, id.lastIndexOf('@'))} size={22} />}
      <span className="min-w-0 flex-1"><span className="block text-[10px] text-ink-faint">{label}</span><span className="block truncate font-semibold">{text}</span></span>
    </button>
  )
}

