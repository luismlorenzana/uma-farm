// Scene links: whether a scene the app opens from a query param may play now. The players open over any page from the
// URL (`?life=`, `?event=`, `?ask=`, `?memory=`, `?evening=`, `?occasion=`, `?household=` with `&replay=1`, `?level=`),
// so a typed, bookmarked or stale link must never play a scene the game hasn't given you, pay for it, or put a picture
// in her gallery. Each kind has one pure rule here, read once as its player opens; a link it refuses closes quietly,
// with no scene, no pay and no unlock. The game's own buttons only ever open what these allow.
//
//   ?life=morning:<id>          the morning after a night she was your companion (`love.night`, yesterday): that
//                                morning only, from the night's fade or the morning's ☾ line
//   ?life=moving-in:<id>        a spouse with a room, on her wedding day, or the morning she moved into a room
//                                (this morning's "moved into" line)
//   ?life=invited-to-work:<id>  the day you invited her to work (`roster[id].farmhand`, today)
//   ?life=breakfast|dinner:<id> that meal cooked today, and she's a spouse who ate it (or the one whose line it plays)
//   ?life=talk:<id>             you've talked with her today (`today.chats`): her greeting and her line or small talk
//   ?event=<id>                 her next event is Ready (`readiness`)
//   ?ask=<id>                   she said "Not yet" and you haven't asked today (`canAsk`)
//   ?memory=<id>:<rung>         a Memory already played (her meeting scene, or a rung in `memories`)
//   ?evening=<id>               her evening is open to her now (`kindsNow`: in front of you, on the farm or met in town
//                                today); `?evening=pick` while anyone's is
//   ?occasion=<id>              her next occasion today, with an Uma you've met, not yet played (`occasionWith`)
//   ?household=<id>             a household scene Ready (`householdReady`); with `&replay=1`, one already read
//   ?level=<id>:<s2|s4>         a spouse level she's reached
//
// Pure; never stamps.
import { GAME_DAYS, type SpecialDays } from '../farm/actions'
import type { Meal, SaveV4 } from '../save/v4'
import type { StoryPack } from '../story/pack'
import { festivalsOf } from '../story/placeholders'
import { eveningUmas, kindsNow, type EveningPack } from './evening'
import { canAsk } from './events'
import { householdReady, isHouseholdId } from './household'
import { mealEaters, mealsCooked, mealSpeaker } from './loop'
import { occasionWith } from './occasions'
import { readiness } from './ready'

/** Her life's short scenes at `?life=`: the night's companion's morning, moving in, the invitation to work, a meal, and
 * today's talk with her. */
export type LifeLink = 'morning' | 'moving-in' | 'invited-to-work' | 'talk' | Meal

const met = (save: Pick<SaveV4, 'roster' | 'love'>, id: string): boolean => !!save.roster[id] && !!save.love[id]
const spouse = (save: Pick<SaveV4, 'roster' | 'love'>, id: string): boolean => met(save, id) && save.love[id]!.stage === 'spouse'

/** `?life=morning:<id>`: she was your companion last night, so she greets you this morning; that morning only. */
export function mayGreet(save: Pick<SaveV4, 'roster' | 'love' | 'calendar'>, id: string): boolean {
  return spouse(save, id) && save.love[id]!.night !== undefined && save.love[id]!.night === save.calendar.day - 1
}

/** `?life=moving-in:<id>`: a spouse with a room, on her wedding day (she moves in after the wedding night), or the
 * morning she took a room she'd waited for (this morning's "moved into" line). */
export function mayMoveIn(save: Pick<SaveV4, 'roster' | 'love' | 'calendar' | 'summary'>, id: string): boolean {
  if (!spouse(save, id) || save.love[id]!.house === undefined) return false
  const day = save.calendar.day
  if (save.love[id]!.wed === day) return true
  return save.summary?.day === day && save.summary.hearts.some((h) => h.kind === 'moved' && h.id === id)
}

/** `?life=invited-to-work:<id>`: you invited her to work today. */
export function mayWelcomeToWork(save: Pick<SaveV4, 'roster' | 'love' | 'calendar'>, id: string): boolean {
  return met(save, id) && save.roster[id]!.farmhand === save.calendar.day
}

/** `?life=breakfast:<id>` or `dinner`: that meal cooked today, and she's a spouse who ate it, or the spouse whose line it
 * plays. */
export function mayMealScene(save: Pick<SaveV4, 'roster' | 'love' | 'today' | 'account' | 'calendar'>, id: string, meal: Meal): boolean {
  if (!spouse(save, id) || !mealsCooked(save).includes(meal)) return false
  return mealEaters(save).includes(id) || mealSpeaker(save, meal) === id
}

/** `?life=talk:<id>`: you've talked with her today, so today's talk plays again (it pays nothing). */
export const mayReplayTalk = (save: Pick<SaveV4, 'roster' | 'love' | 'today'>, id: string): boolean => met(save, id) && save.today.chats.includes(id)

/** `?life=<kind>:<id>`: each kind's rule. */
export function mayPlayLife(save: SaveV4, kind: LifeLink, id: string): boolean {
  switch (kind) {
    case 'morning': return mayGreet(save, id)
    case 'moving-in': return mayMoveIn(save, id)
    case 'invited-to-work': return mayWelcomeToWork(save, id)
    case 'talk': return mayReplayTalk(save, id)
    default: return mayMealScene(save, id, kind)
  }
}

/** `?event=<id>`: her next event is Ready, as the domain decides. */
export function mayPlayEvent(save: SaveV4, pack: Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'world'>>, id: string): boolean {
  return met(save, id) && readiness(save, pack, id).ready
}

/** `?ask=<id>`: Ask her, once a day after her "Not yet". */
export const mayAsk = (save: Pick<SaveV4, 'roster' | 'love' | 'today'>, id: string): boolean => met(save, id) && canAsk(save, id)

/** `?memory=<id>:<rung>`: a Memory already played: her meeting scene, or a rung of her route. */
export function mayReplayMemory(save: Pick<SaveV4, 'roster' | 'love' | 'arrivals' | 'memories'>, id: string, rung: string): boolean {
  if (!met(save, id)) return false
  return rung === 'arrival' ? save.arrivals.includes(id) : (save.memories[id] ?? []).includes(rung)
}

/** `?evening=<id>`: her evening is open to her now (in front of you: home on the farm, a farmhand there on her farm day, or out in
 * town today with you there; a hangout from Friendship 3 or a date from Romance 1; a slot free); `?evening=pick`: while
 * anyone's is and the day has the 2 actions (Tonight's picker). */
export function mayOpenEvening(save: SaveV4, pack: EveningPack, id: string | 'pick'): boolean {
  if (id === 'pick') return eveningUmas(save, pack).length > 0
  return met(save, id) && kindsNow(save, pack, id).length > 0
}

/** `?occasion=<id>`: today holds one of her occasions, she's met, and you haven't played it with her yet. */
export const mayPlayOccasion = (save: Pick<SaveV4, 'calendar' | 'roster' | 'love' | 'today'>, pack: Pick<StoryPack, 'scripted'> & Partial<Pick<StoryPack, 'world'>>, id: string, days: SpecialDays = GAME_DAYS): boolean =>
  occasionWith(save, pack, days, id) !== null

/** `?household=<id>`: a household scene or the finale Ready; a replay (`&replay=1`, the Diary's) only once it's read. */
export function mayPlayHousehold(save: Pick<SaveV4, 'homestead' | 'diary'> & Partial<Pick<SaveV4, 'calendar' | 'love' | 'longGame'>>, id: string, replay: boolean): boolean {
  if (!isHouseholdId(id)) return false
  return replay ? save.diary.read.includes(id) : householdReady(save).includes(id)
}

/** `?level=<id>:<s2|s4>`: a spouse level she's reached (the night gave it; its scene pays nothing). */
export function mayPlayNightLevel(save: Pick<SaveV4, 'roster' | 'love'>, id: string, rung: 's2' | 's4'): boolean {
  return spouse(save, id) && save.love[id]!.level >= Number(rung.slice(1))
}

/** Every link and its rule, as the manual lists them. */
export const SCENE_LINKS: readonly { link: string; plays: string; when: string }[] = [
  { link: '`?life=morning:<id>`', plays: 'The night’s companion greets you', when: 'The morning after a night she was your companion (`love.night` is yesterday): that morning only' },
  { link: '`?life=moving-in:<id>`', plays: 'Moving in', when: 'A spouse with a room, on her wedding day or the morning she moved into a room she waited for' },
  { link: '`?life=invited-to-work:<id>`', plays: 'The invitation to work', when: 'The day you invited her (`roster[id].farmhand` is today)' },
  { link: '`?life=breakfast:<id>`, `?life=dinner:<id>`', plays: 'A meal’s line', when: 'That meal cooked today, and she’s a spouse who ate it (or the one whose line it plays)' },
  { link: '`?life=talk:<id>`', plays: 'Today’s talk with her: her greeting, then her line or a small talk', when: 'You’ve talked with her today (it pays nothing)' },
  { link: '`?event=<id>`', plays: 'Her heart event', when: 'Ready (`readiness`); with no action left it says so and plays nothing' },
  { link: '`?ask=<id>`', plays: 'Ask her', when: 'She said “Not yet” at her confession, and you haven’t asked today' },
  { link: '`?memory=<id>:<rung>`', plays: 'A Memory, paying nothing', when: 'A Memory already played: her meeting scene, or a rung of her route' },
  { link: '`?evening=<id>`', plays: 'Her kinds sheet, then the evening', when: 'Her evening is open to her now: in front of you (home on the farm, a farmhand there on her farm day, or out in town today with you there), a hangout or a date her ladder opened, a slot free' },
  { link: '`?evening=pick`', plays: 'Tonight’s picker', when: 'Someone can spend an evening now, and the day has its 2 actions' },
  { link: '`?occasion=<id>`', plays: 'An occasion scene', when: 'Her next occasion today (the day’s, then a festival’s night), with an Uma you’ve met, not yet played' },
  { link: '`?household=<id>`', plays: 'A household scene or the finale', when: 'Ready (the night saw its count) and not yet read; with `&replay=1`, once read' },
  { link: '`?level=<id>:<s2|s4>`', plays: 'A spouse level’s scene and card', when: 'She’s reached it (it pays nothing)' },
]
