// The romance core's dark switch (D29's pattern, as F17's `loopOn`): the romance plays
// only when `VITE_FARM_ROMANCE` is '1': the dev server (`.env.development`) and the size-checked `romance` build, never
// deployed. Production leaves it unset and keeps playing M4 on save v3 until F56 turns it on with the private pack. Vitest
// leaves it off, so M4's web tests run unchanged; a romance test turns it on with `vi.stubEnv`. Read at call time. It only
// picks the web's build: the domain's rules key off the save's version, never this switch.
export const romanceOn = (): boolean => import.meta.env.VITE_FARM_ROMANCE === '1'
