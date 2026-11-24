import { int, list, object, record } from './parse'
import { dateOf, yearsSince } from '../farm/calendar'
import { fail, member, outfit, unique } from './parse-loop'
import {
  COHORTS, DUO_LIMIT, NIGHT_VISITS, TRUE_LOVE, celebrationDate, duoKey, festivalGiftWindow, isCelebration, isDuoNightVariant, unlockedLooks, visitLookKind, visitMemoryKey,
  type Celebration, type Cohort, type Duo, type GreaterLove, type LongGame, type Visit,
} from './long-game'
import { EVENING_KINDS, type SaveV4 } from './v4'
import { parseStockKey } from './warehouse'

export function parseLongGame(value: unknown, path: string, save: SaveV4): LongGame {
  const today = save.calendar.day
  const ids = new Set(Object.keys(save.roster))
  const spouses = new Set(Object.keys(save.love).filter(id => save.love[id]?.stage === 'spouse' && save.love[id]?.wed))
  const raw = object(value, path, ['weddings', 'celebrations', 'love', 'night', 'morning', 'duos', 'outings', 'gifts', 'pledge', 'tradition', 'ending'])
  const weddings = unique(list(raw.weddings, path, 1, spouses.size).map(id => member(id, path, spouses)), path)
  if (weddings.some((id, i) => i > 0 && save.love[id]!.wed! < save.love[weddings[i - 1]!]!.wed!)) fail(path, 'expected weddings in order')
  const game: LongGame = { weddings, celebrations: {}, love: {} }
  const withGame = { ...save, longGame: game }
  for (const [id, date] of Object.entries(record(raw.celebrations, path))) {
    if (!isCelebration(id) || !save.diary.read.includes(id)) fail(path, 'unknown celebration receipt')
    const scheduled = celebrationDate(withGame, id as Celebration)
    if (!scheduled) fail(path, 'expected a scheduled celebration')
    game.celebrations[id as Celebration] = int(date, path, scheduled ?? 1, today)
  }
  const visitOf = (value: unknown, memory = false): Visit => {
    const row = object(value, path, ['who', 'kind', 'looks', 'day', 'anniversary', 'birthday', 'duoArt', ...(memory ? ['overnight'] : [])])
    const who = unique(list(row.who, path, 1, 2).map(id => member(id, path, spouses)), path) as Visit['who']
    const day = int(row.day, path, Math.max(...who.map(id => save.love[id]!.wed!)), today)
    const kind = row.kind
    if (kind !== 'pajamas' && kind !== 'anniversary' && kind !== 'birthday') return fail(path, 'unknown visit kind')
    const duoArt = row.duoArt
    if (duoArt !== undefined && (!isDuoNightVariant(duoArt) || kind !== 'pajamas' || who.length !== 2)) return fail(path, 'unknown duo bedtime art')
    const looks = list(row.looks, path, who.length, who.length).map((look, i) => int(look, path, 1, unlockedLooks(TRUE_LOVE, visitLookKind({ kind }, i))))
    if (kind !== 'anniversary' && row.anniversary !== undefined) fail(path, 'expected an anniversary')
    if (kind !== 'birthday' && row.birthday !== undefined) fail(path, 'expected a birthday')
    const anniversary = kind === 'anniversary' ? int(row.anniversary, path, 1, yearsSince(save.love[who[0]]!.wed!, day, save.calendar)) : undefined
    const birthday = kind === 'birthday' ? int(row.birthday, path, dateOf(day, save.calendar).year, dateOf(day, save.calendar).year) : undefined
    if (row.overnight !== undefined && (row.overnight !== true || day >= today)) fail(path, 'expected a past overnight visit')
    return { who, day, kind, looks, ...(anniversary === undefined ? {} : { anniversary }), ...(birthday === undefined ? {} : { birthday }),
      ...(duoArt === undefined ? {} : { duoArt }), ...(row.overnight === true ? { overnight: true } : {}) }
  }
  for (const [id, value] of Object.entries(record(raw.love, path))) {
    member(id, path, spouses)
    const row = object(value, path, ['points', 'pajamas', 'anniversaries', 'trueDay', 'anniversary', 'birthday', 'memories'])
    const points = int(row.points, path, 0, TRUE_LOVE)
    const since = save.love[id]!.wed!
    const memories = list(row.memories, path, 0, 10_000).map(value => visitOf(value, true))
    unique(memories.map(visitMemoryKey), path)
    if (memories.some(v => {
      const i = v.who.indexOf(id)
      return i === -1 || v.looks[i]! > unlockedLooks(points, visitLookKind(v, i))
    })) fail(path, 'expected her unlocked night looks')
    const heart: GreaterLove = { points, memories, pajamas: int(row.pajamas, path, 0, unlockedLooks(points, 'pajamas')),
      anniversaries: int(row.anniversaries, path, 0, unlockedLooks(points, 'anniversary')) }
    if (points === TRUE_LOVE) heart.trueDay = int(row.trueDay, path, since, today)
    else if (row.trueDay !== undefined) fail(path, 'True Love requires a full bar')
    if (row.anniversary !== undefined) heart.anniversary = int(row.anniversary, path, 1, yearsSince(since, today, save.calendar))
    if (row.birthday !== undefined) heart.birthday = int(row.birthday, path, dateOf(since, save.calendar).year, dateOf(today, save.calendar).year)
    game.love[id] = heart
  }
  if (raw.night !== undefined) {
    const night = object(raw.night, path, ['day', 'visits', 'stay'])
    const day = int(night.day, path, today, today)
    const visits = list(night.visits, path, 1, NIGHT_VISITS).map(value => visitOf(value))
    if (visits.some(visit => visit.day !== day)) fail(path, 'expected tonight’s visits')
    if (night.stay !== undefined && (night.stay !== true || visits.length !== NIGHT_VISITS)) fail(path, 'a stay follows the fifth visit')
    game.night = { day, visits, ...(night.stay === true ? { stay: true } : {}) }
  }
  if (raw.morning !== undefined) {
    game.morning = visitOf(raw.morning)
    if (game.morning.day !== today - 1) fail(path, 'expected last night’s visit')
  }
  if (raw.duos !== undefined) {
    const counts = new Map<string, number>()
    game.duos = list(raw.duos, path, 0, 1000).map(row => {
      const pair = unique(list(row, path, 2, 2).map(id => outfit(id, path)), path) as Duo
      for (const id of pair) {
        const count = (counts.get(id) ?? 0) + 1
        if (count > DUO_LIMIT) fail(path, 'up to three partners per Uma')
        counts.set(id, count)
      }
      return pair
    })
    unique(game.duos.map(duoKey), path)
  }
  if (raw.gifts !== undefined) {
    game.gifts = list(raw.gifts, path, 0, 4).map(row => {
      const gift = object(row, path, ['day', 'key', 'crew'])
      const date = celebrationDate(withGame, 'cohort:50')
      if (!date || typeof gift.key !== 'string' || !parseStockKey(gift.key)) return fail(path, 'expected a festival contribution')
      return { day: int(gift.day, path, date, game.celebrations['greater-festival'] ?? today), key: gift.key,
        crew: unique(list(gift.crew, path, 0, ids.size).map(id => member(id, path, ids)), path) }
    })
    unique(game.gifts.map(gift => String(festivalGiftWindow({ ...withGame, calendar: { ...withGame.calendar, day: gift.day } }))), path)
  }
  if (raw.outings !== undefined) {
    game.outings = list(raw.outings, path, 0, 10_000).map(row => {
      const outing = object(row, path, ['who', 'day', 'kind'])
      const who = unique(list(outing.who, path, 2, 2).map(id => member(id, path, spouses)), path) as Duo
      const since = Math.max(...who.map(id => game.love[id]?.trueDay ?? today + 1))
      const kind = EVENING_KINDS.find(kind => kind === outing.kind) ?? fail(path, 'unknown evening')
      return { who, kind, day: int(outing.day, path, since, today) }
    })
    unique(game.outings.map(outing => [...outing.who, outing.kind].join(':')), path)
  }
  if (raw.pledge !== undefined) {
    const pledge = object(raw.pledge, path, ['key', 'window'])
    const key = typeof pledge.key === 'string' && parseStockKey(pledge.key) ? pledge.key : fail(path, 'expected a stock key')
    if (game.celebrations['greater-festival'] || celebrationDate(withGame, 'cohort:50') === null) fail(path, 'no preparations are open')
    game.pledge = { key, window: int(pledge.window, path, 0, festivalGiftWindow(withGame) ?? 0) }
  }
  if (raw.tradition !== undefined) {
    const at = int(raw.tradition, path, 5, 45) as Cohort
    if (!COHORTS.includes(at) || !game.celebrations[`cohort:${at}`]) fail(path, 'expected a held celebration')
    game.tradition = at
  }
  if (raw.ending !== undefined) {
    if (!game.celebrations['cohort:50']) fail(path, 'expected a held closing celebration')
    const ending = object(raw.ending, path, ['discoveries', 'milestones', 'workers'])
    game.ending = { discoveries: int(ending.discoveries, path, 0, 100_000), milestones: int(ending.milestones, path, 0, 100_000),
      workers: int(ending.workers, path, 0, ids.size) }
  }
  return game
}
