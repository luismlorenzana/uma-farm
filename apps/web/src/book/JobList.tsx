import { useState } from 'react'
import { Link } from 'react-router'
import { plural } from '../loop/words'
import { orderLink, type WorkRow } from './work-plan'

function JobLine({ row, nameOf, link }: { row: WorkRow; nameOf: (id: string) => string; link: boolean }) {
  const { need, lock, scheduled, worked } = row
  const assigned = worked.length ? worked.map(({ id, actions }) => nameOf(id) + ' · ' + plural(actions, 'action')).join(', ')
    : scheduled.length ? 'Scheduled · ' + scheduled.map(nameOf).join(', ') : ''
  const status = lock ?? (need ? need.blocked ? 'Needs supplies' : need.optional
    ? scheduled.length || worked.length ? 'Capacity left' : 'No worker scheduled'
    : scheduled.length || worked.length ? 'Needs more coverage' : 'Needs a worker'
    : worked.length ? 'Worked' : 'No work ready')
  return <li className="border-b border-hairline py-1.5" data-work-job={row.key}
    data-job-status={lock ? 'locked' : need?.blocked ? 'supplies' : need ? need.optional ? 'optional' : 'open' : worked.length ? 'worked' : 'idle'}>
    {link && !lock ? <Link to={orderLink(row.key)} state={{ back: true }} className="flex min-h-11 items-center justify-between gap-1 font-semibold text-accent-strong">
      {row.label}<span aria-hidden>›</span>
    </Link> : <strong className="block">{row.label}</strong>}
    {assigned && <p className={worked.length || scheduled.length ? 'rounded bg-emerald-100 px-1 text-emerald-900' : 'text-ink-soft'}>{assigned}</p>}
    <p className={need && !lock ? 'text-amber-900' : 'text-ink-soft'}>{status === 'No work ready' && row.idle ? row.idle : status}</p>
    {need && <p className="text-ink-soft">{need.need}</p>}
  </li>
}

export function JobList({ rows, nameOf, link = true }: { rows: WorkRow[]; nameOf: (id: string) => string; link?: boolean }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.filter(row => row.need || row.worked.length || row.scheduled.length)

  const groups: { title: string; rows: WorkRow[] }[] = [
    { title: 'Needs workers', rows: visible.filter(row => row.need && !row.need.optional && !row.need.blocked) },
    { title: 'Waiting for supplies', rows: visible.filter(row => row.need?.blocked) },
    { title: 'Available work', rows: visible.filter(row => row.need?.optional && !row.need.blocked) },
    { title: 'Scheduled and worked', rows: visible.filter(row => !row.need && (row.scheduled.length || row.worked.length)) },
    { title: 'Locked or idle', rows: visible.filter(row => !row.need && !row.scheduled.length && !row.worked.length) },
  ]
  return <section className="space-y-1" aria-label="Jobs by place">
    <div className="flex flex-wrap items-center justify-between gap-1">
      <h3 className="font-semibold">Jobs by place</h3>
      <button className="min-h-11 rounded border border-hairline px-2 text-[12px] font-semibold" type="button" aria-pressed={showAll}
        onClick={() => setShowAll(value => !value)}>{showAll ? 'Show active jobs' : 'Show all jobs'}</button>
    </div>
    {visible.length ? groups.filter(group => group.rows.length).map(group => <div key={group.title} className="pt-1">
      <h4 className="text-[12px] font-semibold text-ink-soft">{group.title} · {group.rows.length}</h4>
      <ul>{group.rows.map(row => <JobLine key={row.key} row={row} nameOf={nameOf} link={link} />)}</ul>
    </div>)
      : <p className="text-ink-soft">No work ready on this date.</p>}
  </section>
}
