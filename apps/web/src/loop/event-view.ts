// Heart events as the screens say them: the place
// card's backdrop and tint, the emote bubble beside her bust, the event's title, each choice's gain on its button, the
// plays' words, the level-up card's lines, the stage-up screen's list, a setup's advice and her Memories' album. Pure, so
// the player and the tests read the same. Loaded on demand with the player.
import {
  CAKE_DAYS, captionOf, dateOf, EVENING_GRADE_POINTS, EVENT_GRADE_POINTS, farmPlace, GRADE_NAMES, gradeOf, goodName, nextHousehold, nextRung, PERK_PLACE, perkWords, ROUTE_RUNGS,
  ringName, ringPercent, rungName, NIGHT_RUNGS, SEASON_NAMES,
  type Emote, type EventCard, type Grade, type OptionView, type PerkId, type PerkLine, type PlayKind, type PlayLength, type SaveV4, type Season, type StageUp,
  type StoryPack, type Wait, type WeddingCard,
} from '@farm/domain'
import { placeWords } from './hearts-view'
import { WORK_PLACE } from './love-words'

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

// --- The place card --------------------------------------------------------------------------------

/** Her emote as uma-art's bubble beside her bust, until expression art exists. */
export const EMOTE_BUBBLE: Readonly<Record<Emote, string>> = {
  happy: 'emote/music', laughing: 'emote/music', shy: 'emote/sweat', sad: 'emote/ellipsis', angry: 'emote/anger', surprised: 'emote/exclaim',
  thinking: 'emote/question', tender: 'emote/heart',
}

/** The nine romance backdrops (W5), each on a borrowed building frame with its own tint (the worker's). */
export const BACKDROPS: Readonly<Record<string, { frame: string; tint: string; night?: true }>> = {
  'pond-night': { frame: 'fishery', tint: '#33456f', night: true },
  overlook: { frame: 'observatory', tint: '#f0c493' },
  'orchard-bench': { frame: 'orchard', tint: '#f3dca6' },
  'dorm-porch': { frame: 'dorm', tint: '#ebc79f' },
  'harbour-wall': { frame: 'warehouse', tint: '#bcd6e2' },
  'chapel-bell': { frame: 'cleric-chapel', tint: '#f5e6bd' },
  town: { frame: 'exchange', tint: '#f0d4b2' },
  'hilltop-track': { frame: 'racecourse', tint: '#d2e7b7' },
  'sea-pier': { frame: 'fishery-workbench', tint: '#9fc6de' },
}
/** A farm place's ground by the season. */
export const SEASON_GROUND: Readonly<Record<Season, string>> = { spring: '#dcefc7', summer: '#f6e7b0', autumn: '#f2d3b0', winter: '#e3ebf3' }

export interface PlaceCard {
  place: string
  /** The uma-art building frame it draws. */
  frame: string
  /** The ground's colour: the season's for a farm place, the backdrop's own tint. */
  ground: string
  night: boolean
}

/** A place's card: a farm place's map frame on the season's ground, a backdrop's borrowed frame and tint. */
export function placeCard(place: string, day: number): PlaceCard {
  const backdrop = BACKDROPS[place]
  if (backdrop) return { place, frame: backdrop.frame, ground: backdrop.tint, night: backdrop.night ?? false }
  return { place, frame: farmPlace(place)?.frame ?? 'fields', ground: SEASON_GROUND[dateOf(day).season], night: false }
}

/** The player's title: "The Fields · Friendship 1", "The Pond at night · Romance 5". */
export const eventTitle = (place: string | null, rung: string): string => (place ? `${cap(placeWords(place))} · ${rungName(rung)}` : rungName(rung))

// --- Choices ----------------------------------------------------------------------------------------------

const TASTE_WORD = { loved: 'a love', liked: 'a like', neutral: 'a taste', disliked: 'a dislike' } as const

/** An option's button: "+30" or "+10", then its cost ("· 1 Basil") or the taste it reveals ("· learns a like"), and
 * "Need 1 Basil" in place of the cost when you're short. */
export function optionWords(view: OptionView): { gain: string; extra: string | null; need: string | null } {
  const cost = view.gives ? `${view.gives.count} ${goodName(view.gives.good)}` : null
  return {
    gain: `+${view.points}`,
    extra: cost && !view.short ? `· ${cost}` : view.reveals ? `· learns ${TASTE_WORD[view.reveals]}` : null,
    need: cost && view.short ? `Need ${cost}` : null,
  }
}

// --- The plays --------------------------------------------------------------------------------------------

const COUNT_WORDS = ['', 'one', 'two', 'three', 'four'] as const
/** A play's title: "Together: one cast", "Together: three rounds". */
export function playTitle(kind: PlayKind, length: PlayLength): string {
  const evening = length === 'evening'
  switch (kind) {
    case 'cast': return `Together: ${evening ? 'three casts' : 'one cast'}`
    case 'pick': return `Together: ${evening ? 'three rounds' : 'one round'} of picking`
    case 'rhythm': return `Together: ${evening ? 'three rounds' : 'one round'} on her beat`
    case 'walk': return `Together: a walk, ${COUNT_WORDS[evening ? 4 : 2]} forks`
    case 'choose': return 'Together: pick one for her'
  }
}
/** What to aim for, shown first (the play's seed). */
export const PLAY_HOW: Readonly<Record<PlayKind, string>> = {
  cast: 'Tap as the ring meets the mark. Every cast lands a fish.',
  pick: 'Tap the starred ones, her favourites, as they show. Leave the rest.',
  rhythm: 'Watch her beat first, then tap on it, eight times.',
  walk: 'At each fork, take the turn toward the place she loves.',
  choose: 'Pick the one she’d like best.',
}
/** The grades and what each pays, under the play: the length's own, or an evening's with her factors. */
export function gradeLegend(length: PlayLength, own?: Readonly<Record<Grade, number>>): string {
  const pays = own ?? (length === 'event' ? EVENT_GRADE_POINTS : EVENING_GRADE_POINTS)
  return (['fine', 'great', 'perfect'] as const).map((g) => `${GRADE_NAMES[g]} +${pays[g]}`).join(' · ')
}
/** A play's result: "Great · +15". */
export const gradeWords = (score: number, length: PlayLength = 'event'): string =>
  `${GRADE_NAMES[gradeOf(score)]} · +${(length === 'event' ? EVENT_GRADE_POINTS : EVENING_GRADE_POINTS)[gradeOf(score)]}`

// --- The level-up card ------------------------------------------------------------------------------------

/** The sum: "+50 event · +30 choice · +15 Great = +95 toward Friendship 2 (+40 banked)". */
export function sumWords(card: EventCard): string {
  // A night level has no event; her 600 filled.
  if (card.night) return `Her bar filled overnight: no event, the level comes by itself${card.next ? ` · now toward ${rungName(card.next.rung)}` : ''}`
  const choices = card.choices.reduce((a, b) => a + b, 0)
  const parts = [
    `+${card.event} event`,
    ...(card.choices.length > 0 ? [`+${choices} ${card.choices.length === 1 ? 'choice' : 'choices'}`] : []),
    ...card.plays.map((p) => `+${p.points} ${GRADE_NAMES[p.grade]}`),
    ...(card.chosen ? [`+${card.chosen.points} ${GRADE_NAMES[card.chosen.grade]}`] : []),
  ]
  const factor = card.paid !== card.sum && card.sum > 0 ? ` (×${Math.round((card.paid / card.sum) * 10) / 10} anniversary)` : ''
  const toward = card.answer === 'not-yet' ? ', banked for Romance 1' : card.next ? ` toward ${rungName(card.next.rung)}` : ''
  const banked = card.carried > 0 && card.answer !== 'not-yet' ? ` (+${card.carried.toLocaleString('en-US')} banked)` : ''
  return `${parts.join(' · ')} = +${card.paid}${factor}${toward}${banked}`
}

/** An unlock in words: an item into the Warehouse, a place, a perk line. */
export function unlockWords(card: EventCard): string | null {
  const u = card.unlock
  if (!u) return null
  if (u.kind === 'item') return `${goodName(u.good)} · in the Warehouse`
  if (u.kind === 'place') return `New place · ${placeWords(u.place)}`
  return u.perk
}

/** A perk in her line's words, or null. */
export const perkLineWords = (perk: PerkId | null, line: PerkLine | null): string | null => (perk && line ? perkWords(perk, line) : null)

// --- The stage-up screen ---------------------------------------------------------------------------------

/** The facts a stage-up screen lists beyond the ladder: her ring's grade and her wedding's day; her room's house
 * (its name, or null when none was free). */
export interface StageFacts { ring?: number | null; wed?: number | null; house?: string | null }

/** What a stage opens, for its stage-up screen: the ladder, then each perk that opens a kind or a chat set, by rung; the
 * proposal's wedding and ring; the wedding's spouse ladder, ring, evenings and anniversary. */
export function stageOpens(stage: StageUp, line: PerkLine | null, facts: StageFacts = {}): string[] {
  const at = (rung: string, words: string) => `${rung.toUpperCase()} · ${words}`
  const perk = (rung: string, id: PerkId) => at(rung, line ? perkWords(id, line) : perkWords(id, 'farming'))
  const place = PERK_PLACE[line ?? 'farming']
  const ring = facts.ring ?? null
  switch (stage) {
    case 'romance': return [
      'The romance ladder, Romance 1–10',
      perk('r1', 'dates'),
      at('r1', 'Her partner chats'),
      perk('r3', 'date-stargazing'),
      perk('r6', 'date-dance-boat'),
      perk('r9', 'date-footrace'),
    ]
    case 'engaged': return [
      'Your wedding: tomorrow, whenever you’re ready',
      ...(ring ? [`Her ring: ${ringName(ring)} · +${ringPercent(ring)}% at ${place} once you’re married`] : []),
      'A better ring any day, from her profile',
    ]
    case 'married': {
      const wed = facts.wed ?? null
      const date = wed !== null ? dateOf(wed) : null
      return [
        'The spouse ladder, Spouse 1–5',
        ...(ring ? [`Her ring: +${ringPercent(ring)}% at ${place}`] : []),
        'Evenings: every kind her ladders opened',
        perk('s1', 'breakfast'),
        ...(date ? [`Your anniversary: ${SEASON_NAMES[date.season]} ${date.day}, each year`] : []),
        // Her room, and the house's mornings.
        ...(facts.house !== undefined ? [facts.house === null ? 'Her room: none free yet, so she keeps her Dorm bed until a house is built' : `Her room: ${facts.house}`] : []),
        ...(facts.house !== undefined ? ['House mornings: +30 for her each morning you sleep there'] : []),
      ]
    }
  }
}

/** A stage-up screen's title and line. */
export const STAGE_WORDS: Readonly<Record<StageUp, { title: string; line: string }>> = {
  romance: { title: 'Partners', line: 'Romance opens. Her bar turns rose.' },
  engaged: { title: 'Engaged', line: 'A ring, and a yes. Your wedding comes next.' },
  married: { title: 'Married', line: 'Your wedding is done. Her bar turns gold.' },
}

/** The line under the Married screen: "Married 1/20 · next household scene at 5"; on a milestone's own wedding,
 * what opens tomorrow: "Married 5/20 · household scene 1 tomorrow", "Married 20/20 · the Great Harvest tomorrow". */
export function marriedWords(married: number, cast: number): string {
  const scene = [5, 10, 15].indexOf(married)
  if (scene >= 0) return `Married ${married}/${cast} · household scene ${scene + 1} tomorrow`
  if (married === 20) return `Married ${married}/${cast} · the Great Harvest tomorrow`
  const next = nextHousehold(married)
  return `Married ${married}/${cast}${next === null ? '' : next >= 20 ? ` · the finale at ${next}` : ` · next household scene at ${next}`}`
}

// --- The wedding --------------------------------------------------------------------------------------

/** The guests' line of narration, before the wedding's first line: "Stand-in 2 and Stand-in 3 came, in their best." */
export function guestsLine(names: readonly string[]): string {
  if (names.length === 0) return 'Just the two of you, and the whole farm quiet around you.'
  const list = names.length === 1 ? names[0]! : `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}`
  return `${list} came, in ${names.length === 1 ? 'her' : 'their'} best.`
}
/** The reception in words: "Carp Grill ★3 · everyone well fed 2 days", "the town’s bakery sends a cake · everyone well fed 1 day". */
export function receptionWords(dish: string | null, stars: number | null, days: number): string {
  const fed = `everyone well fed ${days} day${days === 1 ? '' : 's'}`
  return dish ? `${goodName(dish)} ★${stars} · ${fed}` : `the town’s bakery sends a cake · ${fed}`
}
/** the bakery's cake, the reception with no dish in the Warehouse. */
export const CAKE_WORDS = receptionWords(null, null, CAKE_DAYS)
/** The level-up card's wedding line: "The Fields · the town’s bakery sends a cake · everyone well fed 1 day". */
export const weddingWords = (w: WeddingCard): string => `${cap(placeWords(w.place))} · ${receptionWords(w.dish, w.stars, w.days)}`
/** The level-up card's ring line: "Iron Ring · hers now". */
export const ringGivenWords = (ring: string): string => `${goodName(ring)} · hers now`
/** The wedding's place picker's question, and the proposal's ring picker's. */
export const PICKER_WORDS = {
  place: 'Your wedding: where?',
  placeHelp: 'Her three places. Your guests come to whichever you choose.',
  ring: 'Which ring?',
  ringHelp: 'Any ring makes the proposal. Once you’re married, hers adds +1% at her line a grade.',
  reception: 'The reception',
  receptionHelp: 'Everyone on the farm is well fed from tomorrow.',
  noDish: 'No dish in the Warehouse yet, so the town’s bakery sends a cake: a simple meal, everyone well fed for a day.',
  cake: 'Serve the bakery’s cake · 1 day',
} as const

// --- Setups -----------------------------------------------------------------------------------------------------

/** What to do when her setup isn't met: "Assign her to the Fishery, then come back." */
export function setupAdvice(waits: Wait | null, nameOf: (id: string) => string): string | null {
  if (waits?.kind !== 'setup') return null
  const s = waits.setup
  if (s.kind === 'working') return s.activity === 'farming' ? 'Have her tend a block on the Fields, then come back.' : `Assign her to ${WORK_PLACE[s.activity]}, then come back.`
  if (s.kind === 'item') return `Put ${goodName(s.good)} in the Warehouse, then come back.`
  return `Let her and ${nameOf(s.with)} work side by side until bond ${s.level}.`
}

// --- Memories --------------------------------------------------------------------------------------------

/** The album's four filters. */
export const ALBUM_FILTERS = [
  { key: 'friend', label: 'Friend' }, { key: 'romance', label: 'Romance' }, { key: 'wed', label: 'Wed' }, { key: 'spouse', label: 'Spouse' },
] as const
export type AlbumFilter = typeof ALBUM_FILTERS[number]['key']
/** The rungs with an event, the album's 26 tiles. */
export const MEMORY_TILES: readonly string[] = ROUTE_RUNGS.filter((r) => !NIGHT_RUNGS.includes(r))
export const albumFilterOf = (rung: string): AlbumFilter =>
  rung.startsWith('f') || rung === 'confession' ? 'friend' : rung === 'proposal' || rung === 'wedding' ? 'wed' : rung.startsWith('r') ? 'romance' : 'spouse'

export interface AlbumTile {
  rung: string
  /** "F1", "◆", "R3", "◇", "S5". */
  label: string
  state: 'played' | 'next' | 'locked'
  /** Her beat's line (else the card's moment), once played. */
  caption: string | null
  filter: AlbumFilter
}

const tileLabel = (rung: string): string => (rung === 'confession' ? '◆' : rung === 'proposal' || rung === 'wedding' ? '◇' : rung.toUpperCase())

/** Her album: one tile a rung with an event, played ones with their caption, the next marked, the rest locked. */
export function albumTiles(save: Pick<SaveV4, 'love' | 'memories'>, pack: Pick<StoryPack, 'bibles'>, id: string): AlbumTile[] {
  const love = save.love[id]
  const played = new Set(save.memories[id] ?? [])
  let next = love ? nextRung(love) : null
  if (next && NIGHT_RUNGS.includes(next)) next = MEMORY_TILES[MEMORY_TILES.indexOf(`s${Number(next.slice(1)) + 1}`)] ?? null
  return MEMORY_TILES.map((rung) => ({
    rung, label: tileLabel(rung), filter: albumFilterOf(rung),
    state: played.has(rung) ? 'played' : rung === next ? 'next' : 'locked',
    caption: played.has(rung) ? captionOf(pack, id, rung) : null,
  }))
}

/** "15 of 26". */
export const memoryCount = (save: Pick<SaveV4, 'memories'>, id: string): string => `${(save.memories[id] ?? []).filter((r) => MEMORY_TILES.includes(r)).length} of ${MEMORY_TILES.length}`

/** A choice point in a replay's list: "Choice 1 · “Show me which ones.” or …". */
export const choicePointWords = (n: number, first: string): string => `Choice ${n} · “${first}”`

