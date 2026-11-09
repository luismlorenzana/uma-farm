import { useEffect, useState } from 'react'

/** The time now in ms, refreshed every `everyMs` while the page is visible, and at once when it comes back into view (as
 * uma-rpg's `useNow`): the sync warning's clock. The farm's days don't read it: they move only when ended. */
export function useNow(everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') setNow(Date.now())
    }
    const id = setInterval(tick, everyMs)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [everyMs])
  return now
}
