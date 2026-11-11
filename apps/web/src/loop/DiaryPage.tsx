// `/diary` (F24; CS55): the Diary tab holds the chapter until its own screen comes in M6. The chapter's card: its number,
// title and six goals, each with its count and a check when met, and its reward; once chapter 1 is done, chapter 2's
// line and "Soon" until M5. Below, the Farm Rank (opening its sheet) and the milestones paid so far; in the romance build,
// on save v4, each Uma's **Memories** (F49 decision 12, her album at `?album=`) and the pairs' **Conversations** (F52
// decision 11), loaded apart. Loaded on demand.
import { chapterOf, diaryEntries, goalStates, type FarmSave } from '@farm/domain'
import { HelpButton, Panel } from '@luismlorenzana/uma-kit/ui'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { romanceOn } from '../app/romance'
import { useLoopSave } from '../save/game'
import { goalCount, milestoneWords, rewardWords } from './goal-words'

// The romance build's only: the switch folds at build time, and the deployed build drops the import.
const Conversations = /* @__PURE__ */ lazy(() => import('./Conversations'))
const MemoriesShelf = /* @__PURE__ */ lazy(() => import('./MemoriesShelf'))

export default function DiaryPage() {
  const save = useLoopSave()
  if (!save) return null
  return (
    <main className="absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4 pb-24" data-page="diary">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[22px] font-bold text-ink">Diary</h1>
        <HelpButton title="The Diary" label="About the Diary">
          <p>Each chapter sets a few goals. Meet them all and the chapter completes that night, with its reward and a new hand.</p>
          <p>Goals that count things count from the chapter’s start. Everything is checked when you end the day.</p>
          <p>Milestones pay gold once, and each adds to the Farm Rank. The Diary’s own pages come later.</p>
          {romanceOn() && save.version === 4 && <p>Memories keeps each Uma’s events. Replay any from any choice; replays give no points.</p>}
          {romanceOn() && save.version === 4 && <p>Conversations keeps what each pair has said as their bond grew. Replay any you’ve read.</p>}
        </HelpButton>
      </div>
      <ChapterCard save={save} />
      <Link to="/diary?sheet=rank" className="flex min-h-11 items-center justify-between rounded-md border border-hairline bg-panel px-3 text-[15px]" data-rank-link>
        <span className="font-semibold">Farm Rank</span>
        <span className="text-ink-soft">{save.farm.points.toLocaleString('en-US')} points ›</span>
      </Link>
      <Milestones save={save} />
      {romanceOn() && save.version === 4 && <Suspense fallback={null}><MemoriesShelf save={save} /></Suspense>}
      {romanceOn() && save.version === 4 && <Suspense fallback={null}><Conversations save={save} /></Suspense>}
    </main>
  )
}

function ChapterCard({ save }: { save: FarmSave }) {
  const chapter = chapterOf(save.farm.chapter)
  const goals = goalStates(save)
  if (!chapter || !goals) {
    return (
      <Panel label={`Chapter ${save.farm.chapter}`} data-chapter={save.farm.chapter}>
        <div className="py-1">
          {save.farm.chapter > 1 && <p className="text-[13px] text-ink-soft" data-done-chapter>Chapter {save.farm.chapter - 1} done · {rewardWords(save.farm.chapter - 1)}</p>}
          <h2 className="font-display pt-1 text-[20px] font-bold">{chapter?.title ?? 'Next chapter'}</h2>
          <p className="text-ink-soft" data-soon>Soon</p>
        </div>
      </Panel>
    )
  }
  const met = goals.filter((g) => g.done).length
  return (
    <Panel label={`Chapter ${chapter.chapter}`} data-chapter={chapter.chapter}>
      <div className="flex items-baseline justify-between gap-2 pt-1">
        <h2 className="font-display text-[20px] font-bold">{chapter.title}</h2>
        <span className="text-[13px] text-ink-soft" data-met>{met} of {goals.length}</span>
      </div>
      <ol className="mt-1 divide-y divide-hairline">
        {goals.map((state) => (
          <li key={state.goal.id} className="flex min-h-11 items-center gap-2 py-1.5" data-goal={state.goal.id} data-done={state.done || undefined}>
            <span aria-hidden className={`grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold ${state.done ? 'bg-success text-white' : 'border border-hairline-strong'}`}>
              {state.done ? '✓' : ''}
            </span>
            <span className={`min-w-0 flex-1 text-[15px] ${state.done ? 'text-ink-soft' : ''}`}>{state.goal.text}</span>
            <span className="shrink-0 text-[13px] text-ink-soft" data-count>{goalCount(state)}</span>
          </li>
        ))}
      </ol>
      <p className="pt-2 pb-1 text-[13px] text-ink-soft">Reward: {rewardWords(chapter.chapter)}</p>
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
