import {
  HEIRLOOMS, TOOL_NAMES, workNeeds, ANIMALS, ANIMAL_KINDS, bar, benchOpen, buildCostWords, buildGoodsWords, buildLock, buildNeeds,
  BUILD_PLACES, EXPEDITION_REGIONS, farmPlace, farmRankOf, farmRankOpens, FARM_RANK_POINTS, FIELD_PLOTS,
  creditLeft, buildOrders, pinSupplyProject, RING_DEPOSIT, STANDARD_RING_COST, heldRings, KITCHEN_LEVELS, nextFarmRank, placeBuilt, plotLock, plotLockWords, plotName, readiness,
  animalLock, extensionCost, handsTonight, houseOpensWords, HOUSE_COSTS, nextLot, readyTiles, roomsInAll, rungName, STATION_LEVELS, STATIONS, umaMilestones, workKey,
  eatTonight, festivalsOf, payTownOrders, knownRestaurantRecipes, longGameEnabled, NIGHT_VISITS, nightVisits, setCrewSupplyGoal, settleAccounts,
  supplyGoals, supplySource, type SupplyGoal,
  type BuildPlace, type BuildNeed, type FarmSave, type FarmPlaceId,
} from '@farm/domain'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { Link } from 'react-router'
import { useMemo, useState, type ReactNode } from 'react'
import { ItemIcon } from '../items/ItemIcon'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { useMaster } from '../master/master'
import { namer } from '../story/people'
import { placeLink } from './farm-map'
import { byRelationship, compareRelationships } from './relationship-order'
import { dateWords, festivalWords } from './words'
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
      {needs.slice(0, 4).map(need => <li key={workKey(need.task)} className="flex items-center justify-between gap-2">
        <span><strong className="block">{taskWords(need.task, save.fields.plots.length)}</strong><small>{need.need}</small></span>
        {need.blocked ? need.task.kind === 'plant' ? <Action to="/?sheet=shop">Find seeds</Action>
          : <span className="text-[12px] text-ink-soft">Needs supplies</span>
          : <Action to={orderLink(workKey(need.task))}>Plan order</Action>}
      </li>)}
    </ul>}
    {needs.length > 4 && <p className="text-[12px] text-ink-soft">{needs.length - 4} more orders on the Work Board.</p>}
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

function FocusDetails({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return <details className="rounded-md border border-hairline">
    <summary className="min-h-11 cursor-pointer px-3 py-2 font-semibold">{label}{note && <span className="block text-[12px] font-normal text-ink-soft">{note}</span>}</summary>
    <div className="space-y-3 px-3 pb-3">{children}</div>
  </details>
}

function Focus({ save }: { save: FarmSave }) {
  const pack = useStory()
  const master = useMaster()
  const nameOf = namer(master.status === 'ready' ? master.view : null, pack)
  const { of } = useTalents()
  const forecast = useMemo(() => handsTonight(save, save, of, pack), [save, of, pack])
  const remaining = workNeeds(forecast.save, pack)
  const staffed = forecast.lines.length
  const automated = forecast.lines.filter(line => save.roster[line.id]?.autoWork).length
  const candidate = pack && Object.keys(save.love).filter(id => save.roster[id] && save.love[id]?.stage !== 'spouse')
    .sort(byRelationship(save)).find(id => readiness(save, pack, id).ready)
  const spouse = Object.keys(save.love).filter(id => save.love[id]?.stage === 'spouse').sort(byRelationship(save))[0]
  const pinned = supplyGoals(save)
  const active = pinned.find(goal => goal.key === save.forge?.crewGoal) ?? pinned[0]
  const dueWedding = candidate && save.love[candidate]?.stage === 'wedding'
  const suggestion = nextAction(save, save.today.crew ? 0 : staffed, automated, {
    event: candidate ? { id: candidate, name: nameOf(candidate), wedding: Boolean(dueWedding) } : undefined,
    nightVisits: Boolean(spouse && longGameEnabled(save, pack) && nightVisits(save).length < NIGHT_VISITS),
    tracked: active, ripeAfterCrew: readyTiles(forecast.save), crewShips: forecast.jobs?.some(job => job.key === 'ship-surplus'),
    needsWork: Boolean(!save.today.crew && staffed && remaining.some(need => !need.blocked && ['water', 'harvest', 'care'].includes(need.task.kind))),
  })
  const rank = farmRankOf(save.farm.points)
  const next = nextFarmRank(save.farm.points)
  const projects = BUILD_PLACES.filter(project => project.opens.game && project.opens.rank <= rank && !['built', 'tonight'].includes(buildLock(save, project.id)?.by ?? ''))
  const free = forecast.lines.reduce((sum, line) => sum + line.actions - line.spent, 0)
  const dry = remaining.filter(need => need.task.kind === 'water').reduce((sum, need) => sum + need.count, 0)
  const missingWork = remaining.filter(need => ['water', 'harvest', 'care', 'cook', 'load'].includes(need.task.kind)).length
  const table = eatTonight(forecast.save, forecast.lines.map(line => line.id))
  const shipping = binView(forecast.save).total
  const orders = payTownOrders(table.save)
  const service = orders.save.workshops.restaurant?.last
  const sales = service?.day === save.calendar.day ? service.sales + service.tips : 0
  const picked = settleAccounts({ ...orders.save, gold: orders.save.gold + shipping }, shipping + orders.gold + sales, {
    takeout: table.takeout, pantry: table.pantry, spoiled: table.spoiled, fed: table.fed.length, staff: table.staff,
  }, sales, orders.gold).save
  const bill = picked.farm.accounts?.at(-1)
  const net = picked.gold - save.gold
  const dueTool = save.forge?.tool
  const recipes = save.buildings.restaurant ? knownRestaurantRecipes(save).length : 0
  const equip = save.forge?.rack?.length ?? 0
  const rooms = roomsInAll(save)
  const queued = save.farm.builds.length
  return <div className="space-y-3">
    <section className="space-y-1 rounded-lg border border-accent/50 bg-panel p-3" aria-label="Recommended next action" data-next-action>
      <p className="text-[12px] text-ink-soft">{dateWords(save.calendar.day, save.calendar)} · Farm Rank {rank}</p>
      <h3 className="font-display text-lg font-bold">{suggestion.title}</h3>
      <p className="max-w-prose text-sm text-ink-soft">{suggestion.detail}</p>
      <Action to={suggestion.to}>{suggestion.label}</Action>
    </section>
    {active && <TrackedGoal save={save} goal={active} nightGold={picked.gold} />}
    <div className="grid grid-cols-1 items-start gap-2 min-[650px]:grid-cols-2">
      <FocusDetails label="Crew and fields" note={staffed ? `${staffed} on shift · ${dry ? dry + ' dry tiles left' : missingWork ? missingWork + ' jobs open' : 'essentials covered'}` : 'Solo today'}>
        <FieldAndCrew save={save} forecast={forecast} />
        <p className="text-[13px] text-ink-soft" data-farm-capacity>{staffed
          ? `${free} spare crew actions under today’s conditions. Check the weekly calendar before planting more.`
          : 'Plan planting around the watering and harvest work you can cover by hand.'}</p>
        <StarterSteps save={save} />
        <RestockList save={save} />
      </FocusDetails>
      <FocusDetails label="Money and credit" note={`${gold(save.gold)} on hand · ${net >= 0 ? '+' : '−'}${gold(Math.abs(net))} tonight`}>
        <p className="text-sm" data-next-night-gold>{gold(shipping)} bin sales{orders.gold > 0 && ` · ${gold(orders.gold)} orders`} · {gold(bill?.food ?? 0)} food · {gold(bill?.upkeep ?? 0)} upkeep · {gold(bill?.loans ?? 0)} repayments.</p>
        <p className="text-[13px] text-ink-soft">{gold(picked.gold)} projected cash after bills and the current crew shift. {picked.farm.owed > 0 && `${gold(picked.farm.owed)} still owed.`}</p>
        <div className="flex flex-wrap gap-x-3 text-sm"><Action to="/book">Farm accounts</Action><Action to="/?sheet=bin">Shipping Bin</Action>
          <Action to="/town?at=mayor&sheet=mayor">{gold(creditLeft(save))} credit left</Action></div>
        {save.farm.loans.map(loan => <p key={loan.for} className="text-[13px]">{loan.credit?.title ?? loan.for} · {loanWords(save, loan)}</p>)}
      </FocusDetails>
      <FocusDetails label="Buildings, ranch and homes" note={queued ? `${queued} ready overnight` : `${save.ranch.animals.length} animals · ${rooms.rooms - rooms.taken} rooms free`}>
        {!placeBuilt(save, 'coop') && <p className="text-[13px]">Coop and chickens open at Farm Rank 2. The Barn opens at Rank 3.</p>}
        <div className="flex flex-wrap gap-x-3 text-sm"><Action to={rancher}>Rancher</Action><Action to="/?sheet=homestead">Homestead</Action></div>
        {next && <div>
          <p className="text-sm">Farm Rank {next.rank} · {number(next.points - save.farm.points)} points left</p>
          <GoalBar label={`Farm Rank ${next.rank}`} have={save.farm.points} target={next.points} />
        </div>}
        {projects.length > 0 && <div className="space-y-1">{projects.map(project => <Project key={project.id} save={save} project={project} />)}</div>}
      </FocusDetails>
      <FocusDetails label="Production and tools" note={dueTool ? `${TOOL_NAMES[dueTool.tool]} ready ${dateWords(dueTool.due, save.calendar)}` : `${equip} upgraded copies · ${recipes}/120 recipes`}>
        <div className="grid grid-cols-2 gap-x-2 text-sm">
          <Action to="/?sheet=forge">Tool Rack</Action>
          <Action to={placeBuilt(save, 'kitchen') ? '/?sheet=kitchen' : peek('kitchen')}>Kitchen</Action>
          <Action to={placeBuilt(save, 'restaurant') ? '/?sheet=restaurant' : peek('restaurant')}>Restaurant</Action>
          <Action to="/town?at=library">Town Library</Action>
        </div>
        <p className="text-[13px] text-ink-soft">Restaurant recipes need discoveries at the listed grades. Check tools before expanding the crew’s work.</p>
      </FocusDetails>
      <FocusDetails label="Relationships and jewelry" note={candidate ? `${nameOf(candidate)} · scene ready` : spouse ? `${nameOf(spouse)} · ${NIGHT_VISITS - nightVisits(save).length} visits left` : 'Work toward the first wedding'}>
        <div className="flex flex-wrap gap-x-3 text-sm">
          <Action to={candidate ? `/library?uma=${candidate}` : '/library'}>Uma Library</Action>
          {spouse && <Action to={`/library?uma=${spouse}&page=jewelry`}>Jewelry</Action>}
          {spouse && longGameEnabled(save, pack) && <Action to="/?visits=1">Night visits</Action>}
        </div>
        {save.forge?.heirlooms.filter(order => order.ready && !order.gifted).map(order => <p key={order.recipient + order.piece} className="text-sm">
          <Action to={`/library?uma=${order.recipient}&page=jewelry`}>{HEIRLOOMS[order.piece].name} ready for {nameOf(order.recipient)}</Action>
        </p>)}
        {!spouse && <WeddingPath save={save} />}
      </FocusDetails>
      <FocusDetails label="Town and calendar" note={festivalWords(save.calendar.day, pack ? festivalsOf(pack) : undefined, save.calendar)}>
        <div className="grid grid-cols-2 gap-x-2 text-sm">
          <Action to="/town">Town map</Action><Action to="/?sheet=calendar">Calendar</Action>
          <Action to="/town?at=cafe">Café</Action><Action to="/town?sheet=requests">Requests</Action>
        </div>
      </FocusDetails>
    </div>
    {pinned.filter(goal => goal !== active).map(goal => <FocusDetails key={goal.key} label={goal.title} note="Tracked">
      <TrackedGoal save={save} goal={goal} nightGold={picked.gold} />
    </FocusDetails>)}
  </div>
}

function TrackedGoal({ save, goal, nightGold }: { save: FarmSave; goal: SupplyGoal; nightGold: number }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const assigned = save.forge?.crewGoal === goal.key
  const crew = Object.values(save.roster).some(uma => uma.autoWork && uma.farmhand)
  const missing = goal.lines.filter(line => line.held < line.count)
  const short = Math.max(0, goal.gold - save.gold)
  const after = Math.max(0, goal.gold - nightGold)
  const ready = !missing.length && !short && !goal.discovery
  async function toggle() {
    setBusy(true)
    try {
      await changeHomestead(state => setCrewSupplyGoal(state, goal.key))
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }
  return <section className="space-y-1.5 rounded-lg border border-hairline bg-panel p-3" aria-label="Tracked goal" data-next-tracked={goal.key}>
    <p className="text-[12px] text-ink-soft">Tracked · {assigned ? 'On the crew’s list' : ready ? 'Supplies ready' : 'Stock protected'}</p>
    <h3 className="font-display text-base font-bold">{goal.title}</h3>
    {missing.length > 0 && <ul className="grid gap-1 min-[650px]:grid-cols-2" aria-label="Missing materials">
      {missing.map(line => {
        const source = supplySource(save, line.id)
        return <li key={line.id} className="min-w-0 rounded border border-hairline px-2 text-sm">
          <Action to={source.to}><ItemIcon id={line.id} size={20} /><span className="ml-1">{line.count - line.held} {line.name} needed</span></Action>
          <p className="pb-1 text-[12px] text-ink-soft">{source.detail}{line.queued > 0 && ` · ${line.queued} refining`}</p>
        </li>
      })}
    </ul>}
    {goal.discovery ? <p className="text-sm">{goal.discovery} exact-grade discoveries missing.</p> : null}
    {goal.gold > 0 && <p className="text-sm">{gold(goal.gold)} total · {short ? gold(short) + ' short' : 'Gold ready'}{after !== short && ` · ${gold(after)} short after tonight’s estimate`}</p>}
    <div className="flex flex-wrap items-center gap-x-3 text-sm">
      <Action to={goal.to}>Open goal</Action>
      {(assigned || (!ready && crew)) && <Button size="md" variant="secondary" disabled={busy} onClick={() => void toggle()}>
        {assigned ? 'Stop assigning crew' : 'Assign crew to this goal'}
      </Button>}
      {!ready && !assigned && !crew && <Action to="/book?view=work">Set up auto-work</Action>}
    </div>
    {assigned && <p className="text-[12px] text-ink-soft">Uses spare auto-work after daily needs and existing orders.</p>}
    {message && <p role="alert">{message}</p>}
  </section>
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
  return <Sheet open onClose={onClose} size="wide" title="What Next?" label="What Next?" >
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
