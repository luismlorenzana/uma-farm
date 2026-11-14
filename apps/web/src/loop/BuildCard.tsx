// A place's Build card: its cost in gold and the farm's goods, each with what the farm holds, what still stands in the
// way, and **Build · 1,000g · 20 logs**. Paying takes the gold and the cheapest goods now; the place stands the next
// morning ("Builds tonight" until then). A place whose game isn't built yet shows what it'll cost and "Not built yet",
// and can't be bought. In a place's quick look, the stations' pages and the Dock's (the Boat after it). The place is named
// as the map names it (the pack's `world.json`, else the game's own). Loaded on demand.
import { buildCostWords, buildGoodsWords, buildLock, buildLockWords, buildNeeds, placeNameOf, type BuildPlace, type FarmSave } from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useStory } from '../story/story'
import { buildPlace } from './actions'
import { theName } from './words'

const gold = (n: number): string => `${n.toLocaleString('en-US')}g`
const upper = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

/** A place's cost, what's held, the lock and Build. `say` puts a line in the screen's note. */
export function BuildCard({ save, place, say }: { save: FarmSave; place: BuildPlace; say: (text: string) => void }) {
  const [busy, setBusy] = useState(false)
  const name = placeNameOf(useStory(), place.id)
  const lock = buildLock(save, place.id)
  // "Not built yet" is the button's own words; paid today, the cost is spent and only "Builds tonight" shows.
  const why = lock?.by === 'game' ? null : buildLockWords(lock)
  if (lock?.by === 'tonight') {
    return (
      <section className="rounded-md border border-dashed border-hairline-strong p-3" data-build={place.id} data-lock="tonight">
        <p className="text-[14px]" data-build-lock>{why}</p>
      </section>
    )
  }
  const needs = buildNeeds(save, place)
  const cost = place.opens.cost
  const row = (key: string, what: string, have: string, ok: boolean) => (
    <li key={key} className="flex min-h-9 items-center gap-2 text-[14px]" data-cost={key} data-ok={ok || undefined}>
      <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold ${ok ? 'bg-success text-white' : 'border border-hairline-strong'}`} aria-hidden>
        {ok ? '✓' : ''}
      </span>
      <span className="flex-1">{what}</span>
      <span className="text-[13px] text-ink-soft">{have}</span>
    </li>
  )
  return (
    <section className="space-y-2 rounded-md border border-dashed border-hairline-strong p-3" data-build={place.id} data-lock={lock?.by ?? undefined}>
      <p className="text-micro text-ink-soft">To build · Farm Rank {place.opens.rank}</p>
      <ul aria-label="What it takes">
        {row('gold', gold(cost.gold), `${gold(save.gold)} held`, save.gold >= cost.gold)}
        {needs.map((n) => row(`${n.goods.family}:${n.goods.refined}`, buildGoodsWords(n.goods), `${n.have.toLocaleString('en-US')} held`, n.have >= n.goods.count))}
      </ul>
      {why && <p className="text-[13px] text-ink-soft" data-build-lock>{why}</p>}
      {lock?.by !== 'built' && (
        <Button className="w-full" disabled={lock !== null || busy} data-action="build"
          onClick={() => {
            setBusy(true)
            buildPlace(place.id).then(() => say(`${upper(theName(name))} stands tomorrow.`), (err: unknown) => say(errorWords(err))).finally(() => setBusy(false))
          }}>
          {lock?.by === 'game' ? 'Not built yet' : `Build · ${buildCostWords(place)}`}
        </Button>
      )}
    </section>
  )
}
