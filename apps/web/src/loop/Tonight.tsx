// Tonight: End the day's sheet while an evening slot
// is free and someone can spend it (a house is picked too). From the top: **Evening**, today's slot as "with Stand-in 2
// · Walk ✓" once spent, the Uma who said yes with **Play ›**, else **Pick someone ›** (skippable); festival night's own
// row on a festival day; then the nudge's line ("4 actions left · 2 dry") and **End the day** / **Back**. End the
// day never waits on the evening. An evening takes 2 of the day's actions. Picking and playing open the evening's player
// over it (`?evening=`), so Back from the card lands here again. Once anyone is married, **Tonight with** sits between the
// evening and the nudge's line: the night's companion, one spouse with a room, each row her face, her name and her
// house, ☕ when her house's breakfast is on tomorrow, "8 nights" for a house you haven't slept in lately, and on a
// birthday-alone wisher's birthday "her birthday, just you two"; the pick (else the night's default) is marked, and a tap
// picks her at once: her house is tonight's. She greets you in the morning. End the day never waits on it. Loaded on
// demand.
import { birthdaysOf, daySetState, marriedCount, type SaveV4, type StoryPack } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { Link, useLocation } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { MasterGate } from '../master/MasterGate'
import { tonightRows, type TonightRow } from './evening-view'
import { InviteChip } from './HeartMarks'
import { chooseTonight } from './homestead-actions'
import { companionViews, type CompanionView } from './homestead-view'
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
              {marriedCount(save) > 0 && <TonightWith rows={companionViews(save, pack, birthdaysOf(pack, master.birthdays), (id) => master.album.get(id)?.name ?? 'An Uma')} />}
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

/** Tonight with: the night's companion, one spouse with a room a row, the pick marked; a tap picks her at once.
 * Her house shows in full under her name. */
function TonightWith({ rows }: { rows: readonly CompanionView[] }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pick = (row: CompanionView) => {
    if (row.picked || busy) return
    setBusy(true)
    setError(null)
    chooseTonight(row.id, row.alone).catch((e: unknown) => setError(e instanceof Error ? e.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  return (
    <section aria-label="Tonight with" data-tonight-with>
      <h3 className="text-micro pb-1">Tonight with</h3>
      {rows.length === 0 && <p className="text-[13px] text-ink-soft" data-no-companion>No one has a room yet: build a house.</p>}
      <ul className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Tonight with">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" role="radio" aria-checked={row.picked} disabled={busy} onClick={() => pick(row)}
              className={`flex min-h-14 w-full items-center gap-2.5 rounded-md border px-2.5 text-left ${row.picked ? 'border-[#c2385e] bg-[#c2385e]/8' : 'border-hairline bg-panel'}`}
              data-companion={row.id} data-picked={row.picked || undefined}>
              <Avatar id={row.id} size={40} label={row.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{row.name}</span>
                <span className="flex items-center gap-1 truncate text-[12px] text-ink-soft">
                  <UiMark mark={row.house === 0 && !row.alone ? 'homestead/farmhouse' : 'homestead/house'} fallback={<span aria-hidden>⌂</span>} />
                  <span className="truncate">{row.home}{row.breakfast ? ' · ☕' : ''}{row.nights ? ` · ${row.nights}` : ''}</span>
                </span>
              </span>
              <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${row.picked ? 'border-[#c2385e]' : 'border-hairline-strong'}`}>
                {row.picked && <span className="size-2.5 rounded-full bg-[#c2385e]" />}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="pt-1 text-[12px] text-danger" role="alert">{error}</p>}
    </section>
  )
}
