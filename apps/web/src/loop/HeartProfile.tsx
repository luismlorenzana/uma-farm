// Her profile (F48 decision 6; romance spec RM53), a sheet over the Hearts tab at `?uma=<characterId>`. From the top: her
// face (the "+N" an act paid floats up from it), her level in words and her ● Ready chip, her line, birthday and house;
// then on its Hearts side the route as one track (F ◆ R ◇ S), the Next card (the rung, its perk, its place and setup in
// her bible's hint, the bar and what's banked, and what it waits for), Perks (reached ✓, the next, the rest greyed), Gifts
// as learnt (others +10), Ties (her bonds' hearts), Memories' count and her ring once given; on its Work side F21's sheet
// (her nine activities). Chat +15, Gift and Praise +20 sit in the thumb zone with Hearts | Work. Each section shows only
// what exists: F49's **Play ›** on the Next card when her event is Ready (what a setup needs said when it isn't, and **Ask
// her** after her confession's "Not yet"), and Memories' album (`?album=`); later packets fill Evening › (F50), the perks' effects,
// her pet name and keepsake (F51), the ring (F53) and her house (F54). F52's Ties: her closest friend first and marked,
// each bond's hearts and the points to the next, and **Read** for a pair's conversation opened and unread. Loaded on
// demand.
import { birthdaysOf, canAsk, LADDER_COLOURS, ladderOf, levelWords, readiness, type SaveV4, type Temperament } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Sheet, Tabs } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import type { MasterView } from '../master/master'
import { memoryCount, setupAdvice } from './event-view'
import { ReadyChip, RouteTrack } from './HeartMarks'
import {
  giftSlots, nextCard, perkList, profileLine, reachedWords, readParam, routeTrack, rungLadder, tieRows, type GiftSlot, type HeartsPack, type NextCard,
  type PerkView, type TieRow,
} from './hearts-view'
import { LoveActs } from './Love'
import { WorkFacts, WorkSide } from './RosterAlbum'
import type { LoopUmaRow } from './roster-view'
import { umaBadges } from './UmaMarks'

export type ProfileSide = 'hearts' | 'work'

export function HeartProfile({ save, pack, master, id, row, temperament, side, onSide, onClose }: {
  save: SaveV4
  pack: HeartsPack
  master: MasterView
  id: string
  /** Her album row, for the face's marks and the Work side. */
  row: LoopUmaRow | null
  temperament: Temperament | null
  side: ProfileSide
  onSide: (side: ProfileSide) => void
  onClose: () => void
}) {
  const [float, setFloat] = useState<{ points: number; key: number } | null>(null)
  const birthdays = useMemo(() => birthdaysOf(pack, master.birthdays), [pack, master])
  // Hearts | Work opens the other side at its top.
  const top = useRef<HTMLDivElement>(null)
  useEffect(() => {
    top.current?.scrollIntoView?.({ block: 'nearest' })
  }, [side])
  const love = save.love[id]
  if (!love) return null
  const nameOf = (other: string) => master.album.get(other)?.name ?? 'An Uma'
  const name = nameOf(id)
  const card = nextCard(save, pack, id, nameOf)
  const colour = LADDER_COLOURS[ladderOf(love.stage)]
  return (
    <Sheet
      open
      onClose={onClose}
      title={name}
      label={`${name}: her profile`}
      footer={
        <div className="space-y-2" data-profile-actions>
          <LoveActs save={save} pack={pack} id={id} name={name} temperament={temperament} master={master}
            onPaid={(points) => setFloat((f) => ({ points, key: (f?.key ?? 0) + 1 }))} />
          <Tabs label="Her profile" value={side} onChange={onSide} options={[{ value: 'hearts', label: 'Hearts' }, { value: 'work', label: 'Work' }]} />
        </div>
      }
    >
      <div ref={top} className="flex items-center gap-3 pb-3" data-profile={id} data-stage={love.stage} data-level={love.level} data-side={side}>
        <span className="relative block w-14 shrink-0">
          <FaceTile outfitId={id} size={56} badges={row ? umaBadges(row) : undefined} label={name} />
          {float && <span key={float.key} aria-hidden className="love-float pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-1.5 text-[14px] font-bold text-[#c2385e] shadow-1" data-love-float={float.points}>+{float.points}</span>}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold" style={{ color: colour }} data-level-words>{levelWords(love)}</span>
            {card.ready && <ReadyChip colour={colour} />}
          </p>
          {side === 'hearts' ? <p className="text-[13px] text-ink-soft" data-profile-line>{profileLine(save, pack, id, birthdays).join(' · ')}</p> : row && <WorkFacts row={row} />}
        </div>
      </div>
      {side === 'work'
        ? row && <WorkSide row={row} />
        : <HeartsSide save={save} pack={pack} id={id} card={card} nameOf={nameOf} />}
    </Sheet>
  )
}

/** The profile's Hearts side. */
function HeartsSide({ save, pack, id, card, nameOf }: { save: SaveV4; pack: HeartsPack; id: string; card: NextCard; nameOf: (id: string) => string }) {
  const love = save.love[id]!
  const track = routeTrack(love)
  const perks = perkList(save, pack, id)
  const gifts = giftSlots(pack, love, id)
  const ties = tieRows(save, pack, id)
  const location = useLocation()
  const played = track.filter((c) => c.state === 'played').length
  const advice = setupAdvice(readiness(save, pack, id).waits, nameOf)
  return (
    <div className="space-y-4 pb-2">
      <RouteTrack cells={track} label={`Her route: ${played} of ${track.length} played${card.rung ? `, ${card.title.toLowerCase()}` : ''}`} />
      <NextSection card={card} advice={advice}
        play={card.ready ? withParam(location, 'event', id) : null}
        ask={card.waits === 'friend' ? (canAsk(save, id) ? withParam(location, 'ask', id) : 'asked') : null} />
      {perks.length > 0 && <PerksSection perks={perks} />}
      <GiftsSection gifts={gifts} />
      {ties.length > 0 && (
        <Section title="Ties">
          <ul className="divide-y divide-hairline rounded-md border border-hairline" data-ties>
            {ties.map((tie) => <TieItem key={tie.with} id={id} tie={tie} nameOf={nameOf} />)}
          </ul>
        </Section>
      )}
      <Section title="Memories">
        <Link to={withParam(location, 'album', id)} state={{ back: true }} className="flex min-h-11 items-center justify-between text-[14px]" data-memories={(save.memories[id] ?? []).length} data-action="album">
          <span className="tabular-nums">{memoryCount(save, id)}</span>
          <span className="font-semibold text-accent-strong">Album ›</span>
        </Link>
      </Section>
      {love.ring !== undefined && (
        <Section title="Ring">
          <p className="text-[14px]" data-ring={love.ring}>+{love.ring}% at her line</p>
        </Section>
      )}
    </div>
  )
}

/** One tie (F48 decision 6; F52 decision 11): the other Uma's face, name and the tie's kind, "Closest" on her closest friend,
 * the points to the next bond heart, **Read** while a conversation of theirs waits, and the five bond hearts. */
function TieItem({ id, tie, nameOf }: { id: string; tie: TieRow; nameOf: (id: string) => string }) {
  const location = useLocation()
  return (
    <li className="flex min-h-12 items-center gap-2.5 px-3 py-1" data-tie={tie.with} data-hearts={tie.hearts} data-here={tie.here || undefined} data-closest={tie.closest || undefined}>
      <FaceTile outfitId={tie.with} size={32} label={nameOf(tie.with)} round className={tie.here ? '' : 'opacity-60'} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold">{nameOf(tie.with)}</span>
          {tie.closest && <span className="shrink-0 rounded-full bg-[#e0567a]/12 px-1.5 text-[11px] font-semibold text-[#c2385e]" data-closest-chip>Closest</span>}
        </span>
        <span className="block text-[12px] text-ink-soft tabular-nums">
          {tie.words}{tie.here && tie.next !== null ? ` · ${tie.points}/${tie.next}` : ''}
        </span>
      </span>
      {tie.unread.length > 0 && (
        <Link to={withParam(location, 'read', readParam(id, tie.with, tie.unread))} state={{ back: true }} data-action="read" data-read={tie.unread.join(',')}
          className="grid min-h-11 shrink-0 place-items-center rounded-full bg-[#c2385e] px-3 text-[13px] font-bold text-white">
          Read
        </Link>
      )}
      {tie.here
        ? <span className="shrink-0 text-[14px] tracking-[-1px]" aria-label={`Bond ${tie.hearts} of 5`}><span className="text-[#e0567a]">{'♥'.repeat(tie.hearts)}</span><span className="text-ink-faint/40">{'♥'.repeat(5 - tie.hearts)}</span></span>
        : <span className="shrink-0 text-[12px] font-semibold text-ink-faint" data-not-here>Not here yet</span>}
    </li>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="text-micro pb-1">{title}</h3>
      {children}
    </section>
  )
}

/** The Next card: the rung, its perk, its place and setup, the bar with what's banked, and what it waits for; **Play ›**
 * when her event is Ready (F49, RM54), what to do when its setup isn't met, and **Ask her** after a "Not yet" (once a
 * day; `ask` is 'asked' once asked today). */
function NextSection({ card, advice = null, play = null, ask = null }: { card: NextCard; advice?: string | null; play?: string | null; ask?: string | null }) {
  const colour = LADDER_COLOURS[card.rung ? rungLadder(card.rung) : 'spouse']
  const share = card.bar.cost > 0 ? Math.min(1, card.bar.points / card.bar.cost) : card.rung ? 1 : 0
  return (
    <section aria-label="Next" className="space-y-1.5 rounded-md border p-3" style={{ borderColor: `${colour}66` }} data-next={card.rung ?? 'done'}>
      <h3 className="font-display text-[16px] font-bold">{card.title}</h3>
      {card.perk && (
        <p className="text-[13px]" data-next-perk>
          <span className="text-ink-soft">Perk · </span>{card.perk.words}
          {card.perk.opens !== null && <span className="text-ink-faint"> · Opens with chapter {card.perk.opens}</span>}
        </p>
      )}
      {card.hint && <p className="text-[13px]" data-next-hint><span className="text-ink-soft">Event · </span>{card.hint}</p>}
      {card.rung && (
        <div className="space-y-0.5">
          <span aria-hidden className="block h-2.5 overflow-hidden rounded-full bg-sunken">
            <span className="block h-full rounded-full" style={{ width: `${Math.round(share * 100)}%`, background: colour }} data-bar-fill={Math.round(share * 100)} />
          </span>
          <p className="flex justify-between text-[12px] text-ink-soft tabular-nums" data-bar={`${card.bar.points}/${card.bar.cost}`} data-banked={card.bar.banked}>
            <span>{card.bar.cost > 0 ? `${card.bar.points.toLocaleString('en-US')} / ${card.bar.cost.toLocaleString('en-US')}` : ''}</span>
            {card.bar.banked > 0 && <span className="font-semibold" style={{ color: colour }}>+{card.bar.banked.toLocaleString('en-US')} banked</span>}
          </p>
        </div>
      )}
      <p className={`text-[14px] ${card.ready ? 'font-bold' : 'font-semibold text-ink-soft'}`} style={card.ready ? { color: colour } : undefined} data-next-words={card.waits ?? 'ready'}>
        {card.waits === 'away' ? <Link to="/dorm" className="text-accent-strong underline">{card.words}</Link> : card.words}
      </p>
      {advice && <p className="text-[13px] text-ink-soft" data-setup-advice>{advice}</p>}
      {play && (
        <Link to={play} state={{ back: true }} className="font-display grid min-h-12 place-items-center rounded-md text-[16px] font-bold text-white" style={{ background: colour }} data-action="play-event">
          Play ›
        </Link>
      )}
      {ask === 'asked' && <p className="text-[13px] text-ink-soft" data-asked>You asked her today. Ask again tomorrow.</p>}
      {ask && ask !== 'asked' && (
        <Link to={ask} state={{ back: true }} className="font-display grid min-h-12 place-items-center rounded-md border-2 text-[16px] font-bold" style={{ borderColor: colour, color: colour }} data-action="ask-her">
          Ask her ›
        </Link>
      )}
    </section>
  )
}

/** Perks: the reached ones by ladder, the next, and every perk on a tap (reached ✓, the next, the rest greyed). */
function PerksSection({ perks }: { perks: readonly PerkView[] }) {
  const [all, setAll] = useState(false)
  const reached = reachedWords(perks)
  const next = perks.find((p) => p.state === 'next')
  const label = (p: PerkView) => `${p.rung.toUpperCase()} · ${p.words}${p.opens !== null ? ` · Opens with chapter ${p.opens}` : ''}`
  return (
    <Section title="Perks">
      <div className="space-y-1 text-[13px]" data-perks>
        {reached && <p className="text-ink-soft" data-perks-reached>{reached}</p>}
        {next && <p data-perks-next><span className="font-semibold">Next · </span>{label(next)}</p>}
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="min-h-11 text-[13px] font-semibold text-accent-strong" data-action="all-perks">
          {all ? 'Hide the list' : `All ${perks.length} perks`}
        </button>
        {all && (
          <ul className="divide-y divide-hairline rounded-md border border-hairline" data-perk-list>
            {perks.map((p) => (
              <li key={p.id} className={`flex gap-2 px-3 py-1.5 ${p.state === 'ahead' ? 'text-ink-faint' : ''} ${p.state === 'next' ? 'font-semibold' : ''}`} data-perk={p.id} data-state={p.state}>
                <span className="w-7 shrink-0 tabular-nums">{p.rung.toUpperCase()}</span>
                <span className="min-w-0 flex-1">{p.words}{p.opens !== null && <span className="text-ink-faint"> · Opens with chapter {p.opens}</span>}</span>
                {p.state === 'reached' && <span className="shrink-0 text-success">✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}

const TASTE_LABEL: Readonly<Record<GiftSlot['taste'], string>> = { loved: 'Loved', liked: 'Liked', disliked: 'Disliked' }

/** Gifts as learnt: her loved, liked and disliked goods ("?" until known), each group's points at ★1, and "Others +10". */
function GiftsSection({ gifts }: { gifts: ReturnType<typeof giftSlots> }) {
  const groups = (['loved', 'liked', 'disliked'] as const).map((taste) => ({ taste, slots: gifts.slots.filter((s) => s.taste === taste) })).filter((g) => g.slots.length > 0)
  return (
    <Section title="Gifts">
      <ul className="space-y-1.5 text-[13px]" data-gifts>
        {groups.map((g) => (
          <li key={g.taste} className="flex items-center gap-2" data-gift-group={g.taste}>
            <span className="w-16 shrink-0 text-ink-soft">{TASTE_LABEL[g.taste]}</span>
            <span className="flex gap-1">
              {g.slots.map((s, i) => s.good
                ? <span key={i} className="grid size-8 place-items-center rounded-sm bg-sunken" data-gift-slot={s.good}><ItemIcon id={s.good} size={24} /></span>
                : <span key={i} className="grid size-8 place-items-center rounded-sm border border-dashed border-hairline-strong font-bold text-ink-faint" data-gift-slot="?">?</span>)}
            </span>
            <span className="ml-auto font-semibold tabular-nums">{g.slots[0]!.points > 0 ? `+${g.slots[0]!.points}` : '0'}</span>
          </li>
        ))}
        <li className="flex items-center gap-2" data-gift-group="others">
          <span className="text-ink-soft">{groups.length > 0 ? 'Others' : 'Any gift'}</span>
          <span className="ml-auto font-semibold tabular-nums">+{gifts.others}</span>
        </li>
      </ul>
    </Section>
  )
}
