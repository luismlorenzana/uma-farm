// The morning's invitation, answered (F50 decision 7; romance spec RM20, RM57's second line): under "✉ Stand-in 2: “Walk at
// dusk tonight?”", **Yes, tonight** and **Another day** while it stands unanswered; then "Tonight ✓" with **Play ›** (her
// evening over the morning, `?evening=`) once it's yes, or "Another day" once declined. The answer is `today.invites`',
// read as the card shows. Loaded on demand, the romance build only.
import { inviteDue, slotsLeft } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useLoopSave } from '../save/game'
import { answerInvitation } from './evening-actions'

export default function InviteAnswer({ id }: { id: string }) {
  const save = useLoopSave()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (save?.version !== 4) return null
  const invite = save.today.invites.find((i) => i.id === id)
  if (!invite) return null
  const answer = (yes: boolean) => {
    setBusy(true)
    setError(null)
    answerInvitation(id, yes ? 'yes' : 'no').catch((err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  if (invite.answer === 'no') return <p className="px-3 pb-2 text-[13px] text-ink-faint" data-invite-answer="no">Another day</p>
  if (invite.answer === 'yes') {
    return (
      <div className="flex min-h-11 items-center gap-2 px-3 pb-1" data-invite-answer="yes">
        <span className="flex-1 text-[13px] font-semibold text-success">{inviteDue(save, id) ? 'Tonight ✓' : 'Spent together ✓'}</span>
        {inviteDue(save, id) && (
          <Link to={withParam(location, 'evening', id)} state={{ back: true }} className="grid min-h-11 place-items-center rounded-sm bg-[#c2385e] px-3 text-[14px] font-bold text-white" data-action="play-evening">Play ›</Link>
        )}
      </div>
    )
  }
  const spent = slotsLeft(save).evenings === 0
  return (
    <div className="space-y-1 px-3 pb-2" data-invite-answer="open">
      <div className="grid grid-cols-2 gap-2">
        <Button size="md" disabled={busy || spent} onClick={() => answer(true)} data-action="invite-yes">Yes, tonight</Button>
        <Button size="md" variant="secondary" disabled={busy} onClick={() => answer(false)} data-action="invite-no">Another day</Button>
      </div>
      {spent && <p className="text-[12px] text-ink-soft">Tonight’s evening is spent.</p>}
      {error && <p className="text-[12px] text-danger" role="alert">{error}</p>}
    </div>
  )
}
