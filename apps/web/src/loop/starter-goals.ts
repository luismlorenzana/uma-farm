import { GOLD_SHIPPED, HOME_COUNT, LOGS_CHOPPED, TILES_HARVESTED, TILES_PLANTED, TILES_CLEARED, type FarmSave } from '@farm/domain'

/** Small starter targets read existing lifetime counts, so an old save gets credit for its earlier work. */
export function starterGoals(save: FarmSave) {
  const counts = save.farm.counts
  const chopped = counts[LOGS_CHOPPED] ?? 0
  return [
    { id: 'plant', label: 'Plant 6 crops', place: 'Fields', detail: 'Hoe the cleared patch and use the starter Carrot seeds or other seasonal seeds.', have: counts[TILES_PLANTED] ?? 0, target: 6, to: '/field', key: 'plant:0' },
    { id: 'harvest', label: 'Harvest 6 crop tiles', place: 'Fields', detail: 'Water growing crops on dry days. Check what’s ripe in the Fields.', have: counts[TILES_HARVESTED] ?? 0, target: 6, to: '/field', key: 'harvest:0' },
    { id: 'forage', label: 'Bring home 6 wild finds', place: 'Woods', detail: 'Forage the Woods for food and goods to sell.', have: Math.max(0, (counts[HOME_COUNT.forest] ?? 0) - chopped), target: 6, to: '/?peek=forest', key: 'forage:woods' },
    { id: 'fish', label: 'Catch 4 fish', place: 'Pond', detail: 'Fish at the Pond. Save some for meals or ship them for gold.', have: counts[HOME_COUNT.fishery] ?? 0, target: 4, to: '/?peek=fishery', key: 'fish:pond' },
    { id: 'chop', label: 'Chop 10 logs', place: 'Woods', detail: 'Keep logs in the Warehouse to pay for farm buildings.', have: chopped, target: 10, to: '/?peek=forest', key: 'chop:woods' },
    { id: 'clear', label: 'Clear 3 overgrown tiles', place: 'Fields', detail: 'Make room for the next round of crops.', have: counts[TILES_CLEARED] ?? 0, target: 3, to: '/field', key: 'till:0' },
    { id: 'ship', label: 'Ship 500g in goods', place: 'Bin', detail: 'The bin pays at the end of the day. First shipments also earn Farm Rank points.', have: counts[GOLD_SHIPPED] ?? 0, target: 500, to: '/?sheet=bin', key: 'ship-surplus' },
  ]
}
