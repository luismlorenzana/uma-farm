// The Gate's quick look: the visitor waiting, her days left, her way to staying, Chat and Gift.
// With nobody waiting, when the next one may come, or why none will. A visitor reaching 2 hearts joins, and "She'd like
// to stay" shows over the map. Loaded with the farm map. On save v4 nobody visits: the Gate is where the
// cast walks in, and its quick look says what brings the next arrivals, never who.
import { daysLeft, favouriteActivity, FESTIVALS, freeBeds, nextArrivals, nextGateDay, type Arrival, type FarmSave, type SaveV3, type SaveV4 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useState } from 'react'
import { Link } from 'react-router'
import { useMaster } from '../master/master'
import { Hearts, JoinCard, StayBar, TalkButtons } from './Affinity'
import { useTalents } from './talents'
import { FavouriteMark } from './UmaMarks'
import { useStory } from '../story/story'
import { shortDate } from './words'

/** "6 days left", "Last day". */
const leftWords = (days: number): string => (days <= 1 ? 'Last day' : `${days} days left`)

/** What brings an arrival, in the Gate's words: "chapter 2's end", "the Dorm's level 4", "the Fishing Derby". */
export function arrivalWords(arrival: Arrival): string {
  switch (arrival.kind) {
    case 'chapter': return `chapter ${arrival.chapter}’s end`
    case 'beds': return `the Dorm’s level ${arrival.dormLevel}`
    case 'festival': return `the ${FESTIVALS.find((f) => f.id === arrival.festival)?.name ?? arrival.festival}${arrival.year && arrival.year > 1 ? `, year ${arrival.year}` : ''}`
    case 'event': return 'a story event'
    case 'opening': return 'the opening'
  }
}

export function GatePeek({ save }: { save: FarmSave }) {
  return save.version === 4 ? <ArrivalsPeek save={save} /> : <VisitorPeek save={save} />
}

/** v4's Gate: up to three triggers, most likely first, or everyone here. */
function ArrivalsPeek({ save }: { save: SaveV4 }) {
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

function VisitorPeek({ save }: { save: SaveV3 }) {
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const talents = useTalents()
  const [joined, setJoined] = useState<{ outfitId: string; home: boolean } | null>(null)
  const visitor = save.visitors.find((v) => v.from === 'gate') ?? save.visitors[0]
  const nameOf = (id: string) => view?.album.get(id)?.name ?? 'A visitor'
  const outfit = visitor ? view?.roster.find((o) => o.outfitId === visitor.outfitId) : undefined
  const favourite = outfit ? favouriteActivity(outfit) : null
  return (
    <div className="space-y-3 p-4" data-peek="gate" data-visitor={visitor?.outfitId ?? ''}>
      {visitor ? (
        <>
          <div className="flex items-center gap-3">
            <FaceTile outfitId={visitor.outfitId} size={72} label={nameOf(visitor.outfitId)}
              badges={favourite ? { topLeft: <FavouriteMark activity={favourite} /> } : undefined} />
            <div className="min-w-0">
              <p className="truncate font-display text-[18px] font-semibold">{nameOf(visitor.outfitId)}</p>
              <p className="text-[13px] text-ink-soft" data-days-left={daysLeft(save, visitor)}>Visiting · {leftWords(daysLeft(save, visitor))}</p>
              <Hearts affinity={visitor.affinity} />
            </div>
          </div>
          <StayBar affinity={visitor.affinity} />
          <TalkButtons save={save} outfitId={visitor.outfitId} name={nameOf(visitor.outfitId)} temperament={talents.table?.get(visitor.outfitId)?.temperament ?? null}
            onJoined={setJoined} />
        </>
      ) : (
        <div className="space-y-1" data-no-visitor>
          <p className="text-[15px] font-semibold">Nobody at the Gate.</p>
          {freeBeds(save) > 0
            ? <p className="text-[14px] text-ink-soft">A visitor may stop by on {shortDate(nextGateDay(save.calendar.day))}.</p>
            : <p className="text-[14px] text-ink-soft">Visitors come while a bed is free. <Link to="/dorm" className="font-semibold text-accent-strong underline">Upgrade the Dorm</Link>.</p>}
        </div>
      )}
      {joined && <JoinCard outfitId={joined.outfitId} home={joined.home} name={nameOf(joined.outfitId)} onClose={() => setJoined(null)} />}
    </div>
  )
}
