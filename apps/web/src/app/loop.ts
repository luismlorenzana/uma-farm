// M4's dark launch (F17 decision 1, D29): the farm's own loop plays only when `VITE_FARM_LOOP` is '1' (the dev server,
// Vitest and the size-checked `loop` build). Production leaves it unset and keeps the Wilds on save v2 until F24, which
// deletes this switch with the Wilds' screens. Read at call time, so a test can turn it off (`vi.stubEnv`).
export const loopOn = (): boolean => import.meta.env.VITE_FARM_LOOP === '1'
