// uma-farm's rules: pure, no I/O. Save v5 (the one save) and its parse, the farm's units, goods, places, the day's
// actions, the night and goals, and the romance with its story pack.
export const GAME = 'uma-farm' as const

// The material lines and items' names.
export * from './items/lines'

// The save: its envelope, its parse and the conflict rule; the save's rule errors; the push schedule's notices.
export * from './save/save'
export * from './save/rules'
export * from './save/notify'

// The loop: the units, the goods' ids, the Warehouse by stars and gold.
export * from './farm/calendar'
export * from './farm/draw'
export * from './farm/round'
export * from './farm/ranks'
export * from './farm/farm'
export * from './goods/ids'
export * from './save/warehouse'
export * from './save/gold'

// The day: the farm map's places, the day's actions and what each costs, End the day's nine steps, the nudge and the
// morning summary.
export * from './farm/places'
export * from './farm/actions'
export * from './night/summary'
export * from './night/nudge'
export * from './night/end-day'

// Goods: the price rule, stars, the bin and the shop.
export * from './goods/rule'
export * from './goods/prices'
export * from './goods/stars'
export * from './save/bin'
export * from './save/shop'

// The field: the crops, the tiles (clearing, tilling, planting, watering, harvesting), crop levels, growth and withering
// at night, and the shop's seeds.
export * from './fields/crops'
export * from './fields/fields'

// Talents and ranks: talents from master data's stats, rank points, the challenges, what
// a rank gives, the favourite line, temperament, and the night's step 6.
export * from './farm/talents'
export * from './farm/rank-rules'

// The forest, the Fishery and three stations: the areas, the spots and the stations' jobs by id, their tables, an Uma's
// terms there, the farmer's hauls (forage, chop, fish) and the catch's sizes, and the stations' loads.
export * from './gathering/ids'
export * from './gathering/tables'
export * from './gathering/kinds'
export * from './gathering/hauls'
export * from './gathering/stations'

// The roster: the Dorm's levels, beds and swaps.
export * from './farm/dorm'

// The farm's progress: the Diary's milestones and rows, the Farm Rank's points and what each rank opens, the night's
// goals check; building (each place's cost, paying, standing the next morning), the milestones with the Umas and the
// farm's projects; the town's roles, and which scene plays now (the opening's lines are the pack's, `openingOf`).
export * from './farm/milestones'
export * from './farm/diary'
export * from './farm/builds'
export * from './story/cast'
export * from './story/scenes'
// The town: who lives there, the day's draw at its six spots, a talk once a day, and her line.
export * from './town/town'
// Town notes: the world's short pieces, unlocked once by their trigger at a talk, a visit or the night, and kept.
export * from './town/notes'

// The romance: save v5 (the new farm over an older save, the keys, the romance's slots) and its strict parse, the
// farmer's name, the story pack at runtime with the invented stand-in, the one `outfitOf` resolver, her favourite line
// and tastes, the chats' fallback lines, meeting her (her trigger, the welcome list at the Gate, the night's meetings,
// the invite to the farm), her meeting scene's pay. The
// story's format and validator export by name: their `SEASONS` and `FESTIVALS` are the story's words, not the
// calendar's.
export * from './save/v4'
export * from './save/parse-v4'
export * from './romance/farmer'
export * from './romance/chats'
export * from './romance/love'
export * from './romance/meeting'
// The ladders and points: costs, bars and `advance`; chats, gifts by her tastes, praise, her
// line and festivals together; birthdays, anniversaries and an item of her line; when her next event is Ready; bond
// hearts for Ready's bond setup.
export * from './romance/acts'
export * from './romance/praise'
export * from './romance/days'
export * from './romance/ready'
// Her chapters: the pack's or the four defaults along her route, the one she's in, a chapter's gate, and the morning one
// opens; read live, never stored.
export * from './romance/chapters'
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
// a better ring, the proposal's ring, the wedding's place, reception and guests, and the smith's scene.
export * from './romance/bench'
export * from './romance/wedding'
// Married life: the homestead's houses, rooms and moves, Sleep at, the night's house and its morning,
// shared houses' bonds, S2 and S4 at night, the household milestones, scenes, the finale and the Festival of Vows.
export * from './romance/homestead'
export * from './romance/household'
export * from './story/bench'
export * from './story/pack'
// The placeholders: what plays wherever the pack is silent, and the one lookup that reads "the pack's, or the
// placeholder" (her outfit, line, tastes, chats, events, chapters, keepsake, pairs, household and the rest).
export * from './story/placeholders'
// The story pack's release: `story.json` and its hash-named files, and the pack a release holds, its routes
// and pairs read on demand.
export * from './story/release'
export * from './story/stand-in'
// Her look in a scene (the dialogue engine's rules): outfits by context, the story's outfit ids and the art's names, the
// 22 expressions and their fallbacks, a portrait kit's pick for a line, and the portraits' manifest.
export * from './story/look'
// The story's one reader: errors only for what the game can't read, each skipping its part; notes for the rest. The
// menu's defaults (the welcome list, her trigger to meet, her chapters) are `placeholders.ts`'s.
export {
  ANSWERS, answerAt, ARRIVAL, BIG_EVENTS, bibleTagNotes, CALLINGS, CHARACTER_ID, CHAT_SETS, DATE_GAMES, EMOTES, EVENT_LIMITS,
  eventNotes, FARMING_PLAYS, GATE_KINDS, gendersFarmer, HOUSE_LINE_MAX, HOUSEHOLD_SCENES, LADDERS, LINE_LIMITS, checkBible, checkCast, checkHousehold, checkOpening, checkPair, checkRoute, checkTies,
  checkTown, checkWorld, isSister, NOTE_KINDS, OPENING_STEPS, RUNGS, SISTER_ID, sisterOutfit, SPOT_IDS, STORY_ID, WORLD_ID,
  stepFindings, STORY_PLACES, tagNotes, TONES, TRIGGER_KINDS, unscriptedBeats, WISHES,
} from './story/authored'
export type {
  Answer, Beat as RouteBeat, Calling, Cast, CastBirthday, CastEntry, ChatSets, ChoiceOption, DateGame, Emote, Finale, Findings, Gifts, HerChapter, Household, HouseholdAt,
  HouseholdScene, Keepsake, Ladder, Opening, OptionGives, PairConversations, Play, Read, Route, SpotId, Step, StoryContext, StoryPlace, StoryTrigger, Tie, TieKind, Ties, Together, Tone, Town,
  TownNote, TownPerson, TownSpot, Trigger, UmaBible,
  Unlock, WeddingPlan, Wish, World, WorldFestival, WorldNames, WorldPlace,
} from './story/authored'

