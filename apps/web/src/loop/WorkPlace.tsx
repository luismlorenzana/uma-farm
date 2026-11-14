// The forest, the Fishery and the stations: `/forest`, `/fishery`, `/mill`, `/sawmill`
// and `/smokehouse`, and their quick looks on the farm map. uma-kit/work owns the slot rows, the job
// sheet, queues, Recall, Repeat and stopped queues; the farm supplies the save at its day, the env with master data's
// talents, the What step (areas and spots, or what the Warehouse holds for a station), the sizes in days, its words and
// its actions. A station is locked until built: its quick look and page show its Build card (`BuildCard.tsx`). Loaded on
// demand.
import {
  farmHome,
  ACTIVITY_NAMES, farmEnv, farmPlace, goodName, isStation, leaving, loopKinds, loopRefusalText, loopWorld, PLACE_ACTIVITY, parseStockKey, stationBuilt,
  tendedBlock, workNow, type BuildPlace, type GatherPlace, type LoopPlaceId, type LoopWorkRequest, type FarmSave, type StationId, type TalentOf,
} from '@farm/domain'
import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { Button } from '@luismlorenzana/uma-kit/ui'
import {
  JobSheet, jobQuery, PeekRow, readJobQuery, SlotRow, StoppedQueueCard, useWorkView, withoutJobQuery, WorkArtProvider, WorkProvider, type JobSelection, type WorkActions,
} from '@luismlorenzana/uma-kit/work'
import type { QueueInput } from '@luismlorenzana/uma-work'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { BuildCard } from './BuildCard'
import { collectAt, collectJob, dismissJob, editQueue, recallJob, repeatJob, restartJob, startJob } from './actions'
import { goldWords } from './goods-view'
import { activityOrder, pickerSorts, rankTalent, UMA_FACETS, umaRows, type LoopUmaRow } from './roster-view'
import { useTalents } from './talents'
import { umaBadges } from './UmaMarks'
import {
  dayWords, gatherRequest, gatherSizeRule, gatherSizes, haulWords, helpLines, initialWhere, isGatherPlace, itemWords, LOOP_WORK_WORDS, placeLine, requestWords,
  STATION_TAKES, stationGroups, stationRequest, stationSizeRule, whereRows, type WorkPlaceId,
} from './work-view'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
type Say = (text: string | null) => void

/** A stock key's icon with its stars in the corner; a plain good's icon otherwise. */
function LoopItem({ id, size }: { id: string; size: number }) {
  const at = parseStockKey(id)
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <ItemIcon id={at?.id ?? id} size={size} />
      {at && at.stars > 1 && (
        <span aria-hidden className="absolute -right-1 -bottom-1 rounded-full bg-black/75 px-0.5 font-display text-[9px] leading-3 font-bold text-white">★{at.stars}</span>
      )}
    </span>
  )
}
const LOOP_ART = { Item: LoopItem }

/** The kit's actions, each the loop's operation at the day's start; a collect says what came home. */
function workActions(say: Say): WorkActions {
  return {
    collect: async ({ outfitId }) => say(haulWords(await collectJob(outfitId))),
    repeat: ({ outfitId }) => repeatJob(outfitId),
    recall: ({ outfitId }) => recallJob(outfitId),
    queue: (input) => editQueue(input as QueueInput<LoopWorkRequest>),
    unqueue: ({ outfitId, index }) => editQueue({ outfitId, remove: index }),
    start: ({ outfitId, slot, request }) => startJob({ outfitId, place: slot.building as LoopPlaceId, slot: slot.slot, request: request as LoopWorkRequest }),
    restart: ({ outfitId }) => restartJob(outfitId),
    dismiss: ({ outfitId }) => dismissJob(outfitId),
  }
}

/** uma-kit/work over the loop's save at its day: the env with this release's talents, the farm's names, days and words. */
function LoopWorkProvider({ save, say, children }: { save: FarmSave; say: Say; children: ReactNode }) {
  const talents = useTalents()
  const master = useMaster()
  const album = master.status === 'ready' ? master.view.album : null
  const story = useStory()
  const env = useMemo(() => farmEnv(loopKinds(talents.of, story)), [talents.of, story])
  const world = useMemo(() => loopWorld(save), [save])
  const actions = useMemo(() => workActions(say), [say])
  const now = workNow(save)
  const day = save.calendar.day
  return (
    <WorkArtProvider art={LOOP_ART}>
      <WorkProvider
        state={world}
        now={now}
        env={env}
        actions={actions}
        names={{ uma: (id) => album?.get(id)?.name ?? 'Uma', item: itemWords, place: (id) => farmPlace(id)?.name ?? id }}
        words={LOOP_WORK_WORDS}
        describeRequest={(request) => requestWords(request as LoopWorkRequest, day)}
        formatRefusal={(refusal) => loopRefusalText(refusal, now)}
        formatDuration={dayWords}
      >
        {children}
      </WorkProvider>
    </WorkArtProvider>
  )
}

/** `/forest`, `/fishery` and the stations. */
export default function WorkPlaceRoute({ place }: { place: WorkPlaceId }) {
  const save = useLoopSave()
  if (!save) return null
  return <WorkPlacePage save={save} place={place} />
}

function WorkPlacePage({ save, place }: { save: FarmSave; place: WorkPlaceId }) {
  const leave = useLeave()
  const [note, setNote] = useState<string | null>(null)
  const name = farmPlace(place)!.name
  const built = !isStation(place) || stationBuilt(save, place)
  return (
    <div className="absolute inset-0 flex flex-col" data-page={place}>
      <PlaceHeader title={name} onBack={() => leave('/')} about={<>{helpLines(place).map((line) => <p key={line}>{line}</p>)}</>}
        words={{ back: 'Back to the farm', about: `About the ${name}` }} />
      <main className="@container min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-3 px-4 pt-3 pb-6">
          {note && <p role="status" className="rounded-md bg-success/15 px-3 py-2 text-[14px] font-semibold text-success" data-work-note>{note}</p>}
          {built
            ? (
              <LoopWorkProvider save={save} say={setNote}>
                <PlaceBody save={save} place={place} say={setNote} />
              </LoopWorkProvider>
            )
            : <BuildCard save={save} place={farmPlace(place) as BuildPlace} say={setNote} />}
        </div>
      </main>
    </div>
  )
}

/** The Umas home as the job sheet's rows: her rank and talent in the place's activity, a tender marked. */
interface JobRow extends LoopUmaRow {
  note: string
  tends: string | null
  /** A swap takes her away tomorrow: she can't take a job. */
  leaving: boolean
}

function PlaceBody({ save, place, say }: { save: FarmSave; place: WorkPlaceId; say: Say }) {
  const work = useWorkView()
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = readJobQuery(params)
  const master = useMaster()
  const view = master.status === 'ready' ? master.view : null
  const talents = useTalents()
  const activity = PLACE_ACTIVITY[place]
  const name = farmPlace(place)!.name
  const cards = work.cards(place)
  const facility = work.facility(place)
  const ready = cards.some((card) => card.kind === 'held' && card.waiting > 0)
  const stopped = Object.values(work.settled.work).filter((row) => row.dropped?.slot.building === place)
  // The Uma the job sheet has picked, which its sizes read (her rank and talent), lifted from its What step.
  const [sheetUma, setSheetUma] = useState<string | null>(null)
  const rows = useMemo((): JobRow[] => umaRows(save, farmHome(save), view?.album ?? new Map(), talents.table).map((row) => {
    const tends = tendedBlock(save, row.id)
    const away = leaving(save, row.id)
    return { ...row, level: row.ranks[activity].rank, note: tends ? `Tends Block ${tends}` : away ? 'Leaves tomorrow' : rankTalent(row, activity), tends, leaving: away }
  }), [save, view, talents.table, activity])
  const sorts = useMemo(() => pickerSorts<JobRow>(activity), [activity])
  const byActivity = useMemo(() => activityOrder(activity), [activity])
  const gather = isGatherPlace(place)
  const sizes = gather ? gatherSizes(save, place, sheetUma, talents.of) : []
  const closeJob = () => {
    if (query?.back) navigate(query.back, { replace: true })
    else navigate({ pathname: location.pathname, search: withoutJobQuery(location.search) }, { replace: true })
  }
  const openJob = (search: string) => navigate({ pathname: location.pathname, search })
  return (
    <div className="space-y-3" data-place-body={place}>
      <section className="flex min-h-12 items-center justify-between gap-2 rounded-md bg-raised px-3">
        <h2 className="min-w-0 text-[14px] font-semibold" data-stats>{placeLine(place, facility.slots)}</h2>
        {ready && (
          <Button size="sm" onClick={() => void collectAt(place).then((got) => say(haulWords(got)), (err: unknown) => say(errorWords(err)))} data-action="collect-here">
            Collect here
          </Button>
        )}
      </section>
      <ul className="grid gap-2 @lg:grid-cols-2" data-slots>
        {cards.map((card) => (
          <li key={card.slot.slot}>
            <SlotRow
              slot={card.slot}
              onStart={() => openJob(jobQuery({ slot: card.slot.slot }))}
              onQueue={card.kind === 'held' ? (outfitId) => openJob(jobQuery({ uma: outfitId, queue: true })) : undefined}
              repeat
            />
          </li>
        ))}
      </ul>
      {stopped.map((row) => <StoppedQueueCard key={row.outfitId} outfitId={row.outfitId} />)}
      <JobSheet<JobRow>
        query={query}
        building={place}
        title={name}
        rows={rows}
        request={(job, count) => (gather ? gatherRequest(place, job, count, sizes) : stationRequest(job, count))}
        initialJob={(outfitId) => (gather ? initialWhere(save, place, outfitId, talents.of) : stationGroups(save, place as StationId).flatMap((g) => g.options)[0]?.item ?? null)}
        sizeRule={(job) => (job === null ? undefined : gather ? gatherSizeRule(sizes) : stationSizeRule(save, job, sheetUma, talents.of))}
        disabled={(row) => (row.tends ? `Tends Block ${row.tends}` : row.leaving ? 'Leaves tomorrow' : null)}
        picker={{
          facets: UMA_FACETS,
          sorts,
          order: (a, b) => Number(b.free === true) - Number(a.free === true) || byActivity(a, b),
          describe: (row) => row.note,
          renderBadges: umaBadges,
          words: { level: `${ACTIVITY_NAMES[activity]} rank` },
        }}
        renderWhat={(selection) => (gather
          ? <WhereStep save={save} place={place} selection={selection} talentOf={talents.of} onUma={setSheetUma} />
          : <StationStep save={save} station={place as StationId} selection={selection} onUma={setSheetUma} />)}
        renderPreview={(preview) => <span className="ml-auto text-ink-soft" data-preview>{preview.seconds.length} {gather ? 'to bring home' : 'to make'}</span>}
        empty={<p className="text-[14px] text-ink-soft">No Uma is free.</p>}
        onClose={closeJob}
        onDone={closeJob}
      />
    </div>
  )
}

/** Lifts the job sheet's picked Uma to the page, whose sizes read her rank and talent. */
function useSheetUma(outfitId: string | null, onUma: (id: string | null) => void): void {
  useEffect(() => onUma(outfitId), [outfitId, onUma])
}

/** The What step at the forest or the Fishery: every area or spot, those her rank hasn't opened greyed
 * ("From Hand"), each with this season's goods and "About 5 a day" for her. */
function WhereStep({ save, place, selection, talentOf, onUma }: {
  save: FarmSave; place: GatherPlace; selection: JobSelection & { onChange: (job: string) => void }; talentOf: TalentOf; onUma: (id: string | null) => void
}) {
  useSheetUma(selection.outfitId, onUma)
  const rows = whereRows(save, place, selection.outfitId, talentOf)
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label={place === 'forest' ? 'Areas' : 'Spots'} data-what={place}>
      {rows.map((row) => {
        const on = row.id === selection.job
        return (
          <button key={row.id} type="button" role="radio" aria-checked={on} disabled={row.lock !== null} onClick={() => selection.onChange(row.id)} data-where={row.id}
            aria-label={`${row.name}${row.lock ? `, ${row.lock}` : `, ${row.note}`}`}
            className={`flex min-h-14 w-full flex-col gap-1 rounded-md border px-2.5 py-1.5 text-left disabled:opacity-45 ${on ? 'border-accent bg-accent-wash ring-1 ring-accent' : 'border-hairline bg-raised'}`}>
            <span className="flex w-full items-baseline justify-between gap-2">
              <span className="text-[14px] font-semibold">{row.name}</span>
              <span className="shrink-0 text-[12px] text-ink-soft">{row.lock ?? row.note}</span>
            </span>
            <span aria-hidden className="flex flex-wrap gap-0.5">{row.goods.map((id) => <ItemIcon key={id} id={id} size={20} />)}</span>
          </button>
        )
      })}
    </div>
  )
}

/** The What step at a station: its jobs, each with what the Warehouse holds for it at each star. */
function StationStep({ save, station, selection, onUma }: {
  save: FarmSave; station: StationId; selection: JobSelection & { onChange: (job: string) => void }; onUma: (id: string | null) => void
}) {
  useSheetUma(selection.outfitId, onUma)
  const groups = stationGroups(save, station)
  if (groups.every((g) => g.options.length === 0)) {
    return <p className="text-[14px] text-ink-soft" data-what={station} data-empty>Nothing to process yet: bring {STATION_TAKES[station]} home first.</p>
  }
  return (
    <div className="space-y-2.5" data-what={station}>
      {groups.filter((g) => g.options.length > 0).map((group) => (
        <section key={group.job} className="space-y-1" aria-label={group.name}>
          <h4 className="text-[11px] font-semibold text-ink-soft">{group.name}</h4>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={group.name}>
            {group.options.map((option) => {
              const on = option.item === selection.job
              return (
                <button key={option.item} type="button" role="radio" aria-checked={on} onClick={() => selection.onChange(option.item)} data-option={option.item}
                  aria-label={`${goodName(option.output)} ★${option.stars}, ${option.held} ${goodName(option.input)} held`}
                  className={`flex min-h-12 items-center gap-2 rounded-md border px-2 py-1 text-left ${on ? 'border-accent bg-accent-wash ring-1 ring-accent' : 'border-hairline bg-raised'}`}>
                  <LoopItem id={option.item} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{goodName(option.output)}</span>
                    <span className="block text-[11px] text-ink-soft">★{option.stars} · {option.held} held</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

/** A work place's quick look on the farm map: its line, its four slots' rows (each opens the page's job sheet), its
 * stopped queues, and Open; an unbuilt station's Build card. */
export function WorkPlacePeek({ save, place }: { save: FarmSave; place: WorkPlaceId }) {
  const [note, setNote] = useState<string | null>(null)
  const name = farmPlace(place)!.name
  if (isStation(place) && !stationBuilt(save, place)) {
    return (
      <div className="space-y-2 p-4" data-peek={place}>
        {note && <p role="status" className="text-[13px] font-semibold text-success">{note}</p>}
        <p className="text-[14px]">Turns {STATION_TAKES[place]} into goods worth half again as much, keeping their stars.</p>
        <BuildCard save={save} place={farmPlace(place) as BuildPlace} say={setNote} />
      </div>
    )
  }
  return (
    <LoopWorkProvider save={save} say={setNote}>
      <PeekBody place={place} name={name} note={note} />
    </LoopWorkProvider>
  )
}

function PeekBody({ place, name, note }: { place: WorkPlaceId; name: string; note: string | null }) {
  const work = useWorkView()
  const navigate = useNavigate()
  const cards = work.cards(place)
  const stopped = Object.values(work.settled.work).filter((row) => row.dropped?.slot.building === place)
  const page = `/${place}`
  return (
    <div className="space-y-2 p-4" data-peek={place}>
      <p className="text-[12px] text-ink-soft">{placeLine(place, cards.length)}</p>
      {note && <p role="status" className="text-[13px] font-semibold text-success">{note}</p>}
      <ul className="space-y-1.5">
        {cards.map((card) => (
          <li key={card.slot.slot}>
            <PeekRow
              slot={card.slot}
              onStart={() => navigate(`${page}${jobQuery({ slot: card.slot.slot })}`, { state: { back: true } })}
              onQueue={card.kind === 'held' ? (outfitId) => navigate(`${page}${jobQuery({ uma: outfitId, queue: true })}`, { state: { back: true } }) : undefined}
              repeat
            />
          </li>
        ))}
      </ul>
      {stopped.map((row) => <StoppedQueueCard key={row.outfitId} outfitId={row.outfitId} />)}
      <Link to={page} state={{ back: true }} className="flex min-h-12 items-center justify-center rounded-md bg-accent px-3 font-display text-[15px] font-bold text-accent-ink" data-action="open-place">
        Open the {name}
      </Link>
    </div>
  )
}
