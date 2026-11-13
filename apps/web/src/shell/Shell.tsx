// The shell (uma-kit's AppFrame, unchanged): the top bar, the page between, the bottom bar in the thumb zone, and the
// menu sheet (`?sheet=menu`). F18's End the day (`?sheet=end`) and calendar (`?sheet=calendar`); F19's bin
// (`?sheet=bin`) and shop (`?sheet=shop`); F24's Farm Rank (`?sheet=rank`). Each is loaded when one opens. While the
// roster holds fewer than three, the start's sheet covers everything, the game's first tap; then a scene due plays
// over everything (F24: the opening scene after the picks, the closing scene the morning after chapter 1). On save v4
// the farmer's name sheet is the first screen instead, and arrival scenes play after the chapter's; in the romance
// build `?read=<a>-<b>:<levels>` plays a pair's conversations over any page, once no scene is due; and the
// event player over any page at `?event=`, `?ask=` or `?memory=`, and her Memories' album at `?album=`; and the
// evening over any page at `?evening=` (Tonight's picker, or her kinds sheet, the play and its card); and the ring
// bench at `?sheet=bench` from the Forge's quick look; and the homestead at `?sheet=homestead`, a night level's card at
// `?level=<id>:<s2|s4>` and a household scene or the finale at `?household=<id>` (`&replay=1` from the Diary).
import { picksLeft, sceneDue } from '@farm/domain'
import { AppFrame, useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { lazy, Suspense } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { romanceOn } from '../app/romance'
import { useGame } from '../save/game'
import { castIds, useStory } from '../story/story'
import { FarmAccountBar, FarmBottomBar, type BarPage } from './Bars'
import { MenuSheet } from './MenuSheet'
import { SyncWarning } from './SyncWarning'

const LoopSheets = lazy(() => import('../loop/LoopSheets'))
const StartPicks = lazy(() => import('../loop/StartPicks'))
const ScenePlayer = lazy(() => import('../loop/ScenePlayer'))
const NameSheet = lazy(() => import('../loop/NameSheet'))
// The romance build's only: the switch folds at build time, and the deployed build drops the import.
const PairPlayer = /* @__PURE__ */ lazy(() => import('../loop/PairPlayer'))
const EventPlayer = /* @__PURE__ */ lazy(() => import('../loop/EventPlayer'))
const Memories = /* @__PURE__ */ lazy(() => import('../loop/Memories'))
const EveningPlayer = /* @__PURE__ */ lazy(() => import('../loop/EveningPlayer'))
const BenchSheet = /* @__PURE__ */ lazy(() => import('../loop/BenchSheet'))
const HomesteadSheet = /* @__PURE__ */ lazy(() => import('../loop/HomesteadSheet'))
const NightLevel = /* @__PURE__ */ lazy(() => import('../loop/NightLevel'))
const HouseholdPlayer = /* @__PURE__ */ lazy(() => import('../loop/HouseholdPlayer'))

const PAGES: Readonly<Record<string, BarPage>> = { '/': 'farm', '/roster': 'roster', '/hearts': 'hearts', '/diary': 'diary' }
const SHEETS = ['end', 'calendar', 'bin', 'shop', 'rank'] as const
type LoopSheet = typeof SHEETS[number]
const isLoopSheet = (sheet: string | null): sheet is LoopSheet => (SHEETS as readonly (string | null)[]).includes(sheet)

export function Shell() {
  const location = useLocation()
  const [search] = useSearchParams()
  const leave = useLeave()
  const sheet = search.get('sheet')
  const picking = useGame((s) => s.save?.version === 3 && picksLeft(s.save) > 0)
  const naming = useGame((s) => s.save?.version === 4 && s.save.farmer.name === '')
  useStory() // a scene's order waits for the pack (v4)
  const scene = useGame((s) => (s.save ? sceneDue(s.save, castIds()) : null))
  const read = romanceOn() ? search.get('read') : null
  const playing = romanceOn() ? search.get('event') ?? search.get('ask') ?? search.get('memory') : null
  const album = romanceOn() ? search.get('album') : null
  const evening = romanceOn() ? search.get('evening') : null
  const level = romanceOn() ? search.get('level') : null
  const household = romanceOn() ? search.get('household') : null
  const v4 = useGame((s) => s.save?.version === 4)
  return (
    <AppFrame
      top={<><FarmAccountBar /><SyncWarning /></>}
      bottom={<FarmBottomBar page={PAGES[location.pathname] ?? null} />}
      overlays={
        <>
          <MenuSheet open={sheet === 'menu'} onClose={() => leave(withParam(location, 'sheet', null))} />
          {isLoopSheet(sheet) && !picking && !naming && !scene && <Suspense fallback={null}><LoopSheets key={sheet} sheet={sheet} /></Suspense>}
          {picking && <Suspense fallback={null}><StartPicks /></Suspense>}
          {naming && <Suspense fallback={null}><NameSheet /></Suspense>}
          {scene && <Suspense fallback={null}><ScenePlayer key={scene} scene={scene} /></Suspense>}
          {romanceOn() && read && v4 && !naming && !scene && <Suspense fallback={null}><PairPlayer key={read} read={read} /></Suspense>}
          {romanceOn() && album && v4 && !naming && !scene && <Suspense fallback={null}><Memories key={album} /></Suspense>}
          {romanceOn() && playing && v4 && !naming && !scene && !read && <Suspense fallback={null}><EventPlayer key={playing} /></Suspense>}
          {romanceOn() && evening && v4 && !naming && !scene && !read && !playing && <Suspense fallback={null}><EveningPlayer key={evening} /></Suspense>}
          {romanceOn() && sheet === 'bench' && v4 && !naming && !scene && <Suspense fallback={null}><BenchSheet /></Suspense>}
          {romanceOn() && sheet === 'homestead' && v4 && !naming && !scene && <Suspense fallback={null}><HomesteadSheet /></Suspense>}
          {romanceOn() && level && v4 && !naming && !scene && !read && !playing && <Suspense fallback={null}><NightLevel key={level} value={level} /></Suspense>}
          {romanceOn() && household && v4 && !naming && !scene && !read && !playing && <Suspense fallback={null}><HouseholdPlayer key={household} value={household} replay={search.get('replay') === '1'} /></Suspense>}
        </>
      }
    >
      <Outlet />
    </AppFrame>
  )
}
