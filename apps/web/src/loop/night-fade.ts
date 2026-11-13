// The night is a fade (W16): End the day dims the screen to dusk, the night runs
// with nothing shown, and the morning comes up from it. One layer on the body, above every sheet, made and removed here,
// so it outlives the sheet that started it; reduced motion is a plain cut (the layer shows at once and goes at once).
// The romance build only.

/** The dusk the night fades through: the event player's night sky, deepened. */
export const DUSK = '#2b3557'
/** Down to dusk, then up on the morning (ms). */
export const FADE_IN_MS = 450
export const FADE_OUT_MS = 650

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Runs `night` under the fade: the layer fades in to dusk, `night` runs (the day ends and the farm opens on the morning),
 * then the layer fades out. A failed night lifts the fade at once and throws its error to the caller.
 */
export async function withNightFade<T>(night: () => Promise<T>, reduced: boolean): Promise<T> {
  if (typeof document === 'undefined') return night()
  const layer = document.createElement('div')
  layer.setAttribute('data-night-fade', 'in')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, {
    position: 'fixed', inset: '0', zIndex: '80', background: DUSK, opacity: reduced ? '1' : '0', pointerEvents: 'auto',
    transition: reduced ? 'none' : `opacity ${FADE_IN_MS}ms ease-in`,
  })
  document.body.append(layer)
  try {
    if (!reduced) {
      void layer.offsetWidth // start from 0
      layer.style.opacity = '1'
      await wait(FADE_IN_MS)
    }
    const result = await night()
    layer.setAttribute('data-night-fade', 'out')
    if (!reduced) {
      await wait(30) // the morning draws under the dusk first
      layer.style.transition = `opacity ${FADE_OUT_MS}ms ease-out`
      layer.style.opacity = '0'
      await wait(FADE_OUT_MS)
    }
    return result
  } finally {
    layer.remove()
  }
}
