import {
  actionsLeft, ANIMALS, animalLock, BUILD_PLACES, buildLock, FULL_HAULS, haulsToday, reachList, readyTiles, surplusCrate,
  type FarmSave,
} from '@farm/domain'
import { binView, warehouseTabs } from './goods-view'

export interface NextAction {
  title: string
  detail: string
  label: string
  to: string
}

export function nextAction(save: FarmSave, staffed: number, automated: number): NextAction {
  const queued = binView(save).total
  const pending = queued > 0 ? `${queued.toLocaleString('en-US')}g is queued in the Shipping Bin.` : ''
  const pinned = BUILD_PLACES.find(project => project.id === save.farm.projectPin)
  const projectLock = pinned ? buildLock(save, pinned.id) : undefined
  if (pinned && projectLock === null) return {
    title: `Build the ${pinned.name}`, detail: 'You have the gold and materials for the project you pinned.',
    label: 'View the build', to: '/?peek=' + pinned.id,
  }
  if (surplusCrate(save, true).length) return {
    title: 'Ship goods you can spare', detail: 'Use the suggested surplus crate. It keeps the supplies reserved for your farm.',
    label: 'Open the Shipping Bin', to: '/?sheet=bin',
  }
  if (!actionsLeft(save)) return {
    title: 'Finish the day', detail: pending || 'Turn in to get a fresh set of actions tomorrow.',
    label: 'End the day', to: '/?sheet=end',
  }
  const ready = readyTiles(save)
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
  if (projectLock?.by !== 'short' && save.ranch.animals.length === 0 && !animalLock(save, 'chicken') && save.gold >= ANIMALS.chicken.price) return {
    title: 'Buy your first chicken', detail: 'The Coop is ready. Get a chicken and make sure the silo has fodder for its daily care.',
    label: 'Visit the Rancher', to: '/town?at=rancher&sheet=rancher',
  }
  if (projectLock?.by !== 'short' && save.ranch.animals.length === 0 && buildLock(save, 'coop') === null) return {
    title: 'Build a Coop', detail: 'You have the gold and materials. A Coop opens chickens and a source of eggs.',
    label: 'View the Coop', to: '/?peek=coop',
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