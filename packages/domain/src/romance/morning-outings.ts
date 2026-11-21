/** Morning outings use the existing games and their own conversation scenes. */
export const MORNING_OUTINGS = [
  { id: 'morning-walk', name: 'Morning walk', play: 'walk' },
  { id: 'breakfast', name: 'Breakfast together', play: 'picnic' },
  { id: 'tea-by-the-pond', name: 'Tea by the pond', play: 'picnic' },
  { id: 'flower-market', name: 'Flower market', play: 'market' },
  { id: 'sunrise-sketch', name: 'Sunrise sketch', play: 'crafting' },
  { id: 'bakery-stop', name: 'Bakery stop', play: 'market' },
] as const

export type MorningOuting = typeof MORNING_OUTINGS[number]['id']
export const MORNING_KINDS = MORNING_OUTINGS.map(({ id }) => id)
export const isMorningOuting = (id: string): id is MorningOuting => MORNING_KINDS.some(kind => kind === id)
export const MORNING_SCENES = MORNING_KINDS.flatMap(kind => [`hangout-${kind}`, `date-${kind}`])
