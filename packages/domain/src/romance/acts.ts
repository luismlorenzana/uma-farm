// The acts that fill her bar: a chat, a gift by her own tastes, praise,
// her line at night and a festival together. Each pays through `addLove`, so the day's factors apply once (a gift ×3 on
// her birthday, every act ×2 on her anniversary) and each says what it paid, for the "+N" that floats from her face.
//
//   Chat      +15                                   once a day each, home or away
//   Gift      loved 60 · liked 30 · neutral 10 · disliked 0, × (1 + 0.1 a star above ★1)   one a day each
//   Praise    +20                                   once a day, when she's earned it (`praise.ts`)
//   Her line  +10                                   night step 6, a day at one of her line's places
//   Festival  +50                                   once a festival a year, on its team or entry (festivals call it)
//
// Loaded with the romance's screens and the night.
import { draw } from '../farm/draw'
import { CHAT_LINES, type Taste } from './chats'
import type { FestivalId } from '../farm/calendar'
import type { Temperament } from '../farm/talents'
import { goodOf, isSeedId } from '../goods/ids'
import { SaveRuleError } from '../save/rules'
import type { Love, SaveV4 } from '../save/v4'
import { takeGoods } from '../save/warehouse'
import { type StoryPack } from '../story/pack'
import { chatLinesOf, giftsOf, linePlaces, tasteOf } from '../story/placeholders'
import { NO_BIRTHDAYS, isBirthday, type Birthdays } from './days'
import { addLove, dayFactor, nextRung, roundPoints, type LovePaid } from './love'

/** The fixed pays. */
export const LOVE_POINTS = { chat: 15, praise: 20, line: 10, festival: 50 } as const
/** A gift by her taste: disliked pays 0 and never takes points away. */
export const GIFT_POINTS_V4: Readonly<Record<Taste, number>> = { loved: 60, liked: 30, neutral: 10, disliked: 0 }
/** A gift's stars: × (1 + 0.1 a star above ★1). */
export const giftStars = (stars: number): number => 1 + 0.1 * (stars - 1)
/** What she says to a disliked gift: one fixed line, original and kind. */
export const DISLIKED_LINE = 'She thanks you, a little puzzled.'

/** Her route, or the refusal for someone not on the farm. */
function loveOf(save: SaveV4, id: string): Love {
  const love = save.love[id]
  if (!love || !save.roster[id]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  return love
}

// --- Chats ------------------------------------------------------------------------------------------

/** A chat (tap her): +15, once a day each, home or away. */
export function chatV4(save: SaveV4, id: string): LovePaid {
  loveOf(save, id)
  if (save.today.chats.includes(id)) throw new SaveRuleError('busy', 'You’ve talked today.')
  return addLove({ ...save, today: { ...save.today, chats: [...save.today.chats, id] } }, id, LOVE_POINTS.chat, 'chat')
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

/** Today's line from her: from Friendship 1 her set for her stage, her bible's or the stage's placeholders
 * (`chatLinesOf`); before it, her temperament's `CHAT_LINES`. Drawn by the account, the day and her id, so it's the same
 * all day. The app fills `{farmer}` and `{name}`. */
export function chatLineV4(save: Pick<SaveV4, 'account' | 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, temperament: Temperament): string {
  const love = save.love[id]
  const set = love ? chatSet(love) : null
  const lines = set ? chatLinesOf(pack, id, set) : CHAT_LINES[temperament]
  return lines[Math.floor(draw(save.account.uid, save.calendar.day, `chat:${id}`, 0) * lines.length)]!
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
  return roundPoints(GIFT_POINTS_V4[taste] * giftStars(stars) * dayFactor(love, save.calendar.day, 'gift', birthday))
}

/** The gift picker's number: what a good at its stars pays her today, or null ("?") while her taste for it isn't
 * known. */
export function giftPreview(save: Pick<SaveV4, 'calendar' | 'love'>, pack: Pick<StoryPack, 'bibles'>, id: string, good: string, stars: number, birthdays: Birthdays = NO_BIRTHDAYS): number | null {
  const love = save.love[id]
  if (!love || !tasteKnown(pack, love, id, good)) return null
  return giftPoints(save, id, tasteOf(pack, id, good), stars, isBirthday(birthdays, id, save.calendar.day))
}

/** A gift: one good from the Warehouse at the stars you choose, once a day each, home or away. Seeds aren't
 * gifts. Her taste (`tasteOf`) sets the points; the good's taste is learnt. Disliked pays 0, never a loss. */
export function giftV4(save: SaveV4, pack: Pick<StoryPack, 'bibles'>, id: string, item: string, stars: number, birthdays: Birthdays = NO_BIRTHDAYS): LovePaid & { taste: Taste } {
  const love = loveOf(save, id)
  if (save.today.gifts.includes(id)) throw new SaveRuleError('busy', 'One gift a day.')
  if (isSeedId(item) || !goodOf(item)) throw new SaveRuleError('bad-job', 'That isn’t a gift.')
  const items = takeGoods(save.items, item, stars, 1)
  const taste = tasteOf(pack, id, item)
  const learnt: Love = love.known.includes(item) ? love : { ...love, known: [...love.known, item] }
  const given: SaveV4 = { ...save, items, today: { ...save.today, gifts: [...save.today.gifts, id] }, love: { ...save.love, [id]: learnt } }
  return { ...addLove(given, id, GIFT_POINTS_V4[taste] * giftStars(stars), 'gift', isBirthday(birthdays, id, save.calendar.day)), taste }
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

/** A festival together: +50 to each Uma on its team or entry, once a festival a year each. Written and tested
 * here; the festivals call it once a festival has a team or an entry. */
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
