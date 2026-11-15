// The town map: who lives there, the town's people in their roles and at their posts, the locations (the six spots, the
// shops and offices, the story's homes and workplaces), who's where (her fixed schedule: the story's routine, job and
// home, else the default, her favourite spot every third day), her menu, and her line. Invented ids only: a master data
// of 120 characters, 9200001–9200120, sisters `s9200001xx`, and a town.json of invented people, spots and locations.
import { describe, expect, it } from 'vitest'
import { goToTown, GAME_DAYS } from '../farm/actions'
import { DAYS_PER_SEASON, farmDay, SEASONS } from '../farm/calendar'
import { chatV4, giftV4 } from '../romance/acts'
import { spendEvening } from '../romance/evening'
import { introduce, inviteToFarm, meet } from '../romance/meeting'
import { parseSaveV5 } from '../save/parse-v4'
import { newRosterUma, newSave, type SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import { CAST_IDS } from '../story/cast'
import { SHOP_IDS, SPOT_IDS, type CastEntry } from '../story/authored'
import { storyOf, townOf, PLACEHOLDER_SPOTS, PLACEHOLDER_TOWN_LINES, speakerId, isTownPerson } from '../story/placeholders'
import { readStoryPack, type StoryPack } from '../story/pack'
import { inviteToWork } from '../romance/loop'
import { herMenu } from './menu'
import {
  castPlace, defaultDays, defaultSpot, giftedToday, lifeHolds, onFarmToday, scheduleOf, seasonSchedule, SHOPS, talkedToday, townDay, townLineOf, townLocations, townsfolk,
  townTalksOf, whereOn, whereYouMeet,
} from './town'

const AT = '2026-11-13T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const ids = (n: number, from = 9_200_001) => Array.from({ length: n }, (_, i) => String(from + i))
const EVERYONE = ids(120)
/** An invented master data: 120 characters, each with one outfit. */
const MASTER = { outfits: new Map(EVERYONE.map((id) => [id, `${id}01`])), lines: new Map<string, never>() }

/** A pack from files, with master data's placeholders. */
const pack = (files: Partial<Parameters<typeof readStoryPack>[0]> = {}): StoryPack =>
  storyOf(readStoryPack({ umas: {}, routes: {}, ...files }).pack, MASTER)
const save = (day = 5, more: Partial<SaveV4> = {}): SaveV4 => ({ ...newSave('u-town', AT), calendar: { day }, ...more })
const spring = (day: number) => farmDay({ year: 1, season: 'spring', day })

/** A cast of a hundred, as the owner's: the town's people are drawn from it. */
const CAST = ids(100).map((characterId) => ({ characterId }))

/** A town.json: fourteen people, one a role, the six spots, and three locations of the story's own. */
const PEOPLE = ids(14, 9_200_101)
const TOWN = {
  people: PEOPLE.map((characterId, i) => ({ characterId, does: `Invented role ${i + 1}.`, game: CAST_IDS[i] })),
  spots: SPOT_IDS.map((id, i) => ({ id, name: `Invented spot ${i + 1}`, blurb: 'An invented line.', keeper: PEOPLE[i] })),
  locations: [
    { id: 'blue-cottage', name: 'The Blue Cottage', line: 'An invented home.', kind: 'home' },
    { id: 'bakery', name: 'The Bakery', kind: 'work' },
    { id: 'old-pier', name: 'The Old Pier' },
  ],
}

describe('who lives in town', () => {
  it('is the cast only, in its order, sisters included, less the town\'s people: nobody else from master data', () => {
    const p = pack({ cast: { umas: [{ characterId: '9200001' }, { characterId: 's920000102', name: 'Invented Sister' }, { characterId: '9200030' }, { characterId: PEOPLE[0]! }] }, town: TOWN })
    expect(townsfolk(p)).toEqual(['9200001', 's920000102', '9200030'])
    // Master data holds 120 characters here; the 117 outside the cast never live in town.
    expect(townsfolk(p)).not.toContain('9200002')
  })

  it('fills each role with the pack\'s people, and master data\'s from the last in its order where the pack names none', () => {
    const own = townOf(pack({ town: TOWN }))
    expect(own.people.map((p) => p.characterId)).toEqual(PEOPLE)
    expect(own.byRole.get('ida-stone')).toBe(PEOPLE[CAST_IDS.indexOf('ida-stone')])
    expect(own.spots.map((s) => [s.id, s.name, s.keeper])).toEqual(SPOT_IDS.map((id, i) => [id, `Invented spot ${i + 1}`, PEOPLE[i]]))
    // No town.json: the roles go to master data's last fourteen, never one of the cast (master data's first five here).
    const none = townOf(pack())
    expect(none.people.map((p) => p.characterId)).toEqual(EVERYONE.slice(-14).reverse())
    expect(none.people.every((p) => !p.written)).toBe(true)
    expect(none.spots.map((s) => s.name)).toEqual(SPOT_IDS.map((id) => PLACEHOLDER_SPOTS[id].name))
    expect(none.spots.find((s) => s.id === 'plaza')!.keeper).toBe(none.byRole.get('hollis-pryor'))
    // A partial town: the roles it leaves, and the spots' words it leaves, are the game's.
    const part = townOf(pack({ town: { people: [{ characterId: '9200050', game: 'ida-stone' }], spots: [{ id: 'cafe', keeper: '9200050' }] } }))
    expect(part.byRole.get('ida-stone')).toBe('9200050')
    expect(part.people).toHaveLength(CAST_IDS.length)
    expect(part.spots.find((s) => s.id === 'cafe')).toMatchObject({ name: 'The Café', keeper: '9200050' })
  })

  it('speaks a role as the Uma who plays it', () => {
    const p = pack({ town: TOWN })
    expect(speakerId(p, 'ida-stone')).toBe(PEOPLE[CAST_IDS.indexOf('ida-stone')])
    expect(speakerId(p, '9200001')).toBe('9200001')
    // With no master data and no town.json, the role stays the role.
    expect(speakerId(storyOf(null, null), 'ida-stone')).toBe('ida-stone')
    expect(isTownPerson(p, PEOPLE[0]!)).toBe(true)
    expect(isTownPerson(p, '9200001')).toBe(false)
  })
})

describe('the map', () => {
  it('holds the six spots, the four shops and offices, then the story\'s locations, each of the town\'s people at one post', () => {
    const p = pack({ town: TOWN })
    const map = townLocations(p)
    expect(map.map((l) => l.id)).toEqual([...SPOT_IDS, ...SHOP_IDS, 'blue-cottage', 'bakery', 'old-pier'])
    expect(map.map((l) => l.group)).toEqual([...SPOT_IDS.map(() => 'spot'), ...SHOP_IDS.map(() => 'shop'), 'home', 'work', 'spot'])
    expect(map.find((l) => l.id === 'blue-cottage')).toMatchObject({ name: 'The Blue Cottage', line: 'An invented home.', keeper: null })
    // One post each: town.json's keepers at their spots first, so the mayor, the shopkeeper and the rancher it puts at
    // the plaza, the market and the harbour leave their counters; the smith keeps the smithy.
    const at = (id: string) => map.find((l) => l.id === id)!.keeper
    expect(SPOT_IDS.map(at)).toEqual(PEOPLE.slice(0, 6))
    expect(SHOP_IDS.map(at)).toEqual([null, null, null, townOf(p).byRole.get(SHOPS.smith.keeper)])
    const posts = map.flatMap((l) => (l.keeper ? [l.keeper] : []))
    expect(new Set(posts).size).toBe(posts.length)
    // With no town.json: each role's shop first, so the plaza's mayor and the market's shopkeeper are at their counters.
    const game = townLocations(pack())
    const own = townOf(pack())
    expect(game.find((l) => l.id === 'store')!.keeper).toBe(own.byRole.get('marta-quill'))
    expect(game.find((l) => l.id === 'mayor')!.keeper).toBe(own.byRole.get('hollis-pryor'))
    expect(game.find((l) => l.id === 'plaza')!.keeper).toBeNull()
    expect(game.find((l) => l.id === 'cafe')!.keeper).toBe(own.byRole.get('rosa-bell'))
  })

  it('reads the story\'s locations from town.json: an id of its own and a name, else an error that skips it', () => {
    const read = readStoryPack({
      umas: {}, routes: {}, cast: { umas: [] }, ties: { ties: [] },
      town: { locations: [{ id: 'plaza', name: 'Twice' }, { id: 'Bad Id', name: 'x' }, { id: 'no-name' }, { id: 'ok-place', name: 'A place', kind: 'castle' }] },
    })
    expect(read.pack.town?.locations?.map((l) => l.id)).toEqual(['ok-place'])
    expect(read.errors.filter((e) => e.startsWith('town.json: Location'))).toHaveLength(4)
  })
})

describe('her life in town', () => {
  const life = (entry: Partial<CastEntry>) => pack({ cast: { umas: [{ characterId: '9200007', ...entry }, ...CAST.filter((u) => u.characterId !== '9200007')] }, town: TOWN })

  it('her routine\'s first stop that holds, else her job on its days, else her home: the story places her', () => {
    const p = life({
      home: 'blue-cottage',
      job: { what: 'Bakes the morning bread', at: 'bakery', days: [1, 2, 3, 4, 5, 6] },
      routine: [{ at: 'library', days: [3], seasons: ['spring'] }, { at: 'old-pier', seasons: ['summer'] }],
    })
    const where = (day: number) => [townDay(save(day), p).where.get('9200007'), townDay(save(day), p).by.get('9200007')]
    expect(where(farmDay({ year: 1, season: 'spring', day: 3 }))).toEqual(['library', 'routine'])
    expect(where(farmDay({ year: 1, season: 'spring', day: 4 }))).toEqual(['bakery', 'job'])
    expect(where(farmDay({ year: 1, season: 'spring', day: 9 }))).toEqual(['blue-cottage', 'home'])
    expect(where(farmDay({ year: 1, season: 'summer', day: 3 }))).toEqual(['old-pier', 'routine'])
    expect(where(farmDay({ year: 2, season: 'autumn', day: 2 }))).toEqual(['bakery', 'job'])
    expect(lifeHolds({ days: [3], seasons: ['spring'] }, farmDay({ year: 3, season: 'spring', day: 3 }))).toBe(true)
    // Her season by place, in the order of the first: the profile's and the calendar's.
    expect(seasonSchedule(p, '9200007', 'spring')).toEqual([
      { at: 'bakery', by: 'job', days: [1, 2, 4, 5, 6] }, { at: 'library', by: 'routine', days: [3] }, { at: 'blue-cottage', by: 'home', days: [7, 8, 9, 10, 11, 12] },
    ])
    expect(seasonSchedule(p, '9200007', 'summer')).toEqual([{ at: 'old-pier', by: 'routine', days: [...Array(DAYS_PER_SEASON).keys()].map((d) => d + 1) }])
  })

  it('a schedule the story writes is hers alone: on a day none of it holds, she\'s at home off the map', () => {
    const p = life({ job: { at: 'cafe', seasons: ['winter'] } })
    expect(scheduleOf(p, '9200007')).toEqual({ own: true, stops: [{ at: 'cafe', seasons: ['winter'], by: 'job' }] })
    const winter = townDay(save(farmDay({ year: 1, season: 'winter', day: 5 })), p)
    expect([winter.where.get('9200007'), winter.by.get('9200007')]).toEqual(['cafe', 'job'])
    expect(townDay(save(5), p).where.has('9200007')).toBe(false)
    expect(whereOn(p, '9200007', 5)).toEqual({ at: null, by: null })
    expect(seasonSchedule(p, '9200007', 'spring')).toEqual([{ at: null, by: null, days: [...Array(DAYS_PER_SEASON).keys()].map((d) => d + 1) }])
    // A schedule whose every place the map doesn't hold isn't one: the default plays.
    const lost = pack({ cast: { umas: [{ characterId: '9200007', routine: [{ at: 'blue-cottage' }] }] } })
    expect(scheduleOf(lost, '9200007')).toMatchObject({ own: false })
  })

  it('reads her fields, each error skipping its own: a location the map doesn\'t hold, a day off the season', () => {
    const read = readStoryPack({
      umas: {}, routes: {}, ties: { ties: [] }, town: TOWN,
      cast: { umas: [{ characterId: '9200007', home: 'nowhere', job: { what: 'Waits tables', at: 'cafe', days: [0] }, routine: [{ at: 'bakery', days: [2] }, { at: 'moon' }, { at: 'track' }] }] },
    })
    const entry = read.pack.cast.umas[0]!
    expect(entry.home).toBeUndefined()
    expect(entry.job).toEqual({ what: 'Waits tables', at: 'cafe' })
    expect(entry.routine).toEqual([{ at: 'bakery', days: [2] }, { at: 'track' }])
    expect(read.errors.filter((e) => e.startsWith('cast.json'))).toHaveLength(3)
    expect(read.notes.some((n) => n.includes('routine 3: no days or seasons'))).toBe(true)
  })
})

describe('the default schedule', () => {
  const p = pack({ cast: { umas: CAST }, town: TOWN })

  it('every third day of each season, from day 1, 2 or 3 by her place in the cast', () => {
    expect([0, 1, 2, 3].map(defaultDays)).toEqual([[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12], [1, 4, 7, 10]])
    expect(scheduleOf(p, '9200001')).toEqual({ own: false, stops: [{ at: 'plaza', days: [1, 4, 7, 10], by: 'default' }] })
    expect(scheduleOf(p, '9200005')).toEqual({ own: false, stops: [{ at: 'market', days: [2, 5, 8, 11], by: 'default' }] })
    // The six in turn, three Umas each; the 19th starts again at the first.
    expect(ids(19).map((id) => defaultSpot(p, id))).toEqual([...SPOT_IDS.flatMap((s) => [s, s, s]), SPOT_IDS[0]])
    // Her cast `spot` is her favourite; one the cast doesn't hold comes after it.
    expect(defaultSpot(pack({ cast: { umas: [{ characterId: '9200007', spot: 'library' }] } }), '9200007')).toBe('library')
    expect(castPlace(p, '9200999')).toBe(CAST.length)
    expect(seasonSchedule(p, '9200002', 'winter')).toEqual([
      { at: null, by: null, days: [1, 3, 4, 6, 7, 9, 10, 12] }, { at: 'plaza', by: 'default', days: [2, 5, 8, 11] },
    ])
  })

  it('puts a third of the cast out each day, everyone at her spot with no cap, and nobody at random', () => {
    const one = townDay(save(spring(1)), p)
    expect(one.where.size).toBe(34)
    expect([townDay(save(spring(2)), p).where.size, townDay(save(spring(3)), p).where.size]).toEqual([33, 33])
    for (const [id, spot] of one.where) expect([spot, one.by.get(id)]).toEqual([defaultSpot(p, id), 'default'])
    for (const id of PEOPLE) expect(one.where.has(id)).toBe(false)
    for (const id of [...SHOP_IDS, 'blue-cottage']) expect(one.at.get(id)).toEqual([])
    // The same town all day, every season alike, for every player.
    expect(townDay(save(spring(1)), p)).toEqual(one)
    expect([...townDay(save(farmDay({ year: 2, season: 'autumn', day: 1 })), p).where]).toEqual([...one.where])
    const other: SaveV4 = { ...save(spring(1)), account: { ...save().account, uid: 'someone-else' } }
    expect([...townDay(other, p).where]).toEqual([...one.where])
    // A spot holds everyone the schedules put there.
    const crowd = pack({ cast: { umas: CAST.map((u) => ({ ...u, spot: 'cafe' as const })) }, town: TOWN })
    expect(townDay(save(spring(1)), crowd).at.get('cafe')).toHaveLength(34)
    // Each Uma is out on four days a season.
    for (const season of SEASONS) expect(seasonSchedule(p, '9200050', season).find((g) => g.at !== null)!.days).toHaveLength(4)
  })

  it('leaves the Umas on the farm at the farm, and a farmhand there by day; one met who lives in town keeps her days', () => {
    const roster = Object.fromEntries(ids(60).map((id) => [id, newRosterUma(1)]))
    const home = ids(20)
    const farm = save(spring(1), { roster, dorm: { level: 8, home, swaps: [] } })
    const day = townDay(farm, p)
    for (const id of home) expect(day.where.has(id)).toBe(false)
    expect(day.where.has('9200022')).toBe(true)
    // One who moves in today leaves her spot, and nobody else moves.
    const moved = townDay({ ...farm, dorm: { ...farm.dorm, home: [...home, '9200022'] } }, p)
    expect(moved.where.has('9200022')).toBe(false)
    expect([...moved.where]).toEqual([...day.where].filter(([id]) => id !== '9200022'))
    // A farmhand who lives in town is on the farm by day: not in town, and in front of you.
    const hired = { ...farm, roster: { ...farm.roster, 9200022: { ...farm.roster['9200022']!, farmhand: 1 } } }
    expect(onFarmToday(hired, '9200022')).toBe(true)
    expect(townDay(hired, p).where.has('9200022')).toBe(false)
    expect(whereYouMeet(hired, p, '9200022')).toEqual({ here: true, farm: true, at: null })
  })

  it('says her line: the pack\'s town lines, else the game\'s, the same all day', () => {
    const [first] = [...townDay(save(spring(1)), p).where.keys()]
    expect(PLACEHOLDER_TOWN_LINES).toContain(townLineOf(save(), p, first!))
    expect(townLineOf(save(), p, first!)).toBe(townLineOf(save(), p, first!))
    const own = readStoryPack({ umas: { 9200001: { townLines: ['An invented hello.'] } }, routes: {}, cast: { umas: [{ characterId: '9200001' }] } }).pack
    expect(townLineOf(save(), own, '9200001')).toBe('An invented hello.')
  })
})

describe('her menu', () => {
  const p = pack({ town: TOWN, cast: { umas: [{ characterId: '9200007', job: { at: 'cafe' } }] } })
  const inTown = (s: SaveV4) => goToTown(s)

  it('before you\'ve met: introduce yourself, one action, while you\'re in town and she\'s there', () => {
    expect(herMenu(save(), p, '9200007', GAME_DAYS).map((i) => [i.id, i.cost, i.why])).toEqual([['introduce', 1, 'Go into town first.']])
    expect(herMenu(inTown(save()), p, '9200007', GAME_DAYS).map((i) => [i.id, i.open])).toEqual([['introduce', true]])
    expect(herMenu(inTown(save()), p, PEOPLE[0]!, GAME_DAYS)).toEqual([])
  })

  it('once met: talk, a gift, Ask her out (2 actions), the invitation to work (1), and her event when Ready', () => {
    const met = introduce(inTown(save()), p, '9200007')
    const menu = herMenu(met, p, '9200007', GAME_DAYS)
    expect(menu.map((i) => i.id)).toEqual(['talk', 'gift', 'evening', 'work'])
    expect(menu.find((i) => i.id === 'talk')).toMatchObject({ cost: 1, open: true })
    expect(menu.find((i) => i.id === 'gift')).toMatchObject({ cost: 1, open: false, why: 'Nothing in the Warehouse to give' })
    expect(menu.find((i) => i.id === 'evening')).toMatchObject({ label: 'Ask her out', cost: 2, open: false, why: 'From Friendship 3' })
    expect(menu.find((i) => i.id === 'work')).toMatchObject({ cost: 1, open: false, why: 'From Friendship 3' })
  })

  it('invites a friend to work, once, for an action: she\'s a farmhand from today, at any stage after', () => {
    const met = introduce(inTown(save()), p, '9200007')
    const friend: SaveV4 = { ...met, love: { ...met.love, 9200007: { ...met.love['9200007']!, level: 3 } } }
    expect(herMenu(friend, p, '9200007', GAME_DAYS).find((i) => i.id === 'work')).toMatchObject({ cost: 1, open: true, done: false })
    const hired = inviteToWork(friend, '9200007')
    expect(hired.today.actions).toBe(friend.today.actions + 1)
    expect(hired.roster['9200007']!.farmhand).toBe(5)
    expect(herMenu(hired, p, '9200007', GAME_DAYS).find((i) => i.id === 'work')).toMatchObject({ open: false, done: true, why: 'Works the farm ✓' })
    expect(() => inviteToWork(hired, '9200007')).toThrow('She works the farm already.')
    expect(() => inviteToWork(met, '9200007')).toThrow('Invite her once she’s a friend: Friendship 3.')
    expect(() => inviteToWork({ ...friend, today: { ...friend.today, actions: 10 } }, '9200007')).toThrow('No actions left today.')
    expect(hired.account.updatedAt).toBe(AT)
    expect(parseSaveV5(json(hired))).toEqual(hired)
    expect(() => parseSaveV5(json({ ...hired, roster: { ...hired.roster, 9200007: { ...hired.roster['9200007']!, farmhand: 6 } } }))).toThrow('farmhand')
  })

  it('meets her where she\'s in front of you: on the farm when she lives there or works it, else in town where she is today, once you\'re there', () => {
    const day = townDay(save(), p)
    const out = day.where.get('9200007')!
    const met = meet(save(), '9200007', p).save
    expect(whereYouMeet(met, p, '9200007')).toEqual({ here: false, farm: false, at: out })
    expect(whereYouMeet(goToTown(met), p, '9200007')).toEqual({ here: true, farm: false, at: out })
    expect(whereYouMeet(inviteToFarm(met, '9200007'), p, '9200007')).toEqual({ here: true, farm: true, at: null })
    // A farmhand is on the farm by day, from the invitation on.
    const friend: SaveV4 = { ...goToTown(met), love: { ...met.love, 9200007: { ...met.love['9200007']!, level: 3 } } }
    expect(whereYouMeet(inviteToWork(friend, '9200007'), p, '9200007')).toEqual({ here: true, farm: true, at: null })
    // Only the cast lives in town: anyone else is nowhere in it.
    const stranger = EVERYONE.find((id) => id !== '9200007' && !PEOPLE.includes(id))!
    expect(whereYouMeet(goToTown(save()), p, stranger)).toEqual({ here: false, farm: false, at: null })
    // On a day her schedule says nothing she's at home.
    const days = pack({ town: TOWN, cast: { umas: [{ characterId: '9200007', job: { at: 'cafe', days: [1] } }] } })
    expect(whereYouMeet(goToTown(meet(save(2), '9200007', days).save), days, '9200007')).toEqual({ here: false, farm: false, at: null })
  })

  it('a talk and a gift each cost an action, once a day each, and the save keeps her last talk and gift day', () => {
    const met = introduce(inTown(save()), p, '9200007')
    const stocked = { ...met, items: addGoods(met.items, 'carrot', 1, 2) }
    const talked = chatV4(stocked, '9200007').save
    expect(talked.today.actions).toBe(stocked.today.actions + 1)
    expect(talkedToday(talked, '9200007')).toBe(true)
    expect(townTalksOf(talked, '9200007')).toEqual({ talks: 1, last: 5, gift: 0 })
    const given = giftV4(talked, p, '9200007', 'carrot', 1).save
    expect(given.today.actions).toBe(talked.today.actions + 1)
    expect(giftedToday(given, '9200007')).toBe(true)
    expect(townTalksOf(given, '9200007')).toEqual({ talks: 1, last: 5, gift: 5 })
    const menu = herMenu(given, p, '9200007', GAME_DAYS)
    expect(menu.find((i) => i.id === 'talk')).toMatchObject({ open: false, done: true, why: 'Talked today ✓' })
    expect(menu.find((i) => i.id === 'gift')).toMatchObject({ open: false, done: true, why: 'Gift given today ✓' })
    expect(() => chatV4(given, '9200007')).toThrow('You’ve talked today.')
    expect(given.account.updatedAt).toBe(AT)
    expect(parseSaveV5(json(given))).toEqual(given)
    // With no actions left, both are refused.
    const spent = { ...met, items: stocked.items, today: { ...met.today, actions: 10 } }
    expect(() => chatV4(spent, '9200007')).toThrow('No actions left today.')
    expect(herMenu(spent, p, '9200007', GAME_DAYS).find((i) => i.id === 'talk')!.why).toBe('No actions left today.')
  })

  it('Ask her out: her evening from Friendship 3 with her in front of you, in town where she is or on the farm, 2 actions, one a day', () => {
    const met = meet(save(), '9200007', p).save
    const friend: SaveV4 = { ...met, love: { ...met.love, 9200007: { ...met.love['9200007']!, level: 3 } } }
    const evening = (s: SaveV4) => herMenu(s, p, '9200007', GAME_DAYS).find((i) => i.id === 'evening')!
    // In town, once you've gone in and she's out: she's in front of you.
    expect(evening(friend).why).toBe('She isn’t here today.')
    expect(evening(goToTown(friend))).toMatchObject({ label: 'Ask her out', cost: 2, open: true })
    const out = spendEvening(goToTown(friend), p, '9200007', 'walk', 70).save
    expect(out.today.evenings).toEqual([{ with: '9200007', kind: 'walk' }])
    expect(out.today.actions).toBe(goToTown(friend).today.actions + 2)
    expect(evening(out)).toMatchObject({ open: false, done: true, why: 'Spent this evening ✓' })
    // On the farm she's in front of you without going into town; one evening a day across everyone.
    const home = inviteToFarm(friend, '9200007')
    expect(evening(home)).toMatchObject({ cost: 2, open: true })
    expect(evening({ ...home, today: { ...home.today, actions: 9 } })).toMatchObject({ open: false, why: 'That takes 2 actions.' })
    expect(evening({ ...home, today: { ...home.today, evenings: [{ with: '9200001', kind: 'walk' }] } }).why).toBe('Tonight’s evening is spent')
    // A farmhand is in front of you every day.
    expect(evening(inviteToWork(friend, '9200007'))).toMatchObject({ open: true })
    expect(() => spendEvening(friend, p, '9200007', 'walk', 70)).toThrow('She isn’t here today.')
  })
})
