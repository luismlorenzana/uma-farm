// A run with no story pack at all: days 1 to 60 on placeholders alone. The opening plays the game's lines, and the first
// five of master data are met here, as introducing yourself in town meets each (living in town until each weds). Each
// meets you with the game's two lines and a hello, and every rung after plays the game's own card: friendship, a
// confession (one "Not yet", then Ask her), romance, the proposal with a ring, the wedding with its vows, married life at
// night and in its events, and the household's first scene at five married. Nothing waits on the story, and every save
// along the way parses. A generous player with hands to spare: each day she chats, gives a gift and tops up each bar, then
// plays whatever is Ready (each act's action is given back here: the budget isn't what this run tests). Invented master
// data (`placeholders.fixture.ts`); the night runs whole.
import { describe, expect, it } from 'vitest'
import { runNight, type NightContext } from '../night/end-day'
import { joinCast } from '../romance/meeting.fixture'
import { chatLineV4, chatV4, giftV4 } from '../romance/acts'
import { birthdaysOf } from '../romance/days'
import { askHer, askSteps, playEvent, type EventCard, type EventOutcome } from '../romance/events'
import { householdPlay, householdReady, readHousehold } from '../romance/household'
import { addLove, costOf, finishArrival, pathFlags, walkScene, WAITING_RUNGS } from '../romance/love'
import { readiness } from '../romance/ready'
import { receptionDishes } from '../romance/wedding'
import { nameFarmer } from '../romance/farmer'
import { parseSaveV5 } from '../save/parse-v4'
import { newSave, type SaveV4 } from '../save/v4'
import { addGoods } from '../save/warehouse'
import type { Step } from './authored'
import {
  chaptersOf, DEFAULT_CHAPTERS, defaultTalksOf, eventOf, favouriteOf, householdOf, openingOf, outfitOf, PLACEHOLDER_MOMENTS, PLACEHOLDER_OPENING, storyOf, talkStageOf,
  weddingPlaces,
} from './placeholders'
import { MASTER, MASTER_BIRTHDAYS } from './placeholders.fixture'
import { readScene } from './scenes'

/** The day's actions given back: this run plays the story, not the budget. */
const hands = (save: SaveV4): SaveV4 => ({ ...save, today: { ...save.today, actions: 0 } })
const AT = '2026-11-13T09:00:00.000Z'
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const STORY = storyOf(null, MASTER)
const FIVE = ['9100001', '9100002', '9100003', '9100004', '9100005']
const context: NightContext = { story: STORY, birthdays: birthdaysOf(STORY, MASTER_BIRTHDAYS) }
/** The one who says "Not yet" at her confession first. */
const SHY = '9100002'

/** Each choice's pick on a path: the first option, but "Not yet" for the shy one's confession. */
function picksFor(steps: readonly Step[], id: string, rung: string): number[] {
  const picks: number[] = []
  for (;;) {
    const path = walkScene(steps, picks)
    if (path.done) return picks
    picks.push(rung === 'confession' && id === SHY ? 1 : 0)
  }
}

describe('a farm with no story pack', () => {
  it('plays days 1 to 60 on placeholders: arrivals, events, a confession, a wedding and the household\'s first scene', async () => {
    // Day 1: the farmer's name, the opening read (the game's two lines), and master data's first five met here, as
    // introducing yourself meets each; they live in town.
    let save: SaveV4 = nameFarmer(newSave('u1', AT), 'Robin')
    expect(openingOf(STORY)).toEqual(PLACEHOLDER_OPENING.slice(0, 2))
    save = readScene(save, 'scene:1:open')
    expect(Object.keys(save.roster)).toEqual([])
    save = joinCast(save, STORY)
    expect(Object.keys(save.roster).sort()).toEqual(FIVE)
    expect(save.dorm.home).toEqual([])
    expect(FIVE.map((id) => outfitOf(STORY, id))).toEqual(['910000101', '910000201', '910000301', '910000401', '910000501'])
    expect(FIVE.map((id) => favouriteOf(STORY, id))).toEqual(['farming', 'foraging', 'fishing', 'mining', 'ranch'])
    expect(chaptersOf(STORY, SHY)).toBe(DEFAULT_CHAPTERS)

    // Each meets you: two lines and a hello, +50 and +30.
    for (const id of FIVE) {
      const event = await eventOf(STORY, id, 'arrival')
      expect(event.written).toBe(false)
      const path = walkScene(event.steps, [0])
      expect(path.done).toBe(true)
      save = finishArrival(save, id, { choice: 30, flags: pathFlags(path.steps) })
      expect(save.love[id]!.points).toBe(80)
    }

    const cards: EventCard[] = []
    const households: string[] = []
    let asked = 0
    let chats = 0
    for (let day = 1; day <= 60; day++) {
      expect(save.calendar.day).toBe(day)
      for (const id of FIVE) {
        // A chat (the default story's talk for her stage and temperament) and a gift.
        const love = save.love[id]!
        const line = chatLineV4(save, STORY, id, 'steady')
        expect(defaultTalksOf(STORY, id, talkStageOf(love), 'steady')).toContain(line)
        save = hands(save)
        if (love.stage !== 'spouse' || love.level < 5) {
          save = chatV4(save, id).save
          save = hands(save)
          chats++
          save = giftV4({ ...save, items: addGoods(save.items, 'carrot', 1, 1) }, STORY, id, 'carrot', 1).save
        }
        // After a "Not yet", ask her again: Yes this time.
        if (save.love[id]!.friend) {
          const confession = await eventOf(STORY, id, 'confession')
          expect(askSteps(confession.steps).some((s) => 'choice' in s)).toBe(true)
          save = askHer(save, id, 'yes')
          asked++
        }
        // The generous player tops up her bar; the proposal needs a ring.
        const now = save.love[id]!
        const rung = readiness(save, STORY, id).rung
        if (rung && !WAITING_RUNGS.includes(rung) && now.points < costOf(rung)) save = addLove(save, id, costOf(rung) - now.points, 'evening').save
        if (rung === 'proposal' && (save.items['ring-g1']?.[0] ?? 0) === 0) save = { ...save, items: addGoods(save.items, 'ring-g1', 1, 1) }
        const state = readiness(save, STORY, id)
        if (!state.ready || state.rung === null) continue
        // Her Ready event: always the game's card here, played to its end.
        const event = await eventOf(STORY, id, state.rung)
        expect(event.written).toBe(false)
        const outcome: EventOutcome = {
          event, picks: picksFor(event.steps, id, state.rung), plays: [],
          ...(state.rung === 'proposal' ? { ring: 'ring-g1' } : {}),
          ...(state.rung === 'wedding' ? { place: weddingPlaces(STORY, id)[0]!, reception: receptionDishes(save)[0] ?? null } : {}),
        }
        const played = playEvent(hands(save), STORY, id, outcome)
        expect(played.card.memory).toBe(PLACEHOLDER_MOMENTS[state.rung])
        save = played.save
        cards.push(played.card)
      }
      // The household's scenes, once Ready: the game's card with each spouse's line.
      for (const hid of householdReady(save)) {
        const play = householdPlay(save, householdOf(STORY), hid)!
        expect(play.parts.length).toBe(play.spouses.length + 2)
        expect(play.parts.every((p) => p.steps.length > 0)).toBe(true)
        save = readHousehold(save, hid)
        households.push(hid)
      }
      save = runNight({ ...save, summary: null }, context)
      expect(parseSaveV5(json(save))).toEqual(save)
    }

    // Every rung of every Uma played on placeholders, Spouse 2 and 4 at night; all five married by day 60.
    expect(save.calendar.day).toBe(61)
    expect(FIVE.map((id) => save.love[id]!.stage)).toEqual(['spouse', 'spouse', 'spouse', 'spouse', 'spouse'])
    expect(FIVE.map((id) => save.memories[id]!.length)).toEqual([26, 26, 26, 26, 26])
    expect(cards.filter((c) => c.rung === 'confession').map((c) => c.answer)).toEqual(['yes', 'not-yet', 'yes', 'yes', 'yes'])
    expect(asked).toBe(1)
    expect(cards.filter((c) => c.stage === 'romance')).toHaveLength(4)
    expect(cards.filter((c) => c.stage === 'married').map((c) => c.wedding!.place)).toEqual(FIVE.map(() => 'chapel-bell'))
    // A placeholder pays as written: +50, the warmer reply +30, and with no play its Perfect +30.
    const f1 = cards.find((c) => c.id === '9100001' && c.rung === 'f1')!
    expect([f1.event, f1.choices, f1.chosen]).toEqual([50, [30], { grade: 'perfect', points: 30 }])
    expect(save.homestead.married).toBe(5)
    expect(households).toEqual(['household:5'])
    expect(save.diary.read).toContain('household:5')
    expect(chats).toBeGreaterThan(100)
  })
})
