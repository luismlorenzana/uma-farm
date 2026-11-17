// The work board, in the Book: each farmhand's card with her part-time job and this season's farm days (the days her
// life in town leaves free; a spouse in her room, every day), and on a farm day her actions today (3, more settled in,
// married and well fed; half pace when the upkeep's short) and what she'll do tonight as the farm stands; on a town day
// "In town today · back Spring 5" (her next farm day), and nothing tonight. Then her tasks in
// your order, each with her aptitude's level. **Add a task** opens a side panel (`?task=<id>`): what (harvest, water,
// plant, clear and till over a plot's rows, each plot listed with its rows and a plot not cleared greyed; a station's load; a forest area's forage or chop; a fishing spot's catch;
// the Coop's or the Barn's animals; a face at the Mine or the Quarry; Cook, in the farmhouse kitchen, with nowhere to
// choose) and where. Tasks repeat each day until you change them; any Uma does any task. Setting them is free. Loaded with the
// Book.
import {
  aptitudeOf, APTITUDE_NAMES, atHome, CROPS, farmDaysIn, farmPlace, nextFarmDay, worksOn, FIELD_COLUMNS, FIELD_PLOTS, FIELD_ROWS, FIELD_TILES, handDay, handsInOrder, handTonight, isOvergrown, itemNameOf,
  plotLock, plotLockWords, plotName,
  MAX_TASKS, reachList, seedsInSeason, STATIONS, stationBuilt, taskAptitude, TASK_KINDS, TASK_NAMES, TILE_TASKS, growsIn, dateOf, DIGS, placeBuilt, RANCH_HOMES,
  type CropId, type DigId, type FarmPlaceId, type FarmSave, type FarmTask, type RanchHome, type StationId, type StoryPack, type TaskKind, type TileTaskKind,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Chip, HelpButton, IconButton, Sheet } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar } from '../dialogue/Avatar'
import { setHandTasks } from '../loop/actions'
import { useTalents } from '../loop/talents'
import { plural, shortDate } from '../loop/words'
import { useMaster } from '../master/master'
import { daysWords } from '../loop/schedule-words'
import { useStory } from '../story/story'
import { dayChips, jobWords, KITCHEN, nightWords, rowTiles, runsOn, taskWords } from './board-words'

const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')
/** A season's farm days in words: "2, 3, 5, 6, 8, 9, 11, 12", "1–6, 9", "every day". */
const daysList = (days: readonly number[]): string => (days.length === 12 ? 'every day' : daysWords(days))

/** The board: a card for each farmhand, in the order they work. */
export function WorkBoard({ save }: { save: FarmSave }) {
  const location = useLocation()
  const navigate = useNavigate()
  const leave = useLeave()
  const master = useMaster()
  const pack = useStory()
  const talents = useTalents()
  const nameOf = (id: string): string => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  const hands = handsInOrder(save)
  const adding = new URLSearchParams(location.search).get('task')
  return (
    <section aria-label="The work board" className="space-y-2" data-book="board" data-hands={hands.length}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[18px] font-bold text-ink">Work board</h2>
        <HelpButton title="The work board" label="About the work board">
          <p>A friend you invite to work is a farmhand. She keeps her life in town, and comes to the farm on her farm days, the days it leaves free. There she gives the farm 3 actions: one more once she’s settled in (a season on), two more once she’s your spouse, one more the day after a household meal.</p>
          <p>She works your tasks overnight, before the crops grow: the field’s, the stations’ and the animals’ first, in your order, then her gathering and digging, a turn each. The morning says what she did.</p>
          <p>Every task has an aptitude. She starts from her talents and gets better with each action: more goods, better stars, and tricks, like a row watered in one action.</p>
          <p>Cook feeds the farm: each action cooks a batch from two goods of food in {KITCHEN}, 6 meals at Cooking 1 up to 12 at Cooking 10, until the pantry holds tonight’s meals for everyone.</p>
          <p>On her farm days she eats two meals on the farm: that’s her cost. On her town days she’s in town, and costs nothing.</p>
          <p>Short of upkeep two nights running, the farmhands work at half pace until it’s paid.</p>
        </HelpButton>
      </div>
      {hands.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline-strong px-3 py-3 text-[14px] text-ink-soft" data-no-hands>
          No farmhands yet. Once she’s a friend (Friendship 3), invite her to work: her menu in town.
        </p>
      ) : (
        <ul className="@container grid gap-2 @2xl:grid-cols-2" data-hand-cards>
          {hands.map((id) => (
            <HandCard key={id} save={save} id={id} name={nameOf(id)} pack={pack} talentOf={talents.of}
              onAdd={() => navigate(withParam(location, 'task', id), { state: { back: true } })} />
          ))}
        </ul>
      )}
      {adding && save.roster[adding]?.farmhand !== undefined && <AddTask save={save} id={adding} name={nameOf(adding)} onClose={() => leave(withParam(location, 'task', null))} />}
    </section>
  )
}

/** One farmhand: her day, tonight's work as the farm stands, and her tasks. */
function HandCard({ save, id, name, pack, talentOf, onAdd }: {
  save: FarmSave; id: string; name: string; pack: StoryPack | null; talentOf: ReturnType<typeof useTalents>['of']; onAdd: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const uma = save.roster[id]!
  const day = handDay(save, id)!
  const tasks = uma.tasks ?? []
  // On a town day she's in town: she doesn't work tonight, and she's back on her next farm day.
  const working = worksOn(save, pack, id)
  const back = !working && pack ? nextFarmDay(pack, id, save.calendar.day) : null
  const tonight = working ? handTonight(save, id, talentOf, pack) : null
  const chips = working ? dayChips(day) : []
  const farmDays = !pack ? null : atHome(save, id) ? 'every day' : daysList(farmDaysIn(pack, id, dateOf(save.calendar.day).season))
  const plots = save.fields.plots.length
  const edit = (next: FarmTask[]) => { setError(null); setHandTasks(id, next).catch((e: unknown) => setError(errorWords(e))) }
  const move = (i: number) => edit(tasks.map((t, k) => (k === i - 1 ? tasks[i]! : k === i ? tasks[i - 1]! : t)))
  return (
    <li className="space-y-2 rounded-md border border-hairline bg-panel px-3 py-2 shadow-1" data-hand={id}>
      <div className="flex items-center gap-2">
        <Avatar id={id} size={44} label={name} />
        <span className="min-w-0 flex-1">
          <Link to={`/hearts?view=work&uma=${id}`} state={{ back: true }} className="block truncate text-[15px] font-semibold text-ink">{name}</Link>
          <span className="block truncate text-[12px] text-ink-soft" data-job title={`Farmhand since ${shortDate(uma.farmhand!)}`}>{pack ? jobWords(pack, id) : 'A job in town'}</span>
          {farmDays && <span className="block truncate text-[12px] text-ink-soft" data-farm-days>Farm days · {farmDays}</span>}
        </span>
        {working && (
          <span className="shrink-0 text-right" data-actions={day.actions}>
            <span className="font-display block text-[20px] leading-none font-bold tabular-nums">{day.actions}</span>
            <span className="text-[11px] text-ink-soft">actions</span>
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <p className="flex flex-wrap gap-1" data-day-chips>
          {chips.map((c) => <span key={c} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c === 'half pace' ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>{c}</span>)}
        </p>
      )}
      {working
        ? <p className="text-[13px]" data-tonight><span className="font-semibold">Tonight · </span><span className="text-ink-soft">{tonight ? nightWords(tonight) : '—'}</span></p>
        : <p className="text-[13px] font-semibold" data-in-town>In town today{back ? ` · back ${shortDate(back)}` : ''}</p>}
      {tasks.length === 0 ? (
        <p className="text-[13px] text-ink-soft" data-no-tasks>No tasks yet: add one, and she starts tonight.</p>
      ) : (
        <ol className="divide-y divide-hairline rounded-md border border-hairline" aria-label={`${name}’s tasks`} data-tasks={tasks.length}>
          {tasks.map((task, i) => {
            const aptitude = taskAptitude(task)
            const level = aptitudeOf(uma, aptitude, (a) => talentOf(id, a)).level
            return (
              <li key={`${i}:${taskWords(task, plots)}`} className="flex min-h-11 items-center gap-1 pl-2" data-task={task.kind}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold" data-task-words>{taskWords(task, plots)}</span>
                  <span className="block truncate text-[11px] text-ink-soft" data-task-aptitude>{APTITUDE_NAMES[aptitude]} {level}{runsOn(task) ? ' · shares what’s left' : ''}</span>
                </span>
                {i > 0 && <IconButton aria-label={`Move ${taskWords(task, plots)} up`} onClick={() => move(i)} data-action="task-up"><span aria-hidden>↑</span></IconButton>}
                <IconButton aria-label={`Remove ${taskWords(task, plots)}`} onClick={() => edit(tasks.filter((_, k) => k !== i))} data-action="task-remove"><span aria-hidden>✕</span></IconButton>
              </li>
            )
          })}
        </ol>
      )}
      {error && <p role="status" className="text-[13px] font-semibold text-danger">{error}</p>}
      <Button variant="secondary" size="sm" className="w-full" disabled={tasks.length >= MAX_TASKS} onClick={onAdd} data-action="add-task">
        {tasks.length >= MAX_TASKS ? `${MAX_TASKS} tasks at most` : 'Add a task'}
      </Button>
    </li>
  )
}

/** How many of a plot's row's tiles a field task would find work on now: growing and dry, ripe, empty tilled, or to clear
 * and till. */
function rowCount(save: FarmSave, kind: TileTaskKind, plot: number, row: number): number {
  const tiles = save.fields.plots[plot]?.tiles ?? []
  return rowTiles(row).filter((i) => {
    const t = tiles[i]
    if (!t) return false
    switch (kind) {
      case 'water': return t.crop !== null && !t.ready
      case 'harvest': return t.crop !== null
      case 'plant': return t.ground === 'tilled' && t.crop === null
      case 'till': return isOvergrown(t.ground) || t.ground === 'clear'
    }
  }).length
}
const ROW_WORDS: Readonly<Record<TileTaskKind, string>> = { water: 'growing', harvest: 'planted', plant: 'to plant', till: 'to clear or till' }

/** Add a task: what, then where; its words on the button. */
function AddTask({ save, id, name, onClose }: { save: FarmSave; id: string; name: string; onClose: () => void }) {
  const [kind, setKind] = useState<TaskKind>('water')
  const [plot, setPlot] = useState(0)
  const [rows, setRows] = useState<number[]>([])
  const [crop, setCrop] = useState<CropId | null>(null)
  const [where, setWhere] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const tile = (TILE_TASKS as readonly string[]).includes(kind)
  const tiles = rows.flatMap(rowTiles)
  const on = plot > 0 ? { plot } : {}
  const task: FarmTask | null = kind === 'cook' ? { kind } : tile
    ? (tiles.length === 0 ? null : kind === 'plant' ? { kind, tiles, ...on, ...(crop ? { crop } : {}) } : { kind: kind as Exclude<TileTaskKind, 'plant'>, tiles, ...on })
    : where === null ? null
      : kind === 'load' ? { kind, station: where as StationId }
        : kind === 'care' ? { kind, home: where as RanchHome }
          : kind === 'mine' ? { kind, dig: where as DigId }
            : kind === 'fish' ? { kind, spot: where as 'pond' } : { kind: kind as 'forage' | 'chop', area: where as 'woods' }
  const pick = (next: TaskKind) => { setKind(next); setWhere(null); setError(null) }
  const add = () => {
    if (!task) return
    setBusy(true)
    setHandTasks(id, [...(save.roster[id]!.tasks ?? []), task]).then(onClose, (e: unknown) => setError(errorWords(e))).finally(() => setBusy(false))
  }
  const season = dateOf(save.calendar.day).season
  const crops = (Object.keys(CROPS) as CropId[]).filter((c) => growsIn(c, season) && seedsInSeason(save).some((s) => s.crop === c))
  const built = (id: FarmPlaceId) => ({ id, name: farmPlace(id)?.name ?? id, lock: placeBuilt(save, id) ? null : 'Build it first.' })
  const places = kind === 'load' ? STATIONS.map((s) => ({ ...built(s), lock: stationBuilt(save, s) ? null : 'Build it first.' }))
    : kind === 'care' ? RANCH_HOMES.map(built) : kind === 'mine' ? DIGS.map(built)
      : kind === 'fish' ? reachList(save, 'fishery') : reachList(save, 'forest')
  return (
    <Sheet open onClose={onClose} title={`A task for ${name}`} label="Add a task"
      footer={(
        <div className="space-y-1">
          {error && <p role="status" className="text-center text-[13px] font-semibold text-danger">{error}</p>}
          <Button className="w-full" disabled={!task || busy} onClick={add} data-action="add-task-confirm">{task ? `Add · ${taskWords(task, save.fields.plots.length)}` : 'Choose where'}</Button>
        </div>
      )}>
      <div className="space-y-3 pb-1" data-add-task={id}>
        <fieldset>
          <legend className="text-micro pb-1">What</legend>
          <div className="flex flex-wrap gap-1.5">
            {TASK_KINDS.map((k) => <Chip key={k} selected={kind === k} aria-pressed={kind === k} onClick={() => pick(k)} data-kind={k}>{TASK_NAMES[k]}</Chip>)}
          </div>
        </fieldset>
        {kind === 'cook' ? (
          <p className="text-[14px] text-ink-soft" data-cook-where>
            In {KITCHEN}: a batch an action from two goods of food, ★2 goods first, until the pantry holds tonight’s meals for everyone.
          </p>
        ) : tile ? (
          <fieldset>
            <legend className="text-micro pb-1">The plot</legend>
            <div className="flex flex-wrap gap-1.5 pb-2">
              {FIELD_PLOTS.slice(0, save.fields.plots.length + 1).map((_, p) => {
                const cleared = p < save.fields.plots.length
                const lock = cleared ? null : plotLockWords(plotLock(save, p))
                return (
                  <Chip key={p} selected={plot === p} aria-pressed={plot === p} disabled={!cleared} onClick={() => { setPlot(p); setRows([]) }} data-plot={p + 1}>
                    <span className="block text-left leading-tight">
                      <span className="block">{plotName(p)}</span>
                      {lock && <span className="block text-[11px] text-ink-faint">{lock}</span>}
                    </span>
                  </Chip>
                )
              })}
            </div>
            <p className="text-micro pb-1">{plotName(plot)}’s rows</p>
            <div className="grid grid-cols-3 gap-1.5 [&>button]:justify-start">
              <Chip selected={rows.length === FIELD_ROWS} aria-pressed={rows.length === FIELD_ROWS} onClick={() => setRows(rows.length === FIELD_ROWS ? [] : Array.from({ length: FIELD_ROWS }, (_, r) => r + 1))} data-row="all">
                Whole plot
              </Chip>
              {Array.from({ length: FIELD_ROWS }, (_, r) => r + 1).map((row) => {
                const on = rows.includes(row)
                return (
                  <Chip key={row} selected={on} aria-pressed={on} onClick={() => setRows(on ? rows.filter((x) => x !== row) : [...rows, row].sort())} data-row={row}>
                    <span className="block text-left leading-tight">
                      <span className="block">Row {row}</span>
                      <span className="block text-[11px] text-ink-soft">{rowCount(save, kind as TileTaskKind, plot, row)} {ROW_WORDS[kind as TileTaskKind]}</span>
                    </span>
                  </Chip>
                )
              })}
            </div>
            <p className="pt-1 text-[12px] text-ink-faint">{plural(FIELD_COLUMNS, 'tile')} a row, {FIELD_TILES} a plot.</p>
            {kind === 'plant' && (
              <div className="pt-2">
                <p className="text-micro pb-1">Seed</p>
                <div className="flex flex-wrap gap-1.5">
                  <Chip selected={crop === null} aria-pressed={crop === null} onClick={() => setCrop(null)} data-crop="any">Any in season</Chip>
                  {crops.map((c) => <Chip key={c} selected={crop === c} aria-pressed={crop === c} onClick={() => setCrop(c)} data-crop={c}>{itemNameOf(c)}</Chip>)}
                </div>
              </div>
            )}
          </fieldset>
        ) : (
          <fieldset>
            <legend className="text-micro pb-1">{kind === 'load' ? 'Which station' : kind === 'care' ? 'Which building' : kind === 'mine' ? 'Which dig' : kind === 'fish' ? 'Which spot' : 'Which area'}</legend>
            <ul className="grid grid-cols-2 gap-1.5">
              {places.map((p) => (
                <li key={p.id}>
                  <Chip className="w-full" selected={where === p.id} aria-pressed={where === p.id} disabled={p.lock !== null} onClick={() => setWhere(p.id)} data-where={p.id}>
                    <span className="block text-left">
                      <span className="block">{capital(p.name)}</span>
                      {p.lock && <span className="block text-[11px] text-ink-faint">{p.lock}</span>}
                    </span>
                  </Chip>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
      </div>
    </Sheet>
  )
}
const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
