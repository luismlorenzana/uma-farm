import { DATE_PERIODS, dateSchedule, weekdayOf, weekdayShort, WEEKDAYS, type FarmSave, type SchedulePack } from '@farm/domain'

export function WeeklySchedule({ save, pack, id }: { save: FarmSave; pack: SchedulePack; id: string }) {
  const weekday = weekdayOf(save.calendar.day)
  const start = save.calendar.day - WEEKDAYS.indexOf(weekday)
  const baseline = { ...save, expeditions: [] }
  const week = WEEKDAYS.map((day, i) => ({ day, slots: dateSchedule(baseline, pack, id, start + i) }))
  const job = week.flatMap(({ slots }) => DATE_PERIODS.map(period => slots[period])).find(slot => slot.activity === 'town')
  return <section className="mb-3 space-y-1.5" aria-label="Weekly schedule" data-weekly-schedule>
    <h3 className="font-semibold">Weekly schedule</h3>
    {job && <p className="text-[12px] text-ink-soft">Town job · {job.label}</p>}
    <div className="overflow-x-auto rounded-md border border-hairline">
      <table className="w-full table-fixed border-collapse text-center text-[10px]">
        <thead><tr className="bg-sunken/70">
          <th scope="col" className="w-7"><span className="sr-only">Time</span></th>
          {week.map(({ day }) => <th key={day} scope="col" className={day === weekday ? 'py-1 text-accent' : 'py-1'}>{weekdayShort(day)}</th>)}
        </tr></thead>
        <tbody>{DATE_PERIODS.map(period => <tr key={period} className="border-t border-hairline" data-schedule-period={period}>
          <th scope="row" className="px-1 text-ink-soft">{period === 'morning' ? 'AM' : 'PM'}</th>
          {week.map(({ day, slots }) => {
            const { activity, label } = slots[period]
            return <td key={day} title={label} className={'border-l border-hairline px-0.5 py-2 leading-tight '
              + (activity === 'free' ? 'bg-emerald-900/15 text-ink' : 'text-ink-soft')}
              data-shift-day={day} data-shift-activity={activity}>
              {activity === 'free' ? 'Free' : activity === 'farm' ? 'Farm' : 'Town'}
              <span className="sr-only"> · {label}</span>
            </td>
          })}
        </tr>)}</tbody>
      </table>
    </div>
  </section>
}
