// `/hearts`: the Umas' page, People on the rail.
// Two views: **Hearts** (the default) and **Work** (`?view=work`, the roster's album moved whole, each card's corner her
// level words). The Hearts view is one 72 pt row an Uma you've met: her face, name, her chapter at a glance ("Ch. 2 ·
// Together") and chips (● Ready, ✉ an invitation, In town), her
// level and her ladder's hearts as a bar in the stage's colour with the filling heart and "points/cost", then the most
// useful line, what's banked and today's chat and gift ticks. Ready rows first, then the least progress, then the
// cast's order; filter chips with their counts (`?filter=`); the header's "Married n/N" (N everyone you've met), the
// evening's marks (○ free,
// ● spent, festival night's in its season's colour) and the (i). Her profile opens
// from either view at `?uma=<characterId>`, on the side the view names. Loaded on demand.
import { festivalOn, festivalsOf, householdReady, householdTitle, ladderOf, type LadderName, type SaveV4 } from '@farm/domain'
import type { FaceTileBadges } from '@luismlorenzana/uma-kit/album'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Chip, Tabs, UiMark } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { MasterGate } from '../master/MasterGate'
import { useMaster, type MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { EVENING_HELP, headerMarks } from './evening-view'
import { AwayChip, FillingHeart, HeartSegments, InviteChip, ReadyChip } from './HeartMarks'
import { HeartProfile, type ProfileSide } from './HeartProfile'
import { filterCounts, glanceWords, HEART_FILTERS, heartRows, isHeartFilter, levelShort, marriedOf, type HeartRow, type HeartsPack } from './hearts-view'
import { RosterAlbum, useRosterRows } from './RosterAlbum'
import { SEASON_COLOR } from './words'

export default function HeartsPage() {
  const save = useLoopSave()
  const pack = useStory()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const view: ProfileSide = params.get('view') === 'work' ? 'work' : 'hearts'
  if (!save) return null
  // The view rides in the URL, so the profile's Hearts | Work and the tab's switch are one; replacing keeps Back's way.
  const setView = (next: ProfileSide) => navigate(withParam(location, 'view', next === 'work' ? 'work' : null), { replace: true, state: location.state })
  const married = marriedOf(save)
  return (
    <main className="@container absolute inset-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-6" data-page="hearts" data-view={view}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-2">
        <h1 className="font-display text-[22px] font-bold text-ink">People</h1>
        <span className="text-[13px] font-semibold text-ink-soft tabular-nums" data-married={`${married.married}/${married.met}`}>Married {married.married}/{married.met}</span>
        {pack && householdReady(save).sort((a, b) => Number(b === 'cohort:50') - Number(a === 'cohort:50')).slice(0, 1).map((id) => (
          <Link key={id} to={`/hearts?household=${id}`} state={{ back: true }} aria-label={`${householdTitle(id)}: Ready`}
            className="grid min-h-11 shrink-0 place-items-center rounded-full bg-[#d9a227]/15 px-2.5 text-[12px] font-bold whitespace-nowrap text-[#8a6a14]" data-household-ready={id}>
            ⌂ {id === 'finale' ? 'Harvest' : id.startsWith('household:') ? `Scene ${householdTitle(id).slice(-1)}` : householdTitle(id)} ›
          </Link>
        ))}
        <EveningMarks save={save} />
        <Link to="/library" className="flex min-h-11 items-center text-[13px] font-semibold text-accent-strong">Library ›</Link>
        <span className="ml-auto">
          {view === 'hearts' ? (
            <GuideButton topic="relationships" title="Hearts" label="About hearts">
              <p>Her bar fills as you chat (+15), praise her work (+20) and give gifts, and from a day at her favourite line (+10). Points past a full bar are banked, never lost.</p>
              <p>Everyone you’ve met is here. You meet her in town, by introducing yourself: everyone lives there from day one.</p>
              <p>A full bar makes her next event Ready (● Ready). Some also need a setup, such as working a place that day. She must live on the farm: invite her from town when a bed is free.</p>
              <p>Each Uma plays one of her events a day, and each level comes when its event plays.</p>
              <p>Her story runs in chapters, from meeting her to married life. A chapter may wait for the farm first, such as a place built; her profile says what it needs.</p>
              <p>Gifts: loved +60, liked +30, others +10, disliked 0, and more for more stars. Her loved gift shows from Friendship 1; the rest as you learn them, and all from Friendship 7.</p>
              <p>{EVENING_HELP}</p>
            </GuideButton>
          ) : (
            <GuideButton topic="aptitudes" title="Talents and ranks" label="About talents and ranks">
              <p>Each Uma has a talent, G to S, in each activity, from her stats. Talent lifts her yield, her stars and how fast she ranks up.</p>
              <p>She climbs six ranks in each: Novice, Hand, Skilled, Expert, Master, Legend. A day of work earns rank points; a rank comes when its points are reached and its challenge is met, at night.</p>
              <p>Her favourite line (the mark on her face) earns ×1.2 rank points; from Friendship 5 she earns 5% more, from Friendship 10, 10%.</p>
              <p>Everyone you meet lives in town. A farmhand comes to work on her farm days, the days her life in town leaves free; only a spouse moves onto the farm, into her room.</p>
            </GuideButton>
          )}
        </span>
      </div>
      <Tabs label="Views" value={view} onChange={setView} className="mb-3" options={[{ value: 'hearts', label: 'Hearts' }, { value: 'work', label: 'Work' }]} />
      <MasterGate>{(master) => (pack ? <Hearts save={save} pack={pack} master={master} view={view} onView={setView} /> : null)}</MasterGate>
    </main>
  )
}

/** The evening's marks: "Evening" with ○ a free slot and ● a spent one, the evenings first, festival
 * night's in its festival's season colour. */
function EveningMarks({ save }: { save: SaveV4 }) {
  const master = useMaster()
  const year = festivalsOf(useStory())
  const nameOf = (id: string) => (master.status === 'ready' ? master.view.album.get(id)?.name ?? 'An Uma' : 'An Uma')
  const marks = headerMarks(save, nameOf, year)
  const festival = festivalOn(save.calendar.day, year)
  return (
    <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-ink-soft" data-evening-marks={marks.map((m) => (m.spent ? '●' : '○')).join('')}>
      <UiMark mark="hearts/evening" fallback={<span aria-hidden>☾</span>} />
      Evening
      {marks.map((m) => (
        <span key={m.key} role="img" aria-label={m.label} className="text-[14px] leading-none" data-slot={m.festival ? 'festival' : 'evening'}
          style={{ color: m.festival && festival ? SEASON_COLOR[festival.season] : '#c2385e' }}>
          {m.spent ? '●' : '○'}
        </span>
      ))}
    </span>
  )
}

/** The ladders' colours, darkened to read on the corner's white. */
const LEVEL_INK: Readonly<Record<LadderName, string>> = { friendship: '#c4492d', romance: '#c2385e', spouse: '#9a6f0e' }

/** Her level words in the Work view's card corner, in her ladder's colour, from Friendship 1. */
function levelBadge(save: SaveV4, id: string): FaceTileBadges {
  const love = save.love[id]
  const short = love ? levelShort(love) : null
  if (!love || !short) return {}
  return { topRight: <span className="rounded-full bg-white/90 px-1 text-[11px] font-bold shadow-1 ring-1 ring-black/10" style={{ color: LEVEL_INK[ladderOf(love.stage)] }} data-card-level={short}>{short}</span> }
}

function Hearts({ save, pack, master, view, onView }: { save: SaveV4; pack: HeartsPack; master: MasterView; view: ProfileSide; onView: (view: ProfileSide) => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const [params] = useSearchParams()
  const { rows: album, talents } = useRosterRows(save, master)
  const rows = useMemo(() => heartRows(save, pack, (id) => master.album.get(id)?.name ?? 'An Uma'), [save, pack, master])
  const open = params.get('uma')
  const openId = open && save.love[open] && save.roster[open] ? open : null
  return (
    <>
      {view === 'work'
        ? <RosterAlbum save={save} rows={album} corner={(row) => levelBadge(save, row.id)} />
        : <HeartsList rows={rows} onOpen={(id) => navigate(withParam(location, 'uma', id), { state: { back: true } })} />}
      {openId && (
        <HeartProfile save={save} pack={pack} master={master} id={openId} row={album.find((r) => r.id === openId) ?? null} temperament={talents.get(openId)?.temperament ?? null}
          side={view} onSide={onView} onClose={() => leave(withParam(location, 'uma', null))} />
      )}
    </>
  )
}

/** The Hearts view: the filter chips with their counts, then the rows. */
function HeartsList({ rows, onOpen }: { rows: readonly HeartRow[]; onOpen: (id: string) => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const raw = params.get('filter')
  const filter = isHeartFilter(raw) ? raw : null
  const counts = filterCounts(rows)
  const shown = filter ? rows.filter((r) => r.filters.includes(filter)) : rows
  return (
    <>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filters" data-heart-filters>
        {HEART_FILTERS.map((f) => (
          <Chip key={f.key} selected={filter === f.key} className="min-h-11! px-2.5!" data-filter={f.key} data-count={counts[f.key]} aria-label={`${f.label}, ${counts[f.key]}`}
            onClick={() => navigate(withParam(location, 'filter', filter === f.key ? null : f.key), { replace: true, state: location.state })}>
            {f.label}{counts[f.key] > 0 && <span className="tabular-nums">{counts[f.key]}</span>}
          </Chip>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="py-4 text-[14px] text-ink-soft" data-hearts-empty>
          {rows.length === 0 ? <>No one yet. Go into <Link to="/town" className="font-semibold text-accent-strong underline">town</Link> and introduce yourself.</> : 'No one here yet.'}
        </p>
      )}
      <ul className="grid @xl:grid-cols-2 @xl:gap-x-6" data-heart-rows>
        {shown.map((row) => <li key={row.id} className="border-b border-hairline"><HeartRowView row={row} onOpen={() => onOpen(row.id)} /></li>)}
      </ul>
    </>
  )
}

/** One Uma's row: three lines in 72 pt; a tap opens her profile, and her **● Ready** plays her event
 * (`?event=`). */
function HeartRowView({ row, onOpen }: { row: HeartRow; onOpen: () => void }) {
  const location = useLocation()
  const { bar, heart } = row
  const share = heart.mark ? 1 : bar.cost > 0 ? Math.min(1, bar.points / bar.cost) : bar.rung === null ? 1 : 0
  // The most useful line first, so a narrow row cuts what's banked before it.
  const under = [...(row.note ? [row.note] : []), ...(bar.banked > 0 ? [`+${bar.banked.toLocaleString('en-US')} banked`] : [])].join(' · ')
  return (
    <div className="flex min-h-[72px] w-full items-center gap-2" data-heart-row={row.id} data-row-ready={row.state.ready || undefined}>
    <button type="button" onClick={onOpen} className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-2 text-left" data-open-row
      aria-label={`${row.name}, ${row.level}${row.state.ready ? ', Ready' : ''}${row.home ? '' : ', in town'}`}>
      <Avatar id={row.id} size={56} label={row.name} className={row.home ? '' : 'opacity-60'} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 max-w-[60%] shrink-0 truncate text-[15px] font-semibold text-ink">{row.name}</span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft" data-row-chapter={row.chapter.n}>{glanceWords(row.chapter)}</span>
          {row.invited && <InviteChip />}
          {!row.home && <AwayChip />}
        </span>
        <span className="flex items-center gap-1.5 text-[12px]">
          <span className="shrink-0 font-semibold" style={{ color: heart.colour }} data-level-words>{row.level}</span>
          <FillingHeart colour={heart.colour} share={share} size={13} />
          <HeartSegments heart={heart} />
          {bar.cost > 0 && <span className="shrink-0 text-ink-soft tabular-nums" data-points={`${bar.points}/${bar.cost}`}>{bar.points.toLocaleString('en-US')}/{bar.cost.toLocaleString('en-US')}</span>}
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
          <span className="min-w-0 flex-1 truncate" data-note>{under}</span>
          {row.chatted && <span className="shrink-0 text-[11px] font-semibold text-success" data-tick="chat">✓chat</span>}
          {row.gifted && <span className="shrink-0 text-[11px] font-semibold text-success" data-tick="gift">✓gift</span>}
        </span>
      </span>
    </button>
    {row.state.ready && (
      <Link to={withParam(location, 'event', row.id)} state={{ back: true }} className="grid min-h-11 shrink-0 place-items-center" aria-label={`Play ${row.name}’s event`} data-action="play-event">
        <ReadyChip colour={heart.colour} />
      </Link>
    )}
    </div>
  )
}
