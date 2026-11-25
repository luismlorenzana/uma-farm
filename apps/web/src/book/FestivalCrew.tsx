import type { FarmSave } from '@farm/domain'
import { Link } from 'react-router'
import { useStory } from '../story/story'
import { useTalents } from '../loop/talents'
import { droppedOrders, forecastCrewOn, workPresets } from './work-plan'

export function FestivalImpact({ save, crew, calendar = true }: {
  save: FarmSave; crew: readonly string[]; calendar?: boolean
}) {
  const story = useStory()
  const { of: talents } = useTalents()
  const ids = [...new Set(crew.filter(Boolean))]
  if (!ids.length) return null
  const day = save.calendar.day
  const before = forecastCrewOn(save, day, story, talents)
  const after = forecastCrewOn(save, day, story, talents, new Set(ids))
  const dropped = droppedOrders(before, after)
  const names = new Map(workPresets(save).map(row => [row.key, row.label]))
  return <aside className="rounded-md border border-hairline p-2 text-xs" data-festival-impact>
    <p className="font-semibold">{ids.length} crew action{ids.length === 1 ? '' : 's'} for the contest</p>
    <p className="text-ink-soft">{save.today.crew ? 'Morning complete. Bookings use spare actions.'
      : dropped.length ? dropped.map(row => `${row.actions} fewer · ${names.get(row.key) ?? row.key}`).join(' · ')
      : 'Current forecast covers the same jobs.'}</p>
    {calendar && <Link className="flex min-h-11 items-center font-semibold text-accent" state={{ back: true }}
      to={`/book?view=work&workCalendar=1&workDay=${day}&festivalCrew=${encodeURIComponent(ids.join(','))}`}>Check Work Calendar ›</Link>}
  </aside>
}
