// Her acts on her profile (on the Hearts tab): Chat (one action, +15; then today's talk plays on the dialogue engine,
// `?life=talk:<id>`: her greeting, then her line or a small talk, and stays above the buttons), Gift (one action: the picker with each good's points for her today, or "?") and Praise +20 while earned, 48 pt in
// the profile's thumb zone. What an act paid goes up to the profile (`onPaid`), which floats it from her face; a note
// says it, a gift in her words by her taste (the default story's: "‹name› smiles. “Carrot? That’s lovely.” +36"). **Evening ›** is there too (her evening at `?evening=<id>`, or why not:
// "Evening ✓", "Evening · F3", "In town", "At home", "Evening spent"; an evening takes 2 actions), so Chat, Gift and
// Evening sit side by side and Praise +20 takes the row under them. **Where you meet her:** Chat, Gift, her evening and
// **Invite her to work · 1** (a friend, once) need her in front of you: on the farm when she lives there or works it by
// day, else in town where she is today, once you've gone into town (`whereYouMeet`); otherwise a line says where she is,
// a tap to her in town ("At the Café today ›"), or "At home today". The invitation's scene plays as soon as it's spent
// (`?life=invited-to-work:<id>`). Her Ready event (Play · 1 on the Next card) plays from anywhere. Loaded on demand with
// the Hearts tab.
import {
  actionsLeft, birthdaysOf, canPraise, FAMILY_NAMES, FRIEND_FROM, GOOD_FAMILIES, giftLineV4, giftPreview, goodName, goodOf, isBirthday, isDishId, isFarmhand, LOVE_POINTS, todaysTalk,
  townLocation, whereYouMeet, workBlock, YOU, type SaveV4, type StoryPack, type Temperament,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import type { MasterView } from '../master/master'
import { workOnce } from '../town/town-actions'
import { chatHer, giftHer, praiseHer } from './actions'
import { eveningButton } from './evening-view'
import { gain } from './love-words'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** A line with its placeholders filled: `{farmer}` (the format's only one) and `{name}` (the default story's). */
const fill = (line: string, name: string, farmer: string): string => line.split('{farmer}').join(farmer || 'you').split('{name}').join(name)

/** Chat, Gift and Praise, with today's chat line and the last act's note above them. */
export function LoveActs({ save, pack, id, name, temperament, master, onPaid }: {
  save: SaveV4
  pack: Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'world' | 'master' | 'town'>>
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
  const navigate = useNavigate()
  const birthdays = useMemo(() => birthdaysOf(pack, master.birthdays), [pack, master])
  // Where you'd find her now: talks, gifts and the invitation to work need her in front of you.
  const meet = useMemo(() => whereYouMeet(save, pack, id), [save, pack, id])
  if (!save.love[id]) return null
  const talked = save.today.chats.includes(id)
  const gave = save.today.gifts.includes(id)
  const praise = canPraise(save, id)
  // A talk and a gift each take an action, with her in front of you.
  const out = actionsLeft(save) === 0 || !meet.here
  const work = workBlock(save, id)
  const invite = !isFarmhand(save, id) && work !== `From Friendship ${FRIEND_FROM}` && work !== 'Meet her first.'
  const evening = eveningButton(save, pack, id)
  // Today's talk, once you've had it: her greeting, then her line or a small talk (yours under your name).
  const talk = talked ? todaysTalk(save, pack, id, temperament ?? 'steady', birthdays).steps.flatMap((s) => ('say' in s ? [s] : [])) : []
  const paid = (points: number, words: string) => {
    setError(null)
    setNote(words)
    if (points > 0) onPaid(points)
  }
  const fail = (err: unknown) => setError(errorWords(err))
  return (
    <div className="space-y-2" data-love={id}>
      {talk.length > 0 && (
        <div className="space-y-0.5 rounded-md bg-sunken/70 px-3 py-2 text-[14px]" data-chat-line>
          {talk.map((s, i) => (
            <p key={i} className={s.say === YOU ? 'text-ink-soft' : 'italic'} data-talk-line={s.say === YOU ? 'you' : 'her'}>
              {s.say === YOU && <span className="font-semibold not-italic">{save.farmer.name || 'You'}: </span>}{fill(s.line, name, save.farmer.name)}
            </p>
          ))}
        </div>
      )}
      {(note || error) && <p role="status" className={`text-[13px] font-semibold ${error ? 'text-danger' : 'text-success'}`} data-love-note>{error ?? note}</p>}
      {!meet.here && <MeetLine pack={pack} id={id} at={meet.at} />}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" size="md" className="px-2!" disabled={talked || out} data-action="chat" aria-label={talked ? 'Chat done today' : `Chat, +${LOVE_POINTS.chat}, 1 action`}
          onClick={() => void chatHer(id).then((r) => {
            paid(r.paid, `${gain(r.paid)} ♥`)
            // Today's talk plays on the dialogue engine, over the profile.
            navigate(withParam(location, 'life', `talk:${id}`), { state: { back: true } })
          }, fail)}>
          {talked ? 'Chat ✓' : 'Chat · 1'}
        </Button>
        <Button variant="secondary" size="md" className="px-2!" disabled={gave || out} onClick={() => setGiving(true)} data-action="gift">{gave ? 'Gift ✓' : 'Gift · 1'}</Button>
        {evening.open ? (
          <Link to={withParam(location, 'evening', id)} state={{ back: true }} data-action="evening"
            className="font-display inline-flex min-h-12 items-center justify-center gap-1 rounded-sm bg-[#c2385e] px-2 text-[15px] font-semibold tracking-tight text-white shadow-1">
            <UiMark mark="hearts/evening" fallback={<span aria-hidden>☾</span>} />{evening.text}
          </Link>
        ) : (
          <Button variant="secondary" size="md" className="px-2! text-[14px]!" disabled data-action="evening">{evening.text}</Button>
        )}
      </div>
      {invite && (
        <Button variant="secondary" size="md" className="w-full" disabled={work !== null || !meet.here} data-action="invite-work"
          onClick={() => void workOnce(id).then(() => {
            setError(null)
            setNote('Farmhand ✓ She works the farm from today.')
            // Her scene plays over the profile, the action spent.
            navigate(withParam(location, 'life', `invited-to-work:${id}`), { state: { back: true } })
          }, fail)}>
          Invite her to work · 1
        </Button>
      )}
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
              const said = fill(giftLineV4(save, pack, id, r.taste, item, isBirthday(birthdays, id, save.calendar.day, save.calendar)), name, save.farmer.name)
              paid(r.paid, r.paid > 0 ? `${said} ${gain(r.paid)}` : said)
            }, fail)
          }} />
      )}
    </div>
  )
}

/** Where she is when she isn't in front of you: in town today at her place (a tap goes to her there; "go into town" first
 * if you haven't), or at home. */
function MeetLine({ pack, id, at }: { pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>; id: string; at: string | null }) {
  const place = at ? townLocation(pack, at)?.name ?? null : null
  if (!at) return <p className="text-[13px] text-ink-soft" data-meet="home">At home today. Find her in town on her days.</p>
  return (
    <p className="flex min-h-11 items-center justify-between gap-2 text-[13px] text-ink-soft" data-meet={at}>
      <span>In town today, at {place ?? 'her place'}. Talks and gifts are in person.</span>
      <Link to={`/town?at=${at}&uma=${id}`} state={{ back: true }} className="shrink-0 font-semibold text-accent-strong underline" data-action="find-her">Find her ›</Link>
    </p>
  )
}

/** The gift picker: every good in the Warehouse at each star held, by family, then the Kitchen's dishes, seeds left out, each with its points
 * for her today at those stars, or "?" where her taste for it isn't known yet. A tap gives one. */
export function GiftPicker({ save, id, name, points, onGive, onClose }: {
  save: SaveV4
  id: string
  name: string
  points: (good: string, stars: number) => number | null
  onGive: (item: string, stars: number) => void
  onClose: () => void
}) {
  const groups = [
    ...GOOD_FAMILIES.map((family) => ({
      family: FAMILY_NAMES[family],
      rows: Object.entries(save.items).flatMap(([good, row]) => {
        const g = goodOf(good)
        return g?.family === family ? row.flatMap((n, i) => (n > 0 ? [{ good, stars: i + 1, count: n, grade: g.grade, refined: g.refined }] : [])) : []
      }).sort((a, b) => Number(a.refined) - Number(b.refined) || a.grade - b.grade || a.good.localeCompare(b.good) || a.stars - b.stars),
    })),
    // The Kitchen's dishes are gifts too.
    { family: 'Dishes', rows: Object.entries(save.items).flatMap(([good, row]) => (isDishId(good) ? row.flatMap((n, i) => (n > 0 ? [{ good, stars: i + 1, count: n, grade: 0, refined: false }] : [])) : [])) },
  ].filter((g) => g.rows.length > 0)
  return (
    <Sheet open onClose={onClose} title={`A gift for ${name}`} label="Choose a gift">
      {groups.length === 0 && <p className="py-2 text-ink-soft">Nothing to give yet: bring something home first.</p>}
      <div className="space-y-3 pb-2" data-gift-sheet={id}>
        {groups.map((g) => (
          <section key={g.family} aria-label={g.family}>
            <h3 className="text-micro pb-1">{g.family}</h3>
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
