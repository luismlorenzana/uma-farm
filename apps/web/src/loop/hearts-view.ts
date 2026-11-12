// The Hearts tab as the screens show it (F48 decisions 4–10; romance spec RM52, RM53, RM57): one row an Uma with her
// level, the ladder's hearts as a bar, what's banked, today's ticks and chips; Ready first, then the least progress, then
// the cast's order; the filters with their counts; the header's "Married n/N"; and her profile's parts (the route as one
// track, the Next card, the perks, the gifts as learnt, her ties with their bond hearts). The morning's Ready lines and the
// map's ♥ badges read Ready here too, live (F47 decision 14: never stored). Pure, from F47's `readiness`, `bar` and
// `levelWords`, so the screens and the tests read the same. Loaded on demand with the tab and the farm map.
//
// F52 extends `tieRows` (the hearts move with `save.bonds`, her closest friend first and marked, a conversation to Read)
// and adds the pairs' words for the morning and the Diary (`pairWords`, `conversationRows`), all over `farm/bonds.ts`.
//
// F50 fills `invited` (her invitation stands, unanswered or yes and not yet spent: `invitedNow`); the header's evening
// marks are `evening-view.ts`'. For later packets: F54 adds her house to the row's note and the track's colours stay as
// they are.
//
// F51 adds what each reached perk does now (`perkNow`: "+28% at the forest · +8% ring", "2 items each night", "Next in 3
// mornings"), her closest friend's loved gift to Gifts from Friendship 7 (`friendLoved`), and her pet name and keepsake
// once reached (`fromHer`). F53 adds her Ring (`ringView`: the engraving from Romance 8, her ring and its bonus, and the
// better rings in the Warehouse) and R8's engraving in her perks.
import {
  ACTIVITY_NAMES, bar, benchOpen, betterRings, bondHearts, bondOf, castOrder, choresTonight, closestFriend, dateOf, dishName, favouriteOf, farmPlace, GIFT_POINTS_V4, goodName, hasPerk, homeOrHoused,
  invitedNow, isGoodId, KEEPSAKE_GROWN, KEEPSAKE_QUALITY, keepsakeQuality, LADDER_COLOURS, ladderOf, levelWords, linePlaces, morningRule, morningsToItem, nextBondHeart,
  pairLevels, pairName, pairOf, PERK_PLACE, perkLineOf, perksFor, readiness, readLevels, ringGrade, ringName, ringPercent, romanceTerms, ROUTE_RUNGS, routeIndex, rungName, SEASON_NAMES, SIDE_BY_SIDE_HEARTS,
  tasteKnown, tiesOf, unreadLevels, WAITING_RUNGS,
  type Bar, type Birthdays, type LadderName, type Love, type LoveStage, type Perk, type PerkId, type Readiness, type SaveV4, type StoryPack, type Tie, type Wait,
} from '@farm/domain'
import { nextWords, readyWords } from './love-words'

/** The pack as the tab reads it. */
export type HeartsPack = Pick<StoryPack, 'cast' | 'ties' | 'bibles' | 'scripted' | 'pairs'>
/** An Uma's name from master data. */
export type NameOf = (id: string) => string

// --- Places in words --------------------------------------------------------------------------------------------------

/** The romance's own backdrops (W5), in words. */
const BACKDROPS: Readonly<Record<string, string>> = {
  'pond-night': 'the Pond at night', overlook: 'the Overlook', 'orchard-bench': 'the orchard bench', 'dorm-porch': 'the Dorm porch', 'harbour-wall': 'the harbour wall',
  'chapel-bell': 'the chapel bell', town: 'the town', 'hilltop-track': 'the hilltop track', 'sea-pier': 'the sea pier',
}
/** Farm places whose names read lower-case in a line. */
const PLACE_WORDS: Readonly<Record<string, string>> = { forest: 'the forest', bin: 'the shipping bin', board: 'the requests board', festival: 'the festival ground', expeditions: 'the expedition post' }

/** A story place in a line: "the Fields", "the forest", "the Pond at night". */
export function placeWords(place: string): string {
  return BACKDROPS[place] ?? PLACE_WORDS[place] ?? (farmPlace(place) ? `the ${farmPlace(place)!.name}` : place.replaceAll('-', ' '))
}

/** Where her next event plays: her bible's beat for the rung, in words; null without one, and for the wedding, whose place
 * you choose (F53 decision 9). */
export function beatPlace(pack: Pick<StoryPack, 'bibles'>, id: string, rung: string | null): string | null {
  const beat = rung && rung !== 'wedding' ? pack.bibles.get(id)?.route.find((b) => b.id === rung) : undefined
  return beat ? placeWords(beat.place) : null
}

// --- The row's bar (decision 4) ---------------------------------------------------------------------------------------

/** One heart of her ladder on the row's bar. */
export interface Segment {
  state: 'full' | 'filling' | 'empty'
  /** The filling heart's points over its cost, 0–1; 1 full, 0 empty. */
  share: number
}
/** The row's bar: the ladder's hearts as segments in the stage's colour, and a waiting rung's mark. */
export interface HeartBar {
  ladder: LadderName
  colour: string
  segments: Segment[]
  /** A waiting rung's mark: ◆ her confession, ◇ the proposal and the wedding. */
  mark: '◆' | '◇' | null
  /** "Ready" or "Tomorrow" beside the mark. */
  markWords: string | null
}
/** Ten hearts for friendship and romance, five for a spouse. */
export const LADDER_HEARTS: Readonly<Record<LadderName, number>> = { friendship: 10, romance: 10, spouse: 5 }

/** Her ladder's hearts (decision 4): the levels played full, the next one filling by points over its cost, the rest empty;
 * while a waiting rung waits, every heart full and its mark with "Tomorrow" or "Ready". */
export function heartBar(love: Pick<Love, 'stage' | 'level' | 'points'>, state: Pick<Readiness, 'ready' | 'waits'>): HeartBar {
  const ladder = ladderOf(love.stage)
  const count = LADDER_HEARTS[ladder]
  const now = bar(love)
  const waiting = now.rung !== null && WAITING_RUNGS.includes(now.rung)
  const played = waiting || now.rung === null ? count : Math.min(count, love.level)
  const share = waiting || now.rung === null ? 0 : now.cost > 0 ? Math.min(1, now.points / now.cost) : 0
  const segments = Array.from({ length: count }, (_, i): Segment => (i < played ? { state: 'full', share: 1 } : i === played ? { state: 'filling', share } : { state: 'empty', share: 0 }))
  return {
    ladder, colour: LADDER_COLOURS[ladder], segments,
    mark: !waiting ? null : now.rung === 'confession' ? '◆' : '◇',
    markWords: !waiting ? null : state.ready ? 'Ready' : state.waits?.kind === 'day' ? 'Tomorrow' : null,
  }
}

/** Her level for the Work view's card corner (decision 8): "F7", "R4", "S2"; none before Friendship 1. */
export function levelShort(love: Pick<Love, 'stage' | 'level'>): string | null {
  switch (love.stage) {
    case 'friendship': return love.level > 0 ? `F${love.level}` : null
    case 'confession': return 'F10'
    case 'romance': return `R${love.level}`
    case 'proposal': case 'wedding': return 'R10'
    case 'spouse': return `S${love.level}`
  }
}

// --- The rows, the sort and the filters (decisions 4 and 5) ------------------------------------------------------------

export type HeartFilter = 'ready' | 'friends' | 'partners' | 'married' | 'away'
/** The filter chips (RM52), in order. */
export const HEART_FILTERS: readonly { key: HeartFilter; label: string }[] = [
  { key: 'ready', label: 'Ready' }, { key: 'friends', label: 'Friends' }, { key: 'partners', label: 'Partners' }, { key: 'married', label: 'Married' }, { key: 'away', label: 'Away' },
]
export const isHeartFilter = (value: string | null): value is HeartFilter => HEART_FILTERS.some((f) => f.key === value)
/** Friends: friendship and her confession's wait; Partners: romance, the proposal's and the wedding's; Married: spouse. */
const STAGE_FILTER: Readonly<Record<LoveStage, HeartFilter>> = {
  friendship: 'friends', confession: 'friends', romance: 'partners', proposal: 'partners', wedding: 'partners', spouse: 'married',
}

export interface HeartRow {
  id: string
  name: string
  /** "Friend · F7", "Partner · R4", "Engaged" (F47's `levelWords`). */
  level: string
  stage: LoveStage
  bar: Bar
  heart: HeartBar
  state: Readiness
  home: boolean
  /** Today's invitation from her (F50 fills `today.invites`). */
  invited: boolean
  chatted: boolean
  gifted: boolean
  /** The most useful line under the bar: her Ready rung and its place, what her setup needs, "Swap her home to play her
   * events", "Her story is still being written"; null when her bar says it all. */
  note: string | null
  filters: readonly HeartFilter[]
  /** Her next rung's place on the route (28 once complete): the sort's least progress. */
  progress: number
  points: number
  /** Her place in the cast's order. */
  order: number
}

/** The line under her bar (decision 4). */
export function rowNote(state: Readiness, now: Pick<Bar, 'points' | 'cost'>, home: boolean, place: string | null, nameOf: NameOf): string | null {
  if (state.ready) return `Ready · ${rungName(state.rung!)}${place ? ` · ${place}` : ''}`
  const kind = state.waits!.kind
  if (kind === 'away' || (!home && kind === 'bar')) return 'Swap her home to play her events'
  if (kind === 'bar') return null
  return readyWords(state, now, nameOf)
}

/** Her place along the route: the domain's (F51), read here for the sort and the perks. */
export { routeIndex }

/** The sort (decision 4): Ready first, then the least progress (her rung along the route, then her points), then the cast's
 * order. */
export const heartOrder = (a: Pick<HeartRow, 'id' | 'state' | 'progress' | 'points' | 'order'>, b: Pick<HeartRow, 'id' | 'state' | 'progress' | 'points' | 'order'>): number =>
  Number(b.state.ready) - Number(a.state.ready) || a.progress - b.progress || a.points - b.points || a.order - b.order || a.id.localeCompare(b.id)

/** Everyone on the farm's roster, home or away, as the tab's rows, sorted. */
export function heartRows(save: SaveV4, pack: HeartsPack, nameOf: NameOf): HeartRow[] {
  const cast = castOrder(pack)
  return Object.keys(save.roster).flatMap((id): HeartRow[] => {
    const love = save.love[id]
    if (!love) return []
    const state = readiness(save, pack, id)
    const now = bar(love)
    const home = save.dorm.home.includes(id)
    const order = cast.indexOf(id)
    return [{
      id, name: nameOf(id), level: levelWords(love), stage: love.stage, bar: now, heart: heartBar(love, state), state, home,
      invited: invitedNow(save, id), chatted: save.today.chats.includes(id), gifted: save.today.gifts.includes(id),
      note: rowNote(state, now, home, state.ready ? beatPlace(pack, id, state.rung) : null, nameOf),
      filters: [...(state.ready ? ['ready' as const] : []), STAGE_FILTER[love.stage], ...(home ? [] : ['away' as const])],
      progress: routeIndex(love), points: love.points, order: order < 0 ? cast.length : order,
    }]
  }).sort(heartOrder)
}

/** Each filter's count, for its chip ("Ready 2"). */
export function filterCounts(rows: readonly Pick<HeartRow, 'filters'>[]): Record<HeartFilter, number> {
  const counts: Record<HeartFilter, number> = { ready: 0, friends: 0, partners: 0, married: 0, away: 0 }
  for (const row of rows) for (const f of row.filters) counts[f]++
  return counts
}

/** The header (decision 5): "Married n/N", N the cast's size (20 on the real pack, 3 on the stand-in). */
export function marriedOf(save: Pick<SaveV4, 'love'>, pack: Pick<StoryPack, 'cast'>): { married: number; cast: number } {
  return { married: Object.values(save.love).filter((l) => l.stage === 'spouse').length, cast: pack.cast.umas.length }
}

// --- Ready, live (decisions 9 and 10) ---------------------------------------------------------------------------------

/** A Ready line for the morning: her, her rung and where it plays. */
export interface ReadyLine {
  id: string
  rung: string
  place: string | null
}

/** Who's Ready today, in the tab's order (decision 9): read live, never stored. */
export function readyLines(save: SaveV4, pack: HeartsPack): ReadyLine[] {
  const cast = castOrder(pack)
  return Object.keys(save.roster).flatMap((id) => {
    const love = save.love[id]
    if (!love) return []
    const state = readiness(save, pack, id)
    if (!state.ready) return []
    const order = cast.indexOf(id)
    return [{ id, rung: state.rung!, place: beatPlace(pack, id, state.rung), state, progress: routeIndex(love), points: love.points, order: order < 0 ? cast.length : order }]
  }).sort(heartOrder).map(({ id, rung, place }) => ({ id, rung, place }))
}

/** The Umas whose pip carries ♥ on the map (decision 10). */
export const readyIds = (save: SaveV4, pack: HeartsPack): ReadonlySet<string> => new Set(readyLines(save, pack).map((l) => l.id))

// --- Her profile (decision 6) -----------------------------------------------------------------------------------------

/** The ladder a rung is on: her confession friendship's, the proposal and the wedding romance's. */
export const rungLadder = (rung: string): LadderName => (rung.startsWith('f') || rung === 'confession' ? 'friendship' : /^s\d/.test(rung) ? 'spouse' : 'romance')

/** One step of the route as one track: F1–F10, ◆, R1–R10, ◇, ◇, S1–S5. */
export interface TrackCell {
  rung: string
  ladder: LadderName
  colour: string
  /** A waiting rung, drawn as its mark. */
  wait: boolean
  state: 'played' | 'next' | 'ahead'
  /** The next one's fill, 0–1. */
  share: number
  label: string
}

/** The route as one track (decision 6): played rungs filled in their ladder's colour, the next filling, the rest empty. */
export function routeTrack(love: Pick<Love, 'stage' | 'level' | 'points'>): TrackCell[] {
  const now = bar(love)
  const next = now.rung === null ? ROUTE_RUNGS.length : ROUTE_RUNGS.indexOf(now.rung)
  return ROUTE_RUNGS.map((rung, i): TrackCell => {
    const ladder = rungLadder(rung)
    const state = i < next ? 'played' : i === next ? 'next' : 'ahead'
    const share = state === 'played' ? 1 : state === 'next' ? (now.cost > 0 ? Math.min(1, now.points / now.cost) : 1) : 0
    return { rung, ladder, colour: LADDER_COLOURS[ladder], wait: WAITING_RUNGS.includes(rung), state, share, label: rungName(rung) }
  })
}

/** Her Next card (decision 6): the rung, its perk, its place and setup (her bible's `hint`, D43), the bar and what's
 * banked, and what it waits for. */
export interface NextCard {
  rung: string | null
  /** "Next: Romance 5", or "Her route is complete". */
  title: string
  perk: Perk | null
  hint: string | null
  bar: Bar
  /** F47's waits in words: "Ready", "Tomorrow", "Needs a ring", "Swap her home", "Opens with chapter 3". */
  words: string
  ready: boolean
  waits: Wait['kind'] | null
}

export function nextCard(save: SaveV4, pack: HeartsPack, id: string, nameOf: NameOf): NextCard {
  const love = save.love[id]!
  const state = readiness(save, pack, id)
  const now = bar(love)
  const line = perkLineOf(pack, id)
  const perk = now.rung && line ? perksFor(line, save.farm.chapter).find((p) => p.rung === now.rung) ?? null : null
  const hint = now.rung && state.waits?.kind !== 'unwritten' ? pack.bibles.get(id)?.route.find((b) => b.id === now.rung)?.hint ?? null : null
  return {
    rung: now.rung, title: now.rung ? `Next: ${rungName(now.rung)}` : 'Her route is complete', perk, hint, bar: now, words: nextWords(state, now, nameOf),
    ready: state.ready, waits: state.waits?.kind ?? null,
  }
}

/** A perk on her profile's list: reached ✓, the next, the rest greyed (RM53); a reached one with what it does now (F51). */
export interface PerkView extends Perk {
  state: 'reached' | 'next' | 'ahead'
  /** What it does now, in words (F51 decision 12), for a reached perk with a live effect; null otherwise. */
  now: string | null
}

const percent = (share: number): string => `${Math.round(share * 1000) / 10}%`
/** The perks a later one replaces on the list: F3's +10% shows its now on R5's row once R5 is reached, and so on. */
const SUPERSEDED: Partial<Record<PerkId, PerkId>> = { 'line-10': 'line-20', 'night-chore': 'night-chore-2', 'night-chore-2': 'night-chore-3', 'morning-item': 'morning-item-2' }

/**
 * What a reached perk does now (F51 decision 12), or null when its words say it all: her line's term ("+28% at the forest ·
 * +8% ring", a farmer's "+20% chance of an extra crop", with the crew's and a cap held), her night chores ("2 items each
 * night", "+0.5 growth each night", "None while she's away"), her morning items ("Next in 3 mornings"), her signature dish
 * ("Bell Pepper Salad · in the Kitchen's list"), in her element ("Beside Stand-in 2"), her keepsake ("Bent Trowel · +0.25
 * quality at the Fields"), her pet name and her closest friend.
 */
export function perkNow(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>, id: string, perk: Pick<Perk, 'id' | 'opens'>, nameOf: NameOf): string | null {
  const love = save.love[id]
  const line = perkLineOf(pack, id)
  if (!love || !line || perk.opens !== null) return null
  const superseded = SUPERSEDED[perk.id]
  if (superseded && perksFor(line, save.farm.chapter).some((p) => p.id === superseded && hasPerk(love, p.rung))) return null
  const place = linePlaces(pack, id)[0]
  switch (perk.id) {
    case 'line-10': case 'line-20': {
      if (!place) return null
      const t = romanceTerms(save, pack, id, place)
      const own = line === 'farming' ? `+${percent(t.total)} chance of an extra crop` : `+${percent(t.total)} at ${PERK_PLACE[line]}`
      return [own, ...(t.ring > 0 ? [`+${percent(t.ring)} ring`] : []), ...(t.crew > 0 ? [`+${percent(t.crew)} crew`] : []), ...(t.held ? ['held to its cap'] : [])].join(' · ')
    }
    case 'night-chore': case 'night-chore-2': case 'night-chore-3': {
      const n = choresTonight(save, pack, id)
      if (n === 0) return homeOrHoused(save, id) ? null : 'None while she’s away'
      return line === 'farming' ? `+${n * 0.25} growth each night` : `${n} item${n === 1 ? '' : 's'} each night`
    }
    case 'morning-item': case 'morning-item-2': {
      const rule = morningRule(love)
      if (!rule) return null
      if (!homeOrHoused(save, id)) return 'None while she’s away'
      // This morning's is already in (or not, had she been away): the next is a whole count away.
      const left = morningsToItem(rule, save.calendar.day) || rule.every
      return left === 1 ? 'Next tomorrow' : `Next in ${left} mornings`
    }
    case 'signature-dish': return love.dish ? `${dishName(love.dish)} · in the Kitchen’s list` : null
    case 'in-element': {
      const partners = tiesOf(pack, save, id).filter((t) => save.roster[t.with] && bondHearts(t.points) >= SIDE_BY_SIDE_HEARTS).map((t) => nameOf(t.with))
      return partners.length > 0 ? `Beside ${partners.slice(0, 2).join(' or ')}` : 'No 3-heart friend yet'
    }
    case 'keepsake': {
      const name = pack.bibles.get(id)?.keepsake?.name ?? 'Her keepsake'
      const quality = place ? keepsakeQuality(save, pack, id, place) : 0
      return quality > 0 ? `${name} · +${quality} quality at ${PERK_PLACE[line]}` : name
    }
    case 'dates': {
      const pet = pack.bibles.get(id)?.petName
      return pet ? `She calls you “${pet}”` : null
    }
    case 'closest-bond': {
      const friend = closestFriend(pack, save, id)
      return friend ? `With ${nameOf(friend)}` : null
    }
    case 'engraving': {
      const words = engravingOf(pack, id)
      return words ? `“${words}”` : null
    }
    default: return null
  }
}

// --- Her ring (F53 decisions 6 and 7; RM39) ---------------------------------------------------------------------------

/** Her ring's engraving (decision 7): her Romance 8 beat's line, her Memory's caption, so no new field. */
export const engravingOf = (pack: Pick<StoryPack, 'bibles'>, id: string): string | null => pack.bibles.get(id)?.route.find((b) => b.id === 'r8')?.beat ?? null

/** Her profile's Ring (decisions 6 and 7): the engraving from Romance 8 ("Her ring will read", then "Her ring reads"), her
 * ring and its bonus at her line (once married, or "once you're married"), and the rings in the Warehouse she'd take
 * instead. Null before Romance 8. */
export interface RingView {
  engraving: string | null
  /** "Her ring will read" before the proposal, "Her ring reads" after. */
  reads: string
  ring: { grade: number; name: string; bonus: string } | null
  better: { id: string; name: string; bonus: string }[]
  /** The bench, for "Needs a ring" before the proposal: whether it stands. */
  bench: boolean
}
export function ringView(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): RingView | null {
  const love = save.love[id]
  if (!love || !hasPerk(love, 'r8')) return null
  const place = PERK_PLACE[perkLineOf(pack, id) ?? 'farming']
  const married = love.stage === 'spouse'
  const bonus = (grade: number) => `+${ringPercent(grade)}% at ${place}${married ? '' : ' once you’re married'}`
  return {
    engraving: engravingOf(pack, id),
    reads: love.ring === undefined ? 'Her ring will read' : 'Her ring reads',
    ring: love.ring === undefined ? null : { grade: love.ring, name: ringName(love.ring), bonus: bonus(love.ring) },
    better: betterRings(save, id).map((r) => ({ id: r, name: goodName(r), bonus: `+${ringPercent(ringGrade(r))}%` })),
    bench: benchOpen(save),
  }
}

/** Every perk on her route for her line (decision 7), each reached, the next or ahead; a reached one with what it does now
 * when `nameOf` is given (F51). */
export function perkList(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles' | 'ties'>, id: string, nameOf: NameOf | null = null): PerkView[] {
  const love = save.love[id]
  const line = perkLineOf(pack, id)
  if (!love || !line) return []
  const next = routeIndex(love)
  let named = false
  return perksFor(line, save.farm.chapter).map((perk): PerkView => {
    if (ROUTE_RUNGS.indexOf(perk.rung) < next) return { ...perk, state: 'reached', now: nameOf ? perkNow(save, pack, id, perk, nameOf) : null }
    if (named) return { ...perk, state: 'ahead', now: null }
    named = true
    return { ...perk, state: 'next', now: null }
  })
}

/** Her closest friend's loved gift (F51 decision 12; RM31's F7): from Friendship 7, the friend's loved good when her bible
 * names one that's in the game. */
export function friendLoved(save: SaveV4, pack: Pick<StoryPack, 'bibles' | 'ties'>, id: string): { friend: string; good: string } | null {
  if (!hasPerk(save.love[id], 'f7')) return null
  const friend = closestFriend(pack, save, id)
  const good = friend ? pack.bibles.get(friend)?.gifts.loved : undefined
  return friend && good && isGoodId(good) ? { friend, good } : null
}

/** What she's given you that stays on her profile (F51 decision 12): her pet name for you from Romance 1, her keepsake from
 * Friendship 10 (its name and her line about it, generic without a bible's), grown from Spouse 5. */
export interface FromHer {
  petName: string | null
  keepsake: { name: string; line: string | null; quality: number; place: string } | null
}
export function fromHer(save: SaveV4, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): FromHer {
  const love = save.love[id]
  const line = perkLineOf(pack, id)
  const bible = pack.bibles.get(id)
  const keepsake = hasPerk(love, 'f10') && line
    ? { name: bible?.keepsake?.name ?? 'Her keepsake', line: bible?.keepsake?.line ?? null, quality: hasPerk(love, 's5') ? KEEPSAKE_GROWN : KEEPSAKE_QUALITY, place: PERK_PLACE[line] }
    : null
  return { petName: hasPerk(love, 'r1') ? bible?.petName ?? null : null, keepsake }
}

/** A good in words, for the friend's loved gift. */
export const lovedWords = (friend: string, good: string, nameOf: NameOf): string => `${nameOf(friend)} loves ${goodName(good)}`

/** The reached perks by ladder: "F1–F10 ✓ · R1–R4 ✓"; null before the first. */
export function reachedWords(list: readonly Pick<PerkView, 'rung' | 'state'>[]): string | null {
  const parts = ['f', 'r', 's'].flatMap((letter) => {
    const reached = list.filter((p) => p.state === 'reached' && p.rung.startsWith(letter))
    if (reached.length === 0) return []
    const first = reached[0]!.rung.toUpperCase()
    const last = reached.at(-1)!.rung.toUpperCase()
    return [first === last ? `${first} ✓` : `${first}–${last} ✓`]
  })
  return parts.length > 0 ? parts.join(' · ') : null
}

/** A gift slot (RM15): her loved, liked and disliked goods, each as learnt ("?" until then), with its points at ★1. */
export interface GiftSlot {
  taste: 'loved' | 'liked' | 'disliked'
  /** The good, or null while her taste for it isn't known. */
  good: string | null
  points: number
}
/** Her gifts (decision 6): her loved good from Friendship 1, the others once given, all from Friendship 7, and "Others
 * +10". No bible: no slots, every gift +10. A slot whose good isn't in the game yet is left out. */
export function giftSlots(pack: Pick<StoryPack, 'bibles'>, love: Pick<Love, 'stage' | 'level' | 'known'>, id: string): { slots: GiftSlot[]; others: number } {
  const gifts = pack.bibles.get(id)?.gifts
  const others = GIFT_POINTS_V4.neutral
  if (!gifts) return { slots: [], others }
  const slot = (taste: GiftSlot['taste'], good: string): GiftSlot[] =>
    isGoodId(good) ? [{ taste, good: tasteKnown(pack, love, id, good) ? good : null, points: GIFT_POINTS_V4[taste] }] : []
  return { slots: [...slot('loved', gifts.loved), ...gifts.liked.flatMap((g) => slot('liked', g)), ...gifts.disliked.flatMap((g) => slot('disliked', g))], others }
}

/** A tie's kind in a word. */
export const TIE_WORDS: Readonly<Record<Tie['kind'], string>> = {
  friends: 'Friends', rivals: 'Rivals', mentor: 'Mentor', teammates: 'Teammates', sisters: 'Sisters', other: 'Close',
}
/** One of her ties on her profile (decision 6; F52 decision 11): the other Uma, its kind, their bond hearts from
 * `save.bonds` and the points to the next, her closest friend marked, and the conversations opened and unread. */
export interface TieRow {
  with: string
  kind: Tie['kind']
  words: string
  strength: Tie['strength']
  points: number
  /** CS44's bond hearts, 0–5 (`bondHearts`). */
  hearts: number
  /** The points the next heart comes at, or null at five. */
  next: number | null
  /** On the farm; else "Not here yet". */
  here: boolean
  /** Her place in `ties.json`, the last tie-break. */
  order: number
  /** Her closest friend (RM49): the first row. */
  closest: boolean
  /** Their authored conversations opened and not read yet, lowest first: **Read** plays them (F52 decision 9). */
  unread: number[]
}

/**
 * Her ties from the pack (decision 6), in `tiesOf`'s order, the one `closestFriend` reads: the strongest, then the most
 * bond points, then the ties' order, her closest friend first. The hearts are `bondHearts` of today's `save.bonds`, so they
 * move as bonds grow (F52); a pair's conversations opened and unread show **Read**.
 */
export function tieRows(save: Pick<SaveV4, 'bonds' | 'roster' | 'diary'>, pack: Pick<StoryPack, 'ties' | 'pairs'>, id: string): TieRow[] {
  return tiesOf(pack, save, id).map(({ tie, with: other, points, order }, i): TieRow => {
    const here = Boolean(save.roster[other])
    return {
      with: other, kind: tie.kind, words: TIE_WORDS[tie.kind], strength: tie.strength, points, hearts: bondHearts(points), next: nextBondHeart(points), here, order,
      closest: i === 0, unread: here && save.roster[id] ? unreadLevels(save, pack, id, other) : [],
    }
  })
}

// --- Pairs in words: the morning and the Diary (F52 decisions 9 and 11) ------------------------------------------------

/** `?read=<a>-<b>:<levels>`: the pair player's param, the levels in order ("9000001-9000002:1,2"). */
export const readParam = (a: string, b: string, levels: readonly number[]): string => `${pairName(a, b)}:${levels.join(',')}`
/** The pair and levels a `?read=` names, or null. */
export function parseReadParam(value: string | null): { a: string; b: string; levels: number[] } | null {
  const m = value ? /^(\d{1,12})-(\d{1,12}):([1-5](?:,[1-5]){0,4})$/.exec(value) : null
  if (!m || m[1] === m[2]) return null
  const levels = [...new Set(m[3]!.split(',').map(Number))]
  return { a: m[1]!, b: m[2]!, levels }
}

/** What the morning's bond lines read beyond the summary: the pack's conversations and the save's reads. */
export interface PairWords {
  /** The authored levels opened and unread, up to `hearts`. */
  unread(a: string, b: string, hearts: number): number[]
  /** Whether the pack holds any of the pair's conversations. */
  authored(a: string, b: string): boolean
  /** Their tie's line, or null for a pair the ties don't hold. */
  tieLine(a: string, b: string): string | null
}
export function pairWords(save: Pick<SaveV4, 'bonds' | 'diary'>, pack: Pick<StoryPack, 'ties' | 'pairs'>): PairWords {
  return {
    unread: (a, b, hearts) => unreadLevels(save, pack, a, b, hearts),
    authored: (a, b) => pairLevels(pack, a, b).size > 0,
    tieLine: (a, b) => pack.ties.ties.find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a))?.line ?? null,
  }
}

/** One pair in the Diary's Conversations: its hearts and its conversations, read (replayable) or opened and unread. */
export interface ConversationRow {
  a: string
  b: string
  hearts: number
  points: number
  read: number[]
  unread: number[]
  /** The tie's line, for a pair with no conversation written. */
  line: string | null
}
/** The Diary's Conversations (decision 11): every pair with a heart, the most hearts first, then the most points, then the
 * cast's order. */
export function conversationRows(save: Pick<SaveV4, 'bonds' | 'diary' | 'roster'>, pack: Pick<StoryPack, 'cast' | 'ties' | 'pairs'>): ConversationRow[] {
  const order = castOrder(pack)
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const words = pairWords(save, pack)
  return Object.keys(save.bonds).flatMap((key): ConversationRow[] => {
    const [a, b] = pairOf(key)
    const points = bondOf(save, a, b)
    const hearts = bondHearts(points)
    if (hearts === 0 || !save.roster[a] || !save.roster[b]) return []
    return [{ a, b, hearts, points, read: readLevels(save, a, b), unread: unreadLevels(save, pack, a, b), line: words.authored(a, b) ? null : words.tieLine(a, b) }]
  }).sort((x, y) => y.hearts - x.hearts || y.points - x.points || Math.min(rank(x.a), rank(x.b)) - Math.min(rank(y.a), rank(y.b))
    || Math.max(rank(x.a), rank(x.b)) - Math.max(rank(y.a), rank(y.b)))
}

/** Her line, birthday and house under her name (RM53): "Farming · ★ Spring 4 · Rose Cottage". */
export function profileLine(save: Pick<SaveV4, 'love' | 'homestead'>, pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string, birthdays: Birthdays): string[] {
  const line = favouriteOf(pack, id)
  const birthday = birthdays.get(id)
  const house = save.love[id]?.house
  const named = house === undefined ? undefined : save.homestead.houses[house]?.name
  return [
    ...(line ? [ACTIVITY_NAMES[line]] : []),
    ...(birthday !== undefined ? [`★ ${SEASON_NAMES[dateOf(birthday).season]} ${dateOf(birthday).day}`] : []),
    ...(named ? [named] : []),
  ]
}

/** Her Memories' count (RM56): one a rung with an event, 26 in all (S2 and S4 have none). */
export const MEMORY_RUNGS = ROUTE_RUNGS.length - 2
