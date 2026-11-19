// Her menu in town (`?uma=<id>`), on the dialogue engine: her bust on the left (her portrait in the day's outfit with
// her face changing as she answers; else her master-data bust), and on the right her name, where she is, her line in the
// engine's line box, and her menu, each item with its cost in actions. How she stands with you is her stage in the Uma
// loop with her ladder's level ("Farmhand · F5", `stageWords`):
// - **Introduce yourself · 1 action** while you haven't met: she's met, and her meeting scene plays over the town;
// - **Talk · 1** (once a day, +15): today's talk plays over the town (`?life=talk:<id>`: her greeting for where you are,
//   then her line or a small talk), and her line stays on the stage, her face happy;
// - **Give a gift · 1** (once a day): the gift picker, then her reaction, her face by her taste;
// - **Ask her out · 2** (a friend for a hangout, a sweetheart or a spouse for a date): her evening (`?evening=<id>`), or
//   why not; one evening a day across everyone;
// - **Invite her to work · 1** (a friend, once): she's a farmhand from today, and her scene plays over the town
//   (`?life=invited-to-work:<id>`: her route's, else the default story's at the farm gate);
// - **Her event · 1** once it's Ready (the event player, over the town).
// One of the town's people gets her post instead: her role, what she does, her ties, and her post's menu. One not out now
// says so; one on the farm (she lives there, or it's her farm day) links her profile. A talk, a gift or an introduction
// that unlocks a Town note says so. Loaded with the town's screen.
import {
  atHome, birthdaysOf, CAST, GAME_DAYS, giftLineV4, herMenu, isBirthday, nextOut, onFarmToday, stageWords, todaysTalk, townLineOf, townLocation, townLocations, townOf, YOU, type Expression,
  type MenuItem, type SaveV4, type ShopId, type Step, type StoryPack, type Taste, type TownDay,
} from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { Line } from '../dialogue/Line'
import { Stage } from '../dialogue/Stage'
import type { MasterView } from '../master/master'
import { GiftPicker } from '../loop/Love'
import { talentTable } from '../loop/talents'
import { shortDate } from '../loop/words'
import { outfitFor, useSpecialDays } from '../story/story'
import { NoteFound } from './NoteFound'
import { giftOnce, introduceOnce, talkOnce, workOnce } from './town-actions'
import { hereWords, keeperTies, postMenu } from './town-view'

type NameOf = (id: string) => string

/** An Uma at home today, and when she's next out: "At home today. Out on Spring 7, at the Library." */
function atHomeWords(pack: StoryPack, id: string, today: number): string {
  const next = nextOut(pack, id, today)
  const place = next ? townLocation(pack, next.at)?.name ?? null : null
  return next ? `At home today. Out on ${shortDate(next.day)}${place ? `, at ${place.replace(/^The /, 'the ')}` : ''}.` : 'At home today.'
}

/** Her face at a gift, by her taste; her words are the default story's (`giftLineV4`). */
const TASTE_FACE: Readonly<Record<Taste, Expression>> = { loved: 'laughing', liked: 'happy', neutral: 'neutral', disliked: 'worried' }
/** Her last line in a talk's steps: what stays on the stage after it. */
function lastOfHers(steps: readonly Step[]): string {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!
    if ('say' in s && s.say !== YOU) return s.line
  }
  return ''
}
const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
const actionWords = (n: number): string => `${n} action${n === 1 ? '' : 's'}`

export function HerMenu({ id, save, pack, master, day, nameOf, onClose }: {
  id: string; save: SaveV4; pack: StoryPack; master: MasterView; day: TownDay; nameOf: NameOf; onClose: () => void
}) {
  const person = townOf(pack).byId.get(id) ?? null
  const name = nameOf(id)
  const at = day.where.get(id) ?? null
  const place = at ? townLocation(pack, at) ?? null : null
  // Her post: the shop or office of her role, else the spot she keeps.
  const post = person ? townLocations(pack).find((l) => l.keeper === id) ?? null : null
  const where = person ? post?.name ?? 'In town' : place ? `${place.name}${hereWords(pack, id, day.by.get(id)) ? ` · ${hereWords(pack, id, day.by.get(id))}` : ''}` : null
  return (
    <SceneLookProvider value={{ day: save.calendar.day, leads: [id] }}>
      <div className="absolute inset-0 z-20 flex flex-col bg-page" role="dialog" aria-modal="true" aria-label={`${name} in town`} data-her-menu={id} data-at={at ?? undefined}>
        <header className="flex min-h-11 items-center justify-between gap-2 px-4">
          <p className="text-micro truncate text-ink-soft" data-her-where>{where ?? 'Not in town now'}</p>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full px-4 text-[15px] font-semibold text-ink-soft" data-action="back">Back</button>
        </header>
        {person ? <Keeper id={id} pack={pack} save={save} nameOf={nameOf} shop={post?.group === 'shop' ? post.id as ShopId : null} />
          : <Uma id={id} name={name} save={save} pack={pack} master={master} at={at} nameOf={nameOf} />}
      </div>
    </SceneLookProvider>
  )
}

/** One of the cast, or anyone who lives in town: her line on the engine, and her menu. */
function Uma({ id, name, save, pack, master, at, nameOf }: { id: string; name: string; save: SaveV4; pack: StoryPack; master: MasterView; at: string | null; nameOf: NameOf }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [said, setSaid] = useState<{ line: string; emote: Expression } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [giving, setGiving] = useState(false)
  const met = !!save.roster[id]
  const love = save.love[id]
  // On the farm today: she lives there (a spouse in her room), or it's her farm day (a farmhand).
  const onFarm = met && onFarmToday(save, pack, id)
  const livesOnFarm = met && atHome(save, id)
  const temperament = talentTable(master).get(outfitFor(id))?.temperament ?? 'steady'
  const fillName = (line: string) => line.split('{name}').join(name)
  const birthdays = birthdaysOf(pack, master.birthdays)
  const birthday = isBirthday(birthdays, id, save.calendar.day)
  // Her last line of today's talk (her line, or a small talk's last of hers): it stays on the stage after the talk.
  const talkLine = () => fillName(lastOfHers(todaysTalk(save, pack, id, temperament, birthdays).steps))
  // The line on the stage: the last act's; once you've talked today, her talk; else her line for the day in town.
  const shown = said ?? (save.today.chats.includes(id) && love ? { line: talkLine(), emote: 'happy' as const } : { line: fillName(townLineOf(save, pack, id)), emote: 'neutral' as const })
  const special = useSpecialDays()
  const items = at || onFarm ? herMenu(save, pack, id, special ?? GAME_DAYS) : []
  const act = (run: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    run().catch((err: unknown) => setError(errorWords(err))).finally(() => setBusy(false))
  }
  const press = (item: MenuItem) => {
    switch (item.id) {
      case 'introduce': return act(async () => {
        const r = await introduceOnce(id, at!)
        setNotes(r.notes)
        setNote(null)
      })
      case 'talk': return act(async () => {
        const r = await talkOnce(id, at)
        setSaid({ line: talkLine(), emote: 'happy' })
        setNote(r.paid > 0 ? `+${r.paid} ♥` : null)
        setNotes(r.notes)
        // Today's talk plays over the town: her greeting, then her line or a small talk.
        navigate(withParam(location, 'life', `talk:${id}`), { state: { back: true } })
      })
      case 'gift': return setGiving(true)
      case 'work': return act(async () => {
        await workOnce(id)
        setSaid({ line: 'The farm? I’d love to. Count me in.', emote: 'happy' })
        setNote('Farmhand ✓')
        // Her scene plays over the town, the action spent.
        navigate(withParam(location, 'life', `invited-to-work:${id}`), { state: { back: true } })
      })
      default: return undefined
    }
  }
  const give = (item: string, stars: number) => {
    setGiving(false)
    act(async () => {
      const r = await giftOnce(id, item, stars)
      setSaid({ line: fillName(giftLineV4(save, pack, id, r.taste, item, birthday)), emote: TASTE_FACE[r.taste] })
      setNote(r.paid > 0 ? `+${r.paid} ♥` : null)
      setNotes(r.notes)
    })
  }
  return (
    <Stage bust={{ who: id, name, emote: shown.emote }} data={{ 'data-her': id, 'data-met': met || undefined }}>
      <div className="flex shrink-0 items-baseline gap-2">
        {/* Her name is the line box's speaker; with no line, it's here. */}
        {!(at || onFarm) && <p className="font-display min-w-0 truncate text-[18px] font-bold" data-her-name>{name}</p>}
        <p className="shrink-0 text-[13px] font-semibold text-[#c2385e]" data-standing>{love ? stageWords(save, id) : 'Not met yet'}</p>
        {note && <p role="status" className="ml-auto shrink-0 text-[14px] font-bold text-[#c2385e]" data-paid>{note}</p>}
      </div>
      {at || onFarm ? (
        <Line step={{ say: id, line: shown.line, emote: shown.emote }} nameOf={() => name} farmer={save.farmer.name} onNext={() => undefined} still />
      ) : null}
      {error && <p role="status" className="text-[13px] font-semibold text-danger" data-menu-error>{error}</p>}
      <NoteFound ids={notes} pack={pack} />
      {onFarm ? (
        <p className="text-[14px]" data-on-farm>{livesOnFarm ? 'She lives on the farm.' : 'On the farm today, her farm day.'} <Link to={`/library?uma=${id}`} state={{ back: true }} className="font-semibold text-accent-strong underline">Her book ›</Link></p>
      ) : !at ? (
        <p className="text-[14px] text-ink-soft" data-at-home>{atHomeWords(pack, id, save.calendar.day)}{met && <> <Link to={`/library?uma=${id}`} state={{ back: true }} className="font-semibold text-accent-strong underline">Her book ›</Link></>}</p>
      ) : null}
      {items.length > 0 && (
        <ul className="grid shrink-0 grid-cols-2 gap-1.5" data-menu={items.map((i) => i.id).join(' ')}>
          {items.map((item) => (
            <li key={item.id} className={item.id === 'introduce' || item.id === 'event' ? 'col-span-2' : ''}>
              <MenuButton item={item} busy={busy} onPress={() => press(item)}
                to={item.id === 'event' ? withParam(location, 'event', id) : item.id === 'evening' ? withParam(location, 'evening', id) : null} />
            </li>
          ))}
        </ul>
      )}
      {giving && <GiftPicker save={save} id={id} name={name} points={() => null} onGive={give} onClose={() => setGiving(false)} />}
    </Stage>
  )
}

/** One item of her menu: a button (or a link, for her event and her evening), its cost; greyed with why when closed. */
function MenuButton({ item, busy, onPress, to }: { item: MenuItem; busy: boolean; onPress: () => void; to: string | null }) {
  const primary = item.id === 'introduce' || item.id === 'event'
  // The wide buttons say "· 1 action"; the paired ones "· 1", as the farm's do.
  const cost = item.cost === null ? '' : primary ? ` · ${actionWords(item.cost)}` : ` · ${item.cost}`
  const look = `flex min-h-11 w-full flex-col justify-center rounded-md px-3 py-1 text-left ${primary ? 'bg-accent text-accent-ink font-display font-bold' : 'border border-hairline bg-panel font-semibold'}`
  if (!item.open) {
    return (
      <p className={`flex min-h-11 w-full min-w-0 flex-col justify-center rounded-md border border-hairline px-3 py-0.5 ${item.done ? 'bg-success/10' : 'bg-sunken/60'}`} data-item={item.id} data-why={item.why ?? undefined}>
        <span className="truncate text-[14px] font-semibold text-ink-soft">{item.label}{cost}</span>
        <span className={`truncate text-[11px] ${item.done ? 'font-semibold text-success' : 'text-ink-faint'}`}>{item.why}</span>
      </p>
    )
  }
  if (to) {
    return <Link to={to} state={{ back: true }} className={look} data-item={item.id} data-action={`menu-${item.id}`}><span className="text-[15px]">{item.label}{cost} ›</span></Link>
  }
  return (
    <button type="button" onClick={onPress} disabled={busy} className={`${look} disabled:opacity-60`} data-item={item.id} data-action={`menu-${item.id}`}>
      <span className="text-[15px]">{item.label}{cost}</span>
    </button>
  )
}

/** One of the town's people at her post: her role, what she does, her ties (they build no bond), and her post's menu. */
function Keeper({ id, pack, save, nameOf, shop }: { id: string; pack: StoryPack; save: SaveV4; nameOf: NameOf; shop: ShopId | null }) {
  const location = useLocation()
  const person = townOf(pack).byId.get(id)!
  const ties = keeperTies(pack, id)
  const menu = shop ? postMenu(shop) : []
  const name = nameOf(id)
  return (
    <Stage bust={{ who: id, name, emote: 'happy' }} data={{ 'data-keeper-menu': id }}>
      <p className="font-display text-[18px] font-bold" data-her-name>{name}</p>
      <p className="text-[14px]" data-keeper-role>
        <span className="font-semibold">{person.role ? CAST[person.role].role : 'Of the town'}</span>
        <span className="block text-[13px] text-ink-soft">{person.does}</span>
      </p>
      {ties.length > 0 && (
        <ul className="divide-y divide-hairline rounded-md border border-hairline" data-keeper-ties>
          {ties.map((t) => (
            <li key={t.with} className="px-3 py-1.5 text-[13px]" data-keeper-tie={t.with}>
              <span className="font-semibold">{nameOf(t.with)}</span><span className="text-ink-soft"> · {t.line}</span>
            </li>
          ))}
        </ul>
      )}
      {menu.map((m) => (m.to ? (
        <Link key={m.key} to={withParam(location, 'sheet', m.to)} state={{ back: true }} data-post-item={m.key}
          className="font-display grid min-h-11 shrink-0 place-items-center rounded-md bg-accent text-[15px] font-bold text-accent-ink">{m.label} ›</Link>
      ) : (
        <p key={m.key} className="flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-md border border-hairline px-3 text-[14px]" data-post-item={m.key}>
          <span className="font-semibold text-ink-soft">{m.label}</span><span className="text-[12px] text-ink-faint">{m.why}</span>
        </p>
      )))}
      {save.today.town || <p className="text-[13px] text-ink-soft">Go into town first.</p>}
    </Stage>
  )
}
