import { byRelationship } from './relationship-order'
import {
  anniversaryOffer, birthdayOffer, birthdaysOf, completeVisit, configuredDuos, duoKey, duoReady, editDuo, greaterLoveOf, isBirthday, longGameEnabled, morningOfMemory,
  NIGHT_VISITS, nightAvailable, nightVisits, planVisit, setVisitStay, TRUE_LOVE, useStoryDuos, visitBeats, wantsBirthdayAlone,
  type Birthdays, type Duo, type FarmSave, type VisitKind, type StoryPack, type Visit,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { SceneLookProvider } from '../dialogue/Bust'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { changeHomestead } from './homestead-actions'
import { EveningScene } from './EveningPlayer'
import { LifeScene, MORNING_BACKDROP, NIGHT_BACKDROP } from './LifeScene'
import { Frame } from './ScenePlayer'

type NameOf = (id: string) => string
type BirthdayCheck = (save: FarmSave, id: string) => boolean
type Mode = 'solo' | 'duo' | 'editor'

export default function NightVisits({ replay, morning }: { replay: string | null; morning: boolean }) {
  const save = useLoopSave()
  const pack = useStory()
  const location = useLocation()
  const focus = new URLSearchParams(location.search).get('visits')
  const leave = useLeave()
  const close = () => leave(withParam(location, morning ? 'visitMorning' : replay ? 'visitReplay' : 'visits', null))
  if (!save || !pack || !longGameEnabled(save, pack)) return null
  const [owner, index, beat] = replay?.split(':') ?? []
  const memory = owner && index && /^\d+$/.test(index) ? greaterLoveOf(save, owner).memories[Number(index)] : undefined
  const outing = owner && index && /^e\d+$/.test(index) ? save.longGame?.outings?.[Number(index.slice(1))] : undefined
  const playMorning = morning || beat === 'morning'
  const found = morning ? save.longGame?.morning : memory && (playMorning ? morningOfMemory(save, memory) : memory)
  return createPortal(<MasterGate skeleton={null}>{master => {
    const birthdays = birthdaysOf(pack, master.birthdays)
    const birthday: BirthdayCheck = (farm, id) => wantsBirthdayAlone(pack, id) && isBirthday(birthdays, id, farm.calendar.day, farm.calendar)
    const nameOf = namer(master, pack)
    if (outing && owner && outing.who.includes(owner)) return <EveningScene save={save} pack={pack} master={master}
      id={outing.who[0]} name={nameOf(outing.who[0])} role="spouse" kind={outing.kind} partner={outing.who[1]} day={outing.day} onDone={close} />
    if (replay || morning) return found
      ? <VisitScene save={save} pack={pack} visit={found} morning={playMorning} nameOf={nameOf} onDone={close} onClose={close} />
      : <Sheet open title="Night memories" onClose={close}><p>That scene hasn’t been seen.</p></Sheet>
    return <Visits save={save} pack={pack} birthdays={birthdays} birthday={birthday} focus={focus} nameOf={nameOf} onClose={close} />
  }}</MasterGate>, document.body)
}

function Visits({ save, pack, birthdays, birthday, focus, nameOf, onClose }: {
  save: FarmSave; pack: StoryPack; birthdays: Birthdays; birthday: BirthdayCheck; focus: string | null; nameOf: NameOf; onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>('solo')
  const [active, setActive] = useState<{ visit: Visit; slot: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const visits = nightVisits(save)
  const full = visits.length === NIGHT_VISITS
  const available = (id: string) => nightAvailable(save, pack, id)
  const availableDuo = (duo: readonly string[]) => duo.every(id => available(id) && !birthday(save, id))
  const celebrations = (id: string) => {
    const year = anniversaryOffer(save, id)
    return [
      ...(birthdayOffer(save, id, birthdays) ? [{ kind: 'birthday' as const, label: 'Birthday night' }] : []),
      ...(year ? [{ kind: 'anniversary' as const, label: `Anniversary ${year}` }] : []),
    ]
  }
  const compare = byRelationship(save)
  const spouses = Object.keys(save.love).filter(id => save.love[id]?.stage === 'spouse')
    .map(id => ({ id, offers: celebrations(id) }))
    .sort((a, b) => Number(b.id === focus) - Number(a.id === focus) || compare(a.id, b.id))
  const duos = configuredDuos(save, pack).filter(duo => duoReady(save, duo))
  const last = visits.at(-1)
  const stay = save.longGame?.night?.stay && save.homestead.companion === last?.who[0]
  const run = async (rule: (save: FarmSave) => FarmSave, after?: () => void) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    try { await changeHomestead(rule); after?.() }
    catch (err) { setError(err instanceof Error ? err.message : 'Try again.') }
    finally { setBusy(false); inFlight.current = false }
  }
  const start = (who: Visit['who'], kind: VisitKind) => {
    const visit = planVisit(save, pack, who, kind, id => birthday(save, id), birthdays)
    if (visit) { setError(null); setActive({ visit, slot: visits.length }) }
  }
  if (active) return <VisitScene save={save} pack={pack} visit={active.visit} nameOf={nameOf} busy={busy} error={error}
    onClose={() => setActive(null)}
    onDone={() => void run(s => completeVisit(s, pack, active.visit, active.slot, id => birthday(s, id), birthdays), () => setActive(null))} />
  return <Sheet open onClose={onClose} title={`Night visits · ${visits.length}/${NIGHT_VISITS}`} label="Night visits">
    <div className="space-y-3 pb-2" data-night-visits={visits.length}>
      <div className="flex flex-wrap gap-2" aria-label="Visit type">
        {(['solo', 'duo', 'editor'] as const).filter(value => value !== 'duo' || duos.length > 0).map(value =>
          <Button key={value} variant={mode === value ? 'primary' : 'secondary'} aria-pressed={mode === value} onClick={() => setMode(value)}>
            {{ solo: 'Solo', duo: 'Duo', editor: 'Duo editor' }[value]}
          </Button>)}
      </div>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {mode === 'editor' ? <DuoEditor save={save} pack={pack} nameOf={nameOf} busy={busy} run={run} />
        : full && last ? <div className="space-y-2">
          <p>Fifth visit with {last.who.map(nameOf).join(' and ')}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onClose}>Say goodnight</Button>
            <Button disabled={busy || !!stay || (last.who.length === 2 ? !availableDuo(last.who) : !available(last.who[0]))} onClick={() => void run(s => setVisitStay(s, pack, last.day, id => birthday(s, id)))}>
              {stay ? 'Staying tonight ✓' : 'Stay the night'}
            </Button>
          </div>
        </div> : mode === 'duo' ? <ul className="grid gap-2 sm:grid-cols-2">
          {duos.map(duo => {
            const availableNow = availableDuo(duo)
            return <li key={duoKey(duo)} className="space-y-1">
              <Button variant="secondary" className="w-full" disabled={!availableNow} onClick={() => start(duo[1] === focus ? [duo[1], duo[0]] : duo, 'pajamas')}>{duo.map(nameOf).join(' & ')}</Button>
              {duo.flatMap((id, i) => celebrations(id).map(({ kind, label }) =>
                <Button key={`${id}:${kind}`} variant="secondary" className="w-full" disabled={!availableNow}
                  onClick={() => start([id, duo[1 - i]!], kind)}>{nameOf(id)} · {label}</Button>))}
            </li>
          })}
        </ul> : <ul className="grid gap-2 sm:grid-cols-2">
          {spouses.map(({ id, offers }) => {
            const love = greaterLoveOf(save, id)
            const availableNow = available(id)
            const trip = save.expeditions.find(trip => trip.left <= save.calendar.day && trip.back > save.calendar.day && trip.party.includes(id))
            return <li key={id} className="rounded-md border border-hairline p-2">
              <div className="flex items-center gap-2 pb-2"><Avatar id={id} size={32} label={nameOf(id)} />
                <div><strong>{nameOf(id)}</strong><p className="text-[12px] text-ink-soft">{love.points === TRUE_LOVE ? 'True Love' : `${love.points}/${TRUE_LOVE} Greater Love`}
                  {!availableNow && (trip ? ' · Away on expedition' : birthday(save, id) ? ' · Birthday evening' : ' · Needs a room')}</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={!availableNow} onClick={() => start([id], 'pajamas')}>Visit</Button>
                {offers.map(({ kind, label }) => <Button key={kind} variant="secondary" disabled={!availableNow}
                  onClick={() => start([id], kind)}>{label}</Button>)}
              </div>
            </li>
          })}
        </ul>}
    </div>
  </Sheet>
}

function DuoEditor({ save, pack, nameOf, busy, run }: { save: FarmSave; pack: StoryPack; nameOf: NameOf; busy: boolean; run: (rule: (save: FarmSave) => FarmSave) => Promise<void> }) {
  const cast = pack.cast.umas.map(uma => uma.characterId)
  const [first, setFirst] = useState(cast[0] ?? '')
  const [second, setSecond] = useState(cast[1] ?? '')
  const [sharing, setSharing] = useState(false)
  const pairs = configuredDuos(save, pack)
  const custom = save.longGame?.duos !== undefined
  const storyCount = configuredDuos(useStoryDuos(save), pack).length
  const linked = pairs.filter(pair => pair.includes(first))
  const options = cast.map(id => <option key={id} value={id}>{nameOf(id)}</option>)
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p data-duo-source={custom ? 'custom' : 'story'}>{custom ? 'Custom duos' : 'Story duos'} · {pairs.length} pairs</p>
      {custom && <Button variant="secondary" disabled={busy} onClick={() => void run(useStoryDuos)}>
        Use story duos ({storyCount})
      </Button>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <select className="min-h-11 rounded-md border border-hairline bg-panel px-2" aria-label="First Uma" value={first} onChange={event => setFirst(event.target.value)}>{options}</select>
      <select className="min-h-11 rounded-md border border-hairline bg-panel px-2" aria-label="Second Uma" value={second} onChange={event => setSecond(event.target.value)}>{options}</select>
      <Button disabled={busy || first === second} onClick={() => void run(s => editDuo(s, pack, [first, second], false))}>Add pair</Button>
    </div>
    <p>{nameOf(first)} · {linked.length}/3 partners</p>
    <ul className="space-y-2">
      {linked.map(pair => <li className="flex items-center justify-between gap-2" key={duoKey(pair)}>
        <span>{nameOf(pair.find(id => id !== first)!)} · {duoReady(save, pair) ? 'True Love' : 'Locked'}</span>
        <Button variant="secondary" disabled={busy} onClick={() => void run(s => editDuo(s, pack, pair as Duo, true))}>Remove</Button>
      </li>)}
    </ul>
    <Button variant="secondary" onClick={() => setSharing(!sharing)}>{sharing ? 'Hide story data' : 'Show story data'}</Button>
    {sharing && <textarea readOnly aria-label="household.json duo data" className="w-full rounded-md border border-hairline bg-panel p-2 font-mono text-sm" rows={5}
      value={JSON.stringify({ duos: pairs }, null, 2)} />}
  </div>
}

function VisitScene({ save, pack, visit, morning, nameOf, busy = false, error, onDone, onClose }: {
  save: FarmSave; pack: StoryPack; visit: Visit; morning?: boolean; nameOf: NameOf; busy?: boolean; error?: string | null; onDone: () => void; onClose: () => void
}) {
  const [part, setPart] = useState(0)
  const scene = visitBeats(pack, visit, morning)[part]
  const title = `${morning ? 'Morning' : visit.kind === 'anniversary' ? 'Anniversary ' + visit.anniversary : visit.kind === 'birthday' ? 'Birthday night' : 'Night visit'} · ${visit.who.map(nameOf).join(' & ')}`
  if (!scene) return <Sheet open title={title} onClose={onClose} label={title}>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <Button disabled={busy} onClick={onDone}>{morning ? 'Good morning' : 'Finish'}</Button>
  </Sheet>
  return <Frame title={title} label={title} scene={`visit:${visit.kind}:${part}`} onSkip={onClose} skipping={false}>
    <SceneLookProvider value={{ day: visit.day + (morning ? 1 : 0), leads: [scene.id], own: scene.outfit, portrait: scene.portrait }}>
      <LifeScene key={part} id={scene.id} steps={scene.steps} nameOf={nameOf} farmer={save.farmer.name} backdrop={morning ? MORNING_BACKDROP : NIGHT_BACKDROP}
        onDone={() => setPart(part + 1)} data={{ 'data-visit-beat': scene.beat, 'data-visit-speaker': scene.id }} />
    </SceneLookProvider>
  </Frame>
}
