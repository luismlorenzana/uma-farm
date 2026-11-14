// Her acts on her profile (on the Hearts tab): Chat +15 (then her
// line for the day), Gift (the picker with each good's points for her today, or "?") and Praise +20 while earned, 48 pt in
// the profile's thumb zone. What an act paid goes up to the profile (`onPaid`), which floats it from her face; a note
// says it, a gift in her words by her taste (the default story's: "‹name› smiles. “Peach? That’s lovely.” +36"). **Evening ›** is there too (her evening at `?evening=<id>`, or why not:
// "Evening ✓", "Evening · F2", "In town", "Evening spent"), so Chat, Gift and Evening sit side by side and
// Praise +20 takes the row under them. Loaded on demand with the Hearts tab.
import {
  birthdaysOf, canPraise, chatLineV4, FAMILY_NAMES, festivalsOf, GOOD_FAMILIES, giftLineV4, giftPreview, goodName, goodOf, LOVE_POINTS, type SaveV4, type StoryPack,
  type Temperament,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import type { MasterView } from '../master/master'
import { chatHer, giftHer, praiseHer } from './actions'
import { eveningButton } from './evening-view'
import { gain } from './love-words'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** A line with its placeholders filled: `{farmer}` (the format's only one) and `{name}` (the default story's). */
const fill = (line: string, name: string, farmer: string): string => line.split('{farmer}').join(farmer || 'you').split('{name}').join(name)

/** Chat, Gift and Praise, with today's chat line and the last act's note above them. */
export function LoveActs({ save, pack, id, name, temperament, master, onPaid }: {
  save: SaveV4
  pack: Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'world' | 'master'>>
  id: string
  name: string
  temperament: Temperament | null
  master: MasterView
  /** What an act paid, for the "+N" over her face. */
  onPaid: (points: number) => void
}) {
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)
  const location = useLocation()
  const birthdays = useMemo(() => birthdaysOf(pack, master.birthdays), [pack, master])
  if (!save.love[id]) return null
  const talked = save.today.chats.includes(id)
  const gave = save.today.gifts.includes(id)
  const praise = canPraise(save, id)
  const evening = eveningButton(save, id, festivalsOf(pack))
  const line = talked ? fill(chatLineV4(save, pack, id, temperament ?? 'steady'), name, save.farmer.name) : null
  const paid = (points: number, words: string) => {
    setError(null)
    setNote(words)
    if (points > 0) onPaid(points)
  }
  const fail = (err: unknown) => setError(errorWords(err))
  return (
    <div className="space-y-2" data-love={id}>
      {line && <p className="rounded-md bg-sunken/70 px-3 py-2 text-[14px] italic" data-chat-line>{line}</p>}
      {(note || error) && <p role="status" className={`text-[13px] font-semibold ${error ? 'text-danger' : 'text-success'}`} data-love-note>{error ?? note}</p>}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" size="md" className="px-2!" disabled={talked} data-action="chat" onClick={() => void chatHer(id).then((r) => paid(r.paid, `${gain(r.paid)} ♥`), fail)}>
          {talked ? 'Chat ✓' : `Chat +${LOVE_POINTS.chat}`}
        </Button>
        <Button variant="secondary" size="md" className="px-2!" disabled={gave} onClick={() => setGiving(true)} data-action="gift">{gave ? 'Gift ✓' : 'Gift'}</Button>
        {evening.open ? (
          <Link to={withParam(location, 'evening', id)} state={{ back: true }} data-action="evening"
            className="font-display inline-flex min-h-12 items-center justify-center gap-1 rounded-sm bg-[#c2385e] px-2 text-[15px] font-semibold tracking-tight text-white shadow-1">
            <UiMark mark="hearts/evening" fallback={<span aria-hidden>☾</span>} />{evening.text}
          </Link>
        ) : (
          <Button variant="secondary" size="md" className="px-2! text-[14px]!" disabled data-action="evening">{evening.text}</Button>
        )}
      </div>
      {praise && (
        <Button size="md" className="w-full" data-action="praise" onClick={() => void praiseHer(id).then((r) => paid(r.paid, `${gain(r.paid)} ♥ Well done!`), fail)}>
          Praise +{LOVE_POINTS.praise}
        </Button>
      )}
      {giving && (
        <GiftPicker save={save} id={id} name={name} points={(good, stars) => giftPreview(save, pack, id, good, stars, birthdays)} onClose={() => setGiving(false)}
          onGive={(item, stars) => {
            setGiving(false)
            giftHer(id, item, stars).then((r) => {
              const said = fill(giftLineV4(save, pack, id, r.taste, item), name, save.farmer.name)
              paid(r.paid, r.paid > 0 ? `${said} ${gain(r.paid)}` : said)
            }, fail)
          }} />
      )}
    </div>
  )
}

/** The gift picker: every good in the Warehouse at each star held, by family, seeds left out, each with its points
 * for her today at those stars, or "?" where her taste for it isn't known yet. A tap gives one. */
export function GiftPicker({ save, id, name, points, onGive, onClose }: {
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
