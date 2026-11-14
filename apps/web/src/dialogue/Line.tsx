// The dialogue engine's line: the speaker's name in the accent colour and her line (narration and thoughts in italics),
// one tap to go on. A heart event's line is typed out, three lines at most: a tap finishes it, the next goes on, a hold
// skips, and Auto goes on after a reading pause; the other scenes show it whole with their count ("Tap to go on · 3/12").
// A `wait` goes on by itself (5 s at most). With reduced motion nothing types. Loaded with the players.
import { withFarmer, type Step } from '@farm/domain'
import { useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useRef, useState } from 'react'

/** A step's words, kind and speaker as a line shows them. */
export function lineOf(step: Step, farmer: string): { kind: 'say' | 'narrate' | 'thought' | 'other'; speaker: string | null; text: string } {
  const kind = 'say' in step ? 'say' : 'thought' in step ? 'thought' : 'narrate' in step ? 'narrate' : 'other'
  const text = 'say' in step ? step.line : 'narrate' in step ? step.narrate : 'thought' in step ? step.thought : '…'
  return { kind, speaker: 'say' in step ? step.say : null, text: withFarmer(text, farmer) }
}

/** The next spoken line from `from` on: whose bust to preload, with its emote. */
export function nextSay(steps: readonly Step[], from: number): { who: string; emote: string | null } | null {
  for (let i = from; i < steps.length; i++) {
    const s = steps[i]!
    if ('choice' in s || 'play' in s) return null
    if ('say' in s) return { who: s.say, emote: s.emote ?? null }
  }
  return null
}

/** The last spoken line in `steps` (who and her emote): who stays on the stage at a choice or a card after it. */
export function lastSay(steps: readonly Step[], who: string | null = null): { who: string; emote: string | null } | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!
    if ('say' in s && (who === null || s.say === who)) return { who: s.say, emote: s.emote ?? null }
  }
  return null
}

export function Line({ step, nameOf, farmer, onNext, onHold, typed = false, auto = false, still = false, count = null, beat }: {
  step: Step; nameOf: (id: string) => string; farmer: string; onNext: () => void
  /** A hold skips (a heart event's). */
  onHold?: () => void
  /** Typed out, three lines at most (a heart event's). */
  typed?: boolean
  /** Goes on by itself after a reading pause. */
  auto?: boolean
  /** Shown whole and still, above the choices. */
  still?: boolean
  /** "3/12" in its footer. */
  count?: { at: number; of: number } | null
  beat?: number
}) {
  const reduced = useReducedMotionSetting()
  const wait = 'wait' in step ? Math.min(5000, Math.max(0, step.wait)) : null
  const { kind, speaker, text } = lineOf(step, farmer)
  const [chars, setChars] = useState(!typed || reduced || still ? text.length : 0)
  const full = chars >= text.length
  useEffect(() => {
    if (full) return
    const timer = setInterval(() => setChars((n) => Math.min(text.length, n + 2)), 30)
    return () => clearInterval(timer)
  }, [full, text.length])
  useEffect(() => {
    if (wait === null) return
    const timer = setTimeout(onNext, wait)
    return () => clearTimeout(timer)
  }, [wait]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!auto || !full || still || wait !== null) return
    const timer = setTimeout(onNext, 1200 + 35 * text.length)
    return () => clearTimeout(timer)
  }, [auto, full]) // eslint-disable-line react-hooks/exhaustive-deps
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null)
  const held = useRef(false)
  const down = () => {
    held.current = false
    if (onHold) hold.current = setTimeout(() => { held.current = true; onHold() }, 550)
  }
  const up = () => { if (hold.current) clearTimeout(hold.current) }
  const tap = () => {
    if (still || held.current) return
    if (!full) setChars(text.length)
    else onNext()
  }
  const footer = still ? null : typed ? (full ? `Tap to go on${onHold ? ' · hold to skip' : ''}` : 'Tap to finish') : `Tap to go on${count ? ` · ${count.at}/${count.of}` : ''}`
  return (
    <button type="button" onClick={tap} onPointerDown={down} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} disabled={still}
      className="w-full shrink-0 rounded-md border border-hairline bg-panel p-4 text-left shadow-2 disabled:opacity-100" aria-label={still ? undefined : 'Next'}
      data-beat={beat} data-step={kind} aria-live="polite">
      {speaker && <p className="font-display text-[15px] font-bold text-accent" data-speaker>{nameOf(speaker)}</p>}
      <p className={`pt-0.5 leading-snug ${typed ? 'line-clamp-3 min-h-[3lh] text-[16px]' : 'text-[17px]'} ${kind === 'say' ? 'text-ink' : 'text-ink-soft italic'}`} data-line={text}>
        {text.slice(0, chars)}
      </p>
      {footer && <p className="pt-1 text-right text-[12px] text-ink-faint">{footer}</p>}
    </button>
  )
}
