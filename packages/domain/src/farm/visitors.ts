// Visitors, affinity and recruits (F23 decisions 5–10; core spec CS35, CS45, CS46; FC16, FC26): a visitor stops at the
// Gate every fourth morning while a bed is free and none waits, and stays once your affinity with her reaches 2 hearts;
// a chat a day and a gift a day raise it, for every Uma on the roster and every visitor; each chapter's end brings a
// recruit for the farm's weakest open activity (F24 calls `recruitFor`). Praise and story beats are M6's (F34). Every
// draw is the account's (CS8). Loaded with the loop's screens and the night.
import { goodOf, isSeedId, type GoodFamily } from '../goods/ids'
import type { MaterialLine } from '../items/lines'
import { SaveRuleError } from '../save/rules'
import type { OutfitId, SaveV3, Visitor } from '../save/v3'
import { takeGoods } from '../save/warehouse'
import { joinRoster, freeBeds } from './dorm'
import { draw } from './draw'
import { opened } from './places'
import { HEART_POINTS, heartsOf } from './rank-rules'
import { ACTIVITIES, type Activity } from './ranks'
import type { Temperament, TalentOf, TalentStep } from './talents'

/** A visitor stops by on days divisible by 4 (CS35). */
export const GATE_EVERY = 4
/** She waits 6 days, then leaves (`leaves` = her first day + 6). */
export const VISITOR_DAYS = 6
/** She asks to stay at 2 hearts (CS45). */
export const STAY_AFFINITY = 2 * HEART_POINTS
/** 10 hearts. */
export const MAX_AFFINITY = 10 * HEART_POINTS

// --- Affinity (CS45; decisions 7–9) ----------------------------------------------------------------------------------

/** A chat a day (tap her): +15. */
export const CHAT_POINTS = 15
/** A gift a day: loved +60, liked +30, neutral +10, disliked −20 (never below a heart she's reached). Praise, +20 a day,
 * is M6's (F34). */
export const GIFT_POINTS = { loved: 60, liked: 30, neutral: 10, disliked: -20 } as const
export type Taste = keyof typeof GIFT_POINTS
export const TASTES: readonly Taste[] = ['loved', 'liked', 'neutral', 'disliked']

/** Affinity after `points` (decision 7): up to 10 hearts; a fall stops at the hearts she's reached, and nothing decays. */
export function addAffinity(affinity: number, points: number): number {
  if (points >= 0) return Math.min(MAX_AFFINITY, affinity + points)
  return Math.max(heartsOf(affinity) * HEART_POINTS, affinity + points)
}

/** The forest's six families (CS16): a Wood Uma's likes, raw and refined. */
export const FOREST_FAMILIES: readonly GoodFamily[] = ['woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets']
/** Each favourite line's families (decision 8); Vegetables reads crops and their refined forms instead. */
const LINE_FAMILIES: Readonly<Record<Exclude<MaterialLine, 'vegetables'>, readonly GoodFamily[]>> = {
  wood: FOREST_FAMILIES, fish: ['fish'], metal: ['ores'], stone: ['stones', 'crystals'],
}

/** What she thinks of a good as a gift (decision 8; CS45): **liked**, goods of her favourite line (Wood the forest's six
 * families, Fish fish and fillets, Vegetables crops and their refined forms, Metal ores and ingots, Stone stones and
 * crystals, raw and refined); **disliked**, raw stones unless her favourite is mining (Metal or Stone), and feed (M5);
 * everything else **neutral**. **Loved** is the dish kind of her best talent, when dishes come (M5, F8). */
export function giftTaste(item: string, line: MaterialLine | null): Taste {
  const good = goodOf(item)
  if (!good) return 'neutral'
  const input = good.input ? goodOf(good.input) : undefined
  const liked = line === 'vegetables' ? good.crop || !!input?.crop : line ? LINE_FAMILIES[line].includes(good.family) : false
  if (liked) return 'liked'
  const miner = line === 'metal' || line === 'stone'
  return good.family === 'stones' && !good.refined && !miner ? 'disliked' : 'neutral'
}

/** Where an Uma you can talk to is: on the roster, or a visitor. */
function member(save: SaveV3, outfitId: OutfitId): 'roster' | 'visitor' {
  if (save.roster[outfitId]) return 'roster'
  if (save.visitors.some((v) => v.outfitId === outfitId)) return 'visitor'
  throw new SaveRuleError('not-owned', 'She isn’t here.')
}

/** What a chat or a gift did: her points, and whether she joined (a visitor at 2 hearts, decision 6). */
export interface AffinityResult<S> {
  save: S
  /** Affinity before and after. */
  from: number
  to: number
  /** She joined the roster with this act: home, or away for lack of a bed. Null otherwise. */
  joined: { outfitId: OutfitId; home: boolean } | null
}

/** Her affinity moved by `points`; a visitor reaching 200 joins at once, keeping it (decision 6). */
function moveAffinity<S extends SaveV3>(save: S, outfitId: OutfitId, points: number): AffinityResult<S> {
  if (member(save, outfitId) === 'roster') {
    const uma = save.roster[outfitId]!
    const to = addAffinity(uma.affinity, points)
    return { save: { ...save, roster: { ...save.roster, [outfitId]: { ...uma, affinity: to } } }, from: uma.affinity, to, joined: null }
  }
  const visitor = save.visitors.find((v) => v.outfitId === outfitId)!
  const to = addAffinity(visitor.affinity, points)
  const moved = { ...save, visitors: save.visitors.map((v): Visitor => (v.outfitId === outfitId ? { ...v, affinity: to } : v)) }
  if (to < STAY_AFFINITY) return { save: moved, from: visitor.affinity, to, joined: null }
  const join = joinRoster(moved, outfitId, to)
  return { save: join.save, from: visitor.affinity, to, joined: { outfitId, home: join.home } }
}

/** A chat (tap her): +15, once a day each, for any Uma on the roster, home or away, and any visitor (decisions 4, 9). */
export function chat<S extends SaveV3>(save: S, outfitId: OutfitId): AffinityResult<S> {
  member(save, outfitId)
  if (save.today.chats.includes(outfitId)) throw new SaveRuleError('busy', 'You’ve talked today.')
  const talked = { ...save, today: { ...save.today, chats: [...save.today.chats, outfitId] } }
  return moveAffinity(talked, outfitId, CHAT_POINTS)
}

/** A gift (decisions 8, 9): one good from the Warehouse at the stars the player chooses, once a day each. Seeds aren't
 * gifts. What she thinks of it (`giftTaste`, her favourite line from master data) sets the points. */
export function gift<S extends SaveV3>(save: S, outfitId: OutfitId, item: string, stars: number, line: MaterialLine | null): AffinityResult<S> & { taste: Taste } {
  member(save, outfitId)
  if (save.today.gifts.includes(outfitId)) throw new SaveRuleError('busy', 'One gift a day.')
  if (isSeedId(item) || !goodOf(item)) throw new SaveRuleError('bad-job', 'That isn’t a gift.')
  const items = takeGoods(save.items, item, stars, 1)
  const taste = giftTaste(item, line)
  const given = { ...save, items, today: { ...save.today, gifts: [...save.today.gifts, outfitId] } }
  return { ...moveAffinity(given, outfitId, GIFT_POINTS[taste]), taste }
}

// --- Chats' lines (decision 9; CS46): five a temperament, her name filled in at runtime (`{name}`) -------------------

/** A short line by her temperament, original text; M6's conversations replace them. */
export const CHAT_LINES: Readonly<Record<Temperament, readonly string[]>> = {
  breezy: [
    '{name} jogs over. “Morning! I lapped the fence twice already.”',
    '“The wind’s good today,” says {name}. “Running weather.”',
    '{name} grins. “Don’t blink. I’ll be done before you know it.”',
    '“Can I take the long way to the Pond? It’s the fun way.”',
    '{name} bounces on her heels. “What’s next? Something quick?”',
  ],
  steady: [
    '{name} nods. “The rows don’t rush, so neither do I.”',
    '“Slept well. Ready for a full day,” says {name}.',
    '“Steady hands, steady harvest,” {name} says.',
    '{name} wipes her brow. “Hard work feels good out here.”',
    '“One more row, then tea?”',
  ],
  bold: [
    '{name} cracks her knuckles. “Give me the heaviest job you’ve got.”',
    '“Logs, rocks, crates. I’ll carry the lot,” says {name}.',
    '{name} laughs. “Is that all? I barely broke a sweat.”',
    '“If something’s stuck, point me at it.”',
    '{name} rolls her shoulders. “Strong legs, strong arms. Let’s go.”',
  ],
  gritty: [
    '{name} sets her jaw. “Rain or shine, I’ll finish it.”',
    '“Tired? Me? Not yet,” says {name}.',
    '{name} brushes off the dirt. “Fell once. Got up twice.”',
    '“Hard days make the good ones taste better.”',
    '{name} tightens her gloves. “I don’t stop halfway.”',
  ],
  clever: [
    '{name} taps her notebook. “I counted the carrots. Twice.”',
    '“Fish bite best just after the clouds pass,” says {name}.',
    '{name} squints at the sky. “Rain by evening, I’d guess.”',
    '“I’ve a plan for the Fields. It has three parts.”',
    '{name} smiles. “Ask me anything about the farm.”',
  ],
}

/** Today's line from her (decision 9): one of her temperament's five, drawn by the account, the day and her id, so it's
 * the same all day on every device. `{name}` is filled in by the app. */
export function chatLine(save: Pick<SaveV3, 'account' | 'calendar'>, outfitId: OutfitId, temperament: Temperament): string {
  const lines = CHAT_LINES[temperament]
  return lines[Math.floor(draw(save.account.uid, save.calendar.day, `chat:${outfitId}`, 0) * lines.length)]!
}

// --- The Gate at night (decision 5; CS35) ----------------------------------------------------------------------------

/** Night step 8, after the Dorm: a waiting visitor whose 6 days are up leaves; then, on a morning divisible by 4, while a
 * bed is free and no Gate visitor waits, one arrives, a seeded draw from the release's outfits not on the roster and not
 * waiting, so one who left may come again. `release` is master data's outfit ids, in its order. */
export function gateNight(save: SaveV3, release: readonly OutfitId[]): { save: SaveV3; arrived: OutfitId | null; left: OutfitId[] } {
  const day = save.calendar.day
  const left = save.visitors.filter((v) => v.leaves <= day).map((v) => v.outfitId)
  const staying = save.visitors.filter((v) => v.leaves > day)
  const waiting = new Set(staying.map((v) => v.outfitId))
  let arrived: OutfitId | null = null
  if (day % GATE_EVERY === 0 && freeBeds(save) > 0 && !staying.some((v) => v.from === 'gate')) {
    const pool = release.filter((id) => !save.roster[id] && !waiting.has(id))
    arrived = pool[Math.floor(draw(save.account.uid, day, 'gate', 0) * pool.length)] ?? null
  }
  const visitors = arrived ? [...staying, { outfitId: arrived, from: 'gate' as const, leaves: day + VISITOR_DAYS, affinity: 0 }] : staying
  return { save: left.length > 0 || arrived ? { ...save, visitors } : save, arrived, left }
}

/** Days she has left at the Gate: 6 the morning she comes, 1 on her last day. */
export const daysLeft = (save: Pick<SaveV3, 'calendar'>, visitor: Pick<Visitor, 'leaves'>): number => Math.max(0, visitor.leaves - save.calendar.day)

/** The next morning a visitor may stop by: the next day divisible by 4 after today. */
export const nextGateDay = (day: number): number => (Math.floor(day / GATE_EVERY) + 1) * GATE_EVERY

// --- Chapter recruits (decision 10; CS35) -----------------------------------------------------------------------------

/** C or better: what a recruit has in the activity she's drawn for. */
export const RECRUIT_STEP: TalentStep = 4

/** The activities open on this save (CS3): farming, foraging and fishing from day 1; the ranch with chapter 2 (the Coop),
 * mining with 3, cooking with 4 (the Kitchen), expeditions with 5, serving with 6 (the Restaurant) and forging with 7. */
export function openActivities(save: Pick<SaveV3, 'farm'>): Activity[] {
  const from: Readonly<Record<Activity, number>> = { farming: 1, foraging: 1, fishing: 1, ranch: 2, mining: 3, cooking: 4, expeditions: 5, serving: 6, forging: 7 }
  return ACTIVITIES.filter((a) => opened(save, { by: 'chapter', chapter: from[a] }))
}

/** The open activity the farm is weakest at (decision 10): the lowest best rank on the roster, then the lowest best
 * talent, then the activities' order. */
export function weakestActivity(save: Pick<SaveV3, 'roster' | 'farm'>, talentOf: TalentOf): Activity {
  const ids = Object.keys(save.roster)
  const best = (a: Activity) => ({
    rank: Math.max(-1, ...ids.map((id) => save.roster[id]!.ranks[a].rank)),
    talent: Math.max(-1, ...ids.map((id) => talentOf(id, a))),
  })
  return openActivities(save).reduce((weak, a) => {
    const x = best(a)
    const w = best(weak)
    return x.rank < w.rank || (x.rank === w.rank && x.talent < w.talent) ? a : weak
  })
}

/** A chapter's recruit (decision 10): an outfit not on the roster and not waiting at the Gate, C or better in the farm's
 * weakest open activity, drawn by the account, the day and the chapter. Null when the release has none left. F24 calls
 * it for chapter 1's reward and joins her with `joinRoster` (home, or away with no bed free). */
export function recruitFor(save: SaveV3, release: readonly OutfitId[], talentOf: TalentOf): { activity: Activity; outfitId: OutfitId | null } {
  const activity = weakestActivity(save, talentOf)
  const waiting = new Set(save.visitors.map((v) => v.outfitId))
  const pool = release.filter((id) => !save.roster[id] && !waiting.has(id) && talentOf(id, activity) >= RECRUIT_STEP)
  const outfitId = pool[Math.floor(draw(save.account.uid, save.calendar.day, `recruit:${save.farm.chapter}`, 0) * pool.length)] ?? null
  return { activity, outfitId }
}
