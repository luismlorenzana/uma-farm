import {
  forgeMaterialRows, HEIRLOOMS, TOOL_IDS, TOOL_NAMES, toolTierName, workNeeds, ANIMALS, ANIMAL_KINDS, bar, benchOpen, buildCostWords, buildGoodsWords, buildLock, buildNeeds,
  BUILD_PLACES, EXPEDITION_REGIONS, farmPlace, farmRankOf, farmRankOpens, FARM_RANK_POINTS, FIELD_PLOTS,
  creditLeft, buildOrders, pinSupplyProject, RING_DEPOSIT, STANDARD_RING_COST, heldRings, KITCHEN_LEVELS, nextFarmRank, placeBuilt, plotLock, plotLockWords, plotName, readiness,
  animalLock, extensionCost, handsTonight, houseOpensWords, HOUSE_COSTS, nextLot, readyTiles, roomsInAll, rungName, STATION_LEVELS, STATIONS, umaMilestones, workKey,
  type BuildPlace, type BuildNeed, type FarmSave, type FarmPlaceId,
} from '@farm/domain'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { Link } from 'react-router'
import { useMemo, useState, type ReactNode } from 'react'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { placeLink } from './farm-map'
import { compareRelationships } from './relationship-order'
import { dateWords } from './words'
import { changeHomestead } from './homestead-actions'
import { loanWords } from './money-words'
import { RestockList } from './RestockList'
import { orderLink } from '../book/work-plan'
import { taskWords } from '../book/board-words'
import { useTalents } from './talents'
import { starterGoals } from './starter-goals'
import { nextAction } from './next-action'
import { binView } from './goods-view'

const number = (value: number) => value.toLocaleString('en-US')
const gold = (value: number) => `${number(value)}g`
const peek = (id: FarmPlaceId) => `/?peek=${id}`

const SOURCE: Partial<Record<string, { at: FarmPlaceId; label: string; order: string }>> = {
  logs: { at: 'forest', label: 'Chop in the Woods', order: 'chop:woods' },
  vegetables: { at: 'fields', label: 'Grow vegetables', order: 'plant:0' },
  fish: { at: 'fishery', label: 'Fish at the Pond', order: 'fish:pond' },
  planks: { at: 'sawmill', label: 'Make planks at the Sawmill', order: 'load:sawmill' },
  fillets: { at: 'smokehouse', label: 'Make fillets at the Smokehouse', order: 'load:smokehouse' },
}

function Action({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="inline-flex min-h-11 items-center font-semibold text-accent-strong" state={{ back: true }} to={to}>{children} ›</Link>
}

function SourceAction({ save, line }: { save: FarmSave; line: BuildNeed }) {
  const source = SOURCE[buildGoodsWords({ family: line.goods.family, refined: line.goods.refined })]
  if (!source) return null
  const place = farmPlace(source.at)!
  const ready = placeBuilt(save, source.at)
  return <div className="flex flex-wrap gap-x-3">
    <Action to={placeLink(save, place)}>{ready ? source.label : 'Build the ' + place.name + ' first'}</Action>
    {ready && <Action to={orderLink(source.order)}>Crew order</Action>}
  </div>
}

function Project({ save, project }: { save: FarmSave; project: BuildPlace }) {
  const lock = buildLock(save, project.id)
  const cost = project.opens.cost
  const done = lock?.by === 'built'
  const due = lock?.by === 'tonight'
  const [message, setMessage] = useState('')
  const quote = buildOrders({ ...save, today: { ...save.today, town: true } }).find(row => row.project === project.id)
  const short = Math.max(0, cost.gold - save.gold)
  const stats = done ? 'Built' : due ? 'Finishes overnight' : !project.opens.game ? 'Deferred'
    : lock?.by === 'farm-rank' ? `Farm Rank ${lock.rank}` : lock?.by === 'after' ? `After the ${farmPlace(lock.place)?.name}`
      : lock ? 'Needs supplies' : 'Ready to build'
  return <details className="rounded-md border border-hairline" data-next-project={project.id}>
    <summary className="min-h-11 cursor-pointer px-3 py-2 font-semibold">
      {project.name} <span className="ml-1 text-[13px] font-normal text-ink-soft">{stats}</span>
    </summary>
    <div className="space-y-2 px-3 pb-3">
      <p className="text-[13px] text-ink-soft">{project.blurb}</p>
      {project.opens.game && <p className="text-[13px]">{buildCostWords(project)}</p>}
      {!done && !due && project.opens.game && <>
        {project.opens.after && <p className="text-[13px]">Requires the {farmPlace(project.opens.after)?.name} to be built.</p>}
        {short > 0 && <p className="text-[13px]">Gold · {gold(save.gold)} / {gold(cost.gold)}. {gold(short)} short.</p>}
        {buildNeeds(save, project).map(line => <div key={buildGoodsWords(line.goods)} className="border-t border-hairline pt-1">
          <p className="text-[13px]">{buildGoodsWords(line.goods)}</p>
          <GoalBar label={buildGoodsWords(line.goods)} have={line.have} target={line.goods.count} />
          {line.have < line.goods.count && <SourceAction save={save} line={line} />}
        </div>)}
      </>}
      {project.opens.game && <Action to={peek(project.id)}>{done ? 'Open project' : 'View build'}</Action>}
      {!done && !due && project.opens.game && <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => void changeHomestead(s => pinSupplyProject(s, project.id)).catch((error: Error) => setMessage(error.message))}>
          {save.farm.projectPin === project.id ? 'Unpin project' : 'Pin and keep materials'}
        </Button>
        {quote && !quote.lock && <Action to="/town?at=mayor&sheet=mayor">Finance · {gold(quote.borrow)}</Action>}
        {message && <p role="status">{message}</p>}
      </div>}
    </div>
  </details>
}

function LandAndLevels({ save, rank }: { save: FarmSave; rank: number }) {
  return <>
    {FIELD_PLOTS.map((plot, i) => {
      if (plot.by !== 'clear' || plot.rank !== rank) return null
      const lock = plotLock(save, i)
      return <p key={i} className="text-[13px]">
        {plotName(i)} · {gold(plot.gold)} and 1 action. {plotLockWords(lock) ?? 'Ready to clear.'}{' '}
        <Action to="/field">Fields</Action>
      </p>
    })}
    {STATION_LEVELS.filter(level => level.farmRank === rank && level.level > 1).map(level => <div key={level.level} className="space-y-1">
      <p className="text-[13px]">Station level {level.level} · {gold(level.cost)} per station · {level.loads} loads/day</p>
      <p className="text-[13px] text-ink-soft">{STATIONS.map(station => `${farmPlace(station)?.name} ${Math.min(save.buildings[station] ?? 0, level.level)}/${level.level}`).join(' · ')}</p>
      <p className="text-[13px] text-ink-soft">Build each station, buy its earlier levels, then end the day for the upgrade.</p>
    </div>)}
    {KITCHEN_LEVELS.filter(level => level.farmRank === rank && level.level > 1).map(level => <p key={level.level} className="text-[13px]">
      Kitchen level {level.level} · {gold(level.cost)} · {level.dishes} dishes/play. Current level {save.buildings.kitchen ?? 0}.{' '}
      <Action to={peek('kitchen')}>Kitchen</Action>
    </p>)}
  </>
}

function WeddingPath({ save }: { save: FarmSave }) {
  const pack = useStory()
  const master = useMaster()
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const held = heldRings(save).length > 0
  const bench = benchOpen(save)
  const candidate = Object.entries(save.love).filter(([, love]) => love.wed === undefined && love.stage !== 'spouse')
    .sort(([a], [b]) => compareRelationships(save, a, b))[0]
  const nextEvent = candidate && pack ? readiness(save, pack, candidate[0]) : null
  const nextBar = candidate ? bar(candidate[1]) : null
  const hasSpouse = Object.values(save.love).some(love => love.stage === 'spouse')
  const pending = save.forge?.ringOrder
  return <section className="space-y-2" aria-label="Wedding and rings">
    <h3 className="font-display text-base font-semibold">First wedding</h3>
    {hasSpouse && <p className="text-[13px] text-success">First wedding held</p>}
    <ol className="list-decimal space-y-1 pl-5 text-[13px]">
      <li>
        {candidate ? <>
          {nameOf(candidate[0])} · {nextBar?.rung ? rungName(nextBar.rung) : 'Relationship complete'}
          {nextBar && nextBar.cost > 0 && !nextEvent?.ready && <> · {number(Math.max(0, nextBar.cost - nextBar.points))} points left</>}{' '}
          {nextEvent?.ready ? <Action to={`/hearts?uma=${candidate[0]}&event=${candidate[0]}`}>{nextEvent.alternate ? 'Play alternate scene' : 'Play scene'}</Action>
            : <Action to={`/hearts?uma=${candidate[0]}`}>Her relationship</Action>}
        </> : <><Action to="/town">Meet an Uma in town</Action> and play her Friendship events.</>}
      </li>
      <li>Play Romance 8 and end the day. {bench ? 'Ring bench open.' : 'The bench opens the next morning.'}</li>
      <li>{held ? 'A ring is in the Warehouse.' : pending ? `Ring due ${dateWords(pending.due, save.calendar)}.`
        : `Commission a Copper Ring for ${gold(STANDARD_RING_COST)} or save ${gold(RING_DEPOSIT)} for the deposit.`}{' '}
        {bench && <Action to="/?sheet=bench">Ring Bench</Action>}</li>
      <li>After Romance 10, propose with any ring. Confirm a wedding date and play the wedding on that day.
        {candidate?.[1].weddingDay !== undefined && <> Scheduled · {dateWords(candidate[1].weddingDay, save.calendar)}.</>}
      </li>
    </ol>
    <p className="text-[13px] text-ink-soft">The smith supplies the starter commission’s metal and gemstone. The Farmhouse has room for the wedding.</p>
  </section>
}

function GoalBar({ label, have, target }: { label: string; have: number; target: number }) {
  return <div className="grid grid-cols-[1fr_auto] items-center gap-2 text-[12px] tabular-nums">
    <progress className="h-2 w-full accent-accent" value={Math.min(have, target)} max={target} aria-label={label} />
    <span>{number(Math.min(have, target))}/{number(target)}</span>
  </div>
}

function StarterSteps({ save }: { save: FarmSave }) {
  const goals = starterGoals(save)
  const active = goals.filter(goal => goal.have < goal.target)
  return <section className="space-y-2" aria-label="Starter goals">
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-display text-base font-semibold">First farm goals</h3>
      <span className="text-[12px] text-ink-soft">{goals.length - active.length}/{goals.length} done</span>
    </div>
    {active.length > 0 && <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {active.map(goal => <li key={goal.id} className="space-y-1 rounded-md border border-hairline bg-panel p-2" data-next-goal={goal.id}>
        <strong className="text-[13px]">{goal.label}</strong>
        <GoalBar label={goal.label} have={goal.have} target={goal.target} />
        <p className="text-[12px] text-ink-soft">{goal.detail}</p>
        <div className="flex flex-wrap gap-x-3 text-[13px]">
          <Action to={goal.to}>{goal.place}</Action>
          <Action to={orderLink(goal.key)}>Assign crew</Action>
        </div>
      </li>)}
    </ul>}
    {active.length < goals.length && <details className="rounded border border-hairline px-2">
      <summary className="min-h-11 py-2 text-[13px] font-semibold">Completed goals</summary>
      <ul className="pb-2 text-[13px]">{goals.filter(goal => goal.have >= goal.target).map(goal => <li key={goal.id}>✓ {goal.label}</li>)}</ul>
    </details>}
  </section>
}

function FieldAndCrew({ save, forecast }: { save: FarmSave; forecast: ReturnType<typeof handsTonight> }) {
  const pack = useStory()
  const needs = workNeeds(forecast.save, pack)
  const free = forecast.lines.reduce((sum, line) => sum + line.actions - line.spent, 0)
  return <section className="space-y-2" aria-label="Today's farm work">
    <h3 className="font-display text-base font-semibold">{save.today.crew ? 'Work left today' : 'After the crew’s orders'}</h3>
    <p className="text-[13px] text-ink-soft">
      {forecast.lines.length ? forecast.lines.length + ' on shift · ' + free + ' crew actions free' : 'No crew on shift today'}
    </p>
    {!!needs.length && <ul className="divide-y divide-hairline rounded border border-hairline px-2 text-[13px]">
      {needs.map(need => <li key={workKey(need.task)} className="flex items-center justify-between gap-2">
        <span><strong className="block">{taskWords(need.task, save.fields.plots.length)}</strong><small>{need.need}</small></span>
        {need.blocked ? need.task.kind === 'plant' ? <Action to="/?sheet=shop">Find seeds</Action>
          : <span className="text-[12px] text-ink-soft">Needs supplies</span>
          : <Action to={orderLink(workKey(need.task))}>Plan order</Action>}
      </li>)}
    </ul>}
    <div className="flex flex-wrap gap-x-4 text-[13px]">
      <Action to="/book?view=work">Work board</Action>
      <Action to="/book?view=work&workCalendar=1">Work calendar</Action>
    </div>
  </section>
}

const rancher = '/town?at=rancher&sheet=rancher'

function AnimalGoal({ save, kind }: { save: FarmSave; kind: (typeof ANIMAL_KINDS)[number] }) {
  const animal = ANIMALS[kind]
  const owned = save.ranch.animals.filter(row => row.kind === kind).length
  const open = placeBuilt(save, animal.home)
  const lock = animalLock(save, kind)
  return <li className="rounded border border-hairline bg-panel p-2 text-[13px]" data-next-animal={kind}>
    <strong>{animal.name} · {gold(animal.price)}</strong>
    <p>{owned ? number(owned) + ' on the farm' : 'Farm Rank ' + animal.rank + ' · ' + farmPlace(animal.home)?.name}</p>
    {!owned && (lock ? <p className="text-ink-soft">{lock}</p> : <p className="text-ink-soft">{save.gold < animal.price ? gold(animal.price - save.gold) + ' short' : 'Ready to buy'}</p>)}
    <Action to={open ? rancher : peek(animal.home)}>{open ? 'Rancher' : 'View ' + farmPlace(animal.home)?.name}</Action>
  </li>
}

function RanchAndHousing({ save }: { save: FarmSave }) {
  const lot = nextLot(save)
  const rooms = roomsInAll(save)
  const waiting = Object.values(save.love).filter(love => love.stage === 'spouse' && love.house === undefined).length
  const rank = farmRankOf(save.farm.points)
  const animals = ANIMAL_KINDS.filter(kind => ANIMALS[kind].rank <= Math.max(3, rank))
  const extension = save.homestead.houses.findIndex((house, i) => i > 0 && !house.extended)
  return <section className="space-y-2" aria-label="Animals and houses">
    <h3 className="font-display text-base font-semibold">Animals and houses</h3>
    <details open className="rounded border border-hairline p-2">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold">Ranch · {save.ranch.animals.length} animals</summary>
      <div className="space-y-1">
        {!placeBuilt(save, 'coop') && <Project save={save} project={BUILD_PLACES.find(place => place.id === 'coop')!} />}
        {!placeBuilt(save, 'barn') && <Project save={save} project={BUILD_PLACES.find(place => place.id === 'barn')!} />}
        <ul className="grid gap-1 sm:grid-cols-2">{animals.map(kind => <AnimalGoal key={kind} save={save} kind={kind} />)}</ul>
        {(placeBuilt(save, 'coop') || placeBuilt(save, 'barn')) && <p className="text-[13px]">
          {save.ranch.silo} fodder in the silo · <Action to={rancher}>Buy animals or fodder</Action>
        </p>}
      </div>
    </details>
    <div className="rounded border border-hairline bg-panel p-2 text-[13px]" data-next-housing>
      <strong>Homestead · {rooms.rooms - rooms.taken} rooms free</strong>
      {waiting > 0 && <p>{waiting} waiting for a room</p>}
      {lot && <>
        <p>House {lot.n} · {gold(lot.cost)} · {lot.open ? 'Unlocked' : houseOpensWords(lot.n)}</p>
        <GoalBar label={'House ' + lot.n + ' gold'} have={save.gold} target={lot.cost} />
        <p className="text-ink-soft">Houses cost gold. The Farmhouse has two rooms from day one.</p>
      </>}
      {extension > 0 && <p>Extend {save.homestead.houses[extension]!.name} for {gold(extensionCost(extension))} · adds two rooms.</p>}
      <Action to="/?sheet=homestead">Open Homestead</Action>
    </div>
  </section>
}

function FocusDetails({ label, children }: { label: string; children: ReactNode }) {
  return <details className="rounded-md border border-hairline">
    <summary className="flex min-h-11 cursor-pointer items-center px-3 font-semibold">{label}</summary>
    <div className="space-y-3 px-3 pb-3">{children}</div>
  </details>
}

function Focus({ save }: { save: FarmSave }) {
  const pack = useStory()
  const { of } = useTalents()
  const forecast = useMemo(() => handsTonight(save, save, of, pack), [save, of, pack])
  const staffed = forecast.lines.length
  const automated = forecast.lines.filter(line => save.roster[line.id]?.autoWork).length
  const suggestion = nextAction(save, save.today.crew ? 0 : staffed, automated)
  const rank = farmRankOf(save.farm.points)
  const next = nextFarmRank(save.farm.points)
  const ready = readyTiles(save)
  const inBin = binView(save).total
  const projects = BUILD_PLACES.filter(project => project.opens.rank <= rank && project.opens.game && project.group !== 'ranch')
    .filter(project => buildLock(save, project.id)?.by !== 'built')
    .sort((a, b) => a.opens.rank - b.opens.rank)
  return <div className="space-y-4">
    <section className="space-y-1.5 rounded-lg border border-accent/40 bg-panel p-3" aria-label="Recommended next action" data-next-action>
      <h3 className="font-display text-lg font-bold">{suggestion.title}</h3>
      <p className="max-w-prose text-sm text-ink-soft">{suggestion.detail}</p>
      <Action to={suggestion.to}>{suggestion.label}</Action>
      <p className="border-t border-hairline pt-2 text-[12px] text-ink-soft">
        {gold(save.gold)} available{' · '}{gold(inBin)} queued{' · '}
        {staffed ? `${staffed} ${save.today.crew ? 'worked this morning' : 'on the next shift'} · ${automated} on auto` : 'No crew on shift'}
      </p>
    </section>
    <FocusDetails label="Farm work and starter goals">
      <FieldAndCrew save={save} forecast={forecast} />
      <StarterSteps save={save} />
      <RestockList save={save} />
    </FocusDetails>
    <FocusDetails label="Farm Rank, buildings and credit">
    <section aria-label="Project credit" className="text-[13px]">
      <Action to="/town?at=mayor&sheet=mayor">{gold(creditLeft(save))} credit left</Action>
      {save.farm.loans.map(loan => <p key={loan.for}>{loan.credit?.title ?? loan.for} · {loanWords(save, loan)}</p>)}
    </section>
    <section className="space-y-1" aria-label="Next Farm Rank">
      <h3 className="font-display text-base font-semibold">{next ? `Reach Farm Rank ${next.rank}` : 'Farm Rank 10 reached'}</h3>
      {next && <>
        <progress className="w-full accent-accent" value={save.farm.points} max={next.points} aria-label={`Farm Rank ${next.rank} progress`} />
        <p className="text-[13px]">{number(save.farm.points)}/{number(next.points)} points · {number(next.points - save.farm.points)} to go</p>
        <p className="text-[13px] text-ink-soft">Ship goods you can spare. First-time shipments earn five extra points. Milestones and festival placements count overnight.</p>
      </>}
      <div className="flex flex-wrap gap-x-4">
        <Action to="/?sheet=bin">{inBin > 0 ? `Shipping bin · ${gold(inBin)} queued` : 'Fill the shipping bin'}</Action>
        <Action to="/field">{ready > 0 ? `Harvest · ${ready} ready` : 'Check crops'}</Action>
        <Action to="/?sheet=calendar">Festival calendar</Action>
      </div>
    </section>
    <section className="space-y-2" aria-label="Current projects">
      <h3 className="font-display text-base font-semibold">Projects you can work toward now</h3>
      {projects.length ? projects.map(project => <Project key={project.id} save={save} project={project} />)
        : <p className="text-[13px] text-ink-soft">All available buildings are finished. Check land and upgrades in the Farm path.</p>}
      <Action to="/book?view=work">Assign production to your crew</Action>
      {(save.buildings.forge ?? 0) > 0 && <ForgeGoals save={save} />}
    </section>
    </FocusDetails>
    <FocusDetails label="First wedding"><WeddingPath save={save} /></FocusDetails>
  </div>
}

function ForgeGoals({ save }: { save: FarmSave }) {
  const pack = useStory()
  const needs = workNeeds(save, pack)
  const due = save.forge?.tool
  const priority = needs.some(need => need.task.kind === 'water') ? 'watering-can' : needs.some(need => need.task.kind === 'care') ? 'brush' : 'hoe'
  const tool = save.tools[priority] < 5 ? priority : TOOL_IDS.find(id => save.tools[id] < 5)
  const goal = save.forge?.tracked
  const tracked = goal && HEIRLOOMS[goal.piece]
  const missing = tracked && forgeMaterialRows(save, tracked.materials).reduce((n, row) => n + Math.max(0, row.count - row.free), 0)
  return <div className="space-y-1">
    {(due || tool) && <Action to={`/?sheet=forge&tool=${due?.tool ?? tool}`}>{due ? `${toolTierName(due.tier)} ${TOOL_NAMES[due.tool]} on order` : `Plan a ${TOOL_NAMES[tool!]} upgrade`}</Action>}
    {goal && tracked && <Action to={`/?sheet=forge&tab=heirlooms&recipient=${goal.recipient}&piece=${goal.piece}`}>{tracked.name} · {missing ? `${missing} materials needed` : 'Materials ready'}</Action>}
    {farmRankOf(save.farm.points) >= 8 && <Action to="/?sheet=forge&tab=heirlooms">Plan an heirloom commission</Action>}
    {save.forge?.heirlooms.filter(order => order.ready && !order.gifted).map(order => <p key={`${order.recipient}:${order.piece}`}>
      <Action to={`/?sheet=forge&tab=heirlooms&recipient=${order.recipient}&piece=${order.piece}`}>{HEIRLOOMS[order.piece].name} ready to give</Action></p>)}
  </div>
}

function FarmPath({ save }: { save: FarmSave }) {
  const rank = farmRankOf(save.farm.points)
  return <div className="space-y-3">
    {FARM_RANK_POINTS.map((points, i) => {
      const level = i + 1
      const projects = BUILD_PLACES.filter(project => project.opens.rank === level)
      const regions = Object.values(EXPEDITION_REGIONS).filter(region => region.rank === level)
      const unlocks = farmRankOpens(level).filter(item => !/ to build \(|^Plot |^Station level |^Kitchen level /.test(item))
      return <details key={level} open={rank === level || undefined} className="rounded-md border border-hairline" data-next-rank={level}>
        <summary className="min-h-11 cursor-pointer px-3 py-2 font-semibold">Farm Rank {level} <span className="ml-1 text-[13px] font-normal text-ink-soft">{number(points)} points{level <= rank ? ' · Reached' : ''}</span></summary>
        <div className="space-y-2 px-3 pb-3">
          {level === 1 && <p className="text-[13px]">Day 1 · Plot 1, Woods, Pond, basic cooking, town and seasonal seeds.</p>}
          {projects.map(project => <Project key={project.id} save={save} project={project} />)}
          <LandAndLevels save={save} rank={level} />
          {unlocks.length > 0 && <p className="text-[13px] text-ink-soft">{unlocks.join(' · ')}</p>}
          <ul className="grid gap-1 sm:grid-cols-2">{ANIMAL_KINDS.filter(kind => ANIMALS[kind].rank === level).map(kind => <AnimalGoal key={kind} save={save} kind={kind} />)}</ul>
          {regions.length > 0 && <div className="text-[13px] text-ink-soft">
            <p>Expeditions · {Math.min(3, level - 6)} parties. Requires the Expedition post.</p>
            <ul>{regions.map(region => <li key={region.name}>{region.name} · {region.days} days · {region.need} power</li>)}</ul>
            <Action to={peek('expeditions')}>Expedition post</Action>
          </div>}
        </div>
      </details>
    })}
    <section className="space-y-2" aria-label="Relationship milestones">
      <h3 className="font-display text-base font-semibold">Relationship milestones</h3>
      {umaMilestones(save).filter(milestone => milestone.kind !== 'house').map(milestone => <p key={milestone.kind === 'row' ? 'row-' + milestone.row : milestone.kind} className="text-[13px]">
        {milestone.kind === 'row' ? 'Homestead row ' + milestone.row : milestone.kind === 'bench' ? 'Ring bench after first Romance 8' : 'Requests board at five Umas met'} · {milestone.done ? 'Reached' : `${milestone.have}/${milestone.need}`}
      </p>)}
      <details className="rounded-md border border-hairline px-3">
        <summary className="min-h-11 py-2 font-semibold">Homestead houses</summary>
        <ul className="space-y-1 pb-2 text-[13px]">{HOUSE_COSTS.map((cost, i) => <li key={i}>House {i + 1} · {gold(cost)} · Wedding {i + 1}{i > 0 ? ` and House ${i} built` : ''}. Extend for {gold(cost / 2)}.</li>)}</ul>
      </details>
      <p className="text-[13px]">Every five weddings brings a household celebration. The 50th wedding opens the Greater Festival.</p>
      <Action to="/?sheet=homestead">Homestead</Action>
    </section>
  </div>
}

export default function WhatNext({ onClose }: { onClose: () => void }) {
  const save = useLoopSave()
  const [view, setView] = useState<'today' | 'ranch' | 'path'>('today')
  if (!save) return null
  return <Sheet open onClose={onClose} title="What Next?" label="What Next?" >
    <div className="space-y-3 pb-2">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Goal view">
        <Button size="md" variant={view === 'today' ? 'primary' : 'secondary'} aria-pressed={view === 'today'} onClick={() => setView('today')}>Focus now</Button>
        <Button size="md" variant={view === 'ranch' ? 'primary' : 'secondary'} aria-pressed={view === 'ranch'} onClick={() => setView('ranch')}>Ranch &amp; homes</Button>
        <Button size="md" variant={view === 'path' ? 'primary' : 'secondary'} aria-pressed={view === 'path'} onClick={() => setView('path')}>Farm path</Button>
      </div>
      {view === 'today' ? <Focus save={save} /> : view === 'ranch' ? <RanchAndHousing save={save} /> : <FarmPath save={save} />}
    </div>
  </Sheet>
}
