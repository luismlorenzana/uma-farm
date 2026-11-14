// The work board's words: a task as the board lists it ("Water · rows 1 and 2", "Fish · the Pond", "Load the Mill",
// "Care for animals · the Coop", "Work a face · the Mine"), a
// farmhand's day ("3 actions", "+1 well fed", "half pace"), her part-time job, what she did tonight, and her aptitudes'
// levels and tricks. The morning's farmhand lines read the same words. Pure, so the board, the card and the tests agree.
import {
  APTITUDE_NAMES, AREA_NAMES, DIG_NAMES, farmPlace, FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, handJob, HOME_NAMES, isTileTask, itemNameOf, SPOT_NAMES, TASK_NAMES, townLocation,
  type FarmhandLine, type FarmTask, type HandDay, type StoryPack, type TaskKind,
} from '@farm/domain'
import { plural, theName } from '../loop/words'

/** The field's rows, 1-based, when a list of tiles is whole rows; null when it isn't. */
export function rowsOf(tiles: readonly number[]): number[] | null {
  const set = new Set(tiles)
  const rows = Array.from({ length: FIELD_ROWS }, (_, r) => r).filter((r) => set.has(r * FIELD_COLUMNS))
  const whole = rows.every((r) => Array.from({ length: FIELD_COLUMNS }, (_, c) => r * FIELD_COLUMNS + c).every((i) => set.has(i)))
  return whole && rows.length * FIELD_COLUMNS === set.size ? rows.map((r) => r + 1) : null
}
/** A row's tiles. */
export const rowTiles = (row: number): number[] => Array.from({ length: FIELD_COLUMNS }, (_, c) => (row - 1) * FIELD_COLUMNS + c)

/** A list in words: "1", "1 and 2", "1, 2 and 4". */
const listWords = (items: readonly (string | number)[]): string =>
  items.length <= 1 ? String(items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** A task's tiles in words: "the whole field", "row 2", "rows 1 and 2", or "5 tiles". */
export function tilesWords(tiles: readonly number[]): string {
  if (new Set(tiles).size === FIELD_TILES) return 'the whole field'
  const rows = rowsOf(tiles)
  if (rows) return rows.length === 1 ? `row ${rows[0]}` : `rows ${listWords(rows)}`
  return plural(tiles.length, 'tile')
}

/** A task as the board lists it. */
export function taskWords(task: FarmTask): string {
  switch (task.kind) {
    case 'load': return `Load ${theName(farmPlace(task.station)?.name ?? task.station)}`
    case 'forage': case 'chop': return `${TASK_NAMES[task.kind]} · ${theName(AREA_NAMES[task.area])}`
    case 'fish': return `Fish · ${theName(SPOT_NAMES[task.spot])}`
    case 'care': return `${TASK_NAMES.care} · the ${HOME_NAMES[task.home]}`
    case 'mine': return `${TASK_NAMES.mine} · the ${DIG_NAMES[task.dig]}`
    case 'plant': return `Plant${task.crop ? ` ${itemNameOf(task.crop)}` : ''} · ${tilesWords(task.tiles)}`
    default: return `${TASK_NAMES[task.kind]} · ${tilesWords(task.tiles)}`
  }
}

/** Whether a task stops when it's done for the day (the field's, a load, the animals' care) or runs on (her gathering
 * and digging). */
export const runsOn = (task: FarmTask): boolean => !isTileTask(task) && task.kind !== 'load' && task.kind !== 'care'

/** Her day in words beside her actions: settled in, married, well fed this morning, half pace. */
export function dayChips(day: HandDay): string[] {
  return [
    ...(day.settled > 0 ? [`+${day.settled} settled in`] : []), ...(day.spouse > 0 ? [`+${day.spouse} married`] : []),
    ...(day.fed > 0 ? [`+${day.fed} well fed`] : []), ...(day.half ? ['half pace'] : []),
  ]
}

/** Her part-time job in words: the story's ("Waits tables", else "Works at the Bakery"), else the game's default near
 * her favourite spot ("Helps out at the Café"), else "A job in town". */
export function jobWords(pack: Pick<StoryPack, 'cast'> & Partial<Pick<StoryPack, 'town' | 'master'>>, id: string): string {
  const job = handJob(pack, id)
  const named = job.at ? townLocation(pack, job.at)?.name ?? null : null
  const place = named ? named.replace(/^The /, 'the ') : null
  if (job.own) return job.what ?? (place ? `Works at ${place}` : 'A job in town')
  return place ? `Helps out at ${place}` : 'A job in town'
}

/** What she did, by task, in the board's order. */
const DONE_ORDER: readonly TaskKind[] = ['harvest', 'water', 'plant', 'till', 'load', 'care', 'forage', 'chop', 'fish', 'mine']
export function doneWords(done: Partial<Record<TaskKind, number>>): string[] {
  const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`)
  return DONE_ORDER.flatMap((kind) => {
    const n = done[kind]
    if (!n) return []
    switch (kind) {
      case 'harvest': return [`harvested ${plural(n, 'tile')}`]
      case 'water': return [`watered ${plural(n, 'tile')}`]
      case 'plant': return [`planted ${plural(n, 'tile')}`]
      case 'till': return [`cleared or tilled ${plural(n, 'tile')}`]
      case 'load': return [`started ${plural(n, 'load')}`]
      case 'forage': return [`foraged ${times(n)}`]
      case 'chop': return [`chopped ${times(n)}`]
      case 'fish': return [`caught ${plural(n, 'fish', 'fish')}`]
      case 'care': return [`tended animals ${times(n)}`]
      case 'mine': return [`worked ${plural(n, 'face')}`]
    }
  })
}

/** A farmhand's night in words, as the morning and the board's "Tonight" say it: her actions spent, what she did and the
 * goods it brought; with none spent, "No tasks: set her tasks" or "Nothing to do tonight". */
export function nightWords(line: FarmhandLine): string {
  if (line.spent === 0) return line.tasks === 0 ? 'No tasks: set her tasks' : 'Nothing to do tonight'
  const did = doneWords(line.done)
  return [`${line.spent} of ${plural(line.actions, 'action')}`, ...did, ...(line.items > 0 ? [`+${plural(line.items, 'good')}`] : [])].join(' · ')
}

/** An aptitude's name and level: "Watering 3". */
export const aptitudeWords = (id: keyof typeof APTITUDE_NAMES, level: number): string => `${APTITUDE_NAMES[id]} ${level}`
