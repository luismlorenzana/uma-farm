import { dateOf, DAYS_PER_YEAR, FESTIVALS, turnOnDateDay, yearlyDate } from '../farm/calendar'
import type { SpecialDays } from '../farm/actions'
import { isGoodId } from '../goods/ids'
import { goodName } from '../goods/names'
import { tasteKnown } from '../romance/acts'
import { isMorningOuting } from '../romance/morning-outings'
import { EVENINGS, eveningMoments, eveningScene, kindBuilt, type EveningRole } from '../romance/evening'
import { householdTitle, isHouseholdId } from '../romance/household'
import { rungName } from '../romance/love'
import { DEFAULT_OCCASION_SCENES, occasionMoments, occasionPlayed, occasionsOn, type Occasion, type OccasionKind } from '../romance/occasions'
import { EVENING_KINDS, type EveningKind, type FarmSave } from '../save/v4'
import { FESTIVAL_NIGHTS, RUNGS } from '../story/authored'
import type { Moment } from '../story/look'
import type { StoryPack } from '../story/pack'
import { festivalsOf, giftsOf, pairLevels, storyDaysOf } from '../story/placeholders'
import { libraryReceipts, RECENT_OUTINGS, recordLibrary, type LibraryOuting, type OutingTotals } from './receipts'

export const SCENE_GROUPS = ['route', 'outings', 'occasions', 'home', 'shared', 'archive'] as const
export type SceneGroup = typeof SCENE_GROUPS[number]
export interface BookScene {
  key: string
  title: string
  group: SceneGroup
  earned: boolean
  core: boolean
  variants: BookReplay[]
  day?: number
}
export interface BookReplay {
  key: string
  source: 'route' | 'script' | 'life' | 'pair' | 'household'
  script: string
  title: string
  day: number | null
  moments?: readonly Moment[]
}
export interface BookFact { key: string; title: string; value: string | null; day: number | null }
export interface BookMilestone { key: string; title: string; earned: boolean; day: number | null; core?: false }
export interface BookProgress { filled: number; available: number }

const LIFE_TITLES: Readonly<Record<string, string>> = {
  'invited-to-work': 'Invited to work', 'moving-in': 'Moving in', 'wedding-night': 'Wedding night',
  s2: 'Spouse 2', s4: 'Spouse 4', morning: 'A morning together', breakfast: 'Breakfast together', dinner: 'Dinner at home',
}
const firstDate = (dates: Record<string, number>, key: string) => dates[key] ?? null
const words = (slug: string) => slug.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())

function occasionCatalogue(save: FarmSave, pack: StoryPack, id: string, days: SpecialDays): Map<string, Occasion> {
  // A full repeating year after the first possible anniversary. Use the same priority that offers scenes live.
  const known = save.love[id]!
  const year = dateOf(save.calendar.day, save.calendar).year + 1
  const allowed = new Map<string, Occasion>()
  function collect(dated: FarmSave) {
    for (let d = 1; d <= DAYS_PER_YEAR; d++) {
      const turn = turnOnDateDay((year - 1) * DAYS_PER_YEAR + d, save.calendar)
      if (turn === null) continue
      for (const occasion of occasionsOn(dated, pack, days, id, turn)) {
        allowed.set(`occasion:${occasion.slot}:${occasion.id}`, occasion)
      }
    }
  }
  collect(save)
  if (known.wed === undefined && pack.scripted.get(id)?.has('anniversary')) {
    // A future wedding can be held on a free day. Count an anniversary with a reachable day-slot.
    const start = (year - 2) * DAYS_PER_YEAR
    const wed = Array.from({ length: DAYS_PER_YEAR }, (_, i) => turnOnDateDay(start + i + 1, save.calendar)).find(d =>
      d !== null && !occasionsOn(save, pack, days, id, yearlyDate(d, 1, save.calendar)).some(scene => scene.slot === 'day'))
    if (wed != null) collect({ ...save, love: { ...save.love, [id]: { ...known, stage: 'spouse', wed } } })
  }
  return allowed
}

const ROLE_TITLE: Record<EveningRole, string> = { hangout: 'Hangout', date: 'Date', spouse: 'Evening at home' }

export function bookScenes(save: FarmSave, pack: StoryPack, id: string, days: SpecialDays): BookScene[] {
  const uma = save.roster[id]
  const love = save.love[id]
  if (!uma || !love) return []
  const first = libraryReceipts(save, id)?.first ?? {}
  const known = Object.entries(first)
  const seen = new Set(save.memories[id] ?? [])
  if (save.arrivals.includes(id)) seen.add('arrival')
  const last = save.memories[id]?.at(-1)
  const scenes: BookScene[] = RUNGS.map((rung) => {
    const key = `route:${rung}`
    const title = rung === 'arrival' ? 'First meeting' : rungName(rung)
    const lastStep = rung === last && (love.stage !== 'spouse' || rung === `s${love.level}`)
    const day = firstDate(first, key) ?? (rung === 'wedding' ? love.wed ?? null : lastStep ? love.last || null : null)
    const retired = first[`${key}:authored`] !== undefined && !pack.scripted.get(id)?.has(rung)
    return { key, title: retired ? 'Archived scene' : title, group: 'route', core: true, earned: seen.has(rung),
      ...(day === null ? {} : { day }), variants: !retired && seen.has(rung) ? [{ key, title, source: 'route', script: rung, day }] : [] }
  })
  const archived: BookScene[] = []
  const archive = (key: string, day: number) => archived.push({
    key, title: 'Archived scene', group: 'archive', core: false, earned: true, variants: [], day,
  })
  for (const kind of EVENING_KINDS) {
    const key = `evening:${kind}`
    const variants: BookReplay[] = known.flatMap(([row, day]) => {
      const [, , role, version] = row.split(':')
      if (!row.startsWith(key + ':') || !role || !Object.hasOwn(ROLE_TITLE, role)) return []
      const script = eveningScene(role as EveningRole, kind)
      if (version === 'authored' && !pack.scripted.get(id)?.has(script)) {
        archive(row, day)
        return []
      }
      return [{ key: row, title: ROLE_TITLE[role as EveningRole], source: 'script', script, day, moments: eveningMoments(kind) }]
    })
    const proved = known.some(([row]) => row.startsWith(key + ':'))
    if (kindBuilt(kind) || proved) scenes.push({ key, title: EVENINGS[kind].name, group: 'outings', core: kindBuilt(kind) && !isMorningOuting(kind),
      earned: proved || save.today.evenings.some(outing => outing.with === id && outing.kind === kind), variants })
  }
  const scheduled = occasionCatalogue(save, pack, id, days)
  const playedToday = occasionsOn(save, pack, days, id).filter(({ id: occasion }) => occasionPlayed(save, id, occasion))
  for (const [key, schedule] of scheduled) {
    const variants: BookReplay[] = known.flatMap(([row, day]) => {
      if (!row.startsWith(key + ':')) return []
      const [, , occasion, script, kind] = row.split(':')
      if (!script) return []
      const rule = days.festivals.find(f => f.rule && (f.rule === occasion || FESTIVAL_NIGHTS[f.rule][0] === occasion))?.rule ?? null
      const historical = schedule.event === script || DEFAULT_OCCASION_SCENES.includes(script) || pack.scripted.get(id)?.has(script) === true
      return historical ? [{ key: row, title: schedule.name, source: 'script', script, day, moments: occasionMoments(kind as OccasionKind, rule) }] : []
    })
    const today = playedToday.find(row => row.id === schedule.id && row.slot === schedule.slot)
    if (today && !variants.length) variants.push({ key: `${key}:${today.event}:${today.kind}`, title: today.name,
      source: 'script', script: today.event, day: save.calendar.day, moments: today.moments })
    scenes.push({ key, title: schedule.name, group: 'occasions', core: true,
      earned: variants.length > 0 || known.some(([row]) => row.startsWith(key + ':')), variants })
  }
  for (const [key, day] of known) {
    const [family, script] = key.split(':')
    if (family === 'occasion' && !scenes.some(scene => scene.variants.some(variant => variant.key === key))) archive(key, day)
    if (family === 'life' && script && Object.hasOwn(LIFE_TITLES, script)) {
      const bible = pack.bibles.get(id)
      if ((script === 'morning' && !bible?.mornings?.length)
        || ((script === 'breakfast' || script === 'dinner') && !bible?.meals?.[script]?.length)) {
        archive(key, day)
        continue
      }
      const title = LIFE_TITLES[script]!
      const source = script === 'morning' || script === 'breakfast' || script === 'dinner' ? 'life' : 'script'
      scenes.push({ key, title, group: 'home', core: false, earned: true, variants: [{ key, title, script, source, day,
        moments: script === 'wedding-night' ? ['wedding-night'] : [] }] })
    }
    if (family === 'shared') {
      const house = key.slice('shared:'.length)
      if (isHouseholdId(house)) {
        const title = householdTitle(house)
        scenes.push({ key, title, group: 'shared', core: false, earned: true, variants: [{ key, title, script: house, source: 'household', day }] })
      }
    }
  }
  for (const key of save.diary.read) {
    const match = /^pair:(s?\d+)-(s?\d+):(\d+)$/.exec(key)
    if (!match || (match[1] !== id && match[2] !== id) || first[`shared:skipped:${key}`] !== undefined) continue
    const title = 'A conversation together'
    const day = firstDate(first, `shared:${key}`)
    const available = pairLevels(pack, match[1]!, match[2]!).has(Number(match[3]))
    scenes.push({ key, title: available ? title : 'Archived scene', group: available ? 'shared' : 'archive', core: false, earned: true,
      ...(day === null ? {} : { day }),
      variants: available ? [{ key, title, source: 'pair', script: `${match[1]}-${match[2]}:${match[3]}`, day }] : [] })
  }
  return [...scenes, ...archived]
}

export function bookDiscoveries(save: FarmSave, pack: StoryPack, id: string, days: SpecialDays): BookFact[] {
  const uma = save.roster[id]
  const love = save.love[id]
  if (!uma || !love) return []
  const first = libraryReceipts(save, id)?.first ?? {}
  const bible = pack.bibles.get(id)
  const row = (key: string, title: string, value: string | null, day: number | null = null): BookFact =>
    ({ key: `fact:${key}`, title, value, day: value ? first[`fact:${key}`] ?? day : null })
  const found = [row('profile', 'Met her', 'Known', uma.joined)]
  const birthday = days.birthdays.get(id)
  if (birthday !== undefined) {
    const { day, season } = dateOf(birthday)
    found.push(row('birthday', 'Birthday', `${words(season)} ${day}`))
  }
  if (bible?.blurb) found.push(row('blurb', 'About her', bible.blurb, uma.joined))
  const has = (rung: string) => rung === 'arrival' ? save.arrivals.includes(id) : (save.memories[id] ?? []).includes(rung)
  if (bible?.keepsake?.name) found.push(row('keepsake', 'Keepsake', has('f10') ? bible.keepsake.name : null, firstDate(first, 'route:f10')))
  if (bible?.petName) found.push(row('pet-name', 'What she calls you', has('r1') ? bible.petName : null, firstDate(first, 'route:r1')))
  if (love.dish || !has('f4')) found.push(row('signature-dish', 'Signature dish', love.dish ? goodName(love.dish) ?? love.dish : null, firstDate(first, 'route:f4')))
  const gifts = giftsOf(pack, id)
  const tasted = new Set<string>()
  for (const [taste, ids] of [['Loved', gifts.loved ? [gifts.loved] : []], ['Liked', gifts.liked ?? []], ['Disliked', gifts.disliked ?? []]] as const) {
    for (const item of ids) {
      if (!isGoodId(item) || tasted.has(item)) continue
      tasted.add(item)
      found.push(row(`gift:${item}`, 'Gift taste', tasteKnown(pack, love, id, item) ? `${goodName(item)} · ${taste}` : null))
    }
  }
  for (const fact of bible?.profileFacts ?? []) {
    const gate = fact.reveal
    const available = gate === 'met' || ('rung' in gate ? has(gate.rung) : tasteKnown(pack, love, id, gate.taste))
    found.push(row(`note:${fact.id}`, 'About her', available ? fact.text : null,
      gate === 'met' ? uma.joined : 'rung' in gate ? firstDate(first, `route:${gate.rung}`) : firstDate(first, `fact:gift:${gate.taste}`)))
  }
  return found
}

export function archivedDiscoveries(save: FarmSave, id: string, facts: readonly BookFact[]): BookFact[] {
  const keys = new Set(facts.map(fact => fact.key))
  return Object.entries(libraryReceipts(save, id)?.first ?? {}).flatMap(([key, day]) => {
    if (!key.startsWith('fact:') || keys.has(key)) return []
    const goods = key.startsWith('fact:gift:') ? key.slice('fact:gift:'.length) : ''
    return [{ key, day, title: goods && isGoodId(goods) ? goodName(goods) : 'Archived discovery', value: null }]
  })
}

export function bookMilestones(save: FarmSave, id: string, pack?: StoryPack): BookMilestone[] {
  const uma = save.roster[id]
  const love = save.love[id]
  if (!uma || !love) return []
  const book = libraryReceipts(save, id)
  const first = book?.first ?? {}
  const metAt = Object.keys(first).find(key => key.startsWith('milestone:met:'))?.split(':')[2]
  const meeting = metAt ? pack?.town?.locations?.find(location => location.id === metAt)?.name ?? words(metAt) : null
  const memories = save.memories[id] ?? []
  const row = (key: string, title: string, date: number | undefined, earned = date !== undefined): BookMilestone =>
    ({ key, title, earned, day: date ?? null })
  const entries = [
    row('met', meeting ? `Met at ${meeting}` : 'First meeting', uma.joined),
    row('farmhand', 'Invited to work', uma.farmhand),
    row('confession', 'Became partners', first['milestone:confession'],
      memories.includes('confession') && love.stage !== 'confession'),
    row('first-date', 'First date', first['milestone:first-date']),
    row('proposal', 'Got engaged', first['route:proposal'], memories.includes('proposal')),
    row('wedding', 'Married', love.wed),
  ]
  for (const [activity, summary] of Object.entries(book?.totals ?? {})) {
    if (activity.startsWith('festival:') || activity.startsWith('expedition:')) entries.push({
      ...row(activity, `First · ${libraryEntryName(activity, pack)}`, summary[1]), core: false,
    })
  }
  return entries
}

export function libraryEntryName(key: string, pack?: StoryPack): string {
  const [family, a = '', b, c, outcome] = key.split(':')
  const festivals = pack ? festivalsOf(pack) : FESTIVALS
  if (family === 'evening') {
    const name = EVENINGS[a as EveningKind]?.name ?? words(a)
    const role = b ? ROLE_TITLE[b as EveningRole] : null
    return role ? `${name} · ${role}` : name
  }
  if (family === 'festival') {
    const name = festivals.find(fest => fest.rule === a)?.name ?? words(a)
    return b && c ? `${name} · ${words(b)} · ${['', '1st', '2nd', '3rd'][Number(c)] ?? c}${outcome === 'won' ? ' · Winner' : ''}` : name
  }
  if (family === 'occasion' && b) {
    const night = a === 'night'
    if (b === 'new-year') return 'New Year’s'
    const festival = festivals.find(fest => fest.rule === b || (fest.rule && FESTIVAL_NIGHTS[fest.rule][0] === b))
    return festival ? festival.name + (night ? ' night' : '') : pack ? storyDaysOf(pack).find(day => day.id === b)?.name ?? words(b) : words(b)
  }
  if (family === 'expedition') return b ? `${words(a)} · ${words(b)}` : 'Expedition'
  return words(a)
}

export function bookHistory(save: FarmSave, id: string): {
  recent: LibraryOuting[]; totals: Record<string, OutingTotals>; lastEvening: number | null
} {
  const book = libraryReceipts(save, id)
  const recent = [...(book?.recent ?? [])]
  const tracked = (key: string, day: number) => recent.some(entry => entry[0] === day && entry[1].startsWith(key))
  const seenBefore = (key: string, day: number) => (book?.totals[key]?.[1] ?? Infinity) <= day
  for (const [contest, card] of Object.entries(save.workshops.festival?.last ?? {})) {
    if (!card.place || tracked(`festival:${contest}:`, card.day) || seenBefore(`festival:${contest}`, card.day)) continue
    const role = contest === 'flower-show' ? (card.credit.includes(id) ? 'grower' : null)
      : contest === 'animal-show' ? (card.staff.includes(id) ? 'handler' : card.credit.includes(id) ? 'caretaker' : null)
      : contest === 'fishing-derby' ? (card.catches?.some(fish => fish.by === id) ? 'caster' : null)
      : card.presenters?.includes(id) ? 'presenter' : null
    if (role) recent.push([card.day, `festival:${contest}:${role}:${card.place}${card.credit.includes(id) ? ':won' : ''}`, card.score])
  }
  for (const expedition of save.expeditionLog ?? []) {
    if (expedition.party.includes(id) && !tracked(`expedition:${expedition.region}:`, expedition.back)
      && !seenBefore('expedition:return', expedition.back)) recent.push([expedition.back, `expedition:${expedition.region}:${expedition.result}`, null])
  }
  return { recent: recent.sort((a,b) => a[0] - b[0]).slice(-RECENT_OUTINGS).reverse(), totals: book?.totals ?? {},
    lastEvening: save.love[id]?.evening || null }
}

const progress = <T>(rows: readonly T[], earned: (row: T) => boolean): BookProgress =>
  ({ filled: rows.filter(earned).length, available: rows.length })

export function bookProgress(save: FarmSave, pack: StoryPack, id: string, days: SpecialDays) {
  const scenes = progress(bookScenes(save, pack, id, days).filter(scene => scene.core), scene => scene.earned)
  const facts = progress(bookDiscoveries(save, pack, id, days), fact => fact.value !== null)
  const milestones = progress(bookMilestones(save, id).filter(mark => mark.core !== false), mark => mark.earned)
  return { scenes, facts, milestones, filled: scenes.filled + facts.filled + milestones.filled,
    available: scenes.available + facts.available + milestones.available, completeDay: libraryReceipts(save, id)?.complete ?? null }
}

/** Materialize facts learned by this gameplay change and seal a book when play first fills it. Pure on read and boot. */
export function finishLibraryChanges(before: FarmSave, save: FarmSave, pack: StoryPack, days: SpecialDays): FarmSave {
  let next = save
  for (const [id, uma] of Object.entries(save.roster)) {
    const love = save.love[id]
    const prior = before.love[id]
    if (!love) continue
    if (before.roster[id]?.farmhand === uma.farmhand && prior?.stage === love.stage && prior.level === love.level
      && prior.known === love.known && before.library?.[id] === save.library?.[id] && before.memories[id] === save.memories[id]) continue
    const old = new Set(bookDiscoveries(before, pack, id, days).filter(entry => entry.value !== null).map(entry => entry.key))
    for (const fact of bookDiscoveries(save, pack, id, days)) {
      if (fact.value !== null && !old.has(fact.key)) next = recordLibrary(next, id, fact.key, { day: fact.day ?? save.calendar.day })
    }
    const book = libraryReceipts(next, id)
    if (!book || book.complete !== undefined) continue
    const after = bookProgress(next, pack, id, days)
    if (after.available > 0 && after.filled === after.available) {
      const earlier = bookProgress(before, pack, id, days)
      if (earlier.filled < earlier.available || !prior) {
        next = { ...next, library: { ...next.library, [id]: { ...book, complete: save.calendar.day } } }
      }
    }
  }
  return next
}
