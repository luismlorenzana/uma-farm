// The work board's words: a task as the board lists it ("Water · rows 1 and 2", "Water · plot 2, row 1" once the farm has
// more than one plot, "Fish · the Pond", "Load the Mill",
// "Care for animals · the Coop", "Work a face · the Mine", "Cook · the farmhouse kitchen"), a
// farmhand's day ("3 actions", "+1 well fed", "half pace"), her part-time job, what she did tonight, and her aptitudes'
// levels and tricks. The morning's farmhand lines read the same words. Pure, so the board, the card and the tests agree.
import {
  APTITUDE_NAMES, AREA_NAMES, DIG_NAMES, farmPlace, FIELD_COLUMNS, FIELD_ROWS, FIELD_TILES, handJob, HOME_NAMES, isTileTask, itemNameOf, SPOT_NAMES, TASK_NAMES, taskPlot, townLocation,
  FISH_MODE_NAMES, OPEN_TASKS,
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

/** A task's tiles in words: "the whole field", "row 2", "rows 1 and 2", or "5 tiles". On a farm of more than one plot
 * (`plot`, its index, given), with its plot: "all of plot 2", "plot 2, rows 1 and 2", "plot 1, 5 tiles". */
export function tilesWords(tiles: readonly number[], plot: number | null = null): string {
  const of = plot === null ? '' : `plot ${plot + 1}, `
  if (new Set(tiles).size === FIELD_TILES) return plot === null ? 'the whole field' : `all of plot ${plot + 1}`
  const rows = rowsOf(tiles)
  if (rows) return `${of}${rows.length === 1 ? `row ${rows[0]}` : `rows ${listWords(rows)}`}`
  return `${of}${plural(tiles.length, 'tile')}`
}

/** A task as the board lists it; a field task names its plot once the farm has more than one (`plots`). */
export function taskWords(task: FarmTask, plots = 1): string {
  const where = (t: Extract<FarmTask, { tiles: number[] }>) => tilesWords(t.tiles, plots > 1 || taskPlot(t) > 0 ? taskPlot(t) : null)
  switch (task.kind) {
    case 'load': return `Load ${theName(farmPlace(task.station)?.name ?? task.station)}`
    case 'forage': case 'chop': return `${TASK_NAMES[task.kind]} · ${theName(AREA_NAMES[task.area])}`
    case 'fish': return `Fish · ${theName(SPOT_NAMES[task.spot])}${task.mode ? ` · ${FISH_MODE_NAMES[task.mode]}` : ''}`
    case 'care': return `${task.feedOnly ? 'Feed only' : TASK_NAMES.care} · the ${HOME_NAMES[task.home]}`
    case 'mine': return `${TASK_NAMES.mine} · the ${DIG_NAMES[task.dig]}${task.floor ? ` · Floor ${task.floor}` : ''}`
    case 'cook': return `${TASK_NAMES.cook} · ${KITCHEN}`
    case 'ship-surplus': return TASK_NAMES[task.kind]
    case 'save-seed': return `Save ${itemNameOf(task.crop ?? 'carrot')} seed · G${task.grade}${task.improve ? ` → G${task.grade + 1}` : ''} · keep ${task.target}`
    case 'plant': return `Plant${task.crop ? ` ${itemNameOf(task.crop)}` : ''} · ${where(task)}`
    default: return `${TASK_NAMES[task.kind]} · ${where(task)}`
  }
}

/** Whether a task stops when it's done for the day (the field's, a load, the animals' care, the cooking) or runs on (her
 * gathering and digging). */
export const runsOn = (task: FarmTask): boolean => OPEN_TASKS.includes(task.kind)

/** Where the farm cooks until the Kitchen stands. */
export const KITCHEN = 'the farmhouse kitchen'

/** Her day in words beside her actions: settled in, married, well fed this morning, half pace, and one of them the
 * Kitchen's play's when she assists it today. */
export function dayChips(day: HandDay): string[] {
  return [
    ...(day.settled > 0 ? [`+${day.settled} settled in`] : []), ...(day.spouse > 0 ? [`+${day.spouse} married`] : []),
    ...(day.fed > 0 ? [`+${day.fed} well fed`] : []), ...(day.half ? ['half pace'] : []), ...(day.kitchen > 0 ? [`${day.kitchen} at the Kitchen`] : []),
    ...(day.restaurant ? ['1 at the Restaurant'] : []),
    ...(day.festival ? ['1 at the festival'] : []),
    ...(day.forge ? ['1 at the Forge'] : []),
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
const DONE_ORDER: readonly TaskKind[] = ['harvest', 'water', 'plant', 'till', 'save-seed', 'load', 'care', 'cook', 'forage', 'chop', 'fish', 'mine', 'ship-surplus']
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
      case 'cook': return [`cooked ${plural(n, 'meal')}`]
      case 'save-seed': return [`saved ${plural(n, 'seed')}`]
      case 'ship-surplus': return [`set out ${plural(n, 'good')} for tomorrow’s bin`]
    }
  })
}

/** A farmhand's night in words, as the morning and the board's "Tonight" say it: her actions spent, the Kitchen's play
 * she assisted, what she did and the goods it brought; with none spent, "No tasks: set her tasks" or "Nothing to do
 * tonight". */
export function nightWords(line: FarmhandLine): string {
  if (line.spent === 0) return line.tasks === 0 ? 'No tasks: set her tasks' : 'Nothing to do tonight'
  const did = [...(line.kitchen ? ['assisted at the Kitchen'] : []), ...(line.restaurant ? ['served at the Restaurant'] : []),
    ...(line.festival ? ['worked the festival'] : []), ...doneWords(line.done)]
  return [`${line.spent} of ${plural(line.actions, 'action')}`, ...did, ...(line.items > 0 ? [`+${plural(line.items, 'good')}`] : [])].join(' · ')
}

/** An aptitude's name and level: "Watering 3". */
export const aptitudeWords = (id: keyof typeof APTITUDE_NAMES, level: number): string => `${APTITUDE_NAMES[id]} ${level}`
