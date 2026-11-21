import {
  actionsLeft, anniversaryOffer, awayOn, birthdayOffer, canPlanWedding, DAYS_PER_YEAR, greaterLoveOf, isAnniversary, isBirthday,
  levelWords, longGameEnabled, nightAvailable, NIGHT_VISITS, nightVisits, occasionsLeft, occasionsOn,
  townLocation, TRUE_LOVE, whereYouMeet, type FarmSave, type SpecialDays, type StoryPack,
} from '@farm/domain'
import { Link, useLocation } from 'react-router'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { nextCard } from '../loop/hearts-view'
import { dateWords } from '../loop/words'

function datesFor(save: FarmSave, pack: StoryPack, days: SpecialDays, id: string) {
  const today = save.calendar.day
  const lookAhead = (holds: (day: number) => boolean) => {
    for (let day = today; day <= today + DAYS_PER_YEAR; day++) if (holds(day)) return day
    return null
  }
  const love = save.love[id]!
  const dates = [
    { title: 'Birthday', day: lookAhead(day => isBirthday(days.birthdays, id, day, save.calendar)) },
    { title: 'Anniversary', day: lookAhead(day => isAnniversary(love, day, save.calendar)) },
    { title: 'Planned wedding', day: love.weddingDay !== undefined && love.weddingDay >= today ? love.weddingDay : null },
    { title: 'Expedition returns', day: save.expeditions.find(trip => trip.party.includes(id))?.back ?? null },
  ]
  const upcoming = dates.flatMap(({ title, day }) => day === null ? [] : [{ title, day }])
  let sceneDays = 0
  for (let day = today; day < today + DAYS_PER_YEAR && sceneDays < 3; day++) {
    const occasions = day === today ? occasionsLeft(save, pack, days, id) : occasionsOn(save, pack, days, id, day)
    const names = occasions.filter(o => o.kind !== 'birthday' && o.kind !== 'anniversary').map(o => o.name)
    if (names.length) {
      upcoming.push({ title: names.join(' · '), day })
      sceneDays++
    }
  }
  return upcoming.sort((a, b) => a.day - b.day)
}

export function RelationshipPage({ save, pack, days, id, nameOf }: {
  save: FarmSave; pack: StoryPack; days: SpecialDays; id: string; nameOf: (id: string) => string
}) {
  const location = useLocation()
  const love = save.love[id]!
  const next = nextCard(save, pack, id, nameOf)
  const dates = datesFor(save, pack, days, id)
  const heart = love.stage === 'spouse' && longGameEnabled(save, pack) ? greaterLoveOf(save, id) : null
  const today = save.calendar.day
  const meet = whereYouMeet(save, pack, id)
  const away = awayOn(save, id, today)
  const talked = save.today.chats.includes(id)
  const canTalk = !talked && actionsLeft(save) > 0
  const talks = canTalk && (meet.here || meet.at !== null) ? 1 : 0
  const town = meet.at ? townLocation(pack, meet.at)?.name ?? 'Town' : null
  const talkStatus = talked ? 'Already talked today' : away ? 'Away on expedition' : !canTalk ? 'No actions left'
    : meet.here ? 'Costs 1 action' : town ? `Find her in town · ${town}` : 'At home today'
  const visits = nightVisits(save)
  const availableTonight = nightAvailable(save, pack, id)
  const remaining = availableTonight ? NIGHT_VISITS - visits.length : 0
  const hadVisits = visits.filter(visit => visit.who.includes(id)).length
  const nightOccasions = [
    birthdayOffer(save, id, days.birthdays) && 'Birthday night',
    anniversaryOffer(save, id) && 'Anniversary night',
  ].filter(Boolean)
  const heartsHref = `/hearts?uma=${encodeURIComponent(id)}`
  const calendarHref = (day: number) => {
    const query = new URLSearchParams(location.search)
    query.set('sheet', 'calendar')
    query.set('calendarDay', String(day))
    query.set('calendarUma', id)
    return `${location.pathname}?${query}`
  }
  return <>
    <div className="lib-head">
      <h2>Relationship</h2>
      <Link className="lib-button" to={heartsHref} state={{ back: true }}>Her actions ›</Link>
    </div>
    <div className="lib-relationship">
      <section aria-label="Current relationship" className="lib-relationship-card">
        <h3 data-relationship-standing>{levelWords(love, true)}</h3>
        <strong>{next.title}</strong>
        {next.bar.cost > 0 && <progress className="lib-greater-love" aria-label="Relationship points" value={next.bar.points} max={next.bar.cost} />}
        {next.words && <p>{next.words}</p>}
        {next.ready && <Link className="lib-button" to={withParam(location, 'event', id)} state={{ back: true }}>Play scene ›</Link>}
        {heart && <div className="mt-1 grid gap-1 border-t border-hairline pt-2">
          <h3 data-book-love={heart.points}>{heart.points >= TRUE_LOVE ? 'True Love' : 'Greater Love'}</h3>
          <progress className="lib-greater-love" aria-label="Greater Love points" value={heart.points} max={TRUE_LOVE} />
          <p>{heart.points}/{TRUE_LOVE} {heart.points < TRUE_LOVE ? '· Spend time together at night' : ''}</p>
        </div>}
      </section>
      <section aria-label="Time together today" className="lib-relationship-card">
        <h3>Time together today</h3>
        <p><strong data-talks-left={talks}>{talks} talk{talks === 1 ? '' : 's'} left</strong></p>
        <p>{talkStatus}</p>
        {canTalk && !meet.here && meet.at && <Link className="lib-button"
          to={`/town?${new URLSearchParams({ at: meet.at, uma: id })}`} state={{ back: true }}>Find her ›</Link>}
        {heart && <>
          <p><strong data-visits-left={remaining}>{remaining} of {NIGHT_VISITS} night visits left</strong></p>
          <p>{availableTonight ? 'Shared across spouses' : 'She’s unavailable tonight'}</p>
          {hadVisits > 0 && <p>{hadVisits} with her tonight</p>}
          {remaining > 0 && nightOccasions.length > 0 && <p>{nightOccasions.join(' · ')} available</p>}
          {remaining > 0 && <Link className="lib-button" to={withParam(location, 'visits', id)} state={{ back: true }}>Night visits ›</Link>}
        </>}
      </section>
      <section aria-label="Upcoming dates" className="lib-relationship-card lib-relationship-wide">
        <h3>Upcoming dates together</h3>
        {dates.length ? <ul>
          {dates.map(({ title, day }) => <li key={`${day}:${title}`}>
            <Link className="lib-date-link" to={calendarHref(day)} state={{ back: true }} data-relationship-date={title}>
              <strong>{title}</strong>
              <span>{day === save.calendar.day ? 'Today' : dateWords(day, save.calendar)} ›</span>
            </Link>
          </li>)}
        </ul> : <p>No dates on the calendar yet.</p>}
        {canPlanWedding(love) && love.weddingDay !== undefined && love.weddingDay < today &&
          <Link className="lib-date-link" to={`/?sheet=calendar&weddingPlan=${encodeURIComponent(id)}&calendarDay=${today + 1}`} state={{ back: true }}>
            <strong>Wedding date passed</strong><span>Pick a new date ›</span>
          </Link>}
      </section>
    </div>
  </>
}
