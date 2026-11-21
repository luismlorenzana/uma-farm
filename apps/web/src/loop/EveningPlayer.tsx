// The evening on screen: `?evening=` over any page.
// `?evening=pick` is Tonight's **Pick someone ›**: the Umas home who can spend one, a yes first, each with her favourite
// kind and ✉. `?evening=<characterId>` is her profile's **Evening ›** (and a picked row): her kinds sheet, each open kind
// with her three numbers today ("Perfect +225", ★ her favourite ×1.5, +20 when she asked), the ones her ladder hasn't
// opened greyed with their rung; then the play at its evening length (`PlaySheet`, seeded by the day, her and the kind)
// over everything; then her scene for it on the dialogue engine (the story's `hangout-<kind>`, `date-<kind>`,
// `dinner-in-town` or `a-night-in`, else the default's, in the moment's outfit: a picnic's, a dinner's, a night in's, a
// festival night's; A night in's opens on her illustration for it), Skip to the end; then the card: the grade, the sum
// and her bar, one **Continue**. An evening takes 2 of the day's actions. Nothing is saved until the play ends:
// `spendEvening` commits once, stamped. A link opens only while her evening is open to her (`mayOpenEvening`), the picker
// while anyone's is; any other closes quietly. Loaded on demand.
import {
  birthdaysOf, duoKey, eveningCost, eveningDuos, eveningIllustration, eveningMoments, eveningRole, EVENINGS, eveningScene, eveningSeed, GRADE_NAMES, isAnniversary, isBirthday, kindsNow, LADDER_COLOURS,
  ladderOf, levelWords, mayOpenEvening, wantsBirthdayAlone,
  type EveningCard, type EveningKind, type EveningRole, type PlayedEvent, type SaveV4, type StoryPack,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { SceneLookProvider } from '../dialogue/Bust'
import { useLoopSave } from '../save/game'
import { herEventOf, namer } from '../story/people'
import { useStory } from '../story/story'
import { LifeScene } from './LifeScene'
import { Frame } from './ScenePlayer'
import { spendHerEvening } from './evening-actions'
import { cardSum, inviteBonus, kindRows, paysWords, pickRows, roleWords, type KindRow } from './evening-view'
import { InviteChip } from './HeartMarks'
import { PlayHelp, PlaySheet, playSpec } from './PlaySheet'

const ID = /^\d{1,12}$/
/** What the URL asks for: the picker, or her kinds sheet. */
export function parseEvening(params: URLSearchParams): { mode: 'pick' } | { mode: 'her'; id: string } | null {
  const value = params.get('evening')
  if (value === 'pick') return { mode: 'pick' }
  return value && ID.test(value) ? { mode: 'her', id: value } : null
}

export default function EveningPlayer() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const save = useLoopSave()
  const story = useStory()
  const asked = useMemo(() => parseEvening(params), [params])
  const close = () => leave(withParam(location, 'evening', null))
  // Settled once per link, as it opens (`mayOpenEvening`): her evening open to her now, or the picker while anyone's is;
  // any other link closes quietly. Her evening's play, scene and card then go on whatever the save says.
  const key = asked ? (asked.mode === 'pick' ? 'pick' : asked.id) : null
  const [allowed, setAllowed] = useState<{ key: string; ok: boolean } | null>(null)
  useEffect(() => {
    if (key !== null && save && story && allowed?.key !== key) setAllowed({ key, ok: mayOpenEvening(save, story, key) })
  }, [key, save, story, allowed?.key])
  const ok = allowed !== null && allowed.key === key && allowed.ok
  useEffect(() => {
    if (!asked || (allowed !== null && allowed.key === key && !allowed.ok)) close()
  }, [asked, allowed, key]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!asked || !save || !story || !ok) return null
  return (
    <MasterGate skeleton={null}>
      {(master) => asked.mode === 'pick'
        ? <Picker save={save} pack={story} master={master} onClose={close} onPick={(id) => navigate(withParam(location, 'evening', id), { replace: true, state: location.state })} />
        : <Her key={asked.id} id={asked.id} save={save} pack={story} master={master} onClose={close} />}
    </MasterGate>
  )
}

const nameIn = (master: MasterView) => (id: string) => master.album.get(id)?.name ?? 'An Uma'

/** Tonight's picker: who's home and can spend an evening now. */
function Picker({ save, pack, master, onPick, onClose }: { save: SaveV4; pack: StoryPack; master: MasterView; onPick: (id: string) => void; onClose: () => void }) {
  const rows = pickRows(save, pack, nameIn(master))
  return (
    <Sheet open onClose={onClose} title="Who tonight?" label="Pick someone for tonight">
      <div className="pb-2" data-evening-picker>
        {rows.length === 0 && <p className="py-2 text-ink-soft" data-picker-empty>No one can spend an evening now.</p>}
        <ul className="divide-y divide-hairline">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => onPick(row.id)} className="flex min-h-14 w-full items-center gap-3 py-1.5 text-left" data-pick={row.id} data-invite={row.invite ?? undefined}>
                <Avatar id={row.id} size={44} label={row.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-1.5">
                    <span className="min-w-0 truncate text-[15px] font-semibold">{row.name}</span>
                    {row.invite && <InviteChip />}
                    {row.invite === 'yes' && <span className="text-[12px] font-semibold text-success">Yes, tonight</span>}
                  </span>
                  <span className="text-[12px] text-ink-soft">{row.level} · ★ {row.favourite}</span>
                </span>
                <span aria-hidden className="text-[18px] text-ink-faint">›</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

type Phase = { at: 'kinds' } | { at: 'play'; kind: EveningKind; day: number } | { at: 'scene'; card: EveningCard } | { at: 'card'; card: EveningCard }

/** Her evening: the kinds sheet, the play, the card. */
function Her({ id, save, pack, master, onClose }: { id: string; save: SaveV4; pack: StoryPack; master: MasterView; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'kinds' })
  const [error, setError] = useState<string | null>(null)
  const [partner, setPartner] = useState('')
  const name = nameIn(master)(id)
  const birthdays = useMemo(() => birthdaysOf(pack, master.birthdays), [pack, master])
  const birthday = isBirthday(birthdays, id, save.calendar.day, save.calendar)
  const duos = eveningDuos(save, pack, id, who => isBirthday(birthdays, who, save.calendar.day, save.calendar) && wantsBirthdayAlone(pack, who))
  const love = save.love[id]
  // Her role as the evening starts: her scene is a hangout's, a date's or a spouse's.
  const [role] = useState<EveningRole | null>(() => (love ? eveningRole(love) : null))
  if (!love || !save.roster[id]) return null
  const colour = LADDER_COLOURS[ladderOf(love.stage)]
  if (phase.at === 'play') {
    return (
      <PlayLayer key={phase.kind} save={save} pack={pack} id={id} kind={phase.kind} name={name} birthday={birthday} error={error}
        onLeave={onClose}
        onDone={(score) => {
          setError(null)
          spendHerEvening(id, phase.kind, score, partner || undefined, phase.day).then((card) => setPhase({ at: 'scene', card }), (err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work.'))
        }} />
    )
  }
  if (phase.at === 'scene') {
    return <EveningScene save={save} pack={pack} master={master} id={id} name={name} role={role ?? 'hangout'} kind={phase.card.kind} partner={phase.card.partner} onDone={() => setPhase({ at: 'card', card: phase.card })} />
  }
  if (phase.at === 'card') return <CardLayer card={phase.card} name={name} colour={colour} onContinue={onClose} />
  const rows = kindRows(save, pack, id, birthday)
  const shared = partner ? kindsNow(save, pack, partner) : null
  const bonus = inviteBonus(save, id)
  return (
    <Sheet open onClose={onClose} title={`An evening with ${name}`} label={`An evening with ${name}`}>
      <div className="space-y-3 pb-2" data-evening-kinds={id}>
        <div className="flex items-center gap-3">
          <Avatar id={id} size={48} label={name} />
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-semibold" style={{ color: colour }} data-evening-role>{roleWords(save, id)} · {levelWords(love)}</p>
            {bonus !== null && <p className="flex items-center gap-1 text-[#c2385e]" data-evening-invite><InviteChip /> She asked you: +{bonus} with the evening</p>}
            {birthday && <p className="text-ink-soft" data-evening-birthday>★ Her birthday: ×1.5 tonight</p>}
            {isAnniversary(love, save.calendar.day, save.calendar) && <p className="text-ink-soft" data-evening-anniversary>♥ Your anniversary: ×1.5 tonight</p>}
          </div>
        </div>
        {duos.length > 0 && <label className="flex items-center gap-2 text-[13px]">Who’s joining
          <select className="min-h-11 rounded-md border border-hairline bg-panel px-2" value={partner} onChange={event => setPartner(event.target.value)}>
            <option value="">Solo</option>
            {duos.map(who => <option key={who} value={who}>Duo · {namer(master, pack)(who)}</option>)}
          </select>
        </label>}
        {rows.every((r) => r.locked !== null) && <p className="text-ink-soft" data-kinds-empty>Tonight’s evening is spent.</p>}
        <ul className="space-y-1.5">
          {rows.map(row => <li key={row.kind} className="relative pr-12">
            <KindButton row={shared && !shared.includes(row.kind) ? { ...row, locked: 'Unavailable for this duo' } : row}
              onPick={() => setPhase({ at: 'play', kind: row.kind, day: save.calendar.day })} />
            <PlayHelp kind={row.play} className="[&>summary]:absolute [&>summary]:top-1 [&>summary]:right-0 [&>div]:mt-1" />
          </li>)}
        </ul>
        <p className="text-[12px] text-ink-faint">One evening a day, {eveningCost()} actions. ★ her favourite kind pays ×1.5. Never failed: a miss is a Fine.</p>
      </div>
    </Sheet>
  )
}

function KindButton({ row, onPick }: { row: KindRow; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} disabled={row.locked !== null} data-kind={row.kind} data-favourite={row.favourite || undefined} data-locked={row.locked ?? undefined}
      className={`flex min-h-14 w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left ${row.locked ? 'border-hairline bg-sunken/50 text-ink-faint' : row.favourite ? 'border-[#e0567a] bg-[#e0567a]/8' : 'border-hairline bg-panel'}`}>
      <UiMark mark={row.kind === 'festival' ? 'hearts/evening' : `play/${row.play}`} scale={2} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold">{row.name}{row.favourite && <span className="pl-1 text-[#d9a227]" aria-label="her favourite">★</span>}</span>
        <span className="text-[12px] tabular-nums text-ink-soft" data-pays>{row.locked ?? paysWords(row.pays)}</span>
      </span>
    </button>
  )
}

/** The play over everything (z-60, above the sheets), at its evening length; a ✕ leaves it spending nothing. */
function PlayLayer({ save, pack, id, kind, name, birthday, error, onDone, onLeave }: {
  save: SaveV4; pack: StoryPack; id: string; kind: EveningKind; name: string; birthday: boolean; error: string | null
  onDone: (score: number) => void; onLeave: () => void
}) {
  const def = EVENINGS[kind]
  const spec = useMemo(() => playSpec(save, pack, id, def.play, 'evening', eveningSeed(save.account.uid, save.calendar.day, id, kind)), [save.account.uid, save.calendar.day, id, kind]) // eslint-disable-line react-hooks/exhaustive-deps
  const pays = useMemo(() => kindRows(save, pack, id, birthday).find((r) => r.kind === kind)?.pays, [kind]) // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] bg-[#2b3557]/70" data-evening-play={kind}>
      <PlaySheet spec={spec} title={def.name} name={name} pays={pays} onDone={(r) => onDone(r.score)} />
      <button type="button" onClick={onLeave} aria-label="Leave the evening" className="absolute top-2 right-2 z-20 grid size-11 place-items-center rounded-full bg-panel/90 text-[18px] text-ink-soft shadow-1" data-action="leave-evening">✕</button>
      {error && <p role="alert" className="absolute inset-x-4 bottom-6 z-20 rounded-md bg-panel p-3 text-center text-[14px] text-danger shadow-2" data-evening-error>{error}</p>}
    </div>,
    document.body,
  )
}

/** Her scene for the evening, after its play, over everything: the story's, else the default's, in the moment's outfit.
 * Skip or its end goes on to the card. */
export function EveningScene({ save, pack, master, id, name, role, kind, partner, day = save.calendar.day, onDone }: {
  save: SaveV4; pack: StoryPack; master: MasterView; id: string; name: string; role: EveningRole; kind: EveningKind; partner?: string; day?: number; onDone: () => void
}) {
  const [event, setEvent] = useState<PlayedEvent | null>(null)
  useEffect(() => {
    let live = true
    void herEventOf(pack, id, eveningScene(role, kind)).then((found) => live && setEvent(found), () => live && onDone())
    return () => { live = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const names = namer(master, pack)
  const title = `${EVENINGS[kind].name} · ${name}${partner ? ' & ' + names(partner) : ''}`
  const sharedLine = partner ? pack.household?.duoLines?.[duoKey([id, partner])]?.[partner]?.farewell : undefined
  return createPortal(
    <Frame title={title} label={title} scene={`evening:${kind}:${id}`} onSkip={onDone} skipping={false}>
      {event
        ? (
          <SceneLookProvider value={{ own: event.outfit, moments: eveningMoments(kind), day, leads: partner ? [id, partner] : [id] }}>
            <LifeScene id={id} steps={partner ? [...event.steps, { say: partner, line: sharedLine ?? 'I’m glad we shared this evening.' }] : event.steps}
              nameOf={names} farmer={save.farmer.name} onDone={onDone} illustrated={eveningIllustration(eveningScene(role, kind))}
              data={{ 'data-evening-scene': eveningScene(role, kind) }} />
          </SceneLookProvider>
        )
        : <div className="flex-1" />}
    </Frame>,
    document.body,
  )
}

/** The evening's card: the grade, the sum and her bar, one Continue. */
function CardLayer({ card, name, colour, onContinue }: { card: EveningCard; name: string; colour: string; onContinue: () => void }) {
  const sum = cardSum(card)
  const def = EVENINGS[card.kind]
  const share = card.bar.cost > 0 ? Math.min(1, card.bar.points / card.bar.cost) : 1
  return createPortal(
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[60] flex items-center justify-center bg-[#2b3557]/70 px-3" data-evening-card={card.kind} data-grade={card.grade}>
      <section role="dialog" aria-label={`${def.name} with ${name}`} className="max-h-full w-full max-w-md space-y-3 overflow-y-auto rounded-lg border border-hairline bg-panel p-4 text-center shadow-3">
        <header className="flex items-center justify-center gap-2">
          <UiMark mark="hearts/evening" scale={2} fallback={<span aria-hidden>☾</span>} />
          <h2 className="font-display text-[18px] font-bold">{def.name}</h2>
        </header>
        <p className="text-[14px] text-ink-soft">with {name}</p>
        <p className="font-display text-[28px] font-bold text-[#c2385e]" data-card-grade>{GRADE_NAMES[card.grade]}</p>
        <div className="space-y-0.5 text-[14px] tabular-nums">
          <p data-card-play>{sum.play}</p>
          {sum.invite && <p data-card-invite>{sum.invite}</p>}
          <p className="font-semibold" data-card-total>{sum.total}</p>
        </div>
        {card.bar.rung !== null && card.bar.cost > 0 && (
          <div className="space-y-1" data-card-bar={`${card.bar.points}/${card.bar.cost}`}>
            <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-sunken"><span className="block h-full rounded-full" style={{ width: `${share * 100}%`, background: colour }} /></span>
            <p className="text-[12px] text-ink-soft tabular-nums">{card.bar.points.toLocaleString('en-US')} / {card.bar.cost.toLocaleString('en-US')}</p>
          </div>
        )}
        <Button className="w-full" onClick={onContinue} data-action="evening-done">Continue</Button>
      </section>
    </div>,
    document.body,
  )
}
