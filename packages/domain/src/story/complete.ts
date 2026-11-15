// A complete Uma: every piece of story the game reads for one Uma, in the pack's own shapes (`docs/story-pack.md`), the
// `"draft": "default"` marker that says a piece still holds the default story's words, the default each piece starts
// from (rendered for her: her name, her favourite good, her line's work, her temperament; `{farmer}` kept), and her
// status: each piece hers, the default, or missing. The story tools read it (`pnpm story:scaffold`, `pnpm story:status`,
// the release's check and the Farm Story Sandbox); the game never does, and the marker changes nothing in play: a marked
// pack plays exactly as the same pack unmarked (the reader keeps fields it doesn't read). No character, name or line
// lives here: the words are the default story's, and her name comes from master data at run time.
//
//   her cast entry   home, job, routine, chapters
//   her bible        favouriteLine, gifts, chats, townLines, mornings, meals, keepsake, petName, wedding, wishes, and a
//                    beat for each of the 27 rungs
//   her route        her meeting, Friendship 1–10, the confession, Romance 1–10, the proposal, the wedding, the
//                    invitation to work, the wedding night, moving in, Spouse 1–5, each evening's scene, and four
//                    occasions (New Year's, the Flower Show, the Fishing Derby's night, her birthday)
//
// **The marker** sits on the piece when it's an object (an event, a beat, a chapter, her job, a routine stop, her chats,
// gifts, meals, keepsake, wedding): `"draft": "default"`. A piece that's a plain value or a list of lines (her home; her
// bible's favouriteLine, townLines, mornings, petName, wishes) can't hold a key, so its marker sits on its file's own
// object: `"draft": { "mornings": "default" }`. Her routine and her chapters are default while every stop or chapter is
// marked.
import { TEMPERAMENTS, type Temperament } from '../farm/talents'
import { RUNGS, EVENING_SCENES, LIFE_EVENTS, SPOT_IDS, ARRIVAL, type SpotId, type Step, type StoryPlace } from './authored'
import { DEFAULT_GOOD, DEFAULT_GOODS, DEFAULT_MEALS, DEFAULT_MORNINGS, DEFAULT_TALKS, HER } from './default-story'
import { readStoryPack, type PackFiles, type StoryPack } from './pack'
import {
  CALLING_ACTIVITY, DEFAULT_CHAPTERS, defaultSceneOf, favouriteGoodOf, favouriteOf, fillHer, fillScene, herWordsOf, PLACEHOLDER_KEEPSAKE, PLACEHOLDER_PET_NAME,
  PLACEHOLDER_TOWN_LINES, WEDDING_DEFAULTS, weddingPlaces, type HerWords, type MasterCast,
} from './placeholders'

/** The marker's one value: the piece still holds the default story's words. */
export const DRAFT = 'default'

/** The three parts of her: her cast entry (`cast.json`), her bible (`umas/<id>.json`) and her route (`routes/<id>.json`). */
export const PARTS = ['cast', 'bible', 'route'] as const
export type Part = typeof PARTS[number]

/** Her cast entry's pieces. */
export const CAST_PIECES = ['home', 'job', 'routine', 'chapters'] as const
/** Her bible's pieces, besides a beat for each rung (`beat:<rung>`). */
export const BIBLE_PIECES = ['favouriteLine', 'gifts', 'chats', 'townLines', 'mornings', 'meals', 'keepsake', 'petName', 'wedding', 'wishes'] as const
/** The pieces that are a plain value or a list of lines: their marker sits on the file's `draft` object. */
export const PLAIN_PIECES: readonly string[] = ['home', 'favouriteLine', 'townLines', 'mornings', 'petName', 'wishes']
/** Her occasions a complete Uma holds: the three the calendar plays and her birthday. */
export const COMPLETE_OCCASIONS = ['new-year', 'flower-show', 'derby-night', 'birthday'] as const
/** Every event of a complete route, in the story's order: her meeting and the rungs to the wedding, her life's events and
 * the spouse ladder, each evening's scene, then her occasions. */
export const COMPLETE_EVENTS: readonly string[] = [
  ...RUNGS.slice(0, RUNGS.indexOf('wedding') + 1), 'invited-to-work', 'wedding-night', 'moving-in', 's1', 's2', 's3', 's4', 's5', ...EVENING_SCENES, ...COMPLETE_OCCASIONS,
]
/** A beat's piece name: `beat:<rung>`. */
export const beatPiece = (rung: string): string => `beat:${rung}`

/** The starter routine's days, by her order on the board: every third day of each season, the first on day 1, 2 or 3, so
 * the board's next Uma is out the day after. */
export const ROUTINE_DAYS: readonly (readonly number[])[] = [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]]
/** Her starter spot when her cast entry names none: one of the six, by her order on the board. */
export const starterSpot = (spot: unknown, order: number): SpotId => (SPOT_IDS as readonly unknown[]).includes(spot) ? spot as SpotId : SPOT_IDS[order % SPOT_IDS.length]!
/** Her starter routine's days, by her order on the board. */
export const starterDays = (order: number): number[] => [...ROUTINE_DAYS[order % ROUTINE_DAYS.length]!]

// --- Reading what's there ---------------------------------------------------------------------------------------------

type Obj = Record<string, unknown>
const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const nonEmpty = (v: unknown): boolean => Array.isArray(v) && v.length > 0
const ids = (list: unknown): string[] => (Array.isArray(list) ? list.flatMap((x) => (isObject(x) && typeof x.id === 'string' ? [x.id] : [])) : [])

/** Whether an object piece carries the marker. */
export const isDraft = (v: unknown): boolean => isObject(v) && v.draft === DRAFT
/** Whether a plain piece's marker is on its file's object: `draft: { <piece>: "default" }`. */
const plainDraft = (holder: unknown, key: string): boolean => isObject(holder) && isObject(holder.draft) && holder.draft[key] === DRAFT
/** Whether a list piece (her routine, her chapters) is the default: every item marked. */
const allDraft = (list: unknown): boolean => Array.isArray(list) && list.length > 0 && list.every(isDraft)

/** Her cast entry in a cast file, as written or read. */
export const castEntryOf = (cast: unknown, id: string): Obj | undefined =>
  isObject(cast) && Array.isArray(cast.umas) ? (cast.umas as unknown[]).find((u): u is Obj => isObject(u) && u.characterId === id) : undefined

/** One piece of her: hers (written, unmarked), the default (marked), or missing (the default story plays it). */
export type PieceState = 'hers' | 'default' | 'missing'
export interface PieceStatus { part: Part; piece: string; state: PieceState }
export interface PartCounts { hers: number; default: number; missing: number; of: number }
/** Her status: each piece's state, the counts by part, and whether nothing is missing. */
export interface UmaStatus { id: string; pieces: PieceStatus[]; parts: Record<Part, PartCounts>; complete: boolean }

/** A cast entry's piece: there, and marked. */
function castPiece(entry: Obj | undefined, key: typeof CAST_PIECES[number]): PieceState {
  const v = entry?.[key]
  switch (key) {
    case 'home': return typeof v !== 'string' ? 'missing' : plainDraft(entry, key) ? 'default' : 'hers'
    case 'job': return !isObject(v) ? 'missing' : isDraft(v) ? 'default' : 'hers'
    case 'routine': case 'chapters': return !nonEmpty(v) ? 'missing' : allDraft(v) ? 'default' : 'hers'
  }
}

/** A bible's piece: there (a list of lines with a line in it; her chats and meals with one set), and marked. */
function biblePiece(bible: Obj | undefined, key: typeof BIBLE_PIECES[number]): PieceState {
  const v = bible?.[key]
  const there = (() => {
    switch (key) {
      case 'favouriteLine': case 'petName': return typeof v === 'string'
      case 'townLines': case 'mornings': return nonEmpty(v)
      case 'wishes': return Array.isArray(v)
      case 'chats': return isObject(v) && (nonEmpty(v.friend) || nonEmpty(v.partner) || nonEmpty(v.spouse))
      case 'meals': return isObject(v) && (nonEmpty(v.breakfast) || nonEmpty(v.dinner))
      case 'wedding': return isObject(v) && nonEmpty(v.places)
      case 'gifts': case 'keepsake': return isObject(v)
    }
  })()
  if (!there) return 'missing'
  return (PLAIN_PIECES.includes(key) ? plainDraft(bible, key) : isDraft(v)) ? 'default' : 'hers'
}

/** An item of a list by id (a beat, an event): there, and marked. */
const itemPiece = (list: unknown, id: string): PieceState => {
  const item = Array.isArray(list) ? (list as unknown[]).find((x) => isObject(x) && x.id === id) : undefined
  return item === undefined ? 'missing' : isDraft(item) ? 'default' : 'hers'
}

/** The pack's files as the status reads them: the cast, her bible and her route, as written or as read. */
export interface StatusFiles { cast?: unknown; umas: Readonly<Record<string, unknown>>; routes: Readonly<Record<string, unknown>> }

/** Her status: each piece of a complete Uma, hers, the default (marked) or missing, and the counts by part. Read it on the
 * pack as the game reads it (`readStoryPack`'s files), so a part with an error counts as missing: the default plays it. */
export function umaStatus(files: StatusFiles, id: string): UmaStatus {
  const entry = castEntryOf(files.cast, id)
  const bible = isObject(files.umas[id]) ? files.umas[id] as Obj : undefined
  const route = isObject(files.routes[id]) ? files.routes[id] as Obj : undefined
  const pieces: PieceStatus[] = [
    ...CAST_PIECES.map((piece): PieceStatus => ({ part: 'cast', piece, state: castPiece(entry, piece) })),
    ...BIBLE_PIECES.map((piece): PieceStatus => ({ part: 'bible', piece, state: biblePiece(bible, piece) })),
    ...RUNGS.map((rung): PieceStatus => ({ part: 'bible', piece: beatPiece(rung), state: itemPiece(bible?.route, rung) })),
    ...COMPLETE_EVENTS.map((event): PieceStatus => ({ part: 'route', piece: event, state: itemPiece(route?.events, event) })),
  ]
  const parts = Object.fromEntries(PARTS.map((part) => {
    const of = pieces.filter((p) => p.part === part)
    return [part, { hers: of.filter((p) => p.state === 'hers').length, default: of.filter((p) => p.state === 'default').length, missing: of.filter((p) => p.state === 'missing').length, of: of.length }]
  })) as Record<Part, PartCounts>
  return { id, pieces, parts, complete: pieces.every((p) => p.state !== 'missing') }
}

/** The families a list of pieces names together: her beats, and the evenings' hangouts and dates, by their kinds. */
const FAMILIES: readonly (readonly [string, string])[] = [['beat:', 'beats'], ['hangout-', 'hangouts'], ['date-', 'dates']]

/** A list of piece names in few words: runs of rungs as ranges ("f1–f10"), and a family of two or more as one, its kinds
 * in brackets ("beats (arrival, f1–f10)", "hangouts (walk, picnic)"). */
export function pieceWords(pieces: readonly string[]): string {
  const family = (p: string) => FAMILIES.find(([prefix]) => p.startsWith(prefix) && pieces.filter((x) => x.startsWith(prefix)).length > 1)
  const out: string[] = []
  const done = new Set<string>()
  let loose: string[] = []
  const flush = () => { if (loose.length > 0) out.push(...runs(loose).map((w) => w.replace(/^beat:/, 'beat '))); loose = [] }
  for (const p of pieces) {
    const f = family(p)
    if (!f) { loose.push(p); continue }
    if (done.has(f[0])) continue
    done.add(f[0])
    flush()
    out.push(`${f[1]} (${runs(pieces.filter((x) => x.startsWith(f[0])).map((x) => x.slice(f[0].length))).join(', ')})`)
  }
  flush()
  return out.join(', ')
}

/** Runs of numbered rungs as ranges: f1, f2, f3 → "f1–f3"; two in a row stay two. */
function runs(list: readonly string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < list.length; i++) {
    const m = /^([a-z])(\d+)$/.exec(list[i]!)
    let j = i
    while (m && j + 1 < list.length) {
      const n = /^([a-z])(\d+)$/.exec(list[j + 1]!)
      if (!n || n[1] !== m[1] || Number(n[2]) !== Number(m[2]) + (j + 1 - i)) break
      j++
    }
    out.push(j - i >= 2 ? `${list[i]}–${list[j]}` : list.slice(i, j + 1).join(', '))
    i = j
  }
  return out
}

/** What's left of her, in words by part and state: "route: default f1–f10, …; missing birthday". Empty when every piece is
 * hers. */
export function leftWords(status: UmaStatus): string[] {
  return PARTS.flatMap((part) => {
    const of = (state: PieceState) => status.pieces.filter((p) => p.part === part && p.state === state).map((p) => p.piece)
    const words = [of('missing').length > 0 ? `missing ${pieceWords(of('missing'))}` : '', of('default').length > 0 ? `default ${pieceWords(of('default'))}` : ''].filter(Boolean)
    return words.length > 0 ? [`${part}: ${words.join('; ')}`] : []
  })
}

// --- The default's words, for the check --------------------------------------------------------------------------------

/** A template's text as a pattern: `{name}`, `{good}` and `{work}` match any words (her name, her favourite good and her
 * line's work, filled as the scaffold wrote them); everything else, `{farmer}` included, is as written. */
const patterns = new Map<string, RegExp>()
function sameText(text: string, template: string): boolean {
  if (text === template) return true
  let re = patterns.get(template)
  if (!re) {
    const parts = template.split(/(\{(?:name|good|work)\})/)
    re = new RegExp(`^${parts.map((p) => (/^\{(name|good|work)\}$/.test(p) ? '.+?' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('')}$`, 's')
    patterns.set(template, re)
  }
  return re.test(text)
}

/** Whether a value is the template, filled: the same shape (the marker aside), each text the template's with her words in,
 * and `@her` any one speaker. */
function sameAs(value: unknown, template: unknown): boolean {
  if (typeof template === 'string') return typeof value === 'string' && (template === HER || sameText(value, template))
  if (Array.isArray(template)) return Array.isArray(value) && value.length === template.length && template.every((t, i) => sameAs(value[i], t))
  if (isObject(template)) {
    if (!isObject(value)) return false
    const keys = (o: Obj) => Object.keys(o).filter((k) => k !== 'draft' && o[k] !== undefined).sort()
    const [a, b] = [keys(value), keys(template)]
    return a.length === b.length && a.every((k, i) => k === b[i] && sameAs(value[k], template[k]))
  }
  return value === template
}
const onlyKeys = (v: unknown, allowed: readonly string[]): v is Obj => isObject(v) && Object.keys(v).every((k) => k === 'draft' || allowed.includes(k))

/** The default story's chat sets for a temperament: her friend, sweetheart and married talks. */
const chatTemplate = (t: Temperament) => ({ friend: DEFAULT_TALKS.friend[t], partner: DEFAULT_TALKS.sweetheart[t], spouse: DEFAULT_TALKS.married[t] })
const DEFAULT_LOVED = new Set([...Object.values(DEFAULT_GOODS), DEFAULT_GOOD])

/** Whether a marked piece holds the default's words: the check's note when it doesn't. */
function defaultWords(part: Part, piece: string, value: unknown, ctx: { entry?: Obj; bible?: Obj }): boolean {
  if (part === 'route') {
    const scene = defaultSceneOf(piece, piece === ARRIVAL)
    return onlyKeys(value, ['id', 'outfit', 'steps']) && value.outfit === scene.outfit && sameAs(value.steps, scene.steps)
  }
  if (piece.startsWith('beat:')) return onlyKeys(value, ['id'])
  switch (piece) {
    case 'home': return (SPOT_IDS as readonly unknown[]).includes(value)
    case 'job': return onlyKeys(value, ['at']) && (SPOT_IDS as readonly unknown[]).includes(value.at)
    case 'routine': {
      const [stop] = Array.isArray(value) ? value : []
      return Array.isArray(value) && value.length === 1 && onlyKeys(stop, ['at', 'days']) && (SPOT_IDS as readonly unknown[]).includes(stop.at) && ROUTINE_DAYS.some((d) => sameAs(stop.days, d))
    }
    case 'chapters': return sameAs(value, DEFAULT_CHAPTERS)
    case 'favouriteLine': {
      const calling = ctx.entry?.calling
      return typeof calling !== 'string' || !(calling in CALLING_ACTIVITY) || value === CALLING_ACTIVITY[calling as keyof typeof CALLING_ACTIVITY]
    }
    case 'gifts': return onlyKeys(value, ['loved']) && DEFAULT_LOVED.has(value.loved as string)
    case 'chats': return TEMPERAMENTS.some((t) => sameAs(value, chatTemplate(t)))
    case 'townLines': return sameAs(value, PLACEHOLDER_TOWN_LINES)
    case 'mornings': return TEMPERAMENTS.some((t) => sameAs(value, DEFAULT_MORNINGS[t]))
    case 'meals': return sameAs(value, DEFAULT_MEALS)
    case 'keepsake': return sameAs(value, PLACEHOLDER_KEEPSAKE)
    case 'petName': return value === PLACEHOLDER_PET_NAME
    case 'wedding': {
      const beat = (Array.isArray(ctx.bible?.route) ? ctx.bible.route as unknown[] : []).find((b) => isObject(b) && b.id === 'wedding')
      const place = isObject(beat) && typeof beat.place === 'string' ? [beat.place] : []
      return onlyKeys(value, ['places']) && sameAs(value.places, [...new Set([...place, ...WEDDING_DEFAULTS])].slice(0, 3))
    }
    case 'wishes': return Array.isArray(value) && value.length === 0
    default: return true
  }
}

/** The value of a piece, for the check. */
function pieceValue(part: Part, piece: string, ctx: { entry?: Obj; bible?: Obj; route?: Obj }): unknown {
  if (part === 'cast') return ctx.entry?.[piece]
  if (part === 'route') return (Array.isArray(ctx.route?.events) ? ctx.route.events as unknown[] : []).find((e) => isObject(e) && e.id === piece)
  if (piece.startsWith('beat:')) return (Array.isArray(ctx.bible?.route) ? ctx.bible.route as unknown[] : []).find((b) => isObject(b) && b.id === piece.slice('beat:'.length))
  return ctx.bible?.[piece]
}

/** Each marker that isn't one on a file's own object: its `draft` isn't `{ <plain piece>: "default" }`. */
function markerNotes(holder: Obj | undefined, plain: readonly string[], where: string): string[] {
  if (holder?.draft === undefined) return []
  if (!isObject(holder.draft)) return [`${where}: draft is { <piece>: "default" } for ${plain.join(', ')}; it’s ignored`]
  return Object.entries(holder.draft).flatMap(([key, v]) => (!plain.includes(key) ? [`${where}: draft.${key} isn’t one of ${plain.join(', ')}; it’s ignored`]
    : v !== DRAFT ? [`${where}: draft.${key} is "default" or nothing, so ${key} counts as hers`] : []))
}

/** Her bible's pieces that are objects: their marker is their own. */
const OBJECT_PIECES = BIBLE_PIECES.filter((p) => !PLAIN_PIECES.includes(p))

/** Her notes on the marker, from the pack as the game reads it: a marked piece whose words differ from the default's
 * ("rewritten? remove the marker"), and a marker that isn't one. Each named by the file that holds the piece (her cast
 * entry's by her id too). They block nothing, and play is the same either way. */
export function draftNotes(files: StatusFiles, id: string): string[] {
  const entry = castEntryOf(files.cast, id)
  const bible = isObject(files.umas[id]) ? files.umas[id] as Obj : undefined
  const route = isObject(files.routes[id]) ? files.routes[id] as Obj : undefined
  const ctx = { ...(entry ? { entry } : {}), ...(bible ? { bible } : {}), ...(route ? { route } : {}) }
  const file: Record<Part, string> = { cast: `cast.json: ${id}`, bible: `umas/${id}.json`, route: `routes/${id}.json` }
  const notes = [...markerNotes(entry, ['home'], file.cast), ...markerNotes(bible, PLAIN_PIECES.filter((p) => p !== 'home'), file.bible)]
  const objects = (list: unknown): Obj[] => (Array.isArray(list) ? list.filter(isObject) : [])
  const marker = (where: string, what: string, item: unknown) => {
    if (isObject(item) && item.draft !== undefined && item.draft !== DRAFT) notes.push(`${where}: ${what}’s draft is "default" or nothing, so it counts as hers`)
  }
  marker(file.cast, 'her job', entry?.job)
  objects(entry?.routine).forEach((stop, i) => marker(file.cast, `routine stop ${i + 1}`, stop))
  objects(entry?.chapters).forEach((chapter, i) => marker(file.cast, `chapter ${i + 1}`, chapter))
  for (const piece of OBJECT_PIECES) marker(file.bible, piece, bible?.[piece])
  for (const beat of objects(bible?.route)) marker(file.bible, `beat ${String(beat.id)}`, beat)
  for (const event of objects(route?.events)) marker(file.route, String(event.id), event)
  for (const p of umaStatus(files, id).pieces) {
    if (p.state !== 'default' || defaultWords(p.part, p.piece, pieceValue(p.part, p.piece, ctx), ctx)) continue
    notes.push(`${file[p.part]}: ${p.piece.replace('beat:', 'beat ')} is marked "draft": "default" but its words aren’t the default’s: rewritten? remove the marker`)
  }
  return notes
}

// --- The scaffold --------------------------------------------------------------------------------------------------------

/** One Uma to scaffold: her id, her name as the screen knows it (master data's, a sister's the pack's), her temperament
 * from master data (her bible's own `temperament` first; `steady` without either, as the game plays), and her order on
 * the board (0 first), which staggers her starter routine. */
export interface ScaffoldHer { id: string; name: string | null; temperament?: Temperament | null; order: number }
/** One piece the scaffold wrote. */
export interface Wrote { part: Part; piece: string }
/** What the scaffold would write: the files it changes (the cast, her bible, her route), as written, and per Uma what it
 * wrote and what it couldn't. Files it leaves alone aren't in it. */
export interface Scaffold {
  cast?: Obj
  umas: Record<string, Obj>
  routes: Record<string, Obj>
  wrote: Record<string, Wrote[]>
  refused: Record<string, string[]>
}

/** Her temperament for the default's words: her bible's own `temperament` (the story's), else master data's, else steady. */
export function scaffoldTemperament(bible: unknown, fromMaster: Temperament | null | undefined): Temperament {
  const own = isObject(bible) ? bible.temperament : undefined
  return (TEMPERAMENTS as readonly unknown[]).includes(own) ? own as Temperament : fromMaster ?? 'steady'
}

/** A copy that can be changed without touching what was read: the pack's files are JSON. */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** The default's lines for her: her words in, `{farmer}` kept. */
const herLines = (lines: readonly string[], words: HerWords): string[] => lines.map((line) => fillHer(line, words))

/** Her missing pieces, filled from the default story and marked, added to her cast entry, her bible and her route (each
 * a copy). Never overwrites a piece that's there, read or not. */
function scaffoldOne(her: ScaffoldHer, files: { cast: Obj; bible: Obj | undefined; route: Obj | undefined }, pack: StoryPack): { cast: Obj; bible?: Obj; route?: Obj; wrote: Wrote[]; refused: string[] } {
  const { id } = her
  const wrote: Wrote[] = []
  const refused: string[] = []
  const cast = clone(files.cast)
  if (!Array.isArray(cast.umas)) cast.umas = []
  let entry = castEntryOf(cast, id)
  if (!entry) { entry = { characterId: id }; (cast.umas as unknown[]).push(entry) }
  const name = her.name ?? id
  const words: HerWords = herWordsOf(pack, id, name)
  const spot = starterSpot(entry.spot, her.order)
  /** A plain piece, written and marked on its file's own `draft`; refused when that `draft` isn't an object. */
  const plain = (holder: Obj, part: Part, key: string, value: unknown) => {
    if (holder[key] !== undefined) return
    if (holder.draft !== undefined && !isObject(holder.draft)) { refused.push(`${key}: the file’s draft isn’t an object, so its marker has nowhere to go`); return }
    holder[key] = value
    holder.draft = { ...(holder.draft as Obj | undefined), [key]: DRAFT }
    wrote.push({ part, piece: key })
  }

  // Her cast entry: a starter life at her favourite spot, and the four default chapters.
  plain(entry, 'cast', 'home', spot)
  if (entry.job === undefined) { entry.job = { at: spot, draft: DRAFT }; wrote.push({ part: 'cast', piece: 'job' }) }
  if (entry.routine === undefined) { entry.routine = [{ at: spot, days: starterDays(her.order), draft: DRAFT }]; wrote.push({ part: 'cast', piece: 'routine' }) }
  if (entry.chapters === undefined) { entry.chapters = DEFAULT_CHAPTERS.map((c) => ({ title: c.title, events: [...c.events], draft: DRAFT })); wrote.push({ part: 'cast', piece: 'chapters' }) }

  // Her bible.
  let bible: Obj | undefined
  if (files.bible !== undefined && !isObject(files.bible)) refused.push(`umas/${id}.json isn’t a bible (an object), so none of its pieces is written`)
  else {
    bible = files.bible ? clone(files.bible) : { characterId: id }
    const b = bible
    const temperament = scaffoldTemperament(b, her.temperament)
    const line = favouriteOf(pack, id)
    const object = (key: string, value: Obj) => {
      if (b[key] !== undefined) return
      b[key] = { ...value, draft: DRAFT }
      wrote.push({ part: 'bible', piece: key })
    }
    if (line !== null) plain(b, 'bible', 'favouriteLine', line)
    else if (b.favouriteLine === undefined) refused.push('favouriteLine: she has no calling, and master data gives her no line')
    object('gifts', { loved: favouriteGoodOf(pack, id) })
    object('chats', Object.fromEntries(Object.entries(chatTemplate(temperament)).map(([set, lines]) => [set, herLines(lines, words)])))
    plain(b, 'bible', 'townLines', [...PLACEHOLDER_TOWN_LINES])
    plain(b, 'bible', 'mornings', herLines(DEFAULT_MORNINGS[temperament], words))
    object('meals', { breakfast: herLines(DEFAULT_MEALS.breakfast, words), dinner: herLines(DEFAULT_MEALS.dinner, words) })
    object('keepsake', { ...PLACEHOLDER_KEEPSAKE })
    plain(b, 'bible', 'petName', PLACEHOLDER_PET_NAME)
    object('wedding', { places: weddingPlaces(pack, id) as StoryPlace[] })
    plain(b, 'bible', 'wishes', [])
    if (bible.route !== undefined && !Array.isArray(bible.route)) refused.push('her beats: her bible’s route isn’t a list')
    else {
      const there = new Set(ids(bible.route))
      const beats = RUNGS.filter((rung) => !there.has(rung))
      if (beats.length > 0) {
        bible.route = [...(bible.route as unknown[] | undefined ?? []), ...beats.map((rung) => ({ id: rung, draft: DRAFT }))]
        wrote.push(...beats.map((rung): Wrote => ({ part: 'bible', piece: beatPiece(rung) })))
      }
    }
  }

  // Her route: every event the default story plays, hers.
  let route: Obj | undefined
  if (files.route !== undefined && !(isObject(files.route) && Array.isArray(files.route.events))) refused.push(`routes/${id}.json isn’t a route (an object with an events list), so none of its events is written`)
  else {
    route = files.route ? clone(files.route) : { characterId: id, events: [] }
    const there = new Set(ids(route.events))
    const events = COMPLETE_EVENTS.filter((event) => !there.has(event))
    route.events = [...(route.events as unknown[]), ...events.map((event) => {
      const scene = defaultSceneOf(event, event === ARRIVAL)
      return { id: event, draft: DRAFT, ...(scene.outfit ? { outfit: scene.outfit } : {}), steps: fillScene(scene.steps, id, words) as Step[] }
    })]
    wrote.push(...events.map((event): Wrote => ({ part: 'route', piece: event })))
  }
  const changed = (part: Part) => wrote.some((w) => w.part === part)
  return { cast, ...(bible && changed('bible') ? { bible } : {}), ...(route && changed('route') ? { route } : {}), wrote, refused }
}

/** Whose files a finding names: `cast.json: Uma n (<id>)`, `umas/<id>.json`, `routes/<id>.json`. */
const hersOnly = (id: string) => (line: string): boolean => line.includes(`(${id})`) || line.startsWith(`umas/${id}.json`) || line.startsWith(`routes/${id}.json`)

/**
 * The scaffold: for each Uma, every piece of a complete Uma that's missing (`umaStatus`'s), filled from the default story
 * rendered for her and marked `"draft": "default"`; a piece that's there, written or marked, read or not, is never
 * touched, so a second run writes nothing. Her cast entry gains a starter life at her favourite spot (`spot`; else one by
 * her order): her home and her part-time job there, and her routine there on four days of each season, staggered by her
 * order on the board. `files` are the pack's files as written (`PackFiles`, unchecked); `master` gives her line when the
 * pack gives none. An Uma whose pieces would read with an error the pack didn't have is left as she was, with the errors.
 */
export function scaffoldPack(files: PackFiles, hers: readonly ScaffoldHer[], master?: MasterCast): Scaffold {
  const out: Scaffold = { umas: {}, routes: {}, wrote: {}, refused: {} }
  if (files.cast !== undefined && !(isObject(files.cast) && (files.cast.umas === undefined || Array.isArray(files.cast.umas)))) {
    for (const her of hers) out.refused[her.id] = ['cast.json isn’t a cast file (an object with an umas list), so nothing is written']
    return out
  }
  let cast: Obj = isObject(files.cast) ? files.cast : { umas: [] }
  const current = (): PackFiles => ({ ...files, cast, umas: { ...files.umas, ...out.umas }, routes: { ...files.routes, ...out.routes } })
  const errorsOf = (f: PackFiles, id: string) => readStoryPack(f).errors.filter(hersOnly(id))
  for (const her of hers) {
    const before = current()
    const read = readStoryPack(before)
    const pack: StoryPack = { ...read.pack, ...(master ? { master } : {}) }
    const one = scaffoldOne(her, { cast, bible: before.umas[her.id] as Obj | undefined, route: before.routes[her.id] as Obj | undefined }, pack)
    if (one.wrote.length === 0) { out.wrote[her.id] = []; if (one.refused.length > 0) out.refused[her.id] = one.refused; continue }
    const after: PackFiles = { ...before, cast: one.cast, umas: { ...before.umas, ...(one.bible ? { [her.id]: one.bible } : {}) }, routes: { ...before.routes, ...(one.route ? { [her.id]: one.route } : {}) } }
    const was = new Set(errorsOf(before, her.id))
    const added = errorsOf(after, her.id).filter((e) => !was.has(e))
    if (added.length > 0) {
      out.wrote[her.id] = []
      out.refused[her.id] = [...one.refused, ...added.map((e) => `left as she was: ${e}`)]
      continue
    }
    cast = one.cast
    if (one.wrote.some((w) => w.part === 'cast')) out.cast = cast
    if (one.bible) out.umas[her.id] = one.bible
    if (one.route) out.routes[her.id] = one.route
    out.wrote[her.id] = one.wrote
    if (one.refused.length > 0) out.refused[her.id] = one.refused
  }
  return out
}
