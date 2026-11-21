import { byRelationship } from '../loop/relationship-order'
import {
  buildCostWords, buildLock, buildLockWords, dishesHeld, expeditionBlock, expeditionMemberBlock, expeditionMemberPower,
  expeditionCoverage, expeditionPower, expeditionSlots, EXPEDITION_REGIONS, EXPEDITION_WORDS, FAMILY_NAMES, BUILD_PLACES, farmRankOf, handsInOrder,
  itemNameOf, MAX_EXPEDITION_PARTY, MAX_EXPEDITION_SUPPLIES, MEALS_A_DAY, placeBuilt, REGION_IDS, type FarmSave, type RegionId,
  type TalentOf,
} from '@farm/domain'
import { Button, Sheet, Tabs } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useState } from 'react'
import { buildPlace, sendParty } from '../loop/actions'
import { plural, shortDate } from '../loop/words'
import { useStory } from '../story/story'

type Tab = 'regions' | 'party' | 'log'

export default function ExpeditionSheet({ save, nameOf, talentOf, onClose }: {
  save: FarmSave; nameOf: (id: string) => string; talentOf: TalentOf; onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('regions')
  const [region, setRegion] = useState<RegionId>('old-fort-ruins')
  const [party, setParty] = useState<string[]>([])
  const [supplies, setSupplies] = useState<string[]>([])
  const [pick, setPick] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const pack = useStory()
  const rank = farmRankOf(save.farm.points)
  if (rank < 7 && !placeBuilt(save, 'expeditions')) return null
  const built = placeBuilt(save, 'expeditions')
  const run = async (action: () => Promise<unknown>, done: () => void) => {
    setBusy(true)
    setNote(null)
    try { await action(); done() }
    catch (error) { setNote(error instanceof Error ? error.message : 'Try again.') }
    finally { setBusy(false) }
  }
  if (!built) {
    const place = BUILD_PLACES.find((p) => p.id === 'expeditions')!
    const ordered = save.farm.builds.includes('expeditions')
    const block = buildLockWords(buildLock(save, 'expeditions'))
    return (
      <Sheet open onClose={onClose} size="wide" title={place.name}>
        <p className="text-[14px]" data-expedition-build>{buildCostWords(place)}</p>
        {ordered ? <p>Builds tonight.</p> : (
          <Button className="mt-2" disabled={busy || block !== null}
            data-action="build-expeditions" onClick={() => void run(() => buildPlace('expeditions'), () => setNote('Builds tonight.'))}>Build</Button>
        )}
        {(note || (!ordered && block)) && <p className="text-[13px]" role="status">{note ?? block}</p>}
      </Sheet>
    )
  }
  const where = EXPEDITION_REGIONS[region]
  const block = expeditionBlock(save, region, party, supplies)
  const power = expeditionPower(save, party, supplies, talentOf)
  const dishRows = dishesHeld(save)
  const remaining = (key: string) => (dishRows.find((dish) => dish.key === key)?.count ?? 0)
    - supplies.filter((item) => item === key).length
  const mealCount = party.length * where.days * MEALS_A_DAY
  const coverage = expeditionCoverage(save, region, party, pack)
  return (
    <Sheet open onClose={onClose} size="wide" title="Expedition post"
      footer={tab === 'party' ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px]" role="status" data-expedition-power>{power} power / {where.need} needed
            <span className="block text-ink-soft">{note ?? block ?? `${mealCount} meals · ${where.days} days`}</span>
          </p>
          <Button data-action="send-expedition" disabled={busy || block !== null} onClick={() => void run(() => sendParty(region, party, supplies), () => {
            setParty([]); setSupplies([]); setNote('Leaves tonight.'); setTab('log')
          })}>Send · 1</Button>
        </div>
      ) : undefined}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Tabs label="Expeditions" value={tab} onChange={setTab}
          options={[{ value: 'regions', label: 'Regions' }, { value: 'party', label: 'Send a party' }, { value: 'log', label: 'Away and log' }]} />
        <GuideButton topic="expeditions" title="Expeditions" label="How expeditions work">
          <p>Farmhands work their usual shift before leaving tonight. Pack two meals per farmhand per day away. Takeout covers any shortage.</p>
          <p>Kitchen dishes add two power per star. Power near the region’s need can mean Success or Retreat.</p>
        </GuideButton>
      </div>
      {tab === 'regions' && (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Regions">
          {REGION_IDS.map((id) => {
            const r = EXPEDITION_REGIONS[id]
            return <li key={id} className="rounded-md border border-hairline p-2">
              <button type="button" data-expedition-region={id} disabled={rank < r.rank} className="block min-h-11 w-full text-left disabled:opacity-65"
                onClick={() => { setRegion(id); setTab('party'); setNote(null) }}>
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-[12px] text-ink-soft">
                  Lv {r.level} · {r.days} days · {r.need} power{rank < r.rank ? ` · Farm Rank ${r.rank}` : ''}
                </span>
                <span className="block text-[12px] text-ink-soft">{FAMILY_NAMES[r.family]} most often · tiers {r.tiers.join('–')}</span>
              </button>
            </li>
          })}
        </ul>
      )}
      {tab === 'party' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {party.length > 0 && <p className="text-[13px] sm:col-span-2" data-expedition-coverage>
            {plural(coverage.lost, 'farm shift')} missed · {coverage.fewest} farmhands on the quietest day
          </p>}
          <section aria-label="Farmhands">
            <h3 className="text-micro">{where.name} · {party.length}/{MAX_EXPEDITION_PARTY} farmhands</h3>
            {handsInOrder(save).length === 0 && <p className="text-[13px] text-ink-soft">No farmhands yet.</p>}
            <ul className="divide-y divide-hairline">
              {handsInOrder(save).sort(byRelationship(save)).map((id) => {
                const why = expeditionMemberBlock(save, id)
                const chosen = party.includes(id)
                return <li key={id}>
                  <label className="flex min-h-11 items-center gap-2 text-[14px]">
                    <input type="checkbox" data-expedition-hand={id} checked={chosen} disabled={why !== null || (!chosen && party.length >= MAX_EXPEDITION_PARTY)}
                      onChange={() => setParty((ids) => chosen ? ids.filter((x) => x !== id) : [...ids, id])} />
                    <span className="min-w-0 flex-1">{nameOf(id)}</span>
                    <span className="text-right text-[12px] text-ink-soft">{why ?? `${expeditionMemberPower(save, id, talentOf)} power`}</span>
                  </label>
                </li>
              })}
            </ul>
          </section>
          <section aria-label="Supplies">
            <h3 className="text-micro">Supplies · {supplies.length}/{MAX_EXPEDITION_SUPPLIES}</h3>
            {dishRows.length === 0 ? <p className="text-[13px] text-ink-soft">No dishes available.</p> : (
              <div className="flex gap-2">
                <select aria-label="Dish" className="min-h-11 min-w-0 flex-1 rounded-md border border-hairline bg-panel px-2" value={pick}
                  onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose a dish</option>
                  {dishRows.map((d) => <option key={d.key} value={d.key} disabled={remaining(d.key) <= 0}>{itemNameOf(d.id)} ★{d.stars} · {remaining(d.key)}</option>)}
                </select>
                <Button variant="secondary" disabled={!pick || remaining(pick) <= 0 || supplies.length >= MAX_EXPEDITION_SUPPLIES}
                  onClick={() => setSupplies((keys) => [...keys, pick])}>Add</Button>
              </div>
            )}
            <ul className="divide-y divide-hairline">
              {[...new Set(supplies)].map((key) => {
                const [id, stars] = key.split('@')
                return <li key={key} className="flex min-h-11 items-center justify-between gap-2 text-[13px]">
                  {itemNameOf(id!)} ★{stars} × {supplies.filter((k) => k === key).length}
                  <button type="button" className="min-h-11 px-2 text-ink-soft" aria-label={`Remove ${itemNameOf(id!)} ★${stars}`}
                    onClick={() => setSupplies((keys) => keys.filter((_, i) => i !== keys.lastIndexOf(key)))}>Remove</button>
                </li>
              })}
            </ul>
          </section>
        </div>
      )}
      {tab === 'log' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <section aria-label="Away">
            <h3 className="text-micro">Parties · {save.expeditions.length}/{expeditionSlots(rank)}</h3>
            {note && <p role="status" className="text-[13px]">{note}</p>}
            {save.expeditions.length === 0 ? <p className="text-[13px] text-ink-soft">No parties out.</p> : (
              <ul className="divide-y divide-hairline" data-expedition-away>
                {save.expeditions.map((trip) => <li key={trip.party[0]} className="py-2 text-[14px]">
                  <p className="font-semibold">{EXPEDITION_REGIONS[trip.region].name}</p>
                  <p>{trip.party.map(nameOf).join(', ')}</p>
                  <p className="text-[12px] text-ink-soft">{trip.left === save.calendar.day ? 'Leaves tonight · ' : 'Away · '}back {shortDate(trip.back, save.calendar)}</p>
                </li>)}
              </ul>
            )}
          </section>
          <section aria-label="Return log">
            <h3 className="text-micro">Return log</h3>
            {!save.expeditionLog?.length ? <p className="text-[13px] text-ink-soft">No returns yet.</p> : (
              <ul className="divide-y divide-hairline" data-expedition-log>
                {save.expeditionLog.map((log) => <li key={`${log.left}:${log.party[0]}`} className="py-1.5 text-[13px]">
                  <details>
                    <summary className="min-h-11 py-1">
                      <span className="font-semibold">{EXPEDITION_REGIONS[log.region].name} · {EXPEDITION_WORDS[log.result]}</span>
                      <span className="block text-ink-soft">{shortDate(log.back, save.calendar)} · {plural(log.back - log.left, 'day')} · {plural(Object.values(log.loot).reduce((a, b) => a + b, 0), 'good')}</span>
                    </summary>
                    <p className="pb-1">{log.party.map(nameOf).join(', ')}</p>
                    <ul>{Object.entries(log.loot).map(([key, count]) => {
                      const [id, stars] = key.split('@')
                      return <li key={key}>{itemNameOf(id!)} ★{stars} × {count}</li>
                    })}</ul>
                  </details>
                </li>)}
              </ul>
            )}
          </section>
        </div>
      )}
    </Sheet>
  )
}
