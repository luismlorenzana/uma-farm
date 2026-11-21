import { actionsLeft, eventActionsLeft, marriedCount } from '@farm/domain'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLoopSave } from '../save/game'
import { useSpecialDays } from '../story/story'

/** When the day's last action is spent, the day's work is done: a card says so over whatever page it was spent on, once,
 * with End the day and Not yet (for what's still free: the shop, a build, the evening). */
export default function OutOfActions() {
  const save = useLoopSave()
  const days = useSpecialDays()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const seen = useRef<{ day: number; left: number } | null>(null)
  const day = save?.calendar.day ?? null
  const left = save ? actionsLeft(save) : null
  useEffect(() => {
    if (day === null || left === null) return
    const before = seen.current
    seen.current = { day, left }
    if (before && before.day === day && before.left > 0 && left === 0) setOpen(true)
    if (before && before.day !== day) setOpen(false)
  }, [day, left])
  if (!open) return null
  const married = save ? marriedCount(save) : 0
  return (
    <Sheet open onClose={() => setOpen(false)} label="Out of actions" title="Out of actions"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} data-action="not-yet">Not yet</Button>
          <Button onClick={() => {
            setOpen(false)
            navigate(withParam(location, 'sheet', 'end'), { state: { back: true } })
          }} data-action="end-the-day">End the day</Button>
        </div>
      }>
      <p className="py-1 text-[15px]" data-out-of-actions>The daytime actions are spent. {married ? 'Night visits are available with your spouses.' : 'Night visits unlock after marriage.'} Town travel and shopping are free.</p>
      {married > 0 && <Button variant="secondary" className="w-full" onClick={() => {
        setOpen(false)
        navigate(withParam(location, 'visits', '1'), { state: { back: true } })
      }}>Night visits</Button>}
      {save && days && eventActionsLeft(save, days) > 0 && (
        <p className="text-[14px] text-ink-soft" data-event-actions-left>{eventActionsLeft(save, days)} left for events: the calendar has today’s.</p>
      )}
    </Sheet>
  )
}
