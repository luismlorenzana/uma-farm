// Affinity on screen: her hearts, Chat and Gift on her card at the roster and on the
// visitor at the Gate, the gift's sheet (one good from the Warehouse at the stars you choose) and "She'd like to stay"
// when a visitor joins. Chats say a line by her temperament, her name filled in here. Loaded on demand with the roster
// and the farm map.
import {
  chatLine, FAMILY_NAMES, GOOD_FAMILIES, goodName, goodOf, heartsOf, HEART_POINTS, MAX_AFFINITY, STAY_AFFINITY, type SaveV3, type Taste, type Temperament,
} from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { chatWith, giveGift, type AffinityNote } from './actions'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

/** Ten hearts, the reached ones filled, and her points toward the next: "45/100". */
export function Hearts({ affinity, label }: { affinity: number; label?: string }) {
  const hearts = heartsOf(affinity)
  const toNext = affinity >= MAX_AFFINITY ? null : Math.floor(affinity - hearts * HEART_POINTS)
  return (
    <p className="flex items-center gap-1.5 text-[13px]" data-hearts={hearts} data-affinity={affinity} aria-label={label ?? `${hearts} of 10 hearts`}>
      <span aria-hidden className="tracking-[-1px] text-[#e0567a]">{'♥'.repeat(hearts)}<span className="text-ink-faint/50">{'♥'.repeat(10 - hearts)}</span></span>
      {toNext !== null && <span className="text-ink-soft tabular-nums">{toNext}/{HEART_POINTS}</span>}
    </p>
  )
}

/** A visitor's way to staying: her points of the 200 that ask her to. */
export function StayBar({ affinity }: { affinity: number }) {
  const share = Math.min(1, affinity / STAY_AFFINITY)
  return (
    <div className="space-y-1" data-stay={affinity}>
      <p className="flex justify-between text-[12px] text-ink-soft"><span>Stays at ♥ 2</span><span className="tabular-nums">{Math.floor(affinity)}/{STAY_AFFINITY}</span></p>
      <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-sunken">
        <span className="block h-full rounded-full bg-[#e0567a]" style={{ width: `${Math.round(share * 100)}%` }} />
      </span>
    </div>
  )
}

const TASTE_WORDS: Readonly<Record<Taste, string>> = { loved: 'She loves it!', liked: 'She likes it.', neutral: 'Thank you.', disliked: 'Not her thing.' }
const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '')

/** Chat and Gift: once a day each. After a chat her line for today shows; after a gift, what she thought. A
 * visitor reaching 2 hearts joins, and `onJoined` shows the card. */
export function TalkButtons({ save, outfitId, name, temperament, onJoined }: {
  save: SaveV3
  outfitId: string
  name: string
  temperament: Temperament | null
  onJoined?: (joined: NonNullable<AffinityNote['joined']>) => void
}) {
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)
  const talked = save.today.chats.includes(outfitId)
  const gave = save.today.gifts.includes(outfitId)
  const line = talked ? chatLine(save, outfitId, temperament ?? 'steady').split('{name}').join(name) : null
  const done = (result: AffinityNote, words: string) => {
    setError(null)
    setNote(words)
    if (result.joined) onJoined?.(result.joined)
  }
  return (
    <div className="space-y-2" data-talk={outfitId}>
      {line && <p className="rounded-md bg-sunken/70 px-3 py-2 text-[14px] italic" data-chat-line>{line}</p>}
      {(note || error) && (
        <p role="status" className={`text-[13px] font-semibold ${error ? 'text-danger' : 'text-success'}`} data-talk-note>{error ?? note}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={talked} data-action="chat"
          onClick={() => void chatWith(outfitId).then((r) => done(r, `${signed(r.to - r.from)} ♥`), (err: unknown) => setError(errorWords(err)))}>
          {talked ? 'Talked today' : 'Chat'}
        </Button>
        <Button variant="secondary" disabled={gave} onClick={() => setGiving(true)} data-action="gift">{gave ? 'Gift given' : 'Gift'}</Button>
      </div>
      {giving && (
        <GiftSheet save={save} name={name} onClose={() => setGiving(false)}
          onGive={(item, stars) => {
            setGiving(false)
            giveGift(outfitId, item, stars).then((r) => done(r, `${TASTE_WORDS[r.taste ?? 'neutral']} ${signed(r.to - r.from)}`.trim()), (err: unknown) => setError(errorWords(err)))
          }} />
      )}
    </div>
  )
}

/** The gift's sheet: every good in the Warehouse at each star held, by family, seeds left out. A tap gives
 * one. */
export function GiftSheet({ save, name, onGive, onClose }: { save: SaveV3; name: string; onGive: (item: string, stars: number) => void; onClose: () => void }) {
  const groups = GOOD_FAMILIES.map((family) => ({
    family,
    rows: Object.entries(save.items).flatMap(([id, row]) => {
      const good = goodOf(id)
      return good?.family === family ? row.flatMap((n, i) => (n > 0 ? [{ id, stars: i + 1, count: n, grade: good.grade, refined: good.refined }] : [])) : []
    }).sort((a, b) => Number(a.refined) - Number(b.refined) || a.grade - b.grade || a.id.localeCompare(b.id) || a.stars - b.stars),
  })).filter((g) => g.rows.length > 0)
  return (
    <Sheet open onClose={onClose} title={`A gift for ${name}`} label="Choose a gift">
      {groups.length === 0 && <p className="py-2 text-ink-soft">Nothing to give yet: bring something home first.</p>}
      <div className="space-y-3 pb-2" data-gift-sheet>
        {groups.map((g) => (
          <section key={g.family} aria-label={FAMILY_NAMES[g.family]}>
            <h3 className="text-micro pb-1">{FAMILY_NAMES[g.family]}</h3>
            <ul className="divide-y divide-hairline rounded-md border border-hairline">
              {g.rows.map((r) => (
                <li key={`${r.id}@${r.stars}`}>
                  <button type="button" onClick={() => onGive(r.id, r.stars)} data-gift={`${r.id}@${r.stars}`}
                    className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-[15px]">
                    <ItemIcon id={r.id} size={28} />
                    <span className="min-w-0 flex-1 truncate">{goodName(r.id)}</span>
                    <span className="shrink-0 text-[13px] text-ink-soft tabular-nums">★{r.stars} × {r.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}

/** "She'd like to stay": the visitor joins at 2 hearts, home while a bed is free, else away. */
export function JoinCard({ outfitId, home, name, onClose }: { outfitId: string; home: boolean; name: string; onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title="She’d like to stay" label={`${name} joins the farm`}
      footer={<Button className="w-full" onClick={onClose} data-action="welcome">Welcome</Button>}>
      <div className="flex flex-col items-center gap-2 pb-2 text-center" data-joined={outfitId} data-home={home}>
        <UmaBust outfitId={outfitId} label={name} size={160} />
        <p className="font-display text-[18px] font-semibold">{name} joins the farm.</p>
        {home
          ? <p className="text-[14px] text-ink-soft">She’s on the farm from today.</p>
          : <p className="text-[14px] text-ink-soft">No bed is free, so she’s away for now. <Link to="/dorm" className="font-semibold text-accent-strong underline" onClick={onClose}>Swap her in at the Dorm</Link>.</p>}
      </div>
    </Sheet>
  )
}
