// The game is laid out sideways (the manifest asks for landscape, which iOS doesn't enforce on a Home Screen app). Held
// upright, this card covers everything, the gates and scenes included, until the phone turns. It shows by CSS alone
// (the `portrait:` variant), so it never flashes the wrong way, and the game underneath keeps its place.
import { useEffect, useState } from 'react'

export const UPRIGHT_WORDS = { title: 'Turn your phone sideways', line: 'Uma Farm plays in landscape.' } as const

const portrait = (): MediaQueryList | null =>
  (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: portrait)') : null)

/** Whether the screen is upright now, live; false where the browser can't tell (tests). */
function useUpright(): boolean {
  const [query] = useState(portrait)
  const [upright, setUpright] = useState(() => query?.matches ?? false)
  useEffect(() => {
    if (!query) return
    const change = () => setUpright(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [query])
  return upright
}

export function Upright() {
  // VoiceOver reads the card only while it shows.
  const upright = useUpright()
  return (
    <div aria-hidden={!upright} data-upright
      className="pt-safe pb-safe pl-safe pr-safe fixed inset-0 z-[1000] hidden flex-col items-center justify-center gap-4 bg-page px-8 text-center portrait:flex">
      <svg aria-hidden viewBox="0 0 64 64" className="size-16 text-accent" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <rect x="22" y="6" width="20" height="34" rx="4" opacity={0.45} />
        <rect x="10" y="30" width="44" height="24" rx="4" />
        <path d="M50 14a12 12 0 0 1 4 10" />
        <path d="M54 24l2.5-4.5M54 24l-4.5-1.5" />
      </svg>
      <p className="font-display text-2xl font-bold text-ink">{UPRIGHT_WORDS.title}</p>
      <p className="text-ink-soft">{UPRIGHT_WORDS.line}</p>
    </div>
  )
}
