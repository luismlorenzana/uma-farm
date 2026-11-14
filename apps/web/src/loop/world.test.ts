// The world in the pack on screen: the opening's title line, the date chip's festival, the morning's season line, its
// festival names, its Town notes and the town's name, from an invented world on the stand-in. With no world.json, the
// game's own words. No original-game content.
import { festivalsOf, STAND_IN_FILES, storyPackFrom, type MorningSummary } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { openingTitle } from './ScenePlayer'
import { NO_WORLD, summaryParts, worldWords } from './summary-words'
import { dateLabel, theName } from './words'

const WORLD = {
  names: { town: 'Fernwick', farm: 'Thistle Farm' },
  festivals: [{ id: 'flower-show', name: 'Bloom Fair' }, { id: 'lantern-walk', name: 'Lantern Walk', season: 'spring', day: 4 }],
  seasons: { summer: 'The river runs warm.' },
  notes: [{ id: 'first-friend', title: 'A first friend', lines: ['She knew the farm first.'], unlock: { kind: 'event', after: '9000001:arrival' } }],
}
const PACK = storyPackFrom({ ...STAND_IN_FILES, world: WORLD })

describe('the opening’s title line', () => {
  it('names the farm and the town until a place step, else "Day 1"', () => {
    expect(openingTitle(null, { farm: 'Thistle Farm', town: 'Fernwick' })).toBe('Day 1 · Thistle Farm, Fernwick')
    expect(openingTitle(null, { farm: null, town: 'Fernwick' })).toBe('Day 1 · Fernwick')
    expect(openingTitle('gate', { farm: 'Thistle Farm', town: 'Fernwick' })).toBe('Day 1 · Gate')
    expect(openingTitle(null, { farm: null, town: null })).toBe('Day 1')
  })
})

describe('the year’s festivals on the date chip', () => {
  it('names the story’s next festival, and the game’s without it', () => {
    expect(dateLabel(3, festivalsOf(PACK))).toBe('Spring 3, year 1 · Lantern Walk tomorrow')
    expect(dateLabel(5, festivalsOf(PACK))).toBe('Spring 5, year 1 · Bloom Fair in 5 days')
    expect(dateLabel(3)).toBe('Spring 3, year 1 · Flower Show in 7 days')
    expect([theName('Fields'), theName('The Long Run')]).toEqual(['the Fields', 'The Long Run'])
  })
})

describe('the morning’s world', () => {
  const summary: MorningSummary = {
    day: 13, bin: [], ranks: [], work: [], nudges: [],
    hearts: [{ kind: 'arrived', id: '9000002', home: false }],
    news: [{ kind: 'season', season: 'summer' }, { kind: 'festival', festival: 'lantern-walk', when: 'tomorrow' }, { kind: 'notes', ids: ['first-friend'] }],
  }
  const lines = (world = NO_WORLD) => summaryParts(summary, () => 'Stand-in 2', [], null, undefined, undefined, undefined, world).flatMap((p) => p.lines)

  it('puts the season’s line under it, names the story’s festival and the Town note, and the town where she’s met', () => {
    expect(lines(worldWords(PACK)).map((l) => [l.key, l.text, l.quote ?? null, l.tag ?? null, l.to])).toEqual([
      ['arrived:9000002', 'Met Stand-in 2 · in Fernwick', null, 'New', '/hearts?uma=9000002'],
      ['season', 'Summer begins', 'The river runs warm.', null, '/?sheet=calendar'],
      ['festival:tomorrow', 'Lantern Walk tomorrow', null, null, '/?peek=festival'],
      ['notes', 'A first friend', null, 'Town note', '/diary?note=first-friend'],
    ])
  })

  it('reads as before with no world: the game’s words, "in town", and a note the pack no longer holds in plain words', () => {
    expect(lines().map((l) => [l.text, l.quote ?? null])).toEqual([
      ['Met Stand-in 2 · in town', null], ['Summer begins', null], ['A festival tomorrow', null], ['A Town note', null],
    ])
    const two = summaryParts({ ...summary, hearts: [], news: [{ kind: 'notes', ids: ['first-friend', 'old-well'] }] }, undefined, [], null, undefined, undefined, undefined, worldWords(PACK))
    expect(two[0]!.lines[0]).toMatchObject({ text: 'A first friend +1 more', tag: 'Town notes' })
  })
})
