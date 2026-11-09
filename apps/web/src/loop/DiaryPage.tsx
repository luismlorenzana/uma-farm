// `/diary` in the loop's build (F18): the Diary tab's place until F24 gives it the chapter's goals (its screen is M6's).
// Loaded on demand.
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useLoopSave } from '../save/game'

export default function DiaryPage() {
  const save = useLoopSave()
  if (!save) return null
  return (
    <main className="absolute inset-0 space-y-3 overflow-y-auto overscroll-contain p-4" data-page="diary">
      <h1 className="font-display text-[22px] font-bold text-ink">Diary</h1>
      <Panel label={`Chapter ${save.farm.chapter}`}>
        <p className="py-2 text-ink-soft">The chapter’s goals come soon.</p>
      </Panel>
    </main>
  )
}
