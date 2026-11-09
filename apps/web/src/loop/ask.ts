// The Menu's switch (F18 decision 10; CS6): "Ask before ending the day". A device setting under uma-kit's `farm.` keys,
// never in the save. On by default; off, End the day ends at once even with Umas idle.
import { kitKey, readPref, subscribePrefs, writePref } from '@luismlorenzana/uma-kit/ui'
import { useSyncExternalStore } from 'react'

const key = () => kitKey('ask-end-day')

export const askBeforeEnd = (): boolean => readPref(key()) !== '0'
export const setAskBeforeEnd = (on: boolean): void => writePref(key(), on ? null : '0')
export const useAskBeforeEnd = (): boolean => useSyncExternalStore(subscribePrefs, askBeforeEnd, () => true)
