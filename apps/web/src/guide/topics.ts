import { DAY_ACTIONS, DAYS_PER_SEASON, LOAN_FEE, loanFee, loanNightly } from '@farm/domain'

export type GuideIcon = 'home' | 'time' | 'night' | 'crop' | 'goods' | 'rank' | 'animal' | 'tools' | 'town' | 'book' | 'heart' | 'star' | 'festival' | 'trade' | 'save'
type Step = readonly [icon: GuideIcon, label: string]
interface Topic { title: string; steps: readonly [Step, Step, Step]; line: string }

const loanExample = 400
const owedExample = loanExample + loanFee(loanExample)

export const TOPICS = {
  actions: {
    title: 'Daily actions', steps: [['time', `${DAY_ACTIONS} actions`], ['tools', 'Do a job'], ['night', 'End day']],
    line: 'Most farm jobs take one action. Visiting town, browsing and shopping are free.',
  },
  farm: {
    title: 'Around the farm', steps: [['crop', 'Grow crops'], ['tools', 'Gather'], ['trade', 'Ship goods']],
    line: 'Open Fields to tend crops, the Woods to gather or chop, and the Fishery to fish.',
  },
  fields: {
    title: 'Crops and plots', steps: [['tools', 'Till & plant'], ['crop', 'Water daily'], ['goods', 'Harvest']],
    line: 'Watered crops grow overnight. The plot arrows show more land as Farm Rank opens it.',
  },
  grades: {
    title: 'Crop grades and orchards', steps: [['crop', 'Grow'], ['star', 'Raise grade'], ['goods', 'Save seeds']],
    line: 'A skilled harvest or seed saved from good produce can improve grade. Orchard plants stay in their plot.',
  },
  gathering: {
    title: 'Gathering and fishing', steps: [['town', 'Pick a spot'], ['tools', 'Gather'], ['goods', 'Store goods']],
    line: 'Seasons and skill change what you find. A spot gives smaller hauls after it’s worked heavily.',
  },
  economy: {
    title: 'Earning gold', steps: [['goods', 'Warehouse'], ['trade', 'Ship a crate'], ['night', 'Paid tonight']],
    line: 'A crate costs one action. Higher grades sell for more. Large sales of one good ease its price.',
  },
  warehouse: {
    title: 'Warehouse', steps: [['goods', 'Collect'], ['star', 'Check grade'], ['trade', 'Use or ship']],
    line: 'Stock is kept by exact grade. Keep ingredients for recipes and sell the rest through the shipping bin.',
  },
  upkeep: {
    title: 'Meals and upkeep', steps: [['goods', 'Fill pantry'], ['home', 'Feed the farm'], ['night', 'Settle bills']],
    line: 'The night uses meals first, buys takeout if needed, and charges upkeep for buildings and residents.',
  },
  rank: {
    title: 'Farm Rank', steps: [['tools', 'Work'], ['rank', 'Earn points'], ['town', 'See unlocks']],
    line: 'Shipping, building and milestones raise Farm Rank. Open the rank badge to see what comes next.',
  },
  shop: {
    title: 'What to buy', steps: [['rank', 'Check rank'], ['crop', 'Pick seeds'], ['trade', 'Spend gold']],
    line: 'The shop rotates seeds by season. Higher Farm Rank opens more stock. Check the crop’s growing season before buying.',
  },
  builds: {
    title: 'Build orders', steps: [['rank', 'Unlock'], ['goods', 'Bring materials'], ['home', 'Build']],
    line: 'Order a place on the farm or at the Mayor’s Office. Farm buildings finish overnight.',
  },
  loans: {
    title: 'Loans', steps: [['trade', `Borrow ${loanExample}g`], ['book', `${owedExample}g owed`], ['night', `${loanNightly(owedExample)}g due`]],
    line: `The office lends toward a build with a ${Math.round(100 * LOAN_FEE)}% fee. Each night’s income can pay its share after bills. You can repay early.`,
  },
  town: {
    title: 'Visiting town', steps: [['town', 'Enter free'], ['home', 'Pick a place'], ['heart', 'Meet her']],
    line: 'The map shows who’s out. Walking and shops are free. Introductions, talks and gifts take actions.',
  },
  relationships: {
    title: 'Relationships', steps: [['heart', 'Meet & talk'], ['star', 'Heart events'], ['home', 'Plan a wedding']],
    line: 'Talk, gift and spend time together. Open her profile for the next scene or decision.',
  },
  staff: {
    title: 'Farmhands and shifts', steps: [['heart', 'Invite'], ['book', 'Assign tasks'], ['night', 'Read report']],
    line: 'Assign jobs on the work board. Umas do them on their farm days and eat meals there.',
  },
  aptitudes: {
    title: 'Talents and aptitudes', steps: [['star', 'Check talent'], ['tools', 'Practise a job'], ['rank', 'Learn tricks']],
    line: 'Talent sets a head start. Repeating a task levels its aptitude and improves what an Uma can do.',
  },
  animals: {
    title: 'Animals', steps: [['animal', 'Buy an animal'], ['crop', 'Feed & care'], ['goods', 'Collect']],
    line: 'Fed animals leave goods by morning. Care and higher skill help improve the haul.',
  },
  stations: {
    title: 'Crafting stations', steps: [['goods', 'Stock inputs'], ['tools', 'Start a load'], ['night', 'Collect']],
    line: 'A load uses ingredients of the recipe’s grade. Find its output in the Warehouse the next morning.',
  },
  mining: {
    title: 'Mine and Quarry', steps: [['tools', 'Work a face'], ['goods', 'Find stone'], ['town', 'Take stairs']],
    line: 'Work a face for materials. Use the stairs for free once you find them.',
  },
  kitchen: {
    title: 'Kitchen and pantry', steps: [['goods', 'Add food'], ['tools', 'Cook'], ['night', 'Serve meals']],
    line: 'Cook batches in the Farmhouse for upkeep. Build the Kitchen to play recipes and serve a staff meal.',
  },
  restaurant: {
    title: 'Restaurant', steps: [['star', 'Discover grades'], ['book', 'Unlock recipes'], ['trade', 'Serve dishes']],
    line: 'Each recipe needs its ingredients discovered at their exact grades. Sell dishes, cook with them, or save them for meals.',
  },
  calendar: {
    title: 'Calendar', steps: [['book', `${DAYS_PER_SEASON} days`], ['town', 'Swipe seasons'], ['festival', 'Pick a date']],
    line: 'Scroll down the grid for later dates. Swipe across or tap a season. The arrows move one day at a time.',
  },
  festivals: {
    title: 'Festivals', steps: [['book', 'Check the date'], ['goods', 'Pick an entry'], ['festival', 'Compete']],
    line: 'Use goods and helpers from your actual farm. The calendar shows the event day and any extra actions.',
  },
  expeditions: {
    title: 'Expeditions', steps: [['heart', 'Pick a party'], ['goods', 'Pack food'], ['book', 'Read return']],
    line: 'Umas are away until the return date. Check the report for what they found and who took part.',
  },
  household: {
    title: 'Married life', steps: [['home', 'Make room'], ['night', 'Night visits'], ['heart', 'Greater Love']],
    line: 'Spouses keep their town and farm shifts. Night visits raise Greater Love and can unlock duos.',
  },
  rings: {
    title: 'The ring bench', steps: [['heart', 'Plan ahead'], ['goods', 'Gather parts'], ['tools', 'Make a ring']],
    line: 'The ring bench opens as romance advances. Use the required materials to make a proposal ring.',
  },
  library: {
    title: 'Uma Library', steps: [['book', 'Open her book'], ['heart', 'Fill pages'], ['star', 'Replay scenes']],
    line: 'Each Uma’s book saves her unlocked scenes, discoveries and relationship history.',
  },
  diary: {
    title: 'Farm Diary', steps: [['tools', 'Play the farm'], ['star', 'Earn milestones'], ['book', 'Read the Diary']],
    line: 'Find farm-wide achievements and records in the Diary. Personal histories are in the Library.',
  },
  sync: {
    title: 'Saves and sync', steps: [['home', 'Play'], ['save', 'Sync'], ['book', 'Check Account']],
    line: 'The device saves as you play. Account shows cloud sync and any recovery copies.',
  },
} as const satisfies Record<string, Topic>

export type TopicId = keyof typeof TOPICS

export const GROUPS: readonly { title: string; topics: readonly TopicId[] }[] = [
  { title: 'Daily farm', topics: ['actions', 'farm', 'fields', 'grades', 'gathering', 'animals', 'stations', 'mining'] },
  { title: 'Gold and growth', topics: ['economy', 'warehouse', 'upkeep', 'rank', 'shop', 'builds', 'loans', 'kitchen', 'restaurant'] },
  { title: 'Town and people', topics: ['town', 'relationships', 'staff', 'aptitudes', 'calendar', 'festivals', 'expeditions', 'household', 'rings', 'library', 'diary', 'sync'] },
]
