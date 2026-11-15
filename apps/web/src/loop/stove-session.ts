// The play this session has open at the stove: its seed, held from its Start until its screen closes, so the shell can
// tell a play being played from one left behind (the app closed mid-play, or its screen left). A play left behind settles
// as Rough (`kitchen-actions.ts`). Tiny, in the main chunk: the shell reads it on every save.

let held: number | null = null

/** Holds a play just started: its screen is opening. */
export const holdPlay = (seed: number): void => {
  held = seed
}
/** The play's screen closed (finished, stopped or left): it's no longer held. */
export const releasePlay = (): void => {
  held = null
}
/** Whether a play under way is this session's, being played. */
export const playHeld = (seed: number): boolean => held === seed
