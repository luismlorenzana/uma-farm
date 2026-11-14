// The Gate's quick look: the Gate is where the cast walks in. Day 1's helper waits here after the opening: her name and
// **Say hello**, which plays her arrival scene (`?hello=<id>`). Then it says what brings the next arrivals, never who,
// or that everyone is here. Loaded with the farm map.
import { atTheGate, FESTIVALS, nextArrivals, type Arrival, type FarmSave } from '@farm/domain'
import { Link } from 'react-router'
import { useMaster } from '../master/master'
import { castIds, useStory } from '../story/story'

/** What brings an arrival, in the Gate's words: "the Dorm's level 4", "the Fishing Derby". */
export function arrivalWords(arrival: Arrival): string {
  switch (arrival.kind) {
    case 'beds': return `the Dorm’s level ${arrival.dormLevel}`
    case 'festival': return `the ${FESTIVALS.find((f) => f.id === arrival.festival)?.name ?? arrival.festival}${arrival.year && arrival.year > 1 ? `, year ${arrival.year}` : ''}`
    case 'event': return 'a story event'
  }
}

/** Who waits at the Gate, each with Say hello; then up to three triggers, most likely first, or everyone here. */
export function GatePeek({ save }: { save: FarmSave }) {
  const story = useStory()
  const master = useMaster()
  const next = story ? nextArrivals(save, story) : []
  const waiting = story ? story.cast.umas.filter((u) => !save.roster[u.characterId]).length : 0
  const visitors = atTheGate(save, castIds())
  const nameOf = (id: string): string => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'Someone'
  return (
    <div className="space-y-1 p-4" data-peek="gate" data-arrivals={next.length}>
      {visitors.map((id) => (
        <div key={id} className="space-y-2 pb-2" data-visitor={id}>
          <p className="text-[15px] font-semibold">{nameOf(id)} is waiting at the Gate.</p>
          <Link to={`/?hello=${id}`} className="font-display grid min-h-12 place-items-center rounded-md bg-accent text-[16px] font-bold text-accent-ink" data-action="hello">
            Say hello ›
          </Link>
        </div>
      ))}
      {story && waiting === 0 ? <p className="text-[15px] font-semibold" data-everyone>Everyone is here.</p> : (
        <>
          <p className="text-[15px] font-semibold">Umas arrive here.</p>
          {next.length > 0 && <p className="text-[14px] text-ink-soft" data-next-arrivals>Next: {next.map(arrivalWords).join(' · ')}</p>}
        </>
      )}
    </div>
  )
}
