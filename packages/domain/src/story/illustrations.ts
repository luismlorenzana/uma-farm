// Her illustrations in a scene: the full-screen pictures her big moments open onto. Master data's `illustrations` family
// holds them by character id (her scenes in the art's order, each with its moment), read at runtime: no id, title or
// picture of hers is in git. A scene shows one in either case:
//   - **the story names one:** a step `{ "illustration": "<her scene's id>" }` in her route's events puts it up from
//     there, until the next such step (`none` takes it down) or the scene's end;
//   - **by default** (`illustrate`): at the moments the game knows, the default mapping puts cues in the scene's steps
//     by moment (`@meeting`), each her first scene for that moment. A scene that names an illustration of its own plays
//     only its own.
// A cue whose scene she doesn't have shows nothing: her bust plays, as for an Uma without illustrations. Every scene
// seen joins her gallery for good (`save/gallery.ts`). Pure. Loaded with the players: the save's part is its own module,
// so the boot's parse doesn't bring the mapping.
import type { ChoiceOption, Step } from './authored'
import { dateOf } from '../farm/calendar'
import { SHORE_PLACES } from './look'

/** The moments a scene opens onto an illustration, in story order: master data's `ILLUSTRATION_MOMENTS`. */
export const ILLUSTRATED_MOMENTS = [
  'meeting', 'beach', 'confession', 'confession-yes', 'wedding', 'wedding-night', 'wedding-night-end', 'night-in', 'companion',
] as const
export type IllustratedMoment = typeof ILLUSTRATED_MOMENTS[number]

/** The step value that takes an illustration down: her bust is back. */
export const NO_ILLUSTRATION = 'none'
/** A default cue's value: `@<moment>`, her first scene for that moment. The story names hers by id. */
export const momentCue = (moment: IllustratedMoment): string => `@${moment}`

/** What a cue asks for: her scene by id, her first for a moment, or nothing (taken down). */
export type IllustrationAsk = { by: 'id'; id: string } | { by: 'moment'; moment: string } | null

/** A cue's value, read: `none` is nothing, `@<moment>` a moment, anything else a scene id (one she doesn't have shows
 * nothing). */
export function readCue(value: string): IllustrationAsk {
  if (value === NO_ILLUSTRATION || value === '') return null
  return value.startsWith('@') ? { by: 'moment', moment: value.slice(1) } : { by: 'id', id: value }
}

/** The illustration up at step `at` of a played path: the last cue at or before it, or null. */
export function illustrationAt(shown: readonly Step[], at: number): IllustrationAsk {
  for (let i = Math.min(at, shown.length - 1); i >= 0; i--) {
    const step = shown[i]!
    if ('illustration' in step) return readCue(step.illustration)
  }
  return null
}

/** Every step of a scene, a choice's `then`, a branch's and a play's `good` and `miss` included. */
function everyStep(steps: readonly Step[]): Step[] {
  return steps.flatMap((s): Step[] => {
    if ('choice' in s) return [s, ...s.choice.flatMap((o) => everyStep(o.then ?? []))]
    if ('when' in s) return [s, ...everyStep(s.then), ...everyStep(s.else ?? [])]
    if ('play' in s) return [s, ...everyStep(s.play.good ?? []), ...everyStep(s.play.miss ?? [])]
    return [s]
  })
}

/** Whether a scene's steps name an illustration anywhere: then its own play, and the default mapping steps aside. */
export const namesIllustration = (steps: readonly Step[]): boolean => everyStep(steps).some((s) => 'illustration' in s)

/** Every illustration a scene can put up, each once, in order: what its start preloads. */
export function illustrationCues(steps: readonly Step[]): Exclude<IllustrationAsk, null>[] {
  const seen = new Set<string>()
  const out: Exclude<IllustrationAsk, null>[] = []
  for (const step of everyStep(steps)) {
    if (!('illustration' in step) || seen.has(step.illustration)) continue
    seen.add(step.illustration)
    const ask = readCue(step.illustration)
    if (ask) out.push(ask)
  }
  return out
}

/** Her scene a cue asks for, from her scenes in the art's order: the one by its id, or her first for the moment; null
 * when she has none (her bust plays). */
export function sceneFor<T extends { id: string; moment: string }>(scenes: readonly T[], ask: IllustrationAsk): T | null {
  if (!ask) return null
  return scenes.find((s) => (ask.by === 'id' ? s.id === ask.id : s.moment === ask.moment)) ?? null
}

/** Her gallery's tiles: every scene of hers in the art's order, unlocked once seen; the rest are locked. */
export function galleryTiles<T extends { id: string }>(scenes: readonly T[], seen: readonly string[]): { scene: T; unlocked: boolean }[] {
  return scenes.map((scene) => ({ scene, unlocked: seen.includes(scene.id) }))
}

// --- The default mapping --------------------------------------------------------------------------------------------------

/** The scenes the default mapping illustrates. */
export const ILLUSTRATED_SCENES = ['meeting', 'shore', 'confession', 'wedding', 'wedding-night', 'night-in', 'companion'] as const
export type IllustratedScene = typeof ILLUSTRATED_SCENES[number]

/** The default mapping, as the docs' table shows it: each scene, its moments and where each is up. */
export const ILLUSTRATION_RULES: Readonly<Record<IllustratedScene, { scene: string; moments: readonly IllustratedMoment[]; where: string }>> = {
  meeting: { scene: 'Her meeting scene (`arrival`)', moments: ['meeting'], where: 'From its start to its end' },
  shore: {
    scene: 'A summer date at the shore: her heart event at the sea pier in summer, from Romance 1 on (her Romance and Spouse rungs and the proposal)',
    moments: ['beach'], where: 'From its start to its end',
  },
  confession: {
    scene: 'Her confession (`confession`, and Ask her)', moments: ['confession', 'confession-yes'],
    where: '`confession` at the question: her lines that lead into her answer’s choice, and the choice. `confession-yes` from her Yes to the end; a Not yet takes it down',
  },
  wedding: { scene: 'The wedding (`wedding`)', moments: ['wedding'], where: 'From its start to its end' },
  'wedding-night': {
    scene: 'The wedding night (`wedding-night`)', moments: ['wedding-night', 'wedding-night-end'],
    where: '`wedding-night` from its start. `wedding-night-end` as it fades: from the lines after its last choice (else that choice’s answers; with no choice, its last line) to the end',
  },
  'night-in': { scene: 'A night in’s evening scene (`a-night-in`)', moments: ['night-in'], where: 'From its start to its end' },
  companion: { scene: 'The night’s companion’s morning greeting', moments: ['companion'], where: 'Before her greeting: the morning’s narration, until her first line' },
}

const cue = (moment: IllustratedMoment): Step => ({ illustration: momentCue(moment) })
const DOWN: Step = { illustration: NO_ILLUSTRATION }
const isLine = (s: Step): boolean => 'say' in s || 'narrate' in s || 'thought' in s
/** The last top-level step's index that `test` holds for, or -1. */
function lastIndex(steps: readonly Step[], test: (s: Step) => boolean): number {
  for (let i = steps.length - 1; i >= 0; i--) if (test(steps[i]!)) return i
  return -1
}
/** The last top-level choice point's index, or -1. */
const lastChoice = (steps: readonly Step[]): number => lastIndex(steps, (s) => 'choice' in s)
/** A choice with each option's `then` opened by `first(option)` (none: unchanged). */
function opening(step: { choice: ChoiceOption[] }, first: (option: ChoiceOption) => Step | null): Step {
  return { choice: step.choice.map((o) => {
    const lead = first(o)
    return lead ? { ...o, then: [lead, ...(o.then ?? [])] } : o
  }) }
}

/**
 * The default mapping: a scene's steps with its moments' cues in place, unless the scene names an illustration of its
 * own (then it's unchanged, and plays only its own). See `ILLUSTRATION_RULES`.
 */
export function illustrate(scene: IllustratedScene | null, steps: readonly Step[]): Step[] {
  if (scene === null || steps.length === 0 || namesIllustration(steps)) return [...steps]
  switch (scene) {
    case 'meeting': return [cue('meeting'), ...steps]
    case 'shore': return [cue('beach'), ...steps]
    case 'wedding': return [cue('wedding'), ...steps]
    case 'night-in': return [cue('night-in'), ...steps]
    case 'companion': {
      const first = steps.findIndex((s) => 'say' in s)
      return first < 0 ? [cue('companion'), ...steps] : [cue('companion'), ...steps.slice(0, first), DOWN, ...steps.slice(first)]
    }
    case 'confession': {
      const at = lastChoice(steps)
      if (at < 0) return [...steps]
      // The question: her lines right before the answer's choice.
      let from = at
      while (from > 0 && 'say' in steps[from - 1]!) from--
      const answer = opening(steps[at] as { choice: ChoiceOption[] }, (o) => (o.answer === 'not-yet' ? DOWN : cue('confession-yes')))
      return [...steps.slice(0, from), cue('confession'), ...steps.slice(from, at), answer, ...steps.slice(at + 1)]
    }
    case 'wedding-night': {
      const at = lastChoice(steps)
      if (at < 0) {
        const last = lastIndex(steps, isLine)
        return last <= 0 ? [cue('wedding-night'), ...steps] : [cue('wedding-night'), ...steps.slice(0, last), cue('wedding-night-end'), ...steps.slice(last)]
      }
      // As it fades: the lines after its last choice, else the choice's answers.
      const after = steps.slice(at + 1)
      const body = after.some(isLine)
        ? [...steps.slice(0, at + 1), cue('wedding-night-end'), ...after]
        : [...steps.slice(0, at), opening(steps[at] as { choice: ChoiceOption[] }, () => cue('wedding-night-end')), ...after]
      return [cue('wedding-night'), ...body]
    }
  }
}

/** The rungs a summer date at the shore can be: past her confession (her Romance and Spouse rungs and the proposal). */
const DATE_RUNG = /^(?:r(?:[1-9]|10)|s[1-5]|proposal)$/

/** Which illustrated scene a heart event is: her confession, the wedding, or a summer date at the shore (her event at
 * the shore in summer, from Romance 1 on). `place` is where it plays (her beat's, else its first `place` step). */
export function eventIllustration(event: { rung: string; place?: string | null; day: number }): IllustratedScene | null {
  if (event.rung === 'confession') return 'confession'
  if (event.rung === 'wedding') return 'wedding'
  const summer = dateOf(Math.max(1, event.day)).season === 'summer'
  if (DATE_RUNG.test(event.rung) && event.place && SHORE_PLACES.includes(event.place) && summer) return 'shore'
  return null
}

/** Where a scene plays: its first `place` step, or null. */
export const firstPlace = (steps: readonly Step[]): string | null => {
  const found = steps.find((s) => 'place' in s)
  return found && 'place' in found ? found.place : null
}

/** Which illustrated scene an evening's scene is: A night in's. */
export const eveningIllustration = (sceneId: string): IllustratedScene | null => (sceneId === 'a-night-in' ? 'night-in' : null)
