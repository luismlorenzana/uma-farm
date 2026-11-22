// The rancher's (`/town?at=rancher&sheet=rancher`, from **Buy an animal** or **Buy fodder** at her post), a wide side
// panel in two columns: **Animals**, each of the seven with its home, its good and that good's price, and **Buy** at its
// price, or why not (its home to build, its Farm Rank, its home full, the gold); and **Fodder** for the silo, 10g a
// feed, a few amounts at a tap, up to its room. Buying is free once you're in town. Loaded on demand with the town.
import {
  animalGoodName, animalLock, ANIMAL_KINDS, ANIMALS, animalsIn, FODDER_PRICE, goodOf, HOME_NAMES, HOME_ROOM, SILO_ROOM, siloRoom, siloStands, starPrice,
  type AnimalKind, type FarmSave,
} from '@farm/domain'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useState } from 'react'
import { ItemIcon } from '../items/ItemIcon'
import { buyAnimalOf, buyFodderOf } from '../loop/actions'
import { useLoopSave } from '../save/game'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
const gold = (n: number): string => `${n.toLocaleString('en-US')}g`
/** Fodder's amounts at a tap. */
const FODDER_BUYS = [10, 40] as const

type Run = (job: () => Promise<unknown>, done: string) => void

export default function RancherSheet({ title, onClose }: { title: string; onClose: () => void }) {
  const save = useLoopSave()
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!save) return null
  const run: Run = (job, done) => {
    setBusy(true)
    setNote(null)
    job().then(() => setNote(done), (err: unknown) => setNote(errorWords(err))).finally(() => setBusy(false))
  }
  return (
    <Sheet open onClose={onClose} size="wide" title={title} label="The rancher’s"
      footer={<p className="min-h-5 text-center text-[13px] text-ink-soft" role={note ? 'status' : undefined} data-rancher-note>{note ?? `${gold(save.gold)} held`}</p>}>
      <div className="@container pb-1" data-rancher>
        <div className="grid gap-4 @xl:grid-cols-[3fr_2fr]">
          <Animals save={save} busy={busy} run={run} />
          <Fodder save={save} busy={busy} run={run} />
        </div>
      </div>
    </Sheet>
  )
}

function Animals({ save, busy, run }: { save: FarmSave; busy: boolean; run: Run }) {
  return (
    <section aria-label="Animals" data-animals>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-micro">Animals</h3>
        <GuideButton topic="animals" title="Animals" label="How animals work">
          <p>An animal moves into its home at once: chickens and ducks into the Coop, the rest into the Barn, {HOME_ROOM} to each.</p>
          <p>Each day, feed it (an action and a feed from the silo) and it leaves its good by morning; care for it (an action) and it grows fonder. Collect a building’s goods for an action.</p>
          <p>The more hearts, the better its goods’ stars: ten hearts is always ★5. One left hungry loses fondness, but never dies.</p>
        </GuideButton>
      </div>
      <ul className="divide-y divide-hairline rounded-md border border-hairline">
        {ANIMAL_KINDS.map((kind) => <AnimalRow key={kind} save={save} kind={kind} busy={busy} run={run} />)}
      </ul>
    </section>
  )
}

import { buyAnimal, buyFodder, recordPurchase } from '@farm/domain'
import { CreditPurchase } from '../loop/CreditPurchase'

function AnimalRow({ save, kind, busy, run }: { save: FarmSave; kind: AnimalKind; busy: boolean; run: Run }) {
  const rule = ANIMALS[kind]
  const lock = animalLock(save, kind)
  const short = lock === null && save.gold < rule.price
  const kept = animalsIn(save, rule.home).filter((a) => a.kind === kind).length
  return (
    <li className="flex min-h-14 items-center gap-2.5 px-2.5 py-1.5" data-buy-animal={kind} data-lock={lock ?? undefined}>
      <ItemIcon id={rule.good} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{rule.name}{kept > 0 ? <span className="font-normal text-ink-soft"> · {kept} on the farm</span> : null}</span>
        <span className="block truncate text-[12px] text-ink-soft">The {HOME_NAMES[rule.home]} · {animalGoodName(kind)} {gold(goodOf(rule.good) ? starPrice(rule.good, 1) : 0)}, a fed night</span>
      </span>
      {short && <CreditPurchase save={save} cost={rule.price} title={rule.name} lock={lock}
        order={s => recordPurchase(buyAnimal(s, kind).save, rule.name, rule.price)} />}
      {lock ? <span className="max-w-[40%] shrink-0 text-right text-[12px] text-ink-soft">{lock.replace(/\.$/, '')}</span> : (
        <Button size="sm" disabled={busy || short} data-action="buy-animal"
          onClick={() => run(() => buyAnimalOf(kind), `A ${rule.name.toLowerCase()} for the ${HOME_NAMES[rule.home]}`)}>{short ? `Need ${gold(rule.price)}` : `Buy · ${gold(rule.price)}`}</Button>
      )}
    </li>
  )
}

function Fodder({ save, busy, run }: { save: FarmSave; busy: boolean; run: Run }) {
  const room = siloRoom(save)
  const stands = siloStands(save)
  const amounts = [...FODDER_BUYS.filter((n) => n < room), ...(room > 0 ? [Math.min(room, 99)] : [])]
  return (
    <section aria-label="Fodder" className="space-y-2" data-fodder={save.ranch.silo}>
      <h3 className="text-micro">Fodder · {gold(FODDER_PRICE)} a feed</h3>
      {!stands ? <p className="text-[14px] text-ink-soft" data-no-silo>The silo stands with the Coop or the Barn: build one first.</p> : (
        <>
          <p className="text-[13px]"><span className="font-semibold">The silo · </span><span className="text-ink-soft tabular-nums">{save.ranch.silo} of {SILO_ROOM} feed</span></p>
          {room === 0 ? <p className="text-[13px] text-ink-soft">The silo is full.</p> : (
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(amounts)].map((n) => (
                save.gold < n * FODDER_PRICE ? <CreditPurchase key={n} save={save} cost={n * FODDER_PRICE} title={`${n} feed`}
                  order={s => recordPurchase(buyFodder(s, n), 'Fodder', n * FODDER_PRICE)} /> :
                <Button key={n} size="sm" variant={n === amounts.at(-1) ? 'primary' : 'secondary'} disabled={busy || save.gold < n * FODDER_PRICE} data-action="buy-fodder" data-count={n}
                  onClick={() => run(() => buyFodderOf(n), `${n} feed into the silo`)}>{n === room ? 'Fill it' : `${n}`} · {gold(n * FODDER_PRICE)}</Button>
              ))}
            </div>
          )}
          <p className="text-[12px] text-ink-faint">Or cut grass on a weeds tile at the farm, an action for 5.</p>
        </>
      )}
    </section>
  )
}
