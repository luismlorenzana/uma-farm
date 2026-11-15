// The Cooking Contest: the score and the rivals at Farm Rank 3 and 10 (ties to you), each place's gold in year 1 and 2
// and its Farm Rank points, the entry (its three actions, the festival's first; one a Contest; none without the Kitchen;
// its refusals), a story that moves the Contest, the play's end and its judging, the cook's Legend on a 1st, a dish left
// unfinished judged as Rough at the next open and at the night, the Farm Rank's festival points, the save grown in place,
// and the stove's bots' places. Invented ids; no story pack but the stand-in's world for a moved Contest.
import { describe, expect, it } from 'vitest'
import { actionsLeft, eventActionsLeft, GAME_DAYS, type SpecialDays } from '../farm/actions'
import { dateOf, FESTIVALS } from '../farm/calendar'
import { farmPointsOf } from '../farm/diary'
import { farmRankOf } from '../farm/farm'
import { handDay } from '../farm/farmhands'
import { challengeFor } from '../farm/rank-rules'
import { runNight } from '../night/end-day'
import { parseSaveV5 } from '../save/parse-v4'
import { newLove, newRosterUma, newSave, type SaveV4 } from '../save/v4'
import { CAST } from '../story/cast'
import { CONTEST_SCENE_LINES, contestBeats } from '../story/contest'
import { festivalsOf } from '../story/placeholders'
import { storyPackFrom } from '../story/pack'
import { STAND_IN_FILES } from '../story/stand-in'
import {
  boardRows, CONTEST_ACTIONS, CONTEST_RECORD, contestBlock, contestBoard, contestDefault, contestEntered, contestOn, contestPlace, contestPrize, contestResult, contestScore,
  RIVALS, rivalScore, type ContestEntry,
} from './contest'
import { enterContest, finishPlay, settleUnfinished, startKitchenPlay } from './kitchen'
import { playStove, PLAY_TIERS, stoveScore, tierOf } from './stove'
import { botTaps } from './stove-bots'

const AT = '2026-11-15T10:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const row = (n: number, stars = 1): [number, number, number, number, number] => [0, 1, 2, 3, 4].map((s) => (s === stars - 1 ? n : 0)) as [number, number, number, number, number]
/** Autumn 10: the game's Contest, year 1 and year 2. */
const CONTEST_DAY = 34
const CONTEST_DAY_2 = 82
const HAND = '101'
const SEEDS = [1234, 2345, 3456, 4567, 5678, 6789, 7890, 8901]
/** The points at a Farm Rank's threshold. */
const POINTS = [0, 150, 250, 950, 2150, 3750, 6250, 9750, 14750, 21750]

/** A named farm on the Contest's day, its Kitchen standing at Farm Rank `rank`, with Carrot ★`stars` and Basil ★`stars`. */
function farm(rank = 3, stars = 1, day = CONTEST_DAY, kitchen = true): SaveV4 {
  const save = newSave('contest', AT)
  return {
    ...save, farmer: { name: 'Robin' }, gold: 500, calendar: { day }, items: { ...save.items, carrot: row(6, stars), basil: row(3, stars) },
    buildings: kitchen ? { ...save.buildings, kitchen: 1 } : save.buildings, farm: { ...save.farm, points: POINTS[rank - 1]! },
  }
}
/** A friend from town invited to work on day 1. */
const withHand = (save: SaveV4, id = HAND): SaveV4 => ({ ...save, roster: { ...save.roster, [id]: { ...newRosterUma(1), farmhand: 1 } }, love: { ...save.love, [id]: newLove() } })
const salad = (stars = 1, cook: string | null = null): ContestEntry => ({ dish: 'dish-vegetables-1', main: `carrot@${stars}`, side: `basil@${stars}`, cook })
/** Enters and plays it with a bot's taps (null: left unfinished, judged Rough). */
function play(save: SaveV4, entry: ContestEntry, bot: 'careful' | 'casual' | null, days: SpecialDays = GAME_DAYS) {
  const started = enterContest(save, entry, days)
  const at = started.workshops.current!
  return finishPlay(started, bot ? botTaps(at.seed, at.length * 1000, bot) : null)
}

describe('the score, the rivals and the places', () => {
  it('scores 10 × the dish\'s ★ + 0.5 × the play\'s score, rounded half up, 0–100', () => {
    expect(contestScore(2, 76)).toBe(58)
    expect(contestScore(1, 75)).toBe(48) // 47.5, half up
    expect(contestScore(5, 100)).toBe(100)
    expect(contestScore(1, 0)).toBe(10)
    expect(contestScore(0, 0)).toBe(0)
  })

  it('puts the orchard at 40 + 6 × the Farm Rank and the ranch at 26 + 7 ×, held to 96: 58 and 47 at Farm Rank 3, 96 and 96 at 10', () => {
    const [orchard, ranch] = RIVALS
    expect([orchard!.id, ranch!.id]).toEqual(['wren-ashby', 'cole-varga'])
    expect([rivalScore(orchard!, 3), rivalScore(ranch!, 3)]).toEqual([58, 47])
    expect([rivalScore(orchard!, 10), rivalScore(ranch!, 10)]).toEqual([96, 96])
    expect(Array.from({ length: 10 }, (_, i) => rivalScore(orchard!, i + 1))).toEqual([46, 52, 58, 64, 70, 76, 82, 88, 94, 96])
    expect(Array.from({ length: 10 }, (_, i) => rivalScore(ranch!, i + 1))).toEqual([33, 40, 47, 54, 61, 68, 75, 82, 89, 96])
  })

  it('gives ties to you: a ★2 dish and a play of 76 (58) is 1st at Farm Rank 3; 96 is 1st at Farm Rank 10', () => {
    expect(contestBoard(farm(3), CONTEST_DAY, 58).place).toBe(1)
    expect(contestBoard(farm(3), CONTEST_DAY, 57).place).toBe(2)
    expect(contestBoard(farm(3), CONTEST_DAY, 47).place).toBe(2)
    expect(contestBoard(farm(3), CONTEST_DAY, 46).place).toBe(3)
    expect(contestBoard(farm(10), CONTEST_DAY, 96).place).toBe(1)
    expect(contestBoard(farm(10), CONTEST_DAY, 95).place).toBe(3)
    expect(contestPlace(50, [50, 50])).toBe(1)
    // The board, the best first; you ahead on a tie, the orchard before the ranch on theirs.
    expect(boardRows(contestBoard(farm(10), CONTEST_DAY, 96))).toEqual([
      { who: 'you', farm: null, score: 96 }, { who: 'wren-ashby', farm: 'the orchard', score: 96 }, { who: 'cole-varga', farm: 'the ranch', score: 96 },
    ])
    expect(boardRows(contestBoard(farm(3), CONTEST_DAY, 50)).map((r) => r.who)).toEqual(['wren-ashby', 'you', 'cole-varga'])
  })

  it('pays each place at once: 1,800g, 900g and 360g in year 1; 3,600g, 1,800g and 720g in year 2; 150, 75 and 25 Farm Rank points', () => {
    expect(([1, 2, 3] as const).map((p) => contestPrize(CONTEST_DAY, p))).toEqual([1800, 900, 360])
    expect(([1, 2, 3] as const).map((p) => contestPrize(CONTEST_DAY_2, p))).toEqual([3600, 1800, 720])
    // The season's number: a Contest the story moves to Spring 5 pays 600g × 1 × the year.
    expect(contestPrize(5, 1)).toBe(600)
    expect([80, 50, 20].map((s) => contestBoard(farm(3), CONTEST_DAY, s)).map((b) => [b.place, b.gold, b.points])).toEqual([[1, 1800, 150], [2, 900, 75], [3, 360, 25]])
  })
})

describe('the entry', () => {
  it('is on the Contest\'s day only, and needs the Kitchen built: "Build the Kitchen to enter."', () => {
    expect(contestOn(CONTEST_DAY, FESTIVALS)?.name).toBe('Cooking Contest')
    expect(contestOn(CONTEST_DAY - 1, FESTIVALS)).toBeNull()
    expect(contestBlock(farm(3, 1, CONTEST_DAY - 1), GAME_DAYS, salad())).toBe('No contest today.')
    const none = farm(3, 1, CONTEST_DAY, false)
    expect(contestBlock(none, GAME_DAYS, salad())).toBe('Build the Kitchen to enter.')
    expect(() => enterContest(none, salad(), GAME_DAYS)).toThrow('Build the Kitchen to enter.')
    expect(() => enterContest(farm(3, 1, CONTEST_DAY - 1), salad(), GAME_DAYS)).toThrow('No contest today.')
  })

  it('spends three actions, the festival day\'s event actions first, takes two of its main and one side, and puts its dish on the stove for 60 s', () => {
    const save = farm()
    expect(eventActionsLeft(save, GAME_DAYS)).toBe(3)
    const started = enterContest(save, salad(), GAME_DAYS)
    expect(CONTEST_ACTIONS).toBe(3)
    expect([eventActionsLeft(started, GAME_DAYS), actionsLeft(started)]).toEqual([0, 10])
    expect(started.items.carrot).toEqual(row(4))
    expect(started.items.basil).toEqual(row(2))
    expect(started.workshops.current).toMatchObject({ play: 'contest', day: CONTEST_DAY, length: 60, menu: [{ dish: 'dish-vegetables-1', count: 1, main: 'carrot@1', side: 'basil@1' }] })
    expect(started.farm.counts.plays).toBe(1)
    // With two event actions spent on her events, the third comes from the day's own.
    const two = { ...save, today: { ...save.today, eventActions: 2 } }
    expect(actionsLeft(enterContest(two, salad(), GAME_DAYS))).toBe(8)
    // Short of three in all.
    const short = { ...save, today: { ...save.today, eventActions: 3, actions: 8 } }
    expect(contestBlock(short, GAME_DAYS, salad())).toBe('Entering takes 3 actions.')
    expect(() => enterContest(short, salad(), GAME_DAYS)).toThrow('Entering takes 3 actions.')
  })

  it('takes one entry a Contest: refused while its dish is on the stove and once judged', () => {
    const started = enterContest(farm(), salad(), GAME_DAYS)
    expect(contestEntered(started)).toBe(true)
    expect(contestBlock(started, GAME_DAYS, salad())).toBe('One entry a Contest.')
    const judged = finishPlay(started, null).save
    expect(contestBlock(judged, GAME_DAYS, salad())).toBe('One entry a Contest.')
    expect(() => enterContest(judged, salad(), GAME_DAYS)).toThrow('One entry a Contest.')
    // Another play under way blocks it too.
    const stocked = { ...farm(), items: { carrot: row(18), basil: row(9) } }
    const kitchen = startKitchenPlay(stocked, [{ dish: 'dish-vegetables-1', count: 6, main: 'carrot@1', side: 'basil@1' }])
    expect(contestBlock(kitchen, GAME_DAYS, salad())).toBe('A play is under way.')
  })

  it('refuses an unknown recipe, a wrong ingredient and one short, and a cook who isn\'t a farmhand or has no action left', () => {
    const save = farm()
    expect(contestBlock(save, GAME_DAYS, { ...salad(), dish: 'dish-fish-5' })).toBe('You don’t know that recipe.')
    expect(contestBlock(save, GAME_DAYS, { ...salad(), main: 'basil@1' })).toBe('That isn’t a main for Carrot Salad.')
    expect(contestBlock(save, GAME_DAYS, { ...salad(), side: 'carrot@1' })).toBe('That isn’t a side for Carrot Salad.')
    expect(contestBlock({ ...save, items: { ...save.items, carrot: row(1) } }, GAME_DAYS, salad())).toBe('Short 1 Carrot.')
    expect(contestBlock(save, GAME_DAYS, salad(1, HAND))).toBe('Only a farmhand cooks for you.')
    const hand = withHand(save)
    expect(contestBlock(hand, GAME_DAYS, salad(1, HAND))).toBeNull()
    // At half pace (from the second short night) she has one action of her three, and today it's the Kitchen's play's.
    const busy = { ...hand, farm: { ...hand.farm, owed: 10, short: 2 }, today: { ...hand.today, assistant: HAND } }
    const tired = { ...busy, roster: { ...busy.roster, [HAND]: { ...busy.roster[HAND]!, farmhand: CONTEST_DAY } } }
    expect(handDay(tired, HAND)).toMatchObject({ actions: 1, kitchen: 1 })
    expect(contestBlock(tired, GAME_DAYS, salad(1, HAND))).toBe('She has no action left tonight.')
    // The Kitchen's assistant with an action left can cook too: one each.
    expect(contestBlock({ ...hand, today: { ...hand.today, assistant: HAND } }, GAME_DAYS, salad(1, HAND))).toBeNull()
  })

  it('starts from the known recipe that makes the most stars, its best main and side', () => {
    const save = { ...farm(), items: { ...farm().items, carp: row(2, 3), mint: row(1, 2) } }
    expect(contestDefault(save)).toEqual({ dish: 'dish-fish-1', main: 'carp@3', side: 'mint@2', cook: null })
    expect(contestDefault(farm())).toEqual({ dish: 'dish-vegetables-1', main: 'carrot@1', side: 'basil@1', cook: null })
    const bare = { ...farm(), items: {} }
    expect(contestDefault(bare)).toEqual({ dish: 'dish-vegetables-1', main: '', side: '', cook: null })
    expect(contestBlock(bare, GAME_DAYS, contestDefault(bare))).toBe('That isn’t a main for Carrot Salad.')
  })

  it('plays a Contest the story moves on its new day, and none on its old one', () => {
    const pack = storyPackFrom({ ...STAND_IN_FILES, world: { festivals: [{ id: 'cooking-contest', name: 'The Harvest Kitchen', season: 'summer', day: 6 }] } })
    const year = festivalsOf(pack)
    const days: SpecialDays = { festivals: year, birthdays: new Map() }
    const moved = 18 // Summer 6
    expect(contestOn(moved, year)?.name).toBe('The Harvest Kitchen')
    expect(contestOn(CONTEST_DAY, year)).toBeNull()
    expect(contestBlock(farm(3, 1, CONTEST_DAY), days, salad())).toBe('No contest today.')
    const save = farm(3, 1, moved)
    expect(eventActionsLeft(save, days)).toBe(3)
    const done = play(save, salad(), 'careful', days)
    expect(done.save.farm.festivals).toEqual([{ id: 'cooking-contest', day: moved, score: 80, place: 1 }])
    // Summer is the second season: 600g × 2 × year 1.
    expect(done.result.contest!.gold).toBe(1200)
  })
})

describe('the play and the judging', () => {
  it('makes one dish at the Kitchen\'s stars, judges it against the rivals, pays at once and keeps the result and the best score', () => {
    const save = farm(3)
    const done = play(save, salad(), 'careful')
    // A careful play: 100, Masterwork, ★1 goods + 2 = ★3; 30 + 50 = 80, 1st.
    expect(done.result).toMatchObject({ play: 'contest', score: 100, grade: 'masterwork', stopped: false, dishes: [{ dish: 'dish-vegetables-1', stars: 3, count: 1 }] })
    expect(done.result.contest).toEqual({ score: 80, place: 1, rivals: [{ id: 'wren-ashby', farm: 'the orchard', score: 58 }, { id: 'cole-varga', farm: 'the ranch', score: 47 }], gold: 1800, points: 150 })
    expect(done.save.items['dish-vegetables-1']).toEqual(row(1, 3))
    expect(done.save.gold).toBe(500 + 1800)
    expect(done.save.farm.festivals).toEqual([{ id: 'cooking-contest', day: CONTEST_DAY, score: 80, place: 1 }])
    expect(done.save.diary.records[CONTEST_RECORD]).toBe(80)
    expect(done.save.farm.counts['cooked:dish-vegetables-1']).toBe(1)
    expect(done.save.workshops.current).toBeNull()
    expect(contestResult(done.save)).toEqual({ id: 'cooking-contest', day: CONTEST_DAY, score: 80, place: 1 })
    // The record keeps the best: a lower score the next year leaves it.
    const next = { ...done.save, calendar: { day: CONTEST_DAY_2 }, items: { ...done.save.items, carrot: row(6), basil: row(3) } }
    const again = finishPlay(enterContest(next, salad(), GAME_DAYS), null).save
    expect(again.diary.records[CONTEST_RECORD]).toBe(80)
    expect(again.farm.festivals.map((r) => r.place)).toEqual([1, 3])
  })

  it('adds a festival\'s points to the Farm Rank at night: 150 for 1st, 75 for 2nd, 25 for 3rd', () => {
    const done = play(farm(3), salad(), 'careful').save
    // The day keeps last night's rank: the points come tonight.
    expect(done.farm.points).toBe(250)
    expect(farmPointsOf(done).festivals).toBe(150)
    const morning = runNight(done, {})
    expect(morning.farm.points).toBe(farmPointsOf(morning).total)
    expect(farmPointsOf(morning).festivals).toBe(150)
    const third = { ...done, farm: { ...done.farm, festivals: [{ id: 'cooking-contest', day: CONTEST_DAY, score: 20, place: 3 as const }, { id: 'cooking-contest', day: CONTEST_DAY_2, score: 50, place: 2 as const }] } }
    expect(farmPointsOf(third).festivals).toBe(100)
  })

  it('counts the cook\'s Legend on a 1st: `won` toward her cooking Legend, a point of Cooking practice, her action tonight, and +50 together', () => {
    const save = withHand(farm(3))
    const master = { ...save, roster: { ...save.roster, [HAND]: { ...save.roster[HAND]!, ranks: { ...save.roster[HAND]!.ranks, cooking: { rank: 4 as const, points: 0, challenge: 0 } } } } }
    expect(challengeFor('cooking', 4)!.what).toBe('1st at a Cooking Contest as the cook')
    const started = enterContest(master, salad(1, HAND), GAME_DAYS)
    expect(started.today.cook).toBe(HAND)
    expect(started.workshops.current!.assistant).toBe(HAND)
    expect(handDay(started, HAND)!.kitchen).toBe(1)
    const at = started.workshops.current!
    const done = finishPlay(started, botTaps(at.seed, at.length * 1000, 'careful')).save
    expect(done.roster[HAND]!.ranks.cooking.challenge).toBe(1)
    expect(done.roster[HAND]!.practice?.cook).toBe(1)
    expect(done.love[HAND]!.points).toBe(50)
    expect(done.love[HAND]!.festivals).toEqual([`cooking-contest:${dateOf(CONTEST_DAY).year}`])
    // A 2nd (at Farm Rank 7: the orchard 82, the ranch 75) counts nothing toward it.
    const second = { ...master, farm: { ...master.farm, points: POINTS[6]! } }
    const lost = play(second, salad(1, HAND), 'careful').save
    expect(lost.farm.festivals[0]!.place).toBe(2)
    expect(lost.roster[HAND]!.ranks.cooking.challenge).toBe(0)
    // Tonight one of her actions was the Contest's, at the Kitchen.
    const morning = runNight(done, {})
    expect(morning.summary!.work.find((l) => l.kind === 'farmhand' && l.id === HAND)).toMatchObject({ kitchen: 1 })
  })

  it('judges a dish left unfinished as Rough: at the next open, and at the night\'s start', () => {
    const started = enterContest(farm(3), salad(), GAME_DAYS)
    // The next open: Rough, its play's score 0: a ★1 dish, 10, 3rd.
    const opened = settleUnfinished(started)
    expect(opened.workshops.current).toBeNull()
    expect(opened.farm.festivals).toEqual([{ id: 'cooking-contest', day: CONTEST_DAY, score: 10, place: 3 }])
    expect(opened.gold).toBe(500 + 360)
    expect(opened.items['dish-vegetables-1']).toEqual(row(1))
    // The night: judged first, on the Contest's day, before the date turns.
    const morning = runNight(started, {})
    expect(morning.farm.festivals).toEqual([{ id: 'cooking-contest', day: CONTEST_DAY, score: 10, place: 3 }])
    expect(morning.gold).toBeGreaterThanOrEqual(500 + 360 - 100)
    expect(farmPointsOf(morning).festivals).toBe(25)
  })

  it('places the stove\'s bots: at Farm Rank 3 the careful 1st from ★1 goods, the casual 3rd; at Farm Rank 10 the careful 1st only from ★3 goods, the casual 3rd', () => {
    const places = (bot: 'careful' | 'casual', rank: number, stars: number) => SEEDS.map((seed) => {
      const score = stoveScore(playStove(seed, 60_000, botTaps(seed, 60_000, bot)))
      const dish = Math.min(5, stars + tierOf(score).lift)
      return contestPlace(contestScore(dish, score), RIVALS.map((r) => rivalScore(r, rank)))
    })
    const all = (n: number) => SEEDS.map(() => n)
    expect(places('careful', 3, 1)).toEqual(all(1))
    expect(places('casual', 3, 1)).toEqual(all(3))
    expect(places('casual', 3, 2).filter((p) => p === 2).length).toBe(5)
    expect(places('casual', 3, 3).filter((p) => p === 1).length).toBe(5)
    expect(places('careful', 3, 2)).toEqual(all(1))
    expect(places('careful', 10, 1)).toEqual(all(3))
    expect(places('careful', 10, 2)).toEqual(all(3))
    expect(places('careful', 10, 3)).toEqual(all(1))
    expect(places('casual', 10, 3)).toEqual(all(3))
    expect(farmRankOf(POINTS[9]!)).toBe(10)
    expect(PLAY_TIERS.map((t) => t.lift)).toEqual([0, 0, 1, 2])
  })
})

describe('the judging\'s lines', () => {
  it('has the town\'s cook taste and speak by your place, with no names in them', () => {
    expect(CAST['rosa-bell'].is).toBe('Judges the Cooking Contest')
    for (const place of [1, 2, 3] as const) {
      const beats = contestBeats(place)
      expect(beats.length).toBeGreaterThanOrEqual(5)
      expect(beats.filter((b) => b.speaker.kind === 'cast').every((b) => b.speaker.kind === 'cast' && b.speaker.id === 'rosa-bell')).toBe(true)
    }
    expect(contestBeats(1).some((b) => b.line.includes('First place'))).toBe(true)
    expect(contestBeats(2).some((b) => b.line.includes('Second place'))).toBe(true)
    expect(contestBeats(3).some((b) => b.line.includes('Third place'))).toBe(true)
    expect(CONTEST_SCENE_LINES.title).toBe('The judging')
  })
})

describe('the save', () => {
  it('round-trips the Contest\'s dish under way and its cook, refuses a Contest of more than one dish, and reads an older save as before', () => {
    const started = enterContest(withHand(farm()), salad(1, HAND), GAME_DAYS)
    expect(parseSaveV5(json(started))).toEqual(started)
    const two = json({ ...started, workshops: { ...started.workshops, current: { ...started.workshops.current!, menu: [{ ...started.workshops.current!.menu![0]!, count: 2 }] } } })
    expect(() => parseSaveV5(two)).toThrow('one dish')
    const ghost = json({ ...started, today: { ...started.today, cook: '999' } })
    expect(() => parseSaveV5(ghost)).toThrow('cook')
    const judged = finishPlay(started, null).save
    expect(parseSaveV5(json(judged))).toEqual(judged)
    const older = farm()
    expect(parseSaveV5(json(older)).today.cook).toBeUndefined()
    expect(parseSaveV5(json(older))).toEqual(older)
    // The night clears today's cook with the day; nothing here stamps.
    expect(runNight(started, {}).today.cook).toBeUndefined()
    expect(judged.account.updatedAt).toBe(older.account.updatedAt)
  })
})
