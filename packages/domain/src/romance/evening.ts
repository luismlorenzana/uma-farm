// The evening: the day's one scarce choice. One evening a day across all the Umas, a **hangout** with a friend (an Uma at
// Friendship 3 or more), a **date** with a sweetheart from Romance 1, or any kind with a spouse, played as one of the date
// games at its evening length (the heart events' plays), graded and never failed, then her scene for it (`eveningScene`:
// the story's, else the default's). It takes **2 of the day's actions**. Two evenings of their own join the date games:
// **Dinner in town** (a date from Romance 3) and **A night in** (a date from Romance 6, at home once married). **She's in
// front of you** (`eveningHere`): home on the farm (a spouse in her room), a farmhand there on her farm day, or out in town today with you there, where
// her menu asks her out.
//
//   Fine 60 · Great 100 · Perfect 150, × 1.5 in her favourite kind, × 1.5 on her birthday, × 1.5 on her anniversary
//   (each once, multiplied, rounded half up; on her anniversary the evening takes ×1.5 in place of the day's ×2)
//
// **The slots:** one evening a day; a second on days divisible by 4 from 10 married; and on a festival day (the year's,
// the story's when it moves or adds festivals: `festivalsOf`), **festival night**, its own slot that only its kind fills. **Invitations:** each morning (night step 9) at most one
// Uma invites you, two from 10 married, drawn by `draw(uid, day, 'invite', n)` among the Umas at Friendship 3+ who are
// home and whose favourite kind is open to them today, weighted `1 + min(14, days since her last evening)`. **Yes**
// makes her Tonight's evening and pays **+20** with it; **Another day** costs nothing. **Tonight** opens while a slot
// is free and someone can spend it. Pure; the app stamps.
import { recordLibrary } from '../library/receipts'
import { actionCost, actionsLeft, spend } from '../farm/actions'
import { festivalOn, FESTIVALS, type Festival } from '../farm/calendar'
import { draw } from '../farm/draw'
import { SaveRuleError } from '../save/rules'
import {
  EVENING_KINDS, eveningsOn, FESTIVAL_NIGHT, invitesFor, marriedCount, type Evening, type EveningKind, type Invite, type InviteKind, type Love, type SaveV4,
} from '../save/v4'
import type { DateGame } from '../story/authored'
import { castOrder, type StoryPack } from '../story/pack'
import type { Moment } from '../story/look'
import { eveningSceneId, festivalsOf, routeBeats } from '../story/placeholders'
import { awayOn } from '../expeditions/presence'
import { configuredDuos, duoReady, householdVows, nightAvailable } from './long-game'
import type { Duo } from '../save/long-game'
import { whereYouMeet } from '../town/town'
import { addLove, bar, dayFactor, isAnniversary, roundPoints, type Bar } from './love'
import { EVENING_GRADE_POINTS, GRADES, gradeOf, type Grade } from './plays/grade'
import { PLAY_MAP, type PlayAs } from './plays/which'

// --- The kinds ------------------------------------------------------------------------------------

/** What an evening kind waits for: the Kitchen, or the footrace. */
export type EveningWait = 'kitchen' | 'footrace'

/** One evening kind: its words, the rung that opens it as a hangout (a friendship level) and as a date (a romance
 * level), its play, and the game it waits for. */
export interface EveningKindDef {
  kind: EveningKind
  /** "Walk at dusk": the kinds sheet's row and the card's title. */
  name: string
  /** "Walk": Tonight's row and the Hearts header ("with Stand-in 2 · Walk ✓"). */
  short: string
  /** The friendship level that opens it as a hangout; null when it's a date only. */
  hangout: number | null
  /** The romance level that opens it as a date. */
  date: number
  /** Its play at its evening length (`PLAY_MAP`); festival night walks. */
  play: PlayAs
  /** The game it waits for (cooking the Kitchen's practice mode, the footrace its track): until that's built it isn't
   * offered. Null: it plays now. */
  waits: EveningWait | null
  /** Her invitation, one original template a kind; festival night is never asked for. */
  question: string | null
}

/** The two evenings of their own, which aren't date games, each play as a Pick: Dinner in town (the menu), A night in
 * (the night's tea and blankets). */
const playFor = (k: EveningKind): PlayAs => (k === FESTIVAL_NIGHT ? PLAY_MAP.walk : k === 'dinner' || k === 'night-in' ? PLAY_MAP.picnic : PLAY_MAP[k])
const kind = (k: EveningKind, name: string, short: string, hangout: number | null, date: number, question: string | null, waits: EveningKindDef['waits'] = null): EveningKindDef => ({
  kind: k, name, short, hangout, date, play: playFor(k), waits, question,
})

/** Friendship 3 opens hangouts (a friend, her F3 perk); Romance 1 dates (a sweetheart's, R1). */
export const HANGOUT_FROM = 3
export const DATE_FROM = 1
/** Dinner in town opens at Romance 3, A night in at Romance 6. */
export const DINNER_FROM = 3
export const NIGHT_IN_FROM = 6

/** The evening kinds, in their order, festival night last. */
export const EVENINGS: Readonly<Record<EveningKind, EveningKindDef>> = {
  walk: kind('walk', 'Walk at dusk', 'Walk', HANGOUT_FROM, DATE_FROM, 'Walk at dusk tonight?'),
  fishing: kind('fishing', 'Fishing at the Pond', 'Fishing', HANGOUT_FROM, DATE_FROM, 'Fishing tonight?'),
  picnic: kind('picnic', 'A picnic', 'Picnic', HANGOUT_FROM, DATE_FROM, 'A picnic tonight?'),
  market: kind('market', 'The market in town', 'Market', HANGOUT_FROM, DATE_FROM, 'The market in town tonight?'),
  cooking: kind('cooking', 'Cooking together', 'Cooking', HANGOUT_FROM, DATE_FROM, 'Cook with me tonight?', 'kitchen'),
  crafting: kind('crafting', 'Crafting', 'Crafting', null, DATE_FROM, 'Make something with me tonight?'),
  stargazing: kind('stargazing', 'Stargazing at the overlook', 'Stargazing', null, 3, 'Stargazing tonight?'),
  dinner: kind('dinner', 'Dinner in town', 'Dinner', null, DINNER_FROM, 'Dinner in town tonight?'),
  dance: kind('dance', 'Dancing', 'Dancing', null, 6, 'Dance with me tonight?'),
  boat: kind('boat', 'A boat on the lake', 'Boat', null, 6, 'A boat on the lake tonight?'),
  'night-in': kind('night-in', 'A night in', 'Night in', null, NIGHT_IN_FROM, 'A night in tonight?'),
  footrace: kind('footrace', 'A footrace', 'Footrace', null, 9, 'Race me tonight?', 'footrace'),
  festival: kind('festival', 'Festival night', 'Walk', HANGOUT_FROM, DATE_FROM, null),
}

/** Whether a kind's game is built: cooking waits for the Kitchen, the footrace for its track. */
export const kindBuilt = (k: EveningKind): boolean => EVENINGS[k].waits === null
/** Festival night is its own slot. */
export const isFestivalNight = (k: EveningKind): k is typeof FESTIVAL_NIGHT => k === FESTIVAL_NIGHT
/** The date games an evening plays as, in the kinds' order: every kind but festival night and the two evenings of their
 * own (Dinner in town, A night in). */
export const EVENING_GAMES: readonly InviteKind[] = EVENING_KINDS.filter((k): k is InviteKind => k !== FESTIVAL_NIGHT && k !== 'dinner' && k !== 'night-in')

/** An evening's cost: 2 of the day's actions (the cost table's hangout or date). Never a special day's event actions. */
export const eveningCost = (): number => actionCost('hangout')
/** Whether the day has the 2 actions an evening takes. */
export const eveningAffordable = (save: Pick<SaveV4, 'calendar' | 'today'>): boolean => actionsLeft(save) >= eveningCost()

/** Her scene for an evening (the story's event of that id, else the default story's): Dinner in town's and A night in's
 * own, else `hangout-<kind>` for a friend and `date-<kind>` for a sweetheart or a spouse. */
export function eveningScene(role: EveningRole, k: EveningKind): string {
  if (k === 'dinner') return 'dinner-in-town'
  if (k === 'night-in') return 'a-night-in'
  return eveningSceneId(k, role)
}
/** The moment an evening's scene is in, for her outfit when the scene names none: a picnic, a dinner, a night in, a
 * festival night; else the day's season. */
export function eveningMoments(k: EveningKind): Moment[] {
  switch (k) {
    case 'picnic': return ['picnic']
    case 'dinner': return ['dinner']
    case 'night-in': return ['night-in']
    case 'festival': return ['festival-night']
    default: return []
  }
}

// --- Who ------------------------------------------------------------------------------------------

/** What an evening with her is: a hangout (Friendship 3 to her confession's wait, and Romance 0), a date (Romance 1 to the
 * wedding's wait) or a spouse's (every kind her ladders opened). */
export type EveningRole = 'hangout' | 'date' | 'spouse'
export const ROLE_WORDS: Readonly<Record<EveningRole, string>> = { hangout: 'A hangout', date: 'A date', spouse: 'An evening at home' }

/** Her levels as the evening reads them: friendship 10 once it's done, romance 10 from the proposal on. */
function ladders(love: Pick<Love, 'stage' | 'level'>): { friendship: number; romance: number } {
  switch (love.stage) {
    case 'friendship': return { friendship: love.level, romance: 0 }
    case 'confession': return { friendship: 10, romance: 0 }
    case 'romance': return { friendship: 10, romance: love.level }
    default: return { friendship: 10, romance: 10 }
  }
}

/** Her role tonight, or null below Friendship 3. */
export function eveningRole(love: Pick<Love, 'stage' | 'level'>): EveningRole | null {
  if (love.stage === 'spouse') return 'spouse'
  const { friendship, romance } = ladders(love)
  if (romance >= DATE_FROM) return 'date'
  return friendship >= HANGOUT_FROM ? 'hangout' : null
}

/** Whether a kind is open to her by her ladders, built or not: a hangout's kinds from their friendship
 * level, a date's from their romance level, a spouse's every one; festival night with any role. */
export function kindOpens(love: Pick<Love, 'stage' | 'level'>, k: EveningKind): boolean {
  const role = eveningRole(love)
  if (role === null) return false
  const def = EVENINGS[k]
  if (role === 'spouse' || isFestivalNight(k)) return true
  const { friendship, romance } = ladders(love)
  return role === 'date' ? def.date <= romance : def.hangout !== null && def.hangout <= friendship
}

/** Whether she's home tonight: a spouse in her room, the one who lives on the farm. */
export function homeTonight(save: Pick<SaveV4, 'love'> & Partial<Pick<SaveV4, 'calendar' | 'expeditions'>>, id: string): boolean {
  if (save.calendar && awayOn(save, id, save.calendar.day)) return false
  const love = save.love[id]
  return love?.stage === 'spouse' && love.house !== undefined
}

/** The pack an evening reads: the cast (her place, her schedule in town), the town, master data and the year's
 * festivals. */
export type EveningPack = Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'world' | 'town' | 'master'>>

/** Whether she's in front of you for an evening: home tonight (a spouse in her room), a farmhand on the farm on her farm
 * day, or out in town today with you there (`whereYouMeet`). */
export const eveningHere = (save: Pick<SaveV4, 'calendar' | 'roster' | 'love' | 'today'>, pack: EveningPack, id: string): boolean =>
  homeTonight(save, id) || whereYouMeet(save, pack, id).here

// --- Her favourite kind ---------------------------------------------------------------------------

/** Her favourite kind: the date game her bible's beats use most (`together.kind === 'date'`); walk on a tie
 * at the top, or with none (no bible, or no date beats). A kind not offered yet (cooking, the footrace) still counts. */
export function favouriteKind(pack: Pick<StoryPack, 'bibles'>, id: string): DateGame {
  const counts = new Map<DateGame, number>()
  for (const beat of routeBeats(pack, id)) if (beat.together?.kind === 'date') counts.set(beat.together.game, (counts.get(beat.together.game) ?? 0) + 1)
  const top = Math.max(0, ...counts.values())
  const leaders = [...counts].filter(([, n]) => n === top).map(([game]) => game)
  return top > 0 && leaders.length === 1 ? leaders[0]! : 'walk'
}

// --- The slots ------------------------------------------------------------------------------------------

/** Today's slots: one evening (two on days divisible by 4 from 10 married) and, on a festival day, festival night; the
 * Festival of Vows brings a festival night too. */
export interface EveningSlots {
  evenings: number
  /** Today's festival, whose night is its own slot; null on other days. */
  festival: Festival | null
  /** The Festival of Vows today: festival night's slot. */
  vows: boolean
}
export const eveningSlots = (save: Pick<SaveV4, 'calendar' | 'love'> & Partial<Pick<SaveV4, 'homestead' | 'longGame'>>, year: readonly Festival[] = FESTIVALS): EveningSlots => ({
  evenings: eveningsOn(save.calendar.day, marriedCount(save)), festival: festivalOn(save.calendar.day, year, save.calendar),
  vows: householdVows(save),
})

/** What's left of today's slots: evenings unspent, and whether festival night is free. */
export interface SlotsLeft {
  evenings: number
  festival: boolean
}
export function slotsLeft(save: Pick<SaveV4, 'calendar' | 'love' | 'today'> & Partial<Pick<SaveV4, 'homestead'>>, year: readonly Festival[] = FESTIVALS): SlotsLeft {
  const slots = eveningSlots(save, year)
  const spent = save.today.evenings.filter((e) => !isFestivalNight(e.kind)).length
  return { evenings: Math.max(0, slots.evenings - spent), festival: (slots.festival !== null || slots.vows) && !save.today.evenings.some((e) => isFestivalNight(e.kind)) }
}

/** The Hearts header's marks: a mark a slot today, ○ free and ● spent, the evenings first, then festival
 * night's. Each spent one names who it was with and the kind. */
export interface EveningMark {
  slot: 'evening' | 'festival'
  spent: Evening | null
}
export function eveningMarks(save: Pick<SaveV4, 'calendar' | 'love' | 'today'> & Partial<Pick<SaveV4, 'homestead'>>, year: readonly Festival[] = FESTIVALS): EveningMark[] {
  const slots = eveningSlots(save, year)
  const spent = save.today.evenings.filter((e) => !isFestivalNight(e.kind))
  const night = save.today.evenings.find((e) => isFestivalNight(e.kind)) ?? null
  return [
    ...Array.from({ length: slots.evenings }, (_, i): EveningMark => ({ slot: 'evening', spent: spent[i] ?? null })),
    ...(slots.festival || slots.vows ? [{ slot: 'festival' as const, spent: night }] : []),
  ]
}

/** The kinds she can play now, in their order, each open to her by her ladders, its game built and its slot free
 * (festival night only on a festival day; the year's festivals are the pack's). Empty when you haven't met her, she isn't
 * in front of you (`eveningHere`) or she's below Friendship 3. Whether the day has the 2 actions is
 * `eveningAffordable`'s. */
export function kindsNow(save: SaveV4, pack: EveningPack, id: string): EveningKind[] {
  const love = save.love[id]
  if (!love || !save.roster[id] || eveningRole(love) === null || !eveningHere(save, pack, id)) return []
  const left = slotsLeft(save, festivalsOf(pack))
  return EVENING_KINDS.filter((k) => (isFestivalNight(k) ? left.festival : left.evenings > 0 && kindBuilt(k) && kindOpens(love, k)))
}

/** Who can spend an evening now (Tonight's picker): the Umas in front of you with a kind to play, in the cast's order;
 * none when the day hasn't the 2 actions an evening takes. */
export function eveningUmas(save: SaveV4, pack: EveningPack): string[] {
  if (!eveningAffordable(save)) return []
  return byCast(pack, Object.keys(save.roster)).filter((id) => kindsNow(save, pack, id).length > 0)
}

/** Whether Tonight opens: a slot is free and someone can spend it (the day has its 2 actions), or anyone is married, so
 * tonight's companion waits to be picked. */
export const tonightOpens = (save: SaveV4, pack: EveningPack): boolean => marriedCount(save) > 0 || eveningUmas(save, pack).length > 0

export function eveningDuos(save: SaveV4, pack: StoryPack, lead: string, birthdayAlone: (id: string) => boolean): string[] {
  return configuredDuos(save, pack).flatMap(duo => {
    if (!duo.includes(lead) || !duoReady(save, duo) || !duo.every(id => nightAvailable(save, pack, id) && !birthdayAlone(id))) return []
    return duo.filter(id => id !== lead)
  })
}

/** Roster ids in the cast's order, then numerically (the stand-in's and any id the pack doesn't hold). */
function byCast(pack: Pick<StoryPack, 'cast'>, ids: readonly string[]): string[] {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return [...ids].sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b))
}

// --- The points -----------------------------------------------------------------------

/** Each factor ×1.5, once: her favourite kind, her birthday, her anniversary. */
export const EVENING_FACTOR = 1.5
/** An invitation said yes pays this with the evening. */
export const INVITE_POINTS = 20

/** What multiplies an evening with her today. */
export interface EveningFactors {
  kind: boolean
  birthday: boolean
  anniversary: boolean
}
export function eveningFactors(save: Pick<SaveV4, 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, k: EveningKind, birthday: boolean): EveningFactors {
  const love = save.love[id]
  return {
    kind: !isFestivalNight(k) && favouriteKind(pack, id) === k,
    birthday,
    anniversary: love !== undefined && isAnniversary(love, save.calendar.day),
  }
}
const factorOf = (f: EveningFactors): number => (f.kind ? EVENING_FACTOR : 1) * (f.birthday ? EVENING_FACTOR : 1) * (f.anniversary ? EVENING_FACTOR : 1)

/** An evening's points for a grade with these factors, whole: 60, 100 or 150 × each 1.5, rounded once. */
export const eveningPoints = (grade: Grade, factors: EveningFactors): number => roundPoints(EVENING_GRADE_POINTS[grade] * factorOf(factors))

/** Each grade's points with her today, the kinds sheet's "Perfect +225" before the tap. */
export function eveningPreview(save: Pick<SaveV4, 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, k: EveningKind, birthday: boolean): Readonly<Record<Grade, number>> {
  const factors = eveningFactors(save, pack, id, k, birthday)
  return Object.fromEntries(GRADES.map((g) => [g, eveningPoints(g, factors)])) as Record<Grade, number>
}

/** Her invitation said yes, still to be paid: the +20 comes with her first evening today. */
export const inviteDue = (save: Pick<SaveV4, 'today'>, id: string): boolean =>
  save.today.invites.some((i) => i.id === id && i.answer === 'yes') && !save.today.evenings.some((e) => e.with === id)
/** The +20 as `addLove` pays it: an invitation is its own act, so her anniversary's ×2 applies. */
export const invitePoints = (save: Pick<SaveV4, 'calendar' | 'love'>, id: string): number => {
  const love = save.love[id]
  return love ? roundPoints(INVITE_POINTS * dayFactor(love, save.calendar.day, 'invite')) : INVITE_POINTS
}

// --- Spending one ---------------------------------------------------------------------------------------

/** The evening's card: the grade, the sum, the invitation's +20 and her bar after. */
export interface EveningCard {
  partner?: string
  with: string
  kind: EveningKind
  score: number
  grade: Grade
  /** The grade's base: 60, 100 or 150. */
  base: number
  factors: EveningFactors
  /** Into her bar for the play, after the factors. */
  points: number
  /** The invitation's +20 (×2 on her anniversary), or 0. */
  invite: number
  /** Her bar after it. */
  bar: Bar
}

/** The seed of an evening's play: `draw(uid, day, 'evening:<id>:<kind>', n)`, so the same day plays the same. */
export const eveningSeed = (uid: string, day: number, id: string, k: EveningKind) => (n: number): number => draw(uid, day, `evening:${id}:${k}`, n)

/**
 * An evening with her, played: its 2 actions spent, its `score` (0–100) graded and paid through `addLove` with her
 * factors, the invitation's +20 when she asked and you said yes (her first evening today), `love.evening` today and the
 * slot spent. Refused when she can't spend it now (not met, not in front of you, below Friendship 3, the kind not open or
 * its slot spent) and when the day hasn't the 2 actions (`no-actions`). `birthday` is hers today (master data's, read by
 * the app). Never stamps.
 */
export function spendEvening(save: SaveV4, pack: EveningPack & Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'scripted'>>, id: string, k: EveningKind, score: number, birthday = false): { save: SaveV4; card: EveningCard } {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'You haven’t met her yet.')
  if (!eveningHere(save, pack, id)) throw new SaveRuleError('locked', 'She isn’t here today.')
  if (eveningRole(love) === null) throw new SaveRuleError('locked', `Evenings open at Friendship ${HANGOUT_FROM}.`)
  if (!(EVENING_KINDS as readonly string[]).includes(k)) throw new SaveRuleError('bad-count', 'Not an evening.')
  const year = festivalsOf(pack)
  if (!kindsNow(save, pack, id).includes(k)) {
    const left = slotsLeft(save, year)
    if (isFestivalNight(k) ? !left.festival : left.evenings === 0) throw new SaveRuleError('locked', isFestivalNight(k) ? 'Festival night is spent.' : 'Tonight’s evening is spent.')
    throw new SaveRuleError('locked', 'Not open to her yet.')
  }
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new SaveRuleError('bad-count', 'A play scores 0–100.')
  const grade = gradeOf(score)
  const factors = eveningFactors(save, pack, id, k, birthday)
  const due = inviteDue(save, id)
  const paidFor = spend(save, 'hangout')
  const played = addLove(paidFor, id, EVENING_GRADE_POINTS[grade] * factorOf(factors), 'evening')
  const asked = due ? addLove(played.save, id, INVITE_POINTS, 'invite') : { save: played.save, paid: 0 }
  const after = asked.save
  const her = { ...after.love[id]!, evening: save.calendar.day }
  const role = eveningRole(love)!
  const next: SaveV4 = { ...after, love: { ...after.love, [id]: her }, today: { ...after.today, evenings: [...after.today.evenings, { with: id, kind: k }] } }
  const authored = pack.scripted?.get(id)?.has(eveningScene(role, k)) ? ':authored' : ''
  const noted = recordLibrary(next, id, `evening:${k}:${role}${authored}`, { activity: `evening:${k}`, score })
  return {
    save: role === 'hangout' ? noted : recordLibrary(noted, id, 'milestone:first-date'),
    card: { with: id, kind: k, score, grade, base: EVENING_GRADE_POINTS[grade], factors, points: played.paid, invite: asked.paid, bar: bar(her) },
  }
}

/** A shared activity uses the same play, slot and heart award for its lead. The partner shares its scene and receipt. */
export function spendDuoEvening(save: SaveV4, pack: StoryPack, who: Duo, kind: EveningKind, score: number, birthday: boolean,
  birthdayAlone: (id: string) => boolean): { save: SaveV4; card: EveningCard } {
  const [lead, partner] = who
  if (!save.longGame || !eveningDuos(save, pack, lead, birthdayAlone).includes(partner) || !kindsNow(save, pack, partner).includes(kind)) {
    throw new SaveRuleError('not-ready', 'This duo can’t share that evening.')
  }
  const done = spendEvening(save, pack, lead, kind, score, birthday)
  const day = save.calendar.day
  const outings = save.longGame.outings ?? []
  const first = !outings.some(prior => prior.kind === kind && prior.who[0] === lead && prior.who[1] === partner)
  return { card: { ...done.card, partner }, save: {
    ...done.save,
    love: { ...done.save.love, [partner]: { ...done.save.love[partner]!, evening: day } },
    longGame: { ...save.longGame, outings: first ? [...outings, { day, who, kind }] : outings },
  } }
}

// --- Invitations ----------------------------------------------------------------------------------

/** The weight's cap: days since her last evening (or since she arrived) count up to 14. */
export const INVITE_WEIGHT_DAYS = 14
/** Her draw's weight: 1 + min(14, days since her last evening, or since she arrived): the least seen first. */
export function inviteWeight(save: Pick<SaveV4, 'calendar' | 'love' | 'roster'>, id: string): number {
  const since = save.love[id]?.evening || save.roster[id]?.joined || save.calendar.day
  return 1 + Math.min(INVITE_WEIGHT_DAYS, Math.max(0, save.calendar.day - since))
}

/** Who may invite you this morning: home (a spouse in her room), at Friendship 3 or more, her favourite kind open to her and built.
 * In the cast's order. */
export function inviteCandidates(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>): string[] {
  return byCast(pack, Object.keys(save.roster)).filter((id) => {
    const love = save.love[id]
    const fav = favouriteKind(pack, id)
    return love !== undefined && homeTonight(save, id) && eveningRole(love) !== null && kindBuilt(fav) && kindOpens(love, fav)
  })
}

/** This morning's invitations: one (two from 10 married), never the same Uma twice, each drawn by weight with
 * `draw(uid, day, 'invite', n)`, asking for her favourite kind, unanswered. Replaces `today.invites`. Pure and seeded: the
 * same save draws the same. */
export function drawInvites(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>): SaveV4 {
  const pool = inviteCandidates(save, pack)
  const invites: Invite[] = []
  for (let n = 0; n < invitesFor(marriedCount(save)) && pool.length > 0; n++) {
    const weights = pool.map((id) => inviteWeight(save, id))
    let at = draw(save.account.uid, save.calendar.day, 'invite', n) * weights.reduce((a, b) => a + b, 0)
    const found = weights.findIndex((w) => (at -= w) < 0)
    const id = pool.splice(found === -1 ? pool.length - 1 : found, 1)[0]!
    invites.push({ id, kind: favouriteKind(pack, id) as InviteKind, answer: null })
  }
  return { ...save, today: { ...save.today, invites } }
}

/** Her invitation answered: **Yes, tonight** (`'yes'`) makes her Tonight's evening, refused once the evening
 * is spent; **Another day** (`'no'`) costs nothing. Once each. Never stamps. */
export function answerInvite(save: SaveV4, id: string, answer: 'yes' | 'no'): SaveV4 {
  const invite = save.today.invites.find((i) => i.id === id)
  if (!invite) throw new SaveRuleError('not-owned', 'She didn’t ask today.')
  if (invite.answer !== null) throw new SaveRuleError('locked', 'Already answered.')
  if (answer === 'yes' && slotsLeft(save).evenings === 0) throw new SaveRuleError('locked', 'Tonight’s evening is spent.')
  return { ...save, today: { ...save.today, invites: save.today.invites.map((i) => (i.id === id ? { ...i, answer } : i)) } }
}

/** Whether her row shows ✉: her invitation stands unanswered, or said yes and not yet spent. */
export const invitedNow = (save: Pick<SaveV4, 'today'>, id: string): boolean =>
  save.today.invites.some((i) => i.id === id && (i.answer === null || (i.answer === 'yes' && !save.today.evenings.some((e) => e.with === id))))
