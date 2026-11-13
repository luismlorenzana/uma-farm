// A house that misses you, answered: under "⌂ Rose Cottage misses you", **Tonight ›**
// (tonight's house is that one: Tonight's Sleep at shows it picked) and **Another night** (the line put away for the day,
// costing nothing). Picked, "Tonight ✓". Never a penalty. Loaded on demand, the romance build only.
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useLoopSave } from '../save/game'
import { putAwayMisses, sleepTonight } from './homestead-actions'

export default function HouseAnswer({ house }: { house: number }) {
  const save = useLoopSave()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (save?.version !== 4) return null
  const run = (act: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    act().catch((err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  if (save.homestead.tonight === house && save.homestead.alone === null) return <p className="px-3 pb-2 text-[13px] font-semibold text-success" data-misses-answer="tonight">Tonight ✓</p>
  return (
    <div className="space-y-1 px-3 pb-2" data-misses-answer="open">
      <div className="grid grid-cols-2 gap-2">
        <Button size="md" disabled={busy} onClick={() => run(() => sleepTonight(house))} data-action="misses-tonight">Tonight ›</Button>
        <Button size="md" variant="secondary" disabled={busy} onClick={() => run(putAwayMisses)} data-action="misses-another">Another night</Button>
      </div>
      {error && <p className="text-[12px] text-danger" role="alert">{error}</p>}
    </div>
  )
}
