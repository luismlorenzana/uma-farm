import { festivalOn, isNewYear, dateOf, dateDayOf, nextFestival, type FestivalId } from '../farm/calendar'
import { eventActionsLeft, actionsLeft, type SpecialDays } from '../farm/actions'
import { buildLock, buildLockWords } from '../farm/builds'
import { farmRankOf } from '../farm/farm'
import { farmPlace, placeBuilt } from '../farm/places'
import { fieldTiles, type FarmSave } from '../save/v4'
import { stockKey } from '../save/warehouse'
import { cropGradeOf } from '../goods/ids'
import { goodName } from '../goods/names'
import { festivalEntryLock, animalPreview, cupCategory, festivalStock, flowerMarkLock, flowerPreview, contestCutoffs, festivalPrize, festivalResult } from './contests'
import { activeContest, isFarmContest } from './state'
import { contestBlock, contestDefault, contestPrize } from '../kitchen/contest'
import { MAINS_A_DISH, SIDES_A_DISH } from '../kitchen/recipes'
import { reachList } from '../gathering/hauls'
import { eventKey, eventVisited, festivalEntryStock, releaseFestivalPlan, type EventStock } from './journal'
import { priceOf } from '../goods/prices'
import type { SchedulePack } from '../town/town'
import { professionWorker } from '../town/professions'

const VENUES: Record<FestivalId, { venue: string; place: string; job: string; invite: string; entry: string }> = {
  'flower-show': { venue: 'Festival Ground', place: 'plaza', job: 'florist',
    invite: 'Walk through the spring exhibits. Each grower has put aside a crop they were proud to bring.',
    entry: 'Bring one crop or orchard fruit from your Warehouse, or tend a marked crop for the display box.' },
  'fishing-derby': { venue: 'Dock', place: 'harbour', job: 'dock-steward',
    invite: 'Come down to the weigh-in. The best stories usually start before the fish reaches the scales.',
    entry: 'Make three casts at a fishing spot you can reach. You can cast alone or invite up to two available farmhands.' },
  'cooking-contest': { venue: 'Kitchen', place: 'cafe', job: 'cook',
    invite: 'Come see what’s on the judging table. The cooks are sharing a table even while they’re competing.',
    entry: 'Cook a known contest recipe live. Bring two portions of its main ingredient and one side.' },
  'animal-show': { venue: 'Show Pens', place: 'rancher', job: 'rancher',
    invite: 'Take a lap around the pens. The animals are getting a final brush before they go in.',
    entry: 'Show an animal you already own. Feeding, hearts and recent care help its score.' },
  'harvest-cup': { venue: 'Festival Ground', place: 'market', job: 'seed-merchant',
    invite: 'See what everyone grew and made over the year. Start with the displays from farms you know.',
    entry: 'Bring one exact lot from each of three different categories. A recent producer can present an exhibit.' },
}
const FAIR = { venue: 'Town Plaza', place: 'plaza', job: 'bell-keeper',
  invite: 'Stop by the plaza and see who’s out for the celebration.', entry: '' }

export function agendaLink(day?: number, from = '/'): string {
  return from + '?sheet=events' + (day === undefined ? '' : '&eventDay=' + day)
}

export function communityEvent(save: FarmSave, days: SpecialDays, day = save.calendar.day, pack: SchedulePack | null = null) {
  const festival = festivalOn(day, days.festivals, save.calendar)
  const newYear = isNewYear(day, save.calendar) && dateOf(day, save.calendar).year > 1
  if (!festival && !newYear) return null
  const id = festival?.id ?? 'new-year'
  const rule = festival?.rule ?? null
  const venue = rule ? VENUES[rule] : FAIR
  const played = activeContest(save)
  const active = played?.day === day && played.id === rule
    || (rule === 'cooking-contest' && save.workshops.current?.day === day && save.workshops.current.play === 'contest')
  const receipt = save.eventJournal?.results?.find(row => row.id === rule && row.day === day)
  const past = save.farm.festivals.find(row => row.id === rule && row.day === day)
  const last = rule && isFarmContest(rule) ? festivalResult(save, rule) : undefined
  const judged = receipt ?? past ?? (last?.day === day ? last : undefined)
  const today = day === save.calendar.day
  const status = active ? 'continue' : judged ? 'results' : today ? 'open'
    : day < save.calendar.day ? 'past' : 'upcoming'
  return { id, key: eventKey(id, day), name: festival?.name ?? 'New Year’s', rule, day, today, status, ...venue,
    visited: eventVisited(save, id, day), receipt, judged, host: professionWorker(pack, save, day, venue.job),
    actions: today && rule ? eventActionsLeft(save, days, 'contest') : today && newYear ? eventActionsLeft(save, days, 'newYear') : 0,
    regular: today ? actionsLeft(save) : 0,
  }
}

export function upcomingEvent(save: FarmSave, days: SpecialDays, pack: SchedulePack | null = null) {
  const { day } = nextFestival(save.calendar.day, days.festivals, save.calendar)
  return communityEvent(save, days, day, pack)
}

export function festivalStockChoices(save: FarmSave, id: FestivalId, day: number): EventStock[][] {
  if (id === 'cooking-contest') {
    const entry = contestDefault(save)
    if (!entry) return []
    return entry.main === entry.side
      ? [[{ key: entry.main, count: MAINS_A_DISH + SIDES_A_DISH }]]
      : [[{ key: entry.main, count: MAINS_A_DISH }, { key: entry.side, count: SIDES_A_DISH }]]
  }
  if (id !== 'flower-show' && id !== 'harvest-cup') return []
  const sets = Object.entries(save.items).flatMap(([id, stars]) => stars.flatMap((count, index) => {
    const key = stockKey(id, index + 1)
    return count && festivalStock(save, key) > 0 ? [{ id, key, count: 1, stars: index + 1 }] : []
  }))
  if (id === 'flower-show') {
    const flowers = sets.filter(row => cropGradeOf(row.id)).sort((a, b) => b.stars - a.stars)
    return flowers.slice(0, 5).map(({ key, count }) => [{ key, count }])
  }
  const selected = new Set<string>()
  const choose = (mostStars: boolean) => {
    const categories = new Set<string>()
    const order = sets.slice().sort((a, b) => mostStars ? b.stars - a.stars
      : priceOf(a.id, a.stars, dateDayOf(day, save.calendar)) - priceOf(b.id, b.stars, dateDayOf(day, save.calendar)))
    return order.flatMap(({ id, key, count }) => {
      const category = cupCategory(id)
      if (!category || categories.has(category) || categories.size >= 3) return []
      categories.add(category)
      return [{ key, count }]
    })
  }
  // Filter before valuing since seeds and some story items have no sale price.
  for (let i = sets.length - 1; i >= 0; i--) if (!cupCategory(sets[i]!.id)) sets.splice(i, 1)
  return [choose(false), choose(true)].filter(rows => {
    const keys = rows.map(row => row.key).sort().join(',')
    if (rows.length !== 3 || selected.has(keys)) return false
    selected.add(keys)
    return true
  })
}

export function eventPreparation(save: FarmSave, id: FestivalId, day: number, days: SpecialDays, pack: SchedulePack | null) {
  const live = festivalEntryStock(save, id)
  const stock = festivalStockChoices(live.eventJournal?.plan?.id === id ? releaseFestivalPlan(live) : live, id, day)
  const steps: { text: string; to?: string }[] = []
  let missing: string | null = null
  const rank = farmRankOf(save.farm.points)
  switch (id) {
    case 'flower-show': {
      const marked = save.workshops.festival?.mark
      const box = flowerPreview(save, null, null, days)
      if (box) steps.push({ text: 'Display box · ' + goodName(box.id) + ' · ' + box.score + ' points', to: '/?sheet=festival&contest=flower-show' })
      else if (marked) {
        const tile = fieldTiles(save)[marked.tile]
        steps.push({ text: 'Marked crop · ' + (tile?.ready ? 'Ready to harvest' : `${marked.dates.length}/5 tending dates · ${tile?.growth ?? 0} growth`), to: '/field' })
      } else {
        const slot = fieldTiles(save).findIndex((tile, i) => !!tile.crop && flowerMarkLock(save, i, tile.crop, days) === null)
        steps.push({ text: slot >= 0 ? 'Mark a growing crop' : 'Grow or save one crop. The display box opens 10 days before the show.', to: '/?sheet=festival&contest=flower-show' })
      }
      if (!stock.length && !box) missing = 'Bring an eligible crop or a boxed entry.'
      break
    }
    case 'fishing-derby': {
      const places = reachList(save, 'fishery').filter(spot => !spot.lock)
      steps.push({ text: places.length ? places.map(spot => spot.name).join(' · ') : 'Open a fishing spot', to: '/?peek=fishery' })
      if (!places.length) missing = 'Open a fishing spot first.'
      break
    }
    case 'cooking-contest': {
      if (!placeBuilt(save, 'kitchen')) {
        const reason = buildLockWords(buildLock(save, 'kitchen'))
        steps.push({ text: 'Build the Kitchen' + (reason ? ' · ' + reason : ''), to: '/?peek=kitchen' })
        missing = 'The Kitchen is required.'
      } else if (!stock.length) {
        missing = 'A known recipe and its main and side are required.'
        steps.push({ text: 'See recipes and missing ingredients', to: '/?sheet=contest' })
      }
      break
    }
    case 'animal-show': {
      const eligible = save.ranch.animals.flatMap(animal => animalPreview(save, animal.id) ?? [])
      if (!eligible.length) {
        const home = farmPlace('coop')
        steps.push({ text: placeBuilt(save, 'coop') || placeBuilt(save, 'barn') ? 'Buy an animal from the rancher'
          : `Build the ${home?.name ?? 'Coop'} · ${buildLockWords(buildLock(save, 'coop')) ?? 'Ready to build'}`,
        to: placeBuilt(save, 'coop') || placeBuilt(save, 'barn') ? '/town?sheet=rancher' : '/?peek=coop' })
        missing = 'An owned animal is required.'
      }
      for (const row of eligible.slice(0, 4)) {
        const home = row.animal.kind === 'chicken' || row.animal.kind === 'duck' ? 'coop' : 'barn'
        steps.push({ text: `${goodName(row.animal.kind)} · ${row.animal.fed ? 'Fed today' : 'Feed today'} · ${Math.min(row.dates, 4)}/4 care dates`, to: '/?peek=' + home })
      }
      break
    }
    case 'harvest-cup': {
      const categories = new Set(Object.keys(live.items).map(cupCategory).filter(Boolean))
      const sources = { field: '/field', ranch: '/?peek=coop', fish: '/?peek=fishery', wild: '/?peek=forest', workshop: '/?peek=mill', kitchen: '/?sheet=kitchen' }
      for (const [category, to] of Object.entries(sources)) {
        if (!categories.has(category as ReturnType<typeof cupCategory>)) steps.push({ text: 'Find an exhibit · ' + category, to })
      }
      if (!stock.length) missing = 'Three different exhibit categories are required.'
      break
    }
  }
  const lock = day === save.calendar.day ? id === 'cooking-contest'
    ? contestBlock(live, days, contestDefault(live), pack) : festivalEntryLock(save, id, days) : null
  const first = id === 'cooking-contest' ? contestPrize(day, 1, save.calendar) : festivalPrize(id, rank, dateOf(day, save.calendar).year, 1)
  return { steps, stock, missing, lock, first, target: isFarmContest(id) ? contestCutoffs(id, rank)[0] : null }
}

