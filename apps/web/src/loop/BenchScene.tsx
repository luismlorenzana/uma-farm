// The smith's scene: the morning after the first Romance 8, the town's smith (the Uma who plays the role) comes up from
// town and opens the old Forge as the ring bench. It plays over the farm once the summary is put away (the order), one
// line a tap on the dialogue engine (her bust in the day's season), Skip to its card; the card says what the bench does,
// with **See the bench** (`?sheet=bench`) and **Later**. Read once (`scene:bench` in `diary.read`). Her name and bust
// are master data's; the role's disc with no master data. Loaded on demand from the scene player.
import { BENCH_SCENE, BENCH_SCENE_LINES, onDuty, type SaveV4, type Step } from '@farm/domain'
import { Button, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { SceneLookProvider } from '../dialogue/Bust'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { readBenchScene } from './bench-actions'
import { Frame, StepView } from './ScenePlayer'

export default function BenchScene({ save }: { save: SaveV4 }) {
  const navigate = useNavigate()
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const master = useMaster()
  const story = useStory()
  const weekly = Boolean(story?.town?.professions?.length)
  const smith = story ? onDuty(story, save, save.calendar.day, 'ida-stone') : null
  const steps = useMemo((): Step[] => weekly && smith === null
    ? [{ narrate: 'A note from the smithy waits by the Forge. The ring bench is ready to use.' }]
    : BENCH_SCENE_LINES.beats.map(b => b.speaker.kind === 'cast' ? { say: smith ?? b.speaker.id, line: b.line } : { narrate: b.line }),
  [weekly, smith])
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const finish = (to: string | null) => {
    if (leaving) return
    setLeaving(true)
    if (to) navigate(to)
    void readBenchScene().catch(() => setLeaving(false))
  }
  const step = steps[at]
  return (
    <SceneLookProvider value={{ day: save.calendar.day }}>
      <Frame title={BENCH_SCENE_LINES.title} label={BENCH_SCENE_LINES.title} scene={BENCH_SCENE} onSkip={() => (at < steps.length ? setAt(steps.length) : finish(null))} skipping={leaving}>
        {step ? (
          <StepView key={at} steps={steps} at={at} nameOf={nameOf} farmer={save.farmer.name} onNext={() => setAt(at + 1)} />
        ) : (
          <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-end gap-3 px-4 pb-4" data-bench-card>
            <div className="space-y-1.5 rounded-md border border-hairline bg-panel p-4 shadow-2">
              <p className="flex items-center gap-2 font-display text-[22px] font-bold"><UiMark mark="farm/ring-bench" scale={2} fallback={<span aria-hidden>◎</span>} /> The ring bench is open</p>
              <p className="text-[15px]">A ring of any grade from three refined goods of that grade. No gold, one ring a day.</p>
              <p className="text-[13px] text-ink-soft">At the Forge, on the workshop row. Any ring makes the proposal Ready at Romance 10.</p>
            </div>
            <Button className="w-full" onClick={() => finish('/?sheet=bench')} data-action="see-bench">See the bench</Button>
            <Button variant="secondary" className="w-full" onClick={() => finish(null)} data-action="later">Later</Button>
          </div>
        )}
      </Frame>
    </SceneLookProvider>
  )
}
