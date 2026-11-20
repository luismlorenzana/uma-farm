import {
  activeContest, animalPreview, animalName, ANIMALS, aptitudeOf, castDerby, CONTESTS, contestCutoffs, contestDate, CROP_IDS, CUE_WORDS, cupCategory, cupPreview, cupWorkDay,
  dateOf, derbyMeet, DERBY_TURN_MS, enterAnimal, enterCup, enterDerby, enterFlower, farmRankOf, festivalEntryLock, festivalHandLock, festivalResult,
  festivalsOf, FESTIVAL_ACTION_COST, FESTIVAL_CONTESTS, festivalStock, fieldTiles, FIELD_TILES, FISHING_SPOTS, flowerMarkLock, flowerPreview,
  goodName, goodOf, isFarmContest, markFlowerTile, NO_BIRTHDAYS, answerAnimal, parseStockKey, reachLock, recipeOf, releaseFlower, restaurantGrade, settleFestival, sharesOn,
  SHOW_CUES, SPOT_NAMES, stockKey, touched, type ActiveContest, type ContestCard, type ContestContext, type CropId,
  type CupEntry, type FarmContest, type FarmSave, type FishingSpotId, type ShowCue,
} from '@farm/domain'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, Sheet } from '@luismlorenzana/uma-kit/ui'
import { GuideButton } from '../guide/Guide'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ItemIcon } from '../items/ItemIcon'
import { useMaster } from '../master/master'
import { commit, useGame, useLoopSave } from '../save/game'
import { useSpecialDays, useStory } from '../story/story'
import { CastRing } from './CastRing'
import { goldWords } from './goods-view'
import { useTalents } from './talents'
import { shortDate } from './words'

const SELECT = 'min-h-11 w-full min-w-0 rounded-md border border-hairline bg-panel px-2 text-[13px]'
const LINK = 'flex min-h-11 items-center text-[13px] font-semibold text-accent'
const CARD = 'min-w-0 space-y-1.5 rounded-md border border-hairline p-2.5 text-[13px]'
const LABELS = {
  'flower-show': ['Quality', 'Grade', 'Tending'],
  'fishing-derby': ['Cast 1', 'Cast 2', 'Cast 3'],
  'animal-show': ['Hearts', 'Feed', 'Care', 'Ring'],
  'harvest-cup': ['Exhibit 1', 'Exhibit 2', 'Exhibit 3', 'Presenters'],
}
const CATEGORIES = { field: 'Field', ranch: 'Ranch', fish: 'Fish', wild: 'Wild', workshop: 'Workshop', kitchen: 'Kitchen' }
const ORDINAL = ['1st', '2nd', '3rd']
const lotName = (key: string) => {
  const lot = parseStockKey(key)!
  const name = goodName(lot.id)
  const grade = goodOf(lot.id)?.grade ?? (restaurantGrade(lot.id) || recipeOf(lot.id)?.grade)
  return `${name}${grade && !name.endsWith(` G${grade}`) ? ` G${grade}` : ''} · ★${lot.stars}`
}
type Rule = (save: FarmSave) => FarmSave
type Act = (rule: Rule) => void

export default function FestivalSheet() {
  const save = useLoopSave()
  const location = useLocation()
  const leave = useLeave()
  const story = useStory()
  const days = useSpecialDays() ?? { festivals: festivalsOf(story), birthdays: NO_BIRTHDAYS }
  const talents = useTalents()
  const master = useMaster()
  const [note, setNote] = useState('')
  const inFlight = useRef(false)
  const params = new URLSearchParams(location.search)
  const requested = params.get('contest')
  const year = dateOf(save?.calendar.day ?? 1).year
  const upcoming = CONTESTS.map((id) => ({ id, day: contestDate(id, year, days) }))
    .filter(({ day }) => day !== null && day >= (save?.calendar.day ?? 1)).sort((a, b) => a.day! - b.day!)
  const [chosen, setChosen] = useState<FarmContest | null>(null)
  if (!save) return null
  const play = activeContest(save)
  const id = play?.id ?? chosen ?? (requested && isFarmContest(requested) ? requested : upcoming[0]?.id ?? 'flower-show')
  const day = save.calendar.day
  const nameOf = (id: string | null) => id === null ? 'Farmer' : (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? `Uma ${id}`
  const name = days.festivals.find((festival) => festival.rule === id)?.name ?? FESTIVAL_CONTESTS[id].name
  const context: ContestContext = { days, story, talentOf: talents.of }
  const act: Act = (rule) => {
    if (inFlight.current) return
    setNote('')
    const live = useGame.getState().save
    if (!live || live.calendar.day !== day) return
    try {
      const next = rule(live)
      if (next === live) return
      inFlight.current = true
      void commit(touched(next, new Date().toISOString())).catch((err: unknown) => setNote(err instanceof Error ? err.message : 'Try again.'))
        .finally(() => { inFlight.current = false })
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Try again.')
    }
  }
  const close = () => {
    const url = new URLSearchParams(location.search)
    url.delete('contest')
    leave(withParam({ ...location, search: url.size ? `?${url}` : '' }, 'sheet', null))
  }
  const last = festivalResult(save, id)
  return (
    <Sheet open size="wide" label={name} title={name} onClose={close}>
      {play ? <Active key={`${play.id}:${play.seed}`} play={play} act={act} nameOf={nameOf} />
        : <div className="space-y-2 pb-2" data-festival-sheet={id}>
          <div className="flex items-center gap-2">
            <select aria-label="Festival contest" className={SELECT} value={id} onChange={(e) => setChosen(e.target.value as FarmContest)}>
              {CONTESTS.map((id) => <option key={id} value={id}>{days.festivals.find((day) => day.rule === id)?.name ?? FESTIVAL_CONTESTS[id].name}</option>)}
            </select>
            <GuideButton topic="festivals" title={name} label="Contest rules">
              <p>Entries take three actions. Festival event actions go first. Each Uma who helps on the day spends a work action.</p>
              <p>Rival scores follow Farm Rank. Ties go to you.</p>
            </GuideButton>
          </div>
          {last && <Result id={id} result={last} nameOf={nameOf} save={save} />}
          {last?.day !== day && <Entry key={id} id={id} save={save} context={context} act={act} nameOf={nameOf} />}
        </div>}
      {note && <p className="py-2 text-[13px] text-danger" role="status">{note}</p>}
    </Sheet>
  )
}

interface EntryProps { save: FarmSave; context: ContestContext; act: Act; nameOf: (id: string | null) => string }
type FormProps = EntryProps & { lock: string | null }

function Entry({ id, ...props }: EntryProps & { id: FarmContest }) {
  const { save, context } = props
  const year = dateOf(save.calendar.day).year
  const planned = contestDate(id, year, context.days)
  const date = planned !== null && planned < save.calendar.day ? contestDate(id, year + 1, context.days) : planned
  const lock = festivalEntryLock(save, id, context.days)
  const [first, second] = contestCutoffs(id, farmRankOf(save.farm.points))
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-ink-soft">{date === null ? 'Outside this year’s calendar' : shortDate(date)} · {FESTIVAL_CONTESTS[id].rivals[0]} {first} · {FESTIVAL_CONTESTS[id].rivals[1]} {second}</p>
      {id === 'flower-show' ? <Flower {...props} lock={lock} /> : id === 'fishing-derby' ? <Derby {...props} lock={lock} />
        : id === 'animal-show' ? <Animal {...props} lock={lock} /> : <Cup {...props} lock={lock} />}
    </div>
  )
}

function Submit({ lock, onEnter, use }: { lock: string | null; onEnter: () => void; use: string }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2">
    <p className="text-[13px] text-ink-soft">{lock ?? use}</p>
    <Button disabled={lock !== null} onClick={onEnter} data-enter-contest>Enter · {FESTIVAL_ACTION_COST}</Button>
  </div>
}

function lots(save: FarmSave, fits: (key: string) => boolean): string[] {
  return Object.entries(save.items).flatMap(([id, row]) => row.flatMap((count, i) => {
    const key = stockKey(id, i + 1)
    return count && fits(key) ? [key] : []
  }))
}

function Flower({ save, context, act, nameOf, lock }: FormProps) {
  const state = save.workshops.festival
  const [stock, setStock] = useState('')
  const [grower, setGrower] = useState('')
  const [tile, setTile] = useState(state?.mark?.tile ?? -1)
  const [crop, setCrop] = useState<CropId>(state?.mark?.crop ?? 'carrot')
  const tiles = fieldTiles(save)
  const choices = lots(save, (key) => flowerPreview(save, key, null) !== null)
  const pick = stock === 'box' || (!stock && state?.box) ? null : stock || choices[0] || ''
  const preview = flowerPreview(save, pick, grower || null, context.days)
  const marking = flowerMarkLock(save, tile, crop, context.days)
  return <div className="space-y-2">
    <div className="grid gap-2 sm:grid-cols-2">
      <div className={CARD}>
        <label className="block font-semibold">Exhibit
          <select className={SELECT} value={pick ?? 'box'} onChange={(e) => { setStock(e.target.value); setGrower('') }}>
            {!choices.length && !state?.box && <option value="">No eligible crops held</option>}
            {state?.box && <option value="box">Box · {lotName(state.box.key)}</option>}
            {choices.map((key) => <option key={key} value={key}>{lotName(key)}</option>)}
          </select>
        </label>
        {preview?.hands.length ? <label className="block">Grower
          <select className={SELECT} value={grower} onChange={(e) => setGrower(e.target.value)}>
            <option value="">No grower named</option>{preview.hands.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
          </select></label> : null}
        {preview && <Parts id="flower-show" values={preview.parts} />}
      </div>
      <div className={CARD}>
        <h3 className="font-semibold">Set aside a harvest</h3>
        {state?.box ? <><p>In the box · {lotName(state.box.key)}</p><Button variant="secondary" onClick={() => { act(releaseFlower); setStock(''); setGrower('') }}>Return crop</Button></> : <>
          <select className={SELECT} aria-label="Marked field tile" value={tile} onChange={(e) => {
            const index = Number(e.target.value)
            setTile(index)
            if (tiles[index]?.crop) setCrop(tiles[index]!.crop!)
          }}>
            <option value={-1}>Choose a tilled tile</option>
            {tiles.flatMap((at, i) => at.ground === 'tilled' ? <option key={i} value={i}>
              Plot {Math.floor(i / FIELD_TILES) + 1} · Tile {i % FIELD_TILES + 1}{at.crop ? ` · ${goodName(at.crop)}` : ''}
            </option> : [])}
          </select>
          {!tiles[tile]?.crop && <select className={SELECT} aria-label="Crop to mark" value={crop} onChange={(e) => setCrop(e.target.value as CropId)}>
            {CROP_IDS.map((id) => <option key={id} value={id}>{goodName(id)}</option>)}
          </select>}
          <Button variant="secondary" disabled={marking !== null} onClick={() => act((live) => markFlowerTile(live, tile, crop, context.days))}>Set aside next harvest</Button>
          {state?.mark ? <div className="flex flex-wrap gap-2">
            <Link className={LINK} to={`/field?tile=${state.mark.tile}`}>Marked {goodName(state.mark.crop)} ›</Link>
            <Button variant="secondary" onClick={() => act(releaseFlower)}>Clear mark</Button>
          </div> : tile >= 0 && marking && <p className="text-ink-soft">{marking}</p>}
        </>}
      </div>
    </div>
    <Submit lock={lock ?? (preview?.valid ? null : 'Choose an available crop.')} use="Donates one crop."
      onEnter={() => act((live) => enterFlower(live, pick, grower || null, context.days))} />
  </div>
}

function Available({ save, context, nameOf, selected, onPick, label, hands, describe }: EntryProps & {
  selected: string; onPick: (id: string) => void; label: string; hands: readonly string[]; describe?: (id: string) => string
}) {
  return <select className={SELECT} aria-label={label} value={selected} onChange={(e) => onPick(e.target.value)}>
    <option value="">Farmer</option>
    {hands.map((id) => {
      const why = festivalHandLock(save, id, context.story)
      return <option key={id} value={id} disabled={why !== null}>{nameOf(id)}{why ? ` · ${why}` : describe?.(id)}</option>
    })}
  </select>
}

function Derby(props: FormProps) {
  const { save, context, act, lock } = props
  const [spot, setSpot] = useState<FishingSpotId>('pond')
  const [crew, setCrew] = useState(['', '', ''])
  const date = contestDate('fishing-derby', dateOf(save.calendar.day).year, context.days) ?? save.calendar.day
  const fish = sharesOn('fishery', spot, date).filter(([, share]) => share > 0)
  const hands = Object.keys(save.roster).filter((id) => save.roster[id]?.farmhand !== undefined)
  return <div className="space-y-2">
    <div className="grid gap-2 sm:grid-cols-2">
      <div className={CARD}><label className="block font-semibold">Fishing spot
        <select className={SELECT} value={spot} onChange={(e) => setSpot(e.target.value as FishingSpotId)}>
          {FISHING_SPOTS.map((id) => {
            const why = reachLock(save, 'fishery', id)
            return <option key={id} value={id} disabled={why !== null}>{SPOT_NAMES[id]}{why ? ` · ${why}` : ''}</option>
          })}
        </select></label>
        <p>Rod Lv {save.tools.rod} · {save.farm.fishingModes?.[spot] ?? 'standard'}</p>
        <p className="text-ink-soft">{fish.map(([id]) => goodName(id)).join(' · ')}</p>
      </div>
      <div className={CARD}><p className="font-semibold">Three casts · Best two count</p>
        {crew.map((id, i) => {
          const others = crew.filter((row, at) => row && at !== i)
          return <label className="grid grid-cols-[auto_1fr] items-center gap-2" key={i}>Cast {i + 1}
            <Available {...props} label={`Cast ${i + 1}`} selected={id}
              hands={others.length < 2 ? hands.filter((hand) => !others.includes(hand)) : []}
              describe={(hand) => ` · Lv ${aptitudeOf(save.roster[hand]!, 'fish', (activity) => context.talentOf!(hand, activity)).level}`}
              onPick={(value) => setCrew((rows) => rows.map((row, n) => n === i ? value : row))} />
          </label>
        })}
      </div>
    </div>
    <Submit lock={lock ?? reachLock(save, 'fishery', spot) ?? crew.reduce<string | null>((why, id) => why ?? (id ? festivalHandLock(save, id, context.story) : null), null)}
      use={crew.some(Boolean) ? 'Each Uma commits one work action.' : 'Three casts by the farmer.'}
      onEnter={() => act((live) => enterDerby(live, spot, crew.map((id) => id || null), context))} />
  </div>
}

function Animal({ save, context, act, nameOf, lock }: FormProps) {
  const [animal, setAnimal] = useState('')
  const [caretaker, setCaretaker] = useState('')
  const [handler, setHandler] = useState(false)
  const [practice, setPractice] = useState('')
  const options = save.ranch.animals.filter(({ id }) => animalPreview(save, id))
  const selected = animal || options[0]?.id || ''
  const preview = animalPreview(save, selected)
  const handLock = caretaker ? festivalHandLock(save, caretaker, context.story) : 'Name a caretaker.'
  return <div className="space-y-2">
    <div className="grid gap-2 sm:grid-cols-2">
      <div className={CARD}>
        <label className="block font-semibold">Animal
          <select className={SELECT} value={selected} onChange={(e) => { setAnimal(e.target.value); setCaretaker(''); setHandler(false) }}>
            {!options.length && <option value="">No animals to show</option>}
            {options.map((animal) => <option key={animal.id} value={animal.id}>{animalName(save, animal)}</option>)}
          </select>
        </label>
        {preview && <><p>{preview.dates} of 7 days cared for</p>
          <label className="block">Caretaker<select className={SELECT} value={caretaker} onChange={(e) => { setCaretaker(e.target.value); setHandler(false) }}>
            <option value="">No caretaker named</option>{preview.caretakers.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
          </select></label>
          {caretaker && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" disabled={handLock !== null} checked={handler} onChange={(e) => setHandler(e.target.checked)} /> Bring her as handler</label>}
          <Link className={LINK} to={`/?peek=${ANIMALS[preview.animal.kind].home}`}>Animal’s home ›</Link>
        </>}
      </div>
      <div className={CARD}>
        <Parts id="animal-show" values={preview?.parts ?? []} /><p>Ring · up to 40</p>
        <Button variant="secondary" onClick={() => setPractice('cue')}>Practice cue</Button>
        {practice && <p>{CUE_WORDS.walk} {practice === 'cue' ? <Button variant="secondary" onClick={() => setPractice('done')}>Walk</Button> : 'Correct.'}</p>}
      </div>
    </div>
    <Submit lock={lock ?? (!preview ? 'Choose an owned animal.' : handler ? handLock : null)} use={handler ? 'Handler commits one work action.' : 'Farmer presents the animal.'}
      onEnter={() => act((live) => enterAnimal(live, selected, caretaker || null, handler, context))} />
  </div>
}

function Cup(props: FormProps) {
  const { save, context, act, lock } = props
  const stock = lots(save, (key) => cupCategory(parseStockKey(key)!.id) !== null && festivalStock(save, key) > 0)
  const [entries, setEntries] = useState<CupEntry[]>(Array.from({ length: 3 }, () => ({ key: '', by: null })))
  const category = (key: string) => cupCategory(parseStockKey(key)?.id ?? '')
  const update = (index: number, entry: CupEntry) => setEntries((rows) => rows.map((other, at) => index === at ? entry : other))
  const preview = cupPreview(save, entries, context.story)
  return <div className="space-y-2">
    <div className="grid gap-2 sm:grid-cols-3">
      {entries.map((entry, i) => {
        const kind = category(entry.key)
        const presenters = kind ? Object.keys(save.roster).filter((id) => cupWorkDay(save, id, kind) !== null && !entries.some((row, j) => j !== i && row.by === id)) : []
        return <div key={i} className={CARD}>
          <h3 className="font-semibold">Exhibit {i + 1}</h3>
          <select className={SELECT} aria-label={`Exhibit ${i + 1}`} value={entry.key} onChange={(e) => update(i, { key: e.target.value, by: null })}>
            <option value="">Choose a good</option>
            {stock.filter((key) => !entries.some((other, j) => j !== i && category(other.key) === category(key)))
              .map((key) => <option key={key} value={key}>{CATEGORIES[category(key)!]} · {lotName(key)}</option>)}
          </select>
          <Available {...props} label={`Presenter ${i + 1}`} selected={entry.by ?? ''} hands={presenters} onPick={(id) => update(i, { ...entry, by: id || null })} />
          {entry.by && kind && cupWorkDay(save, entry.by, kind) && <p>Worked {shortDate(cupWorkDay(save, entry.by, kind)!)}</p>}
        </div>
      })}
    </div>
    {!preview.block && <><p className="text-[13px] font-semibold">Score {preview.score}</p><Parts id="harvest-cup" values={preview.parts} /></>}
    <Submit lock={lock ?? preview.block} use="Donates three goods. Each Uma commits one work action."
      onEnter={() => act((live) => enterCup(live, entries, context))} />
  </div>
}

function Parts({ id, values }: { id: FarmContest; values: readonly number[] }) {
  return <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ink-soft">{values.map((value, i) => <span key={i}>{LABELS[id][i]} {value}</span>)}</div>
}

function Result({ id, result, nameOf, save }: { id: FarmContest; result: ContestCard; nameOf: EntryProps['nameOf']; save: FarmSave }) {
  const [first, second] = contestCutoffs(id, result.rank)
  const animal = result.animal && save.ranch.animals.find(({ id }) => id === result.animal?.id)
  return <section className={CARD} data-festival-result={id}>
    <p className="text-[15px] font-semibold">{result.place ? `${ORDINAL[result.place - 1]} · ${result.score} points · +${goldWords(result.gold)}` : 'No placement'} · {shortDate(result.day)}</p>
    <Parts id={id} values={result.parts} />
    <p className="text-ink-soft">{FESTIVAL_CONTESTS[id].rivals[0]} {first} · {FESTIVAL_CONTESTS[id].rivals[1]} {second}</p>
    {result.exhibits.map((key, i) => <p key={key} className="flex flex-wrap items-center gap-2"><ItemIcon id={parseStockKey(key)!.id} size={20} />
      {lotName(key)}{result.presenters?.[i] && <span className="text-ink-soft">· {nameOf(result.presenters[i]!)}</span>}</p>)}
    {result.animal && <p>{animal ? animalName(save, animal) : ANIMALS[result.animal.kind].name}</p>}
    {result.catches?.map((fish) => <p key={fish.slot}>{nameOf(fish.by)} · {lotName(fish.key)} · {fish.cm} cm</p>)}
    {result.staff.length > 0 && <p>Work booked · {result.staff.map(nameOf).join(', ')}</p>}
    {result.credit.length > 0 && <p>Win credit · {result.credit.map(nameOf).join(', ')}</p>}
  </section>
}

function Active({ play, act, nameOf }: { play: ActiveContest; act: Act; nameOf: EntryProps['nameOf'] }) {
  const same = (live: FarmSave) => activeContest(live)?.seed === play.seed && activeContest(live)?.id === play.id
  const update: Act = (rule) => act((live) => same(live) ? rule(live) : live)
  const slot = play.id === 'animal-show' ? play.answers.length : play.catches.length
  return <div className="space-y-1.5" data-active-festival={play.id}>
    {play.id === 'animal-show' ? <div className={CARD}>
      <p>Cue {slot + 1} of 4{play.handler ? ` · ${nameOf(play.handler)} handled ${play.auto}` : ''}</p>
      <p className="text-[17px] font-semibold">{CUE_WORDS[play.cues[slot]!]}</p>
      <div className="grid grid-cols-3 gap-2">{SHOW_CUES.map((cue: ShowCue) => <Button key={cue} onClick={() => update((save) => answerAnimal(save, slot, cue))}>{cue[0]!.toUpperCase() + cue.slice(1)}</Button>)}</div>
    </div> : <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
      <div className={CARD}><p>{SPOT_NAMES[play.spot]} · Cast {slot + 1} of 3</p>
        {play.catches.map((fish, i) => <p key={i}>{fish ? `${lotName(fish.key)} · ${fish.cm} cm` : 'Missed'}</p>)}
      </div>
      <div className="flex justify-center">{play.casters[slot]?.by
        ? <Button onClick={() => update((save) => castDerby(save, slot, null))}>{nameOf(play.casters[slot]!.by)} casts</Button>
        : <ManualCast key={slot} meet={derbyMeet(play, slot)} onCast={(tap) => update((save) => castDerby(save, slot, tap))} />}
      </div>
    </div>}
    <Button variant="secondary" onClick={() => update(settleFestival)}>End contest</Button>
  </div>
}

function ManualCast({ meet, onCast }: { meet: number; onCast: (elapsed: number | null) => void }) {
  const [started, setStarted] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const callback = useRef(onCast)
  callback.current = onCast
  useEffect(() => {
    if (started === null) return
    let frame: number
    const tick = () => {
      const elapsed = performance.now() - started
      if (elapsed >= DERBY_TURN_MS) callback.current(null)
      else { setElapsed(elapsed); frame = requestAnimationFrame(tick) }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [started])
  return <div className="space-y-1 text-center">
    {started !== null && <CastRing meet={meet} elapsed={elapsed} />}
    <Button onClick={() => started === null ? setStarted(performance.now()) : onCast(Math.min(DERBY_TURN_MS, performance.now() - started))}
      data-derby-tap={started === null ? 'ready' : 'reel'}>{started === null ? 'Cast' : 'Reel'}</Button>
  </div>
}
