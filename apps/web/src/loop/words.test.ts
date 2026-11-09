// The loop's words for the day (F18): dates, festivals, the nudge's line, and the morning summary in CS5's order.
import type { MorningSummary } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { dateLabel, dateWords, dayCount, festivalWords, nudgeWords, shortDate, summaryParts } from './words'

describe('the date (decision 8)', () => {
  it('names the day, the season, the year and the next festival', () => {
    expect([shortDate(3), dateWords(3), dateWords(49)]).toEqual(['Spring 3', 'Spring 3, year 1', 'Spring 1, year 2'])
    expect(dateLabel(3)).toBe('Spring 3, year 1 · Flower Show in 7 days')
    expect([festivalWords(9), festivalWords(10), festivalWords(11), festivalWords(47)]).toEqual([
      'Flower Show tomorrow', 'Flower Show today', 'Fishing Derby in 11 days', 'Harvest Cup tomorrow',
    ])
    expect([dayCount(1), dayCount(3)]).toEqual(['1 day', '3 days'])
  })
})

describe('the nudge (CS6)', () => {
  it('says what\'s left in one line', () => {
    expect(nudgeWords({ idle: ['1', '2'], collect: 3 })).toBe('2 Umas idle · 3 to collect')
    expect(nudgeWords({ idle: ['1'], collect: 0 })).toBe('1 Uma idle')
    expect(nudgeWords({ idle: [], collect: 1 })).toBe('1 to collect')
    expect(nudgeWords({ idle: [], collect: 0 })).toBe('All set')
  })
})

describe('the morning summary (CS5)', () => {
  it('words each line with its tap, in CS5\'s order, hiding empty sections', () => {
    const summary: MorningSummary = {
      day: 13, bin: [], ranks: [], bonds: [],
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
      { section: 'nudges', title: 'Today', lines: [{ key: 'idle', text: '1 Uma idle', to: '/roster' }] },
    ])
    expect(summaryParts({ ...summary, work: [], news: [], nudges: [] })).toEqual([])
  })
})
