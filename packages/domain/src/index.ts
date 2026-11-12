// uma-farm's rules: pure, no I/O. F3 brought save v1; F4 the Wilds' rules, copied from uma-rpg at 30a322a (FM2,
// docs/technical/wilds-copy.md), and save v2; F17 the loop's units, goods and save v3 with its migration; F24 turned the loop on.
export const GAME = 'uma-farm' as const

// The lines, their items and the made items (R2, R4).
export * from './items/lines'
export * from './items/made-id'
export * from './items/made'
export * from './items/made-v4'
export * from './items/catalog'
export * from './items/stock-id'
export * from './economy/stock'

// The places, the trades and the pace (R2).
export * from './economy/jobs'
export * from './economy/pacing'
export * from './economy/professions'
export * from './economy/places-v4'
export * from './hub/places'

// Who works (FM6, FM7, R3).
export * from './roster/template'
export * from './roster/roster'

// The work engine's env (FM5).
export * from './work/world'
export * from './work/request'
export * from './work/env'
export * from './work/env-v3'
export * from './work/env-v4'

// The save (R5) and its work (R7), and what finished, for push (F6).
export * from './save/save'
export * from './save/rules'
export * from './save/work'
export * from './save/notify'

// The loop (F17, core spec CS1, CS3, CS32, CS53, CS54): the units, the goods' ids, save v3, its Warehouse by stars and
// the migration from v2.
export * from './farm/calendar'
export * from './farm/draw'
export * from './farm/round'
export * from './farm/ranks'
export * from './farm/farm'
export * from './goods/ids'
export * from './save/v3'
export * from './save/parse-v3'
export * from './save/warehouse'
export * from './save/gold'
export * from './save/migrate-v3'

// The day (F18, core spec CS4–CS8): the farm map's places, uma-work on the day clock, End the day's nine steps, the nudge
// and the morning summary.
export * from './farm/places'
export * from './work/loop-env'
export * from './save/loop-work'
export * from './save/work-readings'
export * from './night/summary'
export * from './night/nudge'
export * from './night/end-day'

// Goods (F19, core spec CS9, CS10, CS26): the price rule, stars, the bin and the shop.
export * from './goods/rule'
export * from './goods/prices'
export * from './goods/stars'
export * from './save/bin'
export * from './save/shop'

// The Fields (F20, core spec CS11, CS12): the crops, the blocks, planting, tending, harvesting, crop levels, growth and
// withering at night, and the shop's seeds.
export * from './fields/crops'
export * from './fields/fields'

// Talents and ranks (F21, core spec CS26–CS33, CS46): talents from master data's stats, rank points, the challenges, what
// a rank gives, the favourite line, temperament, and the night's step 6.
export * from './farm/talents'
export * from './farm/rank-rules'

// The forest, the Fishery and three stations (F22, core spec CS15–CS18): the areas, the spots and the stations' jobs by
// id (with the save's parse), their tables, the work kinds with master data's talents, building a station, the catch's
// sizes and the night's hauls.
export * from './gathering/ids'
export * from './gathering/tables'
export * from './gathering/kinds'
export * from './gathering/stations'

// The roster (F23, core spec CS2, CS34–CS36, CS45): the start's six and three picks, the Dorm's levels, beds and swaps,
// visitors at the Gate, chats and gifts, and chapter recruits.
export * from './farm/dorm'
export * from './farm/visitors'
export * from './farm/start'

// Farm Rank and chapter 1 (F24, core spec CS38, CS39, CS41, CS42): the Diary's milestones and rows, the Farm Rank's
// points and what each rank opens, the town's cast, chapter 1's goals and reward, the night's step 8, and the two scenes
// with the roles Umas fill at runtime.
export * from './farm/milestones'
export * from './farm/diary'
export * from './story/cast'
export * from './story/chapters'
export * from './story/scenes'
export * from './story/chapter-1'

// The romance core (F46; romance spec RM1–RM10, RM58, RM59), built dark behind the web's `VITE_FARM_ROMANCE` while
// production plays M4 on v3: save v4 (the wipe, the new keys, the romance's slots) and its strict parse, the farmer's
// name, the story pack at runtime with the invented stand-in, the one `outfitOf` resolver, her favourite line and tastes,
// authored arrivals at night step 8, her arrival scene's pay, and the re-cut opening. The story's format and validator
// (F40) export by name: their `SEASONS` and `FESTIVALS` are the story's words, not the calendar's.
export * from './save/v4'
export * from './save/parse-v4'
export * from './romance/farmer'
export * from './romance/love'
export * from './romance/arrivals'
// The ladders and points (F47; RM11–RM18, RM23, RM24): costs, bars and `advance`; chats, gifts by her tastes, praise, her
// line and festivals together; birthdays, anniversaries and an item of her line; when her next event is Ready; bond
// hearts for Ready's bond setup.
export * from './romance/acts'
export * from './romance/praise'
export * from './romance/days'
export * from './romance/ready'
export * from './farm/bonds'
// The perks' words (F48; RM31, RM32, RM36): each level's perk id and its words by her line, for her profile; F51 makes them act.
export * from './romance/perks'
// The perks' effects (F51; RM31–RM36): the romance term and its caps, in her element, her keepsake, night chores, morning
// items, the mentor, her signature dish and breakfast, read from her level.
export * from './romance/perk-terms'
export * from './romance/perk-effects'
// Heart events (F49; RM24–RM30, RM54–RM56): the five plays (Cast, Pick, Rhythm, Walk, Choose) at both lengths with their
// grades and RM26's map, `playEvent` with its choices, rewards and the level-up card's facts, the confession's Not yet and
// Ask her, and Memories' replays.
export * from './romance/plays/grade'
export * from './romance/plays/cast'
export * from './romance/plays/rhythm'
export * from './romance/plays/pick'
export * from './romance/plays/walk'
export * from './romance/plays/choose'
export * from './romance/plays/which'
export * from './romance/events'
// The evening (F50; RM19–RM22, RM37): the kinds by ladder and game, her favourite kind, the slots and festival night, the
// evening's points and its card, the morning's invitations and their answers, and when Tonight opens.
export * from './romance/evening'
// The ring bench, the proposal and the wedding (F53; RM30, RM38–RM40): the rings' bench at the Forge, her ring's grade and
// a better ring, the proposal's ring, the wedding's place, reception and guests, and Ida Stone's scene.
export * from './romance/bench'
export * from './romance/wedding'
// Married life (F54; RM41–RM47): the homestead's houses, rooms and moves, Sleep at, the night's house and its morning,
// shared houses' bonds, S2 and S4 at night, the household milestones, scenes, the finale and the Festival of Vows.
export * from './romance/homestead'
export * from './romance/household'
export * from './story/bench'
export * from './story/pack'
export * from './story/stand-in'
export * from './story/opening-v4'
export {
  ANSWERS, answerAt, ARRIVAL, arrivalIssues, BIG_EVENTS, bibleIssues, CALLINGS, castIssues, CHAT_SETS, DATE_GAMES, EMOTES, EVENT_LIMITS, eventIssues, FARMING_PLAYS, gendersFarmer,
  HOUSE_LINE_MAX, HOUSE_LINES, HOUSEHOLD_SCENES, householdIssues, LADDERS, pairIssues, routeIssues, RUNGS, stepIssues, STORY_PLACES, tiesIssues, TONES, unscriptedBeats, WISHES,
} from './story/authored'
export type {
  Answer, Arrival, Beat as RouteBeat, Calling, Cast, CastBirthday, CastEntry, ChatSets, ChoiceOption, DateGame, Emote, Finale, Household, HouseholdAt, HouseholdCheck, HouseholdScene,
  Ladder, OptionGives, PairCheck, PairConversations, Play, Route, RouteCheck, Step, StoryContext, StoryPlace, Tie, Ties, Together, Tone, Trigger, UmaBible, Unlock, WeddingPlan, Wish,
} from './story/authored'

