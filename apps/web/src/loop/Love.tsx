// Her route on her sheet (F47 decision 15; romance spec RM11–RM16, RM24): until F48's profile, the roster's sheet shows
// her level in words, her bar in the ladder's colour with its points and what's banked, whether her next event is Ready
// or what it waits for, and Chat +15, Gift (the picker with each good's points for her today, or "?") and Praise +20
// while earned. What an act paid goes up to the sheet (`onPaid`), which floats it from her face. Loaded on demand, and only
// for a v4 save, so the M4 build never fetches it.
import {
  bar, birthdaysOf, canPraise, chatLineV4, DISLIKED_LINE, FAMILY_NAMES, GOOD_FAMILIES, giftPreview, goodName, goodOf, LADDER_COLOURS, ladderOf, levelWords,
  LOVE_POINTS, readiness, type SaveV4, type Taste, type Temperament,
} from '@farm/domain'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import type { MasterView } from '../master/master'
import { useStory } from '../story/story'
import { chatHer, giftHer, praiseHer } from './actions'
import { gain, readyWords } from './love-words'

const TASTE_WORDS: Readonly<Record<Taste, string>> = { loved: 'She loves it!', liked: 'She likes it.', neutral: 'Thank you.', disliked: DISLIKED_LINE }
const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** A line with its placeholders filled: `{farmer}` (the format's only one) and `{name}` (the temperament lines'). */
const fill = (line: string, name: string, farmer: string): string => line.split('{farmer}').join(farmer || 'you').split('{name}').join(name)

export default function LoveCard({ save, id, name, temperament, master, onPaid }: {
  save: SaveV4
  id: string
  name: string
  temperament: Temperament | null
  master: MasterView
  /** What an act paid, for the "+N" over her face. */
  onPaid: (points: number) => void
}) {
  const pack = useStory()
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)
  const birthdays = useMemo(() => (pack ? birthdaysOf(pack, master.birthdays) : new Map<string, number>()), [pack, master])
  const love = save.love[id]
  if (!pack || !love) return null
  const now = bar(love)
  const state = readiness(save, pack, id)
  const colour = LADDER_COLOURS[ladderOf(love.stage)]
  const talked = save.today.chats.includes(id)
  const gave = save.today.gifts.includes(id)
  const line = talked ? fill(chatLineV4(save, pack, id, temperament ?? 'steady'), name, save.farmer.name) : null
  const share = now.cost > 0 ? Math.min(1, now.points / now.cost) : now.rung ? 1 : 0
  const paid = (points: number, words: string) => {
    setError(null)
    setNote(words)
    if (points > 0) onPaid(points)
  }
  const fail = (err: unknown) => setError(errorWords(err))
  const words = readyWords(state, now, (other) => master.album.get(other)?.name ?? 'An Uma')
  return (
    <div className="space-y-2" data-love={id} data-stage={love.stage} data-level={love.level}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-ink" data-level-words>{levelWords(love)}</p>
        {state.ready && <span className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: colour }} data-ready-chip>● Ready</span>}
      </div>
      <div className="space-y-1">
        <span aria-hidden className="block h-2.5 overflow-hidden rounded-full bg-sunken">
          <span className="block h-full rounded-full" style={{ width: `${Math.round(share * 100)}%`, background: colour }} data-bar-fill={Math.round(share * 100)} />
        </span>
        <p className="flex justify-between text-[12px] text-ink-soft tabular-nums" data-bar={`${now.points}/${now.cost}`} data-banked={now.banked}>
          <span>{now.cost > 0 ? `${now.points.toLocaleString('en-US')} / ${now.cost.toLocaleString('en-US')}` : ''}</span>
          {now.banked > 0 && <span className="font-semibold" style={{ color: colour }}>+{now.banked.toLocaleString('en-US')} banked</span>}
        </p>
      </div>
      <p className={`text-[13px] ${state.ready ? 'font-semibold text-ink' : 'text-ink-soft'}`} data-ready={state.ready ? 'ready' : state.waits!.kind}>
        {state.waits?.kind === 'away' ? <Link to="/dorm" className="font-semibold text-accent-strong underline">{words}</Link> : words}
      </p>
      {line && <p className="rounded-md bg-sunken/70 px-3 py-2 text-[14px] italic" data-chat-line>{line}</p>}
      {(note || error) && <p role="status" className={`text-[13px] font-semibold ${error ? 'text-danger' : 'text-success'}`} data-love-note>{error ?? note}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={talked} data-action="chat" onClick={() => void chatHer(id).then((r) => paid(r.paid, `${gain(r.paid)} ♥`), fail)}>
          {talked ? 'Talked today' : `Chat +${LOVE_POINTS.chat}`}
        </Button>
        <Button variant="secondary" disabled={gave} onClick={() => setGiving(true)} data-action="gift">{gave ? 'Gift given' : 'Gift'}</Button>
        {canPraise(save, id) && (
          <Button className="col-span-2" data-action="praise" onClick={() => void praiseHer(id).then((r) => paid(r.paid, `${gain(r.paid)} ♥ Well done!`), fail)}>
            Praise +{LOVE_POINTS.praise}
          </Button>
        )}
      </div>
      {giving && (
        <GiftPicker save={save} id={id} name={name} points={(good, stars) => giftPreview(save, pack, id, good, stars, birthdays)} onClose={() => setGiving(false)}
          onGive={(item, stars) => {
            setGiving(false)
            giftHer(id, item, stars).then((r) => paid(r.paid, r.taste === 'disliked' ? DISLIKED_LINE : `${TASTE_WORDS[r.taste]} ${gain(r.paid)}`), fail)
          }} />
      )}
    </div>
  )
}

/** The gift picker (RM15): every good in the Warehouse at each star held, by family, seeds left out, each with its points
 * for her today at those stars, or "?" where her taste for it isn't known yet. A tap gives one. */
function GiftPicker({ save, id, name, points, onGive, onClose }: {
  save: SaveV4
  id: string
  name: string
  points: (good: string, stars: number) => number | null
  onGive: (item: string, stars: number) => void
  onClose: () => void
}) {
  const groups = GOOD_FAMILIES.map((family) => ({
    family,
    rows: Object.entries(save.items).flatMap(([good, row]) => {
      const g = goodOf(good)
      return g?.family === family ? row.flatMap((n, i) => (n > 0 ? [{ good, stars: i + 1, count: n, grade: g.grade, refined: g.refined }] : [])) : []
    }).sort((a, b) => Number(a.refined) - Number(b.refined) || a.grade - b.grade || a.good.localeCompare(b.good) || a.stars - b.stars),
  })).filter((g) => g.rows.length > 0)
  return (
    <Sheet open onClose={onClose} title={`A gift for ${name}`} label="Choose a gift">
      {groups.length === 0 && <p className="py-2 text-ink-soft">Nothing to give yet: bring something home first.</p>}
      <div className="space-y-3 pb-2" data-gift-sheet={id}>
        {groups.map((g) => (
          <section key={g.family} aria-label={FAMILY_NAMES[g.family]}>
            <h3 className="text-micro pb-1">{FAMILY_NAMES[g.family]}</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline">
              {g.rows.map((r) => {
                const pay = points(r.good, r.stars)
                return (
                  <li key={`${r.good}@${r.stars}`}>
                    <button type="button" onClick={() => onGive(r.good, r.stars)} data-gift={`${r.good}@${r.stars}`} data-gift-points={pay ?? '?'}
                      aria-label={`${goodName(r.good)} ★${r.stars}, ${pay === null ? 'her taste unknown' : `${pay} points`}`}
                      className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-[15px]">
                      <ItemIcon id={r.good} size={28} />
                      <span className="min-w-0 flex-1 truncate">{goodName(r.good)}</span>
                      <span className="shrink-0 text-[13px] text-ink-soft tabular-nums">★{r.stars} × {r.count}</span>
                      <span className={`w-11 shrink-0 text-right text-[14px] font-bold tabular-nums ${pay === null ? 'text-ink-faint' : 'text-[#c2385e]'}`}>
                        {pay === null ? '?' : gain(pay)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
