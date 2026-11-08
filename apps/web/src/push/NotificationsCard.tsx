// The Account's notification switch (copied from uma-rpg's at 30a322a, its D63; the farm's F6), on the kit's Panel.
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushKey, pushState, testPush, type PushState } from './push'

const NOTE: Partial<Record<PushState, string>> = {
  install: 'Add Uma Farm to your Home Screen (Share → Add to Home Screen), then turn them on from there.',
  unsupported: 'This browser can’t receive notifications.',
  unavailable: 'Notifications work in the installed app.',
  denied: 'Notifications are blocked. Allow them for Uma Farm in Settings → Notifications.',
}

export function NotificationsCard() {
  const [state, setState] = useState<PushState>('loading')
  const [key, setKey] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    void pushState().then(setState)
    void pushKey().then(setKey)
  }, [])
  const on = state === 'on'
  const ready = state === 'on' || state === 'off'
  const toggle = () => {
    if (busy || !ready || (!on && !key)) return
    setBusy(true)
    setMessage(null)
    const op = on ? disablePush() : enablePush(key!)
    op.then(() => pushState().then(setState), (err: unknown) => setMessage(err instanceof Error ? err.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  return (
    <Panel className="p-3" aria-label="Notifications">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold">Notifications</h2>
          <p className="text-[12px] text-ink-soft">When work is done</p>
        </div>
        {/* A 44 pt target around uma-rpg's track. */}
        <button type="button" role="switch" aria-checked={on} aria-label="Notify me when work is done" disabled={!ready || busy || (!on && key === null)} onClick={toggle}
          className="flex h-11 w-16 shrink-0 items-center justify-center disabled:opacity-40">
          <span className={`relative h-8 w-14 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-sunken'}`}>
            <span className={`absolute top-1 size-6 rounded-full bg-white shadow-2 transition-all ${on ? 'left-7' : 'left-1'}`} />
          </span>
        </button>
      </div>
      {NOTE[state] && <p className="mt-2 text-[12px] text-ink-faint">{NOTE[state]}</p>}
      {ready && !on && key === null && <p className="mt-2 text-[12px] text-ink-faint">Notifications are off on the server.</p>}
      {on && (
        <button type="button" onClick={() => void testPush().then((n) => setMessage(n > 0 ? 'Sent: it should arrive in a moment.' : 'No device is subscribed.'))}
          className="mt-2 min-h-11 rounded-sm bg-sunken px-3 text-[12px] font-semibold">Send a test</button>
      )}
      {message && <p className="mt-2 text-[12px] text-ink-soft">{message}</p>}
    </Panel>
  )
}
