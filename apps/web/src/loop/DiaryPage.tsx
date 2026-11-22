// `/diary`: the Diary tab. First the world's pages when the pack writes them (`WorldPages.tsx`): **The farm**, its name
// and history, and **Town notes**, the pieces of the world found so far (`?note=<id>` opens one). Then the projects: the
// loans, each a goal with what's owed and when it clears (a tap opens the Book); what you can build now,
// each with its cost and what you still lack (a tap opens its quick look and Build card); what the next Farm Rank
// offers; and the milestones with the Umas, each with how far along you are. Below, the Farm Rank (opening its sheet)
// and the milestones paid so far; each Uma's **Memories** (her album at `?album=`) and the pairs' **Conversations**
// (loaded apart). Loaded on demand.
import { buildCostWords, buildLockWords, CONTESTS, diaryEntries, farmProjects, festivalNameOf, festivalResult, festivalsOf, type BuildPlace, type FarmSave, type Project } from '@farm/domain'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { useLoopSave } from '../save/game'
import { milestoneWords, umaMilestoneWords } from './goal-words'
import { loanWords, projectName, projectNames } from './money-words'
import { useStory } from '../story/story'
import WorldPages from './WorldPages'

const Conversations = lazy(() => import('./Conversations'))
const MemoriesShelf = lazy(() => import('./MemoriesShelf'))
const NightMemories = lazy(() => import('./NightMemories'))

export default function DiaryPage() {
  const save = useLoopSave()
  const story = useStory()
  if (!save) return null
  return (
    <main className="@container absolute inset-0 overflow-y-auto overscroll-contain p-4" data-page="diary">
      <div className="flex items-center justify-between gap-2 pb-3">
        <h1 className="font-display text-[22px] font-bold text-ink">Diary</h1>
        <GuideButton topic="diary" title="The Diary" label="About the Diary">
          <p>The farm grows by building. The Farm Rank offers places, and you build each with gold and the farm’s goods. It stands the next morning.</p>
          <p>Your life with the Umas opens the rest: the ring bench, a house with each wedding, more of the homestead and the town.</p>
          <p>Milestones pay gold once, and each adds to the Farm Rank. Everything is checked when you end the day.</p>
          <p>Memories keeps each Uma’s events. Replay any from any choice; replays give no points.</p>
          <p>Conversations keeps what each pair has said as their bond grew. Replay any you’ve read.</p>
        </GuideButton>
      </div>
      {/* Its panels sit in two columns where they fit. */}
      <div className="space-y-3 @xl:columns-2 @xl:gap-3 [&>*]:break-inside-avoid">
        <WorldPages save={save} />
        <Projects save={save} />
        <Link to="/diary?sheet=rank" className="flex min-h-11 items-center justify-between rounded-md border border-hairline bg-panel px-3 text-[15px]" data-rank-link>
          <span className="font-semibold">Farm Rank</span>
          <span className="text-ink-soft">{save.farm.points.toLocaleString('en-US')} points ›</span>
        </Link>
        <Milestones save={save} />
        {save.workshops.festival?.last && <section className="rounded-md border border-hairline bg-panel p-2.5">
          <h2 className="text-micro">Festival results</h2>
          {CONTESTS.flatMap((id) => {
            const card = festivalResult(save, id)
            if (!card) return []
            const best = save.diary.records[`festival:${id}`]
            return <Link key={id} className="flex min-h-11 items-center justify-between gap-2 text-[13px]" to={`/diary?sheet=festival&contest=${id}`}>
              <span>{festivalNameOf(festivalsOf(story), id)}{best !== undefined ? ` · Best ${best}` : ''}</span>
              <span>{card.place ? ['1st', '2nd', '3rd'][card.place - 1] : 'No placement'} ›</span>
            </Link>
          })}
        </section>}
        <Suspense fallback={null}><MemoriesShelf save={save} /></Suspense>
        <Suspense fallback={null}><Conversations save={save} /></Suspense>
        {Object.values(save.longGame?.love ?? {}).some(heart => heart.memories.length > 0) &&
          <Suspense fallback={null}><NightMemories save={save} /></Suspense>}
      </div>
    </main>
  )
}

/** Where a project's tap goes: its quick look on the farm (the Boat's is the Dock's). */
const peekOf = (place: BuildPlace): string => `/?peek=${place.on ?? place.id}`

/** A check mark, filled when done. */
const Check = ({ done }: { done: boolean }) => (
  <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold ${done ? 'bg-success text-white' : 'border border-hairline-strong'}`}>
    {done ? '✓' : ''}
  </span>
)

/** One place to build now: its name and cost, and what it lacks, "Builds tonight", or Build. */
function NowRow({ project }: { project: Project }) {
  const { place, lock } = project
  const state = lock === null ? 'Build ›' : buildLockWords(lock)
  return (
    <li>
      <Link to={peekOf(place)} state={{ back: true }} className="flex min-h-11 items-center gap-2 py-1.5" data-project={place.id} data-lock={lock?.by ?? undefined}>
        <Check done={lock?.by === 'tonight'} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{place.name}</span>
          <span className="block text-[12px] text-ink-soft">{buildCostWords(place)}</span>
        </span>
        <span className={`shrink-0 text-right text-[13px] ${lock === null ? 'font-semibold text-accent' : 'text-ink-soft'}`} data-state>{state}</span>
      </Link>
    </li>
  )
}

/** The farm's loans, each a goal: what it built, what's owed, its share a night and when it clears. */
function Loans({ save }: { save: FarmSave }) {
  const names = projectNames(useStory(), save)
  if (save.farm.loans.length === 0) return null
  return (
    <section aria-label="Loans" data-project-loans={save.farm.loans.length}>
      <h3 className="text-micro pt-1">Loans</h3>
      <ul className="divide-y divide-hairline">
        {save.farm.loans.map((loan) => (
          <li key={loan.for}>
            <Link to="/book" state={{ back: true }} className="flex min-h-11 items-center gap-2 py-1.5" data-project-loan={loan.for}>
              <Check done={false} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{loan.credit?.title ?? projectName(loan.for, names)}</span>
                <span className="block text-[12px] text-ink-soft">{loanWords(save, loan)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The farm's projects: the loans, what to build now, what the next rank offers, and the milestones with the Umas. */
function Projects({ save }: { save: FarmSave }) {
  const { now, waiting, next, milestones } = farmProjects(save)
  // A place short of gold alone: the mayor's office lends toward it.
  const shortOfGold = now.some((p) => p.lock?.by === 'short' && p.lock.gold > 0 && p.lock.goods.length === 0)
  return (
    <Panel label="Projects" data-projects>
      <Loans save={save} />
      <h3 className="text-micro pt-1">Build now</h3>
      {now.length === 0
        ? <p className="py-2 text-[15px] text-ink-soft" data-nothing-now>Nothing to build at this rank.</p>
        : <ul className="divide-y divide-hairline" data-build-now>{now.map((p) => <NowRow key={p.place.id} project={p} />)}</ul>}
      {shortOfGold && (
        <Link to="/town?at=mayor" state={{ back: true }} className="flex min-h-11 items-center justify-between text-[13px] text-accent-strong" data-to-office>
          <span>Short of gold? The mayor’s office lends toward a build.</span><span aria-hidden>›</span>
        </Link>
      )}
      {waiting.length > 0 && (
        <p className="pb-1 text-[13px] text-ink-soft" data-waiting>Not built yet: {waiting.map((p) => `the ${p.name}`).join(', ')}</p>
      )}
      {next && (
        <section aria-label={`At Farm Rank ${next.rank}`} data-next-offers={next.rank}>
          <h3 className="text-micro pt-2">At Farm Rank {next.rank} · {next.points.toLocaleString('en-US')} points</h3>
          <ul className="divide-y divide-hairline">
            {next.places.map((p) => (
              <li key={p.id} className="flex min-h-11 items-center gap-2 py-1.5" data-offer={p.id}>
                <span className="min-w-0 flex-1 text-[15px]">{p.name}</span>
                <span className="shrink-0 text-right text-[12px] text-ink-soft">{p.opens.game ? buildCostWords(p) : 'Not built yet'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="With the Umas" data-uma-milestones>
        <h3 className="text-micro pt-2">With the Umas</h3>
        <ul className="divide-y divide-hairline">
          {milestones.map((m) => {
            const words = umaMilestoneWords(m)
            return (
              <li key={`${m.kind}:${m.kind === 'house' ? m.n : m.kind === 'row' ? m.row : ''}`} className="flex min-h-11 items-center gap-2 py-1.5"
                data-milestone={m.kind} data-done={m.done || undefined}>
                <Check done={m.done} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{words.what}</span>
                  <span className="block text-[12px] text-ink-soft">{words.need}</span>
                </span>
                <span className="shrink-0 text-[13px] text-ink-soft" data-count>{words.count}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </Panel>
  )
}

function Milestones({ save }: { save: FarmSave }) {
  return (
    <Panel label="Milestones">
      {save.diary.milestones.length === 0
        ? <p className="py-2 text-ink-soft">None yet.</p>
        : (
          <ul className="divide-y divide-hairline" data-milestones>
            {save.diary.milestones.map((id) => <li key={id} className="flex min-h-11 items-center text-[15px]">{milestoneWords(id)}</li>)}
          </ul>
        )}
      <p className="pt-1 pb-1 text-[12px] text-ink-faint" data-entries>{diaryEntries(save)} goods shipped so far</p>
    </Panel>
  )
}
