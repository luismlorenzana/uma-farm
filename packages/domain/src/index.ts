// uma-farm's rules: pure, no I/O. Save v1, the Wilds' rules (copied from uma-rpg at 30a322a) and save v2, the loop's
// units, goods and save v3 with its migration.
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

// Who works (R3).
export * from './roster/template'
export * from './roster/roster'

// The work engine's env.
export * from './work/world'
export * from './work/request'
export * from './work/env'
export * from './work/env-v3'
export * from './work/env-v4'

// The save (R5) and its work (R7), and what finished, for push.
export * from './save/save'
export * from './save/rules'
export * from './save/work'
export * from './save/notify'

// The loop: the units, the goods' ids, save v3, its Warehouse by stars and
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

// The day: the farm map's places, uma-work on the day clock, End the day's nine steps, the nudge
// and the morning summary.
export * from './farm/places'
// The farm on the HD-2D stage: the save as uma-stage's farm design, the plots, the recipes and the crops' families.
export * from './farm/stage'
export * from './work/loop-env'
export * from './save/loop-work'
export * from './save/work-readings'
export * from './night/summary'
export * from './night/nudge'
export * from './night/end-day'

// Goods: the price rule, stars, the bin and the shop.
export * from './goods/rule'
export * from './goods/prices'
export * from './goods/stars'
export * from './save/bin'
export * from './save/shop'

// The Fields: the crops, the blocks, planting, tending, harvesting, crop levels, growth and
// withering at night, and the shop's seeds.
export * from './fields/crops'
export * from './fields/fields'

// Talents and ranks: talents from master data's stats, rank points, the challenges, what
// a rank gives, the favourite line, temperament, and the night's step 6.
export * from './farm/talents'
export * from './farm/rank-rules'

// The forest, the Fishery and three stations: the areas, the spots and the stations' jobs by
// id (with the save's parse), their tables, the work kinds with master data's talents, building a station, the catch's
// sizes and the night's hauls.
export * from './gathering/ids'
export * from './gathering/tables'
export * from './gathering/kinds'
export * from './gathering/stations'

// The roster: the start's six and three picks, the Dorm's levels, beds and swaps,
// visitors at the Gate, chats and gifts, and chapter recruits.
export * from './farm/dorm'
export * from './farm/visitors'
export * from './farm/start'

// Farm Rank and chapter 1: the Diary's milestones and rows, the Farm Rank's
// points and what each rank opens, the town's cast, chapter 1's goals and reward, the night's step 8, and the two scenes
// with the roles Umas fill at runtime.
export * from './farm/milestones'
export * from './farm/diary'
export * from './story/cast'
export * from './story/chapters'
export * from './story/scenes'
export * from './story/chapter-1'

// The romance core, built dark behind the web's `VITE_FARM_ROMANCE` while
// production plays v3: save v4 (the wipe, the new keys, the romance's slots) and its strict parse, the farmer's
// name, the story pack at runtime with the invented stand-in, the one `outfitOf` resolver, her favourite line and tastes,
// authored arrivals at night step 8, her arrival scene's pay, and the re-cut opening. The story's format and validator
// export by name: their `SEASONS` and `FESTIVALS` are the story's words, not the calendar's.
export * from './save/v4'
export * from './save/parse-v4'
export * from './romance/farmer'
export * from './romance/love'
export * from './romance/arrivals'
// The ladders and points: costs, bars and `advance`; chats, gifts by her tastes, praise, her
// line and festivals together; birthdays, anniversaries and an item of her line; when her next event is Ready; bond
// hearts for Ready's bond setup.
export * from './romance/acts'
export * from './romance/praise'
export * from './romance/days'
export * from './romance/ready'
export * from './farm/bonds'
// The perks' words: each level's perk id and its words by her line, for her profile, and the effects that make them
// act.
export * from './romance/perks'
// The perks' effects: the romance term and its caps, in her element, her keepsake, night chores, morning
// items, the mentor, her signature dish and breakfast, read from her level.
export * from './romance/perk-terms'
export * from './romance/perk-effects'
// Heart events: the five plays (Cast, Pick, Rhythm, Walk, Choose) at both lengths with their
// grades and the plays' map, `playEvent` with its choices, rewards and the level-up card's facts, the confession's Not
// yet and Ask her, and Memories' replays.
export * from './romance/plays/grade'
export * from './romance/plays/cast'
export * from './romance/plays/rhythm'
export * from './romance/plays/pick'
export * from './romance/plays/walk'
export * from './romance/plays/choose'
export * from './romance/plays/which'
export * from './romance/events'
// The evening: the kinds by ladder and game, her favourite kind, the slots and festival night, the
// evening's points and its card, the morning's invitations and their answers, and when Tonight opens.
export * from './romance/evening'
// The ring bench, the proposal and the wedding: the rings' bench at the Forge, her ring's grade and
// a better ring, the proposal's ring, the wedding's place, reception and guests, and Ida Stone's scene.
export * from './romance/bench'
export * from './romance/wedding'
// Married life: the homestead's houses, rooms and moves, Sleep at, the night's house and its morning,
// shared houses' bonds, S2 and S4 at night, the household milestones, scenes, the finale and the Festival of Vows.
export * from './romance/homestead'
export * from './romance/household'
export * from './story/bench'
export * from './story/pack'
// The story pack's release: `story.json` and its hash-named files, and the pack a release holds, its routes
// and pairs read on demand.
export * from './story/release'
export * from './story/stand-in'
export * from './story/opening-v4'
// The story's one reader: errors only for what the game can't read, each skipping its part; notes for the rest. The
// menu's defaults (the welcome list, her trigger to meet, her chapters) are read by `pack.ts`.
export {
  ANSWERS, answerAt, ARRIVAL, BIG_EVENTS, bibleTagNotes, CALLINGS, CHARACTER_ID, CHAT_SETS, DATE_GAMES, DEFAULT_CHAPTERS, DEFAULT_MEET, DEFAULT_WELCOME, EMOTES, EVENT_LIMITS,
  eventNotes, FARMING_PLAYS, gendersFarmer, HOUSE_LINE_MAX, HOUSEHOLD_SCENES, LADDERS, LINE_LIMITS, checkBible, checkCast, checkHousehold, checkPair, checkRoute, checkTies, RUNGS,
  stepFindings, STORY_PLACES, tagNotes, tieKind, tieStrength, TONES, TRIGGER_KINDS, unscriptedBeats, WISHES,
} from './story/authored'
export type {
  Answer, Arrival, Beat as RouteBeat, Calling, Cast, CastBirthday, CastEntry, ChatSets, ChoiceOption, DateGame, Emote, Finale, Findings, Gifts, HerChapter, Household, HouseholdAt,
  HouseholdScene, Keepsake, Ladder, OptionGives, PairConversations, Play, Read, Route, Step, StoryContext, StoryPlace, StoryTrigger, Tie, TieKind, Ties, Together, Tone, Trigger, UmaBible,
  Unlock, WeddingPlan, Wish,
} from './story/authored'

