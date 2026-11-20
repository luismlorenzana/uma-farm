// The ranch's and the digs' side panels on the farm map, loaded on demand (`/?peek=coop|barn|mine|quarry`):
// - **The Coop and the Barn:** the silo's feed, Collect (an action for every good waiting), and each animal with its
//   hearts, today's feeding and care, and Feed and Care, an action each. No animals yet: the rancher's is in town.
// - **The Mine and the Quarry:** the floor you're on (the deepest reached) with its grade and finds, Work a face (an
//   action, two finds), the stairs' progress and Take the stairs, free, once found and in the Farm Rank's reach.
// Each says what the action brought, and the day's actions left.
import {
  actionsLeft, animalName, ANIMALS, animalsIn, DIG_NAMES, digFloor, floorFinds, gradeAt, haulsToday, heartsOf, HOME_NAMES, HOME_ROOM, itemNameOf, readyIn, SILO_ROOM,
  stairsAfter, stairsFound, stairsLock, type Animal, type DigId, type FarmSave, type RanchHome,
  COLLECTION_CAPS, goodOf, gradeStepId, ranchProduct, type CollectionCap,
} from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { Link } from 'react-router'
import { GuideButton } from '../guide/Guide'
import { ItemIcon } from '../items/ItemIcon'
import { careForOne, collectAt, faceAt, feedOne, pickCollectionCap, stairsAt } from './actions'
import { ActionsLeft, goodsWords, Notes, ThinMark, useAct } from './FarmPanels'
import { plural } from './words'

/** The rancher's sheet, in town. */
const RANCHER = '/town?at=rancher&sheet=rancher'

/** The silo's feed, as a bar. */
function Silo({ save }: { save: FarmSave }) {
  const feed = save.ranch.silo
  return (
    <div className="space-y-1" data-silo={feed}>
      <p className="flex items-center justify-between text-[13px]"><span className="font-semibold">Silo</span><span className="text-ink-soft tabular-nums">{feed} of {SILO_ROOM} feed</span></p>
      <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-sunken"><span className="block h-full rounded-full bg-[#b58a3c]" style={{ width: `${(feed / SILO_ROOM) * 100}%` }} /></span>
      {feed < 10 && <p className="text-[12px] text-ink-soft">{feed === 0 ? 'Empty: ' : 'Running low: '}cut grass on a weeds tile, or buy fodder at the rancher’s.</p>}
    </div>
  )
}

/** An animal's hearts, ten at most, as filled and empty marks. */
function Hearts({ fondness }: { fondness: number }) {
  const hearts = heartsOf(fondness)
  return <span className="text-[11px] tracking-[-1px] text-[#c2385e]" aria-label={`${hearts} of 10 hearts`} data-hearts={hearts}>{'♥'.repeat(hearts)}<span className="text-ink-faint">{'♥'.repeat(10 - hearts)}</span></span>
}

/** The Coop's or the Barn's panel. */
export function RanchPanel({ save, home }: { save: FarmSave; home: RanchHome }) {
  const animals = animalsIn(save, home)
  const ready = readyIn(save, home)
  const { note, error, busy, run } = useAct(home)
  const out = actionsLeft(save) === 0
  return (
    <div className="space-y-2.5 p-4" data-ranch={home}>
      <div className="flex items-center justify-between gap-2"><Silo save={save} /><GuideButton topic="animals" label="How animals work" /></div>
      <Notes note={note} error={error} />
      {animals.length === 0 ? (
        <p className="text-[14px] text-ink-soft" data-no-animals>
          No animals yet. <Link to={RANCHER} state={{ back: true }} className="font-semibold text-accent-strong underline">Buy them at the rancher’s</Link>, in town.
        </p>
      ) : (
        <>
          <details className="rounded-md border border-hairline px-2 text-[13px]">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Collection grade caps</summary>
            {[...new Set(animals.map((animal) => animal.kind))].map((kind) => (
              <label key={kind} className="flex min-h-11 flex-wrap items-center justify-between gap-1">
                {itemNameOf(ANIMALS[kind].good)}
                <select className="min-h-11 bg-panel px-1" disabled={busy} value={save.farm.collectionCaps?.[kind] ?? 0}
                  onChange={(e) => run(pickCollectionCap(kind, Number(e.currentTarget.value) as CollectionCap).then(() => null))}>
                  {COLLECTION_CAPS.map((cap) => <option key={cap} value={cap}>
                    {cap === 0 ? 'Standard' : 'Up to'} G{goodOf(gradeStepId(ANIMALS[kind].good, cap))!.grade}
                  </option>)}
                </select>
              </label>
            ))}
          </details>
          <Button className="w-full" disabled={busy || out || ready === 0} data-action="collect"
            onClick={() => run(collectAt(home).then((c) => `Collected · +${goodsWords(c.items)}`))}>
            {ready === 0 ? 'Nothing to collect yet' : `Collect ${ready} · 1 action`}
          </Button>
          <ul className="space-y-1.5" aria-label={`The ${HOME_NAMES[home]}’s animals`}>
            {animals.map((a) => <AnimalRow key={a.id} save={save} animal={a} busy={busy} out={out} run={run} />)}
          </ul>
          <p className="text-[12px] text-ink-faint">{animals.length} of {HOME_ROOM} · more at the rancher’s, in town</p>
        </>
      )}
      <ActionsLeft save={save} />
    </div>
  )
}

function AnimalRow({ save, animal, busy, out, run }: { save: FarmSave; animal: Animal; busy: boolean; out: boolean; run: (p: Promise<string | null>) => void }) {
  const rule = ANIMALS[animal.kind]
  const name = animalName(save, animal)
  const chips = [animal.fed ? 'Fed' : 'Hungry', ...(animal.cared ? ['Cared for'] : []),
    ...(animal.ready ? [`${itemNameOf(rule.good)} G${goodOf(ranchProduct(save, animal))!.grade} waiting`] : [])]
  return (
    <li className="space-y-1.5 rounded-sm border border-hairline bg-panel px-2.5 py-2" data-animal={animal.id} data-fed={animal.fed || undefined} data-cared={animal.cared || undefined}>
      <div className="flex items-center gap-2">
        <ItemIcon id={rule.good} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{name}</span>
          <Hearts fondness={animal.fondness} />
        </span>
      </div>
      <p className="flex flex-wrap gap-1">
        {chips.map((c) => <span key={c} className={`rounded-full px-1.5 text-[11px] font-semibold ${c === 'Hungry' ? 'bg-danger/12 text-danger' : 'bg-success/12 text-success'}`}>{c}</span>)}
      </p>
      <div className="flex gap-1.5">
        <Button size="sm" className="flex-1" disabled={busy || out || animal.fed || save.ranch.silo === 0} data-action="feed"
          onClick={() => run(feedOne(animal.id).then(() => `Fed ${name}: its ${itemNameOf(rule.good).toLowerCase()} by morning`))}>Feed · 1</Button>
        <Button size="sm" variant="secondary" className="flex-1" disabled={busy || out || animal.cared} data-action="care"
          onClick={() => run(careForOne(animal.id).then(() => `Cared for ${name}: fonder`))}>Care · 1</Button>
      </div>
    </li>
  )
}

/** The Mine's or the Quarry's panel: the floor you're on, a face, the stairs. */
export function DigPanel({ save, dig }: { save: FarmSave; dig: DigId }) {
  const at = save.places[dig]
  const floor = digFloor(at)
  const finds = floorFinds(dig, floor)
  const lock = stairsLock(save, dig)
  const found = stairsFound(at)
  const { note, error, busy, run } = useAct(dig)
  const out = actionsLeft(save) === 0
  const need = stairsAfter(floor)
  return (
    <div className="space-y-2.5 p-4" data-dig={dig} data-floor={floor}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[20px] font-bold" data-floor-name>Floor {floor}</p>
        <p className="text-[12px] text-ink-soft">G{gradeAt(floor)}{at.deepest === 0 ? ' · not dug yet' : ''}</p>
        <ThinMark hauls={haulsToday(save, dig)} noun="face" />
        <GuideButton topic="mining" label="How mining works" />
      </div>
      <div className="flex flex-wrap gap-1" aria-label={`Finds: ${finds.map((id) => itemNameOf(id)).join(', ')}`}>
        {finds.map((id) => <ItemIcon key={id} id={id} size={24} label={itemNameOf(id)} />)}
      </div>
      <Notes note={note} error={error} />
      <Button className="w-full" disabled={busy || out} data-action="face"
        onClick={() => run(faceAt(dig).then((f) => `Floor ${f.floor} · +${goodsWords(f.items)}${f.stairs ? ' · the stairs!' : ''}`))}>Work a face · 1 action</Button>
      <div className="space-y-1 rounded-sm border border-hairline bg-panel px-2.5 py-2" data-stairs={found ? 'found' : `${at.stairs}/${need}`}>
        <p className="text-[13px]">
          <span className="font-semibold">The stairs · </span>
          <span className="text-ink-soft">{floor >= 30 ? 'the deepest floor' : found ? 'found' : `${plural(need - at.stairs, 'face')} to find them`}</span>
        </p>
        {found && (lock === null ? (
          <Button size="sm" variant="secondary" className="w-full" disabled={busy} data-action="stairs"
            onClick={() => run(stairsAt(dig).then(() => `Down to floor ${floor + 1}`))}>Take the stairs · free</Button>
        ) : <p className="text-[12px] text-ink-soft" data-stairs-lock>{lock.replace(/\.$/, '')}</p>)}
      </div>
      <p className="text-[12px] text-ink-faint">The {DIG_NAMES[dig]} keeps the deepest floor reached.</p>
      <ActionsLeft save={save} />
    </div>
  )
}
