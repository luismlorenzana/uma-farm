// The acts that fill her bar: a chat, a gift by her own tastes, praise,
// her line at night and a festival together. Each pays through `addLove`, so the day's factors apply once (a gift ×3 on
// her birthday, every act ×2 on her anniversary) and each says what it paid, for the "+N" that floats from her face.
//
//   Chat      +15                                   one action, once a day each, on the farm or in town
//   Gift      loved 60 · liked 30 · neutral 10 · disliked 0, × (1 + 0.1 a star above ★1)   one action, one a day each
//   Praise    +20                                   once a day, when she's earned it (`praise.ts`)
//   Her line  +10                                   night step 6, a day at one of her line's places
//   Festival  +50                                   once a festival a year, on its team or entry (the Cooking Contest's cook)
//
// Loaded with the romance's screens and the night.
import { recordLibrary } from '../library/receipts'
import { actionCost, GAME_DAYS, spend, spendForEvent } from '../farm/actions'
import { dateOf } from '../farm/calendar'
import { draw } from '../farm/draw'
import type { Taste } from './chats'
import type { FestivalId } from '../farm/calendar'
import type { Temperament } from '../farm/talents'
import { goodOf, isSeedId } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import { isDishId, type Love, type SaveV4 } from '../save/v4'
import { availableDishes } from '../expeditions/stock'
import { stockKey, takeGoods } from '../save/warehouse'
import { type StoryPack } from '../story/pack'
import { chatLinesOf, defaultTalksOf, giftReactionsOf, giftsOf, linePlaces, talkStageOf, tasteOf } from '../story/placeholders'
import { NO_BIRTHDAYS, isBirthday, type Birthdays } from './days'
import { addLove, dayFactor, nextRung, roundPoints, type LovePaid } from './love'

/** The fixed pays. */
export const LOVE_POINTS = { chat: 15, praise: 20, line: 10, festival: 50 } as const
/** A gift by her taste: disliked pays 0 and never takes points away. */
export const GIFT_POINTS_V4: Readonly<Record<Taste, number>> = { loved: 60, liked: 30, neutral: 10, disliked: 0 }
/** A gift's stars: × (1 + 0.1 a star above ★1). */
export const giftStars = (stars: number): number => 1 + 0.1 * (stars - 1)

/** Her route, or the refusal for someone not on the farm. */
function loveOf(save: SaveV4, id: string): Love {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  return love
}

// --- Chats ------------------------------------------------------------------------------------------

/** The save with today marked in her town record: a talk (one more day talked) or a gift. */
function markDay(save: SaveV4, id: string, what: 'talk' | 'gift'): SaveV4 {
  const day = save.calendar.day
  const was = save.town[id] ?? { talks: 0, last: 0, gift: 0 }
  const now = what === 'talk' ? { ...was, talks: was.talks + (was.last === day ? 0 : 1), last: day } : { ...was, gift: day }
  return { ...save, town: { ...save.town, [id]: now } }
}

/** A talk (tap her, or Talk on her menu in town): one action and +15, once a day each, on the farm or in town. Her
 * town record counts the day talked. */
export function chatV4(save: SaveV4, id: string): LovePaid {
  loveOf(save, id)
  if (save.today.chats.includes(id)) throw new SaveRuleError('busy', 'You’ve talked today.')
  const spent = markDay(spend(save, 'talk'), id, 'talk')
  return addLove({ ...spent, today: { ...spent.today, chats: [...spent.today.chats, id] } }, id, LOVE_POINTS.chat, 'chat')
}

/** Her authored chat sets (its format). */
export type ChatSet = 'friend' | 'partner' | 'spouse'
/** Which of her sets she speaks: none before Friendship 1 (her temperament's lines); `friend` from
 * Friendship 1 through the confession, `partner` from Romance 1 to the wedding, `spouse` after it. */
export function chatSet(love: Pick<Love, 'stage' | 'level'>): ChatSet | null {
  switch (love.stage) {
    case 'friendship': return love.level >= 1 ? 'friend' : null
    case 'confession': return 'friend'
    case 'romance': return love.level >= 1 ? 'partner' : 'friend'
    case 'proposal': case 'wedding': return 'partner'
    case 'spouse': return 'spouse'
  }
}

/** Today's line from her: from Friendship 1 her bible's set for her stage when it holds any (`chatLinesOf`); else the
 * default story's talks for her stage in the Uma loop and her temperament (`talkStageOf`; `farmhand` once she works the
 * farm). Drawn by the account, the day and her id, so it's the same all day. The app fills `{farmer}` and `{name}`. */
export function chatLineV4(
  save: Pick<SaveV4, 'account' | 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'cast' | 'master'>>, id: string, temperament: Temperament,
  farmhand = false,
): string {
  const love = save.love[id]
  const set = love ? chatSet(love) : null
  const own = set ? chatLinesOf(pack, id, set) : []
  const lines = own.length > 0 ? own : defaultTalksOf(pack, id, talkStageOf(love ?? { stage: 'friendship', level: 0 }, farmhand), temperament)
  return lines[Math.floor(draw(save.account.uid, save.calendar.day, `chat:${id}`, 0) * lines.length)]!
}

/** What she says to a gift today: on her birthday her `giftLines.birthday`, else her `giftLines` for its taste, else the
 * default story's line for her taste (`giftReactionsOf`), drawn by the account, the day and her id. The default's has the
 * gift's name, her favourite good and her line's work in; the app fills `{farmer}` and `{name}`. */
export function giftLineV4(
  save: Pick<SaveV4, 'account' | 'calendar'>, pack: Pick<StoryPack, 'bibles'> & Partial<Pick<StoryPack, 'cast' | 'master'>>, id: string, taste: Taste, gift: string, birthday = false,
): string {
  const lines = giftReactionsOf(pack, id, taste, gift, birthday)
  return lines[Math.floor(draw(save.account.uid, save.calendar.day, `gift:${id}`, 0) * lines.length)]!
}

// --- Gifts ------------------------------------------------------------------------------------------

/** Whether her taste for a good shows: learnt by giving it (`love.known`), her loved good from Friendship 1, every
 * taste from Friendship 7. The last two are derived, never stored. */
export function tasteKnown(pack: Pick<StoryPack, 'bibles'>, love: Pick<Love, 'stage' | 'level' | 'known'>, id: string, good: string): boolean {
  if (love.known.includes(good)) return true
  const reached = (level: number) => love.stage !== 'friendship' || love.level >= level
  return reached(7) || (reached(1) && giftsOf(pack, id).loved === good)
}

/** A gift's points for her today: her taste's base × its stars × 3 on her birthday × 2 on her anniversary,
 * rounded once. 0 once her route is complete. */
export function giftPoints(save: Pick<SaveV4, 'calendar' | 'love'>, id: string, taste: Taste, stars: number, birthday: boolean): number {
  const love = save.love[id]
  if (!love || nextRung(love) === null) return 0
  return roundPoints(GIFT_POINTS_V4[taste] * giftStars(stars) * dayFactor(love, save.calendar.day, 'gift', birthday, save.calendar))
}

/** The gift picker's number: what a good at its stars pays her today, or null ("?") while her taste for it isn't
 * known. */
export function giftPreview(save: Pick<SaveV4, 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, good: string, stars: number, birthdays: Birthdays = NO_BIRTHDAYS): number | null {
  const love = save.love[id]
  if (!love || !tasteKnown(pack, love, id, good)) return null
  return giftPoints(save, id, tasteOf(pack, id, good), stars, isBirthday(birthdays, id, save.calendar.day, save.calendar))
}

export const BIRTHDAY_CELEBRATION_POINTS = 25

export function celebrateBirthday(save: SaveV4, id: string): LovePaid {
  const year = dateOf(save.calendar.day, save.calendar).year
  if (save.eventJournal?.birthdays?.[id] === year) return { save, paid: 0 }
  const paid = addLove(save, id, BIRTHDAY_CELEBRATION_POINTS, 'birthday')
  return { ...paid, save: { ...paid.save, eventJournal: { ...paid.save.eventJournal,
    birthdays: { ...paid.save.eventJournal?.birthdays, [id]: year } } } }
}

/** A gift: one action, and one good (or a dish) from the Warehouse at the stars you choose, once a day each, on the farm or in town.
 * Her town record keeps the day. Seeds aren't gifts. Her taste (`tasteOf`) sets the points; the good's taste is learnt. Disliked pays 0, never a loss. */
export function giftV4(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, id: string, item: string, stars: number, birthdays: Birthdays = NO_BIRTHDAYS): LovePaid & { taste: Taste } {
  const love = loveOf(save, id)
  if (save.today.gifts.includes(id)) throw new SaveRuleError('busy', 'One gift a day.')
  if (isSeedId(item) || (!goodOf(item) && !isDishId(item))) throw new SaveRuleError('bad-job', 'That isn’t a gift.')
  if (isDishId(item) && availableDishes(save, stockKey(item, stars)) < 1) throw new SaveRuleError('no-items', 'That dish isn’t available.')
  const items = takeGoods(save.items, item, stars, 1)
  const taste = tasteOf(pack, id, item)
  const learnt: Love = love.known.includes(item) ? love : { ...love, known: [...love.known, item] }
  const birthday = isBirthday(birthdays, id, save.calendar.day, save.calendar)
  const action = birthday && save.today.eventFunding
    ? spendForEvent(save, actionCost('gift'), { ...GAME_DAYS, birthdays }, `birthday:${id}`)
    : spend(save, 'gift')
  const spent = markDay(action, id, 'gift')
  const given: SaveV4 = { ...spent, items, today: { ...spent.today, gifts: [...spent.today.gifts, id] }, love: { ...spent.love, [id]: learnt } }
  const paid = addLove(given, id, GIFT_POINTS_V4[taste] * giftStars(stars), 'gift', birthday)
  const extra = birthday && save.today.eventFunding ? celebrateBirthday(paid.save, id) : { save: paid.save, paid: 0 }
  return { paid: paid.paid + extra.paid, save: learnt === love || taste === 'neutral' ? extra.save : recordLibrary(extra.save, id, `fact:gift:${item}`), taste }
}

// --- Praise -----------------------------------------------------------------------------------------------

/** Whether Praise +20 shows on her sheet: earned today and not yet paid. */
export const canPraise = (save: Pick<SaveV4, 'today'>, id: string): boolean => save.today.praise.includes(id) && !save.today.praised.includes(id)

/** Praise: +20, once a day, after she's earned it (`earnPraise`). */
export function praiseV4(save: SaveV4, id: string): LovePaid {
  loveOf(save, id)
  if (save.today.praised.includes(id)) throw new SaveRuleError('busy', 'You’ve praised her today.')
  if (!save.today.praise.includes(id)) throw new SaveRuleError('not-ready', 'Nothing to praise yet today.')
  return addLove({ ...save, today: { ...save.today, praised: [...save.today.praised, id] } }, id, LOVE_POINTS.praise, 'praise')
}

// --- Her line at night -------------------------------------------------------------------------

/** One Uma's pay at night, for the notes. */
export interface Paid {
  id: string
  points: number
}

/** Night step 6: +10 to each Uma who worked today at one of her line's places (`linePlaces`): a running job
 * there (step 4's `worked`), or, for a farmer, a tended block with a growing plot (step 2's `tended`, the Fields). One a
 * night each; nothing for a day elsewhere. */
export function payLines(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, worked: readonly { outfitId: string; place: string }[], tended: readonly { outfitId: string }[]): { save: SaveV4; paid: Paid[] } {
  const at = new Map<string, Set<string>>()
  const add = (id: string, place: string) => at.set(id, (at.get(id) ?? new Set<string>()).add(place))
  for (const w of worked) add(w.outfitId, w.place)
  for (const t of tended) add(t.outfitId, 'fields')
  let next = save
  const paid: Paid[] = []
  for (const id of Object.keys(save.roster)) {
    const places = at.get(id)
    if (!places || !save.love[id] || !linePlaces(pack, id).some((p) => places.has(p))) continue
    const pay = addLove(next, id, LOVE_POINTS.line, 'line')
    next = pay.save
    if (pay.paid > 0) paid.push({ id, points: pay.paid })
  }
  return { save: next, paid }
}

// --- A festival together ----------------------------------------------------------------------------------

/** A festival's key in `love.festivals`. */
export const festivalKey = (festival: FestivalId, year: number): string => `${festival}:${year}`

/** A festival together: +50 to each Uma on its team or entry, once a festival a year each: the Cooking Contest's cook
 * at its judging (`kitchen/contest.ts`); the other festivals call it once they have a team or an entry. */
export function festivalTogether(save: SaveV4, ids: readonly string[], festival: FestivalId, year: number): { save: SaveV4; paid: Paid[] } {
  const key = festivalKey(festival, year)
  let next = save
  const paid: Paid[] = []
  for (const id of new Set(ids)) {
    const love = next.love[id]
    if (!love || !next.roster[id] || love.festivals.includes(key)) continue
    const marked: SaveV4 = { ...next, love: { ...next.love, [id]: { ...love, festivals: [...love.festivals, key] } } }
    const pay = addLove(marked, id, LOVE_POINTS.festival, 'festival')
    next = pay.save
    paid.push({ id, points: pay.paid })
  }
  return { save: next, paid }
}
