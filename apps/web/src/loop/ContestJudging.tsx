// The Cooking Contest's judging, at the stove's end: a short scene on the dialogue engine, the town's cook (the Uma who
// plays the role; her role's disc with no master data) tasting the three plates and speaking by your place, one line a
// tap, Skip to the board; then the board: your place, each farm's score, the prize, and the dish into the Warehouse, with
// **Done**. The play's result is already saved: the scene only says it. Loaded on demand from the stove.
import { contestBeats, dishName, type PlayResult, type Step } from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { SceneLookProvider } from '../dialogue/Bust'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { useLoopSave } from '../save/game'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { BoardView } from './Contest'
import { Frame, StepView } from './ScenePlayer'

export default function ContestJudging({ result, name, onDone }: { result: PlayResult; name: string; onDone: () => void }) {
  const save = useLoopSave()
  const master = useMaster()
  const story = useStory()
  const board = result.contest!
  const steps = useMemo((): Step[] => contestBeats(board.place).map((b) => (b.speaker.kind === 'cast' ? { say: b.speaker.id, line: b.line } : { narrate: b.line })), [board.place])
  const [at, setAt] = useState(0)
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const step = steps[at]
  const dish = result.dishes[0]
  return (
    <SceneLookProvider value={{ day: save?.calendar.day ?? 1 }}>
      <Frame title={`${name} · The judging`} label={`${name}: the judging`} scene="scene:contest" onSkip={() => (at < steps.length ? setAt(steps.length) : onDone())} skipping={false}>
        {step ? (
          <StepView key={at} steps={steps} at={at} nameOf={nameOf} farmer={save?.farmer.name ?? ''} onNext={() => setAt(at + 1)} />
        ) : (
          <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 items-center gap-4 overflow-y-auto px-4 pb-4" data-contest-board>
            <div className="min-w-0 flex-1"><BoardView board={board} big /></div>
            <div className="w-56 shrink-0 space-y-2 text-center">
              {dish && (
                <div className="space-y-1 rounded-md border border-hairline bg-panel p-3" data-contest-dish-made={dish.dish}>
                  <ItemIcon id={dish.dish} size={48} />
                  <p className="text-[14px] font-semibold">{dishName(dish.dish)} ★{dish.stars}</p>
                  <p className="text-[12px] text-ink-soft">{result.stopped ? 'Stopped: Rough' : `Play ${result.score}`} · into the Warehouse</p>
                </div>
              )}
              <p className="text-[12px] text-ink-faint">The Farm Rank points count tonight.</p>
              <Button className="w-full" onClick={onDone} data-action="contest-done">Done</Button>
            </div>
          </div>
        )}
      </Frame>
    </SceneLookProvider>
  )
}
