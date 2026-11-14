// Town notes: short pieces of the world that unlock as you play (`world.json`'s `notes`). Each unlocks once and stays;
// the save keeps only the ids unlocked, in the order they unlocked (`diary.notes`), and its words are the pack's. A
// note's unlock is a trigger from the menu (`NOTE_KINDS`), checked with meeting her checks (`romance/meeting.ts`):
//
//   a talk in town    a spot (a talk there), a season, a festival, and what the farm holds
//   a visit           Say hello at the Gate, and a gift in town: a season, a festival, and what the farm holds
//   the night         step 8, after meeting her, on the morning's date: a season, a festival, and what the farm holds;
//                     the morning names what it unlocked
//
// A season holds all season long, and a festival on its day (the story's, `festivalsOf`). A note with no unlock is known
// from the start, so the save never holds it. Pure.
import { dateOf, festivalOn, type Festival } from '../farm/calendar'
import { triggerHolds, type MeetHow } from '../romance/meeting'
import type { SaveV4 } from '../save/v4'
import type { StoryTrigger, TownNote } from '../story/authored'
import type { StoryPack } from '../story/pack'
import { festivalsOf, townNotesOf } from '../story/placeholders'

/** Whether a note's unlock holds now, as `how` sees it: a spot on a talk there; a season or a festival on its days; what
 * the farm holds as the night reads it. Talks and a gift are meeting her own: never a note's. */
export function noteHolds(save: SaveV4, unlock: StoryTrigger, how: MeetHow, year: readonly Festival[]): boolean {
  switch (unlock.kind) {
    case 'spot': return how.at === 'town' && how.spot === unlock.spot
    case 'season': return dateOf(save.calendar.day).season === unlock.season
    case 'festival': return festivalOn(save.calendar.day, year)?.id === unlock.festival
    case 'talks': case 'gift': return false
    default: return triggerHolds(save, unlock, 0, { at: 'night' })
  }
}

/** Whether you know a note: one with no unlock from the start, any other once it's unlocked. */
export const noteKnown = (save: Pick<SaveV4, 'diary'>, note: TownNote): boolean => !note.unlock || save.diary.notes.includes(note.id)

/** The notes you know, in world.json's order: the Diary's Town notes. */
export const knownNotes = (save: Pick<SaveV4, 'diary'>, pack: Partial<Pick<StoryPack, 'world'>> | null): TownNote[] =>
  townNotesOf(pack).filter((n) => noteKnown(save, n))

/** Every note whose unlock holds now, unlocked, in world.json's order: each id appended to `diary.notes`, once. The save
 * stays the same object when none unlocks. Never stamps: the app's action does. */
export function unlockNotes(save: SaveV4, pack: Partial<Pick<StoryPack, 'world'>> | null, how: MeetHow): { save: SaveV4; unlocked: string[] } {
  const year = festivalsOf(pack)
  const unlocked = townNotesOf(pack).filter((n) => n.unlock && !save.diary.notes.includes(n.id) && noteHolds(save, n.unlock, how, year)).map((n) => n.id)
  if (unlocked.length === 0) return { save, unlocked }
  return { save: { ...save, diary: { ...save.diary, notes: [...save.diary.notes, ...unlocked] } }, unlocked }
}
