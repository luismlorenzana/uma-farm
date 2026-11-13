// The roster's album, shared by M4's `/roster` and the romance build's Hearts
// tab, whose Work view it is: everyone on the roster, home or away, as album cards on uma-kit's album
// chrome. Each card has her favourite line's mark and her best talent on her face, the page's corner mark (your hearts
// with her on v3, her level words on v4), and her best rank (or her rank and talent in the activity sorted by); away, it
// says so. The filters are where she is, her talent and rank in each activity and her favourite line; the sorts her talent
// score and rank points in a chosen activity, joined and name. A tap opens her sheet (`?uma=<id>`), whose Work side is
// `WorkSide`: her favourite line, the day she joined, where she is, and her nine activities with talent, rank, points and
// the next challenge. Loaded on demand.
import { ACTIVITY_NAMES, TALENT_GRADES, type FarmSave } from '@farm/domain'
import { AlbumChrome, FaceTile, type FaceTileBadges } from '@luismlorenzana/uma-kit/album'
import { emptyStateHint, runAlbumQuery, type AlbumQuery } from '@luismlorenzana/uma-kit/roster'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { MasterView } from '../master/master'
import {
  activityLines, cardLines, ROSTER_FACETS, ROSTER_QUERY, ROSTER_SORTS, rosterView, sortActivity, sortedFor, stepIn, umaRows, type LoopUmaRow,
} from './roster-view'
import { talentTable } from './talents'
import { FavouriteMark, TalentChip, umaBadges } from './UmaMarks'
import { shortDate } from './words'

/** Everyone on the roster as album rows, with the release's talents table. */
export function useRosterRows(save: FarmSave, master: MasterView) {
  const talents = talentTable(master)
  const rows = useMemo(() => umaRows(save, Object.keys(save.roster), master.album, talents, master.roster), [save, master, talents])
  return { rows, talents }
}

/** The album: the count line, the chrome's search, filters and sorts, and the three-column grid of cards. `corner` adds
 * the page's mark to her face's top right. */
export function RosterAlbum({ save, rows: base, corner }: { save: FarmSave; rows: readonly LoopUmaRow[]; corner?: (row: LoopUmaRow) => FaceTileBadges }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState<AlbumQuery>(ROSTER_QUERY)
  const [parameter, setParameter] = useState<string | null>(null)
  const activity = sortActivity(query, parameter)
  const view = rosterView(save)
  const rows = useMemo(() => sortedFor(base, activity ?? 'farming'), [base, activity])
  const result = runAlbumQuery(rows, ROSTER_FACETS, query)
  const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows])
  const shown = result.rows.flatMap((r) => byId.get(r.id) ?? [])
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
                  <FaceTile outfitId={row.id} size={72} badges={{ ...umaBadges(row), ...corner?.(row) }} label={row.name} className={row.home ? '' : 'opacity-60'} />
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
    </>
  )
}

/** Her favourite line, when she joined and where she is. */
export function WorkFacts({ row }: { row: LoopUmaRow }) {
  return (
    <div className="min-w-0 text-[13px] text-ink-soft">
      {row.favourite && <p data-favourite-line={row.favourite}>Favourite · {ACTIVITY_NAMES[row.favourite]} (×1.2 rank points)</p>}
      <p>Joined {shortDate(row.joined)}</p>
      <p data-where={row.home ? 'home' : 'away'}>{row.home ? 'On the farm' : <>Away · <Link to="/dorm" className="font-semibold text-accent-strong underline">swap at the Dorm</Link></>}</p>
    </div>
  )
}

/** Her nine activities (F21's sheet), each with talent, rank, points and the challenge toward her next rank. */
export function WorkSide({ row }: { row: LoopUmaRow }) {
  const lines = activityLines(row)
  return (
    <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="Talents and ranks" data-work-side={row.id}>
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
  )
}
