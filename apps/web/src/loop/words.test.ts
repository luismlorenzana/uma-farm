// The loop's words for the day: dates, festivals, the nudge's line, and the morning summary in order.
import type { MorningSummary } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { summaryParts } from './summary-words'
import { dateLabel, dateWords, dayCount, festivalWords, nudgeWords, shortDate } from './words'

describe('the date', () => {
  it('names the day, the season, the year and the next festival', () => {
    expect([shortDate(3), dateWords(3), dateWords(49)]).toEqual(['Spring 3', 'Spring 3, year 1', 'Spring 1, year 2'])
    expect(dateLabel(3)).toBe('Spring 3, year 1 · Flower Show in 7 days')
    expect([festivalWords(9), festivalWords(10), festivalWords(11), festivalWords(47)]).toEqual([
      'Flower Show tomorrow', 'Flower Show today', 'Fishing Derby in 11 days', 'Harvest Cup tomorrow',
    ])
    expect([dayCount(1), dayCount(3)]).toEqual(['1 day', '3 days'])
  })
})

describe('the nudge', () => {
  it('says what\'s left in one line', () => {
    expect(nudgeWords({ left: 4, dry: 2, ripe: 1 })).toBe('4 actions left · 2 dry · 1 ripe')
    expect(nudgeWords({ left: 1, dry: 0, ripe: 0 })).toBe('1 action left')
    expect(nudgeWords({ left: 0, dry: 3, ripe: 0 })).toBe('All set')
  })
})

describe('the morning summary', () => {
  it('words each line with its tap, in order, hiding empty sections', () => {
    const summary: MorningSummary = {
      day: 13, bin: [], ranks: [], hearts: [],
      nudges: [{ kind: 'water', tiles: 3 }],
      news: [{ kind: 'season', season: 'summer' }, { kind: 'festival', festival: 'fishing-derby', when: 'tomorrow' }],
      work: [{ kind: 'load', station: 'mill', item: 'wheat-flour@2', count: 8 }, { kind: 'load', station: 'sawmill', item: 'pine-plank@1', count: 1 }],
    }
    expect(summaryParts(summary)).toEqual([
      { section: 'work', title: 'Work done', lines: [
        { key: 'load:mill', text: 'Mill · Wheat Flour ★2 × 8', to: '/?peek=mill' },
        { key: 'load:sawmill', text: 'Sawmill · Pine Plank ★1 × 1', to: '/?peek=sawmill' },
      ] },
      { section: 'news', title: 'New today', lines: [
        { key: 'season', text: 'Summer begins', to: '/?sheet=calendar' },
        { key: 'festival:tomorrow', text: 'Fishing Derby tomorrow', to: '/?sheet=calendar' },
      ] },
      { section: 'nudges', title: 'Today', lines: [{ key: 'water', text: '3 tiles to water', to: '/field' }] },
    ])
    expect(summaryParts({ ...summary, work: [], news: [], nudges: [] })).toEqual([])
  })
})

describe('the morning\'s bin', () => {
  it('lists each good and star with its count and gold, the demand marked, then the total', () => {
    const summary: MorningSummary = {
      day: 16, ranks: [], hearts: [], work: [], news: [], nudges: [],
      bin: [{ kind: 'sold', id: 'salmon', stars: 2, count: 3, gold: 495, demand: true }, { kind: 'sold', id: 'pine-log', stars: 1, count: 2, gold: 50, demand: false }],
    }
    expect(summaryParts(summary)).toEqual([{ section: 'bin', title: 'The bin', lines: [
      { key: 'sold:salmon@2', text: 'Salmon ★2 × 3 · 495g', to: '/?sheet=bin', tag: 'In demand' },
      { key: 'sold:pine-log@1', text: 'Pine Log ★1 × 2 · 50g', to: '/?sheet=bin' },
      { key: 'sold:total', text: 'Total · 545g', to: '/?sheet=bin' },
    ] }])
  })
})


describe('the morning\'s food, upkeep and loans', () => {
  it('says each loan\'s share, the upkeep, a short night as a warning, then half pace, and the owed paid, each a tap to the Book', () => {
    const summary: MorningSummary = {
      day: 16, bin: [], ranks: [], hearts: [], work: [], news: [], nudges: [],
      money: [
        { kind: 'loan', for: 'mill', paid: 55, left: 440 }, { kind: 'loan', for: 'dorm:2', paid: 0, left: 770 }, { kind: 'loan', for: 'house:1', paid: 80, left: 0 },
        { kind: 'upkeep', paid: 5, due: 45 }, { kind: 'short', owed: 40, nights: 1 },
      ],
    }
    expect(summaryParts(summary)).toEqual([{ section: 'money', title: 'Food, upkeep and loans', lines: [
      { key: 'loan:mill', text: 'Loan for the Mill · 55g repaid · 440g left', to: '/book' },
      { key: 'loan:dorm:2', text: 'Loan for Dorm level 2 · no sales, nothing repaid · 770g left', to: '/book' },
      { key: 'loan:house:1', text: 'Loan for House 1 · cleared', to: '/book', tag: 'Cleared' },
      { key: 'upkeep', text: 'Upkeep · 5g of 45g', to: '/book' },
      { key: 'short', text: 'Short of upkeep · 40g owed', to: '/book', tag: 'Warning', warn: true },
    ] }])
    const half = summaryParts({ ...summary, money: [{ kind: 'upkeep', paid: 0, due: 85 }, { kind: 'short', owed: 85, nights: 2 }] })[0]!.lines
    expect(half.map((l) => [l.text, l.tag])).toEqual([['Upkeep · 0g of 85g', undefined], ['Short of upkeep · 85g owed · farmhands at half pace', 'Half pace']])
    const paid = summaryParts({ ...summary, money: [{ kind: 'upkeep', paid: 130, due: 130 }, { kind: 'paid-up', owed: 85 }] })[0]!.lines
    expect(paid.map((l) => [l.text, l.tag])).toEqual([['Upkeep · 130g', undefined], ['Upkeep paid up · 85g owed', 'Paid']])
    // A morning from before upkeep has no such section.
    expect(summaryParts({ ...summary, money: undefined })).toEqual([])
  })

  it('says a new farm\'s takeout, the meals from the pantry, what spoiled and a good meal\'s well fed, before the upkeep', () => {
    const summary: MorningSummary = { day: 2, bin: [], ranks: [], hearts: [], work: [], news: [], nudges: [], money: [{ kind: 'takeout', meals: 2, paid: 30, due: 30 }] }
    expect(summaryParts(summary)).toEqual([{ section: 'money', title: 'Food, upkeep and loans', lines: [{ key: 'takeout', text: 'Takeout · 30g', to: '/book' }] }])
    const fed = summaryParts({
      ...summary,
      money: [{ kind: 'pantry', meals: 6, spoiled: 2, fed: 2 }, { kind: 'takeout', meals: 2, paid: 10, due: 30 }, { kind: 'upkeep', paid: 0, due: 45 }, { kind: 'short', owed: 65, nights: 1 }],
    })[0]!.lines
    expect(fed.map((l) => [l.text, l.tag])).toEqual([
      ['From the pantry · 6 meals · 2 spoiled', 'Well fed'], ['Takeout · 10g of 30g', undefined], ['Upkeep · 0g of 45g', undefined], ['Short of upkeep · 65g owed', 'Warning'],
    ])
    expect(summaryParts({ ...summary, money: [{ kind: 'pantry', meals: 2, spoiled: 0, fed: 0 }] })[0]!.lines).toEqual([{ key: 'pantry', text: 'From the pantry · 2 meals', to: '/book' }])
  })
})

describe('the morning\'s field', () => {
  it('says what grew and ripened, what withered, and tiles to plant, each opening the field', () => {
    const summary: MorningSummary = {
      day: 25, bin: [], ranks: [], hearts: [], news: [],
      work: [{ kind: 'grew', tiles: 9, ripe: 2 }, { kind: 'withered', crop: 'tomato', tiles: 3 }],
      nudges: [{ kind: 'seeds', tiles: 4 }],
    }
    expect(summaryParts(summary)).toEqual([
      { section: 'work', title: 'Work done', lines: [
        { key: 'grew', text: 'The field · 9 crops grew · 2 ripe', to: '/field' },
        { key: 'withered:tomato', text: 'The field · 3 Tomato withered', to: '/field' },
      ] },
      { section: 'nudges', title: 'Today', lines: [{ key: 'seeds', text: '4 tiles to plant', to: '/field' }] },
    ])
    expect(summaryParts({ ...summary, work: [{ kind: 'grew', tiles: 1, ripe: 0 }] })[0]!.lines[0]!.text).toBe('The field · 1 crop grew')
  })
})

describe('the morning\'s ranks', () => {
  it('names rank-ups, then points full with the challenge in its own words, each opening her sheet', () => {
    const summary: MorningSummary = {
      day: 6, bin: [], work: [], hearts: [], news: [], nudges: [],
      ranks: [
        { kind: 'rank-up', outfitId: '101', activity: 'farming', rank: 1 },
        { kind: 'full', outfitId: '202', activity: 'fishing', rank: 1, challenge: 12 },
        { kind: 'full', outfitId: '101', activity: 'mining', rank: 2, challenge: 0 },
      ],
    }
    const names: Record<string, string> = { 101: 'Aster', 202: 'Beryl' }
    expect(summaryParts(summary, (id) => names[id]!)).toEqual([{ section: 'ranks', title: 'Ranks', lines: [
      { key: 'rank-up:101:farming', text: 'Aster · Farming Hand', to: '/hearts?view=work&uma=101', tag: 'Rank up' },
      { key: 'full:202:fishing', text: 'Beryl · Fishing · Catch 30 fish · 12/30', to: '/hearts?view=work&uma=202', tag: 'Points full' },
      { key: 'full:101:mining', text: 'Aster · Mining · Dig at floor 10', to: '/hearts?view=work&uma=101', tag: 'Points full' },
    ] }])
    expect(summaryParts(summary)[0]!.lines[0]!.text).toBe('An Uma · Farming Hand')
  })
})

describe('the morning\'s new story', () => {
  it('opens New today with "New story arrived" and the release\'s note, read by its number, tagged New, a tap to the Hearts tab', () => {
    const summary: MorningSummary = {
      day: 8, bin: [], work: [], ranks: [], hearts: [], nudges: [],
      news: [{ kind: 'story', number: 4 }, { kind: 'season', season: 'summer' }],
    }
    const noteOf = (n: number) => (n === 4 ? 'An invented chapter.' : null)
    expect(summaryParts(summary, undefined, [], null, undefined, undefined, noteOf)).toEqual([{ section: 'news', title: 'New today', lines: [
      { key: 'story', text: 'New story arrived · An invented chapter.', to: '/hearts', tag: 'New' },
      { key: 'season', text: 'Summer begins', to: '/?sheet=calendar' },
    ] }])
    // Another release's number, or the pack still loading: the words alone.
    expect(summaryParts({ ...summary, news: [{ kind: 'story', number: 5 }] }, undefined, [], null, undefined, undefined, noteOf)[0]!.lines[0]!.text).toBe('New story arrived')
    expect(summaryParts(summary)[0]!.lines[0]!.text).toBe('New story arrived')
  })
})
