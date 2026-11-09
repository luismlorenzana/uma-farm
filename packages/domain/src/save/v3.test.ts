// Save v3 (F17; CS3, CS53): day 1, the strict parse and its paths, and the largest save fitting Firestore's 1 MiB. Invented
// outfit ids only.
import { payItems, type Entry, type WorkRow } from '@luismlorenzana/uma-work'
import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '../farm/ranks'
import { GOOD_IDS } from '../goods/ids'
import { count, int, object, oneOf } from './parse'
import { LOOP_SLOTS, LOOP_WORK_PLACES, parseSaveV3, type LoopKinds } from './parse-v3'
import type { MorningSummary } from '../night/summary'
import { newSaveV2, parseSave, SaveParseError } from './save'
import { newBlock, newRosterUma, newSave, pairKey, type LoopWorkRequest, type SaveV3 } from './v3'
import { stockKey } from './warehouse'

const AT = '2026-11-09T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Rules the parse never runs. */
const RULES = { plan: () => [], pay: payItems }

/** A test kind: gather an item at the forest or the Fishery for 1–30 days. */
const KINDS: LoopKinds = {
  gather: {
    places: ['forest', 'fishery'], rules: RULES, multiDay: false,
    parseRequest: (o, path) => {
      const r = object(o, path, ['kind', 'item', 'count'])
      return { kind: 'gather', item: oneOf(r.item, `${path}.item`, ['pine-log', 'carp']), count: int(r.count, `${path}.count`, 1, 30) }
    },
  },
  refine: {
    places: ['mill', 'sawmill', 'smokehouse', 'mine', 'quarry', 'smelter', 'cutter'], rules: RULES, multiDay: true,
    parseRequest: (o, path) => {
      const r = object(o, path, ['kind', 'item', 'count'])
      return { kind: 'refine', item: oneOf(r.item, `${path}.item`, GOOD_IDS), count: count(r.count, `${path}.count`) }
    },
  },
}

/** A save with three Umas on the farm, a few goods, a tender and a bond. */
function farming(): SaveV3 {
  const save = newSave('u1', AT)
  const roster = { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }
  const block = newBlock('A')
  block.tender = '202'
  block.plots[0] = { crop: 'carrot', growth: 1.25, ready: false, regrowing: false, own: false }
  return {
    ...save, roster, dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, items: { ...save.items, carp: [2, 1, 0, 0, 0] },
    bin: { 'pine-log': [3, 0, 0, 0, 0] }, fields: { blocks: [block] }, crops: { carrot: 4 }, bonds: { [pairKey('303', '101')]: 10 },
  }
}

/** A morning summary on day 1: every line kind F18 and F19 write. */
const SUMMARY: MorningSummary = {
  day: 1, bin: [{ kind: 'sold', id: 'carp', stars: 2, count: 3, gold: 150, demand: false }, { kind: 'sold', id: 'carp', stars: 1, count: 1, gold: 40, demand: false }], work: [{ kind: 'jobs', place: 'forest', jobs: 1, items: 5 }], ranks: [], bonds: [],
  news: [{ kind: 'season', season: 'spring' }, { kind: 'festival', festival: 'flower-show', when: 'tomorrow' }], nudges: [{ kind: 'idle', umas: ['303'] }],
}

/** A started entry of `n` items of `item`, each at its own stars. */
const entry = (item: string, n: number): Entry<LoopWorkRequest> => ({
  request: { kind: 'gather', item, count: 1 }, seconds: Array(n).fill(86_400 / n), inputs: Array.from({ length: n }, () => []),
  outputs: Array.from({ length: n }, (_, i) => ({ item: stockKey(item, (i % 5) + 1) })), exp: Array(n).fill(0), startedAt: 0, acceleratedMs: 0,
  collected: 0, speed: 1, fromQueue: false,
})

describe('day 1 (CS3)', () => {
  it('starts with 500g, 9 Carrot seeds, Block A of 9 empty plots, the Dorm at level 1 and chapter 1', () => {
    const save = newSave('u1', AT)
    expect(save).toMatchObject({
      version: 3, account: { uid: 'u1', createdAt: AT, updatedAt: AT }, calendar: { day: 1 }, gold: 500, items: { 'seed-carrot': [9, 0, 0, 0, 0] },
      dorm: { level: 1, home: [], swaps: [] }, buildings: { dorm: 1 }, farm: { points: 0, chapter: 1 }, roster: {}, work: {}, summary: null,
    })
    expect(save.fields.blocks).toHaveLength(1)
    expect(save.fields.blocks[0]!.id).toBe('A')
    expect(save.fields.blocks[0]!.plots).toHaveLength(9)
    expect(save.fields.blocks[0]!.plots.every((p) => p.crop === null && p.growth === 0)).toBe(true)
    expect(Object.values(save.tools)).toEqual([1, 1, 1, 1, 1, 1, 1])
  })

  it('makes a new Uma Novice in all nine activities', () => {
    const uma = newRosterUma(3)
    expect(uma.joined).toBe(3)
    expect(Object.keys(uma.ranks)).toEqual([...ACTIVITIES])
    expect(Object.values(uma.ranks).every((r) => r.points === 0 && r.rank === 0 && r.challenge === 0)).toBe(true)
  })

  it('keys a bond by its ids in numeric order', () => {
    expect(pairKey('202', '101')).toBe('101:202')
    expect(pairKey('99', '101')).toBe('99:101')
  })
})

describe('the parse', () => {
  it('round-trips day 1 and a farm in play through JSON', () => {
    for (const save of [newSave('u1', AT), farming(), { ...farming(), summary: SUMMARY }]) {
      expect(parseSaveV3(json(save))).toEqual(save)
      expect(parseSave(json(save))).toEqual(save)
    }
  })

  it('returns a v2 save as v2 and a v1 as v2 (the dark launch)', () => {
    const v2 = newSaveV2('u1', AT)
    expect(parseSave(json(v2))).toEqual(v2)
    expect(parseSave({ version: 1, account: v2.account }).version).toBe(2)
  })

  it('refuses a newer version', () => {
    expect(() => parseSave({ ...json(newSave('u1', AT)), version: 4 })).toThrow('save.version: version 4 is newer than this app (3)')
  })

  it.each<[string, (s: Record<string, any>) => void, string]>([
    ['an unknown key', (s) => { s.extra = 1 }, 'save: unknown keys extra'],
    ['an unknown key in an Uma', (s) => { s.roster['101'].talent = 'S' }, 'save.roster.101: unknown keys talent'],
    ['a bad outfit id', (s) => { s.roster.abc = s.roster['101'] }, 'save.roster.abc: outfit ids are positive integers'],
    ['a missing activity', (s) => { delete s.roster['101'].ranks.ranch }, 'save.roster.101.ranks.ranch: expected an object'],
    ['an unknown activity', (s) => { s.roster['101'].ranks.hunting = { points: 0, rank: 0, challenge: 0 } }, 'save.roster.101.ranks: unknown keys hunting'],
    ['a rank past Legend', (s) => { s.roster['101'].ranks.mining.rank = 6 }, 'save.roster.101.ranks.mining.rank: expected 0–5'],
    ['a join after today', (s) => { s.roster['101'].joined = 2 }, 'save.roster.101.joined: after today'],
    ['an unknown good', (s) => { s.items['chopped-carrot'] = [1, 0, 0, 0, 0] }, 'save.items.chopped-carrot: unknown item'],
    ['a starred seed', (s) => { s.items['seed-carrot'] = [9, 1, 0, 0, 0] }, 'save.items.seed-carrot: seeds are ★1 only'],
    ['four stars of counts', (s) => { s.items.carp = [1, 0, 0, 0] }, 'save.items.carp: expected 5–5 entries'],
    ['a seed in the bin', (s) => { s.bin['seed-carrot'] = [1, 0, 0, 0, 0] }, 'save.bin.seed-carrot: unknown item'],
    ['an Uma home off the roster', (s) => { s.dorm.home.push('404') }, 'save.dorm.home: expected 0–3 entries'],
    ['a stranger at home', (s) => { s.dorm.home[2] = '404' }, 'save.dorm.home.2: expected an Uma on the roster'],
    ['an Uma home twice', (s) => { s.dorm.home[2] = '101' }, 'save.dorm.home.2: repeated'],
    ['a Dorm above the level bought', (s) => { s.dorm.level = 2 }, 'save.dorm.level: above the level bought (buildings.dorm)'],
    ['an unknown building', (s) => { s.buildings.castle = 1 }, 'save.buildings.castle: expected one of'],
    ['a missing tool', (s) => { delete s.tools.rod }, 'save.tools.rod: expected 1–5'],
    ['an unknown crop', (s) => { s.crops.kale = 1 }, 'save.crops.kale: unknown crop'],
    ['a block of eight plots', (s) => { s.fields.blocks[0].plots.pop() }, 'save.fields.blocks.0.plots: expected 9–9 entries'],
    ['blocks out of order', (s) => { s.fields.blocks.push({ ...s.fields.blocks[0], id: 'A', tender: null }) }, 'save.fields.blocks.1.id: blocks run A, B, C, D, each once'],
    ['a block E', (s) => { s.fields.blocks[0].id = 'E' }, 'save.fields.blocks.0.id: expected one of A, B, C, D'],
    ['a stranger tending', (s) => { s.fields.blocks[0].tender = '404' }, 'save.fields.blocks.0.tender: expected an Uma on the roster'],
    ['an empty plot that grows', (s) => { s.fields.blocks[0].plots[1].growth = 1 }, 'save.fields.blocks.0.plots.1: an empty plot holds nothing'],
    ['a bond out of order', (s) => { s.bonds = { '303:101': 10 } }, 'save.bonds.303:101: expected two roster ids in numeric order, idA:idB'],
    ['a bond with a stranger', (s) => { s.bonds = { '101:404': 10 } }, 'save.bonds.101:404'],
    ['work off the roster', (s) => { s.work['404'] = {} }, 'save.work.404: expected an Uma on the roster'],
    ['a summary missing its sections', (s) => { s.summary = { day: 1 } }, 'save.summary.bin: expected 0–1300 entries'],
    ['a summary of another day', (s) => { s.summary = { ...SUMMARY, day: 2 } }, 'save.summary.day: expected today'],
    ['a seed sold', (s) => { s.summary = { ...SUMMARY, bin: [{ ...SUMMARY.bin[0], id: 'seed-carrot' }] } }, 'save.summary.bin.0.id: unknown good'],
    ['a sale at ★6', (s) => { s.summary = { ...SUMMARY, bin: [{ ...SUMMARY.bin[0], stars: 6 }] } }, 'save.summary.bin.0.stars: expected 1–5'],
    ['a sale of none', (s) => { s.summary = { ...SUMMARY, bin: [{ ...SUMMARY.bin[0], count: 0 }] } }, 'save.summary.bin.0.count: expected 1–'],
    ['a sale of fractional gold', (s) => { s.summary = { ...SUMMARY, bin: [{ ...SUMMARY.bin[0], gold: 97.5 }] } }, 'save.summary.bin.0.gold: expected a non-negative integer'],
    ['a good at a star sold twice', (s) => { s.summary = { ...SUMMARY, bin: [SUMMARY.bin[0], SUMMARY.bin[0]] } }, 'save.summary.bin.1: repeated'],
    ['a sale in words', (s) => { s.summary = { ...SUMMARY, bin: [{ ...SUMMARY.bin[0], text: '3 Carp' }] } }, 'save.summary.bin.0: unknown keys text'],
    ['a sale with no demand mark', (s) => { s.summary = { ...SUMMARY, bin: [{ kind: 'sold', id: 'carp', stars: 2, count: 3, gold: 150 }] } }, 'save.summary.bin.0.demand: expected true or false'],
    ['a summary line in words', (s) => { s.summary = { ...SUMMARY, news: [{ kind: 'season', season: 'spring', text: 'Spring!' }] } }, 'save.summary.news.0: unknown keys text'],
    ['jobs at no work place', (s) => { s.summary = { ...SUMMARY, work: [{ kind: 'jobs', place: 'gate', jobs: 1, items: 3 }] } }, 'save.summary.work.0.place: expected one of'],
    ['a place twice in work done', (s) => { s.summary = { ...SUMMARY, work: [SUMMARY.work[0], SUMMARY.work[0]] } }, 'save.summary.work.1: repeated'],
    ['an unknown festival', (s) => { s.summary = { ...SUMMARY, news: [{ kind: 'festival', festival: 'kite-day', when: 'today' }] } }, 'save.summary.news.0.festival: expected one of'],
    ['a stranger idle', (s) => { s.summary = { ...SUMMARY, nudges: [{ kind: 'idle', umas: ['404'] }] } }, 'save.summary.nudges.0.umas.0: expected an Uma on the roster'],
    ['a chapter 0', (s) => { s.farm.chapter = 0 }, 'save.farm.chapter: expected 1–9'],
    ['a recipe that is no dish', (s) => { s.workshops.recipes = ['dish-fish-11'] }, 'save.workshops.recipes.0: unknown dish'],
    ['a duck in the barn', (s) => { s.ranch.animals = [{ id: 'd1', kind: 'duck', building: 'barn', affection: 0, streak: 0, carer: null, next: 2 }] }, 'save.ranch.animals.0.building: a duck lives in the coop'],
  ])('refuses %s, saying where', (_, edit, message) => {
    const raw = json(farming()) as unknown as Record<string, any>
    edit(raw)
    expect(() => parseSave(raw)).toThrow(SaveParseError)
    expect(() => parseSave(raw)).toThrow(message)
  })
})

describe('work rows (decision 11)', () => {
  const row = (outfitId: string, building: string, slot: number): WorkRow<LoopWorkRequest> => ({
    outfitId, slot: { building, slot }, entries: [entry('pine-log', 5)], queue: [{ kind: 'gather', item: 'pine-log', count: 1 }], last: null, dropped: null,
  })

  it('reads rows through the kinds registry, and none without it', () => {
    const save = { ...farming(), work: { 101: row('101', 'forest', 0) } }
    expect(parseSaveV3(json(save), 'save', KINDS)).toEqual(save)
    expect(() => parseSave(json(save))).toThrow('save.work.101.entries.0.request.kind: unknown kind')
  })

  it.each<[string, (w: Record<string, any>) => void, string]>([
    ['a Wilds place', (w) => { w.slot.building = 'monster-den' }, 'save.work.101.slot.building: expected one of forest'],
    ['a fifth slot', (w) => { w.slot.slot = 4 }, 'save.work.101.slot.slot: expected 0–3'],
    ['a kind at the wrong place', (w) => { w.slot.building = 'mill' }, 'save.work.101.entries.0.request.kind: not worked at this place'],
    ['an output with no stars', (w) => { w.entries[0].outputs[0].item = 'pine-log' }, 'save.work.101.entries.0.outputs.0.item: expected a stock key <id>@<stars>'],
    ['an input that is no good', (w) => { w.entries[0].inputs[0] = [{ item: 'chopped-carrot@1', qty: 1 }] }, 'save.work.101.entries.0.inputs.0.0.item'],
    ['arrays of different lengths', (w) => { w.entries[0].exp.pop() }, 'save.work.101.entries.0.exp: expected 5–5 entries'],
    ['a request the kind refuses', (w) => { w.queue[0].count = 31 }, 'save.work.101.queue.0.count: expected 1–30'],
  ])('refuses %s', (_, edit, message) => {
    const raw = json({ ...farming(), work: { 101: row('101', 'forest', 0) } }) as unknown as Record<string, any>
    edit(raw.work['101'])
    expect(() => parseSaveV3(raw, 'save', KINDS)).toThrow(message)
  })

  it('refuses two Umas in one slot', () => {
    const save = { ...farming(), work: { 101: row('101', 'forest', 0), 202: row('202', 'forest', 0) } }
    expect(() => parseSaveV3(json(save), 'save', KINDS)).toThrow('save.work.202.slot: already held')
  })
})

describe('size (CS53)', () => {
  it('fits Firestore with 60 Umas, 1,770 bonds, every good at five stars and 48 work rows', () => {
    const ids = Array.from({ length: 60 }, (_, i) => String(1001 + i))
    const save = newSave('u1', AT)
    save.calendar.day = 480
    save.gold = 99_999_999
    for (const id of ids) {
      const uma = newRosterUma(1)
      for (const a of ACTIVITIES) uma.ranks[a] = { points: 1999.9, rank: 4, challenge: 999 }
      save.roster[id] = { ...uma, affinity: 1000, wellFed: 3 }
    }
    save.buildings.dorm = 10
    save.dorm = { level: 10, home: ids, swaps: [] }
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) save.bonds[pairKey(ids[i]!, ids[j]!)] = 750
    for (const id of GOOD_IDS) {
      save.items[id] = [999, 999, 999, 999, 999]
      save.bin[id] = [999, 999, 999, 999, 999]
      save.diary.shipped[id] = 99_999
    }
    // 36 rows hold every v3 slot, each with four entries of ten items and three queued; 12 more wait with Repeat and a
    // stopped queue.
    let next = 0
    for (const building of LOOP_WORK_PLACES) {
      for (let slot = 0; slot < LOOP_SLOTS; slot++) {
        const id = ids[next++]!
        const kind = building === 'forest' || building === 'fishery' ? 'gather' : 'refine'
        const item = building === 'fishery' ? 'carp' : 'pine-log'
        const e = { ...entry(item, 10), request: { kind, item, count: 10 }, inputs: Array.from({ length: 10 }, () => [{ item: 'carp@3', qty: 2 }]) }
        save.work[id] = { outfitId: id, slot: { building, slot }, entries: [e, e, e, e], queue: [e.request, e.request, e.request], last: { slot: { building, slot }, request: e.request }, dropped: null }
      }
    }
    for (const id of ids.slice(next, next + 12)) {
      const request = { kind: 'gather', item: 'carp', count: 10 }
      save.work[id] = { outfitId: id, slot: null, entries: [], queue: [], last: { slot: { building: 'fishery', slot: 0 }, request },
        dropped: { at: 0, slot: { building: 'fishery', slot: 0 }, requests: [request, request, request, request], short: [{ item: 'carp@1', qty: 9 }], refused: null } }
    }
    expect(Object.keys(save.work)).toHaveLength(48)
    expect(Object.keys(save.bonds)).toHaveLength(1770)
    const text = JSON.stringify(save)
    expect(parseSaveV3(JSON.parse(text), 'save', KINDS)).toEqual(save)
    expect(text.length).toBeLessThan(1024 * 1024)
  })
})
