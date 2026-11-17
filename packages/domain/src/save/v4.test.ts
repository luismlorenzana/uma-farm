// Save v5: the new farm over an older save keeps the account whole, the strict parse round-trips and refuses what v5
// doesn't hold, and the retired Dorm kept in its shape. Invented ids only (the stand-ins 9000001–9000003 and 9000004 onward).
import { describe, expect, it } from 'vitest'
import { farmRankOpens } from '../farm/diary'
import { meet } from '../romance/meeting'
import { parseSave, parseStored, type OlderSave } from './save'
import { parseSaveV5 } from './parse-v4'
import { FIELD_TILES, fieldTiles, freshV5, newLove, newSave, START_CLEAR, startField, type SaveV4 } from './v4'

const CREATED = '2026-11-08T09:12:44.000Z'
const UPDATED = '2026-11-10T21:40:03.512Z'
const AT = '2026-11-11T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const account = { uid: 'u1', createdAt: CREATED, updatedAt: UPDATED }

/** A v5 farm on `day` with the stand-ins met and their routes begun. */
function farm(day = 3): SaveV4 {
  let save: SaveV4 = { ...newSave('u1', AT), calendar: { day }, farmer: { name: 'Robin' } }
  for (const id of ['9000001', '9000002', '9000003']) save = meet(save, id).save
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
    expect(fieldTiles(fresh)).toHaveLength(FIELD_TILES)
    expect(fieldTiles(fresh).every((t) => t.crop === null)).toBe(true)
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
    const plot = 'save.fields.plots.0.tiles'
    refuse((s) => { s.fields.plots[0].tiles.pop() }, `${plot}: expected 40–40 entries`)
    refuse((s) => { s.fields.plots[0].tiles[0] = { ...s.fields.plots[0].tiles[0], ground: 'sand' } }, `${plot}.0.ground: expected one of`)
    refuse((s) => { s.fields.plots[0].tiles[0] = { ...s.fields.plots[0].tiles[0], crop: 'carrot' } }, `${plot}.0.ground: a crop grows on tilled soil`)
    refuse((s) => { s.fields.plots[0].tiles[0] = { ...s.fields.plots[0].tiles[0], watered: true } }, `${plot}.0: an empty tile holds nothing`)
    refuse((s) => { s.fields.plots[0].tiles[0] = { ...s.fields.plots[0].tiles[0], ground: 'tilled', crop: 'carrot', growth: 1.5 } }, `${plot}.0.growth: expected 0–10`)
    refuse((s) => { s.fields.plots[0].tiles[0] = { ...s.fields.plots[0].tiles[0], ground: 'tilled', crop: 'carrot', ready: true, watered: true } }, `${plot}.0.watered: a ripe crop isn’t watered`)
    const save = farm()
    save.fields.plots[0]!.tiles[0] = { ground: 'tilled', crop: 'carrot', growth: 2, ready: false, regrowing: false, own: true, watered: true }
    expect(parseSaveV5(json(save)).fields.plots[0]!.tiles[0]).toEqual(fieldTiles(save)[0])
  })

  it('reads a live save\'s field, from before plots, as plot 1 exactly as it was, and never moves updatedAt', () => {
    // The field as the live save stores it: one field of tiles, with a crop growing and watered, one ripe, one tilled,
    // and a farmhand's water task from before plots.
    const live = json(farm()) as Record<string, any>
    const tiles = startField('u1').map((t, i) => (i === 0 ? { ...t, ground: 'tilled', crop: 'carrot', growth: 2, own: true, watered: true }
      : i === 1 ? { ...t, ground: 'tilled', crop: 'potato', growth: 6, ready: true } : i === 2 ? { ...t, ground: 'tilled' } : t))
    live.fields = { tiles }
    live.account = { ...account }
    live.roster['9000001'].farmhand = 3
    live.roster['9000001'].tasks = [{ kind: 'water', tiles: [0, 1, 2, 3, 4, 5, 6, 7] }]
    const read = parseSaveV5(json(live))
    expect(read.fields).toEqual({ plots: [{ tiles }] })
    expect(read.roster['9000001']!.tasks).toEqual([{ kind: 'water', tiles: [0, 1, 2, 3, 4, 5, 6, 7] }])
    expect(read.account).toEqual(account)
    expect(read.account.updatedAt).toBe(UPDATED)
    // Written back, it's plot 1, and it reads the same.
    expect(parseSaveV5(json(read))).toEqual(read)
  })

  it('takes a second plot and a task on it, and refuses a field with no plots, both shapes at once, more plots than the rules hold, or a task on a plot not cleared', () => {
    const save = farm()
    const two: SaveV4 = { ...save, fields: { plots: [save.fields.plots[0]!, { tiles: startField('u2') }] } }
    two.roster['9000001'] = { ...two.roster['9000001']!, farmhand: 3, tasks: [{ kind: 'water', tiles: [0, 1], plot: 1 }] }
    expect(parseSaveV5(json(two))).toEqual(two)
    refuse((s) => { s.fields = {} }, 'save.fields.plots: expected the field’s plots')
    refuse((s) => { s.fields = { plots: [] } }, 'save.fields.plots: expected 1–8 entries')
    refuse((s) => { s.fields = { plots: s.fields.plots, tiles: s.fields.plots[0].tiles } }, 'save.fields.tiles: the field’s tiles are its plots’')
    refuse((s) => { s.fields.plots = Array.from({ length: 9 }, () => s.fields.plots[0]) }, 'save.fields.plots: expected 1–8 entries')
    refuse((s) => { s.fields.plots[0].extra = 1 }, 'save.fields.plots.0: unknown keys extra')
    refuse((s) => { s.roster['9000001'].farmhand = 3; s.roster['9000001'].tasks = [{ kind: 'water', tiles: [0], plot: 1 }] }, 'save.roster.9000001.tasks.0.plot: a plot the farm hasn’t cleared')
    refuse((s) => { s.roster['9000001'].farmhand = 3; s.roster['9000001'].tasks = [{ kind: 'water', tiles: [0], plot: 0 }] }, 'save.roster.9000001.tasks.0.plot: expected 1–7')
  })

  it('takes the day\'s actions and the stations\' loads, and refuses what they can\'t hold', () => {
    const save = farm()
    save.today = { ...save.today, actions: 7, eventActions: 1, town: true, gathered: ['woods', 'pond'] }
    save.loads = { mill: [{ item: 'wheat-flour@2', count: 8 }] }
    expect(parseSaveV5(json(save))).toEqual(save)
    refuse((s) => { s.today.actions = -1 }, 'save.today.actions: expected 0–100')
    refuse((s) => { s.today.gathered = ['woods', 'woods'] }, 'save.today.gathered.1: repeated')
    refuse((s) => { s.today.gathered = ['moon'] }, /save.today.gathered.0: expected one of/)
    refuse((s) => { s.loads = { mill: { item: 'pine-plank@1', count: 2 } } }, 'save.loads.mill.item: expected a good this station makes, at its stars')
    // A farmhand's load can be bigger: up to 12 in, more out at her yield.
    save.loads = { mill: [{ item: 'wheat-flour@2', count: 14 }] }
    expect(parseSaveV5(json(save)).loads).toEqual(save.loads)
    refuse((s) => { s.loads = { mill: { item: 'wheat-flour@1', count: 21 } } }, 'save.loads.mill.count: expected 1–20')
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
    expect(parseSaveV5(json(save)).love['9000001']).toEqual(save.love['9000001'])
  })

  it('refuses a bad farmer\'s name', () => {
    refuse((s) => { s.farmer.name = 'R2D2' }, /save.farmer.name/)
    refuse((s) => { s.farmer.name = ' Robin' }, /save.farmer.name/)
    refuse((s) => { s.farmer.name = 'A'.repeat(17) }, /save.farmer.name/)
  })

  it('keeps the retired Dorm on its eight levels, and clears who was home', () => {
    refuse((s) => { s.dorm.level = 9; s.buildings.dorm = 9 }, /save.buildings.dorm: expected 0–8/)
    refuse((s) => { s.buildings.dorm = 8; s.dorm.level = 9 }, 'save.dorm.level: expected 1–8')
    const save = farm()
    save.dorm.home = ['9000001', '9000002', '9000003']
    expect(parseSaveV5(json(save)).dorm).toEqual({ level: 1, home: [], swaps: [] })
  })

  it('refuses memories and arrivals off the roster', () => {
    refuse((s) => { s.memories['9000009'] = ['f1'] }, 'save.memories.9000009: expected an Uma on the roster')
    refuse((s) => { s.arrivals = ['9000009'] }, 'save.arrivals.0: expected an Uma on the roster')
    refuse((s) => { s.arrivals = ['9000001', '9000001'] }, 'save.arrivals.1: repeated')
  })

  it('takes the morning\'s Hearts and refuses roster news in §5', () => {
    const save = farm()
    save.summary = { day: 3, bin: [], work: [], ranks: [], hearts: [{ kind: 'arrived', id: '9000002', home: true }], news: [{ kind: 'farm-rank', rank: 2 }], nudges: [] }
    expect(parseSaveV5(json(save)).summary).toEqual(save.summary)
    refuse((s) => { s.summary = { ...json(save.summary), news: [{ kind: 'joined', outfitId: '9000002', home: true }] } }, /save.summary.news.0.kind: expected one of/)
    refuse((s) => { s.summary = { ...json(save.summary), hearts: [{ kind: 'arrived', id: '9000009', home: true }] } }, 'save.summary.hearts.0.id: expected an Uma on the roster')
    refuse((s) => { s.summary = { ...json(save.summary), hearts: [{ kind: 'arrived', id: '9000002', home: true, words: 'Hi' }] } }, 'save.summary.hearts.0: unknown keys words')
    refuse((s) => { s.summary = { ...json(save.summary), bonds: [] } }, 'save.summary: unknown keys bonds')
    // A new story release's line: its ship's number only, never the story's words.
    const story = { ...json(save.summary!), news: [{ kind: 'story', number: 2 }, { kind: 'farm-rank', rank: 2 }] }
    expect(parseSaveV5(json({ ...save, summary: story })).summary).toEqual(story)
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 0 }] } }, 'save.summary.news.0.number: expected 1–9007199254740991')
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 2, note: 'Invented.' }] } }, 'save.summary.news.0: unknown keys note')
    refuse((s) => { s.summary = { ...story, news: [{ kind: 'story', number: 2 }, { kind: 'story', number: 3 }] } }, /save.summary.news/)
  })
})

describe('the retired Dorm', () => {
  it('is offered by no Farm Rank', () => {
    for (let rank = 1; rank <= 10; rank++) expect(farmRankOpens(rank).join(' ')).not.toContain('Dorm')
  })
})
