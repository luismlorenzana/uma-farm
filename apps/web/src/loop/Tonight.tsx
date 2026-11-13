// Tonight: End the day's sheet while an evening slot
// is free and someone can spend it (a house is picked too). From the top: **Evening**, today's slot as "with Stand-in 2
// · Walk ✓" once spent, the Uma who said yes with **Play ›**, else **Pick someone ›** (skippable); festival night's own
// row on a festival day; then the nudge's line ("2 Umas idle · 3 to collect") and **End the day** / **Back**. End the
// day never waits on the evening. Picking and playing open the evening's player over it (`?evening=`), so Back from
// the card lands here again. Once anyone is married, **Sleep at** sits between the evening and the nudge's line: the
// Farmhouse and each house with someone home ("· 3 home"), ☕ when a resident's breakfast is on tomorrow, "8 nights"
// for one you haven't slept in lately, and on a birthday-alone wisher's birthday "Her room"; the pick (else the house
// slept in least lately) is marked, and a tap picks it at once. End the day never waits on it. Loaded on demand.
import { birthdaysOf, daySetState, marriedCount, type SaveV4, type StoryPack } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { Link, useLocation } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import { tonightRows, type TonightRow } from './evening-view'
import { InviteChip } from './HeartMarks'
import { sleepTonight } from './homestead-actions'
import { sleepViews, type SleepView } from './homestead-view'
import { useState } from 'react'
import { nudgeWords, shortDate } from './words'

export default function Tonight({ save, pack, pending, error, onEnd, onBack }: {
  save: SaveV4
  pack: Pick<StoryPack, 'cast' | 'bibles'>
  pending: boolean
  error: string | null
  onEnd: () => void
  onBack: () => void
}) {
  return (
    <Sheet
      open
      onClose={onBack}
      title={`Tonight · ${shortDate(save.calendar.day)}`}
      label="Tonight"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button onClick={onEnd} disabled={pending} data-action="end-day">{error ? 'Try again' : 'End the day'}</Button>
        </div>
      }
    >
      <div className="space-y-3 pb-1" data-tonight={save.calendar.day}>
        <MasterGate skeleton={<p className="text-ink-soft">…</p>}>
          {(master) => (
            <>
              <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="The evening">
                {tonightRows(save, pack, (id) => master.album.get(id)?.name ?? 'An Uma').map((row, i) => <li key={`${row.slot}:${i}`}><EveningRow row={row} /></li>)}
              </ul>
              {marriedCount(save) > 0 && (
                <SleepAt rows={sleepViews(save, pack, birthdaysOf(pack, master.birthdays), (id) => master.album.get(id)?.name ?? 'An Uma')}
                  nameOf={(id) => master.album.get(id)?.name ?? 'An Uma'} />
              )}
            </>
          )}
        </MasterGate>
        <p className="font-display text-[17px] font-semibold" data-end-line>{nudgeWords(daySetState(save))}</p>
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>
    </Sheet>
  )
}

/** One slot's row: its name, then who and what, Play › or Pick someone ›. */
function EveningRow({ row }: { row: TonightRow }) {
  const location = useLocation()
  const label = row.slot === 'festival' ? 'Festival night' : 'Evening'
  const head = (
    <span className="flex w-24 shrink-0 items-center gap-1 text-[13px] font-semibold text-ink-soft">
      <UiMark mark="hearts/evening" fallback={<span aria-hidden>☾</span>} />{label}
    </span>
  )
  switch (row.state) {
    case 'spent': return <div className="flex min-h-12 items-center gap-2 px-3 text-[15px]" data-evening-row={row.slot} data-state="spent">{head}<span className="min-w-0 flex-1">{row.text}</span></div>
    case 'none': return <div className="flex min-h-12 items-center gap-2 px-3 text-[14px] text-ink-faint" data-evening-row={row.slot} data-state="none">{head}<span>{row.text}</span></div>
    case 'invited': return (
      <div data-evening-row={row.slot} data-state="invited">
        <div className="flex min-h-12 items-center gap-2 px-3 text-[15px]">
          {head}
          <span className="flex min-w-0 flex-1 items-center gap-1"><InviteChip /><span className="truncate">{row.text}</span></span>
          <Link to={withParam(location, 'evening', row.with)} state={{ back: true }} className="grid min-h-11 shrink-0 place-items-center rounded-sm bg-[#c2385e] px-3 text-[14px] font-bold text-white" data-action="play-evening">Play ›</Link>
        </div>
        <Link to={withParam(location, 'evening', 'pick')} state={{ back: true }} className="flex min-h-11 items-center justify-end px-3 text-[13px] text-ink-soft" data-action="pick-else">Someone else ›</Link>
      </div>
    )
    case 'free': return (
      <div className="flex min-h-12 items-center gap-2 px-3" data-evening-row={row.slot} data-state="free">
        {head}
        <Link to={withParam(location, 'evening', 'pick')} state={{ back: true }} className="grid min-h-11 flex-1 place-items-center rounded-sm border border-[#e0567a] px-3 text-[14px] font-bold text-[#c2385e]" data-action="pick-someone">
          {row.text}
        </Link>
      </div>
    )
  }
}

/** Sleep at: one row a house, the pick marked; a tap picks it at once. */
function SleepAt({ rows, nameOf }: { rows: readonly SleepView[]; nameOf: (id: string) => string }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pick = (row: SleepView) => {
    if (row.picked || busy) return
    setBusy(true)
    setError(null)
    sleepTonight(row.house, row.alone).catch((e: unknown) => setError(e instanceof Error ? e.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  return (
    <section aria-label="Sleep at" data-sleep-at>
      <h3 className="text-micro pb-1">Sleep at</h3>
      <ul className="divide-y divide-hairline rounded-md border border-hairline" role="radiogroup" aria-label="Sleep at">
        {rows.map((row) => (
          <li key={row.key}>
            <button type="button" role="radio" aria-checked={row.picked} disabled={busy} onClick={() => pick(row)}
              className="flex min-h-12 w-full items-center gap-2 px-3 text-left" data-sleep={row.key} data-picked={row.picked || undefined}>
              <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${row.picked ? 'border-[#c2385e]' : 'border-hairline-strong'}`}>
                {row.picked && <span className="size-2.5 rounded-full bg-[#c2385e]" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <UiMark mark={row.house === 0 && !row.alone ? 'homestead/farmhouse' : 'homestead/house'} fallback={<span aria-hidden>⌂</span>} />
                  <span className="truncate text-[15px] font-semibold">{row.name}</span>
                </span>
                <span className="block truncate text-[13px] text-ink-soft">
                  {row.home}{row.breakfast ? ' · ☕' : ''}{row.nights ? ` · ${row.nights}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 -space-x-2">
                {row.residents.slice(0, 4).map((id) => <FaceTile key={id} outfitId={id} size={28} label={nameOf(id)} round />)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="pt-1 text-[12px] text-danger" role="alert">{error}</p>}
    </section>
  )
}
