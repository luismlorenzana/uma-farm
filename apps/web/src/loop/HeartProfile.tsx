// Her profile, a wide sheet over the Hearts tab at `?uma=<characterId>`. From the top: her
// face (the "+N" an act paid floats up from it), her stage in the Uma loop (Acquaintance, Friend, Farmhand, Sweetheart,
// Engaged, Married), her level in words and her ● Ready chip, her line, birthday and house;
// then on its Hearts side the route as one track (F ◆ R ◇ S), the Next card (the rung, its perk, its place and setup in
// her bible's hint, the bar and what's banked, and what it waits for), Perks (reached ✓, the next, the rest greyed), Gifts
// as learnt (others +10), Ties (her bonds' hearts), Memories' count and her ring once given; on its Work side the sheet
// (her nine activities). Chat and Gift (an action each) and Praise +20 sit at the panel's foot; Hearts | Work under her face, held at
// the panel's top as it scrolls. Each section shows only
// what exists: **Play · 1 ›** (her event costs an action) on the Next card when her event is Ready (what a setup needs said when it isn't, and **Ask
// her** after her confession's "Not yet"), Memories' album (`?album=`) and, for an Uma with illustrations, her Gallery
// (`?gallery=`: "3 of 9"); Evening ›, the perks' effects,
// the ring and her house. Ties: her closest friend first and marked, each bond's hearts and the points to
// the next, and **Read** for a pair's conversation opened and unread. Perks: each reached perk with what it does now,
// her closest friend's loved gift in Gifts from Friendship 7, and **From her**: her pet name for you from Romance 1 and her
// keepsake from Friendship 10. **Ring**: from Romance 8 the engraving her ring will carry (her R8 beat's line), from
// the proposal her ring and its bonus at her line, and **Give her the Cobalt Ring** for any better one in the Warehouse (the
// old one comes back); "Needs a ring" links to the Forge's bench. One you've met who lives in town has, under her face,
// **Where to find her** (today's place with Find her ›, and this season's days and places, her fixed schedule; a
// farmhand's farm days and town days), then "Lives in town" and that she moves to the farm after your wedding (a spouse
// waiting for a room: once a room is free). **Chapters**,
// under the Next card: her chapters (the pack's or the four defaults), the one she's in with its events played and to
// come, a gate's words ("Opens when the Kitchen is built"), and what opens the next. Loaded on demand.
import {
  atHome, awayOn, birthdaysOf, canAsk, galleryOf, LADDER_COLOURS, ladderOf, levelWords, readiness, STAGE_NAMES, umaStage, type SaveV4, type StoryPack, type Temperament,
} from '@farm/domain'
import { giveBetterRing } from './bench-actions'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Sheet, Tabs } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { useIllustrationsOf } from '../dialogue/illustrations'
import { ItemIcon } from '../items/ItemIcon'
import type { MasterView } from '../master/master'
import { nameOfAnyone } from '../story/people'
import { memoryCount, setupAdvice } from './event-view'
import { ReadyChip, RouteTrack } from './HeartMarks'
import {
  chaptersView, friendLoved, fromHer, giftSlots, lovedWords, nextCard, perkList, profileLine, reachedWords, readParam, ringView, routeTrack, rungLadder, tieRows, type FromHer, type GiftSlot,
  type ChaptersView, type HeartsPack, type NextCard, type PerkView, type RingView, type TieRow,
} from './hearts-view'
import { LoveActs } from './Love'
import { opensWhenBuilt } from './love-words'
import { findHer } from './schedule-words'
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
  // Her ties may name a sister or one of the town's people: master data's and the pack's names for anyone.
  const nameOf = (other: string) => nameOfAnyone(master, pack as StoryPack, other)
  const name = nameOf(id)
  const card = nextCard(save, pack, id, nameOf)
  const colour = LADDER_COLOURS[ladderOf(love.stage)]
  const stage = umaStage(save, id)
  return (
    <Sheet
      open
      onClose={onClose}
      size="wide"
      title={name}
      label={`${name}: her profile`}
      footer={
        <div data-profile-actions>
          <LoveActs save={save} pack={pack} id={id} name={name} temperament={temperament} master={master}
            onPaid={(points) => setFloat((f) => ({ points, key: (f?.key ?? 0) + 1 }))} />
        </div>
      }
    >
      <div ref={top} className="flex items-center gap-3 pb-3" data-profile={id} data-stage={love.stage} data-level={love.level} data-side={side}>
        <span className="relative block w-14 shrink-0">
          <Avatar id={id} size={56} badges={row ? umaBadges(row) : undefined} label={name} />
          {float && <span key={float.key} aria-hidden className="love-float pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-1.5 text-[14px] font-bold text-[#c2385e] shadow-1" data-love-float={float.points}>+{float.points}</span>}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {stage && <span className="rounded-full px-2 py-0.5 text-[12px] font-bold" style={{ color: colour, background: `${colour}1f` }} data-stage-name={stage}>{STAGE_NAMES[stage]}</span>}
            <span className="text-[15px] font-semibold" style={{ color: colour }} data-level-words>{levelWords(love)}</span>
            {card.ready && <ReadyChip colour={colour} />}
          </p>
          {side === 'hearts' ? <p className="text-[13px] text-ink-soft" data-profile-line>{profileLine(save, pack, id, birthdays).join(' · ')}</p> : row && <WorkFacts row={row} />}
        </div>
      </div>
      {/* Hearts | Work under her face, held at the panel's top as it scrolls, so the acts' row is the whole foot. */}
      <div className="sticky top-0 z-10 -mx-4 bg-panel px-4 pb-3" data-profile-sides>
        <Tabs label="Her profile" value={side} onChange={onSide} options={[{ value: 'hearts', label: 'Hearts' }, { value: 'work', label: 'Work' }]} />
      </div>
      {(!atHome(save, id) || pack.town?.professions?.length || awayOn(save, id, save.calendar.day)) && <TownCard save={save} pack={pack} id={id} />}
      {side === 'work'
        ? row && <WorkSide row={row} />
        : <HeartsSide save={save} pack={pack} id={id} card={card} nameOf={nameOf} />}
    </Sheet>
  )
}

/** She lives in town: **Where to find her** (today, and this season's days and places, from her fixed schedule; a
 * farmhand's farm days and town days), then "Lives in town": she moves to the farm after your wedding, or a spouse
 * waiting for a room once one is free. */
export function TownCard({ save, pack, id }: { save: SaveV4; pack: HeartsPack; id: string }) {
  const find = findHer(save, pack, id)
  const waiting = save.love[id]?.stage === 'spouse'
  return (
    <section className="mb-3 space-y-2 rounded-md border border-hairline bg-sunken/50 p-3" aria-label="Where she lives" data-town-card>
      <div className="space-y-0.5 text-[13px]" aria-label="Where to find her" data-find-her={find.at ?? (find.farm ? 'farm' : 'home')}>
        <p className="text-micro">Where to find her</p>
        <p className="flex min-h-8 items-center justify-between gap-2" data-find-today>
          <span><span className="font-semibold">Today</span> · {find.today}</span>
          {find.at && <Link to={`/town?at=${find.at}&uma=${id}`} state={{ back: true }} className="shrink-0 font-semibold text-accent-strong underline" data-action="find-her-today">Find her ›</Link>}
        </p>
        {find.lines.map((l, i) => (
          <p key={i} className="text-ink-soft" data-find-line={l.at ?? 'home'}>{i === 0 && <span className="font-semibold text-ink">{find.season} · </span>}{l.text}</p>
        ))}
      </div>
      {!atHome(save, id) && <p className="text-[14px]" data-lives-in-town><span className="font-semibold">Lives in town</span>
        <span className="text-ink-soft"> · {waiting ? 'moves to the farm once a room is free' : 'moves to the farm after your wedding'}</span></p>}
    </section>
  )
}

/** The profile's Hearts side. */
function HeartsSide({ save, pack, id, card, nameOf }: { save: SaveV4; pack: HeartsPack; id: string; card: NextCard; nameOf: (id: string) => string }) {
  const location = useLocation()
  return (
    <div className="space-y-4 pb-2">
      <ProfileChapters save={save} pack={pack} id={id} card={card} nameOf={nameOf} />
      <ProfileDetails save={save} pack={pack} id={id} nameOf={nameOf} />
      <Section title="Memories">
        <Link to={withParam(location, 'album', id)} state={{ back: true }} className="flex min-h-11 items-center justify-between text-[14px]" data-memories={(save.memories[id] ?? []).length} data-action="album">
          <span className="tabular-nums">{memoryCount(save, id)}</span>
          <span className="font-semibold text-accent-strong">Album ›</span>
        </Link>
      </Section>
      <GallerySection save={save} id={id} />
    </div>
  )
}

export function ProfileChapters({ save, pack, id, card, nameOf }: { save: SaveV4; pack: HeartsPack; id: string; card: NextCard; nameOf: (id: string) => string }) {
  const love = save.love[id]!
  const track = routeTrack(love)
  const perks = perkList(save, pack, id, nameOf)
  const location = useLocation()
  const played = track.filter((c) => c.state === 'played').length
  const advice = setupAdvice(readiness(save, pack, id).waits, nameOf)
  const ring = ringView(save, pack, id)
  const chapters = chaptersView(save, pack, id, nameOf)
  return (
    <div className="space-y-4 pb-2">
      <RouteTrack cells={track} label={`Her route: ${played} of ${track.length} played${card.rung ? `, ${card.title.toLowerCase()}` : ''}`} />
      <NextSection card={card} advice={advice} bench={card.waits === 'ring' && ring?.bench === true}
        play={card.ready ? withParam(location, 'event', id) : null}
        ask={card.waits === 'friend' ? (canAsk(save, id) ? withParam(location, 'ask', id) : 'asked') : null} />
      <ChaptersSection view={chapters} colour={LADDER_COLOURS[ladderOf(love.stage)]} />
      {perks.length > 0 && <PerksSection perks={perks} />}
    </div>
  )
}

export function ProfileDetails({ save, pack, id, nameOf }: { save: SaveV4; pack: HeartsPack; id: string; nameOf: (id: string) => string }) {
  const gifts = giftSlots(pack, save.love[id]!, id)
  const friend = friendLoved(save, pack, id)
  const hers = fromHer(save, pack, id)
  const ties = tieRows(save, pack, id)
  const ring = ringView(save, pack, id)
  return (
    <div className="space-y-4">
      {(hers.petName || hers.keepsake) && <FromHerSection hers={hers} />}
      <GiftsSection gifts={gifts} friend={friend ? lovedWords(friend.friend, friend.good, nameOf) : null} friendGood={friend?.good ?? null} />
      {ties.length > 0 && (
        <Section title="Ties">
          <ul className="divide-y divide-hairline rounded-md border border-hairline" data-ties>
            {ties.map((tie) => <TieItem key={tie.with} id={id} tie={tie} nameOf={nameOf} />)}
          </ul>
        </Section>
      )}
      {ring && <RingSection id={id} ring={ring} />}
    </div>
  )
}

/** Her Gallery: her illustrations seen of all hers ("3 of 9"), and **Open ›** (`?gallery=`). Only for an Uma master data
 * holds illustrations for (her manifest, read once; nothing is fetched for anyone else). */
function GallerySection({ save, id }: { save: SaveV4; id: string }) {
  const location = useLocation()
  const ills = useIllustrationsOf(id)
  if (!ills) return null
  const seen = galleryOf(save, id)
  const unlocked = ills.scenes.filter((s) => seen.includes(s.id)).length
  return (
    <Section title="Gallery">
      <Link to={withParam(location, 'gallery', id)} state={{ back: true }} className="flex min-h-11 items-center justify-between text-[14px]" data-gallery-count={unlocked} data-action="gallery">
        <span className="tabular-nums">{unlocked} of {ills.scenes.length}</span>
        <span className="font-semibold text-accent-strong">Open ›</span>
      </Link>
    </Section>
  )
}

/** Her Ring: the engraving, her ring and its bonus, and a better ring to give. */
function RingSection({ id, ring }: { id: string; ring: RingView }) {
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const give = async (better: RingView['better'][number]) => {
    if (busy) return
    setBusy(true)
    try {
      await giveBetterRing(id, better.id)
      setNote(`She wears the ${better.name} now${ring.ring ? `; the ${ring.ring.name} is back in the Warehouse` : ''}.`)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'That didn’t work. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Section title="Ring">
      <div className="space-y-1.5 text-[14px]" data-ring={ring.ring?.grade ?? 'none'}>
        {ring.engraving && <p data-engraving><span className="text-ink-soft">{ring.reads}: </span><span className="italic">‘{ring.engraving}’</span></p>}
        {ring.ring && (
          <p className="flex items-center gap-2" data-ring-bonus>
            <ItemIcon id={`ring-g${ring.ring.grade}`} size={24} />
            <span className="font-semibold">{ring.ring.name}</span>
            <span className="text-ink-soft">· {ring.ring.bonus}</span>
          </p>
        )}
        {ring.better.map((b) => (
          <button key={b.id} type="button" disabled={busy} onClick={() => void give(b)} data-action="better-ring" data-better={b.id}
            className="flex min-h-11 w-full items-center gap-2 rounded-md border border-hairline px-3 text-left font-semibold text-accent-strong">
            <ItemIcon id={b.id} size={24} />
            <span className="min-w-0 flex-1">Give her the {b.name} ›</span>
            <span className="shrink-0 text-[13px] font-normal text-ink-soft">{b.bonus}</span>
          </button>
        ))}
        {note && <p className="text-[13px] text-ink-soft" data-ring-note>{note}</p>}
      </div>
    </Section>
  )
}

/** One tie: the other Uma's face, name and the tie's kind, "Closest" on her closest friend,
 * the points to the next bond heart, **Read** while a conversation of theirs waits, and the five bond hearts. */
function TieItem({ id, tie, nameOf }: { id: string; tie: TieRow; nameOf: (id: string) => string }) {
  const location = useLocation()
  return (
    <li className="flex min-h-12 items-center gap-2.5 px-3 py-1" data-tie={tie.with} data-hearts={tie.hearts} data-here={tie.here || undefined} data-closest={tie.closest || undefined}>
      <Avatar id={tie.with} size={32} label={nameOf(tie.with)} className={tie.here ? '' : 'opacity-60'} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-semibold">{nameOf(tie.with)}</span>
          {tie.closest && <span className="shrink-0 rounded-full bg-[#e0567a]/12 px-1.5 text-[11px] font-semibold text-[#c2385e]" data-closest-chip>Closest</span>}
        </span>
        <span className="block text-[12px] text-ink-soft tabular-nums">
          {tie.town ? `${tie.words} · ${tie.line}` : `${tie.words}${tie.here && tie.next !== null ? ` · ${tie.points}/${tie.next}` : ''}`}
        </span>
      </span>
      {tie.unread.length > 0 && (
        <Link to={withParam(location, 'read', readParam(id, tie.with, tie.unread))} state={{ back: true }} data-action="read" data-read={tie.unread.join(',')}
          className="grid min-h-11 shrink-0 place-items-center rounded-full bg-[#c2385e] px-3 text-[13px] font-bold text-white">
          Read
        </Link>
      )}
      {tie.town
        ? <Link to={`/town?talk=${tie.with}`} state={{ back: true }} className="grid min-h-11 shrink-0 place-items-center text-[12px] font-semibold text-accent-strong" data-in-town>In town ›</Link>
        : tie.here
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

/** The Next card: the rung, its perk, its place and setup, the bar with what's banked, and what it waits for; **Play · 1 ›**
 * when her event is Ready, what to do when its setup isn't met, and **Ask her** after a "Not yet" (once a
 * day; `ask` is 'asked' once asked today). */
function NextSection({ card, advice = null, play = null, ask = null, bench = false }: { card: NextCard; advice?: string | null; play?: string | null; ask?: string | null; bench?: boolean }) {
  const colour = LADDER_COLOURS[card.rung ? rungLadder(card.rung) : 'spouse']
  const share = card.bar.cost > 0 ? Math.min(1, card.bar.points / card.bar.cost) : card.rung ? 1 : 0
  return (
    <section aria-label="Next" className="space-y-1.5 rounded-md border p-3" style={{ borderColor: `${colour}66` }} data-next={card.rung ?? 'done'}>
      <h3 className="font-display text-[16px] font-bold">{card.title}</h3>
      {card.perk && (
        <p className="text-[13px]" data-next-perk>
          <span className="text-ink-soft">Perk · </span>{card.perk.words}
          {card.perk.opens !== null && <span className="text-ink-faint"> · {opensWhenBuilt(card.perk.opens)}</span>}
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
        {card.words}
      </p>
      {advice && <p className="text-[13px] text-ink-soft" data-setup-advice>{advice}</p>}
      {bench && <Link to="/?sheet=bench" state={{ back: true }} className="block min-h-11 py-2 text-[14px] font-semibold text-accent-strong" data-action="to-bench">Make one at the Forge’s bench ›</Link>}
      {play && (
        <Link to={play} state={{ back: true }} aria-label="Play her event · 1 action" className="font-display grid min-h-12 place-items-center rounded-md text-[16px] font-bold text-white" style={{ background: colour }} data-action="play-event">
          Play · 1 ›
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

/** Her chapters: each with its number (✓ once told), title and events played of all; the one she's in in her ladder's
 * colour with its events as chips, played ✓ and to come; a gate's words while it waits; then what opens the next, or,
 * once her route is complete, her last chapter closed. */
function ChaptersSection({ view, colour }: { view: ChaptersView; colour: string }) {
  const current = view.chapters.find((c) => c.state === 'current')?.n ?? null
  return (
    <Section title="Chapters">
      <ol className="divide-y divide-hairline rounded-md border border-hairline" data-chapters={view.chapters.length} data-current={current ?? 'closed'}>
        {view.chapters.map((c) => (
          <li key={c.n} className="space-y-1 px-3 py-2" data-chapter={c.n} data-state={c.state}>
            <p className="flex min-h-6 items-center gap-2 text-[14px]">
              <span className={`w-5 shrink-0 text-center tabular-nums ${c.state === 'done' ? 'text-success' : 'text-ink-soft'}`} aria-hidden>{c.state === 'done' ? '✓' : c.n}</span>
              <span className={`min-w-0 flex-1 truncate ${c.state === 'current' ? 'font-bold' : c.state === 'ahead' ? 'text-ink-faint' : ''}`}
                style={c.state === 'current' ? { color: colour } : undefined} data-chapter-title>
                {c.title}
              </span>
              <span className="shrink-0 text-[12px] text-ink-soft tabular-nums" aria-label={`${c.played} of ${c.events.length} played`}>{c.played}/{c.events.length}</span>
            </p>
            {c.state === 'current' && (
              <ul className="flex flex-wrap gap-1 pl-7" aria-label="Its events" data-chapter-events>
                {c.events.map((e) => (
                  <li key={e.rung} className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${e.played ? 'text-white' : 'border border-hairline-strong text-ink-soft'}`}
                    style={e.played ? { background: colour } : undefined} data-event={e.rung} data-played={e.played || undefined}>
                    {e.played ? `✓ ${e.label}` : e.label}
                  </li>
                ))}
              </ul>
            )}
            {c.gate && !(view.next && c.n === (current ?? 0) + 1) && <p className="pl-7 text-[12px] font-semibold text-ink-soft" data-chapter-gate>{c.gate}</p>}
          </li>
        ))}
      </ol>
      {view.next && (
        <p className="pt-1.5 text-[13px]" data-chapter-next>
          <span className="text-ink-soft">Next · </span><span className="font-semibold">{view.next.title}</span>
          <span className="text-ink-soft"> · {view.next.after}{view.next.gate ? ` · ${view.next.gate}` : ''}</span>
        </p>
      )}
      {view.closed && <p className="pt-1.5 text-[13px] text-ink-soft" data-chapters-closed>Her last chapter is closed. Life at home goes on.</p>}
    </Section>
  )
}

/** Perks: the reached ones by ladder, what the reached ones do now, the next, and every perk on a tap (reached ✓ with
 * its now, the next, the rest greyed). */
function PerksSection({ perks }: { perks: readonly PerkView[] }) {
  const [all, setAll] = useState(false)
  const reached = reachedWords(perks)
  const next = perks.find((p) => p.state === 'next')
  const now = perks.filter((p) => p.state === 'reached' && p.now !== null)
  const label = (p: PerkView) => `${p.rung.toUpperCase()} · ${p.words}${p.opens !== null ? ` · ${opensWhenBuilt(p.opens)}` : ''}`
  return (
    <Section title="Perks">
      <div className="space-y-1 text-[13px]" data-perks>
        {reached && <p className="text-ink-soft" data-perks-reached>{reached}</p>}
        {now.length > 0 && (
          <ul className="space-y-0.5" data-perks-now>
            {now.map((p) => (
              <li key={p.id} className="flex gap-2" data-perk-now={p.id}>
                <span className="w-7 shrink-0 tabular-nums text-ink-soft">{p.rung.toUpperCase()}</span>
                <span className="min-w-0 flex-1">{p.now}</span>
              </li>
            ))}
          </ul>
        )}
        {next && <p data-perks-next><span className="font-semibold">Next · </span>{label(next)}</p>}
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="min-h-11 text-[13px] font-semibold text-accent-strong" data-action="all-perks">
          {all ? 'Hide the list' : `All ${perks.length} perks`}
        </button>
        {all && (
          <ul className="divide-y divide-hairline rounded-md border border-hairline" data-perk-list>
            {perks.map((p) => (
              <li key={p.id} className={`flex gap-2 px-3 py-1.5 ${p.state === 'ahead' ? 'text-ink-faint' : ''} ${p.state === 'next' ? 'font-semibold' : ''}`} data-perk={p.id} data-state={p.state}>
                <span className="w-7 shrink-0 tabular-nums">{p.rung.toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  {p.words}{p.opens !== null && <span className="text-ink-faint"> · {opensWhenBuilt(p.opens)}</span>}
                  {p.now && <span className="block text-[12px] font-normal text-ink-soft" data-perk-now-words>Now · {p.now}</span>}
                </span>
                {p.state === 'reached' && <span className="shrink-0 text-success">✓</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}

/** From her: her pet name for you from Romance 1 and her keepsake from Friendship 10, with her line about
 * it and what it does at her line. */
function FromHerSection({ hers }: { hers: FromHer }) {
  return (
    <Section title="From her">
      <ul className="space-y-1.5 text-[13px]" data-from-her>
        {hers.petName && (
          <li className="flex gap-2" data-pet-name={hers.petName}>
            <span className="w-16 shrink-0 text-ink-soft">Calls you</span>
            <span className="font-semibold">“{hers.petName}”</span>
          </li>
        )}
        {hers.keepsake && (
          <li className="flex gap-2" data-keepsake={hers.keepsake.name}>
            <span className="w-16 shrink-0 text-ink-soft">Keepsake</span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{hers.keepsake.name}</span>
              <span className="text-ink-soft"> · +{hers.keepsake.quality} quality at {hers.keepsake.place}</span>
              {hers.keepsake.line && <span className="block text-[12px] italic text-ink-soft">“{hers.keepsake.line}”</span>}
            </span>
          </li>
        )}
      </ul>
    </Section>
  )
}

const TASTE_LABEL: Readonly<Record<GiftSlot['taste'], string>> = { loved: 'Loved', liked: 'Liked', disliked: 'Disliked' }

/** Gifts as learnt: her loved, liked and disliked goods ("?" until known), each group's points at ★1, and "Others +10";
 * from Friendship 7 her closest friend's loved gift. */
function GiftsSection({ gifts, friend = null, friendGood = null }: { gifts: ReturnType<typeof giftSlots>; friend?: string | null; friendGood?: string | null }) {
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
        {friend && friendGood && (
          <li className="flex items-center gap-2" data-friend-loved={friendGood}>
            <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-sunken"><ItemIcon id={friendGood} size={24} /></span>
            <span className="text-ink-soft">{friend}</span>
          </li>
        )}
      </ul>
    </Section>
  )
}
