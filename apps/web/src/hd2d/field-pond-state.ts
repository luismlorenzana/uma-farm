import {
  actionsLeft, crewShiftEnabled, cropLook, dateOf, dayActions, fieldCounts, handsTonight, MORNING_ACTIONS, taskPlace,
  type WorkedOrder,
  type CropId, type CropLook, type FarmhandLine, type FarmSave, type FarmTask, type Ground, type Season, type StoryPack, type TalentOf,
} from '@farm/domain'

export const BAND_WORK = ['fields', 'forest', 'fishery', 'bin'] as const
export type BandWork = typeof BAND_WORK[number]
export type BandPlace = BandWork | 'farmhouse'

export interface BandTile { ground: Ground; crop: CropId | null; look: CropLook | null; watered: boolean }
export interface BandHand { id: string; job: FarmTask['kind']; place: BandWork }
export interface BandState {
  season: Season
  dusk: boolean
  tiles: BandTile[]
  plots: number
  counts: ReturnType<typeof fieldCounts>
  crew: Record<BandWork, BandHand[]>
  lastNight: boolean
}

const SPOTS: Record<BandWork, number> = { fields: 3, forest: 1, fishery: 1, bin: 1 }

/** The slice contains the main woods and pond. The work board can send a hand beyond it. */
function bandWork(task: FarmTask): BandWork | null {
  if (task.kind === 'fish' && task.spot !== 'pond') return null
  if ((task.kind === 'forage' || task.kind === 'chop') && task.area !== 'woods') return null
  if (task.kind === 'ship-surplus') return 'bin'
  const at = taskPlace(task)
  return at === 'fields' || at === 'forest' || at === 'fishery' ? at : null
}

function worker(save: FarmSave, line: FarmhandLine, actualPlace?: string): BandHand | null {
  const tasks = save.roster[line.id]?.tasks ?? []
  const done = tasks.filter((task) => (line.done[task.kind] ?? 0) > 0)
  // The report aggregates by task kind. When several locations share a kind, a pose would imply a location the report
  // can't distinguish. Only display that action when all matching board tasks point to this slice.
  const available = done.filter((task) => {
    const at = bandWork(task)
    return at !== null && (!actualPlace || at === actualPlace)
      && done.every((other) => other.kind !== task.kind || bandWork(other) === at)
  })
  const task = available.reduce<FarmTask | undefined>((best, candidate) =>
    !best || line.done[candidate.kind]! > line.done[best.kind]! ? candidate : best, undefined)
  const place = task && bandWork(task)
  return task && place ? { id: line.id, place, job: task.kind } : null
}

const BAND_JOB: Readonly<Record<string, Pick<BandHand, 'job' | 'place'>>> = {
  'harvest:0': { job: 'harvest', place: 'fields' },
  'till:0': { job: 'till', place: 'fields' },
  'plant:0': { job: 'plant', place: 'fields' },
  'water:0': { job: 'water', place: 'fields' },
  'forage:woods': { job: 'forage', place: 'forest' },
  'chop:woods': { job: 'chop', place: 'forest' },
  'fish:pond': { job: 'fish', place: 'fishery' },
  'ship-surplus': { job: 'ship-surplus', place: 'bin' },
}

function fromReceipt(jobs: readonly WorkedOrder[]): BandHand[] {
  const hands = new Map<string, { hand: BandHand; actions: number }>()
  for (const { id, key, actions } of jobs) {
    const job = BAND_JOB[key]
    if (job && actions > (hands.get(id)?.actions ?? 0)) hands.set(id, { hand: { id, ...job }, actions })
  }
  return [...hands.values()].map(row => row.hand)
}

/** A read-only projection. Morning shifts use their recorded job and destination, including automatic orders. */
export function fieldPondState(save: FarmSave, story: StoryPack | null, talentOf: TalentOf): BandState {
  const lastNight = save.summary?.day === save.calendar.day
  const crew: BandState['crew'] = { fields: [], forest: [], fishery: [], bin: [] }
  const add = (hand: BandHand | null) => { if (hand) crew[hand.place].push(hand) }
  if (crewShiftEnabled(save)) {
    if (save.today.actions < MORNING_ACTIONS) {
      const receipt = save.today.crew ?? handsTonight(save, save, talentOf, story)
      if (receipt.jobs) fromReceipt(receipt.jobs).forEach(add)
      else for (const line of receipt.lines) add(worker(save, line))
    }
  } else if (lastNight) {
    for (const line of save.summary?.work ?? []) if (line.kind === 'farmhand') add(worker(save, line))
  } else if (Object.values(save.roster).some((uma) => uma.farmhand !== undefined && uma.tasks?.length)) {
    const plan = handsTonight(save, save, talentOf, story)
    const locations = new Map(plan.worked.map(({ outfitId, place }) => [outfitId, place as string]))
    for (const { outfitId } of plan.tended) locations.set(outfitId, 'fields')
    for (const line of plan.lines) add(worker(save, line, locations.get(line.id)))
  }
  return {
    season: dateOf(save.calendar.day, save.calendar).season,
    dusk: actionsLeft(save) <= Math.floor(dayActions(save) / 4),
    tiles: (save.fields.plots[0]?.tiles ?? []).map((tile) => ({
      ground: tile.ground, crop: tile.crop, look: cropLook(tile), watered: tile.watered,
    })),
    plots: save.fields.plots.length,
    counts: fieldCounts(save),
    crew,
    lastNight,
  }
}

export const visibleHands = (view: BandState): BandHand[] =>
  BAND_WORK.flatMap((place) => view.crew[place].slice(0, SPOTS[place]))
