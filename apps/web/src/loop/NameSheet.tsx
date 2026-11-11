// The farmer's name (F46 decision 11; romance spec RM8): the first screen on a fresh v4 farm, covering everything until
// it's entered, as F23's picks did. One field, "What should they call you?", a grey "Farmer" placeholder and no default;
// **Continue** stays off until the name fits the rule, and the words say why. Entering it is the fresh farm's first
// player change, stamped once. No pronouns, no gender, never drawn (RS2). Loaded on demand.
import { cleanFarmerName, FARMER_NAME_MAX, FARMER_PLACEHOLDER, farmerNameIssue } from '@farm/domain'
import { Button, HelpButton } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { useLoopSave } from '../save/game'
import { nameTheFarmer } from './actions'

export default function NameSheet() {
  const save = useLoopSave()
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!save || save.version !== 4 || save.farmer.name !== '') return null
  const issue = farmerNameIssue(name)
  const shown = error ?? (touched && name.length > 0 ? issue : null)
  const submit = () => {
    if (issue || pending) return
    setPending(true)
    setError(null)
    nameTheFarmer(name).catch((err: unknown) => setError(err instanceof Error ? err.message : 'That didn’t work. Try again.')).finally(() => setPending(false))
  }
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" role="dialog" aria-modal="true" aria-label="Your name" data-name-sheet>
      <header className="flex items-start justify-end px-4 pt-3">
        <HelpButton title="Your name" label="About your name">
          <p>The town and the Umas call you by it. Letters, spaces, apostrophes and hyphens; up to {FARMER_NAME_MAX}.</p>
          <p>You can change it any time from Menu → Account.</p>
        </HelpButton>
      </header>
      <form className="flex min-h-0 flex-1 flex-col justify-center gap-3 px-6 pb-24" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <label htmlFor="farmer-name" className="font-display text-[24px] leading-tight font-bold">What should they call you?</label>
        <input id="farmer-name" value={name} onChange={(event) => { setName(event.target.value); setTouched(true); setError(null) }} placeholder={FARMER_PLACEHOLDER}
          autoComplete="off" autoCapitalize="words" spellCheck={false} maxLength={40} enterKeyHint="done" aria-describedby="farmer-name-why"
          className="min-h-12 w-full rounded-md border border-hairline-strong bg-panel px-4 text-[18px] placeholder:text-ink-faint" data-name-field />
        <p id="farmer-name-why" role={shown ? 'alert' : undefined} className={`min-h-5 text-[13px] ${shown ? 'text-danger' : 'text-ink-faint'}`} data-name-why>
          {shown ?? (issue === null ? `“${cleanFarmerName(name)}”` : '')}
        </p>
        <Button type="submit" className="w-full" disabled={issue !== null || pending} data-action="name">Continue</Button>
      </form>
    </div>
  )
}
