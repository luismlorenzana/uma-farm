import { currentDatePeriod, dateOf, isMorningOuting, type EveningKind, type FarmSave, type Season, type Step, type StoryPack } from '@farm/domain'

export type ScenePhase = 'morning' | 'afternoon' | 'night'
export interface SceneEnvironment {
  place: string | null
  phase: ScenePhase
  season: Season
  view?: string | undefined
  nextPlace?: string | undefined
}

export const environment = (save: Pick<FarmSave, 'calendar' | 'today'>, place: string | null,
  phase: ScenePhase = currentDatePeriod(save) ?? 'night', day = save.calendar.day): SceneEnvironment =>
  ({ place, phase, season: dateOf(day, save.calendar).season })

export function environmentAt(steps: readonly Step[], cursor: number, base: SceneEnvironment): SceneEnvironment {
  let place = base.place, view = base.view
  for (let i = 0; i <= cursor && i < steps.length; i++) {
    const step = steps[i]!
    if ('place' in step && step.place !== place) {
      place = step.place
      view = undefined
    }
  }
  let nextPlace: string | undefined
  for (let i = cursor; i < steps.length; i++) {
    const step = steps[i]!
    if ('choice' in step) break
    if (i > cursor && 'place' in step && step.place !== place) {
      nextPlace = step.place
      break
    }
  }
  return { ...base, place, view, nextPlace }
}

const aliases: Readonly<Record<string,string>> = { town: 'plaza', shop: 'store', bakery: 'laurel-bakery' }
const places = new Set(`fields fishery forest orchard-bench plaza market library track harbour harbour-wall hilltop-track overlook sea-pier home-table home-threshold bedroom forge restaurant festival chapel-bell mill coop barn sawmill smokehouse kitchen mine smelter quarry cutter bin warehouse board dock boat store rancher mayor smith expeditions dorm dorm-porch cafe-morning festival-night bedroom-morning town-work harbour-inn fields-winter gate cafe pond-night sitting-solo sitting-duo estate-office little-studio laurel-bakery mejiro-salon espoir-garage`.split(' '))
const interiors = new Set('bedroom bedroom-morning cafe cafe-morning sitting-solo sitting-duo home-table home-threshold library mill barn smokehouse kitchen smelter cutter warehouse store rancher mayor smith expeditions restaurant forge town-work harbour-inn coop estate-office little-studio laurel-bakery mejiro-salon espoir-garage'.split(' '))
const explicitlyNight = new Set(['pond-night','festival-night','sitting-solo','sitting-duo'])

export function resolveEnvironment(context: SceneEnvironment, story?: StoryPack | null) {
  const { place, phase, season, view } = context
  const id = place ?? 'fields'
  const custom = story?.town?.locations?.find(location => location.id === id)
  const cue = view ?? id
  const preferred = aliases[cue] ?? cue
  let key = places.has(preferred) ? preferred : custom?.kind === 'home' ? 'home-threshold' : custom?.kind === 'work' ? 'town-work' : 'plaza'
  const when = explicitlyNight.has(key) ? 'night' : phase
  if (key === 'fields' && season === 'winter') key = 'fields-winter'
  if (key === 'cafe' && when === 'morning') key = 'cafe-morning'
  if (key === 'bedroom' && when === 'morning') key = 'bedroom-morning'
  if (key === 'fishery' && when === 'night') key = 'pond-night'
  if (key === 'festival' && when === 'night') key = 'festival-night'
  const indoor = interiors.has(key)
  const fallback = when === 'night' ? (indoor ? 'sitting-solo' : 'pond-night') : (indoor ? 'home-table' : 'gate')
  return { key, phase: when, fallback, tint: when === 'night' && !explicitlyNight.has(key) && key !== 'bedroom' && key !== 'forge' }
}

const outingPlaces: Readonly<Record<EveningKind,string>> = {
  'morning-walk':'fields', breakfast:'cafe', 'tea-by-the-pond':'fishery', 'flower-market':'market',
  'sunrise-sketch':'overlook', 'bakery-stop':'cafe', walk:'forest', fishing:'fishery', picnic:'orchard-bench',
  market:'market', cooking:'kitchen', crafting:'town-work', stargazing:'pond-night', dinner:'home-table',
  dance:'plaza', boat:'boat', 'night-in':'sitting-solo', footrace:'hilltop-track', festival:'festival',
}
export function outingEnvironment(save: FarmSave, kind: EveningKind, day: number): SceneEnvironment {
  const phase = isMorningOuting(kind) ? 'morning' : ['stargazing','dinner','night-in','festival'].includes(kind) ? 'night' : 'afternoon'
  return environment(save, outingPlaces[kind], phase, day)
}
