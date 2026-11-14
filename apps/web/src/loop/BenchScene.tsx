// The smith's scene: the morning after the first Romance 8, the town's smith (the Uma who plays the role) comes up from
// town and opens the old Forge as the ring bench. It plays over the farm once the summary is put away (the order), one
// line a tap, Skip to its card; the card says what the bench does, with **See the bench** (`?sheet=bench`) and **Later**.
// Read once (`scene:bench` in `diary.read`). Her name and bust are master data's; the role's disc with no master data.
// Loaded on demand from the scene player.
import { BENCH_SCENE, BENCH_SCENE_LINES, withFarmer, type SaveV4 } from '@farm/domain'
import { Button, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { useStory } from '../story/story'
import { readBenchScene } from './bench-actions'
import { Frame, PersonBust, SCENE_BUST, SCENE_ROW } from './ScenePlayer'

export default function BenchScene({ save }: { save: SaveV4 }) {
  const navigate = useNavigate()
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const beats = BENCH_SCENE_LINES.beats
  const master = useMaster()
  const story = useStory()
  const nameOf = namer(master.status === 'ready' ? master.view : null, story)
  const finish = (to: string | null) => {
    if (leaving) return
    setLeaving(true)
    if (to) navigate(to)
    void readBenchScene().catch(() => setLeaving(false))
  }
  const beat = beats[at]
  return (
    <Frame title={BENCH_SCENE_LINES.title} label={BENCH_SCENE_LINES.title} scene={BENCH_SCENE} onSkip={() => (at < beats.length ? setAt(beats.length) : finish(null))} skipping={leaving}>
      {beat ? (
        <button type="button" onClick={() => setAt(at + 1)} className={`${SCENE_ROW} text-left`} aria-label="Next" data-beat={at}>
          <div className={SCENE_BUST} data-bust={beat.speaker.kind}>
            {beat.speaker.kind === 'cast' && <PersonBust who={beat.speaker.id} name={nameOf(beat.speaker.id)} size={240} />}
          </div>
          <div className="min-w-0 flex-1 rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
            {beat.speaker.kind === 'cast' && <p className="font-display text-[15px] font-bold text-accent" data-speaker>{nameOf(beat.speaker.id)}</p>}
            <p className={`pt-1 text-[17px] leading-snug ${beat.speaker.kind === 'narrator' ? 'text-ink-soft italic' : 'text-ink'}`} data-line>{withFarmer(beat.line, save.farmer.name)}</p>
            <p className="pt-2 text-right text-[12px] text-ink-faint">Tap to go on · {at + 1}/{beats.length}</p>
          </div>
        </button>
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
  )
}
