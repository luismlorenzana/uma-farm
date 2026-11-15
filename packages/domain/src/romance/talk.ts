// Talk that knows the day: a chat (on the farm or in town) opens with her greeting, then her line, or a small talk.
//
//   her greeting   from the most specific of her bible's sets that applies and holds lines (`greetings`):
//                  1. her birthday's;
//                  2. the place where you're talking, `places.<id>`: her location in town (else `places.town`), or the
//                     farm's place where she works today (her board's first task's) or lives (the Dorm);
//                  3. the season's;
//                  4. the hour's: `morning` by day, `evening` once you've spent an evening with her today, `night` after
//                     a night in with her or once she's tonight's companion.
//                  None with no set holding lines: the talk opens on her line. Her `weather` is read and kept: it plays
//                  once the game has weather
//   her line       one of her stage's lines (`chatLineV4`'s: her bible's set, else the default story's talks) or one of
//                  her small talks that fit the moment, drawn together: a small talk fits when every tag it carries
//                  matches (`at` the place, or `town` anywhere in town; `season`; `stage` her chat set)
//   a small talk   plays as its lines on the dialogue engine, hers and yours (`you`, the farmer)
//
// Each is drawn by the account, the day and her id, so it holds all day. Pure; loaded with the chat's screens.
import { dateOf } from '../farm/calendar'
import { draw } from '../farm/draw'
import { taskPlace } from '../farm/farmhands'
import type { Temperament } from '../farm/talents'
import type { SaveV4 } from '../save/v4'
import { YOU, type GreetingTime, type SmallTalk, type Step } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { chatLinesOf, defaultTalksOf, greetingsOf, smallTalkOf, talkStageOf } from '../story/placeholders'
import { whereYouMeet, type SchedulePack } from '../town/town'
import { chatSet } from './acts'
import { isBirthday, NO_BIRTHDAYS, type Birthdays } from './days'
import { isFarmhand } from './loop'

/** Where you're talking with her, and when: the place (a town location, else a farm place; null when there's none to
 * name), whether it's in town, and the hour. */
export interface TalkAt { place: string | null; town: boolean; hour: GreetingTime }

/** The hour of a talk with her: `night` once she's tonight's companion or after a night in with her today, `evening`
 * after an evening with her today, else `morning` (by day). */
export function talkHour(save: Pick<SaveV4, 'today' | 'homestead'>, id: string): GreetingTime {
  const evenings = save.today.evenings.filter((e) => e.with === id)
  if (save.homestead.companion === id || evenings.some((e) => e.kind === 'night-in')) return 'night'
  return evenings.length > 0 ? 'evening' : 'morning'
}

/** The farm's place where she is by day: her work board's first task's place (a farmhand's), else the Dorm when she
 * lives there; null for neither (a spouse in her house). */
export function farmPlaceOf(save: Pick<SaveV4, 'roster' | 'dorm'>, id: string): string | null {
  const task = save.roster[id]?.farmhand !== undefined ? save.roster[id]?.tasks?.[0] : undefined
  if (task) return taskPlace(task)
  return save.dorm.home.includes(id) ? 'dorm' : null
}

/** Where you'd talk with her now (`whereYouMeet`): on the farm at her farm place, or in town at her location today. */
export function talkAt(save: Pick<SaveV4, 'calendar' | 'roster' | 'dorm' | 'love' | 'today' | 'homestead'>, pack: SchedulePack, id: string): TalkAt {
  const meet = whereYouMeet(save, pack, id)
  const hour = talkHour(save, id)
  return meet.farm ? { place: farmPlaceOf(save, id), town: false, hour } : { place: meet.at, town: meet.at !== null, hour }
}

/** One of a list, drawn by the account, the day and what's drawn: the same all day. */
const pick = <T>(save: Pick<SaveV4, 'account' | 'calendar'>, what: string, list: readonly T[]): T | null =>
  list.length === 0 ? null : list[Math.min(list.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, what, 0) * list.length))]!

/** Her greeting's set for this talk: the most specific that applies and holds lines (her birthday's, the place's, the
 * season's, the hour's); none when no set holds any. */
export function greetingLines(save: Pick<SaveV4, 'calendar'>, pack: Pick<StoryPack, 'bibles'>, id: string, at: TalkAt, birthday: boolean): readonly string[] {
  const g = greetingsOf(pack, id)
  const place = at.place !== null ? g.places?.[at.place] ?? [] : []
  const sets: (readonly string[] | undefined)[] = [
    birthday ? g.birthday : undefined,
    place.length > 0 ? place : at.town ? g.places?.town : undefined,
    g.seasons?.[dateOf(save.calendar.day).season],
    g.times?.[at.hour],
  ]
  return sets.find((s) => (s?.length ?? 0) > 0) ?? []
}

/** Her greeting for this talk, or null: one of `greetingLines`, drawn by the account, the day and her id. */
export const greetingOf = (save: Pick<SaveV4, 'account' | 'calendar'>, pack: Pick<StoryPack, 'bibles'>, id: string, at: TalkAt, birthday: boolean): string | null =>
  pick(save, `greeting:${id}`, greetingLines(save, pack, id, at, birthday))

/** Whether a small talk fits this talk: every tag it carries matches (its place, or `town` anywhere in town; the season;
 * her chat set). */
export function smallTalkFits(talk: Pick<SmallTalk, 'at' | 'season' | 'stage'>, at: TalkAt, season: string, set: string | null): boolean {
  if (talk.at !== undefined && talk.at !== at.place && !(talk.at === 'town' && at.town)) return false
  if (talk.season !== undefined && talk.season !== season) return false
  return talk.stage === undefined || talk.stage === set
}

/** A chat as it plays: her greeting (or none), and her line or a small talk, on the dialogue engine. */
export interface Talk {
  greeting: string | null
  /** The steps, the greeting first: her lines say as her, your lines as `you`. */
  steps: Step[]
  /** The small talk drawn, or null for her line. */
  small: SmallTalk | null
}

/** Her chat today: her greeting, then one of her stage's lines and the small talks that fit, drawn together by the
 * account, the day and her id (her stage's lines are `chatLineV4`'s). The app fills `{farmer}` and `{name}`. */
export function talkOf(
  save: Pick<SaveV4, 'account' | 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'cast' | 'master'>>, id: string, temperament: Temperament,
  at: TalkAt, options: { farmhand?: boolean; birthday?: boolean } = {},
): Talk {
  const love = save.love[id]
  const set = love ? chatSet(love) : null
  const own = set ? chatLinesOf(pack, id, set) : []
  const lines = own.length > 0 ? own : defaultTalksOf(pack, id, talkStageOf(love ?? { stage: 'friendship', level: 0 }, options.farmhand ?? false), temperament)
  const season = dateOf(save.calendar.day).season
  const small = smallTalkOf(pack, id).filter((t) => smallTalkFits(t, at, season, set))
  const drawn = pick<string | SmallTalk>(save, `chat:${id}`, [...lines, ...small])!
  const greeting = greetingOf(save, pack, id, at, options.birthday ?? false)
  const her = (line: string): Step => ({ say: id, line, emote: 'happy' })
  const body: Step[] = typeof drawn === 'string' ? [her(drawn)] : drawn.lines.map(([who, line]) => (who === YOU ? { say: YOU, line } : her(line)))
  return { greeting, steps: [...(greeting ? [her(greeting)] : []), ...body], small: typeof drawn === 'string' ? null : drawn }
}

/** Today's talk with her, as you'd have it now: where you meet her (`talkAt`), a farmhand's talks once she works the farm,
 * and her birthday's greeting on her birthday. */
export function todaysTalk(
  save: SaveV4, pack: Pick<StoryPack, 'bibles' | 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>, id: string, temperament: Temperament, birthdays: Birthdays = NO_BIRTHDAYS,
): Talk {
  return talkOf(save, pack, id, temperament, talkAt(save, pack, id), { farmhand: isFarmhand(save, id), birthday: isBirthday(birthdays, id, save.calendar.day) })
}
