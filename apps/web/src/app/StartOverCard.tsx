// The start-over card: uma-kit's first-launch step, shown when boot found a save from before v5 (v4's farm of blocks
// among them). One line and one button; the button makes the new farm (`startOver`), and the farm opens on its first
// screen, the farmer's name.
import { useState } from 'react'
import { startOver } from '../save/game'

export const START_OVER_WORDS = {
  title: 'Your farm starts over',
  line: 'This version of the game begins a new farm on day 1.',
  button: 'Start the new farm',
} as const

export function StartOverCard({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const start = () => {
    setBusy(true)
    setError(null)
    startOver().then(onDone, (err: unknown) => {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.')
    })
  }
  return (
    <div className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 flex flex-col items-center justify-center gap-6 bg-page px-8 text-center" data-start-over>
      <div>
        <p className="font-display text-3xl font-bold text-accent">{START_OVER_WORDS.title}</p>
        <p className="mt-2 text-ink-soft">{START_OVER_WORDS.line}</p>
      </div>
      <button type="button" onClick={start} disabled={busy} data-action="start-over"
        className="font-display min-h-12 w-full max-w-xs rounded-sm bg-accent text-base font-bold text-accent-ink disabled:opacity-60">
        {START_OVER_WORDS.button}
      </button>
      {error && <p role="alert" className="max-w-xs text-[13px] text-danger">{error}</p>}
    </div>
  )
}
