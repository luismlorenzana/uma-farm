// Copied from uma-rpg apps/web/src/places/work/PlaceV3.tsx at 30a322a (F5, FM2): a place's page and quick look on
// uma-kit/work. Its header (the place, its profession, four slots at ×1.25, the open shop, Collect here and the help), its
// four slot rows with Collect, Repeat, a queue and Recall, the stopped queues, and the job sheet with her trade first in
// the picker. Speed Tickets ("Finish all"), targets, upgrades and the profile door stay behind (FM4).
import { placeById, placeSpecV4, PROFESSION_NAMES_V4, type FarmWorkRequest, type Save } from '@farm/domain'
import { HelpButton } from '@luismlorenzana/uma-kit/ui'
import { workOrder } from '@luismlorenzana/uma-kit/roster'
import {
  JobSheet, jobQuery, PeekRow, readJobQuery, SlotRow, StoppedQueueCard, useWorkView, withoutJobQuery, type JobQuery, type SizeRule,
} from '@luismlorenzana/uma-kit/work'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { albumRows, PICKER_FACETS, PICKER_SORTS, type FarmUmaRow } from '../../album/rows'
import type { MasterView } from '../../master/master'
import { collectEverything } from '../../save/game'
import { isOpenShop, tradeLabel, whoAt } from '../../save/trade'
import { helpLines, initialJob, jobKindAt, jobSizesOf } from './place-view'
import { PeekLine, What } from './What'

/** The header's line: "Mining · 4 slots · ×1.25". */
const statsLine = (placeId: string, slots: number, speed: number) => `${PROFESSION_NAMES_V4[placeSpecV4(placeId)!.profession]} · ${slots} slots · ×${speed}`

export function PlaceBody({ view, save, now, placeId }: { view: MasterView; save: Save; now: number; placeId: string }) {
  const work = useWorkView()
  const cards = work.cards(placeId)
  const facility = work.facility(placeId)
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = readJobQuery(params)
  const rows = albumRows(view, save, new Date(now).toISOString())
  const shop = isOpenShop(placeId, view.roster)
  const who = whoAt(placeId, view.roster)
  const ready = cards.some((card) => card.kind === 'held' && card.waiting > 0)
  const stopped = Object.values(work.settled.work).filter((row) => row.dropped?.slot.building === placeId)
  const levelOf = (outfitId: string | null) => (outfitId ? save.umas[outfitId]?.craft.level ?? 1 : 1)
  const name = placeById(placeId)?.name ?? placeId
  const closeJob = () => {
    if (query?.back) navigate(query.back, { replace: true })
    else navigate({ pathname: location.pathname, search: withoutJobQuery(location.search) }, { replace: true })
  }
  const openJob = (search: string) => navigate({ pathname: location.pathname, search })
  return (
    <div className="space-y-3 p-4" data-place-body={placeId}>
      <section className="rounded-md bg-raised px-3">
        <div className="flex min-h-11 items-center justify-between gap-2">
          <h2 className="min-w-0 text-[14px] font-semibold" data-stats>{statsLine(placeId, facility.slots, facility.speed)}</h2>
          <HelpButton title={name} label={`How the ${name} works`}>{helpLines(placeId).map((line) => <p key={line}>{line}</p>)}</HelpButton>
        </div>
        {shop && <p className="-mt-1 pb-2 text-[13px] font-semibold text-accent" data-open-shop>Open shop: anyone works here</p>}
        {ready && (
          <div className="flex min-h-12 flex-wrap items-center justify-end gap-2 border-t border-hairline py-1.5">
            <button type="button" onClick={() => void collectEverything([placeId])} data-action="collect-here"
              className="min-h-11 shrink-0 rounded-full bg-accent px-4 text-[13px] font-semibold text-accent-ink">
              Collect here
            </button>
          </div>
        )}
      </section>

      <ul className="space-y-2">
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

      <JobSheet<FarmUmaRow>
        query={query}
        building={placeId}
        title={name}
        rows={rows}
        request={(job, count): FarmWorkRequest => ({ kind: jobKindAt(placeId, job), item: job, count })}
        initialJob={(outfitId) => initialJob(placeId, levelOf(outfitId))}
        sizeRule={(job) => sizeRuleOf(job, query)}
        sizePlacement="before-what"
        preserveCountOnJobChange
        disabled={(row) => who.reason(row.id)}
        picker={{
          facets: PICKER_FACETS,
          sorts: PICKER_SORTS,
          order: (left, right) => Number(who.first(right.id)) - Number(who.first(left.id)) || workOrder(left, right),
          describe: (row) => tradeLabel(row.outfit.trade),
          renderBadges: (row) => ({
            bottomRight: <span aria-label={`Craft Level ${row.craft}`} className="rounded-tl-sm bg-black/75 px-1 font-display text-[9px] font-bold leading-3.5 text-white">C{row.craft}</span>,
          }),
        }}
        renderWhat={(selection) => <What selection={selection} placeId={placeId} world={save} onPick={selection.onChange} />}
        onClose={closeJob}
        onDone={closeJob}
      />
    </div>
  )
}

/** The sizes the picked job offers, each with its time; a deep link's own count stays one of them. */
function sizeRuleOf(job: string | null, query: JobQuery | null): SizeRule | undefined {
  if (job === null) return undefined
  const sizes = jobSizesOf(job)
  const most = sizes.at(-1)!
  const linked = query?.job === job && query.count !== null && query.count <= most ? [query.count] : []
  return { mode: 'duration', sizes: [...sizes, ...linked], max: most }
}

/** A place's quick look: its line, its open shop and its four slots' rows; each row opens the place's page. */
export function PlacePeek({ view, placeId }: { view: MasterView; placeId: string }) {
  const work = useWorkView()
  const navigate = useNavigate()
  const cards = work.cards(placeId)
  const facility = work.facility(placeId)
  const stopped = Object.values(work.settled.work).filter((row) => row.dropped?.slot.building === placeId)
  const page = `/wilds/${placeId}`
  return (
    <div className="space-y-2 p-4" data-place-peek={placeId}>
      <p className="text-[12px] text-ink-soft">{statsLine(placeId, facility.slots, facility.speed)}</p>
      {isOpenShop(placeId, view.roster) && <p className="text-[12px] font-semibold text-accent">Open shop: anyone works here</p>}
      <PeekLine placeId={placeId} />
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
    </div>
  )
}
