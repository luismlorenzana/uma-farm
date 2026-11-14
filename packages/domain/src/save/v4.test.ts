// Save v5: the new farm over an older save keeps the account whole, the strict parse round-trips and refuses what v5
// doesn't hold, and the Dorm for 20. Invented ids only (the stand-ins 9000001–9000003 and 9000004 onward).
import { describe, expect, it } from 'vitest'
import { BEDS, bedsAt } from '../farm/farm'
import { DORM_LEVELS, buyDorm, freeBeds, nextDorm, settleDormNight } from '../farm/dorm'
import { farmRankOpens } from '../farm/diary'
import { inviteToFarm, meet } from '../romance/meeting'
import { parseSave, parseStored, type OlderSave } from './save'
import { parseSaveV5 } from './parse-v4'
import { FIELD_TILES, freshV5, newLove, newSave, START_CLEAR, startField, type SaveV4 } from './v4'

const CREATED = '2026-11-08T09:12:44.000Z'
const UPDATED = '2026-11-10T21:40:03.512Z'
const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const account = { uid: 'u1', createdAt: CREATED, updatedAt: UPDATED }

/** A v5 farm on `day` with the stand-ins home and their routes begun. */
function farm(day = 3): SaveV4 {
  let save: SaveV4 = { ...newSave('u1', AT), calendar: { day }, farmer: { name: 'Robin' } }
  for (const id of ['9000001', '9000002', '9000003']) save = inviteToFarm(meet(save, id).save, id)
  return save
}

describe('the new farm over an older save', () => {
  const v3 = { version: 3, account, calendar: { day: 2 }, gold: 1234, start: { redraws: 1 }, visitors: [], roster: { 1001: { joined: 1, affinity: 120 } } }
  const v2 = { version: 2, account, umas: { 1001: { craft: { level: 16, exp: 0 } } }, items: { 'copper-ore': 5 }, buildings: {}, work: {} }
  const v1: OlderSave = { version: 1, account }
  // v4: the farm of blocks the Umas tended, and their jobs.
  const v4 = { version: 4, account, calendar: { day: 30 }, fields: { blocks: [{ id: 'A', tender: '9000001', plots: [] }] }, work: { 9000001: {} } }

  it.each([['v1', v1], ['v2', v2], ['v3', v3], ['v4', v4]] as const)('makes a %s a fresh v5 with the account whole', (_, stored) => {
    const fresh = freshV5(parseStored(stored))
    expect(fresh.account).toEqual(account)
    expect(fresh).toMatchObject({
      version: 5, farmer: { name: '' }, calendar: { day: 1 }, gold: 500, roster: {}, love: {}, memories: {}, arrivals: [],
      items: { 'seed-carrot': [9, 0, 0, 0, 0] }, dorm: { level: 1, home: [], swaps: [] }, buildings: { dorm: 1 }, loads: {},
      today: { actions: 0, eventActions: 0, town: false, gathered: [] },
    })
    expect(fresh.fields.tiles).toHaveLength(FIELD_TILES)
    expect(fresh.fields.tiles.every((t) => t.crop === null)).toBe(true)
    expect(bedsAt(fresh.dorm.level)).toBe(3)
    expect(fresh).not.toHaveProperty('start')
    expect(fresh).not.toHaveProperty('visitors')
    expect(fresh).not.toHaveProperty('work')
    // The fresh farm is a v5 the parse takes as it is.
    expect(parseSaveV5(json(fresh))).toEqual(fresh)
  })

  it('starts the field overgrown but for a cleared patch of nine, the same for the same account', () => {
    const field = startField('u1')
    expect(field.filter((t) => t.ground === 'clear').length).toBe(START_CLEAR.length)
    expect(START_CLEAR.every((i) => field[i]!.ground === 'clear')).toBe(true)
    expect(field.filter((t) => t.ground === 'weeds' || t.ground === 'stone' || t.ground === 'stump').length).toBe(FIELD_TILES - 9)
    expect(new Set(field.map((t) => t.ground))).toEqual(new Set(['clear', 'weeds', 'stone', 'stump']))
    expect(startField('u1')).toEqual(field)
    expect(startField('u2')).not.toEqual(field)
  })

  it('a new account is the same day 1, its account at now', () => {
    expect(freshV5({ account: { uid: 'u1', createdAt: AT, updatedAt: AT } })).toEqual(newSave('u1', AT))
  })
})

describe('the v5 parse', () => {
  it('round-trips a played v5, through parseSave too', () => {
    const save = farm()
    expect(parseSaveV5(json(save))).toEqual(save)
    expect(parseSave(json(save))).toEqual(save)
    expect(parseSave(json(newSave('u1', AT)))).toEqual(newSave('u1', AT))
  })

  const refuse = (change: (save: Record<string, any>) => void, message: string | RegExp) => {
    const raw = json(farm()) as Record<string, any>
    change(raw)
    expect(() => parseSaveV5(raw)).toThrow(message)
  }

  it('refuses unknown keys, an older save\'s among them', () => {
    refuse((s) => { s.hearts = 1 }, 'save: unknown keys hearts')
    refuse((s) => { s.start = { redraws: 0 } }, 'save: unknown keys start')
    refuse((s) => { s.visitors = [] }, 'save: unknown keys visitors')
    refuse((s) => { s.work = {} }, 'save: unknown keys work')
    refuse((s) => { s.fields = { blocks: [] } }, 'save.fields: unknown keys blocks')
    refuse((s) => { s.roster['9000001'].affinity = 0 }, 'save.roster.9000001: unknown keys affinity')
  })

  it('refuses a field off its grid, a crop off tilled soil, and an empty tile holding anything', () => {
    refuse((s) => { s.fields.tiles.pop() }, 'save.fields.tiles: expected 40–40 entries')
    refuse((s) => { s.fields.tiles[0] = { ...s.fields.tiles[0], ground: 'sand' } }, /save.fields.tiles.0.ground: expected one of/)
    refuse((s) => { s.fields.tiles[0] = { ...s.fields.tiles[0], crop: 'carrot' } }, 'save.fields.tiles.0.ground: a crop grows on tilled soil')
    refuse((s) => { s.fields.tiles[0] = { ...s.fields.tiles[0], watered: true } }, 'save.fields.tiles.0: an empty tile holds nothing')
    refuse((s) => { s.fields.tiles[0] = { ...s.fields.tiles[0], ground: 'tilled', crop: 'carrot', growth: 1.5 } }, 'save.fields.tiles.0.growth: expected 0–10')
    refuse((s) => { s.fields.tiles[0] = { ...s.fields.tiles[0], ground: 'tilled', crop: 'carrot', ready: true, watered: true } }, 'save.fields.tiles.0.watered: a ripe crop isn’t watered')
    const save = farm()
    save.fields.tiles[0] = { ground: 'tilled', crop: 'carrot', growth: 2, ready: false, regrowing: false, own: true, watered: true }
    expect(parseSaveV5(json(save)).fields.tiles[0]).toEqual(save.fields.tiles[0])
  })

  it('takes the day\'s actions and the stations\' loads, and refuses what they can\'t hold', () => {
    const save = farm()
    save.today = { ...save.today, actions: 7, eventActions: 1, town: true, gathered: ['woods', 'pond'] }
    save.loads = { mill: { item: 'wheat-flour@2', count: 8 } }
    expect(parseSaveV5(json(save))).toEqual(save)
    refuse((s) => { s.today.actions = -1 }, 'save.today.actions: expected 0–100')
    refuse((s) => { s.today.gathered = ['woods', 'woods'] }, 'save.today.gathered.1: repeated')
    refuse((s) => { s.today.gathered = ['moon'] }, /save.today.gathered.0: expected one of/)
    refuse((s) => { s.loads = { mill: { item: 'pine-plank@1', count: 2 } } }, 'save.loads.mill.item: expected a good this station makes, at its stars')
    refuse((s) => { s.loads = { mill: { item: 'wheat-flour@1', count: 9 } } }, 'save.loads.mill.count: expected 1–8')
    refuse((s) => { s.loads = { forge: { item: 'wheat-flour@1', count: 1 } } }, /save.loads.forge: expected one of/)
  })

  it('refuses a roster key not of the form, and love missing or held off the roster', () => {
    refuse((s) => { s.roster.abc = s.roster['9000001'] }, 'save.roster.abc: ids are positive integers')
    refuse((s) => { delete s.love['9000002'] }, 'save.love.9000002: missing for an Uma on the roster')
    refuse((s) => { s.love['9000009'] = newLove() }, 'save.love.9000009: expected an Uma on the roster')
  })

  it('refuses her route out of range', () => {
    refuse((s) => { s.love['9000001'].level = 10 }, 'save.love.9000001.level: expected 0–9')
    refuse((s) => { Object.assign(s.love['9000001'], { stage: 'confession', level: 9 }) }, 'save.love.9000001.level: expected 10–10')
    refuse((s) => { s.love['9000001'].points = 1.5 }, 'save.love.9000001.points: expected a non-negative integer')
    refuse((s) => { s.love['9000001'].festivals = ['flower-show:2'] }, 'save.love.9000001.festivals.0: expected <festival>:<year>, this year or before')
    refuse((s) => { s.love['9000001'].festivals = ['flower-show:1', 'flower-show:1'] }, 'save.love.9000001.festivals.1: repeated')
    refuse((s) => { Object.assign(s.love['9000001'], { stage: 'spouse', level: 6 }) }, 'save.love.9000001.level: expected 0–5')
    refuse((s) => { s.love['9000001'].points = -1 }, 'save.love.9000001.points: expected a non-negative integer')
    refuse((s) => { s.love['9000001'].last = 4 }, 'save.love.9000001.last: after today')
    refuse((s) => { s.love['9000001'].friend = true }, 'save.love.9000001.friend: only while her confession waits')
    refuse((s) => { s.love['9000001'].ring = 5 }, 'save.love.9000001.ring: only from the proposal on')
    refuse((s) => { s.love['9000001'].wed = 2 }, 'save.love.9000001.wed: only a spouse')
    refuse((s) => { s.love['9000001'].house = 0 }, 'save.love.9000001.house: only a spouse')
    // A spouse may hold all of them.
    const save = farm()
    save.love['9000001'] = { ...newLove(), stage: 'spouse', level: 2, ring: 7, wed: 2, house: 0 }
    save.dorm.home = save.dorm.home.filter((id) => id !== '9000001') // a spouse in her house has no Dorm bed
    expect(parseSaveV5(json(save)).love['9000001']).toEqual(save.love['9000001'])
  })

  it('refuses a bad farmer\'s name', () => {
    refuse((s) => { s.farmer.name = 'R2D2' }, /save.farmer.name/)
    refuse((s) => { s.farmer.name = ' Robin' }, /save.farmer.name/)
    refuse((s) => { s.farmer.name = 'A'.repeat(17) }, /save.farmer.name/)
  })

  it('refuses the Dorm off its eight levels, and home past its beds', () => {
    refuse((s) => { s.dorm.level = 9; s.buildings.dorm = 9 }, /save.buildings.dorm: expected 0–8/)
    refuse((s) => { s.buildings.dorm = 8; s.dorm.level = 9 }, 'save.dorm.level: expected 1–8')
    refuse((s) => { s.dorm.home = ['9000001', '9000002', '9000003', '9000004']; s.roster['9000004'] = s.roster['9000001']; s.love['9000004'] = newLove() },
      'save.dorm.home: expected 0–3 entries')
  })

  it('refuses memories and arrivals off the roster', () => {
    refuse((s) => { s.memories['9000009'] = ['f1'] }, 'save.memories.9000009: expected an Uma on the roster')
    refuse((s) => { s.arrivals = ['9000009'] }, 'save.arrivals.0: expected an Uma on the roster')
    refuse((s) => { s.arrivals = ['9000001', '9000001'] }, 'save.arrivals.1: repeated')
  })

  it('takes the morning\'s Hearts and refuses roster news in §5', () => {
    const save = farm()
    save.summary = { day: 3, bin: [], work: [], ranks: [], hearts: [{ kind: 'arrived', id: '9000002', home: true }], news: [{ kind: 'dorm', level: 2 }], nudges: [] }
    expect(parseSaveV5(json(save)).summary).toEqual(save.summary)
    refuse((s) => { s.summary = { ...json(save.summary), news: [{ kind: 'joined', outfitId: '9000002', home: true }] } }, /save.summary.news.0.kind: expected one of/)
    refuse((s) => { s.summary = { ...json(save.summary), hearts: [{ kind: 'arrived', id: '9000009', home: true }] } }, 'save.summary.hearts.0.id: expected an Uma on the roster')
    refuse((s) => { s.summary = { ...json(save.summary), hearts: [{ kind: 'arrived', id: '9000002', home: true, words: 'Hi' }] } }, 'save.summary.hearts.0: unknown keys words')
    refuse((s) => { s.summary = { ...json(save.summary), bonds: [] } }, 'save.summary: unknown keys bonds')
    // A new story release's line: its ship's number only, never the story's words.
    const story = { ...json(save.summary!), news: [{ kind: 'story', number: 2 }, { kind: 'dorm', level: 2 }] }
    expect(parseSaveV5(json({ ...save, summary: story })).summary).toEqual(story)
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 0 }] } }, 'save.summary.news.0.number: expected 1–9007199254740991')
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 2, note: 'Invented.' }] } }, 'save.summary.news.0: unknown keys note')
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 2 }, { kind: 'story', number: 3 }] } }, /save.summary.news/)
  })
})

describe('the Dorm for 20', () => {
  it('has eight levels at its beds, costs and Farm Ranks', () => {
    expect(DORM_LEVELS.map((l) => [l.level, l.beds, l.cost, l.farmRank])).toEqual([
      [1, 3, 0, 0], [2, 5, 1000, 1], [3, 7, 3000, 2], [4, 9, 8000, 3], [5, 11, 15000, 4], [6, 14, 28000, 5], [7, 17, 50000, 6], [8, 20, 85000, 7],
    ])
    expect(DORM_LEVELS.reduce((n, l) => n + l.cost, 0)).toBe(190_000)
    expect(DORM_LEVELS.map((l) => l.beds)).toEqual([...BEDS])
  })

  it('buys, settles and frees beds', () => {
    let save: SaveV4 = { ...farm(), gold: 200_000, farm: { ...farm().farm, points: 22_000 } }
    expect(freeBeds(save)).toBe(0)
    for (let level = 2; level <= 8; level++) save = buyDorm(save)
    expect(nextDorm(save)).toBeNull()
    expect(() => buyDorm(save)).toThrow('The Dorm is at its top level.')
    const settled = settleDormNight(save)
    expect(settled.raised).toBe(8)
    expect(freeBeds(settled.save)).toBe(17)
  })

  it('names the Dorm\'s levels a Farm Rank opens', () => {
    expect(farmRankOpens(3)).toContain('Dorm level 4 (9 beds)')
  })
})
