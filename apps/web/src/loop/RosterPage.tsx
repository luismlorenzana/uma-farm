// `/roster` (F18; F21 decision 7; F23 decision 11; FC19): everyone on the roster, home or away, as
// album cards on uma-kit's album chrome. Each card has her favourite line's mark and her best talent on her face, your
// hearts with her in its corner, and her best rank (or her rank and talent in the activity sorted by); away, it says so.
// The filters are where she is, her talent and rank in each activity and her favourite line; the sorts her talent score
// and rank points in a chosen activity, joined and name. A tap opens her sheet (`?uma=<id>`): your hearts with her, Chat
// and Gift, where she is, and her nine activities with talent, rank, points and the next challenge. Loaded on demand.
import { ACTIVITY_NAMES, heartsOf, TALENT_GRADES, type SaveV3, type Temperament } from '@farm/domain'
import { AlbumChrome, FaceTile } from '@luismlorenzana/uma-kit/album'
import { emptyStateHint, runAlbumQuery, type AlbumQuery } from '@luismlorenzana/uma-kit/roster'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { HelpButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { Hearts, TalkButtons } from './Affinity'
import {
  activityLines, cardLines, ROSTER_FACETS, ROSTER_QUERY, ROSTER_SORTS, rosterView, sortActivity, sortedFor, stepIn, umaRows, type LoopUmaRow,
} from './roster-view'
import { talentTable } from './talents'
import { FavouriteMark, TalentChip, umaBadges } from './UmaMarks'
import { shortDate } from './words'

export default function RosterPage() {
  const save = useLoopSave()
  if (!save) return null
  return (
    <main className="absolute inset-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-28" data-page="roster">
      <div className="flex items-center justify-between gap-2 pb-2">
        <h1 className="font-display text-[22px] font-bold text-ink">Roster</h1>
        <HelpButton title="Talents and ranks" label="About talents and ranks">
          <p>Each Uma has a talent, G to S, in each activity, from her stats. Talent lifts her yield, her stars and how fast she ranks up.</p>
          <p>She climbs six ranks in each: Novice, Hand, Skilled, Expert, Master, Legend. A day of work earns rank points; a rank comes when its points are reached and its challenge is met, at night.</p>
          <p>Her favourite line (the mark on her face) earns ×1.2 rank points. She can work anywhere.</p>
          <p>The hearts are your affinity with her: chat once a day and give a gift once a day. Goods of her favourite line please her most. At 5 hearts she earns 5% more rank points, at 10 hearts 10%.</p>
          <p>Umas beyond the Dorm’s beds are away on their off-season. Swap them in at the Dorm.</p>
        </HelpButton>
      </div>
      <MasterGate>{(master) => <Roster save={save} master={master} />}</MasterGate>
    </main>
  )
}

function Roster({ save, master }: { save: SaveV3; master: MasterView }) {
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const [params] = useSearchParams()
  const [query, setQuery] = useState<AlbumQuery>(ROSTER_QUERY)
  const [parameter, setParameter] = useState<string | null>(null)
  const activity = sortActivity(query, parameter)
  const talents = talentTable(master)
  const view = rosterView(save)
  const base = useMemo(() => umaRows(save, Object.keys(save.roster), master.album, talents, master.roster), [save, master, talents])
  const rows = useMemo(() => sortedFor(base, activity ?? 'farming'), [base, activity])
  const result = runAlbumQuery(rows, ROSTER_FACETS, query)
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows])
  const shown = result.rows.flatMap((r) => byId.get(r.id) ?? [])
  const open = byId.get(params.get('uma') ?? '')
  const sortLabel = activity ? `${ACTIVITY_NAMES[activity]} ${query.sort === 'points' ? 'rank points' : 'talent'}` : query.sort === 'name' ? 'name' : 'joined'
  return (
    <>
      <p className="pb-2 text-[13px] text-ink-soft">{view.home.length} on the farm{view.away > 0 ? ` · ${view.away} away` : ''} · by {sortLabel}</p>
      <AlbumChrome
        compact
        title="Roster"
        facets={ROSTER_FACETS}
        sorts={ROSTER_SORTS}
        query={query}
        counts={result.counts}
        total={result.total}
        parameter={parameter}
        emptyHint={emptyStateHint(rows, ROSTER_FACETS, query)}
        countFor={(draft) => runAlbumQuery(rows, ROSTER_FACETS, draft).total}
        onQueryChange={setQuery}
        onParameterChange={setParameter}
      >
        <ul className="grid grid-cols-3 gap-x-2 gap-y-3 pt-2" data-roster-cards>
          {shown.map((row) => {
            const [first, second] = cardLines(row, activity, query.sort === 'points')
            return (
              <li key={row.id}>
                <button type="button" onClick={() => navigate(withParam(location, 'uma', row.id), { state: { back: true } })} data-away={row.home ? undefined : true}
                  className="flex w-full min-w-0 flex-col items-center gap-0.5 text-center" data-uma={row.id} aria-label={`${row.name}, ${first}${row.home ? '' : ', away'}`}>
                  <FaceTile outfitId={row.id} size={72} badges={{ ...umaBadges(row), ...heartBadge(row.affinity) }} label={row.name} className={row.home ? '' : 'opacity-60'} />
                  <span className="w-full truncate text-[13px] font-semibold text-ink">{row.name}</span>
                  <span className="w-full truncate text-[12px] text-ink-soft" data-card-rank>{first}</span>
                  {row.home
                    ? second && <span className="w-full truncate text-[11px] text-ink-faint" data-card-note>{second}</span>
                    : <span className="w-full truncate text-[11px] font-semibold text-ink-soft" data-card-away>Away</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </AlbumChrome>
      {open && <UmaSheet save={save} row={open} temperament={talents?.get(open.id)?.temperament ?? null} onClose={() => leave(withParam(location, 'uma', null))} />}
    </>
  )
}

/** Your hearts with her, in her face's top-right corner, once there's one (F23). */
function heartBadge(affinity: number) {
  const hearts = heartsOf(affinity)
  return hearts > 0 ? { topRight: <span className="rounded-full bg-white/90 px-1 text-[11px] font-bold text-[#c2385e] shadow-1 ring-1 ring-black/10" data-card-hearts={hearts}>♥{hearts}</span> } : {}
}

/** Her sheet: your hearts with her, Chat and Gift (F23), where she is, her favourite line, when she joined, and her nine
 * activities, each with talent, rank, points and the challenge toward her next rank. */
function UmaSheet({ save, row, temperament, onClose }: { save: SaveV3; row: LoopUmaRow; temperament: Temperament | null; onClose: () => void }) {
  const lines = activityLines(row)
  return (
    <Sheet open onClose={onClose} title={row.name} label={`${row.name}: talents and ranks`}>
      <div className="flex items-center gap-3 pb-3" data-uma-sheet={row.id}>
        <FaceTile outfitId={row.id} size={56} badges={umaBadges(row)} label={row.name} />
        <div className="min-w-0 text-[13px] text-ink-soft">
          {row.favourite && <p data-favourite-line={row.favourite}>Favourite · {ACTIVITY_NAMES[row.favourite]} (×1.2 rank points)</p>}
          <p>Joined {shortDate(row.joined)}</p>
          <p data-where={row.home ? 'home' : 'away'}>{row.home ? 'On the farm' : <>Away · <Link to="/dorm" className="font-semibold text-accent-strong underline">swap at the Dorm</Link></>}</p>
        </div>
      </div>
      <div className="space-y-2 pb-3">
        <Hearts affinity={row.affinity} />
        <TalkButtons save={save} outfitId={row.id} name={row.name} temperament={temperament} />
      </div>
      <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="Talents and ranks">
        {lines.map((line) => (
          <li key={line.activity} className="px-3 py-2" data-activity={line.activity} data-rank={line.rank} data-points={row.ranks[line.activity].points}>
            <div className="flex items-center gap-2">
              <TalentChip step={stepIn(row, line.activity)} label={`${ACTIVITY_NAMES[line.activity]} talent ${TALENT_GRADES[stepIn(row, line.activity)]}`} />
              <span className="text-[14px] font-semibold">{ACTIVITY_NAMES[line.activity]}</span>
              {line.favourite && <FavouriteMark activity={line.activity} size={16} />}
              <span className="ml-auto text-[13px] tabular-nums">{line.rank} · {line.points}</span>
            </div>
            {line.challenge && (
              <p className="pt-0.5 text-[12px] text-ink-soft">
                {line.tonight ? <strong className="text-success">Ranks up tonight · </strong> : line.full ? <strong className="text-ink">Points full · </strong> : 'Next: '}
                {line.challenge}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
