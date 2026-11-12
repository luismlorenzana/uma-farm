// The perks' words (F48 decision 7; romance spec RM31, RM32, RM36): one perk on every level of her route, written once as
// templates keyed by her favourite line, in the farm's own words. Her profile lists every one before it's reached and
// F49's level-up card names the one an event brings; **F51 makes each do what it says** (`hasPerk` and the effects), so
// this file is words and ids only. Only three are bespoke per Uma (her signature dish, her keepsake, her dream), named
// generically here until F51 reads them from her bible.
//
//   Level  Friendship                      Romance                          Spouse
//     1    her loved gift shown, her chats dates, her pet name              breakfast in her house
//     2    hangouts                        a morning item every 4th morning  a morning item every 2nd morning
//     3    +10% at her line                stargazing                       her dream, +5% for the crew
//     4    her signature dish              ×1.5 bond with her closest friend a third night chore
//     5    ×1.05 rank points               +10% more at her line (+20%)     vow renewal, her keepsake grows
//     6    a night chore                   dance and boat
//     7    all her tastes                  a second night chore
//     8    in her element                  her ring's engraving
//     9    mentor                          footrace
//    10    her keepsake, ×1.10 rank points the proposal
//
// A perk that works at her line's place says "Opens with chapter n" while that place waits for its chapter (RM36): a
// miner's +10% before chapter 3, a cook's before the Kitchen. Loaded with the romance's screens.
import type { Activity } from '../farm/ranks'
import { castEntry, favouriteOf, type StoryPack } from '../story/pack'

/** The activities whose places open with a chapter (CS3): a working setup there waits for it, and so does a perk at her
 * line's place (RM36). Here since F51, so the perks' terms never import `ready.ts` (and `ready.ts` reads it from here). */
export const ACTIVITY_CHAPTER: Readonly<Partial<Record<Activity, number>>> = { ranch: 2, mining: 3, cooking: 4, expeditions: 5, serving: 6, forging: 7 }

/** Her line as the perks say it: her favourite activity, with a quarry calling's mining at the Quarry (RM6). */
export type PerkLine = Exclude<Activity, 'expeditions'> | 'quarry'
export const PERK_LINES: readonly PerkLine[] = ['farming', 'foraging', 'fishing', 'mining', 'quarry', 'ranch', 'cooking', 'serving', 'forging']

/** Each level's perk (RM31), by id: F51's `hasPerk` and effects key off these. */
export type PerkId =
  | 'tastes-loved' | 'hangouts' | 'line-10' | 'signature-dish' | 'rank-105' | 'night-chore' | 'tastes-all' | 'in-element' | 'mentor' | 'keepsake'
  | 'dates' | 'morning-item' | 'date-stargazing' | 'closest-bond' | 'line-20' | 'date-dance-boat' | 'night-chore-2' | 'engraving' | 'date-footrace'
  | 'proposal'
  | 'breakfast' | 'morning-item-2' | 'dream' | 'night-chore-3' | 'vow-renewal'

/** A level and its perk. `place`: it works at her line's place, so it waits for that place's chapter (RM36). */
export interface PerkDef {
  rung: string
  id: PerkId
  place: boolean
}

/** RM31's table in route order: F1–F10, R1–R10, S1–S5. The waiting rungs (her confession, the proposal's and the
 * wedding's waits) bring no perk of their own. */
export const PERKS: readonly PerkDef[] = [
  { rung: 'f1', id: 'tastes-loved', place: false },
  { rung: 'f2', id: 'hangouts', place: false },
  { rung: 'f3', id: 'line-10', place: true },
  { rung: 'f4', id: 'signature-dish', place: false },
  { rung: 'f5', id: 'rank-105', place: false },
  { rung: 'f6', id: 'night-chore', place: true },
  { rung: 'f7', id: 'tastes-all', place: false },
  { rung: 'f8', id: 'in-element', place: true },
  { rung: 'f9', id: 'mentor', place: true },
  { rung: 'f10', id: 'keepsake', place: false },
  { rung: 'r1', id: 'dates', place: false },
  { rung: 'r2', id: 'morning-item', place: false },
  { rung: 'r3', id: 'date-stargazing', place: false },
  { rung: 'r4', id: 'closest-bond', place: false },
  { rung: 'r5', id: 'line-20', place: true },
  { rung: 'r6', id: 'date-dance-boat', place: false },
  { rung: 'r7', id: 'night-chore-2', place: true },
  { rung: 'r8', id: 'engraving', place: false },
  { rung: 'r9', id: 'date-footrace', place: false },
  { rung: 'r10', id: 'proposal', place: false },
  { rung: 's1', id: 'breakfast', place: false },
  { rung: 's2', id: 'morning-item-2', place: false },
  { rung: 's3', id: 'dream', place: true },
  { rung: 's4', id: 'night-chore-3', place: true },
  { rung: 's5', id: 'vow-renewal', place: false },
]

/** Her line's place in words (RM6's table): where her line's perks work. */
export const PERK_PLACE: Readonly<Record<PerkLine, string>> = {
  farming: 'the Fields', foraging: 'the forest', fishing: 'the Fishery', mining: 'the Mine', quarry: 'the Quarry', ranch: 'the ranch',
  cooking: 'the Kitchen', serving: 'the Restaurant', forging: 'the Forge',
}

/** A night chore by her line (RM32): what F6 brings each night. */
export const NIGHT_CHORE: Readonly<Record<PerkLine, string>> = {
  farming: '+0.25 growth on a block each night',
  foraging: 'One item from the forest each night',
  fishing: 'One fish from the Fishery each night',
  mining: 'One ore from the Mine each night',
  quarry: 'One stone or gem from the Quarry each night',
  ranch: '+5 affection to her pen each night',
  cooking: 'One more dish on the Kitchen’s next play',
  serving: 'One more cover on the Restaurant’s next shift',
  forging: '5% back on the Forge’s next tool',
}

/** A morning item by her line (RM32): what R2 and S2 leave in the Warehouse. */
export const MORNING_GOOD: Readonly<Record<PerkLine, string>> = {
  farming: 'crop of the season', foraging: 'good from the forest', fishing: 'fish', mining: 'ore', quarry: 'stone or gem', ranch: 'egg, milk or fleece',
  cooking: 'dish', serving: 'dish', forging: 'Fitting',
}

/** A perk in words for her line (decision 7): "+10% at the forest", "One item from the forest each night". */
export function perkWords(id: PerkId, line: PerkLine): string {
  const place = PERK_PLACE[line]
  switch (id) {
    case 'tastes-loved': return 'Her loved gift shown; her own chats'
    case 'hangouts': return 'Hangouts in the evening'
    case 'line-10': return `+10% at ${place}`
    case 'signature-dish': return 'Her signature dish’s recipe'
    case 'rank-105': return '×1.05 rank points'
    case 'night-chore': return NIGHT_CHORE[line]
    case 'tastes-all': return 'All her tastes shown, and her closest friend’s loved gift'
    case 'in-element': return `In her element: ×1.2 at ${place} beside a 3-heart friend`
    case 'mentor': return `Mentor: +10% rank points for Umas at ${place}`
    case 'keepsake': return 'Her keepsake; ×1.10 rank points'
    case 'dates': return 'Dates; her pet name for you'
    case 'morning-item': return `A ★2+ ${MORNING_GOOD[line]} every 4th morning`
    case 'date-stargazing': return 'Date: stargazing'
    case 'closest-bond': return '×1.5 bond with her closest friend'
    case 'line-20': return `+10% more at ${place} (+20%)`
    case 'date-dance-boat': return 'Dates: dance and boat'
    case 'night-chore-2': return 'A second night chore'
    case 'engraving': return 'Her ring’s engraving'
    case 'date-footrace': return 'Date: footrace'
    case 'proposal': return 'The proposal'
    case 'breakfast': return 'Breakfast: the crew starts well fed on a morning in her house'
    case 'morning-item-2': return `A ★3+ ${MORNING_GOOD[line]} every 2nd morning, and each morning in her house`
    case 'dream': return `Her dream; +5% for anyone at ${place}`
    case 'night-chore-3': return 'A third night chore'
    case 'vow-renewal': return 'Vow renewal; her keepsake grows'
  }
}

/** The chapter her line's place opens with (CS3: the ranch 2, the Mine and the Quarry 3, the Kitchen 4, the Restaurant 6,
 * the Forge 7), or null for a place open from the start. */
export const lineChapter = (line: PerkLine): number | null => ACTIVITY_CHAPTER[line === 'quarry' ? 'mining' : line] ?? null

/** Her line as the perks read it: her favourite (`favouriteOf`), a quarry calling's mining at the Quarry. Null for
 * someone the pack doesn't hold. */
export function perkLineOf(pack: Pick<StoryPack, 'cast' | 'bibles'>, id: string): PerkLine | null {
  const line = favouriteOf(pack, id)
  if (line === null || line === 'expeditions') return null
  return line === 'mining' && castEntry(pack, id)?.calling === 'quarry' ? 'quarry' : line
}

/** One level's perk for her: its words and, for a perk at her line's place, the chapter it waits for (RM36). */
export interface Perk extends PerkDef {
  words: string
  /** "Opens with chapter n": her line's place waits for chapter `opens`; null when it works now. */
  opens: number | null
}

/** Every perk on her route for her line, in order, at the farm's chapter (RM31, RM36). */
export function perksFor(line: PerkLine, chapter: number): Perk[] {
  const waits = lineChapter(line)
  return PERKS.map((p) => ({ ...p, words: perkWords(p.id, line), opens: p.place && waits !== null && chapter < waits ? waits : null }))
}

/** The perk a rung brings, or null for a waiting rung (the confession, the proposal's and the wedding's waits). */
export const perkOf = (rung: string): PerkDef | null => PERKS.find((p) => p.rung === rung) ?? null
