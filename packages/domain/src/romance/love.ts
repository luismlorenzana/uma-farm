// Her points and her arrival scene's pay (F46 decisions 8 and 10; romance spec RM4, RM13). Her route starts the day she
// joins at Friendship 0 (`newLove`); her arrival scene, "event zero", pays +50 and its one choice: the option with the
// highest authored gain +30, every other +10 (a tie at the top pays +30 to each), shown on the button before the tap. F47
// grows `addLove` with the ladders, costs and banking. Loaded with the scene player and the night.
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'
import type { ChoiceOption, Step } from '../story/authored'

/** Every arrival pays +50 on completion (RM13). */
export const ARRIVAL_POINTS = 50
/** Her arrival's choice: the best option +30, the others +10 (decision 10). */
export const CHOICE_BEST = 30
export const CHOICE_OTHER = 10

/** An option's authored gain: its friendship and romance hearts. */
export const authoredGain = (option: Pick<ChoiceOption, 'friendship' | 'romance'>): number => (option.friendship ?? 0) + (option.romance ?? 0)

/** Each option's points, in order (decision 10): the highest authored gain pays +30, every tie at the top too; the rest +10. */
export function choicePoints(options: readonly Pick<ChoiceOption, 'friendship' | 'romance'>[]): number[] {
  const top = Math.max(...options.map(authoredGain))
  return options.map((o) => (authoredGain(o) === top ? CHOICE_BEST : CHOICE_OTHER))
}

/** Points into her bar (RM13): F46 adds them; F47 grows this with the rungs' costs and banking (RM12, RM14). */
export function addLove(save: SaveV4, id: string, points: number): SaveV4 {
  const love = save.love[id]
  if (!love) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (!Number.isFinite(points) || points < 0) throw new SaveRuleError('bad-count', 'Points are never taken away.')
  return { ...save, love: { ...save.love, [id]: { ...love, points: love.points + points } } }
}

/** A scripted scene as it plays (decision 10): its steps in order, each picked option's `then` spliced in after its
 * choice, up to and including the first choice not yet picked. `picks` are the options chosen, in order. */
export function sceneSteps(steps: readonly Step[], picks: readonly number[]): Step[] {
  const out: Step[] = []
  let next = 0
  const walk = (list: readonly Step[]): boolean => {
    for (const step of list) {
      out.push(step)
      if (!('choice' in step)) continue
      const pick = picks[next]
      if (pick === undefined) return false
      next++
      const then = step.choice[pick]?.then
      if (then && !walk(then)) return false
    }
    return true
  }
  walk(steps)
  return out
}

/** The flags a played path sets (RM27: wording only). */
export const pathFlags = (steps: readonly Step[]): string[] => [...new Set(steps.flatMap((s) => ('flag' in s ? [s.flag] : [])))]

/** What her arrival scene earned: its choice's points and the flags its path set. */
export interface ArrivalPlayed {
  /** +30 or +10 (`choicePoints`). */
  choice: number
  flags: readonly string[]
}

/** Her arrival scene, played (or skipped to its choice) once (decision 10): +50 and its choice into her bar, its flags
 * into hers, and her id into `arrivals`. Played already: unchanged. Never stamps: the app's action does, once. */
export function finishArrival(save: SaveV4, id: string, played: ArrivalPlayed): SaveV4 {
  if (save.arrivals.includes(id)) return save
  if (!save.roster[id] || !save.love[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (played.choice !== CHOICE_BEST && played.choice !== CHOICE_OTHER) throw new SaveRuleError('bad-count', 'An arrival’s choice pays +10 or +30.')
  const paid = addLove(save, id, ARRIVAL_POINTS + played.choice)
  const love = paid.love[id]!
  return { ...paid, love: { ...paid.love, [id]: { ...love, flags: [...new Set([...love.flags, ...played.flags])] } }, arrivals: [...save.arrivals, id] }
}

/** Her arrival when the pack scripts none ("still being written", D48): a line and a choice, so every arrival still
 * pays. Original, and it never names her. */
export const FALLBACK_ARRIVAL: readonly Step[] = [
  { place: 'gate' },
  { narrate: 'A new face walks in at the Gate, a bag over one shoulder.' },
  { choice: [{ text: 'Welcome to the farm.', tone: 'warm', friendship: 20 }, { text: 'Make yourself at home.', tone: 'playful', friendship: 10 }] },
]
