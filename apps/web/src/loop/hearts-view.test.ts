// The Hearts tab's view model: the rows' sort, filters and counts, the bar's
// segments and a waiting rung's mark, the profile's track, Next card, perks, gifts and ties, the morning's Hearts section
// in the summary's order with live Ready lines. The invented stand-in pack
// (9000001–9000003), with every rung scripted where a test needs several Umas Ready; no network.
import {
  newLove, newRosterUma, newSave, pairKey, readiness, ROUTE_RUNGS, STAND_IN_FILES, storyPackFrom, type HerChapter, type Love, type MorningSummary,
  type Readiness, type SaveV4,
} from '@farm/domain'
import { describe, expect, it } from 'vitest'
import {
  chaptersView, filterCounts, giftSlots, glanceWords, heartBar, heartRows, levelShort, marriedOf, nextCard, perkList, placeWords, readyLines, reachedWords, routeTrack, rowNote, tieRows,
  type HeartsPack,
} from './hearts-view'
import { nextWords, readyWords } from './love-words'
import { heartsLines, summaryParts, umaSheet } from './summary-words'

const PACK = storyPackFrom(STAND_IN_FILES)
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
/** The stand-in with every rung scripted for all three, so more than one can be Ready. */
const ALL: HeartsPack = { ...PACK, scripted: new Map([ONE, TWO, THREE].map((id) => [id, new Set(ROUTE_RUNGS)])) }
const NAMES: Record<string, string> = { [ONE]: 'Stand-in 1', [TWO]: 'Stand-in 2', [THREE]: 'Stand-in 3' }
const nameOf = (id: string) => NAMES[id] ?? 'An Uma'

/** The three stand-ins home on `day`, each with her love as given. */
function farm(loves: Partial<Record<string, Partial<Love>>> = {}, day = 5): SaveV4 {
  const save = newSave('u1', '2026-11-11T10:00:00.000Z')
  const ids = [ONE, TWO, THREE]
  return {
    ...save, calendar: { day }, farmer: { name: 'Robin' },
    roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])),
    love: Object.fromEntries(ids.map((id) => [id, { ...newLove(), ...loves[id] }])),
    dorm: { ...save.dorm, home: ids },
  }
}
const segments = (love: Pick<Love, 'stage' | 'level' | 'points'>, state: Pick<Readiness, 'ready' | 'waits'> = { ready: false, waits: { kind: 'bar' } }) => {
  const heart = heartBar(love, state)
  return heart.segments.map((s) => (s.state === 'full' ? '■' : s.state === 'filling' ? '▣' : '□')).join('')
}

describe('the rows', () => {
  it('sorts Ready first, then the least progress, then the cast’s order', () => {
    // 9000003 is Ready at Friendship 2; 9000001 and 9000002 wait at Friendship 3, 9000002 with fewer points.
    const save = farm({ [ONE]: { level: 2, points: 100 }, [TWO]: { level: 2, points: 50 }, [THREE]: { level: 1, points: 240 } })
    expect(heartRows(save, ALL, nameOf).map((r) => [r.id, r.state.ready])).toEqual([[THREE, true], [TWO, false], [ONE, false]])
    // The same progress and points: the cast's order.
    const tied = farm({ [ONE]: { level: 2, points: 100 }, [TWO]: { level: 2, points: 100 }, [THREE]: { level: 4 } })
    expect(heartRows(tied, ALL, nameOf).map((r) => r.id)).toEqual([ONE, TWO, THREE])
    // A further rung sorts after a nearer one, whatever the points.
    const further = farm({ [ONE]: { stage: 'romance', level: 0, points: 10 }, [TWO]: { level: 9, points: 500 } })
    expect(heartRows(further, ALL, nameOf).map((r) => r.id)).toEqual([THREE, TWO, ONE])
  })

  it('puts each Uma in her filters and counts them', () => {
    const base = farm({ [ONE]: { level: 1, points: 240 }, [TWO]: { stage: 'proposal', level: 10 }, [THREE]: { stage: 'spouse', level: 2, wed: 3 } })
    const save: SaveV4 = { ...base, dorm: { ...base.dorm, home: [ONE, TWO] } }
    const rows = heartRows(save, ALL, nameOf)
    const of = (id: string) => rows.find((r) => r.id === id)!.filters
    expect([of(ONE), of(TWO), of(THREE)]).toEqual([['ready', 'friends'], ['partners'], ['married', 'away']])
    expect(filterCounts(rows)).toEqual({ ready: 1, friends: 1, partners: 1, married: 1, away: 1 })
    // Her confession's wait is a friend's; the wedding's a partner's.
    const waits = heartRows(farm({ [ONE]: { stage: 'confession', level: 10 }, [TWO]: { stage: 'wedding', level: 10 } }), ALL, nameOf)
    expect(waits.find((r) => r.id === ONE)!.filters).toContain('friends')
    expect(waits.find((r) => r.id === TWO)!.filters).toContain('partners')
    expect(marriedOf(save)).toEqual({ married: 1, met: 3 })
  })

  it('draws the ladder’s hearts: F7 with 300 of 480, R4 with 40 banked, S2', () => {
    const f7 = heartBar({ stage: 'friendship', level: 7, points: 300 }, { ready: false, waits: { kind: 'bar' } })
    expect(segments({ stage: 'friendship', level: 7, points: 300 })).toBe('■■■■■■■▣□□')
    expect(f7.segments[7]!.share).toBe(0.625)
    expect(f7.colour).toBe('#f07a5c')
    const r4 = heartRows(farm({ [ONE]: { stage: 'romance', level: 4, points: 400 } }), ALL, nameOf).find((r) => r.id === ONE)!
    expect(segments({ stage: 'romance', level: 4, points: 400 })).toBe('■■■■▣□□□□□')
    expect([r4.bar.points, r4.bar.cost, r4.bar.banked, r4.heart.colour, r4.level]).toEqual([360, 360, 40, '#e0567a', 'Partner · R4'])
    expect(segments({ stage: 'spouse', level: 2, points: 120 })).toBe('■■▣□□')
    expect(heartBar({ stage: 'spouse', level: 2, points: 120 }, { ready: false, waits: { kind: 'bar' } }).colour).toBe('#d9a227')
    expect(segments({ stage: 'spouse', level: 5, points: 0 })).toBe('■■■■■')
    expect(segments({ stage: 'friendship', level: 0, points: 0 })).toBe('▣□□□□□□□□□')
  })

  it('shows a waiting rung’s mark with “Tomorrow”, then “Ready”', () => {
    const save = farm({ [ONE]: { stage: 'confession', level: 10, last: 5 } })
    const tomorrow = heartRows(save, ALL, nameOf).find((r) => r.id === ONE)!
    expect([segments(save.love[ONE]!), tomorrow.heart.mark, tomorrow.heart.markWords, tomorrow.note]).toEqual(['■■■■■■■■■■', '◆', 'Tomorrow', 'Her confession · Ready tomorrow'])
    const next = heartRows({ ...save, calendar: { day: 6 } }, ALL, nameOf).find((r) => r.id === ONE)!
    expect([next.heart.mark, next.heart.markWords, next.state.ready, next.note]).toEqual(['◆', 'Ready', true, 'Ready · Her confession · the Overlook'])
    const proposal = heartBar({ stage: 'proposal', level: 10, points: 0 }, { ready: false, waits: { kind: 'ring' } })
    expect([proposal.mark, proposal.markWords, proposal.ladder]).toEqual(['◇', null, 'romance'])
  })

  it('says the most useful line under the bar', () => {
    const save = farm({ [ONE]: { level: 1, points: 240 }, [TWO]: { level: 1, points: 30 } })
    const away: SaveV4 = { ...save, dorm: { ...save.dorm, home: [ONE, THREE] } }
    const rows = heartRows(away, PACK, nameOf)
    const note = (id: string) => rows.find((r) => r.id === id)!.note
    expect(note(ONE)).toBe('Ready · Friendship 2 · the Fields')
    // 9000002 is away; 9000003's short bar says it all, her unscripted route playing the game's cards.
    expect(note(TWO)).toBe('Lives in town: find her there')
    expect(note(THREE)).toBeNull()
    const scripted = heartRows(away, ALL, nameOf)
    expect(scripted.find((r) => r.id === TWO)!.note).toBe('Lives in town: find her there')
    expect(scripted.find((r) => r.id === THREE)!.note).toBeNull()
    expect(rowNote({ rung: 'f3', ready: false, waits: { kind: 'today' } }, { points: 280, cost: 280 }, true, null, nameOf)).toBe('Friendship 3 · tomorrow: one event a day')
    expect([placeWords('fields'), placeWords('forest'), placeWords('pond-night'), placeWords('festival')]).toEqual(['the Fields', 'the forest', 'the Pond at night', 'the festival ground'])
  })

  it('names her level in the Work view’s corner', () => {
    expect([
      levelShort({ stage: 'friendship', level: 0 }), levelShort({ stage: 'friendship', level: 7 }), levelShort({ stage: 'confession', level: 10 }),
      levelShort({ stage: 'romance', level: 4 }), levelShort({ stage: 'wedding', level: 10 }), levelShort({ stage: 'spouse', level: 2 }),
    ]).toEqual([null, 'F7', 'F10', 'R4', 'R10', 'S2'])
  })
})

describe('her profile', () => {
  const played = (love: Pick<Love, 'stage' | 'level' | 'points'>) => routeTrack(love).filter((c) => c.state === 'played').map((c) => c.rung)
  const next = (love: Pick<Love, 'stage' | 'level' | 'points'>) => routeTrack(love).find((c) => c.state === 'next')

  it('fills the track’s played rungs at each stage, the next one filling', () => {
    expect(routeTrack({ stage: 'friendship', level: 0, points: 0 })).toHaveLength(28)
    expect(played({ stage: 'friendship', level: 0, points: 100 })).toEqual([])
    expect(next({ stage: 'friendship', level: 0, points: 100 })).toMatchObject({ rung: 'f1', share: 0.5, colour: '#f07a5c' })
    expect(played({ stage: 'friendship', level: 7, points: 0 })).toEqual(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'])
    expect(next({ stage: 'confession', level: 10, points: 0 })).toMatchObject({ rung: 'confession', wait: true, share: 1 })
    expect(played({ stage: 'romance', level: 4, points: 0 })).toHaveLength(15)
    expect(next({ stage: 'romance', level: 4, points: 180 })).toMatchObject({ rung: 'r5', share: 0.5, colour: '#e0567a' })
    expect(next({ stage: 'wedding', level: 10, points: 0 })).toMatchObject({ rung: 'wedding', wait: true })
    expect(played({ stage: 'spouse', level: 2, points: 0 }).slice(-4)).toEqual(['proposal', 'wedding', 's1', 's2'])
    expect(next({ stage: 'spouse', level: 2, points: 300 })).toMatchObject({ rung: 's3', share: 0.5, colour: '#d9a227' })
    expect(played({ stage: 'spouse', level: 5, points: 0 })).toHaveLength(28)
    expect(next({ stage: 'spouse', level: 5, points: 0 })).toBeUndefined()
  })

  it('says each of her waits on the Next card', () => {
    const at = (waits: Readiness['waits'], rung: string | null = 'r5') => nextWords({ rung, ready: waits === null, waits }, { points: 300, cost: 360 }, nameOf)
    expect([
      at(null), at({ kind: 'bar' }), at({ kind: 'day' }, 'confession'), at({ kind: 'ring' }, 'proposal'), at({ kind: 'today' }),
      at({ kind: 'setup', setup: { kind: 'working', activity: 'fishing' } }), at({ kind: 'setup', setup: { kind: 'item', good: 'carrot' } }),
      at({ kind: 'setup', setup: { kind: 'bond', with: TWO, level: 3 } }), at({ kind: 'opens', place: 'mine' }),
      at({ kind: 'night' }, 's2'), at({ kind: 'friend' }, 'confession'), at({ kind: 'done' }, null),
    ]).toEqual([
      'Ready', '60 to go', 'Tomorrow', 'Needs a ring', 'Tomorrow: one event a day', 'The Fishery, when she works there', 'With Carrot in the Warehouse',
      'Bond 3 with Stand-in 2', 'Opens when the Mine is built', 'Comes tonight', 'She said “Not yet”', 'Her route is complete',
    ])
  })

  it('builds the Next card: the rung, its perk, her bible’s hint, the bar and what it waits for', () => {
    const ready = nextCard(farm({ [ONE]: { level: 1, points: 300 } }), PACK, ONE, nameOf)
    expect(ready).toMatchObject({
      rung: 'f2', title: 'Next: Friendship 2', perk: { words: '+10% at the Fields', opens: null }, hint: 'The Fields, while she works them.',
      bar: { points: 240, cost: 240, banked: 60 }, words: 'Ready', ready: true,
    })
    expect(nextCard(farm({ [ONE]: { level: 2, points: 30 } }), PACK, ONE, nameOf)).toMatchObject({ perk: { words: 'Hangouts in the evening' }, words: '250 to go', waits: 'bar' })
    // 9000002 has no bible: no hint, her calling's perks; her unscripted Friendship 1 waits only on her bar.
    expect(nextCard(farm(), PACK, TWO, nameOf)).toMatchObject({ title: 'Next: Friendship 1', hint: null, perk: { words: 'Her loved gift shown; her own chats' }, waits: 'bar' })
    expect(nextCard(farm({ [ONE]: { stage: 'spouse', level: 5 } }), PACK, ONE, nameOf)).toMatchObject({ rung: null, title: 'Her route is complete', perk: null, words: 'Her route is complete' })
  })

  it('lists the perks reached, the next and the rest', () => {
    const list = perkList(farm({ [ONE]: { stage: 'romance', level: 4 } }), PACK, ONE)
    expect(list).toHaveLength(25)
    expect(list.filter((p) => p.state === 'reached').map((p) => p.rung).slice(-2)).toEqual(['r3', 'r4'])
    expect(list.find((p) => p.state === 'next')).toMatchObject({ rung: 'r5', words: '+10% more at the Fields (+20%)' })
    expect(reachedWords(list)).toBe('F1–F10 ✓ · R1–R4 ✓')
    expect(reachedWords(perkList(farm(), PACK, ONE))).toBeNull()
    expect(reachedWords(perkList(farm({ [ONE]: { level: 1 } }), PACK, ONE))).toBe('F1 ✓')
    // Her confession brings no perk: the next is R1's.
    expect(perkList(farm({ [ONE]: { stage: 'confession', level: 10 } }), PACK, ONE).find((p) => p.state === 'next')?.rung).toBe('r1')
  })

  it('shows her gifts by Friendship 1, as learnt, and all from Friendship 7', () => {
    const slots = (love: Partial<Love>) => giftSlots(PACK, { ...newLove(), ...love }, ONE).slots.map((s) => `${s.taste}:${s.good ?? '?'}:${s.points}`)
    expect(slots({})).toEqual(['loved:?:60', 'liked:?:30', 'liked:?:30', 'liked:?:30', 'disliked:?:0', 'disliked:?:0'])
    expect(slots({ level: 1 })).toEqual(['loved:golden-carrot:60', 'liked:?:30', 'liked:?:30', 'liked:?:30', 'disliked:?:0', 'disliked:?:0'])
    expect(slots({ level: 1, known: ['carrot', 'limestone'] })).toEqual(['loved:golden-carrot:60', 'liked:carrot:30', 'liked:?:30', 'liked:?:30', 'disliked:limestone:0', 'disliked:?:0'])
    expect(slots({ level: 7 })).toEqual(['loved:golden-carrot:60', 'liked:carrot:30', 'liked:potato:30', 'liked:cabbage:30', 'disliked:limestone:0', 'disliked:iron-ore:0'])
    // No bible: the default story's tastes, her favourite good (a forager's Chestnut) loved, every other gift +10.
    expect(giftSlots(PACK, newLove(), TWO)).toEqual({ slots: [{ taste: 'loved', good: null, points: 60 }], others: 10 })
    expect(giftSlots(PACK, { ...newLove(), level: 1 }, TWO).slots[0]!.good).toBe('chestnut')
  })

  it('lists her ties, strongest first, with bond hearts from today’s bonds', () => {
    const save = farm()
    const bonded: SaveV4 = { ...save, bonds: { [pairKey(ONE, THREE)]: 160 } }
    expect(tieRows(bonded, PACK, ONE).map((t) => [t.with, t.words, t.hearts, t.here])).toEqual([[TWO, 'Friends', 0, true], [THREE, 'Rivals', 2, true]])
    const { [THREE]: _, ...roster } = bonded.roster
    expect(tieRows({ ...bonded, roster }, PACK, ONE).find((t) => t.with === THREE)!.here).toBe(false)
    expect(tieRows(bonded, PACK, THREE).map((t) => t.with)).toEqual([ONE, TWO])
  })
})

describe('the morning’s Hearts section', () => {
  const summary = (hearts: MorningSummary['hearts']): MorningSummary => ({ day: 5, bin: [], work: [], ranks: [], hearts, news: [], nudges: [] })

  it('orders Ready (playing her event), then birthdays and anniversaries, then those the night met, each opening her profile', () => {
    const lines = summaryParts(summary([
      { kind: 'arrived', id: THREE, home: false }, { kind: 'birthday', id: ONE, when: 'today' }, { kind: 'anniversary', id: TWO, when: 'today', item: 'carrot' },
      { kind: 'birthday', id: TWO, when: 'tomorrow' },
    ]), nameOf, [{ id: ONE, rung: 'r5', place: 'the Fields' }]).find((p) => p.section === 'hearts')!.lines
    expect(lines.map((l) => [l.text, l.to])).toEqual([
      ['● Ready · Stand-in 1 · Romance 5 · the Fields', `/?event=${ONE}`],
      ['★ Stand-in 1’s birthday today', `/hearts?uma=${ONE}`],
      ['♥ Stand-in 2’s anniversary · ★5 Carrot left for you', `/hearts?uma=${TWO}`],
      ['★ Tomorrow: Stand-in 2’s birthday', `/hearts?uma=${TWO}`],
      ['Met Stand-in 3 · in town', `/hearts?uma=${THREE}`],
    ])
  })

  it('lists three Ready lines, then “+2 more” to the tab filtered on Ready', () => {
    const five = ['9000001', '9000002', '9000003', '9000004', '9000005'].map((id) => ({ id, rung: 'f2', place: null }))
    const lines = heartsLines([], five, nameOf)
    expect(lines.map((l) => l.key)).toEqual(['ready:9000001', 'ready:9000002', 'ready:9000003', 'ready:more'])
    expect(lines.at(-1)).toEqual({ key: 'ready:more', to: '/hearts?filter=ready', text: '+2 more' })
    // A morning with only Ready lines still shows Hearts, after Ranks.
    expect(summaryParts(summary([]), nameOf, five.slice(0, 1)).map((p) => p.section)).toEqual(['hearts'])
    expect(summaryParts(summary([]), nameOf).map((p) => p.section)).toEqual([])
  })

  it('reads Ready live: no line for an Uma who played an event today', () => {
    const save = farm({ [ONE]: { level: 1, points: 300 }, [THREE]: { level: 0, points: 250 } })
    expect(readyLines(save, ALL)).toEqual([{ id: THREE, rung: 'f1', place: null }, { id: ONE, rung: 'f2', place: 'the Fields' }])
    expect(readyLines({ ...save, today: { ...save.today, events: [ONE] } }, ALL).map((l) => l.id)).toEqual([THREE])
    // Unscripted, 9000003 is Ready all the same: her event plays the game's card.
    expect(readyLines(save, PACK).map((l) => l.id)).toEqual([THREE, ONE])
  })

  it('sends her links to her profile on the Hearts tab, on its Work side for her ranks', () => {
    expect([umaSheet(ONE), umaSheet(ONE, 'work')]).toEqual([`/hearts?uma=${ONE}`, `/hearts?view=work&uma=${ONE}`])
  })
})

describe('her chapters', () => {
  /** Six chapters for 9000001, a Kitchen gate on the third. */
  const SIX: HerChapter[] = [
    { title: 'A new face', events: ['arrival', 'f1', 'f2', 'f3'] },
    { title: 'Fields', events: ['f4', 'f5', 'f6'] },
    { title: 'Kitchen days', events: ['f7', 'f8', 'f9', 'f10'], gate: { kind: 'built', place: 'kitchen' } },
    { title: 'Hand in hand', events: ['confession', 'r1', 'r2', 'r3', 'r4', 'r5'] },
    { title: 'Promises', events: ['r6', 'r7', 'r8', 'r9', 'r10', 'proposal'] },
    { title: 'Home', events: ['wedding', 's1', 's3', 's5'] },
  ]
  const six: HeartsPack = { ...PACK, cast: { ...PACK.cast, umas: PACK.cast.umas.map((u) => (u.characterId === ONE ? { ...u, chapters: SIX } : u)) } }
  const met = (save: SaveV4): SaveV4 => ({ ...save, arrivals: [ONE, TWO, THREE] })

  it('with no pack’s, shows the four defaults, the first under way', () => {
    const view = chaptersView(met(farm({ [ONE]: { level: 2 } })), PACK, ONE, nameOf)
    expect(view.chapters.map((c) => [c.n, c.title, c.state, `${c.played}/${c.events.length}`])).toEqual([
      [1, 'Getting to know her', 'current', '3/12'], [2, 'Together', 'ahead', '0/11'], [3, 'The wedding', 'ahead', '0/1'], [4, 'Married life', 'ahead', '0/3'],
    ])
    expect(view.chapters[0]!.events.slice(0, 4).map((e) => [e.label, e.played])).toEqual([['Meeting', true], ['F1', true], ['F2', true], ['F3', false]])
    expect(view.chapters[0]!.events.at(-1)!.label).toBe('Confession')
    expect(view.next).toEqual({ title: 'Together', after: 'After her confession', gate: null })
    expect(view.closed).toBe(false)
    expect(heartRows(farm(), PACK, nameOf).map((r) => glanceWords(r.chapter))).toEqual(['Ch. 1 · Getting to know her', 'Ch. 1 · Getting to know her', 'Ch. 1 · Getting to know her'])
  })

  it('with the pack’s six, the third waits for the Kitchen: her row, her Next card and her chapters say so', () => {
    const save = met(farm({ [ONE]: { level: 6, points: 440 } }))
    const view = chaptersView(save, six, ONE, nameOf)
    expect(view.chapters.map((c) => c.title)).toEqual(SIX.map((c) => c.title))
    expect(view.chapters.map((c) => c.state)).toEqual(['done', 'done', 'current', 'ahead', 'ahead', 'ahead'])
    expect(view.chapters[2]!.gate).toBe('Opens when the Kitchen is built')
    expect(view.next).toEqual({ title: 'Hand in hand', after: 'After Friendship 10', gate: null })
    const state = readiness(save, six, ONE)
    expect(state.waits).toEqual({ kind: 'gate', gate: { kind: 'built', place: 'kitchen' } })
    expect(nextWords(state, { points: 440, cost: 440 }, nameOf)).toBe('Opens when the Kitchen is built')
    expect(readyWords(state, { points: 440, cost: 440 }, nameOf)).toBe('Friendship 7 · Opens when the Kitchen is built')
    const row = heartRows(save, six, nameOf).find((r) => r.id === ONE)!
    expect([glanceWords(row.chapter), row.note]).toEqual(['Ch. 3 · Kitchen days', 'Friendship 7 · Opens when the Kitchen is built'])
    // Built, she's Ready and the gate's words go.
    const kitchen = { ...save, buildings: { ...save.buildings, kitchen: 1 } }
    expect(readiness(kitchen, six, ONE).ready).toBe(true)
    expect(chaptersView(kitchen, six, ONE, nameOf).chapters[2]!.gate).toBeNull()
    // Two chapters ahead, the next's gate is in the Next line.
    expect(chaptersView(met(farm({ [ONE]: { level: 4 } })), six, ONE, nameOf).next).toEqual({ title: 'Kitchen days', after: 'After Friendship 6', gate: 'Opens when the Kitchen is built' })
  })

  it('closes her last chapter once her route is complete', () => {
    const view = chaptersView(met(farm({ [ONE]: { stage: 'spouse', level: 5 } })), PACK, ONE, nameOf)
    expect(view.chapters.every((c) => c.state === 'done')).toBe(true)
    expect([view.next, view.closed]).toEqual([null, true])
    expect(glanceWords(heartRows(farm({ [ONE]: { stage: 'spouse', level: 5 } }), PACK, nameOf).find((r) => r.id === ONE)!.chapter)).toBe('Married life ✓')
  })

  it('says “A new chapter with ‹name›” on the morning one opens, with its title once the pack is in', () => {
    const summary: MorningSummary = { day: 5, bin: [], work: [], ranks: [], hearts: [{ kind: 'arrived', id: THREE, home: true }, { kind: 'chapter', id: ONE, chapter: 2 }], news: [], nudges: [] }
    const titled = summaryParts(summary, nameOf, [], null, undefined, (_id, n) => (n === 2 ? 'Together' : null)).find((p) => p.section === 'hearts')!.lines
    expect(titled.map((l) => [l.text, l.to, l.tag])).toEqual([
      ['Met Stand-in 3 · moved in', `/hearts?uma=${THREE}`, 'New'], ['A new chapter with Stand-in 1 · Together', `/hearts?uma=${ONE}`, 'New'],
    ])
    expect(heartsLines(summary.hearts, [], nameOf)[1]!.text).toBe('A new chapter with Stand-in 1')
  })
})

