import { buildGoodsWords, buildNeeds, type BuildNeed } from './builds'
import { farmRankOf } from './farm'
import { BUILD_PLACES, farmPlace, isBuildPlace, placeBuilt, type BuildPlace } from './places'
import { dateOf } from './calendar'
import { digFloor, digFloorLock, floorRank, gradeAt, reachFloor } from '../gathering/digs'
import { FULL_HAULS, haulsToday, reachList, reachLock } from '../gathering/hauls'
import { FISHING_SPOTS, FOREST_AREAS, STATION_JOBS, stationJobLevel, stationJobOf, stationJobUnits, type FishingSpotId, type ForestAreaId, type StationId } from '../gathering/ids'
import { FISHERY, FOREST } from '../gathering/tables'
import { GOODS, goodOf } from '../goods/ids'
import { goodName } from '../goods/names'
import { HEIRLOOMS, TOOL_NAMES, TOOL_RECIPES, rackRecipe, toolTierName, type ForgeMaterial } from '../forge/catalogue'
import { forgeState, heirloomOf, nextToolTier } from '../forge/state'
import { missingRecipeProofs, restaurantRecipe } from '../restaurant/recipes'
import type { FarmSave, FarmTask, StationTarget } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'

interface SupplyLine extends ForgeMaterial {
  name: string
  held: number
  target: number
  queued: number
}

export interface SupplyGoal {
  key: string
  title: string
  to: string
  gold: number
  lines: SupplyLine[]
  discovery?: number
}

function queued(save: FarmSave, id: string) {
  return Object.values(save.loads).flat().reduce((sum, load) =>
    parseStockKey(load.item)?.id === id ? sum + load.count : sum, 0)
}

const woods = GOODS.filter(good => good.family === 'woods')
const plankRecipes = woods.filter(good => good.refined && good.input)

function buildLine(save: FarmSave, { goods, have }: BuildNeed): SupplyLine[] {
  const plank = goods.family === 'woods' && goods.refined
  const preferred = plank ? plankRecipes.find(({ id, input }) => input
    && stationJobLevel(id) <= (save.buildings.sawmill ?? 1)
    && goodCount(save.items, input) > (save.farm.reserves?.[input] ?? 0)) : undefined
  const id = preferred?.id ?? GOODS.find(good => good.family === goods.family && good.refined === goods.refined)?.id
  if (!id) return []
  const exactQueue = queued(save, id)
  const inProcess = plank ? plankRecipes.reduce((total, recipe) => total + queued(save, recipe.id), 0) : exactQueue
  return [{ id, name: buildGoodsWords(goods), count: goods.count, held: have,
    target: goodCount(save.items, id) + exactQueue + Math.max(0, goods.count - have - inProcess), queued: inProcess }]
}

export function lumberGoal(save: FarmSave): (SupplyGoal & { project: BuildPlace }) | undefined {
  const rank = farmRankOf(save.farm.points)
  const sawmill = BUILD_PLACES.find(project => project.id === 'sawmill')!
  if (rank < sawmill.opens.rank) return undefined
  const remaining = (project: BuildPlace) => !placeBuilt(save, project.id) && !save.farm.builds.includes(project.id)
  if (save.farm.builds.includes(sawmill.id)) return undefined
  const pinned = BUILD_PLACES.find(project => project.id === save.farm.projectPin && remaining(project)
    && project.opens.cost.goods.some(line => line.family === 'woods'))
  const next = BUILD_PLACES.find(project => project.opens.game && project.opens.rank <= rank + 1 && remaining(project)
    && (!project.opens.after || placeBuilt(save, project.opens.after))
    && project.opens.cost.goods.some(line => line.family === 'woods' && line.refined))
  const project = !placeBuilt(save, sawmill.id) ? sawmill : pinned ?? next
  if (!project) return undefined
  return { project, key: 'build:' + project.id, title: project.name, to: '/?peek=' + project.id,
    gold: project.opens.cost.gold, lines: buildNeeds(save, project).filter(line => line.goods.family === 'woods').flatMap(line => buildLine(save, line)) }
}

export function automaticLumberGoal(save: FarmSave) {
  if (!Object.values(save.roster).some(uma => uma.farmhand && uma.autoWork) || selectedSupplyGoal(save)) return undefined
  return lumberGoal(save)
}

export function supplyGoals(save: FarmSave): SupplyGoal[] {
  const goals: SupplyGoal[] = []
  const exact = (materials: readonly ForgeMaterial[]): SupplyLine[] => materials.map(row => ({
    ...row, name: goodName(row.id), held: goodCount(save.items, row.id), target: row.count, queued: queued(save, row.id),
  }))
  const pin = farmPlace(save.farm.projectPin ?? '')
  if (isBuildPlace(pin) && !placeBuilt(save, pin.id) && !save.farm.builds.includes(pin.id)) {
    goals.push({ key: 'build:' + pin.id, title: pin.name, to: '/?peek=' + pin.id, gold: pin.opens.cost.gold,
      lines: buildNeeds(save, pin).flatMap(line => buildLine(save, line)),
    })
  }
  const rack = save.forge?.rackGoal
  const tool = rack?.tool ?? save.farm.toolPin
  const from = tool ? rack?.fromTier ?? save.tools[tool] : undefined
  const tier = from && nextToolTier(from)
  if (tool && tier && save.forge?.tool?.tool !== tool) {
    const recipe = rack ? rackRecipe(tool, tier) : TOOL_RECIPES[tier]
    goals.push({ key: `tool:${tool}:${tier}`, title: `${toolTierName(tier)} ${TOOL_NAMES[tool]}`, gold: recipe.gold,
      to: '/?sheet=forge&tool=' + tool + (rack ? '&from=' + rack.fromTier : ''), lines: exact(recipe.materials) })
  }
  const heirloom = save.forge?.tracked
  if (heirloom && !heirloomOf(save, heirloom.recipient, heirloom.piece)) {
    const recipe = HEIRLOOMS[heirloom.piece]
    goals.push({ key: `jewel:${heirloom.recipient}:${heirloom.piece}`, title: recipe.name,
      to: `/?sheet=forge&tab=heirlooms&recipient=${heirloom.recipient}&piece=${heirloom.piece}`, gold: recipe.gold, lines: exact(recipe.materials) })
  }
  const dish = restaurantRecipe(save.farm.recipePin ?? '')
  if (dish) goals.push({ key: 'recipe:' + dish.id, title: dish.name, to: '/?sheet=restaurant&recipes=1', gold: 0,
    lines: exact(dish.ingredients), discovery: missingRecipeProofs(save, dish).length })
  return goals
}

export function setCrewSupplyGoal<S extends FarmSave>(save: S, key: string): S {
  if (!supplyGoals(save).some(goal => goal.key === key)) return save
  const { crewGoal, ...forge } = forgeState(save)
  return { ...save, forge: crewGoal === key ? forge : { ...forge, crewGoal: key } }
}

function selectedSupplyGoal(save: FarmSave) {
  const key = save.forge?.crewGoal
  return key ? supplyGoals(save).find(goal => goal.key === key) : undefined
}

const assignedGoal = (save: FarmSave) => selectedSupplyGoal(save) ?? automaticLumberGoal(save)

export function goalInputs(save: FarmSave): Record<string, number> {
  const goal = assignedGoal(save)
  const needed: Record<string, number> = {}
  if (!goal) return needed
  for (const row of goal.lines) {
    const count = Math.max(0, row.count - row.held - row.queued)
    const input = goodOf(row.id)?.input
    if (input && count) needed[input] = (needed[input] ?? 0) + count * stationJobUnits(row.id)
  }
  return needed
}

export function crewStationTargets(save: FarmSave, station: StationId): StationTarget[] | undefined {
  const configured = save.farm.stationPlans?.[station]
  const goal = assignedGoal(save)
  if (!goal) return configured
  const additions = goal.lines.flatMap(row => {
    return stationFor(row.id) === station && row.held < row.count ? [{ output: row.id, target: row.target }] : []
  })
  if (!additions.length) return configured
  const combined = new Map((configured ?? []).map(row => [row.output, row.target]))
  for (const row of additions) combined.set(row.output, Math.max(row.target, combined.get(row.output) ?? 0))
  return [...combined].map(([output, target]) => ({ output, target }))
}

function stationFor(id: string): StationId | undefined {
  const job = stationJobOf(id)
  return job ? STATION_JOBS[job].station : undefined
}

export function supplySource(save: FarmSave, id: string, fullHaulsOnly = false): { task?: FarmTask; detail: string; to: string } {
  const good = goodOf(id)
  if (!good) return { detail: 'Prepare the component recipe', to: '/?peek=restaurant' }
  const maker = good.input ? stationFor(id) : undefined
  if (maker) {
    const name = farmPlace(maker)?.name
    const level = stationJobLevel(id)
    return {
      detail: !placeBuilt(save, maker) ? `Build the ${name}`
        : (save.buildings[maker] ?? 0) < level ? `${name} level ${level} required` : `${name} · from ${goodName(good.input!)}`,
      to: '/?peek=' + maker + '&output=' + id,
    }
  }
  if (good.family === 'ores' || good.family === 'stones' || good.family === 'crystals') {
    const dig = good.family === 'ores' ? 'mine' : 'quarry'
    const to = '/?peek=' + dig
    const floor = Math.max(1, (good.grade - 1) * 3 + 1)
    if (!placeBuilt(save, dig)) return { detail: 'Build the ' + farmPlace(dig)?.name, to }
    const current = digFloor(save.places[dig])
    if (gradeAt(reachFloor(save)) + 1 < good.grade) return { detail: `Farm Rank ${floorRank(floor)} for this grade`, to }
    const task: FarmTask = current < floor
      ? { kind: 'mine', dig }
      : { kind: 'mine', dig, ...(gradeAt(current) === good.grade ? {} : { floor }) }
    return { ...(digFloorLock(save, dig) || (fullHaulsOnly && haulsToday(save, dig) >= FULL_HAULS) ? {} : { task }),
      detail: current < floor ? `Descend toward floor ${floor}` : `Work floor ${'floor' in task ? task.floor : current}`, to }
  }
  if (good.crop) return { detail: 'Grow the required crop grade', to: '/field' }
  if (['eggs-milk', 'fibers'].includes(good.family)) return { detail: 'Raise the right animals', to: '/town?at=rancher&sheet=rancher' }
  const season = dateOf(save.calendar.day, save.calendar).season
  const fish = good.family === 'fish'
  const place = fish ? 'fishery' : 'forest'
  const match = (fish ? FISHING_SPOTS : FOREST_AREAS).flatMap(area => {
    const row = fish ? FISHERY[area as FishingSpotId] : FOREST[area as ForestAreaId]
    const share = row.seasons[season].find(([kind]) => kind === (good.base ?? id))?.[1]
    return share ? [{ area, share }] : []
  }).sort((a, b) => b.share - a.share)
  const pick = match.find(({ area }) => !reachLock(save, place, area) && (!fullHaulsOnly || haulsToday(save, area) < FULL_HAULS))
  const area = pick?.area ?? match[0]?.area
  const job = good.family === 'woods' ? 'chop' : 'forage'
  const task: FarmTask | undefined = !pick || (good.base && good.base !== id) ? undefined : fish
    ? { kind: 'fish', spot: pick.area as FishingSpotId, mode: 'standard' }
    : { kind: job, area: pick.area as ForestAreaId }
  const detail = area ? reachLock(save, place, area) ?? (good.base ? 'Use the higher-grade catch mode' : fish ? 'Fish here this season' : job === 'chop' ? 'Chop here' : 'Forage here this season')
    : 'Check another season or source'
  return { task, detail, to: '/?peek=' + place + (area ? '&spot=' + area : '') }
}

export function crewSupplyJobs(save: FarmSave): FarmTask[] {
  const goal = assignedGoal(save)
  if (!goal) return []
  const inputs = goalInputs(save)
  for (const row of goal.lines) {
    if (!goodOf(row.id)?.input && row.held < row.count) inputs[row.id] = Math.max(inputs[row.id] ?? 0, row.target)
  }
  const tasks = Object.entries(inputs).flatMap(([id, count]) => {
    if (goodCount(save.items, id) - (save.farm.reserves?.[id] ?? 0) >= count) return []
    const { task } = supplySource(save, id, true)
    return task ? [task] : []
  })
  if (!tasks.length && save.forge?.crewGoal === goal.key && save.gold < goal.gold) {
    const spot = reachList(save, 'fishery').filter(row => !row.lock && haulsToday(save, row.id) < FULL_HAULS)
      .sort((a, b) => b.rank - a.rank)[0]
    if (spot) tasks.push({ kind: 'fish', spot: spot.id as FishingSpotId })
  }
  return tasks
}