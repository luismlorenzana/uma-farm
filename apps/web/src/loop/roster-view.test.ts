// The roster's cards: the Umas on the farm with their best rank, and how many are away; their
// talents and ranks as album rows, the filters and sorts, a card's words and her sheet's nine activities. Invented outfits
// with chosen stats (`album/testing.ts`), and a cast naming each one's calling, her favourite line.
import { newRosterUma, newSave, type SaveV4, type StoryPack } from '@farm/domain'
import { runAlbumQuery } from '@luismlorenzana/uma-kit/roster'
import { describe, expect, it } from 'vitest'
import { albumFixture, type Five } from '../album/testing'
import {
  activityLines, activityOrder, bestRank, cardLines, challengeWords, pickerSorts, rankTalent, ROSTER_QUERY, rosterView, sortActivity, sortedFor, UMA_FACETS,
  umaRows, wholePoints,
} from './roster-view'
import { talentsFor, talentTable } from './talents'

const AT = '2026-11-09T10:00:00.000Z'
/** Aster Metal (mining S), Beryl Wood (foraging A), Cinder Wood (fishing B), Dune Stone (fishing A), Ember Fish (fishing
 * C), Fable Vegetables (farming S). */
const STATS: { star5: Five; growth?: Five }[] = [
  { star5: [100, 100, 125, 100, 100], growth: [0, 0, 20, 0, 0] }, { star5: [140, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 130] },
  { star5: [100, 100, 100, 100, 140] }, { star5: [100, 100, 100, 100, 115] }, { star5: [100, 152, 100, 100, 100] },
]
const IDS = ['81001', '81002', '81003', '81004', '81005', '81006']
/** Their callings: the story pack's, which name each one's favourite line. */
const CALLINGS = ['mining', 'foraging', 'foraging', 'quarry', 'fishing', 'farming'] as const
const STORY = { cast: { umas: IDS.map((characterId, i) => ({ characterId, calling: CALLINGS[i] })) }, bibles: new Map() } as unknown as Pick<StoryPack, 'cast' | 'bibles'>

async function rows(save?: SaveV4) {
  const { view } = await albumFixture(undefined, STATS)
  const farm = save ?? { ...newSave('u1', AT), roster: Object.fromEntries(IDS.map((id, i) => [id, newRosterUma(i + 1)])), dorm: { level: 2, home: IDS, swaps: [] } }
  return { view, farm, rows: umaRows(farm, farm.dorm.home, view.album, talentTable(view), STORY) }
}

describe('the roster page', () => {
  it('lists the Umas on the farm with their best rank, and counts those away', () => {
    const miner = newRosterUma(1)
    miner.ranks.mining = { points: 160, rank: 2, challenge: 0 }
    const save: SaveV4 = { ...newSave('u1', AT), roster: { 101: miner, 202: newRosterUma(1), 303: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202'], swaps: [] } }
    expect(rosterView(save)).toEqual({ away: 1, home: [{ outfitId: '101', rank: 'Skilled · Mining' }, { outfitId: '202', rank: 'Novice' }] })
  })

  it('names her best rank: the highest, then the most points', () => {
    const uma = newRosterUma(1)
    uma.ranks.fishing = { points: 12, rank: 0, challenge: 0 }
    expect(bestRank(uma)).toBe('Novice · Fishing')
    uma.ranks.farming = { points: 41, rank: 1, challenge: 0 }
    uma.ranks.foraging = { points: 60, rank: 1, challenge: 0 }
    expect(bestRank(uma)).toBe('Hand · Foraging')
  })
})

describe('talents and ranks on the cards', () => {
  it('reads each Uma\'s talents once a release, her favourite line from the story pack, and her best talent', async () => {
    const { view, rows: all } = await rows()
    expect(talentTable(view)).toBe(talentTable(view))
    expect(talentsFor(view)).toBe(talentsFor(view))
    expect(all.map((r) => [r.name, r.favourite, r.talents?.best])).toEqual([
      ['Aster', 'mining', 'mining'], ['Beryl', 'foraging', 'foraging'], ['Cinder', 'foraging', 'fishing'],
      ['Dune', 'mining', 'fishing'], ['Ember', 'fishing', 'fishing'], ['Fable', 'farming', 'farming'],
    ])
    expect(all.map((r) => cardLines(r, null))).toEqual([
      ['Novice', 'Mining S'], ['Novice', 'Foraging A'], ['Novice', 'Fishing B'], ['Novice', 'Fishing A'], ['Novice', 'Fishing C'], ['Novice', 'Farming S'],
    ])
  })

  it('filters to "Fishing talent B+" and sorts by fishing rank points', async () => {
    const save: SaveV4 = (await rows()).farm
    save.roster['81005']!.ranks.fishing = { points: 52.8, rank: 1, challenge: 3 }
    save.roster['81003']!.ranks.fishing = { points: 12, rank: 0, challenge: 0 }
    const { rows: all } = await rows(save)
    const fishing = sortedFor(all, 'fishing')
    const names = (query = ROSTER_QUERY) => runAlbumQuery(fishing, UMA_FACETS, query).rows.map((r) => fishing.find((f) => f.id === r.id)!.name)
    expect(names({ ...ROSTER_QUERY, filters: { 'talent-fishing': ['b'] } })).toEqual(['Cinder', 'Dune'])
    expect(names({ ...ROSTER_QUERY, filters: { 'talent-fishing': ['s'] } })).toEqual([])
    expect(names({ ...ROSTER_QUERY, filters: { 'rank-fishing': ['1'] } })).toEqual(['Ember'])
    expect(names({ ...ROSTER_QUERY, filters: { favourite: ['mining'] } })).toEqual(['Aster', 'Dune'])
    expect(names({ ...ROSTER_QUERY, sort: 'points', direction: 'desc' }).slice(0, 2)).toEqual(['Ember', 'Cinder'])
    expect(names({ ...ROSTER_QUERY, sort: 'talent', direction: 'desc' }).slice(0, 3)).toEqual(['Dune', 'Cinder', 'Ember'])
    expect(sortActivity({ sort: 'points' }, 'fishing')).toBe('fishing')
    expect(sortActivity({ sort: 'joined' }, 'fishing')).toBeNull()
    const ember = fishing.find((r) => r.name === 'Ember')!
    expect(cardLines(ember, 'fishing', true)).toEqual(['Hand · C', 'Fishing · 52 pts'])
    expect(rankTalent(ember, 'fishing')).toBe('Hand · C')
  })

  it('opens a picker by the place\'s activity, with its talent and points sorts', async () => {
    const save: SaveV4 = (await rows()).farm
    save.roster['81002']!.ranks.farming = { points: 41, rank: 1, challenge: 0 }
    const { rows: all } = await rows(save)
    expect([...all].sort(activityOrder('farming')).map((r) => r.name)).toEqual(['Beryl', 'Fable', 'Aster', 'Cinder', 'Dune', 'Ember'])
    const sorts = pickerSorts('farming')
    expect(sorts.map((s) => s.label)).toEqual(['Farming talent', 'Farming points', 'Joined', 'Name'])
    expect(sorts[0]!.value(all[5]!)).toBe(152)
  })

  it('lists her nine activities with talent, rank, points and the next challenge', async () => {
    const save: SaveV4 = (await rows()).farm
    save.roster['81006']!.ranks.farming = { points: 47.5, rank: 0, challenge: 12 }
    save.roster['81006']!.ranks.mining = { points: 2100, rank: 5, challenge: 0 }
    save.roster['81006']!.ranks.fishing = { points: 41, rank: 0, challenge: 30 }
    const fable = (await rows(save)).rows[5]!
    const lines = activityLines(fable)
    expect(lines[0]).toEqual({
      activity: 'farming', grade: 'S', rank: 'Novice', points: '47 / 40', challenge: 'Harvest 30 crops she tended · 12/30', full: true, tonight: false, favourite: true,
    })
    expect(lines.find((l) => l.activity === 'mining')).toMatchObject({ rank: 'Legend', points: '2,100', challenge: null, full: false })
    expect(lines.find((l) => l.activity === 'fishing')).toMatchObject({ full: false, tonight: true })
    expect(challengeWords('mining', 1, 0)).toBe('Dig at floor 10')
    expect(challengeWords('serving', 4, 1234)).toBe('Serve 1,000 guests · 1,000/1,000')
    expect(wholePoints(13.2)).toBe('13')
  })
})
