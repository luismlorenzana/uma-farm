import { BATCH_MEALS, DAY_ACTIONS, DAYS_PER_SEASON, CREDIT_SWEEP, LOAN_FEE, MEALS_A_DAY, loanFee, RING_DEPOSIT, STANDARD_RING_COST, TAKEOUT_PRICE } from '@farm/domain'

export type GuideIcon = 'home' | 'time' | 'night' | 'crop' | 'goods' | 'rank' | 'animal' | 'tools' | 'town' | 'book' | 'heart' | 'star' | 'festival' | 'trade' | 'save'
type GuideItem = readonly [icon: GuideIcon, label: string, instruction: string]
interface Topic { title: string; lead: string; items: readonly GuideItem[]; flow?: boolean; example?: string }

const loanExample = 400
const owedExample = loanExample + loanFee(loanExample)

const GUIDE_TOPICS = {
  actions: {
    title: 'Daily actions', lead: `You have ${DAY_ACTIONS} actions before you end the day. You choose how to spend them.`,
    items: [
      ['time', 'What uses an action', 'Tending a tile, gathering, shipping a crate, talking and giving a gift all use the counter in the top bar.'],
      ['town', 'What is free', 'Go into town, browse menus, shop and read the calendar whenever you like.'],
      ['night', 'What waits for night', 'Your Umas work their shifts, crops grow, and the bin pays when you end the day.'],
    ],
    example: 'Save an action for the shipping bin if you need money by morning.',
  },
  farm: {
    title: 'Around the farm', lead: 'Choose a place based on what the farm needs today.',
    items: [
      ['crop', 'Fields', 'Grow vegetables and fruit. Water unripe crops before you leave for town.'],
      ['tools', 'Woods and Fishery', 'Gather wild food, chop logs for buildings, or catch fish to sell or cook.'],
      ['trade', 'Shipping bin', 'Send goods from the Warehouse to turn spare stock into gold overnight.'],
      ['home', 'Farmhouse', 'Cook meals for tonight and check what the farm will need before you end the day.'],
    ],
  },
  fields: {
    title: 'Crops and plots', lead: 'Tap a field tile to see the jobs you can do on it.',
    flow: true,
    items: [
      ['tools', 'Prepare and plant', 'Clear weeds and till the soil. Pick a seed that grows this season.'],
      ['crop', 'Water before night', 'A watered crop grows overnight. Check dry tiles first when actions run low.'],
      ['goods', 'Harvest when ripe', 'Pick the crop from its tile. Some plants stay in the ground and produce another harvest.'],
    ],
    example: 'Carrots need four watered nights. Check the days left in the season before planting near its end.',
  },
  grades: {
    title: 'Crop grades and orchards', lead: 'The grade on the item is the version a recipe asks for. Stars show its quality.',
    items: [
      ['star', 'Improve your harvest', 'Skill can improve crop grade. Save seeds from your own produce to carry its grade into a later crop.'],
      ['crop', 'Keep fruit trees growing', 'An orchard plant stays on the tile across seasons. Check its bearing season to know when to harvest.'],
    ],
  },
  gathering: {
    title: 'Gathering and fishing', lead: 'Gathering is an early source of food, build materials and shipping gold.',
    items: [
      ['tools', 'Pick the job you need', 'Choose Gather for wild food, Chop for timber, or a fishing spot for fish. Read the preview to see what it can yield this season.'],
      ['town', 'Move when hauls get thin', 'A heavily worked spot yields less for the rest of the day. Try another open spot or leave it until tomorrow.'],
      ['star', 'Target a higher grade', 'At the Fishery, use Improved or Select catch once you qualify. The fish species still depends on the spot and season.'],
    ],
  },
  economy: {
    title: 'Earning gold', lead: 'The shipping bin pays at night. The gold chip opens it from anywhere on the farm.',
    flow: true,
    items: [
      ['goods', 'Fill a crate', 'Pick goods from the Warehouse, review the quantities, then ship the crate for one action.'],
      ['night', 'Read the morning report', 'Check the sale and the food and upkeep bills before deciding what to buy next.'],
    ],
    example: 'Keep food for the pantry and parts for your next build. Repeatedly flooding the market with one good lowers its price.',
  },
  warehouse: {
    title: 'Warehouse', lead: 'Check what you have before buying seeds or promising a recipe.',
    items: [
      ['star', 'Read grade and stars', 'When a recipe lists a specific grade, check that exact item. A higher grade belongs to its own stock line.'],
      ['trade', 'Keep what you will use', 'Pick surplus goods in the Shipping bin. Use dishes as ingredients or meals when the corresponding recipe or meal picker accepts them.'],
    ],
  },
  upkeep: {
    title: 'Meals and upkeep', lead: `The farm serves ${MEALS_A_DAY} meals per person each night. Farmhands eat with you on farm shifts.`,
    items: [
      ['goods', 'Cook before ending the day', `A Farmhouse batch uses two food goods and makes ${BATCH_MEALS} meals. Use the pantry forecast to cook close to tonight’s need.`],
      ['trade', 'Leave room for the bill', `Each missing meal costs ${TAKEOUT_PRICE}g. Nightly income also pays for buildings and residents before it pays loans.`],
    ],
    example: `On a solo day, an empty pantry costs ${MEALS_A_DAY * TAKEOUT_PRICE}g in takeout.`,
  },
  rank: {
    title: 'Farm Rank', lead: 'Use the rank badge to see which building, plot or tool becomes available next.',
    items: [
      ['rank', 'Make progress through play', 'Ship goods, build places and complete Diary milestones. Farm Rank opens choices. The build screen shows what you need to pay or bring.'],
    ],
  },
  shop: {
    title: 'What to buy', lead: 'The shop is free to browse. Spend gold where it removes a bottleneck on your farm.',
    items: [
      ['crop', 'Buy seeds that have time to grow', 'The seed row shows its growing seasons. Compare its growth time with the calendar before buying a stack.'],
      ['trade', 'Keep gold for tonight', 'Check the Ledger before a large purchase. A few spare meals or a crate ready to ship can bridge a tight night.'],
    ],
  },
  builds: {
    title: 'Build orders', lead: 'Pick the building that serves your next goal, such as a Mill to turn grain into flour.',
    items: [
      ['rank', 'Read the lock', 'Open the place on the map or the Mayor’s Office to see the required Farm Rank, materials and gold.'],
      ['home', 'Order it when you can cover the bill', 'The building is ready in the morning. Its upkeep starts once it stands.'],
    ],
  },
  loans: {
    title: 'Loans', lead: 'The Mayor’s Office offers shared credit for projects, gold, and quoted materials.',
    items: [
      ['trade', 'Know what you will owe', `Check the offer before accepting. The fee is ${Math.round(100 * LOAN_FEE)}% before rounding.`],
      ['book', 'Track repayment', `The farm puts ${Math.round(CREDIT_SWEEP * 100)}% of sales left after bills toward the loans. Choose Pay any amount at the office to make an extra payment.`],
    ],
    example: `Borrow ${loanExample}g → owe ${owedExample}g. If 700g in sales is left after bills, the loans get ${Math.floor(700 * CREDIT_SWEEP)}g that night.`,
  },
  town: {
    title: 'Visiting town', lead: 'Town is free to enter. Go even on a day when you only want to shop or see who is out.',
    items: [
      ['town', 'Find someone', 'Open People and search her name. Her row shows where she is today or when she will next be out.'],
      ['heart', 'Use actions with her', 'An introduction unlocks her book. Talk, give a gift, or choose an evening when you can meet her.'],
    ],
  },
  relationships: {
    title: 'Relationships', lead: 'Open her book for your current standing, the next scene, and dates you can plan around.',
    items: [
      ['heart', 'Fill her relationship bar', 'Talk, gift and spend evenings with her. Check her gift tastes and where to find her before using actions.'],
      ['book', 'Play a Ready scene', 'Playing the scene moves the relationship ahead. Some scenes need a place, a ring or another condition listed on her page.'],
      ['home', 'Plan the wedding', 'After accepting her confession, pick a date in the calendar. The proposal still comes before the ceremony.'],
    ],
  },
  staff: {
    title: 'Farmhands and shifts', lead: 'At Friendship 3, invite her to work. You can start by handing over one daily job.',
    items: [
      ['book', 'Give her an order', 'Tap Work on the farm. Assign an uncovered job to the suggested Uma, or open Add a task for a quick job or a custom order.'],
      ['time', 'Check the rota', 'She works your land on her farm shifts. Check the Calendar or her profile when deciding who will cover a day.'],
      ['night', 'Read the forecast and report', 'The forecast shows what she can do with today’s stock and time. Check the morning report for what actually got done.'],
    ],
    example: 'Prioritize watering ahead of gathering if your planted rows are still dry.',
  },
  aptitudes: {
    title: 'Talents and aptitudes', lead: 'Use the Abilities page to match an Uma to a job.',
    items: [
      ['star', 'Talent is her head start', 'Look at the activity’s talent grade when you first assign her. Her favourite line earns extra rank points.'],
      ['tools', 'Aptitude grows with practice', 'The level shown beside the task rises as she works it. Higher levels can open tricks such as watering a whole row in one action.'],
    ],
  },
  animals: {
    title: 'Animals', lead: 'Build the right home, then visit the Rancher for an animal and fodder.',
    items: [
      ['crop', 'Feed every day', 'Feed by hand or assign care to a farmhand. Check the silo before the night if the crew is handling it.'],
      ['animal', 'Care and collect', 'Care builds fondness. Collect ready goods from the building. A skilled worker and a well-loved animal can improve what you collect.'],
    ],
  },
  stations: {
    title: 'Crafting stations', lead: 'Stations turn raw items into goods you can ship or use in another recipe.',
    items: [
      ['goods', 'Check inputs before starting', 'Open the recipe at the station. Match the item and grade it asks for and leave enough stock for the rest of the farm.'],
      ['night', 'Schedule the load', 'Start it now or give the station an order and a worker. Finished goods appear in the Warehouse in the morning.'],
    ],
  },
  mining: {
    title: 'Mine and Quarry', lead: 'Visit deeper floors to find materials your current floor does not offer.',
    items: [
      ['tools', 'Work a face', 'Spend an action to mine it. The place shows what that depth can yield and whether further work will be thin.'],
      ['town', 'Use the stairs when they open', 'Check for stairs after working the floor. Taking them is free once available.'],
    ],
  },
  kitchen: {
    title: 'Kitchen and pantry', lead: 'Use the Farmhouse for everyday meals. The built Kitchen opens recipe play and staff meals.',
    items: [
      ['goods', 'Feed the farm tonight', 'Cook a Farmhouse batch with two food goods. See how many meals you already have before using ingredients.'],
      ['tools', 'Play a recipe at the Kitchen', 'Choose ingredients that fit the recipe and play the stove. Keep the resulting dishes for food or shipment.'],
    ],
  },
  restaurant: {
    title: 'Restaurant', lead: 'Clear service stages to open the menus. Discover every ingredient at the recipe’s exact grade to learn the dish.',
    items: [
      ['book', 'Check the recipe you want', 'Open its ingredient list. A discovery comes from obtaining that grade through play. Current stock is what lets you cook it again.'],
      ['trade', 'Decide what to do with the dish', 'Ship it for gold, use it in another dish, or save it for meals. Keep enough for any service you plan to run.'],
    ],
  },
  calendar: {
    title: 'Calendar', lead: `Open the date chip to see the ${DAYS_PER_SEASON} days of a season and the plans on each date.`,
    items: [
      ['time', 'Move around the year', 'Swipe the grid or use the arrows below it. Two rows of six show days 1–12, then 13–24, then 25–30. Tap a season to change seasons.'],
      ['festival', 'Check a date before you commit', 'The panel shows events, birthdays, work shifts and weddings. Select Today to return to the day you are playing.'],
    ],
  },
  festivals: {
    title: 'Festivals', lead: 'Open the Festival ground before the event to see what you can prepare.',
    items: [
      ['crop', 'Prepare for the contest you picked', 'Mark a crop tile for the Flower Show, care for the animal you plan to show, or set aside exhibits for the Harvest Cup.'],
      ['heart', 'Choose the helpers who did the work', 'Entries use your farm’s goods and recent work. Contests and scenes use bonus actions first, then regular actions. The calendar shows what’s left.'],
    ],
  },
  expeditions: {
    title: 'Expeditions', lead: 'At the Expedition post, choose a route, an eligible party and the supplies it requires.',
    items: [
      ['time', 'Check who will cover the farm', 'The party is away for the listed days. Check its return date and cover any essential watering, feeding or cooking shifts.'],
      ['book', 'Read the return report', 'The morning report lists the goods they brought back. Her Library book records her contribution.'],
    ],
  },
  household: {
    title: 'Married life', lead: 'A spouse keeps her existing work rota. Night visits are a separate way to spend time together.',
    items: [
      ['night', 'Spend time together at night', 'Open Night visits and choose a spouse at home. Greater Love opens outfits and eventually True Love.'],
      ['heart', 'Look for special visits', 'Birthday and anniversary visits use their own occasion looks. Check her book for the next date.'],
      ['home', 'See what you have unlocked', 'Her Married Life page shows earned outfits and scenes. A configured duo becomes available when both have reached True Love.'],
    ],
  },
  rings: {
    title: 'The ring bench', lead: 'The bench opens as romance advances. A proposal needs a ring from your Warehouse.',
    items: [
      ['goods', 'Commission the ring', `The smith supplies the Copper Ring’s metal and gem. Pay ${STANDARD_RING_COST.toLocaleString('en-US')}g or finance it with ${RING_DEPOSIT.toLocaleString('en-US')}g down. It arrives the next dawn.`],
      ['heart', 'Propose', 'Choose the ring you want to give when the proposal scene is Ready.'],
    ],
  },
  library: {
    title: 'Uma Library', lead: 'Meet her in town to unlock her book.',
    items: [
      ['heart', 'See where you stand', 'Her book opens to Relationship, with current progress and dates you can open in the calendar.'],
      ['book', 'Browse your collection', 'Sort by Relationship, show unlocked books in Cast order or by Name, or browse the original tiers.'],
      ['star', 'Fill the rest of her book', 'Play scenes, discover tastes, and spend time together to fill her pages. Replays are free.'],
    ],
  },
  diary: {
    title: 'Farm Diary', lead: 'Use the Diary to check what your farm has done and what you can work toward.',
    items: [
      ['book', 'Find farm-wide records', 'Check milestones, sales records and the details of recent mornings. For a particular Uma’s history, open her Library book.'],
    ],
  },
  sync: {
    title: 'Saves and sync', lead: 'The phone saves as you play. Check Account for the status before switching devices.',
    items: [
      ['save', 'Wait for cloud sync on your current device', 'If the app says Offline, keep that device’s copy and let it sync when the connection returns.'],
      ['book', 'Find a recovery copy', 'Account lists kept copies if one device replaced local changes. Check the date before restoring one.'],
    ],
  },
} satisfies Record<string, Topic>

export type TopicId = keyof typeof GUIDE_TOPICS
export const TOPICS: Readonly<Record<TopicId, Topic>> = GUIDE_TOPICS

export const GROUPS: readonly { title: string; topics: readonly TopicId[] }[] = [
  { title: 'Daily farm', topics: ['actions', 'farm', 'fields', 'grades', 'gathering', 'animals', 'stations', 'mining'] },
  { title: 'Gold and growth', topics: ['economy', 'warehouse', 'upkeep', 'rank', 'shop', 'builds', 'loans', 'kitchen', 'restaurant'] },
  { title: 'Town and people', topics: ['town', 'relationships', 'staff', 'aptitudes', 'calendar', 'festivals', 'expeditions', 'household', 'rings', 'library', 'diary', 'sync'] },
]
