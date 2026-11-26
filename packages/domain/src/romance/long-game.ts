import { formalLooks } from '../forge/state'
import { actionsLeft } from '../farm/actions'
import { awayForNight } from '../expeditions/presence'
import { dateDayOf, dateOf, yearsSince } from '../farm/calendar'
import { availableDishes } from '../expeditions/stock'
import { SaveRuleError } from '../save/rules'
import {
  CELEBRATIONS, COHORTS, DUO_LIMIT, ENDING_SPOUSES, FARM_YEAR, NIGHT_VISITS, TRUE_LOVE,
  celebrationDate, duoKey, duoNightSceneId, DUO_NIGHT_SEQUENCES, festivalGiftWindow, isDuoNightVariant, unlockedLooks, visitLookKind, visitMemoryKey, visitPortraitKey, type Celebration, type Cohort, type Duo, type GreaterLove, type VisitKind, type Visit,
} from '../save/long-game'
import { isDishId, vowsOn, type SaveV4 } from '../save/v4'
import { parseStockKey, takeGoods } from '../save/warehouse'
import type { StoryPack } from '../story/pack'
import { defaultNightScript, NIGHT_BEATS, nightBeatFace, type NightScript, type Step } from '../story/authored'
import { chooseCompanion } from './loop'
import { isBirthday, NO_BIRTHDAYS, type Birthdays } from './days'

type WeddingSave = Pick<SaveV4, 'love' | 'roster'> & Partial<Pick<SaveV4, 'longGame'>>
type LifePack = Pick<StoryPack, 'cast' | 'bibles'> & Partial<Pick<StoryPack, 'town' | 'household'>>
type CalendarSave = Pick<SaveV4, 'calendar' | 'love'> & Partial<Pick<SaveV4, 'longGame'>>
const titles = ['Welcome to the Homestead', 'Supper for Ten', 'At the Hearth', 'The Great Harvest', 'Market Evening',
  'Lanterns at the Dock', 'A Garden Walk', 'A Homecoming', 'Setting the Tables', 'The Fiftieth Wedding'] as const

export function celebrationTitle(id: Celebration): string {
  return id === 'greater-festival' ? 'Greater Festival' : titles[COHORTS.indexOf(Number(id.slice(7)) as Cohort)]!
}

export function weddingOrder(save: WeddingSave): string[] {
  const known = save.longGame?.weddings ?? []
  const added = Object.keys(save.love).filter(id => save.love[id]?.stage === 'spouse' && !known.includes(id))
    .sort((a, b) => (save.love[a]!.wed! - save.love[b]!.wed!) || (save.roster[a]!.joined - save.roster[b]!.joined) || a.localeCompare(b, 'en', { numeric: true }))
  return added.length ? [...known, ...added] : known
}

export const longGameEnabled = (save: Pick<SaveV4, 'longGame'>, pack?: Partial<Pick<StoryPack, 'town'>> | null): boolean =>
  !!(save.longGame || pack?.town?.professions?.length)

export function activateLongGame(save: SaveV4, pack?: Partial<Pick<StoryPack, 'town'>> | null): SaveV4 {
  if (!longGameEnabled(save, pack)) return save
  const weddings = weddingOrder(save)
  if (!weddings.length || save.longGame?.weddings === weddings) return save
  return { ...save, longGame: { celebrations: {}, love: {}, ...save.longGame, weddings } }
}

export const softEndingReached = (save: Pick<SaveV4, 'longGame'>): boolean => save.longGame?.celebrations['cohort:50'] !== undefined

export function celebrationGuests(save: Pick<SaveV4, 'longGame'>, id: Celebration): string[] {
  const count = id === 'greater-festival' ? ENDING_SPOUSES : Number(id.slice(7))
  return save.longGame?.weddings.slice(id === 'greater-festival' ? 0 : count - 5, count) ?? []
}

export function celebrationReached(save: CalendarSave, id: Celebration): boolean {
  const date = celebrationDate(save, id)
  return date !== null && date <= save.calendar.day
}

export const unreadCelebrations = (save: CalendarSave): Celebration[] =>
  CELEBRATIONS.filter(id => celebrationReached(save, id) && save.longGame?.celebrations[id] === undefined)

export function householdVows(save: CalendarSave & Partial<Pick<SaveV4, 'homestead'>>): boolean {
  if (!save.longGame) return !!save.homestead && vowsOn(save.homestead, save.calendar.day, save.calendar)
  const celebrated = save.longGame.celebrations['greater-festival']
  if (!celebrated) return !!save.homestead && vowsOn(save.homestead, save.calendar.day, save.calendar)
  const due = celebrationDate(save, 'greater-festival')
  return due !== null && save.calendar.day > celebrated && (dateDayOf(save.calendar.day, save.calendar) - dateDayOf(due, save.calendar)) % FARM_YEAR === 0
}

export const preparingFestival = (save: CalendarSave): boolean =>
  celebrationReached(save, 'cohort:50') && save.longGame?.celebrations['greater-festival'] === undefined

export function giveFestivalGift(save: SaveV4, key: string, providers: readonly string[] = []): SaveV4 {
  const window = festivalGiftWindow(save)
  const gifts = save.longGame?.gifts ?? []
  if (!save.longGame || !preparingFestival(save) || window === null || gifts.some(gift => festivalGiftWindow({ ...save, calendar: { ...save.calendar, day: gift.day } }) === window)) {
    throw new SaveRuleError('not-ready', 'This contribution is already covered.')
  }
  const stock = parseStockKey(key)
  if (!stock || (isDishId(stock.id) && availableDishes(save, key) < 1)) throw new SaveRuleError('no-items', 'That item isn’t available.')
  const items = takeGoods(save.items, stock.id, stock.stars, 1)
  const { pledge: _, ...game } = save.longGame
  const crew = [...new Set(providers)].filter(id => save.roster[id])
  return { ...save, items, longGame: { ...game, gifts: [...gifts, { day: save.calendar.day, key, crew }] } }
}

export function pledgeFestivalGift(save: SaveV4, key: string | null): SaveV4 {
  const window = festivalGiftWindow(save)
  if (!save.longGame || !preparingFestival(save) || window === null) throw new SaveRuleError('not-ready', 'The festival is still ahead.')
  const { pledge: _, ...game } = save.longGame
  if (key === null) return { ...save, longGame: game }
  if (!parseStockKey(key) || game.gifts?.some(gift => festivalGiftWindow({ ...save, calendar: { ...save.calendar, day: gift.day } }) === window)) {
    throw new SaveRuleError('not-ready', 'Choose an item for this contribution.')
  }
  return { ...save, longGame: { ...game, pledge: { window, key } } }
}

export function collectFestivalGift(save: SaveV4, made: readonly { outfitId: string; items: string[] }[], returned: NonNullable<SaveV4['expeditionLog']>): SaveV4 {
  const pledge = save.longGame?.pledge
  if (!pledge || !preparingFestival(save)) return save
  if (pledge.window !== festivalGiftWindow(save)) return pledgeFestivalGift(save, null)
  const worker = made.find(row => row.items.includes(pledge.key))?.outfitId
  const crew = worker ? [worker] : returned.find(trip => (trip.loot[pledge.key] ?? 0) > 0)?.party ?? []
  const stock = parseStockKey(pledge.key)
  if (!crew.length || !stock || !(save.items[stock.id]?.[stock.stars - 1]) || (isDishId(stock.id) && availableDishes(save, pledge.key) < 1)) return save
  return giveFestivalGift(save, pledge.key, crew)
}

export function chooseTradition(save: SaveV4, at: Cohort): SaveV4 {
  if (!save.longGame || !preparingFestival(save) || at >= ENDING_SPOUSES || !save.longGame.celebrations[`cohort:${at}`]) {
    throw new SaveRuleError('not-ready', 'Choose a celebration you’ve held.')
  }
  return { ...save, longGame: { ...save.longGame, tradition: at } }
}

export const greaterLoveOf = (save: Pick<SaveV4, 'longGame'>, id: string): GreaterLove =>
  save.longGame?.love[id] ?? { points: 0, pajamas: 0, anniversaries: 0, memories: [] }

export const nightVisits = (save: CalendarSave): Visit[] =>
  save.longGame?.night?.day === save.calendar.day ? save.longGame.night.visits : []

export function nightAvailable(save: SaveV4, pack: LifePack, id: string): boolean {
  const love = save.love[id]
  return !!(save.roster[id] && love?.stage === 'spouse' && love.house !== undefined
    && !awayForNight(save, id, save.calendar.day) && longGameEnabled(save, pack))
}

export const anniversaryOffer = (save: CalendarSave, id: string): number | null => {
  const wed = save.love[id]?.wed
  if (!wed) return null
  const year = yearsSince(wed, save.calendar.day, save.calendar)
  return year > (greaterLoveOf(save, id).anniversary ?? 0) ? year : null
}

export function birthdayOffer(save: CalendarSave, id: string, birthdays: Birthdays): number | null {
  const day = save.calendar.day
  const year = dateOf(day, save.calendar).year
  return save.love[id]?.stage === 'spouse' && isBirthday(birthdays, id, day, save.calendar) && (greaterLoveOf(save, id).birthday ?? 0) < year ? year : null
}

export function configuredDuos(save: Pick<SaveV4, 'longGame'>, pack: Pick<LifePack, 'cast' | 'household'>): Duo[] {
  const inCast = new Set(pack.cast.umas.map(uma => uma.characterId))
  return (save.longGame?.duos ?? pack.household?.duos ?? []).filter(duo => duo.every(id => inCast.has(id)))
}

export const duoReady = (save: Pick<SaveV4, 'longGame'>, duo: Duo): boolean =>
  duo.every(id => greaterLoveOf(save, id).points === TRUE_LOVE)

export function useStoryDuos(save: SaveV4): SaveV4 {
  if (save.longGame?.duos === undefined) return save
  const { duos: _, ...longGame } = save.longGame
  return { ...save, longGame }
}

export function editDuo(save: SaveV4, pack: LifePack, duo: Duo, remove: boolean): SaveV4 {
  const next = activateLongGame(save, pack)
  const valid = new Set(pack.cast.umas.map(uma => uma.characterId))
  if (!next.longGame || duo[0] === duo[1] || duo.some(id => !valid.has(id))) throw new SaveRuleError('bad-job', 'Choose two different Umas.')
  const key = duoKey(duo)
  const before = next.longGame.duos ?? pack.household?.duos ?? []
  const duos = before.filter(other => duoKey(other) !== key)
  if (!remove) {
    if (duos.length !== before.length || duo.some(id => duos.filter(pair => pair.includes(id)).length >= DUO_LIMIT)) {
      throw new SaveRuleError('bad-count', 'A pair can be listed once, with three partners per Uma.')
    }
    duos.push(duoKey(duo).split(':') as Duo)
  }
  return { ...next, longGame: { ...next.longGame, duos } }
}

export function visitScript(pack: LifePack, visit: Visit, index: number): NightScript {
  const id = visit.who[index]!
  const kind = index === 0 ? visit.kind : 'pajamas'
  const base = pack.bibles.get(id)?.marriedLife?.[kind]?.[visit.looks[index]!]
  const duo = visit.kind === 'pajamas' && visit.who.length === 2 ? pack.household?.duoLines?.[duoKey(visit.who)]?.[id] : undefined
  return { ...base, ...duo, ...(base?.emotes || duo?.emotes ? { emotes: { ...base?.emotes, ...duo?.emotes } } : {}) }
}

/** The game and the authoring preview play these beats in the same speaker order. */
export function visitBeats(pack: LifePack, visit: Visit, morning = false) {
  const speakers = visit.who.map((id, i) => ({ id, script: visitScript(pack, visit, i),
    kind: i === 0 ? visit.kind : 'pajamas' as const, wardrobe: visitLookKind(visit, i), slot: visit.looks[i]! }))
  const beats = morning ? ['morning'] as const : NIGHT_BEATS.slice(0, -1)
  return beats.flatMap((beat, phase) => speakers.map(({ id, script, kind, wardrobe, slot }, i) => {
    const steps: Step[] = []
    const authored = phase === 0 ? script.illustration : undefined
    // Each speaker's recorded look drives both live scenes and replays. A missing cue keeps her portrait on stage.
    const wardrobeArt = script.outfit || visit.duoArt ? undefined : wardrobe === 'pajamas' && beat === 'sitting' ? `night-pajamas-${slot}-couch`
      : beat === 'bedside' ? `night-${wardrobe}-${slot}-bed` : undefined
    const partner = visit.kind === 'pajamas' ? visit.who[i === 0 ? 1 : 0] : undefined
    const pose = beat === 'sitting' && visit.duoCouch ? 'couch'
      : beat === 'bedside' && visit.duoArt ? DUO_NIGHT_SEQUENCES[visit.duoArt][i === 0 ? 0 : 1] : undefined
    const shared = partner && pose ? duoNightSceneId(partner, pose) : undefined
    const illustration = shared ?? authored ?? wardrobeArt
    if (illustration) steps.push({ illustration })
    if (beat === 'bedside' && i === 0) steps.push({ narrate: partner ? 'The three of you settle in together as the house grows quiet.' : 'You sit by the bedside as the house grows quiet.' })
    steps.push({ say: id, line: script[beat] ?? defaultNightScript(kind)[beat], emote: script.emotes?.[beat] ?? nightBeatFace(kind, beat) })
    return { id, beat, steps, outfit: script.outfit ?? (wardrobe === 'anniversary' ? 'wedding-night' as const : 'pajamas' as const),
      portrait: script.outfit ? undefined : visitPortraitKey(wardrobe, slot) }
  }))
}

export function partnerLock(save: SaveV4, pack: LifePack, duo: Duo, birthdayAlone: (id: string) => boolean): string | null {
  if (duo.some(id => save.love[id]?.stage !== 'spouse')) return 'Both Umas must be spouses'
  if (!duoReady(save, duo)) return 'Both spouses need True Love'
  if (duo.some(id => save.love[id]?.house === undefined)) return 'Both spouses need a room'
  if (duo.some(id => awayForNight(save, id, save.calendar.day))) return 'A spouse is away on expedition'
  if (duo.some(birthdayAlone)) return 'A spouse asked for a private birthday'
  return duo.every(id => nightAvailable(save, pack, id)) ? null : 'Night visits are unavailable'
}

export function planVisit(save: SaveV4, pack: LifePack, who: Visit['who'], kind: VisitKind, birthdayAlone: (id: string) => boolean, birthdays = NO_BIRTHDAYS, chosenLook?: number): Visit | null {
  if (save.today.dayParts && actionsLeft(save) > 0) return null
  if (nightVisits(save).length >= NIGHT_VISITS || who.some(id => !nightAvailable(save, pack, id))) return null
  if (who.length === 2 && (partnerLock(save, pack, who, birthdayAlone)
    || !configuredDuos(save, pack).some(duo => duoKey(duo) === duoKey(who)))) return null
  const anniversary = kind === 'anniversary' ? anniversaryOffer(save, who[0]) : null
  if (kind === 'anniversary' && anniversary === null) return null
  const birthday = kind === 'birthday' ? birthdayOffer(save, who[0], birthdays) : null
  if (kind === 'birthday' && birthday === null) return null
  if (chosenLook !== undefined && (kind === 'pajamas' || !formalLooks(save, who[0]).includes(chosenLook))) return null
  const looks = who.map((id, i) => {
    const heart = greaterLoveOf(save, id)
    const look = visitLookKind({ kind }, i)
    if (look === 'pajamas') return (heart.pajamas % unlockedLooks(heart.points, look)) + 1
    const eligible = formalLooks(save, id)
    return chosenLook ?? eligible.find(slot => slot > heart.anniversaries) ?? eligible[0]!
  })
  return { day: save.calendar.day, kind, who, looks, ...(anniversary === null ? {} : { anniversary }), ...(birthday === null ? {} : { birthday }) }
}

function award(heart: GreaterLove, day: number): GreaterLove {
  if (heart.points >= TRUE_LOVE) return heart
  const points = heart.points + 1
  return { ...heart, points, ...(points === TRUE_LOVE ? { trueDay: day } : {}) }
}

export function completeVisit(save: SaveV4, pack: LifePack, visit: Visit, slot: number, birthdayAlone: (id: string) => boolean, birthdays = NO_BIRTHDAYS): SaveV4 {
  const next = activateLongGame(save, pack)
  const visits = nightVisits(next)
  const planned = planVisit(next, pack, visit.who, visit.kind, birthdayAlone, birthdays, visit.kind === 'pajamas' ? undefined : visit.looks[0])
  const shared = planned?.kind === 'pajamas' && planned.who.length === 2
  const plan = planned && shared ? {
    ...planned,
    ...(isDuoNightVariant(visit.duoArt) ? { duoArt: visit.duoArt } : {}),
    ...(visit.duoCouch === true ? { duoCouch: true as const } : {}),
  } : planned
  if (!next.longGame || !plan || slot !== visits.length || visit.day !== plan.day || visit.anniversary !== plan.anniversary
    || visit.birthday !== plan.birthday || visitMemoryKey(visit) !== visitMemoryKey(plan)) throw new SaveRuleError('not-ready', 'Open a new visit for tonight.')
  const love = { ...next.longGame.love }
  for (const [i, id] of plan.who.entries()) {
    const heart = award(greaterLoveOf(next, id), plan.day)
    const memories = heart.memories.some(memory => visitMemoryKey(memory) === visitMemoryKey(plan)) ? heart.memories : [...heart.memories, plan]
    if (plan.kind === 'pajamas') love[id] = { ...heart, pajamas: plan.looks[i]!, memories }
    else if (i === 0) {
      const receipt = plan.kind === 'birthday' ? { birthday: plan.birthday! } : { anniversary: plan.anniversary! }
      love[id] = { ...heart, anniversaries: plan.looks[i]!, memories, ...receipt }
    } else love[id] = { ...heart, memories }
  }
  return { ...next, longGame: { ...next.longGame, love, night: { day: plan.day, visits: [...visits, plan] } } }
}

export function setVisitStay(save: SaveV4, pack: LifePack, day: number, birthdayAlone: (id: string) => boolean): SaveV4 {
  const night = save.longGame?.night
  const last = night?.visits[NIGHT_VISITS - 1]
  if (!save.longGame || night?.day !== day || day !== save.calendar.day || !last || last.who.some(id => !nightAvailable(save, pack, id))
    || (last.who.length === 2 && last.who.some(birthdayAlone))) {
    throw new SaveRuleError('not-ready', 'Stay after the fifth visit.')
  }
  const next = chooseCompanion(save, last.who[0], birthdayAlone(last.who[0]))
  if (next === save && night.stay) return save
  return { ...next, longGame: { ...save.longGame, night: { ...night, stay: true } } }
}

/** Older saves can still replay the live morning until it rolls off. New stays are also kept in each book. */
export function morningOfMemory(save: Pick<SaveV4, 'longGame'>, memory: Visit): Visit | null {
  if (memory.overnight) return memory
  const morning = save.longGame?.morning
  return morning && visitMemoryKey(morning) === visitMemoryKey(memory) ? morning : null
}

export function settleVisits(save: SaveV4, companion: string | null): SaveV4 {
  if (!save.longGame) return save
  const { night, morning: previous, ...game } = save.longGame
  if (!night && !previous) return save
  const last = night?.stay && night.day === save.calendar.day ? night.visits[NIGHT_VISITS - 1] : undefined
  const stayed = last && last.who[0] === companion && (!save.homestead.alone || last.who.length === 1)
    && last.who.every(id => save.love[id]?.house !== undefined && !awayForNight(save, id, last.day))
  const love = { ...game.love }
  for (const morning of [previous, stayed ? last : undefined]) {
    if (!morning) continue
    const key = visitMemoryKey(morning)
    for (const id of morning.who) {
      const heart = greaterLoveOf({ longGame: { ...game, love } }, id)
      const earned = morning === last && stayed ? award(heart, morning.day + 1) : heart
      love[id] = { ...earned, memories: earned.memories.map(memory => visitMemoryKey(memory) === key ? { ...memory, overnight: true } : memory) }
    }
  }
  return { ...save, longGame: { ...game, love, ...(stayed ? { morning: last } : {}) } }
}
