import { shortDate } from '../loop/words'
import { forecastCrewOn } from './work-plan'
import { dateOf, weekdayOf, weekdayShort, type FarmSave, type StoryPack, type TalentOf } from '@farm/domain'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

export function WeeklyCoverage({ save, story, talents }: { save: FarmSave; story: StoryPack | null; talents: TalentOf }) {
  const [open, setOpen] = useState(false)
  const week = useMemo(() => open ? Array.from({ length: 7 }, (_, i) => {
    const day = save.calendar.day + i
    return { day, ...forecastCrewOn(save, day, story, talents) }
  }) : [], [open, save, story, talents])
  return <details className="rounded border border-hairline bg-panel px-2" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer py-2 font-semibold">Next 7 days</summary>
    <p className="text-[12px] text-ink-soft">Forecast from current crops, stock and orders. Actual jobs update each shift.</p>
    <ul className="divide-y divide-hairline" aria-label="Weekly work coverage">
      {week.map(({ day, lines, needs, snapshot }) => {
        const daily = needs.filter(({ optional, task }) => !optional && ['care', 'water', 'cook'].includes(task.kind))
        const openJobs = daily.filter(need => !need.blocked).length
        const supplies = daily.length - openJobs
        const { day: date } = dateOf(day, save.calendar)
        return <li key={day} data-weekly-day={day}>
          <Link to={`/book?view=work&workCalendar=1&workDay=${day}`} state={{ back: true }}
            className="grid min-h-11 grid-cols-[auto_1fr] items-center gap-x-3 py-1 text-[13px]">
            <strong title={shortDate(day, save.calendar)}>{weekdayShort(weekdayOf(day))} {date} ›</strong>
            <span>{lines.length} on shift · {lines.filter(line => snapshot.roster[line.id]?.autoWork).length} auto
              {openJobs > 0 && <span className="ml-2 rounded bg-amber-100 px-1 text-amber-950">{openJobs} daily jobs open</span>}
              {supplies > 0 && <span className="ml-2 text-ink-soft">{supplies} need supplies</span>}
            </span>
          </Link>
        </li>
      })}
    </ul>
  </details>
}
