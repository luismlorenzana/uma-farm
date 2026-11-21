import {
  DAYS_PER_YEAR, greaterLoveOf, isAnniversary, isBirthday, levelWords,
  longGameEnabled, nightAvailable, TRUE_LOVE, type FarmSave, type SpecialDays, type StoryPack,
} from '@farm/domain'
import { Link, useLocation } from 'react-router'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { nextCard } from '../loop/hearts-view'
import { dateWords } from '../loop/words'

function datesFor(save: FarmSave, days: SpecialDays, id: string) {
  const today = save.calendar.day
  const lookAhead = (holds: (day: number) => boolean) => {
    for (let day = today; day <= today + DAYS_PER_YEAR; day++) if (holds(day)) return day
    return null
  }
  const love = save.love[id]!
  const dates = [
    { title: 'Birthday', day: lookAhead(day => isBirthday(days.birthdays, id, day, save.calendar)) },
    { title: 'Anniversary', day: lookAhead(day => isAnniversary(love, day, save.calendar)) },
    { title: 'Planned wedding', day: love.weddingDay ?? null },
    { title: 'Expedition returns', day: save.expeditions.find(trip => trip.party.includes(id))?.back ?? null },
  ]
  return dates.flatMap(({ title, day }) => day === null ? [] : [{ title, day }]).sort((a, b) => a.day - b.day)
}

export function RelationshipPage({ save, pack, days, id, nameOf }: {
  save: FarmSave; pack: StoryPack; days: SpecialDays; id: string; nameOf: (id: string) => string
}) {
  const location = useLocation()
  const love = save.love[id]!
  const next = nextCard(save, pack, id, nameOf)
  const dates = datesFor(save, days, id)
  const heart = love.stage === 'spouse' && longGameEnabled(save, pack) ? greaterLoveOf(save, id) : null
  const calendarHref = (day: number) => {
    const query = new URLSearchParams(location.search)
    query.set('sheet', 'calendar')
    query.set('calendarDay', String(day))
    return `${location.pathname}?${query}`
  }
  return <>
    <div className="lib-head">
      <h2>Relationship</h2>
      <Link className="lib-button" to={`/hearts?uma=${encodeURIComponent(id)}`} state={{ back: true }}>Her actions ›</Link>
    </div>
    <div className="lib-relationship">
      <section aria-label="Current relationship" className="lib-relationship-card">
        <h3 data-relationship-standing>{levelWords(love, true)}</h3>
        <strong>{next.title}</strong>
        {next.bar.cost > 0 && <progress className="lib-greater-love" aria-label="Relationship points" value={next.bar.points} max={next.bar.cost} />}
        {next.words && <p>{next.words}</p>}
        {next.ready && <Link className="lib-button" to={withParam(location, 'event', id)} state={{ back: true }}>Play scene ›</Link>}
      </section>
      {heart && <section aria-label="Greater Love status" className="lib-relationship-card">
        <h3 data-book-love={heart.points}>{heart.points >= TRUE_LOVE ? 'True Love' : 'Greater Love'}</h3>
        <progress className="lib-greater-love" aria-label="Greater Love points" value={heart.points} max={TRUE_LOVE} />
        <p>{heart.points}/{TRUE_LOVE} {heart.points < TRUE_LOVE ? '· Spend time together at night' : ''}</p>
        {nightAvailable(save, pack, id) && <Link className="lib-button" to={withParam(location, 'visits', id)} state={{ back: true }}>Night visits ›</Link>}
      </section>}
      <section aria-label="Upcoming dates" className="lib-relationship-card">
        <h3>Dates together</h3>
        {dates.length ? <ul>
          {dates.map(({ title, day }) => <li key={title}>
            <Link className="lib-date-link" to={calendarHref(day)} state={{ back: true }} data-relationship-date={title}>
              <strong>{title}</strong>
              <span>{day === save.calendar.day ? 'Today' : dateWords(day, save.calendar)} ›</span>
            </Link>
          </li>)}
        </ul> : <p>No dates on the calendar yet.</p>}
      </section>
    </div>
  </>
}
