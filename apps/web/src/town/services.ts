import {
  ANIMALS, BONUS_TOOLS, CONTESTS, CROPS, CROP_IDS, FISHERY, FISHING_SPOTS, FOREST, FOREST_AREAS, SPOT_NAMES, AREA_NAMES,
  TOOL_IDS, TOOL_NAMES, TOOL_RECIPES, buildCostWords, buildGoodsWords, buildNeeds, currentDatePeriod, dateOf,
  farmPlace, farmRankOf, goodCount, goodName, heartsOf, ingredientSources, innResidents, isBuildPlace,
  loadsLeft, nextToolTier, pantryMeals, placeBuilt, professionOf, professionWorker,
  requestCards, restockList, stationOptions, toolChargesLeft, toolEffect, toolTierName,
  type FarmPlaceId, type SaveV4, type StoryPack,
} from '@farm/domain'
import { gold } from '../loop/money-words'

type Service = { at: string; title: string; greeting: string; to: string; link: string; also?: string }
const REQUESTS = '?sheet=requests'
export const TOWN_SERVICES = {
  grocer: { at: 'store', title: 'Seed restock', greeting: 'Let’s check your seed shelf before I pack anything.', to: '?sheet=shop', link: 'Open Shop' },
  rancher: { at: 'rancher', title: 'Animals & feed', greeting: 'What are you bringing out to the paddock today?', to: '?sheet=rancher', link: 'Animals and fodder' },
  smith: { at: 'smith', title: 'Commission estimate', greeting: 'Tell me what you want the workshop to make.', to: '/?sheet=forge', link: 'Open Forge' },
  cook: { at: 'cafe', title: 'Featured dish', greeting: 'I’m putting one dish on the board for tonight.', to: REQUESTS, link: 'See Café order' },
  'dock-steward': { at: 'harbour', title: 'Harbour report', greeting: 'Let’s see which waters your farm can reach.', to: '/?peek=dock', link: 'Dock and Boat' },
  baker: { at: 'laurel-bakery', title: 'Bakery orders', greeting: 'The ovens are warming up. What have you brought from the Mill?', to: REQUESTS, link: 'Open Requests' },
  tailor: { at: 'mejiro-salon', title: 'Wardrobe preview', greeting: 'Want to see how that outfit looks on her?', to: '/library', link: 'Open Uma Library' },
  'seed-merchant': { at: 'market', title: 'Seasonal seeds', greeting: 'Let’s see how much of the season you have left.', to: '/town?at=store&sheet=shop', link: 'Buy seasonal seeds' },
  courier: { at: 'plaza', title: 'Town requests', greeting: 'I have the town’s orders here.', to: REQUESTS, link: 'Open Requests' },
  'cafe-host': { at: 'cafe', title: 'Visit the café', greeting: 'The window table’s free. Would you like a look at today’s order?', to: '/town?at=cafe&view=people', link: 'Find someone to invite' },
  innkeeper: { at: 'harbour-inn', title: 'Rooms & provisions', greeting: 'Welcome in. I can tell you who’s here or help pack for a trip.', to: '/?sheet=homestead', link: 'Meal planning' },
  musician: { at: 'little-studio', also: 'plaza', title: 'What’s on', greeting: 'Come see what the town’s getting ready for.', to: '/diary', link: 'Open Diary' },
  florist: { at: 'market', title: 'Flower Show prep', greeting: 'Are you preparing something for the Flower Show?', to: '/?sheet=festival', link: 'Festival entry' },
  carpenter: { at: 'estate-office', also: 'smith', title: 'Building materials', greeting: 'Show me the project you have in mind.', to: '/?sheet=next', link: 'See farm projects' },
  librarian: { at: 'library', title: 'Cookbook', greeting: 'What would you like to learn to cook?', to: '/?sheet=kitchen', link: 'Open Kitchen' },
  archivist: { at: 'library', title: 'Recipe discoveries', greeting: 'Let’s follow that recipe back to the farm.', to: '/?sheet=restaurant', link: 'Open Restaurant' },
  'bell-keeper': { at: 'plaza', title: 'Upcoming festivals', greeting: 'I’ve put the upcoming dates on the noticeboard.', to: '/?sheet=calendar', link: 'Open Calendar' },
  'animal-nurse': { at: 'rancher', title: 'Ranch check', greeting: 'Let’s look in on the animals and their feeding plan.', to: '/book?view=work&workCalendar=1', link: 'Review Work Calendar' },
  'orchard-keeper': { at: 'market', title: 'Orchard guide', greeting: 'How are the trees coming along?', to: '/field', link: 'Open Fields' },
  'woodland-guide': { at: 'track', title: 'Trail notes', greeting: 'Which part of the Forest are you headed to?', to: '/?peek=forest', link: 'Open Forest' },
  beekeeper: { at: 'market', title: 'Honey guide', greeting: 'Looking for Honeycomb, or something from the Mill?', to: '/?peek=mill', link: 'Open Mill' },
  fisher: { at: 'harbour', title: 'Catch report', greeting: 'What are you hoping to catch today?', to: '/?peek=fishery', link: 'Open Fishery' },
  boatwright: { at: 'harbour', title: 'Boat plans', greeting: 'Let’s look at the Dock before we lay out the Boat.', to: '/?peek=dock', link: 'Dock and Boat' },
  miller: { at: 'market', title: 'Mill orders', greeting: 'What should the Mill keep in stock?', to: '/?peek=mill', link: 'Open Mill' },
  'expedition-outfitter': { at: 'expeditions', also: 'track', title: 'Plan a party', greeting: 'Tell me where you want the party to go.', to: '/town?at=expeditions&sheet=expeditions', link: 'Plan an expedition' },
} satisfies Record<string, Service>

export type ServiceId = keyof typeof TOWN_SERVICES
export const serviceOf = (id: string): Service | undefined => Object.hasOwn(TOWN_SERVICES, id) ? TOWN_SERVICES[id as ServiceId] : undefined
export function serviceStaff(save: SaveV4, pack: StoryPack, id: ServiceId): string | null {
  const worker = professionWorker(pack, save, save.calendar.day, id)
  const job = worker ? professionOf(pack, worker)?.profession : null
  const part = currentDatePeriod(save)
  return job && part === (worker === job.partners[0] ? 'morning' : 'afternoon') ? worker : null
}

function buildReport(save: SaveV4, id: FarmPlaceId): string[] {
  const place = farmPlace(id)
  if (!isBuildPlace(place)) return []
  if (placeBuilt(save, id)) return [`${place.name} is open.`]
  const shortages = buildNeeds(save, place).filter(row => row.have < row.goods.count)
  return [`${place.name} · Farm Rank ${place.opens.rank} · ${buildCostWords(place)}`,
    ...shortages.map(row => `${row.have}/${row.goods.count} ${buildGoodsWords(row.goods)}`)]
}

const title = (value: string) => value.replaceAll('-', ' ').replace(/^./, char => char.toUpperCase())
export function serviceReport(id: ServiceId | 'garage', save: SaveV4, pack: StoryPack): string[] {
  const { season } = dateOf(save.calendar.day, save.calendar)
  const orders = requestCards(save, pack)
  const order = orders.find(entry => entry.from === id || (['cook', 'cafe-host'].includes(id) && entry.slot === 'food'))
  const orderLine = order ? `${order.title} · ${order.held}/${order.count} held` : 'No matching order on the board right now.'
  switch (id) {
    case 'grocer': {
      const needs = restockList(save).filter(row => row.store === 'shop')
      return needs.length ? needs.map(row => `${row.count} × ${goodName(row.id)} · ${gold(row.cost)}`) : ['Your prepared rows have no seasonal seed purchases queued.']
    }
    case 'rancher':
    case 'animal-nurse': {
      const animals = save.ranch.animals
      return [`${animals.length} animals · ${save.ranch.silo} fodder`, animals.length ? `${Math.floor(save.ranch.silo / animals.length)} nights of feed in the silo` : 'Buy a Coop or Barn to house animals.',
        ...animals.map(animal => `${ANIMALS[animal.kind].name} · ${heartsOf(animal.fondness)} hearts · ${animal.fed ? 'Fed' : 'Needs feed'}`)]
    }
    case 'smith': {
      const tool = save.farm.toolPin ?? 'hoe'
      const tier = nextToolTier(save.tools[tool])
      return tier ? [`${TOOL_NAMES[tool]} · ${toolTierName(tier)}`, ...TOOL_RECIPES[tier].materials.map(row => `${goodCount(save.items, row.id)}/${row.count} ${goodName(row.id)}`)] : [`${TOOL_NAMES[tool]} is fully upgraded.`]
    }
    case 'garage': return TOOL_IDS.map(tool => {
      const bonus = BONUS_TOOLS.find(entry => entry === tool)
      return `${TOOL_NAMES[tool]} · ${toolTierName(save.tools[tool])} · ${toolEffect(tool, save.tools[tool])}${bonus ? ` · ${toolChargesLeft(save, bonus)} charges left` : ''}`
    })
    case 'cook': return [orderLine, `Trout Grill portions held · ${goodCount(save.items, 'dish-fish-2')}`]
    case 'cafe-host':
    case 'courier':
    case 'baker': return [orderLine]
    case 'dock-steward':
    case 'boatwright': return [...buildReport(save, 'dock'), ...buildReport(save, 'boat')]
    case 'tailor': {
      const spouses = Object.values(save.love).filter(route => route.stage === 'spouse').length
      return [`${spouses} married Umas · outfit and visit unlocks are recorded in each book.`, 'Anniversary looks follow Greater Love and the matching heirlooms.']
    }
    case 'seed-merchant':
    case 'orchard-keeper': return CROP_IDS.filter(crop => CROPS[crop].seasons.includes(season) && (id !== 'orchard-keeper' || CROPS[crop].woody))
      .map(crop => `${goodName(crop)} · ${CROPS[crop].tier === 'rare' ? 'Rare seed' : `Farm Rank ${CROPS[crop].tier}`}`)
    case 'innkeeper': return [`${innResidents(save, pack).length} Inn residents · ${pantryMeals(save)} meals in the pantry`,
      `${Object.keys(save.roster).length} Umas met · the lobby is always open.`]
    case 'musician': {
      const wins = save.farm.festivals.slice(-3).map(result => `${title(result.id)} · Place ${result.place}`)
      return wins.length ? wins : [`Farm Rank ${farmRankOf(save.farm.points)} · ${save.diary.milestones.length} milestones`, 'Festival results appear here after judging.']
    }
    case 'florist': return [orderLine, `Basil · ${goodCount(save.items, 'basil')} in stock`, 'The Flower Show uses the flowers growing on your farm.']
    case 'carpenter': return buildReport(save, save.farm.projectPin ?? 'mill')
    case 'librarian': return ['Browse the cookbook for the Trout Grill lesson and learned dishes.']
    case 'archivist': return [`Restaurant Stage ${save.workshops.restaurant?.cleared ?? 0} cleared · track exact-grade discoveries in the index.`]
    case 'bell-keeper': return CONTESTS.map(contest => `${title(contest)} · ${save.farm.festivals.find(row => row.id === contest) ? 'Results recorded' : 'See the Calendar for the next entry'}`)
    case 'woodland-guide': return FOREST_AREAS.map(area => `${AREA_NAMES[area]} · ${FOREST[area].seasons[season].filter(([, share]) => share > 0).map(([good]) => goodName(good)).join(', ')}`)
    case 'beekeeper': return [orderLine, `Honeycomb · ${goodCount(save.items, 'honeycomb')} · Honey · ${goodCount(save.items, 'honey')}`,
      ...ingredientSources('honey').map(source => source.label)]
    case 'fisher': return FISHING_SPOTS.map(spot => `${SPOT_NAMES[spot]} · ${FISHERY[spot].needs && !placeBuilt(save, FISHERY[spot].needs!) ? `Requires ${farmPlace(FISHERY[spot].needs)?.name}`
      : FISHERY[spot].seasons[season].filter(([, share]) => share > 0).map(([fish]) => goodName(fish)).join(', ')}`)
    case 'miller': return [`${loadsLeft(save, 'mill')} Mill loads left today`,
      ...stationOptions(save, 'mill').slice(0, 6).map(row => goodName(row.output)),
      ...(save.farm.stationPlans?.mill ?? []).map(row => `${goodName(row.output)} · ${goodCount(save.items, row.output)}/${row.target} target`)]
    case 'expedition-outfitter': return buildReport(save, 'expeditions')
  }
}
