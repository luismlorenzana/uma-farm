// The romance core's dark switch (the pattern of the loop's switch): the romance plays
// only when `VITE_FARM_ROMANCE` is '1': the dev server (`.env.development`) and the size-checked `romance` build, never
// deployed. Production leaves it unset and keeps playing the deployed build on save v3 until the private pack turns
// it on. Vitest leaves it off, so the deployed build's web tests run unchanged; a romance test turns it on with
// `vi.stubEnv`. Read at call time. It only picks the web's build: the domain's rules key off the save's version,
// never this switch.
export const romanceOn = (): boolean => import.meta.env.VITE_FARM_ROMANCE === '1'
