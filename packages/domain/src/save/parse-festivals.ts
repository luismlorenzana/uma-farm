import { dateOf } from '../farm/calendar'
import { FISHING_SPOTS } from '../gathering/ids'
import { baseGoodId, cropGradeOf, isBaseFish, isGoodId } from '../goods/ids'
import { FISH_MODES } from '../goods/production-catalogue'
import { CONTESTS, CUP_CATEGORIES, SHOW_CUES, contestStaff, type ActiveContest, type ContestCard, type DerbyCatch, type FestivalState, type FlowerDate } from '../festivals/state'
import { amount, bool, int, list, object, oneOf, record } from './parse'
import { fail, key, member, unique } from './parse-loop'
import { ANIMAL_KINDS, FIELD_TILES, HOME_ROOM, MAX_FIELD_TILES, isDishId, type FarmSave } from './v4'
import { parseStockKey } from './warehouse'

export function parseFestival(value: unknown, path: string, today: number, roster: ReadonlySet<string>): FestivalState {
  const o = object(value, path, ['mark', 'box', 'care', 'worked', 'active', 'last'])
  const out: FestivalState = {}
  const who = (v: unknown, at: string) => v === null ? null : member(v, at, roster)
  const crew = (v: unknown, at: string, max: number) => unique(list(v, at, 0, max).map((id, i) => member(id, `${at}.${i}`, roster)), at)
  const when = (v: unknown, at: string) => int(v, at, 1, today)
  const bounded = (v: unknown, at: string, max: number) => int(v, at, 0, max)
  const stock = (v: unknown, at: string, fits: (id: string) => boolean) => {
    const lot = typeof v === 'string' ? parseStockKey(v) : null
    return lot && fits(lot.id) ? v as string : fail(at, 'unexpected exhibit or catch')
  }
  const dates = (v: unknown, at: string, year: number): FlowerDate[] => {
    const rows = unique(list(v, at, 0, 10).map((v, i) => {
      const p = `${at}.${i}`
      const row = object(v, p, ['day', 'hands'])
      const day = when(row.day, p)
      if (dateOf(day).year !== year) fail(p, 'expected the exhibition year')
      return { day, hands: crew(row.hands, p, 3) }
    }), at, (date) => String(date.day))
    return rows
  }
  if (o.mark !== undefined) {
    const p = `${path}.mark`
    const row = object(o.mark, p, ['day', 'year', 'tile', 'crop', 'dates', 'water'])
    const day = when(row.day, p)
    const year = int(row.year, p, dateOf(day).year, dateOf(day).year)
    const crop = typeof row.crop === 'string' ? cropGradeOf(row.crop)?.crop : undefined
    if (!crop || crop !== row.crop) fail(p, 'expected a crop')
    out.mark = { day, year, crop: crop!, tile: bounded(row.tile, p, MAX_FIELD_TILES - 1), dates: dates(row.dates, p, year),
      ...(row.water === undefined ? {} : { water: who(row.water, p) }) }
    if (out.mark.dates.some((date) => date.day < day)) fail(p, 'work predates the marker')
  }
  if (o.box !== undefined) {
    const p = `${path}.box`
    const row = object(o.box, p, ['year', 'key', 'dates'])
    const year = int(row.year, p, 1, dateOf(today).year)
    if (out.mark) fail(p, 'a boxed crop already holds the place')
    out.box = { year, key: stock(row.key, p, (id) => !!cropGradeOf(id)), dates: dates(row.dates, p, year) }
  }
  if (o.care !== undefined) {
    const p = `${path}.care`
    const rows = Object.entries(record(o.care, p))
    if (rows.length > 2 * HOME_ROOM) fail(p, 'too many animals')
    out.care = Object.fromEntries(rows.map(([id, v]) => [key(id, p), unique(list(v, p, 1, 7).map((v) => {
      const row = object(v, p, ['day', 'by'])
      return { day: when(row.day, p), by: who(row.by, p) }
    }), p, ({ day }) => String(day))]))
  }
  if (o.worked !== undefined) {
    const p = `${path}.worked`
    out.worked = Object.fromEntries(Object.entries(record(o.worked, p)).map(([id, v]) => [member(id, p, roster),
      Object.fromEntries(Object.entries(object(v, p, CUP_CATEGORIES)).map(([category, at]) => [category, when(at, p)]))]))
  }
  function fish(v: unknown, p: string): DerbyCatch {
    const row = object(v, p, ['key', 'by', 'cm', 'slot', 'score'])
    const cm = amount(row.cm, p)
    if (cm <= 0 || cm > 1000) fail(p, 'expected a measured fish')
    return { key: stock(row.key, p, (id) => isBaseFish(baseGoodId(id))), by: who(row.by, p), cm,
      slot: bounded(row.slot, p, 2), score: bounded(row.score, p, 100) }
  }
  if (o.active !== undefined) {
    const p = `${path}.active`
    const row = record(o.active, p)
    const id = oneOf(row.id, p, ['fishing-derby', 'animal-show'] as const)
    const common = { day: int(row.day, p, today, today), rank: int(row.rank, p, 1, 10), seed: bounded(row.seed, p, 0xffffffff) }
    let active: ActiveContest
    if (id === 'fishing-derby') {
      object(row, p, ['id', 'day', 'rank', 'seed', 'spot', 'mode', 'casters', 'catches'])
      const casters = list(row.casters, p, 3, 3).map((v) => {
        const c = object(v, p, ['by', 'q', 'skill', 'level', 'timing'])
        const q = amount(c.q, p)
        const skill = amount(c.skill, p)
        if (q > 20 || skill < 1 || skill > 6) fail(p, 'invalid fishing terms')
        return { by: who(c.by, p), q, skill, level: bounded(c.level, p, 10), timing: bounded(c.timing, p, 95) }
      })
      const catches = list(row.catches, p, 0, 2).map((v, i) => {
        if (v === null) {
          if (casters[i]?.by) fail(p, 'expected the Uma’s catch')
          return null
        }
        const catchRow = fish(v, p)
        if (catchRow.slot !== i || catchRow.by !== casters[i]?.by) fail(p, 'catch must match its caster')
        return catchRow
      })
      active = { ...common, id, spot: oneOf(row.spot, p, FISHING_SPOTS), mode: oneOf(row.mode, p, FISH_MODES), casters, catches }
      const staff = contestStaff(active)
      if (staff.length > 2 || new Set(staff).size !== staff.length) fail(p, 'choose different Uma casters')
    } else {
      object(row, p, ['id', 'day', 'rank', 'seed', 'animal', 'kind', 'caretaker', 'handler', 'auto', 'hearts', 'fed', 'cared', 'cues', 'answers'])
      const handler = who(row.handler, p)
      const caretaker = who(row.caretaker, p)
      if (handler && handler !== caretaker) fail(p, 'handler must be the caretaker')
      const auto = int(row.auto, p, handler ? 1 : 0, handler ? 2 : 0)
      const cues = list(row.cues, p, 4, 4).map((v) => oneOf(v, p, SHOW_CUES))
      const answers = list(row.answers, p, auto, 3).map((v) => bool(v, p))
      if (new Set(cues).size < 2 || answers.slice(0, auto).some((answer) => !answer)) fail(p, 'invalid show transcript')
      active = { ...common, id, animal: key(row.animal, p), kind: oneOf(row.kind, p, ANIMAL_KINDS), caretaker, handler, auto,
        hearts: bounded(row.hearts, p, 10), fed: bool(row.fed, p), cared: bounded(row.cared, p, 7), cues, answers }
    }
    out.active = active
  }
  if (o.last !== undefined) {
    const p = `${path}.last`
    out.last = {}
    for (const [id, value] of Object.entries(object(o.last, p, CONTESTS))) {
      const at = `${p}.${id}`
      const rule = oneOf(id, at, CONTESTS)
      const row = object(value, at, ['day', 'rank', 'score', 'place', 'gold', 'parts', 'exhibits', 'animal', 'catches', 'staff', 'credit', 'presenters'])
      const exhibits = rule === 'flower-show' ? 1 : rule === 'harvest-cup' ? 3 : 0
      const parts = rule === 'animal-show' || rule === 'harvest-cup' ? 4 : 3
      const card: ContestCard = { day: when(row.day, at), rank: int(row.rank, at, 1, 10),
        score: row.score === null ? null : bounded(row.score, at, 100), place: row.place === null ? null : int(row.place, at, 1, 3) as 1 | 2 | 3,
        gold: bounded(row.gold, at, 4000), parts: list(row.parts, at, parts, parts).map((v) => bounded(v, at, 100)),
        exhibits: unique(list(row.exhibits, at, exhibits, exhibits).map((v) => stock(v, at, rule === 'flower-show' ? (id) => !!cropGradeOf(id) : (id) => isGoodId(id) || isDishId(id))), at),
        staff: crew(row.staff, at, 3), credit: crew(row.credit, at, 2),
      }
      if ((card.score === null) !== (card.place === null) || (!card.place && card.gold) || (card.place !== 1 && card.credit.length)) fail(at, 'inconsistent placement')
      if (rule === 'animal-show') {
        const animal = object(row.animal, at, ['id', 'kind'])
        card.animal = { id: key(animal.id, at), kind: oneOf(animal.kind, at, ANIMAL_KINDS) }
      }
      if (rule === 'fishing-derby') card.catches = unique(list(row.catches, at, 0, 3).map((v) => fish(v, at)), at, ({ slot }) => String(slot))
      if (rule === 'harvest-cup') {
        card.presenters = list(row.presenters, at, 3, 3).map((v) => who(v, at))
        const named = card.presenters.filter((id): id is string => id !== null)
        if (named.length !== card.staff.length || named.some((id, i) => id !== card.staff[i])) fail(at, 'presenters must match booked staff')
      }
      out.last[rule] = card
    }
  }
  return out
}

export function checkFestivalSave(save: FarmSave, path: string) {
  const state = save.workshops.festival
  if (!state) return
  const at = `${path}.workshops.festival`
  const play = state.active
  const day = save.calendar.day
  const mark = state.mark
  if (mark && mark.tile >= save.fields.plots.length * FIELD_TILES) fail(at, 'marked tile is outside the farm')
  const cards = Object.values(state.last ?? {}).filter((card) => card.day === day)
  if (play && (save.workshops.current || save.workshops.restaurant?.shift || cards.length || (state.last?.[play.id] && dateOf(state.last[play.id]!.day).year === dateOf(day).year))) fail(at, 'invalid concurrent play')
  if (cards.length > 1) fail(at, 'more than one contest today')
  for (const id of play ? contestStaff(play) : cards.flatMap((card) => card.staff)) {
    if (save.roster[id]?.farmhand === undefined || [save.today.assistant, save.today.cook, save.today.server].includes(id)
      || save.expeditions.some((trip) => trip.back > day && trip.party.includes(id))) fail(at, 'invalid festival booking')
  }
}
