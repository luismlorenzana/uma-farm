// Her chapters: each Uma's story is hers, in her own chapters, from the day you meet her to married life. There's no
// farm-wide story. Read live, never stored: her chapter is worked out from her route and the gates. Pure.
//
//   her chapters    her cast entry's `chapters` (titles, which of her rungs each holds, an optional gate), else the four
//                   defaults (`DEFAULT_CHAPTERS`): "Getting to know her", "Together", "The wedding", "Married life"
//   along her route the backbone stays as built: her arrival, F1–F10, the confession, R1–R10, the proposal, the wedding,
//                   S1, S3 and S5. A chapter's events are its rungs in the route's order, and the chapters run in the order
//                   of their first events. A rung the pack leaves out counts in the chapter before it (else the first); a
//                   rung in two counts in the first; a chapter holding none is left out
//   the one she's   the chapter holding her next rung (S2 and S4, which come at night, count with S1 and S3). None once
//   in              her route is complete: her last chapter closes in married life, and the household goes on after it
//   its gate        the farm's, from the trigger menu: a place built, a Farm Rank, a good shipped, another's event, a
//                   season or a festival. It holds back the chapter's first event (her meeting scene aside: her `meet`
//                   says when that plays); once that has played the chapter is open, and the rest follow as Ready allows
//   opens           a chapter opens when its first event can play: the rung before it has played and its gate holds. The
//                   night notes the morning it does (`chaptersOpened`: "A new chapter with ‹name›")
import { dateOf, festivalOn, FESTIVALS, SEASON_NAMES, type Festival } from '../farm/calendar'
import { farmPlace } from '../farm/places'
import { goodName } from '../goods/names'
import type { Love, SaveV4 } from '../save/v4'
import { ARRIVAL, RUNGS, type HerChapter, type StoryTrigger } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { chaptersOf, DEFAULT_CHAPTERS, festivalNameOf, festivalsOf } from '../story/placeholders'
import { NIGHT_RUNGS, nextRung, ROUTE_RUNGS, rungName } from './love'
import { eventPlayed, triggerHolds } from './meeting'
import { routeIndex } from './perk-terms'

/** One of her chapters, as it plays. */
export interface Chapter {
  /** Its number along her route, from 1. */
  n: number
  /** The pack's title; null for one written without a title ("Chapter 2" on screen). */
  title: string | null
  /** Her rungs it holds, in the route's order. */
  events: readonly string[]
  /** What the farm must have before its first event plays; null with none. */
  gate: StoryTrigger | null
}

/** A rung's place along the route: her arrival first (-1), then `ROUTE_RUNGS`'. */
const placeOf = (rung: string): number => (rung === ARRIVAL ? -1 : ROUTE_RUNGS.indexOf(rung))

/** The chapters a list holds: each with the rungs the game plays that no chapter before it holds, and none that holds
 * nothing. */
function holding(list: readonly HerChapter[]): { title: string | null; events: string[]; gate: StoryTrigger | null }[] {
  const placed = new Set<string>()
  return list.flatMap((c) => {
    const events = [...new Set((c.events ?? []).filter((r) => RUNGS.includes(r) && !placed.has(r)))]
    for (const r of events) placed.add(r)
    return events.length > 0 ? [{ title: c.title ?? null, events, gate: c.gate ?? null }] : []
  })
}

/** Her chapters along her route: her cast entry's, else the four defaults (also when none of hers holds a rung the game
 * plays). Each holds its rungs in the route's order, the chapters run in the order of their first events, and a rung the
 * pack leaves out counts in the chapter before it along the route, else the first. */
export function herChapters(pack: Pick<StoryPack, 'cast'>, id: string): Chapter[] {
  const own = holding(chaptersOf(pack, id))
  const kept = (own.length > 0 ? own : holding(DEFAULT_CHAPTERS))
    .map((c) => ({ ...c, first: Math.min(...c.events.map(placeOf)) }))
    .sort((a, b) => a.first - b.first)
  const owner = new Map<string, number>()
  kept.forEach((c, i) => { for (const r of c.events) owner.set(r, i) })
  let before: number | null = null
  for (const rung of RUNGS) {
    const at = owner.get(rung)
    if (at !== undefined) before = at
    else owner.set(rung, before ?? 0)
  }
  return kept.map((c, i) => ({ n: i + 1, title: c.title, events: RUNGS.filter((r) => owner.get(r) === i), gate: c.gate }))
}

/** The chapter a step of her route counts in: its own, and for S2 and S4 the one of the event before them. */
export function chapterAt(chapters: readonly Chapter[], rung: string): Chapter | null {
  for (let i = placeOf(rung); i >= -1; i--) {
    const at = i < 0 ? ARRIVAL : ROUTE_RUNGS[i]!
    const chapter = chapters.find((c) => c.events.includes(at))
    if (chapter) return chapter
  }
  return chapters[0] ?? null
}

/** Whether a rung of hers has played: her arrival once her meeting scene has, the rest by her place on the route. */
export const rungPlayed = (save: Pick<SaveV4, 'love' | 'arrivals'>, id: string, rung: string): boolean =>
  rung === ARRIVAL ? save.arrivals.includes(id) : save.love[id] !== undefined && placeOf(rung) < routeIndex(save.love[id])

/** Whether a chapter has begun: one of its events has played, her meeting scene aside. Its gate holds nothing back
 * then. */
export const chapterBegun = (chapter: Pick<Chapter, 'events'>, love: Pick<Love, 'stage' | 'level'>): boolean =>
  chapter.events.some((r) => r !== ARRIVAL && placeOf(r) < routeIndex(love))

/** Whether a chapter's gate holds now: a place built, a Farm Rank, a good shipped and another's event as meeting her
 * reads them; a season or a festival on its days (`year`'s: the game's five, or the story's). The town's kinds aren't a
 * gate's (the reader skips them): they hold. */
export function gateHolds(save: SaveV4, gate: StoryTrigger, year: readonly Festival[] = FESTIVALS): boolean {
  switch (gate.kind) {
    case 'season': return dateOf(save.calendar.day, save.calendar).season === gate.season
    case 'festival': return festivalOn(save.calendar.day, year, save.calendar)?.id === gate.festival
    case 'farm-rank': case 'built': case 'shipped': case 'event': return triggerHolds(save, gate, 0, { at: 'night' })
    default: return true
  }
}

/** Her chapters now: all of them, the one she's in, and its gate while it holds her next event back. */
export interface ChapterNow {
  chapters: Chapter[]
  /** The chapter holding her next rung; null once her route is complete (or before she's met). */
  current: Chapter | null
  /** Its gate while it doesn't hold and her next rung is its first event; null otherwise. */
  waits: StoryTrigger | null
}
export function chapterNow(save: SaveV4, pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'world'>>, id: string): ChapterNow {
  const chapters = herChapters(pack, id)
  const love = save.love[id]
  const rung = love ? nextRung(love) : null
  const current = rung === null ? null : chapterAt(chapters, rung)
  const held = love && rung !== null && current?.gate && !NIGHT_RUNGS.includes(rung) && !chapterBegun(current, love) && !gateHolds(save, current.gate, festivalsOf(pack))
  return { chapters, current, waits: held ? current!.gate : null }
}

/** Whether a gate held at the day's start, read at night from the day as it was left: every kind but another's event
 * changes only at night; an event gate held if its event had played before today. */
function heldAtDawn(day: SaveV4, gate: StoryTrigger, year: readonly Festival[]): boolean {
  if (gate.kind !== 'event') return gateHolds(day, gate, year)
  const today = (u: string, ev: string): boolean => (ev === ARRIVAL
    ? day.roster[u]?.joined === day.calendar.day
    : day.today.events.includes(u) && day.memories[u]?.at(-1) === ev)
  const at = gate.after.indexOf(':')
  if (at > 0) return eventPlayed(day, gate.after) && !today(gate.after.slice(0, at), gate.after.slice(at + 1))
  if (gate.after === ARRIVAL) return day.arrivals.some((u) => !today(u, ARRIVAL))
  return Object.entries(day.memories).some(([u, events]) => events.includes(gate.after) && !today(u, gate.after))
}

/**
 * Night step 9: whose chapter opened this morning, each with its number. One opens when its first event can play: her
 * next rung is its first event and its gate holds now, and it couldn't play at the day's start: the rung before it played
 * today (her event, or Ask her's Yes), a night level moved her into it, or its gate began to hold. Her first chapter opens
 * with meeting her, which the morning says on its own. In `order` (the cast's), then by id.
 */
export function chaptersOpened(day: SaveV4, morning: SaveV4, pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'world'>>, order: readonly string[] = []): { id: string; chapter: number }[] {
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length)
  const year = festivalsOf(pack)
  return Object.keys(morning.roster).sort((a, b) => rank(a) - rank(b) || Number(a) - Number(b)).flatMap((id) => {
    const love = morning.love[id]
    const was = day.love[id]
    if (!love || !was || !day.roster[id]) return []
    const now = chapterNow(morning, pack, id)
    const chapter = now.current
    if (!chapter || now.waits || chapterBegun(chapter, love)) return []
    const moved = (day.today.events.includes(id) || day.today.asked.includes(id)) && !was.friend
    const opened = chapterNow(day, pack, id).current?.n !== chapter.n || (chapter.gate !== null && !heldAtDawn(day, chapter.gate, year)) || moved
    return opened ? [{ id, chapter: chapter.n }] : []
  })
}

/** Each kind a gate takes, as the manual lists it: when it holds, and an example for her profile's words. */
export const GATE_RULES: readonly { holds: string; example: StoryTrigger }[] = [
  { holds: 'This place of the farm is built: it stands the night after it’s paid for', example: { kind: 'built', place: 'kitchen' } },
  { holds: 'The Farm Rank reaches this rank, at night', example: { kind: 'farm-rank', rank: 4 } },
  { holds: 'This many of a good shipped, in all: the bin pays at night', example: { kind: 'shipped', good: 'carrot', count: 50 } },
  { holds: 'Another character’s event has played (`<characterId>:<event>`; `arrival` is her meeting scene), or an event id: anyone’s', example: { kind: 'event', after: '9000002:f3' } },
  { holds: 'This season: from its first morning to its last', example: { kind: 'season', season: 'winter' } },
  { holds: 'This festival’s day, any year', example: { kind: 'festival', festival: 'harvest-cup' } },
]

/** Her events in short, for a chapter's list: "Meeting", "F3", "Confession", "R2", "Proposal", "Wedding", "S1". */
export const rungShort = (rung: string): string => (rung === ARRIVAL ? 'Meeting' : /^[frs]\d+$/.test(rung) ? rung.toUpperCase() : rung.charAt(0).toUpperCase() + rung.slice(1))

/** A chapter's name on screen: its title, else "Chapter 2". */
export const chapterTitle = (chapter: Pick<Chapter, 'n' | 'title'>): string => chapter.title ?? `Chapter ${chapter.n}`

/** An event in a gate's words: "Friendship 3", "confession", "wedding". */
const eventWords = (event: string): string => (event === 'confession' || event === 'proposal' || event === 'wedding' ? event : ROUTE_RUNGS.includes(event) ? rungName(event) : event)

/** A festival's name after "on" or "at": "the Harvest Cup", or a name of the story's that brings its own "The". */
export const theFestival = (name: string): string => (/^the\s/i.test(name) ? name : `the ${name}`)

/** What a gate asks, in her profile's words: "Opens when the Kitchen is built", "Opens at Farm Rank 4", "Opens when
 * you’ve shipped 50 Carrot", "Opens after Stand-in 2’s Friendship 3", "Opens in Winter", "Opens on the Harvest Cup".
 * `nameOf` names another character; a festival is named as `year` names it (the story's, `festivalsOf`). */
export function gateWords(gate: StoryTrigger, nameOf: (id: string) => string = (id) => id, year: readonly Festival[] = FESTIVALS): string {
  switch (gate.kind) {
    case 'built': return `Opens when the ${farmPlace(gate.place)?.name ?? gate.place} is built`
    case 'farm-rank': return `Opens at Farm Rank ${gate.rank}`
    case 'shipped': return `Opens when you’ve shipped ${gate.count.toLocaleString('en-US')} ${goodName(gate.good)}`
    case 'season': return `Opens in ${SEASON_NAMES[gate.season]}`
    case 'festival': return `Opens on ${theFestival(festivalNameOf(year, gate.festival))}`
    case 'event': {
      const at = gate.after.indexOf(':')
      if (at <= 0) return gate.after === ARRIVAL ? 'Opens once you meet someone new' : `Opens after anyone’s ${eventWords(gate.after)}`
      const who = nameOf(gate.after.slice(0, at))
      const event = gate.after.slice(at + 1)
      return event === ARRIVAL ? `Opens once you meet ${who}` : `Opens after ${who}’s ${eventWords(event)}`
    }
    default: return 'Opens with the farm'
  }
}
