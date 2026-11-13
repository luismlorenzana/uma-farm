// The HD-2D farm's preview switch: Home draws the farm on the shared stage (uma-stage) instead of
// uma-kit's Hub, on this device only, off by default. Account's "HD-2D farm (preview)" row sets it, and so do `?stage=1`
// and `?stage=0` at boot. Remembered with the kit's device preferences (`farm.stage`, the key `configureKit`'s prefix
// gives), which survive blocked storage: a private window just reads "off". Rules never read it and the save never
// changes because of it. Small and in the main chunk; the stage itself loads only when it's on.
import { readPref, subscribePrefs, writePref } from '@luismlorenzana/uma-kit/ui'
import { useSyncExternalStore } from 'react'

/** The device key, the farm's prefix written out: the boot reads it before `configureKit` runs. */
export const STAGE_KEY = 'farm.stage'

/** Whether Home draws the HD-2D farm on this device. */
export const stageOn = (): boolean => readPref(STAGE_KEY) === '1'

/** Turns the preview on or off on this device. */
export function setStageOn(on: boolean): void {
  writePref(STAGE_KEY, on ? '1' : null)
}

/** `?stage=1` or `?stage=0` in a URL's query: the switch it asks for, or null. */
export function stageParam(search: string): boolean | null {
  const value = new URLSearchParams(search).get('stage')
  return value === '1' ? true : value === '0' ? false : null
}

/** At boot: a `?stage=` in the address sets the switch, and leaves the address (so a reload keeps the device's choice). */
export function readStageParam(location: Pick<Location, 'search' | 'pathname' | 'hash'> = window.location, history: Pick<History, 'replaceState' | 'state'> = window.history): void {
  const on = stageParam(location.search)
  if (on === null) return
  setStageOn(on)
  const params = new URLSearchParams(location.search)
  params.delete('stage')
  const rest = params.toString()
  history.replaceState(history.state, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`)
}

/** The switch, live: Account's row and Home follow it as it changes. */
export function useStageOn(): boolean {
  return useSyncExternalStore(subscribePrefs, stageOn, () => false)
}
