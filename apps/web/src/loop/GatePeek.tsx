// The Gate's quick look: the Gate is where the cast walks in, and it says what brings the next arrivals, never who, or
// that everyone is here. Loaded with the farm map.
import { FESTIVALS, nextArrivals, type Arrival, type FarmSave } from '@farm/domain'
import { useStory } from '../story/story'

/** What brings an arrival, in the Gate's words: "the Dorm's level 4", "the Fishing Derby". */
export function arrivalWords(arrival: Arrival): string {
  switch (arrival.kind) {
    case 'beds': return `the Dorm’s level ${arrival.dormLevel}`
    case 'festival': return `the ${FESTIVALS.find((f) => f.id === arrival.festival)?.name ?? arrival.festival}${arrival.year && arrival.year > 1 ? `, year ${arrival.year}` : ''}`
    case 'event': return 'a story event'
    case 'opening': return 'the opening'
  }
}

/** Up to three triggers, most likely first, or everyone here. */
export function GatePeek({ save }: { save: FarmSave }) {
  const story = useStory()
  const next = story ? nextArrivals(save, story) : []
  const waiting = story ? story.cast.umas.filter((u) => !save.roster[u.characterId]).length : 0
  return (
    <div className="space-y-1 p-4" data-peek="gate" data-arrivals={next.length}>
      {story && waiting === 0 ? <p className="text-[15px] font-semibold" data-everyone>Everyone is here.</p> : (
        <>
          <p className="text-[15px] font-semibold">Umas arrive here.</p>
          {next.length > 0 && <p className="text-[14px] text-ink-soft" data-next-arrivals>Next: {next.map(arrivalWords).join(' · ')}</p>}
        </>
      )}
    </div>
  )
}
