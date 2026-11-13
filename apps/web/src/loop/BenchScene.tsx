// Ida Stone's scene: the morning after the first Romance 8, she comes up from
// town and opens the old Forge as the ring bench. It plays over the farm once the summary is put away (the order), one
// line a tap, Skip to its card; the card says what the bench does, with **See the bench** (`?sheet=bench`) and **Later**.
// Read once (`scene:bench` in `diary.read`). Her bust is a lettered disc until the art is pinned. Loaded on demand from
// the scene player.
import { BENCH_SCENE, BENCH_SCENE_LINES, CAST, withFarmer, type SaveV4 } from '@farm/domain'
import { Button, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { readBenchScene } from './bench-actions'
import { CastBust, Frame } from './ScenePlayer'

export default function BenchScene({ save }: { save: SaveV4 }) {
  const navigate = useNavigate()
  const [at, setAt] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const beats = BENCH_SCENE_LINES.beats
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
        <button type="button" onClick={() => setAt(at + 1)} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-4 px-4 pb-4 text-left" aria-label="Next" data-beat={at}>
          <div className="flex min-h-0 flex-1 items-end justify-center" data-bust={beat.speaker.kind}>
            {beat.speaker.kind === 'cast' && <CastBust id={beat.speaker.id} size={176} />}
          </div>
          <div className="w-full rounded-md border border-hairline bg-panel p-4 shadow-2" aria-live="polite">
            {beat.speaker.kind === 'cast' && <p className="font-display text-[15px] font-bold text-accent" data-speaker>{CAST[beat.speaker.id].name}</p>}
            <p className={`pt-1 text-[17px] leading-snug ${beat.speaker.kind === 'narrator' ? 'text-ink-soft italic' : 'text-ink'}`} data-line>{withFarmer(beat.line, save.farmer.name)}</p>
            <p className="pt-2 text-right text-[12px] text-ink-faint">Tap to go on · {at + 1}/{beats.length}</p>
          </div>
        </button>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 pb-4" data-bench-card>
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
