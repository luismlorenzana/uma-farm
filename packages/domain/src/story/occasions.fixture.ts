// Invented occasion scenes and talk for the stand-in (9000001–9000003): 9000001 gets a scene for every occasion a route
// can write (the Cooking Contest's night under the story's alias, `harvest-moon`), her greetings, small talk and gift
// lines; 9000002 only her anniversary. Every line is made up for the tests. No original-game content.
import { FESTIVALS, FESTIVAL_NIGHTS, GAME_DAYS_OF_STORY, type GiftLines, type Greetings, type Route, type SmallTalk, type UmaBible } from './authored'
import type { PackFiles } from './pack'
import { STAND_IN_FILES } from './stand-in'

const [ONE, TWO] = ['9000001', '9000002']

/** An invented occasion scene: one line naming it. */
const scene = (id: string) => ({ id, steps: [{ say: ONE, line: `An invented ${id} scene.` }] })

/** 9000001's occasion ids: New Year's, the five festivals' days and nights (the Cooking Contest's as `harvest-moon`), her
 * birthday, her anniversary and the game's six small days. */
export const ONE_OCCASIONS: readonly string[] = [
  'new-year', ...FESTIVALS, ...FESTIVALS.map((f) => (f === 'cooking-contest' ? 'harvest-moon' : FESTIVAL_NIGHTS[f][0]!)), 'birthday', 'anniversary', ...GAME_DAYS_OF_STORY.map((d) => d.id),
]

/** Her invented greetings: one set of each kind, each line naming its set. */
export const GREETINGS: Greetings = {
  birthday: ['A birthday hello.'],
  places: { fields: ['A hello in the Fields.'], dorm: ['A hello at the Dorm.'], cafe: ['A hello at the Café.'], town: ['A hello in town.'], fishery: ['A hello at the Fishery.'] },
  seasons: { spring: ['A spring hello.'], summer: ['A summer hello.'] },
  times: { morning: ['A morning hello.'], evening: ['An evening hello.'], night: ['A night hello.'] },
  weather: { rain: ['A rainy hello.'] },
}

/** Her invented small talk: one for each tag alone, one with every tag, and one with none. */
export const SMALL_TALK: SmallTalk[] = [
  { lines: [[ONE, 'Small talk in the Fields.'], ['you', 'Your answer in the Fields.'], [ONE, 'Her last word in the Fields.']], at: 'fields' },
  { lines: [[ONE, 'Small talk in winter.'], ['you', 'Your winter answer.'], [ONE, 'Her last winter word.']], season: 'winter' },
  { lines: [[ONE, 'Small talk for a spouse.'], ['you', 'Your answer as her husband.'], [ONE, 'Her last word as a wife.']], stage: 'spouse' },
  { lines: [[ONE, 'Small talk at the Café in spring, a friend.'], ['you', 'Your café answer.'], [ONE, 'Her café word.']], at: 'cafe', season: 'spring', stage: 'friend' },
  { lines: [[ONE, 'Small talk anywhere.'], ['you', 'Your answer anywhere.'], [ONE, 'Her word anywhere.']] },
]

/** Her invented gift lines: two for each taste, and her birthday's. */
export const GIFT_LINES: GiftLines = {
  loved: ['A loved line.', 'Another loved line.'], liked: ['A liked line.'], neutral: ['A neutral line.'], disliked: ['A disliked line.'], birthday: ['A birthday gift line.'],
}

/** The stand-in with 9000001's occasions and talk written and 9000002's anniversary; `world` added when given. */
export function withOccasions(world?: unknown): PackFiles {
  const route = STAND_IN_FILES.routes[ONE] as Route
  const bible = STAND_IN_FILES.umas[ONE] as UmaBible
  return {
    ...STAND_IN_FILES,
    umas: { ...STAND_IN_FILES.umas, [ONE]: { ...bible, greetings: GREETINGS, smallTalk: SMALL_TALK, giftLines: GIFT_LINES } },
    routes: {
      ...STAND_IN_FILES.routes,
      [ONE]: { ...route, events: [...route.events, ...ONE_OCCASIONS.map(scene)] },
      [TWO]: { ...(STAND_IN_FILES.routes[TWO] as Route), events: [...(STAND_IN_FILES.routes[TWO] as Route).events, { id: 'anniversary', steps: [{ say: TWO, line: 'An invented anniversary.' }] }] },
    },
    ...(world === undefined ? {} : { world }),
  }
}
