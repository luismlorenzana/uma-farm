// Bonds between Umas: a pair's bond points
// (`save.bonds`, by `pairKey` of character ids), the hearts they make, and what moves them.
//
//   Working the same place the same day   +10 a pair, ×1.5 sharing a favourite line of that place's   night step 6
//   An expedition party, a day away        +15        A festival team   +20
//   The same staff meal or breakfast       +5 a pair      The same house, a night   +10
//   Romance 4: her bond with her closest friend ×1.5, once, never ×2.25
//   Hearts at 50, 150, 300, 500 and 750; never a fall
//   The ties' seeds when both are on the farm: strength 3 → 150, 2 → 50, 1 → 0
//   Side by side at 3 hearts: +10% of a night's items as extras (step 4), a tended block ×1.1 (step 2)
//
// Each new heart opens a tie's pair's conversation: the pack's (`pairs`), else the game's short card, read once into
// `diary.read` as `pair:<a>-<b>:<hearts>`. Bond points are whole: each pay rounds once, half up. Loaded with the
// romance's rules and the night.
import { draw } from './draw'
import { PLACE_ACTIVITY } from './rank-rules'
import type { Activity } from './ranks'
import type { BondLine } from '../night/summary'
import { roundPoints } from '../romance/love'
import { IN_ELEMENT, inElement, romanceBonus, type PerkPack } from '../romance/perk-terms'
import type { LoopPlaceId } from '../save/parse-v4'
import { SaveRuleError } from '../save/rules'
import { pairKey, type BlockId } from '../save/v4'
import type { FarmSave, Love, SaveV4 } from '../save/v4'
import { addGoods, parseStockKey } from '../save/warehouse'
import { type Tie } from '../story/authored'
import { type StoryPack } from '../story/pack'
import { favouriteOf, isTownPerson, pairLevels, tieStrength } from '../story/placeholders'

// --- Hearts ------------------------------------------------------------------------------------------------------

/** A pair's bond hearts 1–5 at 50, 150, 300, 500 and 750 points. */
export const BOND_HEARTS: readonly number[] = [50, 150, 300, 500, 750]

/** A pair's bond hearts, 0–5, from its points. */
export const bondHearts = (points: number): number => BOND_HEARTS.filter((at) => points >= at).length

/** The points its next heart comes at, or null at five. */
export const nextBondHeart = (points: number): number | null => BOND_HEARTS.find((at) => points < at) ?? null

/** A pair's bond points: 0 before any. */
export const bondOf = (save: Pick<FarmSave, 'bonds'>, a: string, b: string): number => save.bonds[pairKey(a, b)] ?? 0

// --- What a pair earns ----------------------------------------------------------------------

/** The table: what a pair earns, by what they shared. */
export const BOND_POINTS = { place: 10, party: 15, team: 20, meal: 5, breakfast: 5, house: 10 } as const
/** Two who share a favourite line, working a place of it: ×1.5. */
export const SHARED_LINE = 1.5
/** Romance 4's perk: her bond with her closest friend ×1.5. */
export const CLOSEST_BOND = 1.5
/** The romance level that brings it. */
export const CLOSEST_BOND_LEVEL = 4

/** At Romance 4 or later: romance level 4–9, or the proposal, the wedding or a spouse. */
export const atRomance4 = (love: Pick<Love, 'stage' | 'level'> | undefined): boolean =>
  !!love && ((love.stage === 'romance' && love.level >= CLOSEST_BOND_LEVEL) || love.stage === 'proposal' || love.stage === 'wedding' || love.stage === 'spouse')

/** One of her ties, as her profile and her closest friend read it. */
export interface TieOf {
  tie: Tie
  /** The other Uma's character id. */
  with: string
  /** Their bond points today. */
  points: number
  /** The tie's place in `ties.json`, the last tie-break. */
  order: number
}

/** Her ties, closest first: the strongest, then the most bond points, then `ties.json`'s order. Over all
 * her ties, on the farm or not. The one order her profile's Ties and `closestFriend` read. */
export function tiesOf(pack: Pick<StoryPack, 'ties'>, save: Pick<FarmSave, 'bonds'>, id: string): TieOf[] {
  return pack.ties.ties.flatMap((tie, order): TieOf[] => {
    if (tie.a !== id && tie.b !== id) return []
    const other = tie.a === id ? tie.b : tie.a
    return [{ tie, with: other, points: bondOf(save, id, other), order }]
  }).sort((x, y) => tieStrength(y.tie) - tieStrength(x.tie) || y.points - x.points || x.order - y.order)
}

/** Her closest friend: her first tie by `tiesOf` with someone who can share the farm, or null for an Uma the ties don't
 * hold. A tie with one of the town's people builds no bond, so she's never the closest. */
export const closestFriend = (pack: Pick<StoryPack, 'ties'> & Partial<Pick<StoryPack, 'town'>>, save: Pick<FarmSave, 'bonds'>, id: string): string | null =>
  tiesOf(pack, save, id).find((t) => !isTownPerson(pack, t.with))?.with ?? null

/** The factor on what a pair earns: ×1.5 when either is at Romance 4 or later and the other is her closest
 * friend; once, never ×2.25 when both are. */
export function bondFactor(save: Pick<SaveV4, 'bonds' | 'love'>, pack: Pick<StoryPack, 'ties'>, a: string, b: string): number {
  const closest = (id: string, other: string) => atRomance4(save.love[id]) && closestFriend(pack, save, id) === other
  return closest(a, b) || closest(b, a) ? CLOSEST_BOND : 1
}

/** What `addBond` paid. */
export interface BondPaid {
  save: SaveV4
  /** Points into the pair's bond, after Romance 4's factor and rounding; 0 when nothing moved. */
  paid: number
}

/**
 * Bond points for a pair: the one way a bond grows. Romance 4's ×1.5 (`bondFactor`), rounded once, half up;
 * never below what's there. Both Umas on the roster, two of them. Every source calls it: the night's place (`bondsTonight`),
 * an expedition party (+15 a day away), a festival team (+20), the same staff meal or breakfast (+5 a pair), the same
  * house (+10 a night). Never stamps.
 */
export function addBond(save: SaveV4, pack: Pick<StoryPack, 'ties'>, a: string, b: string, points: number): BondPaid {
  if (a === b) throw new SaveRuleError('bad-count', 'A bond is between two Umas.')
  if (!save.roster[a] || !save.roster[b]) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  if (!Number.isFinite(points) || points < 0) throw new SaveRuleError('bad-count', 'Bonds never fall.')
  const paid = roundPoints(points * bondFactor(save, pack, a, b))
  if (paid === 0) return { save, paid }
  return { save: withBond(save, pairKey(a, b), bondOf(save, a, b) + paid), paid }
}

/** A pair's bond set to `points`, its hearts before noted in `today.bonds` the first time it moves since the last
 * morning, so the next morning lists what rose whether a night or a day moved it. */
function withBond(save: SaveV4, key: string, points: number): SaveV4 {
  const noted = save.today.bonds[key] !== undefined ? save.today.bonds : { ...save.today.bonds, [key]: bondHearts(save.bonds[key] ?? 0) }
  return { ...save, bonds: { ...save.bonds, [key]: points }, today: { ...save.today, bonds: noted } }
}

// --- The ties' seeds ---------------------------------------------------------------------------------

/** A tie's seed by its strength (1 when the pack gives none): 3 → 150 (2 hearts), 2 → 50 (1 heart), 1 → 0 (known, with a line). */
export const TIE_SEEDS: Readonly<Record<1 | 2 | 3, number>> = { 1: 0, 2: 50, 3: 150 }

/** She joins: each of her ties whose other Uma is on the farm starts at its seed, `max(points, seed)`, so a
 * seed never lowers a bond. A seeded heart is a new heart: the morning lists it and its conversation opens. Pure. */
export function seedTies(save: SaveV4, pack: Pick<StoryPack, 'ties'>, id: string): SaveV4 {
  let next = save
  for (const { tie, with: other } of tiesOf(pack, save, id)) {
    const seed = TIE_SEEDS[tieStrength(tie)]
    if (other === id || !save.roster[other] || !save.roster[id] || seed <= bondOf(next, id, other)) continue
    next = withBond(next, pairKey(id, other), seed)
  }
  return next
}

// --- The night: the same place the same day ---------------------------------------------------------------

/** Who worked where today: step 4's running jobs by place, and the Fields' tenders with a growing block (step 2) as the
 * Fields. An Uma works one place a day. */
export function placesToday(worked: readonly { outfitId: string; place: string }[], tended: readonly { outfitId: string }[]): Map<string, string[]> {
  const at = new Map<string, string[]>()
  const add = (place: string, id: string) => {
    const ids = at.get(place) ?? []
    if (!ids.includes(id)) at.set(place, [...ids, id])
  }
  for (const w of worked) add(w.place, w.outfitId)
  for (const t of tended) add('fields', t.outfitId)
  return at
}

/** A place's activity: the Fields' is farming, a work place's its `PLACE_ACTIVITY`. */
const placeActivity = (place: string): Activity | null => (place === 'fields' ? 'farming' : PLACE_ACTIVITY[place as LoopPlaceId] ?? null)

/** One pair's pay tonight. */
export interface BondPay { a: string; b: string; points: number }

/** Night step 6: every pair among the Umas who worked one place today earns +10, ×1.5 when both have
 * the same favourite line and it's that place's (farming for the Fields), through `addBond` (Romance 4's ×1.5). Once a
 * night a pair, in the places' order and then the pair's. */
export function bondsTonight(
  save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>, worked: readonly { outfitId: string; place: string }[], tended: readonly { outfitId: string }[],
): { save: SaveV4; paid: BondPay[] } {
  let next = save
  const paid: BondPay[] = []
  const done = new Set<string>()
  for (const [place, ids] of placesToday(worked, tended)) {
    const here = ids.filter((id) => save.roster[id]).sort((x, y) => Number(x) - Number(y))
    const activity = placeActivity(place)
    for (let i = 0; i < here.length; i++) {
      for (let j = i + 1; j < here.length; j++) {
        const [a, b] = [here[i]!, here[j]!]
        if (done.has(pairKey(a, b))) continue
        done.add(pairKey(a, b))
        const shared = activity !== null && favouriteOf(pack, a) === activity && favouriteOf(pack, b) === activity
        const pay = addBond(next, pack, a, b, BOND_POINTS.place * (shared ? SHARED_LINE : 1))
        next = pay.save
        if (pay.paid > 0) paid.push({ a, b, points: pay.paid })
      }
    }
  }
  return { save: next, paid }
}

// --- Side by side at 3 hearts -----------------------------------------------------------------

/** Side by side: a partner she has 3 hearts or more with. */
export const SIDE_BY_SIDE_HEARTS = 3
/** The bond factor: her items, and a tended block's growth, ×1.1. */
export const SIDE_BY_SIDE = 1.1

/** Whether she has a 3+-heart partner among `others` (not herself). */
const besideAny = (save: Pick<FarmSave, 'bonds'>, id: string, others: readonly string[]): boolean =>
  others.some((other) => other !== id && bondHearts(bondOf(save, id, other)) >= SIDE_BY_SIDE_HEARTS)

/** Whether a tended block grows side by side: its tender has a 3+-heart partner tending another block with a
 * growing plot. */
export function tendsSideBySide(save: Pick<FarmSave, 'bonds' | 'fields'>, block: BlockId): boolean {
  const growing = (b: FarmSave['fields']['blocks'][number]) => b.tender !== null && b.plots.some((p) => p.crop !== null && !p.ready)
  const own = save.fields.blocks.find((b) => b.id === block)
  if (!own || !growing(own)) return false
  return besideAny(save, own.tender!, save.fields.blocks.filter((b) => b.id !== block && growing(b)).map((b) => b.tender!))
}

/** Her share of side by side's extras at a place tonight: 10% beside a 3+-heart partner who also worked there
 * today, else none; **20% in her element** (Friendship 8, at her line's place, with the pack). */
export function extrasShare(save: Pick<FarmSave, 'bonds'> & Partial<Pick<SaveV4, 'love' | 'buildings'>>, id: string, place: string, worked: readonly { outfitId: string; place: string }[], story: PerkPack | null = null): number {
  if (!besideAny(save, id, worked.filter((w) => w.place === place).map((w) => w.outfitId))) return 0
  const element = story && save.love && save.buildings && inElement({ love: save.love, buildings: save.buildings }, story, id, place)
  return round2((element ? IN_ELEMENT : SIDE_BY_SIDE) - 1)
}
const round2 = (n: number): number => Math.round(n * 100) / 100

/** Her share of the perks' extras at a place tonight: the bond term × the romance term, so that with
 * side by side's share her items come to × (bond × (1 + romance)) in all. 0 without the pack. */
export function perksShare(save: FarmSave, id: string, place: string, worked: readonly { outfitId: string; place: string }[], story: PerkPack | null): number {
  if (!story) return 0
  const romance = romanceBonus(save, story, id, place)
  return romance > 0 ? Math.round((1 + extrasShare(save, id, place, worked, story)) * romance * 1e6) / 1e6 : 0
}

/** One Uma's extras tonight: copies of her night's items, by stock key. */
export interface Extras {
  id: string
  items: string[]
}

/** One pot of extras: for each Uma, `share × n` whole copies of her night's items and one more by
 * `draw(uid, day, '<key>:<id>', 0)` for the fraction, each a copy picked by `draw(…, k)`, into the Warehouse. */
function payExtras<S extends FarmSave>(save: S, mine: ReadonlyMap<string, readonly { place: string; items: readonly string[] }[]>, key: string, shareOf: (id: string, place: string) => number): { save: S; extras: Extras[] } {
  let items = save.items
  const extras: Extras[] = []
  for (const id of [...mine.keys()].sort((x, y) => Number(x) - Number(y))) {
    const theirs = mine.get(id)!.flatMap((m) => {
      const share = shareOf(id, m.place)
      return share > 0 ? m.items.map((item) => ({ item, share })) : []
    })
    if (theirs.length === 0) continue
    const expected = theirs.reduce((sum, t) => sum + t.share, 0)
    const whole = Math.floor(expected + 1e-9)
    const count = whole + (draw(save.account.uid, save.calendar.day, `${key}:${id}`, 0) < expected - whole ? 1 : 0)
    const copies = Array.from({ length: count }, (_, k) => theirs[Math.floor(draw(save.account.uid, save.calendar.day, `${key}:${id}`, k + 1) * theirs.length)]!.item)
    const kept = copies.filter((stock) => parseStockKey(stock) !== null)
    for (const stock of kept) {
      const { id: good, stars } = parseStockKey(stock)!
      items = addGoods(items, good, stars, 1)
    }
    if (kept.length > 0) extras.push({ id, items: kept })
  }
  return { save: items === save.items ? save : { ...save, items }, extras }
}

/**
 * Night step 4, after the hauls: each Uma whose work finished items tonight (`made`) at a place where a
 * 3+-heart partner also worked today gets 10% of those items again (20% in her element), as extras: `share × n` whole
 * copies and one more by `draw(uid, day, 'bond:<id>', 0)` for the fraction, each a copy of one of her night's items (the
 * same good and stars) picked by `draw(uid, day, 'bond:<id>', k)`, straight into the Warehouse. **The perks' extras**
 * follow as their own pot (`perks`, `draw(uid, day, 'perk:<id>', n)`): the bond term × the romance term of each item's place
 * (`perksShare`), so her items come to × (bond × (1 + romance)) in all. Planned hauls are untouched (uma-work's plans and
 * outputs). Without the pack, no perks.
 */
export function extrasTonight<S extends FarmSave>(save: S, made: readonly { outfitId: string; place: string; items: readonly string[] }[], worked: readonly { outfitId: string; place: string }[], story: PerkPack | null = null): { save: S; extras: Extras[]; perks: Extras[] } {
  const mine = new Map<string, { place: string; items: string[] }[]>()
  for (const m of made) if (m.items.length > 0) mine.set(m.outfitId, [...(mine.get(m.outfitId) ?? []), { place: m.place, items: [...m.items] }])
  const side = payExtras(save, mine, 'bond', (id, place) => extrasShare(save, id, place, worked, story))
  const perks = payExtras(side.save, mine, 'perk', (id, place) => perksShare(save, id, place, worked, story))
  return { save: perks.save, extras: side.extras, perks: perks.extras }
}

// --- Pair conversations ---------------------------------------------------------------------

/** A pair's file and read ids: `<a>-<b>`, the two in `pairKey` order. */
export const pairName = (a: string, b: string): string => pairKey(a, b).replace(':', '-')
/** A read conversation in `diary.read`: `pair:<a>-<b>:<hearts>`. */
export const pairReadId = (a: string, b: string, hearts: number): string => `pair:${pairName(a, b)}:${hearts}`

/** The levels of a pair's conversations read so far, lowest first. */
export function readLevels(save: Pick<SaveV4, 'diary'>, a: string, b: string): number[] {
  return [1, 2, 3, 4, 5].filter((h) => save.diary.read.includes(pairReadId(a, b, h)))
}

/** Its conversations opened and unread: a tie's (written, or the game's card), at or under its hearts (or `upTo`), not
 * read, lowest first. */
export function unreadLevels(save: Pick<SaveV4, 'bonds' | 'diary'>, pack: Pick<StoryPack, 'ties'>, a: string, b: string, upTo = bondHearts(bondOf(save, a, b))): number[] {
  const levels = pairLevels(pack, a, b)
  const hearts = Math.min(upTo, bondHearts(bondOf(save, a, b)))
  return [1, 2, 3, 4, 5].filter((h) => h <= hearts && levels.has(h) && !save.diary.read.includes(pairReadId(a, b, h)))
}

/** Conversations read: each level of a tie's pair opened, once into `diary.read`. Pays nothing; a choice in it is
 * wording only. Read already: unchanged. Never stamps: the app's action does, once. */
export function readPair(save: SaveV4, pack: Pick<StoryPack, 'ties'>, a: string, b: string, levels: readonly number[]): SaveV4 {
  if (!save.roster[a] || !save.roster[b] || a === b) throw new SaveRuleError('not-owned', 'She isn’t on the farm.')
  const hearts = bondHearts(bondOf(save, a, b))
  const ids: string[] = []
  for (const h of levels) {
    if (!pairLevels(pack, a, b).has(h)) throw new SaveRuleError('locked', 'They have no conversation there.')
    if (h > hearts) throw new SaveRuleError('locked', 'Their bond isn’t there yet.')
    const id = pairReadId(a, b, h)
    if (!save.diary.read.includes(id) && !ids.includes(id)) ids.push(id)
  }
  return ids.length === 0 ? save : { ...save, diary: { ...save.diary, read: [...save.diary.read, ...ids] } }
}

/** The pair a bond key names, in `pairKey` order. */
export const pairOf = (key: string): [string, string] => key.split(':') as [string, string]

/**
 * The morning's bond hearts: one line a pair whose hearts rose since the last morning, at its highest,
 * in the cast's order (then by id). Each pair's hearts before are what `today.bonds` noted when it first moved (a seed when
 * an Uma joins, or anything a day pays), else last night's; so a seed is a new heart, and so is one paid
 * tonight. Night step 9 reads it, then empties `today.bonds` for the day ahead.
 */
export function newBondHearts(before: SaveV4, after: SaveV4, order: readonly string[] = []): BondLine[] {
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  return Object.entries(after.bonds).flatMap(([key, points]): BondLine[] => {
    const [a, b] = pairOf(key)
    const was = before.today.bonds[key] ?? bondHearts(before.bonds[key] ?? 0)
    const hearts = bondHearts(points)
    return hearts > was ? [{ kind: 'bond', a, b, hearts }] : []
  }).sort((x, y) => Math.min(rank(x.a), rank(x.b)) - Math.min(rank(y.a), rank(y.b)) || Math.max(rank(x.a), rank(x.b)) - Math.max(rank(y.a), rank(y.b))
    || Number(x.a) - Number(y.a) || Number(x.b) - Number(y.b))
}
