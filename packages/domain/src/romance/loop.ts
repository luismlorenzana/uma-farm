// The Uma loop: from meeting her to married life, in the owner's stages, read from her ladders and one flag. Her points,
// events, plays, perks, the ring and the wedding are her route's as built; this names the stages, says what each opens,
// and adds the loop's own acts: the invitation to work, the household's meals and the night's companion.
//
//   acquaintance   met, Friendship 0–2                  talks and gifts, an action each
//   friend         Friendship 3 and up                  hangouts (2 actions), the invitation to work (1)
//   farmhand       a friend you've invited to work      on the farm on her farm days (the days her town schedule leaves
//                                                       free), in front of you there; she works the farm those nights
//   sweetheart     from her confession's yes            dates (2 actions) from Romance 1; Dinner in town at R3, A night in at R6
//   engaged        after the proposal                   the wedding
//   married        after the wedding                    the wedding night, moving in (only a spouse lives on the farm, in
//                                                       her room); meals; the night's companion
//
// **Meals** (married life): breakfast and dinner, one action each, once each a day. A meal feeds everyone on the farm and
// every farmhand (well fed through tomorrow, a meal running longer never shortened) and pleases each who eats (+10). It's
// the farmer cooking for the household, so it cooks a batch for the pantry too: six meals from two goods of food by the
// plain rule, when the Warehouse holds two (`farm/food.ts`). One spouse's line plays as you sit down.
//
// **The night's companion** (married life): at the day's end you choose one spouse with a room to spend the night with,
// tender and never shown; her house is tonight's house, so its morning is as built. Without a pick, the night takes the
// resident of tonight's house who's been your companion least lately. In the morning she greets you in a short scene in
// pajamas, her greeting the story's or the default's for her temperament. Pure; never stamps.
import { actionCost, actionsLeft, spend } from '../farm/actions'
import { awayForNight, awayOn } from '../expeditions/presence'
import { draw } from '../farm/draw'
import { addBatch, BATCH_MEALS, plainBatch } from '../farm/food'
import type { Temperament } from '../farm/talents'
import { SaveRuleError } from '../save/rules'
import { marriedCount, residentsOf, type Meal, type SaveV4 } from '../save/v4'
import type { Step } from '../story/authored'
import { TALK_STAGES, type TalkStage } from '../story/default-story'
import type { Expression } from '../story/look'
import type { StoryPack } from '../story/pack'
import { mealLinesOf, morningGreetingsOf, talkStageOf } from '../story/placeholders'
import { worksOn, type SchedulePack } from '../town/town'
import { isBirthday, type Birthdays } from './days'
import { defaultHouse } from './homestead'
import { addLove } from './love'

type HerPack = Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'cast' | 'master'>>

// --- The stages --------------------------------------------------------------------------------------------------

/** The Uma loop's stages, in order: her talks follow them too (the default story's, by stage). */
export const UMA_STAGES: readonly TalkStage[] = TALK_STAGES
export type UmaStage = TalkStage

/** Each stage's name, as her profile and her menu show it. */
export const STAGE_NAMES: Readonly<Record<UmaStage, string>> = {
  acquaintance: 'Acquaintance', friend: 'Friend', farmhand: 'Farmhand', sweetheart: 'Sweetheart', engaged: 'Engaged', married: 'Married',
}

/** Friendship 3 makes her a friend: hangouts and the invitation to work open. */
export const FRIEND_FROM = 3

/** Each stage: how you reach it and what it opens, as the manual lists them. */
export const STAGE_RULES: readonly { stage: UmaStage; range: string; opens: string }[] = [
  { stage: 'acquaintance', range: 'Met (you introduced yourself), Friendship 0–2', opens: 'Talks and gifts, an action each' },
  { stage: 'friend', range: `Friendship ${FRIEND_FROM} and up`, opens: 'Hangouts (2 actions); the invitation to work (1 action)' },
  { stage: 'farmhand', range: 'A friend you’ve invited to work', opens: 'She’s on the farm on her farm days (the days her town schedule leaves free), in front of you there, and works it those nights (the farmhands’ work); her farmhand talks' },
  { stage: 'sweetheart', range: 'From her confession’s yes (Romance 0)', opens: 'Dates (2 actions) from Romance 1; Dinner in town from Romance 3, A night in from Romance 6' },
  { stage: 'engaged', range: 'After the proposal', opens: 'The wedding' },
  { stage: 'married', range: 'After the wedding', opens: 'The wedding night and moving in: only a spouse lives on the farm, in her room; the household’s meals; the night’s companion' },
]

/** Whether she's a farmhand: you've invited her to work the farm. The flag stays at every stage after. */
export const isFarmhand = (save: Pick<SaveV4, 'roster'>, id: string): boolean => save.roster[id]?.farmhand !== undefined

/** Her stage in the Uma loop, or null before you've met her. A farmhand is a farmhand while she's a friend; from her
 * confession on, her ladder's stage shows (she keeps working the farm). */
export function umaStage(save: Pick<SaveV4, 'roster' | 'love'>, id: string): UmaStage | null {
  const love = save.love[id]
  if (!love || !save.roster[id]) return null
  return talkStageOf(love, isFarmhand(save, id))
}

/** Her stage in words with her ladder's level, as her menu says how she stands with you: "Acquaintance · F1",
 * "Friend · F3", "Farmhand · F5", "Sweetheart · R4", "Engaged", "Married · S2". Null before you've met her. */
export function stageWords(save: Pick<SaveV4, 'roster' | 'love'>, id: string): string | null {
  const stage = umaStage(save, id)
  const love = save.love[id]
  if (stage === null || !love) return null
  const level = love.stage === 'friendship' ? `F${love.level}` : love.stage === 'confession' ? 'F10' : love.stage === 'romance' ? `R${love.level}`
    : love.stage === 'proposal' ? 'R10' : love.stage === 'spouse' ? `S${love.level}` : null
  return level ? `${STAGE_NAMES[stage]} · ${level}` : STAGE_NAMES[stage]
}

// --- The invitation to work ----------------------------------------------------------------------------------------

/** Why you can't invite her to work now, or null: you've met her, she's a friend (Friendship 3 and up), she isn't working
 * the farm already, and an action is left. */
export function workBlock(save: Pick<SaveV4, 'roster' | 'love' | 'calendar' | 'today'>, id: string): string | null {
  const stage = umaStage(save, id)
  if (stage === null) return 'Meet her first.'
  if (isFarmhand(save, id)) return 'Works the farm ✓'
  if (stage === 'acquaintance') return `From Friendship ${FRIEND_FROM}`
  if (actionsLeft(save) < actionCost('invite')) return 'No actions left today.'
  return null
}

/** Invites her to work the farm: one action, once; she's a farmhand from today (`roster[id].farmhand`). Refused before
 * you've met her (`not-owned`), below Friendship 3 or once she works it (`locked`), and with no action left. */
export function inviteToWork(save: SaveV4, id: string): SaveV4 {
  const block = workBlock(save, id)
  if (block === 'Meet her first.') throw new SaveRuleError('not-owned', block)
  if (block !== null && block !== 'No actions left today.') throw new SaveRuleError('locked', block === 'Works the farm ✓' ? 'She works the farm already.' : `Invite her once she’s a friend: Friendship ${FRIEND_FROM}.`)
  const spent = spend(save, 'invite')
  return { ...spent, roster: { ...spent.roster, [id]: { ...spent.roster[id]!, farmhand: save.calendar.day } } }
}

/** The farmhands, by id. */
export const farmhands = (save: Pick<SaveV4, 'roster'>): string[] => Object.keys(save.roster).filter((id) => isFarmhand(save, id)).sort((a, b) => Number(a) - Number(b))

// --- The household's meals ---------------------------------------------------------------------------------------

/** A meal keeps everyone it feeds well fed for this many days: today and tomorrow. */
export const MEAL_DAYS = 2
/** What a meal pleases each who eats it with. */
export const MEAL_POINTS = 10
export const MEAL_NAMES: Readonly<Record<Meal, string>> = { breakfast: 'Breakfast', dinner: 'Dinner' }

/** Today's meals cooked so far. */
export const mealsCooked = (save: Pick<SaveV4, 'today'>): readonly Meal[] => save.today.meals ?? []

/** Who eats the household's meals: everyone who lives on the farm (the spouses in their rooms) and every farmhand, by
 * id. */
export function mealEaters(save: Pick<SaveV4, 'roster' | 'love'> & Partial<Pick<SaveV4, 'calendar' | 'expeditions'>>, pack?: SchedulePack | null): string[] {
  const calendar = save.calendar
  return Object.keys(save.roster).filter((id) => (!save.calendar || !awayOn(save, id, save.calendar.day))
    && (save.love[id]?.house !== undefined || (calendar && pack?.town?.professions?.length
      ? worksOn({ ...save, calendar }, pack, id) : isFarmhand(save, id))))
    .sort((a, b) => Number(a) - Number(b))
}

/** Why a meal can't be cooked now, or null: meals start with your first wedding, each once a day, an action each. */
export function mealBlock(save: Pick<SaveV4, 'love' | 'today' | 'calendar'>, meal: Meal): string | null {
  if (marriedCount(save) === 0) return 'Meals start with your first wedding.'
  if (mealsCooked(save).includes(meal)) return `${MEAL_NAMES[meal]} is made ✓`
  if (actionsLeft(save) < actionCost('cook')) return 'No actions left today.'
  return null
}

/** A meal cooked: one action; everyone who eats it (`mealEaters`) well fed through tomorrow (a meal running longer is
 * never shortened) and +10 each through `addLove` (an anniversary's ×2 applies); a batch for the pantry, six meals from
 * two goods of food by the plain rule when the Warehouse holds two (`batch`, the meals added, else 0); the meal marked
 * for today. Who ate and the points paid in all. Refused before the first wedding (`locked`), once that meal is made
 * (`busy`), and with no action left (`no-actions`). Never stamps. */
export function cookMeal(save: SaveV4, meal: Meal, pack?: SchedulePack | null): { save: SaveV4; fed: string[]; paid: number; batch: number } {
  const block = mealBlock(save, meal)
  if (block !== null && block !== 'No actions left today.') throw new SaveRuleError(marriedCount(save) === 0 ? 'locked' : 'busy', block)
  let next = spend(save, 'cook')
  const goods = plainBatch(next)
  if (goods) next = addBatch(next, goods, BATCH_MEALS)
  const fed = mealEaters(next, pack)
  next = { ...next, roster: { ...next.roster, ...Object.fromEntries(fed.map((id) => [id, { ...next.roster[id]!, wellFed: Math.max(next.roster[id]!.wellFed, MEAL_DAYS) }])) } }
  let paid = 0
  for (const id of fed) {
    const pay = addLove(next, id, MEAL_POINTS, 'meal')
    next = pay.save
    paid += pay.paid
  }
  return { save: { ...next, today: { ...next.today, meals: [...mealsCooked(next), meal] } }, fed, paid, batch: goods ? BATCH_MEALS : 0 }
}

/** The spouses in wedding order (her wedding's day, then her id): who sits at the household's table. */
export function spousesByWedding(save: Pick<SaveV4, 'love' | 'roster'>): string[] {
  return Object.keys(save.love).filter((id) => save.roster[id] && save.love[id]!.stage === 'spouse')
    .sort((a, b) => (save.love[a]!.wed ?? 0) - (save.love[b]!.wed ?? 0) || Number(a) - Number(b))
}

/** Whose line plays at a meal: one spouse, drawn by `draw(uid, day, 'meal:<meal>', 0)`; null before the first wedding. */
export function mealSpeaker(save: Pick<SaveV4, 'love' | 'roster' | 'account' | 'calendar'> & Partial<Pick<SaveV4, 'expeditions'>>, meal: Meal): string | null {
  const spouses = spousesByWedding(save).filter((id) => !awayOn(save, id, save.calendar.day))
  if (spouses.length === 0) return null
  return spouses[Math.min(spouses.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, `meal:${meal}`, 0) * spouses.length))]!
}

/** A meal's short scene: the meal named, then her line (the default story's, drawn by `draw(…, 1)`), `{name}` hers. */
export function mealScene(save: Pick<SaveV4, 'account' | 'calendar'>, pack: HerPack, id: string, meal: Meal, name: string): Step[] {
  const lines = mealLinesOf(pack, id, meal)
  const line = lines[Math.min(lines.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, `meal:${meal}`, 1) * lines.length))]!
  return [{ narrate: meal === 'breakfast' ? 'Breakfast for the household, everyone at the table.' : 'Dinner for the household, the lamps lit.' }, ...lineSteps(line.replaceAll('{name}', name), id, 'happy')]
}

// --- The night's companion ---------------------------------------------------------------------------------------

type CompanionSave = Pick<SaveV4, 'love' | 'roster'> & Partial<Pick<SaveV4, 'expeditions' | 'calendar'>>
const homeForNight = (save: CompanionSave, id: string): boolean =>
  !save.calendar || !awayForNight(save, id, save.calendar.day)

/** Who can be the night's companion: the spouses with a room, in wedding order. */
export const companions = (save: CompanionSave): string[] => spousesByWedding(save).filter((id) => save.love[id]!.house !== undefined && homeForNight(save, id))

/** Among `ids`, the one who's been your companion least lately (never first), ties in wedding order; null with none. */
function leastLately(save: Pick<SaveV4, 'love' | 'roster'>, ids: readonly string[]): string | null {
  const order = spousesByWedding(save)
  return [...ids].sort((a, b) => (save.love[a]!.night ?? 0) - (save.love[b]!.night ?? 0) || order.indexOf(a) - order.indexOf(b))[0] ?? null
}

/** Tonight's companion as the night will take her: your pick, else the resident of tonight's house (your Sleep at, or the
 * house slept in least lately) who's been your companion least lately; null before the first wedding or with no one in
 * that house. */
export function companionTonight(save: CompanionSave & Pick<SaveV4, 'homestead'>): string | null {
  const h = save.homestead
  if (h.companion !== undefined && save.love[h.companion]?.house === h.tonight && homeForNight(save, h.companion)) return h.companion
  if (marriedCount(save) === 0) return null
  const house = h.tonight ?? defaultHouse(save)
  return leastLately(save, residentsOf(save, house).filter((id) => save.roster[id] && save.love[id]!.stage === 'spouse' && homeForNight(save, id)))
}

/** Chooses tonight's companion: a spouse with a room. Her house is tonight's house; `alone` (a birthday-alone wisher on
 * her birthday) makes it her room, her morning hers alone. Free, a player's change. Refused for anyone but a spouse with a
 * room (`locked`) and for her room on any other night (`bad-job`). */
export function chooseCompanion(save: SaveV4, id: string, alone = false, birthdays: Birthdays | null = null): SaveV4 {
  const love = save.love[id]
  if (!save.roster[id] || love?.stage !== 'spouse' || love.house === undefined) throw new SaveRuleError('locked', 'Only a spouse with a room.')
  if (!homeForNight(save, id)) throw new SaveRuleError('busy', 'She’s in an expedition party.')
  if (alone && birthdays !== null && !isBirthday(birthdays, id, save.calendar.day)) throw new SaveRuleError('bad-job', 'Her room is hers on her birthday.')
  const h = save.homestead
  if (h.companion === id && h.tonight === love.house && h.alone === (alone ? id : null)) return save
  return { ...save, homestead: { ...h, tonight: love.house, alone: alone ? id : null, companion: id } }
}

/** Her face as she greets you, by her temperament. */
const GREETING_FACE: Readonly<Record<Temperament, Expression>> = { breezy: 'happy', steady: 'tender', bold: 'teasing', gritty: 'tender', clever: 'smug' }

/** The morning's greeting from the night's companion: her temperament's (the default story's, with her words in), drawn by
 * `draw(uid, day, 'morning:<id>', 0)` on the morning's day, `{name}` hers; a short scene in pajamas. */
export function greetingScene(save: Pick<SaveV4, 'account' | 'calendar'>, pack: HerPack, id: string, temperament: Temperament, name: string): Step[] {
  const lines = morningGreetingsOf(pack, id, temperament)
  const line = lines[Math.min(lines.length - 1, Math.floor(draw(save.account.uid, save.calendar.day, `morning:${id}`, 0) * lines.length))]!
  const steps = lineSteps(line.replaceAll('{name}', name), id, GREETING_FACE[temperament])
  return 'narrate' in steps[0]! ? steps : [{ narrate: 'Morning light comes soft through the curtains.' }, ...steps]
}

/** A default line as steps: narration before its first quote, then what she says inside the quotes, with her face. A line
 * with no quote is all hers. */
export function lineSteps(line: string, id: string, emote: Expression): Step[] {
  const open = line.indexOf('“')
  const close = line.lastIndexOf('”')
  if (open < 0 || close < open) return [{ say: id, line, emote }]
  const before = line.slice(0, open).trim()
  const said = line.slice(open + 1, close).trim()
  return [...(before ? [{ narrate: before } as Step] : []), { say: id, line: said, emote }]
}
