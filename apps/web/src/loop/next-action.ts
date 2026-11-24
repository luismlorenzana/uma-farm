import {
  actionsLeft, ANIMALS, animalLock, BUILD_PLACES, buildLock, FULL_HAULS, haulsToday, reachList, readyTiles, surplusCrate,
  supplySource, type FarmSave, type SupplyGoal,
} from '@farm/domain'
import { binView, warehouseTabs } from './goods-view'

export interface NextAction {
  title: string
  detail: string
  label: string
  to: string
}

interface NextContext {
  event?: { id: string; name: string; wedding: boolean }
  nightVisits?: boolean
  needsWork?: boolean
  crewShips?: boolean
  ripeAfterCrew?: number
  tracked?: SupplyGoal
}

export function nextAction(save: FarmSave, staffed: number, automated: number, context: NextContext = {}): NextAction {
  const queued = binView(save).total
  const pending = queued > 0 ? `${queued.toLocaleString('en-US')}g is queued in the Shipping Bin.` : ''
  const pinned = BUILD_PLACES.find(project => project.id === save.farm.projectPin)
  const projectLock = pinned ? buildLock(save, pinned.id) : undefined
  const event = context.event
  if (event?.wedding && (actionsLeft(save) > 0 || save.today.eventActions > 0)) return {
    title: `Wedding with ${event.name}`, detail: 'Her wedding scene is ready today.',
    label: 'Open the wedding scene', to: `/hearts?uma=${event.id}&event=${event.id}`,
  }
  if (pinned && projectLock === null) return {
    title: `Build the ${pinned.name}`, detail: 'You have the gold and materials for the project you pinned.',
    label: 'View the build', to: '/?peek=' + pinned.id,
  }
  if (actionsLeft(save) && !context.crewShips && surplusCrate(save, true).length) return {
    title: 'Ship goods you can spare', detail: 'Use the suggested surplus crate. It keeps the supplies reserved for your farm.',
    label: 'Open the Shipping Bin', to: '/?sheet=bin',
  }
  if (event && !actionsLeft(save) && save.today.eventActions) return {
    title: `See ${event.name}’s next scene`, detail: 'You still have an event action today.',
    label: 'Open her event', to: `/hearts?uma=${event.id}&event=${event.id}`,
  }
  if (!actionsLeft(save) && context.nightVisits) return {
    title: 'Spend time with a spouse', detail: 'Night visits build Greater Love and unlock memories in her book.',
    label: 'Open night visits', to: '/?visits=1',
  }
  if (!actionsLeft(save)) return {
    title: 'Finish the day', detail: pending || 'Turn in to get a fresh set of actions tomorrow.',
    label: 'End the day', to: '/?sheet=end',
  }
  const ready = context.ripeAfterCrew ?? readyTiles(save)
  if (ready > 0) return {
    title: 'Harvest ripe crops', detail: `${ready} ready. Harvest them now and check the Shipping Bin for any you can spare.`,
    label: 'Go to the Fields', to: '/field?plot=' + (save.fields.plots.findIndex(plot => plot.tiles.some(tile => tile.ready)) + 1),
  }
  if (staffed > 0 && automated === 0) return {
    title: 'Set up automatic crew work', detail: 'Enable auto-work on the Work Board to let your crew fill open jobs around their existing orders.',
    label: 'Open the Work Board', to: '/book?view=work',
  }
  if (pinned && projectLock?.by === 'short') {
    const line = projectLock.goods[0]
    if (line?.goods.family === 'woods' && !line.goods.refined) return {
      title: `Gather logs for the ${pinned.name}`, detail: `${line.goods.count - line.have} more needed. Chop at the Woods or give the crew a chopping order.`,
      label: 'Go to the Woods', to: '/?peek=forest&spot=woods',
    }
  }
  const goal = context.tracked
  if (goal && save.forge?.crewGoal !== goal.key) {
    const material = goal.lines.find(line => line.held < line.count)
    if (material) {
      const source = supplySource(save, material.id)
      return { title: `Gather for ${goal.title}`, detail: `${material.count - material.held} ${material.name} needed. ${source.detail}.`,
        label: 'Open the source', to: source.to }
    }
  }
  if (projectLock?.by !== 'short' && save.ranch.animals.length === 0 && !animalLock(save, 'chicken') && save.gold >= ANIMALS.chicken.price) return {
    title: 'Buy your first chicken', detail: 'The Coop is ready. Get a chicken and make sure the silo has fodder for its daily care.',
    label: 'Visit the Rancher', to: '/town?at=rancher&sheet=rancher',
  }
  if (projectLock?.by !== 'short' && save.ranch.animals.length === 0 && buildLock(save, 'coop') === null) return {
    title: 'Build a Coop', detail: 'You have the gold and materials. A Coop opens chickens and a source of eggs.',
    label: 'View the Coop', to: '/?peek=coop',
  }
  if (context.needsWork) return {
    title: 'Cover the open farm work', detail: 'Check which crops or animals still need attention after the crew’s orders.',
    label: 'Open the Work Calendar', to: '/book?view=work&workCalendar=1',
  }
  if (event) return {
    title: `See ${event.name}’s next scene`, detail: 'Her next relationship event is ready today.',
    label: 'Open her event', to: `/hearts?uma=${event.id}&event=${event.id}`,
  }
  if (staffed > 0 || save.today.crew?.lines.length) {
    const project = BUILD_PLACES.find(row => buildLock(save, row.id) === null)
    if (project) return { title: `Build the ${project.name}`, detail: project.blurb, label: 'View the build', to: '/?peek=' + project.id }
    if (save.farm.owed > 0) return { title: 'Review today’s bills', detail: 'Check food, upkeep and repayments before adding another expense.',
      label: 'Open farm accounts', to: '/book' }
    return { title: 'Use your time in town', detail: 'Meet an Uma, advance a relationship, or check the requests board.',
      label: 'Go to town', to: '/town' }
  }
  const catchToSell = warehouseTabs(save).find(tab => tab.shelf === 'fish')?.rows.find(row => row.sells)
  if (queued === 0 && catchToSell) return {
    title: 'Put a catch in the Shipping Bin', detail: 'Pick a fish you can spare and confirm the shipment. Keep any catch you need for meals.',
    label: 'Choose a fish to ship', to: '/warehouse?pick=bin&good=' + encodeURIComponent(catchToSell.id),
  }
  const available = (place: 'fishery' | 'forest') => reachList(save, place).filter(row => !row.lock)
    .sort((a, b) => haulsToday(save, a.id) - haulsToday(save, b.id) || b.rank - a.rank)[0]
  const spot = available('fishery')
  const woods = available('forest')
  if (spot && (!woods || haulsToday(save, spot.id) < FULL_HAULS || haulsToday(save, spot.id) <= haulsToday(save, woods.id))) return {
    title: `Fish for shipping gold at ${spot.name}`, detail: pending || 'Fishing costs 1 action. Then open the Shipping Bin and pick the catch you can spare. It pays overnight.',
    label: `Go to ${spot.name}`, to: '/?peek=fishery&spot=' + spot.id,
  }
  return {
    title: 'Forage for shipping gold', detail: pending || 'Forage for 1 action, then ship a wild find you can spare. It pays overnight.',
    label: `Go to ${woods?.name ?? 'the Woods'}`, to: '/?peek=forest&spot=' + (woods?.id ?? 'woods'),
  }
}