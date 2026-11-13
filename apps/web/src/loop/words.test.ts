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
    expect(nudgeWords({ idle: ['1', '2'], collect: 3 })).toBe('2 Umas idle · 3 to collect')
    expect(nudgeWords({ idle: ['1'], collect: 0 })).toBe('1 Uma idle')
    expect(nudgeWords({ idle: [], collect: 1 })).toBe('1 to collect')
    expect(nudgeWords({ idle: [], collect: 0 })).toBe('All set')
  })
})

describe('the morning summary', () => {
  it('words each line with its tap, in order, hiding empty sections', () => {
    const summary: MorningSummary = {
      day: 13, bin: [], ranks: [], hearts: [],
      nudges: [{ kind: 'idle', umas: ['101'] }],
      news: [{ kind: 'season', season: 'summer' }, { kind: 'festival', festival: 'fishing-derby', when: 'tomorrow' }],
      work: [{ kind: 'jobs', place: 'forest', jobs: 2, items: 9 }, { kind: 'jobs', place: 'mill', jobs: 1, items: 1 }],
    }
    expect(summaryParts(summary)).toEqual([
      { section: 'work', title: 'Work done', lines: [
        { key: 'jobs:forest', text: 'Forest · 2 jobs done · 9 items', to: '/?peek=forest' },
        { key: 'jobs:mill', text: 'Mill · 1 job done · 1 item', to: '/?peek=mill' },
      ] },
      { section: 'news', title: 'New today', lines: [
        { key: 'season', text: 'Summer begins', to: '/?sheet=calendar' },
        { key: 'festival:tomorrow', text: 'Fishing Derby tomorrow', to: '/?peek=festival' },
      ] },
      { section: 'nudges', title: 'Today', lines: [{ key: 'idle', text: '1 Uma idle', to: '/hearts?view=work' }] },
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


describe('the morning\'s Fields', () => {
  it('lists crops ready by block, what withered, and plots to plant, each opening the Fields', () => {
    const summary: MorningSummary = {
      day: 25, bin: [], ranks: [], hearts: [], news: [],
      work: [{ kind: 'crops', block: 'A', plots: 9 }, { kind: 'crops', block: 'B', plots: 1 }, { kind: 'withered', block: 'A', crop: 'tomato', plots: 3 }],
      nudges: [{ kind: 'seeds', plots: 4 }],
    }
    expect(summaryParts(summary)).toEqual([
      { section: 'work', title: 'Work done', lines: [
        { key: 'crops:A', text: 'Block A · 9 crops ready', to: '/fields' },
        { key: 'crops:B', text: 'Block B · 1 crop ready', to: '/fields' },
        { key: 'withered:A:tomato', text: 'Block A · 3 Tomato withered', to: '/fields' },
      ] },
      { section: 'nudges', title: 'Today', lines: [{ key: 'seeds', text: '4 plots to plant', to: '/fields' }] },
    ])
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

describe('the morning\'s Dorm news', () => {
  it('says the Dorm\'s new beds and who\'s home, each a tap', () => {
    const names: Readonly<Record<string, string>> = { 101: 'Aster', 202: 'Beryl' }
    const summary: MorningSummary = {
      day: 8, bin: [], work: [], ranks: [], hearts: [], nudges: [],
      news: [{ kind: 'dorm', level: 2 }, { kind: 'home', umas: ['101'] }],
    }
    expect(summaryParts(summary, (id) => names[id] ?? 'An Uma')).toEqual([{ section: 'news', title: 'New today', lines: [
      { key: 'dorm', text: 'Dorm level 2 · 5 beds', to: '/dorm' },
      { key: 'home', text: 'Aster is home', to: '/dorm' },
    ] }])
    expect(summaryParts({ ...summary, news: [{ kind: 'home', umas: ['101', '202'] }] })[0]!.lines[0]!.text).toBe('2 Umas are home')
  })
})
